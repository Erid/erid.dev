import {
  BorderStyle,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  Packer,
  Paragraph,
  type ParagraphChild,
  TextRun,
} from 'docx'
import type { Profile } from '../content/schemas.ts'
import type { ResumeEducation, ResumeModel, ResumeRole } from './model.ts'

export interface ResumeDocxInput {
  profile: Profile
  resume: ResumeModel
  /** Plain-text contact email from CONTACT_EMAIL when configured at build time. */
  contactEmail?: string | undefined
}

const FONT = 'Calibri'
const COLOR_INK = '1F2430'
const COLOR_MUTED = '565D6B'
const COLOR_ACCENT = '1D5C99'
const COLOR_LINE = 'E4DDD0'

/**
 * Generates a single-column Word (.docx) résumé from the same normalized model as the web page and
 * PDF, giving recruiters and ATS tools a native text document alongside the PDF.
 */
export async function renderResumeDocx({
  profile,
  resume,
  contactEmail,
}: ResumeDocxInput): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: profile.name,
          bold: true,
          font: FONT,
          size: 40,
          color: COLOR_INK,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: profile.headline,
          bold: true,
          font: FONT,
          size: 23,
          color: COLOR_MUTED,
        }),
      ],
    }),
    buildContactParagraph(profile, resume.website, contactEmail),
    sectionHeading('Summary'),
    new Paragraph({
      spacing: { after: 160, line: 276 },
      children: [bodyRun(resume.summary)],
    }),
    sectionHeading('Experience'),
    ...resume.roles.flatMap(buildRoleParagraphs),
  ]

  if (resume.education.length > 0) {
    children.push(sectionHeading('Education'), ...resume.education.map(buildEducationParagraph))
  }

  if (resume.skills.length > 0) {
    children.push(
      sectionHeading('Core skills'),
      new Paragraph({
        spacing: { after: 140, line: 276 },
        children: [bodyRun(resume.skills.join(' · '))],
      }),
    )
  }

  if (profile.languages.length > 0) {
    children.push(
      sectionHeading('Languages'),
      ...profile.languages.map(
        (language) =>
          new Paragraph({
            spacing: { after: 60 },
            children: [
              bodyRun(language.name, { bold: true }),
              mutedRun(` · ${language.proficiency}`),
            ],
          }),
      ),
    )
  }

  const doc = new Document({
    creator: profile.name,
    title: `${profile.name} — Résumé`,
    description: `Résumé of ${profile.name}, ${profile.headline}`,
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 864, right: 864, bottom: 864, left: 864 },
          },
        },
        children,
      },
    ],
  })

  return Buffer.from(await Packer.toBuffer(doc))
}

function buildContactParagraph(
  profile: Profile,
  website: string,
  contactEmail: string | undefined,
): Paragraph {
  const parts: ParagraphChild[][] = [
    [mutedRun(profile.location)],
    [linkRun(website, website)],
    ...profile.links.map((link) => [linkRun(link.label, link.url)]),
  ]
  if (contactEmail) {
    parts.push([linkRun(contactEmail, `mailto:${contactEmail}`)])
  }

  const children: ParagraphChild[] = []
  for (const [index, part] of parts.entries()) {
    if (index > 0) children.push(mutedRun(' · '))
    children.push(...part)
  }

  return new Paragraph({
    spacing: { after: 200 },
    children,
  })
}

function sectionHeading(title: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    keepNext: true,
    spacing: { before: 220, after: 100 },
    border: {
      bottom: { color: COLOR_LINE, space: 4, style: BorderStyle.SINGLE, size: 8 },
    },
    children: [
      new TextRun({
        text: title,
        bold: true,
        font: FONT,
        size: 24,
        color: COLOR_INK,
      }),
    ],
  })
}

function buildRoleParagraphs(role: ResumeRole): Paragraph[] {
  const meta = role.location ? `${role.range} · ${role.location}` : role.range
  return [
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      keepNext: true,
      spacing: { before: 120, after: 20 },
      children: [
        new TextRun({
          text: `${role.title}, ${role.employer}`,
          bold: true,
          font: FONT,
          size: 21,
          color: COLOR_INK,
        }),
      ],
    }),
    new Paragraph({
      keepNext: true,
      spacing: { after: 60 },
      children: [mutedRun(meta)],
    }),
    ...role.bullets.map(
      (bullet, index) =>
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: index === role.bullets.length - 1 ? 120 : 40, line: 264 },
          children: [bodyRun(bullet)],
        }),
    ),
  ]
}

function buildEducationParagraph(entry: ResumeEducation): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      bodyRun(entry.institution, { bold: true }),
      bodyRun(`, ${entry.qualification}`),
      mutedRun(` · ${entry.range}`),
    ],
  })
}

function bodyRun(text: string, options: { bold?: boolean } = {}): TextRun {
  return new TextRun({
    text,
    bold: options.bold ?? false,
    font: FONT,
    size: 20,
    color: COLOR_INK,
  })
}

function mutedRun(text: string): TextRun {
  return new TextRun({
    text,
    font: FONT,
    size: 19,
    color: COLOR_MUTED,
  })
}

function linkRun(label: string, url: string): ExternalHyperlink {
  return new ExternalHyperlink({
    link: url,
    children: [
      new TextRun({
        text: label,
        font: FONT,
        size: 19,
        color: COLOR_ACCENT,
        underline: {},
      }),
    ],
  })
}

