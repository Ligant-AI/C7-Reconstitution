export const VBAR = Object.freeze({
    value: 0.73,
    unit: 'mL/g',
    basis: 'Average for globular proteins, range ≈ 0.70–0.75: Harpaz, Gerstein & Chothia 1994, Structure 2:641; Perkins 1986, Eur J Biochem 157:169. Scoped to protein-dominated solids.',
});
export const MATERIAL_THRESHOLD = Object.freeze({
    value: 0.006,
    citation: 'ISO 8655-2:2022, Piston-operated volumetric apparatus, Part 2: Pipettes, Table 1, row > 5 000 to 20 000 µl at 100 % of nominal: ±0,60 %. Read as reproduced by Transcat (pipettes.com, credited "ISO8655-2:2022, pg. 7") and in Eppendorf\'s customer information on ISO 8655:2022; the licensed 2022 text was not read. Consistent with ISO 8655-2:2002 Table 1 (10 000 µl: 0,6 %), read. Syringes, for direction only: ISO 7886-1:1993 Table 1 (as adopted identically in IS 10258:2002) permits ±4 to 5 % of the expelled volume at half capacity or more.',
    definition: 'A displacement fraction f above this value is flagged as material. The value is the smallest maximum permissible systematic error in ISO 8655-2:2022 Table 1 (single-channel pipettes, types A and D1): ±0.60 % at 100 % of the nominal volume, for nominal volumes above 5 000 µL up to 20 000 µL. The table permits more at lower settings and for smaller pipettes, so this value is at or below every entry in it.',
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
