import { collection, config, fields, singleton } from '@keystatic/core'

// Field names must match src/lib/content/schemas.ts; tests/keystatic-schema.test.ts checks this.

const links = (label: string) =>
  fields.array(
    fields.object({
      label: fields.text({ label: 'Label', validation: { isRequired: true } }),
      url: fields.url({ label: 'URL', validation: { isRequired: true } }),
    }),
    { label, itemLabel: (props) => props.fields.label.value || 'Link' },
  )

const textList = (label: string) =>
  fields.array(fields.text({ label: 'Item', validation: { isRequired: true } }), {
    label,
    itemLabel: (props) => props.value || 'Item',
  })

const imageRefs = (label: string) =>
  fields.array(
    fields.object({
      src: fields.text({
        label: 'Path relative to src/assets',
        validation: { isRequired: true },
      }),
      alt: fields.text({ label: 'Alt text', validation: { isRequired: true } }),
    }),
    { label, itemLabel: (props) => props.fields.src.value || 'Image' },
  )

const caseStudy = () =>
  fields.object(
    {
      published: fields.checkbox({
        label: 'Publish case study page',
        description: 'Leave off until the story is approved and complete.',
        defaultValue: false,
      }),
      challenge: fields.text({ label: 'The challenge', multiline: true }),
      contribution: fields.text({ label: 'My contribution', multiline: true }),
      decisions: fields.text({ label: 'Decisions and trade-offs', multiline: true }),
      outcomes: fields.text({ label: 'Verified outcomes and lessons', multiline: true }),
    },
    { label: 'Case study' },
  )

const monthPattern = {
  regex: /^\d{4}-(0[1-9]|1[0-2])$/,
  message: 'Use YYYY-MM, for example 2023-12',
}
const yearPattern = { regex: /^\d{4}$/, message: 'Use YYYY, for example 2011' }

export default config({
  // Local mode only: edits write files in this checkout; no account or remote storage.
  storage: { kind: 'local' },
  singletons: {
    profile: singleton({
      label: 'Profile',
      path: 'src/content/profile',
      format: 'yaml',
      schema: {
        name: fields.text({ label: 'Name', validation: { isRequired: true } }),
        headline: fields.text({ label: 'Headline', validation: { isRequired: true } }),
        location: fields.text({ label: 'Location', validation: { isRequired: true } }),
        introduction: fields.text({
          label: 'Introduction',
          multiline: true,
          validation: { isRequired: true },
        }),
        biography: fields.text({ label: 'Biography (about page)', multiline: true }),
        coreTechnologies: textList('Core technologies'),
        links: links('Public links'),
        languages: fields.array(
          fields.object({
            name: fields.text({ label: 'Language', validation: { isRequired: true } }),
            proficiency: fields.text({ label: 'Proficiency', validation: { isRequired: true } }),
          }),
          {
            label: 'Spoken languages',
            itemLabel: (props) => props.fields.name.value || 'Language',
          },
        ),
        portrait: fields.text({ label: 'Portrait image path (optional)' }),
        portraitAlt: fields.text({ label: 'Portrait alt text' }),
      },
    }),
    resume: singleton({
      label: 'Résumé',
      path: 'src/content/resume',
      format: 'yaml',
      schema: {
        summary: fields.text({
          label: 'Professional summary',
          multiline: true,
          validation: { isRequired: true },
        }),
        roles: fields.array(
          fields.object({
            experience: fields.relationship({
              label: 'Experience entry',
              collection: 'experience',
              validation: { isRequired: true },
            }),
            bullets: textList('Résumé-specific bullets (blank = use the role’s contributions)'),
          }),
          {
            label: 'Roles, in display order',
            itemLabel: (props) => props.fields.experience.value ?? 'Role',
          },
        ),
        education: fields.array(
          fields.relationship({ label: 'Education entry', collection: 'education' }),
          { label: 'Education', itemLabel: (props) => props.value ?? 'Education' },
        ),
        skills: textList('Selected skills'),
      },
    }),
  },
  collections: {
    experience: collection({
      label: 'Experience',
      path: 'src/content/experience/*',
      slugField: 'entry',
      format: 'yaml',
      schema: {
        entry: fields.slug({
          name: { label: 'Entry name (file name becomes the stable ID)' },
        }),
        employer: fields.text({ label: 'Employer', validation: { isRequired: true } }),
        title: fields.text({ label: 'Title', validation: { isRequired: true } }),
        start: fields.text({
          label: 'Start (YYYY-MM)',
          validation: { isRequired: true, pattern: monthPattern },
        }),
        end: fields.text({
          label: 'End (YYYY-MM; leave blank for current)',
          validation: { pattern: monthPattern },
        }),
        location: fields.text({ label: 'Location or Remote' }),
        employmentType: fields.select({
          label: 'Employment type',
          options: [
            { label: 'Unknown', value: '' },
            { label: 'Full-time', value: 'Full-time' },
            { label: 'Contract', value: 'Contract' },
          ],
          defaultValue: '',
        }),
        contributions: textList('Concise contributions'),
        technologies: textList('Technologies'),
        links: links('Links'),
        caseStudy: caseStudy(),
        published: fields.checkbox({ label: 'Published', defaultValue: true }),
      },
    }),
    projects: collection({
      label: 'Projects',
      path: 'src/content/projects/*',
      slugField: 'entry',
      format: 'yaml',
      schema: {
        entry: fields.slug({ name: { label: 'Entry name (file name becomes the URL slug)' } }),
        title: fields.text({ label: 'Title', validation: { isRequired: true } }),
        summary: fields.text({
          label: 'Summary (problem and contribution)',
          multiline: true,
          validation: { isRequired: true },
        }),
        role: fields.text({ label: 'My role' }),
        date: fields.text({
          label: 'Date (YYYY-MM, optional)',
          validation: { pattern: monthPattern },
        }),
        technologies: textList('Technologies'),
        outcomes: textList('Verified outcomes'),
        demoUrl: fields.url({ label: 'Live demo URL' }),
        repositoryUrl: fields.url({ label: 'Source repository URL' }),
        images: imageRefs('Images'),
        relatedExperience: fields.relationship({
          label: 'Related experience',
          collection: 'experience',
        }),
        caseStudy: caseStudy(),
        featured: fields.checkbox({ label: 'Show on the homepage', defaultValue: false }),
        published: fields.checkbox({
          label: 'Published',
          description: 'Unpublished projects do not appear anywhere on the site.',
          defaultValue: false,
        }),
      },
    }),
    posts: collection({
      label: 'Posts',
      path: 'src/content/posts/*',
      slugField: 'title',
      // Plain .md files: Keystatic's rich text round-trips ordinary Markdown without custom tags.
      format: { contentField: 'body' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        summary: fields.text({
          label: 'Summary',
          multiline: true,
          validation: { isRequired: true },
        }),
        publishedOn: fields.text({
          label: 'Publication date (YYYY-MM-DD)',
          validation: {
            isRequired: true,
            pattern: { regex: /^\d{4}-\d{2}-\d{2}$/, message: 'Use YYYY-MM-DD' },
          },
        }),
        updatedOn: fields.text({ label: 'Last updated (YYYY-MM-DD, optional)' }),
        cover: fields.object(
          {
            src: fields.text({ label: 'Path relative to src/assets' }),
            alt: fields.text({ label: 'Alt text' }),
          },
          { label: 'Cover image (optional)' },
        ),
        draft: fields.checkbox({
          label: 'Draft',
          description: 'Drafts are excluded from pages, RSS, the sitemap and the PDF.',
          defaultValue: true,
        }),
        body: fields.markdoc({ label: 'Body', extension: 'md' }),
      },
    }),
    education: collection({
      label: 'Education',
      path: 'src/content/education/*',
      slugField: 'entry',
      format: 'yaml',
      schema: {
        entry: fields.slug({ name: { label: 'Entry name (file name becomes the stable ID)' } }),
        institution: fields.text({ label: 'Institution', validation: { isRequired: true } }),
        qualification: fields.text({ label: 'Qualification', validation: { isRequired: true } }),
        subject: fields.text({ label: 'Subject' }),
        start: fields.text({
          label: 'Start (YYYY)',
          validation: { isRequired: true, pattern: yearPattern },
        }),
        end: fields.text({ label: 'End (YYYY)', validation: { pattern: yearPattern } }),
        details: fields.text({ label: 'Details', multiline: true }),
      },
    }),
  },
})
