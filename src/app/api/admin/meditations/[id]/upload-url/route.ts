import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: 'Unauthorized', status: 401 as const }
  const { data: member } = await supabase.from('members').select('role').eq('id', user.id).single()
  if (member?.role !== 'admin') return { user: null, error: 'Forbidden', status: 403 as const }
  return { user, error: null, status: 200 as const }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const body = await req.json().catch(() => ({})) as { fileName?: string; contentType?: string }
  const fileName = body.fileName ?? 'audio.mp3'
  const lowerName = fileName.toLowerCase()
  const ext = lowerName.endsWith('.m4a') ? 'm4a' : 'mp3'

  const admin = createServiceClient()

  const { data: meditation, error: medErr } = await admin
    .from('meditations')
    .select('id, course_id')
    .eq('id', id)
    .single()

  if (medErr || !meditation) {
    console.error('[upload-url] meditation not found:', id, medErr)
    return NextResponse.json({ error: 'Meditation not found' }, { status: 404 })
  }

  const filePath = `${meditation.course_id}/${meditation.id}.${ext}`

  const { data, error: signErr } = await admin.storage
    .from('meditation-audio')
    .createSignedUploadUrl(filePath)

  if (signErr || !data) {
    console.error('[upload-url] createSignedUploadUrl error:', signErr)
    return NextResponse.json({ error: signErr?.message ?? 'Failed to create signed URL' }, { status: 500 })
  }

  const { data: { publicUrl } } = admin.storage
    .from('meditation-audio')
    .getPublicUrl(filePath)

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    path: filePath,
    publicUrl,
  })
}
