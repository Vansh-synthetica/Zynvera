'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  UserPlus,
  Search,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Users,
  Upload,
  Mail,
  GraduationCap,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { getCoursesByTeacher } from '@/lib/api/courses'
import {
  getCourseRoster,
  enrollStudent,
  unenrollStudent,
  searchUsers,
} from '@/lib/api/students'
import { getStudentAverage } from '@/lib/api/grades'
import { getStudentAttendanceSummary } from '@/lib/api/attendance'
import { percentToLetter } from '@/lib/grading/calculate'
import { useWorkspace } from '@/lib/workspace-context'

type CourseOpt = { id: string; title: string; code: string }
type RosterEntry = {
  enrolmentId?: string
  userId: string
  name: string
  email: string
}
type DetailData = {
  avg: number | null
  gradeCount: number
  attendanceRate: number | null
  absences: number
}

export default function StudentRosterPage() {
  const { institutionId, userId } = useWorkspace()

  const [courses, setCourses] = useState<CourseOpt[]>([])
  const [courseId, setCourseId] = useState('')
  const [roster, setRoster] = useState<RosterEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')

  // add student
  const [addOpen, setAddOpen] = useState(false)
  const [userQuery, setUserQuery] = useState('')
  const [results, setResults] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [searching, setSearching] = useState(false)
  const [enrollingId, setEnrollingId] = useState<string | null>(null)

  // remove confirm
  const [removeTarget, setRemoveTarget] = useState<RosterEntry | null>(null)
  const [removing, setRemoving] = useState(false)

  // details
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailStudent, setDetailStudent] = useState<RosterEntry | null>(null)
  const [detail, setDetail] = useState<DetailData | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // bulk import
  const [bulkText, setBulkText] = useState('')
  const [bulkBusy, setBulkBusy] = useState(false)
  const [bulkReport, setBulkReport] = useState<{ added: string[]; alreadyIn: string[]; notFound: string[] } | null>(null)

  // ── Load courses ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError('')
        if (!userId) throw new Error('Sign in required')
        const cs = await getCoursesByTeacher(userId)
        if (!cancelled) {
          setCourses(cs.map((c: any) => ({ id: c.id, title: c.title, code: c.code })))
          if (cs.length > 0) setCourseId(prev => prev || cs[0].id)
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load courses')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [userId])

  // ── Load roster when course changes ───────────────────────────
  const loadRoster = useCallback(async () => {
    if (!courseId) {
      setRoster([])
      return
    }
    try {
      setLoading(true)
      setError('')
      const rows = (await getCourseRoster(courseId)) as any[]
      setRoster(
        rows.map(r => ({
          enrolmentId: r.id,
          userId: r.users?.id ?? r.user_id,
          name: r.users?.name ?? 'Unknown',
          email: r.users?.email ?? '',
        })),
      )
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load roster')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    loadRoster()
  }, [loadRoster])

  // ── Add student flow ──────────────────────────────────────────
  const runSearch = async () => {
    if (!institutionId || userQuery.trim().length < 2) return
    setSearching(true)
    try {
      const found = (await searchUsers(institutionId, userQuery.trim())) as any[]
      setResults(found.map(f => ({ id: f.id, name: f.name, email: f.email })))
    } catch (e: any) {
      setError(e?.message ?? 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  const handleEnroll = async (user: { id: string; name: string }) => {
    setEnrollingId(user.id)
    setError('')
    try {
      await enrollStudent(courseId, user.id)
      setAddOpen(false)
      setUserQuery('')
      setResults([])
      await loadRoster()
    } catch (e: any) {
      const msg = /duplicate|unique/i.test(e?.message ?? '')
        ? `${user.name} is already enrolled.`
        : e?.message ?? 'Enrol failed'
      setError(msg)
    } finally {
      setEnrollingId(null)
    }
  }

  // ── Remove student ────────────────────────────────────────────
  const handleRemove = async () => {
    if (!removeTarget) return
    setRemoving(true)
    setError('')
    try {
      await unenrollStudent(courseId, removeTarget.userId)
      setRemoveTarget(null)
      await loadRoster()
    } catch (e: any) {
      setError(e?.message ?? 'Remove failed')
    } finally {
      setRemoving(false)
    }
  }

  // ── Student details ───────────────────────────────────────────
  const openDetails = async (entry: RosterEntry) => {
    setDetailStudent(entry)
    setDetail(null)
    setDetailLoading(true)
    setDetailOpen(true)
    try {
      const [avgRes, attRes] = await Promise.all([
        getStudentAverage(entry.userId).catch(() => ({ average: null, count: 0 })),
        getStudentAttendanceSummary(entry.userId).catch(() => ({ rate: null, absent: 0, total: 0 })),
      ])
      setDetail({
        avg: (avgRes as any)?.count > 0 ? Math.round((avgRes as any).average * 10) / 10 : null,
        gradeCount: (avgRes as any)?.count ?? 0,
        attendanceRate:
          (attRes as any)?.total > 0 ? Math.round((attRes as any).rate) : null,
        absences: (attRes as any)?.absent ?? 0,
      })
    } finally {
      setDetailLoading(false)
    }
  }

  // ── Bulk import ───────────────────────────────────────────────
  const runBulkImport = async () => {
    if (!institutionId || !bulkText.trim()) return

    const emails = Array.from(
      new Set(
        bulkText
          .split(/[\n,;]+/)
          .map(s => s.trim().toLowerCase())
          .filter(s => s.includes('@')),
      ),
    )
    if (emails.length === 0) {
      setBulkReport({ added: [], alreadyIn: [], notFound: [] })
      return
    }

    setBulkBusy(true)
    setBulkReport(null)
    setError('')

    const added: string[] = []
    const alreadyIn: string[] = []
    const notFound: string[] = []

    try {
      const enrolledEmails = new Set(roster.map(r => r.email.toLowerCase()))

      for (const email of emails) {
        try {
          const found = (await searchUsers(institutionId, email)) as any[]
          const match = found.find(u => u.email.toLowerCase() === email)

          if (!match) {
            notFound.push(email)
            continue
          }
          if (enrolledEmails.has(email)) {
            alreadyIn.push(email)
            continue
          }

          await enrollStudent(courseId, match.id)
          enrolledEmails.add(email)
          added.push(email)
        } catch (err: any) {
          if (/duplicate|unique|already/i.test(err?.message ?? '')) alreadyIn.push(email)
          else notFound.push(email)
        }
      }

      setBulkReport({ added, alreadyIn, notFound })
      await loadRoster()
    } catch (e: any) {
      setError(e?.message ?? 'Bulk import failed')
    } finally {
      setBulkBusy(false)
    }
  }

  const filtered = useMemo(
    () =>
      roster.filter(
        r =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.email.toLowerCase().includes(search.toLowerCase()),
      ),
    [roster, search],
  )

  // ── Render ────────────────────────────────────────────────────

  if (loading && courses.length === 0 && !error) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="size-5 animate-spin mr-2" /> Loading courses…
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Student Roster</h1>
            <p className="text-sm text-muted-foreground">
              Manage who is enrolled in each of your courses
            </p>
          </div>
          <Tabs value={undefined} className="hidden" />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        <Tabs defaultValue="roster">
          <TabsList>
            <TabsTrigger value="roster">Roster</TabsTrigger>
            <TabsTrigger value="import">Bulk Import</TabsTrigger>
          </TabsList>

          {/* Roster tab */}
          <TabsContent value="roster" className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center gap-3">
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger className="w-[260px]">
                  <SelectValue placeholder="Choose course…" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} — {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search students…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Button onClick={() => setAddOpen(true)} disabled={!courseId} className="gap-1">
                <UserPlus className="size-4" /> Add Student
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-14 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin mr-2" /> Loading roster…
                  </div>
                ) : !courseId ? (
                  <p className="py-14 text-center text-sm text-muted-foreground">
                    Choose a course to see its students.
                  </p>
                ) : filtered.length === 0 ? (
                  <div className="py-14 text-center space-y-3">
                    <Users className="size-7 mx-auto text-muted-foreground" />
                    <p className="text-sm font-medium">No students enrolled</p>
                    <p className="text-sm text-muted-foreground">
                      Add students individually or use the bulk import tab.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setAddOpen(true)} className="gap-1">
                      <UserPlus className="size-3.5" /> Add first student
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filtered.map(entry => (
                      <div key={entry.userId} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <GraduationCap className="size-4" />
                        </div>
                        <button
                          onClick={() => openDetails(entry)}
                          className="min-w-0 flex-1 text-left group"
                        >
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {entry.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{entry.email}</p>
                        </button>
                        <Badge variant="outline" className="shrink-0">Active</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRemoveTarget(entry)}
                          className="size-8 p-0 shrink-0 text-muted-foreground hover:text-destructive"
                          aria-label={`Remove ${entry.name}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {!loading && courseId && roster.length > 0 && (
              <p className="text-xs text-muted-foreground text-right">
                {roster.length} student{roster.length === 1 ? '' : 's'} · click a name for details
              </p>
            )}
          </TabsContent>

          {/* Bulk import tab */}
          <TabsContent value="import" className="space-y-3 pt-2">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Upload className="size-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Paste email addresses</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  One per line or comma-separated. Students must already have Zynvera accounts in your
                  institution — unmatched emails are listed so you can invite them.
                </p>
                <Textarea
                  rows={7}
                  value={bulkText}
                  onChange={e => setBulkText(e.target.value)}
                  placeholder={'alex.m@student.riverside.edu\nmaya.patel@student.riverside.edu'}
                  disabled={!courseId || bulkBusy}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Target:{' '}
                    <span className="font-medium">
                      {courses.find(c => c.id === courseId)?.code ?? '— select a course on the Roster tab'}
                    </span>
                  </span>
                  <Button onClick={runBulkImport} disabled={!courseId || bulkBusy || !bulkText.trim()} className="gap-1">
                    {bulkBusy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                    Import Students
                  </Button>
                </div>
              </CardContent>
            </Card>

            {bulkReport && (
              <Card>
                <CardContent className="p-4 space-y-2 text-sm">
                  <p className="font-medium">Import results</p>
                  {bulkReport.added.length > 0 && (
                    <ReportLine icon={<CheckCircle2 className="size-3.5 text-green-600" />} label={`Added (${bulkReport.added.length})`} items={bulkReport.added} />
                  )}
                  {bulkReport.alreadyIn.length > 0 && (
                    <ReportLine icon={<Users className="size-3.5 text-blue-500" />} label={`Already enrolled (${bulkReport.alreadyIn.length})`} items={bulkReport.alreadyIn} />
                  )}
                  {bulkReport.notFound.length > 0 && (
                    <ReportLine icon={<AlertCircle className="size-3.5 text-amber-600" />} label={`No account found (${bulkReport.notFound.length})`} items={bulkReport.notFound} />
                  )}
                  {bulkReport.added.length === 0 && bulkReport.alreadyIn.length === 0 && bulkReport.notFound.length === 0 && (
                    <p className="text-muted-foreground">Nothing to import.</p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Add student dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add student</DialogTitle>
              <DialogDescription>Find them by name or email in your institution.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={userQuery}
                  onChange={e => setUserQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && runSearch()}
                  placeholder="e.g. maya.patel@student…"
                  autoFocus
                />
                <Button variant="outline" onClick={runSearch} disabled={searching} className="shrink-0">
                  {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                </Button>
              </div>

              {results.length > 0 && (
                <div className="rounded-md border divide-y max-h-[240px] overflow-y-auto">
                  {results.map(u => {
                    const already = roster.some(r => r.userId === u.id)
                    return (
                      <div key={u.id} className="flex items-center gap-2 px-3 py-2">
                        <Mail className="size-3.5 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{u.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                        {already ? (
                          <Badge variant="secondary" className="shrink-0">Enrolled</Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 shrink-0 gap-1"
                            onClick={() => handleEnroll(u)}
                            disabled={enrollingId === u.id}
                          >
                            {enrollingId === u.id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <UserPlus className="size-3" />
                            )}
                            Add
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              {!searching && userQuery.length >= 2 && results.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No matches. They may not have an account yet.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Remove confirmation */}
        <Dialog open={removeTarget !== null} onOpenChange={o => !o && setRemoveTarget(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Remove from course?</DialogTitle>
              <DialogDescription>
                {removeTarget?.name} will be withdrawn from{' '}
                {courses.find(c => c.id === courseId)?.code}. Their grades are kept but hidden from
                this roster.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRemoveTarget(null)} disabled={removing}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRemove} disabled={removing} className="gap-1">
                {removing && <Loader2 className="size-4 animate-spin" />}
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Details dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{detailStudent?.name}</DialogTitle>
              <DialogDescription>{detailStudent?.email}</DialogDescription>
            </DialogHeader>
            {detailLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="size-4 animate-spin mr-2" /> Loading record…
              </div>
            ) : detail ? (
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Overall average" value={detail.avg !== null ? `${detail.avg}%` : '—'} sub={detail.avg !== null ? percentToLetter(detail.avg) : 'No grades yet'} />
                <StatCard label="Attendance rate" value={detail.attendanceRate !== null ? `${detail.attendanceRate}%` : '—'} sub={`${detail.absences} absence${detail.absences === 1 ? '' : 's'}`} />
                <StatCard label="Graded entries" value={String(detail.gradeCount)} sub="across all courses" />
                <StatCard label="Status" value="Active" sub="in this course" />
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        <div className="pb-6" />
      </div>
    </AppShell>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold mt-0.5">{value}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </div>
  )
}

function ReportLine({ icon, label, items }: { icon: React.ReactNode; label: string; items: string[] }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground break-words">{items.join(', ')}</p>
      </div>
    </div>
  )
}
