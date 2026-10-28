import assert from 'node:assert/strict'
import { test } from 'node:test'
import { educationSchema, experienceSchema, resumeSchema } from '../src/lib/content/schemas.ts'
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

