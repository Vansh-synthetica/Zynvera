import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

const supabase = createClient()
type Tables = Database['public']['Tables']

// ── Departments ──────────────────────────────────────────────────

export async function listDepartments(institutionId: string) {
  const { data, error } = await supabase
    .from('departments')
    .select('*, users(name, email)')
    .eq('institution_id', institutionId)
    .order('name')
  if (error) throw error
  return data
}

export async function upsertDepartment(row: Partial<Tables['departments']['Insert']> & { institution_id: string; name: string }) {
  const { data, error } = await supabase
    .from('departments')
    .upsert(row as any, { onConflict: 'id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteDepartment(id: string) {
  const { error } = await supabase.from('departments').delete().eq('id', id)
  if (error) throw error
}

// ── Finance ──────────────────────────────────────────────────────

export type TxRow = {
  id: string
  type: 'income' | 'expense'
  category: string
  amount: number
  description: string | null
  tx_date: string
}

export async function listTransactions(institutionId: string) {
  const { data, error } = await supabase
    .from('finance_transactions')
    .select('*')
    .eq('institution_id', institutionId)
    .order('tx_date', { ascending: false })
    .limit(200)
  if (error) throw error
  return data as TxRow[]
}

export async function createTransaction(tx: {
  institution_id: string
  type: 'income' | 'expense'
  category: string
  amount: number
  description?: string | null
  tx_date?: string
}) {
  const { data, error } = await supabase.from('finance_transactions').insert(tx).select().single()
  if (error) throw error
  return data as TxRow
}

export async function deleteTransaction(id: string) {
  const { error } = await supabase.from('finance_transactions').delete().eq('id', id)
  if (error) throw error
}

export async function listBudgets(institutionId: string, fiscalYear?: string) {
  let q = supabase.from('finance_budgets').select('*').eq('institution_id', institutionId)
  if (fiscalYear) q = q.eq('fiscal_year', fiscalYear)
  const { data, error } = await q.order('category')
  if (error) throw error
  return data
}

export async function upsertBudget(row: {
  institution_id: string
  category: string
  fiscal_year: string
  budgeted_amount: number
}) {
  const { data, error } = await supabase
    .from('finance_budgets')
    .upsert(row, { onConflict: 'institution_id,category,fiscal_year' })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Alerts ───────────────────────────────────────────────────────

export type AlertRow = {
  id: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  source: string | null
  status: 'open' | 'acknowledged' | 'resolved'
  created_at: string
  users?: { name?: string }
}

export async function listAlerts(institutionId: string) {
  const { data, error } = await supabase
    .from('institution_alerts')
    .select('*')
    .eq('institution_id', institutionId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return data as AlertRow[]
}

export async function createAlert(a: {
  institution_id: string
  title: string
  message: string
  severity?: AlertRow['severity']
  source?: string
  created_by?: string | null
}) {
  const { data, error } = await supabase.from('institution_alerts').insert(a).select().single()
  if (error) throw error
  return data as AlertRow
}

export async function setAlertStatus(
  id: string,
  status: 'open' | 'acknowledged' | 'resolved',
  userId?: string,
) {
  const patch: any = { status }
  if (status === 'acknowledged') patch.acknowledged_at = new Date().toISOString()
  if (status === 'resolved') {
    patch.resolved_at = new Date().toISOString()
    if (userId) patch.resolved_by = userId
  }
  const { data, error } = await supabase.from('institution_alerts').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data as AlertRow
}

// ── Parent links ─────────────────────────────────────────────────

export async function listParentLinks(institutionId: string) {
  // Parents and their linked students.
  const { data, error } = await supabase
    .from('parent_links')
    .select(`
      id,
      relationship,
      parent_user_id,
      student_user_id,
      users!parent_links_parent_user_id_fkey(id, name, email, phone),
      student:users!parent_links_student_user_id_fkey(id, name, email)
    `)
    .eq('institution_id', institutionId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function linkParent(input: {
  institution_id: string
  parent_user_id: string
  student_user_id: string
  relationship?: string
  /** Principals linking manually pass 'approved'; parent requests stay 'pending'. */
  status?: 'pending' | 'approved'
}) {
  const { data, error } = await supabase
    .from('parent_links')
    .upsert(
      { ...input, approved_at: input.status === 'approved' ? new Date().toISOString() : undefined },
      { onConflict: 'parent_user_id,student_user_id', ignoreDuplicates: false },
    )
    .select()
    .single()
  if (error) throw error
  return data
}

export async function unlinkParent(id: string) {
  const { error } = await supabase.from('parent_links').delete().eq('id', id)
  if (error) throw error
}

/** Children of the signed-in parent — approved links only surface data via RLS,
 *  but we return all own requests so the UI can show pending state too. */
export async function getMyChildren(parentUserId: string) {
  const { data, error } = await supabase
    .from('parent_links')
    .select(`
      id,
      relationship,
      status,
      requested_at,
      student_user_id,
      users!parent_links_student_user_id_fkey(id, name, email)
    `)
    .eq('parent_user_id', parentUserId)
    .order('requested_at', { ascending: false })
  if (error) throw error
  return data
}

/**
 * Parent requests access to a child.
 * Verifies the family code server-side pattern: student row must match
 * BOTH the identifier (email or user id) AND the code before linking.
 */
export async function requestChildLink(input: {
  parentUserId: string
  childIdentifier: string
  familyCode: string
  relationship?: string
}) {
  const ident = input.childIdentifier.trim().toLowerCase()
  const isUuid = /^[0-9a-f-]{36}$/i.test(ident)

  // Look up the student by email or id.
  let query = supabase.from('users').select('id, role, family_code').eq('role', 'student')
  query = isUuid ? query.eq('id', ident) : query.eq('email', ident)
  const { data: student, error: findError } = await query.maybeSingle()
  if (findError) throw findError
  if (!student) throw new Error('No student found with that email/ID.')

  if (!student.family_code || student.family_code.toUpperCase() !== input.familyCode.trim().toUpperCase()) {
    throw new Error('Family code does not match this student.')
  }

  // Institution for the link row comes from the student's profile.
  const { data: full } = await supabase
    .from('users')
    .select('institution_id')
    .eq('id', student.id)
    .single()

  const { data, error } = await supabase
    .from('parent_links')
    .upsert(
      {
        institution_id: full?.institution_id as any,
        parent_user_id: input.parentUserId,
        student_user_id: student.id,
        relationship: input.relationship ?? 'guardian',
        status: 'pending',
        requested_at: new Date().toISOString(),
      },
      { onConflict: 'parent_user_id,student_user_id' },
    )
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Principal-side link management ───────────────────────────────

export async function listAllParentLinks(institutionId: string) {
  const { data, error } = await supabase
    .from('parent_links')
    .select(`
      id,
      relationship,
      status,
      requested_at,
      approved_at,
      users!parent_links_parent_user_id_fkey(id, name, email),
      student:users!parent_links_student_user_id_fkey(id, name, email)
    `)
    .eq('institution_id', institutionId)
    .order('requested_at', { ascending: false })
  if (error) throw error
  return data
}

export async function setLinkStatus(id: string, status: 'approved' | 'rejected' | 'pending', approverId?: string) {
  const patch: any = { status }
  if (status === 'approved') {
    patch.approved_at = new Date().toISOString()
    if (approverId) patch.approved_by = approverId
  }
  const { data, error } = await supabase
    .from('parent_links')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
