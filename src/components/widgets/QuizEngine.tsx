'use client'
import { useState } from 'react'

interface Option { label: string; score: number }
interface Question { text: string; options: Option[] }
interface Tag { text: string; cls: string }
interface Result { min: number; max: number; emoji: string; title: string; desc: string; tags?: Tag[] }

interface QuizConfig {
  icon: string
  iconBg: string
  title: string
  subtitle: string
  questions: Question[]
  results: Result[]
  maxScore: number
  showScoreBar?: boolean
  ctaText?: string
}

const S = {
  widget: { background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 24, overflow: 'hidden' as const, marginBottom: 20 },
  header: { padding: '24px 28px 0', display: 'flex', alignItems: 'flex-start' as const, gap: 14 },
  iconWrap: (bg: string): React.CSSProperties => ({ width: 48, height: 48, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }),
  title: { fontFamily: 'var(--font-unbounded, var(--font-display))', fontSize: 17, fontWeight: 700, color: '#3D2B8A', marginBottom: 4, lineHeight: 1.25 },
  subtitle: { fontSize: 14, color: '#7B6FAA' },
  body: { padding: '20px 28px 28px' },
  progressWrap: { display: 'flex', alignItems: 'center' as const, gap: 12, marginBottom: 24 },
  progressBar: { flex: 1, height: 6, background: '#EDE8FF', borderRadius: 100, overflow: 'hidden' as const },
  progressFill: (pct: number): React.CSSProperties => ({ height: '100%', background: '#7C5CFC', borderRadius: 100, width: pct + '%', transition: 'width .4s' }),
  progressText: { fontSize: 12, fontWeight: 700, color: '#7B6FAA', whiteSpace: 'nowrap' as const },
  question: { fontSize: 16, fontWeight: 600, color: '#1A1230', marginBottom: 16, lineHeight: 1.5 },
  options: { display: 'flex', flexDirection: 'column' as const, gap: 8 },
  option: (selected: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
    border: selected ? '1.5px solid #3D2B8A' : '1.5px solid #EDE8FF',
    background: selected ? '#EDE8FF' : '#FAF8FF',
    color: selected ? '#3D2B8A' : '#1A1230',
    fontWeight: selected ? 600 : 400,
    fontSize: 14, textAlign: 'left' as const, width: '100%', transition: '.2s',
  }),
  optionDot: (selected: boolean): React.CSSProperties => ({
    width: 20, height: 20, borderRadius: '50%', border: '2px solid currentColor',
    flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: selected ? 'currentColor' : 'transparent',
  }),
  nav: { display: 'flex', justifyContent: 'space-between' as const, alignItems: 'center' as const, marginTop: 20, gap: 12 },
  btnBack: { fontFamily: 'var(--font-unbounded, var(--font-display))', fontSize: 13, fontWeight: 700, padding: '11px 24px', borderRadius: 100, border: '1.5px solid #EDE8FF', background: '#FAF8FF', color: '#7B6FAA', cursor: 'pointer' },
  btnNext: (disabled: boolean): React.CSSProperties => ({ fontFamily: 'var(--font-unbounded, var(--font-display))', fontSize: 13, fontWeight: 700, padding: '11px 24px', borderRadius: 100, border: 'none', background: '#3D2B8A', color: '#fff', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1 }),
  result: { textAlign: 'center' as const, padding: '8px 0' },
  resultEmoji: { fontSize: 52, marginBottom: 12, display: 'block', lineHeight: 1 },
  resultScoreText: { fontFamily: 'var(--font-unbounded, var(--font-display))', fontSize: 13, fontWeight: 700, color: '#7B6FAA', textTransform: 'uppercase' as const, letterSpacing: '.08em', marginBottom: 8 },
  resultBarWrap: { background: '#EDE8FF', borderRadius: 100, height: 10, margin: '16px 0', overflow: 'hidden' as const },
  resultBar: (pct: number, cls: string): React.CSSProperties => ({ height: '100%', borderRadius: 100, width: pct + '%', transition: 'width 1s ease', background: cls === 'low' ? '#F09595' : cls === 'mid' ? '#F5A623' : '#4CAF78' }),
  resultTitle: { fontFamily: 'var(--font-unbounded, var(--font-display))', fontSize: 20, fontWeight: 700, color: '#3D2B8A', marginBottom: 12, lineHeight: 1.3 },
  resultDesc: { fontSize: 15, color: '#7B6FAA', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 20px' },
  resultTags: { display: 'flex', flexWrap: 'wrap' as const, gap: 6, justifyContent: 'center', marginBottom: 16 },
  tag: (cls: string): React.CSSProperties => ({
    fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 100,
    background: cls === 'tag-ok' ? '#E8F5EE' : cls === 'tag-warn' ? '#FFF3CD' : '#FCEBEB',
    color: cls === 'tag-ok' ? '#2D6A4F' : cls === 'tag-warn' ? '#7A5800' : '#A32D2D',
  }),
  resultCta: { display: 'inline-flex', alignItems: 'center' as const, gap: 8, background: '#4CAF78', color: '#fff', fontFamily: 'var(--font-unbounded, var(--font-display))', fontSize: 13, fontWeight: 700, padding: '13px 28px', borderRadius: 100, textDecoration: 'none', boxShadow: '0 4px 16px rgba(76,175,120,.35)' },
  retry: { display: 'block', fontSize: 13, color: '#7B6FAA', marginTop: 10, cursor: 'pointer', textDecoration: 'underline', background: 'none', border: 'none' },
}

export default function QuizEngine({ config, ctaText }: { config: QuizConfig; ctaText?: string }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [done, setDone] = useState(false)

  const q = config.questions[step]
  const totalSteps = config.questions.length
  const pct = Math.round((step + 1) / totalSteps * 100)
  const selected = answers[step]

  const score = done ? answers.reduce((s, a, i) => s + config.questions[i].options[a].score, 0) : 0
  const result = done ? (config.results.find(r => score >= r.min && score <= r.max) ?? config.results[config.results.length - 1]) : null

  function select(i: number) {
    const next = [...answers]
    next[step] = i
    setAnswers(next)
  }

  function goNext() {
    if (step === totalSteps - 1) { setDone(true); return }
    setStep(s => s + 1)
  }

  function goBack() { if (step > 0) setStep(s => s - 1) }

  function reset() { setStep(0); setAnswers([]); setDone(false) }

  const scorePct = done && result ? Math.round(score / config.maxScore * 100) : 0
  const barCls = scorePct <= 30 ? 'low' : scorePct <= 60 ? 'mid' : 'high'

  return (
    <div style={S.widget}>
      <div style={S.header}>
        <div style={S.iconWrap(config.iconBg)}>{config.icon}</div>
        <div>
          <div style={S.title}>{config.title}</div>
          <div style={S.subtitle}>{config.subtitle}</div>
        </div>
      </div>
      <div style={S.body}>
        {!done ? (
          <>
            <div style={S.progressWrap}>
              <div style={S.progressBar}><div style={S.progressFill(pct)} /></div>
              <div style={S.progressText}>Вопрос {step + 1} из {totalSteps}</div>
            </div>
            <div style={S.question}>{q.text}</div>
            <div style={S.options}>
              {q.options.map((opt, i) => (
                <button key={i} style={S.option(selected === i)} onClick={() => select(i)}>
                  <span style={S.optionDot(selected === i)}>
                    {selected === i && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor', display: 'block' }} />}
                  </span>
                  {opt.label}
                </button>
              ))}
            </div>
            <div style={S.nav}>
              <button style={S.btnBack} onClick={goBack} disabled={step === 0}>← Назад</button>
              <button style={S.btnNext(selected === undefined)} onClick={goNext} disabled={selected === undefined}>
                {step === totalSteps - 1 ? 'Узнать результат →' : 'Далее →'}
              </button>
            </div>
          </>
        ) : result && (
          <div style={S.result}>
            <span style={S.resultEmoji}>{result.emoji}</span>
            {config.showScoreBar && (
              <>
                <div style={S.resultScoreText}>Ваш результат: {score} из {config.maxScore} баллов</div>
                <div style={S.resultBarWrap}><div style={S.resultBar(scorePct, barCls)} /></div>
              </>
            )}
            <div style={S.resultTitle}>{result.title}</div>
            {result.tags && (
              <div style={S.resultTags}>
                {result.tags.map(t => <span key={t.text} style={S.tag(t.cls)}>{t.text}</span>)}
              </div>
            )}
            <div style={S.resultDesc}>{result.desc}</div>
            <a href="https://nata-tomshina.ru/club" style={S.resultCta}>
              {ctaText ?? 'Попробовать клуб за 149 ₽ →'}
            </a>
            <button style={S.retry} onClick={reset}>Пройти заново</button>
          </div>
        )}
      </div>
    </div>
  )
}
