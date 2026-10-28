import { createServer, type Server } from 'node:http'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import { basename, extname, join, normalize } from 'node:path'
import { chromium } from 'playwright'
import { parse } from 'yaml'
import type { z } from 'astro/zod'
import {
  educationSchema,
  experienceSchema,
  fullName,
  profileSchema,
  resumeSchema,
  skillsSchema,
} from '../src/lib/content/schemas.ts'
import { renderResumeDocx } from '../src/lib/resume/docx.ts'
import { buildResume, type ResumeModel } from '../src/lib/resume/model.ts'
import { RESUME_DOCX_PATH, RESUME_PDF_PATH, requireSiteDomain, siteUrl } from '../src/lib/site.ts'

const rootDir = join(import.meta.dirname, '..')
const distDir = join(rootDir, 'dist')
const contentDir = join(rootDir, 'src', 'content')

const MIME_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
}

await main()

/**
 * Generates and verifies the résumé PDF and Word (.docx) files inside dist/ from the local build
 * output and normalized content model.
 */
async function main(): Promise<void> {
  const resumeHtmlPath = join(distDir, 'resume', 'index.html')
  if (!existsSync(resumeHtmlPath)) {
    throw new Error('Missing dist/resume/index.html. Run `astro build` before building the résumé.')
  }

  const profile = readContentFile('profile.yaml', profileSchema)
  const skillsContent = readContentFile('skills.yaml', skillsSchema)
  const resumeContent = readContentFile('resume.yaml', resumeSchema)
  const experience = readContentDirectory('experience', '.yaml', experienceSchema)
  const education = readContentDirectory('education', '.yaml', educationSchema)
  const resume = buildResume(
    resumeContent,
    experience,
    education,
    skillsContent.skills,
    siteUrl(requireSiteDomain(process.env)),
  )

  const pdfOutPath = join(distDir, RESUME_PDF_PATH)
  const docxOutPath = join(distDir, RESUME_DOCX_PATH)
  mkdirSync(join(distDir, 'resume'), { recursive: true })

  const docxBuffer = await renderResumeDocx({
    profile,
    resume,
    contactEmail: process.env.CONTACT_EMAIL,
  })
  writeFileSync(docxOutPath, docxBuffer)

  await renderPdfFromBuiltSite(pdfOutPath, fullName(profile), resume)

  const pdfPages = verifyPdfArtifact(pdfOutPath, resume.website, profile.links)
  verifyDocxArtifact(docxOutPath)

  const pdfKb = (statSync(pdfOutPath).size / 1024).toFixed(1)
  const docxKb = (statSync(docxOutPath).size / 1024).toFixed(1)
  console.log(
    `Résumé artifacts ready: ${RESUME_PDF_PATH} (${pdfPages} pages, ${pdfKb} KB), ` +
      `${RESUME_DOCX_PATH} (${docxKb} KB).`,
  )
}

function readContentFile<T extends z.ZodType>(relativePath: string, schema: T): z.infer<T> {
  const raw = readFileSync(join(contentDir, relativePath), 'utf8')
  return schema.parse(parse(raw))
}

function readContentDirectory<T extends z.ZodType>(
  subdir: string,
  extension: string,
  schema: T,
): Record<string, z.infer<T>> {
  const dir = join(contentDir, subdir)
  const entries: Record<string, z.infer<T>> = {}
  for (const file of readdirSync(dir).filter((f) => f.endsWith(extension))) {
    entries[basename(file, extension)] = readContentFile(join(subdir, file), schema)
  }
  return entries
}

async function renderPdfFromBuiltSite(
  pdfOutPath: string,
  expectedName: string,
  resume: ResumeModel,
): Promise<void> {
  const { server, origin } = await startStaticServer(distDir)
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    const response = await page.goto(`${origin}/resume/`, { waitUntil: 'networkidle' })
    if (!response || !response.ok()) {
      throw new Error(`Failed to load /resume/ from local build server (${response?.status()})`)
    }

    await page.evaluate(async () => {
      await document.fonts.ready
      const images = Array.from(document.images)
      await Promise.all(
        images.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((resolve, reject) => {
                img.addEventListener('load', () => resolve(), { once: true })
                img.addEventListener('error', () => reject(new Error(`Image failed: ${img.src}`)), {
                  once: true,
                })
              }),
        ),
      )
    })

    await verifyRenderedResumeDom(page, expectedName, resume)

    await page.pdf({
      path: pdfOutPath,
      format: 'Letter',
      printBackground: true,
      preferCSSPageSize: true,
    })
  } finally {
    await browser.close()
    await closeServer(server)
  }
}

async function verifyRenderedResumeDom(
  page: import('playwright').Page,
  expectedName: string,
  resume: ResumeModel,
): Promise<void> {
  const h1 = (await page.locator('h1').textContent())?.trim()
  if (h1 !== expectedName) {
    throw new Error(`Résumé h1 mismatch: expected "${expectedName}", got "${h1 ?? ''}"`)
  }

  const websiteHref = await page
    .locator(`.contact a[href="${resume.website}"]`)
    .getAttribute('href')
  if (websiteHref !== resume.website) {
    throw new Error(`Résumé is missing website link ${resume.website}`)
  }

  const bodyText = (await page.locator('main').textContent()) ?? ''
  for (const heading of ['Summary', 'Experience', 'Education', 'Core skills', 'Languages']) {
    if (!bodyText.includes(heading)) {
      throw new Error(`Résumé DOM is missing section heading "${heading}"`)
    }
  }
  for (const role of resume.roles) {
    if (!bodyText.includes(role.employer) || !bodyText.includes(role.title)) {
      throw new Error(`Résumé DOM is missing role "${role.title}, ${role.employer}"`)
    }
  }
}

function startStaticServer(root: string): Promise<{ server: Server; origin: string }> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const urlPath = new URL(req.url ?? '/', 'http://127.0.0.1').pathname
      const safeRel = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.(\/|\\|$))+/, '')
      let filePath = join(root, safeRel)
      if (existsSync(filePath) && statSync(filePath).isDirectory()) {
        filePath = join(filePath, 'index.html')
      }
      if (!existsSync(filePath) || !statSync(filePath).isFile()) {
        res.writeHead(404).end('Not found')
        return
      }
      const type = MIME_TYPES[extname(filePath)] ?? 'application/octet-stream'
      res.writeHead(200, { 'Content-Type': type })
      res.end(readFileSync(filePath))
    })
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address() as AddressInfo
      resolve({ server, origin: `http://127.0.0.1:${address.port}` })
    })
  })
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()))
  })
}

function verifyPdfArtifact(
  pdfPath: string,
  websiteUrl: string,
  links: { label: string; url: string }[],
): number {
  const bytes = readFileSync(pdfPath)
  const raw = bytes.toString('latin1')
  if (!raw.startsWith('%PDF-')) {
    throw new Error(`Invalid PDF header in ${pdfPath}`)
  }

  const pageMatches = raw.match(/\/Type\s*\/Page\b(?!s)/g) ?? []
  const pageCount = pageMatches.length
  if (pageCount < 1 || pageCount > 2) {
    throw new Error(`Expected résumé PDF to be 1–2 pages, got ${pageCount} pages`)
  }

  for (const expectedUrl of [websiteUrl, ...links.map((l) => l.url)]) {
    const normalized = new URL(expectedUrl).href
    if (!raw.includes(`/URI (${expectedUrl})`) && !raw.includes(`/URI (${normalized})`)) {
      throw new Error(`Résumé PDF is missing clickable link annotation for ${expectedUrl}`)
    }
  }

  return pageCount
}

function verifyDocxArtifact(docxPath: string): void {
  const bytes = readFileSync(docxPath)
  // A .docx file is an Office Open XML ZIP archive starting with PK\x03\x04.
  if (
    bytes.length < 1024 ||
    bytes[0] !== 0x50 ||
    bytes[1] !== 0x4b ||
    bytes[2] !== 0x03 ||
    bytes[3] !== 0x04
  ) {
    throw new Error(`Invalid .docx archive at ${docxPath}`)
  }
}
