"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Header } from "@/components/header"
import {
  Heart,
  MessageCircle,
  Share2,
  Users,
  TrendingUp,
  Plus,
  Award,
  Video,
  ImageIcon,
  MoreHorizontal,
  UserPlus,
  Bell,
  Search,
  Eye,
  Bookmark,
  Smile,
  PaperclipIcon,
  CheckCircle,
  Home,
  Compass,
  User,
  Settings,
  Repeat2,
  ExternalLink,
  Play,
  Calendar,
  SortDesc,
  Zap,
  FlameIcon as Fire,
  TrendingDown,
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { InstitutionGate } from "@/components/institution-workspace"

export default function SocialPage() {
  return <InstitutionGate><SocialFeed /></InstitutionGate>
}

function SocialFeed() {
  const [activeTab, setActiveTab] = useState("home")
  const [postContent, setPostContent] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("hot")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true
    const loadFeed = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase
        .from("posts")
        .select("id, content, created_at, author_id, profiles:author_id(display_name, username, avatar_url), comments(count), likes(count)")
        .order("created_at", { ascending: false })
        .limit(30)
      if (!active) return
      if (!error && data) {
        setPosts(data.map((post: any) => ({
          id: post.id,
          author: {
            name: post.profiles?.display_name || "Zynvera member",
            username: post.profiles?.username ? `@${post.profiles.username}` : "@member",
            avatar: post.profiles?.avatar_url || "/placeholder-user.jpg",
            verified: false,
            role: "Community member",
          },
          content: post.content,
          timestamp: new Date(post.created_at).toLocaleDateString(),
          likes: post.likes?.[0]?.count || 0,
          comments: post.comments?.[0]?.count || 0,
          shares: 0,
          views: 0,
          isLiked: false,
          isBookmarked: false,
          tags: [],
          type: "text" as const,
          engagement: 0,
        })))
      }
      setIsLoading(false)
    }
    loadFeed()
    return () => { active = false }
  }, [])

  const [posts, setPosts] = useState([
    {
      id: 1,
      author: {
        name: "Sarah Chen",
        username: "@sarahchen",
        avatar: "/placeholder-user.jpg",
        verified: true,
        role: "Data Science Instructor",
      },
      content:
        "Just finished creating a new course on Advanced Machine Learning! 🚀 What topics would you like to see covered next?",
      timestamp: "2h",
      likes: 234,
      comments: 18,
      shares: 12,
      views: 1240,
      isLiked: false,
      isBookmarked: false,
      tags: ["MachineLearning", "DataScience", "Teaching"],
      type: "text",
      engagement: 0.89,
    },
    {
      id: 2,
      author: {
        name: "Marcus Johnson",
        username: "@marcusdev",
        avatar: "/placeholder-user.jpg",
        verified: false,
        role: "Full Stack Developer",
      },
      content:
        "Completed my first React project today! 🎉 The journey from beginner to building real applications has been incredible.",
      timestamp: "4h",
      likes: 456,
      comments: 32,
      shares: 24,
      views: 2100,
      isLiked: true,
      isBookmarked: false,
      tags: ["React", "WebDevelopment", "Achievement"],
      type: "achievement",
      media: {
        type: "image",
        url: "/placeholder.svg",
        caption: "My first React app - a task manager!",
      },
      engagement: 0.92,
    },
    {
      id: 3,
      author: {
        name: "Dr. Lisa Wang",
        username: "@drwang",
        avatar: "/placeholder-user.jpg",
        verified: true,
        role: "AI Research Professor",
      },
      content:
        "Interesting discussion in today's AI Ethics seminar. How do we ensure AI systems are fair and unbiased? 🤔",
      timestamp: "6h",
      likes: 189,
      comments: 67,
      shares: 43,
      views: 890,
      isLiked: false,
      isBookmarked: true,
      tags: ["AIEthics", "Research", "Discussion"],
      type: "discussion",
      poll: {
        question: "What's most important in AI development?",
        options: [
          { text: "Fairness & Ethics", votes: 145, percentage: 45 },
          { text: "Performance", votes: 113, percentage: 35 },
          { text: "Transparency", votes: 65, percentage: 20 },
        ],
        totalVotes: 323,
        endsIn: "2d",
      },
      engagement: 0.76,
    },
    {
      id: 4,
      author: {
        name: "Emma Rodriguez",
        username: "@emmadesigns",
        avatar: "/placeholder-user.jpg",
        verified: false,
        role: "UX Designer",
      },
      content:
        "Just published my case study on mobile app redesign! 3 months of research, testing, and iterations. Link in bio 📱✨",
      timestamp: "1d",
      likes: 312,
      comments: 28,
      shares: 19,
      views: 1560,
      isLiked: false,
      isBookmarked: false,
      tags: ["UXDesign", "CaseStudy", "MobileDesign"],
      type: "project",
      media: {
        type: "video",
        url: "/placeholder.mp4",
        thumbnail: "/placeholder.svg",
        duration: "2:34",
      },
      engagement: 0.84,
    },
  ])

  const [trendingTopics] = useState([
    { tag: "MachineLearning", posts: 1240, trend: "up" },
    { tag: "ReactJS", posts: 890, trend: "up" },
    { tag: "WebDevelopment", posts: 756, trend: "stable" },
    { tag: "DataScience", posts: 634, trend: "up" },
    { tag: "AIEthics", posts: 423, trend: "down" },
    { tag: "UXDesign", posts: 389, trend: "up" },
  ])

  const [suggestedUsers, setSuggestedUsers] = useState([
    {
      id: 1,
      name: "Alex Thompson",
      username: "@alexthompson",
      avatar: "/placeholder-user.jpg",
      role: "Frontend Developer",
      followers: "2.1k",
      isFollowing: false,
      mutualConnections: 12,
    },
    {
      id: 2,
      name: "Maya Patel",
      username: "@mayapatel",
      avatar: "/placeholder-user.jpg",
      role: "Data Scientist",
      followers: "1.8k",
      isFollowing: false,
      mutualConnections: 8,
    },
    {
      id: 3,
      name: "James Wilson",
      username: "@jameswilson",
      avatar: "/placeholder-user.jpg",
      role: "Product Manager",
      followers: "3.2k",
      isFollowing: true,
      mutualConnections: 15,
    },
  ])

  const handleLike = async (postId: string | number) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const post = posts.find((item) => item.id === postId)
    if (!post) return
    const nextLiked = !post.isLiked
    setPosts((current) => current.map((item) => item.id === postId
      ? { ...item, isLiked: nextLiked, likes: nextLiked ? item.likes + 1 : Math.max(0, item.likes - 1) }
      : item))
    const result = nextLiked
      ? await supabase.from("likes").insert({ post_id: postId, user_id: user.id })
      : await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", user.id)
    if (result.error) {
      setPosts((current) => current.map((item) => item.id === postId
        ? { ...item, isLiked: !nextLiked, likes: nextLiked ? Math.max(0, item.likes - 1) : item.likes + 1 }
        : item))
    }
  }

  const handleBookmark = (postId: number) => {
    setPosts(posts.map((post) => (post.id === postId ? { ...post, isBookmarked: !post.isBookmarked } : post)))
  }

  const handleFollow = (userId: number) => {
    setSuggestedUsers(
      suggestedUsers.map((user) => (user.id === userId ? { ...user, isFollowing: !user.isFollowing } : user)),
    )
  }

  const handleCreatePost = async () => {
    const content = postContent.trim()
    if (!content) return

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase.from("posts").insert({ author_id: user.id, content }).select().single()
    if (error || !data) return

    const newPost = {
      id: posts.length + 1,
      author: {
        name: "Alex Johnson",
        username: "@alexjohnson",
        avatar: "/placeholder-user.jpg",
        verified: false,
        role: "Computer Science Student",
      },
      content: postContent,
      timestamp: "now",
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0,
      isLiked: false,
      isBookmarked: false,
      tags: [],
      type: "text" as const,
      engagement: 0,
    }

    setPosts([newPost, ...posts])
    setPostContent("")
  }

  const sortedPosts = [...posts].sort((a, b) => {
    switch (selectedFilter) {
      case "hot":
        return b.engagement - a.engagement
      case "new":
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      case "top":
        return b.likes - a.likes
      default:
        return 0
    }
  })

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (tab !== "home") {
      // Navigate to specific pages for other tabs
      switch (tab) {
        case "explore":
          window.location.href = "/social/explore"
          break
        case "trending":
          window.location.href = "/social/trending"
          break
        case "bookmarks":
          window.location.href = "/social/bookmarks"
          break
        case "messages":
          window.location.href = "/social/messages"
          break
        case "notifications":
          window.location.href = "/social/notifications"
          break
        case "profile":
          window.location.href = "/social/profile"
          break
        case "settings":
          window.location.href = "/social/settings"
          break
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Loading social feed...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 z-50 md:hidden">
        <div className="flex items-center justify-around py-2">
          {[
            { id: "home", icon: Home, label: "Home" },
            { id: "explore", icon: Compass, label: "Explore" },
            { id: "create", icon: Plus, label: "Create" },
            { id: "messages", icon: MessageCircle, label: "Messages" },
            { id: "profile", icon: User, label: "Profile" },
          ].map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                  activeTab === item.id ? "text-white" : "text-white/60"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="pt-20 pb-20 md:pb-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar - Desktop Only */}
            <div className="hidden lg:block lg:col-span-3">
              <div className="sticky top-24 space-y-6">
                {/* Navigation */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                  <CardContent className="p-4">
                    <nav className="space-y-2">
                      {[
                        { id: "home", icon: Home, label: "Home", count: null },
                        { id: "explore", icon: Compass, label: "Explore", count: null },
                        { id: "trending", icon: TrendingUp, label: "Trending", count: "12" },
                        { id: "bookmarks", icon: Bookmark, label: "Bookmarks", count: "5" },
                        { id: "messages", icon: MessageCircle, label: "Messages", count: "3" },
                        { id: "notifications", icon: Bell, label: "Notifications", count: "8" },
                        { id: "profile", icon: User, label: "Profile", count: null },
                        { id: "settings", icon: Settings, label: "Settings", count: null },
                      ].map((item) => {
                        const Icon = item.icon
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleTabChange(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-white/10 ${
                              activeTab === item.id ? "bg-white/10 text-white" : "text-white/70"
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="font-medium">{item.label}</span>
                            {item.count && (
                              <Badge className="ml-auto bg-blue-500 text-white text-xs">{item.count}</Badge>
                            )}
                          </button>
                        )
                      })}
                    </nav>
                  </CardContent>
                </Card>

                {/* Trending Topics */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Fire className="h-4 w-4 text-orange-500" />
                      Trending Topics
                    </h3>
                    <div className="space-y-3">
                      {trendingTopics.slice(0, 5).map((topic, index) => (
                        <div key={topic.tag} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-white/40 text-sm">#{index + 1}</span>
                            <div>
                              <p className="text-sm font-medium text-blue-400 hover:text-blue-300 cursor-pointer">
                                #{topic.tag}
                              </p>
                              <p className="text-xs text-white/60">{topic.posts} posts</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {topic.trend === "up" ? (
                              <TrendingUp className="h-3 w-3 text-green-500" />
                            ) : topic.trend === "down" ? (
                              <TrendingDown className="h-3 w-3 text-red-500" />
                            ) : (
                              <div className="w-3 h-3 rounded-full bg-white/20" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Suggested Users */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-purple-500" />
                      Who to Follow
                    </h3>
                    <div className="space-y-3">
                      {suggestedUsers.map((user) => (
                        <div key={user.id} className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.name}</p>
                            <p className="text-xs text-white/60 truncate">{user.role}</p>
                            <p className="text-xs text-white/40">{user.followers} followers</p>
                          </div>
                          <Button
                            size="sm"
                            variant={user.isFollowing ? "outline" : "default"}
                            onClick={() => handleFollow(user.id)}
                            className={`text-xs ${
                              user.isFollowing
                                ? "bg-transparent border-white/20 text-white/80 hover:bg-white/10"
                                : "bg-white text-black hover:bg-white/90"
                            }`}
                          >
                            {user.isFollowing ? "Following" : "Follow"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-6">
              <div className="space-y-6">
                {/* Create Post */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/placeholder-user.jpg" />
                        <AvatarFallback>AJ</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Textarea
                          placeholder="What's on your mind?"
                          value={postContent}
                          onChange={(e) => setPostContent(e.target.value)}
                          className="bg-transparent border-none resize-none text-white placeholder:text-white/60 focus:ring-0 p-0"
                          rows={3}
                        />
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-white/60 hover:text-white hover:bg-white/10"
                            >
                              <ImageIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-white/60 hover:text-white hover:bg-white/10"
                            >
                              <Video className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-white/60 hover:text-white hover:bg-white/10"
                            >
                              <PaperclipIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-white/60 hover:text-white hover:bg-white/10"
                            >
                              <Smile className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            onClick={handleCreatePost}
                            disabled={!postContent.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Post
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Filter Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {[
                      { id: "hot", label: "Hot", icon: Fire },
                      { id: "new", label: "New", icon: Zap },
                      { id: "top", label: "Top", icon: TrendingUp },
                    ].map((filter) => {
                      const Icon = filter.icon
                      return (
                        <Button
                          key={filter.id}
                          variant={selectedFilter === filter.id ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setSelectedFilter(filter.id)}
                          className={`${
                            selectedFilter === filter.id
                              ? "bg-white text-black"
                              : "text-white/60 hover:text-white hover:bg-white/10"
                          }`}
                        >
                          <Icon className="h-4 w-4 mr-1" />
                          {filter.label}
                        </Button>
                      )
                    })}
                  </div>
                  <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
                    <SortDesc className="h-4 w-4" />
                  </Button>
                </div>

                {/* Posts Feed */}
                <div className="space-y-4">
                  {sortedPosts.map((post) => (
                    <Card
                      key={post.id}
                      className="bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all"
                    >
                      <CardContent className="p-0">
                        {/* Post Header */}
                        <div className="flex items-center justify-between p-4 pb-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={post.author.avatar || "/placeholder.svg"} />
                              <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white">{post.author.name}</span>
                                {post.author.verified && <CheckCircle className="h-4 w-4 text-blue-500" />}
                                <span className="text-white/60 text-sm">{post.author.username}</span>
                                <span className="text-white/40">•</span>
                                <span className="text-white/60 text-sm">{post.timestamp}</span>
                              </div>
                              <p className="text-xs text-white/60">{post.author.role}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-white/60 hover:text-white hover:bg-white/10"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Post Content */}
                        <div className="px-4 pb-3">
                          <p className="text-white leading-relaxed">{post.content}</p>

                          {/* Tags */}
                          {post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {post.tags.map((tag) => (
                                <span key={tag} className="text-blue-400 hover:text-blue-300 cursor-pointer text-sm">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Media */}
                        {post.media && (
                          <div className="px-4 pb-3">
                            {post.media.type === "image" ? (
                              <div className="rounded-xl overflow-hidden bg-white/5">
                                <img
                                  src={post.media.url || "/placeholder.svg"}
                                  alt={post.media.caption}
                                  className="w-full h-64 object-cover"
                                />
                              </div>
                            ) : post.media.type === "video" ? (
                              <div className="relative rounded-xl overflow-hidden bg-white/5">
                                <img
                                  src={post.media.thumbnail || "/placeholder.svg"}
                                  alt="Video thumbnail"
                                  className="w-full h-64 object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Button className="bg-black/50 hover:bg-black/70 text-white rounded-full w-16 h-16">
                                    <Play className="h-6 w-6 ml-1" />
                                  </Button>
                                </div>
                                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                  {post.media.duration}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        )}

                        {/* Poll */}
                        {post.poll && (
                          <div className="px-4 pb-3">
                            <div className="bg-white/5 rounded-xl p-4">
                              <h4 className="font-medium text-white mb-3">{post.poll.question}</h4>
                              <div className="space-y-2">
                                {post.poll.options.map((option, index) => (
                                  <div
                                    key={index}
                                    className="relative bg-white/5 rounded-lg p-3 cursor-pointer hover:bg-white/10 transition-colors"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-white text-sm">{option.text}</span>
                                      <span className="text-white/60 text-sm font-medium">{option.percentage}%</span>
                                    </div>
                                    <div className="mt-2 bg-white/10 rounded-full h-1">
                                      <div
                                        className="bg-blue-500 h-1 rounded-full transition-all"
                                        style={{ width: `${option.percentage}%` }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="flex items-center justify-between mt-3 text-xs text-white/60">
                                <span>{post.poll.totalVotes} votes</span>
                                <span>Ends in {post.poll.endsIn}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Achievement Badge */}
                        {post.type === "achievement" && (
                          <div className="px-4 pb-3">
                            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-3">
                              <div className="flex items-center gap-2">
                                <Award className="h-5 w-5 text-yellow-500" />
                                <span className="text-yellow-400 font-medium">Achievement Unlocked!</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Post Actions */}
                        <div className="px-4 py-3 border-t border-white/10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                              <button
                                onClick={() => handleLike(post.id)}
                                className={`flex items-center gap-2 transition-colors ${
                                  post.isLiked ? "text-red-500" : "text-white/60 hover:text-red-500"
                                }`}
                              >
                                <Heart className={`h-5 w-5 ${post.isLiked ? "fill-current" : ""}`} />
                                <span className="text-sm">{post.likes}</span>
                              </button>
                              <button className="flex items-center gap-2 text-white/60 hover:text-blue-500 transition-colors">
                                <MessageCircle className="h-5 w-5" />
                                <span className="text-sm">{post.comments}</span>
                              </button>
                              <button className="flex items-center gap-2 text-white/60 hover:text-green-500 transition-colors">
                                <Repeat2 className="h-5 w-5" />
                                <span className="text-sm">{post.shares}</span>
                              </button>
                              <button className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                                <Eye className="h-5 w-5" />
                                <span className="text-sm">{post.views}</span>
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleBookmark(post.id)}
                                className={`p-2 rounded-full transition-colors ${
                                  post.isBookmarked ? "text-blue-500" : "text-white/60 hover:text-blue-500"
                                }`}
                              >
                                <Bookmark className={`h-4 w-4 ${post.isBookmarked ? "fill-current" : ""}`} />
                              </button>
                              <button className="p-2 rounded-full text-white/60 hover:text-white transition-colors">
                                <Share2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Sidebar - Desktop Only */}
            <div className="hidden lg:block lg:col-span-3">
              <div className="sticky top-24 space-y-6">
                {/* Search */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                  <CardContent className="p-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
                      <Input
                        placeholder="Search posts, people, topics..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/60 focus:border-white/40"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4 text-white">Your Activity</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white/60 text-sm">Posts</span>
                        <span className="text-white font-medium">127</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/60 text-sm">Followers</span>
                        <span className="text-white font-medium">1.2k</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/60 text-sm">Following</span>
                        <span className="text-white font-medium">456</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/60 text-sm">Likes Received</span>
                        <span className="text-white font-medium">8.9k</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4 text-white">Recent Activity</h3>
                    <div className="space-y-3">
                      {[
                        { action: "liked", user: "Sarah Chen", content: "your post about React", time: "2m" },
                        { action: "commented on", user: "Marcus Dev", content: "your ML project", time: "5m" },
                        { action: "started following", user: "Emma Rodriguez", content: "you", time: "1h" },
                        { action: "shared", user: "Dr. Wang", content: "your discussion", time: "2h" },
                      ].map((activity, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-white/80">
                              <span className="font-medium text-white">{activity.user}</span> {activity.action}{" "}
                              <span className="text-blue-400">{activity.content}</span>
                            </p>
                            <p className="text-xs text-white/60 mt-1">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Links */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4 text-white">Quick Links</h3>
                    <div className="space-y-2">
                      {[
                        { label: "Study Groups", href: "/social/groups", icon: Users },
                        { label: "Events", href: "/social/events", icon: Calendar },
                        { label: "Messages", href: "/social/messages", icon: MessageCircle },
                        { label: "Profiles", href: "/social/profiles", icon: User },
                      ].map((link) => {
                        const Icon = link.icon
                        return (
                          <Link
                            key={link.label}
                            href={link.href}
                            className="flex items-center gap-3 p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
                          >
                            <Icon className="h-4 w-4" />
                            <span className="text-sm">{link.label}</span>
                            <ExternalLink className="h-3 w-3 ml-auto" />
                          </Link>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Footer for Social Pages */}
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
