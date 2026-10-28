# erid.dev

Source for [erid.dev](https://erid.dev), the professional website and résumé of Erid Baldioceda.
It is an English-language static site built with Astro, designed so a recruiter can find the role,
core stack, employers and dates, proof of work, and a direct résumé download in seconds.

## How it works

- **Content is files.** Structured YAML and Markdown live in `src/content/`, validated by Zod
  schemas at build time. There is no database or hosted CMS.
- **A local-only editor.** [Keystatic](https://keystatic.com) edits those files while you run
  `pnpm dev`. It is never part of a production build or preview.
- **One content revision, two outputs.** The same normalized model renders the web résumé and, via
  Playwright/Chromium, the PDF (plus a Word copy) inside the build output.
- **Static hosting.** SST deploys the finished `dist/` to Cloudflare static assets.

See [docs/architecture.md](docs/architecture.md) for the details and trade-offs.

## Getting started

Requires Node 24+ and pnpm (pinned in `package.json`).

```sh
pnpm install
pnpm exec playwright install chromium   # needed for the PDF and browser checks
cp .env.example .env                    # optional: set CONTACT_EMAIL
pnpm dev                                # site at http://127.0.0.1:4321, editor at /keystatic
```

Saving in the editor writes files in `src/content/`; review the diff and commit manually.

## Commands

| Command             | Purpose                                                                  |
| ------------------- | ------------------------------------------------------------------------ |
| `pnpm dev`          | Site plus local Keystatic editor                                         |
| `pnpm fix`          | ESLint autofix, then Prettier                                            |
| `pnpm check`        | Lint, format, types, content, unit tests, build, artifact check, browser |
| `pnpm build`        | Static site plus résumé PDF/DOCX in `dist/`                              |
| `pnpm preview`      | Serve the production output (no editor)                                  |
| `pnpm verify:build` | Check routes, metadata, links, editor/draft exclusion in `dist/`         |
| `pnpm test:e2e`     | Browser checks against the production output                             |

## Documentation

- [Development](docs/development.md) — setup, TypeScript 7 compatibility, editor exclusion
- [Architecture](docs/architecture.md)
- [Content authoring](docs/content-authoring.md)
- [Deployment](docs/deployment.md)
- [Project plan](docs/project-plan.md)

## Licensing

Code is MIT ([LICENSE](LICENSE)). Personal content, the résumé, writing, and images are all rights
reserved ([CONTENT-LICENSE.md](CONTENT-LICENSE.md)).
