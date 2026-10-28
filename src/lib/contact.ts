/**
 * Light obfuscation so scrapers reading raw HTML do not find the address: reversed, then base64.
 * This deters simple harvesters only; anyone who runs the page's JavaScript can read it.
 */
export function encodeEmail(address: string | undefined): string | undefined {
  if (!address) return undefined
  return Buffer.from([...address].reverse().join(''), 'utf8').toString('base64')
}
