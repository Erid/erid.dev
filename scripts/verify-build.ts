import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { RESUME_DOCX_PATH, RESUME_PDF_PATH, requireSiteDomain, siteUrl } from '../src/lib/site.ts'

const distDir = join(import.meta.dirname, '..', 'dist')
const problems: string[] = []
const SITE_URL = siteUrl(requireSiteDomain(process.env))

main()

/**
 * Checks the finished dist/ artifact: required routes, metadata, internal links, résumé files, and
 * the absence of the editor, draft content, and the plain-text contact email.
 */
function main(): void {
  if (!existsSync(distDir)) {
    throw new Error('Missing dist/. Run `pnpm build` first.')
  }

  const files = listFiles(distDir).map((file) => `/${relative(distDir, file)}`)
  const pages = files.filter((file) => file.endsWith('.html'))

  checkRequiredFiles(files)
  checkEditorExclusion(files)
  checkDrafts(files)
  for (const page of pages) checkPage(page, files)
  checkContactEmail(pages)

  if (problems.length > 0) {
    console.error(`Build verification failed:\n${problems.map((p) => `- ${p}`).join('\n')}`)
    process.exit(1)
  }
  console.log(`Build verified: ${pages.length} pages, ${files.length} files.`)
}

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? listFiles(path) : [path]
  })
}

function checkRequiredFiles(files: string[]): void {
  const required = [
    '/index.html',
    '/404.html',
    '/about/index.html',
    '/experience/index.html',
    '/resume/index.html',
    RESUME_PDF_PATH,
    RESUME_DOCX_PATH,
    '/robots.txt',
    '/sitemap-index.xml',
    '/favicon.svg',
  ]
  for (const path of required) {
    if (!files.includes(path)) problems.push(`Missing required file ${path}`)
  }
  if (files.includes(RESUME_PDF_PATH) && statSync(join(distDir, RESUME_PDF_PATH)).size < 10_000) {
    problems.push('Résumé PDF is suspiciously small')
  }
}

function checkEditorExclusion(files: string[]): void {
  if (files.some((file) => /keystatic/i.test(file))) {
    problems.push('Output contains Keystatic paths')
  }
  // Page copy may legitimately mention Keystatic by name, so only scripts and editor URLs count.
  for (const file of files.filter((f) => /\.(js|mjs|json)$/.test(f))) {
    if (/keystatic/i.test(readFileSync(join(distDir, file), 'utf8'))) {
      problems.push(`${file} references Keystatic`)
    }
  }
  for (const file of files.filter((f) => f.endsWith('.html'))) {
    if (/(href|action|src)="\/(api\/)?keystatic/i.test(readFileSync(join(distDir, file), 'utf8'))) {
      problems.push(`${file} links to the editor`)
    }
  }
}

function checkDrafts(files: string[]): void {
  // The shipped draft post must never become a route or a sitemap entry.
  if (files.some((file) => file.includes('placeholder-article'))) {
    problems.push('Draft post placeholder-article was published')
  }
  for (const file of files.filter((f) => f.startsWith('/sitemap'))) {
    if (readFileSync(join(distDir, file), 'utf8').includes('placeholder-article')) {
      problems.push(`${file} lists a draft`)
    }
  }
}

function checkPage(page: string, files: string[]): void {
  const html = readFileSync(join(distDir, page), 'utf8')
  const isNotFound = page === '/404.html'

  if (!/<title>[^<]+<\/title>/.test(html)) problems.push(`${page} has no title`)
  if (!/<meta name="description" content="[^"]+"/.test(html)) {
    problems.push(`${page} has no description`)
  }
  if (!isNotFound && !html.includes(`<link rel="canonical" href="${SITE_URL}`)) {
    problems.push(`${page} has no canonical URL on ${SITE_URL}`)
  }
  if ((html.match(/<h1[\s>]/g) ?? []).length !== 1) problems.push(`${page} needs exactly one h1`)
  for (const match of html.matchAll(/<img\b(?![^>]*\balt=)[^>]*>/g)) {
    problems.push(`${page} has an image without alt: ${match[0].slice(0, 60)}`)
  }

  for (const match of html.matchAll(/\shref="(\/[^"#?]*)/g)) {
    const target = match[1] as string
    if (!resolves(target, files)) problems.push(`${page} links to missing ${target}`)
  }
}

function resolves(target: string, files: string[]): boolean {
  if (files.includes(target)) return true
  return files.includes(`${target.replace(/\/$/, '')}/index.html`)
}

function checkContactEmail(pages: string[]): void {
  const email = process.env['CONTACT_EMAIL']
  const needles = ['href="mailto:', ...(email ? [email] : [])]
  for (const page of pages) {
    const html = readFileSync(join(distDir, page), 'utf8')
    for (const needle of needles) {
      if (html.includes(needle)) problems.push(`${page} exposes the contact email (${needle})`)
    }
  }
}
