# C7 Reconstitution — evidence ledger

Keeper: c7-evidence-clerk. Date: 29 September 2026. This replaces the ledger of 28 September 2026 (the first). Scope: URS v1.0 as amended by `spec/decision-2026-09-28-directed-rounding.md` and its 29 September addendum. **Behaviour signed by NADIRA on 29 September 2026 against engine 0.1.0; the decision document and addendum are not signed; the URS text (C7-UN-05/06, C7-FX-06, C7-IV-03, the register) is still not edited.** URS v1.1, which defines C7-HI-10, is **not in `spec/`**: the code C7-HI-10 in the engine is bound on the specification owner's instruction and cannot be checked against any file in this project.

Nothing is deployed. Every claim is about the development build (engine 0.1.0) or about files. The deployed address is untested.

## How to read the statuses

- **Discharged**: an evidence file shows the acceptance's own test was run and passed on the object it names.
- **Pending**: evidence exists but is partial; the entry says what is missing.
- **Blocked**: discharge needs something outside the build; the §17 owner is named. Where a row has both a partial part and an external part it takes the most restrictive status.
- **Not discharged**: no evidence.
- "Independent of the builder?" is its own column. "Independence in question" marks evidence from an agent with a blocked or leaked access (Section 5).

## What I re-ran this session (one at a time)

| Run | Result |
|---|---|
| `npm test` | 84 tests: **81 pass, 0 fail, 3 skipped** (the three "within the derived tolerance" tests for C7-IV-01, -04, -05; tolerance open, item 3; measured worst 0.000e+0). Was 82 / 79 / 0 / 3. The two new passing tests are T1 and T2. |
| `node verification/check-fixtures.mjs` | **352 fixtures, 0 mismatching** (was 338 / 0). Compares status, rejections, flags, label, treatment, molar, displayed strings and, where an entry states it, the protocol-2 `extended` fields. It runs the engine directly; an engine exception would stop the script with a non-zero exit, not report agreement. |
| `node verification/compare.mjs --cmd "python3 verification/cleanroom/impl.py"` | 961 cases, 945 compared, 16 excluded as outside PROTOCOL.md. 10222 unrounded values: **10168 bit-exact, 42 within the provisional 1e-12**, 12 in disagreeing cases. **8 cases disagree**, no implementation errors. All 8 are `ADV-` ids: ADV-BND-HI08-DIL-0, ADV-BND-HI08-DIL-1, ADV-BND-HI07-DEC-BELOW, ADV-UNSPEC-NR-WITH-SOLIDS, ADV-HOST-VOL-1e-300-DIL, ADV-HOST-SOL-1e300, ADV-HOST-OVERFLOW-STR, ADV-HOST-UNDERFLOW-STR. None of the 58 builder cases disagrees. |
| same, `--cases verification/fixtures/expected.json --out /tmp/c.md` | 352 cases, 3684 unrounded values: **3679 bit-exact, 5 within 1e-12, 0 disagreements**. |
| Not re-run | `verification/contract/check1..5*.mjs` (they use prebuilt bundles that predate T1/T2/HI-10, so re-running would not test the current engine; the 28 September result stands only for the build of that date); `verification/adversarial/suite.py` (report dated 28 September, before the decision, T1, T2 and protocol 2); the UI sweep (browser); `verification/deploy/check-headers.mjs` (no deployed address). |

Side effect: the two default-output runs rewrote `verification/cleanroom/comparison.md` and `verification/fixtures/check-report.md`; `diff` against copies taken beforehand showed no difference, so the files on disk are the re-run's.

### Crash versus decision (verification/README.md standing rule 3)

- `verification/cleanroom/impl.py` `main()`: only an explicit `NotRepresentable` (raised on a named quantity) becomes `not-representable`; any other exception becomes `{"status":"error","message"}`. No blanket fallback remains.
- `verification/compare.mjs`: an `error` result adds a "implementation error" difference, so it is always a disagreement; a non-zero exit or unparseable output stops the run; a missing id is a disagreement. PROTOCOL.md convention 7 states the rule.
- The re-runs above report no error rows. **The 28 September clean-room comparisons ran with the exception fallback (13 cases agreed by masked crash) and are marked "not evidence"**; the 28 September ledger's "7 disagreements, 3157/3157" figures are superseded by the table above.
- Not shown: any recorded demonstration that the harness counts an injected crash (`harness-selftest.md` shows only an empty implementation giving 58 disagreements). The rule is enforced in code I read; the test that it can fail (rule 2's lesson) is not on file.
- The adversarial tester's definition says failures in its own tooling are failures; its run predates rule 3 and I could not re-derive this.

### Transcription notice (unchanged)

`verification/ui/report-2026-09-28.md`, `verification/adversarial/report-2026-09-28.md`, `verification/contract/report-2026-09-28.md` were written by the builder from the agents' returned text, not by the agents. **`docs/spec-findings.md` item 18 (NADIRA's re-test of 29 September) is likewise a builder transcription of her report; no primary record of it is in the project.** I weigh all four as builder-reported. Deployment notice: acceptances 16, 17, 25 and every deployed-address half cannot be discharged from any file that exists.

## Section 1. URS §16 acceptances

Keys. **Tests** = `tests/engine.test.js` (builder). **Fixtures** = `verification/fixtures/expected.json` via `check-report.md` (c7-fixture-author; generator in `verification/fixtures/generator/`; 352/0 now). **Clean room** = `verification/cleanroom/impl.py` and comparisons (c7-cleanroom). **Adversarial**, **UI**, **Contract** = the 28 September transcribed reports. **Audit** = `verification/spec-audit/audit-2026-09-28-full.md` (spec only). Shared assumption: fixtures and clean room both work from `verification/PROTOCOL.md`, which the builder wrote, including the protocol-2 `extended` block that mirrors the engine's result object.

| Acceptance | Requirement (short) | Evidence (file and section) | Produced by | Independent of the builder? | Status | Blocked on / owner |
|---|---|---|---|---|---|---|
| 1 | Whole-vial reference case vs hand calculation, both directions, tie properties recorded | Fixtures IND-FX-05-*, hand derivation and tie distances; Tests C7-FX-05; re-run 352/0 | c7-fixture-author | Yes on the log; *protocol-2 fixtures: independence in question (Section 5, one allowed read of the comparator)* | **Discharged** (dev build) | The URS prints "1.000 mL" (finding 2). |
| 2 | Non-round case (C7-FX-01) vs hand calculation | Fixtures IND-FX-01a..d | c7-fixture-author | as row 1 | **Discharged** (dev build) | — |
| 3 | Second-language reimplementation agrees on the full fixture set, unrounded, within the derived tolerances | Re-run: 3679/3684 bit-exact and 5 within 1e-12 on the 352 fixtures, 0 disagreements; shared set 10168/10222 bit-exact, 8 disagreeing cases (none among the 58 builder cases), 0 errors. `tests/reimpl.test.js` is the same-author `reimpl/`, not this acceptance | c7-cleanroom | Yes on the log (no blocked or leaked access); caveat: its rule-3 rework was prompted by the builder, prompt not visible | **Blocked** | Tolerance memo, §17 item 3 (NADIRA + Developer): no derived tolerance exists to test against. Also the 8 disagreements await NADIRA's ruling (`docs/disagreements-2026-09-29.md`; findings 9, 12, 16). "Agrees on the full fixture set" is true of the 352, not of the shared set. Molar rows use synthetic C1 objects. |
| 4 | Every determination validates against the shared format at the C7-OUT-04 version, or escalation recorded | Contract check 1 (18 objects, 28 Sept; **not re-run**, predates T1/T2/HI-10); Tests "validator catches the loss of each field" and now the HI-10 clause in `result-object.js`; `docs/escalation-tool-field.md` E1, E2, E4 | Builder; c7-contract-checker | Partly | **Blocked** | §17 item 8 (Developer + NADIRA): shared version unpublished (schema string `2.0.0-draft.c7`). The "escalation recorded" limb is on paper; whether it suffices is the owners' call. Contract check needs re-running on the current build. |
| 5 | Directions inverses within the derived tolerance (C7-IV-01) | Tests tolerance test skipped; adversarial worst 2.11e-15 (observed only, pre-decision) | Builder; adversarial | Partly; *adversarial part: independence in question* | **Blocked** | §17 item 3. No bound to pass against. |
| 6 | Diluent rounding, one Fa, additivity within the (amended) bound, hand reproduction (FX-14, FX-17) | Fixtures IND-FX-14*, IND-FX-17; Tests; Adversarial 600 random + 60 discriminators (pre-decision) | Fixtures; adversarial; builder | Yes; *adversarial part: independence in question* | **Pending** | The additivity check under the amended bound (final rounded down: one unit of the final's place plus half a unit of the displacement's) has no independent run; the protocol carries no displayed D. Inside the build. |
| 7 | Each invariance test capable of failing under clamp, floor, nudge, each exceeding the derived tolerance | `docs/iv-02-mutation-record.md`; Tests C7-IV-02 (9 pass, re-run) | Builder | No | **Blocked** | §17 item 3: capable-of-failing shown against a clean-case discrepancy, not a derived tolerance. |
| 8 | Mass route equals molecular-weight route to a molar target within the derived tolerance | Tests IV-05 skipped; adversarial worst 2.68e-16 (transcribed); synthetic C1 objects | Builder; adversarial | Partly | **Blocked** | §17 item 3; and C1 has no export (finding 7). |
| 9 | Negative control (C7-FX-08) no flags, both directions | Fixtures IND-FX-08a..d `flags: []`; Tests | Fixtures; builder | Yes (see row 1) | **Discharged** (dev build) | — |
| 10 | Every §7 condition rejected with a message naming the quantity and the physical reason | Fixtures compare codes only (51 rejection fixtures); Tests assert codes, wording only for HI-09; new Test T1 asserts C7-HI-10 code and "limit of the arithmetic"; NADIRA's T1 check (transcribed, item 17-18) | Fixtures (codes); builder (wording) | Codes yes; wording no | **Pending** | An independent check of rejection wording (no protocol field). C7-HI-10 is in the acceptance's list only through URS v1.1, not in `spec/`. |
| 11 | Every §8 condition flags in both directions; FL-09 withholds molar per pairing table | Fixtures FL-01..14 and 11 pairing rows; clean room agrees (protocol 2 now compares the full molar form: 69 molar fixtures per findings 16); Contract check 3 (28 Sept) | Fixtures; clean room; contract | Yes | **Blocked** | Real C1 v0.6 output: C1 owner; §17 item 6 (A. Modi + Developer). Pairing rows were run on synthetic objects only. Non-molar flags are evidenced. |
| 12 | Total-protein case (FX-04): reagent concentration not computable with the reason in the cell | Fixtures IND-FX-04a/b flags; protocol 2 `reagentConcentration` computable/not-computable (status only); Tests assert the reason text | Fixtures; builder | Status yes; reason text no | **Pending** | An independent look at the cell's reason text and the rendered page. |
| 13 | Boundary fixtures per C7-FX-10 | Fixtures boundary set; clean room agrees on all 352; Adversarial boundaries (pre-decision); Tests | Fixtures; clean room; adversarial | Yes; *adversarial part: independence in question* | **Discharged** (dev build) | The 8 clean-room disagreements are outside the boundary fixtures except the two HI-08 cancellation cases (ADV-BND-HI08-DIL-0/-1), which are boundary-named adversarial cases: they concern the C7-FL-08 payload, not the HI-08 boundary decision. Under review by NADIRA. |
| 13a | FL-08 payload 1÷(1+f), f÷(1+f); 1÷(1−f), f÷(1−f); verified vs C7-FX-11 by hand | Fixtures protocol-2 `fl08` payloads (27, 7.87 % derived by hand), 0 mismatch; clean room derived 7.87 % independently and agrees (findings 16); Audit finding 1; Tests | c7-fixture-author; c7-cleanroom; c7-spec-auditor | Yes (payload); *auditor part: independence in question (minor)* | **Pending** | The acceptance's own reference, C7-FX-11, prints 7.88 %; hand derivation gives 7.87 %; the URS is unedited (A. Modi). The engine payload is now independently compared (the earlier gap (a) is closed), but the payload structure over the 8 disagreements 1 and 2 (near-negligible diluent) differs between engine and clean room: owner ruling on the evaluated form. |
| 13b | Activity content with solids computes displacement; basis stated "the reagent (activity)" | Fixtures IND-FX-07*; Tests FX-07a/b | Fixtures; builder | Numbers yes; statement no | **Pending** | Independent view of the page. |
| 13c | Reagent-alone mass, no solids: Dmin, labelled diluent, "at most" on page and notebook, handed on as bound (FX-06: 0.942 mL, at most 79.9680 → 79.9681 under the decision) | Fixtures IND-FX-06* (79.9681 etc.); clean room agrees; Tests; NADIRA's 15a/24 re-test on a bound case (findings 18, transcribed) | Fixtures; clean room; builder; NADIRA (transcribed) | Numbers yes | **Pending** | The acceptance text still reads 79.9680 (URS unedited); decision document and addendum unsigned (behaviour signed); "at least" trigger unstated in the decision (findings 13); page wording only via transcription. |
| 13d | Achieved concentration departs visibly from target, no flags (FX-17: 1.00452) | Fixtures IND-FX-17 including departure +0.452 % (protocol 2); clean room agrees; Tests; UI check 2 (transcribed) | Fixtures; UI (transcribed) | Yes for numbers | **Discharged** (dev build) | Page half rests on a transcribed report. |
| 14 | No determination completes without every compelled declaration | Tests "every compelled declaration is required" | Builder | No | **Pending** | Test does not cover a missing direction, the volume direction's volume, or whole-vial (the clean room does not validate it either). |
| 15 | Handed-on stock carries basis, carrier, conjugate, achieved concentration, imported C1 object in full | Tests; Contract checks 1 and 3 (28 Sept) | Builder; contract-checker | Partly | **Pending** | A real C1 object (C1 emits no envelope): C1 owner. Contract check not re-run on current build. |
| 15a | Upper-bound stock exported with marking, reason and §11 assumptions; never withheld | Tests (FX-06 object, `upperBound.assumptions.length >= 3`); Contract checks 1, 3, 4 (28 Sept); NADIRA's re-test passes 15a on a bound case with a decoded stock envelope (findings 18, transcribed) | Builder; contract-checker; NADIRA (transcribed) | Partly | **Discharged** (C7 side, unchanged) | CR-C3-01 (receiver keeps the bound) is C3's and not implemented (§17 item 7). The re-test is not upgraded to primary evidence. The list of assumptions is not compared with the §11 text. |
| 16 | C7-NF-01 in a real browser at the deployed address, network monitor before load | None (dev server only; `check-headers.mjs` unrun) | — | — | **Not discharged** | Deployment; §17 item 5; findings 5 (edge analytics injection off, A. Modi / Developer, precedes deployment). |
| 17 | Privacy statement's claims verified at the deployed address | Partial: UI check 5, storage empty after reload on dev server (transcribed) | ui-verifier (transcribed) | Partly | **Pending** | Deployed address; §17 item 4; findings 5 (the analytics-injection check precedes deployment). Audit finding 25: acceptance says five claims, lists four. |
| 18 | Reload and re-enter reproduces the result exactly | Tests "same inputs, same outputs"; UI check 5 and adversarial determinism (transcribed) | Builder; UI; adversarial | Partly | **Pending** | Primary record of a page reload. |
| 19 | Changing direction or any declaration recomputes; no stale value unmarked | UI check 5, carrier only (transcribed) | ui-verifier | Partly | **Pending** | Direction and other declarations; the "unmarked" clause. |
| 20 | Tool page lists every §11 item, failure classes, HI-08 not a plausibility check, privacy statement verbatim | `src/ui/page-content.js` exists; no test or report reads the rendered page | — | — | **Not discharged** | Inside the build; register rows for directed rounding await the URS edit. |
| 21 | First-time user, correct reconstitution in under a minute, each direction | None | — | — | **Blocked** | A real first-time user; §17 names no owner. |
| 22 | Result never visible without declaration summary and flags at the reference viewport | `docs/acceptance-22-sweep.md` (builder); UI check 1 (transcribed): 12 rows, 0 violations, max 349 px | Builder; UI | Partly | **Pending** | Dev build only; the two runs measured differently (144 vs 146 px). Re-run at the deployed address. Predates T1's new state and T2 labels. |
| 23 | Every displayed ratio/factor asserted per C7-FX-11 with denominator named | Tests assert values; nothing asserts the named denominator on the page; the departure is now labelled "on the unrounded values" (T2, NADIRA re-test transcribed) | Builder | No | **Pending** | Assertion that each denominator is named on the page; URS 7.88 % correction. |
| 24 | Notebook copy has every declaration, flags in words, both volumes, treatment, concentration with basis and label | UI check 4 (28 Sept, transcribed); Tests; NADIRA's re-test passes 24 on a bound case (findings 18, transcribed) | UI; NADIRA (transcribed); builder | Partly | **Pending** | Only "a bound case" is reported; nine-flag, entered-final, withheld, rejected and the new out-of-range states are untested. Not upgraded on a transcription. |
| 25 | At the deployed address: identification (NF-10), chrome (NF-11), own-origin (NF-12), states distinguished (NF-13) | UI check 3 (NF-13 pass, dev), check 6 (NF-10/NF-14 not confirmed) (transcribed) | UI | Partly | **Pending** | Deployed address; NF-10 wording is ZURI's tool-set question (findings 14). |

**Tally, 30 rows (1–25 with 13a–d and 15a):** Discharged 6 (1, 2, 9, 13, 13d, 15a); Pending 15 (6, 10, 12, 13a, 13b, 13c, 14, 15, 17, 18, 19, 22, 23, 24, 25); Blocked 7 (3, 4, 5, 7, 8, 11, 21); Not discharged 2 (16, 20). **Unchanged in count from 28 September.** Every Discharged is on the development build; none is on a deployed address.

## Section 2. §17 outstanding items

| # | Item | Evidence | Independent? | Status | Blocked on / owner |
|---|---|---|---|---|---|
| 1 | Cite ISO 8655-2 and ISO 7886-1 | Build half done (threshold configured; Tests, fixtures). No citation anywhere | No | **Blocked** | NADIRA |
| 2 | Excipient partial specific volumes (Durchschlag) | None; page discloses the gap | — | **Blocked** | NADIRA |
| 3 | Tolerance derivation memo | No memo. Measurements only (builder 0.000e+0; adversarial worst 2.11e-15; clean room bit-exact or within 1e-12 wherever compared). Gates acceptances 3, 5, 7, 8, C7-IV-02 | Partly; *adversarial part: independence in question* | **Blocked** | NADIRA + Developer |
| 4 | Privacy-statement wording, legal review | None | — | **Blocked** | A. Modi + THERON |
| 5 | Public URL slug | None | — | **Blocked** | A. Modi |
| 6 | Retrofit C1, C4, C3 | Contract check 5 (28 Sept): envelope byte-compatible with C4's; storage not examined | Yes (transcribed) | **Blocked** | A. Modi + Developer |
| 7 | CR-C3-01 and CR-C3-02 | Contract check 4 (28 Sept): neither implemented; CR text lacks the decision's "round derived bounds up" clause | Yes (transcribed) | **Blocked** | A. Modi + Developer |
| 8 | Publish shared result-object version | Not published; E1, E2, E4 in `docs/escalation-tool-field.md` | Partly | **Blocked** | Developer + NADIRA |
| 9 | C2 removal; IU/mass conversion | None; gates nothing | — | **Not discharged** | A. Modi |

Tally: Blocked 8, Not discharged 1 (unchanged).

## Section 3. §11 open register rows

| Row | Evidence | Status | Owner / note |
|---|---|---|---|
| Excipient partial specific volumes | None | **Blocked** | NADIRA |
| Material displacement threshold | Placeholder applied, configurable; fixtures invariant across candidates | **Blocked** | NADIRA |
| Round-trip tolerance | Measurements only | **Blocked** | NADIRA + Developer |
| Unit-normalisation tolerance | Measurements only | **Blocked** | NADIRA + Developer |
| Kept-in-view height | 349 px max on dev build (28 Sept, before T1/T2); URS row unedited | **Pending** | Measurement at the deployed address; register edit |

Tally: Blocked 4, Pending 1 (unchanged). Unsettled, not counted as open rows: the rounding-rule and 6-sf precision rows changed by the decision are unedited in the URS (decision document unsigned, behaviour signed); "Displayed-volume resolution" is Characterised without external citation (audit finding 11); §11 wording collides with the status vocabulary (audit finding 23).

## Section 4. `docs/spec-findings.md`

Status: has the finding been closed by the party who can close it?

| # | Finding | Evidence | Independent? | Status | Blocked on / owner |
|---|---|---|---|---|---|
| 1 | 7.88 % is 7.87 % | Audit finding 1; fixtures and clean room derive 7.87 % (protocol 2); Tests; URS still prints 7.88 % | Yes | **Blocked** | A. Modi: correct text |
| 2 | FX-05 "1.000 mL" | URS unchanged | — | **Blocked** | A. Modi |
| 3 | No §7 code for out-of-range quantity | Text is **stale**: items 17-18 say C7-HI-10 is now bound on the owner's instruction. URS v1.1 is not in `spec/`, so the binding is unverifiable here | — | **Blocked** | A. Modi: supply URS v1.1 |
| 4 | Shared `tool` field | Escalation file | — | **Blocked** | Item 8 |
| 5 | Edge analytics injection vs "no third-party code" | Nothing verifiable before deploy | — | **Blocked** | A. Modi / Developer, before deployment |
| 6 | Sibling navs omit C7 | Outside build | — | **Not discharged** | Sibling owners |
| 7 | No C1 export | Contract check 3 (28 Sept) | Yes | **Blocked** | C1 owner |
| 8 | Smoke-audit items | Audit smoke and full | Yes; *auditor: independence in question (minor)* | **Blocked** | A. Modi / NADIRA |
| 9 | Solids under "not recorded" basis | Clean-room NOTES; now disagreement 8 of 8 | Yes | **Blocked** | NADIRA ruling |
| 10a | Build defect: `threshold` ignored | Fixed; regression test; fixtures 352/0 | Yes | **Discharged** | — |
| 10b | HI-03 vs reported unit, volume direction | Ambiguity recorded | — | **Blocked** | A. Modi / NADIRA |
| 10c | Protocol lacked fields for not-computable cell, payloads, "at least", molar, wording | Protocol 2 (`extended`) now covers cell status, "at least", departure, FL-05/FL-08 payloads, molar form; **rejection wording and the cell's reason text remain builder-test-only** | Partly | **Pending** | Inside the build |
| 11a | Bounds on the wrong side (audit item 7) | Decision implemented; Tests, fixtures, clean room agree; behaviour signed 29 Sept | Yes | **Pending** | Decision document and addendum unsigned; URS text, register and CR-C3-01 clause not edited |
| 11b | The other 25 audit findings | No recorded disposition beyond 1, 7, 16 | Yes (*minor*) | **Blocked** | A. Modi / NADIRA |
| 12a | Defects F-1 to F-4 | Fixed; regression tests pass (re-run) | Found independently; fix re-run by builder | **Discharged** | — |
| 12b | Edge-of-range questions (HI-08 "cannot fire"; payload as needed quantity) | Now inside disagreements 3, 4 and part of 5-7 | Yes | **Blocked** | NADIRA |
| 13 | Directed rounding implemented | Engine, PROTOCOL, tests, fixtures, clean room agree; behaviour signed | Yes | **Pending** | As 11a; "at least" trigger unstated |
| 14 | Brand wording vs NF-10 | UI check 6 | — | **Blocked** | ZURI |
| 15a | Validator gaps | Fixed; test passes | Found by contract-checker | **Discharged** | — |
| 15b | Format conflicts E1, E2, E4 | Escalation file | — | **Blocked** | Item 8 |
| 15c | C1 half-to-even vs half away | Contract check 2 | Yes | **Blocked** | C1 owner + NADIRA |
| 15d | CR-C3-01/02 not implemented | Contract check 4 | Yes | **Blocked** | Item 7 |
| 16a | Literal 1÷(1−f) loses accuracy as diluent becomes negligible; state the evaluated form (disagreements 1-4) | Comparison re-run; exact-arithmetic claims (engine within ~6e-17, clean room 8e-9 and 5e-2) are the builder's in `docs/disagreements-2026-09-29.md`, not re-derived by me | Yes (comparison); no (exact-check figures) | **Blocked** | NADIRA ruling |
| 16b | Protocol 2 verification of remaining outputs | Re-run: 352 fixtures 0 mismatch, clean room 0 disagreements; counts by output type (293, 101, 48, 27, 69) are findings-16 figures, at 344 fixtures, not re-derived | Yes; *fixture author: independence in question (Section 5)* | **Pending** | Extended omissions listed in `verification/fixtures/extended-omissions.json` |
| 16c | Molar figure: unrounded Ca÷MW or displayed Ca÷MW | Open for the owner | — | **Blocked** | NADIRA |
| 17a | T1: out-of-range refusal has its own state; C7-HI-10 bound | Test T1 passes (re-run); NADIRA re-test (transcribed) | Builder; NADIRA (transcribed) | **Blocked** | URS v1.1 (which defines C7-HI-10, and amendments 5, 7, D12, V5) is not in `spec/`; the code's provenance rests on the owner's instruction only |
| 17b | T2: departure taken on unrounded values; "at most" departure rounded up | Test T2 passes; fixture author re-derived 352 (0 mismatch); clean room implemented the addendum from its text (0 disagreements); NADIRA re-test (transcribed) | Yes; *fixture author: independence in question* | **Pending** | Addendum "pending the same sign-off"; document unsigned |
| 17c | Verification-method defect: clean room masked crashes; now standing rule 3 | Rule in README, PROTOCOL 7, `compare.mjs`, `impl.py` (read); re-runs show 0 errors | Owner-directed | **Pending** | No recorded demonstration that an injected crash is counted (rule 2's lesson) |
| 18 | NADIRA's re-test; 8 disagreements set out for ruling | `docs/disagreements-2026-09-29.md`; builder transcription of her report | No (transcription) | **Blocked** | NADIRA rulings on 8 disagreements |

Tally, 29 rows (last ledger: 22): Discharged 3 (10a, 12a, 15a); Pending 6 (10c, 11a, 13, 16b, 17b, 17c); Blocked 19; Not discharged 1 (6). New rows since 28 September: 16a, 16b, 16c, 17a, 17b, 17c, 18 (7 added; former 10c moved from Not discharged to Pending, so Not discharged fell from 2 to 1).

### Stale figures in the record

- `spec-findings.md` items 9, 10, 12, 13 and the "Current figures" paragraph (item 15 area) quote 58 cases/572, 322 fixtures/2981, 338 fixtures, 82 tests, "7 disagreements". Today: 84 tests (81/0/3), 352 fixtures, 8 disagreements. Item 3 predates HI-10. The record is superseded by items 16-18 in part; the older paragraphs were not updated.
- The 28 September ledger's clean-room figures are superseded (masked crashes; see above).
- The README's harness self-test line still quotes 572 of 572 (same-author `reimpl/`, discharges nothing).

## Section 5. Independence audit of `verification/access-log.jsonl`

196 entries, 28 September 22:18Z to 29 September 14:35Z (was 140). Allowed/blocked per agent: c7-adversarial-tester 48 (47/1), c7-fixture-author 69 (69/0), c7-cleanroom 43 (43/0), c7-spec-auditor 30 (28/2), c7-ui-verifier 5, c7-evidence-clerk 1 (my own ledger write). No `main` entries. c7-contract-checker and c7-deploy-verifier never appear: their access is unaudited. I checked every allowed entry of the four agents against the deny list in its `.claude/agents/*.md` definition, by path match and then by a looser bare-filename match, because the hook matches relative paths only when written with their prefix.

**What this audit shows.** It shows what was attempted through tools the hook sees. It is not proof of what an agent learned. The hook guards Bash by matching the command line; the log keeps only the first 200 characters of a command; Chrome/MCP calls are unlogged; anything the builder wrote into an agent's prompt is invisible (this matters for the clean room's rule-3 rework and the fixture author's protocol-2 brief).

| Agent | Blocked attempts | Allowed access to a path its definition forbids | Verdict |
|---|---|---|---|
| c7-spec-auditor | 2 (unchanged): (1) Bash `cat > /tmp/c7smoke.py <<EOF` python script, blocked "mentions dist/" (a bare word; the hook source now carries a bare-word refinement for exactly this case, which supports the false-positive reading but does not prove it); (2) Write to `/tmp/c7smoke.py`, outside its workspace | None found. No new entries since the 28 September run apart from start-up listings of `spec` and `verification/spec-audit` | **Independence in question (minor)**: a blocked command in the log; no evidence any denied file was read. Its content is spec-only arithmetic. |
| c7-fixture-author | 0 | **One leak, allowed.** Entry at 29 Sept 13:36:48Z: `cd …/verification; grep -n "extended\|departure" check-fixtures.mjs | head -60`. `verification/check-fixtures.mjs` is on its deny list. The hook did not match it because the path was given as a bare filename after `cd`. The output would show the comparator's `extended` handling: that the harness reads an `extended` block from the engine's protocol result, subset comparison, 1e-12 relative tolerance. It contains no engine arithmetic (I read the file). No read of `src/`, `tests/`, `docs/`, `engine-adapter.mjs`, `cases.json` or `check-report.md` found. Also `ls verification` (names only, own directory) | **Independence in question** for the protocol-2 fixtures (`extended` expectations, 13:36Z onward) and the 29 September T2 re-derivation. A hook gap, which the definition calls serious; the exposure is the comparator's shape, not engine values. The earlier 338 fixtures pre-date it and show no leak. Common-cause caveat: PROTOCOL.md is builder-written. |
| c7-cleanroom | 0 | None found. Allowed reads: `spec/`, `PROTOCOL.md`, `cases.json` (permitted; contains the adversarial tester's inputs, not outputs), own files, own `/tmp` output. It never touched `comparison.md`, `access-log.jsonl`, `fixtures/`, `adversarial/`, `spec-audit/`, `src/`, `docs/` or `README.md` (bare-name scan clean) | **Independent on the log.** Caveats: its removal of the exception fallback (14:34Z, entries after a run over named `ADV-` crash ids) followed a disclosure by the builder that the log cannot show; whether its explicit not-representable decisions were guided by knowledge of engine output is not visible. That it still disagrees with the engine on four range cases argues against mirroring. |
| c7-adversarial-tester | 1 (unchanged): Bash `shasum … verification/engine-adapter.mjs; python3 verification/adversarial/suite.py …`, blocked "names verification/engine-adapter.mjs" (an integrity hash of the wrapper, not evidently a read) | None new. Earlier `ls -R spec verification | head -100` (start-up, 01:50Z) listed names under denied subtrees; two reads outside the project were the persisted copy of the URS. No entries after 02:14Z, so it took no part in the decision, T1/T2 or protocol 2 | **Independence in question (minor)**, as before. Its report predates the decision, T1, T2 and rule 3, so it is also stale evidence. |
| c7-ui-verifier (not on the task's list) | 0 | None found; 5 entries, all on 29 Sept 02:36-02:43Z reading `spec/` and `verification/ui/sweep.js`; Chrome unlogged | Independent on the log; browser unauditable; report transcribed. |

Hook gaps:
1. **New: relative-path bypass.** `cd verification; grep … check-fixtures.mjs` names a denied file with no prefix and was allowed. The same trick would reach any denied file under `verification/`.
2. Recursive listing of an ancestor of a denied path (used once at 01:50Z): the current hook source blocks this (ancestor test in `deny-paths.mjs`); no entry since shows it exercised, so it is fixed in code, untested in the log.
3. Reads outside the project directory are not fenced.
4. 200-character truncation; Chrome/MCP and some agents unlogged.
5. Runtime-built paths are not caught.

## Verdict per agent

- c7-spec-auditor: independence in question (minor).
- c7-fixture-author: **independence in question** for protocol-2 and T2 evidence (allowed read of the denied comparator, hook gap); earlier fixtures independent on the log.
- c7-cleanroom: independent on the log (prompt content not auditable).
- c7-adversarial-tester: independence in question (minor); evidence stale.
- c7-ui-verifier: independent on the log; browser unlogged; transcribed.
- c7-contract-checker, c7-deploy-verifier: not auditable (no log entries).

## Changes since the 28 September ledger

- Counts by status unchanged for acceptances (D6 P15 B7 N2), §17 (B8 N1), §11 (B4 P1); findings rows 22 to 29.
- **Regressions or downgrades of evidence, not of status:** (1) the clean-room comparison of 28 September is "not evidence" (masked crashes); the current one shows **8** disagreements, not 7, and the set changed (four range cases and HI-07/HI-01/NR-with-solids remain in some form; two new numerical-cancellation cases ADV-BND-HI08-DIL-0/-1 appear); (2) the fixture author gained an independence flag (allowed read of `check-fixtures.mjs`); (3) contract and adversarial evidence is now stale relative to T1, T2 and HI-10; (4) C7-HI-10 has no spec file behind it.
- Improvements: fixtures 338 to 352 with protocol-2 extended fields, 13a's payload now independently compared; hook now blocks ancestor recursive listings; rule 3 standing.
- Correction: my Section 4 tally supersedes the 22-row tally of the earlier ledger.
