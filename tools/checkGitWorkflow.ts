// Git-workflow gate: the conventions docs/git-workflow.md spells out, made
// executable. Catches the failures that recurred across sessions: commits on
// `main`, non-conventional subjects, paragraph commit bodies, commit text
// carrying non-ASCII (accented) characters, unpushed branches, and feature
// work without an open pull request. See issues #101 and #117.
//
// The gate fails closed: a git error or a missing ref never yields a green
// run.
//
// Scope:
//   --diff <base>   every non-merge commit of base...HEAD (CI)
//   (default)       every non-merge commit of origin/main..HEAD, or HEAD
//                   alone when origin/main is absent; plus the branch state
//                   (on main, fully pushed, open PR against main)

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

// The accent gate encodes the language rule in CONTEXT.md (`## Language`):
// agent-authored commit text is English, and a non-ASCII character is French
// text's detectable signature. Any code point above 0x7f in the subject or a
// body line fails.
const carriesNonAscii = (text: string): boolean => {
  for (const ch of text) {
    if (ch.codePointAt(0)! > 0x7f) return true
  }
  return false
}

// The body keeps indentation (a bullet's continuation lines), so it must not
// go through parse(), which trims every line. Read the raw stdout instead.
const bodyOf = (rev: string): string[] => {
  const result = Bun.spawnSync(['git', 'log', '-1', '--format=%b', rev], { stdout: 'pipe' })
  if (result.exitCode !== 0) {
    throw new Error(`git log -1 --format=%b ${rev} failed with exit code ${result.exitCode}`)
  }
  return (result.stdout as Uint8Array)
    .toString()
    .split('\n')
    .filter(line => line.trim() !== '')
}

// A body is allowed to be absent. When present, the doc forbids paragraphs:
// every line is a bullet (`- ` / `* `) or an indented continuation of the
// bullet above it. A prose line that starts neither is a paragraph.
const bodyViolations = (lines: string[]): string[] =>
  lines.filter((line, i) => {
    const isBullet = /^[-*] /.test(line)
    const continuesBullet = i > 0 && /^[-*] /.test(lines[i - 1] ?? '') && /^ {2,}/.test(line)
    return !isBullet && !continuesBullet
  })

// True when a tracking ref exists and no local commit is unpushed. A mere
// tracking ref is not enough: after the first push, a new local commit must
// still fail the gate until it is pushed.
const isFullyPushed = (): boolean => {
  const upstream = gitTolerant(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'])
  if (upstream.length === 0) return false
  return git(['rev-list', '--count', '@{u}..HEAD'])[0] === '0'
}

// The completion criterion is a PR against `main`; an open PR targeting any
// other base does not satisfy it.
const openPrAgainstMain = (branch: string): boolean => {
  const prs = ghTolerant([
    'pr',
    'view',
    branch,
    '--json',
    'state,baseRefName',
    '-q',
    '.state + ":" + .baseRefName'
  ])
  return prs.some(state => state === 'OPEN:main')
}

// --no-merges: a merge commit's subject ("Merge branch …") is not
// conventional and never authored by the ticket work.
const commitsToCheck = (base?: string): string[] => {
  if (base) return git(['rev-list', '--reverse', '--no-merges', `${base}...HEAD`])
  const originMain = gitTolerant(['rev-parse', '--verify', '--quiet', 'origin/main'])
  if (originMain.length > 0)
    return git(['rev-list', '--reverse', '--no-merges', 'origin/main..HEAD'])
  return ['HEAD']
}

const violationsFor = (revs: string[], checkBranchState: boolean): string[] => {
  const problems: string[] = []
  if (checkBranchState) {
    const branch = currentBranch()
    if (isMain(branch)) {
      problems.push(`commit on ${branch}: the git workflow forbids commits on main`)
    }
    if (!isFullyPushed()) {
      problems.push('branch has unpushed commits: push before considering the work done')
    }
    if (!isMain(branch) && !openPrAgainstMain(branch)) {
      problems.push(
        `no open pull request against main for ${branch}: feature work ships through a PR`
      )
    }
  }
  for (const rev of revs) {
    const subject = subjectOf(rev)
    if (!CONVENTIONAL.test(subject)) {
      problems.push(`subject "${subject}" is not conventional commits (type(scope): imperative)`)
    }
    if (carriesNonAscii(subject)) {
      problems.push(`subject "${subject}" carries non-ASCII characters: commit text is English`)
    }
    const body = bodyOf(rev)
    if (body.length > 0) {
      const bad = bodyViolations(body)
      if (bad.length > 0) {
        problems.push(`commit body has paragraph lines: ${bad.join(' | ')} (bullets only)`)
      }
      const accented = body.filter(line => carriesNonAscii(line))
      if (accented.length > 0) {
        problems.push(
          `commit body carries non-ASCII characters: ${accented.join(' | ')} (commit text is English)`
        )
      }
    }
  }
  return problems
}

const main = async (): Promise<void> => {
  const args = process.argv.slice(2)
  const diffIdx = args.indexOf('--diff')
  const base = diffIdx >= 0 ? args[diffIdx + 1] : undefined

  const problems = violationsFor(commitsToCheck(base), base === undefined)
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
