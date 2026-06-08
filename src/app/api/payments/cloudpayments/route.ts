import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { INTRO_COURSE_MESSAGES } from '@/lib/intro-course-messages'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)


const CP_SECRET_PROD = process.env.CP_API_SECRET ?? '94e2750be00e370189423df2fc83616d'
const CP_SECRET_TEST = process.env.CP_API_SECRET_TEST ?? '61e2a0b8613f359c49996226f4a57be4'

function verifyHmac(body: string, signature: string): boolean {
  const hmacProd = crypto.createHmac('sha256', CP_SECRET_PROD).update(body).digest('base64')
  const hmacTest = crypto.createHmac('sha256', CP_SECRET_TEST).update(body).digest('base64')
  return signature === hmacProd || signature === hmacTest
}

const PLAN_DAYS: Record<string, number> = {
  trial: 7, month: 30, monthly: 30, halfyear: 180,
}

function resolvePlan(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: Record<string, any>,
  amount: number
): { plan: string; days: number } | null {
  // 1. Сначала читаем из Data.Metadata.plan
  const metaPlan: string | undefined =
    payload.Data?.Metadata?.plan ??
    payload.JsonData?.Metadata?.plan

  if (metaPlan && PLAN_DAYS[metaPlan] !== undefined) {
    return { plan: metaPlan, days: PLAN_DAYS[metaPlan] }
  }

  // 2. Fallback по сумме
  if (amount === 149)  return { plan: 'trial',    days: 7   }
  if (amount === 1500) return { plan: 'month',    days: 30  }
  if (amount === 6000) return { plan: 'halfyear', days: 180 }
  return null
}

// ── Affiliate commission helper ────────────────────────────────────────
async function processAffiliateCommission({
  memberId,
  memberEmail,
  affiliateId,
  paymentAmount,
  commissionRate,
  type,
}: {
  memberId: string
  memberEmail: string
  affiliateId: string
  paymentAmount: number
  commissionRate: number
  type: 'first' | 'recurring'
}) {
  // Self-referral guard
  const { data: affiliate } = await supabaseAdmin
    .from('affiliates')
    .select('email, total_earned')
    .eq('id', affiliateId)
    .single()

  if (!affiliate) {
    console.log('[affiliate] affiliate not found:', affiliateId)
    return
  }
  if (affiliate.email.toLowerCase() === memberEmail.toLowerCase()) {
    console.log('[affiliate] self-referral skipped:', memberEmail)
    return
  }

  const commissionAmount = Math.round(paymentAmount * commissionRate * 100) / 100
  const approveAfter = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

  const { error: commErr } = await supabaseAdmin.from('affiliate_commissions').insert({
    affiliate_id: affiliateId,
    member_id: memberId,
    payment_amount: paymentAmount,
    commission_amount: commissionAmount,
    type,
    status: 'pending',
    approve_after: approveAfter,
  })

  if (commErr) {
    console.error('[affiliate] commission insert error:', commErr.message)
    return
  }

  // Increment total_earned (read-modify-write; commissions are rare so race risk is minimal)
  await supabaseAdmin
    .from('affiliates')
    .update({ total_earned: (affiliate.total_earned ?? 0) + commissionAmount })
    .eq('id', affiliateId)

  console.log(`[affiliate] commission created: ${commissionAmount}₽ (${type}) for affiliate ${affiliateId}`)
}

export async function POST(req: NextRequest) {
  const bodyText = await req.text()
  const signature = req.headers.get('Content-HMAC') || req.headers.get('X-Content-HMAC') || ''

  // Debug-логи для диагностики
  console.log('CP webhook body:', bodyText.substring(0, 500))
  console.log('CP webhook signature:', signature)

  // Проверка HMAC-подписи CloudPayments
  if (signature) {
    const isValid = verifyHmac(bodyText, signature)
    if (!isValid) {
      console.error('CloudPayments HMAC mismatch', { received: signature })
      return NextResponse.json({ code: 0 }, { status: 200 })
    }
  }

  // Парсинг — CloudPayments шлёт form-urlencoded
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: Record<string, any> = {}
  const contentType = req.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    try {
      Object.assign(payload, JSON.parse(bodyText))
    } catch {
      // ignore
    }
  } else {
    // form-urlencoded (основной формат CloudPayments)
    const params = new URLSearchParams(bodyText)
    params.forEach((value, key) => {
      payload[key] = value
    })
    // Data/JsonData — JSON-строка внутри формы
    if (payload.Data && typeof payload.Data === 'string') {
      try { payload.Data = JSON.parse(payload.Data) } catch { /* keep as string */ }
    }
    if (payload.JsonData && typeof payload.JsonData === 'string') {
      try { payload.JsonData = JSON.parse(payload.JsonData) } catch { /* keep as string */ }
    }
  }

  // Amount приходит как строка — привести к числу
  const Amount = parseFloat(payload.Amount) || 0
  const TransactionId = payload.TransactionId
  const AccountId: string = payload.AccountId || ''
  const Status: string = payload.Status || ''
  const SubscriptionId: string | null = payload.SubscriptionId || null
  const OperationType: string = payload.OperationType || ''

  console.log('CloudPayments webhook:', { TransactionId, Amount, AccountId, Status, SubscriptionId, OperationType })

  try {
    // --- PAY (первый платёж) ---
    if (Status === 'Completed' && OperationType === 'Payment') {
      console.log('PAY condition matched, processing...')
      try {
        const planData = resolvePlan(payload, Amount)
        console.log('planData:', planData)

        if (!planData) {
          console.error('Unknown amount:', Amount)
          return NextResponse.json({ code: 0 })
        }

        const { plan, days } = planData

        // ── Защита от повторного триала ────────────────────────────
        if (plan === 'trial') {
          const { data: existingForTrialCheck } = await supabaseAdmin
            .from('members')
            .select('id, subscription_status, last_payment_amount')
            .eq('email', AccountId)
            .maybeSingle()

          if (
            existingForTrialCheck &&
            existingForTrialCheck.last_payment_amount !== null &&
            ['trial', 'active', 'expired'].includes(existingForTrialCheck.subscription_status ?? '')
          ) {
            console.warn('Duplicate trial attempt:', AccountId)
            await supabaseAdmin.from('payment_logs').insert({
              member_id: existingForTrialCheck.id,
              transaction_id: String(TransactionId),
              amount: Amount,
              plan,
              event_type: 'duplicate_trial',
              payload,
            })
            return NextResponse.json({ code: 0 })
          }
        }
        // ──────────────────────────────────────────────────────────

        const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
        console.log('Looking up member:', AccountId)

        const { data: existingMember, error: memberError } = await supabaseAdmin
          .from('members')
          .select('id, is_manual_subscription, subscription_started_at')
          .eq('email', AccountId)
          .single()

        console.log('Member lookup result:', { member: existingMember, memberError })

        // Шаг 1: создать/найти auth user ПЕРВЫМ, чтобы использовать его UUID для members.id
        console.log('Creating/confirming auth user for:', AccountId)
        let authUserId: string | null = null
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: AccountId,
          email_confirm: true,
        })

        if (authUser?.user) {
          authUserId = authUser.user.id
          console.log('Auth user created with id:', authUserId)
        } else if (authError?.message === 'A user with this email address has already been registered') {
          const { data: userList } = await supabaseAdmin.auth.admin.listUsers()
          const found = userList?.users?.find(u => u.email === AccountId)
          if (found) {
            authUserId = found.id
            if (!found.email_confirmed_at) {
              await supabaseAdmin.auth.admin.updateUserById(found.id, { email_confirm: true })
            }
            console.log('Auth user found with id:', authUserId)
          }
        } else {
          console.error('Auth user create error:', authError)
        }

        // Шаг 2: найти или создать member — при создании использовать authUserId
        let member = existingMember
        if (!member) {
          console.log('Member not found, creating new...')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const insertData: Record<string, any> = { email: AccountId, name: AccountId }
          if (authUserId) insertData.id = authUserId
          const { data: newMember, error: insertError } = await supabaseAdmin
            .from('members')
            .insert(insertData)
            .select('id, is_manual_subscription, subscription_started_at')
            .single()
          console.log('Member insert result:', { newMember, insertError })
          member = newMember
        }

        if (!member) {
          console.error('Failed to find or create member for:', AccountId)
          return NextResponse.json({ code: 0 })
        }

        console.log('Updating member subscription, id:', member.id)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isManualPay = (existingMember as any)?.is_manual_subscription === true
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payUpdate: Record<string, any> = {
          payment_transaction_id: String(TransactionId),
          last_payment_at: new Date().toISOString(),
          last_payment_amount: Amount,
        }
        if (!isManualPay) {
          payUpdate.subscription_status = plan === 'trial' ? 'trial' : 'active'
          payUpdate.tariff = plan
          payUpdate.subscription_plan = plan
          payUpdate.subscription_started_at = (existingMember as any)?.subscription_started_at ?? new Date().toISOString()
          payUpdate.subscription_ends_at = expiresAt
          payUpdate.subscription_expires_at = expiresAt
          payUpdate.last_expiry_reminder_sent = null
          payUpdate.expiry_followup_step = 0
        } else {
          console.log('[pay] manual subscription — skipping subscription fields for member:', member.id)
        }
        const { error: updateError } = await supabaseAdmin.from('members').update(payUpdate).eq('id', member.id)
        console.log('Member update error:', updateError)

        console.log('Inserting payment_log...')
        const { error: logError } = await supabaseAdmin.from('payment_logs').insert({
          member_id: member.id,
          transaction_id: String(TransactionId),
          amount: Amount,
          plan,
          event_type: 'pay',
          payload,
        })
        console.log('payment_log insert error:', logError)

        // Шаг 3: отправить OTP (пользователь подтверждён — получит код, не magic link)
        console.log('Sending OTP to:', AccountId)
        const { error: otpError } = await supabaseAdmin.auth.signInWithOtp({
          email: AccountId,
          options: { shouldCreateUser: false },
        })
        console.log('OTP send result:', otpError ? `error: ${otpError.message}` : 'ok')

        await fetch('https://club.nata-tomshina.ru/api/email/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: AccountId, plan }),
        }).catch(() => null)

        // Конверсия подписчика
        try {
          await supabaseAdmin
            .from('subscribers')
            .update({
              converted_to_member: true,
              converted_at: new Date().toISOString(),
            })
            .eq('email', AccountId)
            .eq('converted_to_member', false)
        } catch (e) {
          console.warn('Subscriber conversion warning:', e)
        }

        // Запуск серии писем welcome_members при любом первом платеже
        try {
          const { data: subRow } = await supabaseAdmin
            .from('subscribers')
            .select('id')
            .eq('email', AccountId)
            .maybeSingle()

          const subscriberId = subRow?.id
          if (subscriberId) {
            const { data: existingProgress } = await supabaseAdmin
              .from('subscriber_sequence_progress')
              .select('id')
              .eq('subscriber_id', subscriberId)
              .eq('series', 'welcome_members')
              .maybeSingle()

            if (!existingProgress) {
              const firstSendAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
              await supabaseAdmin.from('subscriber_sequence_progress').insert({
                subscriber_id: subscriberId,
                series: 'welcome_members',
                current_step: 0,
                next_send_at: firstSendAt,
                completed: false,
              })
            }
          }
        } catch (e) {
          console.warn('[members-sequence] error:', e)
        }

        // Запуск цепочки intro_course для новых участниц (первая оплата)
        if (!existingMember && member) {
          try {
            // 1. Email-серия
            const { data: subRow2 } = await supabaseAdmin
              .from('subscribers')
              .select('id')
              .eq('email', AccountId)
              .maybeSingle()

            if (subRow2?.id) {
              const { data: existingIntroProgress } = await supabaseAdmin
                .from('subscriber_sequence_progress')
                .select('id')
                .eq('subscriber_id', subRow2.id)
                .eq('series', 'intro_course')
                .maybeSingle()

              if (!existingIntroProgress) {
                const introFirstSendAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
                await supabaseAdmin.from('subscriber_sequence_progress').insert({
                  subscriber_id: subRow2.id,
                  series: 'intro_course',
                  current_step: 0,
                  next_send_at: introFirstSendAt,
                  completed: false,
                })
              }
            }

            // 2. Личные сообщения по расписанию
            const startDate = new Date()
            const scheduledPMs = INTRO_COURSE_MESSAGES.map(({ day, text }) => {
              const sendAt = new Date(startDate)
              sendAt.setDate(sendAt.getDate() + day - 1)
              sendAt.setUTCHours(9, 0, 0, 0)
              // если на сегодня 09:00 уже прошло — перенести на следующий день
              if (day === 1 && sendAt <= startDate) {
                sendAt.setDate(sendAt.getDate() + 1)
              }
              return { member_id: member!.id, day_number: day, message: text, send_at: sendAt.toISOString() }
            })
            await supabaseAdmin.from('intro_course_pm_schedule').insert(scheduledPMs)

            console.log('[intro-course] scheduled for new member:', member.id)
          } catch (e) {
            console.warn('[intro-course] error:', e)
          }
        }

        // Синхронизация в subscribers
        await supabaseAdmin
          .from('subscribers')
          .upsert({
            email: AccountId,
            name: AccountId,
            source: 'club_member',
            status: 'active',
            converted_to_member: true,
            converted_at: new Date().toISOString(),
            subscribed_at: new Date().toISOString(),
          }, { onConflict: 'email' })

        // ── Affiliate attribution + commission (PAY) ──────────────
        if (member) {
          try {
            console.log('[affiliate:PAY] START — member:', member.id, 'plan:', plan, 'amount:', Amount)

            // Читаем referred_by из DB (может быть уже проставлен)
            const { data: memberRef } = await supabaseAdmin
              .from('members')
              .select('referred_by, ref_code_used')
              .eq('id', member.id)
              .single()

            let affiliateId: string | null = memberRef?.referred_by ?? null
            let refCode: string | null = memberRef?.ref_code_used ?? null

            console.log('[affiliate:PAY] member.referred_by in DB:', affiliateId, '/ ref_code_used:', refCode)

            // Если не привязан — ищем ref_code в pending_refs (сохранён со страницы /join)
            if (!affiliateId) {
              const { data: pendingRef } = await supabaseAdmin
                .from('pending_refs')
                .select('ref_code')
                .eq('email', AccountId)
                .single()

              console.log('[affiliate:PAY] pending_refs lookup for', AccountId, ':', pendingRef?.ref_code ?? 'NOT FOUND')

              if (pendingRef?.ref_code) {
                refCode = pendingRef.ref_code

                const { data: aff } = await supabaseAdmin
                  .from('affiliates')
                  .select('id, name, status')
                  .eq('ref_code', refCode)
                  .eq('status', 'active')
                  .single()

                console.log('[affiliate:PAY] affiliate lookup:', aff ? `id=${aff.id} name=${aff.name}` : 'NOT FOUND')

                if (aff) {
                  affiliateId = aff.id
                  await supabaseAdmin
                    .from('members')
                    .update({ referred_by: aff.id, ref_code_used: refCode })
                    .eq('id', member.id)
                  // Clean up pending_refs
                  await supabaseAdmin.from('pending_refs').delete().eq('email', AccountId)
                  console.log('[affiliate:PAY] attributed to affiliate:', affiliateId, '— pending_ref deleted')
                }
              }
            }

            // Комиссию начисляем только за не-триальные платежи
            if (plan !== 'trial' && affiliateId) {
              console.log('[affiliate:PAY] creating commission for affiliate:', affiliateId, 'rate: 20%')
              await processAffiliateCommission({
                memberId: member.id,
                memberEmail: AccountId,
                affiliateId,
                paymentAmount: Amount,
                commissionRate: 0.20,
                type: 'first',
              })
            } else if (plan === 'trial') {
              console.log('[affiliate:PAY] trial plan — attribution saved but no commission, affiliateId:', affiliateId)
            } else {
              console.log('[affiliate:PAY] no affiliateId — commission skipped')
            }
          } catch (e) {
            console.error('[affiliate] PAY processing error:', e)
          }
        }

        console.log('PAY processing done for:', AccountId)
      } catch (err) {
        console.error('PAY processing error:', err)
      }
    }

    // --- RECURRENT (автосписание) ---
    if (Status === 'Completed' && OperationType === 'Recurrent') {
      const planData = resolvePlan(payload, Amount)
      if (!planData) return NextResponse.json({ code: 0 })
      const { plan, days } = planData

      const { data: member } = await supabaseAdmin
        .from('members')
        .select('id, subscription_ends_at, referred_by, is_manual_subscription, subscription_started_at')
        .eq('email', AccountId)
        .single()

      if (!member) return NextResponse.json({ code: 0 })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isManual = (member as any).is_manual_subscription === true

      const currentEnd = (member as { subscription_ends_at?: string }).subscription_ends_at
      const base = currentEnd
        ? new Date(Math.max(Date.now(), new Date(currentEnd).getTime()))
        : new Date()
      const expiresAt = new Date(base.getTime() + days * 24 * 60 * 60 * 1000).toISOString()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recurrentUpdate: Record<string, any> = {
        last_payment_at: new Date().toISOString(),
        last_payment_amount: Amount,
        payment_transaction_id: String(TransactionId),
      }
      if (!isManual) {
        recurrentUpdate.subscription_status = 'active'
        recurrentUpdate.tariff = plan
        recurrentUpdate.subscription_plan = plan
        recurrentUpdate.subscription_started_at = (member as any).subscription_started_at ?? new Date().toISOString()
        recurrentUpdate.subscription_ends_at = expiresAt
        recurrentUpdate.subscription_expires_at = expiresAt
        recurrentUpdate.last_expiry_reminder_sent = null
        recurrentUpdate.expiry_followup_step = 0
      } else {
        console.log('[recurrent] manual subscription — skipping subscription fields for member:', member.id)
      }

      await supabaseAdmin.from('members').update(recurrentUpdate).eq('id', member.id)

      await supabaseAdmin.from('payment_logs').insert({
        member_id: member.id,
        transaction_id: String(TransactionId),
        amount: Amount,
        plan,
        event_type: 'recurrent',
        payload,
      })

      // ── Affiliate commission (RECURRENT) ──────────────────────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const affiliateId: string | null = (member as any).referred_by ?? null
      if (affiliateId) {
        try {
          // If no 'first' commission exists yet (trial → paid conversion), treat as first at 20%
          const { count: firstCount } = await supabaseAdmin
            .from('affiliate_commissions')
            .select('id', { count: 'exact', head: true })
            .eq('member_id', member.id)
            .eq('type', 'first')

          const isFirstRealPayment = (firstCount ?? 0) === 0

          await processAffiliateCommission({
            memberId: member.id,
            memberEmail: AccountId,
            affiliateId,
            paymentAmount: Amount,
            commissionRate: isFirstRealPayment ? 0.20 : 0.10,
            type: isFirstRealPayment ? 'first' : 'recurring',
          })
        } catch (e) {
          console.error('[affiliate] RECURRENT processing error:', e)
        }
      }
    }

    // --- RECURRENT отменён/отклонён ---
    if (OperationType === 'Recurrent' && (Status === 'Cancelled' || Status === 'Rejected')) {
      const { data: member } = await supabaseAdmin
        .from('members')
        .select('id')
        .eq('email', AccountId)
        .single()

      if (member) {
        await supabaseAdmin.from('members').update({
          subscription_status: 'cancelled',
        }).eq('id', member.id)

        await supabaseAdmin.from('payment_logs').insert({
          member_id: member.id,
          transaction_id: String(TransactionId),
          amount: Amount,
          plan: null,
          event_type: 'cancelled',
          payload,
        })
      }
    }

  } catch (err) {
    console.error('CloudPayments webhook error:', err)
  }

  return NextResponse.json({ code: 0 })
}
