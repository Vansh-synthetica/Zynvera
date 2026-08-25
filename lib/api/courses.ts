import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

const supabase = createClient()
type Tables = Database['public']['Tables']

// ── Courses ───────────────────────────────────────────────────────

export async function listCourses(institutionId: string, termId?: string) {
  let q = supabase
    .from('courses')
    .select('*, users!courses_teacher_id_fkey(name,avatar,email), programmes(name,department), course_enrolments(id)')
    .eq('institution_id', institutionId)
    .eq('status', 'active')
  if (termId) q = q.eq('term_id', termId)
  const { data, error } = await q.order('title')
  if (error) throw error
  return data
}

export async function getCourse(id: string) {
  const { data, error } = await supabase
    .from('courses')
    .select('*, users!courses_teacher_id_fkey(name,avatar,email), programmes(name,department)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getCoursesByTeacher(teacherId: string, termId?: string) {
  let q = supabase
    .from('courses')
    .select('*, programmes(name,department), course_enrolments(id)')
    .eq('teacher_id', teacherId)
    .eq('status', 'active')
  if (termId) q = q.eq('term_id', termId)
  const { data, error } = await q.order('title')
  if (error) throw error
  return data
}

export async function getCoursesByStudent(studentId: string, termId?: string) {
  const { data: enrollments, error: e1 } = await supabase
    .from('course_enrolments')
    .select('course_id')
    .eq('user_id', studentId)
    .eq('status', 'active')
  if (e1) throw e1
  const ids = enrollments.map(e => e.course_id)
  if (!ids.length) return []
  let q = supabase
    .from('courses')
    .select('*, users!courses_teacher_id_fkey(name,avatar,email), programmes(name,department)')
    .in('id', ids)
  if (termId) q = q.eq('term_id', termId)
  const { data, error } = await q.order('title')
  if (error) throw error
  return data
}

export async function createCourse(course: Tables['courses']['Insert']) {
  const { data, error } = await supabase.from('courses').insert(course).select().single()
  if (error) throw error
  return data
}

export async function updateCourse(id: string, patch: Tables['courses']['Update']) {
  const { data, error } = await supabase.from('courses').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteCourse(id: string) {
  const { error } = await supabase.from('courses').delete().eq('id', id)
  if (error) throw error
}

// ── Modules ───────────────────────────────────────────────────────

export async function listModules(courseId: string) {
  const { data, error } = await supabase
    .from('course_modules')
    .select('*, course_lessons(*)')
    .eq('course_id', courseId)
    .order('order_index')
  if (error) throw error
  return data
}

export async function createModule(mod: Tables['course_modules']['Insert']) {
  const { data, error } = await supabase.from('course_modules').insert(mod).select().single()
  if (error) throw error
  return data
}

export async function updateModule(id: string, patch: Tables['course_modules']['Update']) {
  const { data, error } = await supabase.from('course_modules').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteModule(id: string) {
  const { error } = await supabase.from('course_modules').delete().eq('id', id)
  if (error) throw error
}

// ── Lessons ───────────────────────────────────────────────────────

export async function listLessons(moduleId: string) {
  const { data, error } = await supabase
    .from('course_lessons')
    .select('*')
    .eq('module_id', moduleId)
    .order('order_index')
  if (error) throw error
  return data
}

export async function createLesson(lesson: Tables['course_lessons']['Insert']) {
  const { data, error } = await supabase.from('course_lessons').insert(lesson).select().single()
  if (error) throw error
  return data
}

export async function updateLesson(id: string, patch: Tables['course_lessons']['Update']) {
  const { data, error } = await supabase.from('course_lessons').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteLesson(id: string) {
  const { error } = await supabase.from('course_lessons').delete().eq('id', id)
  if (error) throw error
}

// ── Resources ─────────────────────────────────────────────────────

export async function listResources(courseId: string) {
  const { data, error } = await supabase
    .from('course_resources')
    .select('*')
    .eq('course_id', courseId)
    .order('uploaded_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createResource(res: Tables['course_resources']['Insert']) {
  const { data, error } = await supabase.from('course_resources').insert(res).select().single()
  if (error) throw error
  return data
}

export async function deleteResource(id: string) {
  const { error } = await supabase.from('course_resources').delete().eq('id', id)
  if (error) throw error
}

// ── Syllabus ──────────────────────────────────────────────────────

export async function listSyllabus(courseId: string) {
  const { data, error } = await supabase
    .from('syllabus_items')
    .select('*')
    .eq('course_id', courseId)
    .order('week')
  if (error) throw error
  return data
}

export async function upsertSyllabus(item: Tables['syllabus_items']['Insert']) {
  const { data, error } = await supabase.from('syllabus_items').upsert(item).select().single()
  if (error) throw error
  return data
}

// ── Grade Weights ─────────────────────────────────────────────────

export async function listGradeWeights(courseId: string) {
  const { data, error } = await supabase
    .from('grade_weights')
    .select('*')
    .eq('course_id', courseId)
    .order('category')
  if (error) throw error
  return data
}

export async function upsertGradeWeight(gw: Tables['grade_weights']['Insert']) {
  const { data, error } = await supabase.from('grade_weights').upsert(gw).select().single()
  if (error) throw error
  return data
}

export async function deleteGradeWeight(id: string) {
  const { error } = await supabase.from('grade_weights').delete().eq('id', id)
  if (error) throw error
}

// ── Bulk content replacement (course editor save) ────────────────

export type LessonInput = {
  title: string
  type: string
  duration?: string | null
}

export type ModuleInput = {
  title: string
  locked: boolean
  lessons: LessonInput[]
}

/**
 * Replace a course's modules and lessons wholesale.
 * Deleting modules cascades to their lessons, so re-insert is clean.
 */
export async function replaceCourseModules(courseId: string, modules: ModuleInput[]) {
  const { error: delError } = await supabase
    .from('course_modules')
    .delete()
    .eq('course_id', courseId)
  if (delError) throw delError

  if (modules.length === 0) return

  const moduleRows = await supabase
    .from('course_modules')
    .insert(
      modules.map((m, i) => ({
        course_id: courseId,
        title: m.title,
        order_index: i,
        completed: false,
        locked: m.locked,
      })),
    )
    .select()
  if (moduleRows.error) throw moduleRows.error

  const lessonRows = moduleRows.data!.flatMap((row, i) =>
    modules[i].lessons.map((l, j) => ({
      module_id: row.id,
      title: l.title,
      type: l.type,
      duration: l.duration ?? null,
      order_index: j,
      completed: false,
      locked: m_lockOf(modules[i]),
    })),
  )

  if (lessonRows.length > 0) {
    const { error } = await supabase.from('course_lessons').insert(lessonRows)
    if (error) throw error
  }
}

const m_lockOf = (m: { locked: boolean }) => m.locked

/** Replace weekly syllabus items for a course. */
export async function replaceSyllabus(
  courseId: string,
  items: Array<{ week: number; topic: string; activities: string[] }>,
) {
  const { error: delError } = await supabase
    .from('syllabus_items')
    .delete()
    .eq('course_id', courseId)
  if (delError) throw delError

  if (items.length === 0) return

  const { error } = await supabase.from('syllabus_items').insert(
    items.map(it => ({
      course_id: courseId,
      week: it.week,
      topic: it.topic,
      activities: it.activities,
    })),
  )
  if (error) throw error
}

/** Replace grade-weight categories for a course. */
export async function replaceGradeWeights(
  courseId: string,
  weights: Array<{ category: string; weight: number }>,
) {
  const { error: delError } = await supabase
    .from('grade_weights')
    .delete()
    .eq('course_id', courseId)
  if (delError) throw delError

  if (weights.length === 0) return

  const { error } = await supabase
    .from('grade_weights')
    .insert(weights.map(w => ({ course_id: courseId, category: w.category, weight: w.weight })))
  if (error) throw error
}

// ── Storage-backed resources ─────────────────────────────────────

/** Upload a file into the public course-resources bucket and record it. */
export async function uploadCourseResource(
  courseId: string,
  file: File,
  title?: string,
): Promise<Tables['course_resources']['Row']> {
  const path = `${courseId}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, '_')}`

  const { error: upError } = await supabase.storage
    .from('course-resources')
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (upError) throw upError

  const { data: urlData } = supabase.storage.from('course-resources').getPublicUrl(path)

  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const typeMap: Record<string, string> = {
    pdf: 'document',
    doc: 'document',
    docx: 'document',
    pptx: 'presentation',
    ppt: 'presentation',
    mp4: 'video',
    mov: 'video',
  }
  const resourceType = typeMap[ext] ?? (file.type.startsWith('video/') ? 'video' : 'download')

  const kb = Math.max(1, Math.round(file.size / 1024))
  const sizeLabel = kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`

  return createResource({
    course_id: courseId,
    title: title?.trim() || file.name,
    type: resourceType as any,
    url: urlData.publicUrl,
    size: sizeLabel,
  })
}
