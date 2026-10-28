import { formatRange } from '../content/dates.ts'
import type { Education, Experience, Resume } from '../content/schemas.ts'

export interface ResumeRole {
  id: string
  title: string
  employer: string
  location: string | undefined
  range: string
  bullets: string[]
  technologies: string[]
}

export interface ResumeEducation {
  id: string
  institution: string
  qualification: string
  range: string
}

export interface ResumeModel {
  summary: string
  roles: ResumeRole[]
  education: ResumeEducation[]
  skills: string[]
}

/**
 * Builds the curated résumé from the same normalized records the website uses. Résumé-specific
 * bullets are an editorial view over a role, not a second employment history.
 */
export function buildResume(
  resume: Resume,
  experience: Record<string, Experience>,
  education: Record<string, Education>,
): ResumeModel {
  return {
    summary: resume.summary,
    roles: resume.roles.flatMap((role) => {
      const entry = experience[role.experience]
      if (!entry?.published) return []
      return [
        {
          id: role.experience,
          title: entry.title,
          employer: entry.employer,
          location: entry.location,
          range: formatRange(entry.start, entry.end),
          bullets: role.bullets.length > 0 ? role.bullets : entry.contributions,
          technologies: entry.technologies,
        },
      ]
    }),
    education: resume.education.flatMap((id) => {
      const entry = education[id]
      if (!entry) return []
      const subject = entry.subject ? `, ${entry.subject}` : ''
      return [
        {
          id,
          institution: entry.institution,
          qualification: `${entry.qualification}${subject}`,
          range: entry.end ? `${entry.start} – ${entry.end}` : entry.start,
        },
      ]
    }),
    skills: resume.skills,
  }
}
