"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Smartphone,
  Lock,
  Trash2,
  Download,
  Upload,
  ArrowLeft,
  Save,
  Camera,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("profile")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const [settings, setSettings] = useState({
    profile: {
      name: "Alex Johnson",
      username: "alexjohnson",
      email: "alex.johnson@example.com",
      bio: "Computer Science Student passionate about AI, Machine Learning, and Web Development. Always learning, always building. 🚀",
      location: "San Francisco, CA",
      website: "https://alexjohnson.dev",
      avatar: "/placeholder-user.jpg",
    },
    notifications: {
      email: {
        likes: true,
        comments: true,
        follows: true,
        mentions: true,
        posts: false,
        newsletter: true,
      },
      push: {
        likes: false,
        comments: true,
        follows: true,
        mentions: true,
        posts: false,
      },
      sound: true,
      desktop: true,
    },
    privacy: {
      profileVisibility: "public",
      showEmail: false,
      showLocation: true,
      allowMessages: "everyone",
      allowTags: "following",
      showActivity: true,
      indexProfile: true,
    },
    appearance: {
      theme: "dark",
      language: "en",
      timezone: "America/Los_Angeles",
      compactMode: false,
      animations: true,
    },
    security: {
      twoFactor: false,
      loginAlerts: true,
      sessionTimeout: 30,
      downloadData: false,
    },
  })

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSaving(false)
  }

  const handleSettingChange = (section: string, key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value,
      },
    }))
  }

  const handleNestedSettingChange = (section: string, subsection: string, key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [subsection]: {
          ...(prev[section as keyof typeof prev] as any)[subsection],
          [key]: value,
        },
      },
    }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Loading settings...</p>
        </div>
      </div>
    )
  }

  const sections = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "security", label: "Security", icon: Lock },
    { id: "data", label: "Data & Storage", icon: Download },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <div className="pt-20 pb-20 md:pb-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="mb-6">
                  <Link href="/social">
                    <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Social
                    </Button>
                  </Link>
                </div>

                <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Settings className="h-5 w-5" />
                      Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <nav className="space-y-1">
                      {sections.map((section) => {
                        const Icon = section.icon
                        return (
                          <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                              activeSection === section.id
                                ? "bg-white/10 text-white border-r-2 border-blue-500"
                                : "text-white/70 hover:text-white hover:bg-white/5"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            {section.label}
                          </button>
                        )
                      })}
                    </nav>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Profile Settings */}
              {activeSection === "profile" && (
                <div className="space-y-6">
                  <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-white">Profile Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Avatar */}
                      <div className="flex items-center gap-6">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={settings.profile.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="text-2xl">{settings.profile.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-2">
                          <Button className="bg-white text-black hover:bg-white/90">
                            <Camera className="h-4 w-4 mr-2" />
                            Change Photo
                          </Button>
                          <Button
                            variant="outline"
                            className="bg-transparent border-white/20 text-white/80 hover:bg-white/10"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>

                      {/* Basic Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name" className="text-white">
                            Display Name
                          </Label>
                          <Input
                            id="name"
                            value={settings.profile.name}
                            onChange={(e) => handleSettingChange("profile", "name", e.target.value)}
                            className="bg-white/5 border-white/20 text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="username" className="text-white">
                            Username
                          </Label>
                          <Input
                            id="username"
                            value={settings.profile.username}
                            onChange={(e) => handleSettingChange("profile", "username", e.target.value)}
                            className="bg-white/5 border-white/20 text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="email" className="text-white">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={settings.profile.email}
                          onChange={(e) => handleSettingChange("profile", "email", e.target.value)}
                          className="bg-white/5 border-white/20 text-white"
                        />
                      </div>

                      <div>
                        <Label htmlFor="bio" className="text-white">
                          Bio
                        </Label>
                        <Textarea
                          id="bio"
                          value={settings.profile.bio}
                          onChange={(e) => handleSettingChange("profile", "bio", e.target.value)}
                          className="bg-white/5 border-white/20 text-white resize-none"
                          rows={4}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="location" className="text-white">
                            Location
                          </Label>
                          <Input
                            id="location"
                            value={settings.profile.location}
                            onChange={(e) => handleSettingChange("profile", "location", e.target.value)}
                            className="bg-white/5 border-white/20 text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="website" className="text-white">
                            Website
                          </Label>
                          <Input
                            id="website"
                            value={settings.profile.website}
                            onChange={(e) => handleSettingChange("profile", "website", e.target.value)}
                            className="bg-white/5 border-white/20 text-white"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Notification Settings */}
              {activeSection === "notifications" && (
                <div className="space-y-6">
                  <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-white">Email Notifications</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Object.entries(settings.notifications.email).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <div>
                            <Label className="text-white capitalize">{key.replace(/([A-Z])/g, " $1")}</Label>
                            <p className="text-white/60 text-sm">Receive email notifications for {key.toLowerCase()}</p>
                          </div>
                          <Switch
                            checked={value}
                            onCheckedChange={(checked) =>
                              handleNestedSettingChange("notifications", "email", key, checked)
                            }
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-white">Push Notifications</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Object.entries(settings.notifications.push).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <div>
                            <Label className="text-white capitalize">{key.replace(/([A-Z])/g, " $1")}</Label>
                            <p className="text-white/60 text-sm">Receive push notifications for {key.toLowerCase()}</p>
                          </div>
                          <Switch
                            checked={value}
                            onCheckedChange={(checked) =>
                              handleNestedSettingChange("notifications", "push", key, checked)
                            }
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-white">Other Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {settings.notifications.sound ? (
                            <Volume2 className="h-4 w-4 text-white/60" />
                          ) : (
                            <VolumeX className="h-4 w-4 text-white/60" />
                          )}
                          <div>
                            <Label className="text-white">Sound Notifications</Label>
                            <p className="text-white/60 text-sm">Play sound for notifications</p>
                          </div>
                        </div>
                        <Switch
                          checked={settings.notifications.sound}
                          onCheckedChange={(checked) => handleSettingChange("notifications", "sound", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Smartphone className="h-4 w-4 text-white/60" />
                          <div>
                            <Label className="text-white">Desktop Notifications</Label>
                            <p className="text-white/60 text-sm">Show desktop notifications</p>
                          </div>
                        </div>
                        <Switch
                          checked={settings.notifications.desktop}
                          onCheckedChange={(checked) => handleSettingChange("notifications", "desktop", checked)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Privacy Settings */}
              {activeSection === "privacy" && (
                <div className="space-y-6">
                  <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-white">Profile Privacy</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Profile Visibility</Label>
                          <p className="text-white/60 text-sm">Who can see your profile</p>
                        </div>
                        <select
                          value={settings.privacy.profileVisibility}
                          onChange={(e) => handleSettingChange("privacy", "profileVisibility", e.target.value)}
                          className="bg-white/5 border border-white/20 text-white rounded-md px-3 py-2"
                        >
                          <option value="public">Public</option>
                          <option value="followers">Followers Only</option>
                          <option value="private">Private</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Show Email</Label>
                          <p className="text-white/60 text-sm">Display email on your profile</p>
                        </div>
                        <Switch
                          checked={settings.privacy.showEmail}
                          onCheckedChange={(checked) => handleSettingChange("privacy", "showEmail", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Show Location</Label>
                          <p className="text-white/60 text-sm">Display location on your profile</p>
                        </div>
                        <Switch
                          checked={settings.privacy.showLocation}
                          onCheckedChange={(checked) => handleSettingChange("privacy", "showLocation", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Show Activity</Label>
                          <p className="text-white/60 text-sm">Show when you were last active</p>
                        </div>
                        <Switch
                          checked={settings.privacy.showActivity}
                          onCheckedChange={(checked) => handleSettingChange("privacy", "showActivity", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Search Engine Indexing</Label>
                          <p className="text-white/60 text-sm">Allow search engines to index your profile</p>
                        </div>
                        <Switch
                          checked={settings.privacy.indexProfile}
                          onCheckedChange={(checked) => handleSettingChange("privacy", "indexProfile", checked)}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-white">Communication</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Allow Messages From</Label>
                          <p className="text-white/60 text-sm">Who can send you direct messages</p>
                        </div>
                        <select
                          value={settings.privacy.allowMessages}
                          onChange={(e) => handleSettingChange("privacy", "allowMessages", e.target.value)}
                          className="bg-white/5 border border-white/20 text-white rounded-md px-3 py-2"
                        >
                          <option value="everyone">Everyone</option>
                          <option value="following">People I Follow</option>
                          <option value="none">No One</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Allow Tags From</Label>
                          <p className="text-white/60 text-sm">Who can tag you in posts</p>
                        </div>
                        <select
                          value={settings.privacy.allowTags}
                          onChange={(e) => handleSettingChange("privacy", "allowTags", e.target.value)}
                          className="bg-white/5 border border-white/20 text-white rounded-md px-3 py-2"
                        >
                          <option value="everyone">Everyone</option>
                          <option value="following">People I Follow</option>
                          <option value="none">No One</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Appearance Settings */}
              {activeSection === "appearance" && (
                <div className="space-y-6">
                  <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-white">Display Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {settings.appearance.theme === "dark" ? (
                            <Moon className="h-4 w-4 text-white/60" />
                          ) : (
                            <Sun className="h-4 w-4 text-white/60" />
                          )}
                          <div>
                            <Label className="text-white">Theme</Label>
                            <p className="text-white/60 text-sm">Choose your preferred theme</p>
                          </div>
                        </div>
                        <select
                          value={settings.appearance.theme}
                          onChange={(e) => handleSettingChange("appearance", "theme", e.target.value)}
                          className="bg-white/5 border border-white/20 text-white rounded-md px-3 py-2"
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="system">System</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Globe className="h-4 w-4 text-white/60" />
                          <div>
                            <Label className="text-white">Language</Label>
                            <p className="text-white/60 text-sm">Select your preferred language</p>
                          </div>
                        </div>
                        <select
                          value={settings.appearance.language}
                          onChange={(e) => handleSettingChange("appearance", "language", e.target.value)}
                          className="bg-white/5 border border-white/20 text-white rounded-md px-3 py-2"
                        >
                          <option value="en">English</option>
                          <option value="es">Español</option>
                          <option value="fr">Français</option>
                          <option value="de">Deutsch</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Compact Mode</Label>
                          <p className="text-white/60 text-sm">Use compact layout for better information density</p>
                        </div>
                        <Switch
                          checked={settings.appearance.compactMode}
                          onCheckedChange={(checked) => handleSettingChange("appearance", "compactMode", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Animations</Label>
                          <p className="text-white/60 text-sm">Enable smooth animations and transitions</p>
                        </div>
                        <Switch
                          checked={settings.appearance.animations}
                          onCheckedChange={(checked) => handleSettingChange("appearance", "animations", checked)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Security Settings */}
              {activeSection === "security" && (
                <div className="space-y-6">
                  <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-white">Account Security</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Two-Factor Authentication</Label>
                          <p className="text-white/60 text-sm">Add an extra layer of security to your account</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={settings.security.twoFactor}
                            onCheckedChange={(checked) => handleSettingChange("security", "twoFactor", checked)}
                          />
                          {!settings.security.twoFactor && (
                            <Badge variant="outline" className="text-orange-400 border-orange-400">
                              Recommended
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Login Alerts</Label>
                          <p className="text-white/60 text-sm">Get notified of new login attempts</p>
                        </div>
                        <Switch
                          checked={settings.security.loginAlerts}
                          onCheckedChange={(checked) => handleSettingChange("security", "loginAlerts", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Session Timeout</Label>
                          <p className="text-white/60 text-sm">Automatically log out after inactivity</p>
                        </div>
                        <select
                          value={settings.security.sessionTimeout}
                          onChange={(e) =>
                            handleSettingChange("security", "sessionTimeout", Number.parseInt(e.target.value))
                          }
                          className="bg-white/5 border border-white/20 text-white rounded-md px-3 py-2"
                        >
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={60}>1 hour</option>
                          <option value={0}>Never</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-white">Password & Authentication</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button className="bg-white text-black hover:bg-white/90">Change Password</Button>
                      <Button
                        variant="outline"
                        className="bg-transparent border-white/20 text-white/80 hover:bg-white/10"
                      >
                        View Active Sessions
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Data & Storage Settings */}
              {activeSection === "data" && (
                <div className="space-y-6">
                  <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-white">Data Management</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Download Your Data</Label>
                          <p className="text-white/60 text-sm">Get a copy of all your data</p>
                        </div>
                        <Button
                          variant="outline"
                          className="bg-transparent border-white/20 text-white/80 hover:bg-white/10"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Request Download
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Import Data</Label>
                          <p className="text-white/60 text-sm">Import data from other platforms</p>
                        </div>
                        <Button
                          variant="outline"
                          className="bg-transparent border-white/20 text-white/80 hover:bg-white/10"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Import
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-red-500/10 border-red-500/20 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-red-400 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Danger Zone
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Delete Account</Label>
                          <p className="text-white/60 text-sm">Permanently delete your account and all data</p>
                        </div>
                        <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Account
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Save Button */}
              <div className="flex items-center justify-end gap-4 pt-6">
                <Button variant="outline" className="bg-transparent border-white/20 text-white/80 hover:bg-white/10">
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving} className="bg-white text-black hover:bg-white/90">
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
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
