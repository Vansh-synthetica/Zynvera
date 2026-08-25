'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { useWorkspace } from '@/lib/workspace-context'
import type { Workspace } from '@/types'

export default function LoginPage() {
  const router = useRouter()
  const { signIn, signInWithGoogle, resetPassword } = useAuth()
  const { setWorkspace } = useWorkspace()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [showForgot, setShowForgot] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    const { error: signInError } = await signIn(email, password)
    setLoading(false)
    if (signInError) {
      setError(signInError)
      return
    }
    // Route by profile: members go straight to their dashboard.
    const supabase = (await import('@/lib/supabase/client')).createClient()
    const { data: sess } = await supabase.auth.getSession()
    const uid = sess?.data?.session?.user?.id
    if (uid) {
      const { data: prof } = await supabase
        .from('users')
        .select('institution_id, role, name')
        .eq('id', uid)
        .maybeSingle()
      if (prof?.institution_id) {
        const { data: inst } = await supabase
          .from('institutions')
          .select('name')
          .eq('id', prof.institution_id)
          .single()
        setWorkspace({
          institutionId: prof.institution_id,
          campusId: null,
          termId: '',
          role: prof.role,
          userName: prof.name,
          userId: uid,
          joinedAt: new Date().toISOString(),
        } as any)
        const dash =
          prof.role === 'teacher' ? '/teacher/dashboard'
          : prof.role === 'parent' ? '/parent/dashboard'
          : prof.role === 'student' ? '/student/dashboard'
          : '/principal/dashboard'
        router.push(dash)
        return
      }
    }
    // No institution yet -> join-code page.
    router.push('/select-institution')
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    const { error: googleError } = await signInWithGoogle()
    setLoading(false)
    if (googleError) {
      setError(googleError)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError('Please enter your email address first.')
      return
    }
    setLoading(true)
    const { error: resetError } = await resetPassword(email)
    setLoading(false)
    if (resetError) {
      setError(resetError)
      return
    }
    setForgotSent(true)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground text-sm font-bold">Z</span>
            Zynvera
          </Link>
          <p className="mt-3 text-muted-foreground">Sign in to your institution workspace</p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>Enter your credentials to access your workspace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </div>
            )}

            {!showForgot ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="email" type="email" placeholder="you@institution.edu"
                      value={email} onChange={e => setEmail(e.target.value)}
                      className="pl-10" autoComplete="email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-primary hover:underline">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="password" type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password" value={password}
                      onChange={e => setPassword(e.target.value)} className="pl-10 pr-10"
                      autoComplete="current-password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="remember" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="size-4 rounded border-input" />
                  <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">Remember me</Label>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <>Sign in <ArrowRight className="ml-2 size-4" /></>}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                {forgotSent ? (
                  <div className="space-y-3 text-center">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle2 className="size-6 text-primary" />
                    </div>
                    <p className="text-sm font-medium">Check your email</p>
                    <p className="text-sm text-muted-foreground">We sent a password reset link to {email}</p>
                    <Button variant="outline" type="button" onClick={() => { setShowForgot(false); setForgotSent(false) }}>
                      Back to sign in
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          id="reset-email" type="email" placeholder="you@institution.edu"
                          value={email} onChange={e => setEmail(e.target.value)} className="pl-10"
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? <Loader2 className="size-4 animate-spin" /> : 'Send reset link'}
                    </Button>
                    <Button variant="ghost" type="button" className="w-full" onClick={() => setShowForgot(false)}>
                      Back to sign in
                    </Button>
                  </>
                )}
              </form>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or continue with</span>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={loading}>
              <svg className="mr-2 size-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google
            </Button>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/auth/sign-up" className="text-primary hover:underline font-medium">Create one</Link>
        </p>
      </div>
    </div>
  )
}
