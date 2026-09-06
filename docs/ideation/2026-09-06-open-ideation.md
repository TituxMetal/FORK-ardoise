# Ideation: open product scan of the slate surfaces (2026-09-06)

- **Run**: `orchestrator ideate` (ce-ideate), sandbox repo TituxMetal/FORK-ardoise
- **Focus**: open (subject question left unanswered by the human; surprise-me path, grounded in the repo)
- **Mode**: repo-grounded; grounding by one read-only scout over the groups/paybacks/expenses seams; lead candidate verified directly against the code by the orchestrator
- **Filtering**: orchestrator-only arbitration (fresh-context verifier not dispatched — degraded run, noted); 1 candidate rejected, 1 kept as brainstorm variant
- **Artifact contract**: ranked ideas with basis, rejection summary; no requirements, no plans, no code

## Grounding Context

Ardoise = expenses, services and paybacks between friends, organised in Groups (CONTEXT.md vocabulary). Web app (React + nanostores, features per aggregate, shared slate surface `SlateEntryList` + `SlateEntryFields`, `lib/amounts` euros helpers, French UI strings, EN identifiers) and Hono API (hexagonal; server is the authority on domain rules). The three slate kinds (Expense/Service/Payback) reuse the shared row surface; Payback alone carries a derived `cap` projection and its own fields.

## Topic Axes

- **A. Form validation mirrors server authority** (client schemas vs domain rules)
- **B. Balance/zero semantics** (hero and member chips signalling)
- **C. Voice and accessibility register** (visible copy vs a11y labels)

## Ranked Ideas

### 1. Pay the Payback Amount cap client-side — Axis A · Confidence High · Cost S

The create and edit payback forms advertise the exact ceiling (`<p>Plafond {euros(cap)}</p>`, PaybackFields.tsx:72, cap derived in PaybackForm.tsx:40 / EditPaybackForm.tsx:43-50) yet validate the amount only through `eurosAmountSchema` (positive, no max — createPayback.schema.ts:15). An over-cap figure passes the form and surfaces only as a server round-trip error (`PAYBACK_ABOVE_CAP = 'Montant au-dessus du plafond'`, apps/api/src/paybacks/domain/payback.entity.ts:12,37).

- **Why it matters**: the form shows a user a ceiling it then lets them cross; the failure arrives late, as a generic submit error, with no inline guidance.
- **Vertical slice**: web payback schemas gain a cap-aware refinement (the cap is dynamic — it follows the debtor/creditor Balances selection), French inline error mirroring the server message, form wiring in PaybackFields + specs; the server stays the authority.
- **Tradeoffs**: the schema needs the cap threaded in (currently module-static zod); cap changes with debtor/creditor choices, so the error must re-validate on selection change.

### 2. Reject impossible calendar dates client-side — Axis A · Confidence High · Cost S

Expense/Service/Payback forms hand-type `YYYY-MM-DD`; the web schemas check only the shape (`/^\d{4}-\d{2}-\d{2}$/`, 'Jour requis'), while the API's `day.vo.ts` rejects impossible dates (2026-02-31) via a Date.UTC round-trip. A non-existent date passes local validation and fails only post-submit.

- **Vertical slice**: shared day validity in `lib` reused by the three schemas + specs.
- **Tradeoffs**: `input[type=date]` would change the interaction; a validator keeps the current field.

## Rejection Summary

- **Zero Balance rendered as "owed to you"** (`selfBalanceLabel` cents>=0 → 'On te doit 0,00 €', BalanceHero UpIcon) — rejected: the wording is deliberate and spec-tested (`balance.spec.ts` 'shows a zero Balance as owed to the self'); changing it un-pins a tested product decision this run has no mandate to revisit.
- **Hero aria-label register ("Votre solde" vs "Ton solde")** — rejected: micro-fix; correctly pairs with a hero change (idea 3 above), not a unit of its own. Axis C left with zero survivors — deliberate gap.

## Checked but not gaps (do not re-propose)

- Service/day detail line: all three kinds render `{author} · {day}` consistently.
- EUR formatting of negatives/zero: consistent; only the zero _semantics_ (above) is debatable.
- Layering/barrels/architecture: out of scope for product ideation.
