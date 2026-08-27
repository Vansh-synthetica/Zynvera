"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import {
  Play,
  Search,
  Clock,
  Users,
  BookOpen,
  Brain,
  Eye,
  Hand,
  Ear,
  Star,
  Bookmark,
  MessageSquare,
  TrendingUp,
  Calendar,
  Award,
  Zap,
  ChevronRight,
  BarChart3,
  Lightbulb,
  CheckCircle,
} from "lucide-react"
import { useState } from "react"

export default function ProgressPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedTimeframe, setSelectedTimeframe] = useState("week")

  const handleSearch = () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setTimeout(() => {
      setIsSearching(false)
      setShowResults(true)
    }, 3000)
  }

  const handleComingSoon = (feature: string) => {
    alert(`${feature} - Coming Soon! 🚀

We're building amazing AI-powered features. Stay tuned!`)
  }

  // AI Search Animation Component
  const AISearchAnimation = () => (
    <div className="fixed inset-0 bg-white/95 backdrop-blur-xl z-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="relative mb-8">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
              <Brain className="h-8 w-8 text-blue-500 animate-bounce" />
            </div>
          </div>
          <div className="flex justify-center space-x-2 mb-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
        <h3 className="text-2xl font-light mb-4 text-gray-900">Analyzing Your Learning Profile</h3>
        <p className="text-gray-500 leading-relaxed">
          Matching your learning style, goals, and past performance to find the perfect lessons...
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {isSearching && <AISearchAnimation />}

      {/* Hero Section */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 animate-fade-in-up">
            <h1 className="text-5xl font-light tracking-tight mb-4" style={{ fontFamily: "DM Serif Display, serif" }}>
              Your Learning Progress
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed">
              Personalized lessons powered by AI. Tailored just for you.
            </p>
          </div>

          {/* Progress Summary Widget */}
          <Card
            className="max-w-4xl mx-auto border-0 neo-sm bg-white/80 backdrop-blur-sm animate-fade-in-up"
            style={{ animationDelay: "200ms" }}
          >
            <CardContent className="p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { label: "Courses In Progress", value: "4", icon: BookOpen, color: "from-blue-500 to-cyan-500" },
                  {
                    label: "Completed Lessons",
                    value: "17",
                    icon: CheckCircle,
                    color: "from-green-500 to-emerald-500",
                  },
                  { label: "Current Streak", value: "5 days", icon: Calendar, color: "from-purple-500 to-pink-500" },
                  { label: "Engagement Score", value: "92%", icon: TrendingUp, color: "from-orange-500 to-red-500" },
                ].map((stat, index) => {
                  const Icon = stat.icon
                  return (
                    <div
                      key={index}
                      className="text-center group cursor-pointer"
                      onClick={() => handleComingSoon(`${stat.label} Details`)}
                    >
                      <div
                        className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-2xl font-light mb-1">{stat.value}</div>
                      <div className="text-gray-500 text-sm">{stat.label}</div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Search & AI Matching Flow */}
      <section className="py-16 bg-gray-50/30">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-3xl font-light tracking-tight mb-6">Discover Your Next Lesson</h2>
            <p className="text-gray-500 leading-relaxed">
              Our AI analyzes your learning patterns to recommend the perfect content for you.
            </p>
          </div>

          <div className="relative animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="What do you want to learn today? (e.g., Newton's Laws)"
                className="pl-12 pr-24 h-14 text-lg border-0 neo bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20 rounded-2xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl px-6"
                onClick={handleSearch}
                disabled={!searchQuery.trim()}
              >
                Search
              </Button>
            </div>
          </div>

          {/* Quick Topic Suggestions */}
          <div
            className="flex flex-wrap justify-center gap-3 mt-8 animate-fade-in-up"
            style={{ animationDelay: "400ms" }}
          >
            {["Physics", "Mathematics", "Chemistry", "Biology", "Computer Science", "Literature"].map(
              (topic, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="rounded-full text-sm hover:scale-105 transition-all duration-300"
                  onClick={() => {
                    setSearchQuery(topic)
                    handleSearch()
                  }}
                >
                  {topic}
                </Button>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Learning Style Analysis */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-3xl font-light tracking-tight mb-6">Your Learning Profile</h2>
            <p className="text-gray-500 leading-relaxed">
              Based on your interactions, we've identified your optimal learning preferences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                type: "Visual Learner",
                percentage: 85,
                icon: Eye,
                color: "from-blue-500 to-cyan-500",
                description: "You learn best through diagrams, charts, and visual demonstrations.",
                tips: ["Interactive simulations", "Infographics", "Video demonstrations"],
              },
              {
                type: "Kinesthetic Learner",
                percentage: 65,
                icon: Hand,
                color: "from-green-500 to-emerald-500",
                description: "Hands-on activities and practical applications enhance your learning.",
                tips: ["Virtual labs", "Interactive exercises", "Real-world examples"],
              },
              {
                type: "Auditory Learner",
                percentage: 45,
                icon: Ear,
                color: "from-purple-500 to-pink-500",
                description: "You benefit from lectures, discussions, and audio explanations.",
                tips: ["Podcast-style lessons", "Discussion forums", "Audio summaries"],
              },
            ].map((style, index) => {
              const Icon = style.icon
              return (
                <Card
                  key={index}
                  className="border-0 neo-sm hover:neo transition-all duration-500 cursor-pointer group hover:scale-105 animate-fade-in-up relative overflow-hidden"
                  style={{ animationDelay: `${index * 200}ms` }}
                  onClick={() => handleComingSoon(`${style.type} Recommendations`)}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${style.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                  />
                  <CardHeader className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`w-10 h-10 bg-gradient-to-br ${style.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-lg font-medium">{style.type}</CardTitle>
                    </div>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Preference Strength</span>
                        <span className="font-medium">{style.percentage}%</span>
                      </div>
                      <Progress value={style.percentage} className="h-2" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-gray-500 text-sm mb-4 leading-relaxed">{style.description}</p>
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-700 mb-2">Recommended Content:</div>
                      {style.tips.map((tip, tipIndex) => (
                        <div key={tipIndex} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
                          <span className="text-xs text-gray-600">{tip}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Video Recommendations */}
      {showResults && (
        <section className="py-16 bg-gray-50/30">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-12 animate-fade-in-up">
              <h2 className="text-3xl font-light tracking-tight mb-6">Recommended for You</h2>
              <p className="text-gray-500 leading-relaxed">
                AI-curated lessons based on your search and learning profile.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {[
                {
                  title: "Understanding Newton's 3rd Law in Real Life",
                  matchScore: 95,
                  duration: "12 min",
                  level: "Moderate",
                  tags: ["Visual Learner", "Kinesthetic Boosted", "Interactive"],
                  thumbnail: "from-blue-500 to-cyan-500",
                  views: "2.3k views",
                  rating: 4.9,
                },
                {
                  title: "Physics in Action: Momentum and Collisions",
                  matchScore: 88,
                  duration: "15 min",
                  level: "Advanced",
                  tags: ["Visual Learner", "Real-world Examples", "Simulations"],
                  thumbnail: "from-purple-500 to-pink-500",
                  views: "1.8k views",
                  rating: 4.8,
                },
                {
                  title: "Interactive Force Diagrams Explained",
                  matchScore: 92,
                  duration: "10 min",
                  level: "Beginner",
                  tags: ["Visual Learner", "Step-by-step", "Practice"],
                  thumbnail: "from-green-500 to-emerald-500",
                  views: "3.1k views",
                  rating: 4.9,
                },
                {
                  title: "Newton's Laws: Virtual Lab Experience",
                  matchScore: 90,
                  duration: "18 min",
                  level: "Moderate",
                  tags: ["Kinesthetic", "Hands-on", "Virtual Lab"],
                  thumbnail: "from-orange-500 to-red-500",
                  views: "1.5k views",
                  rating: 4.7,
                },
              ].map((video, index) => (
                <Card
                  key={index}
                  className="border-0 neo-sm hover:neo transition-all duration-500 cursor-pointer group hover:scale-105 animate-fade-in-up relative overflow-hidden"
                  style={{ animationDelay: `${index * 200}ms` }}
                  onClick={() => handleComingSoon(`Watch ${video.title}`)}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${video.thumbnail} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                  />
                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-20 h-20 bg-gradient-to-br ${video.thumbnail} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Play className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-green-100 text-green-800 text-xs">🎯 {video.matchScore}% Match</Badge>
                          <Badge variant="outline" className="text-xs">
                            {video.level}
                          </Badge>
                        </div>
                        <h3 className="font-medium text-lg mb-2 leading-tight group-hover:text-gray-900 transition-colors duration-300">
                          {video.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{video.duration}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{video.views}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span>{video.rating}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {video.tags.map((tag, tagIndex) => (
                            <Badge key={tagIndex} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="bg-black text-white hover:bg-gray-800 rounded-full flex-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleComingSoon(`Watch ${video.title}`)
                            }}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Watch Now
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleComingSoon("Bookmark Video")
                            }}
                          >
                            <Bookmark className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleComingSoon("Why This Video?")
                            }}
                          >
                            <Lightbulb className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Personal Progress Graph */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="border-0 neo-sm animate-fade-in-up">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-medium">Learning Progress</CardTitle>
                    <div className="flex gap-2">
                      {["week", "month", "year"].map((period) => (
                        <Button
                          key={period}
                          size="sm"
                          variant={selectedTimeframe === period ? "default" : "outline"}
                          className="rounded-full text-xs capitalize"
                          onClick={() => setSelectedTimeframe(period)}
                        >
                          {period}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl flex items-center justify-center mb-6">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Interactive progress chart coming soon</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-light text-green-600">+15%</div>
                      <div className="text-gray-500 text-sm">Completion Rate</div>
                    </div>
                    <div>
                      <div className="text-2xl font-light text-blue-600">4.2h</div>
                      <div className="text-gray-500 text-sm">Daily Average</div>
                    </div>
                    <div>
                      <div className="text-2xl font-light text-purple-600">92%</div>
                      <div className="text-gray-500 text-sm">Retention Score</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* AI Recommendations */}
              <Card className="border-0 neo-sm animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Brain className="h-5 w-5 text-blue-500" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Boost Physics Understanding</span>
                      </div>
                      <p className="text-blue-700 text-xs leading-relaxed">
                        Based on your recent quiz scores, we recommend reviewing force diagrams before moving to
                        advanced topics.
                      </p>
                      <Button
                        size="sm"
                        className="mt-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs"
                        onClick={() => handleComingSoon("Review Force Diagrams")}
                      >
                        Start Review
                      </Button>
                    </div>
                    <div className="p-4 bg-green-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900">Achievement Unlock</span>
                      </div>
                      <p className="text-green-700 text-xs leading-relaxed">
                        You're 2 lessons away from earning the "Physics Explorer" badge!
                      </p>
                      <Button
                        size="sm"
                        className="mt-3 bg-green-600 hover:bg-green-700 text-white rounded-full text-xs"
                        onClick={() => handleComingSoon("View Badge Progress")}
                      >
                        View Progress
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Study Schedule */}
              <Card className="border-0 neo-sm animate-fade-in-up" style={{ animationDelay: "400ms" }}>
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-500" />
                    Today's Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { time: "2:00 PM", subject: "Physics Review", duration: "30 min", status: "upcoming" },
                      { time: "3:00 PM", subject: "Math Practice", duration: "45 min", status: "upcoming" },
                      { time: "4:30 PM", subject: "Chemistry Lab", duration: "60 min", status: "scheduled" },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                        onClick={() => handleComingSoon(`Join ${item.subject}`)}
                      >
                        <div className="text-sm font-medium text-gray-600 w-16">{item.time}</div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{item.subject}</div>
                          <div className="text-xs text-gray-500">{item.duration}</div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* AI Feedback Card */}
      <div className="fixed bottom-6 right-6 z-40 animate-fade-in-up" style={{ animationDelay: "1000ms" }}>
        <Button
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full neo hover:neo transition-all duration-300 hover:scale-105"
          onClick={() => handleComingSoon("AI Assistant")}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Ask AI Assistant
        </Button>
      </div>

      <Footer />
    </div>
  )
}
