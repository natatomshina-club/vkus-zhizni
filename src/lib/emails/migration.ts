export function migrationEmail(name?: string): string {
  const greeting = `Привет${name ? ', ' + name : ''}!`

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Клуб «Вкус Жизни» переехал</title>
</head>
<body style="margin:0;padding:0;background:#F5F3FF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3FF;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:40px;margin:0 auto;">

          <!-- Логотип -->
          <tr>
            <td style="padding-bottom:32px;text-align:center;">
              <span style="font-size:20px;font-weight:bold;color:#7C5CFC;letter-spacing:-0.3px;">Вкус Жизни</span>
            </td>
          </tr>

          <!-- Приветствие -->
          <tr>
            <td style="padding-bottom:16px;">
              <p style="margin:0;font-size:18px;font-weight:bold;color:#333333;">${greeting}</p>
            </td>
          </tr>

          <!-- Основной текст -->
          <tr>
            <td style="padding-bottom:8px;">
              <p style="margin:0 0 16px 0;font-size:16px;line-height:1.7;color:#555555;">
                Я рада сообщить — наш клуб переехал на новую, удобную платформу.
                Там всё стало лучше: умная кухня с рецептами, дневник питания,
                медитации, марафоны и живые чаты.
              </p>
              <p style="margin:0;font-size:16px;line-height:1.7;color:#555555;">
                Чтобы продолжить занятия, просто перейди по ссылке и выбери тариф
                <strong style="color:#333333;">«Месяц — 1 500 ₽»</strong> для полного доступа ко всем материалам клуба.
              </p>
            </td>
          </tr>

          <!-- Кнопка -->
          <tr>
            <td style="padding:32px 0;text-align:center;">
              <a href="https://nata-tomshina.ru/join"
                 style="display:block;background:#7C5CFC;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:50px;font-size:16px;font-weight:bold;text-align:center;max-width:260px;margin:0 auto;">
                Перейти в новый клуб →
              </a>
            </td>
          </tr>

          <!-- Прощание -->
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0;font-size:16px;line-height:1.7;color:#555555;">Увидимся внутри! 💜</p>
            </td>
          </tr>

          <!-- Подпись -->
          <tr>
            <td style="padding-bottom:32px;border-top:1px solid #EDE8FF;padding-top:24px;">
              <p style="margin:0 0 4px 0;font-size:16px;font-weight:bold;color:#333333;">Наталья Томшина</p>
              <p style="margin:0;font-size:13px;color:#999999;">нутрициолог, основатель клуба «Вкус Жизни»</p>
            </td>
          </tr>

          <!-- Футер -->
          <tr>
            <td style="text-align:center;">
              <p style="margin:0;font-size:11px;color:#bbbbbb;line-height:1.6;">
                ИП Томшина Наталья Викторовна · ОГРНИП 320385000051004
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
