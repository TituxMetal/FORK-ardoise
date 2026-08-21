# Naming, structure and tests

The retrofit copied a NestJS-shaped style onto a Hono app: PascalCase files, `I` prefixes, `.uc`/`.entity`/`.repository` suffixes, one spec for fifteen files. This ADR records the conventions the grilling settled, replacing the Style section of the parent spec.

## Naming

PascalCase is for React components and exported types. A function file is camelCase. There are no classes, so no file is named like a class.

Every non-barrel file in `apps/api/src` carries a role suffix — the table lives in `CODING_STANDARDS.md` (`.entity`, `.vo`, `.rule`, `.repository`, `.adapter`, `.uc`, `.dto`, `.mapper`, `.routes`, `.middleware`, `.filter`, `.client`, `.port`, `index.ts`). The layer folder says the layer, the suffix says the role; no per-role subfolders.

Web function modules carry a role suffix when the role exists (`groups.client.ts`, `auth.schema.ts`); components and types stay PascalCase.

## Structure

API: `main.ts` + `createApp.ts` at the `src/` root, vocabularies (`groups`, `expenses`, `services`, `paybacks`) each with `domain/` `application/` `infrastructure/` `presentation/`, and `shared/` mirroring those layers for everything shared.

Web: root mirror — `pages/`, `features/<name>/` (with `components/` + `api/` always, other roles as needed, never empty folders), `components/ui/`, `lib/`, `types/`, `utils/`, `config/`, `styles/`, `assets/`, `layouts/`.

## Contract

The api↔web seam is the typed Hono route table: `AppType = ReturnType<typeof createApp>` in the API, imported type-only by the web through the `api/*` alias, consumed via `hc<AppType>` from `hono/client`. No hand-written client, no shared package. better-auth keeps its own client.

## Tests

One file, one colocated spec. A module testable in isolation has its `*.spec.ts` / `*.spec.tsx` next to it; barrels, entries and configs are exempt. Tests are structured Arrange / Act / Assert separated by a blank line, no comments. The closing sweep greps for source files without a sibling spec.

Aliases `~`, `~ui`, `~features` and `api/*` replace relative chains; imports carry no extension.
