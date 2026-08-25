'use client'

import { useState } from 'react'
import { GripVertical, Plus, Trash2, Check, X as XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PragmaticSortableList } from './sortable-list'
import type { SortableItem } from './sortable-list'

type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'long_answer' | 'numeric'

type Option = SortableItem & {
  text: string
  isCorrect: boolean
}

type Question = SortableItem & {
  type: QuestionType
  text: string
  options: Option[]
  points: number
  correctAnswer?: string
}

type QuizQuestionBuilderProps = {
  initialQuestions?: Question[]
  onChange: (questions: Question[]) => void
  readOnly?: boolean
}

const questionTypeLabels: Record<QuestionType, string> = {
  multiple_choice: 'Multiple Choice',
  true_false: 'True / False',
  short_answer: 'Short Answer',
  long_answer: 'Long Answer',
  numeric: 'Numeric',
}

let questionCounter = 0
let optionCounter = 0

export function QuizQuestionBuilder({ initialQuestions = [], onChange, readOnly }: QuizQuestionBuilderProps) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions)
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())

  const updateQuestions = (newQuestions: Question[]) => {
    setQuestions(newQuestions)
    onChange(newQuestions)
  }

  const toggleQuestion = (id: string) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const addQuestion = (type: QuestionType = 'multiple_choice') => {
    const question: Question = {
      id: `q-${++questionCounter}-${Date.now()}`,
      type,
      text: '',
      options: type === 'multiple_choice'
        ? [
            { id: `opt-${++optionCounter}`, text: '', isCorrect: false },
            { id: `opt-${++optionCounter}`, text: '', isCorrect: false },
          ]
        : type === 'true_false'
        ? [
            { id: `opt-${++optionCounter}`, text: 'True', isCorrect: true },
            { id: `opt-${++optionCounter}`, text: 'False', isCorrect: false },
          ]
        : [],
      points: 1,
    }
    updateQuestions([...questions, question])
    setExpandedQuestions(prev => new Set(prev).add(question.id))
  }

  const removeQuestion = (id: string) => {
    updateQuestions(questions.filter(q => q.id !== id))
  }

  const updateQuestion = (id: string, patch: Partial<Question>) => {
    updateQuestions(questions.map(q => q.id === id ? { ...q, ...patch } : q))
  }

  const addOption = (questionId: string) => {
    const q = questions.find(q => q.id === questionId)
    if (!q) return
    const option: Option = {
      id: `opt-${++optionCounter}-${Date.now()}`,
      text: '',
      isCorrect: false,
    }
    updateQuestion(questionId, { options: [...q.options, option] })
  }

  const removeOption = (questionId: string, optionId: string) => {
    const q = questions.find(q => q.id === questionId)
    if (!q) return
    updateQuestion(questionId, { options: q.options.filter(o => o.id !== optionId) })
  }

  const updateOption = (questionId: string, optionId: string, patch: Partial<Option>) => {
    const q = questions.find(q => q.id === questionId)
    if (!q) return
    updateQuestion(questionId, {
      options: q.options.map(o => o.id === optionId ? { ...o, ...patch } : o),
    })
  }

  const setCorrectOption = (questionId: string, optionId: string) => {
    const q = questions.find(q => q.id === questionId)
    if (!q) return
    updateQuestion(questionId, {
      options: q.options.map(o => ({ ...o, isCorrect: o.id === optionId })),
    })
  }

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Questions</h3>
          <Badge variant="outline">{questions.length}</Badge>
        </div>
        <Badge>{totalPoints} points</Badge>
      </div>

      {questions.map((question, qIndex) => {
        const isExpanded = expandedQuestions.has(question.id)
        const correctCount = question.options.filter(o => o.isCorrect).length

        return (
          <Card key={question.id} className="border-border/50">
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                {!readOnly && (
                  <button className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none mt-1">
                    <GripVertical className="size-4" />
                  </button>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => toggleQuestion(question.id)}
                      className="text-sm font-medium text-left flex-1"
                    >
                      <span className="text-muted-foreground mr-1">Q{qIndex + 1}.</span>
                      {question.text || <span className="text-muted-foreground italic">Untitled question</span>}
                    </button>
                    <Badge variant="outline" className="text-xs">
                      {questionTypeLabels[question.type]}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {question.points}pt{question.points !== 1 ? 's' : ''}
                    </Badge>
                    {question.type === 'multiple_choice' && (
                      <Badge variant={correctCount === 1 ? 'default' : 'destructive'} className="text-xs">
                        {correctCount}/{question.options.length}
                      </Badge>
                    )}
                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(question.id)}
                        className="h-6 p-1 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="space-y-3 mt-3 pl-6">
                      {!readOnly ? (
                        <Textarea
                          value={question.text}
                          onChange={e => updateQuestion(question.id, { text: e.target.value })}
                          placeholder="Enter your question..."
                          className="text-sm min-h-[60px]"
                        />
                      ) : (
                        <p className="text-sm">{question.text}</p>
                      )}

                      {!readOnly && (
                        <div className="flex gap-2">
                          <div className="flex items-center gap-1">
                            <Label className="text-xs">Points:</Label>
                            <Input
                              type="number"
                              min={1}
                              value={question.points}
                              onChange={e => updateQuestion(question.id, { points: parseInt(e.target.value) || 1 })}
                              className="h-7 w-16 text-xs"
                            />
                          </div>
                        </div>
                      )}

                      {(question.type === 'multiple_choice' || question.type === 'true_false') && (
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Options</Label>
                          <PragmaticSortableList
                            items={question.options}
                            onReorder={(newOptions) => updateQuestion(question.id, { options: newOptions as Option[] })}
                            onRemove={readOnly || question.options.length <= 2 ? undefined : (id) => removeOption(question.id, id)}
                            renderItem={(option) => (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => !readOnly && setCorrectOption(question.id, option.id)}
                                  className={`size-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                    option.isCorrect
                                      ? 'bg-green-500 border-green-500 text-white'
                                      : 'border-muted-foreground/30 hover:border-green-500/50'
                                  }`}
                                >
                                  {option.isCorrect && <Check className="size-3" />}
                                </button>
                                {!readOnly && question.type !== 'true_false' ? (
                                  <Input
                                    value={option.text}
                                    onChange={e => updateOption(question.id, option.id, { text: e.target.value })}
                                    placeholder="Option text..."
                                    className="h-7 text-sm border-0 p-0 focus-visible:ring-0 shadow-none"
                                  />
                                ) : (
                                  <span className="text-sm">{option.text}</span>
                                )}
                              </div>
                            )}
                          />
                          {!readOnly && question.type === 'multiple_choice' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addOption(question.id)}
                              className="h-7 text-xs gap-1"
                            >
                              <Plus className="size-3" />
                              Add Option
                            </Button>
                          )}
                        </div>
                      )}

                      {question.type === 'short_answer' && (
                        <Input
                          disabled
                          placeholder="Student answer will appear here..."
                          className="h-8 text-sm bg-muted"
                        />
                      )}

                      {question.type === 'long_answer' && (
                        <Textarea
                          disabled
                          placeholder="Student answer will appear here..."
                          className="text-sm min-h-[80px] bg-muted"
                        />
                      )}

                      {question.type === 'numeric' && (
                        <Input
                          disabled
                          type="number"
                          placeholder="Numeric answer..."
                          className="h-8 text-sm bg-muted"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {!readOnly && (
        <div className="flex flex-wrap gap-2">
          {(Object.keys(questionTypeLabels) as QuestionType[]).map(type => (
            <Button
              key={type}
              variant="outline"
              size="sm"
              onClick={() => addQuestion(type)}
              className="gap-1"
            >
              <Plus className="size-3" />
              {questionTypeLabels[type]}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

export type { Question, Option, QuestionType }
