'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Loader2, AlertCircle, Video, Calendar, ExternalLink } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { listMeetings } from '@/lib/api/classes'
import { useWorkspace } from '@/lib/workspace-context'

type MeetingRow = {
  id: string
  title: string
  description: string | null
  platform: string
  meeting_url: string | null
  scheduled_at: string
  duration: number
  status: string
  users?: { name?: string }
}

const platformLabel: Record<string, string> = {
  google_meet: 'Google Meet',
  zoom: 'Zoom',
  in_person: 'In Person',
  other: 'Meeting',
}

export default function StudentMeetingsPage() {
  const { userId } = useWorkspace()

  const [meetings, setMeetings] = useState<MeetingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)
      setError('')
      const rows = await listMeetings(userId)
      setMeetings((rows as any[]) ?? [])
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load meetings')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  const { upcoming, past } = useMemo(() => {
    const now = Date.now()
    const withTime = meetings.map(m => ({ ...m, ts: new Date(m.scheduled_at).getTime() }))
    return {
      upcoming: withTime.filter(m => m.ts >= now && m.status !== 'cancelled').sort((a, b) => a.ts - b.ts),
      past: withTime.filter(m => m.ts < now || m.status === 'cancelled').sort((a, b) => b.ts - a.ts),
    }
  }, [meetings])

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-lg font-semibold">Meetings</h1>
          <p className="text-sm text-muted-foreground">Live classes and scheduled sessions</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin mr-2" /> Loading meetings…
          </div>
        ) : meetings.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center space-y-2">
              <Video className="size-7 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">No meetings scheduled</p>
              <p className="text-sm text-muted-foreground">Invited sessions will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <>
                <h2 className="text-sm font-semibold text-muted-foreground">Upcoming</h2>
                <div className="space-y-3">
                  {upcoming.map(m => (
                    <Card key={m.id} className="border-primary/30">
                      <CardContent className="p-4 flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold">{m.title}</h3>
                            <Badge variant="outline" className="text-[11px]">{platformLabel[m.platform] ?? m.platform}</Badge>
                            {m.status === 'live' && (
                              <Badge className="gap-1 bg-red-100 text-red-700 animate-pulse">
                                <span className="size-1.5 rounded-full bg-red-500" /> LIVE
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                            <Calendar className="size-3" /> {fmt(m.scheduled_at)} · {m.duration} min
                          </p>
                          {m.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{m.description}</p>
                          )}
                          {m.users?.name && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">Hosted by {m.users.name}</p>
                          )}
                        </div>

                        {m.meeting_url ? (
                          <Button asChild size="sm" className="shrink-0 gap-1">
                            <a href={m.meeting_url} target="_blank" rel="noreferrer">
                              <ExternalLink className="size-3.5" /> Join
                            </a>
                          </Button>
                        ) : (
                          <Badge variant="secondary" className="shrink-0">Details TBA</Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {/* Past */}
            {past.length > 0 && (
              <>
                <h2 className="text-sm font-semibold text-muted-foreground pt-2">Past</h2>
                <div className="space-y-2 opacity-80">
                  {past.slice(0, 10).map(m => (
                    <Card key={m.id}>
                      <CardContent className="px-4 py-2.5 flex items-center gap-2 text-sm">
                        <span className="font-medium truncate flex-1">{m.title}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{fmt(m.scheduled_at)}</span>
                        {m.meeting_url && (
                          <Button asChild variant="ghost" size="sm" className="h-7 shrink-0">
                            <Link href={m.meeting_url} target="_blank" rel="noreferrer">Recall</Link>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
