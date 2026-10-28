# Working in erid.dev

Read this file before changing the repository. Use docs/project-plan.md for
approved scope and docs/development.md for setup and command details.

## Architecture and scope

- This is an English-language static professional website built with Astro.
- Prioritize a recruiter's scan: role, core stack, employers/dates, proof of work,
  and a direct résumé download. Keep longer stories optional.
- Content lives in repository files under src/content. Keystatic edits those files
  locally only.
- Production builds must exclude the editor and its API routes.
- Use pnpm. Keep one package unless a concrete requirement justifies a split.
- Use TypeScript 7 for compiler checks; retain documented compatibility tooling
  while Astro/ESLint require its API. Do not silently downgrade or suppress checks.
- Prefer Astro and semantic HTML for public content. Add client JavaScript only
  for a specific interaction that needs it.
- Icons come from Lucide (`@lucide/astro/icons/...`). Do not use emojis in code,
  content, or UI.

## Readable code

- Put the main exported function/component first after imports.
- Put private helpers below it, in the order they are first used.
- Keep types close to their consumers; put genuinely shared types with their domain.
- Respect Astro's frontmatter/template/style structure.
- Comments explain why, constraints, or trade-offs; avoid narrating obvious code.
- Aim for source files around 300 lines or fewer. Split by responsibility, not
  line count alone. Do not split cohesive code into tangled micro-modules.
- Keep substantive stateful components in their own files.
- Put content transformation and résumé composition in src/lib; keep
  filesystem/build orchestration in scripts.

## Mechanical fixes belong to tools

- Run pnpm fix before manually addressing lint/format diagnostics.
- pnpm lint --fix and pnpm lint:fix apply ESLint autofixes.
- pnpm format applies Prettier. Do not hand-edit autofixable formatting or imports.
- Inspect the diff after fixes. Preserve unrelated work and side-effect imports.
- Fix remaining semantic problems; do not disable rules, add blanket ignores,
  or weaken types merely to make checks pass.
- Re-run relevant checks after meaningful changes. Run pnpm check before handoff
  or committing code. Report failures and unrun checks accurately.

## Content and résumé

- Never invent employment dates, metrics, skills, credentials, or project ownership.
- Preserve date precision and distinguish unknown data from intentionally omitted data.
- Keep website and PDF derived from the same content revision.
- Read .agents/skills/maintain-profile-content/SKILL.md for editorial changes.
- Personal writing, résumé data, and images are outside the code's MIT license.
- The contact email is never committed or written into page HTML in plain text.
  It comes from the CONTACT_EMAIL environment variable (see .env.example).
- The profile/ folder holds private source material and is gitignored. Never copy
  it into public content wholesale.

## Validation and delivery

- Test meaningful behavior, not implementation details or static text snapshots.
- Validate production output when changing routing, drafts, editor exclusion, or PDF generation.
- Inspect the rendered PDF when changing its template or selected content.
- Keep secrets, infrastructure state, dependencies, and generated artifacts out of Git.
- Do not publish, push, deploy, or change DNS without authorization for that action.
- Summarize the result and validation concisely; cite concrete blockers.
