export const emailToToken = (email: string): string =>
  Buffer.from(email).toString('base64url')

export const tokenToEmail = (token: string): string => {
  try {
    return Buffer.from(token, 'base64url').toString('utf-8')
  } catch {
    return ''
  }
}
