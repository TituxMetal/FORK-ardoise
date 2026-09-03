# Git workflow

## Branching

```text
main ← feature/* | fix/* | docs/*
```

No `develop`. One branch per ticket. Prefix matches the change:

- `feature/<english-kebab>` — product code
- `fix/<english-kebab>` — a bug
- `docs/<english-kebab>` — documentation only

Full words: `feature`, never `feat`. A docs-only change is never `feature/*`.
No commit and no push to `main`.

`origin` stays `git@github.com:…`. Never switch the remote to HTTPS. Never
`git push https://…`. If SSH agent refuses the key, stop and say so — do not
fall back to HTTPS.

Every commit is GPG-signed (`commit.gpgsign=true`). Never `--no-gpg-sign`.
If pinentry cannot unlock the key, stop and say so.

## Commits

Conventional commits, atomic. Commit text follows the single language rule in
`CONTEXT.md` (`## Language`):

```text
type(scope): imperative description
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `chore`, `build`, `ci`, `perf`, `revert`.

`feat` is a commit type. Branches and pull-request titles use the full word `feature`.

One concern per commit. Subject describes the writing, not the file. Body, when present, is bullets — no paragraphs.
Atomic means each commit is a single concern that leaves the tree compiling
and green (`vp check` + `vp test` pass at that commit). Split unrelated
changes into separate commits; never `git add -A` a whole working tree.
Rewrite locally with `git reset` only before the branch is pushed.

## Issues and pull requests

Issue and pull-request text follows the single language rule in `CONTEXT.md`
(`## Language`). Titles use full words (`feature: add payback form`, never
`feat:`).

Required path:

A ticket is not done when the commit exists. The completion criterion is a
pushed branch with an open pull request against `main`, every commit atomic
and GPG-signed, and `vp check` + `vp test` green before each commit.

1. Claim the issue — assignee set (`gh issue edit <n> --add-assignee @me`)
   before any file change. See `docs/agents/issue-tracker.md`.
2. Branch from up-to-date `main`.
3. Open a pull request against `main`.
4. Wait for Copilot review. Address every comment. The author does not dismiss them silently.
5. The human rebase-merges on GitHub. The agent never merges and never commits on `main`.
6. After the merge, local sync when asked:
   - `git fetch --prune`
   - delete the local branch GitHub deleted
   - checkout `main`
   - pull

Rebase-merge only. No squash. History stays linear; every commit stays.

## Verification

Before every commit: `vp check` and `vp test`. Add Playwright when that suite exists.

The `check:git-workflow` gate (`bun run tools/checkGitWorkflow.ts`) makes these
rules executable: it fails on a commit on `main`, a non-conventional subject,
a paragraph commit body, an unpushed branch, or feature work without an open
pull request against `main`. It needs a pushed branch and an open PR to pass,
so run it as the completion check after pushing (`vp run check:git-workflow`),
and in CI with `vp run check:git-workflow --diff origin/main`.
