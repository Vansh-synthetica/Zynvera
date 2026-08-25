'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Trash2, FileCheck2, Loader2, AlertCircle } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  listRubrics,
  deleteRubric,
} from '@/lib/api/rubrics'
import { getCoursesByTeacher } from '@/lib/api/courses'
import { useWorkspace } from '@/lib/workspace-context'

type RubricRow = {
  id: string
  title: string
  description: string | null
  points_possible: number
  course_id: string | null
  created_at: string
  rubric_criteria: Array<{
    id: string
    description: string
    rubric_ratings: Array<{ id: string }>
  }>
}

export default function RubricsPage() {
  const { userId } = useWorkspace()
  const [rubrics, setRubrics] = useState<RubricRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError('')

        // Load rubrics across the teacher's courses.
        const courses = userId ? await getCoursesByTeacher(userId) : []
        const results = await Promise.all(
          courses.map(c => listRubrics(c.id).catch(() => [])),
        )
        const all = results.flat() as RubricRow[]

        if (!cancelled) setRubrics(all)
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load rubrics')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [userId])

  const handleDelete = async (id: string) => {
    try {
      await deleteRubric(id)
      setRubrics(prev => prev.filter(r => r.id !== id))
    } catch (e: any) {
      setError(e?.message ?? 'Delete failed')
    }
  }

  const filtered = rubrics.filter(
    r =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.description ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Rubrics</h1>
            <p className="text-sm text-muted-foreground">
              Reusable grading criteria for assignments and assessments
            </p>
          </div>
          <Button asChild className="gap-1">
            <Link href="/teacher/rubrics/new">
              <Plus className="size-4" />
              New Rubric
            </Link>
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search rubrics..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge variant="outline">{filtered.length}</Badge>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin mr-2" />
            Loading rubrics...
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center space-y-3">
              <FileCheck2 className="size-8 mx-auto text-muted-foreground" />
              <p className="font-medium">No rubrics yet</p>
              <p className="text-sm text-muted-foreground">
                Create your first rubric to grade consistently with criteria and performance levels.
              </p>
              <Button asChild variant="outline" className="gap-1">
                <Link href="/teacher/rubrics/new">
                  <Plus className="size-4" />
                  Create Rubric
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map(rubric => (
              <Card key={rubric.id} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold truncate">{rubric.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {rubric.description || 'No description'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(rubric.id)}
                      className="size-7 p-0 shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label={`Delete ${rubric.title}`}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary">{rubric.points_possible} pts</Badge>
                    <Badge variant="outline">
                      {rubric.rubric_criteria?.length ?? 0} criteria
                    </Badge>
                    {rubric.course_id && <Badge variant="outline">Course-linked</Badge>}
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      {new Date(rubric.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {rubric.rubric_criteria?.length > 0 && (
                    <ul className="mt-3 space-y-1 border-t pt-2">
                      {rubric.rubric_criteria.slice(0, 3).map(criterion => (
                        <li key={criterion.id} className="flex items-center justify-between text-xs">
                          <span className="truncate text-muted-foreground">{criterion.description}</span>
                          <span className="shrink-0 ml-2 font-medium">{criterion.points} pts</span>
                        </li>
                      ))}
                      {rubric.rubric_criteria.length > 3 && (
                        <li className="text-[11px] text-muted-foreground">
                          +{rubric.rubric_criteria.length - 3} more…
                        </li>
                      )}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
