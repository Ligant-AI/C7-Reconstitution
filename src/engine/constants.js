// Registered constants and configured thresholds (C7-CN-01, §11).
//
// Every value the engine applies that is not a user input lives here and
// nowhere else, so that a citation can change a value without touching the
// engine (handoff: "configure, don't hard-code"). The page's register is
// rendered from these records, so the page cannot state a value the engine
// does not apply, nor a status the record does not carry.

/**
 * The partial specific volume, v̄ (§11 row 1). A constant of the tool, never a
 * user input (C7-DT-03). Scoped to protein-dominated solids.
 */
export const VBAR = Object.freeze({
  value: 0.73,
  unit: 'mL/g',
  status: 'characterised',
  signed: true, // who signed and when: REGISTER-AUDIT-TRAIL.md
  basis: 'Average for globular proteins, range ≈ 0.70–0.75: Harpaz, Gerstein & Chothia 1994, Structure 2:641; Perkins 1986, Eur J Biochem 157:169. Scoped to protein-dominated solids. Carried from the C3 review.',
});

/**
 * C7-FL-08's material displacement threshold (§11; outstanding item 1).
 *
 * The DEFINITION is signed (NADIRA, 21 September 2026): f above the tightest
 * maximum permissible systematic error in the cited ISO 8655-2 row. The VALUE
 * is not yet cited. Three uncited candidates are 1 %, 0.8 % and 0.6 %; the
 * engine carries the tightest, 0.6 %, as a provisional placeholder, which
 * flags the most. Every fixture resolves identically under all three
 * (C7-FX-05 7.30 % and C7-FX-06 5.84 % above each; C7-FX-17 0.0871 % and
 * C7-FX-08 below each). Replace `value` and `status` when the citation lands.
 */
export const MATERIAL_THRESHOLD = Object.freeze({
  value: 0.006,
  status: 'open',
  provisional: true,
  candidates: [0.01, 0.008, 0.006],
  citation: null,
  definition: 'f above the tightest maximum permissible systematic error in the cited ISO 8655-2 single-channel row.',
  definitionSigned: true, // REGISTER-AUDIT-TRAIL.md
});

/**
 * The two invariance tolerances (§11; outstanding item 3). NOT derived yet.
 * `null` is the honest value: no test and no page states a bound until the
 * derivation memo is signed. Tests read these names and nothing else.
 */
export const TOLERANCES = Object.freeze({
  roundTrip: null, // C7-IV-01
  unitNormalisation: null, // C7-IV-04, C7-IV-05
});

/** Displayed precision (C7-UN-04, C7-UN-05, C7-UN-09). */
export const PRECISION = Object.freeze({
  volumes: 3,
  concentrations: 6,
  fractions: 3,
  rounding: 'half away from zero, applied to the exact binary value',
  boundRounding: 'an "at most" value is rounded up and an "at least" value down, on the exact binary value (decision of 28 September 2026)',
});

/** C7-PC-01, carried from C4-SR-05. */
export const SUGGESTED_MIN_TRANSFER = Object.freeze({ value: '2', unit: 'µL' });

/** C7-NF-06. */
export const REFERENCE_VIEWPORT = '1366 × 650 CSS px';
