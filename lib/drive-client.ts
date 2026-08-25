'use client'

/**
 * Browser-safe Google Drive helpers.
 * Tokens stay server-side; these just call our API routes.
 */

export type DriveStatus = {
  connected: boolean
  email?: string
  rootFolderId?: string
}

export async function getDriveStatus(): Promise<DriveStatus> {
  try {
    const res = await fetch('/api/google/status', { cache: 'no-store' })
    if (!res.ok) return { connected: false }
    return res.json()
  } catch {
    return { connected: false }
  }
}

export function startDriveConnect() {
  window.location.href = '/api/google/connect'
}

export async function disconnectDrive(): Promise<void> {
  await fetch('/api/google/disconnect', { method: 'POST' })
}

/**
 * Upload a file into the user's Zynvera folder tree.
 * Returns a shareable link when `share` is true.
 */
export async function uploadToDrive(
  file: File,
  opts: { path?: string; share?: boolean } = {},
): Promise<{ fileId: string; name: string; webViewLink: string }> {
  const body = new FormData()
  body.append('file', file)
  if (opts.path) body.append('path', opts.path)
  if (opts.share) body.append('share', '1')

  const res = await fetch('/api/drive/upload', { method: 'POST', body })
  const json = await res.json().catch(() => ({}))

  if (!res.ok) {
    if (json?.error === 'NOT_CONNECTED') {
      throw new Error('Connect Google Drive first in Settings → Integrations.')
    }
    throw new Error(json?.error ?? 'Upload failed')
  }
  return json
}
