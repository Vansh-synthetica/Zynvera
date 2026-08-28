'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, AlertCircle, Users, Plus } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getCoursesByTeacher } from '@/lib/api/courses'
import { listClassSections } from '@/lib/api/classes'
import { useWorkspace } from '@/lib/workspace-context'

export default function TeacherClassesPage() {
  const { userId } = useWorkspace()
  const [sections, setSections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!userId) return
      try {
        setLoading(true)
        setError('')
        const cs = await getCoursesByTeacher(userId)
        const lists = await Promise.all(
          (cs as any[]).map(c =>
            listClassSections(c.id).then(rows =>
              (rows as any[]).map(s => ({ ...s, courseCode: c.code, courseTitle: c.title, courseId: c.id })),
            ).catch(() => []),
          ),
        )
        if (!cancelled) setSections(lists.flat())
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load classes')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [userId])

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-4">
        <div>
          <h1 className="text-lg font-semibold">My Classes</h1>
          <p className="text-sm text-muted-foreground">Scheduled sections across your courses</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin mr-2" /> Loading…
          </div>
        ) : sections.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center space-y-2">
              <Users className="size-7 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">No class sections yet</p>
              <p className="text-sm text-muted-foreground">
                Sections are created from a course's edit page — add schedules to your courses.
              </p>
              <Button asChild variant="outline" size="sm" className="gap-1">
                <Link href="/teacher/courses"><Plus className="size-3.5" /> Go to Courses</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sections.map(s => (
              <Card key={s.id}>
                <CardContent className="p-4 flex flex-wrap items-center gap-3">
                  <Badge variant="outline" className="shrink-0">{s.courseCode}</Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[s.room, s.day, s.start_time && s.end_time ? `${s.start_time?.slice(0,5)}–${s.end_time?.slice(0,5)}` : null]
                        .filter(Boolean).join(' · ') || s.courseTitle}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="shrink-0 gap-1">
                    <Link href={`/teacher/class/${s.id}`}>Open</Link>
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
