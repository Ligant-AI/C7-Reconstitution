// The invariance measures (C7-IV-01, C7-IV-04, C7-IV-05), each evaluated on
// UNROUNDED structured values, each returning the discrepancy it measures so
// that a test can compare it against its tolerance and the mutation record can
// show how far an inserted defect moves it.
import { determine } from '../src/engine/determine.js';
import { T, V } from './fixtures.js';

// A determination that no longer computes, or computes a non-finite value, under
// a defect has failed the invariance as surely as one that disagrees: it counts as ∞.
const rel = (a, b) => { const x = Math.abs(a - b) / Math.abs(b); return Number.isFinite(x) ? x : Infinity; };
const U = (r, k) => (r.status === 'result' ? r.unrounded[k].value : NaN);

/** A spread of determinations, not sharing round-number exactness. */
export const IV_CASES = [
  { content: '0.7318', solids: '1.407', target: '0.4631' },
  { content: '80', solids: '100', target: '80' },
  { content: '1.0054', solids: '1.2', target: '1' },
  { content: '0.0503', solids: null, target: '0.1117' },
  { content: '12.77', solids: '19.1', target: '37.3' },
  { content: '0.00931', solids: '0.513', target: '0.00647' },
];

/** C7-IV-01: target → unrounded diluent → concentration returns the target. Max relative discrepancy. */
export function roundTrip(opts) {
  let worst = 0;
  for (const c of IV_CASES) {
    const s = c.solids ? { totalSolids: { value: c.solids, unit: 'mg' } } : {};
    const a = determine(T({ content: { value: c.content, unit: 'mg' }, ...s, target: { value: c.target, unit: 'mg/mL' } }), opts);
    const Vd = U(a, 'Vd'); // unrounded, not the displayed Vd′
    const b = determine(V({ content: { value: c.content, unit: 'mg' }, ...s, volume: { value: Vd, unit: 'mL' } }), opts);
    worst = Math.max(worst, rel(U(b, 'Ca'), Number(c.target)));
  }
  return worst;
}

/** C7-IV-04: the same content in µg and mg, the target in two units, the volume in µL and mL. */
export function unitNormalisation(opts) {
  let worst = 0;
  for (const c of IV_CASES) {
    const s = c.solids ? { totalSolids: { value: c.solids, unit: 'mg' } } : {};
    const mg = determine(T({ content: { value: c.content, unit: 'mg' }, ...s, target: { value: c.target, unit: 'mg/mL' } }), opts);
    const ug = determine(T({ content: { value: String(Number(c.content) * 1000), unit: 'µg' }, ...s, target: { value: String(Number(c.target) * 1000), unit: 'µg/mL' } }), opts);
    worst = Math.max(worst, rel(U(ug, 'Vd'), U(mg, 'Vd')), rel(U(ug, 'Ca'), U(mg, 'Ca')));
    const mL = determine(V({ content: { value: c.content, unit: 'mg' }, ...s, volume: { value: '1.37', unit: 'mL' } }), opts);
    const uL = determine(V({ content: { value: c.content, unit: 'mg' }, ...s, volume: { value: '1370', unit: 'µL' } }), opts);
    worst = Math.max(worst, rel(U(uL, 'Ca'), U(mL, 'Ca')));
  }
  return worst;
}

/** C7-IV-05: mass target against the same target reached through an MW, on the unrounded diluent. */
export function molarRoute(opts, c1) {
  let worst = 0;
  const mw = c1.mwGperMol;
  for (const c of IV_CASES) {
    const s = c.solids ? { totalSolids: { value: c.solids, unit: 'mg' } } : {};
    const mass = determine(T({ content: { value: c.content, unit: 'mg' }, ...s, target: { value: c.target, unit: 'mg/mL' } }), opts);
    const molarM = Number(c.target) / mw; // mg/mL = g/L → mol/L
    const molar = determine(T({ content: { value: c.content, unit: 'mg' }, ...s, c1, target: { value: String(molarM * 1e6), unit: 'µM' } }), opts);
    worst = Math.max(worst, rel(U(molar, 'Vd'), U(mass, 'Vd')));
  }
  return worst;
}

/**
 * C7-IV-02: three defects per measure — a clamp, a floor and a nudge — inserted
 * through the engine's test-only `_mutate` seam at a stage on that measure's path.
 */
export const DEFECTS = {
  roundTrip: {
    clamp: (s, v) => (s === 'Vd' ? Math.min(v, 1.5) : v),
    floor: (s, v) => (s === 'Vd' ? Math.floor(v * 1e4) / 1e4 : v),
    nudge: (s, v) => (s === 'Ca' ? v * (1 + 1e-9) : v),
  },
  unitNormalisation: {
    clamp: (s, v) => (s === 'contentRaw' ? Math.min(v, 100) : v),
    floor: (s, v) => (s === 'targetRaw' ? Math.floor(v * 10) / 10 : v),
    nudge: (s, v, ctx) => (s === 'content' && ctx.unit === 'µg' ? v * (1 + 1e-9) : v),
  },
  molarRoute: {
    clamp: (s, v) => (s === 'molarTarget' ? Math.min(v, 1) : v),
    floor: (s, v) => (s === 'molarTarget' ? Math.floor(v * 100) / 100 : v),
    nudge: (s, v) => (s === 'molarTarget' ? v * (1 + 1e-9) : v),
  },
};
