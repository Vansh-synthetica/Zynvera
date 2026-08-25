"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  Users,
  MessageCircle,
  UserPlus,
  UserCheck,
  Heart,
  Share2,
  Eye,
  Star,
  Clock,
  CheckCircle,
  ExternalLink,
  Github,
  Linkedin,
  Twitter,
  Globe,
  Mail,
  MoreHorizontal,
  Flag,
  BlocksIcon as Block,
  Send,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"

interface User {
  id: string
  name: string
  avatar: string
  role: string
  university: string
  location: string
  bio: string
  joinedDate: Date
  isOnline: boolean
  lastSeen?: Date
  connectionStatus: "none" | "following" | "friend" | "pending" | "requested"
  followers: number
  following: number
  mutualConnections: number
  skills: string[]
  achievements: Achievement[]
  courses: Course[]
  projects: Project[]
  stats: UserStats
  socialLinks: SocialLinks
  isVerified: boolean
  isPremium: boolean
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  earnedDate: Date
  rarity: "common" | "rare" | "epic" | "legendary"
}

interface Course {
  id: string
  title: string
  progress: number
  status: "completed" | "in-progress" | "not-started"
  grade?: string
  completedDate?: Date
}

interface Project {
  id: string
  title: string
  description: string
  image: string
  technologies: string[]
  likes: number
  views: number
  createdDate: Date
  isLiked: boolean
  link?: string
}

interface UserStats {
  totalPoints: number
  rank: number
  streakDays: number
  coursesCompleted: number
  projectsCreated: number
  helpfulAnswers: number
}

interface SocialLinks {
  github?: string
  linkedin?: string
  twitter?: string
  website?: string
  email?: string
  phone?: string
}

export default function ProfilesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [sortBy, setSortBy] = useState("relevance")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  const currentUser = {
    id: "current-user",
    name: "Alex Johnson",
    following: ["sarah-chen", "emma-rodriguez"],
    friends: ["marcus-johnson"],
    pendingRequests: ["david-park"],
  }

  const [users, setUsers] = useState<User[]>([
    {
      id: "sarah-chen",
      name: "Sarah Chen",
      avatar: "/placeholder-user.jpg",
      role: "Data Science Instructor",
      university: "Stanford University",
      location: "San Francisco, CA",
      bio: "Passionate about machine learning and AI ethics. Teaching the next generation of data scientists. Always excited to collaborate on innovative projects!",
      joinedDate: new Date("2022-01-15"),
      isOnline: true,
      connectionStatus: "following",
      followers: 1247,
      following: 389,
      mutualConnections: 23,
      skills: ["Machine Learning", "Python", "TensorFlow", "Data Analysis", "Statistics", "Deep Learning"],
      achievements: [
        {
          id: "1",
          title: "ML Expert",
          description: "Completed advanced machine learning specialization",
          icon: "🤖",
          earnedDate: new Date("2023-06-15"),
          rarity: "epic",
        },
        {
          id: "2",
          title: "Top Contributor",
          description: "Helped 100+ students with their projects",
          icon: "🏆",
          earnedDate: new Date("2023-08-20"),
          rarity: "legendary",
        },
      ],
      courses: [
        {
          id: "1",
          title: "Advanced Machine Learning",
          progress: 100,
          status: "completed",
          grade: "A+",
          completedDate: new Date("2023-06-15"),
        },
        {
          id: "2",
          title: "Deep Learning Specialization",
          progress: 85,
          status: "in-progress",
        },
      ],
      projects: [
        {
          id: "1",
          title: "AI-Powered Study Assistant",
          description: "An intelligent tutoring system that adapts to individual learning styles",
          image: "/placeholder.svg",
          technologies: ["Python", "TensorFlow", "React", "Node.js"],
          likes: 156,
          views: 2341,
          createdDate: new Date("2023-09-10"),
          isLiked: true,
          link: "https://github.com/sarahchen/ai-tutor",
        },
        {
          id: "2",
          title: "Student Performance Predictor",
          description: "ML model to predict student success and identify at-risk learners",
          image: "/placeholder.svg",
          technologies: ["Python", "Scikit-learn", "Pandas", "Flask"],
          likes: 89,
          views: 1205,
          createdDate: new Date("2023-07-22"),
          isLiked: false,
        },
      ],
      stats: {
        totalPoints: 15420,
        rank: 3,
        streakDays: 45,
        coursesCompleted: 12,
        projectsCreated: 8,
        helpfulAnswers: 234,
      },
      socialLinks: {
        github: "https://github.com/sarahchen",
        linkedin: "https://linkedin.com/in/sarahchen",
        twitter: "https://twitter.com/sarahchen_ml",
        website: "https://sarahchen.dev",
        email: "sarah.chen@stanford.edu",
      },
      isVerified: true,
      isPremium: true,
    },
    {
      id: "marcus-johnson",
      name: "Marcus Johnson",
      avatar: "/placeholder-user.jpg",
      role: "Full Stack Developer",
      university: "MIT",
      location: "Boston, MA",
      bio: "Full-stack developer with a passion for creating scalable web applications. Love mentoring junior developers and contributing to open source.",
      joinedDate: new Date("2021-09-20"),
      isOnline: false,
      lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000),
      connectionStatus: "friend",
      followers: 892,
      following: 445,
      mutualConnections: 18,
      skills: ["React", "Node.js", "TypeScript", "MongoDB", "AWS", "Docker"],
      achievements: [
        {
          id: "3",
          title: "Code Mentor",
          description: "Mentored 50+ junior developers",
          icon: "👨‍🏫",
          earnedDate: new Date("2023-05-10"),
          rarity: "rare",
        },
      ],
      courses: [
        {
          id: "3",
          title: "Full Stack Web Development",
          progress: 100,
          status: "completed",
          grade: "A",
          completedDate: new Date("2023-04-20"),
        },
      ],
      projects: [
        {
          id: "3",
          title: "Learning Management System",
          description: "A comprehensive LMS built with React and Node.js",
          image: "/placeholder.svg",
          technologies: ["React", "Node.js", "MongoDB", "Socket.io"],
          likes: 203,
          views: 3456,
          createdDate: new Date("2023-08-15"),
          isLiked: false,
          link: "https://github.com/marcusj/lms",
        },
      ],
      stats: {
        totalPoints: 12890,
        rank: 7,
        streakDays: 28,
        coursesCompleted: 9,
        projectsCreated: 12,
        helpfulAnswers: 156,
      },
      socialLinks: {
        github: "https://github.com/marcusj",
        linkedin: "https://linkedin.com/in/marcusjohnson",
      },
      isVerified: false,
      isPremium: false,
    },
    {
      id: "emma-rodriguez",
      name: "Emma Rodriguez",
      avatar: "/placeholder-user.jpg",
      role: "UX Designer",
      university: "Carnegie Mellon",
      location: "Pittsburgh, PA",
      bio: "UX designer passionate about creating inclusive and accessible digital experiences. Currently exploring the intersection of AI and design.",
      joinedDate: new Date("2022-03-10"),
      isOnline: true,
      connectionStatus: "following",
      followers: 654,
      following: 298,
      mutualConnections: 12,
      skills: ["UI/UX Design", "Figma", "User Research", "Prototyping", "Design Systems", "Accessibility"],
      achievements: [
        {
          id: "4",
          title: "Design Innovator",
          description: "Created award-winning design solutions",
          icon: "🎨",
          earnedDate: new Date("2023-07-05"),
          rarity: "epic",
        },
      ],
      courses: [
        {
          id: "4",
          title: "UX Design Fundamentals",
          progress: 100,
          status: "completed",
          grade: "A+",
          completedDate: new Date("2023-03-15"),
        },
        {
          id: "5",
          title: "Advanced Prototyping",
          progress: 60,
          status: "in-progress",
        },
      ],
      projects: [
        {
          id: "4",
          title: "Accessible Learning Platform",
          description: "Redesigned learning platform with focus on accessibility",
          image: "/placeholder.svg",
          technologies: ["Figma", "React", "ARIA", "WCAG"],
          likes: 178,
          views: 2890,
          createdDate: new Date("2023-09-01"),
          isLiked: true,
        },
      ],
      stats: {
        totalPoints: 9870,
        rank: 15,
        streakDays: 22,
        coursesCompleted: 6,
        projectsCreated: 15,
        helpfulAnswers: 89,
      },
      socialLinks: {
        linkedin: "https://linkedin.com/in/emmarodriguez",
        website: "https://emmarodriguez.design",
      },
      isVerified: true,
      isPremium: false,
    },
    {
      id: "david-park",
      name: "David Park",
      avatar: "/placeholder-user.jpg",
      role: "AI Researcher",
      university: "UC Berkeley",
      location: "Berkeley, CA",
      bio: "PhD candidate researching natural language processing and conversational AI. Interested in making AI more human-like and accessible.",
      joinedDate: new Date("2021-11-05"),
      isOnline: false,
      lastSeen: new Date(Date.now() - 4 * 60 * 60 * 1000),
      connectionStatus: "pending",
      followers: 423,
      following: 167,
      mutualConnections: 8,
      skills: ["Natural Language Processing", "PyTorch", "Research", "Academic Writing", "Python", "Transformers"],
      achievements: [
        {
          id: "5",
          title: "Research Pioneer",
          description: "Published groundbreaking research in AI",
          icon: "🔬",
          earnedDate: new Date("2023-04-12"),
          rarity: "legendary",
        },
      ],
      courses: [
        {
          id: "6",
          title: "Advanced NLP",
          progress: 100,
          status: "completed",
          grade: "A+",
          completedDate: new Date("2023-05-20"),
        },
      ],
      projects: [
        {
          id: "5",
          title: "Conversational AI Tutor",
          description: "AI-powered tutor that can engage in natural conversations",
          image: "/placeholder.svg",
          technologies: ["PyTorch", "Transformers", "Python", "FastAPI"],
          likes: 267,
          views: 4123,
          createdDate: new Date("2023-06-30"),
          isLiked: false,
          link: "https://github.com/davidpark/ai-tutor",
        },
      ],
      stats: {
        totalPoints: 18750,
        rank: 1,
        streakDays: 67,
        coursesCompleted: 15,
        projectsCreated: 6,
        helpfulAnswers: 345,
      },
      socialLinks: {
        github: "https://github.com/davidpark",
        linkedin: "https://linkedin.com/in/davidpark-ai",
        website: "https://davidpark.ai",
      },
      isVerified: true,
      isPremium: true,
    },
  ])

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.university.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.skills.some((skill) => skill.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesFilter =
      selectedFilter === "all" ||
      (selectedFilter === "following" && user.connectionStatus === "following") ||
      (selectedFilter === "friends" && user.connectionStatus === "friend") ||
      (selectedFilter === "online" && user.isOnline) ||
      (selectedFilter === "verified" && user.isVerified)

    return matchesSearch && matchesFilter
  })

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name)
      case "rank":
        return a.stats.rank - b.stats.rank
      case "points":
        return b.stats.totalPoints - a.stats.totalPoints
      case "joined":
        return b.joinedDate.getTime() - a.joinedDate.getTime()
      default:
        return b.stats.totalPoints - a.stats.totalPoints
    }
  })

  const handleConnectionAction = (userId: string, action: string) => {
    setUsers(
      users.map((user) => {
        if (user.id !== userId) return user

        switch (action) {
          case "follow":
            return {
              ...user,
              connectionStatus: "following" as const,
              followers: user.followers + 1,
            }
          case "unfollow":
            return {
              ...user,
              connectionStatus: "none" as const,
              followers: user.followers - 1,
            }
          case "add-friend":
            return {
              ...user,
              connectionStatus: "requested" as const,
            }
          case "accept-friend":
            return {
              ...user,
              connectionStatus: "friend" as const,
            }
          case "remove-friend":
            return {
              ...user,
              connectionStatus: "none" as const,
            }
          default:
            return user
        }
      }),
    )
  }

  const handleProjectLike = (userId: string, projectId: string) => {
    setUsers(
      users.map((user) => {
        if (user.id !== userId) return user
        return {
          ...user,
          projects: user.projects.map((project) => {
            if (project.id !== projectId) return project
            return {
              ...project,
              isLiked: !project.isLiked,
              likes: project.isLiked ? project.likes - 1 : project.likes + 1,
            }
          }),
        }
      }),
    )
  }

  const getConnectionButton = (user: User) => {
    switch (user.connectionStatus) {
      case "none":
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => handleConnectionAction(user.id, "follow")}>
              <UserPlus className="h-4 w-4 mr-1" />
              Follow
            </Button>
            <Button size="sm" onClick={() => handleConnectionAction(user.id, "add-friend")}>
              <Users className="h-4 w-4 mr-1" />
              Add Friend
            </Button>
          </div>
        )
      case "following":
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => handleConnectionAction(user.id, "unfollow")}>
              <UserCheck className="h-4 w-4 mr-1" />
              Following
            </Button>
            <Button size="sm" onClick={() => handleConnectionAction(user.id, "add-friend")}>
              <Users className="h-4 w-4 mr-1" />
              Add Friend
            </Button>
          </div>
        )
      case "friend":
        return (
          <Button size="sm" variant="outline" onClick={() => handleConnectionAction(user.id, "remove-friend")}>
            <UserCheck className="h-4 w-4 mr-1" />
            Friends
          </Button>
        )
      case "pending":
        return (
          <Button size="sm" onClick={() => handleConnectionAction(user.id, "accept-friend")}>
            <UserCheck className="h-4 w-4 mr-1" />
            Accept Request
          </Button>
        )
      case "requested":
        return (
          <Button size="sm" variant="outline" disabled>
            <Clock className="h-4 w-4 mr-1" />
            Requested
          </Button>
        )
      default:
        return null
    }
  }

  const getRarityColor = (rarity: Achievement["rarity"]) => {
    switch (rarity) {
      case "common":
        return "bg-gray-100 text-gray-800"
      case "rare":
        return "bg-blue-100 text-blue-800"
      case "epic":
        return "bg-purple-100 text-purple-800"
      case "legendary":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatLastSeen = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (hours < 1) return "Active now"
    if (hours < 24) return `Active ${hours}h ago`
    return `Active ${days}d ago`
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <Header />

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Student Profiles
              </h1>
              <p className="text-lg text-muted-foreground">Discover and connect with fellow learners</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/social/messages">
                <Button variant="outline">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Messages
                </Button>
              </Link>
              <Link href="/social">
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Social Hub
                </Button>
              </Link>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name, role, university, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="following">Following</SelectItem>
                  <SelectItem value="friends">Friends</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="rank">Rank</SelectItem>
                  <SelectItem value="points">Points</SelectItem>
                  <SelectItem value="joined">Recently Joined</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* User Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedUsers.map((user, index) => (
            <Card
              key={user.id}
              className="hover:shadow-xl transition-all duration-500 group hover:scale-[1.02] animate-fade-in-up border-0 shadow-md bg-white/80 backdrop-blur-sm"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {user.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{user.name}</h3>
                        {user.isVerified && <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />}
                        {user.isPremium && <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{user.role}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.university}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Send Message
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Profile
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Flag className="h-4 w-4 mr-2" />
                        Report User
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Block className="h-4 w-4 mr-2" />
                        Block User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">{user.bio}</p>
                </div>

                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{user.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Joined {formatDate(user.joinedDate)}</span>
                  </div>
                </div>

                {!user.isOnline && user.lastSeen && (
                  <p className="text-xs text-muted-foreground mt-2">{formatLastSeen(user.lastSeen)}</p>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-primary">#{user.stats.rank}</div>
                    <div className="text-xs text-muted-foreground">Rank</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{user.stats.totalPoints.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Points</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{user.stats.streakDays}</div>
                    <div className="text-xs text-muted-foreground">Day Streak</div>
                  </div>
                </div>

                <Separator />

                {/* Connection Stats */}
                <div className="flex justify-between text-sm">
                  <span>{user.followers} followers</span>
                  <span>{user.following} following</span>
                  {user.mutualConnections > 0 && <span className="text-primary">{user.mutualConnections} mutual</span>}
                </div>

                {/* Skills Preview */}
                <div>
                  <div className="flex flex-wrap gap-1">
                    {user.skills.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {user.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{user.skills.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {getConnectionButton(user)}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                      <DialogHeader>
                        <DialogTitle>Profile Details</DialogTitle>
                        <DialogDescription>View detailed information about {user.name}</DialogDescription>
                      </DialogHeader>
                      {selectedUser && (
                        <ScrollArea className="h-[70vh] pr-4">
                          <div className="space-y-6">
                            {/* Profile Header */}
                            <div className="flex items-start gap-4">
                              <div className="relative">
                                <Avatar className="h-20 w-20">
                                  <AvatarImage src={selectedUser.avatar || "/placeholder.svg"} />
                                  <AvatarFallback className="text-2xl">{selectedUser.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {selectedUser.isOnline && (
                                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-background rounded-full" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h2 className="text-2xl font-bold">{selectedUser.name}</h2>
                                  {selectedUser.isVerified && <CheckCircle className="h-5 w-5 text-blue-500" />}
                                  {selectedUser.isPremium && <Star className="h-5 w-5 text-yellow-500" />}
                                </div>
                                <p className="text-lg text-muted-foreground mb-1">{selectedUser.role}</p>
                                <p className="text-muted-foreground mb-2">{selectedUser.university}</p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {selectedUser.location}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    Joined {formatDate(selectedUser.joinedDate)}
                                  </div>
                                </div>
                                <p className="text-sm mb-4">{selectedUser.bio}</p>
                                <div className="flex gap-2">
                                  {getConnectionButton(selectedUser)}
                                  <Link href="/social/messages">
                                    <Button size="sm" variant="outline">
                                      <Send className="h-4 w-4 mr-1" />
                                      Message
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            </div>

                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                              <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="projects">Projects</TabsTrigger>
                                <TabsTrigger value="achievements">Achievements</TabsTrigger>
                                <TabsTrigger value="activity">Activity</TabsTrigger>
                              </TabsList>

                              <TabsContent value="overview" className="space-y-6">
                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <Card>
                                    <CardContent className="p-4 text-center">
                                      <div className="text-2xl font-bold text-primary">#{selectedUser.stats.rank}</div>
                                      <div className="text-sm text-muted-foreground">Global Rank</div>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardContent className="p-4 text-center">
                                      <div className="text-2xl font-bold">
                                        {selectedUser.stats.totalPoints.toLocaleString()}
                                      </div>
                                      <div className="text-sm text-muted-foreground">Total Points</div>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardContent className="p-4 text-center">
                                      <div className="text-2xl font-bold">{selectedUser.stats.streakDays}</div>
                                      <div className="text-sm text-muted-foreground">Day Streak</div>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardContent className="p-4 text-center">
                                      <div className="text-2xl font-bold">{selectedUser.stats.coursesCompleted}</div>
                                      <div className="text-sm text-muted-foreground">Courses Done</div>
                                    </CardContent>
                                  </Card>
                                </div>

                                {/* Skills */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">Skills & Expertise</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                      {selectedUser.skills.map((skill, index) => (
                                        <Badge key={index} variant="secondary">
                                          {skill}
                                        </Badge>
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Courses */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">Course Progress</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    {selectedUser.courses.map((course) => (
                                      <div key={course.id} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <h4 className="font-medium">{course.title}</h4>
                                          <div className="flex items-center gap-2">
                                            {course.grade && (
                                              <Badge className="bg-green-100 text-green-800">{course.grade}</Badge>
                                            )}
                                            <Badge
                                              className={
                                                course.status === "completed"
                                                  ? "bg-green-100 text-green-800"
                                                  : course.status === "in-progress"
                                                    ? "bg-blue-100 text-blue-800"
                                                    : "bg-gray-100 text-gray-800"
                                              }
                                            >
                                              {course.status === "completed"
                                                ? "Completed"
                                                : course.status === "in-progress"
                                                  ? "In Progress"
                                                  : "Not Started"}
                                            </Badge>
                                          </div>
                                        </div>
                                        <Progress value={course.progress} className="h-2" />
                                        <div className="flex justify-between text-sm text-muted-foreground">
                                          <span>{course.progress}% complete</span>
                                          {course.completedDate && (
                                            <span>Completed {formatDate(course.completedDate)}</span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </CardContent>
                                </Card>

                                {/* Social Links */}
                                {Object.keys(selectedUser.socialLinks).length > 0 && (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg">Connect</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="flex flex-wrap gap-2">
                                        {selectedUser.socialLinks.github && (
                                          <Button variant="outline" size="sm" asChild>
                                            <a
                                              href={selectedUser.socialLinks.github}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                            >
                                              <Github className="h-4 w-4 mr-2" />
                                              GitHub
                                            </a>
                                          </Button>
                                        )}
                                        {selectedUser.socialLinks.linkedin && (
                                          <Button variant="outline" size="sm" asChild>
                                            <a
                                              href={selectedUser.socialLinks.linkedin}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                            >
                                              <Linkedin className="h-4 w-4 mr-2" />
                                              LinkedIn
                                            </a>
                                          </Button>
                                        )}
                                        {selectedUser.socialLinks.twitter && (
                                          <Button variant="outline" size="sm" asChild>
                                            <a
                                              href={selectedUser.socialLinks.twitter}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                            >
                                              <Twitter className="h-4 w-4 mr-2" />
                                              Twitter
                                            </a>
                                          </Button>
                                        )}
                                        {selectedUser.socialLinks.website && (
                                          <Button variant="outline" size="sm" asChild>
                                            <a
                                              href={selectedUser.socialLinks.website}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                            >
                                              <Globe className="h-4 w-4 mr-2" />
                                              Website
                                            </a>
                                          </Button>
                                        )}
                                        {selectedUser.socialLinks.email && (
                                          <Button variant="outline" size="sm" asChild>
                                            <a href={`mailto:${selectedUser.socialLinks.email}`}>
                                              <Mail className="h-4 w-4 mr-2" />
                                              Email
                                            </a>
                                          </Button>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}
                              </TabsContent>

                              <TabsContent value="projects" className="space-y-4">
                                {selectedUser.projects.map((project) => (
                                  <Card key={project.id}>
                                    <CardContent className="p-6">
                                      <div className="flex items-start gap-4">
                                        <img
                                          src={project.image || "/placeholder.svg"}
                                          alt={project.title}
                                          className="w-16 h-16 rounded-lg object-cover"
                                        />
                                        <div className="flex-1">
                                          <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-semibold text-lg">{project.title}</h3>
                                            {project.link && (
                                              <Button variant="ghost" size="sm" asChild>
                                                <a href={project.link} target="_blank" rel="noopener noreferrer">
                                                  <ExternalLink className="h-4 w-4" />
                                                </a>
                                              </Button>
                                            )}
                                          </div>
                                          <p className="text-muted-foreground mb-3">{project.description}</p>
                                          <div className="flex flex-wrap gap-1 mb-3">
                                            {project.technologies.map((tech, index) => (
                                              <Badge key={index} variant="outline" className="text-xs">
                                                {tech}
                                              </Badge>
                                            ))}
                                          </div>
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                              <div className="flex items-center gap-1">
                                                <Heart
                                                  className={`h-4 w-4 cursor-pointer ${
                                                    project.isLiked ? "fill-red-500 text-red-500" : ""
                                                  }`}
                                                  onClick={() => handleProjectLike(selectedUser.id, project.id)}
                                                />
                                                {project.likes}
                                              </div>
                                              <div className="flex items-center gap-1">
                                                <Eye className="h-4 w-4" />
                                                {project.views}
                                              </div>
                                            </div>
                                            <span className="text-sm text-muted-foreground">
                                              {formatDate(project.createdDate)}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </TabsContent>

                              <TabsContent value="achievements" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {selectedUser.achievements.map((achievement) => (
                                    <Card key={achievement.id}>
                                      <CardContent className="p-6">
                                        <div className="flex items-start gap-4">
                                          <div className="text-3xl">{achievement.icon}</div>
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                              <h3 className="font-semibold">{achievement.title}</h3>
                                              <Badge className={getRarityColor(achievement.rarity)}>
                                                {achievement.rarity}
                                              </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2">
                                              {achievement.description}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              Earned {formatDate(achievement.earnedDate)}
                                            </p>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </TabsContent>

                              <TabsContent value="activity" className="space-y-4">
                                <Card>
                                  <CardContent className="p-6 text-center">
                                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="font-semibold mb-2">Activity Timeline</h3>
                                    <p className="text-muted-foreground">
                                      Activity timeline feature coming soon. This will show recent actions, course
                                      completions, and social interactions.
                                    </p>
                                  </CardContent>
                                </Card>
                              </TabsContent>
                            </Tabs>
                          </div>
                        </ScrollArea>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {sortedUsers.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No profiles found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria or filters to find more users.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  )
}
