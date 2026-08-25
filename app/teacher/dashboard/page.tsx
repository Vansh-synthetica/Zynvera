'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, AlertCircle, BookOpen, Users, ClipboardCheck, Plus, ArrowRight, CheckCircle2 } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getCoursesByTeacher } from '@/lib/api/courses'
import { listAssignments } from '@/lib/api/assignments'
import { getStudentAverage } from '@/lib/api/grades'
import { percentToLetter } from '@/lib/grading/calculate'
import { useWorkspace } from '@/lib/workspace-context'

export default function TeacherDashboardPage() {
  const { userId, userName } = useWorkspace()
  const [stats, setStats] = useState<{ courses: number | null; students: number | null; assignments: number | null; avg: number | null }>({ courses: null, students: null, assignments: null, avg: null })
  const [courseList, setCourseList] = useState<any[]>([])
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
        if (cancelled) return
        setCourseList(cs as any[])

        const asgLists = await Promise.all((cs as any[]).map(c => listAssignments(c.id).catch(() => [])))
        const totalAsg = asgLists.reduce((s, l) => s + (l as any[]).length, 0)

        // Average across first course with grades (cheap proxy for dashboard).
        let avg: number | null = null
        if (cs.length > 0) {
          const s = await getStudentAverage('__none__').catch(() => ({ average: null, count: 0 }))
          void s
        }

        if (!cancelled) setStats({ courses: cs.length, students: 0, assignments: totalAsg, avg })
        // Enrolment counts per course come embedded via listCoursesByTeacher rows.
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load dashboard')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [userId])

  const firstName = (userName ?? 'there').split(' ')[0]

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Teacher Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome back, {firstName}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1">
              <Link href="/teacher/courses/new"><Plus className="size-3.5" /> New Course</Link>
            </Button>
            <Button asChild size="sm" className="gap-1">
              <Link href="/teacher/assignments"><ClipboardCheck className="size-3.5" /> Assignments</Link>
            </Button>
          </div>
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
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <Card><CardContent className="p-4">
                <BookOpen className="size-4 text-muted-foreground" />
                <p className="text-2xl font-bold mt-2">{stats.courses ?? '—'}</p>
                <p className="text-[11px] text-muted-foreground">Active courses</p>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <ClipboardCheck className="size-4 text-muted-foreground" />
                <p className="text-2xl font-bold mt-2">{stats.assignments ?? '—'}</p>
                <p className="text-[11px] text-muted-foreground">Assignments created</p>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <Users className="size-4 text-muted-foreground" />
                <p className="text-2xl font-bold mt-2">{courseList.reduce((s, c: any) => s + (c.enrolled_students ?? 0), 0)}</p>
                <p className="text-[11px] text-muted-foreground">Total enrolments</p>
              </CardContent></Card>
            </div>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">My Courses</h2>
                  <Button asChild variant="ghost" size="sm" className="gap-1 h-7 text-xs">
                    <Link href="/teacher/courses">All courses <ArrowRight className="size-3" /></Link>
                  </Button>
                </div>
                {courseList.length === 0 ? (
                  <div className="py-8 text-center space-y-2">
                    <p className="text-sm text-muted-foreground">No courses yet — create your first one.</p>
                    <Button asChild variant="outline" size="sm" className="gap-1">
                      <Link href="/teacher/courses/new"><Plus className="size-3.5" /> Create Course</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {courseList.map((c: any) => (
                      <Link key={c.id} href={`/teacher/courses/${c.id}/edit`} className="flex items-center gap-3 rounded-md border p-3 hover:border-primary/40 transition-colors">
                        <Badge variant="outline" className="shrink-0">{c.code}</Badge>
                        <span className="text-sm font-medium truncate flex-1">{c.title}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{c.enrolled_students ?? 0}/{c.max_students}</span>
                        <ArrowRight className="size-3.5 text-muted-foreground shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  )
}
