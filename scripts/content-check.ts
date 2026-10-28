import { readdirSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { parse } from 'yaml'
import type { z } from 'astro/zod'
import {
  educationSchema,
  experienceSchema,
  profileSchema,
  resumeSchema,
} from '../src/lib/content/schemas.ts'
import { validateContent } from '../src/lib/content/validate.ts'

const contentDir = join(import.meta.dirname, '..', 'src', 'content')
const problems: string[] = []

readFile('profile.yaml', profileSchema)
const resume = readFile('resume.yaml', resumeSchema)
const experience = readDirectory('experience', experienceSchema)
const education = readDirectory('education', educationSchema)

if (resume) {
  problems.push(...validateContent({ experience, education, resume }))
}

if (problems.length > 0) {
  console.error(`Content check failed:\n${problems.map((p) => `  - ${p}`).join('\n')}`)
  process.exit(1)
}
console.log(
  `Content OK: ${Object.keys(experience).length} experience, ${Object.keys(education).length} education.`,
)

function readFile<T extends z.ZodType>(path: string, schema: T): z.infer<T> | undefined {
  const result = schema.safeParse(parse(readFileSync(join(contentDir, path), 'utf8')))
  if (result.success) return result.data
  for (const issue of result.error.issues) {
    problems.push(`${path}: ${issue.path.join('.') || '(root)'} ${issue.message}`)
  }
  return undefined
}

function readDirectory<T extends z.ZodType>(dir: string, schema: T): Record<string, z.infer<T>> {
  const entries: Record<string, z.infer<T>> = {}
  for (const file of readdirSync(join(contentDir, dir)).filter((f) => f.endsWith('.yaml'))) {
    const data = readFile(join(dir, file), schema)
    if (data) entries[basename(file, '.yaml')] = data
  }
  return entries
}
