import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import {
  educationSchema,
  experienceSchema,
  profileSchema,
  resumeSchema,
} from './lib/content/schemas.ts'

// Keystatic writes singletons as bare YAML objects; the glob loader reads each as one entry.
const profile = defineCollection({
  loader: glob({ pattern: 'profile.yaml', base: './src/content' }),
  schema: profileSchema,
})

const resume = defineCollection({
  loader: glob({ pattern: 'resume.yaml', base: './src/content' }),
  schema: resumeSchema,
})

const experience = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/experience' }),
  schema: experienceSchema,
})

const education = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/education' }),
  schema: educationSchema,
})

export const collections = { profile, resume, experience, education }
