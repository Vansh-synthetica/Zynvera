'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  HardDrive,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Link2,
  FolderTree,
  ShieldCheck,
  Unlink,
} from 'lucide-react'
import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  getDriveStatus,
  startDriveConnect,
  disconnectDrive,
  type DriveStatus,
} from '@/lib/drive-client'

const ERRORS: Record<string, string> = {
  not_configured:
    'Google Drive is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local.',
  denied: 'Connection was cancelled before finishing.',
  bad_state: 'Connection state was invalid — please try again.',
  exchange_failed: 'Could not complete the Google handshake — please try again.',
}

export default function GoogleIntegrationPage() {
  const params = useSearchParams()
  const [status, setStatus] = useState<DriveStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const errorKey = params.get('error')
  const justConnected = params.get('connected') === '1'

  const refresh = useCallback(async () => {
    setLoading(true)
    setStatus(await getDriveStatus())
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleDisconnect = async () => {
    setBusy(true)
    await disconnectDrive()
    await refresh()
    setBusy(false)
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6 space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Google Drive</h1>
          <p className="text-sm text-muted-foreground">
            Keep notes and submissions in your own Drive — safe from lost devices
          </p>
        </div>

        {(errorKey && ERRORS[errorKey]) && (
          <div className="flex items-start gap-2 rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            {ERRORS[errorKey]}
          </div>
        )}

        {justConnected && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950 p-3 text-sm text-green-700 dark:text-green-400">
            <CheckCircle2 className="size-4 shrink-0" />
            Google Drive connected! Your Zynvera folder is ready.
          </div>
        )}

        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg border bg-muted/40">
                  <HardDrive className="size-5" />
                </div>
                <div>
                  <p className="font-medium">Zynvera workspace in your Drive</p>
                  <p className="text-xs text-muted-foreground">
                    Notes, submissions and shared resources live in a folder we create for you
                  </p>
                </div>
              </div>

              {loading ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : status?.connected ? (
                <Badge className="gap-1 bg-green-100 text-green-700">
                  <CheckCircle2 className="size-3" /> Connected
                </Badge>
              ) : (
                <Badge variant="outline">Not connected</Badge>
              )}
            </div>

            {!loading && status?.connected && (
              <div className="rounded-md border bg-muted/30 p-3 space-y-1.5 text-sm">
                <p className="flex items-center gap-2">
                  <Link2 className="size-3.5 text-muted-foreground" />
                  Account: <span className="font-medium">{status.email ?? 'Google account'}</span>
                </p>
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FolderTree className="size-3.5 shrink-0" />
                  Zynvera → Submissions / Notes / Resources (created automatically as needed)
                </p>
              </div>
            )}

            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <ShieldCheck className="size-4 shrink-0 mt-0.5 text-green-600" />
                Zynvera can only see files it created — nothing else in your Drive.
              </li>
              <li className="flex gap-2">
                <ShieldCheck className="size-4 shrink-0 mt-0.5 text-green-600" />
                You stay the owner; sharing links are generated when you submit work.
              </li>
              <li className="flex gap-2">
                <ShieldCheck className="size-4 shrink-0 mt-0.5 text-green-600" />
                Disconnect anytime — your files remain untouched in your Drive.
              </li>
            </ul>

            <div className="flex flex-wrap gap-2 pt-1">
              {!loading && !status?.connected ? (
                <Button onClick={startDriveConnect} className="gap-1">
                  Connect Google Drive
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={startDriveConnect} disabled={busy} className="gap-1">
                    Reconnect / Refresh access
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleDisconnect}
                    disabled={busy}
                    className="gap-1 text-destructive hover:text-destructive"
                  >
                    {busy ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Unlink className="size-4" />
                    )}
                    Disconnect
                  </Button>
                </>
              )}
              <Button asChild variant="ghost">
                <Link href="/settings">Back to Settings</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          Uses Google&apos;s least-privileged <code>drive.file</code> scope.
        </p>
      </div>
    </AppShell>
  )
}
