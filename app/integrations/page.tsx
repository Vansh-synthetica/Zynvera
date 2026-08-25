'use client'

import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ArrowRight, ExternalLink } from 'lucide-react'

const integrations = [
  {
    id: 'google',
    name: 'Google Workspace',
    description: 'Sync Google Calendar, Meet, Drive, and Classroom with Zynvera.',
    href: '/integrations/google',
    connected: true,
    color: 'bg-blue-500',
    services: ['Calendar', 'Meet', 'Drive'],
  },
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Create and manage Zoom meetings directly from Zynvera.',
    href: '/integrations/zoom',
    connected: false,
    color: 'bg-blue-600',
    services: ['Meetings', 'Webinars', 'Recording'],
  },
]

export default function IntegrationsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Integrations</h1>
          <p className="mt-1 text-muted-foreground">Connect third-party services to enhance your experience.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {integrations.map(integration => (
            <Link key={integration.id} href={integration.href}>
              <Card className="transition-all hover:shadow-md hover:border-primary/20 h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`size-12 rounded-xl ${integration.color} flex items-center justify-center text-white font-bold text-lg`}>
                      {integration.name[0]}
                    </div>
                    {integration.connected ? (
                      <Badge className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                        <CheckCircle2 className="size-3" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline">Not connected</Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold">{integration.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{integration.description}</p>
                  <div className="flex items-center gap-2 mt-3">
                    {integration.services.map(s => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-sm text-primary font-medium">
                    {integration.connected ? 'Manage' : 'Connect'}
                    <ArrowRight className="size-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
