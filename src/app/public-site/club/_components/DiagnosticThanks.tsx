export default function DiagnosticThanks() {
  return (
    <div className="diag-thanks">
      <div className="diag-thanks__icon">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path d="M7 19L14 26L29 11" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <h2 className="diag-thanks__title">Спасибо, я получила вашу анкету</h2>

      <p className="diag-thanks__text">
        В ближайшие 24 часа я напишу вам в Telegram или WhatsApp. Отвечу на все вопросы и помогу понять, подходит ли вам клуб или нет.
        <br /><br />
        Если вас всё устроит — попадёте в группу, которая стартует уже на следующей неделе.
      </p>

      <p className="diag-thanks__sign">С теплом, Наталья</p>

      <div className="diag-thanks__btns">
        <a href="/results" className="diag-thanks__outline">Читать истории участниц →</a>
      </div>
    </div>
  )
}
