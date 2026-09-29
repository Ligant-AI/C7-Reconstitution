// Writes verification/cases.json: every §10 fixture and invariance case, plus
// any cases the adversarial tester has added in verification/adversarial/cases.json.
// Inputs only — no expected values — so a clean-room implementation learns
// nothing about the engine's answers from it.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { FIXTURES, T, V } from '../tests/fixtures.js';
import { IV_CASES } from '../tests/invariance.js';
import { MATERIAL_THRESHOLD } from '../src/engine/constants.js';
import { toProtocolCase } from './engine-adapter.mjs';

const here = (p) => new URL(p, import.meta.url);
const th = MATERIAL_THRESHOLD.value;
const cases = FIXTURES.map((f) => toProtocolCase(f.input, f.id, th));
IV_CASES.forEach((c, i) => {
  const s = c.solids ? { totalSolids: { value: c.solids, unit: 'mg' } } : {};
  cases.push(toProtocolCase(T({ content: { value: c.content, unit: 'mg' }, ...s, target: { value: c.target, unit: 'mg/mL' } }), `IV-${i}-target`, th));
  cases.push(toProtocolCase(V({ content: { value: c.content, unit: 'mg' }, ...s, volume: { value: '1370', unit: 'µL' }, volumeBasis: 'final', reportUnit: 'µg/mL' }), `IV-${i}-final-µL`, th));
  cases.push(toProtocolCase(V({ content: { value: c.content, unit: 'mg' }, ...s, volume: { value: '713', unit: 'µL' }, reportUnit: 'ng/mL' }), `IV-${i}-diluent-µL`, th));
});
const extra = here('./adversarial/cases.json');
if (existsSync(extra)) for (const c of JSON.parse(readFileSync(extra, 'utf8'))) cases.push({ threshold: th, ...c });
writeFileSync(here('./cases.json'), `${JSON.stringify(cases, null, 1)}\n`);
// The builder's own cases only, for the harness self-test against the same-author reimpl/.
writeFileSync(here('./builder-cases.json'), `${JSON.stringify(cases.filter((c) => !String(c.id).startsWith('ADV-')), null, 1)}\n`);
console.log(`wrote ${cases.length} cases to verification/cases.json`);
