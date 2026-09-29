# C7 Reconstitution — developer handoff

| Field | Value |
|---|---|
| Specification | C7 Reconstitution URS **v1.0**, approved for development, 28 September 2026 |
| Status | Cleared to start. No outstanding item blocks the build |
| Prepared by | A. Modi, 28 September 2026 |
| Companion documents | Four C7 review records (specification history); CR-C3-01 and CR-C3-02 against C3; C1 URS v0.5; Ligant Brand Guidelines v1.1 |

---

## What this tool is

One relation — content, diluent volume, and the concentration of the solution that results — in two directions: a target concentration gives the volumes, or a stated volume gives the concentration. Everything else in the specification exists because the number on a vial does not say what it is the amount of.

## Build order

1. **The determination and its declarations** (§3, §5). The declarations are the point of the tool, not decoration: content basis, provenance, conjugate state, carrier presence, whole-vial confirmation, volume basis, direction. Nothing computes without them.
2. **Rounding and the two precisions** (§4, C7-IV-03). Read this before writing any display code. The diluent volume — the only number anyone physically delivers — is always rounded from its own unrounded value, and the achieved concentration is computed from that displayed diluent. Get this the wrong way round and every downstream number is subtly wrong while looking right.
3. **Reject and flag behaviour** (§7, §8), including the pairing table and its row order.
4. **The result object and handoff** (§13, §12). C7-OUT-04 enumerates every field the shared format must carry, including the upper-bound marker.
5. **The page** (§9, §11, §14): failure classes, the constants register, the privacy statement verbatim, and the shared chrome.

## Three constants are not yet cited — configure, don't hard-code

- **C7-FL-08's material threshold.** The definition is fixed (the tightest maximum permissible systematic error for the delivery act); the number follows a citation still to be entered. It is 13.7 mg/mL of total solids at 1 %, 11.0 at 0.8 %, 8.2 at 0.6 %. **Implement it as a configured constant** so the citation can change it without touching the engine.
- **The partial specific volume, 0.73 mL/g.** Cited and signed off; scoped to protein-dominated solids. Treat as a registered constant, never a user input.
- **Excipient partial specific volumes.** Not yet confirmed; they appear nowhere in the engine, only in the register's disclosure text once confirmed.

## Two tolerances do not exist yet

The round-trip and unit-normalisation bounds are being derived as a memo. They gate the tool page and the independent-reimplementation test, **not** the build. Write the invariance tests now with the tolerance as a single named constant per test, and fill the values when the memo lands. Every invariance test is evaluated on **unrounded** structured values.

## What the tests must do

- The fixture set is in §10 with its expected values. C7-FX-08 and C7-FX-17 are negative controls: they must raise **no flags**. A suite where something is always wrong with the input lets a spuriously flagging implementation pass.
- Every invariance test must be **shown capable of failing** — insert a clamp, a floor and a nudge, and demonstrate each is caught and exceeds the tolerance. Record that demonstration.
- An independent reimplementation in a second language must agree on the full fixture set, compared on unrounded values. Code review does not satisfy this.
- The environment claims (§14.1) are verified **against the deployed address**, with network monitoring started before page load — not against the build artefact.

## What is deliberately not in scope

No audit trail, no account, no server, no persistence that outlives the page. This is a research-use calculator: everything the user enters stays in their browser and ends when the page closes, and that claim is verified rather than asserted. The disclosure that does stay on the page — the constants register, the failure classes the tool cannot detect, and the declarations on every result — is there so a scientist can tell what a number rests on.

## Questions that have an owner, not an answer

If the shared result object turns out to have a field that cannot mean two things at once, **stop and escalate** rather than resolving it locally. Adding the fields listed in C7-OUT-04 is expected and is a versioned change to the format; a genuine conflict is not.

Publishing that format version, and confirming C1 (live) and C4 (deployed) still validate against it, is outstanding item 8 — owned by the developer with NADIRA. The engine can be built against C7-OUT-04's field list before the version is published; acceptance 4 is what waits on it.
