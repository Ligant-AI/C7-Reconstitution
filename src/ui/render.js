// Renders the on-screen result from the result object only (C7-OUT-05).
//
// C7-NF-13: a flagged value, a withheld value, a not-computable cell and a
// rejected input are distinguished STRUCTURALLY — by label, position and
// border style — never by colour alone. A flag is never red; red is the §7
// rejection state and system errors only.
import { escapeHtml as esc } from './page-content.js';
import { displacementSentence } from '../engine/format.js';

const n = (s) => `<span class="num">${esc(s)}</span>`;

export function renderDeclarations(r) {
  const d = r.declarations;
  if (!d || !d.direction) return '<span class="decl empty">Declarations appear here as they are entered; the result is always shown under them.</span>';
  const items = [];
  const decl = (k, v, cls = '') => items.push(`<span class="decl ${cls}"><b>${esc(k)}</b> ${v}</span>`);
  const nr = (x) => (x && x.value === 'not-recorded' ? 'absent' : '');
  decl('Direction', esc(d.direction.label));
  if (d.content) decl('Content', `${n(d.content.value)} ${esc(d.content.unit)}`);
  if (d.contentBasis) decl('Basis', esc(d.contentBasis.label), nr(d.contentBasis));
  if (d.contentProvenance) decl('Source', esc(d.contentProvenance.label), nr(d.contentProvenance));
  if (d.conjugate) decl('Conjugate', esc(d.conjugate.label), nr(d.conjugate));
  if (d.carrier) decl('Carrier', esc(d.carrier.value === 'present' ? 'present' : d.carrier.value === 'absent' ? 'absent' : 'not recorded'), nr(d.carrier));
  if (d.totalSolids) decl('Solids', d.totalSolids.declared ? `${n(d.totalSolids.value)} ${esc(d.totalSolids.unit)}` : d.totalSolids.equalsContent ? 'the stated content' : 'not declared', d.totalSolids.declared || d.totalSolids.equalsContent ? '' : 'absent');
  decl('Whole vial', d.wholeVial.confirmed ? 'confirmed' : 'not confirmed', d.wholeVial.confirmed ? '' : 'absent');
  if (d.volumeBasis) decl('Volume', esc(d.volumeBasis.label));
  if (d.target) decl('Target', `${n(d.target.value)} ${esc(d.target.unit)}`);
  if (d.enteredVolume) decl('Entered', `${n(d.enteredVolume.value)} ${esc(d.enteredVolume.unit)}`);
  if (d.minTransfer) decl('Min transfer', `${n(d.minTransfer.value)} ${esc(d.minTransfer.unit)}${d.minTransfer.source === 'default' ? ' (default)' : ''}`);
  decl('Capacity', d.capacity.declared ? `${n(d.capacity.value)} ${esc(d.capacity.unit)}` : 'not declared', d.capacity.declared ? '' : 'absent');
  if (d.molecularWeight) decl('MW (C1)', `${n(String(d.molecularWeight.value))} ${esc(d.molecularWeight.unit)}`);
  return items.join('');
}

/** Short titles, in words, kept in view with the declarations (C7-NF-04). Full text is below. */
export function renderFlagSummary(r) {
  if (r.status !== 'result') return '';
  if (!r.flags.length) return '<li class="none">No flags raised.</li>';
  return r.flags.map((f) => `<li><a href="#flag-${esc(f.code)}"><span class="code">${esc(f.code)}</span>${esc(f.title)}</a></li>`).join('');
}

export function renderResult(r) {
  if (r.status === 'incomplete') {
    return `<div class="state-block incomplete"><h3>No result yet — declarations incomplete</h3><ul>${r.incomplete.map((i) => `<li>${esc(i.message)}</li>`).join('')}</ul></div>`;
  }
  if (r.status === 'not-representable') {
    // Its own state: every declaration was made; the refusal is arithmetic (T1). Not red — not a §7 rejection.
    return `<div class="state-block withheld" role="status"><h3>Not computed — outside the range of the arithmetic</h3><ul><li><span class="code">${esc(r.notRepresentable.code)}</span>${esc(r.notRepresentable.message)}</li></ul></div>`;
  }
  if (r.status === 'rejected') {
    return `<div class="state-block rejected" role="status"><h3>Not computed — rejected for a stated physical reason</h3><ul>${r.rejections.map((x) => `<li><span class="code">${esc(x.code)}</span>${esc(x.message)}</li>`).join('')}</ul></div>`;
  }
  const v = r.volumes;
  const c = r.concentration;
  const disp = r.displacement;
  const roleWord = (x) => ({ entered: 'entered', primary: 'primary', derived: 'derived', 'derived-achieved': 'derived' }[x.role]);
  const dilCell = `<div class="figure ${v.diluent.role === 'derived' ? '' : 'lead'}">
      <span class="k">Diluent to add <span class="role">${roleWord(v.diluent)}</span></span>
      <span class="v">${n(v.diluent.display)} <span class="u">${esc(v.unit)}</span></span>
      <span class="sub">${esc(v.diluent.label)}</span></div>`;
  const finCell = `<div class="figure ${v.final.role === 'primary' ? 'lead' : ''}">
      <span class="k">Final volume of solution <span class="role">${roleWord(v.final)}</span></span>
      <span class="v">${v.final.isLowerBound ? '<span class="bound">at least</span> ' : ''}${n(v.final.display)} <span class="u">${esc(v.unit)}</span></span>
      <span class="sub">${v.enteredFinal ? 'achieved at the displayed diluent volume' : v.final.isLowerBound ? 'carrier and excipient displacement not included' : esc(v.final.label)}</span></div>`;
  const enteredFinCell = v.enteredFinal ? `<div class="figure lead">
      <span class="k">Final volume as entered <span class="role">entered</span></span>
      <span class="v">${n(v.enteredFinal.display)} <span class="u">${esc(v.unit)}</span></span>
      <span class="sub">the achieved final differs by the rounding of the diluent</span></div>` : '';
  const volumeCells = v.primary === 'final' ? `${enteredFinCell}${finCell}${dilCell}` : `${dilCell}${finCell}`;

  const upper = c.upperBound.isUpperBound;
  const concCell = `<div class="figure conc ${upper ? 'upper' : ''}">
      <span class="k">Concentration <span class="role">${esc(c.reported.labelText)}</span></span>
      <span class="v">${upper ? '<span class="bound">at most</span> ' : ''}${n(c.reported.display)} <span class="u">${esc(c.reported.unit)}</span></span>
      <span class="sub">of ${esc(c.reported.of)}${c.reported.label === 'uncorrected-for-displacement' ? ' — uncorrected for displacement; overstates the concentration obtained by an unknown amount' : ''}</span></div>`;
  const targetCell = r.target ? `<div class="figure">
      <span class="k">Target <span class="role">entered</span></span>
      <span class="v">${n(r.target.display)} <span class="u">${esc(r.target.unit)}</span></span>
      <span class="sub">${r.target.massEquivalent ? `${n(r.target.massEquivalent.display)} mg/mL through the imported MW; ` : ''}reported ÷ target − 1, on the unrounded values = ${r.target.departure.isUpperBound ? 'at most ' : ''}${n(r.target.departure.display)}</span></div>` : '';

  const dispCell = disp.treatment === 'computed'
    ? `<div class="figure small"><span class="k">Displacement</span><span class="v">${n(disp.computed.D.display)} <span class="u">${esc(disp.computed.D.unit)}</span></span><span class="sub">f = D ÷ final volume = ${n(disp.computed.f.display)}; from ${esc(disp.solidsSource)}</span></div>`
    : disp.treatment === 'reagent-own-volume-only'
      ? `<div class="figure small partial"><span class="k">Displacement <span class="role">partial</span></span><span class="v">Dmin ${n(disp.Dmin.display)} <span class="u">${esc(disp.Dmin.unit)}</span></span><span class="sub">not computable — ${esc(disp.notComputable.reason)}. Reagent's own volume only, fmin = ${n(disp.Dmin.fmin.display)}</span></div>`
      : `<div class="figure small notcomputable"><span class="k">Displacement</span><span class="v">not computable</span><span class="sub">${esc(disp.notComputable.reason)}; no correction applied</span></div>`;

  const reagentCell = c.reagent.computable ? '' : `<div class="figure small notcomputable"><span class="k">Concentration of the reagent alone</span><span class="v">not computable</span><span class="sub">${esc(c.reagent.reason)}</span></div>`;

  let molarCell = '';
  const m = c.molar;
  if (m && m.status === 'reported') molarCell = `<div class="figure small"><span class="k">Molar form <span class="role">molarity of ${esc(m.molarityOf)}</span></span><span class="v">${m.label === 'at-most' ? '<span class="bound">at most</span> ' : ''}${n(m.display)} <span class="u">${esc(m.unit)}</span></span><span class="sub">carries the C1 object's flags</span></div>`;
  if (m && m.status === 'unit-not-selected') molarCell = `<div class="figure small notcomputable"><span class="k">Molar form</span><span class="v">no unit selected</span><span class="sub">${esc(m.reason)}</span></div>`;
  if (m && m.status === 'withheld') molarCell = `<div class="figure small withheld"><span class="k">Molar form <span class="role">withheld</span></span><span class="v">withheld</span><span class="sub">${esc(m.reason)} (§8 row ${m.pairingRow}). The mass-based result stands.</span></div>`;

  const flags = r.flags.length
    ? `<ul class="result-flags" aria-label="flags, in full">${r.flags.map((f) => `<li id="flag-${esc(f.code)}"><span class="code">${esc(f.code)}</span><strong>${esc(f.title)}.</strong> ${esc(f.message)}</li>`).join('')}</ul>`
    : '<p class="plan-summary">No flags raised: a whole-vial reconstitution with every declaration recorded, displacement computed and below the material threshold, and every volume inside the declared bounds.</p>';

  const add = v.additivity ? `<p class="plan-summary">Diluent + displacement − final, as displayed: ${n(v.additivity.disagreement)} ${esc(v.additivity.unit)}, within ${esc(v.additivity.boundRule)} (${n(v.additivity.bound)} ${esc(v.additivity.unit)}). The final volume shown is rounded${v.final.isLowerBound ? ' down, as a lower bound' : ''}; the concentration is computed from the diluent as displayed and the unrounded displacement.</p>` : '';

  return `<div class="result-grid volumes">${volumeCells}</div>
    <div class="result-grid">${concCell}${targetCell}${dispCell}${reagentCell}${molarCell}</div>
    ${flags}${add}`;
}

export function renderDerivation(r) {
  if (r.status !== 'result') return '';
  const d = r.declarations;
  const echo = [];
  const row = (k, v) => echo.push(`<dt>${esc(k)}</dt><dd>${v}</dd>`);
  row('Direction', esc(d.direction.label));
  row('Stated vial content', `${n(d.content.value)} ${esc(d.content.unit)} (${esc(d.content.dimension)})`);
  row('Whole vial', d.wholeVial.confirmed ? 'confirmed' : 'not confirmed');
  row('Content basis', esc(d.contentBasis.label));
  row('Source of the content', esc(d.contentProvenance.label));
  row('Conjugate state', esc(d.conjugate.label));
  row('Carrier', esc(d.carrier.label));
  row('Total solids mass', d.totalSolids.declared ? `${n(d.totalSolids.value)} ${esc(d.totalSolids.unit)}` : d.totalSolids.equalsContent ? 'the stated content (total vial contents)' : 'not declared');
  row('Volume basis', esc(d.volumeBasis.label));
  if (d.target) row('Target', `${n(d.target.value)} ${esc(d.target.unit)}`);
  if (d.enteredVolume) row('Entered volume', `${n(d.enteredVolume.value)} ${esc(d.enteredVolume.unit)} — ${esc(d.enteredVolume.is)}`);
  if (d.reportUnit) row('Report unit', esc(d.reportUnit));
  row('Minimum transfer', `${n(d.minTransfer.value)} ${esc(d.minTransfer.unit)} — ${d.minTransfer.source === 'default' ? 'suggested default, unchanged' : 'entered'}`);
  row('Vial capacity', d.capacity.declared ? `${n(d.capacity.value)} ${esc(d.capacity.unit)}` : 'not declared; C7-FL-06 not evaluated');
  if (d.molecularWeight) row('Molecular weight', `${n(String(d.molecularWeight.value))} ${esc(d.molecularWeight.unit)} from C1; source ${esc(d.molecularWeight.source.label)}; mass basis ${esc(d.molecularWeight.massBasis.label)}`);
  return `
    <h3>Declarations applied</h3>
    <dl class="echo applied">${r.declarationsApplied.map((a) => `<dt>${esc(a.declaration)}</dt><dd><strong>${esc(a.value)}</strong> — ${esc(a.effect)}</dd>`).join('')}</dl>
    <h3>Relations applied</h3>
    <ul>${r.relations.map((s) => `<li class="num-ish">${esc(s)}</li>`).join('')}</ul>
    <p>${esc(displacementSentence(r))}</p>
    <p>Both volumes differ by the volume the dissolved solids occupy${r.displacement.treatment === 'reagent-own-volume-only' ? ' — here only the reagent\'s own volume, the rest not included' : r.displacement.treatment === 'computed' ? '' : ' — here none is applied'}. Every concentration reported is that of the final volume.</p>
    <h3>Assumptions</h3>
    <ul>${r.assumptions.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
    <h3>Inputs as entered</h3>
    <dl class="echo">${echo.join('')}</dl>
    <p>${esc(r.statements.precision)} Engine ${n(r.tool.engineVersion)}. ${esc(r.statements.scope)} ${esc(r.statements.determinesNotVerifies)}</p>`;
}
