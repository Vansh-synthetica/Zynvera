import { NextResponse } from 'next/server'
import { disconnect } from '@/lib/server/gdrive'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  await disconnect(user.id)
  return NextResponse.json({ ok: true })
}
