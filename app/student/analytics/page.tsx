'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, AlertCircle, BarChart3 } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  listGradesByStudent,
  getStudentAverage,
} from '@/lib/api/grades'
import {
  getStudentAttendance,
  getStudentAttendanceSummary,
} from '@/lib/api/attendance'
import { percentToLetter } from '@/lib/grading/calculate'
import { useWorkspace } from '@/lib/workspace-context'
import { cn } from '@/lib/utils'

type CourseStat = {
  code: string
  title: string
  avgPct: number | null
  gradedCount: number
  attendanceRate: number | null
  absences: number
}

export default function StudentAnalyticsPage() {
  const { userId } = useWorkspace()

  const [courseStats, setCourseStats] = useState<CourseStat[]>([])
  const [overall, setOverall] = useState<{ avg: number; count: number; attRate: number | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)
      setError('')

      const [grades, attRows, attSum, overallAvg] = await Promise.all([
        listGradesByStudent(userId),
        getStudentAttendance(userId).catch(() => []),
        getStudentAttendanceSummary(userId).catch(() => ({ rate: null, total: 0 })),
        getStudentAverage(userId).catch(() => ({ average: null, count: 0 })),
      ])

      // Per-course aggregation.
      const map = new Map<string, CourseStat>()
      ;(grades as any[]).forEach(g => {
        const key = g.course_id
        const code = g.courses?.code ?? '—'
        const title = g.courses?.title ?? 'Course'
        if (!map.has(key)) map.set(key, { code, title, avgPct: null, gradedCount: 0, attendanceRate: null, absences: 0 })
        map.get(key)!.gradedCount++
      })
      ;(attRows as any[]).forEach(r => {
        const key = r.class_sections?.courses ? (r.class_sections as any).courses.id : undefined
        const entry = key && map.has(key) ? map.get(key)! : null
        if (!entry) return
        const rateKey = '_scored' as any
        if (!(entry as any)[rateKey]) {
          ;(entry as any)._present = 0
          ;(entry as any)._total = 0
          ;(entry as any)[rateKey] = true
        }
        ;(entry as any)._total++
        if (r.status === 'present' || r.status === 'late') (entry as any)._present++
        if (r.status === 'absent') entry.absences++
      })

      const stats = Array.from(map.values()).map(e => {
        void e
        return e
      })

      // Percentages need raw scores — refetch per course is heavy; compute
      // from grades rows grouped here instead.
      const scoreMap = new Map<string, { earned: number; possible: number }>()
      ;(grades as any[]).forEach(g => {
        const s = scoreMap.get(g.course_id) ?? { earned: 0, possible: 0 }
        s.earned += g.score
        s.possible += g.max_score
        scoreMap.set(g.course_id, s)
      })
      stats.forEach(s => {
        const id = Array.from(map.entries()).find(([, v]) => v === s)?.[0]
        const sc = id ? scoreMap.get(id) : undefined
        s.avgPct = sc && sc.possible > 0 ? Math.round((sc.earned / sc.possible) * 1000) / 10 : null
        const tot = (s as any)._total ?? 0
        s.attendanceRate = tot > 0 ? Math.round(((s as any)._present / tot) * 100) : null
      })
      stats.sort((a, b) => a.code.localeCompare(b.code))

      setCourseStats(stats)
      setOverall({
        avg: (overallAvg as any).count > 0 ? Math.round((overallAvg as any).average * 10) / 10 : null,
        count: (overallAvg as any).count ?? 0,
        attRate: (attSum as any).total > 0 ? Math.round((attSum as any).rate) : null,
      })
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  const maxAvg = useMemo(
    () => Math.max(100, ...courseStats.map(s => s.avgPct ?? 0)),
    [courseStats],
  )

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
        <div>
          <h1 className="text-lg font-semibold">My Analytics</h1>
          <p className="text-sm text-muted-foreground">Your performance at a glance</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="size-5 animate-spin mr-2" /> Crunching numbers…
          </div>
        ) : courseStats.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center space-y-2">
              <BarChart3 className="size-7 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">No data yet</p>
              <p className="text-sm text-muted-foreground">Grades and attendance appear as they're recorded.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Overall cards */}
            <div className="grid grid-cols-3 gap-3">
              <MiniStat label="Overall average" value={overall?.avg !== null && overall?.avg !== undefined ? `${overall.avg}%` : '—'} sub={overall?.avg != null ? percentToLetter(overall.avg) : ''} />
              <MiniStat label="Attendance" value={overall?.attRate !== null && overall?.attRate !== undefined ? `${overall.attRate}%` : '—'} sub={`${overall?.count ?? 0} grades`} />
              <MiniStat label="Courses" value={String(courseStats.length)} sub="active" />
            </div>

            {/* Bars */}
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-base">Grade by course</CardTitle></CardHeader>
              <CardContent className="space-y-3 pt-2">
                {courseStats.map(s => (
                  <div key={s.code}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium">{s.code}</span>
                      <span className="text-muted-foreground">
                        {s.avgPct !== null ? `${s.avgPct}% (${percentToLetter(s.avgPct)})` : 'No grades'}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          (s.avgPct ?? 0) >= 90 ? 'bg-green-500' : (s.avgPct ?? 0) >= 70 ? 'bg-blue-500' : (s.avgPct ?? 0) > 0 ? 'bg-amber-500' : 'bg-transparent',
                        )}
                        style={{ width: `${((s.avgPct ?? 0) / maxAvg) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Attendance table */}
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-base">Attendance by course</CardTitle></CardHeader>
              <CardContent className="pt-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b">
                      <th className="py-1.5">Course</th>
                      <th className="py-1.5 text-right">Rate</th>
                      <th className="py-1.5 text-right">Absences</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseStats.map(s => (
                      <tr key={s.code} className="border-b last:border-0">
                        <td className="py-2 truncate max-w-[200px]">{s.code}</td>
                        <td className={cn(
                          'py-2 text-right font-medium',
                          s.attendanceRate === null ? 'text-muted-foreground' : s.attendanceRate >= 90 ? 'text-green-600' : s.attendanceRate >= 75 ? 'text-amber-600' : 'text-red-600',
                        )}>
                          {s.attendanceRate !== null ? `${s.attendanceRate}%` : '—'}
                        </td>
                        <td className="py-2 text-right">{s.absences}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {courseStats.every(s => s.attendanceRate === null) && (
                  <p className="text-xs text-muted-foreground mt-2">Attendance links to courses once teachers take registers in class sections.</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  )
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-3.5">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold mt-0.5">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  )
}
