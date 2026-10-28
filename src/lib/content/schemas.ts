import { z } from 'astro/zod'

// Single source of truth for content shape. Used by Astro collections and by
// scripts/content-check.ts. Keystatic's forms are declared separately in
// keystatic.config.ts; tests/keystatic-schema.test.ts keeps the field names aligned.

/** Keystatic saves untouched optional text fields as ''; treat that as "not provided". */
const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value)

function optional<T extends z.ZodType>(schema: T) {
  return z.preprocess(emptyToUndefined, schema.optional())
}

const monthDate = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use YYYY-MM')
const yearDate = z.string().regex(/^\d{4}$/, 'Use YYYY')
const isoDay = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, 'Use YYYY-MM-DD')
const url = z.url({ protocol: /^https?$/ })
const textList = z.array(z.string().min(1)).default([])
const labeledLinks = z.array(z.object({ label: z.string().min(1), url })).default([])

const imageRef = z.object({
  // Path relative to src/assets, for example images/example.jpg.
  src: z.string().min(1),
  alt: z.string().min(1),
})

// A case study is published only when `published` is set; empty sections are not shown.
const caseStudySchema = z
  .object({
    published: z.boolean().default(false),
    challenge: optional(z.string()),
    contribution: optional(z.string()),
    decisions: optional(z.string()),
    outcomes: optional(z.string()),
  })
  .default({ published: false })

export const profileSchema = z.object({
  name: z.string().min(1),
  headline: z.string().min(1),
  location: z.string().min(1),
  introduction: z.string().min(1),
  biography: optional(z.string()),
  hobbies: z
    .array(
      z.object({
        name: z.string().min(1),
        description: optional(z.string()),
      }),
    )
    .default([]),
  links: labeledLinks,
  languages: z
    .array(z.object({ name: z.string().min(1), proficiency: z.string().min(1) }))
    .default([]),
  // Path relative to src/assets.
  portrait: optional(z.string()),
  portraitAlt: optional(z.string()),
})

export const skillSchema = z.object({
  name: z.string().min(1),
  description: optional(z.string()),
})

export const skillsSchema = z.object({
  skills: z.array(skillSchema).min(1),
})

export const experienceSchema = z.object({
  entry: z.string().min(1),
  employer: z.string().min(1),
  title: z.string().min(1),
  // Month precision only; a missing `end` means the role is current.
  start: monthDate,
  end: optional(monthDate),
  location: optional(z.string()),
  employmentType: optional(z.enum(['Full-time', 'Contract'])),
  contributions: z.array(z.string().min(1)).min(1),
  technologies: textList,
  links: labeledLinks,
  caseStudy: caseStudySchema,
  published: z.boolean().default(true),
})

export const educationSchema = z.object({
  entry: z.string().min(1),
  institution: z.string().min(1),
  qualification: z.string().min(1),
  subject: optional(z.string()),
  // Year precision, exactly as supplied.
  start: yearDate,
  end: optional(yearDate),
  details: optional(z.string()),
})

export const projectSchema = z.object({
  entry: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  role: optional(z.string()),
  date: optional(monthDate),
  technologies: textList,
  outcomes: textList,
  // Link types stay separate so labels can never blur a demo, source, and case study.
  demoUrl: optional(url),
  repositoryUrl: optional(url),
  images: z.array(imageRef).default([]),
  // Experience entry ID this project belongs to, when it was professional work.
  relatedExperience: optional(z.string()),
  caseStudy: caseStudySchema,
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
})

/** Frontmatter of a post; the body is the Markdoc content of the same file. */
export const postSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  publishedOn: isoDay,
  updatedOn: optional(isoDay),
  // Keystatic saves an untouched cover as { src: '', alt: '' }; that means "no cover".
  cover: z.preprocess(
    (value) =>
      typeof value === 'object' && value && 'src' in value && value.src === '' ? undefined : value,
    imageRef.optional(),
  ),
  draft: z.boolean().default(true),
})

export const resumeSchema = z.object({
  summary: z.string().min(1),
  // Order here is the order shown on the résumé.
  roles: z
    .array(
      z.object({
        experience: z.string().min(1),
        // Résumé-specific wording; when empty the role's own contributions are used.
        bullets: z.array(z.string().min(1)).default([]),
      }),
    )
    .min(1),
  education: z.array(z.string().min(1)).default([]),
})

export type Profile = z.infer<typeof profileSchema>
export type Skill = z.infer<typeof skillSchema>
export type Skills = z.infer<typeof skillsSchema>
export type Experience = z.infer<typeof experienceSchema>
export type Education = z.infer<typeof educationSchema>
export type Project = z.infer<typeof projectSchema>
export type Post = z.infer<typeof postSchema>
export type Resume = z.infer<typeof resumeSchema>
export type CaseStudy = z.infer<typeof caseStudySchema>
