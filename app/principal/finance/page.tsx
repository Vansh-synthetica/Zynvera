'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, AlertCircle, Plus, Trash2, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { listUsers } from '@/lib/api/students'
import {
  listTransactions,
  createTransaction,
  deleteTransaction,
  listBudgets,
  upsertBudget,
} from '@/lib/api/institution'
import {
  listFeeStructures,
  createFeeStructure,
  listInvoices,
  generateInvoices,
  recordPayment,
  listStaffSalaries,
  setStaffSalary,
  runPayroll,
  markPayrollPaid,
  listPayrollRuns,
} from '@/lib/api/fees'
import { useWorkspace } from '@/lib/workspace-context'

type TxRow = {
  id: string
  type: 'income' | 'expense'
  category: string
  amount: number
  description: string | null
  tx_date: string
}

const INCOME_CATEGORIES = ['Tuition', 'Fees', 'Donation', 'Grant', 'Other Income']
const EXPENSE_CATEGORIES = ['Salaries', 'Utilities', 'Supplies', 'Maintenance', 'Technology', 'Events', 'Other Expense']

export default function PrincipalFinancePage() {
  const { institutionId } = useWorkspace()

  const [txs, setTxs] = useState<TxRow[]>([])
  const [budgets, setBudgets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // add tx dialog
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'income' | 'expense'>('income')
  const [category, setCategory] = useState(INCOME_CATEGORIES[0])
  const [amount, setAmount] = useState('')
  const [desc, setDesc] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [busy, setBusy] = useState(false)

  // budget editor
  const [bCategory, setBCategory] = useState('')
  const [bYear, setBYear] = useState(String(new Date().getFullYear()))
  const [bAmount, setBAmount] = useState('')
  const [bBusy, setBBusy] = useState(false)

  // fees
  const [structures, setStructures] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [fsName, setFsName] = useState('')
  const [fsAmount, setFsAmount] = useState('')
  const [genStructureId, setGenStructureId] = useState('')
  const [genDue, setGenDue] = useState(() => new Date(Date.now() + 15 * 86_400_000).toISOString().slice(0, 10))
  const [feesBusy, setFeesBusy] = useState(false)
  const [feesMsg, setFeesMsg] = useState('')
  const [payOpen, setPayOpen] = useState(false)
  const [payInvoice, setPayInvoice] = useState<any>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('cash')

  // payroll
  const [salaries, setSalaries] = useState<any[]>([])
  const [staffList, setStaffList] = useState<any[]>([])
  const [salaryStaffId, setSalaryStaffId] = useState('')
  const [salaryDrafts, setSalaryDrafts] = useState<Record<string, string>>({})
  const [payrollMonth, setPayrollMonth] = useState(() => new Date().toISOString().slice(0, 7) + '-01')
  const [payrollRuns, setPayrollRuns] = useState<any[]>([])
  const [prBusy, setPrBusy] = useState(false)

  const loadFees = useCallback(async () => {
    if (!institutionId) return
    try {
      const [st, inv, sal, runs, staff] = await Promise.all([
        listFeeStructures(institutionId).catch(() => []),
        listInvoices(institutionId).catch(() => []),
        listStaffSalaries(institutionId).catch(() => []),
        listPayrollRuns(institutionId).catch(() => []),
        listUsers(institutionId).then((us: any[]) =>
          us.filter(u => ['teacher', 'department_head', 'admin', 'counselor'].includes(u.role))
        ).catch(() => []),
      ])
      setStructures(st as any[])
      setInvoices(inv as any[])
      setSalaries(sal as any[])
      setPayrollRuns(runs as any[])
      setStaffList(staff as any[])
      setSalaryStaffId(prev => prev || (staff as any[])[0]?.id || '')
    } catch { /* non-fatal */ }
  }, [institutionId])

  const load = useCallback(async () => {
    if (!institutionId) return
    try {
      setLoading(true)
      setError('')
      const [t, b] = await Promise.all([
        listTransactions(institutionId),
        listBudgets(institutionId).catch(() => []),
      ])
      setTxs(t)
      setBudgets(b as any[])
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load finance data')
    } finally {
      setLoading(false)
    }
  }, [institutionId])

  useEffect(() => {
    load()
    loadFees()
  }, [load, loadFees])

  const totals = useMemo(() => {
    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
    return { income, expense, net: income - expense }
  }, [txs])

  const handleAdd = async () => {
    if (!institutionId || !parseFloat(amount)) return
    setBusy(true)
    setError('')
    try {
      await createTransaction({
        institution_id: institutionId,
        type,
        category,
        amount: parseFloat(amount),
        description: desc.trim() || null,
        tx_date: date,
      })
      setOpen(false)
      setAmount('')
      setDesc('')
      load()
    } catch (e: any) {
      setError(e?.message ?? 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  const handleBudgetSave = async () => {
    if (!institutionId || !bCategory.trim() || !parseFloat(bAmount)) return
    setBBusy(true)
    setError('')
    try {
      await upsertBudget({
        institution_id: institutionId,
        category: bCategory.trim(),
        fiscal_year: bYear.trim() || String(new Date().getFullYear()),
        budgeted_amount: parseFloat(bAmount),
      })
      setBCategory('')
      setBAmount('')
      load()
    } catch (e: any) {
      setError(e?.message ?? 'Save failed')
    } finally {
      setBBusy(false)
    }
  }

  const fmtMoney = (n: number) => `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`

  // ── Fees handlers ─────────────────────────────────────────────
  const handleCreateStructure = async () => {
    if (!institutionId || !fsName.trim() || !parseFloat(fsAmount)) return
    setFeesBusy(true); setError('')
    try {
      const s = await createFeeStructure({
        institution_id: institutionId,
        name: fsName.trim(),
        amount: parseFloat(fsAmount),
        frequency: 'termly',
      })
      setFsName(''); setFsAmount('')
      setGenStructureId((s as any).id)
      await loadFees()
      setFeesMsg('Fee structure created. Select it and generate invoices.')
    } catch (e: any) { setError(e?.message ?? 'Failed') } finally { setFeesBusy(false) }
  }

  const handleGenerate = async () => {
    if (!genStructureId) return
    setFeesBusy(true); setError('')
    try {
      const n = await generateInvoices(genStructureId, genDue)
      await loadFees()
      setFeesMsg(n > 0 ? `${n} invoice${n === 1 ? '' : 's'} generated.` : 'Every student already has an invoice for this structure.')
    } catch (e: any) { setError(e?.message ?? 'Failed') } finally { setFeesBusy(false) }
  }

  const handleRecordPayment = async () => {
    if (!payInvoice || !parseFloat(payAmount)) return
    setFeesBusy(true); setError('')
    try {
      const status = await recordPayment(payInvoice.id, parseFloat(payAmount), payMethod)
      setPayOpen(false); setPayAmount('')
      await loadFees(); load()
      setFeesMsg(`Payment recorded — invoice is now ${status}. Ledger updated.`)
    } catch (e: any) { setError(e?.message ?? 'Failed') } finally { setFeesBusy(false) }
  }

  // ── Payroll handlers ──────────────────────────────────────────
  const handleSaveSalary = async (staffUserId: string) => {
    const v = parseFloat(salaryDrafts[staffUserId] ?? '')
    if (!institutionId || isNaN(v)) return
    setPrBusy(true); setError('')
    try {
      await setStaffSalary(staffUserId, institutionId, v)
      await loadFees()
      setSalaryDrafts(prev => ({ ...prev, [staffUserId]: '' }))
    } catch (e: any) { setError(e?.message ?? 'Failed') } finally { setPrBusy(false) }
  }

  const handleRunPayroll = async () => {
    if (!institutionId) return
    setPrBusy(true); setError('')
    try {
      await runPayroll(payrollMonth)
      await loadFees()
      setFeesMsg('Payroll run created. Review the total, then mark it paid to post to the ledger.')
    } catch (e: any) { setError(e?.message ?? 'Failed') } finally { setPrBusy(false) }
  }

  const handleMarkPaid = async (runId: string) => {
    setPrBusy(true); setError('')
    try {
      const total = await markPayrollPaid(runId)
      await loadFees(); load()
      setFeesMsg(`Payroll paid — ${fmtMoney(total)} posted as Salaries expense.`)
    } catch (e: any) { setError(e?.message ?? 'Failed') } finally { setPrBusy(false) }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Finance</h1>
            <p className="text-sm text-muted-foreground">Income, expenses and budgets</p>
          </div>
          <Button onClick={() => { setType('income'); setCategory(INCOME_CATEGORIES[0]); setOpen(true) }} className="gap-1">
            <Plus className="size-4" /> Record Transaction
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="size-3 text-green-500" /> Income</p>
            <p className="text-2xl font-semibold tracking-tight text-green-600 mt-1">{fmtMoney(totals.income)}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingDown className="size-3 text-red-500" /> Expenses</p>
            <p className="text-2xl font-semibold tracking-tight text-red-600 mt-1">{fmtMoney(totals.expense)}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Wallet className="size-3" /> Net</p>
            <p className={`text-2xl font-semibold tracking-tight mt-1 ${totals.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmtMoney(totals.net)}</p>
          </CardContent></Card>
        </div>

        <Tabs defaultValue="transactions">
          <TabsList>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="fees">Fees &amp; Dues</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
            <TabsTrigger value="budgets">Budgets</TabsTrigger>
          </TabsList>

          {/* Fees */}
          <TabsContent value="fees" className="space-y-3 pt-2">
            {feesMsg && (
              <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950 p-2.5 text-sm text-green-700 dark:text-green-400">
                {feesMsg}
              </div>
            )}

            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-medium">Fee structure</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <Input placeholder="Name e.g. Grade 12 Term Fees" value={fsName} onChange={e => setFsName(e.target.value)} />
                  <Input type="number" min={1} placeholder="Amount per student" value={fsAmount} onChange={e => setFsAmount(e.target.value)} />
                  <Button onClick={handleCreateStructure} disabled={feesBusy || !fsName.trim() || !parseFloat(fsAmount)}>
                    Create structure
                  </Button>
                </div>
                {structures.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <Select value={genStructureId} onValueChange={setGenStructureId}>
                      <SelectTrigger><SelectValue placeholder="Structure" /></SelectTrigger>
                      <SelectContent>
                        {structures.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name} · {fmtMoney(Number(s.amount))}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input type="date" value={genDue} onChange={e => setGenDue(e.target.value)} />
                    <Button onClick={handleGenerate} disabled={feesBusy || !genStructureId} className="col-span-2">
                      Generate invoices for all students
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                {invoices.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">No invoices yet — create a structure and generate.</p>
                ) : (
                  <div className="divide-y">
                    {invoices.map(inv => (
                      <div key={inv.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                        <Badge variant={inv.status === 'paid' ? 'default' : inv.status === 'partial' ? 'secondary' : 'destructive'}
                          className={inv.status === 'paid' ? 'bg-green-100 text-green-700 shrink-0' : inv.status === 'partial' ? 'bg-amber-100 text-amber-700 shrink-0' : 'shrink-0'}>
                          {inv.status}
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{inv.users?.name ?? 'Student'} · {inv.title}</p>
                          <p className="text-[11px] text-muted-foreground">Due {inv.due_date ?? '—'}</p>
                        </div>
                        <span className="font-semibold shrink-0">{fmtMoney(Number(inv.amount))}</span>
                        {inv.status !== 'paid' && inv.status !== 'waived' && (
                          <Button size="sm" variant="outline" className="shrink-0"
                            onClick={() => { setPayInvoice(inv); setPayAmount(String(inv.amount)); setPayMethod('cash'); setPayOpen(true) }}>
                            Record payment
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payroll */}
          <TabsContent value="payroll" className="space-y-3 pt-2">
            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-medium">Monthly staff salaries</p>
                {salaries.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No salaries set yet — staff appear here after you save an amount below.
                  </p>
                ) : (
                  <div className="divide-y rounded-lg border">
                    {salaries.map(s => (
                      <div key={s.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                        <span className="min-w-0 flex-1 truncate">{s.users?.name ?? s.staff_user_id}
                          <span className="text-[11px] text-muted-foreground ml-1 capitalize">({s.users?.role ?? ''})</span>
                        </span>
                        <span className="font-semibold">{fmtMoney(Number(s.monthly_amount))}/mo</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Select value={salaryStaffId} onValueChange={setSalaryStaffId}>
                    <SelectTrigger><SelectValue placeholder="Staff member" /></SelectTrigger>
                    <SelectContent>
                      {staffList.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name}<span className="text-muted-foreground"> · {u.role}</span></SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="number" min={0} placeholder="Monthly amount"
                    value={salaryStaffId ? (salaryDrafts[salaryStaffId] ?? '') : ''}
                    onChange={e => setSalaryDrafts(p => ({ ...p, [salaryStaffId]: e.target.value }))} />
                  <Button onClick={() => salaryStaffId && handleSaveSalary(salaryStaffId)}
                    disabled={prBusy || !salaryStaffId || !parseFloat(salaryDrafts[salaryStaffId] ?? '')} className="col-span-2">
                    Save salary
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-medium">Run payroll</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="date" value={payrollMonth}
                    onChange={e => setPayrollMonth(e.target.value)} />
                  <Button onClick={handleRunPayroll} disabled={prBusy}>Create run</Button>
                </div>
                {payrollRuns.map(r => (
                  <div key={r.id} className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm">
                    <Badge variant={r.status === 'paid' ? 'default' : 'secondary'}
                      className={r.status === 'paid' ? 'bg-green-100 text-green-700 shrink-0' : 'shrink-0'}>
                      {r.status}
                    </Badge>
                    <span className="flex-1">{new Date(r.month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                    <span className="font-semibold">{fmtMoney(Number(r.total_amount))}</span>
                    {r.status !== 'paid' && (
                      <Button size="sm" onClick={() => handleMarkPaid(r.id)} disabled={prBusy}>Mark paid</Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions */}
          <TabsContent value="transactions" className="pt-2">
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-14 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin mr-2" /> Loading…
                  </div>
                ) : txs.length === 0 ? (
                  <p className="py-14 text-center text-sm text-muted-foreground">No transactions recorded yet.</p>
                ) : (
                  <div className="divide-y">
                    {txs.map(t => (
                      <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                        <Badge variant={t.type === 'income' ? 'default' : 'secondary'}
                          className={t.type === 'income' ? 'bg-green-100 text-green-700 capitalize shrink-0' : 'bg-red-100 text-red-700 capitalize shrink-0'}>
                          {t.type}
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{t.category}{t.description ? ` · ${t.description}` : ''}</p>
                          <p className="text-[11px] text-muted-foreground">{t.tx_date}</p>
                        </div>
                        <span className={`font-semibold shrink-0 ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {t.type === 'income' ? '+' : '−'}{fmtMoney(Number(t.amount))}
                        </span>
                        <Button variant="ghost" size="sm" className="size-7 p-0 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={async () => { await deleteTransaction(t.id); load() }} aria-label="Delete">
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Budgets */}
          <TabsContent value="budgets" className="space-y-3 pt-2">
            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-medium">Set category budget</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Input placeholder="Category e.g. IT" value={bCategory} onChange={e => setBCategory(e.target.value)} />
                  <Input placeholder="FY e.g. 2026" value={bYear} onChange={e => setBYear(e.target.value)} />
                  <Input type="number" min={0} placeholder="Amount" value={bAmount} onChange={e => setBAmount(e.target.value)} />
                  <Button onClick={handleBudgetSave} disabled={bBusy || !bCategory.trim() || !parseFloat(bAmount)} className="gap-1">
                    {bBusy ? <Loader2 className="size-4 animate-spin" /> : null} Save Budget
                  </Button>
                </div>
              </CardContent>
            </Card>

            {budgets.length > 0 && (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {budgets.map(b => {
                      const spent = txs
                        .filter(t => t.type === 'expense' && t.category.toLowerCase() === b.category.toLowerCase())
                        .reduce((s, t) => s + Number(t.amount), 0)
                      const pct = b.budgeted_amount > 0 ? Math.min(100, Math.round((spent / Number(b.budgeted_amount)) * 100)) : 0
                      return (
                        <div key={b.id} className="px-4 py-3 space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{b.category} <span className="text-muted-foreground font-normal">· FY{b.fiscal_year}</span></span>
                            <span className="text-xs text-muted-foreground">
                              {fmtMoney(spent)} / {fmtMoney(Number(b.budgeted_amount))}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className={`h-full ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add transaction dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record transaction</DialogTitle>
            <DialogDescription>Logged against your institution.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={type} onValueChange={v => {
                  setType(v as any)
                  setCategory(v === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0])
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="f-amt">Amount (USD)</Label>
                <Input id="f-amt" type="number" min={0.01} step="0.01" value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="f-date">Date</Label>
                <Input id="f-date" type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="f-desc">Description</Label>
              <Input id="f-desc" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional note…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={handleAdd} disabled={busy || !parseFloat(amount)} className="gap-1">
              {busy && <Loader2 className="size-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
