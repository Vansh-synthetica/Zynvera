'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'

export default function SignUpPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'student' | 'teacher' | 'parent' | 'principal'>('student')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name || !email || !password) {
      setError('Please fill in all fields.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    const { error: signUpError } = await signUp(email, password, name, role)
    setLoading(false)
    if (signUpError) {
      setError(signUpError)
      return
    }
    localStorage.setItem('zynvera-verification', 'unverified')
    setSuccess(true)
    setTimeout(() => router.push('/auth/verification'), 2000)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-base font-bold">Z</span>
            <span className="text-xl font-semibold tracking-tight">Zynvera</span>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">Create your account to get started</p>
        </div>

        <div className="neo rounded-2xl p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          {success ? (
            <div className="space-y-3 text-center py-4">
              <div className="mx-auto size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="size-6 text-primary" />
              </div>
              <p className="text-sm font-medium">Account created successfully!</p>
              <p className="text-sm text-muted-foreground">Redirecting to verification...</p>
            </div>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="name" type="text" placeholder="John Doe"
                    value={name} onChange={e => setName(e.target.value)}
                    className="pl-10" autoComplete="name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>I am a</Label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ['student', 'Student'],
                    ['teacher', 'Teacher'],
                    ['parent', 'Parent'],
                    ['principal', 'Principal'],
                  ] as const).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRole(val)}
                      className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                        role === val
                          ? 'bg-primary text-primary-foreground neo-sm'
                          : 'neo-flat text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="email" type="email" placeholder="you@school.edu"
                    value={email} onChange={e => setEmail(e.target.value)}
                    className="pl-10" autoComplete="email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="password" type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters" value={password}
                    onChange={e => setPassword(e.target.value)} className="pl-10 pr-10"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="confirm-password" type={showPassword ? 'text' : 'password'}
                    placeholder="Repeat your password" value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)} className="pl-10"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <>Create account <ArrowRight className="ml-1 size-4" /></>}
              </Button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
