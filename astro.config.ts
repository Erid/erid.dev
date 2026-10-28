import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import keystatic from '@keystatic/astro'
import { defineConfig } from 'astro/config'
import { existsSync } from 'node:fs'
import { requireSiteDomain, siteUrl } from './src/lib/site.ts'

// Astro does not load .env into the config file; existing variables (CI) take precedence.
if (existsSync('.env')) process.loadEnvFile('.env')

// The Keystatic editor and its file-writing API exist only for `astro dev`.
// Every build and preview omits the integration, so no editor routes ship.
const isDevServer = process.argv.includes('dev')

export default defineConfig({
  site: siteUrl(requireSiteDomain(process.env)),
  integrations: [sitemap(), ...(isDevServer ? [react(), keystatic()] : [])],
  server: { host: '127.0.0.1' },
})
