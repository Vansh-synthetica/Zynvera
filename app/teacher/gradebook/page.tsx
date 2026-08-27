'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Download,
  Printer,
  Loader2,
  AlertCircle,
  Gavel,
  CheckCircle2,
  XCircle,
  Megaphone,
  EyeOff,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getCoursesByTeacher } from '@/lib/api/courses'
import { listEnrolments } from '@/lib/api/students'
import {
  listAssignments,
  listSubmissions,
  gradeSubmission,
  updateAssignment,
} from '@/lib/api/assignments'
import { upsertSubmission } from '@/lib/api/assignments'
import { listAppealsByCourse, resolveAppeal } from '@/lib/api/appeals'
import { percentToLetter } from '@/lib/grading/calculate'
import { useWorkspace } from '@/lib/workspace-context'

type CourseOpt = { id: string; title: string; code: string }
type AsgCol = { id: string; title: string; max_score: number; posted: boolean }
type StudentRow = { userId: string; name: string }
type CellMap = Record<string, Record<string, number | null>> // studentId -> assignmentId -> score

export default function GradebookPage() {
  const { userId } = useWorkspace()

  const [courses, setCourses] = useState<CourseOpt[]>([])
  const [courseId, setCourseId] = useState('')
  const [assignments, setAssignments] = useState<AsgCol[]>([])
  const [students, setStudents] = useState<StudentRow[]>([])
  const [cells, setCells] = useState<CellMap>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingCell, setSavingCell] = useState<string | null>(null)
  const [tab, setTab] = useState('grid')

  // appeals
  const [appeals, setAppeals] = useState<any[]>([])
  const [resolving, setResolving] = useState<any | null>(null)
  const [resolutionText, setResolutionText] = useState('')
  const [appealBusy, setAppealBusy] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadCourses() {
      try {
        setLoading(true)
        setError('')
        if (!userId) throw new Error('Sign in required')
        const cs = await getCoursesByTeacher(userId)
        if (cancelled) return
        const opts = cs.map((c: any) => ({ id: c.id, title: c.title, code: c.code }))
        setCourses(opts)
        if (opts.length > 0) setCourseId(prev => prev || opts[0].id)
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load courses')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadCourses()
    return () => {
      cancelled = true
    }
  }, [userId])

  const loadGrid = useCallback(async () => {
    if (!courseId) return
    try {
      setLoading(true)
      setError('')

      const [asgs, enrolled, appealRows] = await Promise.all([
        listAssignments(courseId),
        listEnrolments(courseId),
        listAppealsByCourse(courseId).catch(() => []),
      ])

      const cols: AsgCol[] = (Array.isArray(asgs) ? (asgs as any[]) : []).map(a => ({
        id: a.id,
        title: a.title,
        max_score: a.max_score ?? 100,
        posted: a.status === 'returned',
      }))
      const rows: StudentRow[] = (enrolled as any[]).map(e => ({
        userId: e.user_id,
        name: e.users?.name ?? 'Unknown',
      }))

      const subLists = await Promise.all(cols.map(c => listSubmissions(c.id).catch(() => [])))

      const grid: CellMap = {}
      rows.forEach(r => (grid[r.userId] = {}))
      subLists.forEach((subs, i) => {
        ;((subs as any[]) ?? []).forEach(s => {
          if (grid[s.user_id]) grid[s.user_id][cols[i].id] = s.score ?? null
        })
      })

      setAssignments(cols)
      setStudents(rows)
      setCells(grid)
      setAppeals(appealRows)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load gradebook')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    loadGrid()
  }, [loadGrid])

  // ── Inline cell save ──────────────────────────────────────────
  const handleCellChange = async (
    studentId: string,
    col: AsgCol,
    raw: string,
  ) => {
    const key = `${studentId}:${col.id}`
    setSavingCell(key)
    setError('')
    try {
      const value = raw === '' ? null : Math.max(0, Math.min(col.max_score, Number(raw)))
      const existingId = submissionIds[`${studentId}:${col.id}`]

      if (existingId && userId) {
        await gradeSubmission(existingId, value ?? 0, '', userId)
      } else {
        await upsertSubmission({
          assignment_id: col.id,
          user_id: studentId,
          status: value === null ? 'not_started' : 'graded',
          score: value,
          graded_at: value !== null && userId ? new Date().toISOString() : null,
          graded_by: value !== null ? userId : null,
        } as any)
      }

      setCells(prev => ({
        ...prev,
        [studentId]: { ...prev[studentId], [col.id]: value },
      }))
    } catch (e: any) {
      setError(e?.message ?? 'Save failed')
    } finally {
      setSavingCell(null)
    }
  }

  // Track submission ids lazily so edits reuse UPDATE instead of INSERT.
  const [submissionIds, setSubmissionIds] = useState<Record<string, string>>({})
  useEffect(() => {
    async function mapIds() {
      const ids: Record<string, string> = {}
      await Promise.all(
        assignments.map(async col => {
          try {
            const subs = (await listSubmissions(col.id)) as any[]
            subs.forEach(s => {
              ids[`${s.user_id}:${col.id}`] = s.id
            })
          } catch {
            /* column without submissions */
          }
        }),
      )
      setSubmissionIds(ids)
    }
    if (assignments.length > 0) mapIds()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignments])

  // ── Post / unpost grades for one assignment ───────────────────
  const togglePosted = async (col: AsgCol) => {
    const targetStatus = col.posted ? 'graded' : 'returned'
    try {
      await updateAssignment(col.id, { status: targetStatus })
      setAssignments(prev =>
        prev.map(a => (a.id === col.id ? { ...a, posted: !col.posted } : a)),
      )
    } catch (e: any) {
      setError(e?.message ?? 'Could not change posting status')
    }
  }

  // ── Averages ──────────────────────────────────────────────────
  const averages = useMemo(() => {
    const out: Record<string, number | null> = {}
    students.forEach(s => {
      let earned = 0
      let possible = 0
      assignments.forEach(a => {
        const v = cells[s.userId]?.[a.id]
        if (v !== null && v !== undefined) {
          earned += v
          possible += a.max_score
        }
      })
      out[s.userId] = possible > 0 ? Math.round((earned / possible) * 10000) / 100 : null
    })
    return out
  }, [students, assignments, cells])

  // ── CSV export ────────────────────────────────────────────────
  const exportCsv = () => {
    const header = ['Student', ...assignments.map(a => `${a.title} (/${a.max_score})`), 'Average', 'Grade']
    const lines = students.map(s => {
      const scores = assignments.map(a => {
        const v = cells[s.userId]?.[a.id]
        return v === null || v === undefined ? '' : String(v)
      })
      const avg = averages[s.userId]
      return [
        `"${s.name.replace(/"/g, '""')}"`,
        ...scores,
        avg !== null ? avg.toFixed(1) : '',
        avg !== null ? percentToLetter(avg) : '',
      ].join(',')
    })
    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `gradebook-${courses.find(c => c.id === courseId)?.code ?? 'course'}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // ── Appeal resolution ─────────────────────────────────────────
  const submitResolution = async (approved: boolean) => {
    if (!resolving || !userId) return
    setAppealBusy(true)
    try {
      await resolveAppeal(resolving.id, approved ? 'approved' : 'rejected', resolutionText.trim() || '(no note)', userId)
      setAppeals(prev =>
        prev.map(a => (a.id === resolving.id ? { ...a, status: approved ? 'approved' : 'rejected' } : a)),
      )
      setResolving(null)
      setResolutionText('')
    } catch (e: any) {
      setError(e?.message ?? 'Could not resolve appeal')
    } finally {
      setAppealBusy(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────

  const pendingAppeals = appeals.filter(a => a.status === 'pending')

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Gradebook</h1>
            <p className="text-sm text-muted-foreground">Click any cell to edit — saves on blur</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger className="w-[240px]">
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
            <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1">
              <Download className="size-3.5" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1 print:hidden">
              <Printer className="size-3.5" /> Print / PDF
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        {pendingAppeals.length > 0 && (
          <button onClick={() => setTab('appeals')} className="w-full text-left">
            <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950 p-3 text-sm text-amber-800 dark:text-amber-300">
              <Gavel className="size-4 shrink-0" />
              {pendingAppeals.length} grade appeal{pendingAppeals.length === 1 ? '' : 's'} awaiting review
            </div>
          </button>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="grid">Grades</TabsTrigger>
            <TabsTrigger value="appeals">
              Appeals
              {pendingAppeals.length > 0 && (
                <Badge variant="secondary" className="ml-1.5">{pendingAppeals.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Grid */}
          <TabsContent value="grid">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="size-5 animate-spin mr-2" /> Loading…
              </div>
            ) : assignments.length === 0 || students.length === 0 ? (
              <Card>
                <CardContent className="py-14 text-center space-y-2">
                  <Megaphone className="size-7 mx-auto text-muted-foreground" />
                  <p className="text-sm font-medium">Nothing to show yet</p>
                  <p className="text-sm text-muted-foreground">
                    Create assignments and enrol students — grades appear here automatically.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-sm border-collapse min-w-[720px]">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="text-left p-2.5 sticky left-0 bg-background z-10 min-w-[160px]">
                          Student
                        </th>
                        {assignments.map(a => (
                          <th key={a.id} className="p-2 text-center min-w-[110px]">
                            <div className="text-xs font-medium truncate max-w-[110px] mx-auto" title={a.title}>
                              {a.title}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-normal">
                              /{a.max_score}
                            </div>
                            <button
                              onClick={() => togglePosted(a)}
                              className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${
                                a.posted
                                  ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {a.posted ? (
                                <>
                                  <EyeOff className="size-2.5" /> Posted — click to hide
                                </>
                              ) : (
                                <>
                                  <Megaphone className="size-2.5" /> Post grades
                                </>
                              )}
                            </button>
                          </th>
                        ))}
                        <th className="p-2 text-center min-w-[90px]">Average</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(s => {
                        const avg = averages[s.userId]
                        return (
                          <tr key={s.userId} className="border-b hover:bg-muted/20">
                            <td className="p-2.5 sticky left-0 bg-background z-10">
                              <span className="text-sm font-medium">{s.name}</span>
                            </td>
                            {assignments.map(a => {
                              const key = `${s.userId}:${a.id}`
                              const val = cells[s.userId]?.[a.id]
                              return (
                                <td key={a.id} className="p-1.5 text-center relative">
                                  <Input
                                    defaultValue={val ?? ''}
                                    key={`${key}-${val ?? 'e'}`}
                                    onBlur={e => {
                                      if (String(val ?? '') !== e.target.value)
                                        handleCellChange(s.userId, a, e.target.value)
                                    }}
                                    type="number"
                                    min={0}
                                    max={a.max_score}
                                    className="h-8 w-[72px] mx-auto text-right"
                                    aria-label={`${s.name} — ${a.title}`}
                                  />
                                  {savingCell === key && (
                                    <Loader2 className="size-3 animate-spin absolute right-2 top-2.5 text-muted-foreground" />
                                  )}
                                </td>
                              )
                            })}
                            <td className="p-2 text-center">
                              {avg !== null ? (
                                <span className="font-medium">{avg.toFixed(1)}%</span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                              {avg !== null && (
                                <div className="text-[10px] text-muted-foreground">
                                  {percentToLetter(avg)}
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Appeals */}
          <TabsContent value="appeals">
            {appeals.length === 0 ? (
              <Card>
                <CardContent className="py-14 text-center space-y-2">
                  <Gavel className="size-7 mx-auto text-muted-foreground" />
                  <p className="text-sm font-medium">No appeals</p>
                  <p className="text-sm text-muted-foreground">
                    Students can contest grades from their assignments page.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {appeals.map(a => (
                  <Card key={a.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{a.users?.name ?? 'Student'}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">
                            {a.reason}
                          </p>
                          {a.resolution && (
                            <p className="text-xs mt-1 text-muted-foreground">
                              Resolution: {a.resolution}
                            </p>
                          )}
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(a.created_at).toLocaleString()}
                          </span>
                        </div>

                        {a.status === 'pending' ? (
                          <Button size="sm" variant="outline" onClick={() => setResolving(a)}>
                            Review
                          </Button>
                        ) : (
                          <Badge
                            className={
                              a.status === 'approved'
                                ? 'gap-1 bg-green-100 text-green-700'
                                : 'gap-1 bg-red-100 text-red-700'
                            }
                          >
                            {a.status === 'approved' ? (
                              <CheckCircle2 className="size-3" />
                            ) : (
                              <XCircle className="size-3" />
                            )}
                            {a.status}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Resolution dialog */}
        <Dialog open={resolving !== null} onOpenChange={o => !o && setResolving(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Resolve appeal</DialogTitle>
              <DialogDescription>{resolving?.reason}</DialogDescription>
            </DialogHeader>
            <Textarea
              rows={4}
              value={resolutionText}
              onChange={e => setResolutionText(e.target.value)}
              placeholder="Explain your decision for the student…"
            />
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={() => submitResolution(false)}
                disabled={appealBusy}
                className="gap-1"
              >
                <XCircle className="size-4" /> Reject
              </Button>
              <Button onClick={() => submitResolution(true)} disabled={appealBusy} className="gap-1">
                <CheckCircle2 className="size-4" /> Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="pb-6" />
      </div>
    </AppShell>
  )
}
