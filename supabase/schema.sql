-- =============================================================
-- DR NAEEM Eye Laser & Retina Center Call Assistant
-- Database Schema for Supabase PostgreSQL
-- =============================================================

-- Enable UUID extension (usually enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- 1. PROFILES TABLE
-- Extends Supabase auth.users with app-specific data
-- =============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- 2. CATEGORIES TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- 3. QUESTIONS TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS public.questions (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster category lookups
CREATE INDEX IF NOT EXISTS idx_questions_category_id ON public.questions(category_id);

-- =============================================================
-- 4. AUTO-CREATE PROFILE ON USER SIGNUP
-- =============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.email, ''),
    'user',
    'active'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================
-- 5. UPDATED_AT TRIGGER
-- =============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------
-- PROFILES policies
-- -----------------------------------------------------------

-- Users can read their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- Admins can update any profile
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- Admins can insert profiles (for user creation)
CREATE POLICY "profiles_insert_admin"
  ON public.profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- Admins can delete profiles
CREATE POLICY "profiles_delete_admin"
  ON public.profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- -----------------------------------------------------------
-- CATEGORIES policies
-- -----------------------------------------------------------

-- Any authenticated user can read categories
CREATE POLICY "categories_select"
  ON public.categories FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can insert categories
CREATE POLICY "categories_insert"
  ON public.categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- Only admins can update categories
CREATE POLICY "categories_update"
  ON public.categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- Only admins can delete categories
CREATE POLICY "categories_delete"
  ON public.categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- -----------------------------------------------------------
-- QUESTIONS policies
-- -----------------------------------------------------------

-- Any authenticated user can read questions
CREATE POLICY "questions_select"
  ON public.questions FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can insert questions
CREATE POLICY "questions_insert"
  ON public.questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- Only admins can update questions
CREATE POLICY "questions_update"
  ON public.questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- Only admins can delete questions
CREATE POLICY "questions_delete"
  ON public.questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- =============================================================
-- 7. ENABLE REALTIME
-- Run these AFTER creating tables in Supabase Dashboard:
-- Go to Database → Replication → and enable for categories & questions
-- Or run these SQL commands:
-- =============================================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.questions;

-- =============================================================
-- 8. INITIAL ADMIN USER INSTRUCTIONS
-- =============================================================
-- After deploying, create your first admin user:
--
-- Step 1: Sign up through the app login page
-- Step 2: Go to Supabase Dashboard → SQL Editor
-- Step 3: Run:
--   UPDATE public.profiles
--   SET role = 'admin'
--   WHERE email = 'your-email@example.com';
-- =============================================================
