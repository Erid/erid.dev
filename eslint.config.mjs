import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import astro from 'eslint-plugin-astro'
import unusedImports from 'eslint-plugin-unused-imports'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig(
  { ignores: ['dist/', '.astro/', '.sst/', 'node_modules/', 'profile/', 'pnpm-lock.yaml'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    plugins: { 'unused-imports': unusedImports },
    rules: {
      // Replace the stock rule with one that autofixes removal of unused imports.
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  // Must stay last: disables stylistic rules that conflict with Prettier.
  eslintConfigPrettier,
)
