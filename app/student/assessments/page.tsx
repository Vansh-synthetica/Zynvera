'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Loader2, AlertCircle, FileText, CalendarClock } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  listAssessments,
  getAssessmentSubmission,
} from '@/lib/api/assessments'
import { getCoursesByStudent } from '@/lib/api/courses'
import { useWorkspace } from '@/lib/workspace-context'

type AsgRow = {
  id: string
  title: string
  type: string
  courseCode: string
  courseId: string
  start_date: string | null
  end_date: string | null
  duration: number | null
  max_score: number
  status: string
  myScore?: number | null
  attemptsUsed?: number
}

export default function StudentAssessmentsPage() {
  const { userId } = useWorkspace()

  const [items, setItems] = useState<AsgRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const { upcoming, done } = useMemo(() => {
    const now = Date.now()
    return {
      upcoming: items.filter(a => !a.myScore && (!a.end_date || new Date(a.end_date).getTime() >= now - 86_400_000)),
      done: items.filter(a => a.myScore !== null || (a.end_date && new Date(a.end_date).getTime() < now - 86_400_000)).reverse(),
    }
  }, [items])

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Assessments</h1>
          <p className="text-sm text-muted-foreground">Quizzes, tests and exams across your courses</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
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
                <h2 className="text-sm font-semibold text-muted-foreground">Upcoming / open</h2>
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
                          {a.start_date && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                              <CalendarClock className="size-3" />
                              {new Date(a.start_date).toLocaleString()}
                              {a.duration ? ` · ${a.duration} min` : ''}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {a.attemptsUsed ? (
                            <Badge variant="secondary">Attempted</Badge>
                          ) : (
                            <Badge>In class</Badge>
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
                <h2 className="text-sm font-semibold text-muted-foreground pt-2">Completed / past</h2>
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
    </AppShell>
  )
}
