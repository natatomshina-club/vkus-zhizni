import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import React from 'react'
import {
  Document, Page, Text, View, StyleSheet, Font, renderToBuffer,
} from '@react-pdf/renderer'
import path from 'path'

// ── Font ─────────────────────────────────────────────────────────────────────
Font.register({
  family: 'NotoSans',
  src: path.join(process.cwd(), 'public/fonts/NotoSans-Regular.ttf'),
})

// ── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page:        { fontFamily: 'NotoSans', fontSize: 9, padding: 32, backgroundColor: '#FFFFFF' },
  hero:        { backgroundColor: '#6A3A2A', borderRadius: 6, padding: 14, marginBottom: 14 },
  heroTitle:   { fontSize: 16, color: '#FFFFFF', marginBottom: 4 },
  heroSub:     { fontSize: 9, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  kbjuRow:     { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  kbjuChip:    { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, color: '#FFFFFF', fontSize: 8 },
  dayBlock:    { marginBottom: 14, borderRadius: 4, border: '1px solid #EDE8FF' },
  dayHeader:   { backgroundColor: '#7C5CFC', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 0 },
  dayTitle:    { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
  mealBlock:   { paddingHorizontal: 10, paddingVertical: 6, borderBottom: '1px solid #F0EEFF' },
  mealTitle:   { fontSize: 9, color: '#3D2B8A', marginBottom: 3 },
  ingRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 1 },
  ingName:     { color: '#555', fontSize: 8 },
  ingGrams:    { color: '#7C5CFC', fontSize: 8 },
  macroRow:    { flexDirection: 'row', gap: 6, marginTop: 3 },
  macroChip:   { backgroundColor: '#F0EEFF', borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1, fontSize: 7, color: '#7C5CFC' },
  footer:      { marginTop: 14, paddingTop: 6, borderTop: '1px solid #EDE8FF' },
  footerText:  { color: '#9B8FCC', fontSize: 7, textAlign: 'center' },
  stepsLabel:  { fontSize: 7, color: '#E8845A', marginTop: 5, marginBottom: 2 },
  stepRow:     { flexDirection: 'row', gap: 4, paddingVertical: 1.5 },
  stepNum:     { fontSize: 7, color: '#7A9E7E', minWidth: 12 },
  stepText:    { fontSize: 7, color: '#555', flex: 1 },
})

// ── Types (minimal) ──────────────────────────────────────────────────────────
interface Ing  { name: string; grams: number }
interface Meal { meal_type: string; title: string; steps?: string[]; ingredients: Ing[]; total: { calories: number; protein: number; fat: number; carbs: number } }
interface Day  { day_number: number; day_name: string; meals: Meal[] }
interface Plan {
  member_name: string
  created_at: string
  meals_per_day: number
  kbju_calories: number; kbju_protein: number; kbju_fat: number; kbju_carbs: number
  plan_json: { days: Day[] }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtAmount(name: string, grams: number): string {
  const lower = name.toLowerCase()
  if (/яйц[оа]/i.test(lower)) {
    const w = lower.includes('перепел') ? 12 : 60
    const n = Math.ceil(grams / w)
    return `${grams}г (~${n} шт.)`
  }
  return `${grams}г`
}

const MEAL_LABELS: Record<string, string> = {
  завтрак: 'Завтрак', обед: 'Обед', ужин: 'Ужин',
  суп: 'Суп', салат: 'Салат',
}

// ── PDF Document ─────────────────────────────────────────────────────────────
function RationPDF({ plan }: { plan: Plan }) {
  const days = plan.plan_json.days ?? []
  const createdDate = new Date(plan.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

  return React.createElement(Document, { title: `Рацион — ${plan.member_name}` },
    React.createElement(Page, { size: 'A4', style: s.page },

      // ── Hero ──
      React.createElement(View, { style: s.hero },
        React.createElement(Text, { style: s.heroTitle }, plan.member_name || 'Рацион на неделю'),
        React.createElement(Text, { style: s.heroSub }, `${plan.meals_per_day}-разовое питание - 7 дней - ${createdDate}`),
        React.createElement(View, { style: s.kbjuRow },
          React.createElement(Text, { style: s.kbjuChip }, `${plan.kbju_calories} ккал`),
          React.createElement(Text, { style: s.kbjuChip }, `Б ${plan.kbju_protein}г`),
          React.createElement(Text, { style: s.kbjuChip }, `Ж ${plan.kbju_fat}г`),
          React.createElement(Text, { style: s.kbjuChip }, `У ${plan.kbju_carbs}г`),
        ),
      ),

      // ── Days ──
      ...days.map(day =>
        React.createElement(View, { key: day.day_number, style: s.dayBlock, wrap: false },
          React.createElement(View, { style: s.dayHeader },
            React.createElement(Text, { style: s.dayTitle }, `День ${day.day_number} — ${day.day_name}`),
          ),
          ...day.meals.map((meal, mi) =>
            React.createElement(View, { key: mi, style: s.mealBlock },
              React.createElement(Text, { style: s.mealTitle },
                `${MEAL_LABELS[meal.meal_type] ?? meal.meal_type}   ${meal.title}`
              ),
              React.createElement(View, { style: s.macroRow },
                React.createElement(Text, { style: s.macroChip }, `${meal.total.calories} ккал`),
                React.createElement(Text, { style: s.macroChip }, `Б ${meal.total.protein}г`),
                React.createElement(Text, { style: s.macroChip }, `Ж ${meal.total.fat}г`),
                React.createElement(Text, { style: s.macroChip }, `У ${meal.total.carbs}г`),
              ),
              ...(meal.ingredients ?? []).map((ing, ii) =>
                React.createElement(View, { key: ii, style: s.ingRow },
                  React.createElement(Text, { style: s.ingName }, `- ${ing.name}`),
                  React.createElement(Text, { style: s.ingGrams }, `${ing.grams}г`),
                )
              ),
              ...(meal.steps && meal.steps.length > 0
                ? [
                    React.createElement(Text, { style: s.stepsLabel }, 'ПРИГОТОВЛЕНИЕ'),
                    ...meal.steps.map((step, si) =>
                      React.createElement(View, { key: si, style: s.stepRow },
                        React.createElement(Text, { style: s.stepNum }, `${si + 1}.`),
                        React.createElement(Text, { style: s.stepText }, step),
                      )
                    ),
                  ]
                : []
              ),
            )
          ),
        )
      ),

      // ── Footer ──
      React.createElement(View, { style: s.footer },
        React.createElement(Text, { style: s.footerText }, 'Клуб «Вкус Жизни» · club.nata-tomshina.ru · Наталья Томшина'),
      ),
    )
  )
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { data, error } = await supabase
      .from('weekly_plans')
      .select('*')
      .eq('id', id)
      .eq('member_id', user.id)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Рацион не найден' }, { status: 404 })

    const plan = data as unknown as Plan
    const pdfBuffer = await renderToBuffer(RationPDF({ plan }))

    const dateStr = new Date(plan.created_at).toISOString().split('T')[0]
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="racion-${dateStr}.pdf"`,
        'Content-Length':      String(pdfBuffer.length),
      },
    })
  } catch (err) {
    console.error('[pdf] error:', err)
    return NextResponse.json({ error: 'Ошибка генерации PDF' }, { status: 500 })
  }
}
