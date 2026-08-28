'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, AlertCircle, GraduationCap, ArrowRight, KeyRound, MessageSquare, Megaphone } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Badge } from '@/components/ui/badge'
import { getMyChildren } from '@/lib/api/institution'
import { getStudentAverage } from '@/lib/api/grades'
import { getStudentAttendanceSummary, getTodayStatus } from '@/lib/api/attendance'
import { percentToLetter } from '@/lib/grading/calculate'
import { useWorkspace } from '@/lib/workspace-context'

type Child = {
  student_user_id: string
  relationship: string
  users: { id: string; name: string; email: string }
}

export default function ParentDashboardPage() {
  const { userId } = useWorkspace()

  const [today, setToday] = useState<Record<string, { marked: boolean; status: string | null }>>({})
  const [children, setChildren] = useState<Child[]>([])
  const [stats, setStats] = useState<Record<string, { avg: number | null; letter: string | null; attRate: number | null; absences: number }>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)
      setError('')
      const kids = (await getMyChildren(userId)) as any[]
      setChildren(kids ?? [])

      const nextStats: typeof stats = {}
      await Promise.all(
        (kids ?? []).map(async k => {
          const id = k.student_user_id
          const [avg, att] = await Promise.all([
            getStudentAverage(id).catch(() => ({ average: null, count: 0 })),
            getStudentAttendanceSummary(id).catch(() => ({ rate: null, absent: 0, total: 0 })),
          ])
          nextStats[id] = {
            avg: (avg as any).count > 0 ? Math.round((avg as any).average * 10) / 10 : null,
            letter: (avg as any).count > 0 ? percentToLetter((avg as any).average) : null,
            attRate: (att as any).total > 0 ? Math.round((att as any).rate) : null,
            absences: (att as any).absent ?? 0,
          }
        }),
      )
      setStats(nextStats)
      const t: Record<string, { marked: boolean; status: string | null }> = {}
      await Promise.all((kids ?? []).map(async k => {
        try { t[k.student_user_id] = await getTodayStatus(k.student_user_id) } catch {}
      }))
      setToday(t)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load your children')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Family Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track your children's progress</p>
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
        ) : children.length === 0 ? (
          <div className="neo rounded-2xl py-14 text-center space-y-3">
            <GraduationCap className="size-7 mx-auto text-muted-foreground" />
            <p className="text-sm font-medium">No children linked yet</p>
            <p className="text-sm text-muted-foreground">
              Link your child's account to track their progress.
            </p>
            <Link href="/parent/link" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium">
              <KeyRound className="size-3.5" /> Link a child
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {children.map(k => {
              const s = stats[k.student_user_id]
              return (
                <Link key={k.id} href={`/parent/child/${k.student_user_id}`} className="block neo rounded-2xl p-5 neo-hover">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-sm font-semibold">{k.users?.name}</h3>
                      <p className="text-xs text-muted-foreground capitalize">{k.relationship}</p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground shrink-0" />
                  </div>

                  <div className="rounded-xl neo-inset px-3 py-2 text-sm flex items-center gap-2 mb-3">
                    <span className="text-xs text-muted-foreground">Today:</span>
                    {today[k.student_user_id]?.marked ? (
                      <Badge variant={today[k.student_user_id].status === 'absent' ? 'destructive' : today[k.student_user_id].status === 'late' ? 'warning' : 'success'}>
                        {today[k.student_user_id].status}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Attendance not yet taken</span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl neo-flat p-3 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Grade</p>
                      <p className="text-lg font-bold mt-0.5">{s?.avg !== null && s?.avg !== undefined ? `${s.avg}%` : '\u2014'}</p>
                      {s?.letter && <Badge variant="outline" className="text-[10px] mt-1">{s.letter}</Badge>}
                    </div>
                    <div className="rounded-xl neo-flat p-3 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Attendance</p>
                      <p className={`text-lg font-bold mt-0.5 ${
                        s?.attRate == null ? '' : s.attRate >= 90 ? 'text-emerald-600' : s.attRate >= 75 ? 'text-amber-600' : 'text-red-500'
                      }`}>
                        {s?.attRate !== null && s?.attRate !== undefined ? `${s.attRate}%` : '\u2014'}
                      </p>
                    </div>
                    <div className="rounded-xl neo-flat p-3 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Absences</p>
                      <p className={`text-lg font-bold mt-0.5 ${s && s.absences > 3 ? 'text-red-500' : ''}`}>{s?.absences ?? 0}</p>
                      {s && s.absences > 3 && <p className="text-[10px] text-red-500 mt-0.5">Exceeds 3-day limit</p>}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/student/messages" className="neo-sm rounded-xl p-3 text-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2">
            <MessageSquare className="size-4" /> Messages
          </Link>
          <Link href="/student/announcements" className="neo-sm rounded-xl p-3 text-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2">
            <Megaphone className="size-4" /> Announcements
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
