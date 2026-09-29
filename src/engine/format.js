// Text renderers that read the structured result object only (C7-OUT-05).
// Nothing here computes a quantity.

export function volumeLines(r) {
  const v = r.volumes;
  const role = (x) => ({ entered: 'entered', primary: 'primary', derived: 'derived', 'derived-achieved': 'derived — achieved final volume' }[x.role]);
  const dil = `Diluent to add: ${v.diluent.display} ${v.unit} (${role(v.diluent)}) — ${v.diluent.label}`;
  const fin = `Final volume of solution: ${v.final.label === 'at least' ? 'at least ' : ''}${v.final.display} ${v.unit} (${role(v.final)})`;
  const lines = v.primary === 'final' ? [fin, dil] : [dil, fin];
  if (v.enteredFinal) lines.splice(1, 0, `Final volume as entered: ${v.enteredFinal.display} ${v.unit} (entered); the achieved final volume differs from it by the rounding of the diluent`);
  return lines;
}

export function displacementSentence(r) {
  const d = r.displacement;
  if (d.treatment === 'computed') return `Displacement computed from ${d.solidsSource}: D = ${d.computed.D.display} ${d.computed.D.unit}, f = ${d.computed.f.display} of the final volume (v̄ = ${d.vbar.value} ${d.vbar.unit}).`;
  if (d.treatment === 'reagent-own-volume-only') return `Displacement not computable (${d.notComputable.reason}). Corrected for the reagent's own volume only: Dmin = ${d.Dmin.display} ${d.Dmin.unit}, fmin = ${d.Dmin.fmin.display}; carrier and excipient not included.`;
  return `Displacement not computable (${d.notComputable.reason}). No correction applied; no bound available.`;
}

export function concentrationSentence(r) {
  const c = r.concentration.reported;
  const atMost = c.label === 'at-most' ? 'at most ' : '';
  return `${atMost}${c.display} ${c.unit}, ${c.labelText}; concentration of ${c.of}`;
}

export function notebookText(r) {
  const L = [];
  const d = r.declarations;
  L.push(`Reconstitution — Ligant Bench Tools ${r.tool.id} ${r.tool.name}, engine ${r.tool.engineVersion} (URS ${r.ursVersion})`);
  L.push(`${r.statements.scope} ${r.statements.determinesNotVerifies}`);
  L.push('');
  if (r.status === 'incomplete') {
    L.push('No determination: declarations incomplete.');
    for (const i of r.incomplete) L.push(`  - ${i.message}`);
    return L.join('\n');
  }
  L.push('Declarations');
  L.push(`  Direction: ${d.direction.label}`);
  L.push(`  Stated vial content: ${d.content.value} ${d.content.unit} — whole vial reconstituted: ${d.wholeVial.confirmed ? 'confirmed' : 'NOT confirmed'}`);
  L.push(`  Content basis: ${d.contentBasis.label}`);
  L.push(`  Source of the stated content: ${d.contentProvenance.label}`);
  L.push(`  Conjugate state: ${d.conjugate.label}`);
  L.push(`  Carrier: ${d.carrier.label}`);
  L.push(`  Total solids mass: ${d.totalSolids.declared ? `${d.totalSolids.value} ${d.totalSolids.unit}` : d.totalSolids.equalsContent ? 'equal to the stated content (total vial contents)' : 'not declared'}`);
  L.push(`  Volume basis: ${d.volumeBasis.label}`);
  if (d.target) L.push(`  Target: ${d.target.value} ${d.target.unit} — the concentration of the final solution`);
  if (d.enteredVolume) L.push(`  Entered volume: ${d.enteredVolume.value} ${d.enteredVolume.unit} (${d.enteredVolume.is})`);
  L.push(`  Minimum reliable transfer volume: ${d.minTransfer.value} ${d.minTransfer.unit} (${d.minTransfer.source === 'default' ? 'suggested default, left unchanged' : 'entered'})`);
  L.push(`  Vial working capacity: ${d.capacity.declared ? `${d.capacity.value} ${d.capacity.unit}` : 'not declared'}`);
  if (d.molecularWeight) L.push(`  Molecular weight (imported from C1): ${d.molecularWeight.value} ${d.molecularWeight.unit}; source ${d.molecularWeight.source.label}; mass basis ${d.molecularWeight.massBasis.label}`);
  L.push('');
  if (r.status === 'not-representable') {
    L.push('Not computed — outside the range of the arithmetic');
    L.push(`  [${r.notRepresentable.code}] ${r.notRepresentable.message}`);
    return L.join('\n');
  }
  if (r.status === 'rejected') {
    L.push('Not computed — rejected for a stated physical reason');
    for (const x of r.rejections) L.push(`  [${x.code}] ${x.message}`);
    return L.join('\n');
  }
  L.push('Result');
  for (const s of volumeLines(r)) L.push(`  ${s}`);
  L.push(`  ${displacementSentence(r)}`);
  L.push(`  Concentration: ${concentrationSentence(r)}`);
  if (r.target) L.push(`  Target: ${r.target.display} ${r.target.unit}; reported concentration ÷ target − 1, on the unrounded values = ${r.target.departure.isUpperBound ? 'at most ' : ''}${r.target.departure.display}`);
  if (r.concentration.upperBound.isUpperBound) L.push(`  Upper bound: ${r.concentration.upperBound.reason}`);
  if (!r.concentration.reagent.computable) L.push(`  Concentration of the reagent alone: not computable. ${r.concentration.reagent.reason}`);
  const m = r.concentration.molar;
  if (m && m.status === 'reported') L.push(`  Molar form: ${m.label === 'at-most' ? 'at most ' : ''}${m.display} ${m.unit} — molarity of ${m.molarityOf}`);
  if (m && m.status === 'withheld') L.push(`  Molar form: withheld — ${m.reason}`);
  L.push('');
  L.push(r.flags.length ? 'Flags' : 'Flags: none raised');
  for (const f of r.flags) L.push(`  ${f.code} — ${f.title}. ${f.message}`);
  L.push('');
  L.push('Declarations applied');
  for (const a of r.declarationsApplied) L.push(`  ${a.declaration}: ${a.value} — ${a.effect}`);
  L.push('');
  L.push('Relations applied');
  for (const s of r.relations) L.push(`  ${s}`);
  L.push('');
  L.push(r.statements.precision);
  return L.join('\n');
}
