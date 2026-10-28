---
name: maintain-profile-content
description: Add or update a role, project, article, or résumé selection in erid.dev while keeping facts accurate, dates precise, and references valid. Use for any edit under src/content.
---

# Maintain profile content

Content is YAML (and Markdown for posts) under `src/content/`, edited either through the local
Keystatic editor (`pnpm dev`, then `/keystatic`) or directly. Schemas live in
`src/lib/content/schemas.ts`; the Keystatic forms in `keystatic.config.ts` must keep the same field
names (`pnpm test` checks this).

## Rules

- Do not invent dates, metrics, skills, credentials, employers, or ownership. If a fact is
  unknown, leave it out and note it in `docs/content-gaps.md`.
- Keep date precision: roles use `YYYY-MM`, education uses `YYYY`, posts use `YYYY-MM-DD`. A role
  with no `end` is current.
- The file name is the stable ID. Never rename a file without updating every reference (the
  résumé `roles`/`education` lists and a project's `relatedExperience`).
- Only link to public, approved destinations. Keep demo, repository, and case-study links separate.
- Do not publish placeholders. New projects start with `published: false`, posts with
  `draft: true`, and case studies with `caseStudy.published: false`.
- Do not put the contact email in content; it comes from `CONTACT_EMAIL`.

## Common tasks

- **Add a role:** create `src/content/experience/<id>.yaml`, then add `- experience: <id>` to
  `src/content/resume.yaml` in the intended position. Optional `bullets` there override the role's
  `contributions` for the résumé only.
- **Add a project:** create `src/content/projects/<slug>.yaml`; set `featured: true` to show it on
  the homepage and `published: true` when approved. Image paths are relative to `src/assets`
  and need alt text.
- **Add an article:** create `src/content/posts/<slug>.md` with frontmatter and Markdown body; clear
  `draft` when ready.
- **Update core skills:** edit `src/content/skills.yaml`; both the homepage and the résumé (web, PDF,
  and Word) read from this list.
- **Change the résumé:** edit `src/content/resume.yaml`; the website and PDF read the same model.

## Verify

1. `pnpm fix`
2. `pnpm content:check` (references, dates, drafts, images)
3. `pnpm check` before committing
4. When résumé content changes, build and open the generated PDF to check pagination.
