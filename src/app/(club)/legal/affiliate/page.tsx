import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Условия партнёрской программы — Вкус Жизни',
  description: 'Публичная оферта партнёрской программы клуба «Вкус Жизни» Натальи Томшиной.',
}

export default function AffiliateTermsPage() {
  return (
    <div style={{ minHeight: '100dvh', background: '#FAF8FF', fontFamily: 'var(--font-nunito)', padding: '24px 16px 48px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Link href="/legal" style={{ display: 'inline-block', marginBottom: 20, fontSize: 13, color: '#7B6FAA', textDecoration: 'none', padding: '8px 14px', borderRadius: 10, background: '#F0EEFF' }}>
          ← Все документы
        </Link>

        <div style={{ background: '#fff', border: '1px solid #EDE8FF', borderRadius: 20, padding: '32px 28px' }}>
          <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 20, fontWeight: 700, color: '#2D1F6E', margin: '0 0 6px', lineHeight: 1.3 }}>
            Условия партнёрской программы
          </h1>
          <p style={{ fontSize: 13, color: '#9B8FCC', margin: '0 0 32px' }}>
            Редакция от 1 апреля 2026 г. · ИП Томшина Наталья Викторовна
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 28, fontSize: 14, color: '#2D1F6E', lineHeight: 1.75 }}>

            <section>
              <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 15, fontWeight: 700, color: '#3D2B8A', margin: '0 0 10px' }}>1. Общие положения</h2>
              <p style={{ margin: '0 0 10px' }}>
                Настоящий документ является публичной офертой ИП Томшина Наталья (далее — «Организатор») и регулирует условия участия в партнёрской программе онлайн-клуба «Вкус Жизни» (далее — «Программа»).
              </p>
              <p style={{ margin: 0 }}>
                Подавая заявку на участие в Программе, физическое лицо или индивидуальный предприниматель (далее — «Партнёр») подтверждает, что ознакомился с настоящими условиями и безоговорочно их принимает.
              </p>
            </section>

            <section>
              <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 15, fontWeight: 700, color: '#3D2B8A', margin: '0 0 10px' }}>2. Порядок вступления в Программу</h2>
              <p style={{ margin: '0 0 10px' }}>2.1. Для участия в Программе необходимо заполнить заявку на странице nata-tomshina.ru/partner.</p>
              <p style={{ margin: '0 0 10px' }}>2.2. Организатор рассматривает заявку в течение 2 рабочих дней и направляет ответ на указанный email.</p>
              <p style={{ margin: '0 0 10px' }}>2.3. После одобрения заявки Партнёр получает персональный реферальный код и ссылку для распространения.</p>
              <p style={{ margin: 0 }}>2.4. Организатор вправе отказать в участии в Программе без объяснения причин.</p>
            </section>

            <section>
              <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 15, fontWeight: 700, color: '#3D2B8A', margin: '0 0 10px' }}>3. Вознаграждение</h2>
              <p style={{ margin: '0 0 10px' }}>3.1. За каждого нового участника клуба, пришедшего по реферальной ссылке Партнёра и оплатившего платную подписку (не триальный доступ за 149 ₽), Партнёру начисляется вознаграждение в размере <strong>20% от суммы первого платежа</strong>.</p>
              <p style={{ margin: '0 0 10px' }}>3.2. За каждое последующее автоматическое продление подписки привлечённого участника Партнёру начисляется вознаграждение в размере <strong>10% от суммы платежа</strong>.</p>
              <p style={{ margin: '0 0 10px' }}>3.3. Вознаграждение не начисляется за триальный доступ стоимостью 149 ₽, а также за отменённые или возвращённые платежи.</p>
              <p style={{ margin: 0 }}>3.4. Самореферал (привлечение самого себя) не допускается и не вознаграждается.</p>
            </section>

            <section>
              <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 15, fontWeight: 700, color: '#3D2B8A', margin: '0 0 10px' }}>4. Сроки и порядок выплат</h2>
              <p style={{ margin: '0 0 10px' }}>4.1. Начисленное вознаграждение имеет статус «ожидает одобрения» в течение 14 дней после платежа — для защиты от возвратов.</p>
              <p style={{ margin: '0 0 10px' }}>4.2. Выплаты производятся 1-го числа каждого месяца за предыдущий период при условии накопления суммы не менее <strong>1 000 ₽</strong>.</p>
              <p style={{ margin: '0 0 10px' }}>4.3. Выплата производится на реквизиты, указанные Партнёром при запросе выплаты (карта российского банка или расчётный счёт ИП).</p>
              <p style={{ margin: 0 }}>4.4. Налоговые обязательства, возникающие у Партнёра в связи с получением вознаграждения, Партнёр исполняет самостоятельно.</p>
            </section>

            <section>
              <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 15, fontWeight: 700, color: '#3D2B8A', margin: '0 0 10px' }}>5. Права и обязанности Партнёра</h2>
              <p style={{ margin: '0 0 10px' }}>5.1. Партнёр обязуется распространять реферальную ссылку честными методами, без спама, вводящей в заблуждение рекламы и нарушений законодательства.</p>
              <p style={{ margin: '0 0 10px' }}>5.2. Партнёр не вправе использовать контекстную рекламу по брендовым запросам («Вкус Жизни», «Томшина») без письменного согласия Организатора.</p>
              <p style={{ margin: 0 }}>5.3. Партнёр вправе в любое время выйти из Программы, уведомив Организатора по email hello@nata-tomshina.ru.</p>
            </section>

            <section>
              <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 15, fontWeight: 700, color: '#3D2B8A', margin: '0 0 10px' }}>6. Права и обязанности Организатора</h2>
              <p style={{ margin: '0 0 10px' }}>6.1. Организатор обязуется корректно отслеживать переходы по реферальным ссылкам и начислять вознаграждение согласно настоящим условиям.</p>
              <p style={{ margin: '0 0 10px' }}>6.2. Организатор вправе изменять условия Программы, уведомив Партнёров по email не менее чем за 14 дней до вступления изменений в силу.</p>
              <p style={{ margin: 0 }}>6.3. Организатор вправе исключить Партнёра из Программы в случае нарушения настоящих условий, выплатив накопленное и одобренное вознаграждение.</p>
            </section>

            <section>
              <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 15, fontWeight: 700, color: '#3D2B8A', margin: '0 0 10px' }}>7. Конфиденциальность</h2>
              <p style={{ margin: 0 }}>
                Персональные данные Партнёра обрабатываются в соответствии с{' '}
                <Link href="/legal/privacy" style={{ color: '#7C5CFC', fontWeight: 600, textDecoration: 'none' }}>Политикой конфиденциальности</Link>{' '}
                клуба «Вкус Жизни».
              </p>
            </section>

            <section>
              <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 15, fontWeight: 700, color: '#3D2B8A', margin: '0 0 10px' }}>8. Контакты</h2>
              <p style={{ margin: 0 }}>
                По всем вопросам партнёрской программы:{' '}
                <a href="mailto:hello@nata-tomshina.ru" style={{ color: '#7C5CFC', fontWeight: 600, textDecoration: 'none' }}>hello@nata-tomshina.ru</a>
              </p>
            </section>

          </div>

          <p style={{ margin: '32px 0 0', fontSize: 12, color: '#9B8FCC', borderTop: '1px solid #EDE8FF', paddingTop: 20 }}>
            ИП Томшина Наталья Викторовна · ОГРНИП 320385000051004 · ИНН 381105203104
          </p>
        </div>
      </div>
    </div>
  )
}
