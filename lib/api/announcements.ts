import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

const supabase = createClient()
type Tables = Database['public']['Tables']

// ── Announcements ─────────────────────────────────────────────────

export async function listAnnouncements(institutionId: string) {
  const { data, error } = await supabase
    .from('announcements')
    .select('*, users!announcements_author_id_fkey(name,avatar)')
    .eq('institution_id', institutionId)
    .order('pinned', { ascending: false })
    .order('published_at', { ascending: false })
  if (error) throw error
  return data
}

export async function listCourseAnnouncements(courseId: string) {
  const { data, error } = await supabase
    .from('announcements')
    .select('*, users!announcements_author_id_fkey(name,avatar)')
    .eq('course_id', courseId)
    .order('pinned', { ascending: false })
    .order('published_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getAnnouncement(id: string) {
  const { data, error } = await supabase
    .from('announcements')
    .select('*, users!announcements_author_id_fkey(name,avatar,email)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createAnnouncement(a: Tables['announcements']['Insert']) {
  const { data, error } = await supabase.from('announcements').insert(a).select().single()
  if (error) throw error
  return data
}

export async function updateAnnouncement(id: string, patch: Partial<Tables['announcements']['Update']>) {
  const { data, error } = await supabase.from('announcements').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteAnnouncement(id: string) {
  const { error } = await supabase.from('announcements').delete().eq('id', id)
  if (error) throw error
}

export async function pinAnnouncement(id: string, pinned: boolean) {
  const { data, error } = await supabase
    .from('announcements')
    .update({ pinned })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
