'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Loader2,
  AlertCircle,
  BookOpen,
  Award,
  Target,
  ClipboardList,
  ArrowRight,
  Users,
  CalendarDays,
  MessagesSquare,
  Megaphone,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Badge } from '@/components/ui/badge'
import { getCoursesByStudent } from '@/lib/api/courses'
import { getAssignmentsDueSoon } from '@/lib/queries'
import { getStudentAverage } from '@/lib/api/grades'
import { getStudentAttendanceSummary } from '@/lib/api/attendance'
import { percentToLetter } from '@/lib/grading/calculate'
import { useWorkspace } from '@/lib/workspace-context'
import { cn } from '@/lib/utils'

export default function StudentDashboardPage() {
  const { userId, userName } = useWorkspace()

  const [stats, setStats] = useState({
    courses: null as number | null,
    avgGrade: null as number | null,
    attendanceRate: null as number | null,
    dueSoonCount: null as number | null,
  })
  const [dueSoon, setDueSoon] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!userId) return
      try {
        setLoading(true)
        setError('')
        const cs = await getCoursesByStudent(userId)
        const courseIds = (cs as any[]).map(c => c.id)

        const [avg, att, dues] = await Promise.all([
          getStudentAverage(userId).catch(() => ({ average: null, count: 0 })),
          getStudentAttendanceSummary(userId).catch(() => ({ rate: null, total: 0 })),
          courseIds.length > 0
            ? getAssignmentsDueSoon(courseIds, 7).catch(() => [])
            : Promise.resolve([]),
        ])

        if (cancelled) return
        setStats({
          courses: cs.length,
          avgGrade: (avg as any).count > 0 ? Math.round((avg as any).average * 10) / 10 : null,
          attendanceRate:
            (att as any).total > 0 ? Math.round((att as any).rate) : null,
          dueSoonCount: Array.isArray(dues) ? dues.length : 0,
        })
        setDueSoon(Array.isArray(dues) ? (dues as any[]).slice(0, 5) : [])
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
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {firstName}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Here's where you stand today</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        {loading && stats.courses === null ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin mr-2" /> Loading your data...
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard icon={BookOpen} label="Courses" value={stats.courses ?? '\u2014'} href="/student/courses" />
              <StatCard
                icon={Award}
                label="Avg grade"
                value={stats.avgGrade !== null ? `${stats.avgGrade}%` : '\u2014'}
                sub={stats.avgGrade !== null ? percentToLetter(stats.avgGrade) : undefined}
                tone={stats.avgGrade !== null ? (stats.avgGrade >= 80 ? 'text-emerald-600' : stats.avgGrade >= 60 ? 'text-amber-600' : 'text-red-500') : undefined}
                href="/student/grades"
              />
              <StatCard
                icon={Target}
                label="Attendance"
                value={stats.attendanceRate !== null ? `${stats.attendanceRate}%` : '\u2014'}
                tone={stats.attendanceRate !== null ? (stats.attendanceRate >= 90 ? 'text-emerald-600' : 'text-amber-600') : undefined}
                href="/student/attendance"
              />
              <StatCard
                icon={ClipboardList}
                label="Due this week"
                value={stats.dueSoonCount ?? '\u2014'}
                tone={stats.dueSoonCount !== null && stats.dueSoonCount > 0 ? 'text-primary' : undefined}
                href="/student/assignments"
              />
            </div>

            {/* Upcoming deadlines */}
            <div className="neo rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Coming up</h2>
                <Link href="/student/assignments" className="text-xs text-primary hover:underline flex items-center gap-1">
                  All assignments <ArrowRight className="size-3" />
                </Link>
              </div>

              {dueSoon.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  Nothing due in the next 7 days. Nice.
                </p>
              ) : (
                <div className="space-y-2">
                  {dueSoon.map(a => {
                    const due = new Date(a.due_date)
                    const daysLeft = Math.ceil((due.getTime() - Date.now()) / 86_400_000)
                    return (
                      <Link
                        key={a.id}
                        href={`/student/assignments/${a.id}`}
                        className="flex items-center gap-3 rounded-xl p-3 neo-flat hover:bg-secondary/30 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{a.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {due.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <Badge variant={daysLeft <= 1 ? 'destructive' : daysLeft <= 3 ? 'warning' : 'outline'} className="shrink-0">
                          {daysLeft <= 0 ? 'Today' : `${daysLeft}d`}
                        </Badge>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Community', href: '/student/community', icon: Users },
                { label: 'Calendar', href: '/student/calendar', icon: CalendarDays },
                { label: 'Messages', href: '/student/messages', icon: MessagesSquare },
                { label: 'Announcements', href: '/student/announcements', icon: Megaphone },
              ].map(item => (
                <Link key={item.href} href={item.href}
                  className="neo-sm rounded-xl p-3 text-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex flex-col items-center gap-1.5">
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
  href,
}: {
  icon: typeof BookOpen
  label: string
  value: string | number
  sub?: string
  tone?: string
  href: string
}) {
  return (
    <Link href={href} className="neo-sm rounded-2xl p-4 neo-hover block">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className={cn('text-2xl font-bold mt-1', tone ?? 'text-foreground')}>{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <div className="size-8 rounded-xl bg-muted/50 flex items-center justify-center">
          <Icon className="size-4 text-muted-foreground" />
        </div>
      </div>
    </Link>
  )
}
