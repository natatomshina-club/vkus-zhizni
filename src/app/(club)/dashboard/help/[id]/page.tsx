import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

const FORMAT_META: Record<string, { label: string; icon: string; bg: string; color: string }> = {
  video:   { label: 'Видео',  icon: '🎥', bg: '#FFE4EC', color: '#8B1A3A' },
  article: { label: 'Статья', icon: '📄', bg: '#F0EEFF', color: '#7C5CFC' },
  pdf:     { label: 'PDF',    icon: '📎', bg: '#FFF5E8', color: '#C26A00' },
  audio:   { label: 'Аудио', icon: '🎧', bg: '#E8FBF3', color: '#2D6A4F' },
}

export default async function HelpMaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createServiceClient()
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  let isTrial = true
  let isAdmin = false
  if (user?.email) {
    const { data: member } = await admin
      .from('members')
      .select('subscription_status, role')
      .eq('email', user.email)
      .single()
    isTrial = member?.subscription_status !== 'active'
    isAdmin = member?.role === 'admin'
  }

  const { data: material, error } = await admin
    .from('help_materials')
    .select('id, title, description, format, content_url, duration_label, sort_order, attachments, is_published')
    .eq('id', id)
    .single()

  if (error || !material) notFound()
  if (!material.is_published && !isAdmin) notFound()

  // Check trial gating
  if (!isAdmin && isTrial) {
    const { data: allMats } = await admin
      .from('help_materials')
      .select('id')
      .eq('is_published', true)
      .order('sort_order')
    const freeIds = new Set((allMats ?? []).slice(0, 3).map(m => m.id))
    if (!freeIds.has(id)) {
      return (
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 16px 96px', fontFamily: 'var(--font-nunito)' }}>
          <Link href="/dashboard/help" style={{ fontSize: 13, color: '#7B6FAA', textDecoration: 'none', padding: '6px 12px', borderRadius: 10, background: '#F0EEFF', display: 'inline-block', marginBottom: 24 }}>
            ← Вопрос-Ответ
          </Link>
          <div style={{ background: 'linear-gradient(135deg,#3D2B8A 0%,#7C5CFC 100%)', borderRadius: 20, padding: '40px 32px', textAlign: 'center' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>🔒</p>
            <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
              Материал доступен в полном клубе
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 24 }}>
              Откройте доступ ко всем инструкциям и материалам
            </p>
            <Link href="/dashboard/upgrade" style={{ display: 'inline-block', background: '#FFD93D', color: '#5C4200', fontWeight: 800, fontSize: 14, padding: '12px 28px', borderRadius: 100, textDecoration: 'none' }}>
              Открыть полный клуб →
            </Link>
          </div>
        </div>
      )
    }
  }

  const fmt = FORMAT_META[material.format] ?? FORMAT_META.article

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px 96px', fontFamily: 'var(--font-nunito)' }}>
      <Link href="/dashboard/help" style={{ fontSize: 13, color: '#7B6FAA', textDecoration: 'none', padding: '6px 12px', borderRadius: 10, background: '#F0EEFF', display: 'inline-block', marginBottom: 24 }}>
        ← Вопрос-Ответ
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ background: fmt.bg, color: fmt.color, fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>
          {fmt.icon} {fmt.label}
        </span>
        {material.duration_label && (
          <span style={{ fontSize: 12, color: '#9B8FCC', fontWeight: 600 }}>⏱ {material.duration_label}</span>
        )}
      </div>

      <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 8, lineHeight: 1.3 }}>
        {material.title}
      </h1>
      {material.description && (
        <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 24 }}>
          {material.description}
        </p>
      )}

      <div style={{ marginTop: 8 }}>
        {material.format === 'video' && material.content_url && (
          <div style={{ borderRadius: 16, overflow: 'hidden', background: '#000' }}>
            {material.content_url.startsWith('<iframe') ? (
              <div
                style={{ width: '100%', aspectRatio: '16/9' }}
                dangerouslySetInnerHTML={{ __html: material.content_url.replace('<iframe', '<iframe style="width:100%;height:100%;border:none;"') }}
              />
            ) : (
              <div style={{ width: '100%', aspectRatio: '16/9' }}>
                <iframe src={material.content_url} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen />
              </div>
            )}
          </div>
        )}

        {material.format === 'article' && material.content_url && (
          <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 16, padding: '28px 20px' }}>
            {material.content_url.startsWith('http') ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <a href={material.content_url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-block', background: '#F0EEFF', color: '#7C5CFC', fontWeight: 700, fontSize: 14, padding: '12px 28px', borderRadius: 12, textDecoration: 'none' }}>
                  📄 Читать статью →
                </a>
              </div>
            ) : material.content_url.startsWith('<') ? (
              <>
                <div className="article-content" dangerouslySetInnerHTML={{ __html: material.content_url }} />
                <style>{`
                  .article-content h2 { font-size: 20px; font-weight: 800; margin: 24px 0 12px; color: #2D1F6E; }
                  .article-content h3 { font-size: 16px; font-weight: 700; margin: 20px 0 8px; color: #2D1F6E; }
                  .article-content p { margin-bottom: 14px; line-height: 1.7; color: #4A3A8A; font-size: 15px; }
                  .article-content ul, .article-content ol { padding-left: 20px; margin-bottom: 14px; }
                  .article-content li { margin-bottom: 6px; line-height: 1.6; color: #4A3A8A; }
                  .article-content strong { color: #2D1F6E; }
                  .article-content a { color: #7C5CFC; text-decoration: underline; }
                `}</style>
              </>
            ) : (
              <div style={{ fontSize: 15, color: '#4A3A8A', lineHeight: 1.8 }}>
                {material.content_url.split('\n').map((line: string, i: number) => (
                  <p key={i} style={{ marginBottom: 14 }}>{line}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {material.format === 'pdf' && material.content_url && (
          <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>📎 PDF-документ</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Link
                  href={`/dashboard/body/pdf?url=${encodeURIComponent(material.content_url)}`}
                  style={{ background: '#FFF5E8', color: '#C26A00', fontWeight: 700, fontSize: 13, padding: '8px 16px', borderRadius: 10, textDecoration: 'none' }}
                >
                  Открыть PDF →
                </Link>
                <a href={material.content_url} download
                  style={{ background: '#F0EEFF', color: '#7C5CFC', fontWeight: 700, fontSize: 13, padding: '8px 16px', borderRadius: 10, textDecoration: 'none' }}>
                  Скачать ↓
                </a>
              </div>
            </div>
          </div>
        )}

        {material.format === 'audio' && material.content_url && (
          <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 16, padding: '32px 28px', textAlign: 'center' }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>{material.title}</p>
            <audio controls style={{ width: '100%', maxWidth: 480 }} src={material.content_url}>
              Ваш браузер не поддерживает аудио
            </audio>
          </div>
        )}
      </div>

      {/* Attachments */}
      {Array.isArray((material as { attachments?: unknown }).attachments) &&
        ((material as { attachments: { name: string; url: string }[] }).attachments).length > 0 && (
        <div style={{ marginTop: 32 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>
            📎 Материалы
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {((material as { attachments: { name: string; url: string }[] }).attachments).map((att, i) => {
              const ext = att.name.split('.').pop()?.toLowerCase() ?? ''
              const isPdf = ext === 'pdf'
              const icon = isPdf ? '📄' : ['doc','docx'].includes(ext) ? '📝' : ['png','jpg','jpeg'].includes(ext) ? '🖼️' : '📎'
              return (
                <div key={i} style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 22 }}>{icon}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {isPdf && (
                      <Link href={`/dashboard/body/pdf?url=${encodeURIComponent(att.url)}`}
                        style={{ background: '#F0EEFF', color: '#7C5CFC', fontWeight: 700, fontSize: 12, padding: '6px 14px', borderRadius: 8, textDecoration: 'none' }}>
                        Открыть →
                      </Link>
                    )}
                    <a href={att.url} download style={{ background: '#FFF5E8', color: '#C26A00', fontWeight: 700, fontSize: 12, padding: '6px 14px', borderRadius: 8, textDecoration: 'none' }}>
                      Скачать ↓
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
