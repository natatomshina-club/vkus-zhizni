'use client'

import { useState } from 'react'

interface Props {
  videoId?: string | null
  coverUrl?: string | null
}

export default function VideoWithCover({ videoId, coverUrl }: Props) {
  const [playing, setPlaying] = useState(false)

  if (!videoId && !coverUrl) return null

  // No cover or user clicked play → show iframe
  if (!coverUrl || playing) {
    if (!videoId) return null
    return (
      <div style={{ position: 'relative', paddingTop: '56.25%' }}>
        <iframe
          src={`https://kinescope.io/embed/${videoId}${playing ? '?autoplay=1' : ''}`}
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media;"
          allowFullScreen
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', borderRadius: '12px' }}
        />
      </div>
    )
  }

  // Has cover — show it with optional play button
  return (
    <div
      onClick={videoId ? () => setPlaying(true) : undefined}
      style={{ position: 'relative', paddingTop: '56.25%', cursor: videoId ? 'pointer' : 'default' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={coverUrl}
        alt="Обложка видео"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
      />
      {videoId && (
        <div
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 56, height: 56,
            background: 'rgba(0,0,0,0.55)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 22, marginLeft: 4, color: '#fff' }}>▶</span>
        </div>
      )}
    </div>
  )
}
