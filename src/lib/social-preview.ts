import { fullName, type Profile, type Skill } from './content/schemas.ts'
import type { ResumeModel } from './resume/model.ts'
import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from './site.ts'

export interface SocialCardOptions {
  profile: Profile
  resume: ResumeModel
  portraitDataUri?: string | undefined
}

const CARD_SKILL_COUNT = 6

/**
 * Builds a short, mobile-friendly meta and Open Graph description (~100 characters) that fits
 * cleanly inside a phone link preview without truncating or repeating the title.
 */
export function buildHomeDescription(_profile: Profile, skills: readonly Skill[]): string {
  const coreSkills = skills
    .slice(0, CARD_SKILL_COUNT)
    .map((skill) => skill.name)
    .join(', ')
  return `15+ years building web and mobile products. ${coreSkills}.`
}

/**
 * Builds concise accessible alt text for the Open Graph preview card.
 */
export function buildSocialImageAlt(profile: Profile, skills: readonly Skill[]): string {
  const name = fullName(profile)
  const coreSkills = skills
    .slice(0, CARD_SKILL_COUNT)
    .map((skill) => skill.name)
    .join(', ')
  return `${name} — ${profile.headline} (${coreSkills})`
}

/**
 * Renders a bold, minimal 1200×630 HTML document designed to stay legible at mobile chat-bubble
 * sizes (WhatsApp, iMessage, Slack, LinkedIn).
 */
export function renderSocialCardHtml({
  profile,
  resume,
  portraitDataUri,
}: SocialCardOptions): string {
  const name = fullName(profile)
  const skills = resume.skills.slice(0, CARD_SKILL_COUNT)

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(name)} — Social Preview</title>
    <style>
      *, *::before, *::after {
        box-sizing: border-box;
      }
      html, body {
        margin: 0;
        padding: 0;
        width: ${OG_IMAGE_WIDTH}px;
        height: ${OG_IMAGE_HEIGHT}px;
        overflow: hidden;
        background:
          radial-gradient(circle at 88% 14%, rgb(29 92 153 / 12%), transparent 50%),
          radial-gradient(circle at 12% 88%, rgb(29 92 153 / 7%), transparent 46%),
          #faf7f2;
        color: #1f2430;
        font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      .canvas {
        width: 100%;
        height: 100%;
        padding: 36px 44px;
        display: flex;
      }
      .sheet {
        width: 100%;
        height: 100%;
        background: #ffffff;
        border: 1px solid #e4ddd0;
        border-top: 10px solid #1d5c99;
        border-radius: 24px;
        box-shadow:
          0 2px 4px rgb(31 36 48 / 5%),
          0 20px 44px -14px rgb(31 36 48 / 12%);
        padding: 48px 64px 52px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .top {
        flex: 1;
        display: flex;
        align-items: center;
      }
      .identity {
        display: flex;
        align-items: center;
        gap: 48px;
      }
      .portrait {
        width: 204px;
        height: 204px;
        border-radius: 50%;
        object-fit: cover;
        border: 4px solid #ffffff;
        outline: 2px solid #d5e3f0;
        box-shadow: 0 12px 30px -6px rgb(21 70 117 / 24%);
        flex-shrink: 0;
      }
      .identity-text {
        min-width: 0;
      }
      h1 {
        margin: 0 0 14px;
        font-size: 72px;
        font-weight: 800;
        letter-spacing: -0.03em;
        line-height: 1.02;
        color: #1f2430;
      }
      .headline {
        margin: 0 0 16px;
        color: #1d5c99;
        font-size: 35px;
        font-weight: 700;
        letter-spacing: -0.015em;
        line-height: 1.2;
      }
      .tagline {
        margin: 0;
        color: #565d6b;
        font-size: 25px;
        font-weight: 600;
      }
      .bottom {
        display: flex;
        align-items: center;
        padding-top: 38px;
        border-top: 2px solid #f0ebe1;
      }
      .skills {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        gap: 14px;
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .skill-chip {
        flex: 1 1 auto;
        text-align: center;
        padding: 14px 20px;
        border-radius: 999px;
        background: #e6eff8;
        border: 1px solid #cfe1f3;
        color: #154675;
        font-size: 23px;
        font-weight: 700;
        letter-spacing: -0.01em;
        white-space: nowrap;
      }
    </style>
  </head>
  <body>
    <div class="canvas">
      <div class="sheet">
        <div class="top">
          <div class="identity">
            ${
              portraitDataUri
                ? `<img class="portrait" src="${portraitDataUri}" alt="${escapeHtml(profile.portraitAlt ?? name)}" />`
                : ''
            }
            <div class="identity-text">
              <h1>${escapeHtml(name)}</h1>
              <p class="headline">${escapeHtml(profile.headline)}</p>
              <p class="tagline">15+ years · Architect, Team Lead &amp; CTO</p>
            </div>
          </div>
        </div>

        <div class="bottom">
          <ul class="skills" aria-label="Core stack">
            ${skills.map((skill) => `<li class="skill-chip">${escapeHtml(skill)}</li>`).join('\n            ')}
          </ul>
        </div>
      </div>
    </div>
  </body>
</html>`
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
