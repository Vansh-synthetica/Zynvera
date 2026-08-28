'use client'

import { useCallback, useEffect, useState } from 'react'
import { Megaphone, Plus, Search, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { SortableAnnouncements, type Announcement } from '@/components/dnd/sortable-announcements'
import {
  listAnnouncements,
  createAnnouncement,
  pinAnnouncement,
  deleteAnnouncement,
  reorderAnnouncements,
  broadcastAnnouncement,
} from '@/lib/api/announcements'
import { useWorkspace } from '@/lib/workspace-context'

export default function PrincipalAnnouncementsPage() {
  const { institutionId, userId } = useWorkspace()

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  // create dialog
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [priority, setPriority] = useState('normal')
  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState('')

  const load = useCallback(async () => {
    if (!institutionId) return
    try {
      setLoading(true)
      setError('')
      const rows = (await listAnnouncements(institutionId)) as any[]
      setAnnouncements(
        rows.map(r => ({
          id: r.id,
          title: r.title,
          content: r.content,
          priority: r.priority,
          pinned: r.pinned,
          author: r.users?.name ?? 'School',
          publishedAt: r.published_at,
        })),
      )
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }, [institutionId])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async () => {
    if (!institutionId || !userId || !title.trim() || !content.trim()) return
    setBusy(true)
    setError('')
    try {
      const created = await createAnnouncement({
        institution_id: institutionId,
        author_id: userId,
        title: title.trim(),
        content: content.trim(),
        priority,
      })
      // Push it to every member's notification bell (deduped server-side).
      let notified = 0
      try {
        notified = await broadcastAnnouncement((created as any).id)
      } catch {
        // announcement is still published even if fan-out fails
      }
      setOpen(false)
      setTitle('')
      setContent('')
      setPriority('normal')
      setInfo(
        notified > 0
          ? `Published — ${notified} member${notified === 1 ? '' : 's'} notified.`
          : 'Published.',
      )
      setTimeout(() => setInfo(''), 4000)
      load()
    } catch (e: any) {
      setError(e?.message ?? 'Publish failed')
    } finally {
      setBusy(false)
    }
  }

  const handleReorder = async (next: Announcement[]) => {
    // Optimistic local move, then persist; reload on failure.
    setAnnouncements(next)
    try {
      await reorderAnnouncements(next.map(a => a.id))
    } catch (e: any) {
      setError(e?.message ?? 'Reorder failed')
      load()
    }
  }

  const filtered = announcements.filter(
    a =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Announcements</h1>
          <p className="text-sm text-muted-foreground">
            School-wide updates — drag to reorder priority
          </p>
        </div>
        <Button className="gap-1" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> New Announcement
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search announcements..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="outline">{filtered.length}</Badge>
      </div>

      {info && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950 p-3 text-sm text-green-700 dark:text-green-400">
          <Megaphone className="size-4 shrink-0" /> {info}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Megaphone className="size-4" />
            Institution Announcements
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Drag to reorder. Pinned items appear first for everyone.
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="size-5 animate-spin mr-2" /> Loading…
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nothing published yet — create your first announcement.
            </p>
          ) : (
            <SortableAnnouncements
              announcements={filtered}
              onReorder={handleReorder}
              onPin={async id => {
                const target = announcements.find(a => a.id === id)
                if (!target) return
                try {
                  await pinAnnouncement(id, !target.pinned)
                  setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, pinned: !a.pinned } : a))
                } catch (e: any) {
                  setError(e?.message ?? 'Pin failed')
                }
              }}
              onDelete={async id => {
                if (!confirm('Delete this announcement?')) return
                try {
                  await deleteAnnouncement(id)
                  setAnnouncements(prev => prev.filter(a => a.id !== id))
                } catch (e: any) {
                  setError(e?.message ?? 'Delete failed')
                }
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New announcement</DialogTitle>
            <DialogDescription>Published immediately to the whole institution.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="pa-title">Title</Label>
              <Input id="pa-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Short headline…" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pa-body">Message</Label>
              <Textarea id="pa-body" rows={4} value={content} onChange={e => setContent(e.target.value)} />
            </div>
            <div className="space-y-1 w-40">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
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
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={handleCreate} disabled={busy || !title.trim() || !content.trim()} className="gap-1">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Megaphone className="size-4" />} Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
