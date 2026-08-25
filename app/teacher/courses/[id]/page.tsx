"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  Users,
  Upload,
  Bell,
  Video,
  BarChart3,
  Star,
  AlertCircle,
  ChevronRight,
  Download,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { teacherCourses, teacherStudents } from "@/lib/seed/teacher";
import { courses } from "@/lib/seed";

export default function TeacherCourseDetailPage() {
  const params = useParams();
  const courseId = params.id as string;
  const [activeTab, setActiveTab] = useState("overview");
  const [moduleSearch, setModuleSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentSort, setStudentSort] = useState<"name" | "grade" | "attendance">("name");
  const [announcementText, setAnnouncementText] = useState("");

  const course = courses.find((c) => c.id === courseId) || teacherCourses[0];
  const courseStudents = teacherStudents.filter((s) =>
    s.courses.some((sc) => sc.courseId === courseId)
  );

  const averageGrade =
    courseStudents.length > 0
      ? Math.round(
          courseStudents.reduce((sum, s) => {
            const courseData = s.courses.find((sc) => sc.courseId === courseId);
            return sum + (courseData?.grade || 0);
          }, 0) / courseStudents.length
        )
      : 0;

  const averageAttendance =
    courseStudents.length > 0
      ? Math.round(
          courseStudents.reduce((sum, s) => {
            const courseData = s.courses.find((sc) => sc.courseId === courseId);
            return sum + (courseData?.attendance || 0);
          }, 0) / courseStudents.length
        )
      : 0;

  const sortedStudents = [...courseStudents].sort((a, b) => {
    const aData = a.courses.find((sc) => sc.courseId === courseId);
    const bData = b.courses.find((sc) => sc.courseId === courseId);
    if (studentSort === "grade") return (bData?.grade || 0) - (aData?.grade || 0);
    if (studentSort === "attendance") return (bData?.attendance || 0) - (aData?.attendance || 0);
    return a.name.localeCompare(b.name);
  });

  const filteredStudents = sortedStudents.filter((s) =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const filteredModules = course.modules.filter((m) =>
    m.name.toLowerCase().includes(moduleSearch.toLowerCase())
  );

  const upcomingDeadlines = [
    { title: "Homework 3: Linear Equations", due: "Aug 25, 2026", type: "assignment" },
    { title: "Chapter 4 Quiz", due: "Aug 28, 2026", type: "assessment" },
    { title: "Group Project Proposal", due: "Sep 1, 2026", type: "assignment" },
    { title: "Lab Report: Chemical Reactions", due: "Sep 5, 2026", type: "assessment" },
  ];

  const recentActivity = [
    { action: "Sarah Johnson submitted Homework 2", time: "2 hours ago", icon: FileText },
    { action: "Mike Chen completed Chapter 3 Quiz", time: "3 hours ago", icon: CheckCircle2 },
    { action: "Emily Davis posted in Discussion #5", time: "5 hours ago", icon: MessageSquare },
    { action: "James Wilson uploaded Lab Report", time: "1 day ago", icon: Upload },
    { action: "Alex Turner requested grade review", time: "1 day ago", icon: AlertCircle },
  ];

  const assignments = [
    { id: "a1", title: "Homework 1: Introduction", due: "Aug 10, 2026", submitted: 28, total: 30, graded: 28, points: 100 },
    { id: "a2", title: "Homework 2: Basic Concepts", due: "Aug 18, 2026", submitted: 27, total: 30, graded: 25, points: 100 },
    { id: "a3", title: "Homework 3: Linear Equations", due: "Aug 25, 2026", submitted: 20, total: 30, graded: 0, points: 100 },
    { id: "a4", title: "Group Project Proposal", due: "Sep 1, 2026", submitted: 15, total: 30, graded: 0, points: 50 },
  ];

  const discussions = [
    { id: "d1", title: "Week 1: Course Introduction", replies: 24, lastActive: "2 hours ago", pinned: true },
    { id: "d2", title: "Help with Chapter 3 Problems", replies: 12, lastActive: "1 day ago", pinned: false },
    { id: "d3", title: "Study Group for Midterm", replies: 8, lastActive: "3 days ago", pinned: false },
    { id: "d4", title: "Lab Equipment Questions", replies: 5, lastActive: "5 days ago", pinned: false },
  ];

  const resources = [
    { id: "r1", name: "Course Syllabus.pdf", type: "pdf", size: "245 KB", uploaded: "Aug 1, 2026" },
    { id: "r2", name: "Chapter 1 Slides.pptx", type: "pptx", size: "3.2 MB", uploaded: "Aug 5, 2026" },
    { id: "r3", name: "Chapter 2 Slides.pptx", type: "pptx", size: "2.8 MB", uploaded: "Aug 12, 2026" },
    { id: "r4", name: "Reference Sheet.pdf", type: "pdf", size: "156 KB", uploaded: "Aug 15, 2026" },
    { id: "r5", name: "Lab Manual.pdf", type: "pdf", size: "1.5 MB", uploaded: "Aug 18, 2026" },
  ];

  const attendanceData = [
    { date: "Aug 20, 2026", present: 28, absent: 2, late: 0, rate: 93 },
    { date: "Aug 19, 2026", present: 27, absent: 1, late: 2, rate: 90 },
    { date: "Aug 18, 2026", present: 29, absent: 1, late: 0, rate: 97 },
    { date: "Aug 17, 2026", present: 26, absent: 3, late: 1, rate: 87 },
    { date: "Aug 16, 2026", present: 28, absent: 2, late: 0, rate: 93 },
  ];

  const gradeDistribution = [
    { range: "A (90-100)", count: 12, percentage: 40 },
    { range: "B (80-89)", count: 9, percentage: 30 },
    { range: "C (70-79)", count: 6, percentage: 20 },
    { range: "D (60-69)", count: 2, percentage: 7 },
    { range: "F (0-59)", count: 1, percentage: 3 },
  ];

  const performanceTrend = [
    { week: "Week 1", avg: 85 },
    { week: "Week 2", avg: 82 },
    { week: "Week 3", avg: 88 },
    { week: "Week 4", avg: 86 },
    { week: "Week 5", avg: 84 },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/teacher/courses">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
          </Link>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{course.name}</h1>
              <Badge variant="secondary">{course.code}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">Term: {course.term}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
            <Button size="sm" variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Create Assessment
            </Button>
            <Button size="sm" variant="outline">
              <Bell className="h-4 w-4 mr-2" />
              Post Announcement
            </Button>
            <Button size="sm" variant="outline">
              <Video className="h-4 w-4 mr-2" />
              Schedule Meeting
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{courseStudents.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Average Grade</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageGrade}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Attendance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageAttendance}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Modules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{course.modules.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-9 h-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="gradebook">Gradebook</TabsTrigger>
            <TabsTrigger value="discussions">Discussions</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Course Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{course.description}</p>
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Course Progress</span>
                      <span>{Math.round((3 / course.modules.length) * 100)}%</span>
                    </div>
                    <Progress value={Math.round((3 / course.modules.length) * 100)} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Deadlines</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingDeadlines.map((deadline, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-primary/10 p-2">
                            {deadline.type === "assignment" ? (
                              <FileText className="h-4 w-4 text-primary" />
                            ) : (
                              <BarChart3 className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{deadline.title}</p>
                            <p className="text-xs text-muted-foreground">{deadline.due}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {deadline.due}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => {
                    const Icon = activity.icon;
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm">{activity.action}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Announcement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Type an announcement for your students..."
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  rows={3}
                />
                <Button size="sm">
                  <Bell className="h-4 w-4 mr-2" />
                  Post Announcement
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="modules" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search modules..."
                  className="pl-9"
                  value={moduleSearch}
                  onChange={(e) => setModuleSearch(e.target.value)}
                />
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Module
              </Button>
            </div>

            <div className="space-y-4">
              {filteredModules.map((module, index) => {
                const completedLessons = module.lessons.filter((l) => l.completed).length;
                const progress = module.lessons.length > 0 ? Math.round((completedLessons / module.lessons.length) * 100) : 0;
                return (
                  <Card key={module.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{module.name}</CardTitle>
                            <CardDescription>
                              {module.lessons.length} lessons | {completedLessons} completed
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={progress === 100 ? "default" : "secondary"}>
                            {progress}% complete
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Progress value={progress} className="mb-4" />
                      <div className="space-y-2">
                        {module.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="flex items-center justify-between rounded-lg border p-3"
                          >
                            <div className="flex items-center gap-3">
                              {lesson.completed ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : (
                                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                              )}
                              <span className={lesson.completed ? "text-muted-foreground" : ""}>
                                {lesson.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {lesson.type}
                              </Badge>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  className="pl-9"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={studentSort === "name" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStudentSort("name")}
                >
                  Name
                </Button>
                <Button
                  variant={studentSort === "grade" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStudentSort("grade")}
                >
                  Grade
                </Button>
                <Button
                  variant={studentSort === "attendance" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStudentSort("attendance")}
                >
                  Attendance
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium">Student</th>
                        <th className="text-left p-4 font-medium">Grade</th>
                        <th className="text-left p-4 font-medium">Attendance</th>
                        <th className="text-left p-4 font-medium">Trend</th>
                        <th className="text-left p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student) => {
                        const courseData = student.courses.find((sc) => sc.courseId === courseId);
                        const grade = courseData?.grade || 0;
                        const attendance = courseData?.attendance || 0;
                        return (
                          <tr key={student.id} className="border-b last:border-b-0 hover:bg-muted/50">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                                  {student.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-medium">{student.name}</p>
                                  <p className="text-xs text-muted-foreground">{student.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge variant={grade >= 90 ? "default" : grade >= 70 ? "secondary" : "destructive"}>
                                {grade}%
                              </Badge>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Progress value={attendance} className="w-16 h-2" />
                                <span className="text-sm">{attendance}%</span>
                              </div>
                            </td>
                            <td className="p-4">
                              {grade >= 80 ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                              )}
                            </td>
                            <td className="p-4">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Attendance Summary</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Take Attendance
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Overall Rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{averageAttendance}%</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Present Today</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">28/30</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Absent Today</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Attendance History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium">Date</th>
                        <th className="text-left p-4 font-medium">Present</th>
                        <th className="text-left p-4 font-medium">Absent</th>
                        <th className="text-left p-4 font-medium">Late</th>
                        <th className="text-left p-4 font-medium">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceData.map((record, index) => (
                        <tr key={index} className="border-b last:border-b-0">
                          <td className="p-4 font-medium">{record.date}</td>
                          <td className="p-4">
                            <span className="text-green-500">{record.present}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-red-500">{record.absent}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-yellow-500">{record.late}</span>
                          </td>
                          <td className="p-4">
                            <Badge variant={record.rate >= 90 ? "default" : "secondary"}>
                              {record.rate}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Assignments</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            </div>

            <div className="space-y-4">
              {assignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{assignment.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Due: {assignment.due}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {assignment.points} points
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {assignment.submitted}/{assignment.total} submitted
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {assignment.graded} graded
                          </p>
                        </div>
                        <Progress
                          value={Math.round((assignment.submitted / assignment.total) * 100)}
                          className="w-20"
                        />
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="gradebook" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Gradebook</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Grades
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Class Average</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{averageGrade}%</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Highest Grade</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">98%</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Lowest Grade</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">52%</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Grade Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {gradeDistribution.map((dist, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{dist.range}</span>
                        <span className="text-muted-foreground">
                          {dist.count} students ({dist.percentage}%)
                        </span>
                      </div>
                      <Progress value={dist.percentage} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Trend</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {performanceTrend.map((week, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{week.week}</span>
                        <span className="text-muted-foreground">{week.avg}%</span>
                      </div>
                      <Progress value={week.avg} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Student Grades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium">Student</th>
                        {assignments.map((a) => (
                          <th key={a.id} className="text-center p-4 font-medium text-xs">
                            {a.title.split(":")[0]}
                          </th>
                        ))}
                        <th className="text-center p-4 font-medium">Final</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseStudents.slice(0, 5).map((student) => (
                        <tr key={student.id} className="border-b last:border-b-0">
                          <td className="p-4 font-medium">{student.name}</td>
                          {assignments.map((a) => (
                            <td key={a.id} className="text-center p-4">
                              {Math.floor(Math.random() * 30) + 70}
                            </td>
                          ))}
                          <td className="text-center p-4 font-bold">
                            {student.courses.find((sc) => sc.courseId === courseId)?.grade || 0}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discussions" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Discussions</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Discussion
              </Button>
            </div>

            <div className="space-y-4">
              {discussions.map((discussion) => (
                <Card key={discussion.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{discussion.title}</h4>
                            {discussion.pinned && (
                              <Badge variant="secondary" className="text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Pinned
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {discussion.replies} replies | Last active {discussion.lastActive}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Course Resources</h3>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Resource
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium">Name</th>
                        <th className="text-left p-4 font-medium">Type</th>
                        <th className="text-left p-4 font-medium">Size</th>
                        <th className="text-left p-4 font-medium">Uploaded</th>
                        <th className="text-left p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resources.map((resource) => (
                        <tr key={resource.id} className="border-b last:border-b-0 hover:bg-muted/50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <span className="font-medium">{resource.name}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className="uppercase">
                              {resource.type}
                            </Badge>
                          </td>
                          <td className="p-4 text-muted-foreground">{resource.size}</td>
                          <td className="p-4 text-muted-foreground">{resource.uploaded}</td>
                          <td className="p-4">
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <h3 className="text-lg font-semibold">Course Analytics</h3>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Student Performance Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {gradeDistribution.map((dist, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <span className="w-24 text-sm font-medium">{dist.range}</span>
                      <div className="flex-1">
                        <div className="flex h-6 items-center rounded bg-muted">
                          <div
                            className="h-full rounded bg-primary"
                            style={{ width: `${dist.percentage}%` }}
                          />
                        </div>
                      </div>
                      <span className="w-16 text-right text-sm text-muted-foreground">
                        {dist.count} ({dist.percentage}%)
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Weekly Performance Trend</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {performanceTrend.map((week, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <span className="w-20 text-sm font-medium">{week.week}</span>
                      <div className="flex-1">
                        <div className="flex h-6 items-center rounded bg-muted">
                          <div
                            className="h-full rounded bg-primary"
                            style={{ width: `${week.avg}%` }}
                          />
                        </div>
                      </div>
                      <span className="w-12 text-right text-sm text-muted-foreground">
                        {week.avg}%
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Assignment Submission Rates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {assignments.map((a) => (
                    <div key={a.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate">{a.title.split(":")[0]}</span>
                        <span className="text-muted-foreground">
                          {Math.round((a.submitted / a.total) * 100)}%
                        </span>
                      </div>
                      <Progress value={Math.round((a.submitted / a.total) * 100)} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Attendance by Day</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {attendanceData.map((record, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{record.date.split(",")[0]}</span>
                        <span className="text-muted-foreground">{record.rate}%</span>
                      </div>
                      <Progress value={record.rate} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Module Completion</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {course.modules.map((module, index) => {
                    const completed = module.lessons.filter((l) => l.completed).length;
                    const pct = module.lessons.length > 0 ? Math.round((completed / module.lessons.length) * 100) : 0;
                    return (
                      <div key={module.id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="truncate">{module.name}</span>
                          <span className="text-muted-foreground">{pct}%</span>
                        </div>
                        <Progress value={pct} />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {courseStudents
                    .sort((a, b) => {
                      const aGrade = a.courses.find((sc) => sc.courseId === courseId)?.grade || 0;
                      const bGrade = b.courses.find((sc) => sc.courseId === courseId)?.grade || 0;
                      return bGrade - aGrade;
                    })
                    .slice(0, 6)
                    .map((student, index) => {
                      const grade = student.courses.find((sc) => sc.courseId === courseId)?.grade || 0;
                      return (
                        <div key={student.id} className="flex items-center gap-3 rounded-lg border p-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-muted-foreground">{grade}%</p>
                          </div>
                          <Badge variant="default">{grade}%</Badge>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}