'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, AlertCircle, Award, Target } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getUser } from '@/lib/api/students'
import { getStudentAverage, listGradesByStudent } from '@/lib/api/grades'
import { getStudentAttendanceSummary } from '@/lib/api/attendance'
import { percentToLetter } from '@/lib/grading/calculate'
import { cn } from '@/lib/utils'

export default function TeacherStudentDetailPage({ params }: { params: { id: string } }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [avg, setAvg] = useState<any>(null)
  const [grades, setGrades] = useState<any[]>([])
  const [att, setAtt] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const u = await getUser(params.id)
        if (cancelled) return
        setName(u.name)
        setEmail(u.email)
        const [a, g, at] = await Promise.all([
          getStudentAverage(params.id),
          listGradesByStudent(params.id),
          getStudentAttendanceSummary(params.id).catch(() => ({ total: 0, rate: null, absent: 0 })),
        ])
        if (cancelled) return
        setAvg({ average: Math.round((a as any).average * 10) / 10, count: (a as any).count })
        setGrades((g as any[]).slice(0, 15))
        setAtt(at)
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load student')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [params.id])

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="size-5 animate-spin mr-2" /> Loading record…
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
        <Link href="/teacher/students" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Roster
        </Link>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        <div>
          <h1 className="text-xl font-bold">{name}</h1>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card><CardContent className="p-4 text-center">
            <Award className="size-4 mx-auto text-muted-foreground" />
            <p className="text-xs text-muted-foreground mt-1 uppercase">Average</p>
            <p className="text-2xl font-bold">{avg?.count ? `${avg.average}%` : '—'}</p>
            {avg?.count ? <Badge variant="outline">{percentToLetter(avg.average)}</Badge> : null}
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Target className="size-4 mx-auto text-muted-foreground" />
            <p className="text-xs text-muted-foreground mt-1 uppercase">Attendance</p>
            <p className={cn('text-2xl font-bold', att?.total ? (att.rate >= 90 ? 'text-green-600' : 'text-amber-600') : '')}>
              {att?.total ? `${Math.round(att.rate)}%` : '—'}
            </p>
            <p className="text-[11px] text-muted-foreground">{att?.absent ?? 0} absences</p>
          </CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-4 space-y-2">
            <h2 className="text-sm font-semibold">Recent grades</h2>
            {grades.length === 0 ? (
              <p className="text-sm text-muted-foreground py-3 text-center">No graded work yet.</p>
            ) : (
              <ul className="divide-y border rounded-md text-sm">
                {grades.map(g => (
                  <li key={g.id} className="flex items-center gap-2 px-3 py-2">
                    <Badge variant="outline" className="shrink-0 text-[11px]">{g.courses?.code ?? '—'}</Badge>
                    <span className="truncate flex-1">{g.assessment_name}</span>
                    <span className="shrink-0">{g.score}/{g.max_score}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
