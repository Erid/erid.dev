import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import keystatic from '@keystatic/astro'
import { defineConfig } from 'astro/config'

// The Keystatic editor and its file-writing API exist only for `astro dev`.
// Every build and preview omits the integration, so no editor routes ship.
const isDevServer = process.argv.includes('dev')

export default defineConfig({
  site: 'https://erid.dev',
  integrations: [sitemap(), ...(isDevServer ? [react(), keystatic()] : [])],
  server: { host: '127.0.0.1' },
})
