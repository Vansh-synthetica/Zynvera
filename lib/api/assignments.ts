import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

const supabase = createClient()
type Tables = Database['public']['Tables']

// ── Assignments ───────────────────────────────────────────────────

export async function listAssignments(courseId: string) {
  const { data, error } = await supabase
    .from('assignments')
    .select('*, assignment_attachments(*), rubric_items(*)')
    .eq('course_id', courseId)
    .order('due_date', { ascending: true })
  if (error) throw error
  return data
}

export async function getAssignment(id: string) {
  const { data, error } = await supabase
    .from('assignments')
    .select('*, assignment_attachments(*), rubric_items(*), courses(title,code)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createAssignment(a: Tables['assignments']['Insert']) {
  const { data, error } = await supabase.from('assignments').insert(a).select().single()
  if (error) throw error
  return data
}

export async function updateAssignment(id: string, patch: Tables['assignments']['Update']) {
  const { data, error } = await supabase.from('assignments').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteAssignment(id: string) {
  const { error } = await supabase.from('assignments').delete().eq('id', id)
  if (error) throw error
}

export async function publishAssignment(id: string) {
  const { data, error } = await supabase
    .from('assignments')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Attachments ───────────────────────────────────────────────────

export async function addAttachment(att: Tables['assignment_attachments']['Insert']) {
  const { data, error } = await supabase.from('assignment_attachments').insert(att).select().single()
  if (error) throw error
  return data
}

export async function deleteAttachment(id: string) {
  const { error } = await supabase.from('assignment_attachments').delete().eq('id', id)
  if (error) throw error
}

// ── Rubric Items ──────────────────────────────────────────────────

export async function listRubricItems(assignmentId: string) {
  const { data, error } = await supabase
    .from('rubric_items')
    .select('*')
    .eq('assignment_id', assignmentId)
    .order('created_at')
  if (error) throw error
  return data
}

export async function upsertRubricItem(item: Tables['rubric_items']['Insert']) {
  const { data, error } = await supabase.from('rubric_items').upsert(item).select().single()
  if (error) throw error
  return data
}

export async function deleteRubricItem(id: string) {
  const { error } = await supabase.from('rubric_items').delete().eq('id', id)
  if (error) throw error
}

// ── Submissions ───────────────────────────────────────────────────

export async function listSubmissions(assignmentId: string) {
  const { data, error } = await supabase
    .from('submissions')
    .select('*, users(name,avatar,email), assignment_attachments(*)')
    .eq('assignment_id', assignmentId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getSubmission(assignmentId: string, userId: string) {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .eq('user_id', userId)
    .single()
  if (error) throw error
  return data
}

export async function upsertSubmission(sub: Tables['submissions']['Insert']) {
  const { data, error } = await supabase
    .from('submissions')
    .upsert(sub, { onConflict: 'assignment_id,user_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function gradeSubmission(id: string, score: number, feedback: string, gradedBy: string) {
  const { data, error } = await supabase
    .from('submissions')
    .update({ score, feedback, graded_by: gradedBy, graded_at: new Date().toISOString(), status: 'graded' })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error

  await supabase.from('submission_history').insert({ submission_id: id, status: 'graded', score, feedback })

  // Sync into grade_entries so the student's Grades page / dashboard average reflect it.
  try {
    const sub = data as any
    const { data: asg } = await supabase
      .from('assignments')
      .select('course_id, title, max_score')
      .eq('id', sub.assignment_id)
      .single()
    if (asg) {
      const maxScore = (asg as any).max_score ?? 100
      const { data: existing } = await supabase
        .from('grade_entries')
        .select('id')
        .eq('course_id', (asg as any).course_id)
        .eq('user_id', sub.user_id)
        .eq('assessment_name', (asg as any).title)
        .maybeSingle()
      if (existing) {
        await supabase
          .from('grade_entries')
          .update({ score, max_score: maxScore, feedback, date: new Date().toISOString().slice(0, 10) })
          .eq('id', (existing as any).id)
      } else {
        await supabase.from('grade_entries').insert({
          course_id: (asg as any).course_id,
          user_id: sub.user_id,
          assessment_name: (asg as any).title,
          assessment_type: 'assignment',
          score,
          max_score: maxScore,
          weight: 1,
          category: 'Assignments',
          date: new Date().toISOString().slice(0, 10),
          feedback,
        })
      }
    }
  } catch {
    // Grade sync is best-effort; never fail the grading action itself.
  }

  return data
}

export async function returnSubmission(id: string, feedback: string) {
  const { data, error } = await supabase
    .from('submissions')
    .update({ feedback, status: 'returned' })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Submission History ────────────────────────────────────────────

export async function getSubmissionHistory(submissionId: string) {
  const { data, error } = await supabase
    .from('submission_history')
    .select('*')
    .eq('submission_id', submissionId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}
