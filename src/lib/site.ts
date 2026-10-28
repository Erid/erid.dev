/** Public path of the generated résumé PDF; the build pipeline writes the file here. */
export const RESUME_PDF_PATH = '/resume/erid-baldioceda.pdf'

/** Public path of the generated résumé Word document; the build pipeline writes the file here. */
export const RESUME_DOCX_PATH = '/resume/erid-baldioceda.docx'

/**
 * Reads the single source of truth for where the site is served. Every consumer (Astro's `site`,
 * SST, the résumé, robots.txt, build verification) derives from `SITE_DOMAIN`, so staging and
 * production builds always agree with the infrastructure they deploy to.
 */
export function requireSiteDomain(env: Record<string, string | undefined>): string {
  const domain = env['SITE_DOMAIN']?.trim()
  if (
    !domain ||
    !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(domain)
  ) {
    throw new Error(
      'SITE_DOMAIN must be set to a bare hostname such as "example.com" (see .env.example).',
    )
  }
  return domain.toLowerCase()
}

export function siteUrl(domain: string): string {
  return `https://${domain}`
}

export const SITE_NAME = 'Erid Baldioceda'
