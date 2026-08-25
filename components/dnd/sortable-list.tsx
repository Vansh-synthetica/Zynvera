'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  DragDropProvider,
  DragOverlay,
  useDraggable,
  useDroppable,
} from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/adapter/element-adapter'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/utils/element/custom-native-drag-preview/set-custom-native-drag-preview'
import { GripVertical, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type SortableItem = {
  id: string
  [key: string]: any
}

type SortableListProps = {
  items: SortableItem[]
  onReorder: (items: SortableItem[]) => void
  renderItem?: (item: SortableItem, index: number) => React.ReactNode
  onRemove?: (id: string) => void
  className?: string
  disabled?: boolean
}

// ── dnd-kit backend ──────────────────────────────────────────────

function DndKitRow({
  item,
  index,
  renderItem,
  onRemove,
  disabled,
}: {
  item: SortableItem
  index: number
  renderItem?: (item: SortableItem, index: number) => React.ReactNode
  onRemove?: (id: string) => void
  disabled?: boolean
}) {
  const { ref, isDragged, handleRef } = useSortable({
    id: item.id,
    index,
    disabled,
  })

  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-2 rounded-lg border bg-card p-3 transition-all',
        isDragged && 'opacity-50',
        !disabled && 'hover:border-primary/30',
      )}
    >
      {!disabled && (
        <button
          ref={handleRef}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
          tabIndex={-1}
          aria-label={`Reorder ${item.id}`}
        >
          <GripVertical className="size-4" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        {renderItem ? renderItem(item, index) : <span className="text-sm">{item.id}</span>}
      </div>
      {onRemove && !disabled && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(item.id)}
          className="size-7 p-0 text-muted-foreground hover:text-destructive"
          aria-label={`Remove ${item.id}`}
        >
          <X className="size-3" />
        </Button>
      )}
    </div>
  )
}

export function SortableList({
  items,
  onReorder,
  renderItem,
  onRemove,
  className,
  disabled,
}: SortableListProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const activeItem = activeId ? items.find(i => i.id === activeId) : null

  return (
    <DragDropProvider
      onDragStart={({ operation }: any) =>
        setActiveId(operation?.source ? String(operation.source.id) : null)
      }
      onDragEnd={({ operation }: any) => {
        setActiveId(null)
        const sourceId = operation?.source ? String(operation.source.id) : null
        const targetId = operation?.target ? String(operation.target.id) : null
        if (!sourceId || !targetId || sourceId === targetId) return

        const oldIndex = items.findIndex(i => i.id === sourceId)
        const newIndex = items.findIndex(i => i.id === targetId)
        if (oldIndex === -1 || newIndex === -1) return

        const newItems = [...items]
        const [moved] = newItems.splice(oldIndex, 1)
        newItems.splice(newIndex, 0, moved)
        onReorder(newItems)
      }}
    >
      <div className={cn('flex flex-col gap-2', className)}>
        {items.map((item, index) => (
          <DndKitRow
            key={item.id}
            item={item}
            index={index}
            renderItem={renderItem}
            onRemove={onRemove}
            disabled={disabled}
          />
        ))}
      </div>
      <DragOverlay>
        {activeItem && (
          <div className="rounded-lg border bg-card p-3 shadow-xl ring-2 ring-primary/20 opacity-90">
            <div className="flex items-center gap-2">
              <GripVertical className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">{String(activeItem.id)}</span>
            </div>
          </div>
        )}
      </DragOverlay>
    </DragDropProvider>
  )
}

// ── Pragmatic backend (default, used across the app) ─────────────

type PragmaticItemData = { id: string }

function PragmaticRow({
  item,
  index,
  items,
  onReorder,
  renderItem,
  onRemove,
  disabled,
}: {
  item: SortableItem
  index: number
  items: SortableItem[]
  onReorder: (items: SortableItem[]) => void
  renderItem?: (item: SortableItem, index: number) => React.ReactNode
  onRemove?: (id: string) => void
  disabled?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isOver, setIsOver] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || disabled) return

    return combine(
      draggable({
        element: el,
        getInitialData: (): PragmaticItemData => ({ id: item.id }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        element: el,
        getData: (): PragmaticItemData => ({ id: item.id }),
        canDrop: ({ source }) => source.data.id !== item.id,
        onDragEnter: () => setIsOver(true),
        onDragLeave: () => setIsOver(false),
        onDrop: () => setIsOver(false),
      }),
    )
  }, [item.id, disabled])

  // Reorder is handled centrally by the parent monitor so drop targets
  // stay stable while items move.
  return (
    <div
      ref={ref}
      data-sortable-id={item.id}
      className={cn(
        'flex items-center gap-2 rounded-lg border bg-card p-3 transition-all',
        isDragging && 'opacity-40',
        isOver && 'border-primary ring-2 ring-primary/20',
        !disabled && !isDragging && 'hover:border-primary/30',
      )}
    >
      {!disabled && (
        <span className="cursor-grab active:cursor-grabbing text-muted-foreground touch-none">
          <GripVertical className="size-4" />
        </span>
      )}
      <div className="flex-1 min-w-0">
        {renderItem ? renderItem(item, index) : <span className="text-sm">{item.id}</span>}
      </div>
      {onRemove && !disabled && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(item.id)}
          className="size-7 p-0 text-muted-foreground hover:text-destructive"
          aria-label={`Remove ${item.id}`}
        >
          <X className="size-3" />
        </Button>
      )}
    </div>
  )
}

export function PragmaticSortableList({
  items,
  onReorder,
  renderItem,
  onRemove,
  className,
  disabled,
}: SortableListProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Central monitor performs the actual reordering when any row drops
  // onto another row within this list.
  useEffect(() => {
    if (disabled) return
    const container = containerRef.current
    if (!container) return

    return monitorForElements({
      canMonitor: ({ source }) =>
        container.contains(source.element as Node),
      onDrop: ({ source, target }) => {
        const sourceId = String(source.data.id)
        const targetId = target?.data?.id ? String(target.data.id) : null
        if (!targetId || sourceId === targetId) return

        const fromIndex = items.findIndex(i => i.id === sourceId)
        const toIndex = items.findIndex(i => i.id === targetId)
        if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return

        const newItems = [...items]
        const [moved] = newItems.splice(fromIndex, 1)
        newItems.splice(toIndex, 0, moved)
        onReorder(newItems)
      },
    })
  }, [items, onReorder, disabled])

  if (disabled) {
    return (
      <div ref={containerRef} className={cn('flex flex-col gap-2', className)}>
        {items.map((item, index) => (
          <div key={item.id} className="flex items-center gap-2 rounded-lg border bg-card p-3">
            <div className="flex-1 min-w-0">
              {renderItem ? renderItem(item, index) : <span className="text-sm">{item.id}</span>}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div ref={containerRef} className={cn('flex flex-col gap-2', className)}>
      {items.map((item, index) => (
        <PragmaticRow
          key={item.id}
          item={item}
          index={index}
          items={items}
          onReorder={onReorder}
          renderItem={renderItem}
          onRemove={onRemove}
          disabled={disabled}
        />
      ))}
    </div>
  )
}

import { combine } from '@atlaskit/pragmatic-drag-and-drop/utils/combine'

export default PragmaticSortableList
