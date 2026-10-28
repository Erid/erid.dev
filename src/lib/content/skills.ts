import { formatRange } from './dates.ts'
import type { Entry, Experience, Project, Skill } from './schemas.ts'

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
      const [startIdx, endExclusive] = toMonthInterval(data.start, data.end ?? nowMonth)
      const months = Math.max(1, endExclusive - startIdx)
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
      roles,
    }
  })
}

/** Formats a month count into a concise recruiter-friendly duration such as "8 yrs 5 mos". */
export function formatDuration(totalMonths: number): string {
  const months = Math.max(0, Math.floor(totalMonths))
  if (months === 0) return 'Less than 1 mo'
  const years = Math.floor(months / 12)
  const rem = months % 12
  const yearPart = years > 0 ? `${years} ${years === 1 ? 'yr' : 'yrs'}` : ''
  const monthPart = rem > 0 ? `${rem} ${rem === 1 ? 'mo' : 'mos'}` : ''
  return [yearPart, monthPart].filter(Boolean).join(' ')
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

function currentYearMonth(now: Date = new Date()): string {
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function normalizeTech(value: string): string {
  return value.trim().toLowerCase()
}

/** Converts inclusive YYYY-MM bounds to a half-open month index interval [start, end + 1). */
function toMonthInterval(start: string, end: string): [number, number] {
  const startIdx = parseYearMonth(start)
  const endIdx = Math.max(startIdx, parseYearMonth(end))
  return [startIdx, endIdx + 1]
}

function parseYearMonth(value: string): number {
  const [yearStr, monthStr] = value.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr ?? '1')
  return year * 12 + (month - 1)
}

function slugifySkill(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
