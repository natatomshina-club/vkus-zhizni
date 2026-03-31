import Link from 'next/link'

export default function BlogNotFound() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        background: '#FAF8FF',
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: 64, margin: '0 0 16px' }}>📄</p>
      <h1
        style={{
          fontFamily: 'var(--font-unbounded)',
          fontSize: 28,
          fontWeight: 700,
          color: '#3D2B8A',
          margin: '0 0 12px',
        }}
      >
        Статья не найдена
      </h1>
      <p
        style={{
          fontFamily: 'var(--font-nunito)',
          fontSize: 16,
          color: '#7B6FAA',
          margin: '0 0 32px',
        }}
      >
        Возможно, она была удалена или адрес изменился.
      </p>
      <Link
        href="/blog"
        style={{
          display: 'inline-block',
          padding: '12px 28px',
          borderRadius: 14,
          background: '#3D2B8A',
          color: '#fff',
          fontFamily: 'var(--font-nunito)',
          fontSize: 15,
          fontWeight: 700,
          textDecoration: 'none',
        }}
      >
        ← Все статьи
      </Link>
    </main>
  )
}
