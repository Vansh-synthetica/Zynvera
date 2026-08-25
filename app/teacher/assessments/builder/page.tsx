'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Eye, Clock, Calendar, Settings } from 'lucide-react'
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

export default function AssessmentBuilderPage() {
  const [title, setTitle] = useState('')
  const [type, setType] = useState('quiz')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [duration, setDuration] = useState(30)
  const [maxScore, setMaxScore] = useState(100)
  const [maxAttempts, setMaxAttempts] = useState(1)
  const [questions, setQuestions] = useState<Question[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 1000))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
            <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
              <Save className="size-4 mr-1" />
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Draft'}
            </Button>
            <Button size="sm">
              <Eye className="size-4 mr-1" />
              Preview
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <Tabs defaultValue="details">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Assessment Details</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="size-4 mr-1" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assessment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. Midterm Exam"
                    />
                  </div>
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
                        <SelectItem value="practical">Practical</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="oral">Oral</SelectItem>
                        <SelectItem value="homework">Homework</SelectItem>
                      </SelectContent>
                    </Select>
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
                <div className="grid grid-cols-3 gap-4">
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
                  <div className="space-y-2">
                    <Label htmlFor="maxScore">Max Score</Label>
                    <Input
                      id="maxScore"
                      type="number"
                      min={1}
                      value={maxScore}
                      onChange={e => setMaxScore(parseInt(e.target.value) || 100)}
                    />
                  </div>
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

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assessment Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Shuffle Questions</p>
                    <p className="text-xs text-muted-foreground">Randomize question order for each student</p>
                  </div>
                  <input type="checkbox" className="size-4" />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Show Answers After Submission</p>
                    <p className="text-xs text-muted-foreground">Display correct answers when the assessment is graded</p>
                  </div>
                  <input type="checkbox" className="size-4" defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Time Limit Enforcement</p>
                    <p className="text-xs text-muted-foreground">Auto-submit when time runs out</p>
                  </div>
                  <input type="checkbox" className="size-4" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
