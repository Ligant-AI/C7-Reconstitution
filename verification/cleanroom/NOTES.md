# Clean-room C7 implementation: interpretations and ambiguities

Sources read: spec/reconstitution-urs-v1.0.md and verification/PROTOCOL.md only.
Run inputs: verification/cases.json (inputs only). No engine, tests, fixtures or comparison output seen.

## Order of operations (choices where the URS allows more than one)

1. C7-UN-03 / section 5: unit normalisation is one division or multiplication per quantity (ug/mg -> mg by /1000, g by x1000; mass in grams for displacement by /1e6, /1000; ug/mL etc. by /1000; ng/mL by /1e6; molar target: value / {1e3,1e6,1e9,1e12} x MW in g/mol). Alternative orders (e.g. multiplying by 0.001) differ in the last bit; not guessed.
2. D = solids_g x 0.73, where solids_g is the declared mass converted straight to grams (C7-DT-03, section 5). Dmin = content_g x 0.73 (content converted to grams directly, not via mg). The C7-FX-10 boundary fixtures are last-bit sensitive to this choice; the result was checked to reject at the "on" and "below" cases and pass "above".
3. F = content_mg / target_mg_per_mL (C7-DT-01). Entered diluent: F = Vd' + Dapp (section 5).
4. Vd = F - Dapp; Vd' = Vd converted to the displayed unit (mL in the target direction, the entered volume's unit in the volume direction), rounded to 3 sf there (C7-UN-04, C7-IV-03, PROTOCOL 3), then converted back to mL by division (x/1000 for uL). Fa = Vd' + Dapp; Ca = content / Fa (C7-DT-07). fmin = Dmin / F; f = D / F.
5. Concentrations displayed: Ca converted from the base unit (mg/mL, IU/mL, U/mL) to the display unit by one multiplication.
6. Rounding: Decimal(float) exact value, ROUND_HALF_UP (away from zero for positives) at n significant figures, with carry re-quantised (99.99 -> 100 at 3 sf) (C7-UN-06, PROTOCOL 4-5). Output uses fixed notation. A 6-sf display of a value >= 1e6 is written without exponent and padded with zeros (e.g. 1024890).

## Ambiguities and choices, by requirement

- **C7-DT-03 / section 5 Dapp, solids declared but basis "not recorded":** URS says solids may be declared under C7-VC-06 "where the basis is reagent alone", but section 5 says Dapp = 0 for basis not recorded "in either case with no solids mass declared", implying declared solids are used. Implemented: declared solids are used whenever present and the basis is not "total vial contents", whatever the basis, for activity content too (C7-FX-07 second case requires this for activity). Result: treatment "computed" for not-recorded basis with solids.
- **Total vial contents with solids also declared:** solids = content (C7-DT-03 "from a total vial contents declaration"); the declared field is ignored. C7-HI-07 is not evaluated in that case.
- **C7-HI-07 scope:** applied when content is mass-based, solids are declared and basis is reagent-alone or not-recorded (the bases whose declared solids are used). Not applied to activity content (no comparable mass) or total-vial-contents. Comparison is solids_mg < content_mg, strictly.
- **Dmin in `unrounded`:** URS section 5 defines Dmin for any mass-based reagent-alone content, but the PROTOCOL example shows Dmin null where solids are declared. Implemented: Dmin (and fmin) non-null only when Dmin is the applied displacement (treatment "reagent-own-volume-only"); null otherwise. D and f are null when D is not computable.
- **C7-FL-08 in the Dmin case:** FL-08 is evaluated on f = D/F. With only Dmin, f is undefined, so FL-08 is not raised; the "fmin exceeds threshold" statement belongs to the FL-05 payload (C7-FL-05) and is not a separate code. Threshold comparison is strict (f > threshold).
- **C7-FL-13 / FL-14 / FL-01 / FL-02 for activity content:** contentBasis and conjugate are "ignored" for activity per PROTOCOL; these flags are not raised for IU/U content. FL-05 and FL-11/12 apply regardless.
- **C7-FL-06:** evaluated as Fa > capacity (strict) in mL, only when a capacity is given. The extra wording for Dmin/none is payload text, not a separate code.
- **C7-FL-07:** Vd' (the displayed decimal, or the entered text) is compared with the minimum in exact Decimal arithmetic in uL (PROTOCOL 6); strictly below raises.
- **C7-FL-09:** raised whenever a C1 object is present and the pair is not permitted (including activity content, table row 3). Not raised when no C1 object. C7-FL-10 raised whenever the C1 object has any flag code, permitted or not.
- **Pairing table:** rows evaluated in order 1..11; for activity content the C7 content basis is treated as "the reagent (activity)" regardless of the contentBasis field, so a c1 object with activity content matches row 3 (after rows 1 and 2, which cannot match). Row 4 (reagent alone, conjugate not recorded) precedes the C1-side rows 5 and 6 as the table states. A row number outside 1-11 cannot occur for valid declarations.
- **C7-HI-03 / HI-09 in the volume direction:** the "concentration unit" is taken to be `reportUnit`. HI-03 is mass vs activity (IU or U) mixed; HI-09 is IU vs U. A molar target is not a "mixed dimension" for HI-03; molar targets are governed by HI-04 (activity content + molar target gives HI-04 only).
- **C7-HI-04:** molar target rejected when no C1 object, content is activity, or the pair is not permitted (rows 1-6, 10, 11).
- **Rejection collection:** all applicable codes among HI-01, 02, 03, 04, 06, 07, 09 are collected and listed ascending; HI-08 is evaluated only if none of them applies (PROTOCOL 8). HI-09 sorts after HI-08 in the table but the two never coexist.
- **C7-HI-08:** evaluated as Dapp >= F (D or Dmin, computed values, floating-point comparison) in the target direction and with a final volume entered; never with a diluent entered (F = Vd' + Dapp > Dapp). Not evaluated when Dapp = 0.
- **Not-representable (PROTOCOL 7):** after the non-HI-08 rejections, if F is not finite and positive -> not-representable (before HI-08); later, if Vd, Vd', Fa, Ca, D or Dmin are not finite positive -> not-representable. Unparseable/NaN inputs also end there. A zero Dapp (uncorrected) is not treated as a failure.
- **C7-DT-07 labels:** computed treatment -> "achieved" (diluent displayed: target direction or final entered) or "obtained" (diluent entered); Dmin -> "at-most"; none -> "uncorrected-for-displacement". Label for treatment "computed" with basis total-vial-contents remains achieved/obtained (the FL-01 flag and C7-DT-04 not-computable reagent concentration are outside the protocol's fields).
- **C7-DT-04:** the "reagent concentration not computable" cell has no protocol field; not represented.
- **Volume direction, `displayed.diluent`:** an entered diluent is echoed exactly as typed (PROTOCOL 3); a computed one is 3 sf in the entered volume's unit. `displayed.final` is Fa in the entered volume's unit.
- **`unrounded.target`:** the target in base units (mg/mL, or IU/mL or U/mL; molar target converted with the imported MW) in the target direction; null in the volume direction. `Ca` is always in base units, not the report unit.
- **Molar reportUnit (volume direction):** the current cases.json has one (ADV-UNSPEC-VOL-MOLAR-REPORT). Displayed as Ca / mw_g * scale (mw_g = MW in g/mol; g/L equals mg/mL), 6 sf, using the c1 MW. The order of the division and multiplication, and whether a withheld pairing should reject or withhold the display, are not fixed by the protocol (C7-UN-03, PROTOCOL 4); no pairing check is applied to a molar reportUnit.
- **Molar row for `molar`:** given for every case with a c1 object regardless of whether a molar unit was requested; status "reported" for rows 7-9, "withheld" otherwise.
- **C7-VC-06 / wholeVial:** wholeVial is not validated (always true in cases; C7-TG-04 compels it in the UI); no rejection code exists for it.
- **provenance "weighed":** no flag (C7-FL-03/04 only cover nominal and not-recorded).

## Amendment: directed rounding (spec/decision-2026-09-28-directed-rounding.md)

- **Decision items 1-3 / PROTOCOL 5:** when the label is "at-most" (C7-DT-07, Dapp = Dmin), `displayed.concentration` is rounded up (ROUND_CEILING, toward +inf) at 6 sf and `displayed.final` is rounded down (ROUND_DOWN, toward zero) at 3 sf, both on the exact binary value (Decimal(float)). All other displayed values, including `displayed.diluent` (C7-IV-03), keep half away from zero. The unrounded object is unchanged (item 6).
- **Interpretation, "at least" final:** taken to apply exactly to cases labelled "at-most", because Fa = Vd' + Dmin is then a lower bound on the true volume. The decision does not name the trigger for "at least"; "uncorrected-for-displacement" results are not treated as bounds by the decision text, so they stay half-away.
- **Interpretation, molar form:** the molar concentration is rounded up at 6 sf when label is "at-most" and molar report is displayed (decision item 1 "and its molar form"). No at-most case currently has a molar reportUnit, so this path is untested.
- **Carry:** a round-up carry keeps 6 figures (e.g. 99.99995 up -> 100.000); a round-down never carries.
- **Not applied:** item 5 (additivity bound) and the disclosed one-ULP limit are tolerance/register matters, not display computation.
- **Checked against the decision:** FX-06a 79.9681 / final 1.00; FX-06b 75.5858 / 1.05; FX-06c 79.9681; FX-06d 1.00367.

## Failure paths (PROTOCOL 7, amended): not-representable versus error
The blanket `except Exception` fallback is removed. `main` catches `NotRepresentable` (raised only by explicit decisions below) and maps it to "not-representable"; any other exception becomes `{"id","status":"error","message"}` for that case only.

Explicit not-representable decisions, each on a named quantity (PROTOCOL 7):
- Entered value that parses but is not finite ("NaN", "inf", overflowing string such as ADV-HOST-NAN, -INF, -OVERFLOW-STR): the entered quantity is not a finite double.
- Target in base units not finite positive (C7-DT-01, F = content / target): ADV-BND-HI02T-5em324, -1em320, ADV-HOST-TGT-1e-310-ng (unit conversion underflows to 0), ADV-HOST-MW-ZERO and ADV-HOST-MW-NEG (molar target c x MW <= 0; MW is not a URS rejection, so this is the relation's own quantity).
- F, Vd, Vd', Fa, Ca, D, Dmin, Dapp not finite positive (C7-DT-01/02/03, section 5): ADV-BND-HI01-5em324 and ADV-HOST-CONT-5e-324-UG (content so small Ca or Dmin underflows to 0).
- C7-FL-08 payload, diluent known: 1 - f is 0 in double because f = D/F rounds to 1 (D dwarfs the entered diluent): ADV-BND-HI02V-5em324, -1em320, ADV-HOST-VOL-1e-300-DIL, -5e-324-DIL, -1e-310-UL-DIL, ADV-HOST-SOL-1e300. These formerly crashed with ZeroDivisionError. Mathematically 1 - f = Vd'/F > 0, but it is not representable as a double difference, so the whole case is decided not-representable. Ambiguity: the URS does not say whether an unrepresentable optional payload should sink the whole determination, or only the payload; I chose the whole case since the flag is raised and its payload is a required output. Referred to the specification owner.

Error path (unexpected exception, reported per case):
- Unparseable numeric text (ADV-HOST-COMMA "1,000", -HEX "0x50", -EMPTY ""): ValueError. Not a quantity; previously silently turned into NaN.
- Out-of-protocol unit tokens (KeyError): ADV-HOST-MIX-SOL-IU, -MIX-VOL-MG, -MIX-TGT-UL, -UNIT-lower-iu, -UNIT-ug-ascii, -UNIT-micro-sign. The URS and PROTOCOL give no unit aliasing or rejection code for these; the owner should decide.

## Not implemented (outside the protocol's result fields)
Human-readable text, notebook copy, relations display, structured-object extras (upper-bound reason, embedded C1 object), C7-IV tolerance tests.

## Protocol 2: the `extended` block

Values checked against the URS: C7-FX-05 fl08 final known factor 0.932, shortfall 6.80 % (f = 0.073 exactly); C7-FX-06 Dmin 0.0584 mL, fmin 5.84 % exceeding the threshold, 1.00 mL entered fmin 5.52 %; C7-FX-17 departure +0.452 %; C7-FX-04 reagentConcentration not-computable.

**Derivation discrepancy with the URS text (C7-FL-08, C7-FX-11).** The URS prints an overstatement of 7.88 % at f = 7.3 %. Derived from the stated relation f / (1 - f) = 0.073 / 0.927 = 0.0787487, which displays as 7.87 % at 3 sf (half away). The clean-room value is 7.87 %; the printed 7.88 % looks like a transcription of 7.875. The factor 1 / (1 - f) = 1.0787 displays 1.08. Referred to the specification owner.

- **reagentConcentration (C7-DT-04):** "not-computable" exactly when content is mass-based and basis is total-vial-contents. Activity content: basis is the reagent by definition (C7-VC-03a), so "computable", whatever contentBasis says.
- **concentrationRounding and final (C7-DT-07, decision 2026-09-28 via PROTOCOL 5):** "up" / isLowerBound true / "down" exactly when the label is at-most (Dapp = Dmin); otherwise "half-away". Uncorrected-for-displacement is not a bound (as before).
- **departure (C7-DT-07, C7-FX-17):** target direction only. Non-molar target: Ca converted to the displayed (target) unit by one multiplication or division, divided by the target as typed, minus 1. Molar target: Ca / target, both mg/mL (target_base). The ratio is unit-independent mathematically; last-bit differences from other orders are possible. Ca is the unrounded Ca (not the displayed 6-sf string). Zero departure displays "0 %".
- **Percent/factor formats (PROTOCOL 2):** fraction rounded to 3 sf on the exact binary value, half away, then scaled by 100 exactly with Decimal (trailing zeros kept, e.g. "6.80 %", "-0.0400 %"); departure sign "+" when positive, "-" when negative. Factor 3 sf half away, no percent.
- **fl05 (C7-FL-05):** present exactly when Dmin is the applied displacement. Dmin display: mL in target direction, else the entered volume's unit, 3 sf half away (a bound rule is not applied to Dmin itself; it is not a bound on the final/concentration). fmin unrounded = Dmin / F (URS writes v̄ x content / F; same product, the multiplication is commutative so identical bits; in the target direction v̄ x target is an algebraically equal but not identical form, not used). F is the determination's F (entered diluent + Dmin when a diluent is entered). exceedsThreshold: fmin > threshold, strictly.
- **fl08 (C7-FL-08):** present exactly when flag 8 is raised. knownVolume "diluent" when a diluent is entered, else "final" (target direction or final entered). Forms as the URS writes them: final known factor 1 / (1 + f), percent f / (1 + f); diluent known factor 1 / (1 - f), percent f / (1 - f). Not F / Vd' (the algebraically equal form).
- **molar (C7-DT-06, §8):** null without a c1 object. "reported" only for rows 7-9 (of: reagent, protein, conjugate respectively, per the table's labelling). Unit: the molar target's unit in the target direction if the target is molar, else the case's molarUnit; if molarUnit is null and reportUnit is a molar unit (volume direction) I use reportUnit (not stated in PROTOCOL; no such case in cases.json has molarUnit null). If neither, status "unit-not-selected". Value: Ca / MW(g/mol) x scale (single division then multiplication); display 6 sf, rounded up when the label is at-most ("up") else half away. Withheld: all sub-fields null. The top-level `molar` (status reported/withheld) is unchanged and reports "reported" for a permitted pair even if unit-not-selected.
- **Not done:** C7-FL-08 for the Dmin case is still not raised (f undefined); therefore fl08 is null there.

## Amendment: departure of a bound (decision addendum 29 September 2026, T2)
- **departure (C7-DT-07, C7-FX-17, addendum):** `extended.departure` gains `isUpperBound` and `rounding`. Both follow the same trigger as the concentration: label "at-most" gives isUpperBound true, rounding "up", display at 3 sf rounded toward +inf on the exact binary value of the fraction (positive: away from zero, ROUND_UP on the magnitude; negative: toward zero, ROUND_DOWN on the magnitude), then times 100 exactly. Otherwise isUpperBound false, "half-away". The unrounded departure is unchanged (taken on unrounded values, C7-UN-07).
- **Interpretation:** the addendum says "at most" concentration; I take that to be exactly label "at-most" (Dapp = Dmin), as for the concentration and final. A departure exists only in the target direction. Toward-zero rounding of a negative value cannot yield zero, so "0 %" is unaffected. The sign prefix is applied as before ("+" when positive, "-" when negative).
- **Percent formats elsewhere** (fl05, fl08) keep half away from zero; the addendum does not direct otherwise.
- **PROTOCOL not-representable:** no departure from it; implementation unchanged.
