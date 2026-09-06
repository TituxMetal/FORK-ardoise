# French register is not constrained by the identifier avoid-lists

CONTEXT.md `## Language` `_Avoid_` words are a style rule for agent-authored English and identifiers: they stop French leaking into code, commits, issues, PRs, comments and the schema (ADR 0004). But the product UI is French-only, and several of its canonical visible nouns — Dépense, Règlement, Solde, Invitation, Groupe — are exactly words those lists `_Avoid_`. Because the code/UI boundary was never stated, the same word was treated as banned everywhere: copy drifted and got "corrected" ad hoc (`Créer un User`, «Mes groupes»/«Mes Groupes», the Payback tab sliding to «Remboursements» against the forms' «Règlement»).

We decided the `_Avoid_` lists constrain identifiers and agent-authored English only. They are not a French-UI vocabulary, so a French word may legitimately be the canonical UI string while banned as an identifier. CONTEXT.md stays the English/identifier glossary and does not enumerate UI nouns; the French nouns ratified for the public entry surfaces live here:

- **Groupe**, **Dépense**, **Service**, **Règlement** (canonical over «Remboursement»), **Solde**, **Invitation** — the domain concepts the About lexicon teaches.
- **Mes Groupes** — capitalised, in the list heading and the nav DESTINATIONS (was «Mes groupes»).
- **Créer un compte** / **Créer le compte** — the sign-up copy (was «Créer un/le User»); not a domain concept, so it does not enter the lexicon.

Consequence: the slate-tab relabel («Remboursements» → «Règlements», «Ajouter un Remboursement» → «Ajouter un Règlement») is pulled into the entry-flow scope so the lexicon and the screen agree. A single repo-wide French copy source is deferred.
