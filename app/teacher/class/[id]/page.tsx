'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Users,
  GraduationCap,
  Clock,
  AlertTriangle,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
} from 'lucide-react'
import { teacherClasses, teacherStudents, teacherCourses } from '@/lib/seed/teacher'

type SortKey = 'name' | 'grade' | 'attendance' | 'trend'

const TREND_ORDER: Record<string, number> = { improving: 0, stable: 1, declining: 2 }

const weeklyAttendance = [
  { week: 'Week 1', percentage: 94 },
  { week: 'Week 2', percentage: 91 },
  { week: 'Week 3', percentage: 88 },
  { week: 'Week 4', percentage: 96 },
  { week: 'Week 5', percentage: 92 },
  { week: 'Week 6', percentage: 95 },
  { week: 'Week 7', percentage: 90 },
  { week: 'Week 8', percentage: 93 },
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

function getGradeTextColor(grade: number): string {
  if (grade >= 80) return 'text-emerald-500'
  if (grade >= 60) return 'text-amber-500'
  return 'text-red-500'
}

function getTrendIcon(trend: 'improving' | 'stable' | 'declining') {
  if (trend === 'improving') return <ArrowUpRight className="size-3.5 text-emerald-500" />
  if (trend === 'declining') return <ArrowDownRight className="size-3.5 text-red-500" />
  return <Minus className="size-3.5 text-muted-foreground" />
}

function getGradeRange(grade: number): string {
  if (grade >= 90) return 'A'
  if (grade >= 80) return 'B'
  if (grade >= 70) return 'C'
  if (grade >= 60) return 'D'
  return 'F'
}

function getGradeRangeColor(range: string): string {
  if (range === 'A') return 'bg-emerald-500'
  if (range === 'B') return 'bg-blue-500'
  if (range === 'C') return 'bg-amber-500'
  if (range === 'D') return 'bg-orange-500'
  return 'bg-red-500'
}

export default function ClassDetailPage() {
  const params = useParams()
  const classId = params.id as string

  const [sortKey, setSortKey] = useState<SortKey>('name')

  const cls = teacherClasses.find((c) => c.id === classId) || teacherClasses[0]
  const course = teacherCourses.find((c) => c.id === cls.courseId) || teacherCourses[0]

  const classStudents = useMemo(
    () => teacherStudents.filter((s) => s.courseId === cls.courseId),
    [cls.courseId]
  )

  const sortedStudents = useMemo(() => {
    const arr = [...classStudents]
    arr.sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name)
      if (sortKey === 'grade') return b.grade - a.grade
      if (sortKey === 'attendance') return b.attendance - a.attendance
      if (sortKey === 'trend') return TREND_ORDER[a.trend] - TREND_ORDER[b.trend]
      return 0
    })
    return arr
  }, [classStudents, sortKey])

  const avgGrade = useMemo(
    () => Math.round(classStudents.reduce((sum, s) => sum + s.grade, 0) / classStudents.length),
    [classStudents]
  )
  const avgAttendance = useMemo(
    () => Math.round(classStudents.reduce((sum, s) => sum + s.attendance, 0) / classStudents.length),
    [classStudents]
  )
  const atRiskCount = useMemo(
    () => classStudents.filter((s) => s.flags.includes('at_risk')).length,
    [classStudents]
  )

  const gradeDistribution = useMemo(() => {
    const ranges = ['A', 'B', 'C', 'D', 'F']
    return ranges.map((range) => {
      const count = classStudents.filter((s) => getGradeRange(s.grade) === range).length
      const percentage = classStudents.length > 0 ? Math.round((count / classStudents.length) * 100) : 0
      return { range, label: `${range} (${range === 'A' ? '90-100' : range === 'B' ? '80-89' : range === 'C' ? '70-79' : range === 'D' ? '60-69' : '<60'})`, count, percentage }
    })
  }, [classStudents])

  const mostAbsentStudents = useMemo(
    () => [...classStudents].sort((a, b) => a.attendance - b.attendance).slice(0, 5),
    [classStudents]
  )

  const topPerformers = useMemo(
    () => [...classStudents].filter((s) => s.grade >= 80).sort((a, b) => b.grade - a.grade).slice(0, 5),
    [classStudents]
  )

  const strugglingStudents = useMemo(
    () => classStudents.filter((s) => s.grade < 70 || s.attendance < 85),
    [classStudents]
  )

  const mostImproved = useMemo(
    () => classStudents.filter((s) => s.trend === 'improving').sort((a, b) => b.grade - a.grade),
    [classStudents]
  )

  return (
    <AppShell>
      <div className="space-y-6 p-6">
        {/* Back Link */}
        <div className="flex items-center gap-4">
          <Link href="/teacher/classes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="size-4 mr-2" />
              Back to Classes
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{cls.name}</h1>
            <Badge variant="outline" className="text-[10px]">
              {course.code}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {cls.courseName} · {cls.schedule} · {cls.room}
          </p>
        </div>

        {/* Class Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="transition-shadow neo-hover">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                  <Users className="size-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight">{cls.rosterSize}</p>
              <p className="text-sm font-medium">Roster Size</p>
            </CardContent>
          </Card>

          <Card className="transition-shadow neo-hover">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex size-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
                  <GraduationCap className="size-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight">{avgGrade}%</p>
              <p className="text-sm font-medium">Average Grade</p>
            </CardContent>
          </Card>

          <Card className="transition-shadow neo-hover">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex size-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
                  <Clock className="size-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight">{avgAttendance}%</p>
              <p className="text-sm font-medium">Avg Attendance</p>
            </CardContent>
          </Card>

          <Card className="transition-shadow neo-hover">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex size-9 items-center justify-center rounded-xl bg-red-500/10 text-red-600">
                  <AlertTriangle className="size-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight">{atRiskCount}</p>
              <p className="text-sm font-medium">At Risk</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Grade Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Grade Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {gradeDistribution.map((dist) => (
                <div key={dist.range} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium min-w-[120px]">{dist.label}</span>
                    <span className="text-sm text-muted-foreground">
                      {dist.count} students ({dist.percentage}%)
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getGradeRangeColor(dist.range)}`}
                      style={{ width: `${dist.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Attendance Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Attendance Trend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {weeklyAttendance.map((week) => (
                <div key={week.week} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{week.week}</span>
                    <span className="font-medium">{week.percentage}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        week.percentage >= 90 ? 'bg-emerald-500' :
                        week.percentage >= 80 ? 'bg-blue-500' :
                        'bg-amber-500'
                      }`}
                      style={{ width: `${week.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="mt-2 flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <span className="text-xs text-muted-foreground">Average</span>
                <span className="text-sm font-bold">
                  {Math.round(weeklyAttendance.reduce((a, w) => a + w.percentage, 0) / weeklyAttendance.length)}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Most Absent Students */}
        {mostAbsentStudents.length > 0 && (
          <Card className="border-amber-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="size-5 text-amber-600" />
                Most Absent Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mostAbsentStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {getInitials(student.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${
                        student.attendance >= 85
                          ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          : 'bg-red-500/10 text-red-600 border-red-500/20'
                      }`}
                    >
                      {student.attendance}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Student List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Student Roster</CardTitle>
                <CardDescription>{classStudents.length} students enrolled</CardDescription>
              </div>
              <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Sort by Name</SelectItem>
                  <SelectItem value="grade">Sort by Grade</SelectItem>
                  <SelectItem value="attendance">Sort by Attendance</SelectItem>
                  <SelectItem value="trend">Sort by Trend</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Student</th>
                    <th className="text-left p-4 font-medium">Grade</th>
                    <th className="text-left p-4 font-medium">Attendance</th>
                    <th className="text-left p-4 font-medium">Trend</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStudents.map((student) => (
                    <tr key={student.id} className="border-b last:border-b-0 hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                            {getInitials(student.name)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-sm font-bold ${getGradeTextColor(student.grade)}`}>
                          {student.grade}%
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full ${
                                student.attendance >= 90 ? 'bg-emerald-500' :
                                student.attendance >= 75 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${student.attendance}%` }}
                            />
                          </div>
                          <span className="text-sm">{student.attendance}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          {getTrendIcon(student.trend)}
                          <span className="text-xs capitalize text-muted-foreground">{student.trend}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {student.flags.includes('high_performer') && (
                          <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1">
                            <Star className="size-3" />
                            High Performer
                          </Badge>
                        )}
                        {student.flags.includes('at_risk') && (
                          <Badge variant="secondary" className="text-[10px] bg-red-500/10 text-red-600 border-red-500/20 gap-1">
                            <AlertTriangle className="size-3" />
                            At Risk
                          </Badge>
                        )}
                        {student.flags.includes('improving') && (
                          <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1">
                            <TrendingUp className="size-3" />
                            Improving
                          </Badge>
                        )}
                        {student.flags.length === 0 && (
                          <Badge variant="secondary" className="text-[10px]">
                            Normal
                          </Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <Link href={`/teacher/students/${student.id}`}>
                          <Button variant="ghost" size="sm" className="gap-1.5">
                            View
                            <ChevronRight className="size-3.5" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Top Performers */}
          <Card className="border-emerald-500/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingUp className="size-4 text-emerald-600" />
                  Top Performers
                </CardTitle>
                <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  {topPerformers.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {topPerformers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No top performers</p>
              ) : (
                <div className="space-y-3">
                  {topPerformers.map((student) => (
                    <div key={student.id} className="flex items-center justify-between rounded-lg border border-emerald-500/20 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold">
                          {getInitials(student.name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.lastActivity}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                        {student.grade}%
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Struggling Students */}
          <Card className="border-amber-500/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="size-4 text-amber-600" />
                  Struggling Students
                </CardTitle>
                <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                  {strugglingStudents.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {strugglingStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No students struggling</p>
              ) : (
                <div className="space-y-3">
                  {strugglingStudents.map((student) => (
                    <div key={student.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 text-xs font-bold">
                            {getInitials(student.name)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(student.trend)}
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${
                            student.grade < 70 ? 'bg-red-500/10 text-red-600 border-red-500/20' : 'bg-muted'
                          }`}
                        >
                          Grade: {student.grade}%
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${
                            student.attendance < 85 ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-muted'
                          }`}
                        >
                          Attendance: {student.attendance}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Most Improved */}
          <Card className="border-blue-500/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingUp className="size-4 text-blue-600" />
                  Most Improved
                </CardTitle>
                <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20">
                  {mostImproved.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {mostImproved.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No improving students</p>
              ) : (
                <div className="space-y-3">
                  {mostImproved.map((student) => (
                    <div key={student.id} className="flex items-center justify-between rounded-lg border border-blue-500/20 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 text-xs font-bold">
                          {getInitials(student.name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.lastActivity}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ArrowUpRight className="size-3.5 text-emerald-500" />
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]">
                          {student.grade}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
