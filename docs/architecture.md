# Architecture

Two apps, one product contract.

```text
apps/api/     Hono HTTP API
apps/web/     React UI, proxies /api to the API
```

Do not merge them into one Hono+SPA app. The HTTP API is the product seam. Ardoise is multi-user: sessions (better-auth server), invite links, groups shared between people. An "engine" imported directly by the web cannot hold sessions or invites — the split is product-justified, not taste.

## Contract

The API composes a single Hono app in `createApp.ts`. Its type is the contract:

```ts
// apps/api/src/createApp.ts
export const createApp = () => { … }
export type AppType = ReturnType<typeof createApp>
```

The web imports `AppType` type-only (through the `api/*` alias, erased at build) and calls the API through `hc<AppType>` from `hono/client`. Input types come from the `zValidator` schemas, output types from `c.json()` — no hand-written client, no shared package. better-auth keeps its own client (`authClient`). API errors are not inferred by `hc`: a thin wrapper reads `res.json()` and throws, keeping the `throw` contract components expect.

## API

Folders by vocabulary (`groups`, `expenses`, `services`, `paybacks`, …), plus `shared/` for everything shared between vocabularies. Entry points sit at the `src/` root, like NestJS `main.ts`:

```text
apps/api/src/
  main.ts, createApp.ts       bootstrap + composition
  groups/  expenses/  services/  paybacks/
    domain/           entities, value objects, pure rules, persistence ports
    application/      use cases, DTOs, mappers to DTO
    infrastructure/   Prisma adapters, mappers to persistence
    presentation/     Hono routes
  shared/
    domain/           amount, part, balance, domain errors
    application/      capacity ports (auth)
    infrastructure/   prisma client, auth adapter
    presentation/     shared middleware, error filter
```

No `class`. No `function` keyword. A use case is `export const createPayback = (deps) => async (input) => { … }` — never `{ execute() }`.

Every file carries its role suffix (table in `CODING_STANDARDS.md`). No per-role subfolders: the layer folder says the layer, the suffix says the role.

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

## Web

Root mirror of the feature structure — the same complete structure at `src/` for everything shared, `pages/` for the routes that compose features:

```text
apps/web/src/
  pages/            one file per route, composes feature components
  features/<name>/  components/ + api/ always; hooks/ schemas/ store/ types/ utils/ as needed
  components/ui/    shared reusable UI (Input, Button, FormWrapper…)
  lib/              shared seams: http client, authClient, amounts, forms, errorMessage
  types/  utils/  config/  styles/  assets/  layouts/
```

Routing is a Hono app in the browser: routes declared with `app.get('/groups/:id', c => …)`, dispatched via `app.fetch(new Request(location.pathname))`, history API + `Link` in the React layer. Stores are nanostores (`$atom` + actions), schemas are zod v4 colocated with the feature, forms are react-hook-form + zodResolver (container owns `useForm`, the form component is pure presentation). `GroupsScreen.tsx` holding every form is the shape we leave.

## Tests

Four layers, all kept:

1. **Domain** — pure functions, colocated `.spec.ts`.
2. **HTTP** — in-process Hono, session cookie, the API contract.
3. **React Testing Library** — component behaviour against the real API in-process (`hc<AppType>('', { fetch: app.request.bind(app) })`), no fake client.
4. **Playwright** — real browser + real API. This is the layer that catches an API 4xx shown as a browser 500. Specs live in `apps/web/e2e/` and run via `vp run test:e2e` (boots web + API through the web start plugin).

One file, one colocated spec; Arrange / Act / Assert separated by a blank line. New specs use `describe` / `it`. Existing `test()` dies on the retrofit ticket. No browser suite as the _only_ contract: HTTP stays.

## Names

- Folders kebab-case.
- Component and type files PascalCase (`GroupPage.tsx`). PascalCase is never a function file.
- Function modules camelCase with a role suffix when the role exists.
- Specs sit next to the file, suffix `.spec.ts` / `.spec.tsx`.
- Aliases: `~`, `~ui`, `~features`, `api/*`. Imports carry no extension.
- Identifiers: `CONTEXT.md` English. No accents.

Oxfmt formats. Do not hand-restyle.
