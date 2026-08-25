"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Search,
  Send,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  ImageIcon,
  ArrowLeft,
  Circle,
  Check,
  CheckCheck,
  Pin,
  Archive,
  Trash2,
  Edit3,
  Users,
  Plus,
  Settings,
  Bell,
  BellOff,
  Reply,
  Forward,
  Copy,
  Info,
  MessageCircle,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Link from "next/link"

interface Message {
  id: string
  senderId: string
  content: string
  timestamp: Date
  type: "text" | "image" | "file" | "voice"
  status: "sent" | "delivered" | "read"
  replyTo?: string
  edited?: boolean
}

interface Conversation {
  id: string
  type: "direct" | "group"
  name: string
  avatar: string
  participants: string[]
  lastMessage: Message
  unreadCount: number
  isOnline: boolean
  lastSeen?: Date
  isPinned: boolean
  isMuted: boolean
  isArchived: boolean
}

interface User {
  id: string
  name: string
  avatar: string
  role: string
  isOnline: boolean
  lastSeen?: Date
}

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showMobileChat, setShowMobileChat] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentUser: User = {
    id: "current-user",
    name: "Alex Johnson",
    avatar: "/placeholder-user.jpg",
    role: "Computer Science Student",
    isOnline: true,
  }

  const users: User[] = [
    {
      id: "sarah-chen",
      name: "Sarah Chen",
      avatar: "/placeholder-user.jpg",
      role: "Data Science Instructor",
      isOnline: true,
    },
    {
      id: "marcus-johnson",
      name: "Marcus Johnson",
      avatar: "/placeholder-user.jpg",
      role: "Full Stack Developer",
      isOnline: false,
      lastSeen: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    },
    {
      id: "emma-rodriguez",
      name: "Emma Rodriguez",
      avatar: "/placeholder-user.jpg",
      role: "UX Designer",
      isOnline: true,
    },
    {
      id: "david-park",
      name: "David Park",
      avatar: "/placeholder-user.jpg",
      role: "AI Researcher",
      isOnline: false,
      lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
  ]

  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "conv-1",
      type: "direct",
      name: "Sarah Chen",
      avatar: "/placeholder-user.jpg",
      participants: ["current-user", "sarah-chen"],
      lastMessage: {
        id: "msg-1",
        senderId: "sarah-chen",
        content: "Hey! I saw your machine learning project. Really impressive work! 🚀",
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        type: "text",
        status: "read",
      },
      unreadCount: 2,
      isOnline: true,
      isPinned: true,
      isMuted: false,
      isArchived: false,
    },
    {
      id: "conv-2",
      type: "group",
      name: "React Study Group",
      avatar: "/placeholder.svg",
      participants: ["current-user", "marcus-johnson", "emma-rodriguez", "david-park"],
      lastMessage: {
        id: "msg-2",
        senderId: "marcus-johnson",
        content: "Anyone free for a coding session this weekend?",
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        type: "text",
        status: "delivered",
      },
      unreadCount: 0,
      isOnline: false,
      isPinned: false,
      isMuted: false,
      isArchived: false,
    },
    {
      id: "conv-3",
      type: "direct",
      name: "Emma Rodriguez",
      avatar: "/placeholder-user.jpg",
      participants: ["current-user", "emma-rodriguez"],
      lastMessage: {
        id: "msg-3",
        senderId: "current-user",
        content: "Thanks for the design feedback! I'll implement those changes.",
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        type: "text",
        status: "read",
      },
      unreadCount: 0,
      isOnline: true,
      isPinned: false,
      isMuted: false,
      isArchived: false,
    },
    {
      id: "conv-4",
      type: "direct",
      name: "David Park",
      avatar: "/placeholder-user.jpg",
      participants: ["current-user", "david-park"],
      lastMessage: {
        id: "msg-4",
        senderId: "david-park",
        content: "The AI ethics paper you shared was fascinating. Let's discuss it tomorrow.",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        type: "text",
        status: "read",
      },
      unreadCount: 0,
      isOnline: false,
      lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isPinned: false,
      isMuted: true,
      isArchived: false,
    },
  ])

  const [messages, setMessages] = useState<{ [conversationId: string]: Message[] }>({
    "conv-1": [
      {
        id: "msg-1-1",
        senderId: "sarah-chen",
        content: "Hey Alex! How's your machine learning course going?",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        type: "text",
        status: "read",
      },
      {
        id: "msg-1-2",
        senderId: "current-user",
        content:
          "It's going great! Just finished implementing a neural network from scratch. The math is challenging but really rewarding.",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000),
        type: "text",
        status: "read",
      },
      {
        id: "msg-1-3",
        senderId: "sarah-chen",
        content:
          "That's awesome! Neural networks can be tricky at first. Have you tried visualizing the gradient descent process?",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 10 * 60 * 1000),
        type: "text",
        status: "read",
      },
      {
        id: "msg-1-4",
        senderId: "current-user",
        content: "Not yet, but that's a great idea! Do you have any recommended tools for visualization?",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 15 * 60 * 1000),
        type: "text",
        status: "read",
      },
      {
        id: "msg-1-5",
        senderId: "sarah-chen",
        content: "Hey! I saw your machine learning project. Really impressive work! 🚀",
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        type: "text",
        status: "read",
      },
      {
        id: "msg-1-6",
        senderId: "sarah-chen",
        content: "Would love to collaborate on a project sometime!",
        timestamp: new Date(Date.now() - 3 * 60 * 1000),
        type: "text",
        status: "delivered",
      },
    ],
    "conv-2": [
      {
        id: "msg-2-1",
        senderId: "marcus-johnson",
        content: "Hey everyone! Hope you're all doing well with the React course.",
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        type: "text",
        status: "read",
      },
      {
        id: "msg-2-2",
        senderId: "emma-rodriguez",
        content: "Yes! Just finished the hooks section. Custom hooks are so powerful!",
        timestamp: new Date(Date.now() - 50 * 60 * 1000),
        type: "text",
        status: "read",
      },
      {
        id: "msg-2-3",
        senderId: "david-park",
        content: "Agreed! I'm working on a project that uses useReducer for complex state management.",
        timestamp: new Date(Date.now() - 40 * 60 * 1000),
        type: "text",
        status: "read",
      },
      {
        id: "msg-2-4",
        senderId: "current-user",
        content: "That sounds interesting! I'd love to see how you're implementing it.",
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        type: "text",
        status: "read",
      },
      {
        id: "msg-2-5",
        senderId: "marcus-johnson",
        content: "Anyone free for a coding session this weekend?",
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        type: "text",
        status: "delivered",
      },
    ],
  })

  const filteredConversations = conversations.filter(
    (conv) =>
      !conv.isArchived &&
      (conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const selectedConv = conversations.find((conv) => conv.id === selectedConversation)
  const conversationMessages = selectedConversation ? messages[selectedConversation] || [] : []

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversationMessages])

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      content: messageInput.trim(),
      timestamp: new Date(),
      type: "text",
      status: "sent",
    }

    setMessages((prev) => ({
      ...prev,
      [selectedConversation]: [...(prev[selectedConversation] || []), newMessage],
    }))

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === selectedConversation
          ? {
              ...conv,
              lastMessage: newMessage,
            }
          : conv,
      ),
    )

    setMessageInput("")

    // Simulate message delivery
    setTimeout(() => {
      setMessages((prev) => ({
        ...prev,
        [selectedConversation]: prev[selectedConversation].map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: "delivered" } : msg,
        ),
      }))
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
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

  const formatLastSeen = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (minutes < 1) return "Active now"
    if (minutes < 60) return `Active ${minutes}m ago`
    if (hours < 24) return `Active ${hours}h ago`
    return `Active ${date.toLocaleDateString()}`
  }

  const getMessageStatusIcon = (status: Message["status"]) => {
    switch (status) {
      case "sent":
        return <Check className="h-3 w-3 text-gray-400" />
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-gray-400" />
      case "read":
        return <CheckCheck className="h-3 w-3 text-blue-500" />
      default:
        return null
    }
  }

  const handleConversationAction = (action: string, conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== conversationId) return conv
        switch (action) {
          case "pin":
            return { ...conv, isPinned: !conv.isPinned }
          case "mute":
            return { ...conv, isMuted: !conv.isMuted }
          case "archive":
            return { ...conv, isArchived: true }
          case "delete":
            // In a real app, you'd handle deletion properly
            return conv
          default:
            return conv
        }
      }),
    )
  }

  const handleBackToList = () => {
    setShowMobileChat(false)
    setSelectedConversation(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 pt-20">
      <Header />

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Messages
              </h1>
              <p className="text-lg text-muted-foreground">Connect with your learning community</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/social/profiles">
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Find People
                </Button>
              </Link>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <div className={`lg:col-span-1 ${showMobileChat ? "hidden lg:block" : "block"}`}>
            <Card className="h-full flex flex-col border-0 shadow-xl bg-white/90 backdrop-blur-sm animate-fade-in-left">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Conversations</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Archive className="h-4 w-4 mr-2" />
                        Archived Chats
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full">
                  <div className="space-y-1 p-3">
                    {filteredConversations
                      .sort((a, b) => {
                        if (a.isPinned && !b.isPinned) return -1
                        if (!a.isPinned && b.isPinned) return 1
                        return b.lastMessage.timestamp.getTime() - a.lastMessage.timestamp.getTime()
                      })
                      .map((conversation) => (
                        <div
                          key={conversation.id}
                          className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:scale-[1.02] hover:shadow-md ${
                            selectedConversation === conversation.id
                              ? "bg-gradient-to-r from-blue-100 to-purple-100 shadow-md scale-[1.02]"
                              : ""
                          }`}
                          onClick={() => {
                            setSelectedConversation(conversation.id)
                            setShowMobileChat(true)
                          }}
                        >
                          <div className="relative">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={conversation.avatar || "/placeholder.svg"} />
                              <AvatarFallback>
                                {conversation.type === "group" ? (
                                  <Users className="h-6 w-6" />
                                ) : (
                                  conversation.name.charAt(0)
                                )}
                              </AvatarFallback>
                            </Avatar>
                            {conversation.type === "direct" && conversation.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium truncate">{conversation.name}</h3>
                                {conversation.isPinned && <Pin className="h-3 w-3 text-muted-foreground" />}
                                {conversation.isMuted && <BellOff className="h-3 w-3 text-muted-foreground" />}
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(conversation.lastMessage.timestamp)}
                                </span>
                                {conversation.unreadCount > 0 && (
                                  <Badge className="bg-primary text-primary-foreground text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full">
                                    {conversation.unreadCount}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-muted-foreground truncate flex-1">
                                {conversation.lastMessage.senderId === currentUser.id && "You: "}
                                {conversation.lastMessage.content}
                              </p>
                              {conversation.lastMessage.senderId === currentUser.id && (
                                <div className="flex-shrink-0">
                                  {getMessageStatusIcon(conversation.lastMessage.status)}
                                </div>
                              )}
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleConversationAction("pin", conversation.id)
                                }}
                              >
                                <Pin className="h-4 w-4 mr-2" />
                                {conversation.isPinned ? "Unpin" : "Pin"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleConversationAction("mute", conversation.id)
                                }}
                              >
                                {conversation.isMuted ? (
                                  <Bell className="h-4 w-4 mr-2" />
                                ) : (
                                  <BellOff className="h-4 w-4 mr-2" />
                                )}
                                {conversation.isMuted ? "Unmute" : "Mute"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleConversationAction("archive", conversation.id)
                                }}
                              >
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleConversationAction("delete", conversation.id)
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className={`lg:col-span-2 ${showMobileChat ? "block" : "hidden lg:block"}`}>
            {selectedConv ? (
              <Card className="h-full flex flex-col border-0 shadow-xl bg-white/90 backdrop-blur-sm animate-fade-in-right">
                {/* Chat Header */}
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" size="sm" className="lg:hidden" onClick={handleBackToList}>
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={selectedConv.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {selectedConv.type === "group" ? (
                              <Users className="h-5 w-5" />
                            ) : (
                              selectedConv.name.charAt(0)
                            )}
                          </AvatarFallback>
                        </Avatar>
                        {selectedConv.type === "direct" && selectedConv.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{selectedConv.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedConv.type === "group"
                            ? `${selectedConv.participants.length} members`
                            : selectedConv.isOnline
                              ? "Active now"
                              : selectedConv.lastSeen
                                ? formatLastSeen(selectedConv.lastSeen)
                                : "Offline"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Phone className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Voice call</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Video className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Video call</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Info className="h-4 w-4 mr-2" />
                            View Info
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Search className="h-4 w-4 mr-2" />
                            Search Messages
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <BellOff className="h-4 w-4 mr-2" />
                            Mute Notifications
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Archive className="h-4 w-4 mr-2" />
                            Archive Chat
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-4">
                      {conversationMessages.map((message, index) => {
                        const isCurrentUser = message.senderId === currentUser.id
                        const showAvatar =
                          index === 0 ||
                          conversationMessages[index - 1].senderId !== message.senderId ||
                          message.timestamp.getTime() - conversationMessages[index - 1].timestamp.getTime() >
                            5 * 60 * 1000

                        return (
                          <div
                            key={message.id}
                            className={`flex gap-3 ${isCurrentUser ? "justify-end" : "justify-start"} group`}
                          >
                            {!isCurrentUser && (
                              <div className="flex-shrink-0">
                                {showAvatar ? (
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage
                                      src={users.find((u) => u.id === message.senderId)?.avatar || "/placeholder.svg"}
                                    />
                                    <AvatarFallback>
                                      {users.find((u) => u.id === message.senderId)?.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <div className="w-8 h-8" />
                                )}
                              </div>
                            )}

                            <div className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"} max-w-[70%]`}>
                              {showAvatar && !isCurrentUser && (
                                <span className="text-xs text-muted-foreground mb-1">
                                  {users.find((u) => u.id === message.senderId)?.name}
                                </span>
                              )}

                              <div
                                className={`relative px-4 py-2 rounded-2xl ${
                                  isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                                } ${showAvatar ? (isCurrentUser ? "rounded-br-md" : "rounded-bl-md") : ""}`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                {message.edited && <span className="text-xs opacity-70 ml-2">(edited)</span>}

                                {/* Message actions */}
                                <div className="absolute -top-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background border rounded-lg shadow-lg p-1 flex gap-1">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                          <Reply className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Reply</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                          <Forward className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Forward</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Copy</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  {isCurrentUser && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                            <Edit3 className="h-3 w-3" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Edit</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                              </div>

                              <div
                                className={`flex items-center gap-1 mt-1 ${isCurrentUser ? "flex-row-reverse" : ""}`}
                              >
                                <span className="text-xs text-muted-foreground">
                                  {message.timestamp.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                {isCurrentUser && (
                                  <div className="flex-shrink-0">{getMessageStatusIcon(message.status)}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                </CardContent>

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="px-4 py-2 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="flex gap-1">
                        <Circle className="h-2 w-2 fill-current animate-bounce" />
                        <Circle className="h-2 w-2 fill-current animate-bounce" style={{ animationDelay: "0.1s" }} />
                        <Circle className="h-2 w-2 fill-current animate-bounce" style={{ animationDelay: "0.2s" }} />
                      </div>
                      <span>{selectedConv.name} is typing...</span>
                    </div>
                  </div>
                )}

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex items-end gap-2">
                    <div className="flex gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
                              <Paperclip className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Attach file</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <ImageIcon className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Send image</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <div className="flex-1 relative">
                      <Textarea
                        placeholder="Type a message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="min-h-[40px] max-h-[120px] resize-none pr-12"
                        rows={1}
                      />
                      <Button variant="ghost" size="sm" className="absolute right-2 bottom-2">
                        <Smile className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button onClick={handleSendMessage} disabled={!messageInput.trim()} className="h-10 w-10 p-0">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                />
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">Choose a conversation from the list to start messaging</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
