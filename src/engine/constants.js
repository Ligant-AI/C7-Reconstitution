export const VBAR = Object.freeze({
    value: 0.73,
    unit: 'mL/g',
    status: 'characterised',
    signed: true,
    basis: 'Average for globular proteins, range ≈ 0.70–0.75: Harpaz, Gerstein & Chothia 1994, Structure 2:641; Perkins 1986, Eur J Biochem 157:169. Scoped to protein-dominated solids. Carried from the C3 review.',
});
export const MATERIAL_THRESHOLD = Object.freeze({
    value: 0.006,
    status: 'open',
    provisional: true,
    candidates: [0.01, 0.008, 0.006],
    citation: null,
    definition: 'f above the tightest maximum permissible systematic error in the cited ISO 8655-2 single-channel row.',
    definitionSigned: true,
});
export const TOLERANCES = Object.freeze({
    roundTrip: null,
    unitNormalisation: null,
});
export const PRECISION = Object.freeze({
    volumes: 3,
    concentrations: 6,
    fractions: 3,
    rounding: 'half away from zero, applied to the exact binary value',
    boundRounding: 'an "at most" value is rounded up and an "at least" value down, on the exact binary value (decision of 28 September 2026)',
});
export const SUGGESTED_MIN_TRANSFER = Object.freeze({ value: '2', unit: 'µL' });
export const REFERENCE_VIEWPORT = '1366 × 650 CSS px';
