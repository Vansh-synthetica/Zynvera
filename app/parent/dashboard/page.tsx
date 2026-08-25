'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, AlertCircle, GraduationCap, ArrowRight } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
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
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Family Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Track only your own children's progress — securely scoped to them
          </p>
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
        ) : children.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center space-y-2">
              <GraduationCap className="size-7 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">No children linked yet</p>
              <p className="text-sm text-muted-foreground">
                The school connects your account to your child(ren)'s records.
                Contact the office if this looks wrong.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {children.map(k => {
              const s = stats[k.student_user_id]
              return (
                <Link key={k.id} href={`/parent/child/${k.student_user_id}`} className="block">
                  <Card className="hover:border-primary/40 transition-colors">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold">{k.users?.name}</h3>
                          <p className="text-xs text-muted-foreground capitalize">{k.relationship}</p>
                        </div>
                        <ArrowRight className="size-4 text-muted-foreground shrink-0" />
                      </div>

                      <div className="mb-2 rounded-md border px-3 py-2 text-sm flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Right now:</span>
                        {today[k.student_user_id]?.marked ? (
                          <Badge className={today[k.student_user_id].status === 'absent' ? 'bg-red-100 text-red-700' : today[k.student_user_id].status === 'late' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}>
                            {today[k.student_user_id].status}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not marked yet today</span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <div className="rounded-md border p-2 text-center">
                          <p className="text-[10px] text-muted-foreground uppercase">Grade</p>
                          <p className="text-lg font-bold">{s?.avg !== null && s?.avg !== undefined ? `${s.avg}%` : '—'}</p>
                          {s?.letter && <Badge variant="outline" className="text-[10px]">{s.letter}</Badge>}
                        </div>
                        <div className="rounded-md border p-2 text-center">
                          <p className="text-[10px] text-muted-foreground uppercase">Attendance</p>
                          <p className={`text-lg font-bold ${
                            s?.attRate == null ? '' : s.attRate >= 90 ? 'text-green-600' : s.attRate >= 75 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {s?.attRate !== null && s?.attRate !== undefined ? `${s.attRate}%` : '—'}
                          </p>
                        </div>
                        <div className="rounded-md border p-2 text-center">
                          <p className="text-[10px] text-muted-foreground uppercase">Absences</p>
                          <p className={`text-lg font-bold ${s && s.absences > 3 ? 'text-red-600' : ''}`}>{s?.absences ?? 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
