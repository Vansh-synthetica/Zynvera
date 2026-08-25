'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, AlertCircle, Clock } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { listTimetableSlots } from '@/lib/api/classes'
import { useWorkspace } from '@/lib/workspace-context'
import { cn } from '@/lib/utils'

type Slot = {
  id: string
  day: string
  start_time: string
  end_time: string
  room: string | null
  type: string
  courses?: { title?: string; code?: string; color?: string }
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const slotTints: Record<string, string> = {
  lecture: 'border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950',
  lab: 'border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950',
  tutorial: 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950',
  seminar: 'border-purple-300 bg-purple-50 dark:border-purple-800 dark:bg-purple-950',
}

export default function StudentTimetablePage() {
  const { userId } = useWorkspace()

  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)
      setError('')
      const rows = await listTimetableSlots(userId)
      setSlots((rows as any[]) ?? [])
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load timetable')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  const today = new Date().toLocaleDateString(undefined, { weekday: 'long' })

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Timetable</h1>
          <p className="text-sm text-muted-foreground">Your weekly class schedule</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="size-5 animate-spin mr-2" /> Loading schedule…
          </div>
        ) : slots.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center space-y-2">
              <Clock className="size-7 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">No scheduled classes yet</p>
              <p className="text-sm text-muted-foreground">When teachers add timetable slots you'll see them here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {DAYS.map(day => {
              const daySlots = slots
                .filter(s => s.day === day)
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
              return (
                <Card key={day} className={cn(day === today && 'border-primary/50')}>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{day}</p>
                      {day === today && <Badge className="text-[10px]">Today</Badge>}
                    </div>

                    {daySlots.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">No classes</p>
                    ) : (
                      daySlots.map(s => (
                        <div key={s.id} className={cn('rounded-md border p-2', slotTints[s.type] ?? 'border-border')}>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold">{s.courses?.code ?? ''}</span>
                            <span className="text-[11px] text-muted-foreground capitalize">{s.type}</span>
                          </div>
                          <p className="text-xs truncate mt-0.5">{s.courses?.title ?? 'Class'}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                            {s.room ? ` · ${s.room}` : ''}
                          </p>
                        </div>
                      ))
                    )}
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
