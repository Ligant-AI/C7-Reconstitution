// Maps a protocol case to the shipped engine and its result to the protocol's
// result shape (verification/PROTOCOL.md). The one place the harness touches
// the engine; clean-room agents never read this file.
import { determine } from '../src/engine/determine.js';
import { encodeEnvelope, decodeEnvelope, readC1 } from '../src/shared/transport.js';

function engineC1(c1) {
  if (!c1) return null;
  const payload = {
    schema: { name: 'ligant-benchtools-c1-conversion', version: '1.4.0' },
    tool: { id: 'C1', name: 'Molarity Converter', engineVersion: '1.0.0' },
    quantities: { molecularWeight: { value: c1.mw.value, unit: c1.mw.unit, underflowed: false } },
    declarations: { molecularWeightProvenance: 'certificate-of-analysis', massBasis: c1.massBasis },
    flags: (c1.flagCodes || []).map((code) => ({ code, message: `${code} (synthetic)` })),
  };
  return readC1(decodeEnvelope(encodeEnvelope('c1-conversion', payload), 'c1-conversion').payload).c1;
}

export function toProtocolCase(input, id, threshold) {
  const c1 = input.c1 ? { mw: { ...input.c1.mw }, massBasis: input.c1.massBasis, flagCodes: input.c1.flags.map((f) => f.code) } : null;
  return { id, ...input, c1, molarUnit: input.molarUnit || null, totalSolids: input.totalSolids || null, capacity: input.capacity || null, threshold };
}

export function runEngine(c) {
  const r = determine({ ...c, c1: engineC1(c.c1) }, typeof c.threshold === 'number' ? { materialThreshold: c.threshold } : {});
  if (r.status === 'rejected') return { id: c.id, status: 'rejected', rejections: r.rejections.map((x) => x.code) };
  if (r.status === 'not-representable') return { id: c.id, status: 'not-representable', rejections: r.rejections.map((x) => x.code), quantity: r.notRepresentable.quantity };
  if (r.status === 'incomplete') return { id: c.id, status: 'incomplete', rejections: [], incomplete: r.incomplete.map((i) => i.field) };
  const u = r.unrounded;
  const m = r.concentration.molar;
  return {
    id: c.id,
    status: 'result',
    rejections: [],
    flags: r.flags.map((f) => f.code),
    label: r.concentration.reported.label,
    treatment: r.displacement.treatment,
    molar: m ? { row: m.pairingRow, status: m.status === 'withheld' ? 'withheld' : 'reported' } : null, // protocol 1: 'reported' = pairing permitted (see PROTOCOL.md)
    unrounded: { F: u.F.value, D: u.D?.value ?? null, Dmin: u.Dmin?.value ?? null, Dapp: u.Dapp.value, Vd: u.Vd.value, VdPrime: u.VdPrime.value, Fa: u.Fa.value, Ca: u.Ca.value, f: u.f, fmin: u.fmin, target: u.target?.value ?? null },
    displayed: { diluent: r.volumes.diluent.display, final: r.volumes.final.display, concentration: r.concentration.reported.display },
    extended: extendedOf(r),
  };
}

// PROTOCOL.md protocol 2: the `extended` block, read from the result object only.
const HALF = (x) => (x === 'half away from zero' ? 'half-away' : x);
const OF = { 7: 'reagent', 8: 'protein', 9: 'conjugate' };
function extendedOf(r) {
  const c = r.concentration; const v = r.volumes; const d = r.displacement;
  const fl05 = r.flags.find((f) => f.code === 'C7-FL-05');
  const fl08 = r.flags.find((f) => f.code === 'C7-FL-08');
  const m = c.molar;
  return {
    reagentConcentration: c.reagent.computable ? 'computable' : 'not-computable',
    concentrationRounding: HALF(c.reported.rounding),
    final: { isLowerBound: v.final.isLowerBound === true, rounding: HALF(v.final.rounding) },
    departure: r.target ? { unrounded: r.target.departure.unrounded, display: r.target.departure.display, isUpperBound: r.target.departure.isUpperBound, rounding: HALF(r.target.departure.rounding) } : null,
    fl05: d.Dmin ? { Dmin: { unrounded: r.unrounded.Dmin.value, display: d.Dmin.display }, fmin: { unrounded: d.Dmin.fmin.unrounded, display: d.Dmin.fmin.display }, exceedsThreshold: fl05.payload.exceedsThreshold } : null,
    fl08: fl08 ? {
      knownVolume: fl08.payload.knownVolume,
      factor: { unrounded: fl08.payload.factor.unrounded, display: fl08.payload.factor.display },
      percent: fl08.payload.knownVolume === 'final'
        ? { unrounded: fl08.payload.shortfall.unrounded, display: fl08.payload.shortfall.display }
        : { unrounded: fl08.payload.overstatement.unrounded, display: fl08.payload.overstatement.display },
    } : null,
    molar: m ? {
      row: m.pairingRow,
      status: m.status,
      of: m.status === 'reported' ? OF[m.pairingRow] : null,
      unit: m.status === 'reported' ? m.unit : null,
      unrounded: m.status === 'reported' ? m.unrounded : null,
      display: m.status === 'reported' ? m.display : null,
      rounding: m.status === 'reported' ? HALF(m.rounding) : null,
    } : null,
  };
}
