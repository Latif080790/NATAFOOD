-- =====================================================
-- NataFood POS — Phase 9: Finance & Shift Tables
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category TEXT NOT NULL CHECK (category IN ('bahan_baku', 'operasional', 'gaji', 'lainnya')),
    description TEXT,
    amount DECIMAL(12,2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all for authenticated users
CREATE POLICY "Authenticated users can manage expenses"
ON public.expenses
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;


-- 2. Shifts Table (Buka/Tutup Kasir)
CREATE TABLE IF NOT EXISTS public.shifts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    start_cash DECIMAL(12,2) NOT NULL,
    end_cash DECIMAL(12,2),
    expected_cash DECIMAL(12,2),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all for authenticated users
CREATE POLICY "Authenticated users can manage shifts"
ON public.shifts
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.shifts;
