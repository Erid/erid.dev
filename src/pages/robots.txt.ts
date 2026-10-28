import type { APIRoute } from 'astro'

// Generated so the sitemap URL follows SITE_DOMAIN instead of repeating the hostname.
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('sitemap-index.xml', site)
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
