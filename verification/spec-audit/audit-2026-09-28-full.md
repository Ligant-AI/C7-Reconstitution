# C7 specification audit — full, 2026-09-28

**Documents audited:** `spec/reconstitution-urs-v1.0.md` (URS), `spec/c7-developer-handoff.md` (handoff), `spec/cr-c3-bound-and-activity.md` (CR). The implementation was not read.
**Scope:** URS v1.0 as written. No new features or requirements are proposed. The report lists errors, inconsistencies, ambiguities and unverifiable claims in what is already specified.
**Owner of every disagreement:** A. Modi / NADIRA. None is resolved here by choosing the answer that looks intended.

**Method.**
- **Arithmetic.** Python `decimal`, precision 60. Every figure is derived from the relation the specification states for it, never from a neighbouring figure.
- **Display rule** (C7-UN-06): half away from zero, applied to `Decimal(float(x))`, at the stated significant figures:
  - volumes 3 sf (C7-UN-04)
  - concentrations 6 sf (C7-UN-05)
  - fractions and percentages 3 sf (C7-UN-09)
  - v̄ = 0.73 mL/g (§11)
- **Two paths per figure.** (a) The exact decimal result, taken to its nearest double. (b) The native IEEE-754 float chain, evaluated in the order the specification writes it. **The two paths agree at the displayed precision for every figure.** Both are printed in the script output.

**Reproduce.** Run `python3 verification/spec-audit/recompute-2026-09-28-full.py`. The output is saved beside it as `recompute-2026-09-28-full.out.txt`. The targeted search behind Finding 3 is `search-d6-2026-09-28.py`. The full script is independent of the smoke script: nothing is imported from it. Every smoke finding was recomputed from scratch.

**Relation to the smoke audit** (`audit-2026-09-28-smoke.md`). All six smoke findings were re-verified. Findings 1, 3, 4, 5 and 6 are confirmed. Finding 2 is now settled at full scope, as Finding 6 below. Smoke rows 1–39 are all re-checked below.

---

## 1. Figures checked

"Exact" is the exact decimal value of the relation, truncated with "…". "Displayed" is that value after the display rule. The stated precision column is used for the verdict. Where the spec states a figure at another precision, the verdict compares the values and a precision finding is cited.

### 1a. Computed by the script (rows 1–85)

| # | Location | Relation | Exact | Displayed | Spec states | Verdict |
|---|---|---|---|---|---|---|
| 1 | §0.1 | F = 10⁶ IU ÷ 10⁴ IU/mL | 100 | 100 mL | 100 mL | agrees |
| 2 | §0.1 | F = 1 mg ÷ 1 mg/mL | 1 | 1.00 mL | 1 mL | agrees |
| 3 | §1 | F = 1 mg ÷ 1 mg/mL (displacement ignored) | 1 | 1.00 mL | "takes 1 mL" | agrees (see Finding 24) |
| 4 | §1 | C = 1 mg ÷ 1 mL (naive) | 1 | 1.00000 mg/mL | "is at 1 mg/mL" | agrees as naive arithmetic (Finding 24) |
| 5 | §0.3 | D ÷ F = 0.073 ÷ 1 | 0.073 | 7.3 % (2 sf) | 7.3 % | agrees |
| 6 | §0.3 | D ÷ Vd = 0.073 ÷ 0.927 | 0.0787486515… | 7.9 % (2 sf) | 7.9 % | agrees |
| 7 | C7-UN-04, §11 resolution | 0.005 ÷ 9.99 | 0.0500500500…% | 0.05 % | 0.05 % | agrees |
| 8 | C7-UN-04, §11 resolution | 0.005 ÷ 1.00 | 0.5 % | 0.5 % | 0.5 % | agrees |
| 9 | §5 *On C7-DT-07* | sup \|target ÷ Ca − 1\| from 3-sf diluent rounding (Vd → 1.005⁻, D → 0) | → 0.5 % (supremum, approached but not reached) | 0.5 % | "up to 0.5 %" | agrees |
| 10 | §6 additivity example | 9.93 + 0.0730 | 10.003 | 10.003 | 10.003 | agrees |
| 11 | §6 | displayed final for Fa = 9.93 + D, D ∈ [0.07295, 0.07305) | Fa ∈ [10.00295, 10.00305) | 10.0 | 10.0 | agrees |
| 12 | §6 | \|9.93 + 0.0730 − 10.0\| | 0.003 | 0.003 | 0.003 | agrees |
| 13 | §6 | 0.003 ≤ one unit of the coarsest place (places 0.01, 0.0001, 0.1) | 0.003 ≤ 0.1 | — | "inside one unit of 0.1" | agrees |
| 14 | §6 | supremum ½u(D) + ½u(F), approached but not reached | Rounding error on positives lies in (−½u, +½u]. The +½u end is attained; the −½u end is not | — | as stated | agrees |
| 15 | §7 *On C7-HI-08* | 1 ÷ v̄ | 1369.8630136986… mg/mL | 1.37 × 10³ | "about 1370" | agrees |
| 16 | §11 HI-08 row | 1 ÷ v̄ | 1369.8630136986… | 1.37 × 10³ | "≈ 1370" | agrees |
| 17 | C7-HI-08 target forms | D ≥ F ⇔ (solids ÷ F) ≥ 1/v̄; Dmin ≥ F ⇔ target ≥ 1/v̄ | algebraic identity | — | as stated | agrees |
| 18 | §7 *On C7-HI-08*; §11 row | "cannot fire at all when a diluent volume is entered", on computed values | fl(entered + D) = D when entered < ½ ULP(D). Example: D = 1.0, entered = 10⁻¹⁷ → F = 1.0, so D ≥ F is True | — | cannot fire | **DISAGREES** (Finding 16) |
| 19 | §8 C7-FL-08 | shortfall f ÷ (1 + f), f = 0.073 | 6.8033550792…% | 6.80 % | 6.80 % | agrees |
| 20 | §8 C7-FL-08 | overstatement f ÷ (1 − f), f = 0.073 | 7.8748651564…% | **7.87 %** | 7.88 % | **DISAGREES** (Finding 1) |
| 21 | §10 C7-FX-11 | shortfall f ÷ (1 + f) | 6.8033550792…% | 6.80 % | 6.80 % | agrees |
| 22 | §10 C7-FX-11 | overstatement f ÷ (1 − f) | 7.8748651564…% | **7.87 %** | 7.88 % | **DISAGREES** (Finding 1) |
| 23 | §5 notation; C7-FL-08 | content ÷ (F + D) = (content ÷ F) ÷ (1 + f); content ÷ Vd = (content ÷ F) ÷ (1 − f) | F + D = F(1 + f); Vd = F(1 − f) | — | as stated | agrees |
| 24 | C7-FX-05 | TS concentration = solids ÷ F | 100 | 100.000 mg/mL | 100 mg/mL | agrees |
| 25 | C7-FX-05 | F = 80 ÷ 80 | 1 | 1.00 mL | 1.000 mL | agrees in value (precision: Finding 17) |
| 26 | C7-FX-05 | D = 0.100 g × 0.73 | 0.073 | 0.0730 mL | 0.0730 mL | agrees |
| 27 | C7-FX-05 | f = D ÷ F | 7.3 % | 7.30 % | 7.30 % | agrees |
| 28 | C7-FX-05 | Vd′ = round₃(1 − 0.073) | 0.927 | 0.927 mL | 0.927 mL | agrees |
| 29 | C7-FX-05 | Fa = 0.927 + 0.073 | 1 | 1.00 mL | 1.000 mL | agrees in value (precision: Finding 17) |
| 30 | C7-FX-05 | shortfall f ÷ (1 + f) | 6.8033550792…% | 6.80 % | 6.80 % | agrees |
| 31 | C7-FX-05 | Ca = 80 ÷ 1.000 | 80 | 80.0000 mg/mL | 80.0000 | agrees |
| 32 | C7-FX-05 | additivity \|0.927 + 0.0730 − 1.00\| ≤ 0.01 | 0 | — | "holds" | agrees |
| 33 | C7-FX-05 | diluent smaller than content ÷ target by D | 1 − 0.927 = 0.073 | — | as stated | agrees |
| 34 | C7-FX-06 | Dmin = 0.080 g × 0.73 | 0.0584 | 0.0584 mL | 0.0584 mL | agrees |
| 35 | C7-FX-06 | Vd′ = round₃(1 − 0.0584) | 0.9416 | 0.942 mL | 0.942 mL | agrees |
| 36 | C7-FX-06 | at most 80 ÷ (0.942 + 0.0584) | 79.968012794882… | 79.9680 | 79.9680 | agrees (bound direction: Finding 7) |
| 37 | C7-FX-06 | fmin = v̄ × content ÷ F | 5.84 % | 5.84 % | 5.84 % | agrees |
| 38 | C7-FX-06 | fmin exceeds every candidate threshold (0.6/0.8/1 %) | 5.84 > 1 | — | "exceeding" | agrees |
| 39 | C7-FX-06 | 1.00 mL entered: 80 ÷ 1.0584 | 75.585789871504… | 75.5858 | 75.5858 | agrees |
| 40 | C7-FX-06 | 1.00 mL entered: fmin = 0.0584 ÷ 1.0584 | 5.5177626606…% | 5.52 % | 5.52 % | agrees |
| 41 | C7-FX-06 | 0.942 mL entered: 80 ÷ 1.0004 | 79.968012794882… | 79.9680 | 79.9680 | agrees |
| 42 | C7-FX-06 | 1.0044 mg case: round₃(1.0044 − 0.000733212) | 1.003666788 | 1.00 mL | 1.00 mL | agrees |
| 43 | C7-FX-06 | 1.0044 mg diluent "rounds down" | 1.003666788 → 1.00 | — | rounds down | agrees |
| 44 | C7-FX-06 | 1.0044 mg case: at most 1.0044 ÷ 1.000733212 | 1.003664101436… | 1.00366 | 1.00366 | agrees (bound direction: Finding 7) |
| 45 | C7-FX-06 | unrounded diluent 1 − 0.0584 | 0.9416 | 0.941600 | 0.941600 mL | agrees |
| 46 | C7-FX-06 | gap 0.9416 − 0.9415 | 1.00 × 10⁻⁴; the double is 0.99999999999999254 × 10⁻⁴ above | 1.00 × 10⁻⁴ | 1.00 × 10⁻⁴ mL | agrees |
| 47 | C7-FX-06 | nearest 3-sf tie | 0.9415 | — | 0.9415 mL | agrees |
| 48 | C7-FX-17 | D = 1.2 mg × 0.73 mL/g | 0.000876 | 0.000876 mL | 0.000876 mL | agrees |
| 49 | C7-FX-17 | unrounded diluent 1.0054 − 0.000876 | 1.004524 | — | 1.004524 mL | agrees |
| 50 | C7-FX-17 | displayed diluent | 1.004524 | 1.00 mL | 1.00 mL | agrees |
| 51 | C7-FX-17 | Fa = 1.00 + 0.000876 | 1.000876 | (1.00 mL at 3 sf) | 1.000876 mL | agrees in value (label: Finding 17) |
| 52 | C7-FX-17 | nearest 3-sf tie to the diluent | 1.005 | — | 1.005 mL | agrees |
| 53 | C7-FX-17 | gap 1.005 − 1.004524 | 4.76 × 10⁻⁴ | 4.76 × 10⁻⁴ | 4.76 × 10⁻⁴ mL | agrees |
| 54 | C7-FX-17 | f = 0.000876 ÷ 1.0054 | 0.0871295006…% | 0.0871 % | 0.0871 % | agrees |
| 55 | C7-FX-17 | f below every candidate threshold | 0.0871 < 0.6 | — | below | agrees |
| 56 | C7-FX-17 | Ca = 1.0054 ÷ 1.000876 | 1.004520040444… | 1.00452 | 1.00452 | agrees |
| 57 | C7-FX-17 | target at 6 sf | 1 | 1.00000 | 1.00000 mg/mL | agrees |
| 58 | C7-FX-17 | departure Ca ÷ target − 1 | 0.4520040444…% | 0.452 % | +0.452 % | agrees |
| 59 | C7-FX-17 | "above target because the diluent rounds down" | 1.004524 → 1.00; Ca > 1 | — | as stated | agrees |
| 60 | C7-FX-17 | hand expression 1.0054 ÷ (1.00 + 1.2 × 0.73 × 10⁻³) | 1.004520040444… | 1.00452 | same | agrees |
| 61 | C7-FX-17 | no flag raised: every §8 condition false under the stated declarations | FL-01…FL-14 each false (no C1 import) | — | no flags | agrees |
| 62 | C7-FX-17 | additivity \|1.00 + 0.000876 − 1.00\| ≤ 0.01 | 0.000876 | — | (implied, acceptance 6) | agrees |
| 63 | §11 scope-error | ε = (0.73 − 0.3) × 0.1 g/mL | 4.30 % | 4.30 % | 4.30 % first-order | agrees |
| 64 | §11 scope-error | ε ÷ (1 − ε) | 4.4932079414…% | 4.49 % | 4.49 % exact | agrees |
| 65 | §11 scope-error | below 10 mg/mL, v̄ ≥ 0.3: ε ÷ (1 − ε) < 0.5 % | at 10 mg/mL: 0.430 % first-order, 0.432 % exact | — | under 0.5 % | agrees |
| 66 | §11 scope-error | ε exact as the fractional final-volume error, in both directions | final known: true final = F(1 − ε). Diluent known: true final = (Vd + 0.73 s)(1 − ε) | — | as stated | agrees |
| 67 | §11 scope-error; assumption 1 | volume crossover \|0.73 − v\| = v | 0.365 | 0.365 | 0.365 mL/g | agrees |
| 68 | §11 scope-error | concentration crossover at 1 mg/mL (every cell of the grid, Finding 8) | 0.36513322… | 0.365 | 0.365 | agrees |
| 69 | §11 scope-error | concentration crossover at 100 mg/mL, final known, excess measure true ÷ reported − 1 | 0.37830479823… | 0.378 | 0.378 | agrees **under this reading only** (Finding 8) |
| 70–72 | §11 threshold row | c = f ÷ v̄ at f = 1 %, 0.8 %, 0.6 % | 13.69863…, 10.95890…, 8.219178… | 13.7, 11.0, 8.22 (3 sf) / 8.2 (2 sf) | 13.7, 11.0, 8.2 | agree in value (precision: Finding 18) |
| 73–75 | §17 item 1 | same | same | same | 13.7, 11.0, 8.2 | agree in value (Finding 18) |
| 76–78 | handoff | same | same | same | 13.7, 11.0, 8.2 | agree in value (Finding 18) |
| 79 | §11 Dmin row | fmin = v̄ × 100 mg/mL | 7.3 % | 7.30 % (3 sf) | 7.3 % | agrees in value (precision: Finding 18) |
| 80 | §11 Dmin row | fmin = v̄ × 10 mg/mL | 0.73 % | 0.730 % | 0.73 % | agrees in value (Finding 18) |
| 81 | §11 Dmin row | fmin = v̄ × 13.7 mg/mL | 1.0001 % | 1.00 % | 1 % | agrees in value (Finding 18) |
| 82 | §5 / C7-FL-05 | fmin = v̄ × content ÷ F = v̄ × target in the target direction | F = content ÷ target | — | as stated | agrees |
| 83 | §11 assumption 3 | 0.70 ÷ 0.73 | 0.958904109… | 0.959 | 0.959 × Dmin | agrees |
| 84 | §11 assumption 3 | Dmin over the reagent's own displacement: 0.73 ÷ 0.70 − 1 | 4.2857…% (4.11 % if taken as 1 − 0.959) | ≈ 4 % | "up to ≈ 4 %" | agrees |
| 85 | §11 assumption 3 | over-correction (0.73 − 0.70) × 0.1 g/mL | 0.300 % of volume (0.301 % as a concentration excess) | ≈ 0.3 % | "about 0.3 % at 100 mg/mL" | agrees |

### 1b. Simulation, counts and cross-references (rows 86–114)

| # | Location | Relation / check | Result | Spec states | Verdict |
|---|---|---|---|---|---|
| 86 | §6 table, row 1 | worst ulp of the 6-sf Ca reconstructed from the final at 6 sf. Analytic: \|Δ\| < ½·m_C/m_F ulp ≤ 5 | sampled worst 5 (5 of 6 samplings; the sixth gave 4) | 5 | agrees |
| 87 | §6 table, row 2 | the same with the final at 7 sf. Analytic: < 0.5 ulp unrounded, so ≤ 1 rounded | sampled worst 1 | 1 | agrees |
| 88 | §6 table, row 3 | D at 6 sf, final = Vd′ + displayed D. Analytic: \|Δ\| < ½·f·m_C/m_D ulp, which can exceed 4 when f > 0.8 | sampled worst 3–4. **Targeted search inside the stated domain found 5 ulp** (content 9.22236 mg, target 89.5973 mg/mL, solids 14.93 × content, f = 97.7 %, TS 1337.7 mg/mL < 1369.86, so not rejected) | 4 | **DISAGREES** (Finding 3) |
| 89 | §6 *One final volume* | a final built from the 3-sf displayed D "disagree[s] in the fourth to sixth significant figure of the concentration". Analytic relative departure < 0.005·f/m_D | in the §6 domain, 3.4–12.5 % of disagreeing cases reach the 3rd sf (worst relative 0.46 %, f ≈ 0.95). The 3rd sf is reached whenever f ≳ 20 % | 4th to 6th | **DISAGREES** (Finding 5) |
| 90 | §11 closing line | "one constant cited" | v̄ is the only cited value | one | agrees |
| 91 | §11 closing line | "three rows derived" | scope-error, Dmin, HI-08 boundary | three | agrees |
| 92 | §11 closing line | "two tolerances to derive" | round-trip, unit-normalisation | two | agrees |
| 93 | §11 closing line | "one height to measure" | NF-05 | one | agrees |
| 94 | §11 closing line | "two citations outstanding: the ISO 8655-2 row and the excipient values" | the threshold row and §17 item 1 also require ISO 7886-1: three | two | **DISAGREES** (Finding 12) |
| 95 | Annex gate 4 | "Two citations are outstanding (outstanding items 1 and 2)" | item 1 alone requires two standards | two | **DISAGREES** (Finding 12) |
| 96 | Annex gate 5 | "eleven items" in §9 | 11 | eleven | agrees |
| 97 | §14.1 | "five claims" | the table has 5 rows | five | agrees |
| 98 | §0.0 | "Four questions" | the table has 4 rows | four | agrees |
| 99 | handoff | heading "Three constants are not yet cited" | the second bullet is v̄, "Cited and signed off" | three not cited | **DISAGREES** (Finding 13) |
| 100 | CR-C3-01 | "at most 79.9680 mg/mL" | = row 36 | 79.9680 | agrees |
| 101 | §17 item 1 | FX-05 7.30 % and FX-06 5.84 % exceed every candidate | 7.30, 5.84 > 1 | exceed | agrees |
| 102 | §17 item 1 | FX-17 0.0871 % below every candidate | 0.0871 < 0.6 | below | agrees |
| 103 | Annex gate 5a | "clean. Every factor in §5 and §8 was derived from its relation and checked numerically" | §8 states 7.88 %; the relation gives 7.87 % | clean | **DISAGREES** (Finding 2) |
| 104 | C7-FX-06 | "the closest approach to a tie in the fixture set" | not the closest under any reading except "diluent volumes, absolute gap" (§3 table) | closest | **DISAGREES** (Finding 6) |
| 105 | §5 *On C7-DT-07* | "C7-FX-17 departs by +0.452 %" | = row 58 | +0.452 % | agrees |
| 106–107 | acceptance 13c | 0.942 mL; at most 79.9680 mg/mL | = rows 35, 36 | same | agrees |
| 108–109 | acceptance 13d | 1.00452 against 1.00000 mg/mL | = rows 56, 57 | same | agrees |
| 110 | §0.0 / C7-UN-05 / §11 | 6 sf for an upper-bound concentration, stated three times | consistent | 6 sf | agrees |
| 111 | C7-PC-01 / §11 / FX-17 | 2 µL default, stated three times | consistent | 2 µL | agrees |
| 112 | §6 / C7-IV-03 | Ca reproduces exactly from content, Vd′, solids and v̄ (FX-05, FX-06 ×3, FX-17) | exact-decimal and float-chain displays identical in every case | exact | agrees |
| 113 | handoff, CR, URS header | document versions: URS v1.0, C1 v0.5, C3 v0.4.1 | consistent across the three documents | — | agrees |
| 114 | Cross-reference sweep | every `C7-xx-nn` cited in the three documents is defined | 115 distinct IDs cited, all defined (C7-HI-05 retained as unused, as stated) | — | agrees |

**Checked: 114 = 102 numeric figures and derivations (rows 1–89, 100–112) + 12 consistency checks (rows 90–99, 113, 114: counts, versions, ID sweep).** **DISAGREES: 10 rows** (18, 20, 22, 88, 89, 94, 95, 99, 103, 104), **8 distinct errors**: rows 20 and 22 are one error (Finding 1), and rows 94 and 95 are one error (Finding 12). Of the 10, 7 are numeric (rows 18, 20, 22, 88, 89, 103, 104) and 3 are counts (rows 94, 95, 99).

**Register status vocabulary.** Every §11 register row and every assumption row carries exactly one status from the six-word vocabulary (derived, measured, characterised, disclosed, proposed, open). The threshold row is "Open", with a note that its definition is signed; that is still one status. No row uses a status outside the vocabulary. The status *choice* for the displayed-volume resolution is Finding 11, and the wording collisions are Finding 23.

**Not checkable from these documents** (not counted as agreeing):
- 2.6× for PE-conjugated IgG (C1 v0.5 §3.3)
- the v̄ range 0.70–0.75 and its citations
- sugars and polyols 0.6–0.67 mL/g; salts ≈ 0.3 mL/g
- assay CVs of 20–30 %
- the ISO recollections: 10 mL at ≈ 0.6 %, 100–1000 µL at ≈ 0.8 %, and ISO 7886-1 at "several percent"
- the C1 flag IDs C1-FL-06/07/08, the C1-MW-07 option set, C1-UN-03/04, C3-VB-01, C3-SK-03, C4-SR-05
- the §6 frequencies. They depend on the sampling, which the spec says, and my samplings gave 29.4–31.6 % and 3.4–3.8 %, just outside 21–30 % and 2.5–3.5 %.
- that FX-08 falls below every threshold candidate (FX-08 states no values)

---

## 2. Findings

**Finding 1 — The overstatement at f = 7.3 % is 7.87 %, not 7.88 %.** Re-verifies smoke Finding 1. DISAGREES, rows 20 and 22.
- **Quotes:** §8 C7-FL-08, "At f = 7.3 %: shortfall 6.80 %, overstatement 7.88 %". §10 C7-FX-11, "at f = 7.3 %, 6.80 % and 7.88 %".
- **Derivation:** f ÷ (1 − f) = 0.073 ÷ 0.927 = 0.078748651564185544768… The double is 0.0787486515641855433… At 3 sf (C7-UN-09), half away from zero, this is **7.87 %**. The float chain gives the same.
  - The exact value sits 1.348 × 10⁻⁴ percentage points below the tie at 7.875 %, which is 0.013 of a step.
  - The display reaches 7.88 % only for f ≥ 7.30012 %.
- **One derivation path that yields 7.88 %** (stated as a possibility, not as how the figure was produced): round 1 ÷ (1 − f) to 6 sf, giving 1.07875; subtract 1, giving 0.07875; round half away, giving 7.88 %. That path derives the percentage from the factor beside it rather than from its own relation, which is what the §0.3 method note excludes.
- **The text should say** "overstatement 7.87 %" in both places, if the relation is f ÷ (1 − f) as written.

**Finding 2 — Annex gate 5a's "clean" claim does not hold.** DISAGREES, row 103.
- **Quote:** "Specification — **clean.** Every factor in §5 and §8 was derived from its relation and checked numerically, by the drafter and independently by NADIRA (21 September 2026)".
- **Derivation:** Finding 1. A §8 factor is not the value of its relation.
- **The text should say:** the gate status should not read "clean" while Finding 1 stands. Owner to restate.

**Finding 3 — §6 table, row 3: the worst case in the stated domain is at least 5 units in the last place, not 4.** DISAGREES, row 88.
- **Quote (§6):** "Displacement at 6 significant figures, final as its exact sum with Vd′ | 4 units in the last place". Also: "The worst cases agreed across two independent samplings."
- **Derivation:**
  - The final carries D's 6-sf rounding error, which is below ½ × 10^(e_D − 5).
  - The relative departure of the reconstructed Ca is therefore below ½·f·m_C/m_D ulp of the 6-sf Ca, where m_C and m_D are the mantissas of Ca and D. This can exceed 4 when f > 0.8.
  - A targeted search over the stated domain (content 1 µg–1 g, target 1–316 mg/mL, solids 1–50 × content, target direction) found the case `content 9.22236004065437 mg, target 89.59731971472989 mg/mL, solids 137.6938 mg`.
    - TS concentration is 1337.7 mg/mL, below the 1369.86 mg/mL HI-08 boundary, so the case is not rejected.
    - f = 97.65 %, D = 0.100516 mL at 6 sf, Vd′ = 0.00241 mL.
    - Ca = 89.6014. content ÷ (Vd′ + D₆) = 89.6019. The miss is **5 ulp**.
  - Uniform-in-log sampling reaches this region rarely (sampled worst 3–4), which is consistent with the spec's figure.
- **The text should say:** "5 units in the last place" if the table states the supremum over the stated domain. Or it should say the figure is a sampled worst case over a stated sampling, restricted to a stated range of f. Owner to choose. The conclusion the table supports, that reproduction from a displayed final is not exact, is unaffected.

**Finding 4 — §6 simulation domain: the stated domain includes inputs C7-HI-08 rejects, and the sampling is unstated.** Ambiguity.
- **Quote:** "content 1 µg–1 g, target 1–316 mg/mL, total solids 1–50 × content".
- **Derivation:** 316 mg/mL × 50 = 15,800 mg/mL of total solids, far above the 1369.86 mg/mL boundary. Depending on the sampling I used, 13–72 % of draws were rejected. The spec does not say:
  - whether rejects were excluded
  - which direction was simulated
  - what the sampling was
- **The text should say** how the domain was restricted and how it was sampled, so the table and frequencies can be reproduced.

**Finding 5 — "disagreeing in the fourth to sixth significant figure" is not bounded as stated.** DISAGREES, row 89.
- **Quote (§6 *One final volume*):** "A final volume built from the displayed displacement, with the concentration computed from the unrounded one, would put two final volumes on one page, disagreeing in the fourth to sixth significant figure of the concentration."
- **Derivation:** the 3-sf D carries a relative error of up to ½ × 10⁻² of D. The concentration's relative departure is therefore up to 0.005·f/m_D.
  - It reaches the **3rd** significant figure (≥ 10⁻³) whenever f ≳ 20 % (m_D ≈ 1).
  - It falls below the 6th for small f. FX-17's f of 0.0871 % gives at most 4.4 × 10⁻⁶.
  - In the §6 domain, 3.4–12.5 % of the disagreeing cases reached the 3rd sf. The worst relative departure was 0.46 %, at f ≈ 0.95.
- **The text should say** the range of f over which "fourth to sixth" holds, or give the range that the relation yields. Owner to choose.

**Finding 6 — C7-FX-06's "closest approach to a tie in the fixture set" holds under only one narrow reading.** DISAGREES, row 104. Settles smoke Finding 2.
- **Quote:** "the unrounded diluent, 0.941600 mL, lies **1.00 × 10⁻⁴ mL above the 3-sf tie at 0.9415 mL** — outside one ULP, and the closest approach to a tie in the fixture set".
- **Derivation:** §3 tabulates every displayed value in FX-05, every FX-06 subcase and FX-17.
  - **Any displayed value, absolute gap:** not the closest. FX-06's 1.0044 mg Dmin (0.000733 mL) is 2.88 × 10⁻⁷ mL from its tie, and FX-17's D (0.000876 mL) is 5.0 × 10⁻⁷ mL. The 6-sf concentrations are 10⁻⁵–10⁻⁷ from theirs.
  - **Relative gap:** not the closest (1.06 × 10⁻⁴). Every 6-sf concentration is nearer, at 4.7 × 10⁻⁷ to 4.9 × 10⁻⁶.
  - **Per display step:** not the closest (0.100). Nearer, on ties within the value's own decade, are FX-17's diluent at 0.048, FX-06's 1.0044 mg Ca at 0.090, and the FL-08 overstatement at 0.013. Values at or just above a power of ten (100.000, 1.00, 1.0004, 1.00000) are excluded from this comparison, because their nearest tie lies in the decade below and the per-step figure depends on which decade's step is used (§3 note).
  - **Diluent volumes only, absolute gap:** it is the closest (1.00 × 10⁻⁴ against 4.76 × 10⁻⁴, 1.33 × 10⁻³ and 5.0 × 10⁻⁴).
- **The text should say** which quantities and which measure the claim ranges over. Or it should drop "the closest approach" and state the figure alone, as C7-FX-12 requires. No fixture is anywhere near one ULP.

**Finding 7 — Direction pass: several displayed "at most" and "at least" figures are on the wrong side of the bound they state.** Inconsistency between C7-DT-07's labels and C7-UN-06's rounding.
- **Quotes:**
  - C7-DT-07: "Ca is an **upper bound** on the concentration obtained … labelled 'at most' … Fa is labelled 'at least'".
  - C7-UN-06: "Rounding shall be half away from zero".
  - C7-FX-06: "concentration **at most 79.9680 mg/mL**"; "1.0044 mg at 1 mg/mL … at most 1.00366 mg/mL".
- **Derivation:**
  - FX-06, 80 mg target: the unrounded bound is 79.968013 mg/mL, displayed as 79.9680. The displayed figure is **1.28 × 10⁻⁵ below** the bound. "At most 79.9680" is not implied by the bound.
  - FX-06, 1.0044 mg: the bound is 1.0036641 mg/mL, displayed as 1.00366, which is **4.1 × 10⁻⁶ below** it.
  - FX-06, 1.00 mL diluent entered: Fa = 1.0584 mL. The spec does not state this Fa; under C7-UN-04 and C7-UN-06 it would display as **1.06 mL, labelled "at least"** (C7-DT-07). That is 1.6 × 10⁻³ mL *above* the lower bound, so a true final between 1.0584 and 1.06 contradicts the displayed statement.
  - The other three are on the safe side: 75.5858 is above 75.585790; 1.00 is below 1.0004 and below 1.000733.
  - The same question reaches CR-C3-01: "Dividing an upper bound by a positive dilution factor leaves an upper bound, so no additional tolerance or derivation is required." That is true of the unrounded bound. It is not true of a displayed bound, if the displayed one is what is meant.
- **The text should say** whether "at most" and "at least" are asserted of the unrounded value in the structured object, or of the displayed figure. No rounding change is proposed here. Owner to state.

**Finding 8 — The concentration crossover "0.365 at 1 mg/mL, 0.378 at 100 mg/mL" holds for one direction and one error measure only.** Ambiguity.
- **Quote (§11 scope-error row):** "That figure is exact for the volume error and first-order in concentration. In concentration terms the crossover rises with solids concentration: 0.365 at 1 mg/mL, 0.378 at 100 mg/mL." The same row says: "The direction is the same whichever volume is known."
- **Derivation:** the grid below uses c = solids ÷ the tool's computed final. The crossover is the v̄ at which the corrected and uncorrected concentration errors are equal.

  | Direction | Measure | 1 mg/mL | 10 mg/mL | 100 mg/mL |
  |---|---|---|---|---|
  | final known | true ÷ reported − 1 (the row's "concentration excess") | 0.365 | 0.366 | **0.378** |
  | final known | reported ÷ true − 1 | 0.365 | 0.365 | 0.365 |
  | final known | \|ln(true ÷ reported)\| | 0.365 | 0.366 | 0.372 |
  | diluent known | true ÷ reported − 1 | 0.365 | 0.365 | 0.365 (exact at every c: both errors have denominator 1 − (0.73 − v)c) |
  | diluent known | reported ÷ true − 1 | 0.365 | 0.364 | 0.351 |
  | diluent known | \|ln\| | 0.365 | 0.364 | 0.358 |

  The row's own figures are reproduced in the final-known direction with the row's own excess measure. With the diluent known, under that same measure, the crossover does not rise; it is 0.365 exactly. Under other measures it falls.
- **The text should say** which direction and measure the "rises … 0.378" sentence refers to, and what the crossover is in the other direction. Owner to choose.

**Finding 9 — Outstanding item numbers: §0.1 and §15 cite "outstanding item 8" for the mass ↔ activity conversion, which §17 numbers 9.**
- **Quotes:**
  - §0.1: "**Outstanding item 8**: it should not be built on inference that someone wants it".
  - §15: "needs a declared uncertainty, not a tolerance — outstanding item 8".
  - §17 item 8: "Define and publish the shared result-object version". §17 item 9: "C2's removal from the catalog, and whether IU ↔ mass conversion is built at all".
  - The handoff agrees with §17: "Publishing that format version … is outstanding item 8".
- **The text should say** "outstanding item 9" in §0.1 and §15, or §17 should be renumbered. Owner to choose.

**Finding 10 — C7-ST-08 cites "acceptance 26", which does not exist.**
- **Quote:** "C7 shall not withhold the bound to avoid the obligation, and that half is testable here (acceptance 26)."
- **Derivation:** §16 runs from 1 to 25, with 13a–13d and 15a. Acceptance 15a says "C7 never withholds the bound to avoid C7-ST-08's obligation".
- **The text should say** the acceptance actually meant. 15a matches in content, but the owner confirms.

**Finding 11 — §11 "Displayed-volume resolution" carries the status **Characterised**, which by definition needs an external source.**
- **Quotes:**
  - §0.4: "'Characterised' … a value cited to an external source, with its scope and scope error bounded, which is neither derived by this tool set nor merely disclosed".
  - §11 row: "A half-step at 3 significant figures is 0.005 on a mantissa between 1.00 and 9.99 … | **Characterised**".
- **Derivation:** the value is arithmetic on the display rule (rows 7–9). It is not cited to any source. The §11 closing line also counts "One constant cited", which is v̄ alone.
- **The text should say** the status that fits the vocabulary for an arithmetic consequence. Owner to choose.

**Finding 12 — The count of outstanding citations is two in two places, but the text requires three.** DISAGREES, rows 94 and 95.
- **Quotes:**
  - §11 closing: "two citations outstanding: the ISO 8655-2 row and the excipient values".
  - Annex gate 4: "Two citations are outstanding (outstanding items 1 and 2)".
  - The §11 threshold row: "Syringe graduation tolerances under ISO 7886-1 … Both standards to be cited before either number reaches the page".
  - §17 item 1: "Cite ISO 8655-2 … and ISO 7886-1 for syringes".
- **The text should say** three citations (ISO 8655-2, ISO 7886-1, the excipient values), or that ISO 7886-1 is not a citation outstanding. Owner to choose.

**Finding 13 — The handoff's heading "Three constants are not yet cited" includes v̄, which it calls cited.** DISAGREES, row 99.
- **Quote:** "## Three constants are not yet cited — configure, don't hard-code", followed by "**The partial specific volume, 0.73 mL/g.** Cited and signed off".
- **The text should say** a heading that matches its three bullets. Owner to word it.

**Finding 14 — Negative controls: the handoff says two, and URS §10 says one.**
- **Quotes:**
  - Handoff: "C7-FX-08 and C7-FX-17 are negative controls".
  - URS §10: "C7-FX-08 is the negative control". FX-17 calls itself "a second clean case".
- **The text should say** one consistent description. Minor.

**Finding 15 — The CR document says both CRs are recorded at C7-ST-08, but only CR-C3-01 is.**
- **Quote (CR, "Note on C7's dependency"):** "C7's specification records both of these at C7-ST-08 and in its outstanding items".
- **Derivation:** C7-ST-08 names only CR-C3-01. CR-C3-02 appears in URS §0.0 and §17 item 7.
- **The text should say** "CR-C3-01 at C7-ST-08, CR-C3-02 at §0.0, and both in outstanding item 7", or equivalent.

**Finding 16 — "Cannot fire at all when a diluent volume is entered" is false on computed values.** DISAGREES, row 18. Low severity.
- **Quotes:**
  - C7-HI-08: "evaluated in this form, on computed values".
  - *On C7-HI-08*: "It cannot fire at all when a diluent volume is entered, since then F = entered + D > D".
  - The §11 row: "Cannot fire with a diluent volume entered".
- **Derivation:** in IEEE-754, fl(entered + D) = D when entered < ½ ULP(D). For example, D = 1.0 mL and entered = 10⁻¹⁷ mL give F = 1.0 = D, and D ≥ F is True. Such an entry passes C7-HI-02, since it is greater than 0. C7-FX-10 asks for "the nearest representable inputs either side", which is exactly this regime.
- **The text should say** that the statement holds in exact arithmetic, or give the representable limit. Owner to choose. The page sentence "will not fire on any real reconstitution" is unaffected.

**Finding 17 — Fixtures state volumes at precisions the page does not display, with no marker for exact against displayed.** Re-verifies smoke Finding 3.
- **Quotes:**
  - C7-FX-05: "F = 1.000 mL … Fa = 1.000 mL". The 3-sf display is **1.00 mL**.
  - C7-FX-17: "Fa = 1.000876 mL". This is unrounded and unlabelled; it displays as 1.00 mL.
  - In the same sentence FX-05 gives D, f and Vd′ at 3 sf.
- **The text should say** "1.00 mL", or mark 1.000 and 1.000876 as exact, unrounded values. Owner to choose.

**Finding 18 — One kind of quantity is stated at several precisions.** Re-verifies smoke Findings 4 and 5, and extends them.
- **Quotes and derivations:**
  - §11, §17 item 1 and the handoff: "13.7 … 11.0 … 8.2". 0.006 ÷ 0.73 = 8.2191780…, which is **8.22** at 3 sf. The trailing zero in "11.0" shows 3 sf is meant for its neighbours.
  - §11 Dmin row: "7.3 % at 100 mg/mL, 0.73 % at 10 mg/mL, 1 % at 13.7 mg/mL". At C7-UN-09's 3 sf these are 7.30 %, 0.730 % and 1.00 % (the exact value at 13.7 mg/mL is 1.0001 %).
  - C7-FL-08 and C7-FX-11 write "f = 7.3 %"; C7-FX-05 writes "7.30 %".
- **The text should say** one precision for each quantity, or mark the worked-example inputs as exact. Minor. Owner to choose.

**Finding 19 — C7-FX-12's recording obligation is not met, and several fixtures state no expected values.** Re-verifies smoke Finding 6, and extends it.
- **Quote (C7-FX-12):** "shall **record the distance from each displayed value to the nearest tie at its displayed precision** — the figure itself".
- **Observation:**
  - FX-06 and FX-17 each record one gap, for the diluent only.
  - FX-05 records none.
  - FX-01, FX-04, FX-07, FX-13, FX-14 and FX-16 state no expected figures, so no gap can be recorded against them.
  - FX-04 and FX-07 give enough to derive expected values. These are derived here, not stated in the spec:
    - FX-04 (1 mg total contents, target 1 mg/mL): D = 0.00073 mL, Vd 0.99927 → 0.999 mL, Fa 0.99973 → 1.00 mL, total-solids Ca 1.00027 mg/mL, f 0.0730 %. The diluent's gap to 0.9995 is 2.3 × 10⁻⁴.
    - FX-07, second case (10⁶ IU, 10⁴ IU/mL, 5 mg solids): D 0.00365 mL, f 0.00365 %, Vd 99.99635 → 100 mL, Ca 9999.64 IU/mL.
  - FX-04 and FX-07 also leave provenance, carrier and conjugate declarations unstated, so the full expected flag set cannot be determined. FX-04 names only C7-FL-01.
  - The FX-06 1.0044 mg case states no fmin. The relation gives 0.0730 %.
- **The text should say** the gaps from §3 (or the owner's own), recorded against each fixture, and the expected values of fixtures that currently have none. Owner to confirm.

**Finding 20 — The §8 clean-case sentence omits the C1-import conditions.** Ambiguity.
- **Quote:** "A whole-vial reconstitution of a reagent-alone, non-conjugate, carrier-absent content, from a lot certificate, with a declared total solids mass, every volume inside the declared bounds and displacement below the material threshold, raises no flags".
- **Derivation:** an imported C1 object carrying any flag raises C7-FL-10. An imported object whose basis is "not recorded" or "monomer" raises C7-FL-09 (§8 table rows 5 and 6). Neither is excluded by the sentence.
- **The text should say** that no C1 object is imported, or that any imported object forms a permitted pair and carries no flag. Owner to choose.

**Finding 21 — The C7-FL-07 remedy names a target in directions that have none.** Direction pass. Minor.
- **Quote:** "A lower target concentration, or a vial of different content, is required". The flag is "evaluated in both directions" (§8 preamble).
- **The text should say** a remedy for each direction, or a direction-neutral one. Owner to word it.

**Finding 22 — C7-VB-02 says the two volumes differ by the displacement applied. That is not true where a final volume is entered.**
- **Quotes:**
  - C7-VB-02: "The difference between them is the displacement applied".
  - C7-DT-02: "Final entered: … Fa differs from the entered final by the rounding of the diluent".
- **Derivation:** the entered final minus Vd′ = Dapp + (Vd − Vd′). Only Fa − Vd′ = Dapp. C7-OUT-03 adds Fa as a third volume.
- **The text should say** which pair of volumes differs by Dapp. Owner to word it.

**Finding 23 — §11 wording collides with the status vocabulary.** Minor.
- The register is introduced as "Proposed register:". "Proposed" is one of the six statuses, and the document is approved.
- The "Vial working capacity" row puts "Disclosed" in its Basis column as well as its Status column.
- **The text should say** a heading that is not a status word, and a basis for that row. Owner to choose.

**Finding 24 — §1 states the naive result as the tool's arithmetic.** Minor, rationale text.
- **Quote:** "a vial holding 1 mg reconstituted in 1 mL as the datasheet says is at 1 mg/mL".
- **Derivation:** under C7's own relation (reagent alone, no solids, Dmin applied), the result is at most 1 ÷ 1.00073 = **0.999271 mg/mL**. The paragraph's bullet list names displacement as one of the non-trivial parts.
- **The text should say** whether this is the naive figure, if the owner wants that explicit.

**Finding 25 — Acceptance 17 says "five claims are verified" but lists four; the fifth is acceptance 16.** Ambiguity, minor.
- **Quote (acceptance 17):** "**The privacy statement's five claims are verified, not asserted**". It then lists: no third-party code; storage; traffic records; source repository. The §14.1 table assigns "Nothing entered leaves the browser" to acceptance 16.
- **The text should say** that claim 1 is verified under acceptance 16, or list it in acceptance 17.

**Finding 26 — C7-FX-09: "both mismatched ones" does not say how many cases §8 table row 10 needs.** Ambiguity, minor.
- **Quote:** "including both permitted conjugate combinations and both mismatched ones".
- **Derivation:** row 10 covers two conjugate declarations ("Not a conjugate, or conjugate, mass of the protein"). Row 11 covers one. "Both mismatched ones" could mean two cases or three.
- **The text should say** the number of cases.

### Standing passes (§0.3)

- **Declaration audit.** Findings 19 and 20 are gaps in what fixtures and the clean-case sentence declare. Findings 7 and 22 are cases where it is unclear which value a labelled quantity refers to.
  - Every other quantity checked has a declared measure and producing act: content, basis, provenance, conjugate, carrier, volume basis, Dapp, Fa, Ca, fmin, and the minimum transfer volume (its default is disclosed).
- **Comparison pass.**
  - Pairing table. With the C1 basis set taken as {assembled, monomer/single chain, conjugate incl. label, not recorded}, first-match evaluation covers every combination of C1 basis × C7 content basis × conjugate declaration, and no combination is matched by two rows.
    - Rows 1–4 catch every C7-side disqualification.
    - Rows 5–6 catch the C1-side ones.
    - Rows 7–11 partition the remaining six combinations of reagent alone, {assembled, conjugate MW} × {not conjugate, protein mass, conjugate mass}. Rows 7, 8, 9 and 11 take one each; row 10 takes two.
    - The eight rows with molar form "Not permitted" and the three "Permitted" rows are consistent with "assembled with protein, conjugate with conjugate".
    - Whether the C1-MW-07 option set is exactly these four is not checkable here.
  - C7-HI-03, HI-07 and HI-09 preserve the distinctions they compare. Finding 16 concerns HI-08's evaluated form.
- **Direction pass.**
  - Findings 1, 7, 8 and 21.
  - The FL-08 and FL-05 factors are otherwise stated in the direction of their consequence (row 23).
  - The scope-error direction ("true concentration above the reported") is correct for v̄ₜᵣᵤₑ < 0.73, in both directions (row 66).
  - For v̄ₜᵣᵤₑ in (0.73, 0.75], which is within the cited range, the formula gives a negative ε and the direction reverses. The row's wording covers only "a true value lower".

---

## 3. Tie gaps of every displayed value in FX-05, FX-06 and FX-17

Gaps are to the nearest rounding tie at the displayed precision, including the decade-boundary tie (e.g. 0.9995 at 3 sf). Figures are from the script output.

**Note on per-step figures.** For values at or just above a power of ten (FX-05 TS 100.000 and F/Fa 1.00, FX-06 Fa 1.0004, FX-06 1.0044 Fa, FX-17 Fa and target 1.00000), the nearest tie is the boundary tie in the decade below. The script divides that gap by the value's own (upper-decade) step. Those per-step figures are therefore not comparable with the others, and Finding 6 does not use them. The absolute and relative gaps are unaffected.

| Displayed value | Exact | Nearest tie | Gap | Per own step | Relative |
|---|---|---|---|---|---|
| FX-05 TS conc 100.000 | 100 | 99.99995 | 5.0 × 10⁻⁵ | 0.050 | 5.0 × 10⁻⁷ |
| FX-05 F, Fa 1.00 mL | 1 | 0.9995 | 5.0 × 10⁻⁴ | 0.050 | 5.0 × 10⁻⁴ |
| FX-05 D 0.0730 mL | 0.073 | 0.07295 | 5.0 × 10⁻⁵ | 0.500 | 6.8 × 10⁻⁴ |
| FX-05 f 7.30 % | 7.3 | 7.295 | 5.0 × 10⁻³ | 0.500 | 6.8 × 10⁻⁴ |
| FX-05 Vd′ 0.927 mL | 0.927 | 0.9275 | 5.0 × 10⁻⁴ | 0.500 | 5.4 × 10⁻⁴ |
| FX-05 Ca 80.0000 | 80 | 79.99995 | 5.0 × 10⁻⁵ | 0.500 | 6.3 × 10⁻⁷ |
| FX-05 / FL-08 shortfall 6.80 % | 6.80336 | 6.805 | 1.6 × 10⁻³ | 0.164 | 2.4 × 10⁻⁴ |
| FX-06 Dmin 0.0584 mL | 0.0584 | 0.05845 | 5.0 × 10⁻⁵ | 0.500 | 8.6 × 10⁻⁴ |
| FX-06 diluent 0.942 mL | 0.9416 | 0.9415 | 1.00 × 10⁻⁴ | 0.100 | 1.06 × 10⁻⁴ |
| FX-06 Fa 1.00 mL | 1.0004 | 0.9995 | 9.0 × 10⁻⁴ | 0.090 | 9.0 × 10⁻⁴ |
| FX-06 at most 79.9680 | 79.9680128 | 79.96805 | 3.7 × 10⁻⁵ | 0.372 | 4.7 × 10⁻⁷ |
| FX-06 fmin 5.84 % | 5.84 | 5.835 | 5.0 × 10⁻³ | 0.500 | 8.6 × 10⁻⁴ |
| FX-06 1.00 entered: at most 75.5858 | 75.5857899 | 75.58575 | 4.0 × 10⁻⁵ | 0.399 | 5.3 × 10⁻⁷ |
| FX-06 1.00 entered: fmin 5.52 % | 5.51776 | 5.515 | 2.8 × 10⁻³ | 0.276 | 5.0 × 10⁻⁴ |
| FX-06 1.00 entered: Fa 1.06 mL | 1.0584 | 1.055 | 3.4 × 10⁻³ | 0.340 | 3.2 × 10⁻³ |
| FX-06 1.0044: Dmin 0.000733 mL | 0.000733212 | 0.0007335 | 2.9 × 10⁻⁷ | 0.288 | 3.9 × 10⁻⁴ |
| FX-06 1.0044: diluent 1.00 mL | 1.003666788 | 1.005 | 1.3 × 10⁻³ | 0.133 | 1.3 × 10⁻³ |
| FX-06 1.0044: Fa 1.00 mL | 1.000733212 | 0.9995 | 1.2 × 10⁻³ | 0.123 | 1.2 × 10⁻³ |
| FX-06 1.0044: at most 1.00366 | 1.0036641014 | 1.003665 | 9.0 × 10⁻⁷ | 0.090 | 9.0 × 10⁻⁷ |
| FX-06 1.0044: fmin 0.0730 % (not stated) | 0.073 | 0.07295 | 5.0 × 10⁻⁵ | 0.500 | 6.8 × 10⁻⁴ |
| FX-17 D 0.000876 mL | 0.000876 | 0.0008765 | 5.0 × 10⁻⁷ | 0.500 | 5.7 × 10⁻⁴ |
| FX-17 diluent 1.00 mL | 1.004524 | 1.005 | 4.76 × 10⁻⁴ | 0.048 | 4.7 × 10⁻⁴ |
| FX-17 Fa 1.00 mL | 1.000876 | 0.9995 | 1.4 × 10⁻³ | 0.138 | 1.4 × 10⁻³ |
| FX-17 Ca 1.00452 | 1.0045200404 | 1.004525 | 5.0 × 10⁻⁶ | 0.496 | 4.9 × 10⁻⁶ |
| FX-17 target 1.00000 | 1 | 0.9999995 | 5.0 × 10⁻⁷ | 0.050 | 5.0 × 10⁻⁷ |
| FX-17 f 0.0871 % | 0.0871295 | 0.08715 | 2.1 × 10⁻⁵ | 0.205 | 2.4 × 10⁻⁴ |
| FX-17 departure 0.452 % | 0.4520040 | 0.4525 | 5.0 × 10⁻⁴ | 0.496 | 1.1 × 10⁻³ |
| FL-08 / FX-11 overstatement 7.87 % | 7.8748652 | 7.875 | 1.3 × 10⁻⁴ | 0.013 | 1.7 × 10⁻⁵ |

Every gap is many orders of magnitude above one ULP, so no fixture falls under C7-IV-03's exception.

---

## 4. Open questions

1. (Finding 1) Is the FL-08 overstatement f ÷ (1 − f) evaluated directly, which gives 7.87 %? If some other derivation is intended, where is it recorded?
2. (Finding 3) Is the §6 "worst error" a supremum over the stated domain, or a sampled worst case? If sampled, under which sampling and which range of f?
3. (Finding 4) Were HI-08 rejects excluded from the §6 simulation, and which direction was simulated?
4. (Finding 5) Over what range of f does "fourth to sixth significant figure" hold?
5. (Finding 6) Which quantities, and which measure, does "the closest approach to a tie in the fixture set" range over?
6. (Finding 7) Are "at most" and "at least" asserted of the unrounded values or of the displayed figures? Does CR-C3-01's "no additional tolerance or derivation is required" assume the former?
7. (Finding 8) Which direction and which concentration-error measure does the 0.378 crossover refer to? For the diluent-known direction, total-solids concentration is taken relative to which final, the corrected or the uncorrected computation's?
8. (Finding 9) Is the mass ↔ activity item 8 or 9?
9. (Finding 10) Which acceptance is "acceptance 26"?
10. (Finding 11) Which status should the displayed-volume resolution carry?
11. (Finding 17) Are "1.000 mL" (FX-05) and "1.000876 mL" (FX-17) exact values or displays?
12. (Finding 18) What precision should the §11 orientation thresholds and Dmin examples carry?
13. (Finding 19) What are the expected values and tie gaps for FX-01, FX-04, FX-07, FX-08, FX-13, FX-14 and FX-16?
14. The C7-FL-08 threshold compares f in both directions, while the naive error it guards is f ÷ (1 + f) with the final known and f ÷ (1 − f) with the diluent entered. Is that asymmetry intended? This is a design question, not a finding.
15. C7-IV-04 is called "a headline of the derivation memo", but it has no acceptance criterion of its own. Only acceptance 3's fixture comparison reaches FX-02. Is that intended?
16. Is the C1-MW-07 option set exactly {assembled, monomer/single chain, conjugate including label or payload, not recorded}? The pairing table's coverage (§2, comparison pass) depends on it.
17. (Finding 16) Should the HI-08 "cannot fire" statements hold on computed values, given C7-FX-10's representable-input boundary tests?
18. C7-FX-10 describes the FL-08 threshold as one "whose decimal values do not terminate". The candidate thresholds (0.6 %, 0.8 %, 1 %) terminate in decimal but not in binary; f = D ÷ F generally does not terminate in either. Which is meant?

For A. Modi / NADIRA. Every disagreement above is left to the specification owner.
