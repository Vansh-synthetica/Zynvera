import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

const supabase = createClient()
type Tables = Database['public']['Tables']

// ── Notifications ─────────────────────────────────────────────────

export async function listNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data
}

export async function getUnreadCount(userId: string) {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)
  if (error) throw error
  return count ?? 0
}

export async function createNotification(n: Tables['notifications']['Insert']) {
  const { data, error } = await supabase.from('notifications').insert(n).select().single()
  if (error) throw error
  return data
}

export async function markAsRead(id: string) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function markAllAsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)
  if (error) throw error
}

export async function deleteNotification(id: string) {
  const { error } = await supabase.from('notifications').delete().eq('id', id)
  if (error) throw error
}

export async function clearAll(userId: string) {
  const { error } = await supabase.from('notifications').delete().eq('user_id', userId)
  if (error) throw error
}

// ── Bulk create for system events ─────────────────────────────────

export async function notifyUsers(
  userIds: string[],
  notification: Omit<Tables['notifications']['Insert'], 'user_id'>
) {
  const notifications = userIds.map(user_id => ({ ...notification, user_id }))
  const { data, error } = await supabase.from('notifications').insert(notifications).select()
  if (error) throw error
  return data
}

export async function notifyCourseStudents(
  courseId: string,
  notification: Omit<Tables['notifications']['Insert'], 'user_id'>
) {
  const { data: enrollments, error: e1 } = await supabase
    .from('course_enrolments')
    .select('user_id')
    .eq('course_id', courseId)
    .eq('status', 'active')
  if (e1) throw e1

  const userIds = enrollments.map(e => e.user_id)
  if (!userIds.length) return []

  return notifyUsers(userIds, notification)
}
