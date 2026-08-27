'use client'

import { withBase } from '@/lib/base-path'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, GraduationCap, CalendarDays, Clock, ClipboardCheck, ClipboardList,
  FileText, BarChart3, MessageSquare, Users, Megaphone, Video, HelpCircle,
  Settings, Bell, ChevronLeft, ChevronRight, LogOut, Search,
  Menu, X, Building2, FolderOpen, AlertTriangle, Award,
  Home, Target, TrendingUp, BookMarked, MessagesSquare, Link2, KeyRound, CalendarClock, Wallet
} from 'lucide-react'
import { useWorkspace } from '@/lib/workspace-context'
import { getUnreadCount } from '@/lib/api/notifications'

type NavItem = { label: string; href: string; icon: typeof LayoutDashboard; roles?: string[] }

const mainNav: NavItem[] = [
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
  { label: 'Fee Status', href: '/student/fees', icon: Wallet, roles: ['student'] },
  { label: 'Reports', href: '/student/reports', icon: FileText, roles: ['student'] },
  { label: 'Family Code', href: '/student/family-code', icon: KeyRound, roles: ['student'] },
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
  { label: 'My Children', href: '/parent/dashboard', icon: GraduationCap, roles: ['parent'] },
  { label: 'Link a Child', href: '/parent/link', icon: KeyRound, roles: ['parent'] },
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
      ? mainNav
      : mainNav.filter(item => !item.roles || item.roles.includes(role))

  const roleLabel = role === 'super_admin' ? 'Owner' : role === 'principal' ? 'Admin' : role

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:flex-col transition-all duration-200 ${collapsed ? 'lg:w-[68px]' : 'lg:w-[250px]'}`}
        style={{ background: 'hsl(var(--sidebar-background))' }}>
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 px-4 shrink-0">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground text-sm font-bold">Z</span>
            {!collapsed && <span className="text-sm font-semibold text-sidebar-foreground">Zynvera</span>}
          </Link>
          <button onClick={() => setCollapsed(!collapsed)} className="ml-auto hidden lg:flex size-7 items-center justify-center rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50">
            {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
          </button>
        </div>

        {/* Role + context */}
        {!collapsed && (
          <div className="px-4 pb-3 pt-1">
            <span className="inline-flex items-center rounded-xl bg-sidebar-accent px-2 py-0.5 text-[11px] font-medium text-sidebar-accent-foreground">
              {roleLabel}
            </span>
            {institution && (
              <p className="mt-2 text-xs text-sidebar-foreground/70 truncate">{institution.name}</p>
            )}
            {userName && <p className="text-[11px] text-sidebar-foreground/50 truncate">{userName}</p>}
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-1 space-y-0.5">
          {filteredNav.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition-all duration-150 ${
                  active
                    ? 'bg-sidebar-accent text-sidebar-foreground font-medium neo-sm'
                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40'
                }`}
                title={item.label}
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && item.label === 'Messages' && unreadCount > 0 && (
                  <span className="ml-auto text-[10px] bg-accent text-accent-foreground rounded-md px-1.5 py-0.5 font-medium">{unreadCount}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-sidebar-border/30 p-2.5 space-y-0.5">
          {!collapsed && (
            <Link href="/student/notifications" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40">
              <Bell className="size-4" />
              Notifications
              {unreadCount > 0 && (
                <span className="ml-auto text-[10px] bg-accent text-accent-foreground rounded-md px-1.5 py-0.5 font-medium">{unreadCount}</span>
              )}
            </Link>
          )}
          <button
            onClick={() => { clearWorkspace(); window.location.assign(withBase('/auth/login')) }}
            className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
          >
            <LogOut className="size-4" />
            {!collapsed && 'Sign out'}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 bg-background/90 backdrop-blur-md">
        <div className="flex h-13 items-center gap-3 px-4">
          <button onClick={() => setMobileOpen(true)} className="size-9 flex items-center justify-center rounded-xl neo-sm">
            <Menu className="size-5" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-[11px] font-bold">Z</span>
            <span className="text-sm font-semibold">Zynvera</span>
          </Link>
          <div className="ml-auto flex items-center gap-1.5">
            <Link href="/student/notifications" className="relative size-9 flex items-center justify-center rounded-xl neo-sm">
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 text-[10px] bg-accent text-accent-foreground rounded-md size-4 flex items-center justify-center font-medium">{unreadCount}</span>
              )}
            </Link>
            <button onClick={() => setSearchOpen(true)} className="size-9 flex items-center justify-center rounded-xl neo-sm">
              <Search className="size-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-background overflow-y-auto neo">
            <div className="flex h-13 items-center justify-between px-4">
              <span className="text-sm font-semibold">Menu</span>
              <button onClick={() => setMobileOpen(false)} className="size-8 flex items-center justify-center rounded-lg hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>
            <div className="px-4 pb-3">
              <span className="inline-flex items-center rounded-xl bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                {roleLabel}
              </span>
            </div>
            <nav className="px-2.5 py-1 space-y-0.5">
              {filteredNav.map(item => {
                const active = pathname.startsWith(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] ${
                      active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                )
              })}
            </nav>
            <div className="border-t border-border/40 p-2.5 mt-2">
              <button
                onClick={() => { clearWorkspace(); window.location.assign(withBase('/auth/login')) }}
                className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] text-muted-foreground hover:bg-muted/50"
              >
                <LogOut className="size-4" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setSearchOpen(false)}>
          <div className="absolute inset-x-0 top-0 bg-background/95 backdrop-blur-md p-4 neo" onClick={e => e.stopPropagation()}>
            <div className="mx-auto max-w-lg">
              <input autoFocus placeholder="Search pages..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-10 rounded-xl bg-background px-3 text-sm neo-inset placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              <div className="mt-2 space-y-0.5 max-h-64 overflow-y-auto">
                {filteredNav
                  .filter(i => i.label.toLowerCase().includes(searchQuery.toLowerCase()))
                  .slice(0, 8)
                  .map(i => (
                    <Link key={i.href + i.label} href={i.href} onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-muted/50">
                      <i.icon className="size-4 text-muted-foreground" /> {i.label}
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className={`lg:pl-[250px] transition-all duration-200 ${collapsed ? 'lg:pl-[68px]' : ''}`}>
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-background/90 backdrop-blur-md border-t border-border/40 lg:hidden print:hidden">
        <div className="flex items-center justify-around py-2">
          {(role === 'teacher' ? [
            { label: 'Today', href: '/teacher/today', icon: CalendarClock },
            { label: 'Courses', href: '/teacher/courses', icon: BookOpen },
            { label: 'Grades', href: '/teacher/gradebook', icon: Award },
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
            { label: 'Tasks', href: '/student/assignments', icon: ClipboardCheck },
            { label: 'Grades', href: '/student/grades', icon: Award },
            { label: 'More', href: '#', icon: Menu, action: () => setMobileOpen(true) },
          ]).map((item: any) =>
            item.action ? (
              <button key={item.label} onClick={item.action} className="flex flex-col items-center gap-0.5 px-2 py-1 text-muted-foreground">
                <item.icon className="size-5" />
                <span className="text-[10px]">{item.label}</span>
              </button>
            ) : (
              <Link key={item.label} href={item.href} className={`flex flex-col items-center gap-0.5 px-2 py-1 ${
                pathname.startsWith(item.href) ? 'text-primary' : 'text-muted-foreground'
              }`}>
                <item.icon className="size-5" />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            )
          )}
        </div>
      </nav>
    </div>
  )
}
