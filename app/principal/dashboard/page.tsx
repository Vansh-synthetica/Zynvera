'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Loader2,
  AlertCircle,
  GraduationCap,
  Users,
  BookOpen,
  Wallet,
  ShieldAlert, KeyRound,
  Megaphone,
  ArrowRight,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { listUsers } from '@/lib/api/students'
import { listCourses } from '@/lib/api/courses'
import { listAlerts } from '@/lib/api/institution'
import { listTransactions } from '@/lib/api/institution'
import { listAnnouncements } from '@/lib/api/announcements'
import { useWorkspace } from '@/lib/workspace-context'
import { cn } from '@/lib/utils'

export default function PrincipalDashboardPage() {
  const { institutionId, userName } = useWorkspace()

  const [stats, setStats] = useState({
    students: null as number | null,
    staff: null as number | null,
    courses: null as number | null,
    openAlerts: null as number | null,
    netFunds: null as number | null,
  })
  const [recentAlerts, setRecentAlerts] = useState<any[]>([])
  const [recentNews, setRecentNews] = useState<any[]>([])
  const [joinCode, setJoinCode] = useState<string | null>(null)
  const [regenBusy, setRegenBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!institutionId) return
      try {
        setLoading(true)
        setError('')

        const [students, staff, courses, alerts, txs, news] = await Promise.all([
          listUsers(institutionId, 'student').catch(() => []),
          Promise.all(
            ['teacher', 'department_head', 'admin', 'counselor'].map(r =>
              listUsers(institutionId, r).catch(() => []),
            ),
          ),
          listCourses(institutionId).catch(() => []),
          listAlerts(institutionId).catch(() => []),
          listTransactions(institutionId).catch(() => []),
          listAnnouncements(institutionId).catch(() => []),
        ])

        if (cancelled) return

        try {
          const supabase = (await import('@/lib/supabase/client')).createClient()
          const { data: inst } = await supabase
            .from('institutions')
            .select('name, join_code')
            .eq('id', institutionId)
            .single()
          if (inst?.join_code) setJoinCode(inst.join_code)
        } catch {}

        const staffFlat = staff.flat()
        const income = (txs as any[]).filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
        const expense = (txs as any[]).filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

        setStats({
          students: Array.isArray(students) ? students.length : 0,
          staff: staffFlat.length,
          courses: Array.isArray(courses) ? courses.length : 0,
          openAlerts: (alerts as any[]).filter(a => a.status === 'open').length,
          netFunds: income - expense,
        })

        // Open/critical first.
        const sortedAlerts = [...(alerts as any[])]
          .sort((a, b) => {
            const rank = (x: any) => (x.status === 'open' ? 0 : x.status === 'acknowledged' ? 1 : 2)
            return rank(a) - rank(b) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          })
          .slice(0, 4)
        setRecentAlerts(sortedAlerts)

        setRecentNews((news as any[]).slice(0, 3))
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load dashboard')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [institutionId])

  const firstName = (userName ?? 'Welcome').split(' ')[0]

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold">Institution Overview</h1>
          <p className="text-sm text-muted-foreground">Good to see you, {firstName}</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="size-5 animate-spin mr-2" /> Loading institution data…
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <Stat icon={GraduationCap} label="Students" value={stats.students ?? '—'} href="/principal/students" />
              <Stat icon={Users} label="Staff" value={stats.staff ?? '—'} href="/principal/staff" />
              <Stat icon={BookOpen} label="Courses" value={stats.courses ?? '—'} href="/principal/courses" />
              <Stat icon={Wallet}
                label="Net funds"
                value={stats.netFunds !== null ? `$${Number(stats.netFunds).toLocaleString()}` : '—'}
                tone={stats.netFunds !== null && stats.netFunds < 0 ? 'text-red-600' : undefined}
                href="/principal/finance" />
              <Stat icon={ShieldAlert}
                label="Open alerts"
                value={stats.openAlerts ?? '—'}
                tone={stats.openAlerts !== null && stats.openAlerts > 0 ? 'text-red-600' : undefined}
                href="/principal/alerts" />
            </div>

            {/* Join code card */}
            <Card className="border-dashed">
              <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <KeyRound className="size-4" /> School join code
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Teachers and staff enter this to join your institution.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold tracking-[0.25em]">{joinCode ?? '········'}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={regenBusy || !joinCode}
                    onClick={async () => {
                      if (!confirm('Regenerate? The old code stops working immediately.')) return
                      setRegenBusy(true)
                      try {
                        const supabase = (await import('@/lib/supabase/client')).createClient()
                        const { data } = await supabase.rpc('regenerate_join_code')
                        if (data) setJoinCode(data)
                      } finally {
                        setRegenBusy(false)
                      }
                    }}
                  >
                    Regenerate
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Alerts */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold flex items-center gap-2">
                      <ShieldAlert className="size-4" /> Latest alerts
                    </h2>
                    <Button asChild variant="ghost" size="sm" className="gap-1 h-7 text-xs">
                      <Link href="/principal/alerts">All <ArrowRight className="size-3" /></Link>
                    </Button>
                  </div>

                  {recentAlerts.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No alerts raised.</p>
                  ) : (
                    recentAlerts.map(a => (
                      <Link key={a.id} href="/principal/alerts" className="block rounded-md border p-2.5 hover:border-primary/40 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate flex-1">{a.title}</span>
                          <Badge variant={a.severity === 'critical' ? 'destructive' : a.severity === 'warning' ? 'secondary' : 'outline'}
                            className="text-[10px] shrink-0">
                            {a.severity}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{a.message}</p>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Announcements */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold flex items-center gap-2">
                      <Megaphone className="size-4" /> Recent announcements
                    </h2>
                    <Button asChild variant="ghost" size="sm" className="gap-1 h-7 text-xs">
                      <Link href="/principal/announcements">Manage <ArrowRight className="size-3" /></Link>
                    </Button>
                  </div>

                  {recentNews.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Nothing published yet.</p>
                  ) : (
                    recentNews.map(n => (
                      <Link key={n.id} href="/principal/announcements" className="block rounded-md border p-2.5 hover:border-primary/40 transition-colors">
                        <p className="text-sm font-medium truncate">{n.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{n.content}</p>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
              {[
                ['Departments', '/principal/departments'],
                ['Finance', '/principal/finance'],
                ['Analytics', '/principal/analytics'],
                ['Reports', '/principal/reports'],
              ].map(([label, href]) => (
                <Button key={href} asChild variant="outline" size="sm" className="h-10">
                  <Link href={href}>{label}</Link>
                </Button>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}

function Stat({ icon: Icon, label, value, sub, tone, href }: {
  icon: typeof Users
  label: string
  value: string | number
  sub?: string
  tone?: string
  href: string
}) {
  return (
    <Link href={href}>
      <Card className="hover:border-primary/40 transition-colors">
        <CardContent className="p-4">
          <Icon className="size-4 text-muted-foreground" />
          <p className={cn('text-xl font-bold mt-2', tone ?? '')}>{value}</p>
          <p className="text-[11px] text-muted-foreground">{label}{sub ? ` · ${sub}` : ''}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
