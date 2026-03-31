import Link from 'next/link'

export interface TrackerSummary {
  weight: { start: number; current: number } | null
  waist: { start: number; current: number } | null
  hips: { start: number; current: number } | null
  chest: { start: number; current: number } | null
}

interface Props {
  data: TrackerSummary | null
}

const METRICS = [
  { key: 'weight' as const, icon: '⚖️', label: 'Вес', unit: 'кг' },
  { key: 'waist'  as const, icon: '📏', label: 'Талия', unit: 'см' },
  { key: 'hips'   as const, icon: '🔵', label: 'Бёдра', unit: 'см' },
  { key: 'chest'  as const, icon: '💗', label: 'Грудь', unit: 'см' },
]

export default function ProgressBlock({ data }: Props) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
        Прогресс замеров
      </p>

      <div className="grid grid-cols-2 gap-3">
        {METRICS.map(({ key, icon, label, unit }) => {
          const pair = data?.[key] ?? null
          const diff = pair ? +(pair.current - pair.start).toFixed(1) : null

          return (
            <div
              key={key}
              className="rounded-xl p-3"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-sm">{icon}</span>
                <p className="text-[11px] font-semibold" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                  {label}
                </p>
              </div>

              {pair !== null ? (
                <>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className="text-xs line-through"
                      style={{ color: 'var(--pale)', fontFamily: 'var(--font-nunito)' }}
                    >
                      {pair.start} {unit}
                    </span>
                    <span style={{ color: 'var(--muted)', fontSize: 11 }}>→</span>
                    <span
                      className="text-sm font-bold"
                      style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}
                    >
                      {pair.current}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                      {unit}
                    </span>
                  </div>
                  {diff !== null && diff !== 0 && (
                    <span
                      className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: diff < 0 ? '#E8F8EF' : '#FFF0F0',
                        color: diff < 0 ? '#1A7A4F' : '#C0392B',
                        fontFamily: 'var(--font-nunito)',
                      }}
                    >
                      {diff > 0 ? '+' : ''}{diff} {unit}
                    </span>
                  )}
                </>
              ) : (
                <div>
                  <p className="text-xs" style={{ color: 'var(--pale)', fontFamily: 'var(--font-nunito)' }}>
                    Нет данных
                  </p>
                  <Link
                    href="/dashboard/tracker"
                    className="text-[10px] font-semibold mt-0.5 inline-block"
                    style={{ color: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}
                  >
                    Добавить →
                  </Link>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Link
        href="/dashboard/tracker"
        className="mt-3 flex items-center justify-end text-xs font-semibold"
        style={{ color: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}
      >
        Открыть трекер →
      </Link>
    </div>
  )
}
