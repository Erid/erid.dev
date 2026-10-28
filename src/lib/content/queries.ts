import { getCollection, getEntry } from 'astro:content'
import type { Education, Experience, Profile, Project, Resume, Skill } from './schemas.ts'

export interface Entry<T> {
  id: string
  data: T
}

/** Page-facing content queries. */
export async function getProfile(): Promise<Profile> {
  const entry = await getEntry('profile', 'profile')
  if (!entry) throw new Error('Missing profile content: src/content/profile.yaml')
  return entry.data
}

export async function getSkills(): Promise<Skill[]> {
  const entry = await getEntry('skills', 'skills')
  if (!entry) throw new Error('Missing skills content: src/content/skills.yaml')
  return entry.data.skills
}

export async function getResumeContent(): Promise<Resume> {
  const entry = await getEntry('resume', 'resume')
  if (!entry) throw new Error('Missing résumé content: src/content/resume.yaml')
  return entry.data
}

/** Published roles, most recent first. */
export async function getExperience(): Promise<Entry<Experience>[]> {
  const entries = await getCollection('experience', ({ data }) => data.published)
  return entries.sort(compareExperience)
}

export async function getAllExperienceById(): Promise<Record<string, Experience>> {
  const entries = await getCollection('experience')
  return Object.fromEntries(entries.map((entry) => [entry.id, entry.data]))
}

export async function getEducationById(): Promise<Record<string, Education>> {
  const entries = await getCollection('education')
  return Object.fromEntries(entries.map((entry) => [entry.id, entry.data]))
}

export async function getProjects(): Promise<Entry<Project>[]> {
  const [entries, experienceById] = await Promise.all([
    getCollection('projects', ({ data }) => data.published),
    getAllExperienceById(),
  ])
  const effectiveDate = (project: Project): string => {
    if (project.date) return project.date
    const role = project.relatedExperience ? experienceById[project.relatedExperience] : undefined
    if (!role) return ''
    return role.end ?? '9999-99'
  }
  return entries.sort((a, b) => {
    const byDate = effectiveDate(b.data).localeCompare(effectiveDate(a.data))
    return byDate !== 0 ? byDate : a.data.title.localeCompare(b.data.title)
  })
}

/** Returns published posts, newest first. Drafts never reach routes, navigation, or the sitemap. */
export async function getPosts() {
  const published = await getCollection('posts', ({ data }) => !data.draft)
  return published.sort((a, b) => b.data.publishedOn.localeCompare(a.data.publishedOn))
}

function compareExperience(a: Entry<Experience>, b: Entry<Experience>): number {
  // Current roles (no end) sort first, then by start date, newest first.
  const byEnd = (b.data.end ?? '9999-99').localeCompare(a.data.end ?? '9999-99')
  return byEnd !== 0 ? byEnd : b.data.start.localeCompare(a.data.start)
}
