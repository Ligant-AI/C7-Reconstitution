// The tool page's own statements (C7-CN-01, C7-FC-01, acceptance 20).
// Constants are rendered from the engine's own records, so the page cannot
// state a value or a status the engine does not carry.
import { ENGINE_VERSION, URS_VERSION } from '../engine/version.js';
import { VBAR, MATERIAL_THRESHOLD, TOLERANCES, REFERENCE_VIEWPORT } from '../engine/constants.js';
import { HI08_SENTENCE, PRECISION_STATEMENT, DETERMINES_NOT_VERIFIES } from '../engine/determine.js';
import { INTEGRITY_SCOPE_STATEMENT } from '../shared/transport.js';
import { SCHEMA } from '../shared/result-object.js';
import { pct } from '../engine/numfmt.js';

export const FAILURE_CLASSES = [
  '<strong>A stated content that is wrong</strong> — mislabelled, or a vial from a different lot than the certificate consulted.',
  '<strong>Incomplete dissolution.</strong> The tool assumes the solids dissolve fully. A cake that has not fully gone into solution gives a lower concentration than computed, and the solution may look clear.',
  '<strong>Loss to the vial and closure.</strong> Protein adsorbs to glass and to the stopper, which matters most at the low masses where it is least visible.',
  '<strong>Loss during reconstitution</strong> — foaming, vortexing, material left on the stopper or wall. The most common loss at the bench, and the tool sees none of it.',
  '<strong>Loss of activity</strong> before reconstitution — storage, temperature excursion, or age. A correct mass of inactive protein reconstitutes to the computed concentration and does not work.',
  '<strong>The wrong diluent.</strong> Datasheets frequently specify the diluent — dilute acid for some growth factors, buffer with carrier for others. The tool computes a correct concentration in the wrong solvent and cannot know.',
  '<strong>A collapsed, discoloured or partially melted cake</strong>, which indicates a compromised vial. The tool sees only the numbers.',
  '<strong>Vial vacuum.</strong> Many lyophilised vials are stoppered under vacuum, which draws diluent in and can leave delivered volume differing from the volume drawn up.',
  '<strong>Whether the registered partial specific volume applies.</strong> The value is for protein-dominated solids; a cake that is mostly excipient has a lower value, and the correction then overshoots by a bounded amount in a stated direction (register, below). The tool cannot know the excipient fraction.',
  '<strong>Whether a specific activity used elsewhere is the lot\'s.</strong> This tool does not convert between activity and mass, so it never holds one; a user who converts by hand before entering a value brings that risk with them.',
  'Any error in the <strong>execution</strong>. The tool states the volume; it does not observe what was delivered.',
];

const st = (s) => `<span class="status ${s}">${s}</span>`;

function registerRows() {
  const th = MATERIAL_THRESHOLD;
  return [
    ['Partial specific volume, v̄', `<span class="num">${VBAR.value} ${VBAR.unit}</span>`, `${escapeHtml(VBAR.basis)} A constant of the tool, not a user input.`, `${st(VBAR.status)}${VBAR.signed ? ', signed' : ''}. The excipient values are a separate open row.`],
    ['Scope-error bound of v̄', 'ε = (0.73 − v̄<sub>true</sub>) × total-solids concentration', 'Applying 0.73 mL/g to solids whose true value is lower over-corrects: the true final volume is smaller than computed by ε of it, and the true concentration is above the reported one by 1 ÷ (1 − ε). At 100 mg/mL of solids with v̄ = 0.3 mL/g: 4.30 % first-order, 4.49 % exact. Below 10 mg/mL, under 0.5 % for any solid with v̄ ≥ 0.3 mL/g. The correction beats no correction where the solids\' mass-weighted v̄ exceeds 0.365 mL/g.', st('derived')],
    ['Partial specific volumes of excipients', 'Sugars and polyols ≈ 0.6–0.67 mL/g; salts of order 0.3 mL/g', 'To be confirmed against Durchschlag\'s compilation before any value enters the scope-error row or the Dmin assumption.', st('open')],
    ['Material displacement threshold (C7-FL-08)', `Definition: ${escapeHtml(th.definition)} <br><strong>Value not yet cited.</strong> The engine applies <span class="num">${pct(th.value)} %</span> as a provisional placeholder, the tightest of three uncited candidates (1 %, 0.8 %, 0.6 % — 13.7, 11.0 and 8.2 mg/mL of total solids at 0.73 mL/g)`, 'A correction is material when it exceeds the delivery error of the act it drives. ISO 8655-2, current edition, table and nominal-volume row to be cited; ISO 7886-1 for syringes. Every fixture resolves identically under all three candidates.', `${st('open')}: the value, until cited.${th.definitionSigned ? ' The definition is signed.' : ''}`],
    ['Minimum displacement Dmin (C7-FL-05, C7-HI-08)', 'Dmin = content × v̄; fmin = v̄ × content ÷ F, which is v̄ × target in the target direction — 7.3 % at 100 mg/mL, 0.73 % at 10 mg/mL', 'For mass-based reagent-alone content, solids ≥ content, so Dmin is a lower bound under the two assumptions below, to within v̄\'s scope error. Applied as a partial correction where it is the only displacement defined. Not defined for activity content or content basis not recorded.', st('derived')],
    ['Unattainable-volume boundary (C7-HI-08)', '1 ÷ v̄ ≈ 1370 mg/mL total solids', `Where D (or Dmin) ≥ F the diluent volume is ≤ 0. Evaluated as D ≥ F, or Dmin ≥ F, on computed values. ${escapeHtml(HI08_SENTENCE)} It cannot fire with a diluent volume entered.`, st('derived')],
    ['Displayed-volume resolution', '0.05–0.5 % of the value, leading-digit dependent', 'A half-step at 3 significant figures is 0.005 on a mantissa between 1.00 and 9.99. The concentration achieved at the displayed diluent volume therefore differs from the target by up to 0.5 %, and the tool reports it rather than bounding it.', st('characterised')],
    ['Round-trip tolerance (C7-IV-01)', TOLERANCES.roundTrip === null ? 'To be derived' : `<span class="num">${TOLERANCES.roundTrip}</span>`, 'Analytic bound over both directions: one division, and where displacement applies one multiplication and one addition or subtraction.', st('open')],
    ['Unit-normalisation tolerance (C7-IV-04, C7-IV-05)', TOLERANCES.unitNormalisation === null ? 'To be derived' : `<span class="num">${TOLERANCES.unitNormalisation}</span>`, 'Analytic bound over the path including normalisation by non-power-of-two factors.', st('open')],
    ['Minimum reliable transfer volume', 'User-declared; 2 µL pre-filled suggestion', 'Inspection. Carried from C4-SR-05.', `${st('disclosed')} — a default, on the behaviour path whenever unchanged`],
    ['Vial working capacity', 'User-declared, optional, no default', 'Disclosed.', st('disclosed')],
    ['Displayed precision, volumes', '3 significant figures', 'Precision matches the physical act. This tool drives a syringe or pipette.', st('disclosed')],
    ['Displayed precision, final volume and displacement', '3 significant figures, both from the single Fa', 'Additivity within one unit of the coarsest displayed place (≤). Reproducibility is asserted on the recorded act — the diluent delivered — not on the displayed final volume.', st('disclosed')],
    ['Displayed precision, concentrations', '6 significant figures', 'Matches C1 and C3. Applies to the achieved concentration, an exact consequence of a recorded act, and to an upper-bound concentration at the same precision, rounded up.', `${st('disclosed')}, signed, including its extension to an upper bound`],
    ['Rounding rule', 'Half away from zero, on the exact binary value', 'Convention, C1 onward.', st('disclosed')],
    ['Rounding of a displayed bound', 'An "at most" concentration rounded up; an "at least" final volume rounded down; on the exact binary value', 'So that the figure shown is itself a bound: rounding half away from zero could display an upper bound below the value it bounds (C7-FX-06: 79.9680 against 79.9680128…). The additivity check becomes one unit of the final volume\'s place plus half a unit of the displacement\'s. Limit: the rounding acts on the double holding the bound, which may lie up to one unit in its last place on either side of the exact bound. So within that unit of a grid point an "at most" figure can fall one step short of the exact upper bound, and an "at least" figure can stand one step above the exact lower bound (e.g. a final volume whose double is exactly 1.25 mL while the exact sum is 1.2499999999999999 mL) — the zone C7-FX-12 excludes from fixtures.', `${st('disclosed')}, signed`],
    ['Kept-in-view height (C7-NF-05)', '≤ 349 CSS px', 'The declaration summary and flag titles held in view with the result, measured at 1366 × 650 CSS px with nine co-occurring flags — the most that can co-occur, since each of the pairs FL-01/02, 03/04, 05/08, 11/12 and 13/14 is exclusive — in both maximal combinations. Measured on the development build of engine 0.1.0, 28 September 2026; to be re-measured at the deployed address.', st('measured')],
  ];
}

const ASSUMPTIONS = [
  ['Volumes are additive: final volume = diluent volume + solids mass × v̄. The correction beats no correction for solids whose mass-weighted v̄ exceeds 0.365 mL/g — protein-, sugar- and polyol-dominated solids. For salt-dominated solids it is not guaranteed.', 'Every determination where displacement is computable', 'disclosed'],
  ['Where the total solids mass is not known: mass-based reagent-alone content is corrected for the reagent\'s own volume only (Dmin), and its concentration is reported as an upper bound. For activity content or content basis not recorded, no correction is applied and no bound is available.', 'Every determination where C7-FL-05 is raised', 'disclosed'],
  ['The reagent is a protein, within the scope of v̄. Even then Dmin is a lower bound only to within v̄\'s scope error: a reagent whose true v̄ is 0.70 mL/g displaces 0.959 × Dmin — an over-correction of a few tenths of a percent of the volume where the solids are almost entirely reagent, about 0.3 % at 100 mg/mL.', 'Every determination reporting Dmin', 'disclosed'],
  ['The solids other than the reagent do not reduce the solution volume. Whether any common lyophilisation excipient has a small or negative apparent volume at the relevant concentrations is not established here.', 'Every determination reporting Dmin', 'disclosed'],
  ['The solids dissolve completely into the diluent.', 'Every determination (failure class 2)', 'disclosed'],
];

export function renderPageContent(config) {
  const esc = escapeHtml;
  return `
<p class="lede">${esc(config.toolTitle)} determines the relation between the content of a vial, the volume of diluent added to it, and the concentration of the solution that results — in either direction. It records what the stated content is the content of, where the figure came from, whether carrier is present, the conjugate state, and whether displacement was accounted for. <strong>Research use only, not qualified for GxP decision-making.</strong></p>
<p>${esc(config.standfirst)}</p>
<p>${esc(DETERMINES_NOT_VERIFIES)} It does not plan dilutions of the stock (Dilution Planner), does not identify the protein, does not supply molecular weights or specific activities, and does not convert between mass and activity.</p>

<h3>The displacement correction</h3>
<p>Dry solute occupies volume. Adding 1 mL of diluent to 100 mg of protein does not give 1 mL of solution, and there is no mark on a sealed vial to bring it to. Where the total solids mass is known, the displacement is <span class="num">D = solids × v̄</span> and the diluent to add is smaller than the final volume by D. Where it is not, mass-based reagent-alone content is corrected for the reagent's own volume only and its concentration is reported as <strong>at most</strong>; activity content and content basis not recorded are not corrected.</p>
<p>The diluent volume — the only number anyone physically delivers — is always rounded from its own unrounded value. The concentration reported is the one obtained when that displayed volume is delivered, <span class="num">Ca = content ÷ (Vd′ + D)</span>, so it can differ from the target by up to 0.5 %. It is shown beside the target, not in place of it.</p>

<h3>Constants, assumptions and conventions</h3>
<table>
<thead><tr><th>Item</th><th>Value</th><th>Basis</th><th>Status</th></tr></thead>
<tbody>${registerRows().map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</tbody>
</table>
<p class="help">Statuses: derived, measured, characterised, disclosed, proposed, open. A row is marked signed only once its sign-off is recorded; the signatory and date of each, and the history of every row, are kept in the repository's register audit trail (REGISTER-AUDIT-TRAIL.md). This page states no decision that has not been made.</p>

<h3>Assumptions</h3>
<table>
<thead><tr><th>Assumption</th><th>Scope</th><th>Status</th></tr></thead>
<tbody>${ASSUMPTIONS.map((a) => `<tr><td>${esc(a[0])}</td><td>${esc(a[1])}</td><td>${st(a[2])}</td></tr>`).join('')}</tbody>
</table>

<h3>On the unattainable-volume rejection</h3>
<p>${esc(HI08_SENTENCE)}</p>

<h3>Failure classes this tool cannot detect</h3>
<p>The tool guarantees that the volume arithmetic is correct and that the content basis, its provenance, the conjugate state, carrier presence, the volume basis and the displacement treatment are recorded. It cannot detect:</p>
<ol>${FAILURE_CLASSES.map((s) => `<li>${s}</li>`).join('')}</ol>

<h3>Precision, rounding and versions</h3>
<p>${esc(PRECISION_STATEMENT)} Every unrounded value is carried in the structured result object.</p>
<p>Engine <span class="num">${esc(ENGINE_VERSION)}</span> — changes whenever calculation behaviour changes. Built to URS <span class="num">${esc(URS_VERSION)}</span>. Result object <span class="num">${esc(SCHEMA.name)} ${esc(SCHEMA.version)}</span>: the shared format version carrying this tool's fields is not yet published, so the object says draft. Reference viewport ${esc(REFERENCE_VIEWPORT)}.</p>

<h3>Importing a molecular weight, and handing the stock on</h3>
<p>A molecular weight enters only inside a C1 result object, carried in the transport envelope the tool set uses between tools. It brings its source, its mass-basis declaration and every flag raised on it, and nothing else. ${esc(INTEGRITY_SCOPE_STATEMENT)}</p>
<p>The stock envelope carries the full result — every declaration, both volumes, the displacement treatment, the reported concentration with its label, and an upper-bound marker with its reason where one applies. The Dilution Planner does not yet read a C7 stock; until it does, the notebook copy is the record.</p>

<h3>Out of scope</h3>
<ul>
<li>Dilution of the resulting stock (Dilution Planner). Titration series design (Antibody titration). Multi-component cocktails.</li>
<li>Conversion between activity units and mass through a specific activity; molecular-weight lookup or protein identification; buffer or diluent selection, carrier addition, aliquoting or storage guidance; correction for incomplete dissolution or handling loss; reconstitution of a fraction of a vial; degree-of-labelling correction.</li>
</ul>`;
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
