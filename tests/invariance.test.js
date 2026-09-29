// C7-IV-01, C7-IV-04, C7-IV-05 and C7-IV-02.
//
// Each tolerance is ONE named constant, read from src/engine/constants.js. They
// are null until the derivation memo (outstanding item 3) is signed, and a test
// with a null tolerance is skipped with its measured discrepancy stated — it is
// not passed against an invented bound. Fill the constants and these tests run.
//
// C7-IV-02 is run now: every inserted defect must move its measure far above
// the clean discrepancy. "Exceeds the derived tolerance" is checked too, the
// moment a tolerance exists.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOLERANCES } from '../src/engine/constants.js';
import { C1 } from './c1-fixture.js';
import { roundTrip, unitNormalisation, molarRoute, DEFECTS } from './invariance.js';

export const ROUND_TRIP_TOLERANCE = TOLERANCES.roundTrip;
export const UNIT_NORMALISATION_TOLERANCE = TOLERANCES.unitNormalisation;



const MEASURES = [
  ['C7-IV-01 round trip', 'roundTrip', (o) => roundTrip(o), ROUND_TRIP_TOLERANCE],
  ['C7-IV-04 unit normalisation', 'unitNormalisation', (o) => unitNormalisation(o), UNIT_NORMALISATION_TOLERANCE],
  ['C7-IV-05 molar route', 'molarRoute', (o) => molarRoute(o, C1), UNIT_NORMALISATION_TOLERANCE],
];

for (const [name, key, measure, tol] of MEASURES) {
  const clean = measure({});
  test(`${name}: within the derived tolerance, unrounded`, (t) => {
    if (tol === null) { t.skip(`tolerance open (outstanding item 3); measured worst relative discrepancy ${clean.toExponential(3)}`); return; }
    assert.ok(clean <= tol, `${clean} > ${tol}`);
  });
  for (const [kind, fn] of Object.entries(DEFECTS[key])) {
    test(`C7-IV-02 ${name}: an inserted ${kind} is caught`, () => {
      const d = measure({ _mutate: fn });
      assert.ok(Number.isFinite(d) || d === Infinity);
      assert.ok(d > 1e-12 && d > 1000 * clean, `${kind}: ${d} against clean ${clean}`);
      if (tol !== null) assert.ok(d > tol, `${kind} ${d} does not exceed the tolerance ${tol}`);
    });
  }
}
