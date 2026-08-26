'use client'

import { useCallback, useEffect, useMemo, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  History,
  BellRing,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getCoursesByTeacher } from '@/lib/api/courses'
import { listClassSections } from '@/lib/api/classes'
import { listEnrolments } from '@/lib/api/students'
import {
  listAttendance,
  saveRegister,
} from '@/lib/api/attendance'
import { useWorkspace } from '@/lib/workspace-context'

type Section = { id: string; name: string; courseId: string; courseTitle: string; courseCode: string }
type RosterStudent = { userId: string; name: string; email: string }
type StatusKey = 'present' | 'absent' | 'late' | 'excused'
type AttendanceRecordRow = {
  id: string
  user_id: string
  date: string
  status: string
}

const STATUSES: { key: StatusKey; label: string; cls: string }[] = [
  { key: 'present', label: 'Present', cls: 'bg-green-100 text-green-700' },
  { key: 'late', label: 'Late', cls: 'bg-amber-100 text-amber-700' },
  { key: 'excused', label: 'Excused', cls: 'bg-blue-100 text-blue-700' },
  { key: 'absent', label: 'Absent', cls: 'bg-red-100 text-red-700' },
]

export default function AttendancePage() {
  return (
    <Suspense>
      <AttendanceInner />
    </Suspense>
  )
}

function AttendanceInner() {
  const { userId } = useWorkspace()
  const searchParams = useSearchParams()

  const [sections, setSections] = useState<Section[]>([])
  const [sectionId, setSectionId] = useState(() => searchParams.get('section') ?? '')
  const [date, setDate] = useState(() => searchParams.get('date') ?? new Date().toISOString().slice(0, 10))
  const [roster, setRoster] = useState<RosterStudent[]>([])
  const [marks, setMarks] = useState<Record<string, StatusKey>>({})
  const [existingIds, setExistingIds] = useState<Set<string>>(new Set())

  const [loading, setLoading] = useState(true)
  const [rosterLoading, setRosterLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pageError, setPageError] = useState('')
  const [savedMsg, setSavedMsg] = useState('')
  const [tab, setTab] = useState('register')

  // history tab
  const [history, setHistory] = useState<AttendanceRecordRow[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // ── Load teacher sections ─────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setPageError('')
        if (!userId) throw new Error('Sign in required')

        const cs = await getCoursesByTeacher(userId)
        const secLists = await Promise.all(
          cs.map((c: any) =>
            listClassSections(c.id)
              .then(rows =>
                (rows as any[]).map(s => ({
                  id: s.id,
                  name: s.name,
                  courseId: c.id,
                  courseTitle: c.title,
                  courseCode: c.code,
                })),
              )
              .catch(() => []),
          ),
        )
        if (cancelled) return
        const flat = secLists.flat()
        setSections(flat)
        if (flat.length > 0) setSectionId(prev => prev || flat[0].id)
      } catch (e: any) {
        if (!cancelled) setPageError(e?.message ?? 'Failed to load classes')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [userId])

  const section = useMemo(() => sections.find(s => s.id === sectionId), [sections, sectionId])

  // ── Load roster + existing marks when section/date change ─────
  useEffect(() => {
    let cancelled = false

    async function loadDay() {
      if (!section) return
      try {
        setRosterLoading(true)
        setPageError('')
        setSavedMsg('')

        const enrolled = await listEnrolments(section.courseId)
        if (cancelled) return
        const students: RosterStudent[] = (enrolled as any[]).map(e => ({
          userId: e.user_id,
          name: e.users?.name ?? 'Unknown',
          email: e.users?.email ?? '',
        }))
        setRoster(students)

        const dayRecords = await listAttendance(section.id, date)
        if (cancelled) return

        const nextMarks: Record<string, StatusKey> = {}
        const ids = new Set<string>()
        ;(dayRecords as any[]).forEach(r => {
          nextMarks[r.user_id] = r.status as StatusKey
          ids.add(r.id)
        })
        setMarks(nextMarks)
        setExistingIds(ids)
      } catch (e: any) {
        if (!cancelled) setPageError(e?.message ?? 'Failed to load the register')
      } finally {
        if (!cancelled) setRosterLoading(false)
      }
    }

    loadDay()
    return () => {
      cancelled = true
    }
  }, [section, date])

  // ── History ───────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    if (!section) return
    setHistoryLoading(true)
    try {
      const rows = await listAttendance(section.id)
      setHistory((rows as any[]) ?? [])
    } catch {
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }, [section])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  // ── Save register ─────────────────────────────────────────────
  const handleSave = async () => {
    if (!section || !userId) return

    // Default unmarked students to present for a complete register.
    const records = roster.map(s => ({
      user_id: s.userId,
      status: marks[s.userId] ?? ('present' as StatusKey),
    }))
    if (records.length === 0) return

    setSaving(true)
    setPageError('')
    setSavedMsg('')
    try {
      const result = await saveRegister(section.id, date, records)

      // Refresh stored ids so switches reflect saved state.
      const refreshed = await listAttendance(section.id, date)
      setExistingIds(new Set(((refreshed as any[]) ?? []).map(r => r.id)))

      const alertBits: string[] = []
      if (result.absent > 0) alertBits.push(`${result.absent} absent`)
      if (result.late > 0) alertBits.push(`${result.late} late`)
      setSavedMsg(
        `Register saved for ${result.saved} student${result.saved === 1 ? '' : 's'}` +
          (alertBits.length ? ` (${alertBits.join(', ')})` : '') +
          (result.alerts_sent > 0 ? ` · ${result.alerts_sent} alert${result.alerts_sent === 1 ? '' : 's'} sent` : ''),
      )
      loadHistory()
    } catch (e: any) {
      setPageError(e?.message ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const markAll = (status: StatusKey) =>
    setMarks(prev => {
      const next = { ...prev }
      roster.forEach(s => (next[s.userId] = status))
      return next
    })

  const groupedHistory = useMemo(() => {
    const map = new Map<string, AttendanceRecordRow[]>()
    history.forEach(r => {
      const list = map.get(r.date) ?? []
      list.push(r)
      map.set(r.date, list)
    })
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1))
  }, [history])

  // ── Render ────────────────────────────────────────────────────

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="size-5 animate-spin mr-2" /> Loading classes…
        </div>
      </AppShell>
    )
  }

  if (sections.length === 0) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-4 py-24 text-center space-y-3">
          <CalendarDays className="size-8 mx-auto text-muted-foreground" />
          <p className="font-medium">No class sections yet</p>
          <p className="text-sm text-muted-foreground">
            Add scheduled sections to a course first — then take attendance here.
          </p>
          <Button asChild variant="outline">
            <Link href="/teacher/classes">Go to My Classes</Link>
          </Button>
        </div>
      </AppShell>
    )
  }

  const markedCount = roster.filter(s => marks[s.userId]).length

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Attendance</h1>
            <p className="text-sm text-muted-foreground">Saved instantly to your institution record</p>
          </div>
          {existingIds.size > 0 && sectionId !== '' && (
            <Badge variant="outline" className="gap-1">
              <CheckCircle2 className="size-3" /> {date} already saved
            </Badge>
          )}
        </div>

        {pageError && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {pageError}
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="register">Today&apos;s Register</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Register */}
          <TabsContent value="register" className="space-y-3 pt-2">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1 min-w-[220px]">
                <Label>Class section</Label>
                <Select value={sectionId} onValueChange={setSectionId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.courseCode} — {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="att-date">Date</Label>
                <Input id="att-date" type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>

              <div className="flex flex-wrap gap-1.5 ml-auto">
                <Button variant="outline" size="sm" onClick={() => markAll('present')}>
                  All present
                </Button>
                <Button variant="outline" size="sm" onClick={() => markAll('absent')}>
                  All absent
                </Button>
                <Button onClick={handleSave} disabled={saving || !section} className="gap-1">
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  {existingIds.size > 0 ? 'Update Register' : 'Save Register'}
                </Button>
              </div>
            </div>

            {savedMsg && (
              <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-2.5 text-xs text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-400">
                <CheckCircle2 className="size-3.5 shrink-0" /> {savedMsg}
              </div>
            )}

            <Card>
              <CardContent className="p-0">
                {rosterLoading ? (
                  <div className="flex items-center justify-center py-14 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin mr-2" /> Loading roster…
                  </div>
                ) : roster.length === 0 ? (
                  <p className="py-14 text-center text-sm text-muted-foreground">
                    No students enrolled in this course yet.
                  </p>
                ) : (
                  <div className="divide-y">
                    {roster.map(student => (
                      <div key={student.userId} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{student.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{student.email}</p>
                        </div>

                        <div className="flex gap-1">
                          {STATUSES.map(({ key, label, cls }) => {
                            const active = marks[student.userId] === key
                            return (
                              <button
                                key={key}
                                onClick={() =>
                                  setMarks(prev => ({ ...prev, [student.userId]: key }))
                                }
                                className={`rounded-full px-2.5 py-1 text-[11px] transition-colors ${
                                  active ? cls : 'text-muted-foreground hover:bg-muted'
                                } ${!active && 'border border-transparent'}`}
                              >
                                {label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {!rosterLoading && roster.length > 0 && (
              <p className="text-xs text-muted-foreground text-right">
                {markedCount}/{roster.length} marked · unmarked students default to Present when saving
              </p>
            )}
          </TabsContent>

          {/* History */}
          <TabsContent value="history" className="pt-2">
            <Card>
              <CardContent className="p-4">
                {historyLoading ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin mr-2" /> Loading history…
                  </div>
                ) : groupedHistory.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <History className="size-7 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No saved registers for this section yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {groupedHistory.slice(0, 30).map(([day, rows]) => {
                      const counts = STATUSES.reduce<Record<string, number>>((acc, s) => {
                        acc[s.key] = rows.filter(r => r.status === s.key).length
                        return acc
                      }, {})
                      const rate =
                        rows.length > 0
                          ? Math.round(((rows.length - counts.absent) / rows.length) * 100)
                          : 100
                      return (
                        <button
                          key={day}
                          onClick={() => {
                            setDate(day)
                            setTab('register')
                          }}
                          className="w-full text-left"
                        >
                          <div className="flex flex-wrap items-center gap-2 rounded-md border p-3 hover:border-primary/40 transition-colors">
                            <span className="text-sm font-medium">{day}</span>
                            <Badge variant="outline" className="ml-auto">{rate}% present</Badge>
                            {STATUSES.map(({ key, label, cls }) =>
                              counts[key] > 0 ? (
                                <Badge key={key} className={`text-[11px] ${cls}`}>
                                  {counts[key]} {label.toLowerCase()}
                                </Badge>
                              ) : null,
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="pb-6" />
      </div>
    </AppShell>
  )
}
