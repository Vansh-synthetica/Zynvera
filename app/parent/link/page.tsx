'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, AlertCircle, CheckCircle2, KeyRound, Clock, XCircle } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { requestChildLink, getMyChildren } from '@/lib/api/institution'
import { useWorkspace } from '@/lib/workspace-context'

type Request = {
  id: string
  status: string
  relationship: string
  requested_at: string
  student_user_id: string
  users?: { name?: string; email?: string }
}

export default function ParentLinkPage() {
  const { userId } = useWorkspace()

  const [identifier, setIdentifier] = useState('')
  const [code, setCode] = useState('')
  const [relationship, setRelationship] = useState('guardian')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [okMsg, setOkMsg] = useState('')
  const [requests, setRequests] = useState<Request[]>([])
  const [loadingReqs, setLoadingReqs] = useState(true)

  const loadRequests = useCallback(async () => {
    if (!userId) return
    try {
      setLoadingReqs(true)
      setRequests(((await getMyChildren(userId)) as any[]) ?? [])
    } catch {
      setRequests([])
    } finally {
      setLoadingReqs(false)
    }
  }, [userId])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setError('')
    setOkMsg('')
    if (!identifier.trim() || !code.trim()) {
      setError("Enter your child's email (or ID) and the family code.")
      return
    }
    setBusy(true)
    try {
      await requestChildLink({
        parentUserId: userId,
        childIdentifier: identifier,
        familyCode: code,
        relationship,
      })
      setOkMsg(
        'Request sent! The school will verify and approve it — access unlocks once approved.',
      )
      setIdentifier('')
      setCode('')
      loadRequests()
    } catch (err: any) {
      setError(err?.message ?? 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-xl px-4 py-6 space-y-4">
        <Link href="/parent/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          â† Family Dashboard
        </Link>

        <div>
          <h1 className="text-lg font-semibold">Link Your Child</h1>
          <p className="text-sm text-muted-foreground">
            Ask your child for the Family Code shown on their profile, then request access.
            The school approves before you can see anything.
          </p>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-2.5 text-xs text-destructive">
                <AlertCircle className="size-3.5 shrink-0 mt-0.5" /> {error}
              </div>
            )}
            {okMsg && (
              <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950 p-2.5 text-xs text-green-700 dark:text-green-400">
                <CheckCircle2 className="size-3.5 shrink-0 mt-0.5" /> {okMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="child-id">Child's school email or ID</Label>
                <Input
                  id="child-id"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="alex.morgan@student.riverside.edu"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fam-code" className="flex items-center gap-1.5">
                  <KeyRound className="size-3.5" /> Family code
                </Label>
                <Input
                  id="fam-code"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="12345678"
                  maxLength={8} inputMode="numeric" pattern="[0-9]{8}"
                  className="font-mono tracking-widest"
                  autoComplete="off"
                />
                <p className="text-[11px] text-muted-foreground">
                  Found in their app under My Courses → Family Code.
                </p>
              </div>
              <div className="space-y-1 w-44">
                <Label>Relationship</Label>
                <Select value={relationship} onValueChange={setRelationship}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guardian">Guardian</SelectItem>
                    <SelectItem value="mother">Mother</SelectItem>
                    <SelectItem value="father">Father</SelectItem>
                    <SelectItem value="other">Other family</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={busy} className="w-full gap-1">
                {busy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
                Request Access
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Existing requests */}
        <div>
          <h2 className="text-sm font-semibold mb-2">Your requests</h2>
          {loadingReqs ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="size-4 animate-spin mr-2" /> Loading…
            </div>
          ) : requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requests yet.</p>
          ) : (
            <div className="space-y-2">
              {requests.map(r => (
                <Card key={r.id}>
                  <CardContent className="px-3.5 py-2.5 flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium truncate">{r.users?.name ?? 'Student'}</span>
                    <span className="text-xs text-muted-foreground capitalize">{r.relationship}</span>
                    <span className="ml-auto shrink-0">
                      {r.status === 'approved' && (
                        <Badge className="gap-1 bg-green-100 text-green-700"><CheckCircle2 className="size-3" /> Approved</Badge>
                      )}
                      {r.status === 'pending' && (
                        <Badge variant="secondary" className="gap-1"><Clock className="size-3" /> Pending approval</Badge>
                      )}
                      {r.status === 'rejected' && (
                        <Badge variant="destructive" className="gap-1"><XCircle className="size-3" /> Declined</Badge>
                      )}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
