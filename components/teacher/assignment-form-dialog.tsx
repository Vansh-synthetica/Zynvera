'use client'

import { useEffect, useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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

export type CourseOption = { id: string; title: string; code: string }

export type AssignmentFormState = {
  id?: string
  course_id: string
  title: string
  description: string
  instructions: string
  due_date: string
  max_score: number
  submission_type: string
  late_policy: string
  publish: boolean
}

export const EMPTY_ASSIGNMENT_FORM: AssignmentFormState = {
  course_id: '',
  title: '',
  description: '',
  instructions: '',
  due_date: '',
  max_score: 100,
  submission_type: 'file',
  late_policy: 'none',
  publish: false,
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  courses: CourseOption[]
  initial: AssignmentFormState
  saving: boolean
  error: string
  onSave: (form: AssignmentFormState) => void
}

export function AssignmentFormDialog({
  open,
  onOpenChange,
  courses,
  initial,
  saving,
  error,
  onSave,
}: Props) {
  const [form, setForm] = useState<AssignmentFormState>(initial)
  const isEdit = Boolean(initial.id)

  useEffect(() => {
    if (open) setForm(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const patch = (p: Partial<AssignmentFormState>) => setForm(prev => ({ ...prev, ...p }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Assignment' : 'New Assignment'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update details — students see changes immediately.'
              : 'Draft assignments stay hidden until you publish them.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {error && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-2.5 text-xs text-destructive">
              <AlertCircle className="size-3.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-1">
            <Label>Course</Label>
            <Select
              value={form.course_id}
              onValueChange={v => patch({ course_id: v })}
              disabled={isEdit}
            >
              <SelectTrigger>
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
            {isEdit && (
              <p className="text-[11px] text-muted-foreground">Course can&apos;t change after creation.</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="asg-title">Title</Label>
            <Input
              id="asg-title"
              value={form.title}
              onChange={e => patch({ title: e.target.value })}
              placeholder="e.g. Problem Set 2: Momentum"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="asg-desc">Short description</Label>
            <Textarea
              id="asg-desc"
              rows={2}
              value={form.description}
              onChange={e => patch({ description: e.target.value })}
              placeholder="One-line summary students see in lists."
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="asg-instr">Instructions</Label>
            <Textarea
              id="asg-instr"
              rows={4}
              value={form.instructions}
              onChange={e => patch({ instructions: e.target.value })}
              placeholder="Full instructions, resources, expectations…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="asg-due">Due date</Label>
              <Input
                id="asg-due"
                type="datetime-local"
                value={form.due_date}
                onChange={e => patch({ due_date: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="asg-max">Max score</Label>
              <Input
                id="asg-max"
                type="number"
                min={1}
                value={form.max_score}
                onChange={e => patch({ max_score: parseInt(e.target.value) || 100 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Submission type</Label>
              <Select value={form.submission_type} onValueChange={v => patch({ submission_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="file">File upload</SelectItem>
                  <SelectItem value="text">Text entry</SelectItem>
                  <SelectItem value="link">External link</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Late policy</Label>
              <Select value={form.late_policy} onValueChange={v => patch({ late_policy: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No penalty</SelectItem>
                  <SelectItem value="10">−10%</SelectItem>
                  <SelectItem value="25">−25%</SelectItem>
                  <SelectItem value="50">−50%</SelectItem>
                  <SelectItem value="zero">No credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Publish immediately</p>
              <p className="text-xs text-muted-foreground">
                {form.publish ? 'Visible to enrolled students.' : 'Saved as a draft.'}
              </p>
            </div>
            <Switch checked={form.publish} onCheckedChange={v => patch({ publish: v })} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => onSave(form)} disabled={saving} className="gap-1">
            {saving && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Assignment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
