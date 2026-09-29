// Runs an implementation over verification/cases.json and compares it with the
// shipped engine, per verification/PROTOCOL.md. Writes a report and exits
// non-zero on any disagreement.
//   node verification/compare.mjs --cmd "python3 verification/cleanroom/impl.py" [--out verification/cleanroom/comparison.md]
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { runEngine } from './engine-adapter.mjs';
import { ENGINE_VERSION } from '../src/engine/version.js';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const cmd = arg('--cmd');
const out = arg('--out', 'verification/cleanroom/comparison.md');
if (!cmd) { console.error('usage: --cmd "<implementation command>"'); process.exit(64); }
const PROVISIONAL = 1e-12;
const coreOnly = process.argv.includes('--core-only'); // protocol-1 fields only (the same-author self-test) // relative; provisional until outstanding item 3

const casesArg = arg('--cases');
const cases = casesArg
  ? JSON.parse(readFileSync(casesArg, 'utf8')).map((e) => (e.case ? { id: e.id, ...e.case } : e))
  : JSON.parse(readFileSync(new URL('./cases.json', import.meta.url), 'utf8'));
// PROTOCOL.md: "every case in the file has a complete set of declarations;
// incompleteness is not compared". Adversarial cases can carry incomplete ones
// (e.g. a molar reportUnit); they are excluded here, counted and listed, never
// sent to the implementation.
// A case is also out of scope if any input lies outside PROTOCOL.md's stated
// vocabulary (e.g. the ASCII 'ug' the engine happens to tolerate).
const V = {
  direction: ['target', 'volume'], content: ['µg', 'mg', 'g', 'IU', 'U'], solids: ['µg', 'mg', 'g'], volume: ['mL', 'µL'],
  conc: ['mg/mL', 'µg/mL', 'ng/mL', 'g/L', 'mg/L', 'IU/mL', 'U/mL', 'M', 'mM', 'µM', 'nM', 'pM'], molar: ['M', 'mM', 'µM', 'nM', 'pM'],
  basis: ['reagent-alone', 'total-vial-contents', 'not-recorded'], provenance: ['coa', 'nominal', 'weighed', 'not-recorded'],
  conjugate: ['none', 'protein', 'conjugate', 'not-recorded'], carrier: ['present', 'absent', 'not-recorded'], vb: ['diluent', 'final'],
  c1basis: ['assembled', 'monomer', 'conjugate', 'not-recorded'], mw: ['kDa', 'g/mol'],
};
const NUM = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;
const q = (x, units) => x && typeof x.value === 'string' && NUM.test(x.value) && units.includes(x.unit);
function inProtocol(c) {
  const why = [];
  if (!V.direction.includes(c.direction)) why.push('direction');
  if (!q(c.content, V.content)) why.push('content');
  const mass = c.content && ['µg', 'mg', 'g'].includes(c.content.unit);
  if (mass && !V.basis.includes(c.contentBasis)) why.push('contentBasis');
  if (mass && !V.conjugate.includes(c.conjugate)) why.push('conjugate');
  if (!V.provenance.includes(c.provenance)) why.push('provenance');
  if (!V.carrier.includes(c.carrier)) why.push('carrier');
  if (c.wholeVial !== true) why.push('wholeVial');
  if (!V.vb.includes(c.volumeBasis)) why.push('volumeBasis');
  if (c.totalSolids && !q(c.totalSolids, V.solids)) why.push('totalSolids');
  if (c.direction === 'target' && !q(c.target, V.conc)) why.push('target');
  if (c.direction === 'volume' && (!q(c.volume, V.volume) || !V.conc.includes(c.reportUnit) || V.molar.includes(c.reportUnit))) why.push('volume/reportUnit');
  if (c.molarUnit && !V.molar.includes(c.molarUnit)) why.push('molarUnit');
  if (!q(c.minTransfer, V.volume)) why.push('minTransfer');
  if (c.capacity && !q(c.capacity, V.volume)) why.push('capacity');
  if (c.c1 && (!V.c1basis.includes(c.c1.massBasis) || !V.mw.includes(c.c1.mw?.unit) || !(c.c1.mw?.value > 0) || !Array.isArray(c.c1.flagCodes))) why.push('c1');
  if (typeof c.threshold !== 'number') why.push('threshold');
  return why;
}
const outside = cases.map((c) => [c, inProtocol(c)]).filter(([, w]) => w.length);
const incompleteCases = cases.filter((c) => !inProtocol(c).length && runEngine(c).status === 'incomplete');
const excluded = [...outside.map(([c, w]) => ({ id: c.id, why: `outside PROTOCOL.md: ${w.join(', ')}` })), ...incompleteCases.map((c) => ({ id: c.id, why: 'incomplete declarations' }))];
const excludedIds = new Set(excluded.map((e) => e.id));
const compared = cases.filter((c) => !excludedIds.has(c.id));
const run = spawnSync('sh', ['-c', cmd], { input: JSON.stringify(compared), encoding: 'utf8', maxBuffer: 1 << 28 });
if (run.status !== 0) { console.error(`implementation failed (exit ${run.status}):\n${run.stderr}`); process.exit(1); }
let theirs;
try { theirs = JSON.parse(run.stdout); } catch (e) { console.error(`implementation output is not JSON: ${e.message}`); process.exit(1); }
const byId = new Map(theirs.map((r) => [r.id, r]));

const rows = []; let exact = 0; let within = 0; let values = 0; const disagreements = [];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
for (const c of compared) {
  const mine = runEngine(c);
  const t = byId.get(c.id);
  const diff = [];
  if (!t) { disagreements.push({ id: c.id, what: 'missing from the implementation\'s output' }); continue; }
  if (t.status === 'error') diff.push(`implementation error: ${String(t.message || '').slice(0, 120)}`);
  else if (mine.status !== t.status) diff.push(`status ${mine.status} ≠ ${t.status}`);
  else if (mine.status === 'rejected') { if (!same(mine.rejections, t.rejections)) diff.push(`rejections ${mine.rejections} ≠ ${t.rejections}`); }
  else if (mine.status === 'result') {
    for (const k of ['flags', 'label', 'treatment', 'molar', 'displayed']) if (!same(mine[k], t[k])) diff.push(`${k} ${JSON.stringify(mine[k])} ≠ ${JSON.stringify(t[k])}`);
    // Protocol 2: the extended block. Strings, booleans and nulls exact; numbers bit-exact or within the bound.
    if (!coreOnly) {
      if (t.extended === undefined) diff.push('extended block missing (protocol 1 output)');
      else {
        const walk = (a, b, at) => {
          if (typeof a === 'number' && typeof b === 'number') {
            values++;
            if (Object.is(a, b)) { exact++; return; }
            const rel = Math.abs(a - b) / Math.abs(a);
            if (rel <= PROVISIONAL) { within++; rows.push(`| ${c.id} | extended.${at} | ${a} | ${b} | ${rel.toExponential(2)} |`); } else diff.push(`extended.${at} ${a} ≠ ${b} (rel ${rel.toExponential(2)})`);
            return;
          }
          if (a && b && typeof a === 'object' && typeof b === 'object') {
            for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) walk(a[k], b[k], at ? `${at}.${k}` : k);
            return;
          }
          if (!same(a, b)) diff.push(`extended.${at} ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`);
        };
        walk(mine.extended, t.extended, '');
      }
    }
    for (const [k, a] of Object.entries(mine.unrounded)) {
      const b = t.unrounded?.[k];
      values++;
      if (a === null || b === null || b === undefined) { if (a !== (b ?? null)) diff.push(`${k} ${a} ≠ ${b}`); else exact++; continue; }
      if (Object.is(a, b)) { exact++; continue; }
      const rel = Math.abs(a - b) / Math.abs(a);
      if (rel <= PROVISIONAL) { within++; rows.push(`| ${c.id} | ${k} | ${a} | ${b} | ${rel.toExponential(2)} |`); } else diff.push(`${k} ${a} ≠ ${b} (rel ${rel.toExponential(2)})`);
    }
  }
  if (diff.length) disagreements.push({ id: c.id, what: diff.join('; ') });
}
const report = [
  '# Clean-room comparison', '',
  `Engine ${ENGINE_VERSION} against \`${cmd}\`, over ${cases.length} cases from ${casesArg || 'verification/cases.json'}. Generated by verification/compare.mjs.`, '',
  `- Unrounded values compared: ${values} — bit-exact ${exact}, within the provisional 1 × 10⁻¹² relative bound ${within}.`,
  `- Cases compared: ${compared.length}. Excluded, not compared: ${excluded.length} (listed at the end).`,
  `- Cases disagreeing: **${disagreements.length}**.`, '',
  disagreements.length ? '## Disagreements (a finding against both implementations until the URS decides)\n\n| Case | What differs |\n|---|---|\n' + disagreements.map((d) => `| ${d.id} | ${d.what.replace(/\|/g, '\\|')} |`).join('\n') : 'No disagreements.',
  '', excluded.length ? `## Excluded cases (outside PROTOCOL.md's inputs, or incomplete declarations — not compared)\n\n| Case | Why |\n|---|---|\n${excluded.map((e) => `| ${e.id} | ${e.why} |`).join('\n')}\n` : '',
  '', within ? `## Values within the provisional bound but not bit-exact\n\n| Case | Value | Engine | Implementation | Relative |\n|---|---|---|---|---|\n${rows.join('\n')}` : '',
].join('\n');
writeFileSync(out, `${report}\n`);
console.log(report.split('\n').slice(0, 7).join('\n'));
process.exit(disagreements.length ? 1 : 0);
