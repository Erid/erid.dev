# Development

- Requires Node 24+ and pnpm (version pinned in `package.json`). Run `pnpm install`.
- `pnpm dev` serves the site and the local-only Keystatic editor at <http://127.0.0.1:4321/keystatic>.
- `pnpm check` runs lint, format check, typecheck and a production build. `pnpm fix` applies autofixes.

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

