import { NextResponse } from 'next/server'
import { getConnectionStatus } from '@/lib/server/gdrive'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ connected: false }, { status: 200 })
  }

  const status = await getConnectionStatus(user.id)
  return NextResponse.json(status)
}
