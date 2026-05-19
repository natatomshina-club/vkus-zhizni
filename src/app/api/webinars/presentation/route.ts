export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get('url')
  if (!url) return new Response('No url', { status: 400 })

  const res = await fetch(url)
  if (!res.ok) return new Response('Not found', { status: 404 })

  const html = await res.text()
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
