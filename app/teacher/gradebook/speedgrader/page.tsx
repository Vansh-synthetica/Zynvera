'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  FileCheck2,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { RubricGrader } from '@/components/rubric/rubric-editor'
import {
  type Rubric,
  type RubricCriterion,
  type RubricAssessmentRating,
} from '@/lib/grading/rubric'
import { percentToLetter } from '@/lib/grading/calculate'
import {
  listRubrics,
  saveAssessment,
} from '@/lib/api/rubrics'
import { getCoursesByTeacher } from '@/lib/api/courses'
import { listAssignments, listSubmissions, gradeSubmission } from '@/lib/api/assignments'
import { useWorkspace } from '@/lib/workspace-context'

type CourseRow = { id: string; title: string; code: string }
type AssignmentRow = {
  id: string
  course_id: string
  title: string
  max_score: number
  status: string
}
type SubmissionRow = {
  id: string | null
  user_id: string
  name: string
  status: string
  submitted_at: string | null
  score: number | null
  content: string | null
}

/** Extract a Google Drive file id from any share/view link format. */
function driveFileId(content: string | null): string | null {
  if (!content) return null
  const match = content.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([\w-]{20,})/)
  return match ? match[1] : null
}
type RubricRow = Rubric & { courseId: string }

export default function SpeedGraderPage() {
  const { userId } = useWorkspace()

  const [courses, setCourses] = useState<CourseRow[]>([])
  const [assignments, setAssignments] = useState<AssignmentRow[]>([])
  const [rubrics, setRubrics] = useState<RubricRow[]>([])
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [assignmentId, setAssignmentId] = useState('')
  const [rubricId, setRubricId] = useState('')
  const [index, setIndex] = useState(0)

  const [scores, setScores] = useState<Record<string, number | null>>({})
  const [feedback, setFeedback] = useState<Record<string, string>>({})
  const [rubricState, setRubricState] = useState<Record<string, RubricAssessmentRating[]>>({})
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [savingNow, setSavingNow] = useState(false)
  const [saveError, setSaveError] = useState('')

  // ── Load courses → assignments + rubrics ──────────────────────
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setLoadError('')
        if (!userId) throw new Error('Sign in required')

        const cs = await getCoursesByTeacher(userId)
        const courseRows: CourseRow[] = cs.map((c: any) => ({
          id: c.id,
          title: c.title,
          code: c.code,
        }))
        if (cancelled) return
        setCourses(courseRows)

        const [assignmentLists, rubricLists] = await Promise.all([
          Promise.all(courseRows.map(c => listAssignments(c.id).catch(() => []))),
          Promise.all(courseRows.map(c => listRubrics(c.id).catch(() => []))),
        ])
        if (cancelled) return

        // Flatten assignments; expand nested rows from each course.
        const allAssignments: AssignmentRow[] = assignmentLists.flatMap((list, i) =>
          (Array.isArray(list) ? list : []).map((a: any) => ({
            id: a.id,
            course_id: courseRows[i].id,
            title: a.title,
            max_score: a.max_score ?? 100,
            status: a.status,
          })),
        )
        setAssignments(allAssignments)

        // Normalize DB rubric shape into the client Rubric model.
        const allRubrics: RubricRow[] = rubricLists.flatMap((list, i) =>
          (Array.isArray(list) ? list : []).map((r: any) => ({
            id: r.id,
            title: r.title,
            pointsPossible: r.points_possible ?? 0,
            criteria: (r.rubric_criteria ?? [])
              .slice()
              .sort((x: any, y: any) => x.order_index - y.order_index)
              .map(
                (c: any): RubricCriterion => ({
                  id: c.id,
                  description: c.description,
                  points: c.points,
                  ratings: (c.rubric_ratings ?? [])
                    .slice()
                    .sort((x: any, y: any) => x.order_index - y.order_index)
                    .map((rt: any) => ({
                      id: rt.id,
                      label: rt.label,
                      description: rt.description ?? '',
                      points: rt.points,
                    })),
                }),
              ),
            courseId: courseRows[i].id,
          })),
        )
        setRubrics(allRubrics)

        if (allAssignments.length > 0) setAssignmentId(allAssignments[0].id)
      } catch (e: any) {
        if (!cancelled) setLoadError(e?.message ?? 'Failed to load grading data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [userId])

  // ── Load submissions whenever the selected assignment changes ─
  useEffect(() => {
    let cancelled = false

    async function loadSubs() {
      if (!assignmentId) {
        setSubmissions([])
        return
      }
      try {
        const rows = await listSubmissions(assignmentId)
        if (cancelled) return
        const mapped: SubmissionRow[] = (rows as any[]).map(r => ({
          id: r.id,
          user_id: r.user_id,
          name: r.users?.name ?? 'Unknown student',
          status:
            r.status === 'graded' || r.status === 'submitted'
              ? 'submitted'
              : r.status === 'returned'
                ? 'late'
                : 'missing',
          submitted_at: r.submitted_at ?? null,
          score: r.score ?? null,
          content: r.feedback ?? null,
        }))
        setSubmissions(mapped)

        // Seed score inputs with existing grades.
        const seed: Record<string, number | null> = {}
        mapped.forEach(s => {
          seed[s.user_id] = s.score
        })
        setScores(prev => ({ ...seed, ...prev }))
      } catch {
        if (!cancelled) setSubmissions([])
      }
    }

    loadSubs()
    return () => {
      cancelled = true
    }
  }, [assignmentId])

  const assignment = useMemo(
    () => assignments.find(a => a.id === assignmentId),
    [assignments, assignmentId],
  )

  const activeRubric = useMemo(() => {
    if (!assignment || rubricId === '') return null
    return (
      rubrics.find(r => r.id === rubricId && r.courseId === assignment.course_id) ??
      rubrics.find(r => r.courseId === assignment.course_id) ??
      null
    )
  }, [rubrics, rubricId, assignment])

  const current = submissions[index]

  const goTo = useCallback(
    (next: number) => setIndex(Math.max(0, Math.min(next, submissions.length - 1))),
    [submissions.length],
  )

  useEffect(() => {
    if (index >= submissions.length && submissions.length > 0) setIndex(0)
  }, [submissions.length, index])

  const handleSave = async () => {
    if (!current) return
    setSaveError('')

    const score = scores[current.user_id]
    if (score === null || score === undefined) {
      setSaveError('Enter a score before saving.')
      return
    }
    if (!userId) {
      setSaveError('You must be signed in to save grades.')
      return
    }

    setSavingNow(true)
    try {
      // 1. Persist submission grade + feedback.
      if (current.id) {
        await gradeSubmission(current.id, score, feedback[current.user_id] ?? '', userId)
      }

      // 2. Persist rubric assessment when one is attached.
      if (activeRubric) {
        const ratings =
          rubricState[current.user_id] ??
          activeRubric.criteria.map(c => ({
            criterionId: c.id,
            ratingId: null,
            points: null,
            comments: '',
          }))
        const total = ratings.reduce((sum, r) => sum + (r.points ?? 0), 0)

        await saveAssessment({
          rubric_id: activeRubric.id,
          submission_id: current.id ?? null,
          user_id: current.user_id,
          assessor_id: userId,
          total_score: total,
          comments: feedback[current.user_id] ?? null,
          ratings: ratings.map(r => ({
            criterion_id: r.criterionId,
            rating_id: r.ratingId,
            points: r.points,
            comments: r.comments ?? null,
          })),
        })
      }

      setSavedIds(prev => new Set(prev).add(current.user_id))
    } catch (e: any) {
      setSaveError(e?.message ?? 'Save failed')
    } finally {
      setSavingNow(false)
    }
  }

  // ── Render states ─────────────────────────────────────────────

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="size-5 animate-spin mr-2" />
          Loading grading data…
        </div>
      </AppShell>
    )
  }

  if (loadError) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-4 py-24 text-center space-y-3">
          <AlertTriangle className="size-8 mx-auto text-destructive" />
          <p className="font-medium">Could not load grading data</p>
          <p className="text-sm text-muted-foreground">{loadError}</p>
          <Button asChild variant="outline">
            <Link href="/teacher/gradebook">Back to Gradebook</Link>
          </Button>
        </div>
      </AppShell>
    )
  }

  if (assignments.length === 0) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-4 py-24 text-center space-y-3">
          <FileCheck2 className="size-8 mx-auto text-muted-foreground" />
          <p className="font-medium">No published assignments yet</p>
          <p className="text-sm text-muted-foreground">
            Create an assignment first — then grade it here student by student.
          </p>
          <Button asChild variant="outline">
            <Link href="/teacher/assignments">Go to Assignments</Link>
          </Button>
        </div>
      </AppShell>
    )
  }

  const maxScore = assignment?.max_score ?? 100
  const score = current ? scores[current.user_id] ?? null : null
  const pct = score !== null && current ? Math.round((score / maxScore) * 100) : null
  const isSaved = current ? savedIds.has(current.user_id) : false
  const gradedCount = submissions.filter(
    s => savedIds.has(s.user_id) || (s.score !== null),
  ).length

  const rubricOptions = rubrics.filter(
    r => !assignment || r.courseId === assignment.course_id,
  )

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/teacher/gradebook" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold">Speed Grader</h1>
              <p className="text-sm text-muted-foreground">Grade one student at a time</p>
            </div>
          </div>

          <div className="w-full sm:w-72 space-y-2">
            <Select value={assignmentId} onValueChange={setAssignmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose assignment" />
              </SelectTrigger>
              <SelectContent>
                {assignments.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={rubricId} onValueChange={setRubricId}>
              <SelectTrigger>
                <SelectValue placeholder={rubricOptions.length ? 'Attach rubric…' : 'No rubrics for this course'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No rubric</SelectItem>
                {rubricOptions.map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.title} ({r.pointsPossible} pts)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {submissions.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center space-y-3">
              <FileCheck2 className="size-8 mx-auto text-muted-foreground" />
              <p className="font-medium">No submissions yet</p>
              <p className="text-sm text-muted-foreground">
                When students submit work it will appear here for grading.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Progress */}
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => goTo(index - 1)} disabled={index === 0}>
                <ChevronLeft className="size-4" />
              </Button>
              <div className="flex-1 text-center text-sm">
                Student <span className="font-semibold">{index + 1}</span> of{' '}
                <span className="font-semibold">{submissions.length}</span>
                <span className="text-muted-foreground"> · {gradedCount} graded</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goTo(index + 1)}
                disabled={index >= submissions.length - 1}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
              {/* Submission panel */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{current?.name}</CardTitle>
                    {current && (
                      <StatusBadge status={current.status} submittedAt={current.submitted_at} />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Student's actual submission */}
                  {current?.content && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Submitted work</p>
                      {driveFileId(current.content) ? (
                        <iframe
                          src={`https://drive.google.com/file/d/${driveFileId(current.content)}/preview`}
                          className="w-full h-[360px] rounded-md border"
                          allow="autoplay"
                          title={`Submission from ${current.name}`}
                        />
                      ) : (
                        <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap max-h-[240px] overflow-y-auto">
                          {current.content}
                        </div>
                      )}
                      <a
                        href={driveFileId(current.content) ? `https://drive.google.com/file/d/${driveFileId(current.content)}/view` : current.content}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        Open in Google Drive
                      </a>
                    </div>
                  )}

                  <div className="rounded-md border bg-muted/30 p-4 text-sm whitespace-pre-wrap min-h-[160px]">
                    {activeRubric ? (
                      <RubricGrader
                        rubric={activeRubric}
                        assessment={
                          rubricState[current!.user_id] ??
                          activeRubric.criteria.map(c => ({
                            criterionId: c.id,
                            ratingId: null,
                            points: null,
                            comments: '',
                          }))
                        }
                        onChange={ratings =>
                          setRubricState(prev => ({
                            ...prev,
                            [current!.user_id]: ratings,
                          }))
                        }
                        readOnly={isSaved}
                      />
                    ) : (
                      <span className="text-muted-foreground italic">
                        No rubric attached — enter an overall score on the right.
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Grading panel */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Grade</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="score-input">Score (out of {maxScore})</Label>
                      <Input
                        id="score-input"
                        type="number"
                        min={0}
                        max={maxScore}
                        value={score ?? ''}
                        onChange={e =>
                          current &&
                          setScores(prev => ({
                            ...prev,
                            [current.user_id]:
                              e.target.value === '' ? null : Number(e.target.value),
                          }))
                        }
                        disabled={isSaved || savingNow}
                      />
                    </div>

                    {pct !== null && (
                      <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm">
                        <span>{pct}%</span>
                        <Badge variant="outline">{percentToLetter(pct)}</Badge>
                      </div>
                    )}

                    <div className="space-y-1">
                      <Label htmlFor="feedback-input">Overall feedback</Label>
                      <Textarea
                        id="feedback-input"
                        rows={5}
                        placeholder="Comments the student will see..."
                        value={feedback[current?.user_id ?? ''] ?? ''}
                        onChange={e =>
                          current &&
                          setFeedback(prev => ({
                            ...prev,
                            [current.user_id]: e.target.value,
                          }))
                        }
                        disabled={isSaved || savingNow}
                      />
                    </div>

                    {saveError && (
                      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2.5 text-xs text-destructive">
                        {saveError}
                      </div>
                    )}

                    {isSaved ? (
                      <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-2.5 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-400">
                        <CheckCircle2 className="size-4 shrink-0" />
                        Saved to database
                      </div>
                    ) : (
                      <Button className="w-full gap-1" onClick={handleSave} disabled={savingNow}>
                        {savingNow ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Save className="size-4" />
                        )}
                        {savingNow ? 'Saving…' : 'Save Grade'}
                      </Button>
                    )}

                    {activeRubric && (
                      <p className="text-xs text-muted-foreground text-center">
                        Saves both the submission grade and rubric assessment.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Class progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <ProgressRow
                      label="Graded"
                      count={gradedCount}
                      total={submissions.length}
                      tone="green"
                    />
                    <ProgressRow
                      label="Needs grading"
                      count={submissions.length - gradedCount}
                      total={submissions.length}
                      tone="amber"
                    />
                    <ProgressRow
                      label="Missing"
                      count={submissions.filter(s => s.status === 'missing').length}
                      total={submissions.length}
                      tone="red"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}

function StatusBadge({ status, submittedAt }: { status: string; submittedAt: string | null }) {  switch (status) {
    case 'submitted':
      return (
        <Badge className="gap-1 bg-green-100 text-green-700">
          <CheckCircle2 className="size-3" /> Submitted
        </Badge>
      )
    case 'late':
      return (
        <Badge className="gap-1 bg-amber-100 text-amber-700">
          <Clock className="size-3" /> Late
          {submittedAt && (
            <span className="font-normal"> · {new Date(submittedAt).toLocaleDateString()}</span>
          )}
        </Badge>
      )
    default:
      return (
        <Badge className="gap-1 bg-red-100 text-red-700">
          <AlertTriangle className="size-3" /> Missing
        </Badge>
      )
  }
}

function ProgressRow({
  label,
  count,
  total,
  tone,
}: {
  label: string
  count: number
  total: number
  tone: 'green' | 'amber' | 'red'
}) {
  const barColor =
    tone === 'green' ? 'bg-green-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-red-500'
  const pctNum = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span>
          {count}/{total}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${barColor}`} style={{ width: `${pctNum}%` }} />
      </div>
    </div>
  )
}
