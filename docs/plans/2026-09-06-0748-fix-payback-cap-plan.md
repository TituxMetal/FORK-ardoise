---
title: Payback Amount Cap in Web Forms - Plan
type: fix
date: 2026-09-06
topic: payback-cap
artifact_contract: ce-unified-plan/v1
artifact_readiness: requirements-only
product_contract_source: ce-brainstorm
execution: code
---

# Payback Amount Cap in Web Forms - Plan

## Goal Capsule

- **Objective**: a Member who types a Payback Amount above the displayed cap in the web create or edit form sees an inline French error mirroring the server rule, and no over-cap Payback is submitted from the web client.
- **Product authority**: the server remains the sole authority on domain rules; this change only mirrors the cap rule in the web forms that already display it.
- **Open blockers**: none.

## Product Contract

### Summary

The payback forms compute and show an exact cap (`Plafond X €`) yet accept any positive Amount; over-cap figures fail only on a server round trip. This plan makes the forms reject over-cap Amounts before submit, using the cap of the current debtor/creditor selection, with the server's own French message.

### Problem Frame

A Member repaying a debt sees the ceiling the form itself displays, types past it, and gets no local feedback: the Amount field validates only positivity (`eurosAmountSchema`), so the figure submits and bounces with the server error `PAYBACK_ABOVE_CAP` (`Montant au-dessus du plafond`, apps/api/src/paybacks/domain/payback.entity.ts:12,37) after a round trip. The cap is derived from the current Balances and debtor/creditor selection (apps/web/src/features/paybacks/components/PaybackForm.tsx:40), so the form already holds the exact figure it fails to enforce.

### Key Decisions

- **Enforce the cap in the per-form zod schema, threaded with the current cap.** The schema is module-static today; the cap is dynamic, so validation receives the cap derived from the effective selection at submit time. _Governs R1, R2._
- **Mirror the server message verbatim.** The inline error is `Montant au-dessus du plafond`, the same string the API returns, so both surfaces speak one message. _Governs R1._
- **Both forms, one change.** Create and edit forms already share `PaybackFields` and each project the cap; the fix lands on the shared surface. _Governs R1._

### Requirements

- R1. In the payback create and edit forms, an Amount above the cap of the current debtor/creditor selection is rejected before submit with the inline error `Montant au-dessus du plafond`.
- R2. The validation cap is derived from the effective selection at submit time — a changed debtor or creditor never leaves a stale cap in force.
- R3. The server rule is untouched: the API stays the authority, and the web cap never exceeds the server's.

### Key Flows

- **F1 — Over-cap Amount in the create form.** **Covers R1.** The Member opens the create payback form, keeps the default debtor/creditor, and types an Amount above the displayed cap. Submitting shows `Montant au-dessus du plafond` under the Amount field; no request is sent.
- **F2 — Selection change shrinks the cap.** **Covers R2.** An Amount valid for the first debtor/creditor pair becomes invalid when the Member picks a creditor whose remaining credit is lower. Submitting after the change rejects the Amount with the same inline error.

### Acceptance Examples

- **AE1.** **Covers R1.** Group where the self owes 50,00 € to Alice: Amount `60` → inline `Montant au-dessus du plafond`, no submit; Amount `50` submits.
- **AE2.** **Covers R2.** Amount `60` valid while Bob is the debtor; switching the debtor to one with a 30,00 € debt makes the same Amount fail with the inline error on submit.

### Scope Boundaries

- The server payback validation and its error codes are untouched.
- Other fields (day shape, debtor/creditor membership) keep their current validation.
- Live re-validation of the Amount while typing is out of scope; validation runs at submit against the current selection.
- Services and Expenses forms are out of scope.

### Dependencies / Assumptions

- The cap projection (`paybackCap` + creditor/debtor lists) already rendered in both forms stays the source the validation derives from.
- Tests follow the repo's existing per-feature spec conventions (`*.spec.ts` beside sources).

### Outstanding Questions

- None. (Deferred to Planning: exact display timing of the error when a selection change invalidates a previously valid Amount — submit-time only is assumed per Scope Boundaries.)

### Sources / Research

- `apps/web/src/features/paybacks/schemas/createPayback.schema.ts` — Amount via `eurosAmountSchema` only (no cap).
- `apps/web/src/features/paybacks/components/PaybackFields.tsx:72` — `<p>Plafond {euros(cap)}</p>`.
- `apps/web/src/features/paybacks/components/PaybackForm.tsx:40`, `EditPaybackForm.tsx:43-50` — cap derivation per form.
- `apps/api/src/paybacks/domain/payback.entity.ts:12,37` — `PAYBACK_ABOVE_CAP = 'Montant au-dessus du plafond'`.
- `apps/web/src/lib/amounts.ts` — `eurosAmountSchema` (positive only).
