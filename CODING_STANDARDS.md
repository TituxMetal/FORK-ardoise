# Coding standards

`/code-review` Standards reads this file. Layout and why live in `docs/architecture.md`. This page is the checklist.

The retrofit ticket moves the current tree to these rules. Do not mix a rename into an unrelated feature.

## Language

- Code, Prisma models, test titles, comments: English from `CONTEXT.md`.
- UI strings: French.
- Issues, pull requests, commits: English. See `docs/git-workflow.md`.

## Shape

- `apps/api` + `apps/web`. See `docs/architecture.md`.
- `export const` only. No `class`. No `function` keyword.
- No `I` prefix on interfaces. PascalCase is for React component files and exported type identifiers; every other module file is camelCase + role suffix. A function file is never PascalCase.

## API files

Every non-barrel file in `apps/api/src` carries its role suffix:

| Role                         | Suffix                          | Example                                                  |
| ---------------------------- | ------------------------------- | -------------------------------------------------------- |
| entity / aggregate           | `.entity.ts`                    | `group.entity.ts`                                        |
| value object                 | `.vo.ts`                        | `amount.vo.ts`                                           |
| pure domain rule             | `.rule.ts`                      | `balance.rule.ts`                                        |
| persistence port (interface) | `.repository.ts`                | `group.repository.ts`                                    |
| adapter (Prisma, auth, …)    | `.adapter.ts`                   | `prismaGroup.adapter.ts`                                 |
| use case                     | `.uc.ts`                        | `createGroup.uc.ts`                                      |
| DTO                          | `.dto.ts`                       | `group.dto.ts`                                           |
| mapper                       | `.mapper.ts`                    | `toGroupDto.mapper.ts`                                   |
| Hono routes                  | `.routes.ts`                    | `groups.routes.ts`                                       |
| middleware / error filter    | `.middleware.ts` / `.filter.ts` | `requireSession.middleware.ts`, `mapException.filter.ts` |
| client / capacity port       | `.client.ts` / `.port.ts`       | `prisma.client.ts`, `auth.port.ts`                       |
| barrel                       | `index.ts`                      |                                                          |

No per-role subfolders (`entities/`, `value-objects/`, `use-cases/`): the layer folder says the layer, the suffix says the role.

## Web files

- Folders kebab-case.
- `pages/` one file per route, composes feature components.
- `features/<name>/`: `components/` + `api/` always; `hooks/`, `schemas/`, `store/`, `types/`, `utils/` as the feature needs them. Never an empty folder.
- `components/ui/`: shared reusable UI (Input, Button, FormWrapper…), barrel `index.ts`.
- Component files PascalCase (`GroupPage.tsx`, `Input.tsx`); exported type identifiers PascalCase (`GroupDto`); type modules camelCase + suffix (`auth.types.ts`).
- Function modules camelCase with a role suffix when the role exists (`groups.client.ts`, `auth.schema.ts`, `auth.store.ts`); no invented suffix (`amounts.ts`, `errorMessage.ts`).
- Specs colocated, `.spec.ts` / `.spec.tsx`.
- Playwright specs: `apps/web/e2e/` — one suite over the whole product, not colocated.

## Tests

- The spec file is the source file name plus `.spec`: `amount.vo.ts` → `amount.vo.spec.ts`, `expenses.routes.ts` → `expenses.routes.spec.ts`, `GroupPage.tsx` → `GroupPage.spec.tsx`. One file, one spec.
- Exempt from a colocated spec: `index.ts` barrels, `main.ts` / `main.tsx` entries, `vite-env.d.ts`, configs, and pure type modules with no runtime behaviour (`*.dto.ts`, `*.port.ts`, `*.repository.ts` — DTOs and auth/persistence ports). An adapter (`*.adapter.ts`, `*.client.ts`) spec covers the port it implements.
- Structure: Arrange / Act / Assert separated by a blank line. No `// Arrange` comments.
- New specs: `describe` / `it`. Playwright specs: `test.describe` / `test` (the library exports no `it`), English titles.
- Layers: domain + HTTP in-process + React Testing Library + Playwright.
- Behaviour at a public seam. No implementation-detail tests.

## Aliases

- `~/*` → `src/*` in both apps.
- `~ui/*` → `src/components/ui/*` and `~features/*` → `src/features/*` in the web.
- `api/*` → `apps/api/src/*` in the web: type-only in product code; the test harness may import runtime values (e.g. `createApp`) to mount the API in-process.
- In the web, `~/*` also falls back to `apps/api/src/*` for the type-checker only, so api sources' internal `~/` imports resolve when tsc follows the `api/*` import. The runtime resolver is importer-aware and never sends a web file into the api tree: product web code imports `~/x` only for web `src/x`, and the api tree only through `api/*`.
- Imports carry no file extension.

## Format

Oxfmt. `vp check` before a commit.
