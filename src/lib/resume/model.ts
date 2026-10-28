import { currentYearMonth, formatRange, formatRoleDuration } from '../content/dates.ts'
import type { Education, Experience, Resume, Skill } from '../content/schemas.ts'
import { buildSkillSummaries } from '../content/skills.ts'

export interface ResumeRole {
  id: string
  title: string
  employer: string
  location: string | undefined
  range: string
  duration: string
  bullets: string[]
  technologies: string[]
}

export interface ResumeEducation {
  id: string
  institution: string
  qualification: string
  range: string
}

export interface ResumeSkill {
  name: string
  duration: string | undefined
}

export interface ResumeModel {
  website: string
  summary: string
  roles: ResumeRole[]
  education: ResumeEducation[]
  skills: string[]
  skillDetails: ResumeSkill[]
}

/**
 * Builds the curated résumé from the same normalized records the website uses. Résumé-specific
 * bullets are an editorial view over a role, not a second employment history.
 */
export function buildResume(
  resume: Resume,
  experience: Record<string, Experience>,
  education: Record<string, Education>,
  skills: readonly Skill[],
  website: string,
  nowMonth: string = currentYearMonth(),
): ResumeModel {
  const publishedExperience = Object.entries(experience)
    .filter(([, entry]) => entry.published)
    .map(([id, data]) => ({ id, data }))
  const skillSummaries = buildSkillSummaries(skills, publishedExperience, [], nowMonth)

  return {
    website,
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
          duration: formatRoleDuration(entry.start, entry.end, nowMonth),
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
    skills: skills.map((skill) => skill.name),
    skillDetails: skillSummaries.map((summary) => ({
      name: summary.name,
      duration: summary.totalMonths > 0 ? summary.approximateDuration : undefined,
    })),
  }
}
