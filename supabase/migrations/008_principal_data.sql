-- =====================================================
-- PRINCIPAL DATA: departments, finance, alerts, parents
-- =====================================================

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  head_id UUID REFERENCES users(id) ON DELETE SET NULL,
  budget NUMERIC(12,2),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  tx_date DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE finance_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  fiscal_year TEXT NOT NULL,
  budgeted_amount NUMERIC(12,2) NOT NULL CHECK (budgeted_amount >= 0),
  UNIQUE(institution_id, category, fiscal_year)
);

CREATE TABLE institution_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT DEFAULT 'system',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE parent_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  parent_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relationship TEXT DEFAULT 'guardian',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_user_id, student_user_id)
);

-- â”€â”€ Indexes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE INDEX idx_departments_institution ON departments(institution_id);
CREATE INDEX idx_finance_tx_institution ON finance_transactions(institution_id);
CREATE INDEX idx_finance_budgets_institution ON finance_budgets(institution_id);
CREATE INDEX idx_alerts_institution ON institution_alerts(institution_id);
CREATE INDEX idx_alerts_status ON institution_alerts(status);
CREATE INDEX idx_parent_links_parent ON parent_links(parent_user_id);
CREATE INDEX idx_parent_links_student ON parent_links(student_user_id);

-- â”€â”€ RLS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_links ENABLE ROW LEVEL SECURITY;

-- Institution-scoped read/write for staff.
CREATE POLICY "Staff manage departments" ON departments
  FOR ALL USING (
    get_user_institution() = institution_id
    AND get_user_role() IN ('teacher', 'principal', 'admin', 'super_admin')
  );

CREATE POLICY "Staff manage finance transactions" ON finance_transactions
  FOR ALL USING (
    get_user_institution() = institution_id
    AND get_user_role() IN ('principal', 'admin', 'super_admin')
  );

CREATE POLICY "Staff manage budgets" ON finance_budgets
  FOR ALL USING (
    get_user_institution() = institution_id
    AND get_user_role() IN ('principal', 'admin', 'super_admin')
  );

CREATE POLICY "Staff view alerts" ON institution_alerts
  FOR SELECT USING (get_user_institution() = institution_id);

CREATE POLICY "Staff create alerts" ON institution_alerts
  FOR INSERT WITH CHECK (
    get_user_institution() = institution_id
    AND get_user_role() IN ('teacher', 'principal', 'admin', 'super_admin')
  );

CREATE POLICY "Staff resolve alerts" ON institution_alerts
  FOR UPDATE USING (
    get_user_institution() = institution_id
    AND get_user_role() IN ('principal', 'admin', 'super_admin')
  );

CREATE POLICY "Parents view own links" ON parent_links
  FOR SELECT USING (parent_user_id = auth.uid() OR student_user_id = auth.uid());

CREATE POLICY "Staff manage parent links" ON parent_links
  FOR ALL USING (
    get_user_institution() = institution_id
    AND get_user_role() IN ('principal', 'admin', 'super_admin')
  );
