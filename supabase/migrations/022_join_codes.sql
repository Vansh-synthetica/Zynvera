-- =====================================================
-- INSTITUTION JOIN CODES
-- Principals share an 8-digit code; users join by code.
-- No more open institution browsing.
-- =====================================================

ALTER TABLE institutions ADD COLUMN IF NOT EXISTS join_code TEXT;

UPDATE institutions
SET join_code = upper(substring(md5(random()::text) from 1 for 8))
WHERE join_code IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_institutions_join_code
  ON institutions(join_code) WHERE join_code IS NOT NULL;

-- Auto-generate for new institutions.
CREATE OR REPLACE FUNCTION ensure_join_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.join_code IS NULL OR NEW.join_code = '' THEN
    NEW.join_code := upper(substring(md5(random()::text) from 1 for 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ensure_join_code ON institutions;
CREATE TRIGGER trg_ensure_join_code
  BEFORE INSERT ON institutions
  FOR EACH ROW EXECUTE FUNCTION ensure_join_code();

-- Members can see their own institution (name display).
DROP POLICY IF EXISTS "Members view own institution" ON institutions;
CREATE POLICY "Members view own institution" ON institutions
  FOR SELECT USING (id = get_user_institution());

-- Verify a join code (definer: code lookup bypasses RLS).
CREATE OR REPLACE FUNCTION verify_join_code(code text)
RETURNS uuid
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT id FROM institutions
  WHERE join_code = upper(trim(code)) AND status = 'active'
$$;

-- Regenerate (leadership only).
CREATE OR REPLACE FUNCTION regenerate_join_code()
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  inst uuid := get_user_institution();
  new_code text;
BEGIN
  IF get_user_role() NOT IN ('principal', 'admin', 'super_admin') THEN
    RAISE EXCEPTION 'Only leadership can regenerate the join code';
  END IF;
  LOOP
    new_code := upper(substring(md5(random()::text) from 1 for 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM institutions i2 WHERE i2.join_code = new_code AND i2.id <> inst);
  END LOOP;
  UPDATE institutions SET join_code = new_code WHERE id = inst;
  RETURN new_code;
END;
$$;
