'use client'
import dynamic from 'next/dynamic'

const IRTestWidget = dynamic(() => import('@/components/widgets/IRTestWidget'))
const WhyTestWidget = dynamic(() => import('@/components/widgets/WhyTestWidget'))
const ThyroidTestWidget = dynamic(() => import('@/components/widgets/ThyroidTestWidget'))
const EatingTestWidget = dynamic(() => import('@/components/widgets/EatingTestWidget'))
const CalcWidget = dynamic(() => import('@/components/widgets/CalcWidget'))

interface BlogWidgetProps {
  type: string
}

export default function BlogWidget({ type }: BlogWidgetProps) {
  return (
    <div style={{ marginTop: 48 }}>
      <div style={{
        fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const,
        color: '#7B6FAA', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10,
      }}>
        Проверьте себя
        <span style={{ flex: 1, height: 1.5, background: '#EDE8FF', borderRadius: 2, display: 'block' }} />
      </div>
      {type === 'ir_test' && <IRTestWidget />}
      {type === 'why_test' && <WhyTestWidget />}
      {type === 'thyroid_test' && <ThyroidTestWidget />}
      {type === 'eating_test' && <EatingTestWidget />}
      {type === 'calc_3months' && <CalcWidget />}
    </div>
  )
}
