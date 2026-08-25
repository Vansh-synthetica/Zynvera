'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, AlertCircle, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { listCalendarEvents } from '@/lib/api/classes'
import { getCoursesByStudent } from '@/lib/api/courses'
import { getAssignmentsDueSoon } from '@/lib/queries'
import { useWorkspace } from '@/lib/workspace-context'
import { cn } from '@/lib/utils'

type CalEvent = {
  id: string
  title: string
  type: string
  date: string
  start_time: string | null
  location: string | null
  meeting_url: string | null
}

type DueItem = {
  id: string
  title: string
  due: string
  courseCode: string
}

const typeColors: Record<string, string> = {
  class: 'bg-blue-500',
  exam: 'bg-red-500',
  assignment: 'bg-purple-500',
  meeting: 'bg-pink-500',
  office_hours: 'bg-teal-500',
  study_group: 'bg-green-500',
  institution: 'bg-amber-500',
  personal: 'bg-slate-400',
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function StudentCalendarPage() {
  const { userId, institutionId } = useWorkspace()

  const [events, setEvents] = useState<CalEvent[]>([])
  const [dueItems, setDueItems] = useState<DueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [selected, setSelected] = useState(() => new Date().toISOString().slice(0, 10))

  // ── Load events + assignment due dates ────────────────────────
  const load = useCallback(async () => {
    if (!userId || !institutionId) return
    try {
      setLoading(true)
      setError('')
      const [evts, cs] = await Promise.all([
        listCalendarEvents(institutionId, userId),
        getCoursesByStudent(userId),
      ])

      let dues: DueItem[] = []
      try {
        const courseIds = (cs as any[]).map(c => c.id)
        if (courseIds.length > 0) {
          const asgs = await getAssignmentsDueSoon(courseIds, 60)
          dues = ((asgs as any[]) ?? []).map(a => ({
            id: a.id,
            title: a.title,
            due: new Date(a.due_date).toISOString(),
            courseCode: (cs as any[]).find(c => c.id === a.course_id)?.code ?? '',
          }))
        }
      } catch {
        /* due dates are additive; ignore failures */
      }

      if (!userId) return
      setEvents((evts as any[]) ?? [])
      setDueItems(dues)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load calendar')
    } finally {
      setLoading(false)
    }
  }, [userId, institutionId])

  useEffect(() => {
    load()
  }, [load])

  // ── Month grid ────────────────────────────────────────────────
  const grid = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const firstWeekday = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const cells: Array<{ iso: string | null; day: number | null }> = []
    for (let i = 0; i < firstWeekday; i++) cells.push({ iso: null, day: null })
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, iso: new Date(year, month, d).toISOString().slice(0, 10) })
    }
    while (cells.length % 7 !== 0) cells.push({ iso: null, day: null })
    return cells
  }, [cursor])

  /** Everything happening on an ISO date. */
  const itemsOn = useMemo(() => {
    const map = new Map<string, Array<{ kind: 'event' | 'due'; label: string; color?: string; url?: string }>>()

    events.forEach(e => {
      const list = map.get(e.date) ?? []
      list.push({ kind: 'event', label: e.title, color: typeColors[e.type] ?? typeColors.personal, url: e.meeting_url ?? undefined })
      map.set(e.date, list)
    })

    dueItems.forEach(d => {
      const iso = d.due.slice(0, 10)
      const list = map.get(iso) ?? []
      list.push({ kind: 'due', label: `Due: ${d.courseCode ? d.courseCode + ' ' : ''}${d.title}`, color: 'bg-purple-500' })
      map.set(iso, list)
    })

    return map
  }, [events, dueItems])

  const selectedItems = itemsOn.get(selected) ?? []

  const monthLabel = cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' })

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Calendar</h1>
          <p className="text-sm text-muted-foreground">Classes, exams and deadlines in one place</p>
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
        ) : (
          <div className="grid gap-4 md:grid-cols-[1fr_280px]">
            {/* Grid */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Button variant="ghost" size="sm" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
                    <ChevronLeft className="size-4" />
                  </Button>
                  <p className="text-sm font-semibold">{monthLabel}</p>
                  <Button variant="ghost" size="sm" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
                    <ChevronRight className="size-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground mb-1">
                  {WEEKDAYS.map(d => <span key={d}>{d}</span>)}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {grid.map((cell, i) => {
                    if (!cell.iso) return <span key={i} />
                    const dayItems = itemsOn.get(cell.iso) ?? []
                    const isToday = cell.iso === new Date().toISOString().slice(0, 10)
                    const isSelected = cell.iso === selected
                    return (
                      <button
                        key={i}
                        onClick={() => setSelected(cell.iso!)}
                        className={cn(
                          'aspect-square rounded-md border flex flex-col items-center justify-start pt-1 gap-0.5 transition-colors',
                          isSelected && 'border-primary ring-1 ring-primary',
                          !isSelected && isToday && 'border-blue-400',
                          !isSelected && !isToday && 'hover:border-primary/40',
                        )}
                      >
                        <span className={cn('text-xs', isToday && 'font-bold text-blue-600')}>{cell.day}</span>
                        <span className="flex flex-wrap justify-center gap-0.5 px-1">
                          {dayItems.slice(0, 3).map((it, j) => (
                            <span key={j} className={cn('size-1.5 rounded-full', it.color)} />
                          ))}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Selected day */}
            <Card className="h-fit">
              <CardContent className="p-4 space-y-2">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <CalendarDays className="size-4" />
                  {new Date(selected + 'T00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>

                {selectedItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nothing scheduled.</p>
                ) : (
                  selectedItems.map((it, i) => (
                    <div key={i} className="rounded-md border p-2 text-sm space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={cn('size-2 rounded-full shrink-0', it.color)} />
                        <span className="truncate">{it.label}</span>
                      </div>
                      {it.url && (
                        <a href={it.url} target="_blank" rel="noreferrer" className="text-[11px] text-primary hover:underline pl-4 inline-block">
                          Join link
                        </a>
                      )}
                    </div>
                  ))
                )}

                <div className="pt-2 border-t mt-2 grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
                  {(Object.keys(typeColors) as string[]).map(t => (
                    <span key={t} className="flex items-center gap-1 capitalize">
                      <span className={cn('size-1.5 rounded-full', typeColors[t])} /> {t.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  )
}
