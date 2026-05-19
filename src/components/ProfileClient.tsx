'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useMember } from '@/contexts/MemberContext'
import { calculateKBJU, type ActivityLevel } from '@/lib/kbju'
import AvatarUpload from '@/app/(club)/dashboard/profile/AvatarUpload'
import { usePushNotifications } from '@/hooks/usePushNotifications'

// ── Types ──────────────────────────────────────────────
type Member = {
  id: string
  email?: string | null
  name?: string | null
  full_name?: string | null
  first_name?: string | null
  age?: number | null
  weight?: number | null
  height?: number | null
  goal_weight?: number | null
  initial_weight?: number | null
  activity_coef?: number | null
  health_conditions?: string[] | string | null
  allergies?: string | null
  status?: string | null
  subscription_status?: string | null
  subscription_plan?: string | null
  subscription_ends_at?: string | null
  trial_ends_at?: string | null
  created_at?: string | null
  avatar_url?: string | null
  kbju_calories?: number | null
  kbju_protein?: number | null
  kbju_fat?: number | null
  kbju_carbs?: number | null
  kbju_protein_system?: number | null
  kbju_carbs_system?: number | null
  kbju_manual?: boolean | null
  birth_date?: string | null
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
  { key: 'carbs'    as const, label: 'Углеводы',  unit: 'г',    bg: 'var(--ora-light)',  color: '#A04000',    note: 'энергия', prefix: 'до ' },
]

// ── Helpers ──────────────────────────────────────────
function getConditions(raw: string[] | string | null | undefined): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  return String(raw).split(/[,;]/).map(s => s.trim()).filter(Boolean)
}

function CancelTrialButton() {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cancelled, setCancelled] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    try {
      const res = await fetch('/api/subscription/cancel', { method: 'POST' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        alert(err.error ?? 'Ошибка при отмене')
        return
      }
      setShowModal(false)
      setCancelled(true)
      window.open('https://my.cloudpayments.ru/', '_blank', 'noopener,noreferrer')
    } catch {
      alert('Ошибка сети')
    } finally {
      setLoading(false)
    }
  }

  if (cancelled) {
    return (
      <p className="text-xs text-center px-2" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
        Подписка отменена. Для отмены автоплатежа перейдите в{' '}
        <a href="https://my.cloudpayments.ru/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--pur)' }}>
          CloudPayments
        </a>.
      </p>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="text-xs text-center w-full py-1"
        style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        Отменить пробный период
      </button>

      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => !loading && setShowModal(false)}
        >
          <div
            style={{
              background: 'var(--card)', borderRadius: 16, padding: '24px 20px',
              maxWidth: 320, width: '100%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <p className="text-sm font-bold mb-2" style={{ fontFamily: 'var(--font-nunito)', color: 'var(--text)' }}>
              Отменить пробный период?
            </p>
            <p className="text-xs mb-5" style={{ fontFamily: 'var(--font-nunito)', color: 'var(--muted)' }}>
              Доступ к клубу будет закрыт.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
                style={{ fontFamily: 'var(--font-nunito)', borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--bg)' }}
              >
                Нет, остаться
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ fontFamily: 'var(--font-nunito)', background: '#C0392B', opacity: loading ? 0.6 : 1 }}
              >
                {loading ? '...' : 'Да, отменить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function parseFIO(fullName: string | null | undefined): { last_name: string; first_name: string; middle_name: string } {
  const parts = (fullName || '').trim().split(/\s+/)
  return {
    last_name:   parts[0] || '',
    first_name:  parts[1] || '',
    middle_name: parts.slice(2).join(' ') || '',
  }
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
  return member?.subscription_status ?? member?.status ?? 'trial'
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
  const { isSubscribed: pushSubscribed, isSupported: pushSupported, isLoading: pushLoading, sdkReady, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe } = usePushNotifications()
  const displayName = member?.full_name ?? member?.name ?? ''

  // ── Avatar state ──
  const [avatarUrl, setAvatarUrl] = useState<string | null>(member?.avatar_url ?? null)

  // ── Edit profile state ──
  const [editingProfile, setEditingProfile] = useState(false)
  const parsedFIO = parseFIO(member?.full_name ?? member?.name)
  const [profileForm, setProfileForm] = useState({
    last_name:      parsedFIO.last_name,
    first_name:     member?.first_name || parsedFIO.first_name,
    middle_name:    parsedFIO.middle_name,
    age:            String(member?.age            ?? ''),
    weight:         String(member?.weight         ?? ''),
    height:         String(member?.height         ?? ''),
    goal_weight:    String(member?.goal_weight    ?? ''),
    initial_weight: String(member?.initial_weight ?? ''),
    activity:       guessActivityValue(member),
    birth_date:     member?.birth_date ?? '',
  })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError]   = useState('')

  // ── Edit health state ──
  const [editingHealth, setEditingHealth] = useState(false)
  const [healthForm, setHealthForm]       = useState<string[]>(conditions)
  const [noneChecked, setNoneChecked]     = useState(conditions.length === 0)
  const [healthSaving, setHealthSaving]   = useState(false)

  // ── КБЖУ override state ──
  const [editingKbju, setEditingKbju] = useState(false)
  const [kbjuForm, setKbjuForm] = useState({
    protein: member?.kbju_protein ?? 80,
    carbs:   member?.kbju_carbs   ?? 80,
  })
  const [kbjuSaving, setKbjuSaving] = useState(false)
  const [kbjuToast, setKbjuToast] = useState<{ msg: string; ok: boolean } | null>(null)

  function handleProfileChange(field: string, value: string) {
    setProfileForm(prev => ({ ...prev, [field]: value }))
  }

  async function saveProfile() {
    const w = parseFloat(profileForm.weight)
    const h = parseFloat(profileForm.height)
    const a = parseInt(profileForm.age)
    if (!profileForm.last_name.trim() || !profileForm.first_name.trim() || isNaN(w) || isNaN(h) || isNaN(a)) {
      setProfileError('Заполни все поля')
      return
    }
    const firstName = profileForm.first_name.trim()
    const nameParts = [profileForm.last_name.trim(), firstName, profileForm.middle_name.trim()].filter(Boolean)
    const fullName = nameParts.join(' ')
    const activity = profileForm.activity as ActivityLevel
    const newKbju = calculateKBJU({ weight: w, height: h, age: a, activity })

    setProfileSaving(true)
    setProfileError('')
    const supabase = createClient()
    const initialW = parseFloat(profileForm.initial_weight)
    const { error } = await supabase.from('members').update({
      full_name:      fullName,
      name:           firstName,
      first_name:     firstName,
      age:            a,
      weight:         w,
      height:         h,
      goal_weight:    parseFloat(profileForm.goal_weight) || null,
      initial_weight: !isNaN(initialW) ? initialW : null,
      activity_level: activity,
      kbju_calories:        newKbju.calories,
      kbju_protein:         newKbju.protein,
      kbju_fat:             newKbju.fat,
      kbju_carbs:           newKbju.carbs,
      kbju_protein_system:  newKbju.protein,
      kbju_carbs_system:    newKbju.carbs,
      kbju_manual:          false,
      birth_date:           profileForm.birth_date || null,
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

  async function saveKbjuOverride() {
    setKbjuSaving(true)
    try {
      const res = await fetch('/api/profile/kbju-override', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ protein: kbjuForm.protein, carbs: kbjuForm.carbs }),
      })
      const data = await res.json()
      if (!res.ok) { setKbjuToast({ msg: data.error ?? 'Ошибка сохранения', ok: false }); return }
      setEditingKbju(false)
      setKbjuToast({ msg: 'КБЖУ обновлены ✅', ok: true })
      await refreshMember()
      router.refresh()
    } finally {
      setKbjuSaving(false)
    }
  }

  async function resetKbju() {
    if (!confirm('Вернуть КБЖУ к системному расчёту? Текущие изменения будут отменены.')) return
    const res = await fetch('/api/profile/kbju-override/reset', { method: 'POST' })
    const data = await res.json()
    if (!res.ok) { setKbjuToast({ msg: data.error ?? 'Ошибка сброса', ok: false }); return }
    setKbjuToast({ msg: 'КБЖУ сброшены к авторасчёту ✅', ok: true })
    await refreshMember()
    router.refresh()
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth')
  }

  // ── КБЖУ derived ──
  const proteinSystem  = member?.kbju_protein_system ?? null
  const carbsSystem    = member?.kbju_carbs_system   ?? null
  const kbjuEditable   = proteinSystem !== null && carbsSystem !== null && kbju.calories !== null
  const proteinMin     = proteinSystem != null ? proteinSystem - 20 : 0
  const proteinMax     = proteinSystem != null ? proteinSystem + 20 : 999
  const proteinInvalid = kbjuForm.protein < proteinMin || kbjuForm.protein > proteinMax
  const carbsInvalid   = kbjuForm.carbs < 20 || (carbsSystem != null && kbjuForm.carbs > carbsSystem)
  const liveFat        = kbju.calories != null
    ? Math.round((kbju.calories - kbjuForm.protein * 4 - kbjuForm.carbs * 4) / 9)
    : null
  const canSaveKbju    = !proteinInvalid && !carbsInvalid && !kbjuSaving

  const inputStyle = {
    fontFamily: 'var(--font-nunito)',
    color: 'var(--text)',
    borderColor: 'var(--border)',
    background: 'var(--bg)',
  }
  const inputClass = 'w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all'

  return (
    <div className="flex flex-col gap-4 pb-10">

      {/* ── 0. АВАТАР ── */}
      <Card>
        <SectionLabel>Фото профиля</SectionLabel>
        <AvatarUpload
          userId={userId}
          currentUrl={avatarUrl}
          displayName={displayName || userEmail}
          onUpdated={setAvatarUrl}
        />
      </Card>

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
            {[
              { field: 'last_name',   label: 'Фамилия',            placeholder: 'Иванова',   required: true  },
              { field: 'first_name',  label: 'Имя',                placeholder: 'Мария',     required: true  },
              { field: 'middle_name', label: 'Отчество (необяз.)', placeholder: 'Сергеевна', required: false },
            ].map(({ field, label, placeholder }) => (
              <div key={field}>
                <p className="text-xs mb-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>{label}</p>
                <input
                  type="text"
                  placeholder={placeholder}
                  value={profileForm[field as keyof typeof profileForm] as string}
                  onChange={e => handleProfileChange(field, e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'var(--pur)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
            ))}

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

            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>Дата рождения</p>
              <input
                type="date"
                value={profileForm.birth_date}
                onChange={e => handleProfileChange('birth_date', e.target.value)}
                className={inputClass}
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--pur)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
              <p className="text-[10px] mt-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                Необязательно — для поздравления в день рождения
              </p>
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
                { label: 'Дата рождения',  value: member?.birth_date     ? new Date(member.birth_date + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : '—' },
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
        {/* Toast */}
        {kbjuToast && (
          <div
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-center"
            style={{
              background: kbjuToast.ok ? 'var(--grn-light)' : '#FFF0F0',
              color: kbjuToast.ok ? '#1A5C3A' : '#C0392B',
              fontFamily: 'var(--font-nunito)',
            }}
          >
            {kbjuToast.msg}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <SectionLabel>Моя норма КБЖУ</SectionLabel>
          <div className="flex items-center gap-2">
            {member?.kbju_manual && !editingKbju && (
              <button
                onClick={resetKbju}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
                style={{ background: 'var(--ora-light)', color: '#A04000', fontFamily: 'var(--font-nunito)' }}
              >
                ↩ Сбросить
              </button>
            )}
            {!editingKbju && kbju.calories && (
              <button
                onClick={() => {
                  setKbjuForm({ protein: member?.kbju_protein ?? 80, carbs: member?.kbju_carbs ?? 80 })
                  setKbjuToast(null)
                  setEditingKbju(true)
                }}
                disabled={!kbjuEditable}
                title={!kbjuEditable ? 'Сначала заполни профиль' : undefined}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all disabled:opacity-40"
                style={{ background: 'var(--pur-light)', color: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}
              >
                ✏️ Изменить
              </button>
            )}
          </div>
        </div>

        {kbju.calories ? (
          editingKbju ? (
            /* ── Edit mode ── */
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                {/* Калории — read-only */}
                <div className="rounded-xl p-3 flex flex-col gap-1" style={{ background: 'var(--pur-light)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}>Калории</p>
                  <p className="text-xl font-bold" style={{ color: 'var(--pur)', fontFamily: 'var(--font-unbounded)' }}>
                    {kbju.calories}
                    <span className="text-xs font-normal ml-1">ккал</span>
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--pur)', opacity: 0.7, fontFamily: 'var(--font-nunito)' }}>
                    в день · системное
                  </p>
                </div>

                {/* Белок — stepper */}
                <div
                  className="rounded-xl p-3 flex flex-col gap-1"
                  style={{ background: 'var(--grn-light)', border: `2px solid ${proteinInvalid ? '#E74C3C' : 'transparent'}` }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#1A5C3A', fontFamily: 'var(--font-nunito)' }}>Белок</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <button
                      onClick={() => setKbjuForm(p => ({ ...p, protein: Math.max(proteinMin, p.protein - 1) }))}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-base font-bold shrink-0"
                      style={{ background: 'rgba(26,92,58,0.15)', color: '#1A5C3A' }}
                    >–</button>
                    <input
                      type="number"
                      value={kbjuForm.protein}
                      onChange={e => setKbjuForm(p => ({ ...p, protein: parseInt(e.target.value) || 0 }))}
                      className="w-14 text-center text-xl font-bold rounded-lg border-2 outline-none"
                      style={{
                        color: '#1A5C3A',
                        fontFamily: 'var(--font-unbounded)',
                        background: 'transparent',
                        borderColor: proteinInvalid ? '#E74C3C' : 'rgba(26,92,58,0.3)',
                      }}
                    />
                    <button
                      onClick={() => setKbjuForm(p => ({ ...p, protein: Math.min(proteinMax, p.protein + 1) }))}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-base font-bold shrink-0"
                      style={{ background: 'rgba(26,92,58,0.15)', color: '#1A5C3A' }}
                    >+</button>
                    <span className="text-xs font-normal" style={{ color: '#1A5C3A' }}>г</span>
                  </div>
                  <p className="text-[10px]" style={{ color: proteinInvalid ? '#C0392B' : '#1A5C3A', opacity: 0.8, fontFamily: 'var(--font-nunito)' }}>
                    {proteinMin}–{proteinMax} г
                  </p>
                </div>

                {/* Жиры — read-only, живой пересчёт */}
                <div className="rounded-xl p-3 flex flex-col gap-1" style={{ background: 'var(--yel-light)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#8B6000', fontFamily: 'var(--font-nunito)' }}>Жиры</p>
                  <p className="text-xl font-bold" style={{ color: '#8B6000', fontFamily: 'var(--font-unbounded)' }}>
                    {liveFat ?? '—'}
                    <span className="text-xs font-normal ml-1">г</span>
                  </p>
                  <p className="text-[10px]" style={{ color: '#8B6000', opacity: 0.7, fontFamily: 'var(--font-nunito)' }}>
                    пересчитано авто
                  </p>
                </div>

                {/* Углеводы — stepper */}
                <div
                  className="rounded-xl p-3 flex flex-col gap-1"
                  style={{ background: 'var(--ora-light)', border: `2px solid ${carbsInvalid ? '#E74C3C' : 'transparent'}` }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#A04000', fontFamily: 'var(--font-nunito)' }}>Углеводы</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <button
                      onClick={() => setKbjuForm(p => ({ ...p, carbs: Math.max(20, p.carbs - 1) }))}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-base font-bold shrink-0"
                      style={{ background: 'rgba(160,64,0,0.15)', color: '#A04000' }}
                    >–</button>
                    <input
                      type="number"
                      value={kbjuForm.carbs}
                      onChange={e => setKbjuForm(p => ({ ...p, carbs: parseInt(e.target.value) || 0 }))}
                      className="w-14 text-center text-xl font-bold rounded-lg border-2 outline-none"
                      style={{
                        color: '#A04000',
                        fontFamily: 'var(--font-unbounded)',
                        background: 'transparent',
                        borderColor: carbsInvalid ? '#E74C3C' : 'rgba(160,64,0,0.3)',
                      }}
                    />
                    <button
                      onClick={() => setKbjuForm(p => ({ ...p, carbs: Math.min(carbsSystem ?? 999, p.carbs + 1) }))}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-base font-bold shrink-0"
                      style={{ background: 'rgba(160,64,0,0.15)', color: '#A04000' }}
                    >+</button>
                    <span className="text-xs font-normal" style={{ color: '#A04000' }}>г</span>
                  </div>
                  <p className="text-[10px]" style={{ color: carbsInvalid ? '#C0392B' : '#A04000', opacity: 0.8, fontFamily: 'var(--font-nunito)' }}>
                    20–{carbsSystem} г
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveKbjuOverride}
                  disabled={!canSaveKbju}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, var(--pur) 0%, #9B7CFF 100%)', fontFamily: 'var(--font-nunito)' }}
                >
                  {kbjuSaving ? 'Сохраняем...' : 'Сохранить'}
                </button>
                <button
                  onClick={() => { setEditingKbju(false); setKbjuToast(null) }}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium border"
                  style={{ fontFamily: 'var(--font-nunito)', borderColor: 'var(--border)', color: 'var(--muted)', background: 'var(--bg)' }}
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            /* ── View mode ── */
            <div className="grid grid-cols-2 gap-2">
              {KBJU_META.map(({ key, label, unit, bg, color, note, prefix }) => (
                <div
                  key={key}
                  className="rounded-xl p-3 flex flex-col gap-1"
                  style={{ background: bg }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color, fontFamily: 'var(--font-nunito)' }}>{label}</p>
                  <p className="text-xl font-bold" style={{ color, fontFamily: 'var(--font-unbounded)' }}>
                    {prefix ?? ''}{kbju[key]}
                    <span className="text-xs font-normal ml-1">{unit}</span>
                  </p>
                  <p className="text-[10px]" style={{ color, opacity: 0.7, fontFamily: 'var(--font-nunito)' }}>
                    в день · {note}
                  </p>
                </div>
              ))}
            </div>
          )
        ) : (
          <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
            КБЖУ рассчитается после заполнения профиля
          </p>
        )}

        <div>
          <p className="text-[10px]" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
            Рассчитано по формуле Миффлин-Сан Жеор с учётом твоей активности и цели
          </p>
          {member?.kbju_manual && (
            <p className="text-[10px] mt-0.5" style={{ color: '#A04000', fontFamily: 'var(--font-nunito)' }}>
              ✏️ Скорректировано вручную
            </p>
          )}
        </div>
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
        {(() => {
          const subscriptionEndsAt = member?.subscription_ends_at
          const subscriptionPlan = member?.subscription_plan
          const endsDate = subscriptionEndsAt ?? member?.trial_ends_at

          const showHint =
            ['trial', 'Пробный'].includes(subscriptionPlan ?? '') ||
            ['month', 'monthly'].includes(subscriptionPlan ?? '') ||
            (subscriptionPlan === null && subscriptionStatus === 'trial') ||
            (subscriptionPlan === null && subscriptionStatus === 'active')

          const hint = (
            <p className="text-xs text-center mt-1 leading-relaxed" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
              Если возникли сложности с отменой — напишите{' '}
              <a href="/dashboard/channel?ch=direct" style={{ color: 'var(--pur)', textDecoration: 'none' }}>в личку Наташе</a>,
              {' '}в Telegram{' '}
              <a href="https://t.me/NataTomshina" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--pur)', textDecoration: 'none' }}>@NataTomshina</a>
              {' '}или на{' '}
              <a href="mailto:nata.tomshina@gmail.com" style={{ color: 'var(--pur)', textDecoration: 'none' }}>nata.tomshina@gmail.com</a>,
              {' '}укажите свой email и Ф.И.О.
            </p>
          )

          return (
            <>
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
                {endsDate && (
                  <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                    до {formatDate(endsDate)}
                  </p>
                )}
              </div>

              {subscriptionStatus !== 'active' ? (
                <>
                  <a
                    href="/dashboard/upgrade"
                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all"
                    style={{ background: 'linear-gradient(135deg, #2A9D5C 0%, #52C98D 100%)', fontFamily: 'var(--font-nunito)' }}
                  >
                    🌿 Открыть полный доступ
                  </a>
                  {subscriptionStatus === 'trial' && <CancelTrialButton />}
                  {showHint && hint}
                </>
              ) : (
                <>
                  <a
                    href="https://my.cloudpayments.ru/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center py-3 rounded-xl text-sm font-semibold border transition-all"
                    style={{ fontFamily: 'var(--font-nunito)', borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--bg)' }}
                  >
                    Управление подпиской
                  </a>
                  {showHint && hint}
                </>
              )}
            </>
          )
        })()}
      </Card>

      {/* ── 5. ДОКУМЕНТЫ ── */}
      <Card>
        <SectionLabel>Документы</SectionLabel>
        <div className="flex flex-col gap-1">
          {[
            { href: '/legal/terms',      label: 'Пользовательское соглашение' },
            { href: '/legal/privacy',    label: 'Политика конфиденциальности' },
            { href: '/legal/disclaimer', label: 'Медицинский дисклеймер' },
            { href: '/legal/rules',      label: 'Правила клуба' },
            { href: '/legal/refund',     label: 'Политика возврата' },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all"
              style={{
                fontFamily: 'var(--font-nunito)',
                fontSize: 13,
                color: 'var(--text)',
                background: 'var(--bg)',
                textDecoration: 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--pur-light)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg)')}
            >
              <span>{label}</span>
              <span style={{ color: 'var(--muted)', fontSize: 12 }}>↗</span>
            </a>
          ))}
        </div>
      </Card>

      {/* ── 5b. УВЕДОМЛЕНИЯ ── */}
      <Card>
        <SectionLabel>Уведомления</SectionLabel>
        {pushSupported ? (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)', margin: '0 0 2px' }}>
                Push-уведомления
              </p>
              <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)', margin: 0 }}>
                {pushSubscribed ? 'Включены — новые уроки и анонсы' : 'Получай уведомления о новых уроках и марафонах'}
              </p>
            </div>
            <button
              type="button"
              onClick={pushSubscribed ? pushUnsubscribe : pushSubscribe}
              disabled={!sdkReady || pushLoading}
              className="shrink-0 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              style={{
                background: pushSubscribed ? '#F0EEFF' : 'var(--pur)',
                color: pushSubscribed ? 'var(--pur)' : '#fff',
                border: 'none', padding: '10px 16px',
                cursor: 'pointer', fontFamily: 'var(--font-nunito)',
                whiteSpace: 'nowrap',
              }}
            >
              {pushLoading ? 'Подключаем...' : pushSubscribed ? 'Выключить' : 'Включить'}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)', margin: '0 0 4px' }}>
              Уведомления на телефон
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)', margin: 0 }}>
              📱 Установите клуб на главный экран — и получайте уведомления на телефон
            </p>
          </div>
        )}
      </Card>

      {/* ── 6. ВЫХОД ── */}
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
