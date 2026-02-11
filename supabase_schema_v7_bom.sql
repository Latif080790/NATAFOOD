-- ============================================================
-- NataFood POS — Schema V7: BOM Enhancement & HPP Integration
-- ============================================================
-- This migration adds cost tracking to inventory and creates
-- views for automatic HPP (Harga Pokok Penjualan) calculation
-- and profit analysis.
-- ============================================================

-- ─── 1. Add cost_price to inventory ─────────────────────────
-- Harga beli per unit bahan baku
ALTER TABLE public.inventory
  ADD COLUMN IF NOT EXISTS cost_price decimal(12,2) DEFAULT 0;

COMMENT ON COLUMN public.inventory.cost_price
  IS 'Purchase price per unit (Harga Beli). Used for HPP calculation.';

-- ─── 2. HPP View ────────────────────────────────────────────
-- Calculates cost of goods (HPP) per product based on BOM recipe.
-- Joins product_ingredients with inventory.cost_price.
CREATE OR REPLACE VIEW public.product_hpp AS
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

-- ─── 3. Order Profit View ───────────────────────────────────
-- Calculates profit per completed order by joining with HPP data.
CREATE OR REPLACE VIEW public.order_profit AS
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

-- ─── 4. Daily Profit Summary View ──────────────────────────
-- Aggregates profit data per day for the Finance dashboard.
CREATE OR REPLACE VIEW public.daily_profit AS
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

-- ─── 5. Grant Access ────────────────────────────────────────
-- Views inherit table-level RLS, but we grant explicit SELECT access.
GRANT SELECT ON public.product_hpp TO authenticated;
GRANT SELECT ON public.order_profit TO authenticated;
GRANT SELECT ON public.daily_profit TO authenticated;

-- ─── 6. Seed sample cost_price data ────────────────────────
-- Update existing inventory items with realistic cost prices.
-- (Only updates items where cost_price is still 0)
UPDATE public.inventory SET cost_price = 15000 WHERE name ILIKE '%beras%' AND cost_price = 0;
UPDATE public.inventory SET cost_price = 2500  WHERE name ILIKE '%telur%' AND cost_price = 0;
UPDATE public.inventory SET cost_price = 5000  WHERE name ILIKE '%teh%'   AND cost_price = 0;
UPDATE public.inventory SET cost_price = 12000 WHERE name ILIKE '%gula%'  AND cost_price = 0;
UPDATE public.inventory SET cost_price = 8000  WHERE name ILIKE '%susu%'  AND cost_price = 0;
UPDATE public.inventory SET cost_price = 10000 WHERE name ILIKE '%kopi%'  AND cost_price = 0;
UPDATE public.inventory SET cost_price = 3000  WHERE name ILIKE '%minyak%' AND cost_price = 0;
