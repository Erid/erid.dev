import type { CaseStudy, Education, Experience, Post, Profile, Project, Resume } from './schemas.ts'

export interface ContentSet {
  profile?: Profile | undefined
  experience: Record<string, Experience>
  education: Record<string, Education>
  projects?: Record<string, Project>
  posts?: Record<string, Post>
  resume: Resume
  /** Reports whether a path relative to src/assets exists; omitted in pure tests. */
  imageExists?: (src: string) => boolean
}

/** Checks relationships and constraints that per-file schemas cannot express. */
export function validateContent(content: ContentSet): string[] {
  return [
    ...checkDates(content),
    ...checkResume(content),
    ...checkProjects(content),
    ...checkPosts(content),
    ...checkImages(content),
  ]
}

function checkDates({ experience, education }: ContentSet): string[] {
  const problems: string[] = []
  for (const [id, entry] of Object.entries(experience)) {
    if (entry.end && entry.end < entry.start) {
      problems.push(`experience/${id}: end ${entry.end} is before start ${entry.start}`)
    }
    problems.push(...checkCaseStudy(`experience/${id}`, entry.caseStudy))
  }
  for (const [id, entry] of Object.entries(education)) {
    if (entry.end && entry.end < entry.start) {
      problems.push(`education/${id}: end ${entry.end} is before start ${entry.start}`)
    }
  }
  return problems
}

function checkResume({ experience, education, resume }: ContentSet): string[] {
  const problems: string[] = []
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

function checkProjects({ experience, projects = {} }: ContentSet): string[] {
  const problems: string[] = []
  for (const [id, project] of Object.entries(projects)) {
    const related = project.relatedExperience
    if (related && !experience[related]) {
      problems.push(`projects/${id}: unknown related experience "${related}"`)
    }
    problems.push(...checkCaseStudy(`projects/${id}`, project.caseStudy))
  }
  return problems
}

function checkPosts({ posts = {} }: ContentSet): string[] {
  const problems: string[] = []
  for (const [id, post] of Object.entries(posts)) {
    if (post.updatedOn && post.updatedOn < post.publishedOn) {
      problems.push(`posts/${id}: updatedOn is before publishedOn`)
    }
  }
  return problems
}

function checkImages({ profile, projects = {}, posts = {}, imageExists }: ContentSet): string[] {
  if (!imageExists) return []
  const problems: string[] = []
  const check = (owner: string, src: string | undefined) => {
    if (src && !imageExists(src)) problems.push(`${owner}: image "${src}" not found in src/assets`)
  }

  if (profile?.portrait && !profile.portraitAlt)
    problems.push('profile: portrait needs portraitAlt')
  check('profile', profile?.portrait)
  for (const [id, project] of Object.entries(projects)) {
    for (const image of project.images) check(`projects/${id}`, image.src)
  }
  for (const [id, post] of Object.entries(posts)) check(`posts/${id}`, post.cover?.src)
  return problems
}

/** A published case study must have the minimum sections that make it a story. */
function checkCaseStudy(owner: string, study: CaseStudy): string[] {
  if (!study.published) return []
  const missing = (['challenge', 'contribution'] as const).filter((key) => !study[key])
  return missing.map((key) => `${owner}: published case study is missing "${key}"`)
}
