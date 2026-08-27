'use client'

import { useCallback, useEffect, useState } from 'react'
import { Download, Printer, Loader2, AlertCircle, FileText } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getCourses as listCourses } from '@/lib/queries'
import { getCourseGradeSummary } from '@/lib/api/grades'
import { listUsers } from '@/lib/api/students'
import { useWorkspace } from '@/lib/workspace-context'

type Row = {
  code: string
  title: string
  teacher: string
  enrolled: number
  gradedStudents: number
  classAverage: number | null
}

export default function PrincipalReportsPage() {
  const { institutionId } = useWorkspace()

  const [rows, setRows] = useState<Row[]>([])
  const [studentCount, setStudentCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!institutionId) return
    try {
      setLoading(true)
      setError('')
      const [courses, students] = await Promise.all([
        listCourses(institutionId),
        listUsers(institutionId, 'student').catch(() => []),
      ])
      setStudentCount(Array.isArray(students) ? students.length : 0)

      const summaries = await Promise.all(
        (courses as any[]).map(async c => {
          let s: any = { classAverage: null, count: 0 }
          try { s = await getCourseGradeSummary(c.id) } catch {}
          return {
            code: c.code,
            title: c.title,
            teacher: c.users?.name ?? 'Unassigned',
            enrolled: c.enrolled_students ?? 0,
            gradedStudents: s.count ?? 0,
            classAverage: s.classAverage ? Math.round(s.classAverage * 10) / 10 : null,
          }
        }),
      )
      summaries.sort((a, b) => a.code.localeCompare(b.code))
      setRows(summaries)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to build report')
    } finally {
      setLoading(false)
    }
  }, [institutionId])

  useEffect(() => {
    load()
  }, [load])

  const downloadCsv = () => {
    const lines: string[] = []
    lines.push(`Zynvera Institution Report`)
    lines.push(`Generated,${new Date().toLocaleString()}`)
    lines.push(`Students,${studentCount}`)
    lines.push(`Courses,${rows.length}`)
    lines.push('')
    lines.push('Course Code,Course Title,Teacher,Enrolled,Graded Students,Class Average %')
    rows.forEach(r => {
      lines.push(
        [
          r.code,
          `"${r.title.replace(/"/g, '""')}"`,
          `"${r.teacher.replace(/"/g, '""')}"`,
          r.enrolled,
          r.gradedStudents,
          r.classAverage !== null ? r.classAverage : '',
        ].join(','),
      )
    })

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `institution-report-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-6 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Institution Reports</h1>
            <p className="text-sm text-muted-foreground">Live snapshot across all courses</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadCsv} disabled={loading || rows.length === 0} className="gap-1">
              <Download className="size-3.5" /> CSV
            </Button>
            <Button variant="outline" onClick={() => window.print()} className="gap-1">
              <Printer className="size-3.5" /> Print / PDF
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin mr-2" /> Building report…
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-4" /> Course Summary
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {studentCount} students · generated {new Date().toLocaleDateString()}
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2">Code</th>
                    <th className="px-3 py-2">Course</th>
                    <th className="px-3 py-2 hidden sm:table-cell">Teacher</th>
                    <th className="px-3 py-2 text-right">Enrolled</th>
                    <th className="px-3 py-2 text-right">Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.code} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-3 py-2 font-medium">{r.code}</td>
                      <td className="px-3 py-2 truncate max-w-[180px]">{r.title}</td>
                      <td className="px-3 py-2 truncate max-w-[140px] text-muted-foreground hidden sm:table-cell">{r.teacher}</td>
                      <td className="px-3 py-2 text-right">{r.enrolled}</td>
                      <td className={`px-3 py-2 text-right font-medium ${
                        r.classAverage === null ? '' : r.classAverage >= 80 ? 'text-green-600' : r.classAverage >= 65 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {r.classAverage !== null ? `${r.classAverage}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
