# Reconstitution

The volume of diluent to add to a vial for a target concentration, or the
concentration a stated volume gives — correct for what the number on the vial
is the amount of, and for the volume the dry solids occupy.

A free bench tool from [Ligant](https://ligant.ai), part of Ligant Bench Tools
(tool C7, URS v1.0). It runs entirely in your browser and loads nothing from
outside its own address.

## Why this exists

A vial holding 1 mg, targeted at 1 mg/mL, takes 1 mL. The arithmetic is
trivial; what is not is what the number on the vial refers to and what else is
in the vial. An antibody labelled "1 mg total protein" and stabilised with BSA
holds a fraction of that as antibody. A carrier-formulated cytokine reads far
above its computed concentration in a protein assay. Dry solute occupies
volume, so 1 mL of diluent on 100 mg of protein is not 1 mL of solution. None
of this is visible in the resulting number, so the tool asks for each and
records it in the result, the notebook copy and the structured object.

## Method

Declarations, none defaulted: direction; stated content and unit (mass or IU/U);
what the content is the content of; its source; conjugate state (mass content);
carrier presence; whole-vial confirmation; which volume is meant; the minimum
reliable transfer volume (2 µL pre-filled, marked as a suggestion). Optional:
total solids mass, vial working capacity, a C1 molecular weight for a molar
target.

- D = solids × v̄ (v̄ = 0.73 mL/g). Without solids, reagent-alone mass content is
  corrected by Dmin = content × v̄ only, and the concentration is reported
  **at most**; activity content and basis-not-recorded are uncorrected.
- The diluent is rounded to 3 sf from its own value; Fa = Vd′ + D (unrounded);
  Ca = content ÷ Fa, shown to 6 sf beside the target.
- Constants, assumptions, failure classes and the privacy statement are on the
  page. src/engine/constants.js holds every configured value — including the
  C7-FL-08 threshold, a provisional 0.6 % until ISO 8655-2 is cited.

## Running it

```
npm install
npm run dev          # http://localhost:5177
npm test             # engine, invariance, mutation and Python reimplementation tests
npm run build        # dist/, relative base, deployable under /reconstitution/
npm run fixture-record    # regenerates docs/fixture-record.md (C7-FX-12)
npm run mutation-record   # regenerates docs/iv-02-mutation-record.md (C7-IV-02)
```

Requires Node 22+ and, for the reimplementation test, Python 3.9+.

## Status

Engine 0.1.2, pre-release. Outstanding before public release (URS §17): the
tolerance derivation memo (the three tolerance-gated tests skip, stating their
measured discrepancy — 0 on the current cases), the ISO 8655-2 citation, the
excipient v̄ values, the shared format version, and the deployed-address
verifications (acceptances 16, 17, 25). The molar path (acceptance 11, C7-FX-09)
is exercised only with synthetic C1 objects and is not discharged until C1 emits
a transport envelope. Findings raised in build are in
docs/spec-findings.md.

## Independent verification

Eight Claude Code subagents in `.claude/agents/` produce evidence independently
of the builder — spec audit, independent fixtures, a clean-room second
implementation, black-box adversarial testing, browser UI checks, deployed-address
privacy checks, cross-tool contracts, and an evidence ledger. See
verification/README.md.

## Records

- docs/fixture-record.md — every §10 fixture, its construction, and the distance
  from each displayed value to its nearest tie (C7-FX-12).
- docs/iv-02-mutation-record.md — clamp, floor and nudge caught by each
  invariance measure (C7-IV-02).
- docs/acceptance-22-sweep.md — kept-in-view sweep at 1366 × 650 (C7-NF-04/05).
- docs/spec-findings.md, docs/escalation-tool-field.md — raised in build.

The Python reimplementation (reimpl/) agrees bit-exactly with the engine on
unrounded values, and on status, rejection and flag codes, labels and displayed
strings, over 58 cases. It was written by the same author in the same session
and follows the engine's operation order by design; whether that satisfies
acceptance 3's "independent" is for the specification owner to decide.

## Licence

Apache License 2.0. Research use only, not qualified for GxP decision-making.
