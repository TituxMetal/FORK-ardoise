# Ticket lifecycle

The end-to-end ritual for a ticket, from claim to close. Every step is a
completion criterion: a ticket is not done when the commit exists. See
`docs/git-workflow.md` for the git rules and `docs/agents/issue-tracker.md`
for the tracker operations.

## 1. Claim

- `gh issue edit <n> --add-assignee @me` before any file change.
- Done when the ticket's assignee is `@me`.

## 2. Branch

- From up-to-date `main`: `feature/<english-kebab>` (product code),
  `fix/<english-kebab>` (bug), `docs/<english-kebab>` (docs only).
- Never commit or push `main`.

## 3. Implement

- Follow `docs/agents/domain.md`, `CODING_STANDARDS.md` and `CONTEXT.md`.
- Commit atomically (definition in `docs/git-workflow.md`), conventional
  subjects, bullet bodies, GPG-signed.
- Before every commit: `vp check` and `vp test`.

## 4. Pull request

- Open a PR against `main` once the branch is pushed — the completion
  criterion, not an afterthought.
- PR text follows the single language rule in `CONTEXT.md` (`## Language`);
  title full words (`feature: add payback form`).

## 5. Review comments

Every review comment gets an explicit verdict — fix or not — and a reply on
its thread. The author does not dismiss comments silently.

- Pertinent comments are fixed and the fix pushed; the reply summarises it.
- Non-pertinent comments get a reply explaining simply why not, with the
  trigger path or the rule that makes it moot.

When in doubt, triage with several agents in parallel (one judge per
comment, majority decides) before choosing.

## 6. Close ritual

After the human rebase-merges:

- Check every acceptance `- [ ]` in the ticket body to `- [x]`.
- `gh issue close <n> --comment "…"` listing what shipped and the PR number.
- Done when the ticket is `CLOSED`, has an assignee, zero unchecked boxes,
  and that close comment.

## 7. Local sync

When asked after the merge:

- `git fetch --prune`
- delete the local branch GitHub deleted
- checkout `main`
- pull
