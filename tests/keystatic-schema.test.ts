import assert from 'node:assert/strict'
import { test } from 'node:test'
import keystatic from '../keystatic.config.ts'
import {
  educationSchema,
  experienceSchema,
  profileSchema,
  resumeSchema,
} from '../src/lib/content/schemas.ts'

// Keystatic forms and Astro schemas are declared separately; keep their field names in sync.
const pairs = [
  ['profile', keystatic.singletons?.profile, profileSchema],
  ['resume', keystatic.singletons?.resume, resumeSchema],
  ['experience', keystatic.collections?.experience, experienceSchema],
  ['education', keystatic.collections?.education, educationSchema],
] as const

for (const [name, definition, zodSchema] of pairs) {
  test(`${name}: Keystatic fields match the Astro schema`, () => {
    assert.ok(definition, `missing Keystatic definition for ${name}`)
    assert.deepEqual(Object.keys(definition.schema).sort(), Object.keys(zodSchema.shape).sort())
  })
}

