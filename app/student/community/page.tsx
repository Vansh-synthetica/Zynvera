'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Loader2,
  AlertCircle,
  MessageSquare,
  Plus,
  Pin,
  Lock,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
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
  listDiscussions,
  createDiscussion,
  createReply,
  listReplies,
} from '@/lib/api/discussions'
import { getCoursesByStudent } from '@/lib/api/courses'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/lib/workspace-context'
import { cn } from '@/lib/utils'

type CourseOpt = { id: string; title: string; code: string }
type DiscussionRow = {
  id: string
  course_id: string
  title: string
  content: string
  pinned: boolean
  locked: boolean
  author_id: string
  users?: { name?: string }
}
type ReplyRow = {
  id: string
  content: string
  author_id: string
  created_at: string
  users?: { name?: string }
}

export default function StudentCommunityPage() {
  const { userId } = useWorkspace()

  const [courses, setCourses] = useState<CourseOpt[]>([])
  const [courseId, setCourseId] = useState('all')
  const [discussions, setDiscussions] = useState<DiscussionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [replies, setReplies] = useState<Record<string, ReplyRow[]>>({})
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [postingTo, setPostingTo] = useState<string | null>(null)

  // ask question dialog
  const [askOpen, setAskOpen] = useState(false)
  const [qCourse, setQCourse] = useState('')
  const [qTitle, setQTitle] = useState('')
  const [qBody, setQBody] = useState('')
  const [qBusy, setQBusy] = useState(false)

  // ── Load enrolled courses ─────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        if (!userId) throw new Error('Sign in required')
        const cs = await getCoursesByStudent(userId)
        if (!cancelled) {
          setCourses(cs.map((c: any) => ({ id: c.id, title: c.title, code: c.code })))
          if (cs.length > 0) setQCourse(prev => prev || cs[0].id)
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load courses')
      }
    }
    load()
    return () => { cancelled = true }
  }, [userId])

  // ── Load discussions (all courses or one) ─────────────────────
  const loadDiscussions = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const targets = courseId === 'all' ? courses.map(c => c.id) : [courseId]
      if (targets.length === 0) {
        setDiscussions([])
        return
      }
      const lists = await Promise.all(targets.map(id => listDiscussions(id).catch(() => [])))
      const flat = lists.flatMap((l, i) =>
        ((l as any[]) ?? []).map(d => ({
          ...d,
          courseId: targets[i],
        })),
      ) as any[]
      flat.sort((a, b) => Number(b.pinned) - Number(a.pinned))
      setDiscussions(flat)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load discussions')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, courses.length])

  useEffect(() => {
    loadDiscussions()
  }, [loadDiscussions])

  // ── Realtime: new replies refresh threads live ────────────────
  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    const channel = supabase
      .channel('student-discussions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'discussion_replies' },
        payload => {
          const newRow = payload.new as any
          if (newRow?.discussion_id && replies[newRow.discussion_id]) {
            listReplies(newRow.discussion_id)
              .then(rows => setReplies(prev => ({ ...prev, [newRow.discussion_id]: rows as any[] })))
              .catch(() => {})
          }
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, JSON.stringify(Object.keys(replies))])

  const toggleThread = async (id: string) => {
    if (expandedId === id) return setExpandedId(null)
    setExpandedId(id)
    try {
      const rows = (await listReplies(id)) as any[]
      setReplies(prev => ({ ...prev, [id]: rows }))
    } catch {
      setReplies(prev => ({ ...prev, [id]: [] }))
    }
  }

  const postReply = async (discussionId: string, locked?: boolean) => {
    const text = (replyDrafts[discussionId] ?? '').trim()
    if (!text || !userId || locked) return
    setPostingTo(discussionId)
    setError('')
    try {
      const reply = (await createReply({
        discussion_id: discussionId,
        author_id: userId,
        content: text,
      })) as any
      setReplies(prev => ({
        ...prev,
        [discussionId]: [...(prev[discussionId] ?? []), reply],
      }))
      setReplyDrafts(prev => ({ ...prev, [discussionId]: '' }))
    } catch (e: any) {
      setError(e?.message ?? 'Could not post reply')
    } finally {
      setPostingTo(null)
    }
  }

  const handleAsk = async () => {
    if (!userId || !qCourse || !qTitle.trim() || !qBody.trim()) return
    setQBusy(true)
    setError('')
    try {
      const created = (await createDiscussion({
        course_id: qCourse,
        author_id: userId,
        title: qTitle.trim(),
        content: qBody.trim(),
      })) as any
      setDiscussions(prev => [{ ...created, discussion_replies: [] }, ...prev])
      setAskOpen(false)
      setQTitle('')
      setQBody('')
      setCourseId(qCourse)
    } catch (e: any) {
      setError(e?.message ?? 'Could not post question')
    } finally {
      setQBusy(false)
    }
  }

  const courseCodeOf = (id: string) => courses.find(c => c.id === id)?.code ?? ''

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Community</h1>
            <p className="text-sm text-muted-foreground">Ask questions and discuss with your class</p>
          </div>
          <Button onClick={() => setAskOpen(true)} disabled={courses.length === 0} className="gap-1">
            <Plus className="size-4" /> Ask a Question
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        <Select value={courseId} onValueChange={setCourseId}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="All courses" />
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

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin mr-2" /> Loading discussions…
          </div>
        ) : courses.length === 0 ? (
          <Card><CardContent className="py-14 text-center space-y-2">
            <MessageSquare className="size-7 mx-auto text-muted-foreground" />
            <p className="text-sm font-medium">Not enrolled in any courses yet</p>
          </CardContent></Card>
        ) : discussions.length === 0 ? (
          <Card><CardContent className="py-14 text-center space-y-2">
            <MessageSquare className="size-7 mx-auto text-muted-foreground" />
            <p className="text-sm font-medium">No discussions yet</p>
            <p className="text-sm text-muted-foreground">Be the first to ask a question!</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {discussions.map(d => {
              const expanded = expandedId === d.id
              const thread = replies[d.id] ?? []
              return (
                <Card key={d.id}>
                  <CardContent className="p-0">
                    <button onClick={() => toggleThread(d.id)} className="w-full flex items-start gap-3 p-3.5 text-left hover:bg-muted/30 transition-colors">
                      <span className="mt-0.5 shrink-0 text-muted-foreground">
                        {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-[11px]">{courseCodeOf(d.course_id)}</Badge>
                          <span className="text-sm font-medium">{d.title}</span>
                          {d.pinned && <Pin className="size-3 text-primary" />}
                          {d.locked && <Lock className="size-3 text-muted-foreground" />}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{d.content}</p>
                        <span className="text-[11px] text-muted-foreground">
                          Asked by {d.users?.name ?? 'Unknown'} · {(d.discussion_replies?.length ?? 0)} repl{(d.discussion_replies?.length ?? 0) === 1 ? 'y' : 'ies'}
                        </span>
                      </div>
                    </button>

                    {expanded && (
                      <div className="border-t px-3.5 py-3 space-y-3 bg-muted/20">
                        {!d.locked ? (
                          <>
                            {thread.length === 0 && (
                              <p className="text-xs text-muted-foreground">No replies yet.</p>
                            )}
                            {thread.map(r => {
                              const isTeacherReply = false // teacher badge derives from role; shown via name styling below
                              void isTeacherReply
                              return (
                                <div key={r.id} className="rounded-lg border bg-card p-2.5">
                                  <p className="text-xs font-medium mb-0.5">{r.users?.name ?? 'Unknown'}</p>
                                  <p className="text-sm whitespace-pre-wrap">{r.content}</p>
                                </div>
                              )
                            })}
                            <div className="flex gap-2 pt-1">
                              <Input
                                value={replyDrafts[d.id] ?? ''}
                                onChange={e => setReplyDrafts(prev => ({ ...prev, [d.id]: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && postReply(d.id)}
                                placeholder="Write a reply…"
                                disabled={postingTo === d.id}
                              />
                              <Button size="sm" className="shrink-0 gap-1" onClick={() => postReply(d.id)} disabled={postingTo === d.id || !(replyDrafts[d.id] ?? '').trim()}>
                                {postingTo === d.id ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                                Reply
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            {thread.map(r => (
                              <div key={r.id} className="rounded-lg border bg-card p-2.5 opacity-90">
                                <p className="text-xs font-medium mb-0.5">{r.users?.name ?? 'Unknown'}</p>
                                <p className="text-sm whitespace-pre-wrap">{r.content}</p>
                              </div>
                            ))}
                            <p className="text-xs text-muted-foreground italic flex items-center gap-1">
                              <Lock className="size-3" /> Thread locked by teacher.
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Ask question dialog */}
      <Dialog open={askOpen} onOpenChange={setAskOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ask a question</DialogTitle>
            <DialogDescription>Your teacher and classmates can reply.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Course</Label>
              <Select value={qCourse} onValueChange={setQCourse}>
                <SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger>
                <SelectContent>
                  {courses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.code} — {c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="q-title">Question</Label>
              <Input id="q-title" value={qTitle} onChange={e => setQTitle(e.target.value)} placeholder="Summarise in one line…" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="q-body">Details</Label>
              <Textarea id="q-body" rows={4} value={qBody} onChange={e => setQBody(e.target.value)} placeholder="Give context so others can help…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAskOpen(false)} disabled={qBusy}>Cancel</Button>
            <Button onClick={handleAsk} disabled={qBusy || !qCourse || !qTitle.trim() || !qBody.trim()} className="gap-1">
              {qBusy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Post Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
