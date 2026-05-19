import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: 'Unauthorized', status: 401 as const }
  const { data: member } = await supabase.from('members').select('role').eq('id', user.id).single()
  if (member?.role !== 'admin' && member?.role !== 'curator') return { user: null, error: 'Forbidden', status: 403 as const }
  return { user, error: null, status: 200 as const }
}

function getFileConfig(id: string, type: string) {
  if (type === 'shopping') {
    return {
      fileName: `${id}/shopping-list.pdf`,
      dbField: 'shopping_list_pdf_url',
    }
  }
  return {
    fileName: `marathon-${id}-ration.pdf`,
    dbField: 'ration_pdf_url',
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const url = new URL(req.url)
  const type = url.searchParams.get('type') ?? 'ration'
  const { fileName, dbField } = getFileConfig(id, type)

  const formData = await req.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'Нет файла' }, { status: 400 })

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Нет файла' }, { status: 400 })

  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const admin = createServiceClient()
  const { error: uploadErr } = await admin.storage
    .from('marathon-files')
    .upload(fileName, buffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

  const { data: { publicUrl } } = admin.storage
    .from('marathon-files')
    .getPublicUrl(fileName)

  await admin.from('marathons').update({ [dbField]: publicUrl }).eq('id', id)

  return NextResponse.json({ url: publicUrl })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const url = new URL(req.url)
  const type = url.searchParams.get('type') ?? 'ration'
  const { fileName, dbField } = getFileConfig(id, type)

  const admin = createServiceClient()
  await admin.storage.from('marathon-files').remove([fileName])
  await admin.from('marathons').update({ [dbField]: null }).eq('id', id)

  return NextResponse.json({ ok: true })
}
