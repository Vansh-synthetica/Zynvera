'use client'

import { useCallback, useEffect, useState } from 'react'
import { Download, Printer, Loader2, AlertCircle, FileText } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  listGradesByStudent,
  getStudentAverage,
} from '@/lib/api/grades'
import { getStudentAttendanceSummary } from '@/lib/api/attendance'
import { percentToLetter } from '@/lib/grading/calculate'
import { useWorkspace } from '@/lib/workspace-context'

export default function StudentReportsPage() {
  const { userId, userName } = useWorkspace()

  const [grades, setGrades] = useState<any[]>([])
  const [avg, setAvg] = useState<{ average: number | null; count: number } | null>(null)
  const [att, setAtt] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)
      setError('')
      const [g, a, at] = await Promise.all([
        listGradesByStudent(userId),
        getStudentAverage(userId),
        getStudentAttendanceSummary(userId).catch(() => ({ total: 0, rate: null, present: 0, absent: 0, late: 0, excused: 0 })),
      ])
      setGrades(g as any[])
      setAvg({ average: Math.round((a as any).average * 10) / 10, count: (a as any).count })
      setAtt(at)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to build report')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  const downloadCsv = () => {
    if (!grades.length && !att?.total) return
    const lines: string[] = []
    lines.push(`Zynvera Progress Report,,`)
    lines.push(`Student,"${userName ?? ''}"`)
    lines.push(`Generated,${new Date().toLocaleString()}`)
    lines.push(`Overall Average,${avg?.count ? `${avg.average}% (${percentToLetter(avg.average)})` : '—'}`)
    lines.push(`Attendance Rate,${att?.total ? `${Math.round(att.rate)}%` : '—'}`)
    lines.push(`Present/Late/Excused/Absent,${att?.present ?? 0}/${att?.late ?? 0}/${att?.excused ?? 0}/${att?.absent ?? 0}`)
    lines.push('')
    lines.push('Course,Assessment,Type,Score,Max,Percent,Date,Feedback')
    grades.forEach(g => {
      const pct = g.max_score > 0 ? Math.round((g.score / g.max_score) * 100) : ''
      lines.push(
        [
          `"${g.courses?.code ?? ''} ${g.courses?.title ?? ''}"`,
          `"${(g.assessment_name ?? '').replace(/"/g, '""')}"`,
          g.assessment_type ?? '',
          g.score,
          g.max_score,
          typeof pct === 'number' ? `${pct}%` : '',
          g.date ?? '',
          `"${(g.feedback ?? '').replace(/"/g, '""')}"`,
        ].join(','),
      )
    })

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `zynvera-report-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div>
            <h1 className="text-lg font-semibold">My Reports</h1>
            <p className="text-sm text-muted-foreground">Export your progress any time</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadCsv} disabled={loading || (!grades.length && !att?.total)} className="gap-1">
              <Download className="size-3.5" /> CSV
            </Button>
            <Button variant="outline" onClick={() => window.print()} className="gap-1">
              <Printer className="size-3.5" /> Print / PDF
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive print:hidden">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="size-5 animate-spin mr-2" /> Building report…
          </div>
        ) : (
          <Card className="print:border-0 print:shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-4" /> Progress Summary
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {userName ?? 'Student'} · generated {new Date().toLocaleDateString()}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <SummaryBox
                  label="Overall grade"
                  value={avg?.count ? `${avg.average}%` : '—'}
                  sub={avg?.count ? percentToLetter(avg.average) : `${avg?.count ?? 0} entries`}
                />
                <SummaryBox
                  label="Attendance"
                  value={att?.total ? `${Math.round(att.rate)}%` : '—'}
                  sub={`${att?.total ?? 0} classes recorded`}
                />
              </div>

              {att?.total > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1.5">Breakdown</p>
                  <div className="grid grid-cols-4 gap-2 text-center text-sm">
                    {([
                      ['Present', att.present], ['Late', att.late],
                      ['Excused', att.excused], ['Absent', att.absent],
                    ] as const).map(([l, v]) => (
                      <div key={l} className="rounded-md border py-1.5">
                        <span className="font-semibold">{v}</span>
                        <span className="block text-[10px] text-muted-foreground">{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-1.5">Recent graded work</p>
                {grades.slice(0, 8).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No entries yet.</p>
                ) : (
                  <ul className="space-y-1 text-sm border rounded-md divide-y">
                    {grades.slice(0, 8).map(g => (
                      <li key={g.id} className="flex items-center gap-2 px-3 py-1.5">
                        <span className="font-medium shrink-0 w-16">{g.courses?.code}</span>
                        <span className="truncate flex-1">{g.assessment_name}</span>
                        <span>{g.score}/{g.max_score}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-[11px] text-muted-foreground mt-1">
                  Full list included in the CSV export.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}

function SummaryBox({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-md border bg-muted/30 p-4 text-center">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  )
}
