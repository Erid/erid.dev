import { spawn, type ChildProcess } from 'node:child_process'
import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { chromium, type Browser } from 'playwright'
import { RESUME_PDF_PATH } from '../../src/lib/site.ts'

const PORT = 4399
const origin = `http://127.0.0.1:${PORT}`

let preview: ChildProcess
let browser: Browser

before(async () => {
  // Exercises the production output: `astro preview` serves dist/ and never includes the editor.
  preview = spawn('pnpm', ['exec', 'astro', 'preview', '--port', String(PORT)], {
    stdio: 'ignore',
  })
  await waitForServer()
  browser = await chromium.launch()
})

after(async () => {
  await browser?.close()
  preview?.kill()
})

describe('production site', () => {
  it('serves the résumé PDF directly from the homepage', async () => {
    const page = await browser.newPage()
    await page.goto(origin)
    const href = await page.locator(`a[href="${RESUME_PDF_PATH}"]`).first().getAttribute('href')
    assert.equal(href, RESUME_PDF_PATH)
    const response = await page.request.get(`${origin}${RESUME_PDF_PATH}`)
    assert.equal(response.status(), 200)
    assert.match(response.headers()['content-type'] ?? '', /pdf/)
    await page.close()
  })

  it('keeps the role and work history readable without JavaScript', async () => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto(origin)
    assert.ok(await page.locator('h1').isVisible())
    assert.ok((await page.locator('main a[href^="/experience/"]').count()) > 0)
    await context.close()
  })

  it('offers a skip link as the first keyboard stop', async () => {
    const page = await browser.newPage()
    await page.goto(origin)
    await page.keyboard.press('Tab')
    const focused = await page.evaluate(() => document.activeElement?.getAttribute('href'))
    assert.equal(focused, '#main')
    await page.close()
  })

  it('navigates between pages smoothly without a full document reload', async () => {
    const page = await browser.newPage()
    await page.goto(origin)
    await page.evaluate(() => {
      ;(window as unknown as { __navMarker?: boolean }).__navMarker = true
    })
    await page.locator('header nav a[href="/about/"]').click()
    await page.waitForURL(`${origin}/about/`)
    assert.match((await page.locator('h1').textContent()) ?? '', /Hi, I['’‘]m/)
    const preserved = await page.evaluate(
      () => (window as unknown as { __navMarker?: boolean }).__navMarker === true,
    )
    assert.equal(preserved, true, 'expected ClientRouter to preserve window state across nav')
    await page.close()
  })

  it('does not overflow horizontally on a mobile viewport', async () => {
    const context = await browser.newContext({ viewport: { width: 375, height: 800 } })
    const page = await context.newPage()
    for (const path of ['/', '/experience/', '/about/', '/resume/']) {
      await page.goto(`${origin}${path}`)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      assert.ok(overflow <= 0, `${path} overflows by ${overflow}px`)
    }
    await context.close()
  })

  it('returns real 404s and no editor routes', async () => {
    const page = await browser.newPage()
    for (const path of ['/keystatic', '/api/keystatic/tree', '/does-not-exist/']) {
      const response = await page.request.get(`${origin}${path}`)
      assert.equal(response.status(), 404, path)
    }
    await page.close()
  })

  it('toggles dark mode and persists the color-scheme override across navigation', async () => {
    const page = await browser.newPage()
    await page.goto(origin)
    const meta = page.locator('head meta[name="color-scheme"]')
    assert.equal(await meta.getAttribute('content'), 'light dark')

    await page.locator('[data-theme-toggle]').click()
    const toggled = await meta.getAttribute('content')
    assert.ok(toggled === 'dark' || toggled === 'light')

    await page.locator('header nav a[href="/about/"]').click()
    await page.waitForURL(`${origin}/about/`)
    assert.equal(await meta.getAttribute('content'), toggled)
    await page.close()
  })

  it('opens and closes a Core Skill modal with experience details on the homepage', async () => {
    const page = await browser.newPage()
    await page.goto(origin)
    const reactBadge = page.locator('button.chip-skill', { hasText: 'React' }).first()
    await reactBadge.click()

    const dialog = page.locator('dialog#home-skill-react')
    assert.equal(await dialog.getAttribute('open'), '')
    assert.match((await dialog.textContent()) ?? '', /Total experience/)
    assert.match((await dialog.textContent()) ?? '', /Empat Speech/)

    await page.keyboard.press('Escape')
    assert.equal(await dialog.getAttribute('open'), null)
    await page.close()
  })
})

async function waitForServer(): Promise<void> {
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      if ((await fetch(origin)).ok) return
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error('Preview server did not start')
}
