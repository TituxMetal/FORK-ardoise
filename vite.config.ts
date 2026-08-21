import { defineConfig } from 'vite-plus'
import { aliasEntries } from './apps/web/aliases.plugin'

export default defineConfig({
  defaultPackage: './apps/web',
  staged: {
    '*': 'vp check --fix'
  },
  fmt: {
    semi: false,
    singleQuote: true,
    tabWidth: 2,
    printWidth: 100,
    trailingComma: 'none',
    arrowParens: 'avoid'
  },
  lint: {
    jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
    rules: { 'vite-plus/prefer-vite-plus-imports': 'error' },
    options: { typeAware: true, typeCheck: true },
    overrides: [
      {
        files: ['apps/web/**'],
        plugins: ['react']
      }
    ]
  },
  test: {
    include: ['**/*.spec.ts', '**/*.spec.tsx'],
    exclude: ['**/e2e/**'],
    alias: aliasEntries
  },
  run: {
    cache: true
  }
})
