export function baseEmailTemplate(content: string, preheader?: string): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Вкус Жизни</title>
</head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:Arial,sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Шапка -->
        <tr><td style="background:#2d1f3d;padding:24px 40px;border-radius:12px 12px 0 0;text-align:center;">
          <span style="color:#fff;font-size:22px;font-weight:bold;letter-spacing:1px;">🌿 Вкус Жизни</span>
        </td></tr>

        <!-- Контент -->
        <tr><td style="background:#ffffff;padding:40px;border-radius:0 0 12px 12px;">
          ${content}

          <!-- Разделитель -->
          <div style="border-top:1px solid #e8e0d8;margin:32px 0;"></div>

          <!-- Футер -->
          <p style="color:#999;font-size:12px;text-align:center;margin:0;line-height:1.8;">
            Вы получили это письмо как подписчица Томшиной Натальи<br>
            или как участница клуба «Вкус Жизни».<br><br>
            По всем вопросам: <a href="mailto:nata.tomshina@gmail.com" style="color:#999;">nata.tomshina@gmail.com</a><br><br>
            <a href="https://nata-tomshina.ru" style="color:#999;text-decoration:none;">nata-tomshina.ru</a><br><br>
            <a href="https://nata-tomshina.ru/unsubscribe?token={{unsubscribe_token}}"
               style="display:inline-block;margin-top:8px;padding:8px 20px;background:#f5f0eb;border:1px solid #ddd;border-radius:20px;color:#999;text-decoration:none;font-size:12px;">
              Отписаться в один клик
            </a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
