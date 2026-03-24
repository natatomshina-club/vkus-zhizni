'use client'

const COLORS = ['#7C5CFC', '#4CAF78', '#FF9F43', '#FF6B9D', '#4A90E2']

function getColor(name: string): string {
  if (!name) return COLORS[0]
  return COLORS[name.charCodeAt(0) % COLORS.length]
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

interface AvatarProps {
  url?: string | null
  name: string
  size?: number
}

export default function Avatar({ url, name, size = 40 }: AvatarProps) {
  const fontSize = Math.max(10, Math.round(size * 0.35))

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          display: 'block',
        }}
      />
    )
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: getColor(name),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize,
        fontWeight: 700,
        color: '#fff',
        fontFamily: 'var(--font-nunito)',
        userSelect: 'none',
      }}
    >
      {getInitials(name) || '?'}
    </div>
  )
}
