import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

const supabase = createClient()
type Tables = Database['public']['Tables']

// ── Class Sections ────────────────────────────────────────────────

export async function listClassSections(courseId: string) {
  const { data, error } = await supabase
    .from('class_sections')
    .select('*')
    .eq('course_id', courseId)
    .order('day')
  if (error) throw error
  return data
}

export async function getClassSection(id: string) {
  const { data, error } = await supabase
    .from('class_sections')
    .select('*, courses(title,code,teacher_id)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createClassSection(cs: Tables['class_sections']['Insert']) {
  const { data, error } = await supabase.from('class_sections').insert(cs).select().single()
  if (error) throw error
  return data
}

export async function updateClassSection(id: string, patch: Tables['class_sections']['Update']) {
  const { data, error } = await supabase.from('class_sections').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteClassSection(id: string) {
  const { error } = await supabase.from('class_sections').delete().eq('id', id)
  if (error) throw error
}

// ── Teacher's Schedule ────────────────────────────────────────────

export async function getTeacherSchedule(teacherId: string) {
  const { data: courses, error: e1 } = await supabase
    .from('courses')
    .select('id')
    .eq('teacher_id', teacherId)
    .eq('status', 'active')
  if (e1) throw e1

  const courseIds = courses.map(c => c.id)
  if (!courseIds.length) return []

  const { data, error } = await supabase
    .from('class_sections')
    .select('*, courses(title,code,color)')
    .in('course_id', courseIds)
    .order('day')
  if (error) throw error
  return data
}

// ── Timetable Slots ───────────────────────────────────────────────

export async function listTimetableSlots(userId: string) {
  const { data, error } = await supabase
    .from('timetable_slots')
    .select('*, courses(title,code,color)')
    .eq('user_id', userId)
    .order('day')
  if (error) throw error
  return data
}

export async function createTimetableSlot(slot: Tables['timetable_slots']['Insert']) {
  const { data, error } = await supabase.from('timetable_slots').insert(slot).select().single()
  if (error) throw error
  return data
}

export async function deleteTimetableSlot(id: string) {
  const { error } = await supabase.from('timetable_slots').delete().eq('id', id)
  if (error) throw error
}

// ── Calendar Events ───────────────────────────────────────────────

export async function listCalendarEvents(institutionId: string, userId?: string) {
  let q = supabase
    .from('calendar_events')
    .select('*')
    .eq('institution_id', institutionId)
  if (userId) q = q.or(`user_id.is.null,user_id.eq.${userId}`)
  const { data, error } = await q.order('date')
  if (error) throw error
  return data
}

export async function createCalendarEvent(event: Tables['calendar_events']['Insert']) {
  const { data, error } = await supabase.from('calendar_events').insert(event).select().single()
  if (error) throw error
  return data
}

export async function deleteCalendarEvent(id: string) {
  const { error } = await supabase.from('calendar_events').delete().eq('id', id)
  if (error) throw error
}

// ── Meetings ──────────────────────────────────────────────────────

export async function listMeetings(userId: string) {
  const { data: attendees, error: e1 } = await supabase
    .from('meeting_attendees')
    .select('meeting_id')
    .eq('user_id', userId)
  if (e1) throw e1

  const ids = attendees.map(a => a.meeting_id)
  if (!ids.length) return []

  const { data, error } = await supabase
    .from('meetings')
    .select('*, users!meetings_host_id_fkey(name,avatar), meeting_attendees(user_id,status)')
    .in('id', ids)
    .order('scheduled_at')
  if (error) throw error
  return data
}

export async function createMeeting(m: Tables['meetings']['Insert']) {
  const { data, error } = await supabase.from('meetings').insert(m).select().single()
  if (error) throw error
  return data
}

export async function updateMeeting(id: string, patch: Tables['meetings']['Update']) {
  const { data, error } = await supabase.from('meetings').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteMeeting(id: string) {
  const { error } = await supabase.from('meetings').delete().eq('id', id)
  if (error) throw error
}

export async function addMeetingAttendee(attendee: Tables['meeting_attendees']['Insert']) {
  const { data, error } = await supabase.from('meeting_attendees').insert(attendee).select().single()
  if (error) throw error
  return data
}

export async function removeMeetingAttendee(meetingId: string, userId: string) {
  const { error } = await supabase
    .from('meeting_attendees')
    .delete()
    .eq('meeting_id', meetingId)
    .eq('user_id', userId)
  if (error) throw error
}
