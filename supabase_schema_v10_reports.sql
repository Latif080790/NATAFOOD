-- ─── Analytics & Reporting Functions ──────────────────────────────

-- 1. Daily Sales Analytics
-- Returns daily revenue, order count, and average order value for a date range
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
SECURITY DEFINER
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
        AND status = 'completed' -- Only completed orders
    GROUP BY 
        DATE(created_at)
    ORDER BY 
        DATE(created_at);
END;
$$;

-- 2. Top Products Analytics
-- Returns top selling products by quantity or revenue
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
SECURITY DEFINER
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

-- 3. Sales By Category
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
SECURITY DEFINER
AS $$
DECLARE
    overall_sales DECIMAL;
BEGIN
    -- Calculate total sales for percentage
    SELECT SUM(total_amount) INTO overall_sales
    FROM public.orders
    WHERE status = 'completed' AND created_at >= start_date AND created_at <= end_date;

    IF overall_sales IS NULL OR overall_sales = 0 THEN
        overall_sales := 1; -- Avoid division by zero
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
