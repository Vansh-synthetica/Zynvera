import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// ── Fee structures ────────────────────────────────────────────────

export async function listFeeStructures(institutionId: string) {
  const { data, error } = await supabase
    .from('fee_structures')
    .select('*')
    .eq('institution_id', institutionId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createFeeStructure(input: {
  institution_id: string
  name: string
  amount: number
  frequency?: string
}) {
  const { data, error } = await supabase.from('fee_structures').insert(input).select().single()
  if (error) throw error
  return data
}

// ── Invoices ──────────────────────────────────────────────────────

export async function listInvoices(institutionId: string) {
  const { data, error } = await supabase
    .from('fee_invoices')
    .select('*, users!fee_invoices_student_user_id_fkey(name, email)')
    .eq('institution_id', institutionId)
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) throw error
  return data as any[]
}

export async function generateInvoices(structureId: string, dueDate?: string | null, title?: string | null): Promise<number> {
  const { data, error } = await supabase.rpc('generate_fee_invoices', {
    p_structure_id: structureId,
    p_due_date: dueDate || null,
    p_title: title || null,
  })
  if (error) throw error
  return Number(data ?? 0)
}

export async function recordPayment(
  invoiceId: string,
  amount: number,
  method = 'cash',
  note?: string | null,
): Promise<'paid' | 'partial'> {
  const { data, error } = await supabase.rpc('record_fee_payment', {
    p_invoice_id: invoiceId,
    p_amount: amount,
    p_method: method,
    p_paid_on: new Date().toISOString().slice(0, 10),
    p_note: note || null,
  })
  if (error) throw error
  return (data as 'paid' | 'partial') ?? 'partial'
}

// ── Payroll ───────────────────────────────────────────────────────

export async function listStaffSalaries(institutionId: string) {
  const { data, error } = await supabase
    .from('staff_salaries')
    .select('*, users!staff_salaries_staff_user_id_fkey(name, email, role)')
    .eq('institution_id', institutionId)
    .eq('active', true)
  if (error) throw error
  return data as any[]
}

export async function setStaffSalary(staffUserId: string, institutionId: string, monthlyAmount: number) {
  const { data, error } = await supabase
    .from('staff_salaries')
    .upsert(
      { staff_user_id: staffUserId, institution_id: institutionId, monthly_amount: monthlyAmount, active: true },
      { onConflict: 'staff_user_id' },
    )
    .select()
    .single()
  if (error) throw error
  return data
}

export async function runPayroll(month: string): Promise<string> {
  const { data, error } = await supabase.rpc('run_payroll', { p_month: month })
  if (error) throw error
  return String(data)
}

export async function markPayrollPaid(runId: string): Promise<number> {
  const { data, error } = await supabase.rpc('pay_payroll', { p_run_id: runId })
  if (error) throw error
  return Number(data ?? 0)
}

export async function listPayrollRuns(institutionId: string) {
  const { data, error } = await supabase
    .from('payroll_runs')
    .select('*')
    .eq('institution_id', institutionId)
    .order('month', { ascending: false })
  if (error) throw error
  return data as any[]
}
