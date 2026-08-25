import { NextRequest, NextResponse } from 'next/server'
import { uploadFileToDrive } from '@/lib/server/gdrive'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

/**
 * Upload a file into the signed-in user's Zynvera Drive folder.
 * Body: multipart/form-data { file, path ("Submissions/PHY301"), share ("1") }
 * Returns the Drive webViewLink so it can be attached to submissions/notes.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 })

    const rawPath = (form.get('path') as string | null) ?? ''
    const folderPath = rawPath
      .split('/')
      .map(s => s.trim())
      .filter(s => s.length > 0 && /^[A-Za-z0-9 _\-()&']+$/.test(s))
      .slice(0, 4)

    const share = (form.get('share') as string | null) === '1'

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadFileToDrive(
      user.id,
      { buffer, mimeType: file.type || 'application/octet-stream', fileName: file.name },
      folderPath,
      { shareAnyoneWithLink: share },
    )

    return NextResponse.json(result)
  } catch (e: any) {
    const msg = e?.message ?? 'upload failed'
    const status = msg === 'NOT_CONNECTED' ? 400 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
