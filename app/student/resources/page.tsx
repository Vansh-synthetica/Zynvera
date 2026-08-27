'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ExternalLink, FileText, FolderOpen, Loader2, AlertCircle } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { listResources } from '@/lib/api/courses'
import { getCoursesByStudent } from '@/lib/api/courses'
import { useWorkspace } from '@/lib/workspace-context'

type ResourceRow = {
  id: string
  title: string
  type: string
  url: string
  size: string | null
}

export default function StudentResourcesPage() {
  const { userId } = useWorkspace()

  const [groups, setGroups] = useState<Array<{ code: string; title: string; items: (ResourceRow & { drive: boolean })[] }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)
      setError('')
      const cs = await getCoursesByStudent(userId)
      const lists = await Promise.all(
        (cs as any[]).map(c => listResources(c.id).catch(() => [])),
      )
      const out = lists
        .map((list, i) => ({
          code: cs[i].code,
          title: cs[i].title,
          items: ((list as any[]) ?? []).map(r => ({
            ...r,
            drive: String(r.url).includes('drive.google.com'),
          })),
        }))
        .filter(g => g.items.length > 0)
        .sort((a, b) => a.code.localeCompare(b.code))

      setGroups(out)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load resources')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  const total = useMemo(() => groups.reduce((s, g) => s + g.items.length, 0), [groups])

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Resources</h1>
            <p className="text-sm text-muted-foreground">Files and links shared by your teachers</p>
          </div>
          <Badge variant="outline">{total} items</Badge>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin mr-2" /> Loading…
          </div>
        ) : total === 0 ? (
          <Card>
            <CardContent className="py-14 text-center space-y-2">
              <FolderOpen className="size-7 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">No resources yet</p>
              <p className="text-sm text-muted-foreground">Course files will appear here as they're shared.</p>
            </CardContent>
          </Card>
        ) : (
          groups.map(g => (
            <Card key={g.code}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{g.code}</Badge>
                  <span className="text-sm font-semibold truncate">{g.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground shrink-0">{g.items.length}</span>
                </div>
                <div className="divide-y border rounded-md">
                  {g.items.map(r => (
                    <a
                      key={r.id}
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted/40 transition-colors"
                    >
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm font-medium truncate flex-1">{r.title}</span>
                      {r.drive && <Badge variant="outline" className="text-[10px] shrink-0">Drive</Badge>}
                      <Badge variant="outline" className="text-[11px] capitalize shrink-0 hidden sm:inline-flex">{r.type}</Badge>
                      {r.size && <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">{r.size}</span>}
                      <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AppShell>
  )
}
