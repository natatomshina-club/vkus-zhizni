export default function UnsubscribedPage() {
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#FAF8FF',
      fontFamily: 'var(--font-nunito)',
      padding: '24px 16px',
    }}>
      <div style={{
        maxWidth: 440,
        background: '#fff',
        borderRadius: 24,
        padding: '40px 32px',
        textAlign: 'center',
        border: '1px solid #EDE8FF',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h1 style={{
          fontFamily: 'var(--font-unbounded)',
          fontSize: 20, fontWeight: 800,
          color: '#3D2B8A', marginBottom: 12,
        }}>
          Вы отписаны
        </h1>
        <p style={{ fontSize: 14, color: '#7B6FAA', lineHeight: 1.6, marginBottom: 20 }}>
          Вы успешно отписались от рассылки «Вкус Жизни».
          <br />
          Если это произошло по ошибке — напишите нам:{' '}
          <a href="mailto:nata.tomshina@gmail.com" style={{ color: '#7C5CFC' }}>
            nata.tomshina@gmail.com
          </a>
        </p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            background: '#F0EEFF',
            color: '#7C5CFC',
            borderRadius: 12,
            padding: '10px 24px',
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          На главную
        </a>
      </div>
    </div>
  )
}
