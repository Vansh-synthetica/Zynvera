'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, AlertCircle, BookOpen, GraduationCap, Users } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getCoursesByStudent } from '@/lib/api/courses'
import { useWorkspace } from '@/lib/workspace-context'

const colorMap: Record<string, string> = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  purple: 'from-purple-500 to-purple-600',
  orange: 'from-orange-500 to-orange-600',
  red: 'from-red-500 to-red-600',
  pink: 'from-pink-500 to-pink-600',
}

export default function StudentCoursesPage() {
  const { userId } = useWorkspace()
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError('')
        if (!userId) throw new Error('Sign in required')
        const rows = await getCoursesByStudent(userId)
        if (!cancelled) setCourses(rows as any[])
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load courses')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [userId])

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-lg font-semibold">My Courses</h1>
          <p className="text-sm text-muted-foreground">Everything you're enrolled in this term</p>
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
        ) : courses.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center space-y-2">
              <BookOpen className="size-7 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">No enrollments yet</p>
              <p className="text-sm text-muted-foreground">
                Your teachers add you to courses — they'll appear here instantly.
              </p>
              <Button asChild variant="outline" className="mt-2">
                <Link href="/student/dashboard">Back to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c: any) => (
              <Card key={c.id} className="overflow-hidden border-border/50 neo-hover transition-shadow p-0">
                <div className={`h-1.5 bg-gradient-to-r ${colorMap[c.color] ?? colorMap.blue}`} />
                <CardContent className="p-4 space-y-3">
                  <div>
                    <Badge variant="outline" className="text-[11px]">{c.code}</Badge>
                    <h3 className="font-semibold mt-1.5 leading-snug">{c.title}</h3>
                    {c.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{c.description}</p>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground pt-1 border-t">
                    {c.users?.name && (
                      <p className="flex items-center gap-1.5 pt-2">
                        <GraduationCap className="size-3.5 shrink-0" />
                        {c.users.name}
                      </p>
                    )}
                    <p className="flex items-center gap-1.5 pb-1">
                      <Users className="size-3.5 shrink-0" />
                      {c.enrolled_students ?? '—'} / {c.max_students ?? '—'} students
                    </p>
                  </div>

                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={`/student/courses/${c.id}`}>Open Course</Link>
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
