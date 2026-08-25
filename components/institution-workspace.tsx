"use client"

import { useEffect, useMemo, useState } from 'react'
import { Activity, ArrowRight, BookOpen, Building2, Check, ChevronDown, ClipboardCheck, GraduationCap, LayoutDashboard, LogOut, Plus, ShieldCheck, Users, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { approvedInstitutions, demoCourses, demoMetrics, formatRole, getInstitution, getWorkspace, roleDescriptions, type DemoRole, type DemoWorkspace, saveWorkspace } from '@/lib/demo-workspace'

const roleOptions: DemoRole[] = ['student', 'teacher', 'principal', 'admin']

export function InstitutionGate({ children }: { children: React.ReactNode }) {
  const [workspace, setWorkspace] = useState<DemoWorkspace | null>(null)
  const [name, setName] = useState('Alex Morgan')
  const [institutionId, setInstitutionId] = useState('riverside')
  const [role, setRole] = useState<DemoRole>('student')
  const [query, setQuery] = useState('')

  useEffect(() => {
    setWorkspace(getWorkspace())
    const sync = () => setWorkspace(getWorkspace())
    window.addEventListener('zynvera-workspace-change', sync)
    return () => window.removeEventListener('zynvera-workspace-change', sync)
  }, [])

  if (workspace) return <>{children}</>

  const matches = approvedInstitutions.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()) || item.city.toLowerCase().includes(query.toLowerCase()))
  return <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-8">
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div className="flex items-center justify-between"><div><Badge variant="outline" className="mb-3 gap-2"><ShieldCheck className="size-3" /> Accepted institutions only</Badge><h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">Your institution, one shared workspace.</h1><p className="mt-4 max-w-xl text-muted-foreground leading-6">Choose an approved school or university and your role. Everyone signs into the same institution space, so attendance, classes, and outcomes stay aligned.</p></div><div className="hidden rounded-2xl border bg-card p-5 sm:block"><Building2 className="size-9 text-primary" /><p className="mt-8 max-w-32 text-sm font-medium">Built for schools that put learning first.</p></div></div>
      <Card className="border-primary/20 shadow-lg"><CardHeader><CardTitle>Set up your demo workspace</CardTitle><CardDescription>This frontend workspace is ready to swap for Supabase or your API later.</CardDescription></CardHeader><CardContent className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="flex flex-col gap-4"><label className="text-sm font-medium">Your name<Input value={name} onChange={(e) => setName(e.target.value)} className="mt-2" /></label><div><p className="mb-2 text-sm font-medium">Your role</p><div className="grid grid-cols-2 gap-2">{roleOptions.map((item) => <button key={item} onClick={() => setRole(item)} className={`rounded-xl border p-3 text-left transition ${role === item ? 'border-primary bg-primary/10' : 'hover:bg-muted'}`}><span className="block text-sm font-medium">{formatRole(item)}</span><span className="mt-1 block text-xs text-muted-foreground">{roleDescriptions[item]}</span></button>)}</div></div></div>
        <div><div className="flex items-center justify-between"><div><p className="text-sm font-medium">Select your institution</p><p className="text-xs text-muted-foreground">Verified partners are marked accepted.</p></div><Badge variant="secondary">{matches.length} available</Badge></div><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search schools and universities" className="mt-3" /><div className="mt-3 flex max-h-56 flex-col gap-2 overflow-auto">{matches.map((item) => <button key={item.id} onClick={() => setInstitutionId(item.id)} className={`flex items-center justify-between rounded-xl border p-3 text-left ${institutionId === item.id ? 'border-primary bg-primary/10' : 'hover:bg-muted'}`}><span><span className="block font-medium">{item.name}</span><span className="text-xs text-muted-foreground">{item.type} · {item.city} · {item.students.toLocaleString()} learners</span></span><span className="flex items-center gap-2 text-xs text-primary"><Check className={institutionId === item.id ? 'size-4' : 'invisible size-4'} />Accepted</span></button>)}</div><Button className="mt-4 w-full" onClick={() => saveWorkspace({ institutionId, role, userName: name || 'Demo member', joinedAt: new Date().toISOString() })}>Enter shared workspace <ArrowRight data-icon="inline-end" /></Button></div>
      </CardContent></Card>
      <p className="text-center text-xs text-muted-foreground">Zynvera is a LocalHouseLLM property. Institutional approval is required before a campus can join the programme.</p>
    </div>
  </main>
}

export function WorkspaceShell({ children, title, description }: { children: React.ReactNode; title: string; description: string }) {
  const [workspace, setWorkspace] = useState<DemoWorkspace | null>(null)
  const [open, setOpen] = useState(false)
  useEffect(() => { setWorkspace(getWorkspace()) }, [])
  if (!workspace) return <InstitutionGate>{children}</InstitutionGate>
  const institution = getInstitution(workspace.institutionId)
  return <div className="min-h-screen bg-muted/30 text-foreground"><header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-8"><div className="flex min-w-0 items-center gap-3"><div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><LayoutDashboard className="size-4" /></div><div className="min-w-0"><p className="truncate text-sm font-semibold">{institution.name}</p><p className="truncate text-xs text-muted-foreground">{formatRole(workspace.role)} workspace</p></div></div><div className="relative"><Button variant="outline" size="sm" onClick={() => setOpen(!open)}>{workspace.userName}<ChevronDown data-icon="inline-end" /></Button>{open && <div className="absolute right-0 top-11 z-30 w-56 rounded-xl border bg-popover p-2 shadow-xl"><p className="px-3 py-2 text-xs text-muted-foreground">Switch demo workspace</p>{roleOptions.map((item) => <button key={item} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => { saveWorkspace({ ...workspace, role: item }); setOpen(false) }}>{formatRole(item)}{workspace.role === item && <Check className="size-4 text-primary" />}</button>)}<button className="mt-1 flex w-full items-center gap-2 rounded-lg border-t px-3 py-2 pt-3 text-left text-sm text-destructive" onClick={() => { localStorage.removeItem('zynvera-demo-workspace'); window.location.reload() }}><LogOut className="size-4" />Reset workspace</button></div>}</div></div></header><main className="mx-auto max-w-7xl px-4 py-8 sm:px-8"><div className="mb-8"><Badge variant="outline" className="mb-3 gap-2"><ShieldCheck className="size-3" /> Accepted partner institution</Badge><h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">{title}</h1><p className="mt-2 max-w-2xl text-muted-foreground leading-6">{description}</p></div>{children}</main></div>
}

export function StudentWorkspace() {
  const [completed, setCompleted] = useState<string[]>([])
  const workspace = getWorkspace()
  const institution = getInstitution(workspace?.institutionId ?? 'riverside')
  const metrics = demoMetrics[institution.id as keyof typeof demoMetrics] ?? demoMetrics.riverside
  const completion = Math.round(demoCourses.reduce((sum, course) => sum + (completed.includes(course.id) ? 100 : course.progress), 0) / demoCourses.length)
  return <WorkspaceShell title="Keep your learning moving." description="One calm place for courses, progress, attendance, and support."><div className="grid gap-4 sm:grid-cols-3"><Metric icon={Activity} label="Attendance" value={`${metrics.attendance}%`} detail="This term" /><Metric icon={GraduationCap} label="Average grade" value={`${metrics.average}%`} detail="Across active courses" /><Metric icon={BookOpen} label="Course progress" value={`${completion}%`} detail="Updated just now" /></div><section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]"><Card><CardHeader><CardTitle>My courses</CardTitle><CardDescription>Continue where you left off. Completing a module updates this workspace immediately.</CardDescription></CardHeader><CardContent className="flex flex-col gap-4">{demoCourses.map((course) => <div key={course.id} className="rounded-2xl border p-4"><div className="flex items-start justify-between gap-4"><div><Badge variant="secondary">{course.color === 'coral' ? 'In progress' : 'Core course'}</Badge><h3 className="mt-2 font-medium">{course.title}</h3><p className="text-sm text-muted-foreground">{course.teacher} · Next: {course.next}</p></div><span className="text-sm font-semibold">{completed.includes(course.id) ? 100 : course.progress}%</span></div><Progress value={completed.includes(course.id) ? 100 : course.progress} className="mt-4" /><Button variant="outline" size="sm" className="mt-4" onClick={() => setCompleted((current) => current.includes(course.id) ? current.filter((id) => id !== course.id) : [...current, course.id])}>{completed.includes(course.id) ? 'Mark as active' : 'Complete next module'} <Check data-icon="inline-end" /></Button></div>)}</CardContent></Card><Card><CardHeader><CardTitle>Today</CardTitle><CardDescription>Your next moments</CardDescription></CardHeader><CardContent className="flex flex-col gap-3">{['09:00 · Mathematics seminar','11:30 · Physics lab','15:00 · Study group'].map((item) => <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-3 text-sm" key={item}><ClipboardCheck className="size-4 text-primary" />{item}</div>)}<Button className="mt-2" variant="secondary">Open timetable <ArrowRight data-icon="inline-end" /></Button></CardContent></Card></section></WorkspaceShell>
}

export function InstitutionOverview() {
  const [announcement, setAnnouncement] = useState('')
  const [sent, setSent] = useState(false)
  const workspace = getWorkspace()
  const institution = getInstitution(workspace?.institutionId ?? 'riverside')
  const metrics = demoMetrics[institution.id as keyof typeof demoMetrics] ?? demoMetrics.riverside
  const role = workspace?.role ?? 'principal'
  const isTeacher = role === 'teacher'
  const isPrincipal = role === 'principal'
  const title = isTeacher ? 'Your classroom, in focus.' : isPrincipal ? 'Lead with a clear view.' : 'Keep your institution running well.'
  return <WorkspaceShell title={title} description={roleDescriptions[role]}><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric icon={Users} label="Learners" value={institution.students.toLocaleString()} detail="Enrolled this year" /><Metric icon={Activity} label="Attendance" value={`${metrics.attendance}%`} detail="Across all classes" /><Metric icon={GraduationCap} label="Average result" value={`${metrics.average}%`} detail="Latest assessment cycle" /><Metric icon={BookOpen} label="Active classes" value={`${metrics.activeClasses}`} detail={`${metrics.atRisk} learners need support`} /></div><div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]"><Card><CardHeader><CardTitle>{isTeacher ? 'Classroom pulse' : 'Institution pulse'}</CardTitle><CardDescription>Signals are scoped to {institution.name}, keeping every role aligned.</CardDescription></CardHeader><CardContent className="flex flex-col gap-5">{[['Attendance', metrics.attendance],['Learning progress', metrics.average],['Wellbeing check-ins', Math.max(70, metrics.average - 3)]].map(([label, value]) => <div key={label as string}><div className="mb-2 flex justify-between text-sm"><span>{label}</span><span className="font-semibold">{value}%</span></div><Progress value={value as number} /></div>)}<div className="grid gap-3 pt-2 sm:grid-cols-3">{['Grade 10 · 94% present','Grade 11 · 91% present','Grade 12 · 96% present'].map((item) => <div className="rounded-xl border p-3 text-xs" key={item}><p className="font-medium">{item.split(' · ')[0]}</p><p className="mt-1 text-muted-foreground">{item.split(' · ')[1]}</p></div>)}</div></CardContent></Card><Card><CardHeader><CardTitle>Post an announcement</CardTitle><CardDescription>Share a clear update with your institution.</CardDescription></CardHeader><CardContent><Textarea value={announcement} onChange={(e) => setAnnouncement(e.target.value)} placeholder="Write an update..." /><Button className="mt-3 w-full" disabled={!announcement.trim()} onClick={() => { setSent(true); setAnnouncement('') }}>{sent ? 'Announcement sent' : 'Publish update'} <Plus data-icon="inline-end" /></Button>{sent && <p className="mt-3 text-center text-xs text-primary">Visible to the shared institution workspace.</p>}</CardContent></Card></div></WorkspaceShell>
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof Users; label: string; value: string; detail: string }) { return <Card><CardContent className="p-5"><Icon className="size-5 text-primary" /><p className="mt-5 text-sm text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent></Card> }
