'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, AlertCircle, Megaphone, Pin, Bell } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { listAnnouncements, listCourseAnnouncements } from '@/lib/api/announcements'
import { getCoursesByStudent } from '@/lib/api/courses'
import { useWorkspace } from '@/lib/workspace-context'
import { cn } from '@/lib/utils'

type AnnouncementRow = {
  id: string
  course_id: string | null
  title: string
  content: string
  priority: string
  pinned: boolean
  published_at: string
  users?: { name?: string }
}

export default function StudentAnnouncementsPage() {
  const { userId, institutionId } = useWorkspace()

  const [items, setItems] = useState<AnnouncementRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!userId || !institutionId) return
    try {
      setLoading(true)
      setError('')

      // Institution-wide + everything for each enrolled course.
      const [instRows, cs] = await Promise.all([
        listAnnouncements(institutionId),
        getCoursesByStudent(userId),
      ])
      const courseLists = await Promise.all(
        (cs as any[]).map(c => listCourseAnnouncements(c.id).catch(() => [])),
      )

      const merged = [
        ...(instRows as any[]).map(r => ({ ...r, scope: 'Institution' })),
        ...courseLists.flatMap((list, i) =>
          ((list as any[]) ?? []).map(r => ({
            ...r,
            scope: `${(cs as any[])[i].code}`,
          })),
        ),
      ]

      // Pinned first, then newest.
      merged.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
      })

      setItems(merged)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }, [userId, institutionId])

  useEffect(() => {
    load()
  }, [load])

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Announcements</h1>
          <p className="text-sm text-muted-foreground">Updates from your institution and teachers</p>
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
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center space-y-2">
              <Bell className="size-7 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">No announcements yet</p>
              <p className="text-sm text-muted-foreground">
                When your school or teachers post updates they appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map(a => {
              const urgent = a.priority === 'urgent' || a.priority === 'high'
              return (
                <Card key={a.id} className={cn(urgent && 'border-red-200 dark:border-red-900')}>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <Megaphone className={cn('size-4 shrink-0', urgent ? 'text-red-500' : 'text-primary')} />
                      <h3 className="text-sm font-semibold">{a.title}</h3>
                      <Badge variant="outline" className="text-[11px]">{a.scope}</Badge>
                      {a.priority !== 'normal' && (
                        <Badge
                          variant={a.priority === 'urgent' ? 'destructive' : 'secondary'}
                          className="text-[11px] capitalize"
                        >
                          {a.priority}
                        </Badge>
                      )}
                      {a.pinned && <Pin className="size-3 text-primary ml-auto" />}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{a.content}</p>
                    <span className="text-[11px] text-muted-foreground block mt-2">
                      {a.users?.name ?? 'School'} · {new Date(a.published_at).toLocaleString()}
                    </span>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
