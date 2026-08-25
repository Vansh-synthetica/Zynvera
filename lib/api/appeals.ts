import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

const supabase = createClient()

export type AppealRow = {
  id: string
  submission_id: string | null
  course_id: string
  user_id: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  resolution: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export async function createAppeal(input: {
  submission_id?: string | null
  course_id: string
  user_id: string
  reason: string
}) {
  const { data, error } = await supabase
    .from('grade_appeals')
    .insert({ ...input, status: 'pending' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listMyAppeals(userId: string) {
  const { data, error } = await supabase
    .from('grade_appeals')
    .select('*, courses(title, code)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function listAppealsByCourse(courseId: string) {
  const { data, error } = await supabase
    .from('grade_appeals')
    .select(`
      *,
      users!grade_appeals_user_id_fkey(name, email),
      submissions(score, assignment_id)
    `)
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function resolveAppeal(
  id: string,
  status: 'approved' | 'rejected',
  resolution: string,
  reviewerId: string,
) {
  const { data, error } = await supabase
    .from('grade_appeals')
    .update({
      status,
      resolution,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
