export async function GET() {
  return Response.json({
    resend: !!process.env.RESEND_API_KEY,
    resend_prefix: process.env.RESEND_API_KEY?.substring(0, 8) ?? 'NOT FOUND',
  })
}
