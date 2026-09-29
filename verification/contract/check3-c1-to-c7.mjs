// Check 3 (C7-ST-01). Part A: what C1 actually hands over today (its copy button's toJson text) through C7's decodeEnvelope.
// Part B (SUPPLEMENTARY, SIMULATED C1 WRITER — does NOT discharge C7-ST-01): real C1 objects, produced by C1's own
// compute+serialise, wrapped by C7's encodeEnvelope, then decodeEnvelope + readC1 + determine over every §8 row.
import { realC1 } from './build/gen-c1.mjs';
import { encodeEnvelope, decodeEnvelope, readC1 } from '../../src/shared/transport.js';
import { determine } from '../../src/engine/determine.js';
import { validateResultObject } from '../../src/shared/result-object.js';

console.log('== Part A: C1 bare JSON (what C1 cc60a5c emits: App.tsx:570 copyToClipboard(toJson(result)))');
const bare = JSON.stringify(realC1('assembled').obj, null, 2);
const a = decodeEnvelope(bare, 'c1-conversion');
console.log(`decodeEnvelope(bare C1 JSON) -> ok=${a.ok} failure=${a.failure}`);

console.log('\n== Part B (simulated writer): §8 rows with real C1 objects');
const base = { provenance: 'coa', carrier: 'absent', wholeVial: true, minTransfer: { value: '2', unit: 'µL' }, content: { value: '0.25', unit: 'mg' }, totalSolids: { value: '1.3', unit: 'mg' } };
const imp = (massBasis, mw = 148.3) => {
  const { obj, problems } = realC1(massBasis, { mw });
  if (problems.length) throw new Error('C1 own validation failed');
  const d = decodeEnvelope(encodeEnvelope('c1-conversion', obj), 'c1-conversion');
  if (!d.ok) throw new Error(d.failure);
  const r = readC1(d.payload);
  if (!r.ok) throw new Error(r.message);
  return { c1: r.c1, obj };
};
// [row, C1 mass basis, contentBasis, conjugate, content unit override]
const rows = [
  [1, 'assembled', 'total-vial-contents', 'none'],
  [2, 'assembled', 'not-recorded', 'none'],
  [3, 'assembled', 'reagent-activity', null, { value: '1000000', unit: 'IU' }],
  [4, 'assembled', 'reagent-alone', 'not-recorded'],
  [5, 'not-recorded', 'reagent-alone', 'none'],
  [6, 'monomer', 'reagent-alone', 'none'],
  [7, 'assembled', 'reagent-alone', 'none'],
  [8, 'assembled', 'reagent-alone', 'protein'],
  [9, 'conjugate', 'reagent-alone', 'conjugate'],
  [10, 'conjugate', 'reagent-alone', 'none'],
  [10, 'conjugate', 'reagent-alone', 'protein'],
  [11, 'assembled', 'reagent-alone', 'conjugate'],
];
const permitted = new Set([7, 8, 9]);
let bad = 0;
for (const [row, mb, cb, conj, contentOverride] of rows) {
  const { c1, obj } = imp(mb);
  const activity = !!contentOverride;
  const common = { ...base, contentBasis: cb, ...(conj ? { conjugate: conj } : {}), ...(contentOverride ? { content: contentOverride, totalSolids: undefined } : {}), c1, direction: 'target', volumeBasis: 'diluent' };
  const molarT = determine({ ...common, target: { value: '1', unit: 'µM' } });
  const massT = determine({ ...common, target: activity ? { value: '10000', unit: 'IU/mL' } : { value: '0.5', unit: 'mg/mL' }, molarUnit: 'µM' });
  const expMolar = permitted.has(row) ? 'result' : 'rejected';
  const m = massT.concentration?.molar;
  const expForm = permitted.has(row) ? 'reported' : 'withheld';
  const c1Codes = obj.flags.map((f) => f.code);
  const fl10 = massT.flags.find((f) => f.code === 'C7-FL-10');
  const restated = c1Codes.every((c) => fl10 && fl10.message.includes(c));
  const embedded = JSON.stringify(massT.importedC1) === JSON.stringify(obj);
  const valid = validateResultObject(massT).length === 0 && validateResultObject(molarT).length === 0;
  const ok = molarT.status === expMolar && (activity ? true : m?.status === expForm) && (c1Codes.length === 0 || restated) && embedded && valid && (expMolar === 'result' || molarT.rejections.some((x) => x.code === 'C7-HI-04'));
  if (!ok) bad++;
  console.log(`row ${String(row).padEnd(2)} C1=${mb.padEnd(12)} basis=${cb.padEnd(19)} conj=${String(conj).padEnd(12)} | molar target: ${molarT.status}${molarT.status === 'rejected' ? ' ' + molarT.rejections.map((x) => x.code).join(',') : ` ${molarT.concentration.molar?.display} ${molarT.concentration.molar?.unit}`} | mass target: ${massT.status}, molar form ${m ? m.status : 'none'}${m?.pairingRow ? ` (row ${m.pairingRow})` : ''}${m?.molarityOf ? `, of ${m.molarityOf}` : ''}${m?.reason ? `, "${m.reason}"` : ''} | C1 flags [${c1Codes}] restated=${c1Codes.length ? restated : 'n/a'} | embedded-in-full=${embedded} | valid=${valid} | ${ok ? 'AS TABULATED' : 'MISMATCH'}`);
}
// bound + molar with a real C1 object
const { c1 } = imp('assembled');
const b = determine({ provenance: 'coa', carrier: 'absent', wholeVial: true, minTransfer: { value: '2', unit: 'µL' }, contentBasis: 'reagent-alone', conjugate: 'none', content: { value: '80', unit: 'mg' }, target: { value: '80', unit: 'mg/mL' }, direction: 'target', volumeBasis: 'diluent', c1, molarUnit: 'µM' });
console.log(`\nFX-06a + real C1 (assembled): conc ${b.concentration.reported.display} [${b.concentration.reported.label}, ${b.concentration.reported.rounding}]; molar ${b.concentration.molar.display} ${b.concentration.molar.unit} [${b.concentration.molar.label}, ${b.concentration.molar.rounding}]; valid=${validateResultObject(b).length === 0}; embedded-in-full=${JSON.stringify(b.importedC1) === JSON.stringify(realC1('assembled').obj)}`);
console.log(`\nMISMATCHES: ${bad}`);
