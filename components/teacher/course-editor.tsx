'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Upload,
  Trash2,
  Plus,
  FileText,
  Link2,
  HardDrive,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CourseModuleBuilder } from '@/components/dnd/course-module-builder'
import type { Module } from '@/components/dnd/course-module-builder'
import {
  createCourse,
  updateCourse,
  replaceCourseModules,
  replaceSyllabus,
  replaceGradeWeights,
  listModules,
  listSyllabus,
  listGradeWeights,
  listResources,
  uploadCourseResource,
  deleteResource,
  type ModuleInput,
} from '@/lib/api/courses'
import { getProgrammes, getTerms } from '@/lib/queries'
import { getDriveStatus, uploadToDrive, type DriveStatus } from '@/lib/drive-client'
import { useWorkspace } from '@/lib/workspace-context'

export type SyllabusItemUI = { week: number; topic: string; activities: string }
export type WeightRow = { category: string; weight: number }
export type ResourceRow = {
  id: string
  title: string
  type: string
  url: string
  size: string | null
}

type Props = {
  courseId?: string // present = edit mode
}

export function CourseEditor({ courseId }: Props) {
  const router = useRouter()
  const { userId, institutionId } = useWorkspace()
  const isEdit = Boolean(courseId)

  const [title, setTitle] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [termId, setTermId] = useState('')
  const [programmeId, setProgrammeId] = useState('none')
  const [maxStudents, setMaxStudents] = useState(30)
  const [color, setColor] = useState('blue')
  const [published, setPublished] = useState(!isEdit)

  const [terms, setTerms] = useState<Array<{ id: string; name: string; status: string }>>([])
  const [programmes, setProgrammes] = useState<Array<{ id: string; name: string }>>([])

  const [modules, setModules] = useState<Module[]>([])
  const [syllabus, setSyllabus] = useState<SyllabusItemUI[]>([
    { week: 1, topic: '', activities: '' },
  ])
  const [weights, setWeights] = useState<WeightRow[]>([])
  const [resources, setResources] = useState<ResourceRow[]>([])
  const [uploading, setUploading] = useState(false)
  const [drive, setDrive] = useState<DriveStatus | null>(null)
  const [uploadingDrive, setUploadingDrive] = useState(false)

  useEffect(() => {
    getDriveStatus().then(setDrive)
  }, [])

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [error, setError] = useState('')

  // ── Load reference data + existing course content ─────────────
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        if (!institutionId) throw new Error('Select an institution first')

        const [t, p] = await Promise.all([getTerms(institutionId), getProgrammes(institutionId)])
        if (cancelled) return
        setTerms(t as any)
        setProgrammes(p as any)
        if (!isEdit && t.length > 0) {
          const active = (t as any).find((x: any) => x.status === 'active') ?? t[0]
          setTermId(active.id)
        }

        if (courseId) {
          const [mods, syl, wts, res] = await Promise.all([
            listModules(courseId),
            listSyllabus(courseId),
            listGradeWeights(courseId),
            listResources(courseId),
          ])
          if (cancelled) return

          setModules(
            mods.map((m: any) => ({
              id: m.id,
              title: m.title,
              locked: m.locked ?? false,
              lessons: (m.course_lessons ?? [])
                .sort((a: any, b: any) => a.order_index - b.order_index)
                .map((l: any) => ({
                  id: l.id,
                  title: l.title,
                  type: l.type,
                  duration: l.duration ?? undefined,
                })),
            })),
          )
          setSyllabus(
            syl.length > 0
              ? syl.map((s: any) => ({
                  week: s.week,
                  topic: s.topic,
                  activities: (s.activities ?? []).join(', '),
                }))
              : [{ week: 1, topic: '', activities: '' }],
          )
          setWeights(wts.map((w: any) => ({ category: w.category, weight: w.weight })))
          setResources(res as any)
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, institutionId])

  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0)
  const weightTotal = weights.reduce((s, w) => s + w.weight, 0)
  const canSave = useMemo(() => title.trim() !== '' && code.trim() !== '' && termId !== '', [
    title,
    code,
    termId,
  ])

  // ── Save everything ───────────────────────────────────────────
  const handleSave = async () => {
    setError('')
    setSavedOk(false)
    if (!userId || !institutionId) return setError('Sign in and select an institution first.')
    if (!canSave) return setError('Title, code, and term are required.')
    if (weightTotal > 100) return setError(`Category weights total ${weightTotal}% — max is 100%.`)

    setSaving(true)
    let id = courseId!

    try {
      const payload = {
        institution_id: institutionId,
        term_id: termId,
        programme_id: programmeId === 'none' ? null : programmeId,
        teacher_id: userId,
        title: title.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim() || null,
        max_students: Math.max(1, maxStudents),
        color,
        status: published ? 'active' : 'upcoming',
      }

      if (isEdit) {
        await updateCourse(id, payload)
      } else {
        const created = await createCourse(payload as any)
        id = created.id
      }

      await replaceCourseModules(
        id,
        modules.map(
          (m): ModuleInput => ({
            title: m.title.trim() || 'Untitled module',
            locked: m.locked,
            lessons: m.lessons.map(l => ({
              title: l.title,
              type: l.type,
              duration: l.duration ?? null,
            })),
          }),
        ),
      )

      await replaceSyllabus(
        id,
        syllabus
          .filter(s => s.topic.trim() !== '')
          .map(s => ({
            week: Math.max(1, s.week),
            topic: s.topic.trim(),
            activities: s.activities
              .split(',')
              .map(a => a.trim())
              .filter(Boolean),
          })),
      )

      await replaceGradeWeights(id, weights.filter(w => w.category.trim() !== ''))

      setSavedOk(true)
      setTimeout(() => {
        if (!isEdit) router.push(`/teacher/courses/${id}/edit`)
        else setSavedOk(false)
      }, 700)
    } catch (e: any) {
      setError(e?.message ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  // ── Resource upload ───────────────────────────────────────────
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !courseId) return
    setUploading(true)
    setError('')
    try {
      for (const file of Array.from(files)) {
        const row = await uploadCourseResource(courseId!, file)
        setResources(prev => [row, ...prev])
      }
    } catch (e: any) {
      setError(e?.message ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDriveResource = async (files: FileList | null) => {
    if (!files || files.length === 0 || !courseId || !drive?.connected) return
    setUploadingDrive(true)
    setError('')
    try {
      for (const file of Array.from(files)) {
        const result = await uploadToDrive(file, {
          path: `Resources/${code.trim().toUpperCase() || 'GENERAL'}`,
          share: true,
        })
        const row = await createResource({
          course_id: courseId,
          title: file.name,
          type: 'document',
          url: result.webViewLink,
          size: null,
        })
        setResources(prev => [row, ...prev])
      }
    } catch (e: any) {
      setError(e?.message ?? 'Drive upload failed')
    } finally {
      setUploadingDrive(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="size-5 animate-spin mr-2" /> Loading editor…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Badge variant="outline">{modules.length} modules</Badge>
          <Badge variant="outline">{totalLessons} lessons</Badge>
          <Badge variant={published ? 'default' : 'secondary'}>
            {published ? 'Published' : 'Unlisted'}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={published} onCheckedChange={setPublished} />
            {published ? 'Visible to students' : 'Hidden'}
          </label>
          <Button onClick={handleSave} disabled={saving || !canSave} className="gap-1">
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : savedOk ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <Save className="size-4" />
            )}
            {saving ? 'Saving…' : savedOk ? 'Saved!' : isEdit ? 'Save Changes' : 'Create Course'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {error}
        </div>
      )}

      <Tabs defaultValue="details">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="content">Modules & Lessons</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="syllabus">Syllabus</TabsTrigger>
          <TabsTrigger value="weights">Grade Weights</TabsTrigger>
        </TabsList>

        {/* Details */}
        <TabsContent value="details">
          <Card>
            <CardContent className="space-y-4 pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="c-title">Course title *</Label>
                  <Input id="c-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Advanced Physics" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="c-code">Course code *</Label>
                  <Input id="c-code" value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. PHY301" className="uppercase" />
                </div>
                <div className="space-y-1">
                  <Label>Term *</Label>
                  <Select value={termId} onValueChange={setTermId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose term…" />
                    </SelectTrigger>
                    <SelectContent>
                      {terms.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Programme</Label>
                  <Select value={programmeId} onValueChange={setProgrammeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {programmes.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="c-max">Max students</Label>
                  <Input id="c-max" type="number" min={1} value={maxStudents} onChange={e => setMaxStudents(parseInt(e.target.value) || 30)} className="w-32" />
                </div>
                <div className="space-y-1">
                  <Label>Colour tag</Label>
                  <Select value={color} onValueChange={setColor}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['blue', 'green', 'purple', 'orange', 'red', 'pink'].map(c => (
                        <SelectItem key={c} value={c}>
                          <span className={`inline-block size-3 rounded-full mr-2 bg-${c}-500`} />
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="c-desc">Description</Label>
                <Textarea id="c-desc" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="What will students learn?" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modules */}
        <TabsContent value="content">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Curriculum builder</CardTitle>
              <p className="text-xs text-muted-foreground">Drag to reorder. Lessons save in order.</p>
            </CardHeader>
            <CardContent>
              <CourseModuleBuilder initialModules={modules} onChange={setModules} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources */}
        <TabsContent value="resources">
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Course files</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {isEdit
                    ? 'Upload to Zynvera storage or your own Google Drive.'
                    : 'Save the course once to enable uploads.'}
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  id="res-file"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={e => handleUpload(e.target.files)}
                  disabled={!isEdit || uploading}
                />
                <Button asChild variant="outline" size="sm" className="gap-1">
                  <label htmlFor="res-file" className={(!isEdit || uploading) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}>
                    {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                    To storage
                  </label>
                </Button>

                {drive?.connected && (
                  <>
                    <input
                      id="res-drive"
                      type="file"
                      multiple
                      className="hidden"
                      onChange={e => handleDriveResource(e.target.files)}
                      disabled={!isEdit || uploadingDrive}
                    />
                    <Button asChild variant="outline" size="sm" className="gap-1">
                      <label htmlFor="res-drive" className={(!isEdit || uploadingDrive) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}>
                        {uploadingDrive ? <Loader2 className="size-4 animate-spin" /> : <HardDrive className="size-4" />}
                        To my Drive
                      </label>
                    </Button>
                  </>
                )}
                {!drive?.connected && (
                  <Badge variant="outline" className="text-[10px] self-center">Drive not connected</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {resources.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No resources yet.</p>
              ) : (
                resources.map(r => (
                  <div key={r.id} className="flex items-center gap-3 rounded-md border p-2.5">
                    {r.url.includes('drive.google.com') ? (
                      <HardDrive className="size-4 shrink-0 text-amber-600" />
                    ) : (
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    <a href={r.url} target="_blank" rel="noreferrer" className="text-sm font-medium truncate flex-1 hover:underline">
                      {r.title}
                    </a>
                    {r.url.includes('drive.google.com') && (
                      <Badge variant="outline" className="text-[10px] shrink-0">Your Drive</Badge>
                    )}
                    <Badge variant="outline" className="text-[11px] capitalize">{r.type}</Badge>
                    {r.size && <span className="text-xs text-muted-foreground">{r.size}</span>}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={async () => {
                        await deleteResource(r.id)
                        setResources(prev => prev.filter(x => x.id !== r.id))
                      }}
                      aria-label={`Delete ${r.title}`}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Syllabus */}
        <TabsContent value="syllabus">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Weekly topics</CardTitle>
              <p className="text-xs text-muted-foreground">Comma-separate multiple activities.</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {syllabus.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={item.week}
                    onChange={e =>
                      setSyllabus(prev => prev.map((s, j) => (j === i ? { ...s, week: parseInt(e.target.value) || 1 } : s)))
                    }
                    className="w-20"
                    aria-label="Week number"
                  />
                  <Input
                    value={item.topic}
                    onChange={e => setSyllabus(prev => prev.map((s, j) => (j === i ? { ...s, topic: e.target.value } : s)))}
                    placeholder="Topic e.g. Projectile motion"
                    className="flex-1"
                  />
                  <Input
                    value={item.activities}
                    onChange={e => setSyllabus(prev => prev.map((s, j) => (j === i ? { ...s, activities: e.target.value } : s)))}
                    placeholder="Lab, reading, quiz…"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setSyllabus(prev => prev.filter((_, j) => j !== i))}
                    aria-label="Remove week"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() =>
                  setSyllabus(prev => [...prev, { week: prev.length + 1, topic: '', activities: '' }])
                }
              >
                <Plus className="size-3.5" /> Add week
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weights */}
        <TabsContent value="weights">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Grade categories</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Should total ~100% · currently{' '}
                    <span className={weightTotal === 100 ? 'text-green-600' : weightTotal > 100 ? 'text-red-600' : ''}>
                      {weightTotal}%
                    </span>
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {weights.map((w, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={w.category}
                    onChange={e => setWeights(prev => prev.map((x, j) => (j === i ? { ...x, category: e.target.value } : x)))}
                    placeholder="Category e.g. Homework"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={w.weight}
                    onChange={e => setWeights(prev => prev.map((x, j) => (j === i ? { ...x, weight: parseInt(e.target.value) || 0 } : x)))}
                    className="w-24 text-right"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setWeights(prev => prev.filter((_, j) => j !== i))}
                    aria-label="Remove category"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="gap-1" onClick={() => setWeights(prev => [...prev, { category: '', weight: 10 }])}>
                <Plus className="size-3.5" /> Add category
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
