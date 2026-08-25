'use client'

import { useState } from 'react'
import { GripVertical, Plus, Trash2, ChevronDown, ChevronRight, FileText, Video, BookOpen, FlaskConical, MessageSquare, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PragmaticSortableList } from './sortable-list'
import type { SortableItem } from './sortable-list'

type LessonType = 'video' | 'reading' | 'quiz' | 'lab' | 'activity' | 'discussion'

type Lesson = SortableItem & {
  title: string
  type: LessonType
  duration?: string
}

type Module = SortableItem & {
  title: string
  lessons: Lesson[]
  locked: boolean
}

type CourseModuleBuilderProps = {
  initialModules?: Module[]
  onChange: (modules: Module[]) => void
  readOnly?: boolean
}

const lessonTypeIcons: Record<LessonType, typeof FileText> = {
  video: Video,
  reading: BookOpen,
  quiz: CheckSquare,
  lab: FlaskConical,
  activity: FileText,
  discussion: MessageSquare,
}

const lessonTypeColors: Record<LessonType, string> = {
  video: 'bg-blue-100 text-blue-700',
  reading: 'bg-green-100 text-green-700',
  quiz: 'bg-purple-100 text-purple-700',
  lab: 'bg-orange-100 text-orange-700',
  activity: 'bg-yellow-100 text-yellow-700',
  discussion: 'bg-pink-100 text-pink-700',
}

let moduleCounter = 0
let lessonCounter = 0

export function CourseModuleBuilder({ initialModules = [], onChange, readOnly }: CourseModuleBuilderProps) {
  const [modules, setModules] = useState<Module[]>(initialModules)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(initialModules.map(m => m.id)))
  const [newModuleTitle, setNewModuleTitle] = useState('')

  const toggleModule = (id: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const updateModules = (newModules: Module[]) => {
    setModules(newModules)
    onChange(newModules)
  }

  const addModule = () => {
    const title = newModuleTitle.trim() || `Module ${modules.length + 1}`
    const newModule: Module = {
      id: `mod-${++moduleCounter}-${Date.now()}`,
      title,
      lessons: [],
      locked: true,
    }
    updateModules([...modules, newModule])
    setNewModuleTitle('')
    setExpandedModules(prev => new Set(prev).add(newModule.id))
  }

  const removeModule = (id: string) => {
    updateModules(modules.filter(m => m.id !== id))
  }

  const updateModuleTitle = (id: string, title: string) => {
    updateModules(modules.map(m => m.id === id ? { ...m, title } : m))
  }

  const toggleModuleLock = (id: string) => {
    updateModules(modules.map(m => m.id === id ? { ...m, locked: !m.locked } : m))
  }

  const addLesson = (moduleId: string, type: LessonType = 'reading') => {
    const lesson: Lesson = {
      id: `les-${++lessonCounter}-${Date.now()}`,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type,
    }
    updateModules(modules.map(m =>
      m.id === moduleId ? { ...m, lessons: [...m.lessons, lesson] } : m
    ))
  }

  const removeLesson = (moduleId: string, lessonId: string) => {
    updateModules(modules.map(m =>
      m.id === moduleId ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) } : m
    ))
  }

  const updateLessonTitle = (moduleId: string, lessonId: string, title: string) => {
    updateModules(modules.map(m =>
      m.id === moduleId
        ? { ...m, lessons: m.lessons.map(l => l.id === lessonId ? { ...l, title } : l) }
        : m
    ))
  }

  const reorderLessons = (moduleId: string, newLessons: Lesson[]) => {
    updateModules(modules.map(m =>
      m.id === moduleId ? { ...m, lessons: newLessons } : m
    ))
  }

  return (
    <div className="space-y-4">
      {modules.map((module, mIndex) => {
        const isExpanded = expandedModules.has(module.id)
        const LessonIcon = lessonTypeIcons.reading

        return (
          <Card key={module.id} className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                {!readOnly && (
                  <button
                    className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
                    tabIndex={-1}
                  >
                    <GripVertical className="size-4" />
                  </button>
                )}
                <button
                  onClick={() => toggleModule(module.id)}
                  className="flex items-center gap-2 flex-1 text-left"
                >
                  {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                  <span className="font-medium text-sm">Module {mIndex + 1}</span>
                  <Badge variant="outline" className="text-xs">
                    {module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''}
                  </Badge>
                  {module.locked && <Badge variant="secondary" className="text-xs">Locked</Badge>}
                </button>
                {!readOnly && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleModuleLock(module.id)}
                      className="h-7 text-xs"
                    >
                      {module.locked ? 'Unlock' : 'Lock'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeModule(module.id)}
                      className="h-7 p-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                )}
              </div>
              {!readOnly && isExpanded && (
                <div className="mt-2">
                  <Input
                    value={module.title}
                    onChange={e => updateModuleTitle(module.id, e.target.value)}
                    placeholder="Module title"
                    className="h-8 text-sm"
                  />
                </div>
              )}
            </CardHeader>
            {isExpanded && (
              <CardContent className="pt-0">
                {module.lessons.length > 0 ? (
                  <PragmaticSortableList
                    items={module.lessons}
                    onReorder={(newLessons) => reorderLessons(module.id, newLessons as Lesson[])}
                    onRemove={readOnly ? undefined : (id) => removeLesson(module.id, id)}
                    renderItem={(lesson) => {
                      const Icon = lessonTypeIcons[lesson.type] || FileText
                      return (
                        <div className="flex items-center gap-2">
                          <Icon className="size-4 text-muted-foreground" />
                          {!readOnly ? (
                            <Input
                              value={lesson.title}
                              onChange={e => updateLessonTitle(module.id, lesson.id, e.target.value)}
                              className="h-7 text-sm border-0 p-0 focus-visible:ring-0 shadow-none"
                            />
                          ) : (
                            <span className="text-sm">{lesson.title}</span>
                          )}
                          <Badge className={`text-xs ${lessonTypeColors[lesson.type]}`}>
                            {lesson.type}
                          </Badge>
                          {lesson.duration && (
                            <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                          )}
                        </div>
                      )
                    }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No lessons yet. Add one below.
                  </p>
                )}
                {!readOnly && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {(Object.keys(lessonTypeIcons) as LessonType[]).map(type => {
                      const Icon = lessonTypeIcons[type]
                      return (
                        <Button
                          key={type}
                          variant="outline"
                          size="sm"
                          onClick={() => addLesson(module.id, type)}
                          className="h-7 text-xs gap-1"
                        >
                          <Icon className="size-3" />
                          {type}
                        </Button>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        )
      })}

      {!readOnly && (
        <div className="flex gap-2">
          <Input
            value={newModuleTitle}
            onChange={e => setNewModuleTitle(e.target.value)}
            placeholder="New module title..."
            className="h-9"
            onKeyDown={e => e.key === 'Enter' && addModule()}
          />
          <Button onClick={addModule} className="gap-1">
            <Plus className="size-4" />
            Add Module
          </Button>
        </div>
      )}
    </div>
  )
}

export type { Module, Lesson, LessonType }
