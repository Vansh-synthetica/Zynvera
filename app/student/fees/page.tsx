'use client'

import { AppShell } from '@/components/app-shell'
import { FeeStatus } from '@/components/fee-status'
import { useWorkspace } from '@/lib/workspace-context'

export default function StudentFeesPage() {
  const { userId } = useWorkspace()

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-lg font-semibold">Fee Status</h1>
          <p className="text-sm text-muted-foreground">
            Your invoices and payments — the same records the school office sees
          </p>
        </div>

        {userId ? (
          <FeeStatus studentUserId={userId} />
        ) : (
          <p className="text-sm text-muted-foreground">Sign in required.</p>
        )}
      </div>
    </AppShell>
  )
}
