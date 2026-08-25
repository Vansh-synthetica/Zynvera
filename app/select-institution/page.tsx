'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Building2, Check, KeyRound, Loader2, AlertCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'
import { useWorkspace } from '@/lib/workspace-context'
import { createClient } from '@/lib/supabase/client'

export default function SelectInstitutionPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { setWorkspace } = useWorkspace()
  const supabase = createClient()

  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [okMsg, setOkMsg] = useState('')
  const [checking, setChecking] = useState(true)

  // If the user already belongs to an institution, never show this page.
  useEffect(() => {
    if (!user?.id) { setChecking(false); return }
    supabase
      .from('users')
      .select('institution_id, role, name')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.institution_id) {
          const dash =
            data.role === 'teacher' ? '/teacher/dashboard'
            : data.role === 'parent' ? '/parent/dashboard'
            : data.role === 'student' ? '/student/dashboard'
            : '/principal/dashboard'
          setWorkspace({
            institutionId: data.institution_id,
            campusId: null,
            termId: '',
            role: data.role,
            userName: data.name,
            userId: user.id,
            joinedAt: new Date().toISOString(),
          } as any)
          router.replace(dash)
        } else {
          setChecking(false)
        }
      })
  }, [user?.id])

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setOkMsg('')
    if (!user?.id) return setError('Sign in first.')
    if (code.trim().length !== 8) return setError('Enter the full 8-digit join code from your school.')

    setBusy(true)
    try {
      // Verify the code (definer RPC — codes are not publicly readable).
      const { data: instId, error: rpcErr } = await supabase.rpc('verify_join_code', { code: code.trim() })
      if (rpcErr) throw rpcErr
      if (!instId) throw new Error('That code does not match any school. Check with your principal.')

      // Join: set institution on own profile.
      const { error: upErr } = await supabase
        .from('users')
        .update({ institution_id: instId, verification_status: 'verified' })
        .eq('id', user.id)
      if (upErr) throw upErr

      // Load the institution name for the workspace.
      const { data: inst } = await supabase
        .from('institutions')
        .select('name')
        .eq('id', instId)
        .single()

      // Role from profile.
      const { data: prof } = await supabase
        .from('users')
        .select('role, name')
        .eq('id', user.id)
        .single()

      const role = prof?.role ?? 'student'
      setWorkspace({
        institutionId: instId,
        campusId: null,
        termId: '',
        role,
        userName: prof?.name ?? 'Member',
        userId: user.id,
        joinedAt: new Date().toISOString(),
      } as any)

      setOkMsg('Joined ' + (inst?.name ?? 'your school') + '!')
      const dash =
        role === 'teacher' ? '/teacher/dashboard'
        : role === 'parent' ? '/parent/dashboard'
        : role === 'student' ? '/student/dashboard'
        : '/principal/dashboard'
      setTimeout(() => router.replace(dash), 700)
    } catch (e: any) {
      setError(e?.message ?? 'Could not join — try again.')
    } finally {
      setBusy(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin mr-2" /> Checking your workspace…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">Z</span>
            Zynvera
          </Link>
          <p className="mt-3 text-muted-foreground">Join your school's workspace</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="size-5 text-primary" />
              <h1 className="font-semibold">Enter your school's join code</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Your principal shares an 8-digit code. Only people with it can enter —
              no open browsing, no strangers.
            </p>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" /> {error}
              </div>
            )}
            {okMsg && (
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950 p-3 text-sm text-green-700 dark:text-green-400">
                <Check className="size-4 shrink-0" /> {okMsg}
              </div>
            )}

            <form onSubmit={handleJoin} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="join-code" className="flex items-center gap-1.5">
                  <KeyRound className="size-3.5" /> Join code
                </Label>
                <Input
                  id="join-code"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="12345678"
                  maxLength={8}
                  inputMode="numeric"
                  className="font-mono tracking-[0.3em] text-center text-lg"
                  autoFocus
                />
              </div>
              <Button type="submit" disabled={busy} className="w-full gap-2">
                {busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                Join School
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-xs text-muted-foreground text-center">
          Wrong school or need a new code? Contact your principal — they can regenerate it anytime.
        </p>
      </div>
    </div>
  )
}
