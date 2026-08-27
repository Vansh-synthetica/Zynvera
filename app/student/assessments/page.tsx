'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, AlertCircle, FileText, CalendarClock, PlayCircle, CheckCircle2, X } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  listAssessments,
  getAssessmentSubmission,
  listQuestions,
} from '@/lib/api/assessments'
import { createClient } from '@/lib/supabase/client'
import { getCoursesByStudent } from '@/lib/api/courses'
import { useWorkspace } from '@/lib/workspace-context'

type AsgRow = {
  id: string
  title: string
  type: string
  description: string | null
  instructions: string | null
  courseCode: string
  courseId: string
  start_date: string | null
  end_date: string | null
  duration: number | null
  max_score: number
  max_attempts: number
  status: string
  myScore?: number | null
  attemptsUsed?: number
}

type Question = {
  id: string
  type: string
  text: string
  options: any
  points: number
}

type QuizResult = { score: number | null; total: number; needsGrading: boolean }

function optionTexts(options: any): string[] {
  if (Array.isArray(options)) {
    return options
      .map((o: any) => (typeof o === 'string' ? o : o?.text ?? ''))
      .filter(Boolean)
  }
  return []
}

export default function StudentAssessmentsPage() {
  const { userId } = useWorkspace()

  const [items, setItems] = useState<AsgRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Quiz-taking state
  const [activeQuiz, setActiveQuiz] = useState<AsgRow | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [quizPhase, setQuizPhase] = useState<'intro' | 'questions' | 'result'>('intro')
  const [quizLoading, setQuizLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [quizError, setQuizError] = useState('')

  const load = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)
      setError('')
      const cs = await getCoursesByStudent(userId)

      const lists = await Promise.all(
        (cs as any[]).map(c => listAssessments(c.id).catch(() => [])),
      )

      const flat: any[] = lists.flatMap((l, i) =>
        ((l as any[]) ?? []).map(a => ({ ...a, courseCode: cs[i].code, courseId: cs[i].id })),
      )
      // Only show published/active/completed to students.
      const visible = flat.filter(a => a.status !== 'draft')

      // Fetch my latest attempt score per assessment.
      const withMine = await Promise.all(
        visible.map(async a => {
          try {
            const sub = await getAssessmentSubmission(a.id, userId)
            return {
              ...a,
              myScore: sub?.score ?? null,
              attemptsUsed: sub?.attempt_number ?? 0,
            }
          } catch {
            return { ...a, myScore: null, attemptsUsed: 0 }
          }
        }),
      )

      withMine.sort((a, b) => {
        const ta = a.start_date ? new Date(a.start_date).getTime() : Infinity
        const tb = b.start_date ? new Date(b.start_date).getTime() : Infinity
        return ta - tb
      })

      setItems(withMine)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load assessments')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  const isWindowOpen = (a: AsgRow) => {
    const now = Date.now()
    if (a.start_date && new Date(a.start_date).getTime() > now) return false
    if (a.end_date && new Date(a.end_date).getTime() < now - 86_400_000) return false
    return true
  }

  const canTake = (a: AsgRow) =>
    a.status === 'active' &&
    isWindowOpen(a) &&
    (a.attemptsUsed ?? 0) < (a.max_attempts || 1)

  const { upcoming, done } = useMemo(() => {
    return {
      upcoming: items.filter(a => a.myScore == null),
      done: items.filter(a => a.myScore != null).reverse(),
    }
  }, [items])

  const openQuiz = async (a: AsgRow) => {
    setActiveQuiz(a)
    setQuizPhase('intro')
    setResult(null)
    setAnswers({})
    setQuizError('')
    setQuizLoading(true)
    try {
      const qs = await listQuestions(a.id)
      setQuestions(
        (qs as any[]).map(q => ({
          id: q.id,
          type: q.type,
          text: q.text,
          options: q.options,
          points: q.points,
        })),
      )
    } catch (e: any) {
      setQuizError(e?.message ?? 'Could not load questions')
    } finally {
      setQuizLoading(false)
    }
  }

  const submitQuiz = async () => {
    if (!activeQuiz || !userId) return
    setSubmitting(true)
    setQuizError('')
    try {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('student_submit_quiz', {
        p_assessment_id: activeQuiz.id,
        p_answers: answers,
      })
      if (error) throw error
      const r: any = data
      setResult({
        score: r?.score ?? null,
        total: r?.total ?? 0,
        needsGrading: !!r?.needs_grading,
      })
      setQuizPhase('result')
    } catch (e: any) {
      setQuizError(e?.message ?? 'Submit failed')
    } finally {
      setSubmitting(false)
    }
  }

  const closeQuiz = () => {
    setActiveQuiz(null)
    if (quizPhase === 'result') load()
  }

  const answeredCount = questions.filter(q => (answers[q.id] ?? '').trim().length > 0).length

  const renderQuestion = (q: Question) => {
    const val = answers[q.id] ?? ''
    const opts = optionTexts(q.options)
    if ((q.type === 'multiple_choice' || q.type === 'true_false') && opts.length > 0) {
      return (
        <div className="space-y-2">
          {opts.map((o: string) => (
            <label
              key={o}
              className={`flex items-center gap-2 rounded-lg border p-3 text-sm cursor-pointer transition-colors ${
                val === o ? 'border-primary bg-primary/5 font-medium' : 'hover:bg-muted/50'
              }`}
            >
              <input
                type="radio"
                name={q.id}
                checked={val === o}
                onChange={() => setAnswers(prev => ({ ...prev, [q.id]: o }))}
                className="accent-primary"
              />
              {o}
            </label>
          ))}
        </div>
      )
    }
    if (q.type === 'long_answer') {
      return (
        <Textarea
          value={val}
          onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
          placeholder="Type your answer…"
          rows={4}
        />
      )
    }
    return (
      <Input
        value={val}
        onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
        placeholder={q.type === 'numeric' ? 'Enter a number…' : 'Type your answer…'}
        inputMode={q.type === 'numeric' ? 'decimal' : undefined}
      />
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-lg font-semibold">Assessments</h1>
          <p className="text-sm text-muted-foreground">Quizzes, tests and exams across your courses</p>
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
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center space-y-2">
              <FileText className="size-7 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">No assessments scheduled</p>
              <p className="text-sm text-muted-foreground">Your teachers will publish them here.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <h2 className="text-sm font-semibold text-muted-foreground">Open / pending</h2>
                <div className="space-y-3">
                  {upcoming.map(a => (
                    <Card key={a.id} className="border-primary/30">
                      <CardContent className="p-4 flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold">{a.title}</h3>
                            <Badge variant="outline" className="text-[11px] capitalize">{a.type}</Badge>
                            <Badge variant="outline" className="text-[11px]">{a.courseCode}</Badge>
                          </div>
                          {(a.start_date || a.duration) && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                              <CalendarClock className="size-3" />
                              {a.start_date ? new Date(a.start_date).toLocaleString() : ''}
                              {a.duration ? ` · ${a.duration} min` : ''}
                              {` · ${(a.attemptsUsed ?? 0)}/${a.max_attempts || 1} attempts used`}
                            </p>
                          )}
                          {a.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {canTake(a) ? (
                            <Button size="sm" onClick={() => openQuiz(a)}>
                              <PlayCircle className="size-4 mr-1" />
                              {(a.attemptsUsed ?? 0) > 0 ? 'Retake' : 'Start'}
                            </Button>
                          ) : a.status === 'active' && !isWindowOpen(a) ? (
                            <Badge variant="outline">Closed</Badge>
                          ) : (a.attemptsUsed ?? 0) >= (a.max_attempts || 1) ? (
                            <Badge variant="secondary">Awaiting grade</Badge>
                          ) : (
                            <Badge variant="secondary">Not open yet</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {done.length > 0 && (
              <>
                <h2 className="text-sm font-semibold text-muted-foreground pt-2">Completed / graded</h2>
                <div className="space-y-2 opacity-90">
                  {done.map(a => (
                    <Card key={a.id}>
                      <CardContent className="px-4 py-3 flex items-center gap-3 text-sm">
                        <span className="font-medium truncate flex-1">{a.title}</span>
                        <Badge variant="outline" className="text-[11px] shrink-0">{a.courseCode}</Badge>
                        {a.myScore !== null && a.myScore !== undefined ? (
                          <Badge variant="default" className="shrink-0">{a.myScore}/{a.max_score}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {a.start_date ? new Date(a.start_date).toLocaleDateString() : ''}
                          </span>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* ── Take quiz dialog ── */}
      <Dialog open={!!activeQuiz} onOpenChange={(open) => { if (!open) closeQuiz() }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {activeQuiz?.title}
              {activeQuiz && <Badge variant="outline">{activeQuiz.courseCode}</Badge>}
            </DialogTitle>
          </DialogHeader>

          {quizLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="size-5 animate-spin mr-2" /> Loading…
            </div>
          ) : quizPhase === 'intro' ? (
            <div className="space-y-4">
              {activeQuiz?.instructions && (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                  {activeQuiz.instructions}
                </div>
              )}
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                <li>{questions.length} questions</li>
                {activeQuiz?.duration ? <li>{activeQuiz.duration} minutes suggested</li> : null}
                <li>{activeQuiz?.max_attempts || 1} attempt{(activeQuiz?.max_attempts || 1) > 1 ? 's' : ''} allowed — you have used {activeQuiz?.attemptsUsed ?? 0}</li>
                <li>Objective answers are graded instantly; written answers go to your teacher.</li>
              </ul>
              {questions.length === 0 ? (
                <p className="text-sm text-destructive">This assessment has no questions yet.</p>
              ) : (
                <Button className="w-full" onClick={() => setQuizPhase('questions')}>
                  Start now
                </Button>
              )}
            </div>
          ) : quizPhase === 'questions' ? (
            <div className="space-y-5">
              {questions.map((q, i) => (
                <div key={q.id} className="space-y-2">
                  <p className="text-sm font-medium">
                    {i + 1}. {q.text}{' '}
                    <span className="text-xs font-normal text-muted-foreground">({q.points} pt{q.points !== 1 ? 's' : ''})</span>
                  </p>
                  {renderQuestion(q)}
                </div>
              ))}
              {quizError && (
                <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
                  <AlertCircle className="size-4 shrink-0" /> {quizError}
                </div>
              )}
              <Button className="w-full" onClick={submitQuiz} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" /> Submitting…
                  </>
                ) : (
                  `Submit (${answeredCount}/${questions.length} answered)`
                )}
              </Button>
            </div>
          ) : (
            result && (
              <div className="py-8 text-center space-y-3">
                {result.needsGrading || result.score === null ? (
                  <>
                    <CheckCircle2 className="size-10 mx-auto text-green-600" />
                    <p className="font-semibold">Submitted!</p>
                    <p className="text-sm text-muted-foreground">
                      Your written answers will be graded by your teacher.
                    </p>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-10 mx-auto text-green-600" />
                    <p className="font-semibold text-lg">
                      You scored {Number(result.score)} / {Number(result.total)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {Math.round((Number(result.score) / Math.max(1, Number(result.total))) * 100)}% — added to your grades.
                    </p>
                  </>
                )}
                <Button onClick={closeQuiz}>Done</Button>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
