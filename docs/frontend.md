# Frontend

Dark theme only. Light theme is a defect.

## When look is decided

- Journey, wording, who does what: `/grill-with-docs` on the feature.
- Layout, density, variants you have to _see_: `/prototype` UI branch, then fold the verdict into the ticket.
- `/implement` does not invent a look, a theme, or a new screen structure.

## Constraints already decided

- Visible strings: French. Identifiers behind them: English (`CONTEXT.md`).
- Amounts display as euros (`12,50 €`); storage is cents.
- Pages + features + routes. Not one file for every form. A page is a page; a feature owns its components.

A design-system ticket (tokens, type, shared widgets) is not a blocker for the retrofit. Add it when a prototype says we need one.
