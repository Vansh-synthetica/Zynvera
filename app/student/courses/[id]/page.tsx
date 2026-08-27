'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileText,
  Megaphone,
  GraduationCap,
  Users,
  ExternalLink,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getCourse } from '@/lib/api/courses'
import { listResources } from '@/lib/api/courses'
import { listCourseAnnouncements } from '@/lib/api/announcements'
import { useWorkspace } from '@/lib/workspace-context'

export default function StudentCourseDetailPage({ params }: { params: { id: string } }) {
  const { userId } = useWorkspace()
  const [course, setCourse] = useState<any>(null)
  const [resources, setResources] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError('')
        const c = await getCourse(params.id)
        if (cancelled) return
        setCourse(c)

        if (userId) {
          // Only fetch extras if enrolled; failures degrade gracefully.
          const [res, ann] = await Promise.all([
            listResources(params.id).catch(() => []),
            listCourseAnnouncements(params.id).catch(() => []),
          ])
          if (!cancelled) {
            setResources(res as any[])
            setAnnouncements(ann as any[])
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load course')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [params.id, userId])

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="size-5 animate-spin mr-2" /> Loading course…
        </div>
      </AppShell>
    )
  }

  if (error || !course) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-4 py-24 text-center space-y-3">
          <AlertCircle className="size-8 mx-auto text-destructive" />
          <p className="font-medium">Course unavailable</p>
          <p className="text-sm text-muted-foreground">{error ?? 'Not found'}</p>
          <Button asChild variant="outline"><Link href="/student/courses">Back to My Courses</Link></Button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
        <Link href="/student/courses" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> My Courses
        </Link>

        <Card className="overflow-hidden p-0">
          <div className={`h-2 bg-gradient-to-r ${{
            blue: 'from-blue-500 to-blue-600', green: 'from-green-500 to-green-600',
            purple: 'from-purple-500 to-purple-600', orange: 'from-orange-500 to-orange-600',
            red: 'from-red-500 to-red-600', pink: 'from-pink-500 to-pink-600',
          }[course.color as string] ?? 'from-blue-500 to-blue-600'}`} />
          <CardContent className="p-5 space-y-2">
            <Badge variant="outline">{course.code}</Badge>
            <h1 className="text-2xl font-semibold tracking-tight">{course.title}</h1>
            {course.description && <p className="text-sm text-muted-foreground">{course.description}</p>}
            <div className="flex flex-wrap gap-x-5 gap-y-1 pt-1 text-xs text-muted-foreground">
              {course.users?.name && (
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="size-3.5" /> {course.users.name}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Users className="size-3.5" /> {course.enrolled_students ?? '—'} / {course.max_students ?? '—'}
              </span>
              {course.programmes?.name && <span>{course.programmes.name}</span>}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="size-4" /> Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {resources.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No resources shared yet.</p>
              ) : (
                resources.map(r => (
                  <a
                    key={r.id}
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-md border p-2.5 hover:bg-secondary/30 transition-colors"
                  >
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm font-medium truncate flex-1">{r.title}</span>
                    <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
                  </a>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Megaphone className="size-4" /> Announcements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {announcements.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nothing posted yet.</p>
              ) : (
                announcements.map(a => (
                  <div key={a.id} className="rounded-md border p-2.5">
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{a.content}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
