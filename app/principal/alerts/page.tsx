'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Loader2,
  AlertTriangle,
  Info,
  ShieldAlert,
  CheckCircle2,
  Plus,
  BellRing,
  AlertCircle,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { listAlerts, createAlert, setAlertStatus, type AlertRow } from '@/lib/api/institution'
import { useWorkspace } from '@/lib/workspace-context'

const severityStyle: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
}

export default function PrincipalAlertsPage() {
  const { institutionId, userId, role } = useWorkspace()
  const canManage = role === 'principal' || role === 'admin' || role === 'super_admin'

  const [rows, setRows] = useState<AlertRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('open')

  // create dialog
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [severity, setSeverity] = useState('warning')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!institutionId) return
    try {
      setLoading(true)
      setError('')
      setRows(await listAlerts(institutionId))
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }, [institutionId])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async () => {
    if (!institutionId || !title.trim() || !message.trim()) return
    setBusy(true)
    try {
      await createAlert({
        institution_id: institutionId,
        title: title.trim(),
        message: message.trim(),
        severity: severity as any,
        created_by: userId ?? null,
      })
      setOpen(false)
      setTitle('')
      setMessage('')
      setSeverity('warning')
      load()
    } catch (e: any) {
      setError(e?.message ?? 'Create failed')
    } finally {
      setBusy(false)
    }
  }

  const handleStatus = async (id: string, status: 'acknowledged' | 'resolved') => {
    if (!canManage) return
    try {
      const updated = await setAlertStatus(id, status, userId ?? undefined)
      setRows(prev => prev.map(r => (r.id === id ? updated : r)))
    } catch (e: any) {
      setError(e?.message ?? 'Update failed')
    }
  }

  const filtered = rows.filter(r => filter === 'all' || r.status === filter)
  const openCount = rows.filter(r => r.status === 'open').length

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Alerts</h1>
            <p className="text-sm text-muted-foreground">
              {openCount > 0 ? `${openCount} open alert${openCount === 1 ? '' : 's'}` : 'All clear'}
            </p>
          </div>
          <Button onClick={() => setOpen(true)} className="gap-1">
            <Plus className="size-4" /> Raise Alert
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-1.5">
          {[['open', 'Open'], ['acknowledged', 'Acknowledged'], ['resolved', 'Resolved'], ['all', 'All']].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                filter === v ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="size-5 animate-spin mr-2" /> Loading alerts…
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center space-y-2">
              <BellRing className="size-7 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">No alerts in this view</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(a => {
              const Icon = a.severity === 'critical' ? ShieldAlert : a.severity === 'warning' ? AlertTriangle : Info
              return (
                <Card key={a.id} className={a.severity === 'critical' && a.status === 'open' ? 'border-red-300 dark:border-red-900' : ''}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Icon className={`size-4 shrink-0 ${a.severity === 'critical' ? 'text-red-500' : a.severity === 'warning' ? 'text-amber-500' : 'text-blue-500'}`} />
                      <h3 className="text-sm font-semibold flex-1 min-w-[200px]">{a.title}</h3>
                      <Badge className={severityStyle[a.severity]}>{a.severity}</Badge>
                      <Badge variant={a.status === 'resolved' ? 'default' : 'secondary'} className="capitalize">{a.status}</Badge>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{a.message}</p>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] text-muted-foreground">
                        {a.source ?? 'system'} · {new Date(a.created_at).toLocaleString()}
                      </span>
                      {canManage && a.status !== 'resolved' && (
                        <div className="flex gap-1.5 print:hidden">
                          {a.status === 'open' && (
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleStatus(a.id, 'acknowledged')}>
                              Acknowledge
                            </Button>
                          )}
                          <Button size="sm" className="h-7 text-xs gap-1" onClick={() => handleStatus(a.id, 'resolved')}>
                            <CheckCircle2 className="size-3" /> Resolve
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Raise an alert</DialogTitle>
            <DialogDescription>Visible to all staff in your institution.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="al-title">Title</Label>
              <Input id="al-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Short summary…" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="al-msg">Details</Label>
              <Textarea id="al-msg" rows={4} value={message} onChange={e => setMessage(e.target.value)} />
            </div>
            <div className="space-y-1 w-40">
              <Label>Severity</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={handleCreate} disabled={busy || !title.trim() || !message.trim()} className="gap-1">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Raise
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
