'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, AlertCircle, Award } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  listGradesByStudent,
  getStudentAverage,
} from '@/lib/api/grades'
import { percentToLetter } from '@/lib/grading/calculate'
import { useWorkspace } from '@/lib/workspace-context'
import { cn } from '@/lib/utils'

type GradeRow = {
  id: string
  course_id: string
  assessment_name: string
  assessment_type: string | null
  score: number
  max_score: number
  date: string | null
  feedback: string | null
  courses?: { title?: string; code?: string }
}

export default function StudentGradesPage() {
  const { userId } = useWorkspace()

  const [grades, setGrades] = useState<GradeRow[]>([])
  const [overall, setOverall] = useState<{ average: number; count: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)
      setError('')
      const rows = (await listGradesByStudent(userId)) as any[]
      setGrades(rows ?? [])
      const avg = await getStudentAverage(userId)
      setOverall({
        average: Math.round((avg as any).average * 10) / 10,
        count: (avg as any).count,
      })
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load grades')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  // Group entries by course with per-course averages.
  const byCourse = useMemo(() => {
    const map = new Map<string, { label: string; rows: GradeRow[]; earned: number; possible: number }>()
    grades.forEach(g => {
      const key = g.course_id
      const label = g.courses?.code ? `${g.courses.code} — ${g.courses.title}` : 'Course'
      if (!map.has(key)) map.set(key, { label, rows: [], earned: 0, possible: 0 })
      const entry = map.get(key)!
      entry.rows.push(g)
      entry.earned += g.score
      entry.possible += g.max_score
    })
    return Array.from(map.entries()).map(([id, v]) => ({
      id,
      ...v,
      pct: v.possible > 0 ? Math.round((v.earned / v.possible) * 1000) / 10 : null,
    }))
  }, [grades])

  const tone = (pct: number | null) => {
    if (pct === null) return 'text-muted-foreground'
    if (pct >= 90) return 'text-green-600'
    if (pct >= 80) return 'text-blue-600'
    if (pct >= 70) return 'text-yellow-600'
    if (pct >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
        <div>
          <h1 className="text-lg font-semibold">My Grades</h1>
          <p className="text-sm text-muted-foreground">Everything your teachers have marked</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin mr-2" /> Loading grades…
          </div>
        ) : grades.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center space-y-2">
              <Award className="size-7 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">No graded work yet</p>
              <p className="text-sm text-muted-foreground">
                When teachers mark your submissions, results appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Overall */}
            {overall && overall.count > 0 && (
              <Card>
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Overall average</p>
                    <p className={cn('text-3xl font-bold', tone(overall.average))}>
                      {overall.average.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">{overall.count} graded entries</p>
                  </div>
                  <Badge variant="outline" className={cn('text-lg px-4 py-2', tone(overall.average))}>
                    {percentToLetter(overall.average)}
                  </Badge>
                </CardContent>
              </Card>
            )}

            {/* Per course */}
            <div className="space-y-4">
              {byCourse.map(course => (
                <Card key={course.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">{course.label}</h3>
                      <span className={cn('text-sm font-bold', tone(course.pct))}>
                        {course.pct !== null ? `${course.pct}%` : '—'}
                        {course.pct !== null && (
                          <span className="ml-1.5 font-normal text-xs text-muted-foreground">
                            {percentToLetter(course.pct)}
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="divide-y border rounded-md">
                      {course.rows.map(g => {
                        const pct = Math.round((g.score / g.max_score) * 100)
                        return (
                          <details key={g.id} className="group px-3 py-2.5">
                            <summary className="flex items-center gap-2 cursor-pointer list-none">
                              <span className="text-sm flex-1 min-w-0 truncate">{g.assessment_name}</span>
                              {g.date && (
                                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                                  {new Date(g.date).toLocaleDateString()}
                                </span>
                              )}
                              <Badge variant="outline" className="text-[11px] capitalize shrink-0">
                                {g.assessment_type ?? 'grade'}
                              </Badge>
                              <span className={cn('text-sm font-medium w-16 text-right shrink-0', tone(pct))}>
                                {g.score}/{g.max_score}
                              </span>
                            </summary>
                            {g.feedback && (
                              <p className="text-xs text-muted-foreground mt-1.5 pl-1 whitespace-pre-wrap">
                                Feedback: {g.feedback}
                              </p>
                            )}
                          </details>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
