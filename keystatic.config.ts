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
        published: fields.checkbox({ label: 'Published', defaultValue: true }),
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
