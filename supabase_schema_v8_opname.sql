-- ─── 1. Create Tables ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.inventory_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_date TIMESTAMPTZ DEFAULT NOW(),
    staff_id UUID REFERENCES public.profiles(id),
    notes TEXT,
    status TEXT DEFAULT 'completed', -- 'draft', 'completed'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inventory_adjustment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adjustment_id UUID REFERENCES public.inventory_adjustments(id) ON DELETE CASCADE,
    inventory_id UUID REFERENCES public.inventory(id),
    system_qty DECIMAL NOT NULL,
    physical_qty DECIMAL NOT NULL,
    diff_qty DECIMAL GENERATED ALWAYS AS (physical_qty - system_qty) STORED,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. RLS Policies ─────────────────────────────────────────────

ALTER TABLE public.inventory_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_adjustment_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.inventory_adjustments FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.inventory_adjustments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.inventory_adjustments FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.inventory_adjustment_items FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.inventory_adjustment_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.inventory_adjustment_items FOR DELETE USING (auth.role() = 'authenticated');

-- ─── 3. Grants ───────────────────────────────────────────────────

GRANT ALL ON public.inventory_adjustments TO authenticated;
GRANT ALL ON public.inventory_adjustment_items TO authenticated;
GRANT ALL ON public.inventory_adjustments TO service_role;
GRANT ALL ON public.inventory_adjustment_items TO service_role;

-- ─── 4. Stock Logs Trigger (Optional but Recommended) ────────────
-- When an adjustment item is inserted, we should log it to inventory_logs 
-- and update inventory.stock.
-- However, we will handle this via Frontend Transaction logic for now 
-- to keep it simple and explicit (Update Inventory -> Log -> Create Adjustment Item).
-- Or better: Use RPC. But let's stick to client-side transaction for MVP unless requested.
