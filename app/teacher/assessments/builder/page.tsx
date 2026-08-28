'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Eye, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { QuizQuestionBuilder } from '@/components/dnd/quiz-question-builder'
import type { Question } from '@/components/dnd/quiz-question-builder'
import { getCoursesByTeacher } from '@/lib/api/courses'
import { createAssessment, bulkCreateQuestions } from '@/lib/api/assessments'
import { useWorkspace } from '@/lib/workspace-context'

export default function AssessmentBuilderPage() {
  const router = useRouter()
  const { userId } = useWorkspace()
  const [title, setTitle] = useState('')
  const [type, setType] = useState('quiz')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [duration, setDuration] = useState(30)
  const [maxScore, setMaxScore] = useState(100)
  const [maxAttempts, setMaxAttempts] = useState(1)
  const [questions, setQuestions] = useState<Question[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [courseId, setCourseId] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId) return
    getCoursesByTeacher(userId)
      .then(cs => setCourses(cs as any[]))
      .catch(() => setCourses([]))
  }, [userId])

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)

  const handleSave = async (publish: boolean) => {
    setError('')
    if (!courseId) { setError('Select a course for this assessment.'); return }
    if (!title.trim()) { setError('Give the assessment a title.'); return }
    if (!questions.length) { setError('Add at least one question.'); return }

    setSaving(true)
    try {
      const created = await createAssessment({
        course_id: courseId,
        title: title.trim(),
        type,
        description: description.trim() || null,
        instructions: instructions.trim() || null,
        duration,
        max_score: totalPoints || maxScore,
        max_attempts: maxAttempts,
        status: publish ? 'active' : 'draft',
      } as any)

      await bulkCreateQuestions(
        questions.map((q, i) => {
          const correctOption = (q.options ?? []).find((o: any) => o.isCorrect)
          return {
            assessment_id: (created as any).id,
            type: q.type,
            text: q.text,
            options: (q.options ?? []).map((o: any) => ({ text: o.text })),
            correct_answer:
              correctOption?.text ??
              (q.correctAnswer != null && String(q.correctAnswer).length ? String(q.correctAnswer) : null),
            points: q.points,
            order_index: i,
          }
        }) as any,
      )

      router.push('/teacher/assessments')
    } catch (e: any) {
      setError(e?.message ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/teacher/assessments" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold">Assessment Builder</h1>
              <p className="text-sm text-muted-foreground">
                Create quizzes, exams, and assessments with drag-and-drop
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{questions.length} questions</Badge>
            <Badge variant="outline">{totalPoints} points</Badge>
            <Button variant="outline" size="sm" onClick={() => handleSave(false)} disabled={saving}>
              <Save className="size-4 mr-1" />
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button size="sm" onClick={() => handleSave(true)} disabled={saving}>
              <Eye className="size-4 mr-1" />
              {saving ? 'Publishing...' : 'Publish'}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6">
        {error && (
          <div className="mb-4 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <Tabs defaultValue="details">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Assessment Details</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assessment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Course</Label>
                    <Select value={courseId} onValueChange={setCourseId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.code ? `${c.code} — ` : ''}{c.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. Midterm Exam"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="test">Test</SelectItem>
                        <SelectItem value="exam">Exam</SelectItem>
                        <SelectItem value="homework">Homework</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="flex items-center gap-1">
                      <Clock className="size-3" />
                      Duration (minutes)
                    </Label>
                    <Input
                      id="duration"
                      type="number"
                      min={1}
                      value={duration}
                      onChange={e => setDuration(parseInt(e.target.value) || 30)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Brief description of this assessment..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instructions">Student Instructions</Label>
                  <Textarea
                    id="instructions"
                    value={instructions}
                    onChange={e => setInstructions(e.target.value)}
                    placeholder="Instructions students will see before starting..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxAttempts">Max Attempts</Label>
                    <Input
                      id="maxAttempts"
                      type="number"
                      min={1}
                      value={maxAttempts}
                      onChange={e => setMaxAttempts(parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Total score is calculated automatically from question points ({totalPoints} pts).
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assessment Questions</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Drag questions to reorder. Click to expand and edit. Select correct answers by clicking the circle.
                </p>
              </CardHeader>
              <CardContent>
                <QuizQuestionBuilder
                  initialQuestions={questions}
                  onChange={setQuestions}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
