# Decision — directed rounding of displayed bounds

| Field | Value |
|---|---|
| Applies to | C7 Reconstitution URS v1.0 |
| Decided | 28 September 2026, by A. Modi (tool owner) |
| Sign-off | **Behaviour signed: NADIRA, 29 September 2026, against engine 0.1.0 at localhost:5177.** The document, including the addendum, is not yet signed: NADIRA has not been able to read it (it is local to the build machine) |
| Amends | C7-UN-05, C7-UN-06, C7-IV-03's additivity bound, C7-FX-06's displayed figures |
| Origin | Independent spec audit, finding 7 (verification/spec-audit/audit-2026-09-28-full.md) |

## Why

Rounding half away from zero can put a displayed bound on the wrong side of the
bound it states. C7-FX-06's "at most 79.9680 mg/mL" is below its own unrounded
upper bound 79.9680128… mg/mL, so the figure shown is not an upper bound —
which defeats C7-DT-07's "at most", C7-ST-08, and CR-C3-01's reliance on the
bound surviving the handoff.

## What is decided

1. A concentration labelled **"at most"** (C7-DT-07 — Dapp = Dmin), and its
   molar form, is displayed to 6 significant figures rounded **up** (toward
   +∞) on the exact binary value.
2. A final volume labelled **"at least"** is displayed to 3 significant figures
   rounded **down** (toward zero) on the exact binary value.
3. Every other displayed quantity keeps C7-UN-06: half away from zero on the
   exact binary value. That includes the diluent (C7-IV-03), achieved and
   obtained concentrations, uncorrected concentrations, D, Dmin and every
   fraction and percentage.
4. The precision itself is unchanged: 6 sf for an upper-bound concentration
   (A. Modi, 28 September 2026) and 3 sf for volumes.
5. C7-IV-03's additivity bound, where the final volume is rounded down, becomes
   |Vd′ + displayed D − displayed final| ≤ one unit of the final volume's place
   plus half a unit of the displacement's place.
6. The unrounded values in the structured object are unchanged; the object
   states each bound's rounding direction.

## Consequences for the fixtures

C7-FX-06 now displays: target direction, at most **79.9681** mg/mL, final at
least **1.00** mL; 1.00 mL entered, at most **75.5858** mg/mL (unchanged — its
unrounded bound 75.5857899… rounds up to the same figure), final at least
**1.05** mL; 0.942 mL entered, at most **79.9681** mg/mL; 1.0044 mg at 1 mg/mL,
at most **1.00367** mg/mL. All other fixtures are unaffected.

## Stated limit

The rounding is applied to the double that holds the bound, which may lie up
to one unit in its last place below the exact rational bound. Where the exact
bound lies within that one unit above a 6-sf grid point, the displayed figure
can fall one step short of it. This is the same one-ULP zone C7-FX-12 already
excludes from fixtures; it is disclosed in the register, not claimed away.

## For receiving tools

A tool receiving a C7 upper bound (CR-C3-01) keeps it a bound by rounding every
derived "at most" figure up, on the same terms; dividing a true upper bound by
a positive dilution factor leaves a true upper bound.

## Addendum, 29 September 2026 — the departure of a bound (build-test finding T2)

*Status: the builder's reading of this decision, pending the same sign-off
(NADIRA stated she would sign the decision against a build with T2 resolved).*

The departure displayed beside a target (C7-DT-07, C7-FX-17) is the reported
concentration ÷ target − 1, **taken on the unrounded values** (C7-UN-07), and
it is labelled so, as C7-DT-05 requires a ratio to name the quantities it is
the ratio of. Because it increases with the concentration, the departure of an
**"at most"** concentration is itself an upper bound: it is labelled "at most"
and displayed at 3 significant figures **rounded toward +∞** on the exact
binary value — away from zero when positive, toward zero when negative. Every
other departure keeps half away from zero.

C7-FX-06: target direction, **at most −0.0399 %** (unrounded −0.039984 %; half
away from zero gave −0.0400 %, below the bound); 1.0044 mg at 1 mg/mL, **at most
+0.367 %** (unrounded +0.36641 %). C7-FX-17, not a bound: +0.452 %, unchanged.
