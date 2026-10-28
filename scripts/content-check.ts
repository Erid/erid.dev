import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import { parse } from 'yaml'
import type { z } from 'astro/zod'
import {
  educationSchema,
  experienceSchema,
  postSchema,
  profileSchema,
  projectSchema,
  resumeSchema,
} from '../src/lib/content/schemas.ts'
import { validateContent } from '../src/lib/content/validate.ts'

const root = join(import.meta.dirname, '..', 'src')
const contentDir = join(root, 'content')
const problems: string[] = []

const profile = readFile('profile.yaml', profileSchema)
const resume = readFile('resume.yaml', resumeSchema)
const experience = readDirectory('experience', '.yaml', experienceSchema)
const education = readDirectory('education', '.yaml', educationSchema)
const projects = readDirectory('projects', '.yaml', projectSchema)
const posts = readDirectory('posts', '.md', postSchema)

if (resume) {
  problems.push(
    ...validateContent({
      profile,
      experience,
      education,
      projects,
      posts,
      resume,
      imageExists: (src) => existsSync(join(root, 'assets', src)),
    }),
  )
}

if (problems.length > 0) {
  console.error(`Content check failed:\n${problems.map((p) => `  - ${p}`).join('\n')}`)
  process.exit(1)
}
console.log(
  `Content OK: ${Object.keys(experience).length} experience, ${Object.keys(education).length} education, ` +
    `${Object.keys(projects).length} projects, ${Object.keys(posts).length} posts.`,
)

function readFile<T extends z.ZodType>(path: string, schema: T): z.infer<T> | undefined {
  const text = readFileSync(join(contentDir, path), 'utf8')
  const result = schema.safeParse(extname(path) === '.md' ? parseFrontmatter(text) : parse(text))
  if (result.success) return result.data
  for (const issue of result.error.issues) {
    problems.push(`${path}: ${issue.path.join('.') || '(root)'} ${issue.message}`)
  }
  return undefined
}

function readDirectory<T extends z.ZodType>(
  dir: string,
  extension: string,
  schema: T,
): Record<string, z.infer<T>> {
  const entries: Record<string, z.infer<T>> = {}
  for (const file of readdirSync(join(contentDir, dir)).filter((f) => f.endsWith(extension))) {
    const data = readFile(join(dir, file), schema)
    if (data) entries[basename(file, extension)] = data
  }
  return entries
}

function parseFrontmatter(text: string): unknown {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)
  return match?.[1] ? parse(match[1]) : {}
}
