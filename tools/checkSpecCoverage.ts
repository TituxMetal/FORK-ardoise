// Spec-coverage gate: every non-exempt source file under apps/*/src has its
// mirror sibling spec (amount.vo.ts -> amount.vo.spec.ts, GroupPage.tsx ->
// GroupPage.spec.tsx). Exempt: barrels, entries, vite-env.d.ts, configs, and
// pure type modules (*.dto.ts / *.port.ts / *.repository.ts). See docs issue #63.
//
// The gate fails closed: a git error or an invalid base never yields a green
// run.
//
// Scope:
//   --all               whole tracked tree (retrofit verification, #51)
//   --diff <base>       only source files changed vs <base> (CI)
//   --staged            only staged files (pre-commit)
//   (default)           changed vs origin/main; staged when origin/main is absent

const ROOTS = ['apps/api/src', 'apps/web/src']
const EXEMPT_BASENAMES = ['index.ts', 'main.ts', 'main.tsx', 'vite-env.d.ts']
const EXEMPT_MARKERS = ['.config.']
const EXEMPT_SUFFIXES = ['.dto.ts', '.port.ts', '.repository.ts']

const parse = (stdout: Uint8Array): string[] =>
  stdout
    .toString()
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)

// Fail closed: a git error aborts the gate instead of yielding an empty diff.
const git = (args: string[]): string[] => {
  const result = Bun.spawnSync({ cmd: ['git', ...args], stdout: 'pipe', stderr: 'pipe' })
  if (!result.success) {
    console.error(
      `spec-coverage gate: git ${args.join(' ')} failed: ${result.stderr.toString().trim()}`
    )
    process.exit(1)
  }
  return parse(result.stdout)
}

// Tolerant variant for probes that legitimately fail (e.g. a missing ref).
const gitTolerant = (args: string[]): string[] => {
  const result = Bun.spawnSync({ cmd: ['git', ...args], stdout: 'pipe' })
  return result.success ? parse(result.stdout) : []
}

const isSource = (file: string): boolean =>
  /\.(ts|tsx)$/.test(file) && !/\.spec\.(ts|tsx)$/.test(file)

const isExempt = (file: string): boolean => {
  const base = file.split('/').pop() ?? ''
  return (
    EXEMPT_BASENAMES.includes(base) ||
    EXEMPT_MARKERS.some(marker => base.includes(marker)) ||
    EXEMPT_SUFFIXES.some(suffix => base.endsWith(suffix))
  )
}

const treeSources = (): string[] => git(['ls-files', '--', ...ROOTS]).filter(isSource)

const changedSources = (base: string): string[] =>
  git(['diff', '--name-only', `${base}...HEAD`, '--', ...ROOTS]).filter(isSource)

const stagedSources = (): string[] =>
  git(['diff', '--cached', '--name-only', '--', ...ROOTS]).filter(isSource)

const hasOriginMain = (): boolean =>
  gitTolerant(['rev-parse', '--verify', '--quiet', 'origin/main']).length > 0

const mirrorSpec = (file: string): string => {
  const dot = file.lastIndexOf('.')
  return `${file.slice(0, dot)}.spec${file.slice(dot)}`
}

const collectFor = (args: string[]): (() => string[]) => {
  const [mode, base] = args
  switch (mode) {
    case '--all':
      return treeSources
    case '--diff':
      if (!base) {
        console.error('spec-coverage gate: --diff requires a base ref')
        process.exit(1)
      }
      return () => changedSources(base)
    case '--staged':
      return stagedSources
    default:
      return () => (hasOriginMain() ? changedSources('origin/main') : stagedSources())
  }
}

const violations = async (files: string[]): Promise<Array<{ file: string; spec: string }>> => {
  const found: Array<{ file: string; spec: string }> = []
  for (const file of files) {
    if (!(await Bun.file(file).exists())) continue
    if (isExempt(file)) continue
    const spec = mirrorSpec(file)
    if (!(await Bun.file(spec).exists())) found.push({ file, spec })
  }
  return found
}

const main = async (): Promise<void> => {
  const found = await violations(collectFor(process.argv.slice(2))())
  for (const { file, spec } of found) {
    console.error(`no mirror spec: ${file} (expected ${spec})`)
  }
  if (found.length > 0) {
    console.error(`spec-coverage gate: ${found.length} violation(s)`)
    process.exitCode = 1
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
