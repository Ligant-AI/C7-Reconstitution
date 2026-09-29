// The shipped engine as a black box: protocol cases on stdin, protocol results
// on stdout (verification/PROTOCOL.md). Lets agents that must not read src/
// execute it.   node verification/run-engine.mjs < cases.json > results.json
import { readFileSync } from 'node:fs';
import { runEngine } from './engine-adapter.mjs';
import { MATERIAL_THRESHOLD } from '../src/engine/constants.js';
const cases = JSON.parse(readFileSync(0, 'utf8'));
process.stdout.write(JSON.stringify(cases.map((c, i) => runEngine({ threshold: MATERIAL_THRESHOLD.value, id: c.id ?? `case-${i}`, ...c }))));
