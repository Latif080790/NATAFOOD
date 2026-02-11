-- =====================================================
-- NataFood POS — V5: Security Advisor Fixes
-- Fixes ALL 7 errors + 3 warnings from Supabase Security Advisor
-- Run this in Supabase SQL Editor
-- =====================================================

-- ─────────────────────────────────────────────────────
-- Phase 10: Add order_number column
-- ─────────────────────────────────────────────────────
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number TEXT;

-- ─────────────────────────────────────────────────────
-- FIX 1: Enable RLS on all 6 unprotected tables
-- ─────────────────────────────────────────────────────

-- 1a. categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read categories for all authenticated"
  ON public.categories FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "Allow manage categories for authenticated"
  ON public.categories FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 1b. products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read products for all authenticated"
  ON public.products FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "Allow manage products for authenticated"
  ON public.products FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 1c. inventory
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read inventory for all authenticated"
  ON public.inventory FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "Allow manage inventory for authenticated"
  ON public.inventory FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 1d. orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read orders for all authenticated"
  ON public.orders FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "Allow manage orders for authenticated"
  ON public.orders FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 1e. order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read order_items for all authenticated"
  ON public.order_items FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "Allow manage order_items for authenticated"
  ON public.order_items FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 1f. product_ingredients
ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read product_ingredients for all authenticated"
  ON public.product_ingredients FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "Allow manage product_ingredients for authenticated"
  ON public.product_ingredients FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


-- ─────────────────────────────────────────────────────
-- FIX 2: daily_sales_stats view — Security Definer
-- Recreate as SECURITY INVOKER (the safe default)
-- ─────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.daily_sales_stats;
CREATE VIEW public.daily_sales_stats
  WITH (security_invoker = true)
AS
SELECT
  count(*) AS total_orders,
  sum(total_amount) AS total_revenue,
  sum(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_orders,
  sum(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders
FROM orders
WHERE date(created_at AT TIME ZONE 'Asia/Jakarta') = date(now() AT TIME ZONE 'Asia/Jakarta');


-- ─────────────────────────────────────────────────────
-- FIX 3: Function search_path — Set explicitly
-- Prevents privilege-escalation via mutable search_path
-- ─────────────────────────────────────────────────────

-- 3a. handle_order_stock_deduction
CREATE OR REPLACE FUNCTION public.handle_order_stock_deduction()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    order_item RECORD;
    recipe_item RECORD;
BEGIN
    FOR order_item IN
        SELECT product_id, quantity
        FROM order_items
        WHERE order_id = NEW.id
    LOOP
        FOR recipe_item IN
            SELECT inventory_id, quantity_required
            FROM product_ingredients
            WHERE product_id = order_item.product_id
        LOOP
            UPDATE inventory
            SET "currentStock" = "currentStock" - (recipe_item.quantity_required * order_item.quantity)
            WHERE id = recipe_item.inventory_id;
        END LOOP;
    END LOOP;
    RETURN NEW;
END;
$$;

-- 3b. handle_order_cancellation_restock
CREATE OR REPLACE FUNCTION public.handle_order_cancellation_restock()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    order_item RECORD;
    recipe_item RECORD;
BEGIN
    FOR order_item IN
        SELECT product_id, quantity
        FROM order_items
        WHERE order_id = NEW.id
    LOOP
        FOR recipe_item IN
            SELECT inventory_id, quantity_required
            FROM product_ingredients
            WHERE product_id = order_item.product_id
        LOOP
            UPDATE inventory
            SET "currentStock" = "currentStock" + (recipe_item.quantity_required * order_item.quantity)
            WHERE id = recipe_item.inventory_id;
        END LOOP;
    END LOOP;
    RETURN NEW;
END;
$$;


-- ─────────────────────────────────────────────────────
-- FIX 4: Leaked Password Protection
-- Enable via Supabase Dashboard:
--   Authentication → Settings → Enable "Leaked Password Protection"
-- (Cannot be enabled via SQL)
-- ─────────────────────────────────────────────────────

-- ✅ Done! Run this script, then:
--   1. Click Refresh in Security Advisor
--   2. Enable "Leaked Password Protection" in Auth → Settings
