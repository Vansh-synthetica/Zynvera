'use client'

import { useState } from 'react'
import { GripVertical, Pin, PinOff, Trash2, Bell, AlertTriangle, Info, Megaphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PragmaticSortableList } from './sortable-list'
import type { SortableItem } from './sortable-list'

type Announcement = SortableItem & {
  title: string
  content: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  pinned: boolean
  author: string
  publishedAt: string
}

type SortableAnnouncementsProps = {
  announcements: Announcement[]
  onReorder: (items: Announcement[]) => void
  onPin?: (id: string) => void
  onDelete?: (id: string) => void
  readOnly?: boolean
}

const priorityConfig: Record<string, { color: string; icon: typeof Bell }> = {
  low: { color: 'bg-gray-100 text-gray-700', icon: Info },
  normal: { color: 'bg-blue-100 text-blue-700', icon: Bell },
  high: { color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
  urgent: { color: 'bg-red-100 text-red-700', icon: Megaphone },
}

export function SortableAnnouncements({
  announcements,
  onReorder,
  onPin,
  onDelete,
  readOnly,
}: SortableAnnouncementsProps) {
  const sorted = [...announcements].sort((a, b) => {
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
        const announcement = item as Announcement
        const { color, icon: PriorityIcon } = priorityConfig[announcement.priority] || priorityConfig.normal

        return (
          <div className="flex items-start gap-3">
            <PriorityIcon className="size-4 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{announcement.title}</span>
                {announcement.pinned && <Pin className="size-3 text-primary" />}
                <Badge className={`text-xs ${color}`}>{announcement.priority}</Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {announcement.content}
              </p>
              <span className="text-xs text-muted-foreground">
                {announcement.author} · {new Date(announcement.publishedAt).toLocaleDateString()}
              </span>
            </div>
            {!readOnly && onPin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPin(announcement.id)}
                className="h-6 p-1"
              >
                {announcement.pinned ? <PinOff className="size-3" /> : <Pin className="size-3" />}
              </Button>
            )}
          </div>
        )
      }}
    />
  )
}

export type { Announcement }
