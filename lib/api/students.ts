import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

const supabase = createClient()
type Tables = Database['public']['Tables']

// ── Enrolments ────────────────────────────────────────────────────

export async function listEnrolments(courseId: string) {
  const { data, error } = await supabase
    .from('course_enrolments')
    .select('*, users(name,avatar,email,role)')
    .eq('course_id', courseId)
    .eq('status', 'active')
    .order('enrolled_at')
  if (error) throw error
  return data
}

export async function getEnrollmentCount(courseId: string) {
  const { count, error } = await supabase
    .from('course_enrolments')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId)
    .eq('status', 'active')
  if (error) throw error
  return count ?? 0
}

export async function enrollStudent(courseId: string, userId: string) {
  // Upsert handles re-enrolling students who were previously withdrawn
  // (unique constraint on course_id + user_id).
  const { data, error } = await supabase
    .from('course_enrolments')
    .upsert(
      { course_id: courseId, user_id: userId, status: 'active' },
      { onConflict: 'course_id,user_id' },
    )
    .select()
    .single()
  if (error) throw error

  // Keep the denormalised counter close to reality.
  const count = await getEnrollmentCount(courseId)
  await supabase.from('courses').update({ enrolled_students: count }).eq('id', courseId)

  return data
}

export async function unenrollStudent(courseId: string, userId: string) {
  const { error } = await supabase
    .from('course_enrolments')
    .update({ status: 'withdrawn' })
    .eq('course_id', courseId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function isEnrolled(courseId: string, userId: string) {
  const { count, error } = await supabase
    .from('course_enrolments')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .eq('status', 'active')
  if (error) throw error
  return (count ?? 0) > 0
}

// ── Student Roster ────────────────────────────────────────────────

export async function getCourseRoster(courseId: string) {
  const { data, error } = await supabase
    .from('course_enrolments')
    .select(`
      id, enrolled_at, status,
      users(id, name, email, avatar, phone, verification_status)
    `)
    .eq('course_id', courseId)
    .eq('status', 'active')
    .order('enrolled_at')
  if (error) throw error
  return data
}

export async function getStudentCourses(userId: string) {
  const { data: enrollments, error: e1 } = await supabase
    .from('course_enrolments')
    .select('course_id, enrolled_at')
    .eq('user_id', userId)
    .eq('status', 'active')
  if (e1) throw e1

  const courseIds = enrollments.map((e: any) => e.course_id)
  if (!courseIds.length) return []

  const { data, error } = await supabase
    .from('courses')
    .select('*, users!courses_teacher_id_fkey(name,email,avatar)')
    .in('id', courseIds)
  if (error) throw error
  return data
}

// ── User Management (principal/admin) ─────────────────────────────

export async function listUsers(institutionId: string, role?: string) {
  let q = supabase
    .from('users')
    .select('*')
    .eq('institution_id', institutionId)
  if (role) q = q.eq('role', role)
  const { data, error } = await q.order('name')
  if (error) throw error
  return data
}

export async function getUser(id: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function updateUser(id: string, patch: Tables['users']['Update']) {
  const { data, error } = await supabase.from('users').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function searchUsers(institutionId: string, query: string) {
  // Uses a SECURITY DEFINER RPC: students have no direct SELECT on other
  // users' rows, so the RPC resolves same-institution staff + classmates
  // server-side (escaping wildcards internally).
  if (!query.trim()) return []
  const { data, error } = await supabase.rpc('search_messageable_users', {
    p_query: query.trim(),
  })
  if (error) throw error
  return (data ?? []) as Array<{ id: string; name: string; email: string; role: string; avatar: string | null }>
}

export async function getUserStats(institutionId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('institution_id', institutionId)
  if (error) throw error

  const stats: Record<string, number> = {}
  data.forEach((u: any) => { stats[u.role] = (stats[u.role] || 0) + 1 })
  return { total: data.length, byRole: stats }
}

export async function bulkImportStudents(rows: Array<{ email: string; name?: string }>): Promise<{
  created: number;
  skipped: number;
  credentials: Array<{ email: string; password: string; family_code: string }>;
}> {
  const { data, error } = await supabase.rpc('bulk_import_students', {
    p_rows: rows,
  })
  if (error) throw error
  return data as { created: number; skipped: number; credentials: Array<{ email: string; password: string; family_code: string }> }
}
