'use client'

import { withBase } from '@/lib/base-path'

import { useCallback, useEffect, useState } from 'react'
import {
  Loader2,
  AlertCircle,
  Bell,
  CheckCheck,
  Check,
  Trash2,
  GraduationCap,
  ClipboardList,
  MessageSquare,
  Calendar,
  Megaphone,
  Target,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  listNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '@/lib/api/notifications'
import { useWorkspace } from '@/lib/workspace-context'
import { cn } from '@/lib/utils'

type NotificationRow = {
  id: string
  title: string
  message: string
  category: string
  read: boolean
  action_url: string | null
  created_at: string
}

const categoryIcons: Record<string, typeof Bell> = {
  academic: GraduationCap,
  grades: GraduationCap,
  assignments: ClipboardList,
  messages: MessageSquare,
  meetings: Calendar,
  announcements: Megaphone,
  attendance: Target,
}

export default function StudentNotificationsPage() {
  const { userId } = useWorkspace()

  const [items, setItems] = useState<NotificationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)
      setError('')
      setItems((await listNotifications(userId)) as any[])
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  const unread = items.filter(n => !n.read).length

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Notifications</h1>
            <p className="text-sm text-muted-foreground">Alerts about your learning</p>
          </div>
          {unread > 0 && (
            <Button variant="outline" size="sm" onClick={async () => {
              await markAllAsRead(userId!)
              load()
            }} className="gap-1">
              <CheckCheck className="size-3.5" /> Mark all read ({unread})
            </Button>
          )}
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
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center space-y-2">
              <Bell className="size-7 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">Nothing here yet</p>
              <p className="text-sm text-muted-foreground">
                Grade alerts, absences and announcements will land here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {items.map(n => {
              const Icon = categoryIcons[n.category] ?? Bell
              return (
                <Card key={n.id} className={cn(!n.read && 'border-primary/40 bg-primary/5')}>
                  <CardContent className="px-4 py-3 flex items-start gap-3">
                    <Icon className={cn('size-4 mt-0.5 shrink-0', !n.read && 'text-primary')} />
                    <button
                      className="min-w-0 flex-1 text-left"
                      onClick={async () => {
                        if (!n.read) {
                          await markAsRead(n.id).catch(() => {})
                          setItems(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
                        }
                        if (n.action_url) window.location.assign(withBase(n.action_url ?? '/student/notifications'))
                      }}
                    >
                      <p className={cn('text-sm truncate', !n.read && 'font-medium')}>{n.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                      <span className="text-[11px] text-muted-foreground block mt-0.5">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    </button>

                    {!n.read && (
                      <Button variant="ghost" size="sm" className="size-7 p-0 shrink-0" aria-label="Mark read"
                        onClick={async () => {
                          await markAsRead(n.id).catch(() => {})
                          setItems(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
                        }}>
                        <Check className="size-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="size-7 p-0 shrink-0 text-muted-foreground hover:text-destructive" aria-label="Delete"
                      onClick={async () => {
                        await deleteNotification(n.id).catch(() => {})
                        setItems(prev => prev.filter(x => x.id !== n.id))
                      }}>
                      <Trash2 className="size-3.5" />
                    </Button>
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
