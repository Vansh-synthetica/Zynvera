import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

const supabase = createClient()
type Tables = Database['public']['Tables']

// ── Discussions ───────────────────────────────────────────────────

export async function listDiscussions(courseId: string) {
  const { data, error } = await supabase
    .from('discussions')
    .select('*, users!discussions_author_id_fkey(name,avatar), discussion_replies(id)')
    .eq('course_id', courseId)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getDiscussion(id: string) {
  const { data, error } = await supabase
    .from('discussions')
    .select('*, users!discussions_author_id_fkey(name,avatar,email), courses(title,code)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createDiscussion(d: Tables['discussions']['Insert']) {
  const { data, error } = await supabase.from('discussions').insert(d).select().single()
  if (error) throw error
  return data
}

export async function updateDiscussion(id: string, patch: Partial<Tables['discussions']['Update']>) {
  const { data, error } = await supabase.from('discussions').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteDiscussion(id: string) {
  const { error } = await supabase.from('discussions').delete().eq('id', id)
  if (error) throw error
}

export async function pinDiscussion(id: string, pinned: boolean) {
  const { data, error } = await supabase.from('discussions').update({ pinned }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function lockDiscussion(id: string, locked: boolean) {
  const { data, error } = await supabase.from('discussions').update({ locked }).eq('id', id).select().single()
  if (error) throw error
  return data
}

// ── Discussion Replies ────────────────────────────────────────────

export async function listReplies(discussionId: string) {
  const { data, error } = await supabase
    .from('discussion_replies')
    .select('*, users(name,avatar)')
    .eq('discussion_id', discussionId)
    .order('created_at')
  if (error) throw error
  return data
}

export async function createReply(reply: Tables['discussion_replies']['Insert']) {
  const { data, error } = await supabase.from('discussion_replies').insert(reply).select().single()
  if (error) throw error
  return data
}

export async function updateReply(id: string, patch: Partial<Tables['discussion_replies']['Update']>) {
  const { data, error } = await supabase.from('discussion_replies').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteReply(id: string) {
  const { error } = await supabase.from('discussion_replies').delete().eq('id', id)
  if (error) throw error
}

export async function likeReply(id: string) {
  const { data: current, error: e1 } = await supabase
    .from('discussion_replies')
    .select('likes')
    .eq('id', id)
    .single()
  if (e1) throw e1

  const { data, error } = await supabase
    .from('discussion_replies')
    .update({ likes: (current.likes ?? 0) + 1 })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
