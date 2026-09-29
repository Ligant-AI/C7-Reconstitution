// The shared transport (C7-ST-01, C7-ST-03): a URL-fragment envelope carrying
// a result object, with an FNV-1a integrity check over its canonical form.
//
// This is the mechanism specified for C1 → C4 and C4 → C3
// (C4-Antibody-Titration-Planner/src/lib/transport.ts, open item 9), ported
// line for line so that an envelope written by one tool reads in another. The
// fragment is the one part of a URL a browser never transmits, and nothing is
// written to storage (C7-ST-07).
//
// THE CHECK IS INTEGRITY, NOT AUTHENTICITY. It detects an object that arrived
// truncated, corrupted or with fields — including its flags — removed. It
// cannot detect a deliberate edit, since there is no server and no secret.

const FNV_OFFSET = 0xcbf29ce484222325n;
const FNV_PRIME = 0x100000001b3n;
const MASK_64 = 0xffffffffffffffffn;

/** Canonical JSON: keys sorted at every depth; arrays keep their order. */
export function canonicalise(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonicalise).join(',')}]`;
  const entries = Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalise(v)}`).join(',')}}`;
}

export function checksum(value) {
  const bytes = new TextEncoder().encode(canonicalise(value));
  let hash = FNV_OFFSET;
  for (const byte of bytes) hash = ((hash ^ BigInt(byte)) * FNV_PRIME) & MASK_64;
  return hash.toString(16).padStart(16, '0');
}

function toBase64Url(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(encoded) {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

export function encodeEnvelope(kind, payload) {
  return toBase64Url(JSON.stringify({ v: 1, kind, payload, checksum: checksum(payload) }));
}

const MESSAGES = {
  'not-decodable': 'The imported object could not be decoded. The link is incomplete or was altered in transit; ask for it again rather than repairing it by hand.',
  'not-an-envelope': 'The imported data is not a result object from this tool set. It carries no envelope and no integrity check, so there is nothing to check it against; a bare object pasted without its envelope is not accepted.',
  'unsupported-version': 'The imported object uses a transport version this tool does not read. The tool that produced it is newer than this one.',
  'wrong-kind': 'The imported object is not of the kind this tool expected. A C1 molecular weight was expected and something else arrived.',
  'checksum-mismatch': 'The imported object failed its integrity check: it was truncated, corrupted, or had fields removed after it was produced. It has not been used. This check detects accidental damage; it cannot detect a deliberate edit, because anyone editing the object can recompute the check.',
  'flags-missing': 'The imported object carries no flag list at all. An absent list is not the same as an empty one, and a value that arrived stripped of what qualifies it cannot be accepted.',
};

/** Decode and check. Accepts a full link with #c1=…, the fragment, the encoded envelope, or envelope JSON. */
export function decodeEnvelope(text, expected) {
  const reject = (failure) => ({ ok: false, failure, message: MESSAGES[failure] });
  let s = String(text || '').trim();
  const hash = s.indexOf('#');
  if (hash >= 0) s = s.slice(hash + 1);
  const eq = /^[a-z0-9]+=/.exec(s);
  if (eq) s = s.slice(eq[0].length);
  let parsed;
  try {
    parsed = s.startsWith('{') ? JSON.parse(s) : JSON.parse(fromBase64Url(s));
  } catch {
    return reject('not-decodable');
  }
  if (!parsed || typeof parsed !== 'object') return reject('not-an-envelope');
  if (typeof parsed.checksum !== 'string' || parsed.payload === undefined) return reject('not-an-envelope');
  if (parsed.v !== 1) return reject('unsupported-version');
  if (parsed.kind !== expected) return reject('wrong-kind');
  if (checksum(parsed.payload) !== parsed.checksum) return reject('checksum-mismatch');
  if (!Array.isArray(parsed.payload?.flags)) return reject('flags-missing');
  return { ok: true, payload: parsed.payload };
}

export const INTEGRITY_SCOPE_STATEMENT = 'An imported object carries a check that detects accidental corruption, truncation, or removal of fields including its flags. This is an integrity check and not an authenticity check: it cannot detect a deliberate edit, because there is no server and no secret, and anyone who edits the object can recompute the check. This tool does not claim otherwise.';

/**
 * C7-ST-01: from a C1 structured result (C1 schema ligant-benchtools-c1-conversion),
 * take the molecular weight, its declared source, its mass-basis declaration and
 * every flag — and nothing else. The object is kept whole for embedding (C7-OUT-04).
 */
export function readC1(payload) {
  const fail = (m) => ({ ok: false, message: m });
  const toolId = typeof payload.tool === 'object' && payload.tool ? payload.tool.id : payload.tool;
  if (toolId !== 'C1') return fail('The imported object is not from C1: a molecular weight enters this tool only inside a C1 result object.');
  const mw = payload.quantities?.molecularWeight;
  if (!mw || typeof mw.value !== 'number' || !(mw.value > 0) || !['g/mol', 'kDa', 'Da'].includes(mw.unit)) return fail('The C1 object carries no positive molecular weight with a unit (g/mol or kDa).');
  const massBasis = payload.declarations?.massBasis;
  if (!['assembled', 'monomer', 'conjugate', 'not-recorded'].includes(massBasis)) return fail('The C1 object carries no mass-basis declaration; it cannot be paired with the content (§8).');
  const provenance = payload.declarations?.molecularWeightProvenance || 'not-recorded';
  const mwGperMol = mw.unit === 'kDa' ? mw.value * 1e3 : mw.value;
  return {
    ok: true,
    c1: {
      mw: { value: mw.value, unit: mw.unit },
      mwGperMol,
      provenance,
      massBasis,
      flags: payload.flags.map((f) => ({ code: String(f.code || ''), message: String(f.message || '') })),
      payload,
    },
  };
}
