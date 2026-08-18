# Architecture

Two apps, one product contract.

```text
apps/api/     Hono HTTP API
apps/web/     React UI, proxies /api to the API
```

Do not merge them into one Hono+SPA app. The HTTP API is the product seam.

## API

Folders by vocabulary (`groups`, `expenses`, `services`, `paybacks`, …). Inside a vocabulary, three layers:

```text
domain/           types, pure rules (Amount, Parts, Balance, Payback plafond)
application/      use cases as `export const`
infrastructure/   Prisma adapters
```

No `class`. No `function` keyword. A use case is `export const createPayback = (deps) => async (input) => { … }`.

HTTP English, bijection with `CONTEXT.md`:

| Term    | Resource   |
| ------- | ---------- |
| Group   | `groups`   |
| Member  | `members`  |
| Expense | `expenses` |
| Service | `services` |
| Payback | `paybacks` |
| Balance | `balances` |
| Invite  | `invites`  |

The tree today still uses French identifiers and classes. New code follows this file. A retrofit ticket moves the old tree.

## Web

Pages, features, layouts — not one god screen:

```text
apps/web/src/
  pages/          one file per route
  features/       per-vocabulary components, stores, lib
  layouts/        shell
  lib/            router, clients, shared helpers
```

Real routes. `GroupsScreen.tsx` holding every form is the shape we leave.

## Tests

Four layers, all kept:

1. **Domain** — pure functions, colocated `.spec.ts`.
2. **HTTP** — in-process Hono, session cookie, the API contract.
3. **React Testing Library** — component behaviour with a fake client.
4. **Playwright** — real browser + real API. This is the layer that catches an API 4xx shown as a browser 500. Specs live in `apps/web/e2e/` and run via `vp run test:e2e` (boots web + API through the web start plugin).

New specs use `describe` / `it`. Existing `test()` dies on the retrofit ticket. No browser suite as the _only_ contract: HTTP stays.

## Names

- Folders: kebab-case (`features/groups/`).
- Component and type files: PascalCase (`GroupPage.tsx`).
- Function modules: camelCase (`createPayback.ts`, `amountFromCents.ts`).
- Specs sit next to the file, suffix `.spec.ts` / `.spec.tsx`.
- Identifiers: `CONTEXT.md` English. No accents.

Oxfmt formats. Do not hand-restyle.
