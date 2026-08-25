'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, AlertCircle, Search, GraduationCap } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { listUsers } from '@/lib/api/students'
import { useWorkspace } from '@/lib/workspace-context'

type StudentRow = {
  id: string
  name: string
  email: string
  phone: string | null
  join_date: string | null
  verification_status: string
}

export default function PrincipalStudentsPage() {
  const { institutionId } = useWorkspace()

  const [rows, setRows] = useState<StudentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState<StudentRow | null>(null)

  const load = useCallback(async () => {
    if (!institutionId) return
    try {
      setLoading(true)
      setError('')
      setRows((await listUsers(institutionId, 'student')) as any[])
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }, [institutionId])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(
    () =>
      rows
        .filter(
          r =>
            r.name.toLowerCase().includes(search.toLowerCase()) ||
            r.email.toLowerCase().includes(search.toLowerCase()),
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [rows, search],
  )

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Student Management</h1>
            <p className="text-sm text-muted-foreground">{rows.length} enrolled students</p>
          </div>
          <Input
            placeholder="Search students…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-[220px]"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="size-5 animate-spin mr-2" /> Loading students…
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center space-y-2">
              <GraduationCap className="size-7 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">No students yet</p>
              <p className="text-sm text-muted-foreground">
                Students appear once they sign up and join your institution.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filtered.map(s => (
                  <button key={s.id} onClick={() => setDetail(s)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 text-left transition-colors">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-xs font-medium">
                      {s.name.split(' ').map(x => x[0]).slice(0, 2).join('')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                    </div>
                    <Badge
                      variant={s.verification_status === 'verified' ? 'default' : 'secondary'}
                      className="shrink-0 capitalize text-[11px]"
                    >
                      {s.verification_status}
                    </Badge>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={detail !== null} onOpenChange={o => !o && setDetail(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{detail?.name}</DialogTitle>
            <DialogDescription>Student record</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <Row label="Email" value={detail?.email} />
            {detail?.phone && <Row label="Phone" value={detail.phone} />}
            {detail?.join_date && <Row label="Joined" value={new Date(detail.join_date).toLocaleDateString()} />}
            <Row label="Verification" value={detail?.verification_status ?? '—'} />
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium truncate text-right capitalize">{value || '—'}</span>
    </div>
  )
}
