'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Building2, Check, KeyRound, Loader2, AlertCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
      const { data: instId, error: rpcErr } = await supabase.rpc('verify_join_code', { code: code.trim() })
      if (rpcErr) throw rpcErr
      if (!instId) throw new Error('That code does not match any school. Check with your principal.')

      const { error: upErr } = await supabase
        .from('users')
        .update({ institution_id: instId, verification_status: 'verified' })
        .eq('id', user.id)
      if (upErr) throw upErr

      const { data: inst } = await supabase
        .from('institutions')
        .select('name')
        .eq('id', instId)
        .single()

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
        <Loader2 className="size-5 animate-spin mr-2" /> Checking your workspace...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-base font-bold">Z</span>
            <span className="text-xl font-semibold tracking-tight">Zynvera</span>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">Join your school's workspace</p>
        </div>

        <div className="neo rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-primary" />
            <h1 className="text-sm font-semibold">Enter your school's join code</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Your principal shares an 8-digit code. Only people with it can enter.
          </p>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" /> {error}
            </div>
          )}
          {okMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">
              <Check className="size-4 shrink-0" /> {okMsg}
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-2">
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
        </div>

        <p className="mt-4 text-xs text-muted-foreground text-center">
          Wrong school? Contact your principal for a new code.
        </p>
      </div>
    </div>
  )
}
