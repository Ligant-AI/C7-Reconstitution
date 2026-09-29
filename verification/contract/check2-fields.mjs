// Check 2: flatten one real object per tool to path -> type, and report
// (a) identical paths whose type differs across tools, (b) identical paths whose value vocabulary differs,
// (c) the same key name used with different types at different paths.
// Run from verification/contract after the bundles in build/ exist.
import { determine } from '../../src/engine/determine.js';
import { FIXTURES } from '../../tests/fixtures.js';
import { realC1 } from './build/gen-c1.mjs';
import * as c4 from './build/gen-c4.mjs';
import { planDilution } from '../../../C3-Dilution-Planner/src/engine/plan.js';

const c1obj = realC1('conjugate').obj;
const c4obj = c4.toStructuredResult(c4.computeSeries({ stock: { kind: 'stated', concentration: { value: 0.2, unit: 'mg/mL' }, massBasis: 'antibody-protein' }, stockSource: 'certificate-of-analysis', vendor: { basis: 'none' }, stainingVolume: { value: 100, unit: 'uL' }, cellNumber: { value: 1, unit: 'cells-1e6' }, pipettingMinimum: { value: 2, provenance: 'entered' }, topPoint: { form: 2, value: 1 }, dilutionFactor: 2, points: 3, imported: { gPerMol: 148300, provenance: 'certificate-of-analysis', massBasis: 'conjugate', flags: c1obj.flags, toolVersion: '0.5.0' } }));
const c3obj = planDilution({ stock: { value: '1', unit: 'mg/mL' }, stockProvenance: 'c7', stockAvailable: null, stockFormulation: '', target: { form: 'single', value: '10', unit: 'µg/mL' }, targetProvenance: 'user', targetOrigin: null, volume: { value: '100', unit: 'µL' }, basis: 'final', route: null, diluent: { name: 'PBS' }, minTransfer: { value: '2', unit: 'µL' }, maxTransfer: null, capacity: null });
const c1a = { ...FIXTURES.find((f) => f.id === 'C7-FX-06a').input };
const c7obj = determine(c1a);

const T = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);
function flat(o, p = '', out = new Map()) {
  out.set(p || '(root)', T(o));
  if (o && typeof o === 'object') {
    if (Array.isArray(o)) { if (o.length) flat(o[0], `${p}[]`, out); }
    else for (const [k, v] of Object.entries(o)) flat(v, p ? `${p}.${k}` : k, out);
  }
  return out;
}
const tools = { C1: flat(c1obj), C3: flat(c3obj), C4: flat(c4obj), C7: flat(c7obj) };
const allPaths = new Set(Object.values(tools).flatMap((m) => [...m.keys()]));
console.log('== (a) same path, more than one tool, type differs');
for (const p of [...allPaths].sort()) {
  const have = Object.entries(tools).filter(([, m]) => m.has(p));
  if (have.length < 2) continue;
  const types = new Set(have.map(([, m]) => m.get(p)));
  if (types.size > 1) console.log(`${p}: ${have.map(([t, m]) => `${t}=${m.get(p)}`).join('  ')}`);
}
console.log('\n== (a2) same path, more than one tool (top two levels), for inspection');
for (const p of [...allPaths].sort()) {
  if (p.split('.').length > 2) continue;
  const have = Object.entries(tools).filter(([, m]) => m.has(p));
  if (have.length >= 2) console.log(`${p}: ${have.map(([t]) => t).join(',')}`);
}
console.log('\n== (b) scalar vocabularies at shared paths');
const get = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : k.endsWith('[]') ? a[k.slice(0, -2)]?.[0] : a[k]), o);
for (const p of ['schema', 'schema.name', 'schema.version', 'schemaVersion', 'tool', 'tool.id', 'engineVersion', 'tool.engineVersion', 'status', 'scope', 'statements.scope', 'displayed.roundingMode', 'precision.rounding', 'flags[].scope', 'flags[].kind']) {
  console.log(`${p}: ${Object.entries({ C1: c1obj, C3: c3obj, C4: c4obj, C7: c7obj }).map(([t, o]) => `${t}=${JSON.stringify(get(o, p))?.slice(0, 70)}`).join('  ')}`);
}
console.log('\n== (c) same key name, different types, anywhere');
const byKey = new Map();
for (const [t, m] of Object.entries(tools)) for (const [p, ty] of m) { const k = p.split('.').pop().replace('[]', ''); if (!byKey.has(k)) byKey.set(k, []); byKey.get(k).push(`${t}:${p}=${ty}`); }
for (const [k, list] of [...byKey].sort()) {
  const ts = new Set(list.map((s) => s.split('=').pop()));
  const toolsUsing = new Set(list.map((s) => s.split(':')[0]));
  if (ts.size > 1 && toolsUsing.size > 1 && ['value', 'unit', 'schema', 'tool', 'massBasis', 'concentration', 'bound', 'scope', 'target', 'provenance', 'relations', 'precision', 'displayed', 'status', 'flags', 'declarations', 'imported', 'label', 'source'].includes(k)) console.log(`${k}: ${list.slice(0, 14).join(' | ')}`);
}
console.log('\n== unit spellings seen');
for (const [t, o] of Object.entries({ C1: c1obj, C3: c3obj, C4: c4obj, C7: c7obj })) { const s = new Set(); JSON.stringify(o, (k, v) => { if (k === 'unit' && typeof v === 'string') s.add(v); return v; }); console.log(t, [...s].join(' ')); }
