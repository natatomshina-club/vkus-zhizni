import type { Metadata, Viewport } from 'next'
import { Unbounded, Nunito } from 'next/font/google'
import './globals.css'
import SeasonalParticles from '@/components/SeasonalParticles'
import SeasonalThemeApplier from '@/components/SeasonalThemeApplier'

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
  title: 'Вкус Жизни — Клуб стройных и здоровых',
  description: 'Клуб питания для гормонального баланса Натальи Томшиной',
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
      <body className={`${unbounded.variable} ${nunito.variable} antialiased`}>
        <SeasonalThemeApplier />
        <SeasonalParticles />
        {children}
      </body>
    </html>
  )
}
