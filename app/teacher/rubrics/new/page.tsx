'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { RubricEditor } from '@/components/rubric/rubric-editor'
import type { Rubric } from '@/lib/grading/rubric'
import { createRubricWithStructure } from '@/lib/api/rubrics'
import { getCoursesByTeacher } from '@/lib/api/courses'
import { useWorkspace } from '@/lib/workspace-context'

export default function NewRubricPage() {
  const router = useRouter()
  const { userId } = useWorkspace()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [courseId, setCourseId] = useState<string>('none')
  const [courses, setCourses] = useState<Array<{ id: string; title: string; code: string }>>([])
  const [rubric, setRubric] = useState<Rubric | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedOk, setSavedOk] = useState(false)

  useEffect(() => {
    if (!userId) return
    getCoursesByTeacher(userId)
      .then(cs =>
        setCourses(
          cs.map((c: any) => ({ id: c.id, title: c.title, code: c.code })),
        ),
      )
      .catch(() => setCourses([]))
  }, [userId])

  const handleSave = async () => {
    setError('')

    if (!userId) {
      setError('You must be signed in to save rubrics.')
      return
    }
    if (!title.trim()) {
      setError('Give the rubric a title first.')
      return
    }
    if (!rubric || rubric.criteria.length === 0) {
      setError('Add at least one criterion.')
      return
    }

    setSaving(true)
    try {
      await createRubricWithStructure({
        course_id: courseId === 'none' ? null : courseId,
        title: title.trim(),
        description: description.trim() || null,
        created_by: userId,
        criteria: rubric.criteria.map(c => ({
          description: c.description || 'Untitled criterion',
          long_description: c.longDescription ?? null,
          points: c.points,
          ratings: c.ratings.map(r => ({
            label: r.label,
            description: r.description ?? null,
            points: r.points,
          })),
        })),
      })
      setSavedOk(true)
      setTimeout(() => router.push('/teacher/rubrics'), 900)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save rubric')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/teacher/rubrics" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold">New Rubric</h1>
              <p className="text-sm text-muted-foreground">
                Define criteria and performance levels
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-1">
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : savedOk ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <Save className="size-4" />
            )}
            {saving ? 'Saving…' : savedOk ? 'Saved!' : 'Save Rubric'}
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="rub-title">Title</Label>
                <Input
                  id="rub-title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Written Work Rubric"
                />
              </div>
              <div className="space-y-1">
                <Label>Link to course (optional)</Label>
                <Select value={courseId} onValueChange={setCourseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Standalone rubric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Standalone rubric</SelectItem>
                    {courses.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.code} — {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="rub-desc">Description (optional)</Label>
              <Textarea
                id="rub-desc"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                placeholder="When should this rubric be used?"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Criteria & Levels</CardTitle>
            <p className="text-xs text-muted-foreground">
              Drag criteria to reorder. Each level sets a point value students can earn.
            </p>
          </CardHeader>
          <CardContent>
            <RubricEditor onChange={setRubric} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
