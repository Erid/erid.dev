/**
 * Light obfuscation so scrapers reading raw HTML do not find a contact detail (email address or
 * phone number): reversed, then base64. This deters simple harvesters only; anyone who runs the
 * page's JavaScript can read it.
 */
export function encodeContact(value: string | undefined): string | undefined {
  if (!value) return undefined
  return Buffer.from([...value].reverse().join(''), 'utf8').toString('base64')
}

/** WhatsApp links need the international number as digits only, without `+` or separators. */
export function normalizeWhatsAppNumber(value: string | undefined): string | undefined {
  const digits = value?.replace(/\D/g, '')
  return digits || undefined
}
