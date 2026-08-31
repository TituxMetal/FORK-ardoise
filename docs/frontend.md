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
- Auth: sign-in and sign-up are the two tabs of one card (`SessionForms`, ARIA tablist/tab/tabpanel), sign-up first; the two forms are never stacked.

A design-system baseline is in: the warm-dark palette as Tailwind `@theme` tokens in `index.css` (`bg-surface`, `text-dim`, `text-negative`, `bg-accent`, …), a shared icon set (`components/icons/*Icon`), and interaction ergonomics (focus-visible ring, pointer cursor, ≥44px targets). Conventions to keep: colours come from tokens, never inline values; icons are decorative (`aria-hidden`) and imported from the `components/icons` barrel (`~/components/icons`), never from a component file; field errors render via `FormWrapper` with `aria-invalid` + a French `role="alert"` message. Type and further shared widgets stay ticket-driven when a prototype asks for them.
