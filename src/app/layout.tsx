import type { Metadata, Viewport } from 'next'
import { Unbounded, Nunito } from 'next/font/google'
import Script from 'next/script'
import { Analytics } from '@/components/public/Analytics'
import './globals.css'

const unbounded = Unbounded({
  variable: '--font-unbounded',
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '600', '700'],
})

const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Наталья Томшина — нутрициолог',
  description: 'Блог Натальи Томшиной о питании для гормонального баланса, здоровом образе жизни и методе умного питания без голода.',
  metadataBase: new URL('https://nata-tomshina.ru'),
  other: {
    'format-detection': 'telephone=no',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-180.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Вкус Жизни" />
        <meta name="theme-color" content="#6B4FA0" />
      </head>
      <body
        className={`${unbounded.variable} ${nunito.variable} antialiased`}
        style={{
          background: '#FAF8FF',
          color: '#2D1F6E',
          fontFamily: 'var(--font-nunito), system-ui, sans-serif',
          margin: 0,
          padding: 0,
        }}
      >
        <Analytics />
        {children}
        <Script
          id="onesignal-sdk"
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          defer
          strategy="afterInteractive"
        />
        <Script
          id="onesignal-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.OneSignalDeferred = window.OneSignalDeferred || [];
              OneSignalDeferred.push(async function(OneSignal) {
                await OneSignal.init({
                  appId: "${process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || ''}",
                  serviceWorkerPath: '/OneSignalSDKWorker.js',
                  serviceWorkerParam: { scope: '/' },
                  notifyButton: { enable: false },
                  promptOptions: { autoPrompt: false, autoRegister: false },
                  notificationClickHandlerMatch: 'origin',
                  notificationClickHandlerAction: 'focus',
                  defaultIconUrl: '/icons/icon-192.png',
                });
              });
            `
          }}
        />
        <Script
          id="yandex-metrika"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(m,e,t,r,i,k,a){
                m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                m[i].l=1*new Date();
                for (var j = 0; j < document.scripts.length; j++) {
                  if (document.scripts[j].src === r) { return; }
                }
                k=e.createElement(t),a=e.getElementsByTagName(t)[0],
                k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
              })(window, document, 'script',
                'https://mc.yandex.ru/metrika/tag.js?id=108262096', 'ym');
              ym(108262096, 'init', {
                ssr: true,
                webvisor: true,
                clickmap: true,
                ecommerce: "dataLayer",
                accurateTrackBounce: true,
                trackLinks: true
              });
            `
          }}
        />
        <noscript>
          <div>
            <img
              src="https://mc.yandex.ru/watch/108262096"
              style={{position:'absolute',left:'-9999px'}}
              alt=""
            />
          </div>
        </noscript>
      </body>
    </html>
  )
}
