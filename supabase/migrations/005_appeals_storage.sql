-- =====================================================
-- GRADE APPEALS
-- Students contest a grade; staff resolve.
-- =====================================================

CREATE TABLE grade_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  resolution TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_grade_appeals_course ON grade_appeals(course_id);
CREATE INDEX idx_grade_appeals_user ON grade_appeals(user_id);
CREATE INDEX idx_grade_appeals_status ON grade_appeals(status);

ALTER TABLE grade_appeals ENABLE ROW LEVEL SECURITY;

-- Students manage their own appeals.
CREATE POLICY "Students view own appeals" ON grade_appeals
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Students create own appeals" ON grade_appeals
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Course teachers see and resolve appeals for their courses.
CREATE POLICY "Teachers manage course appeals" ON grade_appeals
  FOR ALL USING (
    course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid())
  );

-- =====================================================
-- STORAGE: course resource files
-- Public-read bucket; authenticated users may upload/manage.
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('course-resources', 'course-resources', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated uploads to course resources"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'course-resources');

CREATE POLICY "Authenticated updates in course resources"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'course-resources');

CREATE POLICY "Authenticated deletes in course resources"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'course-resources');
