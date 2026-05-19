'use client'
import { useEffect } from 'react'
import MinimalHeader from '@/components/public/MinimalHeader'
import HeroSection from './components/HeroSection'
import IntroSection from './components/IntroSection'
import BenefitsSection from './components/BenefitsSection'
import LessonsSection from './components/LessonsSection'
import ReviewsSection from './components/ReviewsSection'
import FinalCtaSection from './components/FinalCtaSection'

declare global {
  interface Window {
    ym?: (id: number, action: string, goal: string) => void
  }
}

export default function FreeLanding() {
  useEffect(() => {
    window.ym?.(108262096, 'reachGoal', 'free_page_view')
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <MinimalHeader />
      <main style={{ flex: 1 }}>
        <HeroSection />
        <IntroSection />
        <BenefitsSection />
        <LessonsSection />
        <ReviewsSection />
        <FinalCtaSection />
      </main>
    </div>
  )
}
