'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useMember } from '@/contexts/MemberContext'
import { calculateKBJU, type ActivityLevel } from '@/lib/kbju'

// ── Types ──────────────────────────────────────────────
type Member = {
  id: string
  email?: string | null
  name?: string | null
  full_name?: string | null
  age?: number | null
  weight?: number | null
  height?: number | null
  goal_weight?: number | null
  initial_weight?: number | null
  activity_coef?: number | null
  health_conditions?: string[] | string | null
  allergies?: string | null
  status?: string | null
  trial_ends_at?: string | null
  created_at?: string | null
  kbju_calories?: number | null
  kbju_protein?: number | null
  kbju_fat?: number | null
  kbju_carbs?: number | null
} | null

type Props = {
  userId: string
  userEmail: string
  member: Member
}

// ── Constants ──────────────────────────────────────────
const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; icon: string }[] = [
  { value: 'sedentary',        label: 'Сидячая работа',     icon: '💻' },
  { value: 'standing',         label: 'На ногах весь день', icon: '🚶' },
  { value: 'light_training',   label: 'Лёгкие тренировки',  icon: '🏃' },
  { value: 'intense_training', label: 'Активные тренировки', icon: '💪' },
]

const HEALTH_OPTIONS = [
  { value: 'gastritis',        label: 'Гастрит' },
  { value: 'no_gallbladder',   label: 'Нет желчного' },
  { value: 'gerd',             label: 'ГЭРБ' },
  { value: 'ibs',              label: 'СРК' },
  { value: 'ir',               label: 'Инсулинорезистентность' },
  { value: 'high_cholesterol', label: 'Высокий холестерин' },
  { value: 'kidney',           label: 'Заболевания почек' },
  { value: 'diabetes',         label: 'Диабет' },
]

const HEALTH_LABELS: Record<string, string> = Object.fromEntries(
  HEALTH_OPTIONS.map(o => [o.value, o.label])
)

const KBJU_META = [
  { key: 'calories' as const, label: 'Калории',   unit: 'ккал', bg: 'var(--pur-light)',  color: 'var(--pur)',  note: 'дневной коридор' },
  { key: 'protein'  as const, label: 'Белок',     unit: 'г',    bg: 'var(--grn-light)',  color: '#1A5C3A',    note: 'строит мышцы' },
  { key: 'fat'      as const, label: 'Жиры',      unit: 'г',    bg: 'var(--yel-light)',  color: '#8B6000',    note: 'гормональный баланс' },
  { key: 'carbs'    as const, label: 'Углеводы',  unit: 'г',    bg: 'var(--ora-light)',  color: '#A04000',    note: 'энергия' },
]

// ── Helpers ──────────────────────────────────────────
function getConditions(raw: string[] | string | null | undefined): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  return String(raw).split(/[,;]/).map(s => s.trim()).filter(Boolean)
}

function guessActivityValue(member: Member): ActivityLevel {
  // Prefer stored activity_level, fall back to guessing from activity_coef
  const stored = (member as Record<string, unknown>)?.activity_level as ActivityLevel | undefined
  if (stored && ['sedentary', 'standing', 'light_training', 'intense_training'].includes(stored)) return stored
  const coef = member?.activity_coef
  if (!coef || coef <= 1.2)  return 'sedentary'
  if (coef <= 1.25)          return 'standing'
  if (coef <= 1.35)          return 'light_training'
  return 'intense_training'
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getKbju(member: Member) {
  return {
    calories: member?.kbju_calories ?? null,
    protein:  member?.kbju_protein  ?? null,
    fat:      member?.kbju_fat      ?? null,
    carbs:    member?.kbju_carbs    ?? null,
  }
}

function getSubscriptionStatus(member: Member) {
  return member?.status ?? 'trial'
}

// ── Sub-components ─────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
      {children}
    </p>
  )
}

// ── Main Component ──────────────────────────────────────
export default function ProfileClient({ userId, userEmail, member }: Props) {
  const router = useRouter()
  const { refreshMember } = useMember()
  const kbju = getKbju(member)
  const conditions = getConditions(member?.health_conditions)
  const subscriptionStatus = getSubscriptionStatus(member)
  const displayName = member?.full_name ?? member?.name ?? ''

  // ── Edit profile state ──
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name:           displayName,
    age:            String(member?.age            ?? ''),
    weight:         String(member?.weight         ?? ''),
    height:         String(member?.height         ?? ''),
    goal_weight:    String(member?.goal_weight    ?? ''),
    initial_weight: String(member?.initial_weight ?? ''),
    activity:       guessActivityValue(member),
  })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError]   = useState('')

  // ── Edit health state ──
  const [editingHealth, setEditingHealth] = useState(false)
  const [healthForm, setHealthForm]       = useState<string[]>(conditions)
  const [noneChecked, setNoneChecked]     = useState(conditions.length === 0)
  const [healthSaving, setHealthSaving]   = useState(false)

  function handleProfileChange(field: string, value: string) {
    setProfileForm(prev => ({ ...prev, [field]: value }))
  }

  async function saveProfile() {
    const w = parseFloat(profileForm.weight)
    const h = parseFloat(profileForm.height)
    const a = parseInt(profileForm.age)
    if (!profileForm.name.trim() || isNaN(w) || isNaN(h) || isNaN(a)) {
      setProfileError('Заполни все поля')
      return
    }
    const activity = profileForm.activity as ActivityLevel
    const newKbju = calculateKBJU({ weight: w, height: h, age: a, activity })

    setProfileSaving(true)
    setProfileError('')
    const supabase = createClient()
    const initialW = parseFloat(profileForm.initial_weight)
    const { error } = await supabase.from('members').update({
      full_name:      profileForm.name.trim(),
      age:            a,
      weight:         w,
      height:         h,
      goal_weight:    parseFloat(profileForm.goal_weight) || null,
      initial_weight: !isNaN(initialW) ? initialW : null,
      activity_level: activity,
      kbju_calories:  newKbju.calories,
      kbju_protein:   newKbju.protein,
      kbju_fat:       newKbju.fat,
      kbju_carbs:     newKbju.carbs,
    }).eq('id', userId)

    setProfileSaving(false)
    if (error) { setProfileError('Ошибка сохранения'); return }
    setEditingProfile(false)
    await refreshMember()
    router.refresh()
  }

  async function saveHealth() {
    const newConditions = noneChecked ? [] : healthForm
    setHealthSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('members')
      .update({ health_conditions: newConditions })
      .eq('id', userId)
    if (error) {
      console.error('saveHealth error:', JSON.stringify(error, null, 2))
    }
    setHealthSaving(false)
    setEditingHealth(false)
    await refreshMember()
    router.refresh()
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const inputStyle = {
    fontFamily: 'var(--font-nunito)',
    color: 'var(--text)',
    borderColor: 'var(--border)',
    background: 'var(--bg)',
  }
  const inputClass = 'w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all'

  return (
    <div className="flex flex-col gap-4 pb-10">

      {/* ── 1. ДАННЫЕ УЧАСТНИЦЫ ── */}
      <Card>
        <div className="flex items-center justify-between">
          <SectionLabel>Данные участницы</SectionLabel>
          {!editingProfile && (
            <button
              onClick={() => setEditingProfile(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
              style={{ background: 'var(--pur-light)', color: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}
            >
              Редактировать
            </button>
          )}
        </div>

        {editingProfile ? (
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>Имя</p>
              <input
                type="text"
                value={profileForm.name}
                onChange={e => handleProfileChange('name', e.target.value)}
                className={inputClass}
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--pur)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { field: 'age',    label: 'Возраст', suffix: 'лет' },
                { field: 'weight', label: 'Вес',     suffix: 'кг'  },
                { field: 'height', label: 'Рост',    suffix: 'см'  },
              ].map(({ field, label, suffix }) => (
                <div key={field}>
                  <p className="text-xs mb-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>{label}, {suffix}</p>
                  <input
                    type="number"
                    value={profileForm[field as keyof typeof profileForm]}
                    onChange={e => handleProfileChange(field, e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--pur)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>Желаемый вес, кг</p>
                <input
                  type="number"
                  value={profileForm.goal_weight}
                  onChange={e => handleProfileChange('goal_weight', e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'var(--pur)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>Начальный вес, кг</p>
                <input
                  type="number"
                  step="0.1"
                  value={profileForm.initial_weight}
                  onChange={e => handleProfileChange('initial_weight', e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'var(--pur)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
            </div>

            <div>
              <p className="text-xs mb-2" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>Уровень активности</p>
              <div className="flex flex-col gap-1.5">
                {ACTIVITY_OPTIONS.map(({ value, label, icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleProfileChange('activity', value)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all"
                    style={{
                      fontFamily: 'var(--font-nunito)',
                      background: profileForm.activity === value ? 'var(--pur)' : 'var(--bg)',
                      borderColor: profileForm.activity === value ? 'var(--pur)' : 'var(--border)',
                      color: profileForm.activity === value ? '#fff' : 'var(--text)',
                    }}
                  >
                    <span>{icon}</span>
                    <span className="text-sm flex-1">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {profileError && (
              <p className="text-xs" style={{ color: '#E74C3C', fontFamily: 'var(--font-nunito)' }}>{profileError}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={saveProfile}
                disabled={profileSaving}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--pur) 0%, #9B7CFF 100%)', fontFamily: 'var(--font-nunito)' }}
              >
                {profileSaving ? 'Сохраняем...' : 'Сохранить'}
              </button>
              <button
                onClick={() => { setEditingProfile(false); setProfileError('') }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium border transition-all"
                style={{ fontFamily: 'var(--font-nunito)', borderColor: 'var(--border)', color: 'var(--muted)', background: 'var(--bg)' }}
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-base font-bold" style={{ color: 'var(--text)', fontFamily: 'var(--font-unbounded)' }}>
                {displayName || '—'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                {userEmail}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Возраст',        value: member?.age            ? `${member.age} лет`           : '—' },
                { label: 'Вес текущий',    value: member?.weight         ? `${member.weight} кг`          : '—' },
                { label: 'Рост',           value: member?.height         ? `${member.height} см`          : '—' },
                { label: 'Желаемый вес',   value: member?.goal_weight    ? `${member.goal_weight} кг`     : '—' },
                { label: 'Начальный вес',  value: member?.initial_weight ? `${member.initial_weight} кг`  : '—' },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-xl px-3 py-2.5"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                >
                  <p className="text-[10px]" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>{label}</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>{value}</p>
                </div>
              ))}
            </div>

            {member?.weight && member?.goal_weight && (
              <p className="text-xs" style={{ color: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}>
                Путь: {Math.abs(member.weight - member.goal_weight).toFixed(1)} кг{' '}
                {member.goal_weight < member.weight ? '↓ похудеть' : '↑ набрать'}
              </p>
            )}
          </div>
        )}
      </Card>

      {/* ── 2. МОЯ НОРМА КБЖУ ── */}
      <Card>
        <SectionLabel>Моя норма КБЖУ</SectionLabel>
        {kbju.calories ? (
          <div className="grid grid-cols-2 gap-2">
            {KBJU_META.map(({ key, label, unit, bg, color, note }) => (
              <div
                key={key}
                className="rounded-xl p-3 flex flex-col gap-1"
                style={{ background: bg }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color, fontFamily: 'var(--font-nunito)' }}>{label}</p>
                <p className="text-xl font-bold" style={{ color, fontFamily: 'var(--font-unbounded)' }}>
                  {kbju[key]}
                  <span className="text-xs font-normal ml-1">{unit}</span>
                </p>
                <p className="text-[10px]" style={{ color, opacity: 0.7, fontFamily: 'var(--font-nunito)' }}>
                  в день · {note}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
            КБЖУ рассчитается после заполнения профиля
          </p>
        )}
        <p className="text-[10px]" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
          Рассчитано по формуле Миффлин-Сан Жеор с учётом твоей активности и цели
        </p>
      </Card>

      {/* ── 3. ЗДОРОВЬЕ ── */}
      <Card>
        <div className="flex items-center justify-between">
          <SectionLabel>Здоровье</SectionLabel>
          {!editingHealth && (
            <button
              onClick={() => setEditingHealth(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
              style={{ background: 'var(--pur-light)', color: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}
            >
              Изменить
            </button>
          )}
        </div>

        {editingHealth ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              {HEALTH_OPTIONS.map(({ value, label }) => {
                const checked = healthForm.includes(value)
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setNoneChecked(false)
                      setHealthForm(prev =>
                        prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
                      )
                    }}
                    className="flex items-center gap-2 px-3 rounded-xl border text-left transition-all"
                    style={{
                      minHeight: 44,
                      fontFamily: 'var(--font-nunito)',
                      background: checked ? '#FFF0F0' : 'var(--bg)',
                      borderColor: checked ? '#E74C3C' : 'var(--border)',
                      color: checked ? '#C0392B' : 'var(--text)',
                    }}
                  >
                    <span
                      className="w-4 h-4 rounded flex items-center justify-center border text-xs shrink-0"
                      style={{ borderColor: checked ? '#E74C3C' : 'var(--border)', background: checked ? '#E74C3C' : 'transparent', color: '#fff' }}
                    >
                      {checked ? '✓' : ''}
                    </span>
                    <span className="text-xs leading-snug">{label}</span>
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => { setNoneChecked(p => !p); setHealthForm([]) }}
              className="flex items-center gap-2 px-3 rounded-xl border text-left transition-all w-full"
              style={{
                minHeight: 44,
                fontFamily: 'var(--font-nunito)',
                background: noneChecked ? 'var(--grn-light)' : 'var(--bg)',
                borderColor: noneChecked ? 'var(--grn)' : 'var(--border)',
                color: noneChecked ? '#1A5C3A' : 'var(--text)',
              }}
            >
              <span
                className="w-4 h-4 rounded flex items-center justify-center border text-xs shrink-0"
                style={{ borderColor: noneChecked ? '#2A9D5C' : 'var(--border)', background: noneChecked ? '#2A9D5C' : 'transparent', color: '#fff' }}
              >
                {noneChecked ? '✓' : ''}
              </span>
              <span className="text-xs">Ничего из перечисленного</span>
            </button>

            <div className="flex gap-2 pt-1">
              <button
                onClick={saveHealth}
                disabled={healthSaving}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--pur) 0%, #9B7CFF 100%)', fontFamily: 'var(--font-nunito)' }}
              >
                {healthSaving ? 'Сохраняем...' : 'Сохранить'}
              </button>
              <button
                onClick={() => { setEditingHealth(false); setHealthForm(conditions) }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium border"
                style={{ fontFamily: 'var(--font-nunito)', borderColor: 'var(--border)', color: 'var(--muted)', background: 'var(--bg)' }}
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {conditions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {conditions.map(c => (
                  <span
                    key={c}
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{ background: '#FFF0F0', color: '#C0392B', fontFamily: 'var(--font-nunito)' }}
                  >
                    {HEALTH_LABELS[c] ?? c}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                Нет ограничений по здоровью ✓
              </p>
            )}
            {member?.allergies && (
              <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                Аллергии: {member.allergies}
              </p>
            )}
          </div>
        )}
      </Card>

      {/* ── 4. ПОДПИСКА ── */}
      <Card>
        <SectionLabel>Подписка</SectionLabel>
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-bold px-3 py-1.5 rounded-full"
            style={{
              fontFamily: 'var(--font-nunito)',
              background: subscriptionStatus === 'active' ? 'var(--grn-light)' : subscriptionStatus === 'expired' ? '#FFE5E5' : 'var(--pur-light)',
              color: subscriptionStatus === 'active' ? '#1A5C3A' : subscriptionStatus === 'expired' ? '#C0392B' : 'var(--pur)',
            }}
          >
            {subscriptionStatus === 'active' ? '✓ Полный клуб' : subscriptionStatus === 'expired' ? 'Истёк' : '🌿 Пробный период'}
          </span>
          {member?.trial_ends_at && (
            <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
              до {formatDate(member.trial_ends_at)}
            </p>
          )}
        </div>

        {subscriptionStatus !== 'active' ? (
          <a
            href="/join"
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #2A9D5C 0%, #52C98D 100%)', fontFamily: 'var(--font-nunito)' }}
          >
            🌿 Открыть полный доступ
          </a>
        ) : (
          <button
            className="w-full py-3 rounded-xl text-sm font-semibold border transition-all"
            style={{ fontFamily: 'var(--font-nunito)', borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--bg)' }}
          >
            Управление подпиской
          </button>
        )}

        {subscriptionStatus === 'active' && (
          <p className="text-[10px] text-center" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
            Для отмены подписки — напиши в чат поддержки
          </p>
        )}
      </Card>

      {/* ── 5. ВЫХОД ── */}
      <button
        onClick={handleSignOut}
        className="w-full py-3.5 rounded-2xl text-sm font-semibold border transition-all"
        style={{
          fontFamily: 'var(--font-nunito)',
          borderColor: 'var(--border)',
          color: 'var(--muted)',
          background: 'var(--card)',
        }}
      >
        Выйти из аккаунта
      </button>

    </div>
  )
}
