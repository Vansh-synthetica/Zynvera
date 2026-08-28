'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen, ClipboardCheck, Award, Target, CalendarDays, Video,
  Megaphone, MessagesSquare, KeyRound, TrendingUp, Users, Building2,
  ArrowRight, GraduationCap, Check, Sparkles, Shield, Zap,
  BarChart3, FileText, Palette,
} from 'lucide-react'

const FEATURES = [
  { icon: BookOpen, title: 'Courses & Curriculum', desc: 'Drag-and-drop modules, lessons, syllabus and resources — all in one place.', color: 'text-blue-500' },
  { icon: ClipboardCheck, title: 'Assignments', desc: 'Rich-text submissions, Google Drive uploads, auto-save drafts and inline grading.', color: 'text-emerald-500' },
  { icon: Award, title: 'Quizzes & Rubrics', desc: 'Question banks, auto-scoring, rubric-based marking with mastery levels.', color: 'text-purple-500' },
  { icon: Target, title: 'Attendance', desc: 'One-tap registers, absence alerts, and automatic guardian notifications.', color: 'text-amber-500' },
  { icon: CalendarDays, title: 'Calendar & Timetable', desc: 'Exams, deadlines and class schedules in one shared view.', color: 'text-pink-500' },
  { icon: Video, title: 'Live Classes', desc: 'Google Meet and Zoom sessions with invites, recordings and homework.', color: 'text-red-500' },
  { icon: MessagesSquare, title: 'Messaging', desc: 'Direct messages, per-course forums and real-time notifications.', color: 'text-teal-500' },
  { icon: KeyRound, title: 'Parent Access', desc: '8-digit family codes, school approval, and a private view of one child.', color: 'text-orange-500' },
]

const ROLES = [
  {
    icon: GraduationCap, title: 'Students', color: 'from-emerald-400 to-emerald-600',
    points: ['Submit via Google Drive or rich text editor', 'Real-time grades, feedback and rubric scores', 'Track attendance, deadlines and course progress'],
  },
  {
    icon: BookOpen, title: 'Teachers', color: 'from-blue-400 to-blue-600',
    points: ['Build courses with drag-and-drop modules', 'Grade with speedgrader, rubrics and auto-save', 'Take attendance in seconds with absence alerts'],
  },
  {
    icon: Building2, title: 'Principals', color: 'from-purple-400 to-purple-600',
    points: ['Full oversight of every course and teacher', 'Finance, budgets, payroll and invoices', 'Institution-wide analytics and CSV imports'],
  },
  {
    icon: Users, title: 'Parents', color: 'from-amber-400 to-amber-600',
    points: ['Verified access to their own child only', 'Grades, attendance, due dates and fees', 'Absence alerts when something needs attention'],
  },
]

const STATS = [
  { value: '4', label: 'User roles', sub: 'Students, Teachers, Principals, Parents' },
  { value: '8', label: 'Core modules', sub: 'Courses, Assignments, Quizzes, Attendance and more' },
  { value: '∞', label: 'Schools', sub: 'Multi-tenant — every school gets its own workspace' },
]

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

function FadeIn({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useInView()
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Nav ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-semibold">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground text-sm font-bold neo-sm">Z</span>
            <span className="text-lg tracking-tight">Zynvera</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#roles" className="hover:text-foreground transition-colors">Roles</a>
            <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="neo-hover">
              <Link href="/auth/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background decorative orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 size-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-48 -left-24 size-[500px] rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-24 md:py-32 text-center">
          <FadeIn>
            <Badge variant="outline" className="mb-6 neo-flat px-3 py-1">
              <Sparkles className="size-3 mr-1.5" /> One platform for your entire school
            </Badge>
          </FadeIn>

          <FadeIn delay={100}>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
              Run your school.
              <br />
              <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                All in one place.
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={200}>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Courses, assignments, quizzes, attendance, live classes, messaging and parent
              access — with strict privacy for every student and full oversight for leadership.
            </p>
          </FadeIn>

          <FadeIn delay={300}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="gap-2 px-8 neo-sm neo-hover rounded-2xl">
                <Link href="/auth/login">
                  Sign in to your workspace
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="neo-flat rounded-2xl">
                <Link href="/auth/sign-up">Create an account</Link>
              </Button>
            </div>
          </FadeIn>

          <FadeIn delay={400}>
            <p className="mt-4 text-sm text-muted-foreground">
              Already have an account? <Link href="/auth/login" className="text-primary hover:underline font-medium">Sign in</Link> — your workspace is exactly as you left it.
            </p>
          </FadeIn>

          {/* Quick stat pills */}
          <FadeIn delay={500}>
            <div className="mt-16 flex flex-wrap items-center justify-center gap-3">
              {STATS.map(s => (
                <div key={s.label} className="neo-sm rounded-2xl px-5 py-3 flex items-center gap-3">
                  <span className="text-2xl font-bold text-primary">{s.value}</span>
                  <div className="text-left">
                    <p className="text-xs font-semibold">{s.label}</p>
                    <p className="text-[11px] text-muted-foreground">{s.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────── */}
      <section id="features" className="py-24 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-primary/3 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4 neo-flat">Features</Badge>
              <h2 className="text-3xl md:text-4xl font-bold">Everything a school needs</h2>
              <p className="mt-3 text-muted-foreground max-w-xl mx-auto">Not a feature list — these are live, working tools used by real schools every day.</p>
            </div>
          </FadeIn>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <FadeIn key={f.title} delay={i * 60}>
                <div className="group neo rounded-2xl p-5 neo-hover cursor-default h-full">
                  <div className="size-10 rounded-xl neo-inset flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <f.icon className={`size-5 ${f.color}`} />
                  </div>
                  <h3 className="font-semibold text-sm">{f.title}</h3>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Dashboard Preview ─────────────────────────── */}
      <section className="py-24 border-y bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4 neo-flat">Built for real work</Badge>
              <h2 className="text-3xl md:text-4xl font-bold">A workspace that feels like home</h2>
              <p className="mt-3 text-muted-foreground max-w-xl mx-auto">Every role gets a tailored dashboard with the tools they actually use — no clutter, no confusion.</p>
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <div className="neo rounded-3xl p-1 bg-gradient-to-br from-primary/10 via-transparent to-accent/10">
              <div className="neo-inset rounded-[20px] overflow-hidden">
                {/* Mock dashboard chrome */}
                <div className="bg-background/60 backdrop-blur-sm border-b border-border/40 px-6 py-3 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="size-3 rounded-full bg-red-400/60" />
                    <span className="size-3 rounded-full bg-amber-400/60" />
                    <span className="size-3 rounded-full bg-green-400/60" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="neo-inset rounded-lg px-4 py-1 text-xs text-muted-foreground min-w-[200px] text-center">
                      zynvera.localhousellm.com/student/dashboard
                    </div>
                  </div>
                </div>
                {/* Mock dashboard content */}
                <div className="p-6 space-y-4 bg-background/40 backdrop-blur-sm">
                  <p className="text-sm font-medium text-muted-foreground">Welcome back, Sarah</p>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { label: 'Courses', value: '6', icon: BookOpen, color: 'text-blue-500' },
                      { label: 'Avg grade', value: '87%', icon: Award, color: 'text-emerald-500' },
                      { label: 'Attendance', value: '94%', icon: Target, color: 'text-amber-500' },
                      { label: 'Due this week', value: '3', icon: ClipboardCheck, color: 'text-purple-500' },
                    ].map(s => (
                      <div key={s.label} className="neo-sm rounded-2xl p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
                            <p className="text-2xl font-bold mt-1">{s.value}</p>
                          </div>
                          <div className="size-8 rounded-xl bg-muted/50 flex items-center justify-center">
                            <s.icon className={`size-4 ${s.color}`} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="neo rounded-2xl p-4">
                    <p className="text-xs font-semibold mb-3">Coming up</p>
                    <div className="space-y-2">
                      {['Physics Lab Report — Due tomorrow', 'Math Quiz Ch.5 — Due in 3 days', 'English Essay — Due Friday'].map(a => (
                        <div key={a} className="neo-flat rounded-xl px-3 py-2.5 text-xs flex items-center justify-between">
                          <span>{a.split(' — ')[0]}</span>
                          <span className="text-muted-foreground">{a.split(' — ')[1]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Roles ─────────────────────────────────────────── */}
      <section id="roles" className="py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4 neo-flat">For everyone</Badge>
              <h2 className="text-3xl md:text-4xl font-bold">Built for every role</h2>
              <p className="mt-3 text-muted-foreground max-w-xl mx-auto">Each person sees exactly what they need — and nothing they shouldn&apos;t.</p>
            </div>
          </FadeIn>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((r, i) => (
              <FadeIn key={r.title} delay={i * 80}>
                <div className="neo rounded-2xl p-5 neo-hover h-full">
                  <div className={`size-10 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center mb-3`}>
                    <r.icon className="size-5 text-white" />
                  </div>
                  <h3 className="font-semibold">{r.title}</h3>
                  <ul className="mt-3 space-y-2">
                    {r.points.map(p => (
                      <li key={p} className="flex gap-2 text-xs text-muted-foreground">
                        <Check className="size-3.5 mt-0.5 shrink-0 text-primary" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────── */}
      <section id="how" className="py-24 border-y bg-muted/20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4 neo-flat">How it works</Badge>
              <h2 className="text-3xl md:text-4xl font-bold">Up and running in minutes</h2>
            </div>
          </FadeIn>

          <div className="space-y-6">
            {[
              { n: '1', icon: Zap, title: 'Your school joins', desc: 'Create accounts, pick your institution, and teachers start building courses immediately.', color: 'text-blue-500' },
              { n: '2', icon: Palette, title: 'Teachers run their classes', desc: 'Curriculum, assignments, quizzes, attendance and live classes — all saved to your school workspace.', color: 'text-emerald-500' },
              { n: '3', icon: Shield, title: 'Everyone stays in the loop', desc: 'Students see grades and deadlines instantly. Parents verify with a family code. Leadership sees the whole picture.', color: 'text-purple-500' },
            ].map((s, i) => (
              <FadeIn key={s.n} delay={i * 120}>
                <div className="flex gap-5 items-start neo rounded-2xl p-5 neo-hover">
                  <div className="size-11 shrink-0 rounded-xl neo-inset flex items-center justify-center">
                    <s.icon className={`size-5 ${s.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{s.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <FadeIn>
            <div className="neo rounded-3xl p-1 bg-gradient-to-br from-primary/10 via-transparent to-accent/10">
              <div className="neo-inset rounded-[20px] py-16 px-8">
                <div className="size-14 rounded-2xl neo-sm mx-auto flex items-center justify-center mb-6">
                  <TrendingUp className="size-7 text-primary" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">Your school workspace is waiting</h2>
                <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
                  Sign in to pick up where you left off — or create an account and join your institution today.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button asChild size="lg" className="gap-2 px-8 neo-sm neo-hover rounded-2xl">
                    <Link href="/auth/login">Sign in <ArrowRight className="size-4" /></Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="neo-flat rounded-2xl">
                    <Link href="/auth/sign-up">Create account</Link>
                  </Button>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="border-t border-border/40 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-lg bg-primary text-primary-foreground text-[10px] font-bold">Z</span>
            Zynvera
          </div>
          <div className="flex gap-5">
            <Link href="/auth/login" className="hover:text-foreground transition-colors">Sign in</Link>
            <Link href="/auth/sign-up" className="hover:text-foreground transition-colors">Create account</Link>
            <Link href="/select-institution" className="hover:text-foreground transition-colors">Institutions</Link>
            <span className="text-border">|</span>
            <span className="cursor-default">Privacy</span>
            <span className="cursor-default">Terms</span>
            <span className="cursor-default">Contact</span>
          </div>
          <span>&copy; 2026 Zynvera &middot; by localhousellm</span>
        </div>
      </footer>
    </div>
  )
}
