// Unit table with dimension tags (C7-UN-01, C7-UN-02, C7-VC-01).
//
// Every unit belongs to exactly one family, stated as a field, so that the
// dimensional rejections (C7-HI-03 mass against activity, C7-HI-09 IU against
// U) are decidable from the unit record alone and never inferred from the
// string.
//
// Conversion to the engine's base unit is ONE operation — a multiplication or
// a division by an exactly representable power of ten — so it is correctly
// rounded and exact wherever the result is representable (C7-UN-03). Nothing
// is rounded before display.
//
// Base units: mass mg (and g, for displacement: solids × v̄ in mL/g);
// volume mL; mass concentration mg/mL; activity as stated (IU or U) and per mL;
// amount concentration M; molecular weight g/mol.

export const FAMILY = Object.freeze({
  MASS: 'mass',
  IU: 'activity-IU',
  U: 'activity-U',
  VOLUME: 'volume',
  MASS_CONC: 'mass/volume',
  IU_CONC: 'IU/volume',
  U_CONC: 'U/volume',
  MOLAR: 'amount/volume',
  MW: 'mass/amount',
});

// { mul } or { div }: toBase(v) = v * mul, or v / div. One of the two, never both.
const u = (symbol, family, conv, extra = {}) => Object.freeze({ symbol, family, ...conv, ...extra });

export const CONTENT_UNITS = Object.freeze([
  u('µg', FAMILY.MASS, { div: 1e3 }, { toGrams: { div: 1e6 } }),
  u('mg', FAMILY.MASS, { mul: 1 }, { toGrams: { div: 1e3 } }),
  u('g', FAMILY.MASS, { mul: 1e3 }, { toGrams: { mul: 1 } }),
  u('IU', FAMILY.IU, { mul: 1 }),
  u('U', FAMILY.U, { mul: 1 }),
]);

export const SOLIDS_UNITS = Object.freeze(CONTENT_UNITS.filter((x) => x.family === FAMILY.MASS));

export const VOLUME_UNITS = Object.freeze([
  u('µL', FAMILY.VOLUME, { div: 1e3 }),
  u('mL', FAMILY.VOLUME, { mul: 1 }),
]);

export const MASS_CONC_UNITS = Object.freeze([
  u('mg/mL', FAMILY.MASS_CONC, { mul: 1 }),
  u('µg/mL', FAMILY.MASS_CONC, { div: 1e3 }),
  u('ng/mL', FAMILY.MASS_CONC, { div: 1e6 }),
  u('g/L', FAMILY.MASS_CONC, { mul: 1 }),
  u('mg/L', FAMILY.MASS_CONC, { div: 1e3 }),
]);

export const ACTIVITY_CONC_UNITS = Object.freeze([
  u('IU/mL', FAMILY.IU_CONC, { mul: 1 }),
  u('U/mL', FAMILY.U_CONC, { mul: 1 }),
]);

// C1-UN-04's set, by reference (C7-UN-02). Base M.
export const MOLAR_UNITS = Object.freeze([
  u('M', FAMILY.MOLAR, { mul: 1 }),
  u('mM', FAMILY.MOLAR, { div: 1e3 }),
  u('µM', FAMILY.MOLAR, { div: 1e6 }),
  u('nM', FAMILY.MOLAR, { div: 1e9 }),
  u('pM', FAMILY.MOLAR, { div: 1e12 }),
]);

export const MW_UNITS = Object.freeze([
  u('g/mol', FAMILY.MW, { mul: 1 }),
  u('kDa', FAMILY.MW, { mul: 1e3 }),
]);

export const CONCENTRATION_UNITS = Object.freeze([...MASS_CONC_UNITS, ...ACTIVITY_CONC_UNITS, ...MOLAR_UNITS]);

const ALL = [...CONTENT_UNITS, ...VOLUME_UNITS, ...CONCENTRATION_UNITS, ...MW_UNITS];
const BY_SYMBOL = new Map(ALL.map((x) => [x.symbol, x]));
// Accept the ASCII "u" spelling of micro (C1 emits "uM"); the table's symbol is canonical.
for (const x of ALL) if (x.symbol.includes('µ')) BY_SYMBOL.set(x.symbol.replace('µ', 'u'), x);
BY_SYMBOL.set('Da', u('Da', FAMILY.MW, { mul: 1 }));

export function unitInfo(symbol) {
  return BY_SYMBOL.get(symbol) || null;
}

export function canonical(symbol) {
  const x = unitInfo(symbol);
  return x ? x.symbol : symbol;
}

function apply(conv, v) {
  return conv.div ? v / conv.div : v * conv.mul;
}

function invert(conv, v) {
  return conv.div ? v * conv.div : v / conv.mul;
}

/** Value in the base unit of its family: one operation. */
export function toBase(value, symbol) {
  return apply(unitInfo(symbol), value);
}

/** Base-unit value expressed in a unit: one operation. Display only. */
export function fromBase(value, symbol) {
  return invert(unitInfo(symbol), value);
}

/** A mass in grams, for the displacement product solids × v̄ (v̄ in mL/g). One operation. */
export function toGrams(value, symbol) {
  return apply(unitInfo(symbol).toGrams, value);
}

/** Power of ten from a volume unit to µL, for exact decimal comparison against the minimum. */
export function volumeExponentToMicrolitres(symbol) {
  return unitInfo(symbol).symbol === 'mL' ? 3 : 0;
}

/** The concentration family a content family pairs with (C7-VC-01, C7-TG-02). */
export function concFamilyForContent(family) {
  return family === FAMILY.MASS ? FAMILY.MASS_CONC : family === FAMILY.IU ? FAMILY.IU_CONC : family === FAMILY.U ? FAMILY.U_CONC : null;
}

export function isActivityFamily(family) {
  return family === FAMILY.IU || family === FAMILY.U || family === FAMILY.IU_CONC || family === FAMILY.U_CONC;
}
