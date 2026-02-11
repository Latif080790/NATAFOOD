-- =====================================================
-- NataFood POS — V6: Audit & Missing Tables
-- Creates 'tables' and 'profiles' tables
-- Run this in Supabase SQL Editor
-- =====================================================

-- ─────────────────────────────────────────────────────
-- 1. Tables Management
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tables (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    number TEXT NOT NULL,
    capacity INTEGER DEFAULT 4,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved')),
    location TEXT DEFAULT 'main_hall',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow read tables for all authenticated"
  ON public.tables FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow manage tables for authenticated"
  ON public.tables FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;


-- ─────────────────────────────────────────────────────
-- 2. User Profiles (Linked to auth.users)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    role TEXT DEFAULT 'cashier' CHECK (role IN ('admin', 'cashier', 'kitchen', 'waiter')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow read profiles for all authenticated"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'cashier');
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists to avoid duplication
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- ─────────────────────────────────────────────────────
-- 3. Additional Indexes for Performance
-- ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tables_status ON public.tables(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
