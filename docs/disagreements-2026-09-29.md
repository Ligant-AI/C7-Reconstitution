# The 8 clean-room disagreements — for the specification owner's ruling

29 September 2026. Clean room (`verification/cleanroom/impl.py`, protocol 2,
no exception fallback) against engine 0.1.0, 945 in-protocol cases of
`verification/cases.json`; 0 implementation errors. Reproduce with
`node verification/compare.mjs --cmd "python3 verification/cleanroom/impl.py"`
(report: `verification/cleanroom/comparison.md`).

**The "builder's reading" column is a proposal, not a classification.** Whether
each is an edge case or an engine error is the specification owner's call.
Every case lies outside physically meaningful reconstitution, but that is also
the builder's reading and is not assumed below.

| # | Case | Input | Engine | Clean room | Exact check | Builder's reading (proposal) |
|---|---|---|---|---|---|---|
| 1 | ADV-BND-HI08-DIL-0 | volume → conc; 1 mg reagent alone; solids 1 000 000 mg; diluent 0.000001 mL | result; FL-07, FL-08; 0.00136986 mg/mL; FL-08 factor **730 000 001** | same, but FL-08 factor **730 000 006.87** | exact 1 ÷ (1 − f) = F ÷ Vd′ = 7.300000010 × 10⁸; engine rel. error 4.5 × 10⁻¹⁷, clean room 8.0 × 10⁻⁹ | The clean room's literal 1 ÷ (1 − f) loses digits as f → 1; engine evaluates the same relation as F ÷ Vd′. Suggest the URS state the evaluated form for C7-FL-08 |
| 2 | ADV-BND-HI08-DIL-1 | as 1, solids 10⁹ mg, diluent 10⁻⁹ mL | factor **7.30 × 10¹⁴** (displays "730000000000000") | factor **6.93 × 10¹⁴** ("693000000000000") | exact 7.300000000 × 10¹⁴; engine rel. error 6.2 × 10⁻¹⁷, clean room **5.1 × 10⁻²** | as 1 |
| 3 | ADV-HOST-VOL-1e-300-DIL | volume → conc; 80 mg reagent alone; solids 100 mg; diluent 10⁻³⁰⁰ mL | result; FL-07, FL-08; 1095.89 mg/mL; factor 7.3 × 10²⁹⁸ | not-representable (its 1 − f is 0 in binary) | exact factor = (10⁻³⁰⁰ + 0.073) ÷ 10⁻³⁰⁰ ≈ 7.3 × 10²⁹⁸, a finite double | as 1: the quantity is representable; the clean room's form cannot reach it. Related open question: C7-HI-08 "cannot fire with a diluent entered" vs binary F = Vd′ + D = D (spec-findings item 12) |
| 4 | ADV-HOST-SOL-1e300 | volume → conc; 80 mg reagent alone; solids 10³⁰⁰ mg; diluent 1.00 mL | result; FL-08; 1.09589 × 10⁻²⁹⁸ mg/mL displayed in full decimal (no exponent, PROTOCOL convention 4); factor 7.3 × 10²⁹⁶ | not-representable | exact factor ≈ 7.3 × 10²⁹⁶, a finite double | as 3 |
| 5 | ADV-BND-HI07-DEC-BELOW | target → volumes; 1 mg reagent alone; solids **0.99999999999999999999** mg; target 8 mg/mL | rejected C7-HI-07 | result (flags none, 8.01732 mg/mL) | as decimals, solids < content (HI-07's condition holds); as doubles both are 1.0 (it does not) | Engine evaluates §7 on the stated decimals ("less than the stated reagent content"); the clean room on their doubles. Needs a ruling on which the URS means |
| 6 | ADV-HOST-UNDERFLOW-STR | target → volumes; content **1e-400** mg; target 8 mg/mL | not-representable (C7-HI-10) | rejected C7-HI-01 | the stated content is positive; its double is 0 | Same question as 5: C7-HI-01's "stated content ≤ 0" on the decimal (false) or on the double (true) |
| 7 | ADV-HOST-OVERFLOW-STR | target → volumes; content **1e400** mg; solids 100 mg; target 8 mg/mL | rejected C7-HI-07 (100 mg < 10⁴⁰⁰ mg as decimals) | not-representable | both readings are defensible: HI-07 is decidable on the decimals; the content itself is not a double | Precedence: does a §7 rejection decidable on the stated values come before C7-HI-10? The engine says yes |
| 8 | ADV-UNSPEC-NR-WITH-SOLIDS | target → volumes; 1 mg, **basis not recorded**; solids 5 mg; target 1 mg/mL | result; FL-02, FL-05; displacement not computable, uncorrected; 1.00000 mg/mL | result; FL-02 only; displacement computed from the 5 mg; 1.00035 mg/mL | — | C7-VC-06 offers solids only for the reagent alone (engine; the page hides the field under "not recorded"); C7-DT-03 computes D "where the total solids mass is known" (clean room). Not reachable from the page. spec-findings item 9 |

## For the ruling

- Cases 1–4: one question — may the URS state C7-FL-08's evaluated form
  (F ÷ Vd′, D ÷ Vd′), as it does for C7-HI-08? If the literal 1 ÷ (1 − f) is
  meant, the engine's value is still the exact value of that relation.
- Cases 5–7: one question — are §7's value conditions evaluated on the stated
  decimals or on their doubles, and does a stated-value rejection precede
  C7-HI-10?
- Case 8: may a solids mass be declared, and is it used, under "not recorded"?
