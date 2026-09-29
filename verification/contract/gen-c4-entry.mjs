// Bundles C4's own compute/serialise/transport (C4 commit 02fc5bf) for cross-checks. Nothing written into C4.
export { computeSeries } from '../../../C4-Antibody-Titration-Planner/src/lib/compute.ts';
export { toStructuredResult } from '../../../C4-Antibody-Titration-Planner/src/lib/serialise.ts';
export { canonicalise, checksum, encodeEnvelope, decodeEnvelope } from '../../../C4-Antibody-Titration-Planner/src/lib/transport.ts';
