/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Public contact address, kept out of the repository; shown only on request in the browser. */
  readonly CONTACT_EMAIL?: string
  /** WhatsApp number in international format; kept out of the repository and encoded in HTML. */
  readonly CONTACT_WHATSAPP?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
