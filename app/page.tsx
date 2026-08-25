'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen, ClipboardCheck, Award, Target, CalendarDays, Video,
  Megaphone, MessagesSquare, KeyRound, TrendingUp, Users, Building2,
  ArrowRight, GraduationCap, Check,
} from 'lucide-react'

const FEATURES = [
  { icon: BookOpen, title: 'Courses & Curriculum', desc: 'Build courses with modules, lessons, resources and weekly syllabus — drag and drop.' },
  { icon: ClipboardCheck, title: 'Assignments', desc: 'Publish work, collect submissions via Google Drive, grade with feedback.' },
  { icon: Award, title: 'Quizzes & Rubrics', desc: 'Question banks, auto-scoring, rubric-based marking with mastery levels.' },
  { icon: Target, title: 'Attendance', desc: 'One-tap registers, history, and automatic guardian alerts on absences.' },
  { icon: CalendarDays, title: 'Calendar & Timetable', desc: 'Exams, deadlines and class schedules in one shared view.' },
  { icon: Video, title: 'Live Classes', desc: 'Google Meet and Zoom sessions with invites and recordings.' },
  { icon: MessagesSquare, title: 'Messaging & Community', desc: 'Direct messages plus per-course Q&A forums with teacher answers.' },
  { icon: KeyRound, title: 'Parent Access', desc: '8-digit family codes, school approval, and a private view of one child only.' },
]

const ROLES = [
  {
    icon: GraduationCap, title: 'Students', color: 'text-emerald-600',
    points: ['Submit work from Google Drive', 'See grades and feedback instantly', 'Track attendance and deadlines'],
  },
  {
    icon: BookOpen, title: 'Teachers', color: 'text-blue-600',
    points: ['Build courses and quizzes visually', 'Grade fast — one student or the whole class', 'Take attendance in seconds'],
  },
  {
    icon: Building2, title: 'Principals', color: 'text-purple-600',
    points: ['See everything teachers publish', 'Finance, budgets and departments', 'Institution-wide analytics and reports'],
  },
  {
    icon: Users, title: 'Parents', color: 'text-amber-600',
    points: ['Verified access to their own child only', 'Grades, attendance and due dates', 'Alerts when something needs attention'],
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">Z</span>
            Zynvera
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#roles" className="hover:text-foreground">For everyone</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/auth/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <Badge variant="outline" className="mb-4">One platform for your entire school</Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Run your school.
            <span className="text-primary"> All in one place.</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Courses, assignments, quizzes, attendance, live classes, messaging and parent
            access — with strict privacy for every student and full oversight for leadership.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link href="/auth/login">
                Sign in to your workspace
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/auth/sign-up">Create an account</Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Already part of a school on Zynvera? Sign in — your workspace is exactly as you left it.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Everything a school needs</h2>
            <p className="mt-2 text-muted-foreground">Not a feature list — these are live, working tools.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(f => (
              <Card key={f.title} className="border-border/50">
                <CardContent className="p-5">
                  <f.icon className="size-5 text-primary" />
                  <h3 className="mt-3 font-semibold text-sm">{f.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="py-20 border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Built for every role</h2>
            <p className="mt-2 text-muted-foreground">Each person sees exactly what they need — and nothing they shouldn't.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map(r => (
              <Card key={r.title}>
                <CardContent className="p-5">
                  <r.icon className={`size-6 ${r.color}`} />
                  <h3 className="mt-3 font-semibold">{r.title}</h3>
                  <ul className="mt-2 space-y-1.5">
                    {r.points.map(p => (
                      <li key={p} className="flex gap-1.5 text-xs text-muted-foreground">
                        <Check className="size-3 mt-0.5 shrink-0 text-primary" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20">
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">How schools get started</h2>
          </div>
          <div className="space-y-4">
            {[
              ['1', 'Your school joins', 'Create accounts, pick your institution, and teachers start building courses immediately.'],
              ['2', 'Teachers run their classes', 'Curriculum, assignments, quizzes, attendance and live classes — all saved to your school workspace.'],
              ['3', 'Everyone stays in the loop', 'Students see grades and deadlines instantly. Parents verify access with a family code. Leadership sees the whole picture.'],
            ].map(([n, title, desc]) => (
              <div key={n} className="flex gap-4 items-start">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">{n}</span>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <TrendingUp className="size-8 mx-auto text-primary" />
          <h2 className="mt-4 text-3xl font-bold">Your school workspace is waiting</h2>
          <p className="mt-2 text-muted-foreground">
            Sign in to pick up where you left off — or create an account and join your institution today.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link href="/auth/login">Sign in <ArrowRight className="size-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/auth/sign-up">Create account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-4 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded bg-primary text-primary-foreground text-[10px] font-bold">Z</span>
            Zynvera
          </div>
          <div className="flex gap-5">
            <Link href="/auth/login" className="hover:text-foreground">Sign in</Link>
            <Link href="/auth/sign-up" className="hover:text-foreground">Create account</Link>
            <Link href="/select-institution" className="hover:text-foreground">Institutions</Link>
          </div>
          <span>© 2026 Zynvera · by localhousellm</span>
        </div>
      </footer>
    </div>
  )
}
