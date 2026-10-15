import { ENGINE_VERSION } from '../engine/version.js';
import { VBAR, MATERIAL_THRESHOLD } from '../engine/constants.js';
import { HI08_SENTENCE, PRECISION_STATEMENT, DETERMINES_NOT_VERIFIES } from '../engine/determine.js';
import { INTEGRITY_SCOPE_STATEMENT } from '../shared/transport.js';
import { SCHEMA } from '../shared/result-object.js';
import { pct } from '../engine/numfmt.js';
export const FAILURE_CLASSES = [
    '<strong>A stated content that is wrong</strong>: mislabelled, or a vial from a different lot than the certificate consulted.',
    '<strong>Incomplete dissolution.</strong> The tool assumes the solids dissolve fully. A cake that has not fully gone into solution gives a lower concentration than computed, and the solution may look clear.',
    '<strong>Loss to the vial and closure.</strong> Protein adsorbs to glass and to the stopper, which matters most at the low masses where it is least visible.',
    '<strong>Loss during reconstitution</strong>: foaming, vortexing, material left on the stopper or wall. The most common loss at the bench, and the tool sees none of it.',
    '<strong>Loss of activity</strong> before reconstitution: storage, temperature excursion, or age. A correct mass of inactive protein reconstitutes to the computed concentration and does not work.',
    '<strong>The wrong diluent.</strong> Datasheets frequently specify the diluent: dilute acid for some growth factors, buffer with carrier for others. The tool computes a correct concentration in the wrong solvent and cannot know.',
    '<strong>A collapsed, discoloured or partially melted cake</strong>, which indicates a compromised vial. The tool sees only the numbers.',
    '<strong>Vial vacuum.</strong> Many lyophilised vials are stoppered under vacuum, which draws diluent in and can leave delivered volume differing from the volume drawn up.',
    '<strong>Whether the built-in partial specific volume applies.</strong> The value is for protein-dominated solids; a cake that is mostly excipient has a lower value, and the correction then overshoots by a bounded amount in a stated direction (see the constants table). The tool cannot know the excipient fraction.',
    '<strong>Whether a specific activity used elsewhere is the lot\'s.</strong> This tool does not convert between activity and mass, so it never holds one; a user who converts by hand before entering a value brings that risk with them.',
    'Any error in the <strong>execution</strong>. The tool states the volume; it does not observe what was delivered.',
];
function constantRows() {
    const th = MATERIAL_THRESHOLD;
    return [
        ['Partial specific volume, v̄', `<span class="num">${VBAR.value} ${VBAR.unit}</span>`, `${escapeHtml(VBAR.basis)} A constant of the tool, not a user input.`],
        ['Error if the true v̄ is lower', 'ε = (0.73 − v̄<sub>true</sub>) × total-solids concentration', 'Applying 0.73 mL/g to solids whose true value is lower over-corrects: the true final volume is smaller than computed by ε of it, and the true concentration is above the reported one by 1 ÷ (1 − ε). At 100 mg/mL of solids with v̄ = 0.3 mL/g: 4.30 % first-order, 4.49 % exact. Below 10 mg/mL, under 0.5 % for any solid with v̄ ≥ 0.3 mL/g. The correction beats no correction where the solids\' mass-weighted v̄ exceeds 0.365 mL/g.'],
        ['Partial specific volumes of common excipients', 'Sucrose, trehalose and mannitol about 0.6 to 0.67 mL/g; sodium chloride about 0.3 mL/g; some salts lower', 'Approximate values, for orientation only. The calculation never uses them: it applies 0.73 mL/g to all solids. They show why the correction suits protein-, sugar- and sugar-alcohol-rich cakes (above 0.365 mL/g, where correcting beats not correcting) and is not guaranteed for salt-rich ones.'],
        ['Material displacement threshold', `<span class="num">${pct(th.value)} %</span> of the final volume (about 8.2 mg/mL of total solids at 0.73 mL/g)`, 'A displacement above this share of the final volume is flagged. 0.6 % is the smallest maximum permissible systematic error in ISO 8655-2:2022, Table 1, which covers single-channel air-displacement pipettes and positive-displacement pipettes with a reusable plunger and capillary. That error is the largest bias in the mean delivered volume that a pipette may have and still pass calibration. The 0.6 % entry is for pipettes whose nominal volume (largest setting) is above 5 mL and up to 20 mL, used at that volume. Every other entry is at least as large: on the same row, 1.2 % at half the nominal volume and 6.0 % at a tenth; for pipettes above 50 µL up to 5 mL, 0.80 % at nominal. So the flag can be raised while the displacement is still smaller than the error permitted for the pipette and setting you are using. That is deliberate: it tells you about the volume of the solids early. These are calibration limits, not the measured error of your own pipette.'],
        ['Minimum displacement Dmin', 'Dmin = content × v̄; fmin = v̄ × content ÷ F, which is v̄ × target in the target direction: 7.3 % at 100 mg/mL, 0.73 % at 10 mg/mL', 'For mass-based reagent-alone content, solids ≥ content, so Dmin is a lower bound under the two assumptions below, to within v̄\'s scope error. Applied as a partial correction where it is the only displacement defined. Not defined for activity content or content basis not recorded.'],
        ['Unattainable-volume boundary', '1 ÷ v̄ ≈ 1370 mg/mL total solids', `Where D (or Dmin) ≥ F the diluent volume is ≤ 0. Evaluated as D ≥ F, or Dmin ≥ F, on computed values. ${escapeHtml(HI08_SENTENCE)} It cannot fire with a diluent volume entered.`],
        ['Displayed-volume resolution', '0.05–0.5 % of the value, leading-digit dependent', 'A half-step at 3 significant figures is 0.005 on a mantissa between 1.00 and 9.99. The concentration achieved at the displayed diluent volume therefore differs from the target by up to 0.5 %, and the tool reports it rather than bounding it.'],
        ['Minimum reliable transfer volume', 'You declare it; 2 µL is pre-filled as a suggestion', 'The smallest volume your syringe or pipette delivers reliably. Replace the suggestion with your own value; the notebook copy records whether it was left unchanged.'],
        ['Vial working capacity', 'You declare it; optional, no default', 'The largest volume the vial can hold. Without it the tool cannot check the final volume against the vial.'],
    ];
}
const ASSUMPTIONS = [
    ['Volumes are additive: final volume = diluent volume + solids mass × v̄. The correction beats no correction for solids whose mass-weighted v̄ exceeds 0.365 mL/g: protein-, sugar- and polyol-dominated solids. For salt-dominated solids it is not guaranteed.', 'Every result where displacement is computable'],
    ['Where the total solids mass is not known: mass-based reagent-alone content is corrected for the reagent\'s own volume only (Dmin), and its concentration is reported as an upper bound. For activity content or content basis not recorded, no correction is applied and no bound is available.', 'Every result where the displacement-not-computable flag is raised'],
    ['The reagent is a protein, within the scope of v̄. Even then Dmin is a lower bound only to within v̄\'s scope error: a reagent whose true v̄ is 0.70 mL/g displaces 0.959 × Dmin: an over-correction of a few tenths of a percent of the volume where the solids are almost entirely reagent, about 0.3 % at 100 mg/mL.', 'Every result reporting Dmin'],
    ['The solids other than the reagent do not reduce the solution volume. Whether any common lyophilisation excipient has a small or negative apparent volume at the relevant concentrations is not established here.', 'Every result reporting Dmin'],
    ['The solids dissolve completely into the diluent.', 'Every result (see "What it does not do")'],
];
const FLAG_LEGEND = [
    ['FL-01', 'The concentration is of total solids (reagent, carrier and excipient together), not of the reagent.', 'Do not read it as the reagent concentration. Find the reagent content if you need that.'],
    ['FL-02', 'It was not recorded whether the stated content is the reagent alone or the total vial contents.', 'Check the datasheet or certificate and run it again with the basis declared.'],
    ['FL-03', 'The content is the nominal fill from the label or datasheet, not the lot\'s measured content.', 'The actual fill can differ from the nominal. Use the lot-specific certificate of analysis where one exists.'],
    ['FL-04', 'The source of the stated content was not recorded.', 'Record where the figure came from before using the stock.'],
    ['FL-05', 'The total solids mass is not known, so the volume of the solids cannot be computed in full; the concentration is "at most", or uncorrected.', 'Enter the total solids mass if the certificate gives it. Otherwise treat the concentration as an upper bound.'],
    ['FL-06', 'The final volume exceeds the vial\'s declared working capacity.', 'The solution will not fit in this vial. Reconstitute to a higher concentration whose final volume fits, then dilute that stock in a separate tube (the Dilution Planner plans this).'],
    ['FL-07', 'The diluent volume is below your declared minimum reliable transfer volume.', 'You cannot deliver it reliably. Choose a lower target concentration (or, if you entered a volume, a larger one) so that more diluent is added, use a syringe or pipette that delivers this volume reliably and declare its minimum, or reconstitute a vial with more content.'],
    ['FL-08', 'The dry solids take up a material fraction of the final volume.', 'Do not add the final volume as diluent. Add the diluent volume shown.'],
    ['FL-09', 'The molar form is withheld because the declarations do not pair safely with the imported molecular weight.', 'Use the mass-based result, or correct the declarations or the imported molecular weight.'],
    ['FL-10', 'The imported molecular weight carried flags of its own.', 'Read them; they apply to the molar form.'],
    ['FL-11', 'The stock contains carrier protein.', 'A total-protein measurement of this stock (A280, BCA, Bradford) includes the carrier. Do not use one to check the reagent\'s concentration.'],
    ['FL-12', 'It was not recorded whether carrier is present.', 'Find out before interpreting a protein assay of the stock.'],
    ['FL-13', 'The concentration is of the protein alone, or of the conjugate, as declared. No degree-of-labelling correction is made.', 'Check that this is the mass your datasheet states.'],
    ['FL-14', 'It was not recorded whether the stated mass includes a label or payload.', 'Record it before pairing the concentration with a molecular weight.'],
];
export function renderPageContent(config) {
    const esc = escapeHtml;
    return `
<h3>What it does</h3>
<p>This tool answers one bench question in either direction: how much diluent to add to a vial to reach a target concentration, or what concentration a stated volume gives. It also records what the stated content is the content of, where the figure came from, whether carrier is present, the conjugate state, and whether the volume taken up by the dry solids was accounted for.</p>
<p>${esc(config.standfirst)}</p>

<h3>How to use it</h3>
<ol>
<li><strong>Choose the direction.</strong> "Target → volumes" if you know the concentration you want; "volume → concentration" if the datasheet says "reconstitute in 1 mL".</li>
<li><strong>Enter the stated vial content and its unit</strong> from the label or certificate. The tool never infers or suggests it. Mass units (µg, mg, g) and activity units (IU, U) are different things and are never converted into each other.</li>
<li><strong>Say what the content is the content of.</strong> "The reagent alone" if the figure is the protein or molecule of interest only. "The total vial contents" only if the figure is the whole dry mass in the vial: reagent, carrier protein, excipient and buffer salts together. A figure such as "1 mg total protein" counts the reagent and carrier but not sugars or salts, so it is neither; choose "not recorded" for it and keep the datasheet wording in your notes. If you cannot tell, choose "not recorded" and the result says so.</li>
<li><strong>Say where the figure came from:</strong> a lot-specific certificate of analysis (the content measured for that lot), the vial label or datasheet (the nominal fill), or weighed from bulk by you. The tool records this; it does not correct for fill tolerance.</li>
<li><strong>Declare the conjugate state and carrier.</strong> If the molecule carries a label or payload, say whether the stated mass is of the protein alone or of the whole conjugate. Say whether the stock contains carrier protein, because a protein assay of it will then report the carrier too.</li>
<li><strong>Enter the total solids mass if the certificate gives it</strong> (reagent, carrier, excipient and salts together). It lets the tool compute the volume the dry solids occupy. Without it, only the reagent's own volume is corrected and the concentration is reported as "at most".</li>
<li><strong>Confirm the whole vial is reconstituted.</strong> A fraction of a cake, or a vial already reconstituted, is outside this tool.</li>
<li><strong>Enter the target concentration or the volume</strong>, and say which volume you mean: the diluent you draw up and inject, or the final volume the vial will contain.</li>
<li><strong>Declare your minimum reliable transfer volume</strong> (replace the 2 µL suggestion with your syringe's or pipette's value) and, optionally, the vial's working capacity.</li>
<li><strong>For a molar target or molar form,</strong> the molecular weight must come from the Molarity Converter as a transport link, which carries its source, its mass-basis declaration and its flags. The Molarity Converter does not produce that link yet, so molar targets cannot be computed here for now; every mass-based result is unaffected.</li>
<li><strong>Read the result and every flag</strong>, then choose "Copy for notebook". The copy records the declarations, the constants applied, the flags and the engine version.</li>
</ol>

<h3>How it works</h3>
<p>Dry solute occupies volume. Adding 1 mL of diluent to 100 mg of protein does not give 1 mL of solution, and there is no mark on a sealed vial to bring it to. Where the total solids mass is known, the displacement is <span class="num">D = solids × v̄</span> and the diluent to add is smaller than the final volume by D. Where it is not, mass-based reagent-alone content is corrected for the reagent's own volume only and its concentration is reported as <strong>at most</strong>; activity content and content basis not recorded are not corrected.</p>
<p>The diluent volume, the only number anyone physically delivers, is always rounded from its own unrounded value. The concentration reported is the one obtained when that displayed volume is delivered, <span class="num">Ca = content ÷ (Vd′ + D)</span>, so it can differ from the target by up to 0.5 %. It is shown beside the target, not in place of it.</p>
<h4>Constants and assumptions</h4>
<table>
<thead><tr><th>Name</th><th>Value</th><th>Why</th></tr></thead>
<tbody>${constantRows().map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody>
</table>
<table>
<thead><tr><th>Assumption</th><th>Applies to</th></tr></thead>
<tbody>${ASSUMPTIONS.map((a) => `<tr><td>${esc(a[0])}</td><td>${esc(a[1])}</td></tr>`).join('')}</tbody>
</table>

<h4>Precision, rounding and engine version</h4>
<p>${esc(PRECISION_STATEMENT)} Every unrounded value is carried in the structured result object. A figure within one unit in the last place of a rounding boundary can fall one step short of the exact bound.</p>
<p>Engine <span class="num">${esc(ENGINE_VERSION)}</span>. The version changes whenever the calculation changes, so two results with the same engine version come from the same arithmetic. Result object <span class="num">${esc(SCHEMA.name)} ${esc(SCHEMA.version)}</span>.</p>

<h4>Flags</h4>
<table>
<thead><tr><th>Code</th><th>What it means</th><th>What to do</th></tr></thead>
<tbody>${FLAG_LEGEND.map((r) => `<tr><td class="num">${r[0]}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}</tbody>
</table>

<h3>Why not a spreadsheet?</h3>
<ul>
<li><strong>Every assumption is a recorded choice, not a hidden cell.</strong> The content basis, its source, the conjugate state, carrier presence, the volume basis and the displacement treatment are declared, and each appears in the copy-out with its effect on the result.</li>
<li><strong>The volume of the dry solids is computed, or its absence is flagged.</strong> A typical reconstitution sheet divides the content by the diluent volume as if the solids took no space. Here the displacement is applied, bounded, or stated as not computable.</li>
<li><strong>Units are carried and checked.</strong> Mass against activity, and IU against U, are refused rather than converted; a molar value appears only when the molecular weight and the declarations pair correctly.</li>
<li><strong>Rounding happens once, on display.</strong> The diluent volume is rounded from its own unrounded value, and the concentration shown is the one you get when you deliver that rounded volume.</li>
<li><strong>Flags say in words what to check, and the same inputs always give the same output.</strong> The copy-out records the inputs, declarations, constants, flags and engine version.</li>
</ul>

<h3>What it does not do</h3>
<p>${esc(DETERMINES_NOT_VERIFIES)} It does not plan dilutions of the stock (Dilution Planner), does not identify the protein, does not supply molecular weights or specific activities, and does not convert between mass and activity. The tool guarantees that the volume arithmetic is correct and that the content basis, its provenance, the conjugate state, carrier presence, the volume basis and the displacement treatment are recorded. It cannot detect:</p>
<ol>${FAILURE_CLASSES.map((s) => `<li>${s}</li>`).join('')}</ol>
<ul>
<li>Dilution of the resulting stock (Dilution Planner), titration series design (Antibody Titration Planner), multi-component cocktails.</li>
<li>Conversion between activity units and mass through a specific activity; molecular-weight lookup or protein identification; buffer or diluent selection, carrier addition, aliquoting or storage guidance; correction for incomplete dissolution or handling loss; reconstitution of a fraction of a vial; degree-of-labelling correction.</li>
</ul>
<p>The stock envelope carries the full result for use by another tool; the Dilution Planner does not read it, so the notebook copy is the record. ${esc(INTEGRITY_SCOPE_STATEMENT)}</p>`;
}
export function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
