-- =====================================================
-- FIX: Ensure handle_new_user trigger works reliably
-- Recreate with explicit SECURITY DEFINER and safe defaults
-- =====================================================

-- 1. Recreate the trigger function with safe error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, verification_status, join_date, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    CASE COALESCE(NEW.raw_user_meta_data->>'role', 'student')
      WHEN 'teacher' THEN 'teacher'
      WHEN 'parent' THEN 'parent'
      WHEN 'principal' THEN 'principal'
      WHEN 'student' THEN 'student'
      ELSE 'student'
    END,
    'unverified',
    CURRENT_DATE,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 3. Add a permissive INSERT policy for authenticated users on users table
-- (belt-and-suspenders: the SECURITY DEFINER trigger should bypass RLS,
--  but some Supabase configs enforce RLS on SECURITY DEFINER functions)
DROP POLICY IF EXISTS "Service role can insert users" ON users;
CREATE POLICY "Service role can insert users" ON users
  FOR INSERT
  WITH CHECK (true);

-- 4. Ensure family_code trigger works (idempotent)
CREATE OR REPLACE FUNCTION ensure_family_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'student' AND (NEW.family_code IS NULL OR NEW.family_code = '') THEN
    NEW.family_code := upper(substring(md5(random()::text) from 1 for 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ensure_family_code ON users;
CREATE TRIGGER trg_ensure_family_code
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION ensure_family_code();
