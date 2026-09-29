// Standing verification rule 3 (verification/README.md), shown capable of
// failing: a second implementation that crashes on a case must be counted as a
// disagreement, never as agreement — even when every other answer is perfect.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dir = mkdtempSync(path.join(tmpdir(), 'c7-harness-'));
const cases = JSON.parse(readFileSync(path.join(root, 'verification/builder-cases.json'), 'utf8')).slice(0, 6);
const casesFile = path.join(dir, 'cases.json');
writeFileSync(casesFile, JSON.stringify(cases));

// A "perfect" implementation: the engine itself, via the black-box runner — except that
// on one chosen case it reports a crash, or disguises the crash as a status.
function fake(mode) {
  const f = path.join(dir, `fake-${mode}.mjs`);
  writeFileSync(f, `
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const input = readFileSync(0, 'utf8');
const out = JSON.parse(spawnSync('node', [${JSON.stringify(path.join(root, 'verification/run-engine.mjs'))}], { input, encoding: 'utf8' }).stdout);
const i = 2;
if (${JSON.stringify(mode)} === 'error') out[i] = { id: out[i].id, status: 'error', message: 'ZeroDivisionError (injected)' };
if (${JSON.stringify(mode)} === 'masked') out[i] = { id: out[i].id, status: 'not-representable', rejections: [] };
process.stdout.write(JSON.stringify(out));
`);
  return f;
}
const compare = (impl) => {
  const out = path.join(dir, `report-${path.basename(impl)}.md`);
  const r = spawnSync('node', [path.join(root, 'verification/compare.mjs'), '--cmd', `node ${impl}`, '--cases', casesFile, '--out', out], { encoding: 'utf8', cwd: root });
  return { status: r.status, report: readFileSync(out, 'utf8') };
};

test('rule 3: the harness agrees with a perfect implementation', () => {
  const r = compare(fake('none'));
  assert.equal(r.status, 0);
  assert.match(r.report, /Cases disagreeing: \*\*0\*\*/);
});

test('rule 3: an injected crash is counted as a disagreement, not as agreement', () => {
  const r = compare(fake('error'));
  assert.equal(r.status, 1);
  assert.match(r.report, /Cases disagreeing: \*\*1\*\*/);
  assert.match(r.report, /implementation error: ZeroDivisionError \(injected\)/);
});

test('rule 3: a crash disguised as "not-representable" is still a disagreement where the engine computes', () => {
  const r = compare(fake('masked'));
  assert.equal(r.status, 1);
  assert.match(r.report, /status result ≠ not-representable/);
});
