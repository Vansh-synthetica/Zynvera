'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ClipboardCheck,
  Loader2,
  AlertCircle,
  CalendarDays,
  Users,
  MoreHorizontal,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AssignmentFormDialog,
  EMPTY_ASSIGNMENT_FORM,
  type AssignmentFormState,
  type CourseOption,
} from '@/components/teacher/assignment-form-dialog'
import { GradingDialog, type GradeSubmission } from '@/components/teacher/grading-dialog'
import {
  listAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  publishAssignment,
  listSubmissions,
} from '@/lib/api/assignments'
import { notifyCourseStudents } from '@/lib/api/notifications'
import { getCoursesByTeacher } from '@/lib/api/courses'
import { useWorkspace } from '@/lib/workspace-context'

type AssignmentRow = {
  id: string
  course_id: string
  title: string
  description: string | null
  instructions: string | null
  due_date: string | null
  published_at: string | null
  status: string
  max_score: number
  submission_type: string
  late_policy: string
}

export default function AssignmentsPage() {
  const { userId } = useWorkspace()

  const [courses, setCourses] = useState<CourseOption[]>([])
  const [assignments, setAssignments] = useState<AssignmentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  const [courseFilter, setCourseFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // create / edit
  const [formOpen, setFormOpen] = useState(false)
  const [formInitial, setFormInitial] = useState<AssignmentFormState>(EMPTY_ASSIGNMENT_FORM)
  const [savingForm, setSavingForm] = useState(false)
  const [formError, setFormError] = useState('')

  // delete confirm
  const [deleteTarget, setDeleteTarget] = useState<AssignmentRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  // grading
  const [gradeTarget, setGradeTarget] = useState<AssignmentRow | null>(null)
  const [submissions, setSubmissions] = useState<GradeSubmission[]>([])
  const [subsLoading, setSubsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setPageError('')
        if (!userId) throw new Error('Sign in required')

        const cs = await getCoursesByTeacher(userId)
        const courseRows: CourseOption[] = cs.map((c: any) => ({
          id: c.id,
          title: c.title,
          code: c.code,
        }))
        if (cancelled) return
        setCourses(courseRows)

        const lists = await Promise.all(
          courseRows.map(c => listAssignments(c.id).catch(() => [])),
        )
        if (cancelled) return

        const flat: AssignmentRow[] = lists.flatMap((list, i) =>
          (Array.isArray(list) ? list : []).map((a: any) => ({
            id: a.id,
            course_id: courseRows[i].id,
            title: a.title,
            description: a.description ?? null,
            instructions: a.instructions ?? null,
            due_date: a.due_date ?? null,
            published_at: a.published_at ?? null,
            status: a.status,
            max_score: a.max_score ?? 100,
            submission_type: a.submission_type ?? 'file',
            late_policy: a.late_policy ?? 'none',
          })),
        )
        setAssignments(flat)
      } catch (e: any) {
        if (!cancelled) setPageError(e?.message ?? 'Failed to load assignments')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [userId])

  const filtered = useMemo(
    () =>
      assignments
        .filter(a => courseFilter === 'all' || a.course_id === courseFilter)
        .filter(a => a.title.toLowerCase().includes(search.toLowerCase())),
    [assignments, courseFilter, search],
  )

  const isPublished = (a: AssignmentRow) => a.status === 'published' || Boolean(a.published_at)
  const courseOf = useCallback(
    (id: string) => courses.find(c => c.id === id),
    [courses],
  )

  // ── Create / edit ─────────────────────────────────────────────

  const openCreate = () => {
    setFormInitial({ ...EMPTY_ASSIGNMENT_FORM, course_id: courses[0]?.id ?? '' })
    setFormError('')
    setFormOpen(true)
  }

  const openEdit = (a: AssignmentRow) => {
    setFormInitial({
      id: a.id,
      course_id: a.course_id,
      title: a.title,
      description: a.description ?? '',
      instructions: a.instructions ?? '',
      due_date: a.due_date ? new Date(a.due_date).toISOString().slice(0, 16) : '',
      max_score: a.max_score,
      submission_type: a.submission_type,
      late_policy: a.late_policy,
      publish: isPublished(a),
    })
    setFormError('')
    setFormOpen(true)
  }

  const handleSaveForm = async (form: AssignmentFormState) => {
    setFormError('')
    if (!userId) return setFormError('Sign in required.')
    if (!form.course_id) return setFormError('Choose a course.')
    if (!form.title.trim()) return setFormError('Give the assignment a title.')

    setSavingForm(true)
    try {
      const payload = {
        course_id: form.course_id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        instructions: form.instructions.trim() || null,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
        max_score: Math.max(1, Math.round(form.max_score)),
        submission_type: form.submission_type,
        late_policy: form.late_policy,
      }

      if (form.id) {
        await updateAssignment(form.id, {
          ...payload,
          status: form.publish ? 'published' : 'draft',
        })
        setAssignments(prev =>
          prev.map(a =>
            a.id === form.id
              ? {
                  ...a,
                  ...payload,
                  status: form.publish ? 'published' : 'draft',
                }
              : a,
          ),
        )
      } else {
        const created = (await createAssignment({
          ...payload,
          status: form.publish ? 'published' : 'draft',
          published_at: form.publish ? new Date().toISOString() : null,
        } as any)) as any
        setAssignments(prev => [{ ...created, course_id: form.course_id }, ...prev])
        if (form.publish) {
          notifyCourseStudents(form.course_id, {
            title: 'New assignment',
            message: `${created.title} has been published${payload.due_date ? ` — due ${new Date(payload.due_date).toLocaleDateString()}` : ''}.`,
            category: 'assignments',
            action_url: `/student/assignments/${created.id}`,
            source: created.course_id,
          }).catch(() => {})
        }
      }
      setFormOpen(false)
    } catch (e: any) {
      setFormError(e?.message ?? 'Save failed')
    } finally {
      setSavingForm(false)
    }
  }

  // ── Publish toggle ────────────────────────────────────────────

  const handleTogglePublish = async (a: AssignmentRow) => {
    const willPublish = !isPublished(a)
    setTogglingId(a.id)
    try {
      if (willPublish) {
        await publishAssignment(a.id)
        notifyCourseStudents((a as any).course_id, {
          title: 'New assignment',
          message: `${a.title} has been published. Open it to see the requirements.`,
          category: 'assignments',
          action_url: `/student/assignments/${a.id}`,
          source: (a as any).course_id ?? null,
        }).catch(() => {})
      } else await updateAssignment(a.id, { status: 'draft', published_at: null })

      setAssignments(prev =>
        prev.map(x =>
          x.id === a.id
            ? {
                ...x,
                status: willPublish ? 'published' : 'draft',
                published_at: willPublish ? new Date().toISOString() : null,
              }
            : x,
        ),
      )
    } catch (e: any) {
      setPageError(e?.message ?? 'Status change failed')
    } finally {
      setTogglingId(null)
    }
  }

  // ── Delete ────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteAssignment(deleteTarget.id)
      setAssignments(prev => prev.filter(a => a.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (e: any) {
      setPageError(e?.message ?? 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  // ── Grading ───────────────────────────────────────────────────

  const openGrading = async (a: AssignmentRow) => {
    setGradeTarget(a)
    setSubmissions([])
    setSubsLoading(true)
    try {
      const rows = (await listSubmissions(a.id)) as any[]
      setSubmissions(
        rows.map(r => ({
          id: r.id,
          user_id: r.user_id,
          name: r.users?.name ?? 'Unknown student',
          status: r.status,
          score: r.score ?? null,
          feedback: r.feedback ?? null,
          submitted_at: r.submitted_at ?? null,
        })),
      )
    } catch (e: any) {
      setPageError(e?.message ?? 'Could not load submissions')
    } finally {
      setSubsLoading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="size-5 animate-spin mr-2" /> Loading assignments…
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Assignment Manager</h1>
            <p className="text-sm text-muted-foreground">
              Create, publish, grade — all in one place
            </p>
          </div>
          <Button onClick={openCreate} className="gap-1">
            <Plus className="size-4" />
            New Assignment
          </Button>
        </div>

        {pageError && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {pageError}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search assignments…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {courses.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.code} — {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline">{filtered.length}</Badge>
        </div>

        {/* Empty state */}
        {assignments.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center space-y-3">
              <ClipboardCheck className="size-8 mx-auto text-muted-foreground" />
              <p className="font-medium">No assignments yet</p>
              <p className="text-sm text-muted-foreground">
                Create your first assignment to start collecting student work.
              </p>
              <Button onClick={openCreate} variant="outline" className="gap-1">
                <Plus className="size-4" />
                Create Assignment
              </Button>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No assignments match your filters.
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map(a => {
              const course = courseOf(a.course_id)
              const published = isPublished(a)
              return (
                <Card key={a.id} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold">{a.title}</h3>
                          <Badge variant={published ? 'default' : 'secondary'}>
                            {published ? 'Published' : 'Draft'}
                          </Badge>
                          {a.due_date && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <CalendarDays className="size-3" />
                              Due {new Date(a.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {course ? `${course.code} · ` : ''}
                          {a.description || 'No description'}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="font-normal">
                            {a.max_score} pts
                          </Badge>
                          <Badge variant="outline" className="font-normal capitalize">
                            {a.submission_type}
                          </Badge>
                          {a.late_policy !== 'none' && (
                            <Badge variant="outline" className="font-normal">
                              Late −{a.late_policy}%
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="flex items-center gap-1.5">
                          {togglingId === a.id ? (
                            <Loader2 className="size-4 animate-spin text-muted-foreground" />
                          ) : (
                            <Switch
                              checked={published}
                              onCheckedChange={() => handleTogglePublish(a)}
                              aria-label={`Toggle publish for ${a.title}`}
                            />
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(a)}>
                                <Pencil className="size-3.5 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openGrading(a)}>
                                <Users className="size-3.5 mr-2" /> Grade submissions
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteTarget(a)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="size-3.5 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => openGrading(a)}
                        >
                          <Users className="size-3" />
                          Grade
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Create / edit dialog */}
        <AssignmentFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          courses={courses}
          initial={formInitial}
          saving={savingForm}
          error={formError}
          onSave={handleSaveForm}
        />

        {/* Delete confirmation */}
        <Dialog open={deleteTarget !== null} onOpenChange={o => !o && setDeleteTarget(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete assignment?</DialogTitle>
              <DialogDescription>
                &quot;{deleteTarget?.title}&quot; and all its submissions will be permanently
                removed. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="gap-1">
                {deleting && <Loader2 className="size-4 animate-spin" />}
                Delete Permanently
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Grading dialog */}
        <GradingDialog
          open={gradeTarget !== null}
          onOpenChange={o => !o && setGradeTarget(null)}
          assignmentTitle={gradeTarget?.title ?? ''}
          maxScore={gradeTarget?.max_score ?? 100}
          submissions={submissions}
          loading={subsLoading}
          teacherId={userId}
        />

        <div className="pb-4" />
      </div>
    </AppShell>
  )
}
