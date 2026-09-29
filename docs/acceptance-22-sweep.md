# Acceptance 22 / C7-NF-04 / C7-NF-05 — kept-in-view sweep

> **Superseded** by the independent run in verification/ui/report-2026-09-28.md
> (c7-ui-verifier, verification/ui/sweep.js, same date, later page build).
> The two agree on what matters — 0 violations in all 12 cases, 349 px
> maximum. Step counts and the no-flags height (144 px here, 146 px there)
> differ because the page changed between runs (the additivity sentence and the
> directed-rounding labels) and because this ad-hoc run counted the "No flags
> raised" line as a flag row where sweep.js counts only linked flag titles.
> This record is kept as the builder's first measurement.

Engine 0.1.0, development build (vite dev server), Chrome, 28 September 2026.
The page was loaded in an iframe of exactly **1366 × 650 CSS px** (C7-NF-06)
and scrolled from 0 to the bottom in 10 px steps. At every step where any
result-bearing element (`.figure`, `.result-flags li`, `.plan-summary`, the
derivation's relations and declarations, the open structured object) was
painted in the viewport, the kept-in-view block (`#kept-in-view`: declaration
summary and flag titles) was asserted to lie entirely within the viewport.
Elements inside a closed `<details>` are not painted and were excluded.

| Direction | Case | Flag rows | Steps with a result element on screen | Kept-in-view height, max | Violations |
|---|---|---|---|---|---|
| target | nine flags, set A — closed object | 9 | 298 | 349 px | 0 |
| target | nine flags, set B — closed object | 9 | 321 | 349 px | 0 |
| target | no flags (C7-FX-08) — closed object | 1 | 229 | 144 px | 0 |
| target | nine flags, set A — object open | 9 | 361 | 349 px | 0 |
| target | nine flags, set B — object open | 9 | 384 | 349 px | 0 |
| target | no flags — object open | 1 | 291 | 144 px | 0 |
| volume | nine flags, set A — closed object | 9 | 286 | 349 px | 0 |
| volume | nine flags, set B — closed object | 9 | 326 | 349 px | 0 |
| volume | no flags — closed object | 1 | 229 | 144 px | 0 |
| volume | nine flags, set A — object open | 9 | 349 | 349 px | 0 |
| volume | nine flags, set B — object open | 9 | 388 | 349 px | 0 |
| volume | no flags — object open | 1 | 292 | 144 px | 0 |

Set A: basis not recorded, provenance not recorded, conjugate not recorded,
carrier not recorded, no solids, capacity 0.1 mL, minimum 5000 µL, a C1 object
with one flag (FL-02, 04, 05, 06, 07, 09, 10, 12, 14). Set B: total vial
contents, nominal, conjugate (protein mass), carrier present, target 80 mg/mL,
same capacity, minimum and C1 object (FL-01, 03, 06, 07, 08, 09, 10, 11, 13).
Nine is the most flags that can co-occur: FL-01/02, 03/04, 05/08, 11/12 and
13/14 are each mutually exclusive.

**How it holds.** The derivation and the structured object sit inside the stock
panel, under the sticky block, and a trailing spacer the height of the block
ends the panel, so the last result line leaves the viewport before the block
is pushed off it. An earlier layout with the derivation in its own panel failed
this sweep; the fix was made in response.

To be re-run at the deployed address with acceptance 16, 17 and 25.
