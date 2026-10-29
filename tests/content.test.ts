import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  compareProjects,
  educationSchema,
  experienceSchema,
  fullName,
  profileSchema,
  projectSchema,
  resumeSchema,
} from '../src/lib/content/schemas.ts'
import { buildSkillSummaries, formatDuration } from '../src/lib/content/skills.ts'
import type { ContentSet } from '../src/lib/content/validate.ts'
import { validateContent } from '../src/lib/content/validate.ts'

function baseExperience(overrides: Record<string, unknown> = {}) {
  return experienceSchema.parse({
    entry: 'Role',
    employer: 'Acme',
    title: 'Engineer',
    start: '2020-01',
    contributions: ['Did things.'],
    ...overrides,
  })
}

function baseSet(overrides: Partial<ContentSet> = {}): ContentSet {
  return {
    experience: { acme: baseExperience() },
    education: {
      school: educationSchema.parse({
        entry: 'School',
        institution: 'School',
        qualification: 'Degree',
        start: '2008',
      }),
    },
    resume: resumeSchema.parse({ summary: 'Summary', roles: [{ experience: 'acme' }] }),
    ...overrides,
  }
}

test('a consistent content set has no problems', () => {
  assert.deepEqual(validateContent(baseSet()), [])
})

test('resume references to unknown experience or education are reported', () => {
  const resume = resumeSchema.parse({
    summary: 'Summary',
    roles: [{ experience: 'missing' }],
    education: ['nowhere'],
  })
  const problems = validateContent(baseSet({ resume }))
  assert.equal(problems.length, 2)
})

test('duplicate résumé roles and draft roles are reported', () => {
  const resume = resumeSchema.parse({
    summary: 'Summary',
    roles: [{ experience: 'acme' }, { experience: 'acme' }],
  })
  const draft = { acme: baseExperience({ published: false }) }
  assert.equal(validateContent(baseSet({ resume })).length, 1)
  assert.equal(validateContent(baseSet({ experience: draft })).length, 1)
})

test('end dates before start dates are reported', () => {
  const experience = { acme: baseExperience({ end: '2019-12' }) }
  assert.equal(validateContent(baseSet({ experience })).length, 1)
})

test('date precision is enforced and empty optional fields count as absent', () => {
  assert.throws(() => baseExperience({ start: '2020' }))
  assert.throws(() => baseExperience({ start: '2020-13' }))
  const entry = baseExperience({ end: '', employmentType: '', location: '' })
  assert.equal(entry.end, undefined)
  assert.equal(entry.employmentType, undefined)
})

test('profile firstName and lastName format as fullName', () => {
  const profile = profileSchema.parse({
    firstName: 'Érid',
    lastName: 'Baldioceda',
    headline: 'Senior Full Stack Engineer',
    location: 'Costa Rica',
    introduction: 'Intro',
  })
  assert.equal(fullName(profile), 'Érid Baldioceda')
})

test('profile schedulingUrl accepts https URLs and normalizes empty values', () => {
  const base = {
    firstName: 'Érid',
    lastName: 'Baldioceda',
    headline: 'Senior Full Stack Engineer',
    location: 'Costa Rica',
    introduction: 'Intro',
  }
  const parsedValid = profileSchema.parse({
    ...base,
    schedulingUrl: 'https://meet.erid.dev',
  })
  assert.equal(parsedValid.schedulingUrl, 'https://meet.erid.dev')

  const parsedEmpty = profileSchema.parse({ ...base, schedulingUrl: '' })
  assert.equal(parsedEmpty.schedulingUrl, undefined)

  const parsedNull = profileSchema.parse({ ...base, schedulingUrl: null })
  assert.equal(parsedNull.schedulingUrl, undefined)

  assert.throws(() => profileSchema.parse({ ...base, schedulingUrl: 'javascript:alert(1)' }))
})

test('projects sort by explicit order first, then by date and title', () => {
  const makeProject = (id: string, overrides: Record<string, unknown>) => ({
    id,
    data: projectSchema.parse({
      entry: id,
      title: id,
      summary: 'Summary',
      published: true,
      ...overrides,
    }),
  })
  const items = [
    makeProject('unranked-newer', { date: '2026-10', order: null }),
    makeProject('second', { date: '2020-01', order: 2 }),
    makeProject('first', { date: '2018-05', order: 1 }),
    makeProject('unranked-older', { date: '2023-01' }),
  ]
  const sorted = [...items].sort((a, b) => compareProjects(a, b, {}))
  assert.deepEqual(
    sorted.map((item) => item.id),
    ['first', 'second', 'unranked-newer', 'unranked-older'],
  )
})

test('buildSkillSummaries merges overlapping and shared boundary months across roles', () => {
  const roles = [
    {
      id: 'catch-health',
      data: baseExperience({
        employer: '(catch) health',
        title: 'Sr. Full Stack Engineer',
        start: '2022-09',
        end: '2023-12',
        technologies: ['React', 'TypeScript'],
      }),
    },
    {
      id: 'clevertech',
      data: baseExperience({
        employer: 'Clevertech',
        title: 'Sr. Full Stack Developer',
        start: '2022-06',
        end: '2022-09',
        technologies: ['React'],
      }),
    },
  ]

  const summaries = buildSkillSummaries(
    [{ name: 'React', description: 'UI library' }, { name: 'TypeScript' }],
    roles,
    [],
    '2026-10',
  )

  const react = summaries.find((s) => s.name === 'React')
  const ts = summaries.find((s) => s.name === 'TypeScript')
  assert.ok(react)
  assert.ok(ts)
  // Jun 2022 through Dec 2023 inclusive = 19 months (Sep 2022 shared boundary is counted once).
  assert.equal(react.totalMonths, 19)
  assert.equal(react.totalDuration, '1 yr 7 mos')
  assert.equal(react.roles.length, 2)
  assert.equal(ts.totalMonths, 16)
  assert.equal(formatDuration(12), '1 yr')
})
