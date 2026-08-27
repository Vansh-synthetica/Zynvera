"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Header } from "@/components/header"
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  MessageCircle,
  ArrowLeft,
  FlameIcon as Fire,
  Zap,
  Clock,
  Users,
  BarChart3,
  Activity,
} from "lucide-react"
import Link from "next/link"

export default function TrendingPage() {
  const [activeFilter, setActiveFilter] = useState("hot")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const [trendingData] = useState({
    hot: [
      {
        id: 1,
        type: "hashtag",
        title: "#MachineLearning",
        posts: 1240,
        growth: "+89%",
        trend: "up",
        description: "Latest developments in ML algorithms and applications",
        topPost: {
          author: "Dr. Sarah Chen",
          content: "Breakthrough in neural network optimization reduces training time by 40%",
          likes: 456,
          comments: 78,
        },
      },
      {
        id: 2,
        type: "topic",
        title: "React 18 Features",
        posts: 890,
        growth: "+76%",
        trend: "up",
        description: "Exploring concurrent features and Suspense improvements",
        topPost: {
          author: "Marcus Dev",
          content: "React 18's automatic batching is a game changer for performance",
          likes: 234,
          comments: 45,
        },
      },
      {
        id: 3,
        type: "hashtag",
        title: "#WebDevelopment",
        posts: 756,
        growth: "+12%",
        trend: "stable",
        description: "Modern web development practices and frameworks",
        topPost: {
          author: "Emma Rodriguez",
          content: "CSS Grid vs Flexbox: When to use which layout method",
          likes: 189,
          comments: 32,
        },
      },
    ],
    new: [
      {
        id: 4,
        type: "hashtag",
        title: "#AIEthics",
        posts: 423,
        growth: "+156%",
        trend: "up",
        description: "Discussions on responsible AI development",
        topPost: {
          author: "Dr. Lisa Wang",
          content: "New framework for evaluating AI bias in hiring algorithms",
          likes: 312,
          comments: 89,
        },
      },
      {
        id: 5,
        type: "topic",
        title: "Quantum Computing",
        posts: 234,
        growth: "+203%",
        trend: "up",
        description: "Latest breakthroughs in quantum computing research",
        topPost: {
          author: "Prof. James Wilson",
          content: "IBM's new quantum processor achieves 1000+ qubit milestone",
          likes: 567,
          comments: 123,
        },
      },
    ],
    declining: [
      {
        id: 6,
        type: "hashtag",
        title: "#Blockchain",
        posts: 345,
        growth: "-23%",
        trend: "down",
        description: "Blockchain technology and cryptocurrency discussions",
        topPost: {
          author: "Alex Thompson",
          content: "Ethereum 2.0 staking rewards analysis for Q4 2024",
          likes: 145,
          comments: 28,
        },
      },
    ],
  })

  const getCurrentData = () => {
    switch (activeFilter) {
      case "hot":
        return trendingData.hot
      case "new":
        return trendingData.new
      case "declining":
        return trendingData.declining
      default:
        return [...trendingData.hot, ...trendingData.new, ...trendingData.declining]
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Loading trending content...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <div className="pt-20 pb-20 md:pb-6">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Link href="/social">
                <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Social
                </Button>
              </Link>
              <div>
                <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                  <Fire className="h-8 w-8 text-orange-500" />
                  Trending
                </h1>
                <p className="text-white/60">What's happening in the learning community</p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {[
                { id: "hot", label: "Hot", icon: Fire, color: "text-orange-500" },
                { id: "new", label: "Rising", icon: Zap, color: "text-yellow-500" },
                { id: "declining", label: "Declining", icon: TrendingDown, color: "text-red-500" },
              ].map((filter) => {
                const Icon = filter.icon
                return (
                  <Button
                    key={filter.id}
                    variant={activeFilter === filter.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveFilter(filter.id)}
                    className={`flex items-center gap-2 whitespace-nowrap ${
                      activeFilter === filter.id
                        ? "bg-white text-black"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${activeFilter === filter.id ? "" : filter.color}`} />
                    {filter.label}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Trending Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardContent className="p-4 text-center">
                <Activity className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">24.5k</div>
                <div className="text-sm text-white/60">Active Discussions</div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">+89%</div>
                <div className="text-sm text-white/60">Growth This Week</div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">156k</div>
                <div className="text-sm text-white/60">Participants</div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">2.3M</div>
                <div className="text-sm text-white/60">Views Today</div>
              </CardContent>
            </Card>
          </div>

          {/* Trending Content */}
          <div className="space-y-6">
            {getCurrentData().map((item, index) => (
              <Card
                key={item.id}
                className="bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-white/10 rounded-full">
                        <span className="text-2xl font-semibold tracking-tight text-white">#{index + 1}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-2xl font-semibold tracking-tight text-white">{item.title}</h2>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${
                              item.type === "hashtag"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-green-500/20 text-green-400"
                            }`}
                          >
                            {item.type}
                          </Badge>
                        </div>
                        <p className="text-white/60 text-sm mb-2">{item.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-white/60">
                            <MessageCircle className="h-4 w-4 inline mr-1" />
                            {item.posts} posts
                          </span>
                          <div className="flex items-center gap-1">
                            {item.trend === "up" ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : item.trend === "down" ? (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-white/20" />
                            )}
                            <span
                              className={`font-medium ${
                                item.trend === "up"
                                  ? "text-green-500"
                                  : item.trend === "down"
                                    ? "text-red-500"
                                    : "text-white/60"
                              }`}
                            >
                              {item.growth}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Post Preview */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder-user.jpg" />
                        <AvatarFallback>{item.topPost.author.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-white text-sm">{item.topPost.author}</p>
                        <p className="text-white/60 text-xs">Top post</p>
                      </div>
                    </div>
                    <p className="text-white/80 text-sm mb-3">{item.topPost.content}</p>
                    <div className="flex items-center gap-4 text-sm text-white/60">
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {item.topPost.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {item.topPost.comments}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {Math.floor(Math.random() * 1000) + 500}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 mt-4">
                    <Button size="sm" className="bg-white text-black hover:bg-white/90">
                      View All Posts
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-transparent border-white/20 text-white/80 hover:bg-white/10"
                    >
                      Follow Topic
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <Button variant="outline" className="bg-transparent border-white/20 text-white/80 hover:bg-white/10">
              Load More Trending Topics
            </Button>
          </div>
        </div>
      </div>

      {/* Custom Footer */}
      <footer className="bg-gray-900/95 backdrop-blur-xl border-t border-white/10 mt-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <Link href="/" className="font-bold text-xl text-white hover:text-blue-400 transition-colors mb-4 block">
                Zynvera
              </Link>
              <p className="text-gray-400 text-sm leading-relaxed">
                AI-powered, barrier-free global classrooms for every student.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Platform</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/student-portal" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Student Portal
                  </Link>
                </li>
                <li>
                  <Link href="/school-dashboard" className="text-gray-400 hover:text-white transition-colors text-sm">
                    School Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/social" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Social
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-gray-400 hover:text-white transition-colors text-sm">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-6 text-center">
            <p className="text-gray-500 text-xs">&copy; 2026 Zynvera. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
