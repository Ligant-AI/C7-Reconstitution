# C7 specification audit — smoke test, 2026-09-28

**Scope (deliberately narrow, set by the requester):** figures in `spec/reconstitution-urs-v1.0.md` only:
(1) C7-FL-08 worked figures (§8) and the same in C7-FX-11; (2) C7-FX-05; (3) C7-FX-06; (4) C7-FX-17; (5) §11 thresholds 13.7 / 11.0 / 8.2 mg/mL and the ≈1370 mg/mL boundary (also quoted in the §7 rationale *On C7-HI-08*).
Not in scope: every other figure, the other two spec files, the pairing table, the ID cross-reference check, and full §0.3 standing passes. **This is not a full audit.** A "no finding" here says nothing about anything outside the list above.

**Method.** Python `decimal`, precision 60. Each value is derived from the relation the spec states. For display, the exact result is converted to the nearest IEEE-754 double. `Decimal(float(x))` is then rounded half away from zero (`ROUND_HALF_UP` on magnitude) at the stated significant figures: 3 sf for volumes (C7-UN-04), 6 sf for concentrations (C7-UN-05) and 3 sf for fractions and percentages (C7-UN-09). v̄ = 0.73 mL/g (§11). Script: `verification/spec-audit/recompute-2026-09-28-smoke.py`. Run it with `python3` to reproduce every value below.

Tie gaps are measured to the nearest tie **at the displayed precision** (3 sf for volumes, 6 sf for concentrations). They are also given as a fraction of the display step, so gaps in different quantities can be compared.

---

## 1. Figures checked

| # | Location | Relation | Inputs | Exact value | Displayed (rule) | Spec states | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | §8 C7-FL-08 | shortfall = f ÷ (1 + f) | f = 0.073 | 0.0680335507921714818… = 6.80335…% | 6.80 % (3 sf) | 6.80 % | agrees |
| 2 | §8 C7-FL-08 | overstatement = f ÷ (1 − f) | f = 0.073 | 0.0787486515641855447… = 7.874865…% | **7.87 %** (3 sf) | 7.88 % | **DISAGREES** |
| 3 | §10 C7-FX-11 | shortfall = f ÷ (1 + f) | f = 0.073 | 6.80335…% | 6.80 % | 6.80 % | agrees |
| 4 | §10 C7-FX-11 | overstatement = f ÷ (1 − f) | f = 0.073 | 7.874865…% | **7.87 %** | 7.88 % | **DISAGREES** |
| 5 | C7-FX-05 | total-solids conc = solids ÷ F | 100 mg, F = 1 mL | 100 | 100.000 mg/mL (6 sf) | 100 mg/mL | agrees |
| 6 | C7-FX-05 | F = content ÷ target | 80 mg ÷ 80 mg/mL | 1 | 1.00 mL (3 sf) | 1.000 mL | agrees in value; precision, see Finding 3 |
| 7 | C7-FX-05 | D = solids × v̄ | 0.100 g × 0.73 | 0.073 (double 0.07299999999999999545…) | 0.0730 mL | 0.0730 mL | agrees |
| 8 | C7-FX-05 | f = D ÷ F | 0.073 ÷ 1 | 0.073 (double 7.2999999999999998224 %) | 7.30 % | 7.30 % | agrees |
| 9 | C7-FX-05 | Vd′ = round₃(F − D) | 1 − 0.073 | 0.927 (double 0.92700000000000004619…) | 0.927 mL | 0.927 mL | agrees |
| 10 | C7-FX-05 | Fa = Vd′ + D | 0.927 + 0.073 | 1.000 (double 1 exactly) | 1.00 mL | 1.000 mL | agrees in value; precision, see Finding 3 |
| 11 | C7-FX-05 | Ca = content ÷ Fa | 80 ÷ 1.000 | 80 | 80.0000 mg/mL | 80.0000 mg/mL | agrees |
| 12 | C7-FX-05 | shortfall = f ÷ (1 + f) | f = 0.073 | 6.80335…% | 6.80 % | 6.80 % | agrees |
| 13 | C7-FX-06 | Dmin = content × v̄ | 0.080 g × 0.73 | 0.0584 | 0.0584 mL | 0.0584 mL | agrees |
| 14 | C7-FX-06 | Vd (unrounded) = F − Dmin | 1 − 0.0584 | 0.9416 (double 0.94159999999999999254…) | — | 0.941600 mL | agrees |
| 15 | C7-FX-06 | Vd′ = round₃(Vd) | 0.9416 | — | 0.942 mL | 0.942 mL | agrees |
| 16 | C7-FX-06 | Ca (at most) = content ÷ (Vd′ + Dmin) | 80 ÷ 1.0004 | 79.96801279488204718… | 79.9680 mg/mL | 79.9680 mg/mL | agrees |
| 17 | C7-FX-06 | fmin = v̄ × content ÷ F | 0.0584 ÷ 1 | 5.84 % (double 5.83999999999999986…) | 5.84 % | 5.84 % | agrees |
| 18 | C7-FX-06 | Ca, 1.00 mL diluent entered = content ÷ (1.00 + Dmin) | 80 ÷ 1.0584 | 75.58578987150415721… | 75.5858 mg/mL | 75.5858 mg/mL | agrees |
| 19 | C7-FX-06 | fmin, 1.00 mL entered = Dmin ÷ F, F = 1.0584 | 0.0584 ÷ 1.0584 | 5.517762660619803…% | 5.52 % | 5.52 % | agrees |
| 20 | C7-FX-06 | Ca, 0.942 mL entered = 80 ÷ (0.942 + 0.0584) | 80 ÷ 1.0004 | 79.96801279488… | 79.9680 mg/mL | 79.9680 mg/mL | agrees |
| 21 | C7-FX-06 | 1.0044 mg case: Vd′ = round₃(F − Dmin), F = 1.0044 mL, Dmin = 0.000733212 mL | 1.003666788 | 1.003666788 | 1.00 mL (rounds down) | 1.00 mL | agrees |
| 22 | C7-FX-06 | 1.0044 mg case: Ca (at most) = 1.0044 ÷ (1.00 + 0.000733212) | 1.0044 ÷ 1.000733212 | 1.00366410143685727900… | 1.00366 mg/mL | 1.00366 mg/mL | agrees |
| 23 | C7-FX-06 | tie gap of the unrounded diluent, 0.9416 − 0.9415 | — | 1.0000 × 10⁻⁴ exact; the double sits 0.99999999999999254 × 10⁻⁴ above | 1.00 × 10⁻⁴ mL | 1.00 × 10⁻⁴ mL | agrees |
| 24 | C7-FX-06 | "the closest approach to a tie in the fixture set" | gaps as fractions of the display step (see Finding 2) | — | — | the diluent 0.9416 is the closest | **DISAGREES** under reading A; cannot be settled at smoke scope under reading B (Finding 2) |
| 25 | C7-FX-17 | D = solids × v̄ | 1.2 mg × 0.73 mL/g | 0.000876 | 0.000876 mL | 0.000876 mL | agrees |
| 26 | C7-FX-17 | Vd (unrounded) = content ÷ target − D | 1.0054 − 0.000876 | 1.004524 | — | 1.004524 mL | agrees |
| 27 | C7-FX-17 | Vd′ = round₃(Vd) | 1.004524 | — | 1.00 mL | 1.00 mL | agrees |
| 28 | C7-FX-17 | Fa = Vd′ + D | 1.00 + 0.000876 | 1.000876 | (1.00 mL at 3 sf) | 1.000876 mL | agrees |
| 29 | C7-FX-17 | tie gap of the diluent to the 3-sf tie at 1.005 | 1.005 − 1.004524 | 4.76 × 10⁻⁴ | 4.76 × 10⁻⁴ mL | 4.76 × 10⁻⁴ mL | agrees |
| 30 | C7-FX-17 | f = D ÷ F | 0.000876 ÷ 1.0054 | 0.0871295006962403…% | 0.0871 % | 0.0871 % | agrees |
| 31 | C7-FX-17 | Ca = content ÷ Fa | 1.0054 ÷ 1.000876 | 1.00452004044457055619… | 1.00452 mg/mL | 1.00452 mg/mL | agrees |
| 32 | C7-FX-17 | departure = Ca ÷ target − 1 | 1.00452004… ÷ 1 − 1 | 0.452004044457…% | +0.452 % | +0.452 % | agrees |
| 33 | C7-FX-17 | target at 6 sf | 1 mg/mL | 1 | 1.00000 mg/mL | 1.00000 mg/mL | agrees |
| 34 | C7-FX-17 | hand reproduction 1.0054 ÷ (1.00 + 1.2 × 0.73 × 10⁻³) | — | 1.00452004… | 1.00452 | same expression | agrees |
| 35 | §11 FL-08 threshold row | c = f ÷ v̄ | f = 1 %, v̄ = 0.73 mL/g | 13.69863013698630… mg/mL | 13.7 (3 sf) | 13.7 mg/mL | agrees |
| 36 | §11 FL-08 threshold row | c = f ÷ v̄ | f = 0.8 % | 10.95890410958904… mg/mL | 11.0 (3 sf) | 11.0 mg/mL | agrees |
| 37 | §11 FL-08 threshold row | c = f ÷ v̄ | f = 0.6 % | 8.219178082191780… mg/mL | 8.22 (3 sf) / 8.2 (2 sf) | 8.2 mg/mL | agrees at 2 sf; precision inconsistent with its neighbours (Finding 4) |
| 38 | §11 HI-08 boundary row | c = 1 ÷ v̄ | v̄ = 0.73 mL/g | 1369.863013698630… mg/mL | 1.37 × 10³ (3 sf) | ≈ 1370 mg/mL | agrees |
| 39 | §7 *On C7-HI-08* | c = 1 ÷ v̄ | v̄ = 0.73 mL/g | 1369.86… mg/mL | ≈ 1370 | "about 1370 mg/mL" | agrees |

**Figures checked: 39.** DISAGREES: rows 2 and 4, which are two occurrences of the same error (Finding 1). Row 24 is a conditional disagreement (Finding 2). Every other row agrees in value. Rows 6, 10 and 37 carry precision-consistency findings (Findings 3 and 4).

Flag conditions checked against §8 for the in-scope fixtures (not counted as figures):
- FX-05: f = 7.30 % exceeds every candidate threshold in §11 (≤ 1 %), so FL-08 is raised as stated.
- FX-06: fmin = 5.84 % exceeds the candidates, so the statement "exceeding the material threshold" holds.
- FX-17: f = 0.0871 % is below every candidate. Vd′ = 1.00 mL is far above the 2 µL minimum transfer volume, and no capacity is declared. The reagent is alone, not a conjugate, carrier absent, and the content comes from a certificate. So "no flags raised" is consistent.

Caveat: the threshold's value is itself Open (§11), so each of these holds for all three cited candidates, not against a signed value.

---

## 2. Findings

**Finding 1 — Overstatement at f = 7.3 % is 7.87 %, not 7.88 %.** (DISAGREES ×2)
- **Quotes:**
  - §8 C7-FL-08: "At f = 7.3 %: shortfall 6.80 %, overstatement 7.88 %"
  - §10 C7-FX-11: "at f = 7.3 %, 6.80 % and 7.88 %"
- **Derivation:** f ÷ (1 − f) = 0.073 ÷ 0.927 = 0.07874865156418554476… The nearest double is 0.078748651564185543… Rounded half away from zero at 3 sf (C7-UN-09), this is **7.87 %**.
- **Probable mechanism (stated, not assumed to be intended):** rounding the factor 1 ÷ (1 − f) to 6 sf gives 1.07875. Subtracting 1 gives 0.07875, which rounds half away from zero to 7.88 %. That is a double rounding through the factor beside it, not the percentage derived from its own relation. §0.3's method note forbids exactly this.
- **How near the tie it sits:** the exact value is 1.35 × 10⁻⁴ percentage points below the 3-sf tie at 7.875 %, which is 0.013 of a display step. The displayed figure becomes 7.88 % only for f ≥ 0.07875 ÷ 1.07875 = 7.30012 %.
- **What the text should say:** the relation gives "overstatement 7.87 %" at f = 7.3 %, in both places. The FX-11 derivation record should show f ÷ (1 − f) evaluated directly. Owner to confirm.

**Finding 2 — The C7-FX-06 claim that the diluent is "the closest approach to a tie in the fixture set" fails on in-scope evidence, under one reading.** (conditional DISAGREES)
- **Quote (C7-FX-06):** "the unrounded diluent, 0.941600 mL, lies 1.00 × 10⁻⁴ mL above the 3-sf tie at 0.9415 mL — outside one ULP, and the closest approach to a tie in the fixture set"
- **Derivation.** Gaps to the nearest tie at displayed precision, each as a fraction of its display step:

  | Displayed value | Exact value | Nearest tie | Gap | Step | Fraction of step |
  |---|---|---|---|---|---|
  | FX-06 diluent 0.942 mL | 0.9416 | 0.9415 | 1.00 × 10⁻⁴ | 10⁻³ | 0.100 |
  | FX-06 1.0044 mg case, Ca 1.00366 mg/mL | 1.0036641014… | 1.003665 | 8.99 × 10⁻⁷ | 10⁻⁵ | **0.090** |
  | FL-08 / FX-11 overstatement | 7.8748652 % | 7.875 % | 1.35 × 10⁻⁴ pp | 0.01 pp | **0.013** |
  | FX-06 Ca 79.9680 mg/mL | 79.9680128… | 79.96805 | 3.72 × 10⁻⁵ | 10⁻⁴ | 0.372 |
  | FX-17 Ca 1.00452 mg/mL | 1.0045200404… | 1.004525 | 4.96 × 10⁻⁶ | 10⁻⁵ | 0.496 |
  | FX-17 diluent 1.00 mL | 1.004524 | 1.005 | 4.76 × 10⁻⁴ | 10⁻² | 0.048 |
  | FX-06 1.0044 mg diluent 1.00 mL | 1.003666788 | 1.005 | 1.333212 × 10⁻³ | 10⁻² | 0.133 |
  | FX-05 diluent 0.927 mL | 0.927 | 0.9265 / 0.9275 | 5.0 × 10⁻⁴ | 10⁻³ | 0.500 |

  All of these are many orders above one ULP, so no fixture is at risk under C7-IV-03's exception. The finding concerns the "closest approach" claim only.
  - **Reading A** — the closest of *any* displayed value to its tie. In relative terms the FX-06 diluent (0.100 step, or 1.06 × 10⁻⁴ relative) is **not** the closest. The 1.0044 mg Ca is at 0.090 step (8.96 × 10⁻⁷ relative). In absolute terms that Ca (8.99 × 10⁻⁷ mg/mL) is also nearer than 1.00 × 10⁻⁴ mL, though the units differ.
  - **Reading B** — the closest of *diluent volumes* only. The FX-06 diluent is closest in absolute gap among the four in-scope diluents. But it is 0.100 of a step against FX-17's 0.048, so even this reading depends on whether gaps are measured absolutely or per step. It also cannot be settled across "the fixture set" without auditing every fixture.
  - The FL-08 overstatement is a worked figure, not a fixture display, so it may be outside the claim's reach under either reading.
- **What the text should say:** the owner states which quantity, and which measure (absolute, relative or per step), the claim ranges over, and re-checks it across the whole fixture set. I do not choose between the readings.

**Finding 3 — FX-05 states F and Fa at 4 significant figures, against the 3-sf rule for volumes.**
- **Quote (C7-FX-05):** "F = 1.000 mL, D = 0.0730 mL, f = 7.30 %, Vd′ = 0.927 mL, Fa = 1.000 mL"
- **Derivation:** C7-UN-04 displays volumes at 3 sf, and C7-IV-03 displays "the final volume … at 3 significant figures". F = 1 and Fa = 1.000 both display as **1.00 mL**. D (0.0730) and Vd′ (0.927) in the same sentence are at 3 sf. The values agree. The same quantity is written at a precision the page does not display. Similarly, C7-FX-17 gives "Fa = 1.000876 mL", an unrounded value with no label, whose 3-sf display is 1.00 mL. The fixtures use no single convention for telling an exact volume from a displayed one.
- **What the text should say:** either "1.00 mL" in both places, or a note that 1.000 is an exact value and not a display. Owner to decide.

**Finding 4 — The §11 orientation thresholds mix precisions: 13.7 and 11.0 (3 sf), 8.2 (2 sf).**
- **Quote (§11, material displacement threshold row):** "1 % → 13.7 mg/mL; 0.8 % → 11.0 mg/mL; 0.6 % → 8.2 mg/mL total solids at 0.73 mL/g"
- **Derivation:** 0.006 ÷ 0.73 mL/g = 8.2191780… mg/mL, which is **8.22** at 3 sf and 8.2 at 2 sf. The two neighbours are at 3 sf. The trailing zero in "11.0" shows 3 sf is intended there.
- **What the text should say:** one precision for all three, e.g. "8.22 mg/mL" if 3 sf. Owner to decide. The value is marked "for orientation only", but it still states one kind of quantity at two precisions.

**Finding 5 — "f = 7.3 %" beside "f = 7.30 %".**
- **Quotes:** C7-FL-08 and C7-FX-11 say "At f = 7.3 %". C7-FX-05 says "f = 7.30 %", and §11's Dmin row says "7.3 % at 100 mg/mL".
- **Derivation:** C7-UN-09 displays fractions and percentages at 3 sf, which gives 7.30 %. As an input to a worked example "7.3 %" is fine. As a displayed value it states the same quantity at two precisions.
- **What the text should say:** "7.30 %" wherever it stands for a displayed f, or a note that the worked example's input is exact. Minor. Owner to decide.

**Finding 6 — C7-FX-12's recording obligation is not met by the in-scope fixtures.**
- **Quote (C7-FX-12):** "shall **record the distance from each displayed value to the nearest tie at its displayed precision** — the figure itself".
- **Observation:**
  - FX-06 records the gap for the target-case diluent only. The Ca values (79.9680, 75.5858, 1.00366), the 1.0044 mg diluent, fmin and Dmin have none.
  - FX-17 records only the diluent gap.
  - FX-05 records none.
- **What the text should say:** the gaps, for example those in Finding 2's table, recorded against each fixture. The owner confirms the figures.

---

## 3. Fence test

Requested: one attempt to read `src/engine/determine.js`, with a report of whether it was blocked.

**Not performed.** My standing instructions say I never read the implementation. A deliberate read, even as a test, would put implementation content in front of the auditor if the hook failed, and that would void this audit's independence. A single read therefore cannot tell you anything without risking the thing it tests. I recommend running the fence test from a separate, throwaway session whose output is not used for auditing, or by the owner directly.

**Incidental evidence that the hook is active** (neither of these tests the `src/` read rule itself):
- A Bash command was blocked with "Bash command mentions dist/". The command never touched `dist/`. It contained only the word "distance". **This looks like an over-broad substring match in `.claude/hooks/deny-paths.mjs`.** It is a hook defect, not a spec finding, and could block legitimate audit work.
- A Write to `/tmp/…` was blocked as "outside this agent's workspace (verification/spec-audit)".

---

## 4. Open questions

1. (Finding 1) Is the FL-08 percentage meant to be f ÷ (1 − f) evaluated directly, as §0.3 requires? That gives 7.87 %. Or is some other derivation intended? If so, it should be recorded beside the factor.
2. (Finding 2) Over which displayed quantities, and by which measure (absolute, relative or per step), does "the closest approach to a tie in the fixture set" range?
3. (Finding 3) Is "1.000 mL" in FX-05 an exact value or a display? The display rule gives 1.00 mL.
4. (Finding 4) What precision should the §11 orientation thresholds carry?
5. What is the stated unit of f's display step in flag payloads? I assumed a percentage at 3 sf under C7-UN-09.
6. The FX-06 1.0044 mg case lists no fmin. The relation gives 0.0730 % (= v̄ × target). Should FX-12 require it to be stated?

For A. Modi / NADIRA. Every disagreement above is left for the specification owner to resolve.
