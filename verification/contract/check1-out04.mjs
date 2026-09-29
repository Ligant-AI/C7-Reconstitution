// Check 1 (C7-OUT-04, acceptance 4): walk every field C7-OUT-04 enumerates, independently
// of validateResultObject, over representative inputs; then run validateResultObject.
// Run from the C7 root: node verification/contract/check1-out04.mjs
import { determine } from '../../src/engine/determine.js';
import { validateResultObject } from '../../src/shared/result-object.js';
import { FIXTURES } from '../../tests/fixtures.js';
import { c1With } from '../../tests/c1-fixture.js';

const byId = (id) => FIXTURES.find((f) => f.id === id).input;
const c1A = c1With('assembled');
const cases = [
  ['C7-FX-06a (upper bound, target dir.)', byId('C7-FX-06a')],
  ['C7-FX-06b (upper bound, 1.00 mL entered)', byId('C7-FX-06b')],
  ['C7-FX-06c (upper bound, 0.942 mL entered)', byId('C7-FX-06c')],
  ['C7-FX-06d (upper bound, 1.0044 mg)', byId('C7-FX-06d')],
  ['C7-FX-06e (activity, uncorrected)', byId('C7-FX-06e')],
  ['C7-FX-01 (achieved)', byId('C7-FX-01')],
  ['C7-FX-08 (capacity declared)', byId('C7-FX-08')],
  ['C7-FX-08v (obtained)', byId('C7-FX-08v')],
  ['C7-FX-13b (final entered)', byId('C7-FX-13b')],
  ['C7-FX-13d (final entered, no solids)', byId('C7-FX-13d')],
  ['C7-FX-09-r7t (molar target, reported)', byId('C7-FX-09-r7t')],
  ['C7-FX-09-r8m (molar of protein)', byId('C7-FX-09-r8m')],
  ['C7-FX-09-r9t (C1 flag carried)', byId('C7-FX-09-r9t')],
  ['C7-FX-09-r11m (molar withheld)', byId('C7-FX-09-r11m')],
  ['C7-FX-09-r1m (molar withheld, total contents)', byId('C7-FX-09-r1m')],
  ['constructed: FX-06a + C1 assembled + molar form (bound in molar)', { ...byId('C7-FX-06a'), c1: c1A, molarUnit: 'µM' }],
  ['constructed: FX-08 with min transfer entered 5 µL', { ...byId('C7-FX-08'), minTransfer: { value: '5', unit: 'µL' }, minTransferEntered: true }],
  ['C7-FX-09-r10t (rejected)', byId('C7-FX-09-r10t')],
];

const isQ = (x) => x && typeof x.display === 'string' && typeof x.unit === 'string' && x.unit !== '' && typeof x.unrounded === 'number';
function unitsEverywhere(o, path = '', out = []) {
  if (!o || typeof o !== 'object') return out;
  if (Array.isArray(o)) { o.forEach((v, i) => unitsEverywhere(v, `${path}[${i}]`, out)); return out; }
  if ('display' in o && typeof o.display === 'string' && !('unit' in o) && !('ratioOf' in o) && !/%/.test(o.display)) out.push(path);
  if ('value' in o && typeof o.value === 'number' && !('unit' in o) && !/threshold|materialThreshold/.test(path)) out.push(path);
  for (const [k, v] of Object.entries(o)) if (k !== 'importedC1') unitsEverywhere(v, path ? `${path}.${k}` : k, out);
  return out;
}

function fields(r, input) {
  const d = r.declarations, rows = [];
  const add = (name, ok, where) => rows.push({ name, ok: !!ok, where });
  add('stated content with unit', d.content?.value && d.content?.unit, 'declarations.content');
  add('whole-vial confirmation', d.wholeVial?.confirmed === true, 'declarations.wholeVial');
  add('content basis', d.contentBasis?.value, 'declarations.contentBasis');
  add('content provenance', d.contentProvenance?.value, 'declarations.contentProvenance');
  const massBased = d.content?.dimension === 'mass';
  add('conjugate declaration (mass-based)', !massBased || d.conjugate?.value, 'declarations.conjugate');
  add('carrier declaration', d.carrier?.value, 'declarations.carrier');
  add('direction and volume basis', d.direction?.value && d.volumeBasis?.value, 'declarations.direction/.volumeBasis');
  add('both volumes, with units', isQ(r.volumes?.diluent) && isQ(r.volumes?.final), 'volumes.diluent/.final');
  const finalEntered = d.direction.value === 'volume' && d.volumeBasis.value === 'final';
  add('achieved final beside entered final', !finalEntered || isQ(r.volumes.enteredFinal) || (r.volumes.enteredFinal && typeof r.volumes.enteredFinal.unit === 'string'), 'volumes.enteredFinal');
  const disp = r.displacement;
  add('displacement treatment', disp?.treatment, 'displacement.treatment');
  if (disp.treatment === 'computed') add('displacement value and fraction', isQ(disp.computed?.D) && typeof disp.computed?.f?.unrounded === 'number', 'displacement.computed.D/.f');
  else add('not computable, with reason', disp.notComputable?.reason, 'displacement.notComputable.reason');
  if (disp.treatment === 'reagent-own-volume-only') add('Dmin where applied (value, unit, fraction)', isQ(disp.Dmin) && disp.Dmin.applied === true && typeof disp.Dmin.fmin?.unrounded === 'number', 'displacement.Dmin');
  const c = r.concentration.reported;
  add('reported concentration with label and unit', isQ(c) && ['achieved', 'obtained', 'at-most', 'uncorrected-for-displacement'].includes(c.label), `concentration.reported (label ${c.label})`);
  const expLabel = disp.treatment === 'reagent-own-volume-only' ? 'at-most' : disp.treatment === 'not-computable-uncorrected' ? 'uncorrected-for-displacement' : d.direction.value === 'volume' && d.volumeBasis.value === 'diluent' ? 'obtained' : 'achieved';
  add(`label is the one C7-DT-07 requires (${expLabel})`, c.label === expLabel, 'concentration.reported.label');
  if (c.label === 'at-most') {
    add('upper bound: reason and §11 assumptions', r.concentration.upperBound?.isUpperBound === true && r.concentration.upperBound.reason && r.concentration.upperBound.assumptions?.length > 0, 'concentration.upperBound');
    add('bound rounding direction stated (decision item 6): conc up', c.rounding === 'up', 'concentration.reported.rounding');
    add('bound rounding direction stated: final "at least" down', r.volumes.final.rounding === 'down' && r.volumes.final.isLowerBound === true, 'volumes.final.rounding');
  }
  add('target where entered', d.direction.value !== 'target' || (isQ(r.target) && r.target.entered), 'target');
  add('min transfer + entered/default', d.minTransfer?.value && d.minTransfer?.unit && ['entered', 'default'].includes(d.minTransfer.source), `declarations.minTransfer (source ${d.minTransfer?.source})`);
  add('declared vial capacity where given', input.capacity ? (d.capacity?.declared === true && d.capacity.value && d.capacity.unit) : d.capacity?.declared === false, 'declarations.capacity');
  add('engine version', /^\d+\.\d+\.\d+$/.test(r.tool?.engineVersion || ''), 'tool.engineVersion');
  const U = r.unrounded || {};
  const need = ['VdPrime', 'Fa', 'Ca'].concat(disp.treatment === 'computed' ? ['D', 'f'] : []).concat(disp.treatment === 'reagent-own-volume-only' ? ['Dmin', 'fmin'] : []).concat(d.direction.value === 'target' ? ['target'] : []);
  add(`unrounded values (${need.join(',')})`, need.every((k) => U[k] !== null && U[k] !== undefined), 'unrounded.*');
  add('every flag with reason code', r.flags.every((f) => /^C7-FL-\d\d$/.test(f.code) && f.message), `flags [${r.flags.map((f) => f.code).join(',')}]`);
  if (input.c1) {
    add('embedded C1 object, in full', JSON.stringify(r.importedC1) === JSON.stringify(input.c1.payload), 'importedC1');
    const m = r.concentration.molar;
    if (m && m.status === 'reported') {
      add('molar form: unit, unrounded, molarity-of', m.unit && typeof m.unrounded === 'number' && m.molarityOf, 'concentration.molar');
      if (c.label === 'at-most') add('molar form of a bound: labelled at most, rounded up (decision item 1)', m.label === 'at-most' && m.rounding === 'up', `concentration.molar (label ${m.label}, rounding ${m.rounding})`);
    } else if (m) add('molar withheld with reason and bases', m.status === 'withheld' && m.reason && m.bases, 'concentration.molar');
    if (input.c1.flags.length) add('C1 flags restated (C7-FL-10)', r.flags.some((f) => f.code === 'C7-FL-10'), 'flags');
  }
  const noUnit = unitsEverywhere(r);
  add('units attached to every quantity (walk)', noUnit.length === 0, noUnit.length ? `missing: ${noUnit.join(', ')}` : 'whole object');
  return rows;
}

let fails = 0;
for (const [name, input] of cases) {
  const r = determine(input);
  const v = validateResultObject(r);
  console.log(`\n## ${name}\nstatus=${r.status} validateResultObject=${v.length ? 'FAIL ' + JSON.stringify(v) : 'pass'}`);
  if (v.length) fails++;
  if (r.status !== 'result') { console.log(`rejections: ${r.rejections.map((x) => x.code).join(',')}`); continue; }
  for (const row of fields(r, input)) { if (!row.ok) fails++; console.log(`${row.ok ? 'ok  ' : 'FAIL'} ${row.name} — ${row.where}`); }
  console.log(`display: diluent ${r.volumes.diluent.display} ${r.volumes.diluent.unit}; final ${r.volumes.final.display} (${r.volumes.final.label ?? ''}); conc ${r.concentration.reported.display} ${r.concentration.reported.unit} [${r.concentration.reported.label}]${r.concentration.molar?.status === 'reported' ? `; molar ${r.concentration.molar.display} ${r.concentration.molar.unit} [${r.concentration.molar.label}, ${r.concentration.molar.rounding}]` : r.concentration.molar ? `; molar ${r.concentration.molar.status}` : ''}`);
}
console.log(`\nTOTAL FAILURES: ${fails}`);
