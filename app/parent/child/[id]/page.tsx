'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  Award,
  Target,
  ClipboardList,
  Receipt,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Badge } from '@/components/ui/badge'
import { getUser } from '@/lib/api/students'
import { getStudentAverage, listGradesByStudent } from '@/lib/api/grades'
import {
  getStudentAttendanceSummary,
  getStudentAttendance,
} from '@/lib/api/attendance'
import { getCoursesByStudent } from '@/lib/api/courses'
import { getAssignmentsDueSoon } from '@/lib/queries'
import { getMyChildren } from '@/lib/api/institution'
import { FeeStatus } from '@/components/fee-status'
import { percentToLetter } from '@/lib/grading/calculate'
import { useWorkspace } from '@/lib/workspace-context'
import { cn } from '@/lib/utils'

export default function ParentChildDetailPage({ params }: { params: { id: string } }) {
  const { userId } = useWorkspace()
  const [childName, setChildName] = useState('')
  const [siblings, setSiblings] = useState<{ id: string; name: string }[]>([])
  const [avg, setAvg] = useState<{ average: number | null; count: number } | null>(null)
  const [grades, setGrades] = useState<any[]>([])
  const [attSum, setAttSum] = useState<any>(null)
  const [attRows, setAttRows] = useState<any[]>([])
  const [dueSoon, setDueSoon] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notLinked, setNotLinked] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      let name = 'Student'
      try {
        const u = await getUser(params.id)
        name = u.name
      } catch {
        setNotLinked(true)
        setLoading(false)
        return
      }
      setChildName(name)

      if (userId) {
        const kids = (await getMyChildren(userId).catch(() => [])) as any[]
        setSiblings((kids ?? []).map((k: any) => ({ id: k.student_user_id, name: k.users?.name ?? 'Child' })))
      }

      const [a, g, as, ar] = await Promise.all([
        getStudentAverage(params.id).catch(() => ({ average: null, count: 0 })),
        listGradesByStudent(params.id).catch(() => []),
        getStudentAttendanceSummary(params.id).catch(() => ({ total: 0, rate: null, absent: 0, present: 0, late: 0, excused: 0 })),
        getStudentAttendance(params.id).catch(() => []),
      ])

      let dues: any[] = []
      try {
        const cs = await getCoursesByStudent(params.id)
        const ids = (cs as any[]).map(c => c.id)
        if (ids.length) {
          dues = ((await getAssignmentsDueSoon(ids, 14)) as any[]) ?? []
        }
      } catch {}

      setAvg({ average: Math.round((a as any).average * 10) / 10, count: (a as any).count })
      setGrades((g as any[]).slice(0, 10))
      setAttSum(as)
      setAttRows((ar as any[]).slice(0, 12))
      setDueSoon(dues.slice(0, 6))
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load record')
    } finally {
      setLoading(false)
    }
  }, [params.id, userId])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="size-5 animate-spin mr-2" /> Loading record...
        </div>
      </AppShell>
    )
  }

  if (notLinked) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-4 py-24 text-center space-y-3">
          <AlertCircle className="size-8 mx-auto text-destructive" />
          <p className="font-medium">This record isn't linked to your account</p>
          <p className="text-sm text-muted-foreground">
            For privacy you can only view your own children. Contact the school office to be linked.
          </p>
          <Link href="/parent/dashboard" className="text-sm text-primary hover:underline">Back to dashboard</Link>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6">
        <Link href="/parent/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Family Dashboard
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight">{childName}</h1>

        {siblings.length > 1 && (
          <div className="flex items-center gap-2">
            {siblings.map((s, i) => (
              <Link
                key={s.id}
                href={`/parent/child/${s.id}`}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-medium transition-colors',
                  s.id === params.id
                    ? 'bg-primary text-primary-foreground'
                    : 'neo-flat text-muted-foreground hover:text-foreground',
                )}
              >
                {s.name}
              </Link>
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="neo rounded-2xl p-4 text-center">
            <Award className="size-4 mx-auto text-muted-foreground" />
            <p className="text-xs text-muted-foreground mt-1 uppercase">Overall grade</p>
            <p className="text-2xl font-bold">{avg?.count ? `${avg.average}%` : '\u2014'}</p>
            {avg?.count ? <Badge variant="outline" className="mt-1">{percentToLetter(avg.average)}</Badge> : null}
          </div>
          <div className="neo rounded-2xl p-4 text-center">
            <Target className="size-4 mx-auto text-muted-foreground" />
            <p className="text-xs text-muted-foreground mt-1 uppercase">Attendance</p>
            <p className={cn(
              'text-2xl font-bold',
              attSum?.total ? (attSum.rate >= 90 ? 'text-emerald-600' : attSum.rate >= 75 ? 'text-amber-600' : 'text-red-500') : '',
            )}>
              {attSum?.total ? `${Math.round(attSum.rate)}%` : '\u2014'}
            </p>
            <p className="text-[11px] text-muted-foreground">{attSum?.absent ?? 0} absences</p>
          </div>
        </div>

        {/* Upcoming due */}
        <div className="neo rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <ClipboardList className="size-4" /> Due in the next two weeks
          </h2>
          {dueSoon.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing due soon.</p>
          ) : (
            <div className="space-y-2">
              {dueSoon.map(a => (
                <div key={a.id} className="flex items-center gap-2 rounded-xl neo-flat px-3 py-2 text-sm">
                  <span className="truncate flex-1">{a.title}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(a.due_date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent grades */}
        <div className="neo rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Award className="size-4" /> Recent grades
          </h2>
          {grades.length === 0 ? (
            <p className="text-sm text-muted-foreground">No graded work yet.</p>
          ) : (
            <div className="space-y-1">
              {grades.map(g => (
                <div key={g.id} className="flex items-center gap-2 rounded-xl neo-flat px-3 py-2 text-sm">
                  <Badge variant="outline" className="shrink-0 text-[11px]">{g.courses?.code ?? '\u2014'}</Badge>
                  <span className="truncate flex-1">{g.assessment_name}</span>
                  <span className="shrink-0">{g.score}/{g.max_score}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent attendance */}
        <div className="neo rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Target className="size-4" /> Recent attendance
          </h2>
          {attRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No records yet.</p>
          ) : (
            <div className="space-y-1">
              {attRows.map(r => (
                <div key={r.id} className="flex items-center gap-2 rounded-xl neo-flat px-3 py-2 text-sm">
                  <span className="w-24 shrink-0 text-xs text-muted-foreground">{r.date}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'capitalize shrink-0 text-[11px]',
                      r.status === 'present' && 'text-emerald-600',
                      r.status === 'absent' && 'text-red-500',
                      r.status === 'late' && 'text-amber-600',
                    )}
                  >
                    {r.status}
                  </Badge>
                  <span className="truncate text-xs text-muted-foreground">{r.class_sections?.name ?? ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fees */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold flex items-center gap-2 px-1">
            <Receipt className="size-4" /> Fee status
          </h2>
          <FeeStatus studentUserId={params.id} />
        </div>
      </div>
    </AppShell>
  )
}
