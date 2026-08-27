'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, AlertCircle, GraduationCap, Users as UsersIcon, Mail } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { getCoursesByStudent } from '@/lib/api/courses'
import { listEnrolments } from '@/lib/api/students'
import { useWorkspace } from '@/lib/workspace-context'
import { cn } from '@/lib/utils'

type Person = {
  id: string
  name: string
  email: string
  role?: string
  courses: Set<string>
}

export default function StudentPeoplePage() {
  const { userId } = useWorkspace()

  const [teachers, setTeachers] = useState<Person[]>([])
  const [classmates, setClassmates] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)
      setError('')
      const cs = await getCoursesByStudent(userId)

      const tMap = new Map<string, Person>()
      const cMap = new Map<string, Person>()

      await Promise.all(
        (cs as any[]).map(async course => {
          // Teacher of this course.
          if (course.users?.id) {
            const t = tMap.get(course.users.id) ?? {
              id: course.users.id,
              name: course.users.name ?? 'Teacher',
              email: course.users.email ?? '',
              role: 'teacher',
              courses: new Set<string>(),
            }
            t.courses.add(course.code)
            tMap.set(course.users.id, t)
          }

          // Classmates via enrolments (skip self).
          try {
            const roster = await listEnrolments(course.id)
            ((roster as any[]) ?? []).forEach(e => {
              const u = e.users
              if (!u || u.id === userId) return
              const p = cMap.get(u.id) ?? {
                id: u.id,
                name: u.name ?? 'Student',
                email: u.email ?? '',
                courses: new Set<string>(),
              }
              p.courses.add(course.code)
              cMap.set(u.id, p)
            })
          } catch {
            /* roster may be restricted */
          }
        }),
      )

      setTeachers(Array.from(tMap.values()).sort((a, b) => a.name.localeCompare(b.name)))
      setClassmates(
        Array.from(cMap.values()).sort((a, b) => b.courses.size - a.courses.size || a.name.localeCompare(b.name)),
      )
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load people')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  const matches = (p: Person) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())

  const filteredTeachers = teachers.filter(matches)
  const filteredClassmates = classmates.filter(matches)

  const initials = (n: string) =>
    n.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase()

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">People</h1>
            <p className="text-sm text-muted-foreground">
              {teachers.length} teachers · {classmates.length} classmates
            </p>
          </div>
          <Input
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-[200px]"
          />
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
        ) : (
          <>
            {/* Teachers */}
            <h2 className="text-sm font-semibold text-muted-foreground">Teachers</h2>
            {filteredTeachers.length === 0 ? (
              <p className="text-sm text-muted-foreground">None found.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredTeachers.map(p => (
                  <Card key={p.id}>
                    <CardContent className="p-3.5 flex items-start gap-3">
                      <Avatar name={p.name} tone="teacher" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <a href={`mailto:${p.email}`} className="flex items-center gap-1 text-xs text-muted-foreground truncate hover:text-primary">
                          <Mail className="size-3 shrink-0" /> {p.email}
                        </a>
                      </div>
                      <GraduationCap className="size-4 shrink-0 text-blue-500" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Classmates */}
            <h2 className="text-sm font-semibold text-muted-foreground pt-2">
              Classmates ({filteredClassmates.length})
            </h2>
            {filteredClassmates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No classmates found.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {filteredClassmates.map(p => (
                  <Card key={p.id}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <Avatar name={p.name} tone="student" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{Array.from(p.courses).join(', ')}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}

function Avatar({ name, tone }: { name: string; tone: 'teacher' | 'student' }) {
  return (
    <div
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-medium',
        tone === 'teacher' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' : 'bg-primary/10 text-primary',
      )}
    >
      {initials(name)}
    </div>
  )
}
