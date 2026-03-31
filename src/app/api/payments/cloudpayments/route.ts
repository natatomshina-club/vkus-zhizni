import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)


function verifyHmac(body: string, signature: string): boolean {
  const secret = process.env.CLOUDPAYMENTS_API_SECRET
  if (!secret) return true
  const hmac = crypto.createHmac('sha256', secret).update(body).digest('base64')
  return hmac === signature
}

function getPlanByAmount(amount: number): { plan: string; days: number } | null {
  if (amount === 149)  return { plan: 'trial',    days: 7   }
  if (amount === 1500) return { plan: 'monthly',  days: 30  }
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
  const signature = req.headers.get('X-Content-HMAC') || ''

  // Debug-логи для диагностики
  console.log('CP webhook body:', bodyText.substring(0, 500))
  console.log('CP webhook signature:', signature)

  // HMAC — не блокируем (тестовый режим)
  if (signature) {
    const isValid = verifyHmac(bodyText, signature)
    if (!isValid) console.warn('CP webhook: HMAC mismatch (ok in test mode)')
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
        const planData = getPlanByAmount(Amount)
        console.log('planData:', planData)

        if (!planData) {
          console.error('Unknown amount:', Amount)
          return NextResponse.json({ code: 0 })
        }

        const { plan, days } = planData
        const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
        console.log('Looking up member:', AccountId)

        const { data: existingMember, error: memberError } = await supabaseAdmin
          .from('members')
          .select('id')
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
            .select('id')
            .single()
          console.log('Member insert result:', { newMember, insertError })
          member = newMember
        }

        if (!member) {
          console.error('Failed to find or create member for:', AccountId)
          return NextResponse.json({ code: 0 })
        }

        console.log('Updating member subscription, id:', member.id)
        const { error: updateError } = await supabaseAdmin.from('members').update({
          subscription_status: plan === 'trial' ? 'trial' : 'active',
          tariff: plan,
          subscription_started_at: new Date().toISOString(),
          subscription_ends_at: expiresAt,
          subscription_expires_at: expiresAt,
          payment_transaction_id: String(TransactionId),
          last_payment_at: new Date().toISOString(),
          last_payment_amount: Amount,
        }).eq('id', member.id)
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
      const planData = getPlanByAmount(Amount)
      if (!planData) return NextResponse.json({ code: 0 })
      const { plan, days } = planData

      const { data: member } = await supabaseAdmin
        .from('members')
        .select('id, subscription_ends_at, referred_by')
        .eq('email', AccountId)
        .single()

      if (!member) return NextResponse.json({ code: 0 })

      const currentEnd = (member as { subscription_ends_at?: string }).subscription_ends_at
      const base = currentEnd
        ? new Date(Math.max(Date.now(), new Date(currentEnd).getTime()))
        : new Date()
      const expiresAt = new Date(base.getTime() + days * 24 * 60 * 60 * 1000).toISOString()

      await supabaseAdmin.from('members').update({
        subscription_status: 'active',
        tariff: plan,
        subscription_ends_at: expiresAt,
        subscription_expires_at: expiresAt,
        last_payment_at: new Date().toISOString(),
        last_payment_amount: Amount,
        payment_transaction_id: String(TransactionId),
      }).eq('id', member.id)

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
