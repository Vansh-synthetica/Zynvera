-- Seed data for Zynvera LMS
-- Only non-user-dependent data. Users/courses created via app after auth signup.

-- Institution
INSERT INTO institutions (id, name, short_name, type, city, country, students, teachers, campuses, programmes, approved, status, focus)
VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Riverside Academy', 'RA', 'School', 'New York', 'USA', 0, 0, 0, 0, true, 'active', 'STEM & Arts');

-- Campuses
INSERT INTO campuses (id, institution_id, name, address, city)
VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Main Campus', '123 Education Lane', 'New York'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'East Campus', '456 Learning Ave', 'New York');

-- Academic Terms
INSERT INTO academic_terms (id, institution_id, name, start_date, end_date, status)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Term 1 2025-26', '2025-09-01', '2025-12-20', 'completed'),
  ('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Term 2 2025-26', '2026-01-06', '2026-03-27', 'active'),
  ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Term 3 2025-26', '2026-04-14', '2026-06-30', 'upcoming');

-- Programmes
INSERT INTO programmes (id, institution_id, name, department, level)
VALUES
  ('d1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Science Track', 'Science', 'secondary'),
  ('d1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Arts & Humanities', 'Arts', 'secondary'),
  ('d1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Computer Science', 'CS', 'secondary');
