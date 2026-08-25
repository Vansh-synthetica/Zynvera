"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Header } from "@/components/header"
import {
  MapPin,
  Calendar,
  LinkIcon,
  Edit,
  Settings,
  Share2,
  MoreHorizontal,
  Heart,
  MessageCircle,
  Eye,
  Bookmark,
  Award,
  TrendingUp,
  ArrowLeft,
  Github,
  Linkedin,
  Twitter,
  Globe,
  CheckCircle,
  Star,
  Zap,
} from "lucide-react"
import Link from "next/link"

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("posts")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const [profile] = useState({
    id: "current-user",
    name: "Alex Johnson",
    username: "@alexjohnson",
    bio: "Computer Science Student passionate about AI, Machine Learning, and Web Development. Always learning, always building. 🚀",
    avatar: "/placeholder-user.jpg",
    coverImage: "/placeholder.svg",
    location: "San Francisco, CA",
    website: "https://alexjohnson.dev",
    joinedDate: new Date("2023-01-15"),
    verified: false,
    premium: false,
    stats: {
      posts: 127,
      followers: 1240,
      following: 456,
      likes: 8900,
      views: 45600,
      streak: 28,
    },
    socialLinks: {
      github: "https://github.com/alexjohnson",
      linkedin: "https://linkedin.com/in/alexjohnson",
      twitter: "https://twitter.com/alexjohnson",
    },
    achievements: [
      {
        id: 1,
        title: "Early Adopter",
        description: "Joined Zynvera in the first month",
        icon: "ðŸ†",
        rarity: "legendary",
        earnedDate: new Date("2023-01-15"),
      },
      {
        id: 2,
        title: "Content Creator",
        description: "Published 100+ posts",
        icon: "âœï¸",
        rarity: "epic",
        earnedDate: new Date("2024-06-20"),
      },
      {
        id: 3,
        title: "Community Helper",
        description: "Helped 50+ students with their questions",
        icon: "ðŸ¤",
        rarity: "rare",
        earnedDate: new Date("2024-08-15"),
      },
      {
        id: 4,
        title: "Streak Master",
        description: "Maintained a 30-day learning streak",
        icon: "🔥",
        rarity: "epic",
        earnedDate: new Date("2024-11-10"),
      },
    ],
    skills: [
      { name: "JavaScript", level: 90 },
      { name: "React", level: 85 },
      { name: "Python", level: 80 },
      { name: "Machine Learning", level: 75 },
      { name: "Node.js", level: 70 },
      { name: "TypeScript", level: 65 },
    ],
    courses: [
      {
        id: 1,
        title: "Advanced Machine Learning",
        progress: 85,
        status: "in-progress",
        instructor: "Dr. Sarah Chen",
      },
      {
        id: 2,
        title: "Full Stack Web Development",
        progress: 100,
        status: "completed",
        instructor: "Marcus Johnson",
        grade: "A+",
      },
      {
        id: 3,
        title: "Data Structures & Algorithms",
        progress: 60,
        status: "in-progress",
        instructor: "Prof. Lisa Wang",
      },
    ],
  })

  const [posts] = useState([
    {
      id: 1,
      content:
        "Just completed my first machine learning project! Built a sentiment analysis model that achieved 94% accuracy. The journey from data preprocessing to model deployment was incredible. 🚀",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      likes: 156,
      comments: 23,
      shares: 8,
      views: 890,
      tags: ["MachineLearning", "Python", "DataScience"],
      type: "achievement",
    },
    {
      id: 2,
      content:
        "React 18's concurrent features are a game changer! The automatic batching and Suspense improvements make such a difference in user experience. Who else is excited about these updates?",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      likes: 89,
      comments: 15,
      shares: 4,
      views: 567,
      tags: ["React", "WebDevelopment", "JavaScript"],
      type: "discussion",
    },
    {
      id: 3,
      content:
        "Sharing my latest project: an AI-powered study assistant that helps students organize their learning materials and track progress. Built with React, Node.js, and OpenAI API. Link in bio!",
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
      likes: 234,
      comments: 45,
      shares: 18,
      views: 1240,
      tags: ["AI", "Education", "OpenAI", "React"],
      type: "project",
      media: {
        type: "image",
        url: "/placeholder.svg",
      },
    },
  ])

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "epic":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      case "rare":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "common":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (hours < 1) return "now"
    if (hours < 24) return `${hours}h`
    if (days < 7) return `${days}d`
    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <div className="pt-20 pb-20 md:pb-6">
        <div className="max-w-4xl mx-auto px-4">
          {/* Back Button */}
          <div className="mb-6">
            <Link href="/social">
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Social
              </Button>
            </Link>
          </div>

          {/* Profile Header */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl mb-6">
            <CardContent className="p-0">
              {/* Cover Image */}
              <div className="relative h-48 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-t-xl">
                <div className="absolute inset-0 bg-black/20 rounded-t-xl" />
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-black/20 backdrop-blur-sm text-white hover:bg-black/40"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-black/20 backdrop-blur-sm text-white hover:bg-black/40"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Profile Info */}
              <div className="p-6">
                <div className="flex items-start gap-6 -mt-16 mb-6">
                  <Avatar className="h-24 w-24 border-4 border-black">
                    <AvatarImage src={profile.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-2xl">{profile.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 mt-12">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
                          {profile.verified && <CheckCircle className="h-6 w-6 text-blue-500" />}
                          {profile.premium && <Star className="h-6 w-6 text-yellow-500" />}
                        </div>
                        <p className="text-white/60 text-lg">{profile.username}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button className="bg-white text-black hover:bg-white/90">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                        <Button
                          variant="outline"
                          className="bg-transparent border-white/20 text-white/80 hover:bg-white/10"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-white/80 mb-4 leading-relaxed">{profile.bio}</p>

                    <div className="flex items-center gap-6 text-sm text-white/60 mb-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {profile.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <LinkIcon className="h-4 w-4" />
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          alexjohnson.dev
                        </a>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Joined {formatDate(profile.joinedDate)}
                      </div>
                    </div>

                    {/* Social Links */}
                    <div className="flex items-center gap-3 mb-6">
                      <a
                        href={profile.socialLinks.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/60 hover:text-white"
                      >
                        <Github className="h-5 w-5" />
                      </a>
                      <a
                        href={profile.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/60 hover:text-white"
                      >
                        <Linkedin className="h-5 w-5" />
                      </a>
                      <a
                        href={profile.socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/60 hover:text-white"
                      >
                        <Twitter className="h-5 w-5" />
                      </a>
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/60 hover:text-white"
                      >
                        <Globe className="h-5 w-5" />
                      </a>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-white">{profile.stats.posts}</div>
                        <div className="text-xs text-white/60">Posts</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-white">{profile.stats.followers.toLocaleString()}</div>
                        <div className="text-xs text-white/60">Followers</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-white">{profile.stats.following}</div>
                        <div className="text-xs text-white/60">Following</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-white">{profile.stats.likes.toLocaleString()}</div>
                        <div className="text-xs text-white/60">Likes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-white">{profile.stats.views.toLocaleString()}</div>
                        <div className="text-xs text-white/60">Views</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-white flex items-center justify-center gap-1">
                          <Zap className="h-4 w-4 text-orange-500" />
                          {profile.stats.streak}
                        </div>
                        <div className="text-xs text-white/60">Day Streak</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white/5 border-white/10 mb-6">
              <TabsTrigger value="posts" className="data-[state=active]:bg-white data-[state=active]:text-black">
                Posts
              </TabsTrigger>
              <TabsTrigger value="achievements" className="data-[state=active]:bg-white data-[state=active]:text-black">
                Achievements
              </TabsTrigger>
              <TabsTrigger value="skills" className="data-[state=active]:bg-white data-[state=active]:text-black">
                Skills
              </TabsTrigger>
              <TabsTrigger value="courses" className="data-[state=active]:bg-white data-[state=active]:text-black">
                Courses
              </TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-white data-[state=active]:text-black">
                Activity
              </TabsTrigger>
            </TabsList>

            {/* Posts Tab */}
            <TabsContent value="posts" className="space-y-6">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  className="bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-white">{profile.name}</span>
                          <span className="text-white/60 text-sm">{profile.username}</span>
                          <span className="text-white/40">•</span>
                          <span className="text-white/60 text-sm">{formatTime(post.timestamp)}</span>
                        </div>

                        <p className="text-white/80 mb-4 leading-relaxed">{post.content}</p>

                        {post.tags && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags.map((tag) => (
                              <span key={tag} className="text-blue-400 hover:text-blue-300 cursor-pointer text-sm">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {post.media && (
                          <div className="mb-4">
                            <img
                              src={post.media.url || "/placeholder.svg"}
                              alt="Post media"
                              className="w-full h-64 object-cover rounded-xl"
                            />
                          </div>
                        )}

                        {post.type === "achievement" && (
                          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-3 mb-4">
                            <div className="flex items-center gap-2">
                              <Award className="h-5 w-5 text-yellow-500" />
                              <span className="text-yellow-400 font-medium">Achievement Unlocked!</span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <button className="flex items-center gap-2 text-white/60 hover:text-red-500 transition-colors">
                              <Heart className="h-5 w-5" />
                              <span className="text-sm">{post.likes}</span>
                            </button>
                            <button className="flex items-center gap-2 text-white/60 hover:text-blue-500 transition-colors">
                              <MessageCircle className="h-5 w-5" />
                              <span className="text-sm">{post.comments}</span>
                            </button>
                            <button className="flex items-center gap-2 text-white/60 hover:text-green-500 transition-colors">
                              <Share2 className="h-5 w-5" />
                              <span className="text-sm">{post.shares}</span>
                            </button>
                            <button className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                              <Eye className="h-5 w-5" />
                              <span className="text-sm">{post.views}</span>
                            </button>
                          </div>
                          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                            <Bookmark className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Achievements Tab */}
            <TabsContent value="achievements">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {profile.achievements.map((achievement) => (
                  <Card
                    key={achievement.id}
                    className={`bg-white/5 border backdrop-blur-xl ${getRarityColor(achievement.rarity)}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="text-4xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-white">{achievement.title}</h3>
                            <Badge className={getRarityColor(achievement.rarity)}>{achievement.rarity}</Badge>
                          </div>
                          <p className="text-white/70 text-sm mb-3">{achievement.description}</p>
                          <p className="text-white/60 text-xs">Earned {formatDate(achievement.earnedDate)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Skills Tab */}
            <TabsContent value="skills">
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-white mb-6">Technical Skills</h3>
                  <div className="space-y-6">
                    {profile.skills.map((skill) => (
                      <div key={skill.name}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">{skill.name}</span>
                          <span className="text-white/60 text-sm">{skill.level}%</span>
                        </div>
                        <Progress value={skill.level} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Courses Tab */}
            <TabsContent value="courses">
              <div className="space-y-4">
                {profile.courses.map((course) => (
                  <Card key={course.id} className="bg-white/5 border-white/10 backdrop-blur-xl">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-white mb-1">{course.title}</h3>
                          <p className="text-white/60 text-sm">Instructor: {course.instructor}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {course.grade && <Badge className="bg-green-500/20 text-green-400">{course.grade}</Badge>}
                          <Badge
                            className={
                              course.status === "completed"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-blue-500/20 text-blue-400"
                            }
                          >
                            {course.status === "completed" ? "Completed" : "In Progress"}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-white/60 text-sm">Progress</span>
                          <span className="text-white font-medium">{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity">
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-12 text-center">
                  <TrendingUp className="h-16 w-16 text-white/40 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Activity Timeline</h3>
                  <p className="text-white/60">
                    Detailed activity timeline coming soon. This will show your learning journey, achievements, and
                    milestones.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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
