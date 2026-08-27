'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, AlertCircle, Receipt, Wallet, TrendingDown, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

type Invoice = {
  id: string
  title: string
  amount: number | string
  status: 'unpaid' | 'partial' | 'paid' | 'waived'
  due_date: string | null
  created_at: string
  fee_payments: Array<{ amount: number | string; method: string; paid_on: string }>
}

/**
 * THE shared fee board. Renders the exact same data for a student (own view)
 * and for a parent (child view) — RLS decides visibility, this component only
 * formats. Used by /student/fees and the parent child page.
 */
export function FeeStatus({ studentUserId }: { studentUserId: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!studentUserId) return
    try {
      setLoading(true)
      setError('')
      const supabase = createClient()
      const { data, error } = await supabase
        .from('fee_invoices')
        .select('id, title, amount, status, due_date, created_at, fee_payments(amount, method, paid_on)')
        .eq('student_user_id', studentUserId)
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) throw error
      setInvoices((data ?? []) as any[])
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load fees')
    } finally {
      setLoading(false)
    }
  }, [studentUserId])

  useEffect(() => {
    load()
  }, [load])

  const money = (n: number) =>
    `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`

  const totals = invoices.reduce(
    (acc, inv) => {
      const paid = (inv.fee_payments ?? []).reduce((s, p) => s + Number(p.amount), 0)
      acc.billed += Number(inv.amount)
      acc.paid += Math.min(paid, Number(inv.amount))
      if (inv.status !== 'paid' && inv.status !== 'waived') acc.outstanding += Number(inv.amount) - paid
      return acc
    },
    { billed: 0, paid: 0, outstanding: 0 },
  )

  const fmtDate = (d: string | null) =>
    d ? new Date(d + (d.length === 10 ? 'T00:00:00' : '')).toLocaleDateString() : '—'

  const badgeFor = (s: Invoice['status']) => {
    switch (s) {
      case 'paid': return <Badge className="bg-green-100 text-green-700 shrink-0">Paid</Badge>
      case 'partial': return <Badge className="bg-amber-100 text-amber-700 shrink-0">Partial</Badge>
      case 'waived': return <Badge variant="secondary" className="shrink-0">Waived</Badge>
      default: return <Badge variant="destructive" className="shrink-0">Unpaid</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-14 text-muted-foreground">
        <Loader2 className="size-4 animate-spin mr-2" /> Loading fees…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
        <AlertCircle className="size-4 shrink-0" /> {error}
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-1.5">
          <Receipt className="size-7 mx-auto text-muted-foreground" />
          <p className="text-sm font-medium">No fee invoices</p>
          <p className="text-xs text-muted-foreground">
            When the school raises a fee invoice it will appear here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Wallet className="size-3" /> Billed</p>
          <p className="text-lg font-bold mt-1">{money(totals.billed)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="size-3" /> Paid</p>
          <p className="text-lg font-bold mt-1 text-green-600">{money(totals.paid)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingDown className="size-3" /> Due</p>
          <p className={`text-lg font-bold mt-1 ${totals.outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {money(Math.max(0, totals.outstanding))}
          </p>
        </CardContent></Card>
      </div>

      {/* Invoices */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {invoices.map(inv => {
              const pays = inv.fee_payments ?? []
              const paidSum = pays.reduce((s, p) => s + Number(p.amount), 0)
              return (
                <details key={inv.id} className="group">
                  <summary className="flex items-center gap-3 px-4 py-3 text-sm cursor-pointer hover:bg-muted/40 list-none">
                    {badgeFor(inv.status)}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{inv.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Due {fmtDate(inv.due_date)}
                        {inv.status !== 'paid' && paidSum > 0 ? ` · ${money(paidSum)} received` : ''}
                      </p>
                    </div>
                    <span className={`font-semibold shrink-0 ${inv.status === 'paid' ? 'text-green-600' : ''}`}>
                      {money(Number(inv.amount))}
                    </span>
                  </summary>
                  {pays.length > 0 && (
                    <div className="px-4 pb-3 pl-12 space-y-1.5">
                      {pays.map((p, i) => (
                        <div key={i} className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{fmtDate(p.paid_on)} · {p.method}</span>
                          <span className="text-green-600 font-medium">+{money(Number(p.amount))}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </details>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
