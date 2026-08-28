'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, AlertCircle, BookOpen, Users, ClipboardCheck, Plus, ArrowRight, CalendarClock, Award, ClipboardList } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getCoursesByTeacher } from '@/lib/api/courses'
import { listAssignments } from '@/lib/api/assignments'
import { useWorkspace } from '@/lib/workspace-context'

export default function TeacherDashboardPage() {
  const { userId, userName } = useWorkspace()
  const [stats, setStats] = useState<{ courses: number | null; students: number | null; assignments: number | null }>({ courses: null, students: null, assignments: null })
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

        if (!cancelled) setStats({ courses: cs.length, students: (cs as any[]).reduce((s: number, c: any) => s + (c.enrolled_students ?? 0), 0), assignments: totalAsg })
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
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Teacher Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{greeting}, {firstName}</p>
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
          <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin mr-2" /> Loading...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="neo-sm rounded-2xl p-4">
                <div className="size-8 rounded-xl bg-muted/50 flex items-center justify-center mb-2">
                  <BookOpen className="size-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{stats.courses ?? '\u2014'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Active courses</p>
              </div>
              <div className="neo-sm rounded-2xl p-4">
                <div className="size-8 rounded-xl bg-muted/50 flex items-center justify-center mb-2">
                  <ClipboardCheck className="size-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{stats.assignments ?? '\u2014'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Assignments</p>
              </div>
              <div className="neo-sm rounded-2xl p-4">
                <div className="size-8 rounded-xl bg-muted/50 flex items-center justify-center mb-2">
                  <Users className="size-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{courseList.reduce((s, c: any) => s + (c.enrolled_students ?? 0), 0)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Enrolments</p>
              </div>
            </div>

            <div className="neo rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">My Courses</h2>
                <Link href="/teacher/courses" className="text-xs text-primary hover:underline flex items-center gap-1">
                  All courses <ArrowRight className="size-3" />
                </Link>
              </div>
              {courseList.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <p className="text-sm text-muted-foreground">No courses yet. Create your first one.</p>
                  <Button asChild variant="outline" size="sm" className="gap-1">
                    <Link href="/teacher/courses/new"><Plus className="size-3.5" /> Create Course</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {courseList.map((c: any) => (
                    <Link key={c.id} href={`/teacher/courses/${c.id}/edit`} className="flex items-center gap-3 rounded-xl p-3 neo-flat hover:bg-secondary/30 transition-colors">
                      <Badge variant="outline" className="shrink-0">{c.code}</Badge>
                      <span className="text-sm font-medium truncate flex-1">{c.title}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{c.enrolled_students ?? 0}/{c.max_students}</span>
                      <ArrowRight className="size-3.5 text-muted-foreground shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Link href="/teacher/gradebook" className="neo-sm rounded-xl p-3 text-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2">
                <Award className="size-4" /> Gradebook
              </Link>
              <Link href="/teacher/attendance" className="neo-sm rounded-xl p-3 text-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2">
                <ClipboardList className="size-4" /> Attendance
              </Link>
              <Link href="/teacher/today" className="neo-sm rounded-xl p-3 text-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2">
                <CalendarClock className="size-4" /> Today
              </Link>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
