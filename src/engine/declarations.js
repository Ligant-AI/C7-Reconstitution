// The declarations (§3) and their short labels (C7-OUT-09), and the §8
// pairing table for the molar form.
//
// A declaration is displayed by its short label wherever its value is shown.
// Guidance on how to choose belongs in the input control (index.html) and is
// never carried into a displayed value. "not-recorded" is a VALUE, distinct in
// the structured object from a field left blank (C7-VC-05), which is `null`.

export const DIRECTION = Object.freeze({
  target: 'target → volumes',
  volume: 'volume → concentration',
});

export const CONTENT_BASIS = Object.freeze({
  'reagent-alone': 'the reagent alone',
  'total-vial-contents': 'the total vial contents',
  'not-recorded': 'not recorded',
  'reagent-activity': 'the reagent (activity)', // C7-VC-03a, by definition for activity content
});

export const PROVENANCE = Object.freeze({
  coa: 'lot-specific certificate of analysis',
  nominal: 'vial label or datasheet (nominal)',
  weighed: 'weighed, from bulk',
  'not-recorded': 'not recorded',
});

export const CONJUGATE = Object.freeze({
  none: 'not a conjugate',
  protein: 'a conjugate — the stated mass is of the protein alone',
  conjugate: 'a conjugate — the stated mass is of the conjugate',
  'not-recorded': 'not recorded',
});

export const CARRIER = Object.freeze({
  present: 'carrier protein present',
  absent: 'carrier protein absent',
  'not-recorded': 'not recorded',
});

export const VOLUME_BASIS = Object.freeze({
  diluent: 'volume of diluent to add',
  final: 'final volume of solution',
});

// C1-MW-07's option set (C1 v0.5), by the values C1 emits.
export const C1_MASS_BASIS = Object.freeze({
  assembled: 'assembled molecule',
  monomer: 'monomer or single chain',
  conjugate: 'conjugate including label or payload',
  'not-recorded': 'not recorded',
});

// C1's molecular-weight provenance values (C1 v0.5), by the values C1 emits.
export const C1_MW_PROVENANCE = Object.freeze({
  'certificate-of-analysis': 'certificate of analysis',
  'vendor-datasheet': 'vendor datasheet',
  'calculated-from-sequence': 'calculated from sequence',
  'mass-spectrometry': 'mass spectrometry',
  'not-recorded': 'not recorded',
});

/**
 * §8 permitted pairs. Rows are evaluated IN ORDER; the first matching row
 * supplies the reason. The order is the specification's: content basis, then
 * content dimension, then conjugate state, then the C1-side rows, so that the
 * reason shown is the disqualification closest to the physical error and the
 * one the user has not already been shown through C7-FL-10.
 *
 * `c7Basis` is one of CONTENT_BASIS's keys; `conjugate` one of CONJUGATE's
 * (null for activity content); `c1Basis` one of C1_MASS_BASIS's.
 */
export const PAIRING_ROWS = Object.freeze([
  { row: 1, match: (p) => p.c7Basis === 'total-vial-contents', permitted: false, reason: 'The content is the total solids mass; dividing it by the reagent\'s molecular weight would count carrier and excipient as reagent' },
  { row: 2, match: (p) => p.c7Basis === 'not-recorded', permitted: false, reason: 'Content basis not recorded' },
  { row: 3, match: (p) => p.c7Basis === 'reagent-activity', permitted: false, reason: 'The content is stated in activity units; there is no mass to divide by a molecular weight' },
  { row: 4, match: (p) => p.c7Basis === 'reagent-alone' && p.conjugate === 'not-recorded', permitted: false, reason: 'Whether the stated mass includes a label or payload is not recorded' },
  { row: 5, match: (p) => p.c1Basis === 'not-recorded', permitted: false, reason: 'Molecular-weight mass basis not recorded' },
  { row: 6, match: (p) => p.c1Basis === 'monomer', permitted: false, reason: 'The molecular weight is declared as a monomer or single chain; the molar value would be of that unit, not of the whole reagent, unless the reagent is itself a single chain — which the tool cannot determine' },
  { row: 7, match: (p) => p.c1Basis === 'assembled' && p.c7Basis === 'reagent-alone' && p.conjugate === 'none', permitted: true, molarityOf: 'the reagent' },
  { row: 8, match: (p) => p.c1Basis === 'assembled' && p.c7Basis === 'reagent-alone' && p.conjugate === 'protein', permitted: true, molarityOf: 'the protein, not of the conjugate' },
  { row: 9, match: (p) => p.c1Basis === 'conjugate' && p.c7Basis === 'reagent-alone' && p.conjugate === 'conjugate', permitted: true, molarityOf: 'the conjugate' },
  { row: 10, match: (p) => p.c1Basis === 'conjugate' && p.c7Basis === 'reagent-alone' && (p.conjugate === 'none' || p.conjugate === 'protein'), permitted: false, reason: 'The molecular weight includes the label or payload; the stated mass does not' },
  { row: 11, match: (p) => p.c1Basis === 'assembled' && p.c7Basis === 'reagent-alone' && p.conjugate === 'conjugate', permitted: false, reason: 'The stated mass includes the label or payload; the molecular weight does not' },
]);

/** First matching row of the §8 table. Every combination matches exactly one first row. */
export function pairing(p) {
  const row = PAIRING_ROWS.find((r) => r.match(p));
  if (!row) throw new Error(`pairing table: no row for ${JSON.stringify(p)}`);
  return {
    row: row.row,
    permitted: row.permitted,
    reason: row.reason || null,
    molarityOf: row.molarityOf || null,
    bases: {
      c1MassBasis: C1_MASS_BASIS[p.c1Basis] || p.c1Basis,
      contentBasis: CONTENT_BASIS[p.c7Basis],
      conjugate: p.conjugate ? CONJUGATE[p.conjugate] : 'not asked (activity content)',
    },
  };
}
