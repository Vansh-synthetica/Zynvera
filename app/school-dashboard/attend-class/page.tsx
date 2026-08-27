"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import {
  CameraOff,
  Hand,
  Mic,
  MicOff,
  MessageSquare,
  Brain,
  FileText,
  Clock,
  LogOut,
  Send,
  Download,
  Users,
  Sparkles,
  ThumbsUp,
} from "lucide-react"
import { useState, useEffect } from "react"

export default function AttendClassPage() {
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [isMicOn, setIsMicOn] = useState(false)
  const [activeTab, setActiveTab] = useState("ai")
  const [classTime, setClassTime] = useState(0)
  const [aiMessage, setAiMessage] = useState("")
  const [chatMessage, setChatMessage] = useState("")
  const [notes, setNotes] = useState("")
  const [aiConversation, setAiConversation] = useState([
    {
      type: "ai",
      message:
        "Hi! I'm here to help you with today's Advanced Physics class. Feel free to ask me anything about the topic!",
      time: "Just now",
    },
  ])
  const [chatMessages, setChatMessages] = useState([
    { sender: "Emma", message: "Looking forward to today's lesson!", time: "2 min ago", avatar: "E" },
    {
      sender: "Alex",
      message: "Same here! The quantum mechanics topic is fascinating",
      time: "1 min ago",
      avatar: "A",
    },
  ])

  // Class timer
  useEffect(() => {
    const timer = setInterval(() => {
      setClassTime((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleRaiseHand = () => {
    setIsHandRaised(!isHandRaised)
  }

  const handleSendAiMessage = () => {
    if (!aiMessage.trim()) return

    setAiConversation((prev) => [
      ...prev,
      { type: "user", message: aiMessage, time: "Just now" },
      {
        type: "ai",
        message:
          "That's a great question! Let me help you understand this concept better. In quantum mechanics, the wave-particle duality is fundamental to understanding how particles behave at the atomic level.",
        time: "Just now",
      },
    ])
    setAiMessage("")
  }

  const handleSendChatMessage = () => {
    if (!chatMessage.trim()) return

    setChatMessages((prev) => [
      ...prev,
      {
        sender: "You",
        message: chatMessage,
        time: "Just now",
        avatar: "Y",
      },
    ])
    setChatMessage("")
  }

  const handleComingSoon = (feature: string) => {
    alert(`${feature} - Coming Soon! 🚀\n\nWe're building amazing classroom features. Stay tuned!`)
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="pt-16 min-h-screen bg-gradient-to-br from-white to-stone-50/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-8rem)]">
            {/* Main Class View */}
            <div className="lg:col-span-3 flex flex-col">
              <Card className="flex-1 border-0 neo-sm bg-white/80 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0 h-full flex flex-col">
                  {/* Class Header */}
                  <div className="p-6 border-b border-stone-100 bg-gradient-to-r from-stone-50 to-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-light tracking-tight text-stone-900 mb-2">
                          Advanced Physics - Grade 12
                        </h1>
                        <div className="flex items-center gap-4 text-sm text-stone-600">
                          <span className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            Live Now
                          </span>
                          <span>Dr. Sarah Johnson</span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            28 students
                          </span>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800 border-green-200">Quantum Mechanics</Badge>
                    </div>
                  </div>

                  {/* Class Video Placeholder */}
                  <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100/50 relative overflow-hidden">
                    {/* Subtle background pattern */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute top-20 left-20 w-32 h-32 bg-stone-300 rounded-full animate-float" />
                      <div className="absolute bottom-32 right-32 w-24 h-24 bg-stone-400 rounded-full animate-float-delayed" />
                      <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-stone-200 rounded-full animate-float-slow" />
                    </div>

                    <div className="text-center relative z-10">
                      <div className="relative mb-8">
                        <div className="w-24 h-24 mx-auto bg-stone-200 rounded-full flex items-center justify-center mb-6 animate-pulse-subtle">
                          <CameraOff className="h-12 w-12 text-stone-400" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer rounded-full" />
                      </div>

                      <h3 className="text-xl font-light text-stone-700 mb-3">Class hasn't started yet</h3>
                      <p className="text-stone-500 mb-6">
                        Dr. Johnson will begin shortly. Please wait while other students join.
                      </p>

                      <div className="flex items-center justify-center gap-2 text-sm text-stone-600">
                        <Clock className="h-4 w-4" />
                        <span>Scheduled for 2:00 PM • Starting in 5 minutes</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Toolbar */}
                  <div className="p-6 border-t border-stone-100 bg-white/90 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      {/* Left - Class Info */}
                      <div className="flex items-center gap-6">
                        <div>
                          <div className="text-sm font-medium text-stone-900">Advanced Physics</div>
                          <div className="text-xs text-stone-500">Virtual Class</div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-stone-600">
                          <Clock className="h-4 w-4" />
                          <span className="font-mono">{formatTime(classTime)}</span>
                        </div>
                      </div>

                      {/* Center - Raise Hand */}
                      <Button
                        onClick={handleRaiseHand}
                        className={`rounded-full px-8 py-3 transition-all duration-300 hover:scale-105 ${
                          isHandRaised
                            ? "bg-amber-100 text-amber-800 border-2 border-amber-200 hover:bg-amber-200"
                            : "bg-stone-100 text-stone-700 hover:bg-stone-200 border-2 border-stone-200"
                        }`}
                        variant="outline"
                      >
                        <Hand className={`h-5 w-5 mr-2 ${isHandRaised ? "animate-bounce" : ""}`} />
                        {isHandRaised ? "Hand Raised" : "Raise Hand"}
                        {isHandRaised && (
                          <div className="ml-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span className="text-xs">Pending</span>
                          </div>
                        )}
                      </Button>

                      {/* Right - Controls */}
                      <div className="flex items-center gap-4">
                        <Button
                          onClick={() => setIsMicOn(!isMicOn)}
                          variant="ghost"
                          size="sm"
                          className={`rounded-full p-3 transition-all duration-300 hover:scale-110 ${
                            isMicOn ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-600"
                          }`}
                        >
                          {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                        </Button>
                        <Button
                          onClick={() => handleComingSoon("Leave Class")}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full px-4 py-2 transition-all duration-300"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Leave
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Utilities */}
            <div className="lg:col-span-1 flex flex-col">
              {/* Tab Navigation */}
              <div className="flex bg-stone-100 rounded-xl p-1 mb-6">
                {[
                  { id: "ai", label: "AI", icon: Brain },
                  { id: "chat", label: "Chat", icon: MessageSquare },
                  { id: "notes", label: "Notes", icon: FileText },
                ].map((tab) => {
                  const Icon = tab.icon
                  return (
                    <Button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      variant="ghost"
                      className={`flex-1 rounded-lg py-2 px-3 text-sm transition-all duration-300 ${
                        activeTab === tab.id
                          ? "bg-white text-stone-900 neo-sm"
                          : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {tab.label}
                    </Button>
                  )
                })}
              </div>

              {/* Tab Content */}
              <Card className="flex-1 border-0 neo-sm bg-white/80 backdrop-blur-sm overflow-hidden">
                {/* AI Assistant Tab */}
                {activeTab === "ai" && (
                  <div className="h-full flex flex-col">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-medium flex items-center gap-2">
                        <Brain className="h-5 w-5 text-blue-600" />
                        AI Assistant
                        <Sparkles className="h-4 w-4 text-blue-400 animate-pulse" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col p-6 pt-0">
                      {/* AI Conversation */}
                      <div className="flex-1 space-y-4 mb-4 overflow-y-auto max-h-64">
                        {aiConversation.map((msg, index) => (
                          <div key={index} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-[80%] p-3 rounded-2xl ${
                                msg.type === "user" ? "bg-blue-600 text-white" : "bg-stone-100 text-stone-800"
                              }`}
                            >
                              <p className="text-sm leading-relaxed">{msg.message}</p>
                              <p className={`text-xs mt-1 ${msg.type === "user" ? "text-blue-100" : "text-stone-500"}`}>
                                {msg.time}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* AI Input */}
                      <div className="space-y-3">
                        <div className="relative">
                          <Input
                            placeholder="Ask anything about today's topic..."
                            value={aiMessage}
                            onChange={(e) => setAiMessage(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleSendAiMessage()}
                            className="pr-12 border-stone-200 focus:border-blue-300 focus:ring-blue-200 rounded-xl"
                          />
                          <Button
                            onClick={handleSendAiMessage}
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 rounded-lg p-2"
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          onClick={() => handleComingSoon("Class Summary")}
                          variant="outline"
                          className="w-full rounded-xl border-stone-200 hover:bg-stone-50 text-sm"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Summarize class so far
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                )}

                {/* Chat Tab */}
                {activeTab === "chat" && (
                  <div className="h-full flex flex-col">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-medium flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-green-600" />
                        Class Chat
                        <Badge variant="secondary" className="text-xs">
                          {chatMessages.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col p-6 pt-0">
                      {/* Chat Messages */}
                      <div className="flex-1 space-y-3 mb-4 overflow-y-auto max-h-64">
                        {chatMessages.map((msg, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-stone-200 to-stone-300 rounded-full flex items-center justify-center text-xs font-medium text-stone-700">
                              {msg.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-stone-900">{msg.sender}</span>
                                <span className="text-xs text-stone-500">{msg.time}</span>
                              </div>
                              <p className="text-sm text-stone-700 leading-relaxed">{msg.message}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs text-stone-500 hover:text-stone-700"
                                  onClick={() => handleComingSoon("React to Message")}
                                >
                                  <ThumbsUp className="h-3 w-3 mr-1" />👍
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Chat Input */}
                      <div className="relative">
                        <Input
                          placeholder="Message the class..."
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && handleSendChatMessage()}
                          className="pr-12 border-stone-200 focus:border-green-300 focus:ring-green-200 rounded-xl"
                        />
                        <Button
                          onClick={handleSendChatMessage}
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-green-600 hover:bg-green-700 rounded-lg p-2"
                        >
                          <Send className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                )}

                {/* Notes Tab */}
                {activeTab === "notes" && (
                  <div className="h-full flex flex-col">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-medium flex items-center gap-2">
                        <FileText className="h-5 w-5 text-purple-600" />
                        Class Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col p-6 pt-0">
                      {/* Notes Editor */}
                      <div className="flex-1 mb-4">
                        <Textarea
                          placeholder="Take notes during the class..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="h-full resize-none border-stone-200 focus:border-purple-300 focus:ring-purple-200 rounded-xl"
                        />
                      </div>

                      {/* Notes Actions */}
                      <div className="space-y-2">
                        <div className="text-xs text-stone-500 mb-3">Auto-saved • Last saved: Just now</div>
                        <Button
                          onClick={() => handleComingSoon("Export Notes")}
                          variant="outline"
                          className="w-full rounded-xl border-stone-200 hover:bg-stone-50 text-sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export Notes
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
