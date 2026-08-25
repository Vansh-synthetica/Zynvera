import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

const supabase = createClient()
type Tables = Database['public']['Tables']

// ── Assessments ───────────────────────────────────────────────────

export async function listAssessments(courseId: string) {
  const { data, error } = await supabase
    .from('assessments')
    .select('*, assessment_questions(id), assessment_submissions(id,score)')
    .eq('course_id', courseId)
    .order('start_date', { ascending: false })
  if (error) throw error
  return data
}

export async function getAssessment(id: string) {
  const { data, error } = await supabase
    .from('assessments')
    .select('*, assessment_questions(*), courses(title,code)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createAssessment(a: Tables['assessments']['Insert']) {
  const { data, error } = await supabase.from('assessments').insert(a).select().single()
  if (error) throw error
  return data
}

export async function updateAssessment(id: string, patch: Tables['assessments']['Update']) {
  const { data, error } = await supabase.from('assessments').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteAssessment(id: string) {
  const { error } = await supabase.from('assessments').delete().eq('id', id)
  if (error) throw error
}

export async function activateAssessment(id: string) {
  const { data, error } = await supabase
    .from('assessments')
    .update({ status: 'active' })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function completeAssessment(id: string) {
  const { data, error } = await supabase
    .from('assessments')
    .update({ status: 'completed' })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Questions ─────────────────────────────────────────────────────

export async function listQuestions(assessmentId: string) {
  const { data, error } = await supabase
    .from('assessment_questions')
    .select('*')
    .eq('assessment_id', assessmentId)
    .order('order_index')
  if (error) throw error
  return data
}

export async function createQuestion(q: Tables['assessment_questions']['Insert']) {
  const { data, error } = await supabase.from('assessment_questions').insert(q).select().single()
  if (error) throw error
  return data
}

export async function updateQuestion(id: string, patch: Tables['assessment_questions']['Update']) {
  const { data, error } = await supabase.from('assessment_questions').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteQuestion(id: string) {
  const { error } = await supabase.from('assessment_questions').delete().eq('id', id)
  if (error) throw error
}

export async function bulkCreateQuestions(questions: Tables['assessment_questions']['Insert'][]) {
  const { data, error } = await supabase.from('assessment_questions').insert(questions).select()
  if (error) throw error
  return data
}

// ── Assessment Submissions ────────────────────────────────────────

export async function listAssessmentSubmissions(assessmentId: string) {
  const { data, error } = await supabase
    .from('assessment_submissions')
    .select('*, users(name,avatar,email)')
    .eq('assessment_id', assessmentId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getAssessmentSubmission(assessmentId: string, userId: string) {
  const { data, error } = await supabase
    .from('assessment_submissions')
    .select('*')
    .eq('assessment_id', assessmentId)
    .eq('user_id', userId)
    .order('attempt_number', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function submitAssessmentAnswer(sub: Tables['assessment_submissions']['Insert']) {
  const { data, error } = await supabase.from('assessment_submissions').insert(sub).select().single()
  if (error) throw error
  return data
}

export async function gradeAssessmentSubmission(id: string, score: number) {
  const { data, error } = await supabase
    .from('assessment_submissions')
    .update({ score, submitted_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getAssessmentResults(assessmentId: string) {
  const { data, error } = await supabase
    .from('assessment_submissions')
    .select('score, assessment_questions(points)')
    .eq('assessment_id', assessmentId)
    .not('score', 'is', null)
  if (error) throw error

  const scores = data.map(d => d.score ?? 0)
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
  const max = scores.length ? Math.max(...scores) : 0
  const min = scores.length ? Math.min(...scores) : 0
  return { average: avg, highest: max, lowest: min, count: scores.length, scores }
}
