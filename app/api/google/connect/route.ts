import { NextRequest, NextResponse } from 'next/server'
import { buildConsentUrl, googleConfigured } from '@/lib/server/gdrive'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest) {
  if (!googleConfigured()) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/integrations/google?error=not_configured`,
    )
  }

  // Require a signed-in user; carry their id through OAuth state.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/login`)
  }

  const state = Buffer.from(JSON.stringify({ uid: user.id })).toString('base64url')
  return NextResponse.redirect(buildConsentUrl(state))
}
