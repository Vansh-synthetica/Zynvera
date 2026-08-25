"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Header } from "@/components/header"
import {
  Search,
  TrendingUp,
  Users,
  Hash,
  MapPin,
  Calendar,
  MessageCircle,
  ArrowLeft,
  Globe,
  BookOpen,
  Award,
  FlameIcon as Fire,
} from "lucide-react"
import Link from "next/link"

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const [exploreData] = useState({
    trending: [
      {
        id: 1,
        type: "hashtag",
        title: "#MachineLearning",
        description: "Latest developments in ML algorithms and applications",
        posts: 1240,
        engagement: "89%",
        trend: "up",
      },
      {
        id: 2,
        type: "topic",
        title: "React 18 Features",
        description: "Exploring the new concurrent features and Suspense improvements",
        posts: 890,
        engagement: "76%",
        trend: "up",
      },
      {
        id: 3,
        type: "event",
        title: "AI Ethics Summit 2024",
        description: "Global conference on responsible AI development",
        attendees: 2500,
        date: "March 25, 2024",
        trend: "stable",
      },
    ],
    communities: [
      {
        id: 1,
        name: "Data Science Hub",
        description: "A community for data scientists, analysts, and ML engineers",
        members: 12500,
        posts: 890,
        avatar: "/placeholder.svg",
        category: "Data Science",
        isJoined: false,
      },
      {
        id: 2,
        name: "Frontend Developers",
        description: "React, Vue, Angular, and modern web development discussions",
        members: 8900,
        posts: 1240,
        avatar: "/placeholder.svg",
        category: "Web Development",
        isJoined: true,
      },
      {
        id: 3,
        name: "UX/UI Design",
        description: "Design principles, tools, and user experience discussions",
        members: 6700,
        posts: 567,
        avatar: "/placeholder.svg",
        category: "Design",
        isJoined: false,
      },
    ],
    people: [
      {
        id: 1,
        name: "Dr. Sarah Chen",
        username: "@sarahchen",
        role: "AI Research Scientist",
        followers: 15600,
        posts: 234,
        avatar: "/placeholder-user.jpg",
        verified: true,
        bio: "Leading research in ethical AI and machine learning applications",
        isFollowing: false,
      },
      {
        id: 2,
        name: "Marcus Rodriguez",
        username: "@marcusdev",
        role: "Senior Full Stack Developer",
        followers: 8900,
        posts: 456,
        avatar: "/placeholder-user.jpg",
        verified: false,
        bio: "Building scalable web applications with React and Node.js",
        isFollowing: true,
      },
      {
        id: 3,
        name: "Emma Thompson",
        username: "@emmaux",
        role: "UX Design Lead",
        followers: 12300,
        posts: 189,
        avatar: "/placeholder-user.jpg",
        verified: true,
        bio: "Creating inclusive and accessible digital experiences",
        isFollowing: false,
      },
    ],
    locations: [
      {
        id: 1,
        name: "Silicon Valley",
        country: "United States",
        posts: 5600,
        members: 23400,
        trending: ["AI", "Startups", "VentureCapital"],
      },
      {
        id: 2,
        name: "London",
        country: "United Kingdom",
        posts: 3400,
        members: 18900,
        trending: ["FinTech", "BlockChain", "DataScience"],
      },
      {
        id: 3,
        name: "Berlin",
        country: "Germany",
        posts: 2800,
        members: 15600,
        trending: ["WebDevelopment", "OpenSource", "Privacy"],
      },
    ],
  })

  const filteredContent = () => {
    switch (activeFilter) {
      case "trending":
        return exploreData.trending
      case "people":
        return exploreData.people
      case "communities":
        return exploreData.communities
      case "locations":
        return exploreData.locations
      default:
        return [...exploreData.trending, ...exploreData.people, ...exploreData.communities, ...exploreData.locations]
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Exploring content...</p>
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
                <h1 className="text-4xl font-bold text-white">Explore</h1>
                <p className="text-white/60">Discover trending topics, people, and communities</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 h-5 w-5" />
              <Input
                placeholder="Search for topics, people, communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-white/5 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 text-lg"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {[
                { id: "all", label: "All", icon: Globe },
                { id: "trending", label: "Trending", icon: Fire },
                { id: "people", label: "People", icon: Users },
                { id: "communities", label: "Communities", icon: Hash },
                { id: "locations", label: "Locations", icon: MapPin },
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
                    <Icon className="h-4 w-4" />
                    {filter.label}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Trending Topics */}
            {(activeFilter === "all" || activeFilter === "trending") &&
              exploreData.trending.map((item) => (
                <Card
                  key={item.id}
                  className="bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {item.type === "hashtag" && <Hash className="h-5 w-5 text-blue-400" />}
                        {item.type === "topic" && <BookOpen className="h-5 w-5 text-green-400" />}
                        {item.type === "event" && <Calendar className="h-5 w-5 text-purple-400" />}
                        <Badge variant="secondary" className="text-xs">
                          {item.type}
                        </Badge>
                      </div>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                    <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                    <p className="text-white/60 text-sm mb-4">{item.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        {item.posts && (
                          <span className="text-white/60">
                            <MessageCircle className="h-4 w-4 inline mr-1" />
                            {item.posts} posts
                          </span>
                        )}
                        {item.attendees && (
                          <span className="text-white/60">
                            <Users className="h-4 w-4 inline mr-1" />
                            {item.attendees} attending
                          </span>
                        )}
                      </div>
                      {item.engagement && (
                        <Badge className="bg-green-500/20 text-green-400">{item.engagement} engagement</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

            {/* People */}
            {(activeFilter === "all" || activeFilter === "people") &&
              exploreData.people.map((person) => (
                <Card
                  key={person.id}
                  className="bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={person.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{person.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white">{person.name}</h3>
                          {person.verified && <Award className="h-4 w-4 text-blue-500" />}
                        </div>
                        <p className="text-white/60 text-sm">{person.username}</p>
                        <p className="text-white/40 text-xs">{person.role}</p>
                      </div>
                    </div>
                    <p className="text-white/60 text-sm mb-4">{person.bio}</p>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4 text-sm text-white/60">
                        <span>{person.followers.toLocaleString()} followers</span>
                        <span>{person.posts} posts</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={person.isFollowing ? "outline" : "default"}
                      className={`w-full ${
                        person.isFollowing
                          ? "bg-transparent border-white/20 text-white/80 hover:bg-white/10"
                          : "bg-white text-black hover:bg-white/90"
                      }`}
                    >
                      {person.isFollowing ? "Following" : "Follow"}
                    </Button>
                  </CardContent>
                </Card>
              ))}

            {/* Communities */}
            {(activeFilter === "all" || activeFilter === "communities") &&
              exploreData.communities.map((community) => (
                <Card
                  key={community.id}
                  className="bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={community.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          <Hash className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{community.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {community.category}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-white/60 text-sm mb-4">{community.description}</p>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4 text-sm text-white/60">
                        <span>
                          <Users className="h-4 w-4 inline mr-1" />
                          {community.members.toLocaleString()} members
                        </span>
                        <span>
                          <MessageCircle className="h-4 w-4 inline mr-1" />
                          {community.posts} posts
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={community.isJoined ? "outline" : "default"}
                      className={`w-full ${
                        community.isJoined
                          ? "bg-transparent border-white/20 text-white/80 hover:bg-white/10"
                          : "bg-white text-black hover:bg-white/90"
                      }`}
                    >
                      {community.isJoined ? "Joined" : "Join Community"}
                    </Button>
                  </CardContent>
                </Card>
              ))}

            {/* Locations */}
            {(activeFilter === "all" || activeFilter === "locations") &&
              exploreData.locations.map((location) => (
                <Card
                  key={location.id}
                  className="bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <MapPin className="h-8 w-8 text-blue-400" />
                      <div>
                        <h3 className="font-semibold text-white">{location.name}</h3>
                        <p className="text-white/60 text-sm">{location.country}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white/60 mb-4">
                      <span>
                        <MessageCircle className="h-4 w-4 inline mr-1" />
                        {location.posts.toLocaleString()} posts
                      </span>
                      <span>
                        <Users className="h-4 w-4 inline mr-1" />
                        {location.members.toLocaleString()} members
                      </span>
                    </div>
                    <div className="mb-4">
                      <p className="text-white/60 text-sm mb-2">Trending:</p>
                      <div className="flex flex-wrap gap-2">
                        {location.trending.map((trend) => (
                          <Badge key={trend} variant="secondary" className="text-xs">
                            #{trend}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full bg-transparent border-white/20 text-white/80 hover:bg-white/10"
                    >
                      Explore Location
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <Button variant="outline" className="bg-transparent border-white/20 text-white/80 hover:bg-white/10">
              Load More Content
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
