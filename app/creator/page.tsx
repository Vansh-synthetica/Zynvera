"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Video, DollarSign, Star, Users, Upload, BarChart3, Award, TrendingUp, Edit, MessageSquare } from "lucide-react"

export default function CreatorPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Header />

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-green-900/20 to-blue-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            Teach & Earn
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Share your knowledge with the world. Create courses, tutor students, and build your educational brand while
            earning money.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">$2,500</div>
              <div className="text-gray-400">Average Monthly Earnings</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">50K+</div>
              <div className="text-gray-400">Students Reached</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">4.9/5</div>
              <div className="text-gray-400">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Create and Upload Lessons */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Upload className="h-8 w-8 text-blue-500" />
                <h2 className="text-3xl font-bold">Create and Upload Lessons</h2>
              </div>
              <p className="text-gray-300 text-lg mb-6">
                Our intuitive content creation tools make it easy to produce professional-quality educational content.
                Upload videos, create interactive quizzes, and build comprehensive courses.
              </p>
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-gray-300">Drag-and-drop video upload with automatic processing</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-gray-300">Built-in quiz and assessment creator</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-gray-300">AI-powered content optimization suggestions</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-gray-300">Multi-language subtitle generation</span>
                </div>
              </div>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Start Creating Content
              </Button>
            </div>
            <div className="space-y-4">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Video className="h-6 w-6 text-blue-500" />
                    <div className="flex-1">
                      <h3 className="font-semibold">Advanced React Patterns</h3>
                      <p className="text-gray-400 text-sm">12 lessons • 4.5 hours</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Published</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">1,247 enrollments</span>
                    <span className="text-green-400 font-semibold">$3,741 earned</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Video className="h-6 w-6 text-yellow-500" />
                    <div className="flex-1">
                      <h3 className="font-semibold">Python Data Science</h3>
                      <p className="text-gray-400 text-sm">8 lessons • 3.2 hours</p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">In Review</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Pending approval</span>
                    <span className="text-gray-400">Est. $2,500</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Edit className="h-6 w-6 text-purple-500" />
                    <div className="flex-1">
                      <h3 className="font-semibold">Machine Learning Basics</h3>
                      <p className="text-gray-400 text-sm">Draft • 5 lessons planned</p>
                    </div>
                    <Badge variant="outline" className="border-gray-600">
                      Draft
                    </Badge>
                  </div>
                  <Progress value={35} className="mb-2" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">35% complete</span>
                    <Button size="sm" variant="outline" className="border-gray-600">
                      Continue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Earnings and Engagement Metrics */}
      <section className="py-16 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <BarChart3 className="h-8 w-8 text-green-500" />
            <h2 className="text-3xl font-bold">Earnings & Engagement Metrics</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">$12,847</div>
                <p className="text-xs text-gray-400">+23% from last month</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-400">3,247</div>
                <p className="text-xs text-gray-400">+156 this week</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Course Rating</CardTitle>
                <Star className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-400">4.8</div>
                <p className="text-xs text-gray-400">Based on 1,247 reviews</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-400">87%</div>
                <p className="text-xs text-gray-400">Above average</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle>Monthly Earnings Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Video className="h-5 w-5 text-blue-500" />
                      <span>Course Sales</span>
                    </div>
                    <span className="font-semibold text-blue-400">$8,450</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-green-500" />
                      <span>1-on-1 Tutoring</span>
                    </div>
                    <span className="font-semibold text-green-400">$3,200</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Award className="h-5 w-5 text-purple-500" />
                      <span>Premium Content</span>
                    </div>
                    <span className="font-semibold text-purple-400">$1,197</span>
                  </div>
                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex items-center justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span className="text-green-400">$12,847</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle>Student Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Video Watch Time</span>
                      <span className="text-blue-400">92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Quiz Completion</span>
                      <span className="text-green-400">85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Discussion Participation</span>
                      <span className="text-purple-400">78%</span>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-400">4.8</div>
                      <div className="text-gray-400 text-sm">Avg. Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">247</div>
                      <div className="text-gray-400 text-sm">Reviews</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Peer Reviews and Rating System */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <Star className="h-8 w-8 text-yellow-500" />
            <h2 className="text-3xl font-bold">Peer Reviews & Rating System</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle>Recent Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="border-b border-gray-700 pb-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                          S
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">Sarah M.</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                              ))}
                            </div>
                            <span className="text-gray-400 text-sm">2 days ago</span>
                          </div>
                          <p className="text-gray-300">
                            "Excellent course! The React patterns explained here helped me land my dream job. The
                            instructor's teaching style is clear and engaging."
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                            <button className="flex items-center gap-1 hover:text-white">
                              <MessageSquare className="h-4 w-4" />
                              Reply
                            </button>
                            <span>Helpful (23)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-b border-gray-700 pb-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          M
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">Mike R.</span>
                            <div className="flex">
                              {[...Array(4)].map((_, i) => (
                                <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                              ))}
                              <Star className="h-4 w-4 text-gray-600" />
                            </div>
                            <span className="text-gray-400 text-sm">1 week ago</span>
                          </div>
                          <p className="text-gray-300">
                            "Great content overall. Would love to see more advanced examples in future lessons. The pace
                            is perfect for beginners."
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                            <button className="flex items-center gap-1 hover:text-white">
                              <MessageSquare className="h-4 w-4" />
                              Reply
                            </button>
                            <span>Helpful (15)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                          A
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">Alex K.</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                              ))}
                            </div>
                            <span className="text-gray-400 text-sm">2 weeks ago</span>
                          </div>
                          <p className="text-gray-300">
                            "This course transformed my understanding of React. The instructor responds quickly to
                            questions and provides excellent support."
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                            <button className="flex items-center gap-1 hover:text-white">
                              <MessageSquare className="h-4 w-4" />
                              Reply
                            </button>
                            <span>Helpful (31)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle>Rating Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-yellow-400 mb-2">4.8</div>
                    <div className="flex justify-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-400">Based on 1,247 reviews</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm w-8">5★</span>
                      <Progress value={78} className="flex-1 h-2" />
                      <span className="text-sm text-gray-400 w-12">78%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm w-8">4★</span>
                      <Progress value={15} className="flex-1 h-2" />
                      <span className="text-sm text-gray-400 w-12">15%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm w-8">3★</span>
                      <Progress value={5} className="flex-1 h-2" />
                      <span className="text-sm text-gray-400 w-12">5%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm w-8">2★</span>
                      <Progress value={1} className="flex-1 h-2" />
                      <span className="text-sm text-gray-400 w-12">1%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm w-8">1★</span>
                      <Progress value={1} className="flex-1 h-2" />
                      <span className="text-sm text-gray-400 w-12">1%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle>Instructor Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Response Time</span>
                      <span className="font-semibold text-green-400">&lt; 2 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Course Completion</span>
                      <span className="font-semibold text-blue-400">87%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Student Satisfaction</span>
                      <span className="font-semibold text-purple-400">96%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Repeat Students</span>
                      <span className="font-semibold text-yellow-400">43%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Apply to Become Verified Mentor */}
      <section className="py-16 bg-gray-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Award className="h-8 w-8 text-yellow-500" />
            <h2 className="text-3xl font-bold">Become a Verified Mentor</h2>
          </div>
          <p className="text-xl text-gray-300 mb-8">
            Join our elite group of verified mentors and unlock premium features, higher earnings, and exclusive
            opportunities.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Higher Earnings</h3>
                <p className="text-gray-400">Earn up to 40% more with verified mentor status</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6 text-center">
                <Star className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Priority Placement</h3>
                <p className="text-gray-400">Featured placement in course recommendations</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Exclusive Access</h3>
                <p className="text-gray-400">Access to premium tools and mentor community</p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-gray-800/30 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-gray-300">Minimum 4.5 star rating</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-gray-300">500+ students taught</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-gray-300">Professional credentials</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-gray-300">Background verification</span>
              </div>
            </div>
          </div>

          <Button
            size="lg"
            className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-lg px-8 py-4"
          >
            Apply for Verification
          </Button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-green-900/50 to-blue-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Start Creating and Earning</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of educators already building their teaching careers on our platform.
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-lg px-12 py-4"
          >
            Begin Your Teaching Journey
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  )
}
