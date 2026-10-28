# Development

- Requires Node 24+ and pnpm (version pinned in `package.json`). Run `pnpm install`.
- `pnpm dev` serves the site and the local-only Keystatic editor at <http://127.0.0.1:4321/keystatic>.
- `pnpm fix` applies autofixes. See the complete `pnpm check` sequence below.

## TypeScript 7 and the TypeScript 6 compatibility package

`typescript` is aliased to `@typescript/typescript6` because ESLint (typescript-eslint) and Astro's
language tooling still need the TypeScript 6 JavaScript API. The native TypeScript 7 compiler is
installed as `@typescript/native` and run directly by `pnpm typecheck` (its `tsc` bin collides with
the alias, so the script calls it by path). `astro check` additionally checks `.astro` files and
uses the TypeScript 6 API, so not every tool runs on TypeScript 7. Remove the alias once those
tools support TypeScript 7.

## Editor exclusion

`astro.config.ts` adds Keystatic only when the process is `astro dev`. Builds and previews omit the
integration; `dist/` contains no editor routes.


## Checks

`pnpm check` runs, in order: lint, format check, typecheck, content check, unit tests, build,
`verify:build`, and browser tests (`test:e2e`, which needs `pnpm exec playwright install chromium`).
`pnpm typecheck` runs `sst install` first, which downloads SST's provider types but provisions
nothing and needs no credentials; `sst.config.ts` has its own `tsconfig.sst.json` because SST's
generated types do not satisfy the strict site configuration.

CI (`.github/workflows/ci.yml`) runs `pnpm check` without secrets. See [deployment.md](deployment.md).
