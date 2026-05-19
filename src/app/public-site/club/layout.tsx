import { Inter } from 'next/font/google'
import './styles.css'

const inter = Inter({
  subsets: ['cyrillic', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

export default function ClubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={inter.className} style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>
      {children}
    </div>
  )
}
