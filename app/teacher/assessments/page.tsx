'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, AlertCircle, FileText, Plus } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getCoursesByTeacher } from '@/lib/api/courses'
import { listAssessments } from '@/lib/api/assessments'
import { useWorkspace } from '@/lib/workspace-context'

export default function TeacherAssessmentsPage() {
  const { userId } = useWorkspace()
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!userId) return
      try {
        setLoading(true)
        setError('')
        const cs = await getCoursesByTeacher(userId)
        const lists = await Promise.all(
          (cs as any[]).map(c =>
            listAssessments(c.id).then(rows =>
              (rows as any[]).map(a => ({ ...a, courseCode: c.code })),
            ).catch(() => []),
          ),
        )
        if (!cancelled) setRows(lists.flat())
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load assessments')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [userId])

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Assessments</h1>
            <p className="text-sm text-muted-foreground">{rows.length} across your courses</p>
          </div>
          <Button asChild className="gap-1">
            <Link href="/teacher/assessments/builder"><Plus className="size-4" /> New Assessment</Link>
          </Button>
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
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center space-y-3">
              <FileText className="size-7 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">No assessments yet</p>
              <p className="text-sm text-muted-foreground">Build quizzes and exams with the drag-and-drop builder.</p>
              <Button asChild variant="outline" size="sm" className="gap-1">
                <Link href="/teacher/assessments/builder"><Plus className="size-3.5" /> Open Builder</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {rows.map(a => (
              <Card key={a.id}>
                <CardContent className="p-4 flex flex-wrap items-center gap-3">
                  <Badge variant="outline" className="shrink-0">{a.courseCode}</Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {a.type} · {a.max_score} pts{a.duration ? ` · ${a.duration} min` : ''}
                      {a.start_date ? ` · ${new Date(a.start_date).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  <Badge variant={a.status === 'active' ? 'default' : 'secondary'} className="shrink-0 capitalize">
                    {a.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
