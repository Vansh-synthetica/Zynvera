import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

const supabase = createClient()
type Tables = Database['public']['Tables']

// ── Grade Entries ─────────────────────────────────────────────────

export async function listGradesByCourse(courseId: string) {
  const { data, error } = await supabase
    .from('grade_entries')
    .select('*, users(name,avatar,email)')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function listGradesByStudent(studentId: string, courseId?: string) {
  let q = supabase
    .from('grade_entries')
    .select('*, courses(title,code)')
    .eq('user_id', studentId)
  if (courseId) q = q.eq('course_id', courseId)
  const { data, error } = await q.order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createGradeEntry(entry: Tables['grade_entries']['Insert']) {
  const { data, error } = await supabase.from('grade_entries').insert(entry).select().single()
  if (error) throw error
  return data
}

export async function updateGradeEntry(id: string, patch: Tables['grade_entries']['Update']) {
  const { data, error } = await supabase.from('grade_entries').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteGradeEntry(id: string) {
  const { error } = await supabase.from('grade_entries').delete().eq('id', id)
  if (error) throw error
}

export async function bulkCreateGrades(entries: Tables['grade_entries']['Insert'][]) {
  const { data, error } = await supabase.from('grade_entries').insert(entries).select()
  if (error) throw error
  return data
}

// ── Gradebook Queries ─────────────────────────────────────────────

export async function getStudentAverage(studentId: string, courseId?: string) {
  let q = supabase.from('grade_entries').select('score,max_score,weight').eq('user_id', studentId)
  if (courseId) q = q.eq('course_id', courseId)
  const { data, error } = await q
  if (error) throw error
  if (!data.length) return { average: 0, total: 0, count: 0 }

  let totalWeightedScore = 0
  let totalWeight = 0
  data.forEach(g => {
    const w = g.weight ?? 1
    totalWeightedScore += (g.score / g.max_score) * 100 * w
    totalWeight += w
  })
  return {
    average: totalWeight > 0 ? totalWeightedScore / totalWeight : 0,
    total: data.reduce((s, g) => s + g.score, 0),
    count: data.length,
  }
}

export async function getCourseGradeSummary(courseId: string) {
  const { data, error } = await supabase
    .from('grade_entries')
    .select('user_id, score, max_score')
    .eq('course_id', courseId)
  if (error) throw error

  const byStudent = new Map<string, { scores: number[]; maxes: number[] }>()
  data.forEach(g => {
    const existing = byStudent.get(g.user_id) || { scores: [], maxes: [] }
    existing.scores.push(g.score)
    existing.maxes.push(g.max_score)
    byStudent.set(g.user_id, existing)
  })

  const results = Array.from(byStudent.entries()).map(([userId, { scores, maxes }]) => {
    const total = scores.reduce((a, b) => a + b, 0)
    const max = maxes.reduce((a, b) => a + b, 0)
    return { userId, average: max > 0 ? (total / max) * 100 : 0, totalScore: total, totalMax: max }
  })

  const allAverages = results.map(r => r.average)
  const classAverage = allAverages.length ? allAverages.reduce((a, b) => a + b, 0) / allAverages.length : 0
  const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 }
  allAverages.forEach(a => {
    if (a >= 90) distribution.A++
    else if (a >= 80) distribution.B++
    else if (a >= 70) distribution.C++
    else if (a >= 60) distribution.D++
    else distribution.F++
  })

  return { students: results, classAverage, distribution, count: results.length }
}

export async function getGradeDistribution(courseId: string) {
  const { data, error } = await supabase
    .from('grade_entries')
    .select('score, max_score')
    .eq('course_id', courseId)
  if (error) throw error
  const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 }
  data.forEach(g => {
    const pct = (g.score / g.max_score) * 100
    if (pct >= 90) distribution.A++
    else if (pct >= 80) distribution.B++
    else if (pct >= 70) distribution.C++
    else if (pct >= 60) distribution.D++
    else distribution.F++
  })
  return distribution
}

export async function getLetterGrade(percentage: number): Promise<string> {
  if (percentage >= 93) return 'A'
  if (percentage >= 90) return 'A-'
  if (percentage >= 87) return 'B+'
  if (percentage >= 83) return 'B'
  if (percentage >= 80) return 'B-'
  if (percentage >= 77) return 'C+'
  if (percentage >= 73) return 'C'
  if (percentage >= 70) return 'C-'
  if (percentage >= 67) return 'D+'
  if (percentage >= 60) return 'D'
  return 'F'
}
