# Architecture

Two apps, one product contract.

```text
apps/api/     Hono HTTP API
apps/web/     React UI, proxies /api to the API
```

Do not merge them into one Hono+SPA app. The HTTP API is the product seam. Ardoise is multi-user: sessions (better-auth server), invite links, groups shared between people. An "engine" imported directly by the web cannot hold sessions or invites — the split is product-justified, not taste.

## Contract

The retrofit target: the API composes a single Hono app in `createApp.ts`. Its type is the contract:

```ts
// apps/api/src/createApp.ts
export const createApp = () => { … }
export type AppType = ReturnType<typeof createApp>
```

The composition root lives at `apps/api/src/createApp.ts` (see #10). The web imports `AppType` type-only (through the `api/*` alias, erased at build) and calls the API through `hc<AppType>` from `hono/client`. The test harness is the exception: it imports runtime values (`createApp`) through the same alias to mount the API in-process. Input types come from the `zValidator` schemas, output types from `c.json()` — no hand-written client, no shared package. better-auth keeps its own client (`authClient`, in `features/session/api/auth.client.ts`). API errors are not inferred by `hc`: a thin wrapper reads `res.json()` and throws, keeping the `throw` contract components expect.

## API

Folders by vocabulary (`groups`, `expenses`, `services`, `paybacks`, …), plus `shared/` for everything shared between vocabularies. Entry points sit at the `src/` root, like NestJS `main.ts`. This is the post-retrofit target tree (today the API still has French-named leftovers — the retrofit ticket #10 moves them):

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

- Every file carries its role suffix (table in `CODING_STANDARDS.md`). No per-role subfolders: the layer folder says the layer, the suffix says the role.
- Every folder exposes an `index.ts` barrel. Imports cross folders through the barrel, never a member file. Within a vocabulary, layers import each other with a single relative `../` through the target layer's barrel (`import { groupCreate } from '../domain'`), never the `~/<vocabulary>` alias; siblings import relatively (`./`). Cross-vocabulary imports go through the alias barrel (`~/expenses/domain`, `~/shared/application`).

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
  components/ui/    shared form primitives (Input, Button, FormWrapper, Select, Alert)
  components/icons/ shared icon set — one `*Icon` component per file (UpIcon, PlusIcon, BackIcon…)
  lib/              shared seams: http client, amounts, router, errorMessage
  types/  utils/  config/  styles/  assets/  layouts/
```

### Dependency boundaries

The import architecture keeps layers apart by folder. Elements: **shared** (`src/lib/*`, `src/components/ui/*`, `src/components/icons/*`, `src/types/*`, `src/utils/*`, `src/layouts/*`, `src/config/*`), **feature** (`src/features/*`), **pages** (`src/pages/*`). Rules: `shared → shared`, `feature → shared | feature`, `pages → shared | feature | pages`.

Every feature exposes a single public entry point — `~features/groups`, `~features/expenses`, … — that re-exports its components, its API client and its contract types (`import { GroupsList, groupsClient, type Group } from '~features/groups'`). Consumers (pages, other features) import from the feature root, never from `~features/<name>/components` or `~features/<name>/api`. Contract types (the API response shapes and client interfaces, e.g. `Group`, `GroupSummary`, `GroupsClient`) live in `features/<name>/types/*.types.ts` and are re-exported by the feature entry point. Within a feature, files import each other through relative internal paths (`../components`, `../api`, `../types`), never the `~features/<name>` alias.

Icons are shared UI but do **not** live in `components/ui/` (form primitives only) and are **not** a feature. They sit at `components/icons/` as one `*Icon` component per file, decorative (`aria-hidden`), re-exported through the folder barrel (`components/icons/index.ts`) and imported from it — `import { TrashIcon } from '~/components/icons'`, never from a component file.

Routing is a Hono app in the browser: routes declared with `app.get('/groups/:id', c => …)`, dispatched via `app.fetch(new Request(location.pathname))`, history API + `Link` in the React layer. Stores are nanostores (`$atom` + actions).

Forms are react-hook-form + zodResolver on three roles, one file each:

1. **Schema** — zod v4 colocated with the feature (`features/<name>/schemas/*.schema.ts`, barrel `index.ts`). Validates shape and trims; messages are French UI strings mirroring the API's domain rule (e.g. `'Nom du Groupe requis'`). The schema's inferred form-input type (`z.infer<…>`, e.g. `CreateGroupInput`) colocates with the schema; it is not an API contract type and does not ride the `types/` barrel.
2. **Container** — owns `useForm` wired to the schema through `zodResolver`, the submit handler, and the API-error state; renders the pure form. `CreateGroupForm` is the exemplar.
3. **Pure presentation** — the form component; receives the `form` instance and the submit handler as props, renders French-labelled fields through the shared `FormWrapper`/`Input` primitives with `noValidate` (RHF owns validation). `CreateGroupFields` is the exemplar.

`GroupsScreen.tsx` holding every form is the shape we leave: when the Groups screen lands, the container role moves to the screen and `CreateGroupForm` becomes the pure-presentation form. `components/` + `api/` are always present; `hooks/`, `schemas/`, `store/`, `types/`, `utils/` appear as the feature needs them.

## Tests

Four layers, all kept:

1. **Domain** — pure functions.
2. **HTTP** — in-process Hono, session cookie, the API contract.
3. **React Testing Library** — component behaviour against the real API in-process (`hc<AppType>('', { fetch: app.request.bind(app) })`), no fake client.
4. **Playwright** — real browser + real API. This is the layer that catches an API 4xx shown as a browser 500. Specs live in `apps/web/e2e/` and run via `vp run test:e2e` (boots web + API through the web start plugin).

The spec file is the source file name plus `.spec`: `amount.vo.ts` → `amount.vo.spec.ts`, `expenses.routes.ts` → `expenses.routes.spec.ts`, `GroupPage.tsx` → `GroupPage.spec.tsx`. One file, one spec.

Exempt from a colocated spec: `index.ts` barrels, `main.ts` / `main.tsx` entries, `vite-env.d.ts`, configs, and pure type modules with no runtime behaviour (`*.types.ts`, `*.dto.ts`, `*.port.ts`, `*.repository.ts` — contract shapes, DTOs and auth/persistence ports). An adapter (`*.adapter.ts`, `*.client.ts`) spec covers the port it implements.

Arrange / Act / Assert separated by a blank line. New specs use `describe` / `it`. Existing `test()` dies on the retrofit ticket. No browser suite as the _only_ contract: HTTP stays.

## Names

- Folders kebab-case.
- Component files PascalCase (`GroupPage.tsx`); exported type identifiers PascalCase (`Group`, `GroupSummary`); module files camelCase + role suffix. PascalCase is never a function file.
- Function modules camelCase with a role suffix when the role exists.
- The spec file is the source file name plus `.spec`: `amount.vo.ts` → `amount.vo.spec.ts`, `expenses.routes.ts` → `expenses.routes.spec.ts`, `GroupPage.tsx` → `GroupPage.spec.tsx`. One file, one spec.
  Exempt from a colocated spec: `index.ts` barrels, `main.ts` / `main.tsx` entries, `vite-env.d.ts`, configs, and pure type modules with no runtime behaviour (`*.types.ts`, `*.dto.ts`, `*.port.ts`, `*.repository.ts` — contract shapes, DTOs and auth/persistence ports). An adapter (`*.adapter.ts`, `*.client.ts`) spec covers the port it implements.
- Aliases: `~`, `~ui`, `~features`, `api/*`. Imports carry no extension.
- Identifiers: `CONTEXT.md` English. No accents.

Oxfmt formats. Do not hand-restyle.
