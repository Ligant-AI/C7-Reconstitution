# Register audit trail

The tool page's register ("Constants, assumptions and conventions") shows each
row's value, basis and status. Who decided or signed each row, when, and the
open-item numbering it is tracked under are recorded here instead, so that the
public page carries no internal process language. The page's rows are rendered
from `src/ui/page-content.js` and `src/engine/constants.js`.

| Register row | Status on the page | Record |
|---|---|---|
| Partial specific volume, v̄ | characterised, signed | Signed NADIRA, 21 September 2026. Carried from the C3 review. |
| Partial specific volumes of excipients | open | Outstanding item 2 (URS §17): to be confirmed against Durchschlag's compilation. The assumption sentence on excipient volumes in the result object is the same item. |
| Material displacement threshold (C7-FL-08) | open: the value, until cited; the definition is signed | Value: outstanding item 1, the uncited ISO 8655-2 row; stays open. Definition signed NADIRA, 21 September 2026. |
| Round-trip tolerance (C7-IV-01) | open | Outstanding item 3, the tolerance derivation memo. |
| Unit-normalisation tolerance (C7-IV-04, C7-IV-05) | open | Outstanding item 3, the tolerance derivation memo. |
| Displayed precision, concentrations | disclosed, signed, including its extension to an upper bound | 6 significant figures signed NADIRA, 21 September 2026; extended to an upper bound by A. Modi, 28 September 2026. |
| Rounding of a displayed bound | disclosed, signed | Decided A. Modi, 28 September 2026 (spec/decision-2026-09-28-directed-rounding.md). Signed NADIRA, 8 October 2026, in the CSO scientific audit: she signs the rule for rounding a displayed bound (round an upper bound up, a lower bound down). Verified before marking: `roundDecDirected` in `src/engine/numfmt.js` rounds 'up' by incrementing the kept digits when any dropped digit is non-zero and 'down' by truncation, on the exact decimal expansion of the double; `src/engine/determine.js` applies 'up' to an "at most" concentration and its departure and 'down' to an "at least" final volume. Pinned by `tests/bound-rounding.test.js`. |

The page's result-object paragraph refers to the unpublished shared format
version; that is outstanding item 8.

Rows not listed carry no sign-off or attribution.
