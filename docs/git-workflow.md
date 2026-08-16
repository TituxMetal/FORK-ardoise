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

Conventional commits, English, atomic:

```text
type(scope): imperative description
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `chore`, `build`, `ci`, `perf`, `revert`.

`feat` is a commit type. Branches and pull-request titles use the full word `feature`.

One concern per commit. Subject describes the writing, not the file. Body, when present, is bullets — no paragraphs.

## Issues and pull requests

Titles in English, full words (`feature: add payback form`, never `feat:`).

Required path:

1. Claim the issue (`docs/agents/issue-tracker.md`).
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
