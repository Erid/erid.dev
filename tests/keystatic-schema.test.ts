import assert from 'node:assert/strict'
import { test } from 'node:test'
import keystatic from '../keystatic.config.ts'
import {
  educationSchema,
  experienceSchema,
  postSchema,
  profileSchema,
  projectSchema,
  resumeSchema,
} from '../src/lib/content/schemas.ts'

// Keystatic forms and Astro schemas are declared separately; keep their field names in sync.
// The post body is the Markdown content of the file, so it is not a frontmatter field.
const pairs = [
  ['profile', keystatic.singletons?.profile, profileSchema, []],
  ['resume', keystatic.singletons?.resume, resumeSchema, []],
  ['experience', keystatic.collections?.experience, experienceSchema, []],
  ['education', keystatic.collections?.education, educationSchema, []],
  ['projects', keystatic.collections?.projects, projectSchema, []],
  ['posts', keystatic.collections?.posts, postSchema, ['body']],
] as const

for (const [name, definition, zodSchema, contentFields] of pairs) {
  test(`${name}: Keystatic fields match the Astro schema`, () => {
    assert.ok(definition, `missing Keystatic definition for ${name}`)
    const formFields = Object.keys(definition.schema).filter(
      (key) => !(contentFields as readonly string[]).includes(key),
    )
    assert.deepEqual(formFields.sort(), Object.keys(zodSchema.shape).sort())
  })
}
