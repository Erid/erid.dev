/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Public contact address, kept out of the repository; shown only on request in the browser. */
  readonly CONTACT_EMAIL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
