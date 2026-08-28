'use client'

import { use, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  Download,
  Clock,
  Send,
  Loader2,
  AlertCircle,
  Save,
  Paperclip,
  X,
  RotateCcw,
  Eye,
  CheckCircle2,
  Award,
  Target,
  Upload,
  FileIcon,
  History,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AppShell } from '@/components/app-shell'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { getAssignment, getSubmission, upsertSubmission, unsubmitSubmission, uploadSubmissionFile, getSubmissionHistory } from '@/lib/api/assignments'
import { useWorkspace } from '@/lib/workspace-context'

const DRAFT_KEY_PREFIX = 'zynv_draft_'
const MAX_FILE_SIZE = 25 * 1024 * 1024
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain', 'text/markdown',
]

function formatDate(d: string | null) {
  if (!d) return '\u2014'
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatRelative(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

type AttachedFile = { path: string; url: string; name: string; size: number }

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
  const [success, setSuccess] = useState('')

  // File uploads
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Submission history
  const [history, setHistory] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // Auto-save
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Offline draft key
  const draftKey = `${DRAFT_KEY_PREFIX}${id}_${userId}`

  // Load data
  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const [a, s] = await Promise.all([
        getAssignment(id).catch(() => null),
        getSubmission(id, userId).catch(() => null),
      ])
      setAssignment(a)
      setSubmission(s)

      if (s?.content) {
        setDraftText(s.content)
      } else {
        const offline = localStorage.getItem(draftKey)
        if (offline) setDraftText(offline)
      }

      if (s?.file_path) {
        const { data } = await import('@/lib/supabase/client').then(m =>
          m.createClient().storage.from('assignment-submissions').createSignedUrl(s.file_path, 3600)
        )
        if (data?.signedUrl) {
          setAttachedFiles([{ path: s.file_path, url: data.signedUrl, name: s.file_path.split('/').pop() || 'file', size: 0 }])
        }
      }

      if (s?.id) {
        getSubmissionHistory(s.id).then(setHistory).catch(() => {})
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load assignment')
    } finally {
      setLoading(false)
    }
  }, [id, userId, draftKey])

  useEffect(() => { load() }, [load])

  // Auto-save draft to localStorage
  useEffect(() => {
    if (!submission && draftText) {
      localStorage.setItem(draftKey, draftText)
      setLastSaved(new Date())
    }
  }, [draftText, draftKey, submission])

  // Cleanup
  useEffect(() => {
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current) }
  }, [])

  // File upload
  const handleFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList)
    const valid = files.filter(f => {
      if (f.size > MAX_FILE_SIZE) { setError(`${f.name} exceeds 25 MB limit`); return false }
      if (!ALLOWED_TYPES.includes(f.type)) { setError(`${f.name}: file type not supported`); return false }
      return true
    })
    if (!valid.length) return
    setError('')
    setUploading(true)

    for (const file of valid) {
      try {
        setUploadProgress(p => ({ ...p, [file.name]: 0 }))
        const result = await uploadSubmissionFile(id, userId!, file)
        setAttachedFiles(prev => [...prev, result])
        setUploadProgress(p => ({ ...p, [file.name]: 100 }))
      } catch (e: any) {
        setError(`Failed to upload ${file.name}: ${e.message}`)
      }
    }
    setUploading(false)
    setUploadProgress({})
  }

  const removeFile = (idx: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== idx))
  }

  // Save draft to server
  const saveDraft = async () => {
    if (!userId || !draftText.trim()) return
    setIsSaving(true)
    try {
      const sub = await upsertSubmission({
        assignment_id: id,
        user_id: userId,
        content: draftText.trim(),
        status: 'in_progress',
      })
      setSubmission(sub)
      setLastSaved(new Date())
      localStorage.removeItem(draftKey)
      setSuccess('Draft saved')
      setTimeout(() => setSuccess(''), 3000)
    } catch (e: any) {
      setError(e?.message ?? 'Save failed')
    } finally {
      setIsSaving(false)
    }
  }

  // Submit
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
        file_path: attachedFiles[0]?.path ?? null,
      })
      setSubmission(sub)
      setShowSubmitConfirm(false)
      localStorage.removeItem(draftKey)
      setSuccess('Assignment submitted!')
      setTimeout(() => setSuccess(''), 4000)
    } catch (e: any) {
      setError(e.message || 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  // Unsubmit
  const handleUnsubmit = async () => {
    if (!submission) return
    setSubmitting(true)
    setError('')
    try {
      const sub = await unsubmitSubmission(submission.id)
      setSubmission(sub)
      setSuccess('Submission withdrawn. You can edit and resubmit.')
      setTimeout(() => setSuccess(''), 4000)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to withdraw')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="size-5 animate-spin mr-2" /> Loading assignment...
        </div>
      </AppShell>
    )
  }

  if (!assignment) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg py-24 text-center space-y-3">
          <FileText className="size-8 mx-auto text-muted-foreground/30" />
          <p className="font-medium">Assignment not found</p>
          <Link href="/student/assignments" className="text-sm text-primary hover:underline">Back to assignments</Link>
        </div>
      </AppShell>
    )
  }

  const isGraded = submission?.status === 'graded'
  const isSubmitted = submission?.status === 'submitted' || submission?.status === 'resubmitted'
  const isReturned = submission?.status === 'returned'
  const canEdit = !isGraded && !isSubmitted
  const maxScore = assignment.max_score ?? 100
  const attachments = assignment.assignment_attachments ?? []
  const rubricItems = assignment.rubric_items ?? []
  const courseTitle = assignment.courses?.title ?? ''
  const dueDate = assignment.due_date

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div>
          <Link href="/student/assignments" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3">
            <ArrowLeft className="size-4" /> Back to assignments
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              {courseTitle && <Badge variant="outline" className="text-xs mb-2">{courseTitle}</Badge>}
              <h1 className="text-2xl font-semibold tracking-tight">{assignment.title}</h1>
              {assignment.instructions && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{assignment.instructions}</p>
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

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">
            <CheckCircle2 className="size-4 shrink-0" /> {success}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Main column */}
          <div className="space-y-5">
            {/* Instructions */}
            <div className="neo rounded-2xl p-5 space-y-2">
              <h3 className="text-sm font-semibold">Instructions</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {assignment.description || assignment.instructions || 'No instructions provided.'}
              </p>
            </div>

            {/* Teacher attachments */}
            {attachments.length > 0 && (
              <div className="neo rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-semibold">Attachments</h3>
                <div className="space-y-2">
                  {attachments.map((att: any) => (
                    <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl neo-flat px-3 py-2.5 hover:bg-secondary/30 cursor-pointer transition">
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{att.name}</p>
                        {att.file_size && <p className="text-xs text-muted-foreground">{(att.file_size / 1024).toFixed(0)} KB</p>}
                      </div>
                      <Download className="size-4 shrink-0 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Submission area */}
            <div className="neo rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  {isGraded ? 'Graded Submission' : isSubmitted ? 'Your Submission' : 'Your Work'}
                </h3>
                {submission?.id && (
                  <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition">
                    <History className="size-3.5" /> History
                  </button>
                )}
              </div>

              {isGraded ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-xl neo-inset p-4">
                    <Award className="size-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Score</p>
                      <p className="text-xl font-bold">{submission.score}/{maxScore}</p>
                    </div>
                  </div>
                  {submission.feedback && (
                    <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                      <p className="text-xs font-medium text-primary mb-1">Teacher Feedback</p>
                      <p className="text-sm text-muted-foreground">{submission.feedback}</p>
                    </div>
                  )}
                  {submission.content && (
                    <div className="rounded-xl neo-inset p-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Your Submission</p>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap">{submission.content}</div>
                    </div>
                  )}
                </div>
              ) : isSubmitted ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-xl neo-inset p-4">
                    <Clock className="size-5 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium">Submitted</p>
                      <p className="text-xs text-muted-foreground">
                        {submission.submitted_at ? formatRelative(submission.submitted_at) : '\u2014'}
                      </p>
                    </div>
                  </div>
                  {submission.content && (
                    <div className="rounded-xl neo-inset p-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Your answer</p>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap">{submission.content}</div>
                    </div>
                  )}
                  <Button variant="outline" onClick={handleUnsubmit} disabled={submitting} className="gap-1.5">
                    {submitting ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
                    Withdraw &amp; Edit
                  </Button>
                </div>
              ) : isReturned ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4">
                    <RotateCcw className="size-5 text-amber-600" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Returned by teacher</p>
                      {submission.feedback && <p className="text-xs text-amber-700 mt-1">{submission.feedback}</p>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Rich text editor */}
                  <RichTextEditor
                    value={draftText}
                    onChange={setDraftText}
                    placeholder="Type your submission or paste a link to your document..."
                    maxChars={50000}
                  />

                  {/* File upload zone */}
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      dragOver ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/40 hover:bg-muted/20'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept={ALLOWED_TYPES.join(',')}
                      onChange={e => e.target.files && handleFiles(e.target.files)}
                      className="hidden"
                    />
                    <Upload className="size-5 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Drop files here or <span className="text-primary font-medium">browse</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">PDF, DOCX, images, TXT — up to 25 MB</p>
                  </div>

                  {/* Attached files list */}
                  {attachedFiles.length > 0 && (
                    <div className="space-y-2">
                      {attachedFiles.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-xl neo-flat px-3 py-2 text-sm">
                          <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                          <span className="truncate flex-1">{f.name}</span>
                          {f.size > 0 && <span className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>}
                          {uploadProgress[f.name] !== undefined && uploadProgress[f.name] < 100 && (
                            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${uploadProgress[f.name]}%` }} />
                            </div>
                          )}
                          {canEdit && (
                            <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                              <X className="size-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {lastSaved && <span>Saved {formatRelative(lastSaved.toISOString())}</span>}
                      {isSaving && <Loader2 className="size-3 animate-spin" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={saveDraft} disabled={!draftText.trim() || isSaving}>
                        <Save className="size-3.5 mr-1.5" /> Save Draft
                      </Button>
                      <Button onClick={() => setShowSubmitConfirm(true)} disabled={!draftText.trim() || submitting}>
                        {submitting ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Send className="size-4 mr-1.5" />}
                        Submit
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Submission history panel */}
              {showHistory && history.length > 0 && (
                <div className="border-t border-border/40 pt-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Submission History</p>
                  {history.map(h => (
                    <div key={h.id} className="flex items-center gap-2 rounded-xl neo-flat px-3 py-2 text-xs">
                      <Badge variant={h.status === 'graded' ? 'success' : h.status === 'returned' ? 'warning' : 'secondary'} className="text-[10px]">
                        {h.status}
                      </Badge>
                      {h.score !== null && <span className="font-medium">{h.score} pts</span>}
                      {h.feedback && <span className="text-muted-foreground truncate flex-1">{h.feedback}</span>}
                      <span className="text-muted-foreground shrink-0">{formatRelative(h.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Rubric — always visible */}
            {rubricItems.length > 0 && (
              <div className="neo rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Award className="size-4" /> Rubric
                </h3>
                <div className="space-y-3">
                  {rubricItems.map((item: any) => (
                    <div key={item.id ?? item.criterion} className="rounded-xl neo-flat p-3 space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.criterion}</span>
                        <span className="text-xs text-muted-foreground">{item.max_score} pts</span>
                      </div>
                      {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                      {item.score !== null && item.score !== undefined && (
                        <p className="text-xs font-medium text-primary">Scored: {item.score}/{item.max_score}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Details */}
            <div className="neo rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-semibold">Details</h3>
              <div className="space-y-2.5 text-sm">
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
                  <Badge variant={isGraded ? 'success' : isSubmitted ? 'secondary' : isReturned ? 'warning' : 'outline'} className="text-xs">
                    {isGraded ? 'Graded' : isSubmitted ? 'Submitted' : isReturned ? 'Returned' : 'Not Submitted'}
                  </Badge>
                </div>
                {assignment.submission_type && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="capitalize">{assignment.submission_type}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit confirm dialog */}
        {showSubmitConfirm && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowSubmitConfirm(false)}>
            <div className="neo rounded-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold">Submit Assignment?</h3>
              <p className="text-sm text-muted-foreground">
                You won't be able to edit after submitting. You can withdraw later if the teacher allows resubmissions.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowSubmitConfirm(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                  Confirm Submit
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
