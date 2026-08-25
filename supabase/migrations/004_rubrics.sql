-- =====================================================
-- RUBRIC TABLES
-- Rubrics attach to courses; assessments attach to
-- submissions (assignment grading) or stand alone.
-- =====================================================

CREATE TABLE rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  points_possible INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rubric_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_id UUID NOT NULL REFERENCES rubrics(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  long_description TEXT,
  points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rubric_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criterion_id UUID NOT NULL REFERENCES rubric_criteria(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT,
  points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rubric_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_id UUID NOT NULL REFERENCES rubrics(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES submissions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_score INTEGER NOT NULL DEFAULT 0,
  comments TEXT,
  assessed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rubric_id, submission_id, user_id)
);

CREATE TABLE rubric_assessment_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES rubric_assessments(id) ON DELETE CASCADE,
  criterion_id UUID NOT NULL REFERENCES rubric_criteria(id) ON DELETE CASCADE,
  rating_id UUID REFERENCES rubric_ratings(id) ON DELETE SET NULL,
  points INTEGER,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assessment_id, criterion_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_rubrics_course ON rubrics(course_id);
CREATE INDEX idx_rubrics_creator ON rubrics(created_by);
CREATE INDEX idx_rubric_criteria_rubric ON rubric_criteria(rubric_id);
CREATE INDEX idx_rubric_ratings_criterion ON rubric_ratings(criterion_id);
CREATE INDEX idx_rubric_assessments_rubric ON rubric_assessments(rubric_id);
CREATE INDEX idx_rubric_assessments_user ON rubric_assessments(user_id);
CREATE INDEX idx_rubric_assessments_submission ON rubric_assessments(submission_id);
CREATE INDEX idx_rubric_assessment_ratings_assessment ON rubric_assessment_ratings(assessment_id);

-- =====================================================
-- UPDATED_AT TRIGGER
-- =====================================================

CREATE TRIGGER update_rubrics_updated_at BEFORE UPDATE ON rubrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubric_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubric_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubric_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubric_assessment_ratings ENABLE ROW LEVEL SECURITY;

-- Rubrics: visible within the institution; teachers/principals manage their own.
CREATE POLICY "Rubrics are readable by institution members"
  ON rubrics FOR SELECT
  USING (get_user_institution() = (SELECT institution_id FROM users WHERE users.id = auth.uid()));

CREATE POLICY "Teachers can manage their own rubrics"
  ON rubrics FOR ALL
  USING (
    get_user_role() IN ('teacher', 'principal', 'admin', 'super_admin')
    AND created_by = auth.uid()
  )
  WITH CHECK (
    get_user_role() IN ('teacher', 'principal', 'admin', 'super_admin')
    AND created_by = auth.uid()
  );

-- Criteria: follow parent rubric permissions via joins.
CREATE POLICY "Criteria readable with rubric"
  ON rubric_criteria FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rubrics r
      WHERE r.id = rubric_id
        AND get_user_institution() = (SELECT institution_id FROM users WHERE users.id = auth.uid())
    )
  );

CREATE POLICY "Staff can manage criteria of own rubrics"
  ON rubric_criteria FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM rubrics r
      WHERE r.id = rubric_id
        AND r.created_by = auth.uid()
        AND get_user_role() IN ('teacher', 'principal', 'admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rubrics r
      WHERE r.id = rubric_id
        AND r.created_by = auth.uid()
        AND get_user_role() IN ('teacher', 'principal', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Ratings readable with rubric"
  ON rubric_ratings FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM rubric_criteria rc
      JOIN rubrics r ON r.id = rc.rubric_id
      WHERE rc.id = criterion_id
        AND get_user_institution() = (SELECT institution_id FROM users WHERE users.id = auth.uid())
    )
  );

CREATE POLICY "Staff can manage ratings of own rubrics"
  ON rubric_ratings FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM rubric_criteria rc
      JOIN rubrics r ON r.id = rc.rubric_id
      WHERE rc.id = criterion_id
        AND r.created_by = auth.uid()
        AND get_user_role() IN ('teacher', 'principal', 'admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM rubric_criteria rc
      JOIN rubrics r ON r.id = rc.rubric_id
      WHERE rc.id = criterion_id
        AND r.created_by = auth.uid()
        AND get_user_role() IN ('teacher', 'principal', 'admin', 'super_admin')
    )
  );

-- Assessments: students see their own; staff see all in institution.
CREATE POLICY "Assessments visible to owner and staff"
  ON rubric_assessments FOR SELECT
  USING (
    user_id = auth.uid()
    OR get_user_role() IN ('teacher', 'principal', 'admin', 'super_admin')
  );

CREATE POLICY "Staff can create assessments"
  ON rubric_assessments FOR INSERT
  WITH CHECK (get_user_role() IN ('teacher', 'principal', 'admin', 'super_admin'));

CREATE POLICY "Assessors can update their assessments"
  ON rubric_assessments FOR UPDATE
  USING (
    assessor_id = auth.uid()
    OR get_user_role() IN ('admin', 'super_admin')
  );

CREATE POLICY "Assessors can delete their assessments"
  ON rubric_assessments FOR DELETE
  USING (
    assessor_id = auth.uid()
    OR get_user_role() IN ('admin', 'super_admin')
  );

CREATE POLICY "Ratings visible with assessment"
  ON rubric_assessment_ratings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rubric_assessments ra
      WHERE ra.id = assessment_id
        AND (ra.user_id = auth.uid() OR get_user_role() IN ('teacher', 'principal', 'admin', 'super_admin'))
    )
  );

CREATE POLICY "Staff can manage assessment ratings"
  ON rubric_assessment_ratings FOR ALL
  USING (get_user_role() IN ('teacher', 'principal', 'admin', 'super_admin'))
  WITH CHECK (get_user_role() IN ('teacher', 'principal', 'admin', 'super_admin'));
