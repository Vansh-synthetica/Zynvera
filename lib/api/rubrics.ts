import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

const supabase = createClient()
type Tables = Database['public']['Tables']

// ── Rubrics ───────────────────────────────────────────────────────

export async function listRubrics(courseId: string) {
  const { data, error } = await supabase
    .from('rubrics')
    .select(`
      *,
      rubric_criteria(
        *,
        rubric_ratings(*)
      )
    `)
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getRubric(id: string) {
  const { data, error } = await supabase
    .from('rubrics')
    .select(`
      *,
      users!rubrics_created_by_fkey(name, avatar),
      rubric_criteria(
        *,
        rubric_ratings(*)
      )
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

/**
 * Create a full rubric with criteria and ratings in one call.
 * Pass nested criteria with their ratings; rows are inserted in order.
 */
export async function createRubricWithStructure(input: {
  course_id?: string | null
  title: string
  description?: string | null
  created_by: string
  criteria: Array<{
    description: string
    long_description?: string | null
    points: number
    ratings: Array<{ label: string; description?: string | null; points: number }>
  }>
}) {
  const pointsPossible = input.criteria.reduce((sum, c) => sum + c.points, 0)

  const { data: rubric, error: rubricError } = await supabase
    .from('rubrics')
    .insert({
      course_id: input.course_id ?? null,
      title: input.title,
      description: input.description ?? null,
      points_possible: pointsPossible,
      created_by: input.created_by,
    })
    .select()
    .single()
  if (rubricError) throw rubricError

  const criteriaRows = input.criteria.map((c, i) => ({
    rubric_id: rubric.id,
    description: c.description,
    long_description: c.long_description ?? null,
    points: c.points,
    order_index: i,
  }))

  const { data: criteria, error: criteriaError } = await supabase
    .from('rubric_criteria')
    .insert(criteriaRows)
    .select()
  if (criteriaError) throw criteriaError

  const ratingRows = criteria.flatMap((row, i) =>
    input.criteria[i].ratings.map((r, j) => ({
      criterion_id: row.id,
      label: r.label,
      description: r.description ?? null,
      points: r.points,
      order_index: j,
    })),
  )

  if (ratingRows.length > 0) {
    const { error: ratingsError } = await supabase
      .from('rubric_ratings')
      .insert(ratingRows)
    if (ratingsError) throw ratingsError
  }

  return getRubric(rubric.id)
}

export async function updateRubric(id: string, patch: Tables['rubrics']['Update']) {
  const { data, error } = await supabase.from('rubrics').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteRubric(id: string) {
  const { error } = await supabase.from('rubrics').delete().eq('id', id)
  if (error) throw error
}

// ── Criteria / Ratings ────────────────────────────────────────────

export async function listCriteria(rubricId: string) {
  const { data, error } = await supabase
    .from('rubric_criteria')
    .select('*, rubric_ratings(*)')
    .eq('rubric_id', rubricId)
    .order('order_index')
  if (error) throw error
  return data
}

export async function upsertCriterion(row: Tables['rubric_criteria']['Insert']) {
  const { data, error } = await supabase
    .from('rubric_criteria')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCriterion(id: string) {
  const { error } = await supabase.from('rubric_criteria').delete().eq('id', id)
  if (error) throw error
}

export async function upsertRating(row: Tables['rubric_ratings']['Insert']) {
  const { data, error } = await supabase
    .from('rubric_ratings')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Assessments ───────────────────────────────────────────────────

export async function listAssessmentsForStudent(userId: string) {
  const { data, error } = await supabase
    .from('rubric_assessments')
    .select(`
      *,
      rubrics(title, points_possible),
      users!rubric_assessments_assessor_id_fkey(name, avatar),
      rubric_assessment_ratings(*)
    `)
    .eq('user_id', userId)
    .order('assessed_at', { ascending: false })
  if (error) throw error
  return data
}

export async function listAssessmentsForSubmission(submissionId: string) {
  const { data, error } = await supabase
    .from('rubric_assessments')
    .select(`
      *,
      users!rubric_assessments_assessor_id_fkey(name, avatar),
      rubric_assessment_ratings(*)
    `)
    .eq('submission_id', submissionId)
    .order('assessed_at', { ascending: false })
  if (error) throw error
  return data
}

/**
 * Save a complete assessment: header row plus one rating row per criterion.
 * Upserts on (assessment_id, criterion_id) so re-grading overwrites cleanly.
 */
export async function saveAssessment(input: {
  rubric_id: string
  submission_id?: string | null
  user_id: string
  assessor_id: string
  comments?: string | null
  total_score: number
  ratings: Array<{
    criterion_id: string
    rating_id?: string | null
    points: number | null
    comments?: string | null
  }>
}) {
  // Find an existing assessment for this rubric/submission/student combo.
  let query = supabase
    .from('rubric_assessments')
    .select('id')
    .eq('rubric_id', input.rubric_id)
    .eq('user_id', input.user_id)

  if (input.submission_id) query = query.eq('submission_id', input.submission_id)
  else query = query.is('submission_id', null)

  const { data: existing } = await query.maybeSingle()

  let assessmentId: string

  if (existing) {
    const { error } = await supabase
      .from('rubric_assessments')
      .update({
        total_score: input.total_score,
        comments: input.comments ?? null,
        assessor_id: input.assessor_id,
        assessed_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
    if (error) throw error
    assessmentId = existing.id
  } else {
    const { data, error } = await supabase
      .from('rubric_assessments')
      .insert({
        rubric_id: input.rubric_id,
        submission_id: input.submission_id ?? null,
        user_id: input.user_id,
        assessor_id: input.assessor_id,
        total_score: input.total_score,
        comments: input.comments ?? null,
      })
      .select()
      .single()
    if (error) throw error
    assessmentId = data.id
  }

  const ratingRows = input.ratings.map(r => ({
    assessment_id: assessmentId,
    criterion_id: r.criterion_id,
    rating_id: r.rating_id ?? null,
    points: r.points,
    comments: r.comments ?? null,
  }))

  const { error: ratingsError } = await supabase
    .from('rubric_assessment_ratings')
    .upsert(ratingRows, { onConflict: 'assessment_id,criterion_id' })
  if (ratingsError) throw ratingsError

  return assessmentId
}

export async function deleteAssessment(id: string) {
  const { error } = await supabase.from('rubric_assessments').delete().eq('id', id)
  if (error) throw error
}
