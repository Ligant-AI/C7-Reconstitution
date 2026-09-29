# Escalation (C7-OUT-04): the shared result object's `tool` field

**Raised** 28 September 2026, by the developer, to the developer + NADIRA
(outstanding item 8). Not resolved locally.

C7-OUT-04 permits adding fields at a new format version and requires escalation
for "a field that cannot mean two things at once". `tool` is such a field:

| Producer / reader | `tool` is |
|---|---|
| C1 (live), `serialise.ts` | an object: `{ id, name, engineVersion }` |
| C3 importer (`src/import/shared-import.js`) | read as a string, `"C4"` or `"C1"` |
| C3 result object | a string, `"C3"` |

C3's own comments record that its import path is dark because of exactly this
mismatch. C7 had to emit one or the other. **C7 emits C1's shape** (an object),
because C1 is the only live producer and C7 consumes C1 objects; C7's reader of
a C1 object accepts either shape. C7's object therefore will not be read by
C3's current importer until the format version decides the field.

The C7 object's schema string is `ligant.bench-tools.result` /
`2.0.0-draft.c7` and says draft until outstanding item 8 publishes the version.

## Further conflicts found by the contract check (28 September 2026)

Found by the `c7-contract-checker` agent running each tool's own code
(verification/contract/report-2026-09-28.md); escalated on the same terms.

**E2 — `schema`.** C1, C4 and C7 emit an object `{ name, version }`; C3 emits a
string `"ligant.bench-tools.result"` with the version in a separate
`schemaVersion: "1-c3"`. The format name is also unagreed: C3 and C7 claim
`ligant.bench-tools.result`; C1 and C4 name per-tool schemas
(`ligant-benchtools-c1-conversion`, `ligant-benchtools-c4-series`).

**E4 — the `{ value, unit }` quantity.** In C1 and C4, `value` is the unrounded
double with `underflowed` always present — the shared `Quantity` primitive per
C4's open-item-08. In C7 (and C3), `declarations.content`, `target`,
`minTransfer` and `capacity` carry `value` as the *entered text*; C7's displayed
quantities are `{ display, unit, unrounded }` and its unrounded block `{ value:
number, unit }`. A consumer reading `{ value, unit }` by the C1/C4 definition
gets entered text from C7. C7 keeps entered text deliberately (C7-IV-03: an
entered diluent is displayed and used as entered), so the field genuinely means
two things across the tool set.

Vocabulary divergences for item 8 (same meaning, different spelling): engine
version location and format (C4 writes "v0.1.0"); unit spellings (`ug/mL`, `uM`,
`uL` in C1/C4 against `µg/mL`, `µM`, `µL` in C3/C7 — C3 refuses `ug/mL`);
`status` vocabularies; flag shapes; declaration enums as strings,
`{ key, label }` or `{ value, label }`.
