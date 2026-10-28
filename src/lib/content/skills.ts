import {
  currentYearMonth,
  formatApproximateDuration,
  formatDuration,
  formatRange,
  roleDurationMonths,
  toMonthInterval,
} from './dates.ts'
import type { Entry, Experience, Project, Skill } from './schemas.ts'

export { formatApproximateDuration, formatDuration }

export interface SkillRoleSummary {
  id: string
  title: string
  employer: string
  start: string
  end: string | undefined
  range: string
  duration: string
  months: number
  caseStudyHref: string | undefined
}

export interface SkillSummary {
  slug: string
  name: string
  description: string | undefined
  totalMonths: number
  totalDuration: string
  approximateDuration: string
  roles: SkillRoleSummary[]
}

/**
 * Pairs each core skill with the published roles that used it and calculates total experience
 * across merged calendar-month intervals so overlapping or shared transition months are never
 * double-counted.
 */
export function buildSkillSummaries(
  skills: readonly Skill[],
  experience: readonly Entry<Experience>[],
  projects: readonly Entry<Project>[] = [],
  nowMonth: string = currentYearMonth(),
): SkillSummary[] {
  return skills.map((skill) => {
    const key = normalizeTech(skill.name)
    const matching = experience.filter(({ data }) =>
      data.technologies.some((tech) => normalizeTech(tech) === key),
    )

    const intervals = matching.map(({ data }) => toMonthInterval(data.start, data.end ?? nowMonth))
    const totalMonths = sumMergedIntervals(intervals)

    const roles: SkillRoleSummary[] = matching.map(({ id, data }) => {
      const months = roleDurationMonths(data.start, data.end, nowMonth)
      const hasRelatedProjectStudy = projects.some(
        (project) => project.data.relatedExperience === id && project.data.caseStudy.published,
      )
      const caseStudyHref =
        data.caseStudy.published || hasRelatedProjectStudy ? `/experience/${id}/` : undefined

      return {
        id,
        title: data.title,
        employer: data.employer,
        start: data.start,
        end: data.end,
        range: formatRange(data.start, data.end),
        duration: formatDuration(months),
        months,
        caseStudyHref,
      }
    })

    return {
      slug: slugifySkill(skill.name),
      name: skill.name,
      description: skill.description,
      totalMonths,
      totalDuration: formatDuration(totalMonths),
      approximateDuration: formatApproximateDuration(totalMonths),
      roles,
    }
  })
}

/** Merges overlapping or contiguous [startMonth, endMonthExclusive) intervals and sums their span. */
export function sumMergedIntervals(intervals: readonly (readonly [number, number])[]): number {
  if (intervals.length === 0) return 0
  const sorted = [...intervals].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const first = sorted[0]
  if (!first) return 0

  let total = 0
  let [curStart, curEnd] = first
  for (const [start, end] of sorted.slice(1)) {
    if (start <= curEnd) {
      curEnd = Math.max(curEnd, end)
    } else {
      total += curEnd - curStart
      curStart = start
      curEnd = end
    }
  }
  total += curEnd - curStart
  return total
}

function normalizeTech(value: string): string {
  return value.trim().toLowerCase()
}

function slugifySkill(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
