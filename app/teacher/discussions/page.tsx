'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Loader2,
  AlertCircle,
  Pin,
  PinOff,
  Lock,
  Unlock,
  Trash2,
  Plus,
  MessageSquare,
  Send,
  CheckCircle2,
  Megaphone,
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
  deleteDiscussion,
  pinDiscussion,
  lockDiscussion,
  listReplies,
  createReply,
} from '@/lib/api/discussions'
import {
  listCourseAnnouncements,
  createAnnouncement,
  pinAnnouncement,
  deleteAnnouncement,
} from '@/lib/api/announcements'
import { getCoursesByTeacher } from '@/lib/api/courses'
import { useWorkspace } from '@/lib/workspace-context'
import { cn } from '@/lib/utils'

type CourseOpt = { id: string; title: string; code: string }
type DiscussionRow = {
  id: string
  title: string
  content: string
  pinned: boolean
  locked: boolean
  author_id: string
  users?: { name?: string }
  replyCount?: number
}
type ReplyRow = {
  id: string
  content: string
  author_id: string
  created_at: string
  users?: { name?: string }
}
type AnnouncementRow = {
  id: string
  title: string
  content: string
  priority: string
  pinned: boolean
  published_at: string
  users?: { name?: string }
}

export default function TeacherDiscussionsPage() {
  const { userId } = useWorkspace()

  const [courses, setCourses] = useState<CourseOpt[]>([])
  const [courseId, setCourseId] = useState('')
  const [tab, setTab] = useState<'forum' | 'announcements'>('forum')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // forum state
  const [discussions, setDiscussions] = useState<DiscussionRow[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [replies, setReplies] = useState<Record<string, ReplyRow[]>>({})
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({})
  const [postingAnswer, setPostingAnswer] = useState<string | null>(null)

  // new topic dialog
  const [topicOpen, setTopicOpen] = useState(false)
  const [topicTitle, setTopicTitle] = useState('')
  const [topicBody, setTopicBody] = useState('')
  const [topicBusy, setTopicBusy] = useState(false)

  // announcements state
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([])
  const [annOpen, setAnnOpen] = useState(false)
  const [annTitle, setAnnTitle] = useState('')
  const [annBody, setAnnBody] = useState('')
  const [annPriority, setAnnPriority] = useState('normal')
  const [annBusy, setAnnBusy] = useState(false)

  // ── Load courses ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        if (!userId) throw new Error('Sign in required')
        const cs = await getCoursesByTeacher(userId)
        if (!cancelled) {
          setCourses(cs.map((c: any) => ({ id: c.id, title: c.title, code: c.code })))
          if (cs.length > 0) setCourseId(prev => prev || cs[0].id)
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load courses')
      }
    }
    load()
    return () => { cancelled = true }
  }, [userId])

  // ── Load forum + announcements for the selected course ────────
  const loadCourseData = useCallback(async () => {
    if (!courseId) return
    try {
      setLoading(true)
      setError('')
      const [dRows, aRows] = await Promise.all([
        listDiscussions(courseId),
        listCourseAnnouncements(courseId),
      ])
      setDiscussions((dRows as any[]) ?? [])
      setAnnouncements((aRows as any[]) ?? [])
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load discussions')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    loadCourseData()
  }, [loadCourseData])

  // ── Thread expand / answer ────────────────────────────────────
  const toggleThread = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    setExpandedId(id)
    try {
      const rows = (await listReplies(id)) as any[]
      setReplies(prev => ({ ...prev, [id]: rows }))
    } catch {
      setReplies(prev => ({ ...prev, [id]: [] }))
    }
  }

  const postAnswer = async (discussionId: string) => {
    const text = (answerDrafts[discussionId] ?? '').trim()
    if (!text || !userId) return
    setPostingAnswer(discussionId)
    setError('')
    try {
      const reply = (await createReply({
        discussion_id: discussionId,
        author_id: userId,
        content: text,
      })) as any
      setReplies(prev => ({ ...prev, [discussionId]: [...(prev[discussionId] ?? []), reply] }))
      setAnswerDrafts(prev => ({ ...prev, [discussionId]: '' }))
    } catch (e: any) {
      setError(e?.message ?? 'Could not post answer')
    } finally {
      setPostingAnswer(null)
    }
  }

  const handleCreateTopic = async () => {
    if (!topicTitle.trim() || !topicBody.trim() || !userId || !courseId) return
    setTopicBusy(true)
    setError('')
    try {
      const created = (await createDiscussion({
        course_id: courseId,
        author_id: userId,
        title: topicTitle.trim(),
        content: topicBody.trim(),
      })) as any
      setDiscussions(prev => [{ ...created, replyCount: 0 }, ...prev])
      setTopicOpen(false)
      setTopicTitle('')
      setTopicBody('')
    } catch (e: any) {
      setError(e?.message ?? 'Could not create topic')
    } finally {
      setTopicBusy(false)
    }
  }

  // ── Announcements ─────────────────────────────────────────────
  const handleCreateAnnouncement = async () => {
    if (!annTitle.trim() || !annBody.trim() || !userId || !courseId) return
    setAnnBusy(true)
    setError('')
    try {
      const created = (await createAnnouncement({
        course_id: courseId,
        institution_id: null,
        author_id: userId,
        title: annTitle.trim(),
        content: annBody.trim(),
        priority: annPriority,
      } as any)) as any
      setAnnouncements(prev => [{ ...created, users: { name: 'You' } }, ...prev])
      setAnnOpen(false)
      setAnnTitle('')
      setAnnBody('')
      setAnnPriority('normal')
    } catch (e: any) {
      setError(e?.message ?? 'Could not publish announcement')
    } finally {
      setAnnBusy(false)
    }
  }

  const sorted = useMemoSafe(discussions)

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Discussions</h1>
            <p className="text-sm text-muted-foreground">Q&A forums and course announcements</p>
          </div>
          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Choose course…" />
            </SelectTrigger>
            <SelectContent>
              {courses.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.code} — {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex gap-2">
          <Button
            variant={tab === 'forum' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('forum')}
            className="gap-1"
          >
            <MessageSquare className="size-3.5" /> Q&A Forum
          </Button>
          <Button
            variant={tab === 'announcements' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('announcements')}
            className="gap-1"
          >
            <Megaphone className="size-3.5" /> Course Announcements
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin mr-2" /> Loading…
          </div>
        ) : !courseId ? (
          <Card><CardContent className="py-14 text-center text-sm text-muted-foreground">
            Choose a course to view its discussions.
          </CardContent></Card>
        ) : tab === 'forum' ? (
          /* ── Forum tab ── */
          <div className="space-y-3">
            <Button size="sm" variant="outline" onClick={() => setTopicOpen(true)} className="gap-1">
              <Plus className="size-3.5" /> New Topic
            </Button>

            {sorted.length === 0 ? (
              <Card><CardContent className="py-14 text-center space-y-2">
                <MessageSquare className="size-7 mx-auto text-muted-foreground" />
                <p className="text-sm font-medium">No topics yet</p>
                <p className="text-sm text-muted-foreground">
                  Start a discussion or students will once they spot the forum.
                </p>
              </CardContent></Card>
            ) : (
              sorted.map(d => {
                const expanded = expandedId === d.id
                const thread = replies[d.id] ?? []
                return (
                  <Card key={d.id}>
                    <CardContent className="p-0">
                      <div className="flex items-start gap-3 p-3.5">
                        <button onClick={() => toggleThread(d.id)} className="min-w-0 flex-1 text-left">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium">{d.title}</span>
                            {d.pinned && <Pin className="size-3 text-primary" />}
                            {d.locked && <Lock className="size-3 text-muted-foreground" />}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{d.content}</p>
                          <span className="text-[11px] text-muted-foreground">
                            {d.users?.name ?? 'Unknown'} · {(d.discussion_replies?.length ?? d.replyCount ?? 0)} repl{(d.discussion_replies?.length ?? 0) === 1 ? 'y' : 'ies'}
                          </span>
                        </button>
                        <div className="flex shrink-0 gap-0.5">
                          <Button variant="ghost" size="sm" className="size-7 p-0" aria-label="Toggle pin"
                            onClick={async () => {
                              await pinDiscussion(d.id, !d.pinned).catch(() => {})
                              setDiscussions(prev => prev.map(x => x.id === d.id ? { ...x, pinned: !x.pinned } : x))
                            }}>
                            {d.pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
                          </Button>
                          <Button variant="ghost" size="sm" className="size-7 p-0" aria-label="Toggle lock"
                            onClick={async () => {
                              await lockDiscussion(d.id, !d.locked).catch(() => {})
                              setDiscussions(prev => prev.map(x => x.id === d.id ? { ...x, locked: !x.locked } : x))
                            }}>
                            {d.locked ? <Unlock className="size-3.5" /> : <Lock className="size-3.5" />}
                          </Button>
                          <Button variant="ghost" size="sm" className="size-7 p-0 text-muted-foreground hover:text-destructive" aria-label="Delete topic"
                            onClick={async () => {
                              if (!confirm('Delete this topic and all replies?')) return
                              await deleteDiscussion(d.id).catch(() => {})
                              setDiscussions(prev => prev.filter(x => x.id !== d.id))
                            }}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>

                      {expanded && (
                        <div className="border-t px-3.5 py-3 space-y-3 bg-muted/20">
                          {!d.locked && (
                            <>
                              {thread.map(r => {
                                const isMine = r.author_id === userId
                                return (
                                  <div key={r.id} className={cn('rounded-lg border p-2.5 bg-card', isMine && 'border-primary/40')}>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-medium">{r.users?.name ?? 'Unknown'}</span>
                                      {isMine && <Badge className="text-[10px] gap-0.5"><CheckCircle2 className="size-2.5" /> Teacher</Badge>}
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap">{r.content}</p>
                                  </div>
                                )
                              })}
                              <div className="flex gap-2">
                                <Input
                                  value={answerDrafts[d.id] ?? ''}
                                  onChange={e => setAnswerDrafts(prev => ({ ...prev, [d.id]: e.target.value }))}
                                  onKeyDown={e => e.key === 'Enter' && postAnswer(d.id)}
                                  placeholder="Write your answer…"
                                />
                                <Button size="sm" className="shrink-0 gap-1" onClick={() => postAnswer(d.id)} disabled={postingAnswer === d.id || !(answerDrafts[d.id] ?? '').trim()}>
                                  {postingAnswer === d.id ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                                  Answer
                                </Button>
                              </div>
                            </>
                          )}
                          {d.locked && <p className="text-xs text-muted-foreground italic">Thread is locked.</p>}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        ) : (
          /* ── Announcements tab ── */
          <div className="space-y-3">
            <Button size="sm" variant="outline" onClick={() => setAnnOpen(true)} className="gap-1">
              <Plus className="size-3.5" /> New Announcement
            </Button>

            {announcements.length === 0 ? (
              <Card><CardContent className="py-14 text-center space-y-2">
                <Megaphone className="size-7 mx-auto text-muted-foreground" />
                <p className="text-sm font-medium">No announcements yet</p>
                <p className="text-sm text-muted-foreground">Publish updates visible to this course.</p>
              </CardContent></Card>
            ) : (
              announcements.map(a => (
                <Card key={a.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold">{a.title}</h3>
                          {a.pinned && <Pin className="size-3 text-primary" />}
                          <Badge variant={a.priority === 'high' || a.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-[11px] capitalize">
                            {a.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{a.content}</p>
                        <span className="text-[11px] text-muted-foreground mt-1 block">
                          Published {new Date(a.published_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex shrink-0 gap-0.5">
                        <Button variant="ghost" size="sm" className="size-7 p-0" aria-label="Toggle pin"
                          onClick={async () => {
                            await pinAnnouncement(a.id, !a.pinned).catch(() => {})
                            setAnnouncements(prev => prev.map(x => x.id === a.id ? { ...x, pinned: !x.pinned } : x))
                          }}>
                          {a.pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="size-7 p-0 text-muted-foreground hover:text-destructive" aria-label="Delete"
                          onClick={async () => {
                            if (!confirm('Delete this announcement?')) return
                            await deleteAnnouncement(a.id).catch(() => {})
                            setAnnouncements(prev => prev.filter(x => x.id !== a.id))
                          }}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* New topic dialog */}
        <Dialog open={topicOpen} onOpenChange={setTopicOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>New discussion topic</DialogTitle>
              <DialogDescription>Visible to everyone in this course.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="t-title">Title</Label>
                <Input id="t-title" value={topicTitle} onChange={e => setTopicTitle(e.target.value)} placeholder="e.g. Week 3 — ask anything about momentum" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="t-body">Opening post</Label>
                <Textarea id="t-body" rows={4} value={topicBody} onChange={e => setTopicBody(e.target.value)} placeholder="Set the scene or pose your question…" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTopicOpen(false)} disabled={topicBusy}>Cancel</Button>
              <Button onClick={handleCreateTopic} disabled={topicBusy || !topicTitle.trim() || !topicBody.trim()} className="gap-1">
                {topicBusy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                Create Topic
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New announcement dialog */}
        <Dialog open={annOpen} onOpenChange={setAnnOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>New announcement</DialogTitle>
              <DialogDescription>Published immediately to this course.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="a-title">Title</Label>
                <Input id="a-title" value={annTitle} onChange={e => setAnnTitle(e.target.value)} placeholder="e.g. Lab moved to Friday" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="a-body">Message</Label>
                <Textarea id="a-body" rows={4} value={annBody} onChange={e => setAnnBody(e.target.value)} />
              </div>
              <div className="space-y-1 w-40">
                <Label>Priority</Label>
                <Select value={annPriority} onValueChange={setAnnPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAnnOpen(false)} disabled={annBusy}>Cancel</Button>
              <Button onClick={handleCreateAnnouncement} disabled={annBusy || !annTitle.trim() || !annBody.trim()} className="gap-1">
                {annBusy ? <Loader2 className="size-4 animate-spin" /> : <Megaphone className="size-4" />}
                Publish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="pb-6" />
      </div>
    </AppShell>
  )
}

// Pinned-first ordering without importing useMemo separately everywhere.
function useMemoSafe(items: DiscussionRow[]): DiscussionRow[] {
  return [...items].sort((a, b) => Number(b.pinned) - Number(a.pinned))
}
