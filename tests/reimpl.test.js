// Acceptance 3: an independent reimplementation in a second language
// (reimpl/reconstitution.py) agrees with the shipped engine on the full fixture
// set, compared on UNROUNDED structured values. Agreement is asserted bit-exact,
// which is stricter than any tolerance the derivation memo can set; displayed
// strings, status, rejection codes, flag codes, the concentration label, the
// displacement treatment and the §8 pairing row are compared too.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { determine } from '../src/engine/determine.js';
import { FIXTURES, T, V } from './fixtures.js';
import { IV_CASES } from './invariance.js';
import { C1 } from './c1-fixture.js';
import { MATERIAL_THRESHOLD } from '../src/engine/constants.js';

const cases = [
  ...FIXTURES.map((f) => ({ id: f.id, ...f.input })),
  ...IV_CASES.flatMap((c, i) => {
    const s = c.solids ? { totalSolids: { value: c.solids, unit: 'mg' } } : {};
    return [
      { id: `IV-${i}-target-µg`, ...T({ content: { value: c.content, unit: 'mg' }, ...s, target: { value: c.target, unit: 'mg/mL' } }) },
      { id: `IV-${i}-final-µL`, ...V({ content: { value: c.content, unit: 'mg' }, ...s, volume: { value: '1370', unit: 'µL' }, volumeBasis: 'final', reportUnit: 'µg/mL' }) },
      { id: `IV-${i}-diluent-µL`, ...V({ content: { value: c.content, unit: 'mg' }, ...s, volume: { value: '713', unit: 'µL' }, reportUnit: 'ng/mL' }) },
      { id: `IV-${i}-molar`, ...T({ content: { value: c.content, unit: 'mg' }, ...s, c1: C1, target: { value: '3.17', unit: 'µM' } }) },
    ];
  }),
];

test('acceptance 3: the Python reimplementation agrees bit-exactly on unrounded values', () => {
  const py = spawnSync('python3', [new URL('../reimpl/reconstitution.py', import.meta.url).pathname], {
    input: JSON.stringify(cases.map((c) => ({ ...c, c1: undefined, mwGperMol: c.c1 ? c.c1.mwGperMol : null, c1MassBasis: c.c1 ? c.c1.massBasis : null, c1FlagCount: c.c1 ? c.c1.flags.length : 0, threshold: MATERIAL_THRESHOLD.value }))),
    encoding: 'utf8',
  });
  assert.equal(py.status, 0, py.stderr);
  const theirs = JSON.parse(py.stdout);
  assert.equal(theirs.length, cases.length);
  let compared = 0;
  cases.forEach((c, i) => {
    const r = determine(c);
    const py = theirs[i];
    assert.equal(py.status, r.status, `${c.id} status`);
    if (r.status === 'rejected') { assert.deepEqual(py.rejections, r.rejections.map((x) => x.code), `${c.id} rejection codes`); compared++; return; }
    assert.deepEqual(py.flags, r.flags.map((f) => f.code), `${c.id} flag codes`);
    assert.equal(py.label, r.concentration.reported.label, `${c.id} concentration label`);
    assert.equal(py.treatment, r.displacement.treatment, `${c.id} displacement treatment`);
    if (r.concentration.molar) { assert.equal(py.molar.row, r.concentration.molar.pairingRow, `${c.id} pairing row`); assert.equal(py.molar.status === 'reported', r.concentration.molar.status !== 'withheld', `${c.id} molar status`); }
    else assert.equal(py.molar, null);
    const u = r.unrounded; const p = theirs[i].unrounded;
    const mine = { F: u.F.value, D: u.D?.value ?? null, Dmin: u.Dmin?.value ?? null, Dapp: u.Dapp.value, Vd: u.Vd.value, VdPrime: u.VdPrime.value, Fa: u.Fa.value, Ca: u.Ca.value, f: u.f, fmin: u.fmin, target: u.target?.value ?? null };
    for (const k of Object.keys(mine)) { assert.equal(p[k], mine[k], `${c.id} ${k}`); compared++; }
    assert.equal(theirs[i].displayed.diluent, r.volumes.diluent.display, `${c.id} displayed diluent`);
    assert.equal(theirs[i].displayed.final, r.volumes.final.display, `${c.id} displayed final`);
    assert.equal(theirs[i].displayed.concentration, r.concentration.reported.display, `${c.id} displayed concentration`);
  });
  assert.ok(compared > 400, `compared ${compared}`);
});
