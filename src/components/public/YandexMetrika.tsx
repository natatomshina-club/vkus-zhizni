'use client'
import { usePathname } from 'next/navigation'
import Script from 'next/script'

export function YandexMetrika() {
  const pathname = usePathname()
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) return null

  return (
    <>
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
    </>
  )
}
