export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  // TODO: реализовать после получения документации от Продамуса
  console.log('Prodamus webhook received', request.headers.get('content-type'))
  return Response.json({ ok: true }, { status: 200 })
}
