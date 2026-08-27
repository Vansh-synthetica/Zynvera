'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, AlertCircle, KeyRound, Copy, Check, ShieldCheck } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getUser } from '@/lib/api/students'
import { useWorkspace } from '@/lib/workspace-context'

export default function FamilyCodePage() {
  const { userId } = useWorkspace()
  const [code, setCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)
      setError('')
      const me = await getUser(userId)
      setCode((me as any).family_code ?? null)
    } catch (e: any) {
      setError(e?.message ?? 'Could not load your code')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  const copy = async () => {
    if (!code) return
    await navigator.clipboard.writeText(code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-md px-4 py-6 space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Family Code</h1>
          <p className="text-sm text-muted-foreground">
            Share this unique 8-digit code only with your parents/guardians — it's how they get verified access to your progress
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        <Card>
          <CardContent className="p-6 space-y-4 text-center">
            {loading ? (
              <Loader2 className="size-6 animate-spin mx-auto text-muted-foreground" />
            ) : code ? (
              <>
                <KeyRound className="size-8 mx-auto text-primary" />
                <p className="text-4xl font-mono font-bold tracking-[0.3em] select-all">{code}</p>
                <Button onClick={copy} variant="outline" size="sm" className="gap-1.5">
                  {copied ? (
                    <>
                      <Check className="size-3.5 text-green-600" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" /> Copy code
                    </>
                  )}
                </Button>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1.5 text-xs text-muted-foreground">
            <p className="flex items-start gap-2">
              <ShieldCheck className="size-4 shrink-0 mt-0.5 text-green-600" />
              A parent enters this code with your school email to request access to your record.
            </p>
            <p className="flex items-start gap-2">
              <ShieldCheck className="size-4 shrink-0 mt-0.5 text-green-600" />
              The school verifies and approves before they can see anything.
            </p>
            <p className="flex items-start gap-2">
              <ShieldCheck className="size-4 shrink-0 mt-0.5 text-green-600" />
              They can only see your grades and attendance — never another student's.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
