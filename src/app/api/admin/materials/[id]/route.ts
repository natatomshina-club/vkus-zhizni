import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: 'Unauthorized', status: 401 as const }
  const { data: member } = await supabase.from('members').select('role').eq('id', user.id).single()
  if (member?.role !== 'admin') return { user: null, error: 'Forbidden', status: 403 as const }
  return { user, error: null, status: 200 as const }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const { id } = await params
  const admin = createServiceClient()

  // Get material to find storage path
  const { data: material } = await admin
    .from('webinar_materials')
    .select('url, webinar_id, lesson_id')
    .eq('id', id)
    .single()

  if (!material) return NextResponse.json({ error: 'Материал не найден' }, { status: 404 })

  // Extract storage path from public URL
  if (material.url) {
    try {
      const url = new URL(material.url)
      // path: /storage/v1/object/public/webinar-materials/...
      const marker = '/webinar-materials/'
      const idx = url.pathname.indexOf(marker)
      if (idx !== -1) {
        const storagePath = decodeURIComponent(url.pathname.slice(idx + marker.length))
        await admin.storage.from('webinar-materials').remove([storagePath])
      }
    } catch { /* ignore storage errors */ }
  }

  const { error: delErr } = await admin.from('webinar_materials').delete().eq('id', id)
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
