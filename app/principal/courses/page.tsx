'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Loader2, AlertCircle, Search, BookOpen, GraduationCap } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { listCourses } from '@/lib/api/courses'
import { useWorkspace } from '@/lib/workspace-context'

type CourseRow = {
  id: string
  code: string
  title: string
  description: string | null
  status: string
  max_students: number
  enrolled_students: number
  users?: { name?: string }
  programmes?: { name?: string }
}

export default function PrincipalCoursesPage() {
  const { institutionId } = useWorkspace()

  const [rows, setRows] = useState<CourseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    if (!institutionId) return
    try {
      setLoading(true)
      setError('')
      setRows((await listCourses(institutionId)) as any[])
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load courses')
    } finally {
      setLoading(false)
    }
  }, [institutionId])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(
    () =>
      rows
        .filter(
          r =>
            r.title.toLowerCase().includes(search.toLowerCase()) ||
            r.code.toLowerCase().includes(search.toLowerCase()) ||
            (r.users?.name ?? '').toLowerCase().includes(search.toLowerCase()),
        )
        .sort((a, b) => a.code.localeCompare(b.code)),
    [rows, search],
  )

  const totalEnrolled = rows.reduce((s, r) => s + (r.enrolled_students ?? 0), 0)

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Course Management</h1>
            <p className="text-sm text-muted-foreground">
              {rows.length} courses · {totalEnrolled} enrolments
            </p>
          </div>
          <Input
            placeholder="Search courses or teachers…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-[240px]"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin mr-2" /> Loading courses…
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center space-y-2">
              <BookOpen className="size-7 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">No active courses</p>
              <p className="text-sm text-muted-foreground">
                Courses your teachers publish will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filtered.map(c => {
                  const fill =
                    c.max_students > 0 ? Math.round(((c.enrolled_students ?? 0) / c.max_students) * 100) : 0
                  return (
                    <div key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-muted/30 transition-colors">
                      <Badge variant="outline" className="shrink-0">{c.code}</Badge>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{c.title}</p>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                          {c.users?.name && (
                            <>
                              <GraduationCap className="size-3 shrink-0" /> {c.users.name}
                              {c.programmes?.name ? ` · ${c.programmes.name}` : ''}
                            </>
                          )}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {c.enrolled_students ?? 0}/{c.max_students}
                      </span>
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden hidden sm:block">
                        <div
                          className={`h-full ${fill >= 90 ? 'bg-red-500' : fill >= 60 ? 'bg-amber-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(100, fill)}%` }}
                        />
                      </div>
                      <Badge variant={c.status === 'active' ? 'default' : 'secondary'} className="shrink-0 capitalize text-[11px]">
                        {c.status}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
