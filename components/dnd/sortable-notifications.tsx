'use client'

import {
  GripVertical,
  Check,
  CheckCheck,
  Trash2,
  Bell,
  GraduationCap,
  ClipboardList,
  MessageSquare,
  Calendar,
  AlertCircle,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PragmaticSortableList } from './sortable-list'
import type { SortableItem } from './sortable-list'
import { cn } from '@/lib/utils'

type Notification = SortableItem & {
  title: string
  message: string
  category: string
  read: boolean
  actionUrl?: string
  createdAt: string
}

type SortableNotificationsProps = {
  notifications: Notification[]
  onReorder: (items: Notification[]) => void
  onMarkRead?: (id: string) => void
  onMarkAllRead?: () => void
  onDelete?: (id: string) => void
  onClearAll?: () => void
  readOnly?: boolean
}

const categoryConfig: Record<string, { icon: typeof Bell; color: string }> = {
  academic: { icon: GraduationCap, color: 'text-blue-500' },
  attendance: { icon: AlertCircle, color: 'text-orange-500' },
  assignments: { icon: ClipboardList, color: 'text-purple-500' },
  grades: { icon: GraduationCap, color: 'text-green-500' },
  messages: { icon: MessageSquare, color: 'text-cyan-500' },
  announcements: { icon: Bell, color: 'text-yellow-500' },
  meetings: { icon: Calendar, color: 'text-pink-500' },
  institution: { icon: Settings, color: 'text-gray-500' },
  system: { icon: Settings, color: 'text-slate-500' },
}

export function SortableNotifications({
  notifications,
  onReorder,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  onClearAll,
  readOnly,
}: SortableNotificationsProps) {
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="space-y-3">
      {unreadCount > 0 && onMarkAllRead && (
        <div className="flex items-center justify-between">
          <Badge variant="secondary">{unreadCount} unread</Badge>
          <Button variant="ghost" size="sm" onClick={onMarkAllRead} className="text-xs gap-1">
            <CheckCheck className="size-3" />
            Mark all read
          </Button>
        </div>
      )}

      <PragmaticSortableList
        items={notifications}
        onReorder={onReorder}
        onRemove={readOnly ? undefined : (id) => onDelete?.(id)}
        renderItem={(item) => {
          const notification = item as Notification
          const config = categoryConfig[notification.category] || categoryConfig.system
          const Icon = config.icon

          return (
            <div className="flex items-start gap-3">
              <Icon className={cn('size-4 mt-0.5 shrink-0', config.color)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn('text-sm', !notification.read && 'font-medium')}>
                    {notification.title}
                  </span>
                  {!notification.read && (
                    <span className="size-2 rounded-full bg-primary shrink-0" />
                  )}
                  <Badge variant="outline" className="text-xs">
                    {notification.category}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {notification.message}
                </p>
                <span className="text-[11px] text-muted-foreground">
                  {new Date(notification.createdAt).toLocaleString()}
                </span>
              </div>
              {!readOnly && onMarkRead && !notification.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMarkRead(notification.id)}
                  className="h-6 p-1"
                >
                  <Check className="size-3" />
                </Button>
              )}
            </div>
          )
        }}
      />
    </div>
  )
}

export type { Notification }
