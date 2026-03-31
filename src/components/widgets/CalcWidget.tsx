'use client'
import { useState } from 'react'

export default function CalcWidget() {
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [age, setAge] = useState('')
  const [thyroid, setThyroid] = useState('no')
  const [result, setResult] = useState<{ range: string; sub: string } | null>(null)

  function calculate() {
    const w = parseFloat(weight)
    const h = parseFloat(height)
    const a = parseFloat(age)
    if (!w || !h || !a) return
    const bmi = w / ((h / 100) ** 2)
    let base = bmi > 35 ? 15 : bmi > 30 ? 12 : bmi > 25 ? 8 : 5
    if (thyroid === 'yes') base = Math.round(base * 0.75)
    if (a > 55) base = Math.round(base * 0.85)
    const lo = base, hi = Math.round(base * 1.5)
    const sub = thyroid === 'yes'
      ? 'С гипотиреозом темп чуть ниже, но результат стабильный'
      : a > 55 ? 'После 55 лет темп немного снижается, но результат устойчивый'
      : 'При вашем ИМТ и параметрах'
    setResult({ range: `−${lo}–${hi} кг`, sub })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '1.5px solid #EDE8FF', borderRadius: 10,
    padding: '10px 14px', fontFamily: 'var(--font-nunito)', fontSize: 15, color: '#1A1230',
    background: '#FAF8FF', outline: 'none',
  }

  return (
    <div style={{ background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 24, overflow: 'hidden', marginBottom: 20 }}>
      <div style={{ padding: '24px 28px 0', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: '#FFF3CD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>⚖️</div>
        <div>
          <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 17, fontWeight: 700, color: '#3D2B8A', marginBottom: 4, lineHeight: 1.25 }}>Сколько я могу сбросить за 3 месяца?</div>
          <div style={{ fontSize: 14, color: '#7B6FAA' }}>Реалистичный расчёт на основе параметров</div>
        </div>
      </div>
      <div style={{ padding: '20px 28px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#7B6FAA', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Текущий вес (кг)</label>
            <input type="number" style={inputStyle} placeholder="70" value={weight} onChange={e => setWeight(e.target.value)} min={40} max={300} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#7B6FAA', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Рост (см)</label>
            <input type="number" style={inputStyle} placeholder="165" value={height} onChange={e => setHeight(e.target.value)} min={140} max={210} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#7B6FAA', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Возраст</label>
            <input type="number" style={inputStyle} placeholder="40" value={age} onChange={e => setAge(e.target.value)} min={18} max={80} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#7B6FAA', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Проблемы с щитовидкой?</label>
            <select style={{ ...inputStyle }} value={thyroid} onChange={e => setThyroid(e.target.value)}>
              <option value="no">Нет</option>
              <option value="yes">Да (гипотиреоз, АИТ)</option>
              <option value="idk">Не знаю / не проверяла</option>
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <button
              onClick={calculate}
              style={{ width: '100%', fontFamily: 'var(--font-unbounded)', fontSize: 13, fontWeight: 700, padding: '12px', borderRadius: 100, border: 'none', background: '#3D2B8A', color: '#fff', cursor: 'pointer' }}
            >
              Рассчитать →
            </button>
          </div>
        </div>

        {result && (
          <div style={{ background: 'linear-gradient(135deg, #3D2B8A 0%, #5B3FA8 100%)', borderRadius: 16, padding: 24, marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(255,255,255,.5)', marginBottom: 4 }}>За 3 месяца в клубе</div>
                <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 36, fontWeight: 700, color: '#7BDFAA', lineHeight: 1 }}>{result.range}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', marginTop: 4 }}>{result.sub}</div>
              </div>
              <a
                href="https://nata-tomshina.ru/club"
                style={{ background: '#fff', color: '#3D2B8A', fontFamily: 'var(--font-unbounded)', fontSize: 12, fontWeight: 700, padding: '11px 18px', borderRadius: 100, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                Начать за 149 ₽ →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
