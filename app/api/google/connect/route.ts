import { NextRequest, NextResponse } from 'next/server'
import { buildConsentUrl, googleConfigured, appBaseUrl } from '@/lib/server/gdrive'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin
  const base = (() => { try { return appBaseUrl(origin) } catch { return origin } })()

  if (!googleConfigured()) {
    return NextResponse.redirect(`${base}/integrations/google?error=not_configured`)
  }

  // Require a signed-in user; carry their id through OAuth state.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${base}/auth/login`)
  }

  const state = Buffer.from(JSON.stringify({ uid: user.id })).toString('base64url')
  return NextResponse.redirect(buildConsentUrl(state, base))
}
