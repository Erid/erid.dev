const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Formats YYYY-MM as "Dec 2023" and YYYY as "2011", never inventing finer precision. */
export function formatDate(value: string): string {
  const [year, month] = value.split('-')
  if (!year) return value
  return month ? `${MONTHS[Number(month) - 1]} ${year}` : year
}

/** Formats a range such as "Dec 2023 – Present"; a missing end means the role is ongoing. */
export function formatRange(start: string, end?: string): string {
  return `${formatDate(start)} – ${end ? formatDate(end) : 'Present'}`
}

/** Formats YYYY-MM-DD for article bylines, for example "Oct 27, 2026". */
export function formatDay(value: string): string {
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${MONTHS[Number(month) - 1]} ${Number(day)}, ${year}`
}

/** Calculates the inclusive calendar-month span for a role and formats it (e.g. "1 yr 4 mos"). */
export function formatRoleDuration(
  start: string,
  end?: string,
  nowMonth: string = currentYearMonth(),
): string {
  return formatDuration(roleDurationMonths(start, end, nowMonth))
}

/** Returns the inclusive number of calendar months between start and end (or nowMonth). */
export function roleDurationMonths(
  start: string,
  end?: string,
  nowMonth: string = currentYearMonth(),
): number {
  const [startIdx, endExclusive] = toMonthInterval(start, end ?? nowMonth)
  return Math.max(1, endExclusive - startIdx)
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

/**
 * Formats a month count as a rounded, approximate year label for skill summaries
 * (for example, 101 months -> "~8 yrs", 46 months -> "~4 yrs").
 */
export function formatApproximateDuration(totalMonths: number): string {
  const months = Math.max(0, Math.floor(totalMonths))
  if (months === 0) return '< 1 yr'
  const years = Math.round(months / 12)
  if (years === 0) return '< 1 yr'
  return `~${years} ${years === 1 ? 'yr' : 'yrs'}`
}

/** Converts inclusive YYYY-MM bounds to a half-open month index interval [start, end + 1). */
export function toMonthInterval(start: string, end: string): [number, number] {
  const startIdx = parseYearMonth(start)
  const endIdx = Math.max(startIdx, parseYearMonth(end))
  return [startIdx, endIdx + 1]
}

export function currentYearMonth(now: Date = new Date()): string {
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function parseYearMonth(value: string): number {
  const [yearStr, monthStr] = value.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr ?? '1')
  return year * 12 + (month - 1)
}
