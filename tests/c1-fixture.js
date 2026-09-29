// C1 result objects as C1 emits them (schema 1.4.0), carried through the
// transport. SYNTHETIC: C1 has no export yet (C4 open item 9), so no real C1
// output has been imported; these follow C1's serialise.ts shape.
import { encodeEnvelope, decodeEnvelope, readC1 } from '../src/shared/transport.js';

export function c1With(massBasis, { kDa = 148.3, flags = [] } = {}) {
  const payload = {
    schema: { name: 'ligant-benchtools-c1-conversion', version: '1.4.0' },
    tool: { id: 'C1', name: 'Molarity Converter', engineVersion: '1.0.0' },
    quantities: { molecularWeight: { value: kDa, unit: 'kDa', underflowed: false } },
    declarations: { molecularWeightProvenance: 'certificate-of-analysis', massBasis },
    flags,
  };
  return readC1(decodeEnvelope(encodeEnvelope('c1-conversion', payload), 'c1-conversion').payload).c1;
}

export const C1 = c1With('assembled');
