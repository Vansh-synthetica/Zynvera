'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, AlertCircle, BookOpen, Plus, Pencil } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getCoursesByTeacher } from '@/lib/api/courses'
import { useWorkspace } from '@/lib/workspace-context'

export default function TeacherCoursesPage() {
  const { userId } = useWorkspace()
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    if (!userId) return
    getCoursesByTeacher(userId)
      .then(cs => { if (!cancelled) setRows(cs as any[]) })
      .catch(e => { if (!cancelled) setError(e?.message ?? 'Failed to load') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [userId])

  const filtered = rows.filter(r =>
    r.title?.toLowerCase().includes(search.toLowerCase()) ||
    r.code?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">My Courses</h1>
            <p className="text-sm text-muted-foreground">{rows.length} courses</p>
          </div>
          <Button asChild className="gap-1">
            <Link href="/teacher/courses/new"><Plus className="size-4" /> New Course</Link>
          </Button>
        </div>

        <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="size-5 animate-spin mr-2" /> Loading…
          </div>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center space-y-3">
              <BookOpen className="size-7 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">No courses yet</p>
              <Button asChild variant="outline" size="sm" className="gap-1">
                <Link href="/teacher/courses/new"><Plus className="size-3.5" /> Create your first course</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((c: any) => (
              <Card key={c.id}>
                <CardContent className="p-4 flex flex-wrap items-center gap-3">
                  <Badge variant="outline" className="shrink-0">{c.code}</Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.enrolled_students ?? 0}/{c.max_students} students · {c.status}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="gap-1 shrink-0">
                    <Link href={`/teacher/courses/${c.id}/edit`}><Pencil className="size-3" /> Edit</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
