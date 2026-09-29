// Checks the independently authored fixtures (verification/fixtures/expected.json,
// written by the c7-fixture-author agent from the URS alone) against the engine.
//   node verification/check-fixtures.mjs
// Each entry: { id, construction, case: <protocol case>, expect: { status, rejections?, flags?, label?,
//   treatment?, molar?, displayed?: { diluent?, final?, concentration? }, extended?: <any subset of
//   PROTOCOL.md's extended block>, handDerivation } }
// Only the fields an entry states are compared. A mismatch is a finding against
// the engine AND the fixture until the URS decides which is wrong.
import { readFileSync, writeFileSync } from 'node:fs';
import { runEngine } from './engine-adapter.mjs';
import { MATERIAL_THRESHOLD } from '../src/engine/constants.js';

const file = new URL('./fixtures/expected.json', import.meta.url);
const entries = JSON.parse(readFileSync(file, 'utf8'));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const lines = []; let bad = 0;
for (const e of entries) {
  const r = runEngine({ threshold: MATERIAL_THRESHOLD.value, id: e.id, ...e.case });
  const diffs = [];
  for (const k of ['status', 'rejections', 'flags', 'label', 'treatment', 'molar']) if (e.expect[k] !== undefined && !same(e.expect[k], r[k])) diffs.push(`${k}: expected ${JSON.stringify(e.expect[k])}, engine ${JSON.stringify(r[k])}`);
  for (const [k, v] of Object.entries(e.expect.displayed || {})) if (r.displayed?.[k] !== v) diffs.push(`displayed.${k}: expected ${v}, engine ${r.displayed?.[k]}`);
  // Protocol 2: only the extended fields an entry states are compared — strings,
  // booleans and nulls exactly, numbers within a relative 1e-12 (provisional).
  const sub = (want, got, at) => {
    if (typeof want === 'number') { if (!(typeof got === 'number' && (Object.is(want, got) || Math.abs(want - got) <= 1e-12 * Math.abs(want)))) diffs.push(`extended.${at}: expected ${want}, engine ${got}`); return; }
    if (want && typeof want === 'object') { if (!got || typeof got !== 'object') { diffs.push(`extended.${at}: expected an object, engine ${JSON.stringify(got)}`); return; } for (const k of Object.keys(want)) sub(want[k], got[k], at ? `${at}.${k}` : k); return; }
    if (!same(want, got)) diffs.push(`extended.${at}: expected ${JSON.stringify(want)}, engine ${JSON.stringify(got)}`);
  };
  if (e.expect.extended !== undefined) sub(e.expect.extended, r.extended ?? null, '');
  if (diffs.length) bad++;
  lines.push(`| ${e.id} | ${diffs.length ? 'MISMATCH' : 'agrees'} | ${diffs.join('; ').replace(/\|/g, '\\|') || '—'} |`);
}
const report = `# Independent fixtures against the engine\n\n${entries.length} fixtures from verification/fixtures/expected.json; ${bad} mismatching.\n\n| Fixture | Result | Detail |\n|---|---|---|\n${lines.join('\n')}\n`;
writeFileSync(new URL('./fixtures/check-report.md', import.meta.url), report);
console.log(report);
process.exit(bad ? 1 : 0);
