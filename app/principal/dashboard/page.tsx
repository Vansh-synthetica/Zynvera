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
  Copy,
  Check,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
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
  const [regenConfirmOpen, setRegenConfirmOpen] = useState(false)
  const [copied, setCopied] = useState(false)
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
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Institution Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Good to see you, {firstName}</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin mr-2" /> Loading institution data...
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <Stat icon={GraduationCap} label="Students" value={stats.students ?? '\u2014'} href="/principal/students" />
              <Stat icon={Users} label="Staff" value={stats.staff ?? '\u2014'} href="/principal/staff" />
              <Stat icon={BookOpen} label="Courses" value={stats.courses ?? '\u2014'} href="/principal/courses" />
              <Stat icon={Wallet}
                label="Net funds"
                value={stats.netFunds !== null ? `$${Number(stats.netFunds).toLocaleString()}` : '\u2014'}
                tone={stats.netFunds !== null && stats.netFunds < 0 ? 'text-red-500' : undefined}
                href="/principal/finance" />
              <Stat icon={ShieldAlert}
                label="Open alerts"
                value={stats.openAlerts ?? '\u2014'}
                tone={stats.openAlerts !== null && stats.openAlerts > 0 ? 'text-red-500' : undefined}
                href="/principal/alerts" />
            </div>

            {/* Join code card */}
            <div className="neo rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold flex items-center gap-2">
                  <KeyRound className="size-4 text-muted-foreground" /> School join code
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Teachers and staff enter this to join your institution.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-bold tracking-[0.25em] neo-inset rounded-xl px-4 py-2">{joinCode ?? '\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7'}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!joinCode}
                  onClick={() => {
                    if (joinCode) {
                      navigator.clipboard.writeText(joinCode)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }
                  }}
                  title="Copy join code"
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={regenBusy || !joinCode}
                  onClick={() => setRegenConfirmOpen(true)}
                >
                  Regenerate
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Alerts */}
              <div className="neo rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold flex items-center gap-2">
                    <ShieldAlert className="size-4 text-muted-foreground" /> Latest alerts
                  </h2>
                  <Link href="/principal/alerts" className="text-xs text-primary hover:underline flex items-center gap-1">
                    All <ArrowRight className="size-3" />
                  </Link>
                </div>

                {recentAlerts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">No alerts raised.</p>
                ) : (
                  <div className="space-y-2">
                    {recentAlerts.map(a => (
                      <Link key={a.id} href="/principal/alerts" className="block rounded-xl p-3 neo-flat hover:bg-secondary/30 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate flex-1">{a.title}</span>
                          <Badge variant={a.severity === 'critical' ? 'destructive' : a.severity === 'warning' ? 'warning' : 'outline'}
                            className="text-[10px] shrink-0">
                            {a.severity}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{a.message}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Announcements */}
              <div className="neo rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold flex items-center gap-2">
                    <Megaphone className="size-4 text-muted-foreground" /> Recent announcements
                  </h2>
                  <Link href="/principal/announcements" className="text-xs text-primary hover:underline flex items-center gap-1">
                    Manage <ArrowRight className="size-3" />
                  </Link>
                </div>

                {recentNews.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">Nothing published yet.</p>
                ) : (
                  <div className="space-y-2">
                    {recentNews.map(n => (
                      <Link key={n.id} href="/principal/announcements" className="block rounded-xl p-3 neo-flat hover:bg-secondary/30 transition-colors">
                        <p className="text-sm font-medium truncate">{n.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{n.content}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
              {[
                ['Departments', '/principal/departments'],
                ['Finance', '/principal/finance'],
                ['Analytics', '/principal/analytics'],
                ['Reports', '/principal/reports'],
              ].map(([label, href]) => (
                <Link key={href} href={href}
                  className="neo-sm rounded-xl p-3 text-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {label}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Regenerate join code dialog */}
      <Dialog open={regenConfirmOpen} onOpenChange={setRegenConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Regenerate Join Code?</DialogTitle>
            <DialogDescription>
              The old code stops working immediately. Teachers and staff using the old code will not be able to join.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegenConfirmOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={regenBusy}
              onClick={async () => {
                setRegenBusy(true)
                try {
                  const supabase = (await import('@/lib/supabase/client')).createClient()
                  const { data } = await supabase.rpc('regenerate_join_code')
                  if (data) setJoinCode(data)
                  setRegenConfirmOpen(false)
                } catch (e: any) {
                  setError(e?.message ?? 'Failed to regenerate')
                } finally {
                  setRegenBusy(false)
                }
              }}
            >
              {regenBusy ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
    <Link href={href} className="neo-sm rounded-2xl p-4 neo-hover block">
      <div className="size-8 rounded-xl bg-muted/50 flex items-center justify-center mb-2">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className={cn('text-2xl font-semibold tracking-tight', tone ?? 'text-foreground')}>{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{label}{sub ? ` \u00B7 ${sub}` : ''}</p>
    </Link>
  )
}
