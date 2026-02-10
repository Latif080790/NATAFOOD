-- ==========================================
-- Triggers for Automated Stock Deduction (FIXED)
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Create the Function
CREATE OR REPLACE FUNCTION handle_order_stock_deduction()
RETURNS TRIGGER AS $$
DECLARE
    order_item RECORD;
    recipe_item RECORD;
BEGIN
    -- Loop through all items in this order
    FOR order_item IN 
        SELECT product_id, quantity 
        FROM order_items 
        WHERE order_id = NEW.id
    LOOP
        -- For each product, look up its ingredients
        FOR recipe_item IN
            SELECT inventory_id, quantity_required
            FROM product_ingredients
            WHERE product_id = order_item.product_id
        LOOP
            -- Deduct stock
            UPDATE inventory
            SET "currentStock" = "currentStock" - (recipe_item.quantity_required * order_item.quantity)
            WHERE id = recipe_item.inventory_id;
        END LOOP;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the Triggers
-- We split into INSERT and UPDATE to avoid "TG_OP" errors in WHEN clause

DROP TRIGGER IF EXISTS on_order_completion ON orders;
DROP TRIGGER IF EXISTS on_order_completion_insert ON orders;
DROP TRIGGER IF EXISTS on_order_completion_update ON orders;

-- Trigger for INSERT (Directly completed orders)
CREATE TRIGGER on_order_completion_insert
AFTER INSERT ON orders
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION handle_order_stock_deduction();

-- Trigger for UPDATE (Status changes to completed)
CREATE TRIGGER on_order_completion_update
AFTER UPDATE ON orders
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed')
EXECUTE FUNCTION handle_order_stock_deduction();


-- 3. Trigger for Restocking on Cancellation
-- Only restock if the order was previously completed (meaning stock was deducted)

CREATE OR REPLACE FUNCTION handle_order_cancellation_restock()
RETURNS TRIGGER AS $$
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
            -- Add stock back
            UPDATE inventory
            SET "currentStock" = "currentStock" + (recipe_item.quantity_required * order_item.quantity)
            WHERE id = recipe_item.inventory_id;
        END LOOP;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_order_cancellation ON orders;

CREATE TRIGGER on_order_cancellation
AFTER UPDATE ON orders
FOR EACH ROW
WHEN (NEW.status = 'cancelled' AND OLD.status = 'completed')
EXECUTE FUNCTION handle_order_cancellation_restock();
