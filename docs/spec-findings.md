# Findings against URS v1.0, raised in build

Raised 28 September 2026 by the developer, for A. Modi and NADIRA. None of
these was resolved locally by changing a requirement; where the build had to
take a position, the position and its reason are stated.

## 1. C7-FL-08 / C7-FX-11: "7.88 %" is 7.87 % at 3 significant figures

§8 (C7-FL-08) and C7-FX-11 state that at f = 7.3 % the overstatement where the
diluent is entered is 7.88 %. f ÷ (1 − f) at f = 0.073 is 0.0787487…, which
rounds half away from zero (C7-UN-06) to **7.87 %** at the 3 significant
figures C7-UN-09 requires. 7.88 would need 0.07875 or above. The shortfall,
f ÷ (1 + f) = 6.80 %, is correct.

**Build position:** the engine applies C7-UN-06 and C7-UN-09 as written and
displays 7.87 %; the test (tests/engine.test.js) asserts 7.87 % and cites this
finding. **Requested:** correct the figure in §8 and C7-FX-11 to 7.87 %, or
state the precision it was quoted at.

## 2. C7-FX-05: "F = 1.000 mL … Fa = 1.000 mL"

C7-UN-04 displays volumes at 3 significant figures, so these display as 1.00.
Read as hand-calculation notation. **Requested:** write 1.00 in the fixture.

## 3. A quantity outside the representable range has no §7 code — *superseded 29 September 2026: now C7-HI-10 (URS v1.1 §7), item 18*

An entry such as a target of 1e-320 mg/mL makes F overflow to infinity. §7 has
no condition for it. **Build position:** no rejection code was invented; the
determination is not made, and the result area says that a needed quantity is
outside the range of representable numbers (C1's C1-FL-11 is the analogue on
the flag side). **Requested:** decide whether this is a §7 condition with its
own ID.

## 4. The shared `tool` field — escalated per C7-OUT-04

See escalation-tool-field.md.

## 5. The hosting provider's edge analytics (§14.1 claim 3; acceptance 17)

C3 1.0.1 allows Cloudflare Web Analytics through its CSP on the same host,
by the owner's decision of 24 September 2026, and rewrites its privacy text to
say so. C7 displays the v1.0 statement verbatim, which says "no analytics
scripts, and no third party code of any kind runs on this page". The C7 CSP
therefore allows nothing but 'self'. **If Web Analytics is enabled by automatic
injection at the zone level, it will be injected into this page too**; the CSP
blocks it, but acceptance 17 requires that no third-party code is loaded, and
a blocked injection still appears as an attempted load. **Requested:** confirm
injection is off for /reconstitution/ (or per-site, not zone-wide) before
deploy, and settle whether the two tools may carry different statements —
§14.1 says one text for every page.

## 6. Tool navigation across the siblings

C7's masthead lists "Reconstitution" after "Dilution". The siblings' navs do
not yet list it; adding it is a one-line change in each tool's config and is
outside this build.

## 7. No C1 export exists yet, so the molar route has no live producer

C1's source (Molarity Converter, last commit cc60a5c, 16 September 2026) builds
the structured object but writes no transport envelope; C4 open item 9 records
the C1-side change as required. C7's importer reads the envelope C4 specifies.
Every C1 import in C7's tests (C7-FX-09, C7-IV-05) uses **synthetic** C1
payloads built to C1's `serialise.ts` shape. The import panel says that C1 does
not yet offer a link. Re-test with real C1 output when the export ships.

## 8. Found by the independent spec auditor (verification/spec-audit/audit-2026-09-28-smoke.md)

A narrow-scope run of the c7-spec-auditor agent, which cannot see this file or
the code, checked 39 figures on 28 September 2026. It reached item 1 above
(7.88 % → 7.87 %) independently, and traced the likely source: 1 ÷ (1 − f)
rounded to 1.07875 before subtracting 1 — a double rounding. It also raised:

- **C7-FX-06, "the closest approach to a tie in the fixture set"** is false if it
  covers every displayed value: the 1.0044 mg case's concentration lies 0.090
  of a display step from its tie, against the diluent's 0.100. True or false
  for diluent volumes only depending on absolute or per-step distance.
- **§11 / outstanding item 1: 8.2 mg/mL** is given at 2 significant figures
  beside 13.7 and 11.0 at 3 (8.22 at 3 sf).
- **7.3 % and 7.30 %** used for the same fraction in C7-FL-08/C7-FX-11 and C7-FX-05.
- **C7-FX-12** tie distances are recorded in §10 only for the diluent; the
  auditor computed the others. (docs/fixture-record.md carries them for every
  displayed value.)

## 9. Found by the clean-room implementation (verification/cleanroom/NOTES.md)

**Solids declared with content basis "not recorded".** C7-VC-06 offers the
total solids mass only where the basis is the reagent alone; C7-DT-03 and §5's
Dapp say displacement is computed "where the total solids mass is known". The
clean room computes D from declared solids whatever the basis; the engine never
receives solids under "not recorded", because the page does not offer the field
(C7-VC-06 read strictly). The input is not reachable from the page, and no case
exercises it, so the two implementations do not disagree on any case — but the
URS text supports both readings. **Requested:** state whether a solids mass can
be declared under "not recorded", and if so whether it is used.

Clean-room comparison, 28 September 2026: 58 cases, 572 of 572 unrounded values
bit-exact, 0 disagreements (verification/cleanroom/comparison.md). The agent
read only spec/, verification/PROTOCOL.md and verification/cases.json
(verification/access-log.jsonl).

## 10. Found by the independent fixture author (verification/fixtures/expected.json)

322 fixtures derived from the URS alone; after the fix below, 0 mismatch with
the engine (verification/fixtures/check-report.md), and the clean room agrees
with the engine on all 322 cases, 2981 of 2981 unrounded values bit-exact
(verification/cleanroom/comparison-independent-fixtures.md).

- **Build defect found and fixed:** the C7-FL-08 threshold was read only from
  the registered constant, so a configured threshold (PROTOCOL.md; the handoff's
  "configure, don't hard-code"; C7-FX-10's threshold boundary) was ignored.
  `determine()` now takes `materialThreshold` as configuration, defaulting to the
  registered value; the page passes none. 10 fixtures had exposed it.
- **Spec ambiguity — a cross-family concentration unit in the volume direction.**
  C7-HI-03 and C7-TG-02 speak of the *target*; C7-HI-09 speaks of "a target or
  concentration unit". The build rejects a mass content reported in IU/mL (or
  the reverse) under C7-HI-03, reading it as HI-09's pattern; the page offers
  only same-family units there, so it is not reachable from the page.
  **Requested:** say whether C7-HI-03 covers the reported concentration unit.
- **Verification gap, not a spec gap:** the comparison protocol carries no field
  for the C7-DT-04 not-computable reagent cell, the C7-FL-05/FL-08 payload
  factors, the "at least" label on Fa, the molar value, or rejection wording.
  Those are covered by the builder's own tests only, not yet independently.

## 11. Full independent spec audit (verification/spec-audit/audit-2026-09-28-full.md)

114 items checked, 8 distinct errors, 26 findings, 18 open questions; the
auditor read only spec/ and its own earlier audit (verification/access-log.jsonl).
Re-verified by the builder: items 1, 3 and 7 below.

**Decision needed — affects what the tool displays (auditor finding 7).** An
upper bound rounded half away from zero can display *below* the bound it
states: C7-FX-06's "at most 79.9680 mg/mL" is smaller than its own unrounded
bound 79.9680128…, "at most 1.00366" smaller than 1.0036641…, and an "at least"
final volume of 1.0584 mL displays as "at least 1.06". The build does what the
URS fixes (C7-UN-05/06, C7-FX-06, the 28 September decision on 6 sf for an
upper bound). Directed rounding — up for "at most", down for "at least" —
would make every displayed bound a true bound but changes C7-FX-06's figures
(to at most 79.9681, at least 1.05) and CR-C3-01's "no additional derivation".
Not changed in the build pending that decision.

**Other numeric findings:** 7.88 % → 7.87 % (confirmed, item 1 above) and so
Annex gate 5a's "clean"; §6 table row 3 reaches **5** units in the last place,
not 4 (content 9.22236004065437 mg, target 89.59731971472989 mg/mL, solids
137.6938 mg — re-verified); §6's simulation domain includes HI-08-rejected
inputs and its "fourth to sixth significant figure" reaches the third at
f ≳ 20 %; §11's "0.378 at 100 mg/mL" crossover holds only with the final volume
known; C7-FX-06's "closest approach to a tie" is false over all displayed values.

**Cross-references and statuses:** §0.1/§15 cite outstanding item 8 for
mass↔activity (§17 numbers it 9); C7-ST-08 cites a non-existent acceptance 26
(15a matches); "two citations outstanding" should be three (ISO 7886-1);
displayed-volume resolution is "Characterised" but has no external citation;
acceptance 17 says five claims and lists four; the handoff calls FX-08 and FX-17
negative controls where §10 names one; the CR says both CRs sit at C7-ST-08.

**Wording the build carries verbatim:** C7-FL-07's remedy names "a lower target
concentration" in directions with no target; C7-VB-02 "the difference is the
displacement applied" does not hold between the entered and derived volumes
when a final volume is entered; §8's no-flags sentence omits the C1 conditions.

## 12. Black-box adversarial test (verification/adversarial/report-2026-09-28.md)

**Build defects found and fixed** (engine 0.1.0; regression tests added):
F-1 a crash when f rounds to 1 with a tiny entered diluent (fixed at its cause:
the C7-FL-08 factors are computed as F ÷ Vd′ and D ÷ Vd′, the same relations
without cancellation); F-2 rejections not in §7 order; F-3 C7-HI-08 firing on
underflowed zeros; F-4 an out-of-range positive entry treated as ≤ 0. §7's value
conditions are now evaluated on the exact entered decimals.

**Questions for the specification owner** — all at the edge of the double
range; none affects a physically meaningful reconstitution:
- C7-HI-08 "cannot fire with a diluent entered" (exactly true) against
  "evaluated in this form, on computed values" (binary F = Vd′ + D can equal D
  for Vd′ ≲ 10⁻¹⁸ D). The engine follows the first sentence.
- Is a flag payload (the C7-FL-08 overstatement factor) a "needed quantity"?
  The engine says yes, so a diluent of 5e-324 mL is not representable; the
  clean room, which does not compute payloads, returns a result.
- Clean-room comparison over all 945 in-protocol cases (58 shared + 887
  adversarial): 938 agree fully, 8815 of 8822 unrounded values bit-exact. The 7
  disagreements are the two questions above (4 cases), the exact-decimal
  reading of C7-HI-07 and C7-HI-01 (2 cases — the engine follows the URS
  wording "stated", the clean room compares doubles), and item 9's "not
  recorded" basis with solids (1 case).

## 13. Decision on item 11 (directed rounding) — implemented

A. Modi decided on 28 September 2026 to adopt directed rounding for displayed
bounds; recorded as spec/decision-2026-09-28-directed-rounding.md, NADIRA's
sign-off pending. Implemented in the engine (an "at most" concentration and its
molar form rounded up; an "at least" final volume rounded down; the result
object states each bound's rounding), the page register, PROTOCOL.md
convention 5, the builder's tests and fixtures, and the same-author Python.
C7-FX-06 now displays at most 79.9681 / 1.00367 mg/mL and, with 1.00 mL
entered, at most 75.5858 mg/mL and at least 1.05 mL. **The URS text of
C7-UN-05/06 and C7-FX-06 still needs amending to match**, and CR-C3-01 should
say that C3 rounds derived bounds up on the same terms.
- **Decision text, for the owner:** it names the "at least" final volume but not
  its trigger. The engine and the clean room both apply it exactly when the
  concentration is "at most" (Dapp = Dmin, so Fa = Vd′ + Dmin is a lower bound);
  an uncorrected result keeps half-away rounding. Worth stating in the decision.
  Clean-room comparison after the decision: the same 7 edge disagreements as
  before and no new ones — every displayed bound agrees.

## 14. UI verification (verification/ui/report-2026-09-28.md)

Five of six checks pass in real Chrome; the stale additivity wording it found
is fixed. **For ZURI (tool-set design, per C7-NF-11):** the shared chrome shows
the mark and "Ligant" at the left and "BENCH TOOLS" at the right, never "Ligant
Bench Tools" as one phrase — does that meet C7-NF-10's "brand, then plain
descriptor"? It is C3's chrome unchanged, so the answer applies to every tool.

## 15. Cross-tool contract check (verification/contract/report-2026-09-28.md)

C1 at cc60a5c, C3 at 59aed26 (v1.1.1), C4 at 02fc5bf; all five checks re-run and
reproduced by the builder.
- **C7-OUT-04:** every field present in 18 objects. **Build defect found and
  fixed:** C7's validator did not itself enforce several fields (capacity value
  and unit, Dmin and fmin, target and entered-final units, the molar form, the
  embedded C1 object's content, the bound rounding directions); it now does,
  with a test that each loss is caught. Acceptance 4 stays **not discharged**
  until the shared format version is published (item 8).
- **Format conflicts E2 (`schema`) and E4 (`{ value, unit }`)** added to
  docs/escalation-tool-field.md beside E1 (`tool`).
- **C1 → C7:** C1 emits no envelope; the molar path stays undischarged. A
  supplementary run with *real* C1 engine-0.5.0 objects through a simulated
  writer matched every §8 row (discharges nothing).
- **C1's rounding convention, for the C1 owner and NADIRA:** C1 live states
  `roundingMode: "half-to-even"`, while URS §0.4 names half away from zero as
  inherited "C1 onward". C7's arithmetic is unaffected (it uses C1's unrounded
  molecular weight), but the embedded C1 object's displayed strings are
  half-to-even. URS line 40 already lists the rounding convention as a C1 v0.6
  dependency.
- **C7 → C3:** C3 refuses every form of C7's stock (no envelope code; the import
  panel is hidden). **CR-C3-01 and CR-C3-02 are not implemented.** Shown by
  execution: C7's "at most 79.9681 mg/mL" typed into C3 and diluted to 10 mg/mL
  comes back as a point value, 9.99601 mg/mL, with no "at most" — the loss the CR
  exists to prevent. C3 answers an IU/mL stock with "not a concentration unit",
  which avoids treating it as mass but is not the explicit refusal CR-C3-02 asks
  for. **CR-C3-01 also needs the directed-rounding clause** (round derived
  bounds up).
- **Transport:** C7's envelope is byte-compatible with C4's (identical canonical
  form, checksum and bytes; both directions decode; the same tampering is
  refused). Neither C3 nor C4 has a receiver for `c7-stock` yet.

## Current figures (supersede the counts quoted in items 9, 10 and 12)

As re-run by the evidence clerk and the builder, 28 September 2026, after the
directed-rounding decision: `npm test` 82 tests — 79 pass, 0 fail, 3 skipped
(the three tolerance-gated invariance tests). Independent fixtures: **338**
(287 result, 51 rejected), 0 mismatching. Clean room on those 338: 3157 of 3157
unrounded values bit-exact, 0 disagreements. Clean room on the shared set:
**961** cases, 945 compared (16 outside PROTOCOL.md), 8815 of 8822 values
bit-exact, 7 disagreements — all adversarial edge cases listed in item 12, none
among the 58 builder cases. The ledger is docs/evidence-ledger.md.

## 16. Protocol 2 — independent verification of the remaining outputs

PROTOCOL.md protocol 2 adds an `extended` block (C7-DT-04 reagent cell, bound
rounding and the "at least" label, the departure from target, the C7-FL-05 and
C7-FL-08 payloads, the full molar form). The clean room implemented it from the
URS alone and **derived 7.87 %** for the diluent-known overstatement.

- **Independent fixtures (338):** clean room and engine agree on every field,
  including every extended field; 3490 of 3495 values bit-exact, 5 within the
  provisional bound (last-bit differences between algebraically equal forms).
- **Shared set (945 in protocol):** 7 disagreements. Two are new and are
  **numerical, not specification, differences**: ADV-BND-HI08-DIL-0 and -1
  (a 1 µL / 1 nL diluent against 730 mL / 730 000 mL of displacement). Against
  exact arithmetic the engine's C7-FL-08 factor is within 6 × 10⁻¹⁷; the clean
  room's is off by 8 × 10⁻⁹ and 5 × 10⁻² — it evaluates 1 ÷ (1 − f) literally,
  and 1 − f cancels when f → 1. The engine evaluates the same relation as
  F ÷ Vd′ (1 − f = Vd′ ÷ F exactly) for this reason (adversarial finding F-1).
  The same cancellation explains ADV-HOST-VOL-1e-300-DIL and ADV-HOST-SOL-1e300,
  where the clean room reports not-representable. **For the specification
  owner:** C7-FL-08 writes the factor as 1 ÷ (1 − f); an implementation that
  evaluates that literally loses accuracy as the diluent becomes negligible, so
  the URS may wish to state F ÷ Vd′ (and D ÷ Vd′ for the overstatement) as the
  evaluated form, as it already does for C7-HI-08 ("evaluated in this form").
  The other five disagreements are the edge questions of items 9 and 12.
- **Fixture author, protocol 2 (344 fixtures, 293 results / 51 rejections):**
  hand-derived `extended` expectations on every result — reagent cell, bound
  rounding and "at least" (293), departure (101, including C7-FX-17 +0.452 %),
  C7-FL-05 payload (48), C7-FL-08 payload (27, 7.87 % derived), molar form (69:
  24 reported, 39 withheld, 6 unit-not-selected). 0 mismatching the engine; the
  clean room agrees on all 344 (3565 of 3570 values bit-exact, 5 last-bit). The
  21 results whose true departure is zero display exactly "0 %" in the engine.
  Values the author could not fix exactly (near a critical point, or where the
  double and exact-decimal chains differ) are omitted and listed in
  verification/fixtures/extended-omissions.json. **Open for the owner:** whether
  a molar figure is the unrounded Ca ÷ MW (as both implementations and the
  fixtures read it) or the displayed Ca ÷ MW.

## 17. Build test of 29 September 2026 (findings T1, T2)

Every figure the tester drove in Chrome reproduced, including the directed
bounds, 7.87 %, and the Dmin/HI-08 behaviour. Two findings, both fixed:
- **T1 — an out-of-range refusal was filed as "declarations incomplete".** It now
  has its own status and state, "Not computed — outside the range of the
  arithmetic", naming the quantity (e.g. "the final volume of the
  determination, F") and stating that this is a limit of the arithmetic, not a
  physical impossibility. **Open:** the tester cites an amended URS in which
  this is **C7-HI-10**, and refers to amendments numbered 5 and 7, D12 and V5.
  That text has not been supplied to the build; the code is not invented, and
  will be bound to C7-HI-10 when the amendment is provided.
- **T2 — the departure was taken on a value other than the one it names.** It
  is now labelled "on the unrounded values", and where the concentration is
  "at most" the departure is itself an upper bound, labelled "at most" and
  rounded toward +∞ (addendum to the directed-rounding decision): C7-FX-06
  at most −0.0399 % (was −0.0400 %), 1.0044 mg at most +0.367 % (was +0.366 %).
  Not yet exercised by the tester: the notebook copy and structured object
  (acceptances 15a, 24).
- **T2 re-verified independently.** The fixture author re-derived 352 fixtures
  under the addendum (8 existing departures changed, e.g. −0.0400 → −0.0399 %,
  +0.366 → +0.367 %, +0.0346 → +0.0347 %; 8 new direction tests: positive bounds
  that must round up, negative bounds that must move toward zero, a molar
  target, and a non-bound control): 0 mismatching the engine. The clean room
  implemented the addendum from its text: 0 disagreements on the 352 (3679 of
  3684 values bit-exact).
- **Verification-method defect found and fixed.** The clean room had a blanket
  exception fallback that reported crashes as "not-representable"; 13 cases
  (6 ZeroDivisionErrors from its literal 1 ÷ (1 − f), 7 KeyErrors on
  out-of-protocol units) were agreeing with the engine by masked crash, not by
  computation. PROTOCOL.md convention 7 now forbids mapping an exception to a
  status (a crash is `error`, always a disagreement), the harness counts it,
  and the clean room decides not-representable only explicitly on a named
  quantity. Re-run: 0 errors; 945 compared, 8 disagreements — the two
  cancellation cases (item 16), the exact-decimal readings of C7-HI-07/HI-01
  (now including content "1e400" against 100 mg solids: the engine rejects
  under C7-HI-07 on the stated decimals, the clean room calls the content not
  representable), and item 9's "not recorded" basis with solids.

## 18. Re-test of 29 September 2026 — T1, T2, acceptances 15a and 24

NADIRA re-tested in Chrome: T2 fixed and its basis carried in the object
(`ratioOf`); T1 fixed and **C7-HI-10 now bound** — the code is URS v1.1 §7's, on
the specification owner's instruction (**URS v1.1 is not yet in spec/**; this
build has worked from v1.0 plus the recorded decisions); acceptances 15a and 24
pass on a bound case (notebook copy and decoded stock envelope). **Directed
rounding behaviour signed, NADIRA, 29 September 2026**, against engine 0.1.0;
the decision document and addendum await her reading. The 8 disagreements are
set out for her ruling in docs/disagreements-2026-09-29.md. The crash-masking
defect is now standing verification rule 3 (verification/README.md).

## 19. Re-verification after the ledger refresh (29 September 2026)

- **Hook gap closed** (found by the evidence clerk): a file named relative to a
  `cd` in the same command (`cd verification; grep … check-fixtures.mjs`) was
  allowed. The hook now resolves every path through the command's `cd`s and
  matches denied files by name. The exposure was the fixture comparator's
  shape, no engine arithmetic; the ledger marks the protocol-2 fixtures
  "independence in question" accordingly.
- **Standing rule 3 shown capable of failing** (tests/harness.test.js): an
  injected crash, and a crash disguised as "not-representable", are each
  counted as a disagreement by compare.mjs; a perfect implementation is not.
- **Contract checks re-run on today's build** (T1, T2, C7-HI-10): 0 failures, 0
  mismatches, 0 wire failures.
- **Adversarial suite re-run on today's build:** 143 oracle findings, of which
  140 (119 cases) are every one a Dmin "at most" case the oracle still expects
  rounded half-away — its oracle predates the directed-rounding decision; in
  all 119 the engine rounded up/down as signed. The other 3 are item 12's known
  HI-08/range questions. The oracle is being updated by the adversarial agent
  itself, not by the builder.

## 20. Adversarial re-run against the amended specification (verification/adversarial/report-2026-09-29.md)

**No failures against the engine**: 1,959 cases against an oracle updated by the agent
itself; every effective mutant caught. It found a tooling failure in its own 28
September run (one hostile case never judged — rule 3) and fixed another in this run.
Protocol and adapter gaps it exposed are fixed (C7-HI-10 and the named quantity now
visible to a black box; molar vocabularies; `unit-not-selected` in both directions; no
exponent only in computed displays). **For NADIRA, on the decision text:** its
"Stated limit" covers only the upper bound; the adversarial run shows the mirror case —
an "at least" final whose double is exactly 1.25 mL while the exact sum is
1.2499999999999999366 mL displays 1.25, one step above the exact lower bound. The
register now discloses the limit for both bounds; the decision should say the same.

## 21. NADIRA's pre-deploy memo, items 8 and 11 (29 September 2026)

- **Item 8 — declarations clearing during browser sessions.** Investigated, not
  assumed. The dev server logged 17 full page reloads during the day's edits
  (Vite reloads the page on every source change); no code path in the page
  clears a declaration (the only field it ever resets is the report-unit list,
  when the content unit changes family); and a reload clears every field
  uniformly, so the half-cleared state observed was most likely a reload landing
  mid-session with the text fields then re-entered. Rather than rest on that
  reading, the page now **resets the form explicitly on every load** (C7-ST-04:
  whatever a browser attempts to restore, nothing entered before a reload can
  reappear, so a half-restored set of declarations cannot arise). Found and
  fixed in the same change: the reset would have blanked the minimum transfer's
  suggested "µL" (set by script, not as the control's default) — it is now the
  default. Verified in Chrome: a fresh load and a reload both show 2 µL, marked
  as a suggestion; after a reload no field holds a prior value; a C1 transport
  link still imports. Acceptances 18 and 19 are to be re-run at the deployed
  address, where no dev server exists.
- **Item 11 — the crash rule across the tool set.** C7: standing rule 3,
  enforced and shown capable of failing (tests/harness.test.js). **C4**
  (02fc5bf): `reimpl/compute.py` and `titration.py` have no exception handler;
  any failure aborts the run and fails `compare.test.ts` (its own header:
  "a gate that quietly passes when it cannot be run is worse than no gate") — no
  crash can be counted as agreement. Re-run read-only: 17 of 17 pass, working
  tree unchanged. It records that it too is a same-author reimplementation.
  **C1** (cc60a5c) and **C3** (59aed26) have **no second implementation** to
  check — acceptance 3 is undischarged for both on that ground, not on this one.

## 22. Deployed at https://benchtools.ligant.ai/reconstitution/ — 29 September 2026

Pages project `ligant-reconstitution` (Ligant.ai account) behind router Worker
`ligant-reconstitution-router`, on the pattern of the sibling tools. Verified by
`c7-deploy-verifier` (verification/deploy/report-2026-09-29.md):

- **Acceptance 16 FAIL, 17 FAIL, 25 partial — one cause: the hosting edge injects
  Cloudflare's Web Analytics beacon** (`static.cloudflareinsights.com/beacon.min.js`)
  into every browser-like response on the **whole hostname** benchtools.ligant.ai —
  the catalog root, C7 and the sibling tools alike (confirmed by the builder with
  browser request headers); the project's own `ligant-reconstitution.pages.dev`
  address is clean. C7's CSP blocks it, but it is an attempted load of third-party
  code, which §14.1 claim 3 forbids. **Correction:** the builder had reported the
  precondition (NADIRA's memo, item 1) as clear on the basis of non-browser
  requests, which the edge serves clean; that conclusion was wrong.
  `check-headers.mjs` now requests like a browser and catches it. **Owner action:**
  in the Cloudflare dashboard, turn off Web Analytics automatic setup for the
  benchtools.ligant.ai hostname, or add a rule excluding `/reconstitution/*` — not
  something the build can do. It bears on every sibling page's privacy claim too.
- **Claim 5 (repository) FAIL, as expected:** github.com/Ligant-ai/C7-Reconstitution
  is public but empty — the commit is ready; `abmodi-ai` has read-only access.
- **Claim 2 passes for C7** (no C7 data in any storage). Found on the shared origin,
  for the owner: localStorage keys of other tools (`adc.state.v1`, `c4.state.v1`,
  `cyto.state.v1` — C4's is its known finding B2) and cookies not set by this page
  (`_ga`, `_ga_9V1GYE3KRX`, `_cs_c`, `_cs_id`) — likely domain-wide cookies from other
  Ligant sites; their Domain attribute needs checking, and they bear on the "no
  cookies for advertising" wording (outstanding item 4, THERON).
- **Acceptances 18 and 19 PASS** at the deployed address (reload clears everything;
  re-entry reproduces exactly; changing a declaration recomputes).
- **C7-NF-05 not re-measured:** the iframe sweep is (correctly) blocked by
  `frame-ancestors 'none'`, and the verifier's viewport could not be set to
  1366 × 650. A top-level sweep (`verification/ui/sweep-toplevel.js`) now exists;
  it refuses to measure at any other viewport. Logic-tested on the dev server
  (not a measurement). The 349 px register figure stays marked "development build".

## 23. NADIRA's production note under the new data policy (29 September 2026)

Policy (A. Modi, via NADIRA): entered data never leaves the browser, no exceptions;
usage analytics are collected. Done on C7, deployed and pushed:
- **Item 1:** the privacy sentence production contradicts is withdrawn on the page
  ("no tracking … no cookies for advertising, no analytics scripts, and no third
  party code of any kind runs on this page"); the page states "tool-set text v1.0,
  one sentence withdrawn … pending version 2". Version 2 wording is A. Modi's with
  THERON; the other live pages are their tools' own repositories.
- **Item 3 (URL):** C7 writes no entered value into any URL; a C1 transport envelope
  read from `#c1=` is now removed from the address once in the import field.
- **Item 5:** sentinel test run on C7 at the deployed address — pass, trivially
  (no outbound connection is possible under the current CSP); procedure written
  for re-running once analytics can report (verification/deploy/sentinel-test.md).
- **Item 6:** amended acceptances 16 and 17 drafted for review
  (spec/proposed-amendment-privacy-2026-09-29.md), with the C7-NF-12 conflict and
  the fragment-transport caveat.
Checked: the repository is public and **Apache-2.0** when viewed logged out (the
"MIT" observation is not what the repository shows); ligant.ai's homepage currently
loads no Google Analytics or Contentsquare script, so the `_ga`/`_cs_*` cookies are
`.ligant.ai`-scoped and set by something not loading today; `adc.state.v1` is the
Antigen Density Calculator's and `c4.state.v1` the titration planner's;
`cyto.state.v1` is in no local source — the older `ligant-bench-tools` Worker or the
`ligant-tools` Pages project are the likely origins (owner to confirm).
Owner decisions: which analytics run, the CSP endpoints, Contentsquare and GA4 on
tool pages, the cookies' scope, and the other tools' localStorage.
