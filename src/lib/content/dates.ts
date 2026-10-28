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
