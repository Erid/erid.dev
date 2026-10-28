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
