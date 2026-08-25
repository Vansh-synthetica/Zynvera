'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useWorkspace } from '@/lib/workspace-context'
import { Settings, User, Bell, Shield, Palette, Globe, Link2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

export default function SettingsPage() {
  const { userName, setUserName, role, institution } = useWorkspace()
  const [activeTab, setActiveTab] = useState('profile')

  return (
    <AppShell>
      <div className="space-y-6">
        <div><h1 className="text-3xl font-semibold tracking-tight">Settings</h1><p className="mt-1 text-muted-foreground">Manage your account and preferences.</p></div>

        <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
          <nav className="space-y-1">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'security', label: 'Security', icon: Shield },
              { id: 'integrations', label: 'Integrations', icon: Link2 },
              { id: 'appearance', label: 'Appearance', icon: Palette },
            ].map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${activeTab === item.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>
                <item.icon className="size-4" />{item.label}
              </button>
            ))}
          </nav>

          <div className="space-y-4">
            {activeTab === 'profile' && (
              <Card>
                <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">{userName.split(' ').map(n => n[0]).join('')}</div>
                    <div><p className="font-semibold">{userName}</p><p className="text-sm text-muted-foreground capitalize">{role}</p><p className="text-sm text-muted-foreground">{institution?.name}</p></div>
                  </div>
                </CardContent>
              </Card>
            )}
            {activeTab === 'notifications' && (
              <Card>
                <CardHeader><CardTitle className="text-base">Notification Preferences</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {['Assignments due', 'Grade published', 'New announcements', 'Meeting reminders', 'Attendance alerts', 'Messages'].map(pref => (
                    <div key={pref} className="flex items-center justify-between py-2">
                      <Label className="text-sm">{pref}</Label>
                      <Switch defaultChecked />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            {activeTab === 'security' && (
              <Card>
                <CardHeader><CardTitle className="text-base">Security</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-2"><span className="text-sm">Password</span><Button variant="outline" size="sm">Change password</Button></div>
                  <div className="flex items-center justify-between py-2"><span className="text-sm">Two-factor authentication</span><Badge variant="outline">Not enabled</Badge></div>
                  <div className="flex items-center justify-between py-2"><span className="text-sm">Active sessions</span><Button variant="outline" size="sm">Manage</Button></div>
                </CardContent>
              </Card>
            )}
            {activeTab === 'integrations' && (
              <Card>
                <CardHeader><CardTitle className="text-base">Integrations</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Link href="/integrations/google" className="flex items-center justify-between py-3 border-b hover:bg-muted/50 rounded-lg px-2 transition">
                    <div className="flex items-center gap-3">
                      <div className="size-6 rounded bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white text-xs font-bold">G</div>
                      <div><p className="text-sm font-medium">Google Workspace</p><p className="text-xs text-muted-foreground">Calendar, Meet, Drive</p></div>
                    </div>
                    <Badge variant="outline" className="gap-1"><CheckCircle2 className="size-3" />Connected</Badge>
                  </Link>
                  <Link href="/integrations/zoom" className="flex items-center justify-between py-3 hover:bg-muted/50 rounded-lg px-2 transition">
                    <div className="flex items-center gap-3">
                      <div className="size-6 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-bold">Z</div>
                      <div><p className="text-sm font-medium">Zoom</p><p className="text-xs text-muted-foreground">Video conferencing</p></div>
                    </div>
                    <Button variant="outline" size="sm">Connect</Button>
                  </Link>
                  <Link href="/integrations" className="block text-center text-sm text-primary hover:underline mt-2">
                    View all integrations
                  </Link>
                </CardContent>
              </Card>
            )}
            {activeTab === 'appearance' && (
              <Card>
                <CardHeader><CardTitle className="text-base">Appearance</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-2"><Label className="text-sm">Theme</Label><Badge variant="outline">System</Badge></div>
                  <div className="flex items-center justify-between py-2"><Label className="text-sm">Compact mode</Label><Switch /></div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
