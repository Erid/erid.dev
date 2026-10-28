import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

// Keystatic writes the singleton as a bare YAML object; the glob loader reads it as one entry.
const profile = defineCollection({
  loader: glob({ pattern: 'profile.yaml', base: './src/content' }),
  schema: z.object({ name: z.string(), headline: z.string() }),
})

export const collections = { profile }

