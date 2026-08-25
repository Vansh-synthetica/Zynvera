'use client'

import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { HelpCircle, MessageSquare, Book, ExternalLink } from 'lucide-react'

const items = [
  { title: 'Documentation', desc: 'Browse guides and tutorials', icon: Book },
  { title: 'Contact Support', desc: 'Get help from our team', icon: MessageSquare },
  { title: 'FAQs', desc: 'Common questions answered', icon: HelpCircle },
  { title: 'Report a Bug', desc: 'Let us know about issues', icon: ExternalLink },
]

export default function SupportPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Help and Support</h1>
          <p className="mt-1 text-muted-foreground">Get help with using Zynvera.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map(item => (
            <Card key={item.title} className="transition-all hover:shadow-md cursor-pointer">
              <CardContent className="flex items-start gap-4 p-5">
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="size-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
