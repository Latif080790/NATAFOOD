-- ─── 1. Create Tables ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES public.profiles(id),
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    start_cash DECIMAL DEFAULT 0,
    end_cash_system DECIMAL DEFAULT 0, -- Calculated from orders + cash_logs
    end_cash_actual DECIMAL DEFAULT 0, -- Input by cashier
    difference DECIMAL GENERATED ALWAYS AS (end_cash_actual - end_cash_system) STORED,
    status TEXT DEFAULT 'open', -- 'open', 'closed'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cash_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id UUID REFERENCES public.shifts(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'in' (deposit), 'out' (withdraw/expense)
    category TEXT, -- 'modal_awal', 'tambah_modal', 'beli_es', 'lainnya'
    amount DECIMAL NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id)
);

-- ─── 2. RLS Policies ─────────────────────────────────────────────

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" ON public.shifts FOR ALL USING (auth.role() = 'authenticated');
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
