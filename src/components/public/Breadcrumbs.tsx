import Link from 'next/link'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export function Breadcrumbs({ items, dark }: { items: BreadcrumbItem[]; dark?: boolean }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `https://nata-tomshina.ru${item.href}` } : {}),
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <nav aria-label="breadcrumb" style={{ padding: '12px 0', marginBottom: 4 }}>
        <ol style={{ display: 'flex', alignItems: 'center', gap: 6, listStyle: 'none', margin: 0, padding: 0, flexWrap: 'wrap' }}>
          {items.map((item, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {i > 0 && <span style={{ color: dark ? 'rgba(255,255,255,.35)' : '#B0A8D4', fontSize: 12 }}>›</span>}
              {item.href ? (
                <Link href={item.href} style={{ fontSize: 13, color: dark ? 'rgba(255,255,255,.55)' : '#7B6FAA', textDecoration: 'none' }}>
                  {item.label}
                </Link>
              ) : (
                <span style={{ fontSize: 13, color: dark ? 'rgba(255,255,255,.8)' : '#3D2B8A', fontWeight: 600,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '260px' }}>
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
}
