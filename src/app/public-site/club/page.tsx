import type { Metadata } from 'next'
import { getClubMode } from '@/lib/club-mode'
import Header from './_components/Header'
import Hero from './_components/Hero'
import Familiar from './_components/Familiar'
import Method from './_components/Method'
import Stories from './_components/Stories'
import YearNotLong from './_components/YearNotLong'
import Roadmap from './_components/Roadmap'
import BonusWebinars from './_components/BonusWebinars.client'
import WorksFor from './_components/WorksFor'
import Differs from './_components/Differs'
import VideoTour from './_components/VideoTour.client'
import Pricing from './_components/Pricing'
import Author from './_components/Author'
import Faq from './_components/Faq'
import FinalCta from './_components/FinalCta'
import DiagnosticSection from './_components/DiagnosticSection'
import FinalCtaDiagnostic from './_components/FinalCtaDiagnostic'
import Footer from './_components/Footer'

export const metadata: Metadata = {
  title: 'Клуб «Вкус Жизни» — годовая программа Натальи Томшиной',
  description: 'Годовая программа похудения для женщин 35–60 после диет и марафонов. Метаболическое питание, поддержка нутрициолога, чат сообщества. Минус 2–3 кг в месяц без надрыва.',
}

export default function ClubPage() {
  const mode = getClubMode()

  return (
    <div className="club-page">
      <Header />
      <Hero />
      <Familiar />
      <Method />
      <Stories />
      <YearNotLong />
      <Roadmap />
      <BonusWebinars />
      <WorksFor />
      <Differs />
      <VideoTour />
      {mode === 'pricing' ? <Pricing /> : <DiagnosticSection />}
      <Author />
      <Faq />
      {mode === 'pricing' ? <FinalCta /> : <FinalCtaDiagnostic />}
      <Footer />
    </div>
  )
}
