"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Header } from "@/components/header"
import {
  Bookmark,
  Search,
  Filter,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  ArrowLeft,
  Trash2,
  FolderPlus,
  Grid3X3,
  List,
  Tag,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"

export default function BookmarksPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [viewMode, setViewMode] = useState("grid")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const [bookmarks, setBookmarks] = useState([
    {
      id: 1,
      type: "post",
      title: "Advanced Machine Learning Techniques",
      content:
        "Just finished creating a new course on Advanced Machine Learning! 🚀 What topics would you like to see covered next?",
      author: {
        name: "Dr. Sarah Chen",
        username: "@sarahchen",
        avatar: "/placeholder-user.jpg",
        verified: true,
      },
      savedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      tags: ["MachineLearning", "DataScience", "Teaching"],
      folder: "Learning Resources",
      engagement: {
        likes: 456,
        comments: 78,
        shares: 23,
        views: 1240,
      },
    },
    {
      id: 2,
      type: "article",
      title: "React 18 Concurrent Features Deep Dive",
      content:
        "A comprehensive guide to understanding React 18's new concurrent features and how they improve user experience.",
      author: {
        name: "Marcus Johnson",
        username: "@marcusdev",
        avatar: "/placeholder-user.jpg",
        verified: false,
      },
      savedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      tags: ["React", "WebDevelopment", "JavaScript"],
      folder: "Development",
      engagement: {
        likes: 234,
        comments: 45,
        shares: 12,
        views: 890,
      },
      url: "https://example.com/react-18-guide",
    },
    {
      id: 3,
      type: "video",
      title: "UX Design Principles for Mobile Apps",
      content:
        "Essential UX principles every mobile app designer should know. Covers user research, wireframing, and prototyping.",
      author: {
        name: "Emma Rodriguez",
        username: "@emmadesigns",
        avatar: "/placeholder-user.jpg",
        verified: true,
      },
      savedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      tags: ["UXDesign", "MobileDesign", "UserResearch"],
      folder: "Design Inspiration",
      engagement: {
        likes: 189,
        comments: 32,
        shares: 8,
        views: 567,
      },
      duration: "15:42",
    },
    {
      id: 4,
      type: "discussion",
      title: "AI Ethics in Modern Development",
      content:
        "How do we ensure AI systems are fair and unbiased? A deep discussion on ethical considerations in AI development.",
      author: {
        name: "Dr. Lisa Wang",
        username: "@drwang",
        avatar: "/placeholder-user.jpg",
        verified: true,
      },
      savedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      tags: ["AIEthics", "Research", "Philosophy"],
      folder: "Research Papers",
      engagement: {
        likes: 312,
        comments: 89,
        shares: 45,
        views: 1100,
      },
    },
    {
      id: 5,
      type: "project",
      title: "Open Source Learning Management System",
      content:
        "A comprehensive LMS built with React and Node.js. Features include course management, student tracking, and analytics.",
      author: {
        name: "Alex Thompson",
        username: "@alexthompson",
        avatar: "/placeholder-user.jpg",
        verified: false,
      },
      savedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      tags: ["OpenSource", "Education", "FullStack"],
      folder: "Projects",
      engagement: {
        likes: 445,
        comments: 67,
        shares: 34,
        views: 1560,
      },
      githubUrl: "https://github.com/alexthompson/lms",
    },
  ])

  const [folders] = useState([
    { name: "All Bookmarks", count: 5, color: "bg-blue-500" },
    { name: "Learning Resources", count: 1, color: "bg-green-500" },
    { name: "Development", count: 1, color: "bg-purple-500" },
    { name: "Design Inspiration", count: 1, color: "bg-pink-500" },
    { name: "Research Papers", count: 1, color: "bg-orange-500" },
    { name: "Projects", count: 1, color: "bg-cyan-500" },
  ])

  const filteredBookmarks = bookmarks.filter((bookmark) => {
    const matchesSearch =
      bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesFilter =
      selectedFilter === "all" || bookmark.type === selectedFilter || bookmark.folder === selectedFilter

    return matchesSearch && matchesFilter
  })

  const handleRemoveBookmark = (bookmarkId: number) => {
    setBookmarks(bookmarks.filter((bookmark) => bookmark.id !== bookmarkId))
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (hours < 1) return "Just now"
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return "🎥"
      case "article":
        return "📄"
      case "discussion":
        return "💬"
      case "project":
        return "🚀"
      default:
        return "ðŸ“"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Loading bookmarks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <div className="pt-20 pb-20 md:pb-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Header */}
                <div>
                  <Link href="/social">
                    <Button variant="ghost" size="sm" className="text-white/60 hover:text-white mb-4">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Social
                    </Button>
                  </Link>
                  <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Bookmark className="h-8 w-8 text-blue-500" />
                    Bookmarks
                  </h1>
                  <p className="text-white/60 mt-2">Your saved content</p>
                </div>

                {/* Folders */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-white">Folders</h3>
                      <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                        <FolderPlus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {folders.map((folder) => (
                        <button
                          key={folder.name}
                          onClick={() => setSelectedFilter(folder.name === "All Bookmarks" ? "all" : folder.name)}
                          className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${
                            (selectedFilter === "all" && folder.name === "All Bookmarks") ||
                            selectedFilter === folder.name
                              ? "bg-white/10 text-white"
                              : "text-white/70 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <div className={`w-3 h-3 rounded-full ${folder.color}`} />
                          <span className="flex-1 text-left text-sm">{folder.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {folder.count}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Filter by Type */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-white mb-4">Content Type</h3>
                    <div className="space-y-2">
                      {[
                        { id: "all", label: "All Types", count: 5 },
                        { id: "post", label: "Posts", count: 1 },
                        { id: "article", label: "Articles", count: 1 },
                        { id: "video", label: "Videos", count: 1 },
                        { id: "discussion", label: "Discussions", count: 1 },
                        { id: "project", label: "Projects", count: 1 },
                      ].map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setSelectedFilter(type.id)}
                          className={`w-full flex items-center justify-between p-2 rounded-lg transition-all ${
                            selectedFilter === type.id
                              ? "bg-white/10 text-white"
                              : "text-white/70 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <span className="text-sm">{type.label}</span>
                          <Badge variant="secondary" className="text-xs">
                            {type.count}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Search and Controls */}
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
                    <Input
                      placeholder="Search bookmarks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/60 focus:border-white/40"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className={viewMode === "grid" ? "bg-white text-black" : "text-white/60 hover:text-white"}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className={viewMode === "list" ? "bg-white text-black" : "text-white/60 hover:text-white"}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-white/60 text-sm">
                    {filteredBookmarks.length} bookmark{filteredBookmarks.length !== 1 ? "s" : ""} found
                  </p>
                  <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                    <Filter className="h-4 w-4 mr-2" />
                    Sort by Date
                  </Button>
                </div>
              </div>

              {/* Bookmarks Grid/List */}
              <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-4"}>
                {filteredBookmarks.map((bookmark) => (
                  <Card
                    key={bookmark.id}
                    className="bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all group"
                  >
                    <CardContent className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{getTypeIcon(bookmark.type)}</div>
                          <div>
                            <h3 className="font-semibold text-white line-clamp-2">{bookmark.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {bookmark.type}
                              </Badge>
                              <span className="text-white/40">•</span>
                              <span className="text-white/60 text-xs">{formatDate(bookmark.savedAt)}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveBookmark(bookmark.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-white/60 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Author */}
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={bookmark.author.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{bookmark.author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-white">{bookmark.author.name}</p>
                          <p className="text-xs text-white/60">{bookmark.author.username}</p>
                        </div>
                      </div>

                      {/* Content */}
                      <p className="text-white/80 text-sm mb-4 line-clamp-3">{bookmark.content}</p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {bookmark.tags.map((tag) => (
                          <span key={tag} className="text-blue-400 hover:text-blue-300 cursor-pointer text-xs">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Folder */}
                      <div className="flex items-center gap-2 mb-4">
                        <Tag className="h-3 w-3 text-white/60" />
                        <span className="text-white/60 text-xs">{bookmark.folder}</span>
                      </div>

                      {/* Engagement */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-white/60">
                          <span className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {bookmark.engagement.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            {bookmark.engagement.comments}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {bookmark.engagement.views}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {bookmark.url && (
                            <Button variant="ghost" size="sm" className="text-white/60 hover:text-white" asChild>
                              <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Empty State */}
              {filteredBookmarks.length === 0 && (
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                  <CardContent className="p-12 text-center">
                    <Bookmark className="h-16 w-16 text-white/40 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No bookmarks found</h3>
                    <p className="text-white/60 mb-6">
                      {searchQuery ? "Try adjusting your search terms" : "Start bookmarking content to see it here"}
                    </p>
                    <Link href="/social">
                      <Button className="bg-white text-black hover:bg-white/90">Explore Content</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
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
