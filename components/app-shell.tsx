'use client'

import { withBase } from '@/lib/base-path'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, GraduationCap, CalendarDays, Clock, ClipboardCheck, ClipboardList,
  FileText, BarChart3, MessageSquare, Users, Megaphone, Video, HelpCircle,
  Settings, Bell, ChevronLeft, ChevronRight, LogOut, Search, Plus,
  Menu, X, Building2, ChevronDown, FolderOpen, AlertTriangle, Award,
  Home, Target, TrendingUp, BookMarked, MessagesSquare, Zap, Link2, KeyRound, CalendarClock
} from 'lucide-react'
import { useWorkspace } from '@/lib/workspace-context'
import { getUnreadCount } from '@/lib/api/notifications'

type NavItem = { label: string; href: string; icon: typeof LayoutDashboard; roles?: string[] }

const mainNav: NavItem[] = [
  // Student routes
  { label: 'Dashboard', href: '/student/dashboard', icon: Home, roles: ['student'] },
  { label: 'My Courses', href: '/student/courses', icon: BookOpen, roles: ['student'] },
  { label: 'Assignments', href: '/student/assignments', icon: ClipboardCheck, roles: ['student'] },
  { label: 'Assessments', href: '/student/assessments', icon: FileText, roles: ['student'] },
  { label: 'Grades', href: '/student/grades', icon: Award, roles: ['student'] },
  { label: 'Attendance', href: '/student/attendance', icon: Target, roles: ['student'] },
  { label: 'Calendar', href: '/student/calendar', icon: CalendarDays, roles: ['student'] },
  { label: 'Timetable', href: '/student/timetable', icon: Clock, roles: ['student'] },
  { label: 'Meetings', href: '/student/meetings', icon: Video, roles: ['student'] },
  { label: 'Messages', href: '/student/messages', icon: MessagesSquare, roles: ['student'] },
  { label: 'Announcements', href: '/student/announcements', icon: Megaphone, roles: ['student'] },
  { label: 'Community', href: '/student/community', icon: Users, roles: ['student'] },
  { label: 'Resources', href: '/student/resources', icon: FolderOpen, roles: ['student'] },
  { label: 'People', href: '/student/people', icon: Users, roles: ['student'] },
  { label: 'Analytics', href: '/student/analytics', icon: BarChart3, roles: ['student'] },
  { label: 'Reports', href: '/student/reports', icon: FileText, roles: ['student'] },
  { label: 'Family Code', href: '/student/family-code', icon: KeyRound, roles: ['student'] },
  // Teacher routes
  { label: 'Today', href: '/teacher/today', icon: CalendarClock, roles: ['teacher'] },
  { label: 'Teacher Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard, roles: ['teacher'] },
  { label: 'My Courses', href: '/teacher/courses', icon: BookOpen, roles: ['teacher'] },
  { label: 'My Classes', href: '/teacher/classes', icon: Users, roles: ['teacher'] },
  { label: 'My Students', href: '/teacher/students', icon: GraduationCap, roles: ['teacher'] },
  { label: 'Attendance Tracker', href: '/teacher/attendance', icon: Target, roles: ['teacher'] },
  { label: 'Gradebook', href: '/teacher/gradebook', icon: Award, roles: ['teacher'] },
  { label: 'Rubrics', href: '/teacher/rubrics', icon: ClipboardList, roles: ['teacher'] },
  { label: 'Discussions', href: '/teacher/discussions', icon: MessageSquare, roles: ['teacher'] },
  { label: 'Messages', href: '/teacher/messages', icon: MessagesSquare, roles: ['teacher'] },
  { label: 'Assignment Manager', href: '/teacher/assignments', icon: ClipboardCheck, roles: ['teacher'] },
  { label: 'Assessment Builder', href: '/teacher/assessments', icon: FileText, roles: ['teacher'] },
  { label: 'Class Analytics', href: '/teacher/analytics', icon: BarChart3, roles: ['teacher'] },
  // Principal/Admin routes
  { label: 'Institution Overview', href: '/principal/dashboard', icon: LayoutDashboard, roles: ['principal', 'admin', 'super_admin', 'department_head'] },
  { label: 'Staff Management', href: '/principal/staff', icon: Users, roles: ['principal', 'admin', 'super_admin'] },
  { label: 'Student Management', href: '/principal/students', icon: GraduationCap, roles: ['principal', 'admin', 'super_admin'] },
  { label: 'Parent Management', href: '/principal/parents', icon: Users, roles: ['principal', 'admin', 'super_admin'] },
  { label: 'Course Management', href: '/principal/courses', icon: BookOpen, roles: ['principal', 'admin', 'super_admin', 'department_head'] },
  { label: 'Departments', href: '/principal/departments', icon: Building2, roles: ['principal', 'admin', 'super_admin'] },
  { label: 'Finance', href: '/principal/finance', icon: TrendingUp, roles: ['principal', 'admin', 'super_admin'] },
  { label: 'Analytics', href: '/principal/analytics', icon: BarChart3, roles: ['principal', 'admin', 'super_admin'] },
  { label: 'Reports', href: '/principal/reports', icon: FileText, roles: ['principal', 'admin', 'super_admin'] },
  { label: 'Alerts', href: '/principal/alerts', icon: AlertTriangle, roles: ['principal', 'admin', 'super_admin'] },
  { label: 'Announcements', href: '/principal/announcements', icon: Megaphone, roles: ['principal', 'admin', 'super_admin'] },
  // Parent routes
  { label: 'My Children', href: '/parent/dashboard', icon: GraduationCap, roles: ['parent'] },
  { label: 'Link a Child', href: '/parent/link', icon: KeyRound, roles: ['parent'] },
  // Shared
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Integrations', href: '/integrations', icon: Link2 },
  { label: 'Help & Support', href: '/support', icon: HelpCircle },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { institution, term, role, userName, clearWorkspace, userId } = useWorkspace()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Real unread count from Supabase for signed-in users.
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    getUnreadCount(userId)
      .then(n => { if (!cancelled) setUnreadCount(n) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [userId, pathname])

  const filteredNav =
    role === 'super_admin'
      ? mainNav // owner account: every panel, one login
      : mainNav.filter(item => !item.roles || item.roles.includes(role))

  const badgeCls =
    role === 'teacher' ? 'bg-blue-500/10 text-blue-600' :
    role === 'principal' || role === 'admin' || role === 'super_admin' ? 'bg-purple-500/10 text-purple-600' :
    'bg-emerald-500/10 text-emerald-600'
  const badgeEmoji = role === 'teacher' ? '📚' : role === 'principal' || role === 'admin' || role === 'super_admin' ? '🏛️' : '🎓'

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      {/* Desktop sidebar */}
      <aside className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:flex-col border-r bg-background transition-all duration-200 ${collapsed ? 'lg:w-[68px]' : 'lg:w-[260px]'}`}>
        <div className="flex h-14 items-center gap-2 border-b px-4 shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">Z</span>
            {!collapsed && <span className="text-sm font-semibold truncate">Zynvera</span>}
          </Link>
          <button onClick={() => setCollapsed(!collapsed)} className="ml-auto hidden lg:flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        </div>

        {!collapsed && (
          <div className="px-4 py-2 border-b">
            <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${badgeCls}`}>
              <span>{badgeEmoji}</span>
              <span className="capitalize">{role === 'super_admin' ? 'Owner' : `${role} panel`}</span>
            </div>
            {institution && (
              <p className="mt-1.5 text-xs text-muted-foreground truncate">{institution.name}</p>
            )}
            {term && <p className="text-[11px] text-muted-foreground truncate">{term.name}</p>}
            {userName && <p className="mt-1 text-xs font-medium truncate">{userName}</p>}
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {filteredNav.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
                title={item.label}
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && item.label === 'Messages' && unreadCount > 0 && (
                  <span className="ml-auto text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">{unreadCount}</span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="border-t p-2 space-y-0.5">
          {!collapsed && (
            <Link href="/student/notifications" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
              <Bell className="size-4" />
              Notifications
              {unreadCount > 0 && (
                <span className="ml-auto text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">{unreadCount}</span>
              )}
            </Link>
          )}
          <button
            onClick={() => { clearWorkspace(); window.location.assign(withBase('/auth/login')) }}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-4" />
            {!collapsed && 'Switch Workspace'}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-4">
          <button onClick={() => setMobileOpen(true)} className="size-8 flex items-center justify-center rounded-md hover:bg-muted">
            <Menu className="size-5" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-[11px] font-bold">Z</span>
            <span className="text-sm font-semibold">Zynvera</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/student/notifications" className="relative size-8 flex items-center justify-center rounded-md hover:bg-muted">
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 text-[10px] bg-primary text-primary-foreground rounded-full size-4 flex items-center justify-center">{unreadCount}</span>
              )}
            </Link>
            <button onClick={() => setSearchOpen(true)} className="size-8 flex items-center justify-center rounded-md hover:bg-muted">
              <Search className="size-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-background border-r overflow-y-auto">
            <div className="flex h-14 items-center justify-between px-4 border-b">
              <span className="text-sm font-semibold">Menu</span>
              <button onClick={() => setMobileOpen(false)} className="size-8 flex items-center justify-center rounded-md hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>
            <div className={`mx-4 my-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${badgeCls}`}>
              <span>{badgeEmoji}</span>
              <span className="capitalize">{role === 'super_admin' ? 'Owner' : `${role} panel`}</span>
            </div>
            <nav className="px-2 py-2 space-y-0.5">
              {filteredNav.map(item => {
                const active = pathname.startsWith(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm',
                      active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted',
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                )
              })}
            </nav>
            <div className="border-t p-2">
              <button
                onClick={() => { clearWorkspace(); window.location.assign(withBase('/auth/login')) }}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
              >
                <LogOut className="size-4" /> Switch Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setSearchOpen(false)}>
          <div className="absolute inset-x-0 top-0 border-b bg-background p-4" onClick={e => e.stopPropagation()}>
            <div className="mx-auto max-w-xl">
              <Input autoFocus placeholder="Search pages…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              <div className="mt-2 space-y-0.5 max-h-72 overflow-y-auto">
                {filteredNav
                  .filter(i => i.label.toLowerCase().includes(searchQuery.toLowerCase()))
                  .slice(0, 8)
                  .map(i => (
                    <Link key={i.href + i.label} href={i.href} onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted">
                      <i.icon className="size-4 text-muted-foreground" /> {i.label}
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className={`lg:pl-[260px] transition-all ${collapsed ? 'lg:pl-[68px]' : ''}`}>
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-30 border-t bg-background/95 backdrop-blur lg:hidden print:hidden">
        <div className="flex items-center justify-around py-2">
          {(role === 'teacher' ? [
            { label: 'Today', href: '/teacher/today', icon: CalendarClock },
            { label: 'Courses', href: '/teacher/courses', icon: BookOpen },
            { label: 'Gradebook', href: '/teacher/gradebook', icon: Award },
            { label: 'Students', href: '/teacher/students', icon: Users },
            { label: 'More', href: '#', icon: Menu, action: () => setMobileOpen(true) },
          ] : role === 'principal' || role === 'admin' || role === 'super_admin' ? [
            { label: 'Overview', href: '/principal/dashboard', icon: Home },
            { label: 'Staff', href: '/principal/staff', icon: Users },
            { label: 'Students', href: '/principal/students', icon: GraduationCap },
            { label: 'Finance', href: '/principal/finance', icon: TrendingUp },
            { label: 'More', href: '#', icon: Menu, action: () => setMobileOpen(true) },
          ] : role === 'parent' ? [
            { label: 'Family', href: '/parent/dashboard', icon: Home },
            { label: 'Link', href: '/parent/link', icon: KeyRound },
            { label: 'More', href: '#', icon: Menu, action: () => setMobileOpen(true) },
          ] : [
            { label: 'Home', href: '/student/dashboard', icon: Home },
            { label: 'Courses', href: '/student/courses', icon: BookOpen },
            { label: 'Assignments', href: '/student/assignments', icon: ClipboardCheck },
            { label: 'Grades', href: '/student/grades', icon: Award },
            { label: 'More', href: '#', icon: Menu, action: () => setMobileOpen(true) },
          ]).map((item: any) =>
            item.action ? (
              <button key={item.label} onClick={item.action} className="flex flex-col items-center gap-0.5 px-2 py-1 text-muted-foreground">
                <item.icon className="size-4" />
                <span className="text-[10px]">{item.label}</span>
              </button>
            ) : (
              <Link key={item.label} href={item.href} className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1',
                pathname.startsWith(item.href) ? 'text-primary' : 'text-muted-foreground',
              )}>
                <item.icon className="size-4" />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            ),
          )}
        </div>
      </nav>
    </div>
  )
}

// Small local helper to avoid an extra import in this file.
function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn('flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm', props.className)} />
}
