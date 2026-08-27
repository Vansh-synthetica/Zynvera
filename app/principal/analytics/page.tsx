'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, AlertCircle, BarChart3 } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useWorkspace } from '@/lib/workspace-context'
import { cn } from '@/lib/utils'

type CourseSummary = {
  id: string
  code: string
  title: string
  classAverage: number | null
  gradedStudents: number
  distribution: { A: number; B: number; C: number; D: number; F: number }
}

export default function PrincipalAnalyticsPage() {
  const { institutionId } = useWorkspace()

  const [courses, setCourses] = useState<CourseSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!institutionId) return
    try {
      setLoading(true)
      setError('')
      // Institution-wide course summaries come from the shared queries module.
      const { getCourses: listCourses } = await import('@/lib/queries')
      const rows = await listCourses(institutionId)

      const { getCourseGradeSummary } = await import('@/lib/api/grades')
      const summaries = await Promise.all(
        (rows as any[]).map(async c => {
          try {
            const s = (await getCourseGradeSummary(c.id)) as any
            return {
              id: c.id,
              code: c.code,
              title: c.title,
              classAverage: s.classAverage ? Math.round(s.classAverage * 10) / 10 : null,
              gradedStudents: s.count ?? 0,
              distribution: s.distribution ?? { A: 0, B: 0, C: 0, D: 0, F: 0 },
            }
          } catch {
            return {
              id: c.id, code: c.code, title: c.title,
              classAverage: null, gradedStudents: 0,
              distribution: { A: 0, B: 0, C: 0, D: 0, F: 0 },
            }
          }
        }),
      )

      summaries.sort((a, b) => a.code.localeCompare(b.code))
      setCourses(summaries)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [institutionId])

  useEffect(() => {
    load()
  }, [load])

  const graded = courses.filter(c => c.classAverage !== null)
  const schoolAvg = graded.length
    ? Math.round((graded.reduce((s, c) => s + (c.classAverage ?? 0), 0) / graded.length) * 10) / 10
    : null
  const totalGrades = courses.reduce(
    (s, c) => s + Object.values(c.distribution).reduce((a, b) => a + b, 0),
    0,
  )

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Institution Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Aggregated from everything teachers record — live
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin mr-2" /> Aggregating…
          </div>
        ) : courses.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center space-y-2">
              <BarChart3 className="size-7 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">No active courses</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* School summary */}
            <div className="grid grid-cols-3 gap-3">
              <Card><CardContent className="p-4 text-center">
                <p className="text-[11px] text-muted-foreground uppercase">School average</p>
                <p className={cn(
                  'text-2xl font-bold mt-1',
                  schoolAvg === null ? '' : schoolAvg >= 80 ? 'text-green-600' : schoolAvg >= 65 ? 'text-amber-600' : 'text-red-600',
                )}>
                  {schoolAvg !== null ? `${schoolAvg}%` : '—'}
                </p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <p className="text-[11px] text-muted-foreground uppercase">Courses graded</p>
                <p className="text-2xl font-bold mt-1">{graded.length}/{courses.length}</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <p className="text-[11px] text-muted-foreground uppercase">Grade entries</p>
                <p className="text-2xl font-bold mt-1">{totalGrades}</p>
              </CardContent></Card>
            </div>

            {/* Per course */}
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-base">Course performance</CardTitle></CardHeader>
              <CardContent className="space-y-4 pt-2">
                {courses.map(c => (
                  <div key={c.id}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-medium">{c.code} <span className="font-normal text-muted-foreground truncate hidden sm:inline">— {c.title}</span></span>
                      <span className={cn(
                        'text-sm font-semibold shrink-0',
                        c.classAverage === null ? 'text-muted-foreground' : c.classAverage >= 80 ? 'text-green-600' : c.classAverage >= 65 ? 'text-amber-600' : 'text-red-600',
                      )}>
                        {c.classAverage !== null ? `${c.classAverage}%` : 'No grades'}
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          (c.classAverage ?? 0) >= 80 ? 'bg-green-500' : (c.classAverage ?? 0) >= 65 ? 'bg-amber-500' : (c.classAverage ?? 0) > 0 ? 'bg-red-500' : 'bg-transparent',
                        )}
                        style={{ width: `${c.classAverage ?? 0}%` }}
                      />
                    </div>

                    <div className="flex gap-1 mt-1">
                      {(Object.entries(c.distribution) as [string, number][]).map(([letter, n]) =>
                        n > 0 ? (
                          <Badge key={letter} variant="outline" className="text-[10px]">{letter}:{n}</Badge>
                        ) : null,
                      )}
                      {c.gradedStudents > 0 && (
                        <span className="text-[10px] text-muted-foreground ml-auto self-center">
                          {c.gradedStudents} student{c.gradedStudents === 1 ? '' : 's'} graded
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  )
}
