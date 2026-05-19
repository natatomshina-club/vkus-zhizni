import SHOPPING_LIST from '../data/shoppingList'

export default function ShoppingList() {
  return (
    <div>
      <div style={{
        fontSize: 'var(--text-xs)',
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        color: 'var(--color-green-dark)',
        textTransform: 'uppercase',
        letterSpacing: '0.22em',
      }}>
        — СПИСОК ПОКУПОК
      </div>

      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(24px, 3vw, 34px)',
        fontWeight: 700,
        color: 'var(--color-ink)',
        margin: 'var(--space-3) 0 var(--space-6)',
        lineHeight: 1.2,
      }}>
        Всё, что нужно купить на неделю
      </h2>

      <div className="shopping-grid">
        {SHOPPING_LIST.map(cat => (
          <div
            key={cat.name}
            style={{
              background: 'var(--color-white)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-card)',
              padding: 'var(--space-5)',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-4)',
              paddingBottom: 'var(--space-3)',
              borderBottom: '1px solid var(--color-border)',
            }}>
              <span style={{ fontSize: 24 }}>{cat.icon}</span>
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--color-ink)',
              }}>
                {cat.name}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cat.items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: 'var(--space-3)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 14,
                    lineHeight: 1.4,
                    paddingBottom: i < cat.items.length - 1 ? 8 : 0,
                    borderBottom: i < cat.items.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                  }}
                >
                  <span style={{ color: 'var(--color-ink)' }}>{item.name}</span>
                  <span style={{
                    color: 'var(--color-green-dark)',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    {item.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .shopping-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        @media (max-width: 640px) {
          .shopping-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
