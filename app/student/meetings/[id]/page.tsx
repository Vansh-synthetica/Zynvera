'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Clock, Users, Video, ExternalLink, Loader2 } from 'lucide-react'
import { listMeetings } from '@/lib/api/classes'
import { useWorkspace } from '@/lib/workspace-context'

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}
function formatTime(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { userId } = useWorkspace()
  const [meeting, setMeeting] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    listMeetings(userId).then(m => {
      setMeeting(m.find((x: any) => x.id === id) ?? null)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id, userId])

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    )
  }

  if (!meeting) {
    return (
      <AppShell>
        <div className="py-12 text-center">
          <Video className="mx-auto size-12 text-muted-foreground/30" />
          <p className="mt-4 text-sm font-medium">Meeting not found</p>
          <Link href="/student/meetings" className="mt-2 text-sm text-primary hover:underline">Back to meetings</Link>
        </div>
      </AppShell>
    )
  }

  const now = new Date()
  const scheduled = new Date(meeting.scheduled_at)
  const isLive = meeting.status === 'live' || (Math.abs(now.getTime() - scheduled.getTime()) < 3600000 && meeting.status !== 'ended')
  const isPast = meeting.status === 'ended' || scheduled < now
  const host = meeting.users
  const attendees = meeting.meeting_attendees ?? []

  return (
    <AppShell>
      <div className="space-y-6">
        <Link href="/student/meetings" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to meetings
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={isLive ? 'default' : isPast ? 'secondary' : 'outline'} className="text-xs">
                {isLive ? 'Live Now' : isPast ? 'Ended' : 'Upcoming'}
              </Badge>
              {meeting.meeting_type && (
                <Badge variant="outline" className="text-xs capitalize">{meeting.meeting_type}</Badge>
              )}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{meeting.title}</h1>
            {meeting.description && <p className="mt-1 text-muted-foreground">{meeting.description}</p>}
          </div>
          {meeting.join_url && (isLive || !isPast) && (
            <a href={meeting.join_url} target="_blank" rel="noopener noreferrer">
              <Button>
                <Video className="size-4 mr-2" />
                Join Meeting
                <ExternalLink className="size-3 ml-2" />
              </Button>
            </a>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Meeting Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span>{formatDate(meeting.scheduled_at)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="size-4 text-muted-foreground" />
                  <span>{formatTime(meeting.scheduled_at)}{meeting.duration ? ` (${meeting.duration} min)` : ''}</span>
                </div>
                {host && (
                  <div className="flex items-center gap-3 text-sm">
                    <Users className="size-4 text-muted-foreground" />
                    <span>Hosted by <span className="font-medium">{host.name}</span></span>
                  </div>
                )}
                {meeting.platform && (
                  <div className="flex items-center gap-3 text-sm">
                    <Video className="size-4 text-muted-foreground" />
                    <span className="capitalize">{meeting.platform}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {meeting.join_url && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Join Link</CardTitle>
                </CardHeader>
                <CardContent>
                  <a href={meeting.join_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline break-all">
                    <ExternalLink className="size-4 shrink-0" />
                    {meeting.join_url}
                  </a>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Attendees ({attendees.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {attendees.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No attendees listed</p>
                ) : (
                  <div className="space-y-2">
                    {attendees.map((a: any) => (
                      <div key={a.user_id} className="flex items-center justify-between text-sm">
                        <span className="truncate">{a.user_id === userId ? 'You' : `User ${a.user_id.slice(0, 8)}`}</span>
                        <Badge variant={a.status === 'accepted' ? 'default' : a.status === 'declined' ? 'destructive' : 'secondary'} className="text-[10px]">
                          {a.status ?? 'pending'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {isPast && meeting.recording_url && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Recording</CardTitle>
                </CardHeader>
                <CardContent>
                  <a href={meeting.recording_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <ExternalLink className="size-4" />
                    Watch Recording
                  </a>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
