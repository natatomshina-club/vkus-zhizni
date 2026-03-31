import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createServiceClient()
  const { data: member } = await admin.from('members').select('role').eq('email', user.email!).single()
  return member?.role === 'admin' ? admin : null
}

export async function POST(req: NextRequest) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const originalName = file.name
  const ext = originalName.split('.').pop()?.toLowerCase() || 'bin'
  const safeName = originalName
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50)
  const folder = (formData.get('folder') as string) || 'attachments'
  const path = `${folder}/${Date.now()}-${safeName}.${ext}`

  const { error } = await admin.storage
    .from('body-materials')
    .upload(path, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (error) {
    console.error('[body/upload] storage error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: { publicUrl } } = admin.storage
    .from('body-materials')
    .getPublicUrl(path)

  return NextResponse.json({ url: publicUrl, name: file.name })
}
