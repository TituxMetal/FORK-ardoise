# Coding standards

`/code-review` Standards reads this file. Layout and why live in the pointed docs. This page is the checklist.

The current tree predates these rules (French identifiers, classes, `test()`, one web screen). New code follows this file. The retrofit ticket moves the old tree. Do not mix a rename into an unrelated feature.

## Language

- Code, Prisma models, test titles, comments: English from `CONTEXT.md`.
- UI strings: French.
- Issues, pull requests, commits: English. See `docs/git-workflow.md`.

## Shape

- `apps/api` + `apps/web`. See `docs/architecture.md`.
- `export const` only. No `class`. No `function` keyword.
- Web: `pages/` + `features/` + `layouts/` + `lib/`. No new god screens.

## Files

- Folders kebab-case.
- Component / type files PascalCase.
- Function modules camelCase. A function file is not PascalCase.
- Specs colocated, `.spec.ts` / `.spec.tsx`.

## Tests

- New specs: `describe` / `it`.
- Layers: domain + HTTP in-process + React Testing Library + Playwright.
- Behaviour at a public seam. No implementation-detail tests.

## Format

Oxfmt. `vp check` before a commit.
