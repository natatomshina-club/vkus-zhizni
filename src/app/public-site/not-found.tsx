export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #2F3D2A 0%, #3D2817 60%, #4D6B40 100%)',
    }}>
      <div style={{ textAlign: 'center', color: '#fff', maxWidth: 440, padding: '0 24px' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
        <h1 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 16px' }}>
          Страница не найдена
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, lineHeight: 1.6, margin: '0 0 40px' }}>
          Возможно, ссылка устарела или страница была перемещена
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <a href="/" style={{
            background: '#22c55e', color: '#fff', padding: '14px 24px', borderRadius: 100,
            fontWeight: 700, fontSize: 15, textDecoration: 'none', display: 'block',
          }}>
            На главную
          </a>
          <a href="/blog" style={{
            background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '14px 24px',
            borderRadius: 100, fontWeight: 600, fontSize: 15, textDecoration: 'none', display: 'block',
          }}>
            Читать блог
          </a>
          <a href="/recipes" style={{
            background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '14px 24px',
            borderRadius: 100, fontWeight: 600, fontSize: 15, textDecoration: 'none', display: 'block',
          }}>
            Посмотреть рецепты
          </a>
          <a href="/club" style={{
            border: '2px solid rgba(255,255,255,0.5)', color: '#fff', padding: '14px 24px',
            borderRadius: 100, fontWeight: 600, fontSize: 15, textDecoration: 'none', display: 'block',
          }}>
            О клубе
          </a>
        </div>
      </div>
    </div>
  )
}
