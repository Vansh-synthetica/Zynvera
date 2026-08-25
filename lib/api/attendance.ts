import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

const supabase = createClient()
type Tables = Database['public']['Tables']

// ── Attendance Records ────────────────────────────────────────────

export async function listAttendance(classSectionId: string, date?: string) {
  let q = supabase
    .from('attendance_records')
    .select('*, users(name,avatar,email)')
    .eq('class_section_id', classSectionId)
  if (date) q = q.eq('date', date)
  const { data, error } = await q.order('date', { ascending: false })
  if (error) throw error
  return data
}

export async function getStudentAttendance(studentId: string) {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*, class_sections(name, day, start_time, end_time, courses(title, code))')
    .eq('user_id', studentId)
    .order('date', { ascending: false })
  if (error) throw error
  return data
}

export async function markAttendance(record: Tables['attendance_records']['Insert']) {
  const { data, error } = await supabase
    .from('attendance_records')
    .upsert(record, { onConflict: 'class_section_id,user_id,date' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function bulkMarkAttendance(records: Tables['attendance_records']['Insert'][]) {
  const { data, error } = await supabase
    .from('attendance_records')
    .upsert(records, { onConflict: 'class_section_id,user_id,date' })
    .select()
  if (error) throw error
  return data
}

export async function updateAttendance(id: string, patch: Partial<Tables['attendance_records']['Update']>) {
  const { data, error } = await supabase.from('attendance_records').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteAttendance(id: string) {
  const { error } = await supabase.from('attendance_records').delete().eq('id', id)
  if (error) throw error
}

// ── Attendance Summaries ──────────────────────────────────────────

export async function getStudentAttendanceSummary(studentId: string) {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('status')
    .eq('user_id', studentId)
  if (error) throw error

  const total = data.length
  const present = data.filter(r => r.status === 'present').length
  const absent = data.filter(r => r.status === 'absent').length
  const late = data.filter(r => r.status === 'late').length
  const excused = data.filter(r => r.status === 'excused').length

  return {
    total,
    present,
    absent,
    late,
    excused,
    rate: total > 0 ? (present / total) * 100 : 0,
    byStatus: { present, absent, late, excused },
  }
}

export async function getCourseAttendanceSummary(classSectionId: string, date?: string) {
  let q = supabase
    .from('attendance_records')
    .select('status, user_id, users(name)')
    .eq('class_section_id', classSectionId)
  if (date) q = q.eq('date', date)
  const { data, error } = await q
  if (error) throw error

  const total = data.length
  const present = data.filter(r => r.status === 'present').length
  const absent = data.filter(r => r.status === 'absent').length
  const late = data.filter(r => r.status === 'late').length

  return {
    total,
    present,
    absent,
    late,
    presentRate: total > 0 ? (present / total) * 100 : 0,
    students: data.map(r => ({ userId: r.user_id, name: r.users?.name, status: r.status })),
  }
}

export async function getAttendanceTrend(studentId: string, days: number = 30) {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const { data, error } = await supabase
    .from('attendance_records')
    .select('date, status')
    .eq('user_id', studentId)
    .gte('date', since.toISOString().split('T')[0])
    .order('date')
  if (error) throw error
  return data
}

// Today's attendance status for one student (parent live view).
export async function getTodayStatus(studentId: string) {
  const today = new Date().toISOString().slice(0, 10)
  const rows = await getStudentAttendance(studentId)
  const todayRows = ((rows as any[]) ?? []).filter(r => r.date === today)
  if (todayRows.length === 0) return { marked: false, status: null as string | null }
  const worst = todayRows.find(r => r.status === 'absent') ?? todayRows.find(r => r.status === 'late') ?? todayRows[0]
  return { marked: true, status: worst.status as string }
}
