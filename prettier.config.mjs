/** @type {import('prettier').Config} */
export default {
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  endOfLine: 'lf',
  plugins: ['prettier-plugin-astro'],
  overrides: [{ files: '*.astro', options: { parser: 'astro' } }],
}

