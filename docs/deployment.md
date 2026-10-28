# Deployment

Staging deploys are manual. Production deploys automatically on every push to `main` through
`.github/workflows/deploy-production.yml`, after `pnpm check` passes. Pull requests only run CI.
Pushing to `main` therefore publishes the resulting site. Only push there with publication authorization.
DNS changes are always a separate, explicit action.

The workflow uses a GitHub `production` environment with the secrets `CLOUDFLARE_API_TOKEN`,
`CLOUDFLARE_DEFAULT_ACCOUNT_ID`, `CONTACT_EMAIL` and the variable `SITE_DOMAIN`. Consider adding
required reviewers to that environment if you want an approval gate.

## Prerequisites

- A Cloudflare account and an API token scoped to Workers, R2 (SST state), and the zone's DNS.
- Environment variables (local `.env` or GitHub environment secrets): `CLOUDFLARE_API_TOKEN`,
  `CLOUDFLARE_DEFAULT_ACCOUNT_ID`, `CONTACT_EMAIL`, and `SITE_DOMAIN` (required, bare hostname for that stage).
- SST state is private and stays out of Git (`.sst/` is ignored).

## Staging

1. `pnpm check`
2. `pnpm exec sst deploy --stage staging` (or run the manual **Deploy staging** workflow).
   SST runs `pnpm build`, so the site and PDF come from the same revision. Staging requires its own `SITE_DOMAIN` and binds that domain; use a separate staging hostname.
3. Review the site and the PDF at the printed URL; unknown paths must return a real 404.

## Domain and production cutover

1. Confirm where the production domain is registered and which DNS is authoritative.
2. Inventory existing DNS records (mail, verification, subdomains, DNSSEC).
3. Add the zone to Cloudflare and recreate those records before changing nameservers.
4. After the staging review and explicit approval, set `SITE_DOMAIN` and run
   `pnpm exec sst deploy --stage production`.
5. Verify TLS, the `www` redirect, canonical URLs, the PDF download, 404s, and mail records.
6. Optionally point `erid.cr` at the site with a path-preserving HTTPS redirect.

## Rollback

Revert the bad commit on `main` (the push redeploys), or check out the last validated commit and run `pnpm exec sst deploy --stage production`. Production
resources are retained and protected against accidental removal.
