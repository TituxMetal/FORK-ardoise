import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Alias } from 'vite'

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

const resolveFrom =
  (root: string): NonNullable<Alias['customResolver']> =>
  id =>
    withExtension(join(root, id))

export const aliasEntries: Alias[] = [
  { find: /^~ui\//, replacement: '', customResolver: resolveFrom(webUi) },
  { find: /^~features\//, replacement: '', customResolver: resolveFrom(webFeatures) },
  { find: /^api\//, replacement: '', customResolver: resolveFrom(apiSrc) },
  {
    find: /^~\//,
    replacement: '',
    customResolver: (id, importer) =>
      withExtension(join(importer?.startsWith(apiSrc) ? apiSrc : webSrc, id))
  }
]
