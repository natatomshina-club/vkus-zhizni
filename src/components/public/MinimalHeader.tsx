export default function MinimalHeader() {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      height: 64,
      background: 'rgba(250, 249, 245, 0.96)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(0,0,0,0.07)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 5%',
    }}>
      <a
        href="/"
        style={{
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '1px',
          lineHeight: 1.2,
        }}
      >
        <span style={{
          fontFamily: 'var(--font-serif-display)',
          fontSize: '17px',
          fontWeight: 600,
          color: 'var(--color-text)',
          letterSpacing: '0.01em',
        }}>
          Наталья Томшина
        </span>
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '11px',
          fontWeight: 400,
          color: 'var(--color-text-muted)',
          letterSpacing: '0.04em',
        }}>
          интегративный нутрициолог
        </span>
      </a>
    </header>
  )
}
