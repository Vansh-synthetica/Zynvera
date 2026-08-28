'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Loader2,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  Clock,
  DoorOpen,
  Plus,
  UserCheck,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getCoursesByTeacher } from '@/lib/api/courses'
import { listClassSections } from '@/lib/api/classes'
import { listAttendance } from '@/lib/api/attendance'
import { createAssignment } from '@/lib/api/assignments'
import { notifyCourseStudents } from '@/lib/api/notifications'
import { useWorkspace } from '@/lib/workspace-context'

type TodayClass = {
  sectionId: string
  courseId: string
  courseTitle: string
  courseCode: string
  name: string
  room: string | null
  startTime: string | null
  endTime: string | null
  taken: boolean
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function fmtTime(t: string | null) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hh = h % 12 === 0 ? 12 : h % 12
  return `${hh}:${String(m ?? 0).padStart(2, '0')} ${ampm}`
}

function toMinutes(t: string | null): number | null {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

export default function TeacherTodayPage() {
  const { userId } = useWorkspace()

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const weekday = WEEKDAYS[today.getDay()]

  const [classes, setClasses] = useState<TodayClass[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // homework dialog
  const [hwOpen, setHwOpen] = useState(false)
  const [hwCourseId, setHwCourseId] = useState('')
  const [hwTitle, setHwTitle] = useState('')
  const [hwDue, setHwDue] = useState(() => {
    const d = new Date(Date.now() + 86_400_000)
    return d.toISOString().slice(0, 10)
  })
  const [hwDesc, setHwDesc] = useState('')
  const [hwSaving, setHwSaving] = useState(false)
  const [hwMsg, setHwMsg] = useState('')
  const [hwErr, setHwErr] = useState('')
  const hwCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { if (hwCloseTimer.current) clearTimeout(hwCloseTimer.current) }
  }, [])

  const load = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)
      setError('')
      const cs = await getCoursesByTeacher(userId)
      setCourses(cs as any[])

      const secLists = await Promise.all(
        cs.map((c: any) =>
          listClassSections(c.id)
            .then(rows =>
              (rows as any[]).map(s => ({
                sectionId: s.id,
                courseId: c.id,
                courseTitle: c.title,
                courseCode: c.code,
                name: s.name,
                room: s.room,
                startTime: s.start_time,
                endTime: s.end_time,
                taken: false,
              })),
            )
            .catch(() => []),
        ),
      )
      let flat = secLists.flat().filter(s => (s.startTime ?? '') !== '')
      flat.sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''))

      // attendance-taken status for today
      const statuses = await Promise.all(
        flat.map(s =>
          listAttendance(s.sectionId, todayStr)
            .then(rows => ((rows as any[]) ?? []).length > 0)
            .catch(() => false),
        ),
      )
      flat = flat.map((s, i) => ({ ...s, taken: statuses[i] }))
      setClasses(flat)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load today')
    } finally {
      setLoading(false)
    }
  }, [userId, todayStr])

  useEffect(() => {
    load()
  }, [load])

  const nowMin = today.getHours() * 60 + today.getMinutes()

  const { currentIdx, nextIdx } = useMemo(() => {
    let cur = -1
    let next = -1
    classes.forEach((c, i) => {
      const st = toMinutes(c.startTime)
      const en = toMinutes(c.endTime)
      if (st == null || en == null) return
      if (nowMin >= st && nowMin <= en && cur === -1) cur = i
      if (st > nowMin && next === -1) next = i
    })
    return { currentIdx: cur, nextIdx: next }
  }, [classes, nowMin])

  const openHw = (courseId?: string) => {
    setHwCourseId(courseId ?? courses[0]?.id ?? '')
    setHwTitle('')
    setHwDesc('')
    setHwMsg('')
    setHwErr('')
    setHwOpen(true)
  }

  const submitHomework = async () => {
    setHwErr('')
    if (!hwCourseId) return setHwErr('Pick a course.')
    if (!hwTitle.trim()) return setHwErr('Give the homework a title.')
    setHwSaving(true)
    try {
      const created = await createAssignment({
        course_id: hwCourseId,
        title: hwTitle.trim(),
        description: hwDesc.trim() || null,
        due_date: hwDue,
        status: 'published',
        published_at: new Date().toISOString(),
        max_score: 100,
        submission_type: 'text',
        late_policy: 'none',
      } as any)

      notifyCourseStudents(hwCourseId, {
        title: 'New homework',
        message: `${(created as any).title} — due ${new Date(hwDue + 'T00:00:00').toLocaleDateString()}.`,
        category: 'assignments',
        action_url: `/student/assignments/${(created as any).id}`,
        source: hwCourseId,
      }).catch(() => {})

      setHwMsg('Posted and students notified.')
      hwCloseTimer.current = setTimeout(() => setHwOpen(false), 900)
    } catch (e: any) {
      setHwErr(e?.message ?? 'Failed to post homework')
    } finally {
      setHwSaving(false)
    }
  }

  const takenCount = classes.filter(c => c.taken).length

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Today</h1>
            <p className="text-sm text-muted-foreground">
              {weekday}, {today.toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}
            </p>
          </div>
          {courses.length > 0 && (
            <Button size="sm" onClick={() => openHw()}>
              <Plus className="size-4 mr-1" /> Post homework
            </Button>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        {/* Summary strip */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <CalendarDays className="size-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-lg font-semibold leading-none">{classes.length}</p>
                <p className="text-xs text-muted-foreground">classes today</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <UserCheck className={`size-5 shrink-0 ${takenCount === classes.length && classes.length > 0 ? 'text-green-600' : 'text-muted-foreground'}`} />
              <div>
                <p className="text-lg font-semibold leading-none">{takenCount}/{classes.length}</p>
                <p className="text-xs text-muted-foreground">registers taken</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Class list */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin mr-2" /> Loading…
          </div>
        ) : classes.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center space-y-2">
              <ClipboardList className="size-7 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">
                {['Saturday', 'Sunday'].includes(weekday)
                  ? `No classes on ${weekday}s`
                  : `No scheduled classes for ${weekday}`
                }
              </p>
              <p className="text-sm text-muted-foreground">
                {['Saturday', 'Sunday'].includes(weekday)
                  ? 'Enjoy your weekend!'
                  : 'Add class sections with a weekday & time in My Classes.'
                }
              </p>
              {!['Saturday', 'Sunday'].includes(weekday) && (
                <Button asChild variant="outline" size="sm" className="mt-2">
                  <Link href="/teacher/classes">Go to My Classes</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {classes.map((c, i) => {
              const isNow = i === currentIdx
              const isNext = i === nextIdx
              return (
                <Card key={c.sectionId} className={isNow ? 'border-primary ring-1 ring-primary/40' : ''}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isNow ? (
                            <Badge>Now</Badge>
                          ) : isNext ? (
                            <Badge variant="secondary">Next</Badge>
                          ) : null}
                          <span className="font-semibold text-sm truncate">{c.courseTitle}</span>
                          <Badge variant="outline" className="text-[11px]">{c.courseCode}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1"><Clock className="size-3" />{fmtTime(c.startTime)} – {fmtTime(c.endTime)}</span>
                          {c.room && <span className="flex items-center gap-1"><DoorOpen className="size-3" />{c.room}</span>}
                          <span>{c.name}</span>
                        </div>
                      </div>
                      {c.taken ? (
                        <Badge variant="outline" className="gap-1 text-green-700 border-green-300 dark:text-green-400 dark:border-green-800 shrink-0">
                          <CheckCircle2 className="size-3" /> Done
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 shrink-0">
                          <CircleDashed className="size-3" /> Pending
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button asChild size="sm" className="flex-1" variant={c.taken ? 'outline' : 'default'}>
                        <Link href={`/teacher/attendance?section=${c.sectionId}&date=${todayStr}`}>
                          <UserCheck className="size-4 mr-1" />
                          {c.taken ? 'View register' : 'Take attendance'}
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openHw(c.courseId)}>
                        <Plus className="size-4 mr-1" /> Homework
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Homework dialog */}
      <Dialog open={hwOpen} onOpenChange={setHwOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Post homework</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Course</Label>
              <Select value={hwCourseId} onValueChange={setHwCourseId}>
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {courses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.code ? `${c.code} — ` : ''}{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={hwTitle} onChange={e => setHwTitle(e.target.value)} placeholder="e.g. Chapter 5 exercises" />
            </div>
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <Input type="date" value={hwDue} onChange={e => setHwDue(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Instructions (optional)</Label>
              <Textarea rows={3} value={hwDesc} onChange={e => setHwDesc(e.target.value)} placeholder="What should students do?" />
            </div>
            {hwErr && (
              <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-2.5 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" /> {hwErr}
              </div>
            )}
            {hwMsg && (
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950 p-2.5 text-sm text-green-700 dark:text-green-400">
                <CheckCircle2 className="size-4 shrink-0" /> {hwMsg}
              </div>
            )}
            <Button className="w-full" onClick={submitHomework} disabled={hwSaving}>
              {hwSaving ? (<><Loader2 className="size-4 mr-2 animate-spin" /> Posting…</>) : 'Post to students'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
