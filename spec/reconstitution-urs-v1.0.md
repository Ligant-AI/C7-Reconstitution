# User Requirements Specification
## Reconstitution

| Field | Value |
|---|---|
| Tool ID | C7 |
| Product | Ligant Bench Tools |
| Version | **1.0 — approved for development** |
| Date | 28 September 2026 |
| Owner | A. Modi |
| Status | **Approved for development.** Specification confirmed by NADIRA, CSO, 21–22 September 2026. The questions that stood between the confirmed specification and the start of development were decided by A. Modi on 28 September 2026 and are recorded in §0.0. **No open item blocks the build.** Items outstanding before public release are listed in §17 |
| Supersedes | v0.4.2 and all earlier drafts. This is the document of record |
| Revision basis | Four review rounds with NADIRA (records filed separately), and A. Modi's decisions of 28 September 2026. Written against C1 v0.5 (pending v0.6), C4 v0.6, C3 v0.4.1, Brand Guidelines v1.1 |

---

## 0. Scope, conventions and dependencies

### 0.0 Decisions taken at v1.0, and document control

Four questions stood between the confirmed specification and the start of development. A. Modi decided them on 28 September 2026. Each is implemented in the requirements below; the reasoning is here so that the developer and NADIRA can see what was chosen and why.

| Decision | What was decided | Why |
|---|---|---|
| **The shared result object** shall express everything C7 produces | The format is this tool set's own and is not frozen. It gains the fields C7 needs — content basis, provenance, conjugate and carrier declarations, displacement treatment, an upper-bound marker with its reason, and an embedded C1 object — at a new format version, enumerated in C7-OUT-04. The "stop and escalate" rule survives only for a genuine conflict discovered in build, not for adding a field | Escalation existed to stop a tool quietly extending a format it shares with others. Enumerating the fields in the specification is the opposite of a quiet local extension: every tool sees the same list. This supersedes the escalation route for *adding* fields, which the C4 memo raised; escalation survives for a genuine conflict |
| **A bound must stay a bound downstream** | The obligation sits on the receiving tool, so it is written where it will be implemented: change request **CR-C3-01** against C3, to be applied before C3 ships, and the same requirement in C4 and C5 when they are written. C7 carries the interface requirement at C7-ST-08 so it cannot be lost. **It does not block C7's build** | C7 cannot make another tool honour a bound; only C3's own specification can. C3 has not shipped, so this is a change before build rather than a retrofit. Holding C7's build for an edit to a different document would stop work that does not depend on it |
| **An activity-based stock** | C7 ships the activity path now. C7 is reachable and usable at its own address independently of any other tool (C7-NF-08), and the notebook copy carries the full stock where no receiver exists. Whether C3 accepts IU/mL is a C3 question, raised as **CR-C3-02**, and does not block C7 | The IL-2 user is served by C7's own page on the day it ships. The C2 argument in §0.1 does depend on a receiver existing eventually, and that is recorded, but it is an argument about a tool that is not being built |
| **6 significant figures for an upper-bound concentration** | Yes — the same precision as an achieved concentration | It is the same arithmetic on the same recorded act, and reproducible from the same terms on the page. The distinction between the two values is carried by the "at most" label, not by precision |

**Document control.** These tools are research-use laboratory calculators. **No per-change audit trail is maintained for this specification**: revision history lives in the review records filed beside it, and this document states the requirements as they stand. What remains is not change history but user-facing disclosure, and it stays: the constants, assumptions and conventions register (§11), the failure classes the tool cannot detect (§9), the declarations compelled on every determination (§3), and the verification of the privacy statement's claims (§14.1, acceptance 17). Those exist so that a scientist reading a result can tell what it rests on — which is the whole point of replacing a spreadsheet.

### 0.1 Why this tool exists separately

Reconstitution was drafted into C3 v0.1 and removed at its first review. It has no stock concentration — it *produces* one — so it contradicted C3's required inputs, its reject conditions and its acceptance criteria. Four items were carried across and are answered here: nominal versus actual fill, what the stated mass is the mass of, volume displacement by dry solute, and the route to a molar target.

**C2 (cytokine supplementation) is proposed for removal from the catalog.** Reconstitution is content divided by volume, and that relation is indifferent to whether the content is stated as a mass or as activity units. A vial of 10⁶ IU targeted at 10⁴ IU/mL needs 100 mL by the same arithmetic as 1 mg targeted at 1 mg/mL. C7 therefore accepts activity units as a content basis and serves the IL-2 case directly, which was C2's surviving justification. What C2 would have owned beyond that is conversion *between* mass and activity through a lot-specific specific activity. That is not a C1 conversion in kind: cytokine specific activity is bioassay-derived, commonly stated as a range or a "≥", with assay CVs of 20–30 %, so a conversion through it would be the first quantity in the set carrying inherent measurement uncertainty rather than rounding error and would need a declared uncertainty, not a tolerance. **Outstanding item 8**: it should not be built on inference that someone wants it, and if built, not as a C1 basis.

### 0.2 Dependency

**C1 v0.6 is not yet approved.** C7 consumes a C1 object for the molar route (C7-ST-01, C7-TG-03, C7-DT-06) and adopts the C1-onward conventions. If v0.6 changes the rounding convention or the C1-MW-07 option set, §3.1, §8 and §12 change with it, and the C1 flag IDs cited beside the §8 pairing table — checked against C1 v0.5 — are re-checked.

### 0.3 Standing passes

Three passes are run over every URS in this set before it is circulated, and again over anything that changes. All three were run on this specification across four review rounds.

- **Declaration audit** — for every quantity: what is it the measure of, how many of it are there, which act produces it, and is that declared. It produced the content-basis declaration (C7-VC-03), the conjugate-state declaration (C7-VC-07), the carrier declaration (C7-VC-08), and the finding that the target can only be the concentration of the final solution (C7-TG-01).
- **Comparison pass** — for every rule comparing two declared values: does it preserve every distinction each declaration makes, and does it name the most fundamental disqualification first. It produced the dimensional check (C7-HI-03), the separation of IU from U (C7-HI-09), and the pairing table and its order (§8).
- **Direction pass** — for every ratio, factor or multiple displayed: is it stated in the direction of its consequence, with a fixture asserting it. It produced C7-DT-05 and C7-FX-11, and established that a naive-error factor is keyed to **which volume is known**, not to the direction of the determination.

**Method note.** Every factor on the page is **derived from the relation it describes and checked numerically**, never obtained by mirroring the factor beside it. The same error — two denominators of one displacement, 7.3 % against 7.9 % — recurred three times in review because a new case was checked against an existing one rather than derived. A factor's derivation is recorded beside it (§5 notation, C7-FL-08) and beside its fixture.

### 0.4 Conventions inherited, C1 onward

Displayed precision matches the resolution of the physical act the number drives. Rounding half away from zero on the exact binary value. Dilution factor as final volume ÷ stock volume. Staining volume as final volume. A register tolerance is the derived analytic bound over the stated operation set; an empirical maximum is evidence, never the tolerance. An assumption is not a threshold: it is listed in its own table with its scope and a status. Register statuses: derived, measured, characterised, disclosed, proposed, open. A page states no decision that has not been made.

**Tool-set convention change.** "Characterised" was added to the status vocabulary at C7 v0.3: a value cited to an external source, with its scope and scope error bounded, which is neither derived by this tool set nor merely disclosed. C4 v0.5 fixed the vocabulary as derived, measured, disclosed, proposed and open. The addition applies to every register, and C1, C3 and C4 are reviewed for rows called disclosed only because the status did not exist (outstanding item 6).

---

## 1. Purpose

**Determination:** the relation between the content of a vial, the volume of diluent added to it, and the concentration of the solution that results — in either direction: the volume to add for a target concentration, or the concentration obtained from a stated volume.

The tool does not plan dilutions of that stock (C3), does not design a titration series (C4), does not identify the protein, does not supply molecular weights or specific activities, and does not convert between mass and activity bases.

**The failure being replaced:** the arithmetic is trivial — a vial holding 1 mg, targeted at 1 mg/mL, takes 1 mL; a vial holding 1 mg reconstituted in 1 mL as the datasheet says is at 1 mg/mL. What is not trivial is what the number on the vial refers to and what else is in the vial, and nothing in the resulting solution reveals either.

- An antibody vial labelled **1 mg total protein**, stabilised with BSA, holds a fraction of that mass as the specific antibody. Computing from the label gives a stock whose antibody concentration is lower by a large factor, and it looks exactly like the right stock
- A carrier-formulated cytokine states its microgram figure for the cytokine — the right basis — with the carrier, at a mass typically far exceeding the cytokine's, mentioned in the formulation line and frequently not stated. The computed concentration is correct. But a protein assay of the stock measures the carrier with the cytokine and reads far above the computed concentration, and a later user who checks it that way will conclude it is wrong and may "correct" it. That is a property of the stock, invisible in its numbers
- A vial labelled 1 mg was filled to a specification with a tolerance; the lot's certificate often states what it actually held
- Dry solute occupies volume. Adding 1 mL of diluent to 100 mg of protein does not give 1 mL of solution, and there is no mark on a sealed vial to bring it to
- Activity-unit content converts to mass only through a lot-specific specific activity, which the vial does not carry

A datasheet instruction, a mental calculation, or a number written on the vial in marker records none of this. The majority act at the bench is "reconstitute in 1 mL as instructed", which is why C7 accepts a volume as readily as a target: if it refused, most real reconstitutions would arrive in C3 as a typed stock with none of the declarations above. **The stock this tool produces is the input to every Group C tool that follows it**, and today each of them accepts a stock concentration on trust.

---

## 2. Users

| Group | Need |
|---|---|
| Bench scientist (primary) | The volume to add, or the concentration obtained, correct for what is actually in the vial, in under a minute |
| Method reader / lab head | See what the stated content referred to, where the figure came from, whether carrier is present, and whether displacement was accounted for — so the stock can be interpreted or rejected |

Assumed competence: the user knows their reagent and has its vial label or certificate to hand. The tool does not identify reagents or supply constants.

---

## 3. Declarations

### 3.0 Direction

| ID | Requirement | Pri |
|---|---|---|
| C7-DR-01 | The direction shall be selected before data entry: **target → volumes** (a target concentration is entered; the diluent and final volumes are computed) or **volume → concentration** (a volume is entered; the concentration and the other volume are computed). Direction is not a mode; it does not change which declarations are required. As C1-CV-02. | M |

### 3.1 Vial content

| ID | Requirement | Pri |
|---|---|---|
| C7-VC-01 | Stated vial content shall be a required input with an explicitly selected unit. Mass units shall include at minimum µg, mg, g. Activity units shall include at minimum IU and U, and the selected activity unit shall carry through to the concentration unit (C7-UN-02): IU content pairs only with IU/mL, U content only with U/mL. | M |
| C7-VC-02 | The system shall not infer, default, pre-fill, or suggest a vial content, including for named reagents or catalog numbers. | M |
| C7-VC-03 | For mass-based content, the user shall declare **what the stated content is the content of**. The declaration shall appear on the output. The options shall be presented as: | M |

> — **the reagent alone** — the stated figure is the amount of the protein or molecule of interest, exclusive of carrier and excipient
> — **the total vial contents**, including carrier protein, excipient and buffer salts
> — **not recorded**

| ID | Requirement | Pri |
|---|---|---|
| C7-VC-03a | For activity-based content the basis is **the reagent alone** by definition — activity is of the active reagent and of nothing else. The form shall not offer the other options; the output and the structured object shall state the basis as "the reagent (activity)". | M |
| C7-VC-04 | The **source of the stated content** shall be a required field: lot-specific certificate of analysis; vial label or datasheet (nominal); weighed, from bulk; or not recorded. | M |
| C7-VC-05 | "Not recorded" shall be an accepted answer to C7-VC-03, C7-VC-04, C7-VC-07 and C7-VC-08, shall appear on the output, and shall be distinguishable in the structured object from a field left blank. | M |
| C7-VC-06 | Where the content basis is the reagent alone — by declaration or by C7-VC-03a — the **total solids mass** may be declared as an optional additional input, with its own mass unit. Where declared, it is the mass used for displacement (C7-DT-03). Where not declared, displacement is reported as not computable, with Dmin reported and applied where defined (C7-DT-03). | M |
| C7-VC-07 | For mass-based content, the user shall declare the **conjugate state** of the reagent and, where it is a conjugate, which mass the stated content is. The declaration shall appear on the output. The options shall be presented as: | M |

> — **not a conjugate**
> — **a conjugate — the stated mass is of the protein alone**, exclusive of label or payload
> — **a conjugate — the stated mass is of the conjugate**, including label or payload
> — **not recorded**

| ID | Requirement | Pri |
|---|---|---|
| C7-VC-08 | The user shall declare **carrier presence**: carrier protein present, absent, or not recorded. The declaration shall appear on the output and shall be carried onward (C7-ST-02). Where carrier is present and the content basis is the reagent alone, C7-VC-06 is the only route to a computable displacement, and the form shall say so at the point of declaration. | M |

*Rationale for C7-VC-03.* This is C7's counterpart of C1-MW-07 and the largest error the tool can prevent. A stabilised antibody vial states total protein; the number printed looks identical to one that states antibody, and a concentration computed from the wrong one is wrong by a large factor. No downstream tool can detect it, because a stock concentration carries no evidence of what it is a concentration of.

*Rationale for C7-VC-07.* The comparison pass: C1's mass-basis declaration distinguishes the protein from its conjugate, and a C7 declaration that does not preserve that distinction lets a conjugate molecular weight be paired with a protein mass — about 2.6× for a PE-conjugated IgG, per C1 v0.5 §3.3. Lyophilised conjugates are uncommon, and they are exactly the vials nobody double-checks. The declaration mirrors C4's stock mass basis so that the permitted pairs are the same two everywhere: assembled with protein, conjugate with conjugate.

*Rationale for C7-VC-08.* The common carrier case is not "wrong basis"; it is right basis, carrier present, carrier mass unstated. Two consequences travel with the stock and are invisible in it: displacement cannot be computed without the solids mass, and a protein assay of the stock reports carrier. The second is the one that gets a correct stock "corrected" later. It is a property of the stock and is handed onward with it.

*Rationale for C7-VC-04.* Nominal fill and actual fill differ within the fill specification's tolerance. The distinction is usually small and occasionally is not, particularly at small fills. It is recorded rather than corrected: the tool does not adjust for a tolerance it has not been given. "Weighed, from bulk" is the provenance of a portion taken from a bulk solid; the weighed mass is the content, whole.

### 3.2 Target and whole vial

| ID | Requirement | Pri |
|---|---|---|
| C7-TG-01 | In the target → volumes direction, the target concentration shall be a required input with an explicitly selected unit. **The target is the concentration of the final solution** — the reconstituted vial as it will exist — and of nothing else. | M |
| C7-TG-02 | The target and the stated content shall be of the same dimension and, for activity, the same unit family — mass with mass, IU with IU, U with U. A mixed pair shall be rejected per C7-HI-03 or C7-HI-09. Conversion between mass and activity requires a lot-specific specific activity and is not performed by this tool. | M |
| C7-TG-03 | A **molar** target shall be accepted only where a C1 result object carrying a molecular weight has been imported per C7-ST-01, the content is mass-based, and the imported mass basis, the content basis and the conjugate declaration form a permitted pair in the §8 pairing table. Any other molar target is rejected per C7-HI-04 with the pairing table's reason. An accepted molar target carries that object's mass-basis declaration and every flag raised on it. | M |
| C7-TG-04 | The user shall confirm that the **whole vial** is reconstituted. The confirmation is compelled, not assumed, and appears on the output. No fraction is accepted: a portion of a bulk solid is weighed and entered as the content itself (C7-VC-04, "weighed, from bulk"). | M |

*On C7-TG-01.* A concentration is a property of a solution; a target concentration can only be the concentration of the solution that results. Where displacement is computable, the diluent volume is therefore *smaller* than content ÷ target by the displacement, and the tool computes it so. Where displacement is not computable, mass-based reagent-alone content is corrected for the reagent's own volume only (Dmin, C7-DT-03) and its concentration is reported as "at most"; any other content is not corrected. C7-FL-05 says which.

*On C7-TG-04.* A fraction-of-vial input was considered and not built: the declaration audit asks which act produces the quantity, and nothing reliable produces "half a cake". A previously reconstituted vial is a liquid stock and belongs to C3.

### 3.3 Volume basis

| ID | Requirement | Pri |
|---|---|---|
| C7-VB-01 | The user shall declare which volume is meant. This is a single-select field. In the volume → concentration direction it is the volume **entered**; in the target → volumes direction it is the volume shown first and handed onward first. The options shall be presented as: | M |

> — **volume of diluent to add** — the volume drawn up and injected into the vial
> — **final volume of solution** — the volume the reconstituted vial will contain

| ID | Requirement | Pri |
|---|---|---|
| C7-VB-02 | Both volumes shall be reported whichever is declared, with the entered or primary one identified as such and the other as derived. The difference between them is the displacement applied (§5, C7-DT-03). | M |
| C7-VB-03 | The output shall state that the two differ by the volume the dissolved solids occupy — or, where only Dmin is applied, by the reagent's own volume, the rest not included — and that every concentration reported is that of the final volume. | M |

*Rationale.* This is the C3-VB-01 pattern. In the volume → concentration direction it has C3's meaning exactly: a datasheet that says "reconstitute in 1 mL" means 1 mL of diluent, and a user who instead needs 1 mL of solution enters that. In the target → volumes direction the act is always to deliver a diluent volume, so the basis selects which of the two volumes the user wants in front of them. The concentration is not affected by the choice in either direction. **The diluent volume is never the derived quantity for rounding purposes** (C7-IV-03), whichever is primary.

### 3.4 Capability and vessel

| ID | Requirement | Pri |
|---|---|---|
| C7-PC-01 | The minimum reliable transfer volume shall be a user-declared input in µL, pre-filled with **2 µL** visibly marked as a suggestion and editable, on the same terms as C4-SR-05. The declared value and whether it was entered or left at the default shall appear on the output and in the structured object. | M |
| C7-PC-02 | Vial working capacity shall be an optional user-declared input. Where not declared, C7-FL-06 shall not be evaluated and the output shall state that no capacity was declared. | M |

---

## 4. Units and precision

| ID | Requirement | Pri |
|---|---|---|
| C7-UN-01 | Every numeric input shall carry an explicitly selected unit. No bare numeric fields. A pre-selected unit is permitted only where visibly marked as a suggestion. | M |
| C7-UN-02 | Volume units shall include at minimum µL and mL. Mass-concentration units shall include at minimum mg/mL, µg/mL, ng/mL, g/L and mg/L, as C1-UN-03. Activity-concentration units shall include at minimum IU/mL and U/mL, following the content's activity unit. Molar-concentration units, for C7-DT-06 and a molar target, are C1-UN-04's set by reference. Concentration units are selected independently of the content unit within the same family. | M |
| C7-UN-03 | Unit conversion shall be exact within floating-point representation. No rounding shall be applied before final display. | M |
| C7-UN-04 | **Volumes** shall be displayed to **3 significant figures**, with one exception: an entered diluent volume is displayed as entered and used as entered (§5, C7-IV-03). C7 drives a syringe or pipette. The resolution this gives is 0.05–0.5 % of the value, leading-digit dependent, and is registered in §11. | M |
| C7-UN-05 | **Concentrations** shall be displayed to **6 significant figures**, matching C1 and C3. The concentration so displayed is the achieved one (C7-DT-07): an exact arithmetic consequence of the recorded act, reproducible from terms on the page (C7-IV-03). The same precision applies to an upper-bound concentration, which is reproducible on the same terms. | M |
| C7-UN-06 | Rounding shall be half away from zero, applied to the exact binary value. | M |
| C7-UN-07 | The unrounded value of every reported quantity shall be present in the structured object, and is the value against which an independent reimplementation and every invariance test are evaluated. | M |
| C7-UN-09 | **Fractions and percentages** — the displacement fraction, the minimum displacement fraction, and every percentage in a flag payload — shall be displayed to **3 significant figures**. | M |
| C7-UN-08 | Displayed precision shall be stated on the output, separately for volumes and concentrations. The output shall state that the final volume shown is rounded, and that the concentration is computed from the diluent volume as displayed and the displacement applied, not from the rounded final volume (C7-IV-03). The displacement applied is computed from the declared solids, or is Dmin from the content where the partial correction applies. | M |

---

## 5. Determination

**Notation.** Every symbol below is on unrounded values unless marked displayed.

- *content* — the stated content in its base unit; *solids* — the total solids mass, where known; *v̄* — the registered partial specific volume (§11).
- *D* = solids × v̄ — the displacement volume, where computable.
- Dmin = content × v̄ — the **minimum displacement**, defined only for mass-based content on the reagent-alone basis — a lower bound since solids ≥ content. It is a lower bound under the two assumptions in §11, and where it is the only displacement defined it is **applied as a partial correction** (C7-DT-01, C7-DT-02).
- *F* — the final volume of the **determination**: content ÷ target in the target direction; the entered value where a final volume is entered; entered diluent + Dapp where a diluent volume is entered.
- *f* = D ÷ F — the displacement fraction, on the determination. Every factor in a flag payload is exact in *f* so defined.
- Vd — the diluent volume of the determination: F − Dapp, or the entered value. Vd′ — the diluent volume **as displayed**: Vd rounded to 3 significant figures from its own value, or the entered value unchanged where a diluent volume is entered.
- Dapp — the **displacement applied**: D where computable; Dmin where only Dmin is defined (mass-based reagent-alone content with no solids declared — a partial correction, the reagent's own volume only); zero otherwise, meaning no correction — activity content or content basis not recorded, in either case with no solids mass declared.
- Fa = Vd′ + Dapp — the **achieved final volume**, with Dapp unrounded. Ca = content ÷ Fa — the **achieved concentration**. The displayed final volume and the reported concentration are both computed from Fa, and from nothing else. **Where Dapp = Dmin, Ca is an upper bound** on the concentration obtained and is labelled "at most", never "achieved".

**Which volume is known decides every naive-error factor, not the direction**. Where F is known — a target, or an entered final volume — ignoring displacement means delivering F as diluent; the final becomes F + D and the concentration content ÷ (F + D) = (content ÷ F) ÷ (1 + f). Where the diluent is known, ignoring displacement means dividing by it; content ÷ Vd = (content ÷ F) ÷ (1 − f).

| ID | Requirement | Pri |
|---|---|---|
| C7-DT-01 | **Target → volumes.** F = content ÷ target; Vd = F − Dapp. Where Dapp = Dmin, the diluent is labelled "corrected for the reagent's own volume only; carrier and excipient not included"; where Dapp = 0, the output states that no correction was applied. Vd′, Fa and Ca follow per the notation. | M |
| C7-DT-02 | **Volume → concentration.** Diluent entered: Vd′ = Vd = entered, F = Fa = entered + Dapp. Final entered: F = entered, Vd = F − Dapp, and Vd′ is its displayed value, so Fa differs from the entered final by the rounding of the diluent. In both cases the concentration reported is Ca, labelled "at most" where Dapp = Dmin, with the same diluent label as C7-DT-01. | M |
| C7-DT-03 | Where the total solids mass is known — from a "total vial contents" declaration, or from C7-VC-06 — the **displacement volume** shall be computed as that mass multiplied by the **registered** partial specific volume, a constant of §11 and not a user input, and stated in absolute terms and as a **fraction of the final volume**, *f* = D ÷ F. Where the solids mass is not known — whatever the content's dimension — displacement shall be reported as **not computable**, with the reason in the cell, and for mass-based reagent-alone content Dmin shall be computed, **applied as a partial correction** (C7-DT-01, C7-DT-02) and reported with fmin, labelled "reagent's own volume only" (C7-FL-05). For activity content and content basis not recorded, no correction is applied. | M |
| C7-DT-04 | Where the content basis is "the total vial contents", every computed concentration is the concentration of **total solids**. The concentration of the reagent alone shall be reported as not computable, with the reason in the cell. It shall not be reported as equal to the total. | M |
| C7-DT-05 | Every ratio, factor or fraction displayed — the displacement fraction, the shortfall factor in C7-FL-08, the scope-error bound, any figure in a flag payload, the structured object or the notebook copy — shall be stated **in the direction of the physical consequence it describes** and labelled with the two quantities it is the ratio of. | M |
| C7-DT-06 | Where a C1 result object has been imported and the imported mass basis, the content basis and the conjugate declaration form a permitted pair (§8 table), every reported concentration shall **also** be given in molar form, labelled with what it is the molarity of, and carrying the C1 object's flags. Where the pair is not permitted, the molar form shall be **withheld** with the table's reason (C7-FL-09). The mass-based determination is unaffected either way. | M |
| C7-DT-07 | **Reported concentration.** The tool shall report Ca = content ÷ (Vd′ + Dapp), with Dapp unrounded — computed from the diluent as delivered. Wherever the diluent is displayed rather than entered (the target direction, or a final volume entered), Vd′ is the displayed value. In the target direction Ca is reported beside the target, both labelled; with a final volume entered, Fa is reported beside the entered final, both labelled. Where a diluent volume is entered, Vd′ is the entered value and Ca is reported once. **Labels, by the displacement applied (§5):** where D is computable, Ca is labelled "achieved at the displayed diluent volume", or "obtained" for an entered diluent. Where Dapp = Dmin, Ca is an **upper bound** on the concentration obtained — under the §11 assumptions for Dmin, to within v̄'s scope error. It is labelled "at most … at the displayed diluent volume" or "at most … at the entered diluent volume" on the page, in the notebook copy and in the structured object, and never "achieved"; Fa is labelled "at least". Where Dapp = 0 (no solids mass known and Dmin not defined), Ca is labelled "uncorrected for displacement". Ca is in every case the concentration handed onward (C7-ST-02). | M |
| C7-DT-08 | All relations applied shall be displayed with the result. | M |

*On C7-DT-07.* With displacement corrected, content ÷ (content ÷ target) is the target by construction and carries nothing the input did not. The concentration with information in it is the one obtained when the user delivers the volume the page told them to — which, at 3 significant figures, can differ from the target by up to 0.5 % (§11; C7-FX-17 departs by +0.452 %). The stock handed to C3 is the stock that was made, not the one that was asked for. The same holds when a final volume is entered: the user delivers a displayed diluent, not the entered final, and reading a concentration back for a volume never delivered is the widest gap between page and bench this tool can open.

*On C7-DT-04.* This is the requirement that makes C7-VC-03 worth compelling. Reporting a total-solids concentration under a label that does not say so recreates the error the declaration was written to catch, inside the tool that was written to catch it.

---

## 6. Invariance

| ID | Requirement | Pri |
|---|---|---|
| C7-IV-01 | **The two directions are inverses.** A target taken through target → volumes to an unrounded diluent volume, and that volume taken through volume → concentration, shall return the target within a tolerance **to be derived** — outstanding item 3 — as an executable test on unrounded values. The bound is expected to be small and the test is not the headline of the derivation memo. | M |
| C7-IV-02 | Each invariance test shall be confirmed capable of failing, by inserting a clamp, a floor and a nudge into the computation path and demonstrating that each is detected and that each inserted defect exceeds the derived tolerance. The confirmation shall be recorded. | M |
| C7-IV-03 | **A computed diluent volume is always rounded from its own unrounded value** at 3 significant figures, whichever volume is primary; an entered diluent volume is displayed and used as entered. The physical act is never the derived quantity. **There is one final volume**, Fa = Vd′ + Dapp with Dapp unrounded, and both the displayed final volume and the achieved concentration are computed from it. The final volume and the displacement are displayed at 3 significant figures, and \|Vd′ + displayed D − displayed final\| **≤** one unit in the coarsest of the three displayed places. ↯ **Reproducibility is asserted on the recorded act:** Ca, displayed at 6 significant figures under C7-UN-05, shall reproduce exactly from the content, Vd′, the declared total solids mass (with its unit conversion) and the registered v̄ — or, where Dmin is applied, from the content, Vd′ and v̄ alone — every one of them on the page — except where the exact decimal value lies within one ULP of a 6-sf tie, which fixtures avoid per C7-FX-12. It is not asserted from the displayed final volume, and the output says so (C7-UN-08). | M |
| C7-IV-04 | The same content entered as µg and as mg, and the same target or volume entered in two units of the same family, shall produce unrounded results agreeing within a tolerance derived over the path including unit normalisation. This tolerance has its own register row and is a headline of the derivation memo. | M |
| C7-IV-05 | A mass-based determination and the same determination reached through an imported molecular weight to a molar target shall agree on the **unrounded** diluent volume within the derived tolerance. This is a headline of the derivation memo. | M |

*On C7-IV-03.* The C3 finding on independently rounded volumes, applied here before it can occur.

*One final volume.* A final volume built from the displayed displacement, with the concentration computed from the unrounded one, would put two final volumes on one page, disagreeing in the fourth to sixth significant figure of the concentration. Both come from Fa.

*The additivity bound.* Vd′ is exact at its place. The displayed displacement is within half a unit of its own place, and the displayed final within half a unit of its own. The disagreement is therefore at most ½u(D) + ½u(F), which is at most one unit of the coarsest place. On positive values, half away from zero sends both ties the same way, so the one-unit supremum is approached but not reached. The operator is nonetheless ≤, because the comparison is itself evaluated in floating point, and a strict < would make the test turn on the last bit — a requirement that could fail on correct code (the C1 lesson). Example: 9.93 + 0.0730 = 10.003 against a displayed 10.0 — a disagreement of 0.003, inside one unit of 0.1.

**↯ Departure from the reviewer's wording.** The review asked for the final volume to be shown "at the precision that sum carries" and for the concentration to reproduce "from the displayed volumes". An unrounded D gives the sum no finite precision, so the first request is not definable as written. The second is not achievable at any finite display precision, which was checked rather than argued. In simulation (content 1 µg–1 g, target 1–316 mg/mL, total solids 1–50 × content), content ÷ displayed final misreproduces the 6-significant-figure Ca by up to:

| Final volume shown at | Worst error in the reconstructed concentration |
|---|---|
| 6 significant figures | 5 units in the last place |
| 7 significant figures | 1 unit in the last place |
| Displacement at 6 significant figures, final as its exact sum with Vd′ | 4 units in the last place |

The worst cases agreed across two independent samplings. How often a miss occurs depends on the input distribution (21–30 % of cases at 6 significant figures, 2.5–3.5 % at 7), so no frequency is asserted.

What the 6-significant-figure choice rests on is "an exact arithmetic consequence of a recorded act". The recorded act is the diluent delivered. D is recovered from the declared total solids mass and 0.73 mL/g, both on the page, by one unit conversion and one multiplication. Reproduction from those terms is exact. The final volume is shown at 3 significant figures because it is a volume the user reads against a vial; a seven-figure final volume would claim a precision no vial has. Showing the final at 7 significant figures, accepting reproduction within one unit, would be a display change only and would touch nothing else.

---

## 7. Validation — reject

| ID | Condition | Message shall name |
|---|---|---|
| C7-HI-01 | `stated content ≤ 0` | The content, and that a vial cannot hold zero or negative content |
| C7-HI-02 | `target concentration ≤ 0`, or `entered volume ≤ 0` | The quantity, and that it cannot be zero or negative |
| C7-HI-03 | Content and target of different dimensions — one mass-based, one activity-based | Both units, and that converting between mass and activity requires a lot-specific specific activity, which this tool does not hold |
| C7-HI-04 | Molar target declared with no imported molecular weight, with activity-based content, or with declarations that are not a permitted pair in the §8 table | The target, the declared bases, and the reason from the pairing table — or that a molar target requires a molecular weight imported from C1 and a mass-based content |
| C7-HI-05 | *Not used. The ID is retained so that earlier cross-references resolve.* | — |
| C7-HI-06 | `declared minimum transfer volume ≤ 0` | The minimum, and that a volume cannot be zero or negative |
| C7-HI-07 | Declared total solids mass less than the stated reagent content, where both are given and mass-based | Both masses, and that total solids cannot be less than the reagent they contain |
| C7-HI-08 | `D ≥ F`; or, where D is not computable and Dmin is defined, `Dmin ≥ F` — **evaluated in this form**, on computed values. Target direction: total-solids concentration at the target ≥ 1 ÷ v̄, or, for reagent-alone mass content with no solids declared, target ≥ 1 ÷ v̄. Final volume entered: D, or Dmin, ≥ the entered volume | The target or entered volume, the total solids mass or — where it is not declared — the reagent mass, and that those solids alone would occupy the whole of that volume, so no volume of diluent reaches it |
| C7-HI-09 | Content in U with a target or concentration unit in IU/mL, or the reverse | Both units, and that IU is referenced to an international standard while U is assay- and lot-defined; they are not interconvertible without the lot's definition, which this tool does not hold |

Rejection messages shall name the quantity and the physical reason. **Generic validation errors do not satisfy this section.**

*On C7-HI-08.* At 0.73 mL/g the boundary is about 1370 mg/mL of total solids. It is a sign-change guard, not a plausibility threshold, and the page shall say in one sentence that it will not fire on any real reconstitution, so that nobody reads its silence as a plausibility check. It cannot fire at all when a diluent volume is entered, since then F = entered + D > D.

---

## 8. Validation — compute and flag

Flags never block the determination. Each appears in both the human-readable and structured output with a machine-readable reason code. Every flag is evaluated in both directions.

| ID | Condition | Evaluated on | Flag states |
|---|---|---|---|
| C7-FL-01 | Content basis is "the total vial contents" | The content declaration | The concentration computed is of total solids — reagent, carrier and excipient together — and is not the concentration of the reagent. Where a carrier protein is present, the reagent's concentration may be lower by a large factor. This tool cannot determine it |
| C7-FL-02 | Content basis is "not recorded" | The content declaration | Whether the stated content refers to the reagent alone or to the total vial contents is not recorded; the resulting concentration cannot be interpreted and should not be carried into a method record without it |
| C7-FL-03 | Content source is "vial label or datasheet (nominal)" | The provenance declaration | The content figure is the nominal fill, not the lot's measured content. A lot-specific certificate, where one exists, states what the vial actually held |
| C7-FL-04 | Content source is "not recorded" | The provenance declaration | Content provenance not recorded; the stock cannot be traced to a source |
| C7-FL-05 | Displacement not computable (C7-DT-03) | The available inputs; Dmin where defined | The volume the dissolved solids occupy cannot be computed because the total solids mass is not known. **Mass-based, reagent-alone content:** the displacement has been corrected for the **reagent's own volume only** (Dmin = content × v̄); the displacement of carrier and excipient is not included. The concentration reported is therefore an upper bound — "at most" — under the §11 assumptions for Dmin, to within v̄'s scope error, and the concentration obtained is below it by an amount that cannot be computed from the declared inputs. The flag states Dmin, the minimum displacement fraction fmin = v̄ × content ÷ F (v̄ × target in the target direction), and whether fmin exceeds the material threshold of C7-FL-08. **Activity content, or content basis not recorded:** no correction is applied and no bound is available; the flag states that the reported concentration overstates the one obtained by an amount that cannot be computed |
| C7-FL-06 | Final volume exceeds the declared vial capacity. *Evaluated only where C7-PC-02 is declared* | The achieved final volume Fa | The volume required exceeds the declared vial capacity; the reconstitution cannot be performed in this vial. Where the displacement applied is Dmin or none, the flag states that the check used a final volume that may be smaller than the true one, and cannot rule out a larger one |
| C7-FL-07 | Diluent volume below the declared minimum transfer volume | The diluent volume as delivered, Vd′, against C7-PC-01 | The volume required is below the declared minimum and cannot be delivered reliably. A lower target concentration, or a vial of different content, is required |
| C7-FL-08 | Displacement fraction *f* exceeds the registered material threshold (§11) | *f* on the determination (§5 notation) | The dissolved solids occupy *f* of the final volume. **Final volume known** (target, or final entered): the diluent to add is smaller than the final volume by the displacement; delivering the final volume as diluent instead gives **(content ÷ F) ÷ (1 + f)** — in the target direction, target ÷ (1 + f) — a shortfall of f ÷ (1 + f), stated as a percentage. **Diluent entered:** content ÷ diluent volume overstates the concentration obtained by the factor **1 ÷ (1 − f)** — an overstatement of f ÷ (1 − f), stated as a percentage. At f = 7.3 %: shortfall 6.80 %, overstatement 7.88 % |
| C7-FL-09 | The imported C1 object's mass basis, the content basis and the conjugate declaration do not form a permitted pair | The declarations | The molar form is **withheld**. The reason is stated from the table below, and the declared bases are named. The mass-based result stands |
| C7-FL-10 | An imported C1 object carries any flag | The imported result object | The imported value's flags are restated here in full |
| C7-FL-11 | Carrier presence is "present" | The carrier declaration | The stock contains carrier protein — at the declared total solids mass, or at a mass not stated. **A protein assay of this stock reports carrier, not the reagent.** The reagent's concentration is the computed one only on the declared content basis |
| C7-FL-12 | Carrier presence is "not recorded" | The carrier declaration | Whether the stock contains carrier protein is not recorded; a protein assay of it cannot be interpreted against the computed concentration |
| C7-FL-13 | Conjugate state is "a conjugate", either mass | The conjugate declaration | The concentration is of the **protein alone** or of the **conjugate**, as declared; the tool does not correct for degree of labelling. Carried onward with the stock |
| C7-FL-14 | Conjugate state is "not recorded" | The conjugate declaration | Whether the stated mass includes a label or payload is not recorded; the concentration cannot be paired with a molecular weight and should not be carried into a method record without it |

**Permitted pairs for the molar form.** Rows are evaluated in order; the first matching row supplies the reason. The table governs both a molar *target* (rejected under C7-HI-04 where not permitted) and the molar *form of the result* (withheld under C7-FL-09 where not permitted). The permitted pairs are C4's two — assembled with protein, conjugate with conjugate — and no others.

*Order.* The disqualification closest to the physical error is named first: content basis, then content dimension, then conjugate state, then the C1-side rows. The C7-side rows come first because the C1 object's own declarations — monomer, basis not recorded — already reach the screen through C7-FL-10 as C1-FL-06 and C1-FL-07 (checked against C1 v0.5; re-check at C1 v0.6). The C7-side reason is the one the user has not yet been shown.

| C1 molecular-weight basis | C7 content basis | C7 conjugate declaration | Molar form | Reason stated |
|---|---|---|---|---|
| Any | The total vial contents | Any | Not permitted | The content is the total solids mass; dividing it by the reagent's molecular weight would count carrier and excipient as reagent |
| Any | Not recorded | Any | Not permitted | Content basis not recorded |
| Any | The reagent (activity) | — | Not permitted | The content is stated in activity units; there is no mass to divide by a molecular weight |
| Any | The reagent alone | Not recorded | Not permitted | Whether the stated mass includes a label or payload is not recorded |
| Not recorded | Any | Any | Not permitted | Molecular-weight mass basis not recorded |
| Monomer or single chain | Any | Any | Not permitted | The molecular weight is declared as a monomer or single chain; the molar value would be of that unit, not of the whole reagent, unless the reagent is itself a single chain — which the tool cannot determine |
| Assembled molecule | The reagent alone | Not a conjugate | **Permitted** | — |
| Assembled molecule | The reagent alone | Conjugate, mass of the protein | **Permitted** — the molarity is of the protein, not of the conjugate, and is so labelled | — |
| Conjugate including label or payload | The reagent alone | Conjugate, mass of the conjugate | **Permitted**, C7-FL-10 carries C1's conjugate flag; the molarity is of the conjugate | — |
| Conjugate including label or payload | The reagent alone | Not a conjugate, or conjugate, mass of the protein | Not permitted | The molecular weight includes the label or payload; the stated mass does not |
| Assembled molecule | The reagent alone | Conjugate, mass of the conjugate | Not permitted | The stated mass includes the label or payload; the molecular weight does not |

**A whole-vial reconstitution of a reagent-alone, non-conjugate, carrier-absent content, from a lot certificate, with a declared total solids mass, every volume inside the declared bounds and displacement below the material threshold, raises no flags — in either direction.** This is the expected case and is tested by acceptance 9.

---

## 9. Failure classes this tool cannot detect

Required on the tool's own page, visible to the user, not confined to documentation.

The tool guarantees that the volume arithmetic is correct and that the content basis, its provenance, the conjugate state, carrier presence, the volume basis and the displacement treatment are recorded. It cannot detect:

1. A **stated content that is wrong** — mislabelled, or a vial from a different lot than the certificate consulted
2. **Incomplete dissolution.** The tool assumes the solids dissolve fully. A cake that has not fully gone into solution gives a lower concentration than computed, and the solution may look clear
3. **Loss to the vial and closure.** Protein adsorbs to glass and to the stopper, which matters most at the low masses where it is least visible
4. **Loss during reconstitution** — foaming, vortexing, material left on the stopper or wall. The most common loss at the bench, and the tool sees none of it
5. **Loss of activity** before reconstitution — storage, temperature excursion, or age. A correct mass of inactive protein reconstitutes to the computed concentration and does not work
6. **The wrong diluent.** Datasheets frequently specify the diluent — dilute acid for some growth factors, buffer with carrier for others. The tool computes a correct concentration in the wrong solvent and cannot know
7. **A collapsed, discoloured or partially melted cake**, which indicates a compromised vial. The tool sees only the numbers
8. **Vial vacuum.** Many lyophilised vials are stoppered under vacuum, which draws diluent in and can leave delivered volume differing from the volume drawn up
9. **Whether the registered partial specific volume applies.** The value is for protein-dominated solids; a cake that is mostly excipient has a lower value, and the correction then overshoots by a bounded amount in a stated direction (§11). The tool cannot know the excipient fraction
10. **Whether a specific activity used elsewhere is the lot's.** C7 does not convert between activity and mass, so it never holds one; a user who converts by hand before entering a value brings that risk with them
11. Any error in the **execution**. The tool states the volume; it does not observe what was delivered

| ID | Requirement | Pri |
|---|---|---|
| C7-FC-01 | The above list shall be displayed at the tool's own address. | M |

---

## 10. Fixtures and verification

Fixtures shall not share the property that round numbers make the arithmetic exact, nor that something is always wrong with the input. C7-FX-08 is the negative control. Every fixture that states a direction is run in both directions unless it names one.

| ID | Fixture | Standard it is evaluated against |
|---|---|---|
| C7-FX-01 | A non-round content and a non-round target, constructed so that no displayed value lies within one ULP of a decimal tie at its displayed precision — assessed against the leading-digit-dependent resolution of C7-UN-04, not a single figure; stated per C7-FX-12 | Hand calculation, at the displayed precision of C7-UN-04 and C7-UN-05, with the rounding rule of C7-UN-06 |
| C7-FX-02 | Content entered as µg and as mg; target entered in two units of the same family; a volume entered in µL and in mL | C7-IV-04 — unrounded values within the derived tolerance |
| C7-FX-03 | Target → unrounded diluent → concentration, and the reverse | C7-IV-01 — derived tolerance, unrounded |
| C7-FX-04 | **The total-protein case.** An antibody vial stating 1 mg total protein, stabilised with BSA, reconstituted to a nominal 1 mg/mL | C7-FL-01 raised; the concentration reported as total solids; the reagent's concentration reported as not computable with the reason in the cell, never as equal to the total |
| C7-FX-05 | **High-concentration displacement.** Content 80 mg, reagent alone, declared total solids 100 mg, target 80 mg/mL: total-solids concentration 100 mg/mL, F = 1.000 mL, D = 0.0730 mL, f = 7.30 %, Vd′ = 0.927 mL, Fa = 1.000 mL | Displacement computed per C7-DT-03; C7-FL-08 raised with a shortfall of 6.80 % at f = 7.30 %; Ca = 80.0000 mg/mL; the diluent volume smaller than content ÷ target by the displacement; C7-IV-03's additivity bound holds; Ca reported per C7-DT-07 and reproduced by hand from content, Vd′, solids and v̄ |
| C7-FX-06 | The same vial with no total solids mass declared | C7-FL-05 raised. Dmin = 0.0584 mL applied as a partial correction; diluent **0.942 mL**, labelled "corrected for the reagent's own volume only; carrier and excipient not included"; concentration **at most 79.9680 mg/mL**, labelled "at most" and not "achieved", on the page and in the notebook copy; fmin = 5.84 %, stated as exceeding the material threshold; the structured object marks the concentration as an upper bound with its reason. Then the same vial with a diluent volume entered: 1.00 mL gives at most 75.5858 mg/mL with fmin = 5.52 %, and 0.942 mL gives at most 79.9680 mg/mL. Then a case whose diluent rounds down: 1.0044 mg at 1 mg/mL, diluent 1.00 mL, at most 1.00366 mg/mL. Construction per C7-FX-12: the unrounded diluent, 0.941600 mL, lies **1.00 × 10⁻⁴ mL above the 3-sf tie at 0.9415 mL** — outside one ULP, and the closest approach to a tie in the fixture set. And an activity-content case with no solids, which is uncorrected and carries the unbounded wording |
| C7-FX-07 | **Activity-unit content.** A vial stating 10⁶ IU, targeted at 10⁴ IU/mL, with no solids mass; and the same vial with 5 mg of declared total solids | First: volume computed; displacement not computable; molar target rejected per C7-HI-04; basis stated as "the reagent (activity)". Second: displacement computed — mass is mass |
| C7-FX-08 | **Negative control.** Whole vial, reagent-alone, non-conjugate, carrier-absent content from a lot certificate, declared total solids mass, moderate target concentration, every volume inside the declared bounds, displacement below the material threshold; and the same vial in the volume → concentration direction | **No flags raised**, in both directions |
| C7-FX-09 | **Pairs.** Each row of the §8 pairing table, once as a molar target and once as an imported object with a mass-based target, including both permitted conjugate combinations and both mismatched ones | The molar target rejected or accepted, and the molar form withheld or reported, exactly as tabulated, with the row's reason and the bases named; a permitted protein-mass pair labelled as molarity of the protein |
| C7-FX-10 | Values immediately either side of, and exactly on, the declared minimum transfer volume (against Vd′, a displayed decimal). For the declared vial capacity (against Fa, which carries an unrounded solids × v̄ product), the C7-HI-08 boundary — D ≥ F on a computed D, and Dmin ≥ F with no solids declared — and the C7-FL-08 threshold, whose decimal values do not terminate: the nearest representable inputs either side, in the stated evaluated forms (D ≥ F or Dmin ≥ F; *f* against the threshold; Fa against the capacity) | The operators as written in §7, §8 and §11 |
| C7-FX-11 | **Every factor, derived by hand from its relation** (§0.3 method note). The displacement fraction *f* with its denominator named. C7-FL-08: 1 ÷ (1 + f) where the final volume is known — once as a target and once as an entered final volume — and 1 ÷ (1 − f) where the diluent is entered; at f = 7.3 %, 6.80 % and 7.88 %. C7-FL-05's fmin = v̄ × content ÷ F in each direction. Each derivation is recorded with the fixture | The direction and labelling required by C7-DT-05. FL-08 is keyed to the known volume, not the direction |
| C7-FX-13 | **The datasheet case.** A vial of stated content reconstituted in 1 mL as instructed, entered once as diluent and once as final volume, with and without a declared solids mass | C7-DT-02; the concentration obtained differs between the two entries by exactly the displacement's effect; with the final volume entered, Ca is computed from Vd′ and Fa is reported beside the entered final, labelled; C7-FL-05 in the no-solids case |
| C7-FX-14 | **The rounding-direction case.** A target → volumes determination with final volume primary, constructed so that rounding the final volume first and deriving the diluent from it would place the diluent more than half a display step from its true value | C7-IV-03 — the diluent is rounded from its own value; the displayed final volume and Ca are both computed from one Fa; the additivity disagreement is ≤ one unit of the coarsest displayed place; Ca reproduces by hand from content, Vd′, solids and v̄. Reproduction from the displayed final volume is **not** asserted |
| C7-FX-15 | Content in U with a target in IU/mL, and the reverse | C7-HI-09 |
| C7-FX-16 | **Carrier cases.** Carrier present with solids declared; carrier present with solids not declared; carrier not recorded | C7-FL-11 with displacement computed; C7-FL-11 with C7-FL-05; C7-FL-12 |
| C7-FX-17 | **A visible achieved departure.** Content 1.0054 mg from a lot certificate, reagent alone, not a conjugate, carrier absent, whole vial, total solids 1.2 mg, target 1 mg/mL, minimum transfer volume left at 2 µL, no capacity declared. D = 0.000876 mL; unrounded diluent 1.004524 mL, displayed **1.00 mL**; Fa = 1.000876 mL. Construction assumption per C7-FX-12: leading digit 1 in the diluent, where the 3-sf resolution is coarsest; the nearest 3-sf tie, 1.005 mL, is 4.76 × 10⁻⁴ mL away, far outside one ULP; f = 0.0871 %, below the material threshold | Ca = **1.00452 mg/mL**, reported beside the target 1.00000 mg/mL — a departure of +0.452 %, above target because the diluent rounds down. An implementation reporting the target twice fails. Ca reproduces by hand as 1.0054 ÷ (1.00 + 1.2 × 0.73 × 10⁻³). **No flags raised** — a second clean case, so that the departure is not masked by a flag |

| ID | Requirement | Pri |
|---|---|---|
| C7-FX-12 | Every constructed fixture shall state the assumption under which it was constructed, and shall **record the distance from each displayed value to the nearest tie at its displayed precision** — the figure itself, not the assertion that it is outside one ULP — so that the fixture set is auditable. | M |

---

## 11. Constants, assumptions and conventions register

| ID | Requirement | Pri |
|---|---|---|
| C7-CN-01 | Every threshold at which the tool changes behaviour, every constant it applies, every assumption under which a value is computed, and every convention under which a value is interpreted, shall be listed with its value, its scope and its basis. Each row carries exactly one status: derived, measured, characterised, disclosed, proposed or open. A sign-off appears only with a signatory and date and attaches to the record it was given against. **The page shall not state a decision that has not been made.** This list shall appear at the tool's own address, not only in a manuscript. | M |

Proposed register:

| Item | Value | Basis | Status |
|---|---|---|---|
| Partial specific volume, v̄ | **0.73 mL/g** | Average for globular proteins, range ≈ 0.70–0.75: Harpaz, Gerstein & Chothia 1994, *Structure* 2:641; Perkins 1986, *Eur J Biochem* 157:169. **Scoped to protein-dominated solids.** A constant of the tool, not a user input. Carried from the C3 review | **Characterised** — signed NADIRA, 21 September 2026. The excipient values are a separate open row |
| Scope-error bound of v̄ | ε = (0.73 − v̄ₜᵣᵤₑ) × total-solids concentration: **exact as the fractional error in the final volume**, relative to the computed final; first-order as the concentration excess | Applying 0.73 mL/g to solids whose true value is lower over-corrects: the computed displacement is too large, and the true final volume **smaller than computed** by ε of it. The true concentration is therefore **above** the reported one by the factor 1 ÷ (1 − ε), an excess of ε ÷ (1 − ε), which is ε to first order. The direction is the same whichever volume is known. At 100 mg/mL of solids with v̄ = 0.3 mL/g: 4.30 % first-order, 4.49 % exact. Below 10 mg/mL, under 0.5 % for any solid with v̄ ≥ 0.3 mL/g — this does not cover solids that may sit below 0.3 mL/g (see the excipient row below). **The correction beats no correction where the solids' mass-weighted v̄ exceeds 0.365 mL/g**. That figure is exact for the volume error and first-order in concentration. In concentration terms the crossover rises with solids concentration: 0.365 at 1 mg/mL, 0.378 at 100 mg/mL. Protein-, sugar- and polyol-dominated solids qualify; salt-dominated solids may not | **Derived** |
| Partial specific volumes of excipients | Sugars and polyols ≈ 0.6–0.67 mL/g; salts of order 0.3 mL/g; whether any common excipient has a small or negative apparent volume at the relevant concentrations | From NADIRA's note, to be confirmed against Durchschlag's compilation before any value enters the scope-error row or the Dmin assumption | **Open** — outstanding item 2 |
| Material displacement threshold (C7-FL-08) | *f* > the **tightest maximum permissible systematic error in the cited row**. For orientation only, until cited: 1 % → 13.7 mg/mL; 0.8 % → 11.0 mg/mL; 0.6 % → 8.2 mg/mL total solids at 0.73 mL/g | A correction is material when it exceeds the delivery error of the act it drives. ISO 8655-2 — **current edition, table and nominal-volume row to be cited** — gives the maximum permissible systematic error for single-channel piston pipettes. It is volume-dependent; *f* is not, so a threshold anchored to the tightest case is conservative everywhere else. **Unverified candidates, from NADIRA's recollection:** the tightest single-channel row may be 10 mL at about 0.6 %, not 100–1000 µL at about 0.8 %; the citation is to be read from the tightest row of the current edition, not from the row that confirms an earlier figure. Syringe graduation tolerances under ISO 7886-1, as recalled, are several percent, which is the conservative direction, so the pipette anchor stands. Both standards to be cited before either number reaches the page | **Open** — the value, until cited. The definition is signed (NADIRA, 21 September 2026) — outstanding item 1 |
| Minimum displacement Dmin (C7-FL-05, C7-HI-08) | Dmin = content × v̄; fmin = v̄ × content ÷ F, which is v̄ × target in the target direction — **7.3 % at 100 mg/mL**, 0.73 % at 10 mg/mL, 1 % at 13.7 mg/mL. Applied as a partial correction where it is the only displacement defined | Analytic: for mass-based reagent-alone content, solids ≥ content. A lower bound under the two assumptions below, to within v̄'s scope error. Not defined for activity content (no mass), or for content basis not recorded, which may be total solids, for which 0.73 mL/g is not a lower bound | **Derived** |
| Unattainable-volume boundary (C7-HI-08) | 1 ÷ v̄ ≈ **1370 mg/mL** total solids at 0.73 mL/g — on D, or on Dmin | Analytic: where D (or Dmin) ≥ F the diluent volume is ≤ 0. Evaluated as D ≥ F, or Dmin ≥ F, on computed values. Will not fire on any real reconstitution; a sign-change guard, not a plausibility check. Cannot fire with a diluent volume entered | **Derived** |
| Displayed-volume resolution | **0.05–0.5 %** of the value, leading-digit dependent | A half-step at 3 significant figures is 0.005 on a mantissa between 1.00 and 9.99. The concentration achieved at the displayed diluent volume therefore differs from the target by up to 0.5 %, and C7-DT-07 reports it rather than bounding it | **Characterised** |
| Round-trip tolerance (C7-IV-01) | To be derived | Analytic bound over both directions: one division, and where displacement applies one multiplication and one addition or subtraction | **Open** — outstanding item 3 |
| Unit-normalisation tolerance (C7-IV-04, C7-IV-05) | To be derived | Analytic bound over the path including normalisation by non-power-of-two factors. The headline of the derivation memo | **Open** — outstanding item 3 |
| Minimum reliable transfer volume | User-declared; **2 µL** pre-filled suggestion | Inspection. Carried from C4-SR-05 | **Disclosed** — a default, on the behaviour path whenever unchanged |
| Vial working capacity | User-declared, optional, no default | Disclosed | Disclosed |
| Displayed precision, volumes | 3 significant figures | Principle: precision matches the physical act. C7 drives a syringe | Disclosed |
| Displayed precision, final volume and displacement | 3 significant figures, both from the single Fa | C7-IV-03: additivity within one unit of the coarsest displayed place (≤). Reproducibility asserted on the recorded act, not on the displayed final ↯ | Disclosed |
| Displayed precision, concentrations | 6 significant figures | Matches C1 and C3. Applies to the achieved concentration, an exact consequence of a recorded act | **Disclosed** — signed NADIRA, 21 September 2026. Extended to an upper-bound concentration by A. Modi's decision of 28 September 2026 |
| Rounding rule | Half away from zero, on the exact binary value | Convention, C1 onward | **Disclosed** |
| Kept-in-view height (C7-NF-05) | To be measured | Measured over every co-occurring flag combination, once the build exists | **Open** until measured |

Assumptions, listed beside the register on the page in their own table (C3 convention — an assumption is not a threshold):

| Assumption | Scope | Status |
|---|---|---|
| Volumes are additive: final volume = diluent volume + solids mass × v̄. The correction this gives beats no correction for solids whose mass-weighted v̄ exceeds 0.365 mL/g — protein-, sugar- and polyol-dominated solids. There, the constant's uncertainty is bounded in the register and is not a reason to omit the correction. For salt-dominated solids it is not guaranteed | Every determination where displacement is computable | Disclosed |
| **Where the total solids mass is not known:** mass-based reagent-alone content is corrected for the reagent's own volume only (Dmin), and its concentration is reported as an upper bound. For activity content or content basis not recorded, no correction is applied and no bound is available | Every determination where C7-FL-05 is raised | Disclosed — NADIRA's decision of 21 September 2026. Its four conditions are implemented at C7-DT-01 (the diluent's label), C7-DT-07 ("at most", never "achieved"), C7-ST-02 (handed onward as a bound with its reason) and C7-DT-03 (scope: mass-based reagent-alone content only), with C7-FL-05 retained |
| The reagent is a protein, within the scope of v̄ — the first condition for Dmin. Even then Dmin is a lower bound only to within v̄'s scope error: a reagent whose true v̄ is 0.70 mL/g displaces 0.959 × Dmin, so Dmin may exceed the reagent's own displacement by up to ≈ 4 %. With Dmin applied, that over-correction arises only where the solids are almost entirely reagent, since any carrier or excipient displacement offsets it. There it is a few tenths of a percent of the volume — about 0.3 % at 100 mg/mL — and it does not argue against the bound | Every determination reporting Dmin | Disclosed |
| The solids other than the reagent do not reduce the solution volume — the second condition. Some electrolytes have small or negative apparent volumes in water owing to electrostriction; whether any common lyophilisation excipient does at the relevant concentrations is not established here | Every determination reporting Dmin | **Disclosed** — its confirmation is tracked in the excipient row and outstanding item 2 |
| The solids dissolve completely into the diluent | Every determination (§9 item 2) | Disclosed |

One constant cited, three rows derived from it, two tolerances to derive, one height to measure, and two citations outstanding: the ISO 8655-2 row and the excipient values.

---

## 12. State and handoff

| ID | Requirement | Pri |
|---|---|---|
| C7-ST-01 | A C1 result object imported into C7 supplies the molecular weight, its declared source, its mass-basis declaration, and every flag raised on it — and nothing else. It shall not be accepted stripped of its flags, and shall carry the integrity check of the shared transport mechanism. | M |
| C7-ST-02 | The stock handed onward shall carry: the stated content and its unit; the content basis; the content provenance; the conjugate declaration, for mass-based content; the carrier declaration; the direction; the volume basis; both volumes, with the achieved final volume and the entered one where they differ; the displacement treatment — computed with its value and fraction, or not computable with its reason, and Dmin, applied, where defined; the **achieved concentration** as the stock's concentration — or, where Dmin was applied, that concentration **marked as an upper bound, with its reason and the §11 assumptions it holds under** — with the target retained where one was entered; the declared minimum transfer volume and whether it was entered or defaulted; the unrounded values of every reported quantity; every flag raised; and, where a C1 object was imported, that object in full. **A stock shall not be transferable stripped of its content basis, its carrier declaration, or — for mass-based content — its conjugate declaration.** | M |
| C7-ST-03 | The transport mechanism shall be the same one specified for C1 → C4 and C4 → C3, subject to C7-ST-07. | M |
| C7-ST-04 | No input shall persist across a page reload unless its persistence is visible on screen. | M |
| C7-ST-05 | Changing the direction, any declaration, or any declared capability shall recompute the determination and shall not silently retain values computed under the previous declaration. Any value retained shall be visibly marked as retained. | M |
| C7-ST-06 | Same inputs shall always produce the same outputs. No hidden state, no time dependence. | M |
| C7-ST-07 | **Nothing the user enters shall survive closing the page.** The tool shall not write user-entered data to any browser storage that outlives the page — persistent local storage, indexed databases, or cookies. Storage scoped to the open page is permitted only under C7-ST-04. This is the standing privacy statement's *closing the page ends it*, stated as a requirement, and is verified per acceptance 17. | M |

*On C7-ST-02.* This is the requirement C7 exists for. C3, C4 and C5 each begin by asking for a stock concentration, and until now each has accepted one on trust. A stock that arrives from C7 arrives knowing what it is a concentration of, whether it contains carrier, and whether its mass includes a label. A stock stripped of any of these is indistinguishable from a typed number.

| ID | Requirement | Pri |
|---|---|---|
| C7-ST-08 ⁱ | A tool receiving a C7 stock whose concentration is marked as an upper bound shall treat every value derived from it as an upper bound, label it "at most", and carry C7's reason. This is a requirement on receiving tools, recorded here because C7 originates the bound; it is carried into C3 by change request **CR-C3-01**, and into C4 and C5 when those are written. C7 shall not withhold the bound to avoid the obligation, and that half is testable here (acceptance 26). | ⁱ |

ⁱ **Interface requirement.** Its obligation falls on another tool, so it carries no M/S priority in this document: it is implemented in C3 and tested there.

*On the bound, downstream.* A stock can leave C7 as an upper bound rather than a point value, and for mass-based reagent-alone content with no declared solids that is the ordinary case. C7-OUT-04 makes the shared format carry the bound; it does not make the receiving tool honour it. A receiving tool that dilutes a bounded stock and reports a point value destroys the bound at the first handoff, which is gate item 9's failure moved to the tool-set boundary. The requirement belongs in the receiving tools — C3 now, C4 and C5 when they are written — and is stated at C7-ST-08 and issued as CR-C3-01: an output computed from a stock marked as an upper bound is itself an upper bound, labelled "at most", carrying C7's reason. Dividing an upper bound by a positive dilution factor leaves an upper bound. C3 has not shipped, so this is a change before its build, not a retrofit.

*On C7-ST-07.* This is not a hypothetical retrofit. The C4 development build reviewed on 15 September restores values from persistent local storage (C4 finding B2); that mechanism contradicts the privacy statement's first paragraph as well as B2's own defect, and its removal is part of C4's clearance (outstanding item 6). A URL-fragment transport is compatible with *closing the page ends it* provided the statement never claims more than that: browser history and bookmarks are the user's own artefacts.

---

## 13. Output

| ID | Requirement | Pri |
|---|---|---|
| C7-OUT-01 | The result shall be accompanied by the relations applied, the assumptions made, a full echo of every input with its unit, and the engine version. | M |
| C7-OUT-02 | The direction, content basis, content provenance, conjugate declaration, carrier declaration, volume basis, displacement treatment, whole-vial confirmation and declared capability values shall appear in the derivation, not only in the input echo. | M |
| C7-OUT-03 | Both volumes of C7-VB-02 shall be reported, with the entered or primary one identified and the other marked as derived, each at its stated precision. Where a final volume is entered, the achieved final volume Fa is reported beside it, labelled (C7-DT-07): three volumes. | M |
| C7-OUT-04 | A structured, machine-readable result object shall be produced for every determination, with units attached to every quantity, in the shared format at the version that carries the fields below. The format shall express at least: the stated content with its unit; the whole-vial confirmation; the content basis; the content provenance; the conjugate declaration, for mass-based content; the carrier declaration; the direction and volume basis; both volumes, and the achieved final beside an entered one; the displacement treatment — its value and fraction, or not computable with its reason, and Dmin where applied; the reported concentration with its label (**achieved** where the diluent is displayed, **obtained** where it is entered, **at most** for an upper bound, or **uncorrected for displacement**) and, for an upper bound, its reason and the §11 assumptions it holds under; the target where one was entered; the declared minimum transfer volume and whether it was entered or defaulted; the declared vial capacity where one was given; the engine version; the unrounded value of every reported quantity; every flag with its machine-readable reason code; and an embedded C1 result object where one was imported. Adding these fields is a versioned change to the shared format, made once and visible to every tool. **If a genuine conflict with an existing field is found during build — not a missing field, but a field that cannot mean two things at once — stop and escalate rather than resolving it locally.** | M |
| C7-OUT-05 | The structured and human-readable outputs shall be generated from one computation and cannot disagree. | M |
| C7-OUT-06 | The scope statement — research use, not qualified for GxP decision-making — shall be displayed. It is the fourth paragraph of the standing privacy statement (§14.1) and is not reworded. | M |
| C7-OUT-07 | Displayed precision and the rounding rule shall be stated on the output. | M |
| C7-OUT-08 | The output shall state that the tool determines a volume or a concentration and does not verify what was delivered or whether the solids dissolved. | M |
| C7-OUT-09 | A declaration shall be displayed by its short label wherever its value is shown. Guidance explaining how to choose a value belongs in the input control and shall not be carried into any displayed value. | M |
| C7-OUT-10 | The result shall be copyable in a form suitable for pasting into a lab notebook. The copied text shall carry every declaration, every flag **in words rather than by code alone**, both volumes — and the achieved final beside an entered one — the displacement treatment, and the achieved concentration with its basis — labelled "at most" where it is an upper bound, with the diluent's "reagent's own volume only" label — with the target where one was entered. | M |

**On C7-OUT-10.** Carried from C4's I3 finding. The notebook copy is the artefact most likely to outlive the page, and a copy stating only a volume tells a later reader nothing about what was in the vial — which is the failure this tool exists to prevent.

---

## 14. Non-functional

| ID | Requirement | Pri |
|---|---|---|
| C7-NF-01 | Entirely client-side. No user-entered data leaves the browser. Verified per acceptance 16 against the deployed address. | M |
| C7-NF-02 | No account, login, or registration. | M |
| C7-NF-03 | **The standing privacy statement shall be displayed on the tool's own page, verbatim** (§14.1), under its own heading, reachable without scrolling past the result at the reference viewport or from a link in the page footer that names it. | M |
| C7-NF-04 | At the reference viewport, whenever the result is visible, the declaration summary and every flag raised shall also be visible without scrolling. The result shall never be readable apart from the declarations and flags it was computed under. | M |
| C7-NF-05 | The material C7-NF-04 keeps in view shall have a height bounded above by a stated value holding for every combination of flags that can co-occur, listed in §11 as a measured constant once measured. | M |
| C7-NF-06 | The reference viewport is **1366 × 650 CSS px**. | M |
| C7-NF-07 | Result shall be perceptibly immediate. No progress indicator. | M |
| C7-NF-08 | Reachable and usable at its own address, independently of any other tool, including without C1 and C3. | M |
| C7-NF-09 | Engine version stated on output, changing whenever calculation behaviour changes. | M |

### 14.1 Standing privacy statement

**Tool-set text, version 1.0, 16 September 2026. Owner: A. Modi. Legal review: THERON (outstanding item 4).** One text for every Ligant Bench Tools page. It is displayed verbatim, not reworded per tool, and a change to it bumps its version and is applied to every deployed page at once, with acceptance 17 re-run on each. A tool page displays the current version or none.

> **Privacy**
>
> Your data stays in your browser. Everything you enter into this tool is calculated on your own device and never sent anywhere. We do not see it, store it, or have any way to retrieve it. Closing the page ends it.
>
> There is no account and no tracking of you. No login, no sign up, no cookies for advertising, no analytics scripts, and no third party code of any kind runs on this page.
>
> We do count visits. Our hosting provider records basic traffic: which pages get opened, how often, and roughly where in the world from. Because we collect nothing about who you are, this is the only signal we have about whether these tools are useful and which one to build next.
>
> Ligant Bench Tools are free and open source. Research use only, not qualified for GxP decision-making.

**The statement makes five claims about the artefact, each verified rather than asserted (acceptance 17):**

| Claim | Verified by |
|---|---|
| Nothing entered leaves the browser | Acceptance 16 — network monitoring at the deployed address |
| Closing the page ends it | C7-ST-07 — no storage outliving the page is written at the deployed address. A transport in the URL fragment is compatible; the statement claims nothing about the user's own history or bookmarks |
| No third-party code runs on the page | The loaded-resource list at the deployed address contains only the tool's own origin. This is a claim about what *loads*, not only what is sent: fonts, scripts and styles are self-hosted (§14.2), and **scripts the hosting provider can inject at the edge** — analytics beacons, script loaders, obfuscation helpers — count as third-party code and are confirmed off in the hosting configuration |
| The description of the hosting provider's traffic records is accurate | Compared with what the provider actually records for the deployed site, including how approximate location is derived. Wording decision in outstanding item 4 |
| Free and open source | The tool's source repository is public under the stated licence at go-live, and the page links to it |

**Outstanding item 4.** Two wording questions remain for THERON: whether the traffic-records sentence should say that approximate location is derived from the network address of the request and handled by the provider under its own terms; and whether "no cookies for advertising" should be the flat "no cookies" if the provider sets none. Neither changes the requirements above; both change the verbatim text, and therefore its version.

### 14.2 Branding

**Tool-set requirements, in the form every URS carries.** Reference: Ligant Brand Guidelines v1.1 (June 2026). The rules that constrain the *build* of a tool page — self-hosted Inter and IBM Plex Mono, colour tokens, red reserved for system error, no AI visual language, no emoji or mascots — live in the standing developer brand handoff, not in a URS, so that they are stated once and change once. The URS carries only what identifies the page and what the page must be verified against.

| ID | Requirement | Pri |
|---|---|---|
| C7-NF-10 | The page shall identify the product as **Ligant Bench Tools** and this tool as **Reconstitution**, in that relation — brand, then plain descriptor — and shall name the brand as **Ligant** wherever it appears in running text, headings, the notebook copy and the structured object. The form "Ligant.ai" shall not appear as a name; "ligant.ai" appears only as a web address, as a link. | M |
| C7-NF-11 | The page shall use the shared Ligant Bench Tools chrome — masthead, result panel, register and statement sections, footer — as built for C1 and C4, with no tool-local design. Any question the shared chrome does not answer is routed to ZURI as a tool-set design question, not resolved in this tool. | M |
| C7-NF-12 | Every font, script, style and image the page loads shall be served from the page's own origin. This requirement is stated here because it is where brand (typography per Guidelines §05) meets the privacy statement's third claim, and it is verified once, under acceptance 17. | M |
| C7-NF-13 | Colour shall never encode the quality of a result. A flagged value, a withheld value, a not-computable cell and a rejected input shall each be distinguishable from a clean result **structurally** — by label, position or control state — and not by colour alone. Red is reserved per Guidelines §04 for the §7 rejection state and system errors; a §8 flag is never red. | M |
| C7-NF-14 | The page shall carry the Ligant mark and the product name at the sizes and clear space the Guidelines set, and the mark shall not be recoloured, rotated, stretched or altered at its centre. The mark's amber centre is the single sanctioned brightening and is used as supplied in the icon library. | M |

*On C7-NF-13.* This is the brand principle "design for the moment of bad news first" applied to the object this tool set exists to produce. A flag is information about the result, not a verdict on it, and a user who learns to read red as "wrong" will stop reading flags that are not red. The C4 build review established the structural distinction between flagged and withheld; C7 inherits it and adds the not-computable cell.

---

## 15. Out of scope

| Item | Where it belongs |
|---|---|
| Dilution of the resulting stock, of any length | C3 |
| Titration series design | C4 |
| Multi-component cocktails with overage | C5 |
| **Conversion between activity units and mass** through a specific activity | Not in the catalog. If ever built, it carries bioassay uncertainty and needs a declared uncertainty, not a tolerance — outstanding item 8 |
| Molecular weight lookup, protein identification, sequence handling | Deliberately excluded, as C1-MW-02. A molecular weight enters C7 only inside a C1 object |
| Buffer or diluent selection, carrier addition, aliquoting or storage guidance | Not in the catalog. The wrong diluent is §9 item 6 |
| Correction for incomplete dissolution, adsorptive loss or handling loss | Not in the catalog. Stated as undetectable per §9 items 2–4 |
| Weighing out solute from bulk powder to a target mass | Not in the catalog unless an observed user is found — C1 open item 4. A portion already weighed enters C7 as content, provenance "weighed, from bulk" |
| Reconstitution of a fraction of a vial | Not built — no producing act for a lyophilised cake |
| **Asking the user to classify the solids** (protein, sugar, salt) to select a partial specific volume | Decided against. The user rarely knows the excipient mass fraction and would be declaring a guess; the single registered value is scoped to protein-dominated solids and its scope error is bounded and disclosed (§11) |
| Degree-of-labelling or DAR correction | Not in the catalog. C7-VC-07 records which mass was stated; it does not correct between them, as C1-FL-08 |

**Boundary with C3.** C7 produces a stock; C3 dilutes one. Where that stock is marked as an upper bound, C3's outputs are upper bounds too — C7-ST-08, issued to C3 as CR-C3-01. It precedes C3 shipping, not C7's build. C3-SK-03 already lists "computed by C7" as a stock provenance. A previously reconstituted vial is a liquid stock and enters C3, not C7. There is no point at which both compute the same number.

---

## 16. Acceptance

**Correctness**

1. A reference case verifies a whole-vial reconstitution against hand calculation to displayed precision in both directions, with the expected table stated and its tie properties recorded per C7-FX-12.
2. A non-round case (C7-FX-01) verifies against hand calculation.
3. An independent reimplementation in a second language agrees with the shipped implementation on the full fixture set, compared on **unrounded** structured values within the derived tolerances. Code review does not satisfy this test.
4. Every determination produces a structured object validating against the shared format **at the version carrying the C7-OUT-04 fields**, or the escalation of C7-OUT-04 is recorded.

**Invariance**

5. The two directions are inverses within the derived tolerance, unrounded (C7-IV-01).
6. A computed diluent volume is rounded from its own unrounded value whichever volume is primary; an entered diluent volume is displayed and used as entered — verified against C7-FX-14. The displayed final volume and the reported concentration come from one Fa. Displayed diluent plus displayed displacement agrees with the displayed final within one unit of the coarsest displayed place. The reported concentration reproduces by hand from content, displayed diluent, declared solids and v̄ — or, where Dmin is applied, from content, displayed diluent and v̄ (C7-FX-14, C7-FX-17).
7. Each invariance test is confirmed capable of failing under an inserted clamp, floor and nudge, each exceeding the derived tolerance.
8. A mass-based determination and the same determination via an imported molecular weight to a molar target agree on the unrounded diluent volume within the derived tolerance.

**Validation behaviour**

9. **Negative control.** The clean case of C7-FX-08 produces a result with no flags raised, in both directions.
10. Every §7 condition is rejected with a message naming the quantity and the physical reason, including C7-HI-08 at its boundary and C7-HI-09.
11. Every §8 condition computes a result and raises a flag with a machine-readable reason code, in both directions; C7-FL-09 withholds the molar form per the pairing table while the mass-based result stands.
12. The total-protein case (C7-FX-04) reports the reagent's concentration as not computable with the reason in the cell, and never as equal to the total-solids concentration.
13. Boundary fixtures behave as specified, per C7-FX-10. Either side of, and exactly on, the declared minimum transfer volume, against Vd′. For the vial capacity, the C7-HI-08 boundary (D ≥ F or Dmin ≥ F) and the C7-FL-08 threshold, the nearest representable inputs either side, in the stated evaluated forms.
13a. The C7-FL-08 payload states 1 ÷ (1 + f) and the shortfall f ÷ (1 + f) wherever the final volume is known — a target, or an entered final volume — and 1 ÷ (1 − f) and the overstatement f ÷ (1 − f) where the diluent is entered. Each is verified against C7-FX-11 by hand, from its derivation.
13b. Activity content with a declared solids mass computes displacement (C7-FX-07, second case); activity content presents no content-basis choice and states the basis as "the reagent (activity)".
13c. Reagent-alone mass content with no solids declared applies Dmin as a partial correction, labels the diluent "corrected for the reagent's own volume only; carrier and excipient not included", and labels the concentration "at most" on the page and in the notebook copy — never "achieved". It hands the concentration onward marked as an upper bound (C7-FX-06: 0.942 mL, at most 79.9680 mg/mL). Activity content and content basis not recorded stay uncorrected. C7-HI-08 fires on Dmin at its boundary (C7-FX-10).
13d. The achieved concentration departs visibly from the target where the diluent's 3-sf rounding is coarse, with no flags raised (C7-FX-17: 1.00452 against 1.00000 mg/mL).

**Declaration and handoff**

14. No determination completes without an explicit direction, content, content basis (or its activity default), content provenance, conjugate declaration for mass-based content (not asked for activity content, which has no molar route), carrier declaration for every content, whole-vial confirmation, volume basis, minimum transfer volume, and — in the target → volumes direction — a target, or in the other, a volume.
15. A stock handed onward carries its content basis, carrier declaration, conjugate declaration where the content is mass-based, achieved concentration — marked as an upper bound with its reason where Dmin was applied — and, where imported, the C1 object in full. *(That a stock stripped of these is rejected by the receiving tool is a C3 requirement against C3-SK-03, recorded here so that it is not lost, and tested there.)*
15a. A stock whose concentration is an upper bound is exported with that marking, its reason and the §11 assumptions it holds under; C7 never withholds the bound to avoid C7-ST-08's obligation. *(That a receiving tool keeps the bound is CR-C3-01, tested in C3.)*

**Environment, determinism and disclosure**

16. C7-NF-01 is verified in a real browser against the deployed address, with network monitoring initialised before page load, and re-verified after any deployment or CDN configuration change. Verification against the build artefact does not satisfy this test.
17. **The privacy statement's five claims are verified, not asserted** (§14.1 table): no third-party code loads, checked against the loaded resource list at the deployed address with provider edge injection confirmed off; nothing user-entered is written to storage outliving the page (C7-ST-07), checked after a determination at the deployed address; the description of hosting-provider traffic records matches what the provider records; the source repository is public under the stated licence and linked from the page. Re-verified on the same trigger as acceptance 16 and on any change to the statement's version.
18. Reloading and re-entering the same inputs reproduces the result exactly.
19. Changing the direction or any declaration recomputes the result; no value computed under the previous declaration survives unmarked.
20. The tool's own page lists every constant, assumption and convention in §11 with its value, basis and status; enumerates the failure classes it cannot detect; states that C7-HI-08 is not a plausibility check; and displays the privacy statement verbatim at its current version.

**Usability**

21. A first-time user produces a correct whole-vial reconstitution in under **one minute** without instruction, in each direction.
22. The result is never visible without its declaration summary and flags, verified at the reference viewport across the full scroll range.
23. Every displayed ratio and factor is asserted per C7-FX-11, with its denominator named.
24. The notebook copy contains every declaration, every flag in words, both volumes (and the achieved final beside an entered one), the displacement treatment and the reported concentration with its basis and label — "at most" with the "reagent's own volume only" diluent label where Dmin is applied; a reader with only that text can reconstruct what was in the vial and what was made from it.

**Identification**

25. At the deployed address the page identifies the product and the tool per C7-NF-10, uses the shared chrome per C7-NF-11, loads every resource from its own origin per C7-NF-12 (the same check as acceptance 17), and distinguishes flagged, withheld, not-computable and rejected states structurally per C7-NF-13.

---

## 17. Outstanding items

None of these blocks development. Each is named with what it gates. Two things are absent deliberately: C7-NF-05's kept-in-view height is measured during the build and recorded in §11, and the tolerances of outstanding item 3 are derived rather than decided — neither is an external dependency.

| # | Item | Owner | Gates |
|---|---|---|---|
| 1 | **Cite ISO 8655-2** — current edition, reading the **tightest** single-channel row, which may be 10 mL at ≈ 0.6 % rather than 100–1000 µL at ≈ 0.8 % — and ISO 7886-1 for syringes. The C7-FL-08 threshold follows the cited figure: 13.7 mg/mL at 1 %, 11.0 at 0.8 %, 8.2 at 0.6 % | NADIRA | The threshold's value on the tool page. The build implements the threshold as a configured constant so the citation can change it without touching the engine. The fixture set is invariant across all three candidates — C7-FX-05's 7.30 % and C7-FX-06's 5.84 % exceed every one, C7-FX-17's 0.0871 % and C7-FX-08 fall below every one — so the build proceeds on a placeholder |
| 2 | **Confirm the excipient partial specific volumes** against Durchschlag's compilation — sugars and polyols ≈ 0.6–0.67 mL/g, salts of order 0.3 mL/g — and whether any common lyophilisation excipient has a small or negative apparent volume at the relevant concentrations | NADIRA | The scope-error row and the second Dmin assumption stating those values. Both disclose the gap meanwhile |
| 3 | **The tolerance derivation memo**: round-trip and unit-normalisation bounds over both directions, both volume bases and the partially corrected path | NADIRA + Developer | The tool page, and every test evaluated against a derived tolerance: acceptances 3, 5, 7 and 8, and C7-IV-02. Not the build. Schedule it before the C4 clearance work — it now has more to cover than anything else outstanding |
| 4 | **Settle the two wording questions on the standing privacy statement** (§14.1) and record the legal review | A. Modi + THERON | Clearance, for every tool page. Any change bumps the statement's version |
| 5 | **Decide the public URL slug.** `/reconstitution/` follows the C1 and C4 pattern | A. Modi | The address becoming citable |
| 6 | **Retrofit to C1, C4 and C3**: the privacy statement at its current version, the no-storage-outliving-the-page requirement, the branding requirements of §14.2, and the acceptance-17 verification. **C4's localStorage restore is removed as part of C4's clearance.** Adopt "characterised" in their registers. **Confirm the shared transport mechanism uses no storage that outlives the page** | A. Modi + Developer | Clearance of those tools, not of C7 — except the transport check, which gates C7-ST-03 |
| 7 | **CR-C3-01** (a stock marked as an upper bound stays one downstream) and **CR-C3-02** (C3 accepts an activity-based stock, or states that it does not) | A. Modi + Developer | C3 shipping. Neither gates C7's build; CR-C3-01 gates C7's handoff being useful |
| 8 | **Define and publish the shared result-object version** carrying the C7-OUT-04 fields, and confirm C1 (live) and C4 (deployed) still validate against it | Developer + NADIRA | Acceptance 4, and the C1 and C4 exports. The engine can be built against the field list before the version is published |
| 9 | **C2's removal from the catalog**, and whether IU ↔ mass conversion is built at all. If built, not as a C1 basis: bioassay-derived specific activity carries 20–30 % CV and needs a declared uncertainty | A. Modi | Nothing. A discovery question, to rest on evidence that someone wants it. If confirmed, record C2's removal in the catalog map, which currently lists it as candidate / scope to confirm |

## Annex — Gate status

| # | Gate item | Where addressed | Established by |
|---|---|---|---|
| 1 | One determination, stated | §1, C7-DR-01 | Specification — one relation, two directions, as C1. Activity units are a unit of the same determination, not a second one |
| 2 | Independent reimplementation agrees | Acceptance 3 | Execution |
| 3 | Invariance test, confirmed capable of failing | C7-IV-01/03/04/05, acceptance 5–8 | Execution — tolerances not yet derived (outstanding item 3) |
| 4 | Every constant derived, characterised or disclosed | C7-CN-01, §11, acceptance 20 | Specification + execution — the partial specific volume is cited and its scope error bounded. Two citations are outstanding (outstanding items 1 and 2); they are citations, not decisions |
| 5 | Failure classes enumerated, including undetectable ones | §9, acceptance 20 | Specification — eleven items |
| 5a | Displayed quantities state their direction | C7-DT-05, C7-FX-11, acceptance 13a, 23 | Specification — **clean.** Every factor in §5 and §8 was derived from its relation and checked numerically, by the drafter and independently by NADIRA (21 September 2026) |
| 6 | Invisible variables are compelled declarations | C7-VC-03, C7-VC-04, C7-VC-07, C7-VC-08, C7-VB-01, C7-TG-04 | Specification — declaration audit and comparison pass performed; two declarations added at v0.3 |
| 7 | Fixtures audited for shared properties | §10, C7-FX-08 | Execution |
| 8 | Environment claims verified against the deployed artefact | Acceptance 16, 17, 25 | Execution — the privacy statement is five claims about the artefact and is verified as five |
| 9 | Flags propagate to display, interpretation and export | C7-ST-02, C7-ST-08, acceptance 9, 11, 12, 15, 24 | Execution — acceptance 15a, **and at the tool-set boundary CR-C3-01:** a bound that a receiving tool does not honour is this gate failing between tools rather than inside one |

Gate item 5a is clean. Gate item 4 stands at two outstanding citations, one of which may move the C7-FL-08 threshold; the build treats that threshold as a configured constant for exactly that reason. **Gate item 3 is the weakest and is the one to watch**: the derivation memo does not exist, it now covers two directions, two volume bases and the partially corrected path, and it gates the tool page and acceptance 3 rather than the build.
