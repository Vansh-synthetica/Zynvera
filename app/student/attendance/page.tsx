'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, AlertCircle, Target } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  getStudentAttendance,
  getStudentAttendanceSummary,
} from '@/lib/api/attendance'
import { useWorkspace } from '@/lib/workspace-context'
import { cn } from '@/lib/utils'

type Row = {
  id: string
  date: string
  status: string
  note?: string | null
  class_sections?: {
    name?: string
    courses?: { title?: string; code?: string }
  }
}

const statusStyles: Record<string, string> = {
  present: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  late: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  excused: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  absent: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
}

export default function StudentAttendancePage() {
  const { userId } = useWorkspace()

  const [rows, setRows] = useState<Row[]>([])
  const [summary, setSummary] = useState<{
    total: number; present: number; absent: number; late: number; excused: number; rate: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)
      setError('')
      const [records, sum] = await Promise.all([
        getStudentAttendance(userId),
        getStudentAttendanceSummary(userId),
      ])
      setRows((records as any[]) ?? [])
      setSummary(sum as any)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load attendance')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  // Group by date (newest first already from API).
  const byDate = useMemo(() => {
    const map = new Map<string, Row[]>()
    rows.forEach(r => {
      const list = map.get(r.date) ?? []
      list.push(r)
      map.set(r.date, list)
    })
    return Array.from(map.entries())
  }, [rows])

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-lg font-semibold">My Attendance</h1>
          <p className="text-sm text-muted-foreground">Your record across all classes</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin mr-2" /> Loading record…
          </div>
        ) : !summary || summary.total === 0 ? (
          <Card>
            <CardContent className="py-14 text-center space-y-2">
              <Target className="size-7 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">No attendance recorded yet</p>
              <p className="text-sm text-muted-foreground">Registers your teachers take will show here.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Attendance rate</p>
                    <p className={cn(
                      'text-3xl font-bold',
                      summary.rate >= 90 ? 'text-green-600' : summary.rate >= 75 ? 'text-amber-600' : 'text-red-600',
                    )}>
                      {Math.round(summary.rate)}%
                    </p>
                  </div>
                  <Target className={cn('size-10', summary.rate >= 90 ? 'text-green-500' : 'text-amber-500')} />
                </div>

                <div className="h-2 rounded-full bg-muted overflow-hidden flex" aria-hidden>
                  {(['present', 'late', 'excused', 'absent'] as const).map(k => (
                    <div
                      key={k}
                      className={cn(
                        k === 'present' && 'bg-green-500',
                        k === 'late' && 'bg-amber-500',
                        k === 'excused' && 'bg-blue-500',
                        k === 'absent' && 'bg-red-500',
                      )}
                      style={{ width: `${summary.total > 0 ? ((summary as any)[k] / summary.total) * 100 : 0}%` }}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  {([
                    ['Present', summary.present, 'text-green-600'],
                    ['Late', summary.late, 'text-amber-600'],
                    ['Excused', summary.excused, 'text-blue-600'],
                    ['Absent', summary.absent, 'text-red-600'],
                  ] as const).map(([label, count, cls]) => (
                    <div key={label} className="rounded-md border p-2">
                      <p className={cn('text-lg font-bold', cls)}>{count}</p>
                      <p className="text-[11px] text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* History by date */}
            <div className="space-y-3">
              {byDate.slice(0, 30).map(([date, dayRows]) => (
                <Card key={date}>
                  <CardContent className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">{new Date(date + 'T00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                    </div>
                    <div className="space-y-1.5">
                      {dayRows.map(r => (
                        <div key={r.id} className="flex items-center gap-2 text-sm">
                          <Badge className={cn('text-[11px] capitalize w-[76px] justify-center shrink-0', statusStyles[r.status])}>
                            {r.status}
                          </Badge>
                          <span className="truncate text-muted-foreground text-xs">
                            {r.class_sections?.courses?.code ? `${r.class_sections.courses.code} · ` : ''}
                            {r.class_sections?.name ?? 'Class'}
                          </span>
                        </div>
                      ))}
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
