-- ============================================================
-- NataFood POS — Shift & Schema Fix Script
-- ============================================================
-- Fix 1: Remove FK constraints on shifts.staff_id & cash_logs.created_by
--         that reference profiles(id), because auth.uid() may not exist
--         in profiles table.
-- Fix 2: Ensure product_ingredients uses IF NOT EXISTS.
-- ============================================================

-- ─── Fix 1: Drop FK constraints on shifts table ─────────────

-- Drop the foreign key constraint on shifts.staff_id
ALTER TABLE public.shifts
  DROP CONSTRAINT IF EXISTS shifts_staff_id_fkey;

-- Drop the foreign key constraint on cash_logs.created_by
ALTER TABLE public.cash_logs
  DROP CONSTRAINT IF EXISTS cash_logs_created_by_fkey;

-- Verify: staff_id column still exists, just without FK constraint
-- Now auth.uid() can be stored without needing a profiles entry

-- ─── Fix 2: product_ingredients IF NOT EXISTS ───────────────
-- This prevents the "relation already exists" error when re-running scripts

CREATE TABLE IF NOT EXISTS public.product_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    inventory_id UUID REFERENCES public.inventory(id) ON DELETE CASCADE,
    quantity_required DECIMAL(10,3) NOT NULL DEFAULT 0,
    unit TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant access (idempotent)
GRANT ALL ON public.product_ingredients TO authenticated;
GRANT ALL ON public.product_ingredients TO service_role;
