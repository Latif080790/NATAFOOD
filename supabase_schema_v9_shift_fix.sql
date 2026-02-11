-- ─── 0. Reset Schema (for Shift Feature) ──────────────────────────

-- Since 'shifts' table might exist but with different schema, we drop it to ensure clean state.
DROP TABLE IF EXISTS public.cash_logs CASCADE;
DROP TABLE IF EXISTS public.shifts CASCADE;

-- ─── 1. Create Tables ─────────────────────────────────────────────

CREATE TABLE public.shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID, -- auth.uid(), no FK to profiles
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    start_cash DECIMAL DEFAULT 0,
    end_cash_system DECIMAL DEFAULT 0,
    end_cash_actual DECIMAL DEFAULT 0,
    difference DECIMAL GENERATED ALWAYS AS (end_cash_actual - end_cash_system) STORED,
    status TEXT DEFAULT 'open', -- 'open', 'closed'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.cash_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id UUID REFERENCES public.shifts(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'in', 'out'
    category TEXT, -- 'modal_awal', 'tambah_modal', 'beli_es', 'lainnya'
    amount DECIMAL NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID -- auth.uid(), no FK to profiles
);

-- ─── 2. RLS Policies ─────────────────────────────────────────────
-- Enable Row Level Security (RLS)
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.shifts;
CREATE POLICY "Enable all access for authenticated users" ON public.shifts FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.cash_logs;
CREATE POLICY "Enable all access for authenticated users" ON public.cash_logs FOR ALL USING (auth.role() = 'authenticated');

-- ─── 3. Grants ───────────────────────────────────────────────────

GRANT ALL ON public.shifts TO authenticated;
GRANT ALL ON public.cash_logs TO authenticated;
GRANT ALL ON public.shifts TO service_role;
GRANT ALL ON public.cash_logs TO service_role;

-- ─── 4. Indexes ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_shifts_staff ON public.shifts(staff_id);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON public.shifts(status);
CREATE INDEX IF NOT EXISTS idx_cash_logs_shift ON public.cash_logs(shift_id);
