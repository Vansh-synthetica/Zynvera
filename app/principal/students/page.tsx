'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, AlertCircle, Search, GraduationCap, FileText, Download, CheckCircle, Upload, ChevronRight, ChevronLeft, Copy, X } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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

  // CSV import wizard state
  const [importOpen, setImportOpen] = useState(false)
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1)
  const [csvText, setCsvText] = useState('')
  const [parsedRows, setParsedRows] = useState<Array<{ email: string; name?: string }>>([])
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
      const parts = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''))
      return {
        email: (parts[0] || '').toLowerCase(),
        name: parts.slice(1).join(' ').trim() || undefined,
      }
    }).filter(r => r.email && r.email.includes('@'))
  }

  const handleParse = () => {
    const parsed = parseCsv(csvText)
    if (parsed.length === 0) {
      setImportError('No valid rows found. Use format: email,name')
      return
    }
    setParsedRows(parsed)
    setImportError('')
    setImportStep(2)
  }

  const handleImport = async () => {
    if (!parsedRows.length) return
    setImportBusy(true)
    setImportError('')
    try {
      const result = await bulkImportStudents(parsedRows)
      setImportResult(result)
      setImportStep(3)
      if (result.created > 0) load()
    } catch (e: any) {
      setImportError(e?.message ?? 'Import failed')
    } finally {
      setImportBusy(false)
    }
  }

  const resetImport = () => {
    setImportOpen(false)
    setImportStep(1)
    setCsvText('')
    setParsedRows([])
    setImportResult(null)
    setImportError('')
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

  useEffect(() => { load() }, [load])

  const filtered = useMemo(
    () =>
      rows
        .filter(r =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.email.toLowerCase().includes(search.toLowerCase()),
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [rows, search],
  )

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Student Management</h1>
            <p className="text-sm text-muted-foreground">{rows.length} enrolled students</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-[220px] pl-9"
              />
            </div>
            <Button onClick={() => { setImportOpen(true); setImportStep(1) }}>
              <Upload className="size-4 mr-1.5" /> Import CSV
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin mr-2" /> Loading students...
          </div>
        ) : filtered.length === 0 ? (
          <div className="neo rounded-2xl py-14 text-center space-y-2">
            <GraduationCap className="size-7 mx-auto text-muted-foreground" />
            <p className="text-sm font-medium">No students yet</p>
            <p className="text-sm text-muted-foreground">
              Students appear once they sign up and join your institution.
            </p>
          </div>
        ) : (
          <div className="neo rounded-2xl overflow-hidden">
            <div className="divide-y divide-border/40">
              {filtered.map(s => (
                <button key={s.id} onClick={() => setDetail(s)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/20 text-left transition-colors">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                    {s.name.split(' ').map(x => x[0]).slice(0, 2).join('')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                  </div>
                  <Badge
                    variant={s.verification_status === 'verified' ? 'success' : 'secondary'}
                    className="shrink-0 capitalize text-[11px]"
                  >
                    {s.verification_status}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Student detail dialog */}
      <Dialog open={detail !== null} onOpenChange={o => !o && setDetail(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{detail?.name}</DialogTitle>
            <DialogDescription>Student record</DialogDescription>
          </DialogHeader>
          <div className="space-y-2.5 text-sm">
            <Row label="Email" value={detail?.email} />
            {detail?.phone && <Row label="Phone" value={detail.phone} />}
            {detail?.join_date && <Row label="Joined" value={new Date(detail.join_date).toLocaleDateString()} />}
            <Row label="Verification" value={detail?.verification_status ?? '\u2014'} />
          </div>
        </DialogContent>
      </Dialog>

      {/* CSV Import Wizard */}
      <Dialog open={importOpen} onOpenChange={resetImport}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="size-4" />
              Import Students
            </DialogTitle>
            <DialogDescription>
              Step {importStep} of 3
            </DialogDescription>
          </DialogHeader>

          {/* Step indicators */}
          <div className="flex items-center gap-2 text-xs">
            {(['Paste', 'Review', 'Done'] as const).map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`flex items-center justify-center size-6 rounded-full text-xs font-medium ${
                  importStep > i + 1 ? 'bg-primary text-primary-foreground' :
                  importStep === i + 1 ? 'neo-sm text-foreground' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {importStep > i + 1 ? <CheckCircle className="size-3.5" /> : i + 1}
                </div>
                <span className={importStep === i + 1 ? 'font-medium' : 'text-muted-foreground'}>{label}</span>
                {i < 2 && <ChevronRight className="size-3 text-muted-foreground" />}
              </div>
            ))}
          </div>

          {importError && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-2.5 text-xs text-destructive">
              <AlertCircle className="size-3.5 shrink-0" /> {importError}
            </div>
          )}

          {/* Step 1: Paste */}
          {importStep === 1 && (
            <div className="space-y-3">
              <div className="rounded-xl neo-inset p-4 space-y-2">
                <p className="text-xs font-medium">Format</p>
                <pre className="text-[11px] text-muted-foreground font-mono">email,name
alex@student.edu,Alex Morgan
jane@student.edu,Jane Doe</pre>
              </div>
              <textarea
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
                placeholder="Paste CSV rows here, one per line"
                rows={10}
                className="w-full rounded-xl neo-inset bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">{csvText.trim() ? parseCsv(csvText).length + ' rows detected' : 'No rows yet'}</p>
                <Button onClick={handleParse} disabled={!csvText.trim()}>
                  Next: Review <ChevronRight className="size-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Review */}
          {importStep === 2 && (
            <div className="space-y-3">
              <div className="rounded-xl neo-inset p-3 max-h-48 overflow-y-auto">
                <div className="space-y-1">
                  {parsedRows.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs py-1">
                      <span className="text-muted-foreground w-5 text-right">{i + 1}.</span>
                      <code className="bg-muted px-1.5 py-0.5 rounded font-mono">{r.email}</code>
                      {r.name && <span className="text-muted-foreground">{r.name}</span>}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {parsedRows.length} students will be imported. Existing emails are skipped automatically.
              </p>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setImportStep(1)}>
                  <ChevronLeft className="size-3.5 mr-1" /> Back
                </Button>
                <Button onClick={handleImport} disabled={importBusy}>
                  {importBusy ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : null}
                  Import {parsedRows.length} students
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Done */}
          {importStep === 3 && importResult && (
            <div className="space-y-3">
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm">
                <p className="font-medium text-emerald-800">
                  Created {importResult.created} student{importResult.created === 1 ? '' : 's'}, skipped {importResult.skipped}
                </p>
              </div>
              {importResult.credentials.length > 0 && (
                <div className="rounded-xl neo-inset p-4 space-y-2">
                  <p className="text-xs font-medium">Credentials (save now — shown once)</p>
                  <div className="space-y-1 max-h-40 overflow-auto">
                    {importResult.credentials.map((c, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px] font-mono">
                        <span className="text-muted-foreground w-4 text-right">{i + 1}.</span>
                        <code className="bg-muted px-1 rounded">{c.email}</code>
                        <code className="bg-muted px-1 rounded">{c.password}</code>
                        <code className="bg-muted px-1 rounded">{c.family_code}</code>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => {
                      const csv = importResult.credentials.map(c => `${c.email}\t${c.password}\t${c.family_code}`).join('\n')
                      navigator.clipboard.writeText(csv)
                    }}
                    className="mt-2"
                  >
                    <Copy className="size-3.5 mr-1.5" /> Copy all credentials
                  </Button>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={resetImport}>Done</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium truncate text-right">{value || '\u2014'}</span>
    </div>
  )
}
