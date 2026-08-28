'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Send,
  Loader2,
  AlertCircle,
  MessagesSquare,
  Search,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  getConversations,
  getConversation,
  sendMessage,
  markAsRead,
} from '@/lib/api/messages'
import { searchUsers } from '@/lib/api/students'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/lib/workspace-context'
import { cn } from '@/lib/utils'

type Conversation = {
  otherUserId: string
  otherUser: any
  lastMessage: string
  lastMessageAt: string
  unread: boolean
}
type MessageRow = {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  created_at: string
}

export default function StudentMessagesPage() {
  const { userId, institutionId } = useWorkspace()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [thread, setThread] = useState<MessageRow[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const [newOpen, setNewOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Array<{ id: string; name: string; email: string; role?: string }>>([])
  const [searching, setSearching] = useState(false)

  const threadEndRef = useRef<HTMLDivElement>(null)

  // ── Conversations ─────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!userId) return
    try {
      setError('')
      const rows = (await getConversations(userId)) as unknown as Conversation[]
      setConversations(rows ?? [])
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // ── Realtime: refresh list on any new message ─────────────────
  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    const channel = supabase
      .channel('student-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        payload => {
          const row = payload.new as MessageRow
          if (row.recipient_id === userId || row.sender_id === userId) {
            loadConversations()

            // Live-append when the message belongs to the open thread.
            if (
              activeId &&
              (row.sender_id === activeId || row.recipient_id === activeId) &&
              !String(row.id).startsWith('tmp-')
            ) {
              setThread(prev =>
                prev.some(m => m.id === row.id) ? prev : [...prev, row],
              )
              if (row.sender_id !== userId) markAsRead(row.sender_id, userId)
              requestAnimationFrame(() =>
                threadEndRef.current?.scrollIntoView({ behavior: 'smooth' }),
              )
            }
          }
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, activeId, loadConversations])

  // ── Open thread ───────────────────────────────────────────────
  const openThread = useCallback(
    async (otherId: string) => {
      setActiveId(otherId)
      setThread([])
      try {
        const rows = (await getConversation(userId!, otherId)) as any[]
        setThread(rows ?? [])
        await markAsRead(otherId, userId!)
        setConversations(prev =>
          prev.map(c => (c.otherUserId === otherId ? { ...c, unread: false } : c)),
        )
        requestAnimationFrame(() => threadEndRef.current?.scrollIntoView({ behavior: 'smooth' }))
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load thread')
      }
    },
    [userId],
  )

  const handleSend = async () => {
    if (!activeId || !draft.trim() || !userId) return
    setSending(true)
    setError('')
    const content = draft.trim()
    try {
      await sendMessage({ sender_id: userId, recipient_id: activeId, content })
      setDraft('')
      setThread(prev => [
        ...prev,
        {
          id: `tmp-${Date.now()}`,
          sender_id: userId,
          recipient_id: activeId,
          content,
          created_at: new Date().toISOString(),
        },
      ])
      requestAnimationFrame(() => threadEndRef.current?.scrollIntoView({ behavior: 'smooth' }))
    } catch (e: any) {
      setError(e?.message ?? 'Send failed')
    } finally {
      setSending(false)
    }
  }

  const runSearch = async () => {
    if (!institutionId || query.trim().length < 2) return
    setSearching(true)
    try {
      const found = (await searchUsers(institutionId, query.trim())) as any[]
      setResults(found.filter(u => u.id !== userId))
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  const activeConv = useMemo(
    () => conversations.find(c => c.otherUserId === activeId),
    [conversations, activeId],
  )

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Messages</h1>
            <p className="text-sm text-muted-foreground">Message teachers and classmates</p>
          </div>
          <Button onClick={() => { setNewOpen(true); setQuery(''); setResults([]) }} className="gap-1">
            <Search className="size-4" /> New Chat
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          <Card className="h-fit lg:max-h-[70vh] overflow-y-auto">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-14 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin mr-2" /> Loading…
                </div>
              ) : conversations.length === 0 ? (
                <div className="py-14 px-4 text-center space-y-2">
                  <MessagesSquare className="size-7 mx-auto text-muted-foreground" />
                  <p className="text-sm font-medium">No chats yet</p>
                  <p className="text-xs text-muted-foreground">Message a teacher to get started.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {conversations.map(conv => (
                    <button
                      key={conv.otherUserId}
                      onClick={() => openThread(conv.otherUserId)}
                      className={cn(
                        'w-full text-left flex gap-3 px-3 py-3 hover:bg-muted/40 transition-colors cursor-pointer',
                        activeId === conv.otherUserId && 'bg-muted/60',
                      )}
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {(conv.otherUser?.name ?? '?').slice(0, 1)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-sm font-medium truncate">{conv.otherUser?.name ?? 'Unknown'}</p>
                          {conv.unread && <span className="size-2 rounded-full bg-primary shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="flex flex-col min-h-[60vh]">
            {activeId ? (
              <>
                <div className="border-b px-4 py-3 flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="lg:hidden h-7 px-2" onClick={() => setActiveId(null)}>
                    <ArrowLeft className="size-4" />
                  </Button>
                  <p className="font-medium text-sm truncate">{activeConv?.otherUser?.name ?? 'Conversation'}</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[52vh]">
                  {thread.map(m => {
                    const mine = m.sender_id === userId
                    return (
                      <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                        <div
                          className={cn(
                            'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm',
                            mine ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm',
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                          <p className={cn('text-[10px] mt-1', mine ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={threadEndRef} />
                </div>

                <div className="border-t p-3 flex gap-2">
                  <Input
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Write a message…"
                    disabled={sending}
                  />
                  <Button onClick={handleSend} disabled={sending || !draft.trim()} className="shrink-0 gap-1">
                    {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    Send
                  </Button>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center py-24 text-center">
                <div className="space-y-2">
                  <MessagesSquare className="size-8 mx-auto text-muted-foreground" />
                  <p className="text-sm font-medium">Select a chat</p>
                  <p className="text-xs text-muted-foreground">Or start one with a teacher.</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start a chat</DialogTitle>
            <DialogDescription>Find a teacher or classmate in your institution.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && runSearch()}
                placeholder="Name or email…"
                autoFocus
              />
              <Button variant="outline" onClick={runSearch} disabled={searching} className="shrink-0">
                {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              </Button>
            </div>
            {results.length > 0 && (
              <div className="rounded-md border divide-y max-h-[240px] overflow-y-auto">
                {results.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setNewOpen(false)
                      openThread(u.id)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50 text-left"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {u.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                    {u.role && <Badge variant="outline" className="ml-auto shrink-0 capitalize">{u.role}</Badge>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
