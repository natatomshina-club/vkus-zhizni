import { Unbounded, Nunito } from 'next/font/google'

const unbounded = Unbounded({ subsets: ['cyrillic', 'latin'], weight: ['700'] })
const nunito = Nunito({ subsets: ['cyrillic', 'latin'], weight: ['400', '600'] })

export default function BlockedPage() {
  return (
    <div
      className={nunito.className}
      style={{
        minHeight: '100dvh',
        background: '#FAF8FF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 64, marginBottom: 24 }}>⛔</div>

      <h1
        className={unbounded.className}
        style={{ fontSize: 20, fontWeight: 700, color: '#3D2B8A', marginBottom: 12 }}
      >
        Доступ ограничен
      </h1>

      <p style={{ color: '#7B6FAA', fontSize: 15, lineHeight: 1.6, maxWidth: 380, marginBottom: 32 }}>
        Ваш доступ к клубу временно ограничен.<br />
        Если вы считаете это ошибкой — напишите нам, и мы разберёмся.
      </p>

      <a
        href="mailto:nata.tomshina@gmail.com"
        style={{
          display: 'inline-block',
          padding: '14px 28px',
          borderRadius: 16,
          background: '#7C5CFC',
          color: '#fff',
          fontWeight: 700,
          fontSize: 15,
          textDecoration: 'none',
          minHeight: 48,
          lineHeight: '20px',
        }}
      >
        ✉️ nata.tomshina@gmail.com
      </a>
    </div>
  )
}
