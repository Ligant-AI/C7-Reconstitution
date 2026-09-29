// Check 4 (C7-ST-02, C7-ST-08, CR-C3-01, CR-C3-02): what C3 (commit 59aed26) does with C7's stock today.
import { determine } from '../../src/engine/determine.js';
import { encodeEnvelope } from '../../src/shared/transport.js';
import { FIXTURES } from '../../tests/fixtures.js';
import { parseSharedObject } from '../../../C3-Dilution-Planner/src/import/shared-import.js';
import { planDilution } from '../../../C3-Dilution-Planner/src/engine/plan.js';

const fx06a = determine(FIXTURES.find((f) => f.id === 'C7-FX-06a').input);
const act = determine(FIXTURES.find((f) => f.id === 'C7-FX-07a').input);
const env = encodeEnvelope('c7-stock', fx06a);
const cases = {
  'base64url c7-stock envelope (what "Copy stock envelope" writes, app.js:215)': env,
  'the same envelope as JSON text': JSON.stringify({ v: 1, kind: 'c7-stock', payload: fx06a, checksum: 'x' }),
  'bare C7 FX-06a object (at most 79.9681 mg/mL)': JSON.stringify(fx06a),
  'bare C7 activity object (IU/mL)': JSON.stringify(act),
  'bare C7 object with tool coerced to the string "C1" (probe only)': JSON.stringify({ ...fx06a, tool: 'C1' }),
};
for (const [k, v] of Object.entries(cases)) { const r = parseSharedObject(v); console.log(`${k}\n  -> ${r.error ? 'REFUSED: ' + r.error : 'ACCEPTED as ' + r.tool + ' fields=' + JSON.stringify(r.fields)}`); }

const base = { stockProvenance: 'c7', stockAvailable: null, stockFormulation: '', targetProvenance: 'user', targetOrigin: null, volume: { value: '100', unit: 'µL' }, basis: 'final', route: null, diluent: { name: 'PBS' }, minTransfer: { value: '2', unit: 'µL' }, maxTransfer: null, capacity: null };
console.log('\n== manual route: C7 bound typed into C3 with provenance "computed by C7" (plan.js:81)');
const p = planDilution({ ...base, stock: { value: fx06a.concentration.reported.display, unit: 'mg/mL' }, target: { form: 'single', value: '10', unit: 'mg/mL' } });
const pt = p.vessels.find((v) => v.kind === 'point');
const txt = JSON.stringify(p);
console.log(`status=${p.status}; point ${pt.label} achieved ${pt.concentration.achieved.display} ${pt.concentration.achieved.unit}; bound=${JSON.stringify(pt.concentration.bound)}; "at most" anywhere in object: ${/at most|at-most|upperBound|isUpperBound/i.test(txt)}; stock provenance ${JSON.stringify(p.declarations.stock.provenance)}`);
console.log('\n== CR-C3-02: activity stock');
for (const unit of ['IU/mL', 'U/mL']) {
  let out;
  try { const r = planDilution({ ...base, stock: { value: '10000', unit }, target: { form: 'single', value: '100', unit } }); out = `status=${r.status} incomplete=${JSON.stringify(r.incomplete)} rejections=${JSON.stringify(r.rejections.map((x) => x.code + ': ' + x.message))}`; }
  catch (e) { out = `THREW: ${e.message}`; }
  console.log(`${unit}: ${out}`);
}
