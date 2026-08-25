import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

const supabase = createClient()
type Tables = Database['public']['Tables']

// ── Messages ──────────────────────────────────────────────────────

export async function getConversations(userId: string) {
  const { data: sent, error: e1 } = await supabase
    .from('messages')
    .select('id, content, created_at, read, recipient_id, users!messages_recipient_id_fkey(name,avatar)')
    .eq('sender_id', userId)
    .order('created_at', { ascending: false })
  if (e1) throw e1

  const { data: received, error: e2 } = await supabase
    .from('messages')
    .select('id, content, created_at, read, sender_id, users!messages_sender_id_fkey(name,avatar)')
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
  if (e2) throw e2

  const all = [...(sent || []), ...(received || [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const conversationMap = new Map<string, any>()
  all.forEach(msg => {
    const otherId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id
    if (!conversationMap.has(otherId)) {
      conversationMap.set(otherId, {
        otherUserId: otherId,
        otherUser: msg.users,
        lastMessage: msg.content,
        lastMessageAt: msg.created_at,
        unread: !msg.read && msg.sender_id !== userId,
      })
    }
  })

  return Array.from(conversationMap.values())
}

export async function getConversation(userId: string, otherUserId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*, users!messages_sender_id_fkey(name,avatar)')
    .or(
      `and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`
    )
    .order('created_at')
  if (error) throw error
  return data
}

export async function sendMessage(msg: Tables['messages']['Insert']) {
  const { data, error } = await supabase.from('messages').insert(msg).select().single()
  if (error) throw error
  return data
}

export async function markAsRead(senderId: string, recipientId: string) {
  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('sender_id', senderId)
    .eq('recipient_id', recipientId)
    .eq('read', false)
  if (error) throw error
}

export async function getUnreadCount(userId: string) {
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .eq('read', false)
  if (error) throw error
  return count ?? 0
}

export async function deleteMessage(id: string) {
  const { error } = await supabase.from('messages').delete().eq('id', id)
  if (error) throw error
}
