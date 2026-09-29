// The §10 fixture set. Every fixture is an engine input; `expect` holds the
// figures §10 states, or — for fixtures this build constructs — the hand
// calculation, with the construction assumption stated (C7-FX-12). The distance
// from every displayed value to its nearest tie is COMPUTED and written to
// docs/fixture-record.md by tests/fixture-record.mjs, not asserted in words.

import { c1With } from './c1-fixture.js';

const clean = { provenance: 'coa', contentBasis: 'reagent-alone', conjugate: 'none', carrier: 'absent', wholeVial: true, minTransfer: { value: '2', unit: 'µL' } };
const T = (o) => ({ ...clean, direction: 'target', volumeBasis: 'diluent', ...o });
const V = (o) => ({ ...clean, direction: 'volume', volumeBasis: 'diluent', reportUnit: 'mg/mL', ...o });

export const FIXTURES = [
  {
    id: 'C7-FX-01', name: 'non-round content and target',
    construction: 'Content 0.7318 mg, total solids 1.407 mg, target 0.4631 mg/mL: no quantity round, and every displayed value checked for distance to its 3-sf or 6-sf tie at its own leading digit.',
    input: T({ content: { value: '0.7318', unit: 'mg' }, totalSolids: { value: '1.407', unit: 'mg' }, target: { value: '0.4631', unit: 'mg/mL' } }),
    // Hand: F = 0.7318/0.4631 = 1.580220… mL; D = 0.001407 × 0.73 = 0.00102711 mL;
    // Vd = 1.579193… → 1.58; Fa = 1.58102711; Ca = 0.7318/1.58102711 = 0.46286366… mg/mL.
    expect: { diluent: '1.58', final: '1.58', D: '0.00103', conc: '0.462864', flags: [] },
  },
  {
    id: 'C7-FX-05', name: 'high-concentration displacement',
    construction: 'As §10: content 80 mg reagent alone, total solids 100 mg, target 80 mg/mL. §10 writes F and Fa as 1.000 mL; at C7-UN-04\'s 3 significant figures they display as 1.00.',
    input: T({ content: { value: '80', unit: 'mg' }, totalSolids: { value: '100', unit: 'mg' }, target: { value: '80', unit: 'mg/mL' } }),
    expect: { diluent: '0.927', final: '1.00', D: '0.0730', f: '7.30 %', conc: '80.0000', label: 'achieved', flags: ['C7-FL-08'], shortfall: '6.80 %' },
  },
  {
    id: 'C7-FX-06a', name: 'no solids declared, target direction',
    construction: 'As §10. The unrounded diluent 0.941600 mL lies 1.00 × 10⁻⁴ mL above the 3-sf tie at 0.9415 mL. The upper bound 79.9680128… mg/mL is rounded up (decision of 28 September 2026): at most 79.9681; §10 prints 79.9680, the half-away figure.',
    input: T({ content: { value: '80', unit: 'mg' }, target: { value: '80', unit: 'mg/mL' } }),
    expect: { diluent: '0.942', Dmin: '0.0584', fmin: '5.84 %', conc: '79.9681', label: 'at-most', flags: ['C7-FL-05'], fminExceeds: true },
  },
  {
    id: 'C7-FX-06b', name: 'no solids, 1.00 mL diluent entered',
    construction: 'As §10.',
    input: V({ content: { value: '80', unit: 'mg' }, volume: { value: '1.00', unit: 'mL' } }),
    expect: { diluent: '1.00', final: '1.05', conc: '75.5858', fmin: '5.52 %', label: 'at-most', flags: ['C7-FL-05'] },
  },
  {
    id: 'C7-FX-06c', name: 'no solids, 0.942 mL diluent entered',
    construction: 'As §10.',
    input: V({ content: { value: '80', unit: 'mg' }, volume: { value: '0.942', unit: 'mL' } }),
    expect: { diluent: '0.942', conc: '79.9681', label: 'at-most', flags: ['C7-FL-05'] },
  },
  {
    id: 'C7-FX-06d', name: 'no solids, diluent rounds down',
    construction: 'As §10: 1.0044 mg at 1 mg/mL. The bound 1.0036641… rounds up to 1.00367 (§10 prints the half-away 1.00366).',
    input: T({ content: { value: '1.0044', unit: 'mg' }, target: { value: '1', unit: 'mg/mL' } }),
    expect: { diluent: '1.00', conc: '1.00367', label: 'at-most', flags: ['C7-FL-05'] },
  },
  {
    id: 'C7-FX-06e', name: 'activity content, no solids',
    construction: 'Activity content with no solids: uncorrected, unbounded wording.',
    input: T({ content: { value: '1e6', unit: 'IU' }, target: { value: '1e4', unit: 'IU/mL' } }),
    expect: { diluent: '100', conc: '10000.0', label: 'uncorrected-for-displacement', flags: ['C7-FL-05'] },
  },
  {
    id: 'C7-FX-07a', name: 'activity content, no solids',
    construction: 'As §10: 10⁶ IU targeted at 10⁴ IU/mL.',
    input: T({ content: { value: '1000000', unit: 'IU' }, target: { value: '10000', unit: 'IU/mL' } }),
    expect: { diluent: '100', treatment: 'not-computable-uncorrected', basis: 'reagent-activity', flags: ['C7-FL-05'] },
  },
  {
    id: 'C7-FX-07b', name: 'activity content, 5 mg solids',
    construction: 'As §10: the same vial with 5 mg of declared total solids. Mass is mass.',
    input: T({ content: { value: '1000000', unit: 'IU' }, target: { value: '10000', unit: 'IU/mL' }, totalSolids: { value: '5', unit: 'mg' } }),
    // D = 0.005 g × 0.73 = 0.00365 mL; F = 100 mL; Vd = 99.99635 → 100; Fa = 100.00365; Ca = 9999.64 IU/mL.
    expect: { diluent: '100', D: '0.00365', treatment: 'computed', conc: '9999.64', flags: [] },
  },
  {
    id: 'C7-FX-08', name: 'negative control, target direction',
    construction: 'Whole vial, reagent alone, not a conjugate, carrier absent, lot certificate; content 0.2537 mg, total solids 1.13 mg, target 0.317 mg/mL; minimum 2 µL; capacity 2 mL. f = 0.103 %, below all three threshold candidates.',
    input: T({ content: { value: '0.2537', unit: 'mg' }, totalSolids: { value: '1.13', unit: 'mg' }, target: { value: '0.317', unit: 'mg/mL' }, capacity: { value: '2', unit: 'mL' } }),
    expect: { flags: [] },
  },
  {
    id: 'C7-FX-08v', name: 'negative control, volume direction',
    construction: 'The same vial, 0.800 mL of diluent entered.',
    input: V({ content: { value: '0.2537', unit: 'mg' }, totalSolids: { value: '1.13', unit: 'mg' }, volume: { value: '0.800', unit: 'mL' }, capacity: { value: '2', unit: 'mL' } }),
    expect: { flags: [], label: 'obtained' },
  },
  {
    id: 'C7-FX-13a', name: 'datasheet case, 1 mL as diluent, solids declared',
    construction: '50 µg reagent alone, 2.5 mg total solids (carrier absent: sugar excipient), "reconstitute in 1 mL".',
    input: V({ content: { value: '50', unit: 'µg' }, totalSolids: { value: '2.5', unit: 'mg' }, volume: { value: '1', unit: 'mL' } }),
    expect: { flags: [] },
  },
  {
    id: 'C7-FX-13b', name: 'datasheet case, 1 mL as final, solids declared',
    construction: 'As C7-FX-13a, the 1 mL entered as final volume.',
    input: V({ content: { value: '50', unit: 'µg' }, totalSolids: { value: '2.5', unit: 'mg' }, volume: { value: '1', unit: 'mL' }, volumeBasis: 'final' }),
    expect: { flags: [] },
  },
  {
    id: 'C7-FX-13c', name: 'datasheet case, 1 mL as diluent, no solids',
    construction: 'As C7-FX-13a without the solids mass.',
    input: V({ content: { value: '50', unit: 'µg' }, volume: { value: '1', unit: 'mL' } }),
    expect: { flags: ['C7-FL-05'] },
  },
  {
    id: 'C7-FX-13d', name: 'datasheet case, 1 mL as final, no solids',
    construction: 'As C7-FX-13c, as final volume.',
    input: V({ content: { value: '50', unit: 'µg' }, volume: { value: '1', unit: 'mL' }, volumeBasis: 'final' }),
    expect: { flags: ['C7-FL-05'] },
  },
  {
    id: 'C7-FX-14', name: 'rounding-direction case, final volume primary',
    construction: 'F = 1.0049 mL would display as 1.00; D = 0.0873007 mL. Rounding the final first and deriving the diluent gives 1.00 − 0.0873 = 0.913; the diluent rounded from its own value, 0.917599…, is 0.918 — 0.0049 apart, ten half-steps. The one final volume is then Fa = 0.918 + D = 1.00530 mL, displayed 1.01.',
    input: T({ content: { value: '1.0049', unit: 'mg' }, totalSolids: { value: '119.59', unit: 'mg' }, target: { value: '1', unit: 'mg/mL' }, volumeBasis: 'final' }),
    expect: { diluent: '0.918', final: '1.01', flags: ['C7-FL-08'] },
  },
  {
    id: 'C7-FX-17', name: 'a visible achieved departure',
    construction: 'As §10. Leading digit 1 in the diluent, where the 3-sf resolution is coarsest; the nearest 3-sf tie, 1.005 mL, is 4.76 × 10⁻⁴ mL away.',
    input: T({ content: { value: '1.0054', unit: 'mg' }, totalSolids: { value: '1.2', unit: 'mg' }, target: { value: '1', unit: 'mg/mL' } }),
    expect: { diluent: '1.00', D: '0.000876', conc: '1.00452', target: '1.00000', departure: '+0.452 %', label: 'achieved', flags: [] },
  },
];


// ---------- fixtures moved from inline assertions into the compared set ----------
const next = (x, dir) => { const b = new Float64Array([x]); const i = new BigInt64Array(b.buffer); i[0] += BigInt(dir); return b[0]; };
const D1mg = (1 / 1e3) * 0.73; // D for 1 mg of solids, as the engine forms it: toGrams(1 mg) × v̄
const c1Assembled = c1With('assembled');
const c1Conjugate = c1With('conjugate', { kDa: 151.2, flags: [{ code: 'C1-FL-08', message: 'The molecular weight includes a label or payload; degree of labelling is not corrected.' }] });

FIXTURES.push(
  {
    id: 'C7-FX-04', name: 'the total-protein case',
    construction: 'An antibody vial labelled 1 mg total protein, stabilised with BSA (carrier present), from the vial label (nominal), reconstituted to a nominal 1 mg/mL. Solids = the stated content.',
    input: T({ content: { value: '1', unit: 'mg' }, contentBasis: 'total-vial-contents', provenance: 'nominal', carrier: 'present', target: { value: '1', unit: 'mg/mL' } }),
    expect: { flags: ['C7-FL-01', 'C7-FL-03', 'C7-FL-11'], reagentComputable: false, treatment: 'computed' },
  },
  {
    id: 'C7-FX-09-r7t', name: 'pairing row 7 as a molar target — permitted',
    construction: 'Assembled-molecule MW 148.3 kDa; reagent alone, not a conjugate; target 3.17 µM.',
    input: T({ content: { value: '0.25', unit: 'mg' }, totalSolids: { value: '1.3', unit: 'mg' }, c1: c1Assembled, target: { value: '3.17', unit: 'µM' } }),
    expect: { flags: [], molar: 'reported', pairingRow: 7 },
  },
  {
    id: 'C7-FX-09-r8m', name: 'pairing row 8 with a mass target — permitted, molarity of the protein',
    construction: 'Assembled-molecule MW; a conjugate whose stated mass is of the protein alone; mass target.',
    input: T({ content: { value: '0.25', unit: 'mg' }, totalSolids: { value: '1.3', unit: 'mg' }, conjugate: 'protein', c1: c1Assembled, target: { value: '0.5', unit: 'mg/mL' }, molarUnit: 'µM' }),
    expect: { flags: ['C7-FL-13'], molar: 'reported', pairingRow: 8, molarityOf: /protein/ },
  },
  {
    id: 'C7-FX-09-r9t', name: 'pairing row 9 as a molar target — permitted, C1 conjugate flag carried',
    construction: 'Conjugate MW 151.2 kDa with C1-FL-08; stated mass is of the conjugate; target 2.5 µM.',
    input: T({ content: { value: '0.25', unit: 'mg' }, totalSolids: { value: '1.3', unit: 'mg' }, conjugate: 'conjugate', c1: c1Conjugate, target: { value: '2.5', unit: 'µM' } }),
    expect: { flags: ['C7-FL-10', 'C7-FL-13'], molar: 'reported', pairingRow: 9 },
  },
  {
    id: 'C7-FX-09-r10t', name: 'pairing row 10 as a molar target — rejected',
    construction: 'Conjugate MW; stated mass is of the protein alone.',
    input: T({ content: { value: '0.25', unit: 'mg' }, conjugate: 'protein', c1: c1Conjugate, target: { value: '2.5', unit: 'µM' } }),
    expect: { status: 'rejected', rejections: ['C7-HI-04'] },
  },
  {
    id: 'C7-FX-09-r11m', name: 'pairing row 11 with a mass target — molar form withheld',
    construction: 'Assembled-molecule MW; stated mass is of the conjugate; mass target.',
    input: T({ content: { value: '0.25', unit: 'mg' }, totalSolids: { value: '1.3', unit: 'mg' }, conjugate: 'conjugate', c1: c1Assembled, target: { value: '0.5', unit: 'mg/mL' }, molarUnit: 'µM' }),
    expect: { flags: ['C7-FL-09', 'C7-FL-13'], molar: 'withheld', pairingRow: 11 },
  },
  {
    id: 'C7-FX-09-r1m', name: 'pairing row 1 with a mass target — withheld, total vial contents',
    construction: 'Assembled-molecule MW; content basis the total vial contents.',
    input: T({ content: { value: '1', unit: 'mg' }, contentBasis: 'total-vial-contents', c1: c1Assembled, target: { value: '1', unit: 'mg/mL' }, molarUnit: 'nM' }),
    expect: { flags: ['C7-FL-01', 'C7-FL-09'], molar: 'withheld', pairingRow: 1 },
  },
  {
    id: 'C7-FX-10-hi08-on', name: 'C7-HI-08 exactly on its boundary, on D',
    construction: `Final volume entered as exactly D for 1 mg of solids, ${String(D1mg)} mL: D ≥ F holds with equality, so ≥ (not >) rejects.`,
    input: V({ content: { value: '1', unit: 'mg' }, totalSolids: { value: '1', unit: 'mg' }, volume: { value: String(D1mg), unit: 'mL' }, volumeBasis: 'final' }),
    expect: { status: 'rejected', rejections: ['C7-HI-08'] },
  },
  {
    id: 'C7-FX-10-hi08-below', name: 'C7-HI-08 one double below the boundary, on D',
    construction: 'Final volume the next double below D.',
    input: V({ content: { value: '1', unit: 'mg' }, totalSolids: { value: '1', unit: 'mg' }, volume: { value: String(next(D1mg, -1)), unit: 'mL' }, volumeBasis: 'final' }),
    expect: { status: 'rejected', rejections: ['C7-HI-08'] },
  },
  {
    id: 'C7-FX-10-hi08-above', name: 'C7-HI-08 one double above the boundary, on D — computed',
    construction: 'Final volume the next double above D: the diluent is one unit in the last place, and the determination computes (with C7-FL-07 and C7-FL-08).',
    input: V({ content: { value: '1', unit: 'mg' }, totalSolids: { value: '1', unit: 'mg' }, volume: { value: String(next(D1mg, 1)), unit: 'mL' }, volumeBasis: 'final' }),
    expect: { flags: ['C7-FL-07', 'C7-FL-08'] },
  },
  {
    id: 'C7-FX-10-hi08-dmin-on', name: 'C7-HI-08 exactly on its boundary, on Dmin',
    construction: 'No solids declared; final volume entered as exactly Dmin for 1 mg of reagent.',
    input: V({ content: { value: '1', unit: 'mg' }, volume: { value: String(D1mg), unit: 'mL' }, volumeBasis: 'final' }),
    expect: { status: 'rejected', rejections: ['C7-HI-08'] },
  },
  {
    id: 'C7-FX-10-hi08-dmin-above', name: 'C7-HI-08 one double above the boundary, on Dmin — computed',
    construction: 'As above, the next double above Dmin.',
    input: V({ content: { value: '1', unit: 'mg' }, volume: { value: String(next(D1mg, 1)), unit: 'mL' }, volumeBasis: 'final' }),
    expect: { flags: ['C7-FL-05', 'C7-FL-07'] },
  },
  {
    id: 'C7-FX-10-min-on', name: 'diluent exactly on the declared minimum transfer volume',
    construction: '0.500 mL entered against a 500 µL minimum: not below, so C7-FL-07 does not fire.',
    input: V({ content: { value: '1', unit: 'mg' }, totalSolids: { value: '1.9', unit: 'mg' }, volume: { value: '0.500', unit: 'mL' }, minTransfer: { value: '500', unit: 'µL' } }),
    expect: { flags: [] },
  },
  {
    id: 'C7-FX-10-min-below', name: 'diluent just below the declared minimum transfer volume',
    construction: '0.500 mL entered against a 500.000000001 µL minimum.',
    input: V({ content: { value: '1', unit: 'mg' }, totalSolids: { value: '1.9', unit: 'mg' }, volume: { value: '0.500', unit: 'mL' }, minTransfer: { value: '500.000000001', unit: 'µL' } }),
    expect: { flags: ['C7-FL-07'] },
  },
  {
    id: 'C7-FX-11-final', name: 'C7-FL-08 with a final volume entered',
    construction: 'Content 80 mg, solids 100 mg, 1 mL final entered. Hand derivation: D = 0.1 g × 0.73 mL/g = 0.073 mL; f = D ÷ F = 0.073 ÷ 1 = 0.073; final volume known, so delivering F as diluent gives (content ÷ F) ÷ (1 + f); factor 1 ÷ 1.073 = 0.93197…; shortfall f ÷ (1 + f) = 0.073 ÷ 1.073 = 0.0680335… = 6.80 %.',
    input: V({ content: { value: '80', unit: 'mg' }, totalSolids: { value: '100', unit: 'mg' }, volume: { value: '1', unit: 'mL' }, volumeBasis: 'final' }),
    expect: { flags: ['C7-FL-08'], f: '7.30 %', shortfall: '6.80 %' },
  },
  {
    id: 'C7-FX-11-diluent', name: 'C7-FL-08 with a diluent entered',
    construction: 'Content 80 mg, solids 100 mg, 0.927 mL diluent entered. Hand derivation: F = 0.927 + 0.073 = 1.000 mL; f = 0.073; diluent known, so content ÷ diluent overstates by 1 ÷ (1 − f) = 1 ÷ 0.927 = 1.07875…; overstatement f ÷ (1 − f) = 0.073 ÷ 0.927 = 0.0787486… = 7.87 % at 3 sf (§8 prints 7.88 %: docs/spec-findings.md item 1).',
    input: V({ content: { value: '80', unit: 'mg' }, totalSolids: { value: '100', unit: 'mg' }, volume: { value: '0.927', unit: 'mL' } }),
    expect: { flags: ['C7-FL-08'], f: '7.30 %', overstatement: '7.87 %', conc: '80.0000', label: 'obtained' },
  },
  {
    id: 'C7-FX-11-fmin-target', name: 'fmin in the target direction',
    construction: 'As C7-FX-06a. Hand derivation: fmin = v̄ × target = 0.73 mL/g × 80 mg/mL = 0.73 × 10⁻³ mL/mg × 80 mg/mL = 0.0584 = 5.84 %.',
    input: T({ content: { value: '80', unit: 'mg' }, target: { value: '80', unit: 'mg/mL' } }),
    expect: { flags: ['C7-FL-05'], fmin: '5.84 %' },
  },
  {
    id: 'C7-FX-11-fmin-volume', name: 'fmin in the volume direction',
    construction: 'As C7-FX-06b. Hand derivation: F = 1.00 + 0.0584 = 1.0584 mL; fmin = v̄ × content ÷ F = 0.0584 ÷ 1.0584 = 0.0551776… = 5.52 %.',
    input: V({ content: { value: '80', unit: 'mg' }, volume: { value: '1.00', unit: 'mL' } }),
    expect: { flags: ['C7-FL-05'], fmin: '5.52 %' },
  },
  {
    id: 'C7-FX-15a', name: 'content in U, target in IU/mL',
    construction: 'As §10.',
    input: T({ content: { value: '5000', unit: 'U' }, target: { value: '100', unit: 'IU/mL' } }),
    expect: { status: 'rejected', rejections: ['C7-HI-09'] },
  },
  {
    id: 'C7-FX-15b', name: 'content in IU, concentration in U/mL',
    construction: 'The reverse, in the volume direction.',
    input: V({ content: { value: '5000', unit: 'IU' }, volume: { value: '1', unit: 'mL' }, reportUnit: 'U/mL' }),
    expect: { status: 'rejected', rejections: ['C7-HI-09'] },
  },
  {
    id: 'C7-FX-16a', name: 'carrier present, solids declared',
    construction: 'Cytokine 10 µg reagent alone with BSA carrier, total solids 0.51 mg, target 0.1 mg/mL; f = 0.372 %, below all three threshold candidates.',
    input: T({ content: { value: '10', unit: 'µg' }, carrier: 'present', totalSolids: { value: '0.51', unit: 'mg' }, target: { value: '0.1', unit: 'mg/mL' } }),
    expect: { flags: ['C7-FL-11'], treatment: 'computed' },
  },
  {
    id: 'C7-FX-16b', name: 'carrier present, solids not declared',
    construction: 'As C7-FX-16a without the solids mass.',
    input: T({ content: { value: '10', unit: 'µg' }, carrier: 'present', target: { value: '0.1', unit: 'mg/mL' } }),
    expect: { flags: ['C7-FL-05', 'C7-FL-11'], label: 'at-most' },
  },
  {
    id: 'C7-FX-16c', name: 'carrier not recorded',
    construction: 'As C7-FX-16a with carrier presence not recorded.',
    input: T({ content: { value: '10', unit: 'µg' }, carrier: 'not-recorded', totalSolids: { value: '0.51', unit: 'mg' }, target: { value: '0.1', unit: 'mg/mL' } }),
    expect: { flags: ['C7-FL-12'] },
  },
);

export { clean, T, V };
