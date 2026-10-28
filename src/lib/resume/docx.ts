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
import { fullName, type Profile } from '../content/schemas.ts'
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
  const name = fullName(profile)
  const children: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: name,
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
    ...buildContactParagraphs(profile, resume.website, contactEmail),
    sectionHeading('Summary'),
    new Paragraph({
      spacing: { after: 160, line: 276 },
      children: [bodyRun(resume.summary)],
    }),
  ]

  if (resume.skillDetails.length > 0) {
    const skillLabels = resume.skillDetails.map((skill) =>
      skill.duration ? `${skill.name} (${skill.duration})` : skill.name,
    )
    children.push(
      sectionHeading('Core skills'),
      new Paragraph({
        spacing: { after: 140, line: 276 },
        children: [bodyRun(skillLabels.join(' · '))],
      }),
    )
  }

  children.push(sectionHeading('Experience'), ...resume.roles.flatMap(buildRoleParagraphs))

  if (resume.education.length > 0) {
    children.push(sectionHeading('Education'), ...resume.education.map(buildEducationParagraph))
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
    creator: name,
    title: `${name} — Résumé`,
    description: `Résumé of ${name}, ${profile.headline}`,
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

function buildContactParagraphs(
  profile: Profile,
  website: string,
  contactEmail: string | undefined,
): Paragraph[] {
  const directRow: ParagraphChild[] = [mutedRun(profile.location)]
  if (contactEmail) {
    directRow.push(mutedRun(' · '), linkRun(contactEmail, `mailto:${contactEmail}`))
  }

  const linkParts: ParagraphChild[][] = [
    [linkRun(website, website)],
    ...profile.links.map((link) => [linkRun(link.label, link.url)]),
  ]
  const linksRow: ParagraphChild[] = []
  for (const [index, part] of linkParts.entries()) {
    if (index > 0) linksRow.push(mutedRun(' · '))
    linksRow.push(...part)
  }

  return [
    new Paragraph({
      spacing: { after: 30 },
      children: directRow,
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: linksRow,
    }),
  ]
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
  const meta = [role.range, role.duration, role.location].filter(Boolean).join(' · ')
  return [
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      keepNext: true,
      spacing: { before: 120, after: 20 },
      children: [
        new TextRun({
          text: role.title,
          bold: true,
          font: FONT,
          size: 22,
          color: COLOR_INK,
        }),
        new TextRun({
          text: `  ·  ${role.employer}`,
          bold: false,
          font: FONT,
          size: 20,
          color: COLOR_MUTED,
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
