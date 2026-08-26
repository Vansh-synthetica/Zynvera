'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, AlertCircle, Search, GraduationCap, Plus, FileText, Download, CheckCircle } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { listUsers, bulkImportStudents } from '@/lib/api/students'
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

  // CSV import state
  const [importOpen, setImportOpen] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [importBusy, setImportBusy] = useState(false)
  const [importResult, setImportResult] = useState<{
    created: number
    skipped: number
    credentials: Array<{ email: string; password: string; family_code: string }>
  } | null>(null)
  const [importError, setImportError] = useState('')

  const parseCsv = (text: string): Array<{ email: string; name?: string }> => {
    const lines = text.trim().split('\n').filter(l => l.trim())
    return lines.map(line => {
      const [email, ...nameParts] = line.split(',')
      return {
        email: email.trim().toLowerCase(),
        name: nameParts.join(',').trim() || undefined,
      }
    })
  }

  const handleImport = async () => {
    if (!csvText.trim()) return
    setImportBusy(true)
    setImportError('')
    try {
      const rows = parseCsv(csvText)
      const result = await bulkImportStudents(rows)
      setImportResult(result)
      if (result.created > 0) {
        load() // refresh student list
      }
    } catch (e: any) {
      setImportError(e?.message ?? 'Import failed')
    } finally {
      setImportBusy(false)
    }
  }

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
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search students…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-[220px]"
              />
              <Button onClick={() => setImportOpen(true)} variant="outline">
                <FileText className="size-4 mr-1" />
                Import CSV
              </Button>
            </div>
          </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        {importError && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {importError}
          </div>
        )}

        {importResult && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950 p-3 text-sm text-green-700 dark:text-green-400">
            <CheckCircle className="size-4 shrink-0" />
            Created {importResult.created} student{importResult.created === 1 ? '' : 's'}, skipped {importResult.skipped}
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

      {/* Import CSV Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-4" />
              Import Students (CSV)
            </DialogTitle>
            <DialogDescription>
              Paste CSV rows: <code>email,name</code> per line. Optional name column.
              Existing emails are skipped.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {importError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-2.5 text-xs text-destructive">
                <AlertCircle className="size-3.5 shrink-0" /> {importError}
              </div>
            )}

            <Textarea
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              placeholder="email,name per line (name optional)"
              rows={8}
              className="font-mono text-sm"
            />

{importResult && (
              <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950 p-3 text-sm text-green-700 dark:text-green-400">
                <p className="font-medium">Imported {importResult.created} student{importResult.created === 1 ? '' : 's'}, skipped {importResult.skipped}</p>
                {importResult.credentials.length > 0 && (
                  <div className="mt-2 space-y-1 max-h-40 overflow-auto">
                    <p className="font-medium text-xs">Credentials (save now — shown once):</p>
                    <div className="font-mono text-xs space-y-0.5">
                      {importResult.credentials.map((c, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">{i + 1}.</span>
                          <code className="bg-muted px-1 rounded">{c.email}</code>
                          <code className="bg-muted px-1 rounded">{c.password}</code>
                          <code className="bg-muted px-1 rounded">{c.family_code}</code>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-muted">
                      <Button variant="outline" size="sm" onClick={() => setImportResult(null)}>Dismiss</Button>
                      <Button size="sm" onClick={() => {
                        const csv = importResult.credentials.map(c => `${c.email}\t${c.password}\t${c.family_code}`).join('\n')
                        navigator.clipboard.writeText(csv)
                      }}>
                        <Download className="size-3.5 mr-1" /> Copy credentials
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => { setCsvText(''); setImportOpen(false); setImportError(''); setImportResult(null); }}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={importBusy || !csvText.trim()}>
                {importBusy ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Importing…
                  </>
                ) : (
                  'Import students'
                )}
              </Button>
            </div>
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
