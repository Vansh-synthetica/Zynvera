'use client'

import { useEffect, useState } from 'react'
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Save,
  Wand2,
  Clock,
  UserRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { gradeSubmission } from '@/lib/api/assignments'

export type GradeSubmission = {
  id: string
  user_id: string
  name: string
  status: string
  score: number | null
  feedback: string | null
  submitted_at: string | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignmentTitle: string
  maxScore: number
  submissions: GradeSubmission[]
  loading: boolean
  teacherId: string | null
}

/**
 * Grading workspace for one assignment.
 * - Per-row score + feedback with dirty tracking
 * - Bulk fill empty scores, then "Save All" persists every change
 */
export function GradingDialog({
  open,
  onOpenChange,
  assignmentTitle,
  maxScore,
  submissions,
  loading,
  teacherId,
}: Props) {
  const [scores, setScores] = useState<Record<string, number | null>>({})
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({})
  const [dirty, setDirty] = useState<Set<string>>(new Set())
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [bulkScore, setBulkScore] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedMsg, setSavedMsg] = useState('')

  useEffect(() => {
    if (!open) return
    const seedScores: Record<string, number | null> = {}
    const seedFeedback: Record<string, string> = {}
    submissions.forEach(s => {
      seedScores[s.user_id] = s.score
      seedFeedback[s.user_id] = s.feedback ?? ''
    })
    setScores(seedScores)
    setFeedbacks(seedFeedback)
    setDirty(new Set())
    setSaved(new Set())
    setBulkScore('')
    setError('')
    setSavedMsg('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, submissions])

  const markScore = (userId: string, value: number | null) => {
    setScores(prev => ({ ...prev, [userId]: value }))
    setDirty(prev => new Set(prev).add(userId))
    setSavedMsg('')
  }

  const markFeedback = (userId: string, text: string) => {
    setFeedbacks(prev => ({ ...prev, [userId]: text }))
    setDirty(prev => new Set(prev).add(userId))
    setSavedMsg('')
  }

  const fillEmptyWithBulk = () => {
    const n = parseInt(bulkScore)
    if (Number.isNaN(n)) return
    let changed = 0
    const next = { ...scores }
    submissions.forEach(s => {
      if (scores[s.user_id] === null || scores[s.user_id] === undefined) {
        next[s.user_id] = Math.max(0, Math.min(n, maxScore))
        changed++
      }
    })
    if (changed > 0) {
      setScores(next)
      setDirty(new Set([...dirty, ...submissions.map(s => s.user_id)]))
    }
  }

  const saveAll = async () => {
    setError('')
    if (!teacherId) {
      setError('Sign in required.')
      return
    }

    const rows = submissions.filter(s => dirty.has(s.user_id))
    if (rows.length === 0) {
      setSavedMsg('Nothing to save.')
      return
    }

    setSaving(true)
    let failures = 0
    const okIds = new Set<string>()

    // Sequential saves keep failure reporting simple and respect RLS.
    for (const row of rows) {
      const score = scores[row.user_id]
      try {
        await gradeSubmission(
          row.id,
          score ?? 0,
          feedbacks[row.user_id] ?? '',
          teacherId,
        )
        okIds.add(row.user_id)
      } catch {
        failures++
      }
    }

    setSaving(false)
    setSaved(prev => new Set([...prev, ...okIds]))
    setDirty(prev => {
      const next = new Set(prev)
      okIds.forEach(id => next.delete(id))
      return next
    })

    if (failures === 0) {
      setSavedMsg(`Saved ${okIds.size} grade${okIds.size === 1 ? '' : 's'}.`)
    } else {
      setError(`Saved ${okIds.size}, failed ${failures}. Check permissions and retry.`)
    }
  }

  const pendingCount = dirty.size

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Grade — {assignmentTitle}</DialogTitle>
          <DialogDescription>
            Enter scores out of {maxScore}. Use bulk fill then adjust individually.
          </DialogDescription>
        </DialogHeader>

        {/* Bulk toolbar */}
        <div className="flex flex-wrap items-end gap-2 rounded-md border bg-muted/30 p-3">
          <div className="space-y-1">
            <Label htmlFor="bulk-score">Fill all empty with</Label>
            <Input
              id="bulk-score"
              type="number"
              min={0}
              max={maxScore}
              value={bulkScore}
              onChange={e => setBulkScore(e.target.value)}
              placeholder={`e.g. ${Math.round(maxScore * 0.8)}`}
              className="w-28"
            />
          </div>
          <Button variant="outline" size="sm" onClick={fillEmptyWithBulk} className="gap-1 mb-[2px]">
            <Wand2 className="size-3.5" />
            Fill empty
          </Button>
          <span className="text-xs text-muted-foreground ml-auto mb-1">
            {pendingCount > 0 ? `${pendingCount} unsaved` : 'All saved'}
          </span>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-2.5 text-xs text-destructive">
            <AlertCircle className="size-3.5 shrink-0" />
            {error}
          </div>
        )}
        {!error && savedMsg && (
          <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-2.5 text-xs text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-400">
            <CheckCircle2 className="size-3.5 shrink-0" />
            {savedMsg}
          </div>
        )}

        {/* Rows */}
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="size-4 animate-spin mr-2" /> Loading submissions…
          </div>
        ) : submissions.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No students are enrolled in this course yet.
          </p>
        ) : (
          <div className="space-y-3">
            {submissions.map(row => (
              <GradeRow
                key={row.id}
                row={row}
                maxScore={maxScore}
                score={scores[row.user_id]}
                feedback={feedbacks[row.user_id] ?? ''}
                isDirty={dirty.has(row.user_id)}
                isSaved={saved.has(row.user_id)}
                onScore={v => markScore(row.user_id, v)}
                onFeedback={t => markFeedback(row.user_id, t)}
              />
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Close
          </Button>
          <Button onClick={saveAll} disabled={saving || pendingCount === 0 || !teacherId} className="gap-1">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save All{pendingCount > 0 ? ` (${pendingCount})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function GradeRow({
  row,
  maxScore,
  score,
  feedback,
  isDirty,
  isSaved,
  onScore,
  onFeedback,
}: {
  row: GradeSubmission
  maxScore: number
  score: number | null
  feedback: string
  isDirty: boolean
  isSaved: boolean
  onScore: (v: number | null) => void
  onFeedback: (t: string) => void
}) {
  const pct =
    score !== null && score !== undefined && maxScore > 0
      ? Math.round((score / maxScore) * 100)
      : null

  return (
    <div
      className={`rounded-lg border p-3 space-y-2 ${
        isDirty ? 'border-primary/50 bg-primary/5' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <UserRound className="size-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium flex-1 truncate">{row.name}</span>

        {isSaved && (
          <Badge variant="outline" className="gap-1 text-green-600 border-green-300">
            <CheckCircle2 className="size-3" /> Saved
          </Badge>
        )}
        {isDirty && !isSaved && <Badge className="bg-primary/15 text-primary">Unsaved</Badge>}

        <StatusChip status={row.status} submittedAt={row.submitted_at} />

        <Input
          type="number"
          min={0}
          max={maxScore}
          value={score ?? ''}
          onChange={e => onScore(e.target.value === '' ? null : Number(e.target.value))}
          placeholder="—"
          className="w-20 h-8 text-right"
          aria-label={`Score for ${row.name}`}
        />
        <span className="text-xs text-muted-foreground w-12">
          {pct !== null ? `${pct}%` : `/ ${maxScore}`}
        </span>
      </div>

      <Textarea
        rows={1}
        value={feedback}
        onChange={e => onFeedback(e.target.value)}
        placeholder="Feedback…"
        className="min-h-[36px] text-xs"
        aria-label={`Feedback for ${row.name}`}
      />
    </div>
  )
}

function StatusChip({ status, submittedAt }: { status: string; submittedAt: string | null }) {
  if (status === 'late') {
    return (
      <Badge className="gap-1 bg-amber-100 text-amber-700 text-[11px]">
        <Clock className="size-3" /> Late
      </Badge>
    )
  }
  if (submittedAt) {
    return (
      <Badge className="bg-green-100 text-green-700 text-[11px]">Submitted</Badge>
    )
  }
  return <Badge variant="outline" className="text-[11px]">Not submitted</Badge>
}
