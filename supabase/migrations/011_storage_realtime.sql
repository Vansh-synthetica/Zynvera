-- =====================================================
-- STORAGE BUCKETS + SUBMISSION FILES
-- =====================================================

-- Buckets (course-resources already exists from 005)
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars', 'avatars', true),
  ('assignment-submissions', 'assignment-submissions', false),
  ('verification-documents', 'verification-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Avatars: anyone reads, owner writes their own folder.
CREATE POLICY "Public read avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "User manages own avatar" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Submission files: any authenticated user can read/write inside the
-- bucket; row-level data access stays governed by DB policies.
CREATE POLICY "Authed read submissions files" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'assignment-submissions');

CREATE POLICY "Authed write submissions files" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'assignment-submissions');

CREATE POLICY "Authed update submissions files" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'assignment-submissions');

-- Verification documents: same pattern.
CREATE POLICY "Owner reads verification docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'verification-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owner writes verification docs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'verification-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ── Submission file references ──────────────────────────────────
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS family_code TEXT;

UPDATE users
SET family_code = upper(substring(md5(random()::text) from 1 for 8))
WHERE role = 'student' AND (family_code IS NULL OR family_code = '');
