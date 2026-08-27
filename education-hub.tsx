"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BookOpen,
  Calendar,
  Clock,
  GraduationCap,
  Search,
  Star,
  TrendingUp,
  Users,
  Video,
  Award,
  Bell,
  Settings,
} from "lucide-react"

export default function Component() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white neo-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">EduHub</span>
              </div>
              <nav className="hidden md:flex space-x-8">
                <a href="#" className="text-blue-600 font-medium">
                  Dashboard
                </a>
                <a href="#" className="text-gray-500 hover:text-gray-900">
                  Courses
                </a>
                <a href="#" className="text-gray-500 hover:text-gray-900">
                  Progress
                </a>
                <a href="#" className="text-gray-500 hover:text-gray-900">
                  Community
                </a>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
              <Avatar>
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, John!</h1>
          <p className="text-gray-600">Continue your learning journey and explore new courses.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Courses Enrolled</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+2 from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hours Learned</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">47</div>
              <p className="text-xs text-muted-foreground">+12 from last week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Certificates</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">+1 this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Streak</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23 days</div>
              <p className="text-xs text-muted-foreground">Keep it up!</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="continue" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="continue">Continue Learning</TabsTrigger>
            <TabsTrigger value="explore">Explore Courses</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="continue" className="space-y-6">
            {/* Current Courses */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Continue Your Courses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:neo transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Video className="h-5 w-5 text-blue-600" />
                      <Badge variant="secondary">In Progress</Badge>
                    </div>
                    <CardTitle className="text-lg">React Development Masterclass</CardTitle>
                    <CardDescription>Learn modern React with hooks, context, and more</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>68%</span>
                      </div>
                      <Progress value={68} className="h-2" />
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>12 of 18 lessons</span>
                        <span>4h 30m left</span>
                      </div>
                      <Button className="w-full">Continue Learning</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:neo transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-5 w-5 text-green-600" />
                      <Badge variant="secondary">In Progress</Badge>
                    </div>
                    <CardTitle className="text-lg">Python for Data Science</CardTitle>
                    <CardDescription>Master Python libraries for data analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>34%</span>
                      </div>
                      <Progress value={34} className="h-2" />
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>8 of 24 lessons</span>
                        <span>12h 15m left</span>
                      </div>
                      <Button className="w-full">Continue Learning</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:neo transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Video className="h-5 w-5 text-purple-600" />
                      <Badge variant="secondary">In Progress</Badge>
                    </div>
                    <CardTitle className="text-lg">UI/UX Design Fundamentals</CardTitle>
                    <CardDescription>Create beautiful and functional user interfaces</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>89%</span>
                      </div>
                      <Progress value={89} className="h-2" />
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>16 of 18 lessons</span>
                        <span>1h 20m left</span>
                      </div>
                      <Button className="w-full">Continue Learning</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="explore" className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input placeholder="Search courses..." className="pl-10" />
              </div>
              <Button variant="outline">Filter</Button>
            </div>

            {/* Featured Courses */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Featured Courses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:neo transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-yellow-100 text-yellow-800">Bestseller</Badge>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">4.8</span>
                      </div>
                    </div>
                    <CardTitle className="text-lg">Machine Learning A-Z</CardTitle>
                    <CardDescription>Complete guide to machine learning algorithms</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>42 hours</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>15,420 students</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-green-600">$89</span>
                        <Button>Enroll Now</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:neo transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-blue-100 text-blue-800">New</Badge>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">4.9</span>
                      </div>
                    </div>
                    <CardTitle className="text-lg">Advanced JavaScript</CardTitle>
                    <CardDescription>Master advanced JavaScript concepts and patterns</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>28 hours</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>8,932 students</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-green-600">$79</span>
                        <Button>Enroll Now</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:neo transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-green-100 text-green-800">Free</Badge>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">4.7</span>
                      </div>
                    </div>
                    <CardTitle className="text-lg">Web Development Basics</CardTitle>
                    <CardDescription>Learn HTML, CSS, and JavaScript fundamentals</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>16 hours</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>25,678 students</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-green-600">Free</span>
                        <Button>Start Learning</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Your Achievements</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="text-center">
                  <CardHeader>
                    <Award className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
                    <CardTitle>First Course Completed</CardTitle>
                    <CardDescription>Completed your first course on EduHub</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge className="bg-yellow-100 text-yellow-800">Earned</Badge>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardHeader>
                    <TrendingUp className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                    <CardTitle>7-Day Streak</CardTitle>
                    <CardDescription>Learned for 7 consecutive days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge className="bg-blue-100 text-blue-800">Earned</Badge>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardHeader>
                    <Users className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <CardTitle>Community Helper</CardTitle>
                    <CardDescription>Helped 10 fellow students</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge className="bg-green-100 text-green-800">Earned</Badge>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Upcoming Events */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">15</div>
                  <div className="text-sm text-gray-500">Dec</div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">React Workshop: Advanced Patterns</h3>
                  <p className="text-sm text-gray-500">Live workshop with industry experts</p>
                </div>
                <Button variant="outline">Join</Button>
              </div>
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">18</div>
                  <div className="text-sm text-gray-500">Dec</div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Career Fair: Tech Companies</h3>
                  <p className="text-sm text-gray-500">Connect with top tech recruiters</p>
                </div>
                <Button variant="outline">Register</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
