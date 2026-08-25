-- =====================================================
-- PRODUCTION HARDENING
-- 8-digit numeric, collision-free family codes
-- =====================================================

CREATE OR REPLACE FUNCTION gen_family_code()
RETURNS text
LANGUAGE sql SECURITY DEFINER SET search_path = public VOLATILE
AS $$
  SELECT n::text
  FROM (
    SELECT (10000000 + floor(random() * 90000000)::int) AS n
    FROM generate_series(1, 50)
  ) candidates
  WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE u.family_code = candidates.n::text
  )
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION ensure_family_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IN ('student') AND (NEW.family_code IS NULL OR NEW.family_code = '') THEN
    NEW.family_code := gen_family_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Regenerate every existing student code to the new 8-digit format.
UPDATE users
SET family_code = gen_family_code()
WHERE role = 'student';

-- Uniqueness guarantee at the database level.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_family_code ON users(family_code)
  WHERE family_code IS NOT NULL;
