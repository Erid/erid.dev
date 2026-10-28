import type { Education, Experience, Resume } from './schemas.ts'

export interface ContentSet {
  experience: Record<string, Experience>
  education: Record<string, Education>
  resume: Resume
}

/** Checks relationships and constraints that per-file schemas cannot express. */
export function validateContent({ experience, education, resume }: ContentSet): string[] {
  const problems: string[] = []

  for (const [id, entry] of Object.entries(experience)) {
    if (entry.end && entry.end < entry.start) {
      problems.push(`experience/${id}: end ${entry.end} is before start ${entry.start}`)
    }
  }
  for (const [id, entry] of Object.entries(education)) {
    if (entry.end && entry.end < entry.start) {
      problems.push(`education/${id}: end ${entry.end} is before start ${entry.start}`)
    }
  }

  const seenRoles = new Set<string>()
  for (const role of resume.roles) {
    const entry = experience[role.experience]
    if (!entry) {
      problems.push(`resume: unknown experience "${role.experience}"`)
    } else if (!entry.published) {
      problems.push(`resume: experience "${role.experience}" is an unpublished draft`)
    }
    if (seenRoles.has(role.experience)) {
      problems.push(`resume: experience "${role.experience}" is listed twice`)
    }
    seenRoles.add(role.experience)
  }
  for (const id of resume.education) {
    if (!education[id]) problems.push(`resume: unknown education "${id}"`)
  }

  return problems
}
