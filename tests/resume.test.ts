import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatDate, formatDay, formatRange } from '../src/lib/content/dates.ts'
import {
  educationSchema,
  experienceSchema,
  profileSchema,
  resumeSchema,
} from '../src/lib/content/schemas.ts'
import { renderResumeDocx } from '../src/lib/resume/docx.ts'
import { buildResume } from '../src/lib/resume/model.ts'

test('date labels keep the precision they were given', () => {
  assert.equal(formatDate('2023-12'), 'Dec 2023')
  assert.equal(formatDate('2011'), '2011')
  assert.equal(formatRange('2023-12'), 'Dec 2023 – Present')
  assert.equal(formatRange('2022-06', '2022-09'), 'Jun 2022 – Sep 2022')
  assert.equal(formatDay('2026-10-07'), 'Oct 7, 2026')
})

test('résumé uses its own bullets when present, otherwise the role contributions', () => {
  const role = (overrides: Record<string, unknown>) =>
    experienceSchema.parse({
      entry: 'x',
      employer: 'Acme',
      title: 'Engineer',
      start: '2020-01',
      contributions: ['From the role'],
      ...overrides,
    })
  const experience = {
    one: role({}),
    two: role({ title: 'Lead' }),
    draft: role({ published: false }),
  }
  const education = {
    school: educationSchema.parse({
      entry: 's',
      institution: 'School',
      qualification: 'Degree',
      subject: 'Software',
      start: '2008',
      end: '2011',
    }),
  }
  const resume = resumeSchema.parse({
    summary: 'Summary',
    roles: [
      { experience: 'one', bullets: ['Résumé wording'] },
      { experience: 'two' },
      { experience: 'draft' },
    ],
    education: ['school'],
  })

  const model = buildResume(resume, experience, education)
  assert.equal(model.website, 'https://erid.dev')
  assert.deepEqual(
    model.roles.map((r) => r.bullets),
    [['Résumé wording'], ['From the role']],
  )
  assert.equal(model.roles.length, 2, 'draft roles are excluded')
  assert.equal(model.education[0]?.range, '2008 – 2011')
})

test('renderResumeDocx generates a valid .docx archive from the résumé model', async () => {
  const profile = profileSchema.parse({
    name: 'Erid Baldioceda',
    headline: 'Senior Full Stack Engineer',
    location: 'Costa Rica',
    introduction: 'Intro',
    coreTechnologies: ['TypeScript'],
    links: [{ label: 'GitHub', url: 'https://github.com/Erid' }],
    languages: [{ name: 'English', proficiency: 'Full professional proficiency' }],
  })
  const model = buildResume(
    resumeSchema.parse({
      summary: 'Summary text',
      roles: [{ experience: 'one', bullets: ['Shipped software'] }],
      education: ['school'],
      skills: ['TypeScript', 'React'],
    }),
    {
      one: experienceSchema.parse({
        entry: 'Acme — Engineer',
        employer: 'Acme',
        title: 'Engineer',
        start: '2023-01',
        contributions: ['Contribution'],
      }),
    },
    {
      school: educationSchema.parse({
        entry: 'University — BSc',
        institution: 'University',
        qualification: 'BSc',
        start: '2010',
      }),
    },
  )

  const buffer = await renderResumeDocx({ profile, resume: model })
  // ZIP magic bytes: PK\x03\x04
  assert.equal(buffer[0], 0x50)
  assert.equal(buffer[1], 0x4b)
  assert.equal(buffer[2], 0x03)
  assert.equal(buffer[3], 0x04)
  assert.ok(buffer.includes(Buffer.from('word/document.xml')))
})
