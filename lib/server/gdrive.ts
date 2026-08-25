import 'server-only'
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'

/**
 * Server-only Google Drive helper.
 *
 * Design notes:
 * - Tokens are AES-256-GCM encrypted at rest using ENCRYPTION_KEY.
 * - We request the least-privileged `drive.file` scope: the app can only
 *   see and manage files it created itself. Nothing else in the user's
 *   Drive is visible to Zynvera.
 * - All calls happen in route handlers so access tokens never reach the browser.
 */

const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file'
const ROOT_FOLDER_NAME = 'Zynvera'

export type DriveConnection = {
  connected: boolean
  email?: string
  rootFolderId?: string
  expiresAt?: string | null
}

// ── Encryption ───────────────────────────────────────────────────

function key(): Buffer {
  const raw = process.env.ENCRYPTION_KEY
  if (!raw || raw.length !== 64) throw new Error('ENCRYPTION_KEY must be 64 hex chars')
  return Buffer.from(raw, 'hex')
}

export function encrypt(plain: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return [iv.toString('base64'), cipher.getAuthTag().toString('base64'), enc.toString('base64')].join(':')
}

export function decrypt(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(':')
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8')
}

// ── Supabase token store ─────────────────────────────────────────

type TokenRow = {
  id: string
  user_id: string
  provider: string
  access_token_encrypted: string
  refresh_token_encrypted: string | null
  expires_at: string | null
  scope: string | null
  metadata: any
}

async function loadTokenRow(userId: string): Promise<TokenRow | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('integration_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'google_drive')
    .maybeSingle()
  return (data as any) ?? null
}

// ── OAuth ────────────────────────────────────────────────────────

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}

export function buildConsentUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`,
    response_type: 'code',
    scope: `${DRIVE_FILE_SCOPE} https://www.googleapis.com/auth/userinfo.email`,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

async function exchangeCode(code: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`,
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) throw new Error(`Token exchange failed (${res.status})`)
  return (await res.json()) as {
    access_token: string
    refresh_token?: string
    expires_in: number
    scope: string
  }
}

async function refreshToken(refreshTokenPlain: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshTokenPlain,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error('Token refresh failed — reconnect required')
  return (await res.json()) as { access_token: string; expires_in: number }
}

/** Get a valid access token for the user, refreshing + persisting if needed. */
export async function getAccessToken(userId: string): Promise<string> {
  const row = await loadTokenRow(userId)
  if (!row) throw new Error('NOT_CONNECTED')

  // Still fresh? (30s skew)
  if (row.expires_at && new Date(row.expires_at).getTime() > Date.now() + 30_000) {
    return decrypt(row.access_token_encrypted)
  }

  if (!row.refresh_token_encrypted) throw new Error('RECONNECT_REQUIRED')

  const refreshed = await refreshToken(decrypt(row.refresh_token_encrypted))
  const supabase = await createClient()
  await supabase
    .from('integration_tokens')
    .update({
      access_token_encrypted: encrypt(refreshed.access_token),
      expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
    })
    .eq('id', row.id)

  return refreshed.access_token
}

export async function saveConnection(
  userId: string,
  tokenPayload: Awaited<ReturnType<typeof exchangeCode>>,
) {
  const supabase = await createClient()

  // Who signed in?
  const infoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
  })
  const email = infoRes.ok ? (await infoRes.json()).email : null

  // Ensure the Zynvera root folder exists in their Drive.
  const accessToken = tokenPayload.access_token
  let rootFolderId = await findRootFolder(accessToken)

  if (!rootFolderId) {
    rootFolderId = await createFolder(accessToken, ROOT_FOLDER_NAME, null)
  }

  const values = {
    user_id: userId,
    provider: 'google_drive' as const,
    access_token_encrypted: encrypt(tokenPayload.access_token),
    refresh_token_encrypted: tokenPayload.refresh_token
      ? encrypt(tokenPayload.refresh_token)
      : undefined,
    expires_at: new Date(Date.now() + tokenPayload.expires_in * 1000).toISOString(),
    scope: tokenPayload.scope,
    metadata: { email, root_folder_id: rootFolderId },
  }

  await supabase
    .from('integration_tokens')
    .upsert(values, { onConflict: 'user_id,provider' })

  return { email, rootFolderId }
}

export async function getConnectionStatus(userId: string): Promise<DriveConnection> {
  try {
    const row = await loadTokenRow(userId)
    if (!row) return { connected: false }
    return {
      connected: true,
      email: row.metadata?.email ?? undefined,
      rootFolderId: row.metadata?.root_folder_id ?? undefined,
      expiresAt: row.expires_at,
    }
  } catch {
    return { connected: false }
  }
}

export async function disconnect(userId: string) {
  const supabase = await createClient()
  await supabase
    .from('integration_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('provider', 'google_drive')
}

// ── Drive REST helpers ───────────────────────────────────────────

async function driveFetch(url: string, init: RequestInit & { token: string }) {
  const { token, ...rest } = init
  const res = await fetch(url, {
    ...rest,
    headers: { ...(rest.headers ?? {}), Authorization: `Bearer ${token}` },
  })
  if (res.status === 401 || res.status === 403) throw new Error('DRIVE_AUTH_FAILED')
  if (!res.ok) throw new Error(`Drive API error ${res.status}`)
  return res
}

async function findRootFolder(token: string): Promise<string | null> {
  const q = encodeURIComponent(
    `name='${ROOT_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false and 'root' in parents`,
  )
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  const json = await res.json()
  return json.files?.[0]?.id ?? null
}

async function createFolder(token: string, name: string, parentId: string | null): Promise<string> {
  const res = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId ? { parents: [parentId] } : {}),
    }),
  })
  if (!res.ok) throw new Error(`Folder create failed ${res.status}`)
  const json = await res.json()
  return json.id
}

/**
 * Ensure the nested path exists under the Zynvera root, e.g.
 * ["Submissions", "PHY301"] → Zynvera/Submissions/PHY301
 */
export async function ensureFolderPath(userId: string, segments: string[]): Promise<string> {
  const token = await getAccessToken(userId)
  const row = await loadTokenRow(userId)
  let current = row?.metadata?.root_folder_id ?? (await findRootFolder(token))
  if (!current) current = await createFolder(token, ROOT_FOLDER_NAME, null)

  for (const segment of segments) {
    const q = encodeURIComponent(
      `name='${segment.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false and '${current}' in parents`,
    )
    const found = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => (r.ok ? r.json() : { files: [] }))
    current = found.files?.[0]?.id ?? (await createFolder(token, segment, current))
  }
  return current
}

export type UploadResult = {
  fileId: string
  name: string
  webViewLink: string
}

/** Upload a file into the given folder path; returns its Drive link. */
export async function uploadFileToDrive(
  userId: string,
  file: { buffer: Buffer; mimeType: string; fileName: string },
  folderPath: string[],
  opts: { shareAnyoneWithLink?: boolean } = {},
): Promise<UploadResult> {
  const token = await getAccessToken(userId)
  const folderId = await ensureFolderPath(userId, folderPath)

  const boundary = 'zynvera-' + randomBytes(8).toString('hex')
  const metadata = JSON.stringify({ name: file.fileName, parents: [folderId] })

  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    metadata,
    '',
    `--${boundary}`,
    `Content-Type: ${file.mimeType}`,
    '',
  ].join('\r\n')

  const tail = `\r\n--${boundary}--`

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: Buffer.concat([
        Buffer.from(body, 'utf8'),
        file.buffer,
        Buffer.from(tail, 'utf8'),
      ]),
    },
  )
  if (!res.ok) throw new Error(`Upload failed ${res.status}`)
  const uploaded = (await res.json()) as UploadResult

  if (opts.shareAnyoneWithLink) {
    await driveFetch(`https://www.googleapis.com/drive/v3/files/${uploaded.fileId}/permissions`, {
      method: 'POST',
      token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    })
  }

  return uploaded
}
