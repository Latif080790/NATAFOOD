-- ============================================================
-- NataFood POS — V11: Order-Shift Integration
-- ============================================================
-- Links Orders to Shifts to enable per-shift reporting.
-- ============================================================

-- 1. Add shift_id column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shift_id UUID REFERENCES public.shifts(id);

-- 2. Index for performance
CREATE INDEX IF NOT EXISTS idx_orders_shift_id ON public.orders(shift_id);

-- 3. Update Policy (Ensure cashiers can still see orders)
-- Existing policies on orders should be fine, but let's double check RLS if needed.
-- For now, generic authenticated access is likely in place or needed.

-- 4. Create a function to get current open shift for a user (Optional helper)
-- But we will likely handle this in frontend store logic.
