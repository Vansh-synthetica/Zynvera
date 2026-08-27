'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, AlertCircle, BarChart3 } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCoursesByTeacher } from '@/lib/api/courses'
import { getCourseGradeSummary } from '@/lib/api/grades'
import { useWorkspace } from '@/lib/workspace-context'
import { cn } from '@/lib/utils'

type Row = { id: string; code: string; title: string; avg: number | null; students: number; dist: Record<string, number> }

export default function TeacherAnalyticsPage() {
  const { userId } = useWorkspace()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)
      setError('')
      const cs = await getCoursesByTeacher(userId)
      const summaries = await Promise.all(
        (cs as any[]).map(async c => {
          try {
            const s: any = await getCourseGradeSummary(c.id)
            return { id: c.id, code: c.code, title: c.title, avg: s.classAverage ? Math.round(s.classAverage * 10) / 10 : null, students: s.count ?? 0, dist: s.distribution ?? { A: 0, B: 0, C: 0, D: 0, F: 0 } }
          } catch {
            return { id: c.id, code: c.code, title: c.title, avg: null, students: 0, dist: { A: 0, B: 0, C: 0, D: 0, F: 0 } }
          }
        }),
      )
      summaries.sort((a, b) => a.code.localeCompare(b.code))
      setRows(summaries)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { load() }, [load])

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-lg font-semibold">Class Analytics</h1>
          <p className="text-sm text-muted-foreground">Grade performance across your courses</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin mr-2" /> Crunching…
          </div>
        ) : rows.length === 0 ? (
          <Card><CardContent className="py-14 text-center space-y-2">
            <BarChart3 className="size-7 mx-auto text-muted-foreground" />
            <p className="text-sm font-medium">No courses yet</p>
          </CardContent></Card>
        ) : (
          <Card>
            <CardHeader className="pb-1"><CardTitle className="text-base">Grade summaries</CardTitle></CardHeader>
            <CardContent className="space-y-4 pt-2">
              {rows.map(r => (
                <div key={r.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{r.code} <span className="font-normal text-muted-foreground">— {r.title}</span></span>
                    <span className={cn(
                      'text-sm font-semibold',
                      r.avg === null ? 'text-muted-foreground' : r.avg >= 80 ? 'text-green-600' : r.avg >= 65 ? 'text-amber-600' : 'text-red-600',
                    )}>
                      {r.avg !== null ? `${r.avg}%` : 'No grades'}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', (r.avg ?? 0) >= 80 ? 'bg-green-500' : (r.avg ?? 0) >= 65 ? 'bg-amber-500' : (r.avg ?? 0) > 0 ? 'bg-red-500' : '')}
                      style={{ width: `${r.avg ?? 0}%` }}
                    />
                  </div>
                  <div className="flex gap-1 mt-1">
                    {(Object.entries(r.dist) as [string, number][]).map(([l, n]) =>
                      n > 0 ? <Badge key={l} variant="outline" className="text-[10px]">{l}:{n}</Badge> : null,
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
