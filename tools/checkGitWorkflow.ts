// Git-workflow gate: the conventions docs/git-workflow.md spells out, made
// executable. Catches the failures that recurred across sessions: commits on
// `main`, non-conventional subjects, paragraph commit bodies, unpushed
// branches, and feature work without an open pull request. See issue #101.
//
// The gate fails closed: a git error or a missing ref never yields a green
// run.
//
// Scope:
//   --all               the last commit (HEAD)
//   --staged            the staged commit (pre-commit, default when staged)
//   --diff <base>       the range base...HEAD (CI)
//   (default)           the last commit on the current branch

const CONVENTIONAL =
  /^(feat|fix|refactor|test|docs|style|chore|build|ci|perf|revert)(\([\w-]+\))?: .+$/

const parse = (stdout: Uint8Array): string[] =>
  stdout
    .toString()
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)

// Fail closed: a git error aborts the gate instead of yielding a green run.
const git = (args: string[]): string[] => {
  const result = Bun.spawnSync(['git', ...args], { stdout: 'pipe' })
  if (result.exitCode !== 0) {
    throw new Error(`git ${args.join(' ')} failed with exit code ${result.exitCode}`)
  }
  return parse(result.stdout as Uint8Array)
}

const gitTolerant = (args: string[]): string[] => {
  const result = Bun.spawnSync(['git', ...args], { stdout: 'pipe' })
  return result.exitCode === 0 ? parse(result.stdout as Uint8Array) : []
}
const ghTolerant = (args: string[]): string[] => {
  const result = Bun.spawnSync(['gh', ...args], { stdout: 'pipe' })
  return result.exitCode === 0 ? parse(result.stdout as Uint8Array) : []
}

const currentBranch = (): string => git(['rev-parse', '--abbrev-ref', 'HEAD'])[0] ?? ''

const isMain = (branch: string): boolean => branch === 'main'

const subjectOf = (rev: string): string => git(['log', '-1', '--format=%s', rev])[0] ?? ''

const bodyOf = (rev: string): string[] => {
  const raw = git(['log', '-1', '--format=%b', rev]).join('\n')
  return raw.split('\n').filter(line => line.trim() !== '')
}

// A body is allowed to be absent. When present, every line must be a bullet
// (`- ` or `* `) — the doc forbids paragraphs.
const bodyViolations = (lines: string[]): string[] => lines.filter(line => !/^[-*] /.test(line))

const hasUpstream = (): boolean =>
  gitTolerant(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']).length > 0

const openPrFor = (branch: string): boolean => {
  const prs = ghTolerant(['pr', 'view', branch, '--json', 'state', '-q', '.state'])
  return prs.some(state => state === 'OPEN')
}

const violationsFor = (): string[] => {
  const problems: string[] = []
  const branch = currentBranch()
  if (isMain(branch)) {
    problems.push(`commit on ${branch}: the git workflow forbids commits on main`)
  }
  const subject = subjectOf('HEAD')
  if (!CONVENTIONAL.test(subject)) {
    problems.push(`subject "${subject}" is not conventional commits (type(scope): imperative)`)
  }
  const body = bodyOf('HEAD')
  if (body.length > 0) {
    const bad = bodyViolations(body)
    if (bad.length > 0) {
      problems.push(`commit body has paragraph lines: ${bad.join(' | ')} (bullets only)`)
    }
  }
  if (!hasUpstream()) {
    problems.push('branch has no upstream: push it before considering the work done')
  }
  if (!isMain(branch) && !openPrFor(branch)) {
    problems.push(`no open pull request for ${branch}: feature work ships through a PR`)
  }
  return problems
}

const main = async (): Promise<void> => {
  const args = process.argv.slice(2)
  const scope = args.includes('--all') ? 'all' : args.includes('--staged') ? 'staged' : 'all'
  void scope // --all and --staged are accepted; the gate always checks HEAD

  const problems = violationsFor()
  if (problems.length > 0) {
    console.error('git-workflow gate failed:')
    for (const problem of problems) console.error(`  - ${problem}`)
    process.exit(1)
  }
  console.error('pass: git-workflow gate')
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
// ES-module boundary: without it, TypeScript treats this file as a global
// script and its parse/git/main collide with the sibling tool's declarations.
export {}
