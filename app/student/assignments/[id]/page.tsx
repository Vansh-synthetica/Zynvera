'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, Download, Clock, Send, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AppShell } from '@/components/app-shell'
import { getAssignment } from '@/lib/api/assignments'
import { getSubmission, upsertSubmission } from '@/lib/api/assignments'
import { useWorkspace } from '@/lib/workspace-context'

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { userId } = useWorkspace()

  const [assignment, setAssignment] = useState<any>(null)
  const [submission, setSubmission] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [draftText, setDraftText] = useState('')
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    Promise.all([
      getAssignment(id).catch(() => null),
      getSubmission(id, userId).catch(() => null),
    ]).then(([a, s]) => {
      setAssignment(a)
      setSubmission(s)
      if (s?.content) setDraftText(s.content)
      setLoading(false)
    })
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

  if (!assignment) {
    return (
      <AppShell>
        <div className="py-12 text-center">
          <FileText className="mx-auto size-12 text-muted-foreground/30" />
          <p className="mt-4 text-sm font-medium">Assignment not found</p>
          <Link href="/student/assignments" className="mt-2 text-sm text-primary hover:underline">Back to assignments</Link>
        </div>
      </AppShell>
    )
  }

  const isGraded = submission?.status === 'graded'
  const isSubmitted = !!submission
  const maxScore = assignment.max_score ?? 100
  const attachments = assignment.assignment_attachments ?? []
  const rubricItems = assignment.rubric_items ?? []
  const courseTitle = assignment.courses?.title ?? ''
  const dueDate = assignment.due_date

  const handleSubmit = async () => {
    if (!userId || !draftText.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const sub = await upsertSubmission({
        assignment_id: id,
        user_id: userId,
        content: draftText.trim(),
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      setSubmission(sub)
      setShowSubmitConfirm(false)
    } catch (e: any) {
      setError(e.message || 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <Link href="/student/assignments" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3">
            <ArrowLeft className="size-4" /> Back to assignments
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              {courseTitle && <Badge variant="outline" className="text-xs mb-2">{courseTitle}</Badge>}
              <h1 className="text-2xl font-semibold tracking-tight">{assignment.title}</h1>
              {assignment.instructions && (
                <p className="mt-1 text-muted-foreground line-clamp-2">{assignment.instructions}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm text-muted-foreground">Due {formatDate(dueDate)}</p>
              {isGraded && (
                <p className="text-2xl font-bold mt-1">{submission.score}/{maxScore}</p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold mb-2">Instructions</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {assignment.description || assignment.instructions || 'No instructions provided.'}
                </p>
              </CardContent>
            </Card>

            {attachments.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Attachments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {attachments.map((att: any) => (
                    <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 cursor-pointer transition">
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{att.name}</p>
                        {att.file_size && <p className="text-xs text-muted-foreground">{(att.file_size / 1024).toFixed(0)} KB</p>}
                      </div>
                      <Download className="size-4 shrink-0 text-muted-foreground" />
                    </a>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Your Submission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isGraded ? (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">Graded</Badge>
                      <span className="text-lg font-bold">{submission.score}/{maxScore}</span>
                    </div>
                    {submission.feedback && (
                      <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                        <p className="text-xs font-medium text-primary mb-1">Teacher Feedback</p>
                        <p className="text-sm text-muted-foreground">{submission.feedback}</p>
                      </div>
                    )}
                    {submission.content && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Your Submission</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{submission.content}</p>
                      </div>
                    )}
                  </div>
                ) : isSubmitted ? (
                  <div className="flex items-center gap-2 py-4">
                    <Clock className="size-5 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium">Submitted</p>
                      <p className="text-xs text-muted-foreground">
                        Submitted {submission.submitted_at ? formatDate(submission.submitted_at) : '—'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Type your submission or paste a link to your document..."
                      value={draftText}
                      onChange={e => setDraftText(e.target.value)}
                      rows={8}
                      className="resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Draft is saved automatically</p>
                      <Button onClick={() => setShowSubmitConfirm(true)} disabled={!draftText.trim() || submitting}>
                        {submitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Send className="size-4 mr-2" />}
                        Submit Assignment
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {rubricItems.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Rubric</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {rubricItems.map((item: any) => (
                    <div key={item.id ?? item.criterion} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.criterion}</span>
                        <span className="text-muted-foreground">{item.max_score} pts</span>
                      </div>
                      {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                      {item.score !== null && item.score !== undefined && (
                        <p className="text-xs font-medium text-primary">Scored: {item.score}/{item.max_score}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Score</span>
                  <span className="font-medium">{maxScore}</span>
                </div>
                {assignment.published_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Published</span>
                    <span>{formatDate(assignment.published_at)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date</span>
                  <span>{formatDate(dueDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline" className="text-xs">
                    {isGraded ? 'Graded' : isSubmitted ? 'Submitted' : 'Not Submitted'}
                  </Badge>
                </div>
                {assignment.submission_type && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="capitalize">{assignment.submission_type}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {showSubmitConfirm && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowSubmitConfirm(false)}>
            <Card className="w-full max-w-md" onClick={e => e.stopPropagation()}>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">Submit Assignment?</h3>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to submit &quot;{assignment.title}&quot;? You will not be able to edit your submission after submitting.
                </p>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowSubmitConfirm(false)}>Cancel</Button>
                  <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                    Confirm Submit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  )
}
