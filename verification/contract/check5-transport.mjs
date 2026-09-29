// Check 5: C7 src/shared/transport.js vs C4 src/lib/transport.ts (C4 commit c4d19bd for that file), byte for byte.
import * as c7 from '../../src/shared/transport.js';
import * as c4 from './build/gen-c4.mjs';
import { determine } from '../../src/engine/determine.js';
import { FIXTURES } from '../../tests/fixtures.js';
import { realC1 } from './build/gen-c1.mjs';

const fx06a = determine(FIXTURES.find((f) => f.id === 'C7-FX-06a').input); // contains µ, →, —, ≥ ? checked below
const c1obj = realC1('conjugate').obj;
const reorder = (o) => (o && typeof o === 'object' && !Array.isArray(o) ? Object.fromEntries(Object.entries(o).reverse().map(([k, v]) => [k, reorder(v)])) : Array.isArray(o) ? o.map(reorder) : o);
const payloads = {
  'C7 FX-06a result object': fx06a,
  'C7 FX-06a, keys reversed at every depth': reorder(fx06a),
  'real C1 object (conjugate, C1-FL-08)': c1obj,
  'nested undefined + empty arrays + unicode': { flags: [], a: { b: undefined, c: [], d: 'µL → ≥ — ü 😀' }, n: -0, e: 1e-300, big: 123456789012345680000 },
};
console.log('non-ASCII chars in FX-06a canonical form:', [...new Set([...c7.canonicalise(fx06a)].filter((ch) => ch.charCodeAt(0) > 127))].join(''));
let fail = 0;
for (const [name, p] of Object.entries(payloads)) {
  const canonSame = c7.canonicalise(p) === c4.canonicalise(p);
  const sumSame = c7.checksum(p) === c4.checksum(p);
  const e7 = c7.encodeEnvelope('c1-conversion', p), e4 = c4.encodeEnvelope('c1-conversion', p);
  const d74 = c4.decodeEnvelope(e7, 'c1-conversion'), d47 = c7.decodeEnvelope(e4, 'c1-conversion');
  const rt = JSON.stringify(d74.payload) === JSON.stringify(JSON.parse(JSON.stringify(p))) && JSON.stringify(d47.payload) === JSON.stringify(JSON.parse(JSON.stringify(p)));
  // one-byte tamper inside the payload: flip one base64url char in the middle
  const i = Math.floor(e7.length / 2); const t = e7.slice(0, i) + (e7[i] === 'A' ? 'B' : 'A') + e7.slice(i + 1);
  const t7 = c7.decodeEnvelope(t, 'c1-conversion'), t4 = c4.decodeEnvelope(t, 'c1-conversion');
  const ok = canonSame && sumSame && e7 === e4 && d74.ok && d47.ok && rt && !t7.ok && !t4.ok;
  if (!ok) fail++;
  console.log(`${name}: canonical identical=${canonSame}; checksum C7=${c7.checksum(p)} C4=${c4.checksum(p)}; envelope bytes identical=${e7 === e4} (${e7.length} chars); C7->C4 decode ok=${d74.ok}; C4->C7 decode ok=${d47.ok}; payload round-trips=${rt}; one-char tamper: C7 ${t7.ok ? 'ACCEPTED' : t7.failure}, C4 ${t4.ok ? 'ACCEPTED' : t4.rejection.failure}`);
}
// strip-the-flags tamper (C4-ST-01 / C7-ST-01)
const stripped = { v: 1, kind: 'c1-conversion', payload: { ...c1obj, flags: undefined }, checksum: c4.checksum(c1obj) };
const sEnc = Buffer.from(JSON.stringify(stripped)).toString('base64url');
console.log(`flags removed after checksumming: C7 ${c7.decodeEnvelope(sEnc, 'c1-conversion').failure}, C4 ${c4.decodeEnvelope(sEnc, 'c1-conversion').rejection.failure}`);
const noFlags = c4.encodeEnvelope('c1-conversion', { ...c1obj, flags: undefined });
console.log(`built without flags (checksum valid): C7 ${c7.decodeEnvelope(noFlags, 'c1-conversion').failure}, C4 ${c4.decodeEnvelope(noFlags, 'c1-conversion').rejection.failure}`);
console.log('\n== non-wire differences');
const s7 = c7.encodeEnvelope('c7-stock', fx06a);
const k4 = c4.decodeEnvelope(s7, 'c7-stock');
console.log(`C7 c7-stock envelope read by C4 decodeEnvelope(…, 'c7-stock'): ok=${k4.ok}${k4.ok ? '' : ' ' + k4.rejection.failure} (C4 EnvelopeKind is 'c1-conversion' | 'c4-series' only; TypeScript would refuse the call)`);
console.log(`C7 c7-stock envelope read by C4 as 'c1-conversion' (the only kind C4's App.tsx:210-212 asks for): ${c4.decodeEnvelope(s7, 'c1-conversion').rejection?.failure}`);
console.log(`C7 decoder accepts full URL: ${c7.decodeEnvelope('https://x/#c1=' + c4.encodeEnvelope('c1-conversion', c1obj), 'c1-conversion').ok}; C4 decoder given the full URL: ${c4.decodeEnvelope('https://x/#c1=' + c4.encodeEnvelope('c1-conversion', c1obj), 'c1-conversion').ok} (C4's App strips #c1= itself)`);
console.log(`C7 decoder accepts raw envelope JSON: ${c7.decodeEnvelope(JSON.stringify({ v: 1, kind: 'c1-conversion', payload: c1obj, checksum: c4.checksum(c1obj) }), 'c1-conversion').ok}; C4: ${c4.decodeEnvelope(JSON.stringify({ v: 1, kind: 'c1-conversion', payload: c1obj, checksum: c4.checksum(c1obj) }), 'c1-conversion').ok}`);
console.log(`rejection shape: C7 ${JSON.stringify(Object.keys(c7.decodeEnvelope('x', 'c1-conversion')))}  C4 ${JSON.stringify(Object.keys(c4.decodeEnvelope('x', 'c1-conversion')))}`);
console.log(`\nWIRE FAILURES: ${fail}`);
