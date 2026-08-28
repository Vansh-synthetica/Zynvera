'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, AlertCircle, Building2, Plus, Pencil, Trash2 } from 'lucide-react'
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
import {
  listDepartments,
  upsertDepartment,
  deleteDepartment,
} from '@/lib/api/institution'
import { listUsers } from '@/lib/api/students'
import { useWorkspace } from '@/lib/workspace-context'

type DeptRow = {
  id: string
  name: string
  code: string | null
  budget: number | null
  description: string | null
  status: string
  users?: { name?: string }
}

type FormState = {
  id?: string
  name: string
  code: string
  head_id: string
  budget: string
  description: string
}

const EMPTY: FormState = { name: '', code: '', head_id: 'none', budget: '', description: '' }

export default function PrincipalDepartmentsPage() {
  const { institutionId } = useWorkspace()

  const [rows, setRows] = useState<DeptRow[]>([])
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [busy, setBusy] = useState(false)

  // delete confirm
  const [delTarget, setDelTarget] = useState<DeptRow | null>(null)
  const [delBusy, setDelBusy] = useState(false)

  const load = useCallback(async () => {
    if (!institutionId) return
    try {
      setLoading(true)
      setError('')
      const [depts, staff] = await Promise.all([
        listDepartments(institutionId),
        listUsers(institutionId, 'teacher').catch(() => []),
      ])
      setRows((depts as any[]) ?? [])
      setTeachers((staff as any[]).map(t => ({ id: t.id, name: t.name })))
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load departments')
    } finally {
      setLoading(false)
    }
  }, [institutionId])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = async () => {
    if (!institutionId || !form.name.trim()) return
    setBusy(true)
    setError('')
    try {
      await upsertDepartment({
        ...(form.id ? { id: form.id } : {}),
        institution_id: institutionId,
        name: form.name.trim(),
        code: form.code.trim() || null,
        head_id: form.head_id === 'none' ? null : form.head_id,
        budget: form.budget ? parseFloat(form.budget) : null,
        description: form.description.trim() || null,
      })
      setFormOpen(false)
      load()
    } catch (e: any) {
      setError(e?.message ?? 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!delTarget) return
    setDelBusy(true)
    try {
      await deleteDepartment(delTarget.id)
      setDelTarget(null)
      load()
    } catch (e: any) {
      setError(e?.message ?? 'Delete failed')
    } finally {
      setDelBusy(false)
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Departments</h1>
            <p className="text-sm text-muted-foreground">{rows.length} active</p>
          </div>
          <Button onClick={() => { setForm(EMPTY); setFormOpen(true) }} className="gap-1">
            <Plus className="size-4" /> New Department
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin mr-2" /> Loading…
          </div>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center space-y-2">
              <Building2 className="size-7 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">No departments yet</p>
              <p className="text-sm text-muted-foreground">Create your first department to organise staff.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {rows.map(d => (
              <Card key={d.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold truncate">{d.name}</h3>
                      {d.users?.name && (
                        <p className="text-xs text-muted-foreground mt-0.5">Head: {d.users.name}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-0.5">
                      <Button variant="ghost" size="sm" className="size-7 p-0"
                        onClick={() => {
                          setForm({
                            id: d.id,
                            name: d.name,
                            code: d.code ?? '',
                            head_id: 'none',
                            budget: d.budget ? String(d.budget) : '',
                            description: d.description ?? '',
                          })
                          setFormOpen(true)
                        }}
                        aria-label={`Edit ${d.name}`}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="size-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setDelTarget(d)} aria-label={`Delete ${d.name}`}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  {d.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5">{d.description}</p>
                  )}

                  <div className="flex items-center gap-2 mt-3">
                    {d.code && <Badge variant="outline" className="text-[11px]">{d.code}</Badge>}
                    {d.budget !== null && (
                      <Badge variant="secondary" className="text-[11px]">
                        ${Number(d.budget).toLocaleString()}
                      </Badge>
                    )}
                    <Badge variant={d.status === 'active' ? 'default' : 'secondary'} className="ml-auto text-[11px] capitalize">
                      {d.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Form dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit Department' : 'New Department'}</DialogTitle>
            <DialogDescription>Organise staff and budgets by department.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <Label htmlFor="d-name">Name *</Label>
                <Input id="d-name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Sciences" />
              </div>
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <Label htmlFor="d-code">Code</Label>
                <Input id="d-code" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="SCI" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Head of department</Label>
              <Select value={form.head_id} onValueChange={v => setForm(p => ({ ...p, head_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {teachers.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="d-budget">Annual budget (USD)</Label>
              <Input id="d-budget" type="number" min={0} value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} placeholder="50000" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="d-desc">Description</Label>
              <Textarea id="d-desc" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={handleSave} disabled={busy || !form.name.trim()} className="gap-1">
              {busy && <Loader2 className="size-4 animate-spin" />}
              {form.id ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={delTarget !== null} onOpenChange={o => !o && setDelTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete department?</DialogTitle>
            <DialogDescription>&quot;{delTarget?.name}&quot; will be permanently removed.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelTarget(null)} disabled={delBusy}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={delBusy} className="gap-1">
              {delBusy && <Loader2 className="size-4 animate-spin" />} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
