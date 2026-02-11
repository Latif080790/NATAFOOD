-- ============================================================
-- NataFood POS — Security Advisor Fix Script
-- ============================================================
-- Fixes 3 Errors:   SECURITY DEFINER views → SECURITY INVOKER
-- Fixes 3 Warnings: Function search_path not set → SET search_path
-- ============================================================

-- ─── FIX 1: Views with SECURITY INVOKER ─────────────────────
-- PostgreSQL 15+ supports security_invoker on views.
-- This ensures views respect RLS policies of the calling user.

-- 1a. product_hpp view
DROP VIEW IF EXISTS public.daily_profit;
DROP VIEW IF EXISTS public.order_profit;
DROP VIEW IF EXISTS public.product_hpp;

CREATE OR REPLACE VIEW public.product_hpp
WITH (security_invoker = true)
AS
SELECT
    p.id AS product_id,
    p.name AS product_name,
    p.price AS selling_price,
    COALESCE(SUM(pi.quantity_required * i.cost_price), 0) AS hpp,
    CASE
        WHEN p.price > 0
        THEN ROUND(((p.price - COALESCE(SUM(pi.quantity_required * i.cost_price), 0)) / p.price) * 100, 1)
        ELSE 0
    END AS margin_percent,
    COUNT(pi.id) AS ingredient_count
FROM public.products p
LEFT JOIN public.product_ingredients pi ON pi.product_id = p.id
LEFT JOIN public.inventory i ON i.id = pi.inventory_id
GROUP BY p.id, p.name, p.price;

-- 1b. order_profit view
CREATE OR REPLACE VIEW public.order_profit
WITH (security_invoker = true)
AS
SELECT
    o.id AS order_id,
    o.created_at,
    o.total_amount AS order_revenue,
    COALESCE(SUM(oi.quantity * ph.hpp), 0) AS order_hpp,
    o.total_amount - COALESCE(SUM(oi.quantity * ph.hpp), 0) AS gross_profit,
    CASE
        WHEN o.total_amount > 0
        THEN ROUND(((o.total_amount - COALESCE(SUM(oi.quantity * ph.hpp), 0)) / o.total_amount) * 100, 1)
        ELSE 0
    END AS profit_margin_percent
FROM public.orders o
LEFT JOIN public.order_items oi ON oi.order_id = o.id
LEFT JOIN public.product_hpp ph ON ph.product_id = oi.product_id
WHERE o.status = 'completed'
GROUP BY o.id, o.created_at, o.total_amount;

-- 1c. daily_profit view
CREATE OR REPLACE VIEW public.daily_profit
WITH (security_invoker = true)
AS
SELECT
    DATE(op.created_at AT TIME ZONE 'Asia/Jakarta') AS profit_date,
    COUNT(op.order_id) AS total_orders,
    SUM(op.order_revenue) AS total_revenue,
    SUM(op.order_hpp) AS total_hpp,
    SUM(op.gross_profit) AS total_gross_profit,
    CASE
        WHEN SUM(op.order_revenue) > 0
        THEN ROUND((SUM(op.gross_profit) / SUM(op.order_revenue)) * 100, 1)
        ELSE 0
    END AS avg_margin_percent
FROM public.order_profit op
GROUP BY DATE(op.created_at AT TIME ZONE 'Asia/Jakarta')
ORDER BY profit_date DESC;

-- Re-grant access
GRANT SELECT ON public.product_hpp TO authenticated;
GRANT SELECT ON public.order_profit TO authenticated;
GRANT SELECT ON public.daily_profit TO authenticated;

-- ─── FIX 2: Functions with search_path ──────────────────────
-- Add SET search_path = public to prevent search path injection.
-- Also change SECURITY DEFINER → SECURITY INVOKER for better RLS.

-- 2a. get_sales_analytics
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
    FROM 
        public.orders
    WHERE 
        created_at >= start_date 
        AND created_at <= end_date
        AND status = 'completed'
    GROUP BY 
        DATE(created_at)
    ORDER BY 
        DATE(created_at);
END;
$$;

-- 2b. get_top_products
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
    FROM 
        public.order_items oi
    JOIN 
        public.products p ON oi.product_id = p.id
    JOIN 
        public.orders o ON oi.order_id = o.id
    LEFT JOIN
        public.categories c ON p.category_id = c.id
    WHERE 
        o.status = 'completed'
        AND o.created_at >= start_date 
        AND o.created_at <= end_date
    GROUP BY 
        p.id, p.name, c.name
    ORDER BY 
        total_revenue DESC
    LIMIT 
        limit_count;
END;
$$;

-- 2c. get_sales_by_category
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
    FROM 
        public.order_items oi
    JOIN 
        public.products p ON oi.product_id = p.id
    JOIN 
        public.orders o ON oi.order_id = o.id
    LEFT JOIN
        public.categories c ON p.category_id = c.id
    WHERE 
        o.status = 'completed'
        AND o.created_at >= start_date 
        AND o.created_at <= end_date
    GROUP BY 
        c.id, c.name
    ORDER BY 
        total_sales DESC;
END;
$$;
