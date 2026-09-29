# Change requests against C3 — Dilution Planner URS v0.4.1

| Field | Value |
|---|---|
| Raised by | A. Modi, 28 September 2026 |
| Origin | C7 Reconstitution URS v1.0 (C7-ST-08, §0.0) |
| Target document | C3 Dilution Planner URS v0.4.1, released for build |
| Status | **Open — to be applied before C3 ships.** Neither blocks C7's build |
| Review | NADIRA, as C3's approver. Both are additions, neither changes an existing C3 requirement |

---

## CR-C3-01 — A stock marked as an upper bound stays one downstream

**Why.** C7 now applies the reagent's own displacement (Dmin) where the total solids mass is not declared, and reports the resulting concentration as an upper bound labelled "at most". For mass-based reagent-alone content that is expected to be the ordinary case, since few users know the total solids mass. C7-OUT-04 makes the shared result object carry the bound and its reason; nothing yet makes the receiving tool honour it. C3 could accept a stock marked "at most 79.9680 mg/mL", dilute it, and report a point value — the bound dying at the first handoff. That is the failure C3's own flag-propagation gate exists to prevent, occurring between tools rather than inside one.

**Requested requirement**, to sit with C3's stock-provenance requirements (C3-SK-03):

> Where an imported stock's concentration is marked as an upper bound, every concentration C3 derives from it shall itself be an upper bound: labelled "at most" on the page, in the notebook copy and in the structured object, and carrying the originating tool's reason for the bound. A derived value shall not be transferable stripped of that marking. Dividing an upper bound by a positive dilution factor leaves an upper bound, so no additional tolerance or derivation is required.

**Scope of the change.** One requirement, one label, one field carried through the existing result object. No arithmetic changes. A fixture in C3 should exercise a bounded stock end to end, and an acceptance criterion should assert that the label survives the notebook copy and the export.

**Timing.** C3 has not shipped, so this is a change before build rather than a retrofit. C4 and C5 take the same requirement when they are written.

---

## CR-C3-02 — Whether C3 accepts an activity-based stock

**Why.** C7 accepts vial content stated in activity units (IU, U) and produces a stock in IU/mL or U/mL, which serves the IL-2 case directly and is the reason C2 is proposed for removal from the catalog. C7 is usable at its own address without C3, and its notebook copy carries the whole stock, so this does not gate C7. But if C3 cannot receive an activity-based stock, the handoff has no receiver and the C2 argument loses the receiver it assumes.

**Requested decision**, either:

> C3 accepts a stock whose concentration is expressed in activity units, treating the activity unit as it treats a mass-concentration unit — the dilution arithmetic is indifferent to the dimension — with the unit carried through every derived value and the IU/U distinction preserved, never interconverted.

or, if that is not wanted in C3 now:

> C3 states explicitly that it accepts mass-based and molar stocks only, and rejects an activity-based stock with a message naming the unit and the reason, rather than failing silently or coercing the unit.

**Either answer closes this.** What must not happen is C3 accepting the stock and treating the number as mass-based.

---

## Note on C7's dependency

C7's specification records both of these at C7-ST-08 and in its outstanding items, and neither appears in C7's build path. If CR-C3-01 is declined, C7's bound is still correct on its own page and in its notebook copy — the loss would be confined to the handoff, and that is where it would need to be disclosed.
