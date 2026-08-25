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
import {
  listTransactions,
  createTransaction,
  deleteTransaction,
  listBudgets,
  upsertBudget,
} from '@/lib/api/institution'
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
  }, [load])

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
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="size-3 text-green-500" /> Income</p>
            <p className="text-xl font-bold text-green-600 mt-1">{fmtMoney(totals.income)}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingDown className="size-3 text-red-500" /> Expenses</p>
            <p className="text-xl font-bold text-red-600 mt-1">{fmtMoney(totals.expense)}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Wallet className="size-3" /> Net</p>
            <p className={`text-xl font-bold mt-1 ${totals.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmtMoney(totals.net)}</p>
          </CardContent></Card>
        </div>

        <Tabs defaultValue="transactions">
          <TabsList>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="budgets">Budgets</TabsTrigger>
          </TabsList>

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
