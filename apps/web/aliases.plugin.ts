import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite-plus'

const apiSrc = fileURLToPath(new URL('../api/src', import.meta.url))
const webSrc = fileURLToPath(new URL('./src', import.meta.url))
const webUi = fileURLToPath(new URL('./src/components/ui', import.meta.url))
const webFeatures = fileURLToPath(new URL('./src/features', import.meta.url))

const withExtension = (target: string): string => {
  if (existsSync(target)) {
    try {
      if (statSync(target).isDirectory()) {
        if (existsSync(join(target, 'index.ts'))) return join(target, 'index.ts')
        if (existsSync(join(target, 'index.tsx'))) return join(target, 'index.tsx')
      }
    } catch {
      return target
    }
    return target
  }
  if (existsSync(`${target}.ts`)) return `${target}.ts`
  if (existsSync(`${target}.tsx`)) return `${target}.tsx`
  return target
}

// Importer-aware aliases. `resolveId` with `enforce: 'pre'` replaces the
// deprecated `resolve.alias` `customResolver` option (removed in Vite 9).
export const aliases = (): Plugin => ({
  name: 'ardoise-aliases',
  enforce: 'pre',
  resolveId(source, importer) {
    if (source.startsWith('~ui/')) return withExtension(join(webUi, source.replace(/^~ui\//, '')))
    if (source.startsWith('~features/'))
      return withExtension(join(webFeatures, source.replace(/^~features\//, '')))
    if (source.startsWith('api/')) return withExtension(join(apiSrc, source.replace(/^api\//, '')))
    if (source.startsWith('~/')) {
      const root = importer?.startsWith(apiSrc) ? apiSrc : webSrc
      return withExtension(join(root, source.replace(/^~\//, '')))
    }
    return null
  }
})
