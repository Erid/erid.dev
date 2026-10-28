/// <reference path="./.sst/platform/config.d.ts" />

// Infrastructure for the static site. Deploying requires Cloudflare credentials and is a manual,
// separately authorized step; see docs/deployment.md.
export default $config({
  app(input) {
    return {
      name: 'erid-dev',
      // Retain and protect production resources against accidental removal.
      removal: input.stage === 'production' ? 'retain' : 'remove',
      protect: input.stage === 'production',
      home: 'cloudflare',
    }
  },
  async run() {
    // The same value configures Astro's canonical URLs, so the build matches where it is served.
    const { requireSiteDomain } = await import('./src/lib/site.ts')
    const domain = requireSiteDomain(process.env)
    const isProduction = $app.stage === 'production'

    const site = new sst.cloudflare.StaticSiteV2('Site', {
      // `pnpm build` produces the site and the résumé files together; SST uploads that output.
      build: { command: 'pnpm build', output: 'dist' },
      domain: {
        name: domain,
        // Only the production apex domain redirects its www alias.
        ...(isProduction ? { redirects: [`www.${domain}`] } : {}),
      },
    })

    return { url: site.url }
  },
})
