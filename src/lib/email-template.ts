export function inlineStyles(html: string): string {
  return html
    .replace(/<h2>/g, '<h2 style="font-size:26px;font-weight:700;color:#6B4FA0;margin:32px 0 16px;line-height:1.3;">')
    .replace(/<p>/g, '<p style="margin:0 0 20px;font-size:19px;line-height:1.85;color:#2d2d2d;">')
    .replace(/<strong>/g, '<strong style="font-weight:700;color:#1a1a1a;">')
    .replace(/<ul>/g, '<ul style="margin:0 0 20px;padding-left:24px;">')
    .replace(/<ol>/g, '<ol style="margin:0 0 20px;padding-left:24px;">')
    .replace(/<li>/g, '<li style="font-size:19px;line-height:1.85;margin:0 0 10px;color:#2d2d2d;">')
    .replace(/<a /g, '<a style="color:#6B4FA0;font-weight:600;" ')
}

export function buildEmailHtml(content: string, unsubscribeToken: string): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f5f0ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0ff;">
    <tr><td align="center" style="padding:24px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;">

        <tr><td style="background:linear-gradient(135deg,#6B4FA0 0%,#9B6FD0 100%);padding:36px 40px;text-align:center;">
          <p style="margin:0;font-size:15px;color:#e8d5ff;letter-spacing:1px;text-transform:uppercase;">Клуб стройных и здоровых</p>
          <h1 style="margin:8px 0 0;font-size:32px;color:#ffffff;font-weight:700;">🌿 Вкус Жизни</h1>
        </td></tr>

        <tr><td style="padding:44px 40px;color:#1a1a1a;">
          <div style="font-size:19px;line-height:1.85;color:#2d2d2d;">
            ${content}
          </div>
        </td></tr>

        <tr><td style="background:#faf7ff;padding:28px 40px;text-align:center;border-top:2px solid #ede8f5;">
          <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#6B4FA0;">Наталья Томшина</p>
          <p style="margin:0 0 12px;font-size:14px;color:#888;">нутрициолог, основатель клуба Вкус Жизни</p>
          <p style="margin:0;font-size:13px;color:#aaa;line-height:1.6;">
            Вы получили это письмо, так как подписались на рассылку.<br>
            <a href="https://nata-tomshina.ru/unsubscribe?token=${unsubscribeToken}"
               style="color:#9B6FD0;text-decoration:underline;">Отписаться от рассылки</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
