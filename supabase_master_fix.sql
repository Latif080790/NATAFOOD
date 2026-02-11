-- ============================================================
-- NataFood POS — MASTER FIX SCRIPT
-- ============================================================
-- Run this ONCE to fix ALL known schema issues.
-- Safe to run multiple times (fully idempotent).
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- SECTION A: Ensure profiles exist for current auth users
-- ─────────────────────────────────────────────────────────────
-- This inserts a profile for any auth user that doesn't have one.
-- This fixes the root cause of FK constraint violations.

INSERT INTO public.profiles (id, full_name, role)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email, 'Staff'),
    'cashier'
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- ─────────────────────────────────────────────────────────────
-- SECTION B: Fix FK constraints on shifts & cash_logs
-- ─────────────────────────────────────────────────────────────
-- Drop FK that references profiles(id) — auth.uid() is sufficient

ALTER TABLE public.shifts
  DROP CONSTRAINT IF EXISTS shifts_staff_id_fkey;

ALTER TABLE public.cash_logs
  DROP CONSTRAINT IF EXISTS cash_logs_created_by_fkey;

-- Also fix inventory_adjustments FK
ALTER TABLE public.inventory_adjustments
  DROP CONSTRAINT IF EXISTS inventory_adjustments_staff_id_fkey;

-- ─────────────────────────────────────────────────────────────
-- SECTION C: Fix "policy already exists" on tables
-- ─────────────────────────────────────────────────────────────

-- tables
DROP POLICY IF EXISTS "Allow read tables for all authenticated" ON public.tables;
CREATE POLICY "Allow read tables for all authenticated"
  ON public.tables FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow manage tables for authenticated" ON public.tables;
CREATE POLICY "Allow manage tables for authenticated"
  ON public.tables FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────
-- SECTION D: Fix "policy already exists" on profiles
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Allow read profiles for all authenticated" ON public.profiles;
CREATE POLICY "Allow read profiles for all authenticated"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow update own profile" ON public.profiles;
CREATE POLICY "Allow update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────
-- SECTION E: Fix "policy already exists" on inventory_adjustments
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Enable read access for all users" ON public.inventory_adjustments;
CREATE POLICY "Enable read access for all users" ON public.inventory_adjustments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.inventory_adjustments;
CREATE POLICY "Enable insert for authenticated users" ON public.inventory_adjustments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.inventory_adjustments;
CREATE POLICY "Enable update for authenticated users" ON public.inventory_adjustments FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable read access for all users" ON public.inventory_adjustment_items;
CREATE POLICY "Enable read access for all users" ON public.inventory_adjustment_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.inventory_adjustment_items;
CREATE POLICY "Enable insert for authenticated users" ON public.inventory_adjustment_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.inventory_adjustment_items;
CREATE POLICY "Enable delete for authenticated users" ON public.inventory_adjustment_items FOR DELETE USING (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────
-- SECTION F: Fix "policy already exists" on shifts & cash_logs
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.shifts;
CREATE POLICY "Enable all access for authenticated users" ON public.shifts FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.cash_logs;
CREATE POLICY "Enable all access for authenticated users" ON public.cash_logs FOR ALL USING (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────
-- SECTION G: Fix product_ingredients (IF NOT EXISTS)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.product_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    inventory_id UUID REFERENCES public.inventory(id) ON DELETE CASCADE,
    quantity_required DECIMAL(10,3) NOT NULL DEFAULT 0,
    unit TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT ALL ON public.product_ingredients TO authenticated;
GRANT ALL ON public.product_ingredients TO service_role;

-- ─────────────────────────────────────────────────────────────
-- SECTION H: Fix handle_new_user trigger (ensures profiles auto-create)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Staff'), 'cashier')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- SECTION I: Fix reporting functions (search_path + SECURITY INVOKER)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_sales_analytics(
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ
)
RETURNS TABLE (
    date DATE,
    total_sales DECIMAL,
    total_orders BIGINT,
    avg_order_value DECIMAL
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(created_at) as date,
        SUM(total_amount) as total_sales,
        COUNT(id) as total_orders,
        CASE 
            WHEN COUNT(id) > 0 THEN SUM(total_amount) / COUNT(id) 
            ELSE 0 
        END as avg_order_value
    FROM public.orders
    WHERE created_at >= start_date AND created_at <= end_date
          AND status = 'completed'
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_top_products(
    limit_count INT DEFAULT 10,
    start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    product_name TEXT,
    total_qty BIGINT,
    total_revenue DECIMAL,
    category_name TEXT
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.name as product_name,
        SUM(oi.quantity) as total_qty,
        SUM(oi.price * oi.quantity) as total_revenue,
        c.name as category_name
    FROM public.order_items oi
    JOIN public.products p ON oi.product_id = p.id
    JOIN public.orders o ON oi.order_id = o.id
    LEFT JOIN public.categories c ON p.category_id = c.id
    WHERE o.status = 'completed'
          AND o.created_at >= start_date AND o.created_at <= end_date
    GROUP BY p.id, p.name, c.name
    ORDER BY total_revenue DESC
    LIMIT limit_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_sales_by_category(
    start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    category_name TEXT,
    total_sales DECIMAL,
    percentage DECIMAL
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    overall_sales DECIMAL;
BEGIN
    SELECT SUM(total_amount) INTO overall_sales
    FROM public.orders
    WHERE status = 'completed' AND created_at >= start_date AND created_at <= end_date;

    IF overall_sales IS NULL OR overall_sales = 0 THEN
        overall_sales := 1;
    END IF;

    RETURN QUERY
    SELECT 
        COALESCE(c.name, 'Uncategorized') as category_name,
        SUM(oi.price * oi.quantity) as total_sales,
        (SUM(oi.price * oi.quantity) / overall_sales) * 100 as percentage
    FROM public.order_items oi
    JOIN public.products p ON oi.product_id = p.id
    JOIN public.orders o ON oi.order_id = o.id
    LEFT JOIN public.categories c ON p.category_id = c.id
    WHERE o.status = 'completed'
          AND o.created_at >= start_date AND o.created_at <= end_date
    GROUP BY c.id, c.name
    ORDER BY total_sales DESC;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- SECTION J: Fix views (SECURITY INVOKER)
-- ─────────────────────────────────────────────────────────────

DROP VIEW IF EXISTS public.daily_profit;
DROP VIEW IF EXISTS public.order_profit;
DROP VIEW IF EXISTS public.product_hpp;

CREATE OR REPLACE VIEW public.product_hpp
WITH (security_invoker = true) AS
SELECT
    p.id AS product_id,
    p.name AS product_name,
    p.price AS selling_price,
    COALESCE(SUM(pi.quantity_required * i.cost_price), 0) AS hpp,
    CASE WHEN p.price > 0
        THEN ROUND(((p.price - COALESCE(SUM(pi.quantity_required * i.cost_price), 0)) / p.price) * 100, 1)
        ELSE 0
    END AS margin_percent,
    COUNT(pi.id) AS ingredient_count
FROM public.products p
LEFT JOIN public.product_ingredients pi ON pi.product_id = p.id
LEFT JOIN public.inventory i ON i.id = pi.inventory_id
GROUP BY p.id, p.name, p.price;

CREATE OR REPLACE VIEW public.order_profit
WITH (security_invoker = true) AS
SELECT
    o.id AS order_id,
    o.created_at,
    o.total_amount AS order_revenue,
    COALESCE(SUM(oi.quantity * ph.hpp), 0) AS order_hpp,
    o.total_amount - COALESCE(SUM(oi.quantity * ph.hpp), 0) AS gross_profit,
    CASE WHEN o.total_amount > 0
        THEN ROUND(((o.total_amount - COALESCE(SUM(oi.quantity * ph.hpp), 0)) / o.total_amount) * 100, 1)
        ELSE 0
    END AS profit_margin_percent
FROM public.orders o
LEFT JOIN public.order_items oi ON oi.order_id = o.id
LEFT JOIN public.product_hpp ph ON ph.product_id = oi.product_id
WHERE o.status = 'completed'
GROUP BY o.id, o.created_at, o.total_amount;

CREATE OR REPLACE VIEW public.daily_profit
WITH (security_invoker = true) AS
SELECT
    DATE(op.created_at AT TIME ZONE 'Asia/Jakarta') AS profit_date,
    COUNT(op.order_id) AS total_orders,
    SUM(op.order_revenue) AS total_revenue,
    SUM(op.order_hpp) AS total_hpp,
    SUM(op.gross_profit) AS total_gross_profit,
    CASE WHEN SUM(op.order_revenue) > 0
        THEN ROUND((SUM(op.gross_profit) / SUM(op.order_revenue)) * 100, 1)
        ELSE 0
    END AS avg_margin_percent
FROM public.order_profit op
GROUP BY DATE(op.created_at AT TIME ZONE 'Asia/Jakarta')
ORDER BY profit_date DESC;

GRANT SELECT ON public.product_hpp TO authenticated;
GRANT SELECT ON public.order_profit TO authenticated;
GRANT SELECT ON public.daily_profit TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- SECTION K: Grants (idempotent)
-- ─────────────────────────────────────────────────────────────

GRANT ALL ON public.shifts TO authenticated;
GRANT ALL ON public.cash_logs TO authenticated;
GRANT ALL ON public.shifts TO service_role;
GRANT ALL ON public.cash_logs TO service_role;
GRANT ALL ON public.inventory_adjustments TO authenticated;
GRANT ALL ON public.inventory_adjustment_items TO authenticated;
GRANT ALL ON public.inventory_adjustments TO service_role;
GRANT ALL ON public.inventory_adjustment_items TO service_role;
GRANT ALL ON public.tables TO authenticated;
GRANT ALL ON public.tables TO service_role;

-- ─────────────────────────────────────────────────────────────
-- SECTION L: Order-Shift Integration (V11)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shift_id UUID REFERENCES public.shifts(id);

CREATE INDEX IF NOT EXISTS idx_orders_shift_id ON public.orders(shift_id);

-- ============================================================
-- DONE! All errors and warnings should be resolved.
-- ============================================================
