'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Loader2,
  AlertCircle,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  UserPlus,
  Search,
  Trash2,
} from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  listAllParentLinks,
  setLinkStatus,
  linkParent,
} from '@/lib/api/institution'
import { listUsers } from '@/lib/api/students'
import { useWorkspace } from '@/lib/workspace-context'

type LinkRow = {
  id: string
  relationship: string
  status: string
  requested_at: string
  approved_at: string | null
  users: any
  student: any
}

export default function PrincipalParentsPage() {
  const { institutionId, userId } = useWorkspace()

  const [links, setLinks] = useState<LinkRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  // manual link dialog
  const [open, setOpen] = useState(false)
  const [parentsList, setParentsList] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [studentsList, setStudentsList] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [parentId, setParentId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [rel, setRel] = useState('guardian')
  const [busy, setBusy] = useState(false)
  const [pQuery, setPQuery] = useState('')
  const [sQuery, setSQuery] = useState('')

  const load = useCallback(async () => {
    if (!institutionId) return
    try {
      setLoading(true)
      setError('')
      setLinks(((await listAllParentLinks(institutionId)) as any[]) ?? [])
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load parent links')
    } finally {
      setLoading(false)
    }
  }, [institutionId])

  useEffect(() => {
    load()
  }, [load])

  const openManual = async () => {
    setOpen(true)
    setError('')
    try {
      const [p, s] = await Promise.all([
        listUsers(institutionId!, 'parent').catch(() => []),
        listUsers(institutionId!, 'student').catch(() => []),
      ])
      setParentsList(p as any[])
      setStudentsList(s as any[])
    } catch {
      /* lists stay empty */
    }
  }

  const handleApprove = async (row: LinkRow, status: 'approved' | 'rejected') => {
    setError('')
    try {
      const updated = await setLinkStatus(row.id, status, userId ?? undefined)
      setLinks(prev => prev.map(l => (l.id === row.id ? { ...l, ...updated } : l)))
    } catch (e: any) {
      setError(e?.message ?? 'Update failed')
    }
  }

  const handleRevoke = async (row: LinkRow) => {
    if (!confirm(`Remove ${row.users?.name}'s access to ${row.student?.name}?`)) return
    try {
      await setLinkStatus(row.id, 'rejected', userId ?? undefined)
      load()
    } catch (e: any) {
      setError(e?.message ?? 'Update failed')
    }
  }

  const handleManualCreate = async () => {
    if (!institutionId || !parentId || !studentId) return
    setBusy(true)
    setError('')
    try {
      await linkParent({
        institution_id: institutionId,
        parent_user_id: parentId,
        student_user_id: studentId,
        relationship: rel,
        status: 'approved',
      })
      setOpen(false)
      setParentId('')
      setStudentId('')
      load()
    } catch (e: any) {
      setError(e?.message ?? 'Link failed')
    } finally {
      setBusy(false)
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return links.filter(
      l =>
        l.users?.name?.toLowerCase().includes(q) ||
        l.student?.name?.toLowerCase().includes(q) ||
        l.users?.email?.toLowerCase().includes(q),
    )
  }, [links, search])

  const pending = filtered.filter(l => l.status === 'pending')
  const approved = filtered.filter(l => l.status === 'approved')
  const other = filtered.filter(l => l.status === 'rejected')

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Parent Management</h1>
            <p className="text-sm text-muted-foreground">
              Verify access requests — parents only ever see their own child
            </p>
          </div>
          <Button onClick={openManual} className="gap-1">
            <UserPlus className="size-4" /> Link Manually
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        <Input placeholder="Search parent or student…" value={search} onChange={e => setSearch(e.target.value)} />

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin mr-2" /> Loading…
          </div>
        ) : (
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
              <TabsTrigger value="declined">Declined ({other.length})</TabsTrigger>
            </TabsList>

            {(['pending', 'approved', 'declined'] as const).map(tabName => (
              <TabsContent key={tabName} value={tabName} className="space-y-2 pt-2">
                {(tabName === 'pending' ? pending : tabName === 'approved' ? approved : other).length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">None here.</p>
                ) : (
                  (tabName === 'pending' ? pending : tabName === 'approved' ? approved : other).map(row => (
                    <Card key={row.id}>
                      <CardContent className="px-4 py-3 flex flex-wrap items-center gap-3">
                        <Users className="size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {row.users?.name ?? 'Parent'}{' '}
                            <span className="text-muted-foreground font-normal">→</span>{' '}
                            {row.student?.name ?? 'Student'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {row.users?.email} · {row.relationship}
                            {row.requested_at && ` · ${new Date(row.requested_at).toLocaleDateString()}`}
                          </p>
                        </div>

                        {tabName === 'pending' && (
                          <div className="flex gap-1.5 shrink-0">
                            <Button size="sm" className="h-7 text-xs gap-1" onClick={() => handleApprove(row, 'approved')}>
                              <CheckCircle2 className="size-3" /> Approve
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => handleApprove(row, 'rejected')}>
                              <XCircle className="size-3" /> Decline
                            </Button>
                          </div>
                        )}
                        {tabName === 'approved' && (
                          <>
                            <Badge className="gap-1 bg-green-100 text-green-700 shrink-0"><CheckCircle2 className="size-3" /> Active</Badge>
                            <Button variant="ghost" size="sm" className="size-7 p-0 shrink-0 text-muted-foreground hover:text-destructive"
                              onClick={() => handleRevoke(row)} aria-label="Revoke">
                              <Trash2 className="size-3.5" />
                            </Button>
                          </>
                        )}
                        {tabName === 'declined' && (
                          <Badge variant="destructive" className="gap-1 shrink-0"><XCircle className="size-3" /> Declined</Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>

      {/* Manual link dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Link manually</DialogTitle>
            <DialogDescription>Skip verification for known families.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Parent account</Label>
              <Input
                placeholder="Filter parents…"
                value={pQuery}
                onChange={e => setPQuery(e.target.value)}
                className="mb-1 h-7 text-xs"
              />
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger>
                <SelectContent>
                  {parentsList
                    .filter(p => p.name.toLowerCase().includes(pQuery.toLowerCase()) || p.email.toLowerCase().includes(pQuery.toLowerCase()))
                    .map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} ({p.email})</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Student</Label>
              <Input
                placeholder="Filter students…"
                value={sQuery}
                onChange={e => setSQuery(e.target.value)}
                className="mb-1 h-7 text-xs"
              />
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger>
                <SelectContent>
                  {studentsList
                    .filter(s => s.name.toLowerCase().includes(sQuery.toLowerCase()) || s.email.toLowerCase().includes(sQuery.toLowerCase()))
                    .map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name} ({s.email})</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 w-44">
              <Label>Relationship</Label>
              <Select value={rel} onValueChange={setRel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="guardian">Guardian</SelectItem>
                  <SelectItem value="mother">Mother</SelectItem>
                  <SelectItem value="father">Father</SelectItem>
                  <SelectItem value="other">Other family</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={handleManualCreate} disabled={busy || !parentId || !studentId} className="gap-1">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />} Link & Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
