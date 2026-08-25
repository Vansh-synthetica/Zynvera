'use client'

import { useEffect, useState } from 'react'
import { Loader2, AlertCircle, GraduationCap, Users, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { listUsers } from '@/lib/api/students'
import { getCourses as listCourses } from '@/lib/queries'
import { useWorkspace } from '@/lib/workspace-context'

export default function AdminOverviewPage() {
  const { institutionId } = useWorkspace()
  const [stats, setStats] = useState<{ students: number | null; staff: number | null; courses: number | null }>({ students: null, staff: null, courses: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!institutionId) return
      try {
        setLoading(true)
        setError('')
        const [s, staff, c] = await Promise.all([
          listUsers(institutionId, 'student').catch(() => []),
          listUsers(institutionId, 'teacher').catch(() => []),
          listCourses(institutionId).catch(() => []),
        ])
        if (!cancelled) setStats({ students: (s as any[]).length, staff: (staff as any[]).length, courses: (c as any[]).length })
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [institutionId])

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Admin Overview</h1>
          <p className="text-sm text-muted-foreground">Institution snapshot</p>
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
          <div className="grid grid-cols-3 gap-3">
            <Link href="/principal/students">
              <Card className="hover:border-primary/40 transition-colors"><CardContent className="p-4 text-center">
                <GraduationCap className="size-5 mx-auto text-muted-foreground" />
                <p className="text-2xl font-bold mt-2">{stats.students ?? '—'}</p>
                <p className="text-[11px] text-muted-foreground">Students</p>
              </CardContent></Card>
            </Link>
            <Link href="/principal/staff">
              <Card className="hover:border-primary/40 transition-colors"><CardContent className="p-4 text-center">
                <Users className="size-5 mx-auto text-muted-foreground" />
                <p className="text-2xl font-bold mt-2">{stats.staff ?? '—'}</p>
                <p className="text-[11px] text-muted-foreground">Teachers</p>
              </CardContent></Card>
            </Link>
            <Link href="/principal/courses">
              <Card className="hover:border-primary/40 transition-colors"><CardContent className="p-4 text-center">
                <BookOpen className="size-5 mx-auto text-muted-foreground" />
                <p className="text-2xl font-bold mt-2">{stats.courses ?? '—'}</p>
                <p className="text-[11px] text-muted-foreground">Courses</p>
              </CardContent></Card>
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  )
}
