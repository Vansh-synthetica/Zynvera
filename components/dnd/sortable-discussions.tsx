'use client'

import { GripVertical, Pin, PinOff, Lock, Unlock, MessageSquare, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PragmaticSortableList } from './sortable-list'
import type { SortableItem } from './sortable-list'

type Discussion = SortableItem & {
  title: string
  content: string
  pinned: boolean
  locked: boolean
  author: string
  replyCount: number
  createdAt: string
}

type SortableDiscussionsProps = {
  discussions: Discussion[]
  onReorder: (items: Discussion[]) => void
  onPin?: (id: string) => void
  onLock?: (id: string) => void
  onDelete?: (id: string) => void
  readOnly?: boolean
}

export function SortableDiscussions({
  discussions,
  onReorder,
  onPin,
  onLock,
  onDelete,
  readOnly,
}: SortableDiscussionsProps) {
  const sorted = [...discussions].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return 0
  })

  return (
    <PragmaticSortableList
      items={sorted}
      onReorder={onReorder}
      onRemove={readOnly ? undefined : (id) => onDelete?.(id)}
      renderItem={(item) => {
        const discussion = item as Discussion
        return (
          <div className="flex items-start gap-3">
            <MessageSquare className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{discussion.title}</span>
                {discussion.pinned && <Pin className="size-3 text-primary" />}
                {discussion.locked && <Lock className="size-3 text-muted-foreground" />}
                <Badge variant="outline" className="text-xs">
                  {discussion.replyCount} repl{discussion.replyCount !== 1 ? 'ies' : 'y'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {discussion.content}
              </p>
              <span className="text-xs text-muted-foreground">
                {discussion.author} · {new Date(discussion.createdAt).toLocaleDateString()}
              </span>
            </div>
            {!readOnly && (
              <div className="flex items-center gap-1">
                {onPin && (
                  <Button variant="ghost" size="sm" onClick={() => onPin(discussion.id)} className="h-6 p-1">
                    {discussion.pinned ? <PinOff className="size-3" /> : <Pin className="size-3" />}
                  </Button>
                )}
                {onLock && (
                  <Button variant="ghost" size="sm" onClick={() => onLock(discussion.id)} className="h-6 p-1">
                    {discussion.locked ? <Unlock className="size-3" /> : <Lock className="size-3" />}
                  </Button>
                )}
              </div>
            )}
          </div>
        )
      }}
    />
  )
}

export type { Discussion }
