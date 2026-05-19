import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const BUCKET = 'channel-media'
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif']

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null) as {
    channel?: string
    filename?: string
    content_type?: string
    size?: number
  } | null

  if (!body?.channel || !body?.filename || !body?.content_type) {
    return NextResponse.json({ error: 'channel, filename, content_type обязательны' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(body.content_type)) {
    return NextResponse.json({ error: 'Можно загружать только фото (jpg, png, webp, heic)' }, { status: 400 })
  }

  if (!body.size || body.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Размер файла обязателен и не должен превышать 10MB' }, { status: 400 })
  }

  const ext = body.filename.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') ?? 'jpg'
  const path = `${body.channel}/${user.id}/${Date.now()}.${ext}`

  const admin = createServiceClient()
  console.log('Creating signed URL for path:', path)
  const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path)
  console.log('Signed URL result:', data, error)

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Ошибка создания URL' }, { status: 500 })
  }

  const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(path)

  return NextResponse.json({ signedUrl: data.signedUrl, path, publicUrl })
}
