import type { Metadata } from 'next'
import SeasonalParticles from '@/components/SeasonalParticles'
import SeasonalThemeApplier from '@/components/SeasonalThemeApplier'
import InAppBrowserBanner from '@/components/InAppBrowserBanner'
import ContentProtection from '@/components/ContentProtection'
import Watermark from '@/components/Watermark'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function ClubLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <InAppBrowserBanner />
      <ContentProtection />
      <Watermark />
      <SeasonalThemeApplier />
      <SeasonalParticles />
      {children}
    </>
  )
}
