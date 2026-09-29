import { test } from 'node:test';
import assert from 'node:assert/strict';
import { determine } from '../src/engine/determine.js';
import { validateResultObject } from '../src/shared/result-object.js';
import { encodeEnvelope, decodeEnvelope, readC1 } from '../src/shared/transport.js';
import { PAIRING_ROWS } from '../src/engine/declarations.js';
import { notebookText } from '../src/engine/format.js';
import { FIXTURES, T, V } from './fixtures.js';
import { c1With } from './c1-fixture.js';

const codes = (r) => r.flags.map((f) => f.code);

// ---------- §10 fixtures ----------
for (const fx of FIXTURES) {
  test(`${fx.id} — ${fx.name}`, () => {
    const r = determine(fx.input);
    const e = fx.expect;
    if (e.status === 'rejected') {
      assert.equal(r.status, 'rejected');
      assert.deepEqual(r.rejections.map((x) => x.code), e.rejections);
      assert.deepEqual(validateResultObject(r), []);
      return;
    }
    assert.equal(r.status, 'result', JSON.stringify(r.rejections.concat(r.incomplete)));
    assert.deepEqual(codes(r), e.flags, 'flags');
    if (e.diluent) assert.equal(r.volumes.diluent.display, e.diluent, 'diluent');
    if (e.final) assert.equal(r.volumes.final.display, e.final, 'final');
    if (e.D) assert.equal(r.displacement.computed.D.display, e.D, 'D');
    if (e.f) assert.equal(r.displacement.computed.f.display, e.f, 'f');
    if (e.Dmin) assert.equal(r.displacement.Dmin.display, e.Dmin, 'Dmin');
    if (e.fmin) assert.equal(r.displacement.Dmin.fmin.display, e.fmin, 'fmin');
    if (e.conc) assert.equal(r.concentration.reported.display, e.conc, 'concentration');
    if (e.label) assert.equal(r.concentration.reported.label, e.label, 'label');
    if (e.treatment) assert.equal(r.displacement.treatment, e.treatment);
    if (e.basis) assert.equal(r.declarations.contentBasis.value, e.basis);
    if (e.target) assert.equal(r.target.display, e.target);
    if (e.departure) assert.equal(r.target.departure.display, e.departure);
    if (e.shortfall) assert.equal(r.flags.find((f) => f.code === 'C7-FL-08').payload.shortfall.display, e.shortfall);
    if (e.overstatement) assert.equal(r.flags.find((f) => f.code === 'C7-FL-08').payload.overstatement.display, e.overstatement);
    if (e.molar) { assert.equal(r.concentration.molar.status, e.molar); assert.equal(r.concentration.molar.pairingRow, e.pairingRow); }
    if (e.molarityOf) assert.match(r.concentration.molar.molarityOf, e.molarityOf);
    if (e.reagentComputable !== undefined) assert.equal(r.concentration.reagent.computable, e.reagentComputable);
    if (e.fminExceeds !== undefined) assert.equal(r.flags.find((f) => f.code === 'C7-FL-05').payload.exceedsThreshold, e.fminExceeds);
    if (r.volumes.additivity) assert.equal(r.volumes.additivity.holds, true, 'C7-IV-03 additivity');
    assert.deepEqual(validateResultObject(r), [], 'C7-OUT-04 fields');
  });
}

test('C7-FX-06 activity: unbounded wording, no Dmin', () => {
  const r = determine(T({ content: { value: '1e6', unit: 'IU' }, target: { value: '1e4', unit: 'IU/mL' } }));
  const f = r.flags.find((x) => x.code === 'C7-FL-05');
  assert.match(f.message, /no bound is available/);
  assert.equal(r.displacement.Dmin, null);
  assert.equal(r.concentration.upperBound.isUpperBound, false);
});

test('C7-FX-06 / 13c: "at most" and the diluent label reach the notebook copy and the object (acceptance 13c, 15a)', () => {
  const r = determine(T({ content: { value: '80', unit: 'mg' }, target: { value: '80', unit: 'mg/mL' } }));
  const t = notebookText(r);
  assert.match(t, /at most 79\.9681 mg\/mL/); // rounded up: the displayed figure is itself a bound
  assert.match(t, /corrected for the reagent's own volume only; carrier and excipient not included/);
  assert.doesNotMatch(r.concentration.reported.labelText, /achieved/);
  assert.equal(r.concentration.upperBound.isUpperBound, true);
  assert.ok(r.concentration.upperBound.reason && r.concentration.upperBound.assumptions.length >= 3);
  assert.equal(r.volumes.final.label, 'at least');
  // The envelope carries the bound unstripped.
  const back = decodeEnvelope(encodeEnvelope('c7-stock', r), 'c7-stock');
  assert.equal(back.ok, true);
  assert.equal(back.payload.concentration.upperBound.isUpperBound, true);
});

test('C7-FX-17 reproduces by hand: 1.0054 ÷ (1.00 + 1.2 × 0.73 × 10⁻³)', () => {
  const r = determine(FIXTURES.find((f) => f.id === 'C7-FX-17').input);
  const hand = 1.0054 / (1.00 + 1.2 * 0.73 * 1e-3);
  assert.equal(r.concentration.reported.display, '1.00452');
  assert.ok(Math.abs(r.unrounded.Ca.value - hand) / hand < 1e-15);
  assert.equal(r.unrounded.Fa.value.toFixed(6), '1.000876');
});

test('C7-FX-14: the diluent is rounded from its own value, not derived from a rounded final', () => {
  const r = determine(FIXTURES.find((f) => f.id === 'C7-FX-14').input);
  assert.equal(r.volumes.primary, 'final');
  assert.equal(r.volumes.diluent.display, '0.918');
  assert.equal(r.volumes.final.display, '1.01'); // from the one Fa, not from F = 1.0049
  const wrong = 1.00 - r.unrounded.D.value; // final rounded first, diluent derived: the error guarded against
  assert.equal(wrong.toFixed(3), '0.913');
  assert.notEqual(wrong.toFixed(3), r.volumes.diluent.display);
  assert.equal(r.unrounded.Fa.value, 0.918 + r.unrounded.D.value);
});

test('C7-FX-13: the two datasheet entries differ by exactly the displacement\'s effect', () => {
  const a = determine(FIXTURES.find((f) => f.id === 'C7-FX-13a').input);
  const b = determine(FIXTURES.find((f) => f.id === 'C7-FX-13b').input);
  const D = a.unrounded.D.value;
  assert.equal(a.unrounded.Ca.value, 0.05 / (1 + D));
  assert.equal(b.volumes.enteredFinal.display, '1');
  assert.equal(b.unrounded.Fa.value, Number(b.volumes.diluent.display) + D); // Ca from Vd′, Fa beside the entered final
  assert.equal(b.unrounded.Ca.value, 0.05 / b.unrounded.Fa.value);
});

// ---------- C7-FX-04, total protein ----------
test('C7-FX-04 total-protein case', () => {
  const r = determine(T({ content: { value: '1', unit: 'mg' }, contentBasis: 'total-vial-contents', carrier: 'present', target: { value: '1', unit: 'mg/mL' } }));
  assert.ok(codes(r).includes('C7-FL-01'));
  assert.match(r.concentration.reported.of, /total solids/);
  assert.equal(r.concentration.reagent.computable, false);
  assert.match(r.concentration.reagent.reason, /not equal to the total/);
  assert.equal(r.displacement.treatment, 'computed'); // solids = content
});

// ---------- §7 rejections ----------
const rej = (input) => determine(input).rejections.map((x) => x.code);
test('C7-HI-01..09 reject with the quantity named', () => {
  assert.deepEqual(rej(T({ content: { value: '0', unit: 'mg' }, target: { value: '1', unit: 'mg/mL' } })), ['C7-HI-01']);
  assert.deepEqual(rej(T({ content: { value: '1', unit: 'mg' }, target: { value: '-1', unit: 'mg/mL' } })), ['C7-HI-02']);
  assert.deepEqual(rej(V({ content: { value: '1', unit: 'mg' }, volume: { value: '0', unit: 'mL' } })), ['C7-HI-02']);
  assert.deepEqual(rej(T({ content: { value: '1', unit: 'mg' }, target: { value: '1', unit: 'IU/mL' } })), ['C7-HI-03']);
  assert.deepEqual(rej(T({ content: { value: '1', unit: 'IU' }, target: { value: '1', unit: 'mg/mL' } })), ['C7-HI-03']);
  assert.deepEqual(rej(T({ content: { value: '1', unit: 'mg' }, target: { value: '1', unit: 'µM' } })), ['C7-HI-04']);
  assert.deepEqual(rej(T({ content: { value: '1', unit: 'IU' }, target: { value: '1', unit: 'µM' } })), ['C7-HI-04']);
  assert.deepEqual(rej(T({ content: { value: '1', unit: 'mg' }, target: { value: '1', unit: 'mg/mL' }, minTransfer: { value: '0', unit: 'µL' } })), ['C7-HI-06']);
  assert.deepEqual(rej(T({ content: { value: '2', unit: 'mg' }, totalSolids: { value: '1', unit: 'mg' }, target: { value: '1', unit: 'mg/mL' } })), ['C7-HI-07']);
  // C7-FX-15
  assert.deepEqual(rej(T({ content: { value: '1', unit: 'U' }, target: { value: '1', unit: 'IU/mL' } })), ['C7-HI-09']);
  assert.deepEqual(rej(T({ content: { value: '1', unit: 'IU' }, target: { value: '1', unit: 'U/mL' } })), ['C7-HI-09']);
  const m = determine(T({ content: { value: '1', unit: 'U' }, target: { value: '1', unit: 'IU/mL' } })).rejections[0].message;
  assert.match(m, /U/); assert.match(m, /IU\/mL/); assert.match(m, /international standard/);
});

test('C7-HI-08 at its boundary, on D and on Dmin (C7-FX-10)', () => {
  // D ≥ F: target at which 1 mg of total solids occupies the whole final volume.
  const t = 1 / 0.73 * 1000; // mg/mL
  const on = (target, solids) => rej(T({ content: { value: '1', unit: 'mg' }, ...(solids ? { totalSolids: { value: '1', unit: 'mg' } } : {}), target: { value: target, unit: 'mg/mL' } }));
  // Search the nearest representable targets either side of the boundary.
  const below = 1369.8; const above = 1369.9;
  assert.deepEqual(on(below, true), []);
  assert.deepEqual(on(above, true), ['C7-HI-08']);
  assert.deepEqual(on(below, false), []); // on Dmin
  assert.deepEqual(on(above, false), ['C7-HI-08']);
  assert.ok(t > below && t < above);
  // Cannot fire with a diluent entered.
  assert.deepEqual(rej(V({ content: { value: '1', unit: 'g' }, volume: { value: '0.001', unit: 'mL' } })), []);
});

test('incomplete: every compelled declaration is required (acceptance 14)', () => {
  const r = determine({ direction: 'target' });
  const fields = r.incomplete.map((i) => i.field);
  for (const f of ['content', 'content-unit', 'provenance', 'carrier', 'whole-vial', 'volume-basis', 'min-transfer', 'target', 'target-unit']) assert.ok(fields.includes(f), f);
  const mass = determine({ direction: 'target', content: { value: '1', unit: 'mg' } }).incomplete.map((i) => i.field);
  assert.ok(mass.includes('content-basis') && mass.includes('conjugate'));
  const act = determine({ direction: 'target', content: { value: '1', unit: 'IU' } }).incomplete.map((i) => i.field);
  assert.ok(!act.includes('content-basis') && !act.includes('conjugate')); // C7-VC-03a, acceptance 13b
});

// ---------- §8 flags, both directions ----------
test('every §8 flag fires with its code, in both directions (acceptance 11)', () => {
  const both = (o) => [T({ target: { value: '1', unit: 'mg/mL' }, ...o }), V({ volume: { value: '1', unit: 'mL' }, ...o })];
  const mg = { content: { value: '1', unit: 'mg' } };
  const cases = [
    ['C7-FL-01', { ...mg, contentBasis: 'total-vial-contents' }],
    ['C7-FL-02', { ...mg, contentBasis: 'not-recorded' }],
    ['C7-FL-03', { ...mg, provenance: 'nominal' }],
    ['C7-FL-04', { ...mg, provenance: 'not-recorded' }],
    ['C7-FL-05', { ...mg }],
    ['C7-FL-06', { ...mg, capacity: { value: '0.5', unit: 'mL' } }],
    ['C7-FL-07', { ...mg, minTransfer: { value: '2000', unit: 'µL' } }],
    ['C7-FL-08', { content: { value: '80', unit: 'mg' }, totalSolids: { value: '100', unit: 'mg' }, target: { value: '80', unit: 'mg/mL' } }],
    ['C7-FL-11', { ...mg, carrier: 'present' }],
    ['C7-FL-12', { ...mg, carrier: 'not-recorded' }],
    ['C7-FL-13', { ...mg, conjugate: 'protein' }],
    ['C7-FL-14', { ...mg, conjugate: 'not-recorded' }],
  ];
  for (const [code, o] of cases) for (const input of both(o)) assert.ok(codes(determine(input)).includes(code), `${code} ${input.direction}`);
});

test('C7-FL-08 payload keyed to the known volume, not the direction (C7-FX-11, acceptance 13a)', () => {
  const s = { content: { value: '80', unit: 'mg' }, totalSolids: { value: '100', unit: 'mg' } };
  const fl = (input) => determine(input).flags.find((f) => f.code === 'C7-FL-08').payload;
  const tgt = fl(T({ ...s, target: { value: '80', unit: 'mg/mL' } }));
  const fin = fl(V({ ...s, volume: { value: '1', unit: 'mL' }, volumeBasis: 'final' }));
  const dil = fl(V({ ...s, volume: { value: '0.927', unit: 'mL' } }));
  assert.equal(tgt.shortfall.display, '6.80 %'); assert.equal(tgt.factor.relation, '1 ÷ (1 + f)');
  assert.equal(fin.shortfall.display, '6.80 %'); assert.equal(fin.factor.relation, '1 ÷ (1 + f)');
  // §8 and C7-FX-11 print 7.88 %. f ÷ (1 − f) at f = 0.073 is 0.0787487…, which is 7.87 % at
  // 3 sf under C7-UN-06; the specification's figure is off by one in the last place.
  // Recorded in docs/spec-findings.md for the specification owner; the engine is not bent to it.
  assert.equal(dil.overstatement.display, '7.87 %'); assert.equal(dil.factor.relation, '1 ÷ (1 − f)');
  // Derived by hand from the relations at f = 0.073.
  assert.equal((0.073 / 1.073 * 100).toFixed(2), '6.80');
  assert.equal((0.073 / 0.927 * 100).toFixed(4), '7.8749');
  for (const p of [tgt, fin, dil]) assert.match(p.f.ratioOf, /÷ final volume/);
});

test('C7-FL-05 fmin = v̄ × content ÷ F in each direction (C7-FX-11)', () => {
  const t = determine(T({ content: { value: '80', unit: 'mg' }, target: { value: '80', unit: 'mg/mL' } }));
  assert.ok(Math.abs(t.displacement.Dmin.fmin.unrounded - 0.73e-3 * 80) < 1e-15); // v̄ × target
  const v = determine(V({ content: { value: '80', unit: 'mg' }, volume: { value: '1.00', unit: 'mL' } }));
  assert.ok(Math.abs(v.displacement.Dmin.fmin.unrounded - 0.0584 / 1.0584) < 1e-15);
});

test('C7-FL-07 boundary against Vd′, a displayed decimal (C7-FX-10)', () => {
  const at = (min) => codes(determine(V({ content: { value: '1', unit: 'mg' }, totalSolids: { value: '1', unit: 'mg' }, volume: { value: '0.500', unit: 'mL' }, minTransfer: { value: min, unit: 'µL' } })));
  assert.ok(!at('500').includes('C7-FL-07')); // exactly on: not below
  assert.ok(at('500.000000001').includes('C7-FL-07'));
  assert.ok(!at('499.999999999').includes('C7-FL-07'));
});

test('C7-FL-06 boundary against Fa (C7-FX-10)', () => {
  const r0 = determine(V({ content: { value: '1', unit: 'mg' }, totalSolids: { value: '1', unit: 'mg' }, volume: { value: '1', unit: 'mL' } }));
  const Fa = r0.unrounded.Fa.value;
  const cap = (x) => codes(determine(V({ content: { value: '1', unit: 'mg' }, totalSolids: { value: '1', unit: 'mg' }, volume: { value: '1', unit: 'mL' }, capacity: { value: x, unit: 'mL' } })));
  const next = (x, dir) => { const b = new Float64Array([x]); const i = new BigInt64Array(b.buffer); i[0] += BigInt(dir); return b[0]; };
  assert.ok(!cap(Fa).includes('C7-FL-06'));
  assert.ok(cap(next(Fa, -1)).includes('C7-FL-06'));
  assert.ok(!cap(next(Fa, 1)).includes('C7-FL-06'));
});

test('C7-FL-08 threshold boundary at the nearest representable f either side (C7-FX-10)', () => {
  // f = D ÷ F with F = 1 mL entered final: D = solids_g × 0.73. Find solids placing f either side of 0.006.
  const fOf = (s) => determine(V({ content: { value: '0.001', unit: 'mg' }, totalSolids: { value: s, unit: 'g' }, volume: { value: '1', unit: 'mL' }, volumeBasis: 'final' }));
  let lo = 0.0082; let hi = 0.0083;
  for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (fOf(mid).displacement.computed.f.unrounded > 0.006) hi = mid; else lo = mid; }
  assert.ok(!codes(fOf(lo)).includes('C7-FL-08'));
  assert.ok(codes(fOf(hi)).includes('C7-FL-08'));
});

test('negative controls raise no flags in either direction (acceptance 9)', () => {
  for (const id of ['C7-FX-08', 'C7-FX-08v', 'C7-FX-17']) assert.deepEqual(codes(determine(FIXTURES.find((f) => f.id === id).input)), []);
});

// ---------- §8 pairing table (C7-FX-09) ----------
const c1Payload = (massBasis, flags = []) => ({
  schema: { name: 'ligant-benchtools-c1-conversion', version: '1.4.0' },
  tool: { id: 'C1', name: 'Molarity Converter', engineVersion: '1.0.0' },
  quantities: { molecularWeight: { value: 150, unit: 'kDa', underflowed: false } },
  declarations: { molecularWeightProvenance: 'vendor-datasheet', massBasis },
  flags,
});
const importC1 = (payload) => {
  const d = decodeEnvelope(encodeEnvelope('c1-conversion', payload), 'c1-conversion');
  assert.equal(d.ok, true);
  return readC1(d.payload).c1;
};

test('C7-FX-09: every pairing row, as a molar target and as an imported object with a mass target', () => {
  const combos = [
    // [c1 basis, content basis, conjugate, expected row, permitted]
    ['assembled', 'total-vial-contents', 'none', 1, false],
    ['assembled', 'not-recorded', 'none', 2, false],
    ['assembled', 'reagent-alone', 'not-recorded', 4, false],
    ['not-recorded', 'reagent-alone', 'none', 5, false],
    ['monomer', 'reagent-alone', 'none', 6, false],
    ['assembled', 'reagent-alone', 'none', 7, true],
    ['assembled', 'reagent-alone', 'protein', 8, true],
    ['conjugate', 'reagent-alone', 'conjugate', 9, true],
    ['conjugate', 'reagent-alone', 'none', 10, false],
    ['conjugate', 'reagent-alone', 'protein', 10, false],
    ['assembled', 'reagent-alone', 'conjugate', 11, false],
  ];
  for (const [c1b, basis, conj, row, ok] of combos) {
    const c1 = importC1(c1Payload(c1b));
    const base = { content: { value: '1', unit: 'mg' }, contentBasis: basis, conjugate: conj, c1, molarUnit: 'µM' };
    const molar = determine(T({ ...base, target: { value: '6.6', unit: 'µM' } }));
    const mass = determine(T({ ...base, target: { value: '1', unit: 'mg/mL' } }));
    if (ok) {
      assert.equal(molar.status, 'result', `row ${row} molar target accepted`);
      assert.equal(mass.concentration.molar.status, 'reported');
      assert.equal(mass.concentration.molar.pairingRow, row);
      if (row === 8) assert.match(mass.concentration.molar.molarityOf, /protein/);
    } else {
      assert.deepEqual(molar.rejections.map((x) => x.code), ['C7-HI-04'], `row ${row}`);
      assert.match(molar.rejections[0].message, new RegExp(`row ${row}`));
      assert.equal(mass.concentration.molar.status, 'withheld');
      assert.equal(mass.concentration.molar.pairingRow, row);
      assert.ok(codes(mass).includes('C7-FL-09'));
      assert.equal(mass.status, 'result'); // the mass-based result stands
    }
  }
  // Row 3: activity content.
  const act = determine(T({ content: { value: '1', unit: 'IU' }, c1: importC1(c1Payload('assembled')), target: { value: '1', unit: 'IU/mL' } }));
  assert.equal(act.concentration.molar.pairingRow, 3);
  assert.equal(PAIRING_ROWS.length, 11);
});

test('C7-FL-10 restates the C1 flags; the C1 object is embedded whole (C7-ST-01, C7-OUT-04)', () => {
  const payload = c1Payload('assembled', [{ code: 'C1-FL-03', message: 'A flagged value.', evaluatedOn: 'x', kind: 'threshold' }]);
  const r = determine(T({ content: { value: '1', unit: 'mg' }, c1: importC1(payload), target: { value: '1', unit: 'mg/mL' }, molarUnit: 'µM' }));
  const f = r.flags.find((x) => x.code === 'C7-FL-10');
  assert.match(f.message, /C1-FL-03: A flagged value\./);
  assert.deepEqual(r.importedC1, payload);
});

test('transport: a stripped flag list or a corrupted object is refused (C7-ST-01)', () => {
  const env = encodeEnvelope('c1-conversion', c1Payload('assembled', [{ code: 'C1-FL-03', message: 'm' }]));
  const obj = JSON.parse(Buffer.from(env.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
  obj.payload.flags = [];
  assert.equal(decodeEnvelope(JSON.stringify(obj), 'c1-conversion').failure, 'checksum-mismatch');
  delete obj.payload.flags;
  assert.equal(decodeEnvelope(JSON.stringify(obj), 'c1-conversion').failure, 'checksum-mismatch');
  assert.equal(decodeEnvelope(JSON.stringify(c1Payload('assembled')), 'c1-conversion').failure, 'not-an-envelope');
  assert.equal(decodeEnvelope(env.slice(0, env.length / 2), 'c1-conversion').ok, false);
  assert.equal(decodeEnvelope(`https://x/#c1=${env}`, 'c1-conversion').ok, true);
});

// ---------- determinism (C7-ST-06, acceptance 18) ----------
test('same inputs, same outputs', () => {
  for (const fx of FIXTURES) assert.deepEqual(determine(fx.input), determine(structuredClone(fx.input)));
});

test('the default minimum is disclosed, not flagged; an entered one is recorded as entered', () => {
  const d = determine(FIXTURES[0].input);
  assert.equal(d.declarations.minTransfer.source, 'default');
  const e = determine({ ...FIXTURES[0].input, minTransfer: { value: '5', unit: 'µL' } });
  assert.equal(e.declarations.minTransfer.source, 'entered');
});

test('"not recorded" is distinguishable from blank in the object (C7-VC-05)', () => {
  const r = determine(T({ content: { value: '1', unit: 'mg' }, target: { value: '1', unit: 'mg/mL' }, carrier: 'not-recorded' }));
  assert.equal(r.declarations.carrier.value, 'not-recorded');
  const blank = determine(T({ content: { value: '1', unit: 'mg' }, target: { value: '1', unit: 'mg/mL' }, carrier: '' }));
  assert.equal(blank.declarations.carrier, null);
});

test('C7-FL-08 threshold is configured, not hard-coded; the page default is the registered constant', () => {
  const input = V({ content: { value: '0.001', unit: 'mg' }, totalSolids: { value: '0.0082', unit: 'g' }, volume: { value: '1.00', unit: 'mL' } });
  const base = determine(input);
  const f = base.displacement.computed.f.unrounded;
  assert.equal(base.constants.materialThreshold.value, 0.006);
  const below = (x) => { const b = new Float64Array([x]); const i = new BigInt64Array(b.buffer); i[0] -= 1n; return b[0]; };
  assert.ok(codes(determine(input, { materialThreshold: below(f) })).includes('C7-FL-08'));
  assert.ok(!codes(determine(input, { materialThreshold: f })).includes('C7-FL-08')); // strict >
  assert.equal(determine(input, { materialThreshold: 0.5 }).constants.materialThreshold.status, 'configured');
});

// Regressions for the black-box adversarial findings (verification/adversarial/report-2026-09-28.md).
test('F-1: a diluent negligible beside D never crashes; the FL-08 factor is computed without cancellation', () => {
  const run = (v, solids = '100') => determine(V({ content: { value: '80', unit: 'mg' }, totalSolids: { value: solids, unit: 'mg' }, volume: { value: v, unit: 'mL' } }));
  // 1e-300 mL: 1 − f cancels to 0 in binary, but 1 ÷ (1 − f) = F ÷ Vd′ ≈ 7.3e298 is representable.
  const r = run('1e-300');
  assert.equal(r.status, 'result');
  assert.deepEqual(r.flags.map((f) => f.code), ['C7-FL-07', 'C7-FL-08']);
  const p = r.flags.find((f) => f.code === 'C7-FL-08').payload;
  assert.ok(Math.abs(p.factor.unrounded / (0.073 / 1e-300) - 1) < 1e-15);
  assert.equal(r.concentration.reported.display, '1095.89');
  // 5e-324 and 1e-320 mL: F ÷ Vd′ exceeds the double range — genuinely not representable.
  for (const v of ['5e-324', '1e-320']) assert.equal(run(v).status, 'not-representable', v);
  // 1e300 mg of solids with 1.00 mL: factor ≈ 7.3e296, representable.
  assert.equal(run('1.00', '1e300').status, 'result');
});
test('F-2: rejections are listed in §7 table order', () => {
  const r = determine(T({ content: { value: '1', unit: 'mg' }, target: { value: '10', unit: 'IU/mL' }, minTransfer: { value: '-2', unit: 'µL' } }));
  assert.deepEqual(r.rejections.map((x) => x.code), ['C7-HI-03', 'C7-HI-06']);
});
test('F-3: a content that underflows is not representable, not a C7-HI-08 rejection', () => {
  const r = determine(T({ content: { value: '5e-324', unit: 'mg' }, target: { value: '8', unit: 'mg/mL' } }));
  assert.equal(r.status, 'not-representable');
});
test('F-4: a positive entry beyond the double range is not representable, not zero or "not a number"', () => {
  for (const v of ['1e-400', '1e400']) {
    const r = determine(T({ content: { value: v, unit: 'mg' }, target: { value: '1', unit: 'mg/mL' } }));
    assert.equal(r.status, 'not-representable', v);
  }
  assert.deepEqual(determine(T({ content: { value: '-1e-400', unit: 'mg' }, target: { value: '1', unit: 'mg/mL' } })).rejections.map((x) => x.code), ['C7-HI-01']);
});

test('directed rounding: every displayed bound is on its own side of the unrounded bound', () => {
  const cases = [
    T({ content: { value: '80', unit: 'mg' }, target: { value: '80', unit: 'mg/mL' } }),
    V({ content: { value: '80', unit: 'mg' }, volume: { value: '1.00', unit: 'mL' } }),
    T({ content: { value: '1.0044', unit: 'mg' }, target: { value: '1', unit: 'mg/mL' } }),
    V({ content: { value: '0.7318', unit: 'mg' }, volume: { value: '713', unit: 'µL' }, reportUnit: 'ng/mL' }),
  ];
  for (const input of cases) {
    const r = determine(input);
    const c = r.concentration.reported; const f = r.volumes.final;
    assert.equal(c.label, 'at-most'); assert.equal(c.rounding, 'up'); assert.equal(f.rounding, 'down');
    assert.ok(Number(c.display) >= c.unrounded, `at most ${c.display} < ${c.unrounded}`);
    assert.ok(Number(f.display) <= f.unrounded, `at least ${f.display} > ${f.unrounded}`);
    assert.equal(r.volumes.additivity.holds, true);
  }
  // Values that are not bounds keep half away from zero.
  const ach = determine(T({ content: { value: '1.0054', unit: 'mg' }, totalSolids: { value: '1.2', unit: 'mg' }, target: { value: '1', unit: 'mg/mL' } }));
  assert.equal(ach.concentration.reported.rounding, 'half away from zero');
  assert.equal(ach.concentration.reported.display, '1.00452');
  const dec = { content: { value: '80', unit: 'mg' }, target: { value: '80', unit: 'mg/mL' } };
  assert.equal(determine(T(dec)).volumes.diluent.display, '0.942'); // the diluent is never directed
});

test('the C7-OUT-04 validator catches the loss of each field it checks (acceptance 4 must be able to fail)', () => {
  const r0 = determine(T({ content: { value: '80', unit: 'mg' }, target: { value: '80', unit: 'mg/mL' }, capacity: { value: '2', unit: 'mL' }, c1: c1With('assembled'), molarUnit: 'µM' }));
  assert.deepEqual(validateResultObject(r0), []);
  const strip = [
    (r) => { delete r.declarations.capacity.unit; },
    (r) => { delete r.displacement.Dmin.fmin; },
    (r) => { delete r.target.unit; },
    (r) => { r.concentration.reported.rounding = 'half away from zero'; }, // a bound not rounded up
    (r) => { delete r.volumes.final.rounding; },
    (r) => { delete r.concentration.molar.molarityOf; },
    (r) => { delete r.importedC1.flags; },
    (r) => { delete r.concentration.upperBound.reason; },
    (r) => { delete r.declarations.carrier; },
  ];
  for (const [i, f] of strip.entries()) { const r = structuredClone(r0); f(r); assert.ok(validateResultObject(r).length > 0, `strip ${i} not caught`); }
  const withheld = determine(T({ content: { value: '1', unit: 'mg' }, contentBasis: 'total-vial-contents', target: { value: '1', unit: 'mg/mL' }, c1: c1With('assembled'), molarUnit: 'nM' }));
  assert.deepEqual(validateResultObject(withheld), []);
  delete withheld.concentration.molar.reason;
  assert.ok(validateResultObject(withheld).length > 0);
});

test('T1: a quantity beyond the double range has its own state, names the quantity, and says it is a limit of the arithmetic', () => {
  const r = determine(T({ content: { value: '1e300', unit: 'IU' }, target: { value: '1e-300', unit: 'IU/mL' } }));
  assert.equal(r.status, 'not-representable');
  assert.deepEqual(r.incomplete, []); // every declaration was made: not "incomplete"
  assert.deepEqual(r.rejections.map((x) => x.code), ['C7-HI-10']); // URS v1.1 §7
  assert.equal(r.notRepresentable.code, 'C7-HI-10');
  assert.match(r.notRepresentable.quantity, /final volume/);
  assert.match(r.notRepresentable.message, /limit of the arithmetic, not a physical impossibility/);
  assert.deepEqual(validateResultObject(r), []);
  const e = determine(T({ content: { value: '1e400', unit: 'mg' }, target: { value: '1', unit: 'mg/mL' } }));
  assert.match(e.notRepresentable.quantity, /stated vial content as entered, 1e400/);
});

test('T2: the departure names the values it is taken on, and an "at most" departure is rounded up', () => {
  const b = determine(T({ content: { value: '80', unit: 'mg' }, target: { value: '80', unit: 'mg/mL' } }));
  assert.equal(b.target.departure.isUpperBound, true);
  assert.equal(b.target.departure.display, '-0.0399 %'); // −0.039984 % rounded toward +∞; half-away gave −0.0400 %, below the bound
  assert.ok(Number(b.target.departure.display.replace(' %', '')) / 100 >= b.target.departure.unrounded);
  assert.match(b.target.departure.ratioOf, /unrounded/);
  const d = determine(T({ content: { value: '1.0044', unit: 'mg' }, target: { value: '1', unit: 'mg/mL' } }));
  assert.equal(d.target.departure.display, '+0.367 %');
  const a = determine(FIXTURES.find((f) => f.id === 'C7-FX-17').input); // not a bound: unchanged
  assert.equal(a.target.departure.isUpperBound, false);
  assert.equal(a.target.departure.display, '+0.452 %');
  assert.match(notebookText(b), /on the unrounded values = at most -0\.0399 %/);
});

test('one privacy text: the footer carries the statement word for word, and links the policy', async () => {
  const { PRIVACY_STATEMENT } = await import('../src/ui/privacy.js');
  const { renderFooter } = await import('../src/ui/chrome.js');
  const { CONFIG } = await import('../src/config.js');
  const footer = renderFooter();
  assert.ok(footer.includes(PRIVACY_STATEMENT), 'footer statement differs from the Privacy section');
  assert.ok(footer.includes(`href="${CONFIG.privacyUrl}"`));
  assert.equal(CONFIG.privacyUrl, 'https://ligant.ai/privacy');
  assert.doesNotMatch(footer, /no data is transmitted|no analytics scripts|no third.party code/);
});
