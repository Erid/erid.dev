# Content authoring

Content lives in `src/content/` (YAML, plus Markdown for posts). Edit it with the local editor
(`pnpm dev`, then open `/keystatic`) or directly in files.

1. Make the change. Never invent dates, metrics, skills, credentials, or ownership; keep dates at
   the precision you actually know.
2. Run `pnpm content:check` for references, slugs, dates, links, and images.
3. Run `pnpm check` and, if résumé content changed, open `dist/resume/erid-baldioceda.pdf` and
   inspect its pages.
4. Review the diff, commit, and push manually.

Posts, projects, and case studies publish only when their `published` flag is true (posts: `draft`
false). The project-specific rules are in
[`.agents/skills/maintain-profile-content/SKILL.md`](../.agents/skills/maintain-profile-content/SKILL.md);
open gaps are tracked in [content-gaps.md](content-gaps.md).
