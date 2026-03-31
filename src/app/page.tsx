import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createSupabasePublic } from '@/lib/supabase/public'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'

export const metadata: Metadata = {
  title: 'Наталья Томшина — нутрициолог, метаболическое питание для похудения',
  description: 'Похудеть без голода и диет через метаболическое питание. Наталья Томшина — нутрициолог, основатель клуба «Вкус Жизни». 4000+ участниц, результаты от −15 до −83 кг.',
  alternates: { canonical: 'https://nata-tomshina.ru' },
}

export const revalidate = 3600

interface BlogPost {
  id: string; slug: string; title: string
  excerpt: string | null; cover_image_url: string | null; published_at: string | null
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

export default async function HomePage() {
  const supabase = createSupabasePublic()
  const { data: latestPosts } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, cover_image_url, published_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(3)

  const posts = (latestPosts ?? []) as BlogPost[]

  return (
    <div style={{ background: '#FAF8FF', minHeight: '100vh', overflowX: 'hidden' }}>
      <PublicNav currentPage="/" />

      {/* HERO */}
      <section style={{
        background: 'linear-gradient(135deg, #1A0E4E 0%, #3D2B8A 55%, #5B3FA8 100%)',
        padding: '80px 5% 88px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'rgba(76,175,120,.07)', top: -200, right: -100, pointerEvents: 'none' }} />
        <div className="hero-grid" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr auto', gap: 48, alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#7BDFAA', marginBottom: 20 }}>
              <span style={{ display: 'block', width: 24, height: 2, background: '#7BDFAA', borderRadius: 2 }} />
              Нутрициолог · Метаболическое питание
            </div>
            <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(28px, 4.5vw, 52px)', fontWeight: 700, color: '#fff', lineHeight: 1.15, margin: '0 0 20px' }}>
              Похудеть без голода<br />
              <span style={{ color: '#7BDFAA' }}>и диет — это реально</span>
            </h1>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,.75)', lineHeight: 1.65, maxWidth: 560, margin: '0 0 36px' }}>
              Наталья Томшина — нутрициолог, которая помогает женщинам восстановить метаболизм
              и снизить вес через питание. Не через ограничения — через понимание своего организма.
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link href="/about" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#4CAF78', color: '#fff', fontFamily: 'var(--font-unbounded)', fontSize: 14, fontWeight: 700, padding: '14px 28px', borderRadius: 100, textDecoration: 'none', boxShadow: '0 6px 20px rgba(76,175,120,.4)' }}>
                Узнать о методе →
              </Link>
              <Link href="/results" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.1)', color: '#fff', fontFamily: 'var(--font-unbounded)', fontSize: 14, fontWeight: 700, padding: '14px 28px', borderRadius: 100, textDecoration: 'none', border: '1.5px solid rgba(255,255,255,.2)' }}>
                Результаты участниц →
              </Link>
            </div>
          </div>
          <div style={{ width: 220, height: 220, borderRadius: '50%', overflow: 'hidden', border: '4px solid rgba(255,255,255,.15)', flexShrink: 0 }} className="hero-photo">
            <Image src="/images/natalia.jpg" alt="Наталья Томшина" width={220} height={220} style={{ objectFit: 'cover' }} priority />
          </div>
        </div>
      </section>

      {/* МЕТОД */}
      <section style={{ padding: '72px 5%' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(20px,3vw,30px)', fontWeight: 700, color: '#3D2B8A', margin: '0 0 48px', textAlign: 'center' }}>
            Метаболическое питание — в чём суть
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }} className="method-grid">
            {[
              { icon: '🎯', title: 'Работаем с причиной', text: 'Инсулин управляет жиром. Снижаем инсулин — тело само начинает худеть.' },
              { icon: '🍽', title: 'Едим до сытости', text: 'Белок и правильные жиры дают сытость на 5–7 часов. Никакого голода и подсчёта калорий.' },
              { icon: '💚', title: 'Результат годами', text: 'Участницы держат вес 3–4 года потому что это образ жизни, а не временная диета.' },
            ].map(({ icon, title, text }) => (
              <div key={title} style={{ background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 24, padding: '32px 28px' }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{icon}</div>
                <h3 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 16, fontWeight: 700, color: '#3D2B8A', margin: '0 0 10px' }}>{title}</h3>
                <p style={{ fontSize: 15, color: '#7B6FAA', lineHeight: 1.65, margin: 0 }}>{text}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link href="/about" style={{ fontSize: 14, fontWeight: 600, color: '#7C5CFC', textDecoration: 'none' }}>
              Подробнее об авторе и методе →
            </Link>
          </div>
        </div>
      </section>

      {/* ДЛЯ КОГО */}
      <section style={{ background: '#fff', padding: '64px 5%', borderTop: '1.5px solid #EDE8FF', borderBottom: '1.5px solid #EDE8FF' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 700, color: '#3D2B8A', margin: '0 0 28px', textAlign: 'center' }}>
            Это работает даже если у вас...
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 32 }}>
            {['Гипотиреоз', 'Инсулинорезистентность', 'Диабет 2 типа', 'СПКЯ', 'Менопауза', 'Вес 100+ кг', '«Ветеран диет»', 'Возраст 50–70 лет'].map(tag => (
              <span key={tag} style={{ fontSize: 14, fontWeight: 600, color: '#3D2B8A', background: '#EDE8FF', padding: '8px 18px', borderRadius: 100, border: '1.5px solid #DDD5FF' }}>
                {tag}
              </span>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <Link href="/results" style={{ fontSize: 14, fontWeight: 600, color: '#7C5CFC', textDecoration: 'none' }}>Смотреть все результаты →</Link>
          </div>
        </div>
      </section>

      {/* РЕЗУЛЬТАТЫ */}
      <section style={{ padding: '72px 5%' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(20px,3vw,30px)', fontWeight: 700, color: '#3D2B8A', margin: '0 0 40px', textAlign: 'center' }}>Реальные результаты</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }} className="results-grid">
            {[
              { kg: '−43 кг', name: 'Алёна', period: 'за год', stripe: '#4CAF78', desc: 'Начинала с 106 кг. Кожа не обвисла — подтянулась. Теперь хочу двигаться просто потому что могу.' },
              { kg: '−39 кг', name: 'Лариса', period: '55 лет', stripe: '#7C5CFC', desc: 'Давление 170/100 → 125/80. Кардиолог сам отменил таблетки. Теперь хожу в горы.' },
              { kg: '−18 кг', name: 'Тамара', period: '62 года · гипотиреоз', stripe: '#4CAF78', desc: 'Врачи говорили — при гипотиреозе в 62 года это невозможно. Я им показала анализы.' },
            ].map(({ kg, name, period, stripe, desc }) => (
              <div key={name} style={{ background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 24, overflow: 'hidden' }}>
                <div style={{ height: 4, background: stripe }} />
                <div style={{ padding: '24px 22px' }}>
                  <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 42, fontWeight: 700, color: stripe, lineHeight: 0.9, marginBottom: 12 }}>{kg}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-unbounded)', fontSize: 15, fontWeight: 700, color: '#1A1230' }}>{name}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#2E7D50', background: '#E8F5EE', padding: '2px 10px', borderRadius: 100 }}>{period}</span>
                  </div>
                  <p style={{ fontSize: 14, color: '#7B6FAA', lineHeight: 1.65, fontStyle: 'italic', margin: 0 }}>«{desc}»</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link href="/results" style={{ fontFamily: 'var(--font-unbounded)', fontSize: 14, fontWeight: 700, color: '#fff', background: '#3D2B8A', padding: '13px 32px', borderRadius: 100, textDecoration: 'none' }}>Все истории →</Link>
          </div>
        </div>
      </section>

      {/* КЛУБ */}
      <section style={{ background: 'linear-gradient(135deg, #1A0E4E 0%, #3D2B8A 100%)', padding: '72px 5%' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(22px,3.5vw,36px)', fontWeight: 700, color: '#fff', margin: '0 0 12px' }}>Клуб «Вкус Жизни»</h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,.65)', maxWidth: 480, margin: '0 auto 44px', lineHeight: 1.6 }}>Всё что нужно для изменений — в одном месте</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, maxWidth: 800, margin: '0 auto 40px' }} className="club-grid">
            {[
              { icon: '🍳', label: 'Умная кухня' },
              { icon: '📚', label: 'Курсы и вебинары' },
              { icon: '💬', label: 'Живое сообщество' },
              { icon: '🏃', label: 'Марафоны' },
            ].map(({ icon, label }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,.08)', border: '1.5px solid rgba(255,255,255,.12)', borderRadius: 20, padding: '24px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>{icon}</div>
                <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{label}</div>
              </div>
            ))}
          </div>
          <Link href="/club" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#4CAF78', color: '#fff', fontFamily: 'var(--font-unbounded)', fontSize: 15, fontWeight: 700, padding: '16px 36px', borderRadius: 100, textDecoration: 'none', boxShadow: '0 6px 24px rgba(76,175,120,.4)' }}>
            Узнать о клубе →
          </Link>
        </div>
      </section>

      {/* БЛОГ */}
      {posts.length > 0 && (
        <section style={{ padding: '72px 5%' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36, flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(20px,3vw,28px)', fontWeight: 700, color: '#3D2B8A', margin: 0 }}>Из блога</h2>
              <Link href="/blog" style={{ fontSize: 14, fontWeight: 600, color: '#7C5CFC', textDecoration: 'none' }}>Все статьи →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }} className="blog-preview-grid">
              {posts.map(post => (
                <Link key={post.id} href={`/blog/${post.slug}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
                  <article style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', border: '1.5px solid #EDE8FF', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {post.cover_image_url && (
                      <div style={{ aspectRatio: '16/9', overflow: 'hidden', position: 'relative' }}>
                        <Image src={post.cover_image_url} alt={post.title} fill style={{ objectFit: 'cover' }} sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw" />
                      </div>
                    )}
                    <div style={{ padding: '18px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 14, fontWeight: 700, color: '#3D2B8A', margin: '0 0 8px', lineHeight: 1.4 }}>{post.title}</h3>
                      {post.excerpt && (
                        <p style={{ fontSize: 13, color: '#7B6FAA', margin: '0 0 12px', lineHeight: 1.6, flex: 1 }}>
                          {post.excerpt.length > 100 ? post.excerpt.slice(0, 100) + '\u2026' : post.excerpt}
                        </p>
                      )}
                      <p style={{ fontSize: 11, color: '#B0A8D4', margin: 0 }}>{formatDate(post.published_at)}</p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ФИНАЛЬНЫЙ CTA */}
      <section style={{ padding: '72px 5%', background: '#fff', borderTop: '1.5px solid #EDE8FF' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🎁</div>
          <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(20px,3vw,28px)', fontWeight: 700, color: '#3D2B8A', margin: '0 0 12px' }}>Начните с бесплатного мини-курса</h2>
          <p style={{ fontSize: 16, color: '#7B6FAA', lineHeight: 1.65, margin: '0 auto 32px', maxWidth: 440 }}>
            «Волшебный пендель» — 7 уроков о том, почему диеты не работают и что делать прямо завтра
          </p>
          <Link href="/free" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#4CAF78', color: '#fff', fontFamily: 'var(--font-unbounded)', fontSize: 15, fontWeight: 700, padding: '16px 36px', borderRadius: 100, textDecoration: 'none', boxShadow: '0 6px 24px rgba(76,175,120,.4)' }}>
            Получить бесплатно →
          </Link>
          <div style={{ marginTop: 16 }}>
            <a href="https://club.nata-tomshina.ru/join?plan=trial" style={{ fontSize: 13, color: '#7B6FAA', textDecoration: 'none' }}>Или попробуйте клуб 7 дней за 149 ₽ →</a>
          </div>
        </div>
      </section>

      <PublicFooter />

      <style>{`
        @media (max-width: 900px) {
          .method-grid, .results-grid, .blog-preview-grid { grid-template-columns: 1fr 1fr !important; }
          .club-grid { grid-template-columns: repeat(2,1fr) !important; }
          .hero-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .method-grid, .results-grid, .blog-preview-grid { grid-template-columns: 1fr !important; }
          .hero-photo { display: none !important; }
          .club-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>
    </div>
  )
}
