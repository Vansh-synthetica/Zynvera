'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Loader2,
  AlertCircle,
  CalendarDays,
  FileUp,
  CheckCircle2,
  Gavel,
  Send,
  RotateCcw,
  HardDrive,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getCoursesByStudent } from '@/lib/api/courses'
import { listAssignments, getSubmissionsByUser, upsertSubmission } from '@/lib/api/assignments'
import { createAppeal } from '@/lib/api/appeals'
import { getDriveStatus, uploadToDrive, type DriveStatus } from '@/lib/drive-client'
import { useWorkspace } from '@/lib/workspace-context'

type CourseOpt = { id: string; title: string; code: string }
type Asg = {
  id: string
  course: CourseOpt
  title: string
  description: string | null
  instructions: string | null
  due_date: string | null
  max_score: number
  submission_type: string
}
type MySub = {
  id: string | null
  status: string
  score: number | null
  feedback: string | null
  submitted_at: string | null
}

export default function StudentAssignmentsPage() {
  const { userId } = useWorkspace()

  const [items, setItems] = useState<Array<Asg & { sub: MySub }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // submit dialog
  const [submitTarget, setSubmitTarget] = useState<(Asg & { sub: MySub }) | null>(null)
  const [textEntry, setTextEntry] = useState('')
  const [linkEntry, setLinkEntry] = useState('')
  const [busy, setBusy] = useState(false)
  const [dialogError, setDialogError] = useState('')

  // drive
  const [drive, setDrive] = useState<DriveStatus | null>(null)
  const [driveFile, setDriveFile] = useState<File | null>(null)
  const [uploadingDrive, setUploadingDrive] = useState(false)

  useEffect(() => {
    getDriveStatus().then(setDrive)
  }, [])

  // appeal dialog
  const [appealTarget, setAppealTarget] = useState<(Asg & { sub: MySub }) | null>(null)
  const [appealReason, setAppealReason] = useState('')
  const [appealBusy, setAppealBusy] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError('')
        if (!userId) throw new Error('Sign in required')

        const cs = (await getCoursesByStudent(userId)) as any[]
        const courseOpts: CourseOpt[] = cs.map(c => ({ id: c.id, title: c.title, code: c.code }))

        const asgLists = await Promise.all(
          courseOpts.map(c => listAssignments(c.id).catch(() => [])),
        )

        const flat: Array<Asg> = asgLists.flatMap((list, i) =>
          ((list as any[]) ?? [])
            .filter(a => a.status === 'published' || a.status === 'returned' || a.status === 'active')
            .map(a => ({
              id: a.id,
              course: courseOpts[i],
              title: a.title,
              description: a.description ?? null,
              instructions: a.instructions ?? null,
              due_date: a.due_date ?? null,
              max_score: a.max_score ?? 100,
              submission_type: a.submission_type ?? 'file',
            })),
        )

        const allSubs = await getSubmissionsByUser(userId, flat.map(a => a.id)).catch(() => [] as any[])
        const subMap = new Map(allSubs.map((s: any) => [s.assignment_id, s]))

        const withSubs = flat.map(a => {
          const s = subMap.get(a.id) as any | undefined
          return {
            ...a,
            sub: {
              id: s?.id ?? null,
              status: s?.status ?? 'not_started',
              score: s?.score ?? null,
              feedback: s?.feedback ?? null,
              submitted_at: s?.submitted_at ?? null,
            },
          }
        })

        if (!cancelled) {
          withSubs.sort((x, y) => {
            const dx = x.due_date ? new Date(x.due_date).getTime() : Infinity
            const dy = y.due_date ? new Date(y.due_date).getTime() : Infinity
            return dx - dy
          })
          setItems(withSubs)
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load assignments')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [userId])

  const openSubmit = (item: Asg & { sub: MySub }) => {
    setSubmitTarget(item)
    setDialogError('')
    setTextEntry('')
    setLinkEntry('')
    setDriveFile(null)
  }

  const handleDriveUpload = async (): Promise<string | null> => {
    if (!driveFile || !submitTarget) return null
    setUploadingDrive(true)
    try {
      const result = await uploadToDrive(driveFile, {
        path: `Submissions/${submitTarget.course.code}`,
        share: true,
      })
      return result.webViewLink
    } catch (e: any) {
      setDialogError(e?.message ?? 'Drive upload failed')
      return null
    } finally {
      setUploadingDrive(false)
    }
  }

  const handleSubmit = async () => {
    if (!submitTarget || !userId) return
    setDialogError('')

    // Drive file takes priority when one is chosen.
    let contentNote = ''
    if (driveFile) {
      const link = await handleDriveUpload()
      if (!link) return // error already shown
      contentNote = link
    } else if (submitTarget.submission_type === 'text') {
      if (textEntry.trim() === '') return setDialogError('Write your answer first.')
      contentNote = textEntry.trim()
    } else if (submitTarget.submission_type === 'link') {
      if (linkEntry.trim() === '') return setDialogError('Paste your link first.')
      contentNote = linkEntry.trim()
    } else {
      contentNote = linkEntry.trim() !== '' ? linkEntry.trim() : textEntry.trim()
      if (contentNote === '') return setDialogError('Add a link or connect Google Drive to upload a file.')
    }

    setBusy(true)
    try {
      await upsertSubmission({
        assignment_id: submitTarget.id,
        user_id: userId,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        feedback: contentNote || null,
      } as any)

      setItems(prev =>
        prev.map(i =>
          i.id === submitTarget.id
            ? {
                ...i,
                sub: {
                  id: i.sub.id,
                  status: 'submitted',
                  score: i.sub.score,
                  feedback: contentNote || null,
                  submitted_at: new Date().toISOString(),
                },
              }
            : i,
        ),
      )
      setSubmitTarget(null)
    } catch (e: any) {
      setDialogError(e?.message ?? 'Submit failed')
    } finally {
      setBusy(false)
    }
  }

  const handleAppeal = async () => {
    if (!appealTarget || !userId) return
    if (appealReason.trim().length < 10) {
      setError('Please describe the issue (at least 10 characters).')
      return
    }
    setAppealBusy(true)
    try {
      await createAppeal({
        submission_id: appealTarget.sub.id,
        course_id: appealTarget.course.id,
        user_id: userId,
        reason: appealReason.trim(),
      })
      setAppealTarget(null)
      setAppealReason('')
      setError('')
    } catch (e: any) {
      setError(e?.message ?? 'Could not submit appeal')
    } finally {
      setAppealBusy(false)
    }
  }

  const counts = useMemo(
    () => ({
      due: items.filter(i => i.sub.status === 'not_started').length,
      submitted: items.filter(i => i.sub.status === 'submitted' || i.sub.status === 'in_progress').length,
      graded: items.filter(i => i.sub.status === 'graded' || i.sub.status === 'returned').length,
    }),
    [items],
  )

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
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">My Assignments</h1>
            <p className="text-sm text-muted-foreground">Submit work and track your grades</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">{counts.due} to do</Badge>
            <Badge variant="secondary">{counts.submitted} submitted</Badge>
            <Badge variant="default">{counts.graded} graded</Badge>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        {items.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center space-y-2">
              <FileUp className="size-7 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">No published assignments</p>
              <p className="text-sm text-muted-foreground">
                When teachers publish work for your courses it will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map(item => {
              const overdue =
                item.due_date &&
                new Date(item.due_date) < new Date() &&
                item.sub.status !== 'submitted' &&
                item.sub.status !== 'graded' &&
                item.sub.status !== 'returned'
              return (
                <Card key={item.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold">{item.title}</h3>
                          <Badge variant="outline" className="font-normal">
                            {item.course.code}
                          </Badge>
                          {item.due_date && (
                            <span
                              className={`flex items-center gap-1 text-xs ${
                                overdue ? 'text-red-600 font-medium' : 'text-muted-foreground'
                              }`}
                            >
                              <CalendarDays className="size-3" />
                              Due {new Date(item.due_date).toLocaleString()}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                        )}
                      </div>

                      <StatusChip sub={item.sub} />
                    </div>

                    {(item.sub.status === 'graded' || item.sub.status === 'returned') && (
                      <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            Score: {item.sub.score ?? '—'} / {item.max_score}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1 h-7 text-xs"
                            onClick={() => setAppealTarget(item)}
                            title="Request a re-grade from your teacher"
                          >
                            <Gavel className="size-3" /> Appeal
                          </Button>
                        </div>
                        {item.sub.feedback && (
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                            Feedback: {item.sub.feedback}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end">
                      {(item.sub.status === 'not_started' ||
                        item.sub.status === 'in_progress' ||
                        item.sub.status === 'submitted') && (
                        <Button
                          size="sm"
                          onClick={() => openSubmit(item)}
                          className="gap-1"
                          variant={item.sub.status === 'submitted' ? 'outline' : 'default'}
                        >
                          {item.sub.status === 'submitted' ? (
                            <>
                              <RotateCcw className="size-3.5" /> Resubmit
                            </>
                          ) : (
                            <>
                              <Send className="size-3.5" /> Submit work
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Submit dialog */}
        <Dialog open={submitTarget !== null} onOpenChange={o => !o && setSubmitTarget(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{submitTarget?.title}</DialogTitle>
              <DialogDescription>
                {submitTarget?.submission_type === 'text' && 'Type your answer below.'}
                {submitTarget?.submission_type === 'link' && 'Paste the link to your work.'}
                {submitTarget?.submission_type === 'file' &&
                  'Add a link to your file (cloud drive URL works well).'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              {dialogError && (
                <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-2.5 text-xs text-destructive">
                  {dialogError}
                </div>
              )}

              {submitTarget?.instructions && (
                <div className="rounded-md border bg-muted/40 p-3 text-xs whitespace-pre-wrap">
                  {submitTarget.instructions}
                </div>
              )}

              {/* Google Drive upload */}
              <div className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="flex items-center gap-1.5">
                    <HardDrive className="size-3.5" /> Upload via Google Drive
                  </Label>
                  {drive?.connected ? (
                    <Badge variant="outline" className="text-[10px]">Connected</Badge>
                  ) : (
                    <a href="/integrations/google" className="text-[11px] text-primary hover:underline">
                      Connect
                    </a>
                  )}
                </div>

                {drive?.connected ? (
                  <>
                    <input
                      id="drive-file"
                      type="file"
                      className="hidden"
                      onChange={e => setDriveFile(e.target.files?.[0] ?? null)}
                    />
                    <label
                      htmlFor="drive-file"
                      className="flex items-center justify-center gap-1.5 rounded-md border border-dashed py-3 text-xs cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      {uploadingDrive ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" /> Uploading…
                        </>
                      ) : driveFile ? (
                        <>
                          <CheckCircle2 className="size-3.5 text-green-600" />
                          {driveFile.name} — will upload on submit
                        </>
                      ) : (
                        <>
                          <HardDrive className="size-3.5" /> Choose a file → Zynvera/Submissions/{submitTarget?.course.code}
                        </>
                      )}
                    </label>
                  </>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Connect Drive to store submissions in your own account with an auto-shared link.
                  </p>
                )}
              </div>

              {(submitTarget?.submission_type === 'text' ||
                submitTarget?.submission_type === 'file') && (
                <div className="space-y-1">
                  <Label htmlFor="sub-text">
                    {submitTarget.submission_type === 'text' ? 'Your answer' : 'Notes for your teacher'}
                  </Label>
                  <Textarea
                    id="sub-text"
                    rows={6}
                    value={textEntry}
                    onChange={e => setTextEntry(e.target.value)}
                    placeholder="Start writing…"
                  />
                </div>
              )}

              {submitTarget?.submission_type !== 'text' && (
                <div className="space-y-1">
                  <Label htmlFor="sub-link">Work link</Label>
                  <Input
                    id="sub-link"
                    type="url"
                    value={linkEntry}
                    onChange={e => setLinkEntry(e.target.value)}
                    placeholder="https://…"
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSubmitTarget(null)} disabled={busy}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={busy} className="gap-1">
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Submit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Appeal dialog */}
        <Dialog open={appealTarget !== null} onOpenChange={o => !o && setAppealTarget(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Appeal grade — {appealTarget?.title}</DialogTitle>
              <DialogDescription>
                Explain why you believe this grade should be reconsidered.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              rows={5}
              value={appealReason}
              onChange={e => setAppealReason(e.target.value)}
              placeholder="Describe what you think was missed or misread…"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setAppealTarget(null)} disabled={appealBusy}>
                Cancel
              </Button>
              <Button onClick={handleAppeal} disabled={appealBusy} className="gap-1">
                {appealBusy ? <Loader2 className="size-4 animate-spin" /> : <Gavel className="size-4" />}
                Send Appeal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="pb-6" />
      </div>
    </AppShell>
  )
}

function StatusChip({ sub }: { sub: MySub }) {
  switch (sub.status) {
    case 'submitted':
      return (
        <Badge variant="secondary" className="gap-1">
          <CheckCircle2 className="size-3" /> Submitted
        </Badge>
      )
    case 'graded':
    case 'returned':
      return <Badge variant="success">Graded</Badge>
    case 'in_progress':
      return <Badge variant="secondary">In progress</Badge>
    default:
      return <Badge variant="outline">Not started</Badge>
  }
}
