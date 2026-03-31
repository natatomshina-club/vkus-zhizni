'use client'

import { useEffect, useState } from 'react'

function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  // Known in-app browser signatures
  if (/FBAN|FBAV|Instagram|LinkedInApp|MicroMessenger|YaBrowser|mailru|MailRu/i.test(ua)) return true
  // iOS in-app: has iPhone/iPad, no Safari token, not Chrome/Firefox
  if (/iPhone|iPad/i.test(ua) && !/Safari/i.test(ua) && !/CriOS|FxiOS/i.test(ua)) return true
  return false
}

export default function InAppBrowserBanner() {
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fromEmail = new URLSearchParams(window.location.search).get('openInBrowser') === '1'
    if (fromEmail || isInAppBrowser()) {
      setShow(true)
      // Clean param from URL without reload
      if (fromEmail) {
        const url = new URL(window.location.href)
        url.searchParams.delete('openInBrowser')
        window.history.replaceState(null, '', url.toString())
      }
    }
  }, [])

  if (!show) return null

  function handleOpen() {
    const url = window.location.href
    // Try opening in system browser first
    window.open(url, '_blank')
    // Also copy to clipboard as fallback
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 4000)
    }).catch(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 4000)
    })
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: '#3D2B8A', color: '#fff',
      padding: '12px 16px',
      display: 'flex', flexDirection: 'column', gap: 8,
      boxShadow: '0 2px 16px rgba(0,0,0,0.25)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, fontFamily: 'var(--font-nunito)' }}>
          Для корректной работы клуба откройте эту страницу в&nbsp;<strong>Safari</strong>
        </p>
        <button
          onClick={() => setShow(false)}
          style={{
            background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)',
            fontSize: 18, cursor: 'pointer', flexShrink: 0, padding: '0 2px', lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={handleOpen}
          style={{
            background: '#fff', color: '#3D2B8A', border: 'none',
            borderRadius: 8, padding: '8px 16px',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'var(--font-nunito)',
          }}
        >
          Открыть в Safari
        </button>
        {copied && (
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-nunito)' }}>
            Ссылка скопирована — вставьте в Safari
          </span>
        )}
      </div>
    </div>
  )
}
