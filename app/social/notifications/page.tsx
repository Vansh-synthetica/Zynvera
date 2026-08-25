"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Header } from "@/components/header"
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Share2,
  Award,
  Calendar,
  ArrowLeft,
  Settings,
  Check,
  X,
  MoreHorizontal,
} from "lucide-react"
import Link from "next/link"

export default function NotificationsPage() {
  const [activeFilter, setActiveFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "like",
      title: "Sarah Chen liked your post",
      message: "Your post about 'Advanced Machine Learning Techniques' received a like",
      user: {
        name: "Sarah Chen",
        username: "@sarahchen",
        avatar: "/placeholder-user.jpg",
        verified: true,
      },
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      isRead: false,
      actionable: false,
    },
    {
      id: 2,
      type: "comment",
      title: "Marcus Johnson commented on your post",
      message: "Great insights on React 18! Have you tried the new concurrent features in production?",
      user: {
        name: "Marcus Johnson",
        username: "@marcusdev",
        avatar: "/placeholder-user.jpg",
        verified: false,
      },
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      isRead: false,
      actionable: true,
    },
    {
      id: 3,
      type: "follow",
      title: "Emma Rodriguez started following you",
      message: "You have a new follower! Check out their UX design portfolio.",
      user: {
        name: "Emma Rodriguez",
        username: "@emmadesigns",
        avatar: "/placeholder-user.jpg",
        verified: true,
      },
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      isRead: true,
      actionable: true,
    },
    {
      id: 4,
      type: "share",
      title: "Dr. Lisa Wang shared your post",
      message: "Your discussion on 'AI Ethics in Modern Development' was shared",
      user: {
        name: "Dr. Lisa Wang",
        username: "@drwang",
        avatar: "/placeholder-user.jpg",
        verified: true,
      },
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isRead: true,
      actionable: false,
    },
    {
      id: 5,
      type: "achievement",
      title: "Achievement Unlocked!",
      message: "You've reached 1,000 likes on your posts. Keep up the great content!",
      user: null,
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      isRead: false,
      actionable: false,
    },
    {
      id: 6,
      type: "event",
      title: "Upcoming Event: AI Ethics Summit",
      message: "The AI Ethics Summit you're attending starts in 2 days. Don't forget to prepare!",
      user: null,
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      isRead: true,
      actionable: true,
    },
    {
      id: 7,
      type: "mention",
      title: "Alex Thompson mentioned you",
      message: "Thanks @alexjohnson for the feedback on my open source LMS project!",
      user: {
        name: "Alex Thompson",
        username: "@alexthompson",
        avatar: "/placeholder-user.jpg",
        verified: false,
      },
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
      isRead: true,
      actionable: true,
    },
    {
      id: 8,
      type: "system",
      title: "Weekly Summary Available",
      message: "Your weekly learning summary is ready. You've engaged with 15 posts and gained 234 new followers!",
      user: null,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      isRead: false,
      actionable: true,
    },
  ])

  const filteredNotifications = notifications.filter((notification) => {
    switch (activeFilter) {
      case "unread":
        return !notification.isRead
      case "mentions":
        return notification.type === "mention"
      case "likes":
        return notification.type === "like"
      case "comments":
        return notification.type === "comment"
      case "follows":
        return notification.type === "follow"
      default:
        return true
    }
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const handleMarkAsRead = (notificationId: number) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification,
      ),
    )
  }

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map((notification) => ({ ...notification, isRead: true })))
  }

  const handleDeleteNotification = (notificationId: number) => {
    setNotifications(notifications.filter((notification) => notification.id !== notificationId))
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return "now"
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    if (days < 7) return `${days}d`
    return date.toLocaleDateString()
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-5 w-5 text-red-500" />
      case "comment":
        return <MessageCircle className="h-5 w-5 text-blue-500" />
      case "follow":
        return <UserPlus className="h-5 w-5 text-green-500" />
      case "share":
        return <Share2 className="h-5 w-5 text-purple-500" />
      case "achievement":
        return <Award className="h-5 w-5 text-yellow-500" />
      case "event":
        return <Calendar className="h-5 w-5 text-orange-500" />
      case "mention":
        return <MessageCircle className="h-5 w-5 text-cyan-500" />
      case "system":
        return <Bell className="h-5 w-5 text-gray-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Loading notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <div className="pt-20 pb-20 md:pb-6">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Link href="/social">
                <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Social
                </Button>
              </Link>
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                  <Bell className="h-8 w-8 text-blue-500" />
                  Notifications
                  {unreadCount > 0 && <Badge className="bg-red-500 text-white">{unreadCount}</Badge>}
                </h1>
                <p className="text-white/60 mt-2">Stay updated with your community activity</p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="bg-transparent border-white/20 text-white/80 hover:bg-white/10"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Mark all as read
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {[
                { id: "all", label: "All", count: notifications.length },
                { id: "unread", label: "Unread", count: unreadCount },
                { id: "mentions", label: "Mentions", count: notifications.filter((n) => n.type === "mention").length },
                { id: "likes", label: "Likes", count: notifications.filter((n) => n.type === "like").length },
                { id: "comments", label: "Comments", count: notifications.filter((n) => n.type === "comment").length },
                { id: "follows", label: "Follows", count: notifications.filter((n) => n.type === "follow").length },
              ].map((filter) => (
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
                  {filter.label}
                  {filter.count > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {filter.count}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all group ${
                  !notification.isRead ? "border-l-4 border-l-blue-500" : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>

                    {/* User Avatar */}
                    {notification.user && (
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={notification.user.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{notification.user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className={`font-medium ${!notification.isRead ? "text-white" : "text-white/80"}`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-2 ml-4">
                          <span className="text-white/60 text-sm whitespace-nowrap">
                            {formatTime(notification.timestamp)}
                          </span>
                          {!notification.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                        </div>
                      </div>

                      <p className="text-white/70 text-sm mb-3 leading-relaxed">{notification.message}</p>

                      {notification.user && (
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-white/60 text-sm">{notification.user.username}</span>
                          {notification.user.verified && (
                            <Badge variant="secondary" className="text-xs">
                              Verified
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3">
                        {notification.actionable && (
                          <>
                            {notification.type === "comment" && (
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                                Reply
                              </Button>
                            )}
                            {notification.type === "follow" && (
                              <Button size="sm" className="bg-white text-black hover:bg-white/90">
                                Follow Back
                              </Button>
                            )}
                            {notification.type === "mention" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-transparent border-white/20 text-white/80 hover:bg-white/10"
                              >
                                View Post
                              </Button>
                            )}
                            {notification.type === "event" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-transparent border-white/20 text-white/80 hover:bg-white/10"
                              >
                                View Event
                              </Button>
                            )}
                            {notification.type === "system" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-transparent border-white/20 text-white/80 hover:bg-white/10"
                              >
                                View Summary
                              </Button>
                            )}
                          </>
                        )}

                        <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="text-white/60 hover:text-white"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNotification(notification.id)}
                            className="text-white/60 hover:text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {filteredNotifications.length === 0 && (
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardContent className="p-12 text-center">
                <Bell className="h-16 w-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No notifications</h3>
                <p className="text-white/60 mb-6">
                  {activeFilter === "all"
                    ? "You're all caught up! No new notifications."
                    : `No ${activeFilter} notifications found.`}
                </p>
                <Link href="/social">
                  <Button className="bg-white text-black hover:bg-white/90">Explore Content</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Load More */}
          {filteredNotifications.length > 0 && (
            <div className="text-center mt-8">
              <Button variant="outline" className="bg-transparent border-white/20 text-white/80 hover:bg-white/10">
                Load More Notifications
              </Button>
            </div>
          )}
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
