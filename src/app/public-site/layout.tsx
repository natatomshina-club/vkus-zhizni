import { Playfair_Display, Manrope } from 'next/font/google'
import './theme.css'
import './blog-content.css'

const playfairDisplay = Playfair_Display({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-serif-display',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
})

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
})

export default function PublicSiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`public-theme ${playfairDisplay.variable} ${manrope.variable}`}>
      {children}
    </div>
  )
}
