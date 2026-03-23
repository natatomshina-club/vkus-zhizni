export function extractKinescopeId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  // Already an ID (alphanumeric, 15-30 chars)
  if (/^[a-zA-Z0-9]{15,30}$/.test(trimmed)) return trimmed

  // Full URL — take last path segment
  try {
    const url = new URL(trimmed)
    const parts = url.pathname.split('/').filter(Boolean)
    const id = parts[parts.length - 1]
    if (/^[a-zA-Z0-9]{15,30}$/.test(id)) return id
  } catch {}

  return null
}
