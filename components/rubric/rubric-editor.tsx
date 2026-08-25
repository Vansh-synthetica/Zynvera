'use client'

import { useState } from 'react'
import { Plus, Trash2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PragmaticSortableList } from '@/components/dnd/sortable-list'
import type { Rubric, RubricCriterion, RubricRating, RubricAssessmentRating, MasteryLevel } from '@/lib/grading/rubric'
import { rubricPointsPossible, masteryLevelFor } from '@/lib/grading/rubric'
import { cn } from '@/lib/utils'

let idCounter = 0
const nextId = (prefix: string) => `${prefix}-${++idCounter}-${Date.now()}`

const masteryStyles: Record<MasteryLevel, string> = {
  exceeds: 'bg-green-100 text-green-700',
  meets: 'bg-blue-100 text-blue-700',
  near: 'bg-yellow-100 text-yellow-700',
  below: 'bg-red-100 text-red-700',
}

// ── Editor ───────────────────────────────────────────────────────

type RubricEditorProps = {
  initialRubric?: Rubric
  onChange: (rubric: Rubric) => void
  readOnly?: boolean
}

export function RubricEditor({ initialRubric, onChange, readOnly }: RubricEditorProps) {
  const [rubric, setRubric] = useState<Rubric>(
    initialRubric ?? { id: nextId('rub'), title: '', criteria: [], pointsPossible: 0 },
  )

  const update = (next: Partial<Rubric>) => {
    const merged = { ...rubric, ...next }
    merged.pointsPossible = rubricPointsPossible(merged.criteria)
    setRubric(merged)
    onChange(merged)
  }

  const addCriterion = () => {
    update({
      criteria: [
        ...rubric.criteria,
        {
          id: nextId('crit'),
          description: '',
          points: 10,
          ratings: defaultRatings(10),
        },
      ],
    })
  }

  const removeCriterion = (id: string) =>
    update({ criteria: rubric.criteria.filter(c => c.id !== id) })

  const patchCriterion = (id: string, patch: Partial<RubricCriterion>) =>
    update({
      criteria: rubric.criteria.map(c => (c.id === id ? { ...c, ...patch } : c)),
    })

  const reorderCriteria = (items: Array<{ id: string }>) =>
    update({
      criteria: items
        .map(item => rubric.criteria.find(c => c.id === item.id))
        .filter((c): c is RubricCriterion => Boolean(c)),
    })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Rubric Details</CardTitle>
            <Badge>{rubric.pointsPossible} points</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="rubric-title">Title</Label>
            <Input
              id="rubric-title"
              value={rubric.title}
              onChange={e => update({ title: e.target.value })}
              placeholder="e.g. Essay Grading Rubric"
              disabled={readOnly}
            />
          </div>
        </CardContent>
      </Card>

      <PragmaticSortableList
        items={rubric.criteria.map(c => ({ id: c.id }))}
        onReorder={reorderCriteria}
        onRemove={readOnly ? undefined : id => removeCriterion(id)}
        renderItem={({ id }) => {
          const criterion = rubric.criteria.find(c => c.id === id)
          if (!criterion) return null
          return (
            <CriterionEditor
              key={id}
              criterion={criterion}
              readOnly={readOnly}
              onChange={patch => patchCriterion(id, patch)}
            />
          )
        }}
      />

      {!readOnly && (
        <Button variant="outline" onClick={addCriterion} className="gap-1">
          <Plus className="size-4" />
          Add Criterion
        </Button>
      )}
    </div>
  )
}

function defaultRatings(points: number): RubricRating[] {
  return [
    { id: nextId('rate'), label: 'Excellent', points, description: '' },
    { id: nextId('rate'), label: 'Good', points: Math.round(points * 0.75), description: '' },
    { id: nextId('rate'), label: 'Fair', points: Math.round(points * 0.5), description: '' },
    { id: nextId('rate'), label: 'Poor', points: Math.round(points * 0.25), description: '' },
  ]
}

function CriterionEditor({
  criterion,
  onChange,
  readOnly,
}: {
  criterion: RubricCriterion
  onChange: (patch: Partial<RubricCriterion>) => void
  readOnly?: boolean
}) {
  const patchRating = (ratingId: string, patch: Partial<RubricRating>) =>
    onChange({
      ratings: criterion.ratings.map(r => (r.id === ratingId ? { ...r, ...patch } : r)),
    })

  return (
    <div className="rounded-lg border bg-card p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Input
          value={criterion.description}
          onChange={e => onChange({ description: e.target.value })}
          placeholder="Criterion description e.g. Thesis & Argument"
          className="h-8 text-sm"
          disabled={readOnly}
        />
        <div className="flex items-center gap-1 shrink-0">
          <Input
            type="number"
            min={0}
            value={criterion.points}
            onChange={e => {
              const pts = parseInt(e.target.value) || 0
              onChange({ points: pts })
            }}
            className="h-8 w-16 text-sm text-right"
            disabled={readOnly}
          />
          <span className="text-xs text-muted-foreground">pts</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {criterion.ratings.map(rating => (
          <div key={rating.id} className="rounded-md border p-2 space-y-1">
            <Input
              value={rating.label}
              onChange={e => patchRating(rating.id, { label: e.target.value })}
              className="h-7 text-xs font-medium border-0 p-1 shadow-none focus-visible:ring-0"
              disabled={readOnly}
            />
            <Input
              value={rating.description}
              onChange={e => patchRating(rating.id, { description: e.target.value })}
              placeholder="Descriptor..."
              className="h-7 text-xs border-0 p-1 shadow-none focus-visible:ring-0"
              disabled={readOnly}
            />
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={0}
                max={criterion.points}
                value={rating.points}
                onChange={e => patchRating(rating.id, { points: parseInt(e.target.value) || 0 })}
                className="h-6 text-xs text-right"
                disabled={readOnly}
              />
              <span className="text-[11px] text-muted-foreground">pts</span>
            </div>
          </div>
        ))}
      </div>

      {!readOnly && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() =>
              onChange({
                ratings: [
                  ...criterion.ratings,
                  { id: nextId('rate'), label: 'New level', points: 0, description: '' },
                ],
              })
            }
          >
            <Plus className="size-3" />
            Level
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => onChange({ ratings: defaultRatings(criterion.points) })}
          >
            Reset levels
          </Button>
        </div>
      )}
    </div>
  )
}

// ── Assessment display / grading panel ───────────────────────────

type RubricGraderProps = {
  rubric: Rubric
  assessment: RubricAssessmentRating[]
  onChange: (assessment: RubricAssessmentRating[]) => void
  readOnly?: boolean
}

export function RubricGrader({ rubric, assessment, onChange, readOnly }: RubricGraderProps) {
  const total = assessment.reduce((sum, r) => sum + (r.points ?? 0), 0)

  const selectRating = (criterionId: string, rating: RubricRating | null) => {
    onChange(
      assessment.map(a =>
        a.criterionId === criterionId
          ? { ...a, ratingId: rating?.id ?? null, points: rating?.points ?? null }
          : a,
      ),
    )
  }

  const setComment = (criterionId: string, comments: string) => {
    onChange(assessment.map(a => (a.criterionId === criterionId ? { ...a, comments } : a)))
  }

  return (
    <div className="space-y-3">
      {rubric.criteria.map(criterion => {
        const current = assessment.find(a => a.criterionId === criterion.id)
        const selected = criterion.ratings.find(r => r.id === current?.ratingId)
        const level: MasteryLevel | null =
          current?.points !== null && current?.points !== undefined
            ? masteryLevelFor(current.points, criterion.points)
            : null

        return (
          <div key={criterion.id} className="rounded-lg border bg-card p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium">{criterion.description || 'Untitled criterion'}</p>
                <p className="text-xs text-muted-foreground">{criterion.points} points possible</p>
              </div>
              <Badge variant="outline" className="shrink-0">
                {current?.points ?? '—'} / {criterion.points}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {criterion.ratings
                .slice()
                .sort((a, b) => b.points - a.points)
                .map(rating => (
                  <button
                    key={rating.id}
                    disabled={readOnly}
                    onClick={() => selectRating(criterion.id, selected?.id === rating.id ? null : rating)}
                    title={`${rating.label} — ${rating.points} pts${rating.description ? `: ${rating.description}` : ''}`}
                    className={cn(
                      'flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors',
                      selected?.id === rating.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'hover:border-primary/40',
                      readOnly && 'cursor-default',
                    )}
                  >
                    <Star className={cn('size-3', selected?.id === rating.id && 'fill-current')} />
                    {rating.label} · {rating.points}
                  </button>
                ))}
            </div>

            {level && (
              <Badge className={cn('text-[11px]', masteryStyles[level])}>{level} mastery</Badge>
            )}

            <Textarea
              value={current?.comments ?? ''}
              onChange={e => setComment(criterion.id, e.target.value)}
              placeholder="Feedback for this criterion..."
              rows={2}
              className="text-sm min-h-[48px]"
              disabled={readOnly}
            />
          </div>
        )
      })}

      <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-3">
        <span className="text-sm font-medium">Total rubric score</span>
        <span className="text-sm font-bold">
          {total} / {rubric.pointsPossible}
        </span>
      </div>
    </div>
  )
}
