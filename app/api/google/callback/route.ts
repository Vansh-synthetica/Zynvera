import { NextRequest, NextResponse } from 'next/server'
import { googleConfigured, saveConnection } from '@/lib/server/gdrive'

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const oauthError = url.searchParams.get('error')

  if (oauthError || !code || !state) {
    return NextResponse.redirect(`${appUrl}/integrations/google?error=denied`)
  }
  if (!googleConfigured()) {
    return NextResponse.redirect(`${appUrl}/integrations/google?error=not_configured`)
  }

  let uid: string
  try {
    uid = JSON.parse(Buffer.from(state, 'base64url').toString('utf8')).uid
  } catch {
    return NextResponse.redirect(`${appUrl}/integrations/google?error=bad_state`)
  }

  try {
    const tokens = await exchangeCodeForTokens(code)
    await saveConnection(uid, tokens)
    return NextResponse.redirect(`${appUrl}/integrations/google?connected=1`)
  } catch (e: any) {
    console.error('Google callback failed:', e?.message)
    return NextResponse.redirect(`${appUrl}/integrations/google?error=exchange_failed`)
  }
}

async function exchangeCodeForTokens(code: string) {
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
  return res.json()
}
