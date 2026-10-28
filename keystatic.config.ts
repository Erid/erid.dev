import { config, fields, singleton } from '@keystatic/core'

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
      },
    }),
  },
})

