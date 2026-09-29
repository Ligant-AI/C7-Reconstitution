// UI wiring. Reads the form, calls the engine, renders from the object.
// No persistence (C7-ST-04, C7-ST-07): nothing is written to any storage, and
// nothing is written into this page's URL. No network; no progress state.
import { determine, DETERMINES_NOT_VERIFIES } from '../engine/determine.js';
import { CONTENT_UNITS, SOLIDS_UNITS, VOLUME_UNITS, MASS_CONC_UNITS, ACTIVITY_CONC_UNITS, MOLAR_UNITS, FAMILY, unitInfo, concFamilyForContent } from '../engine/units.js';
import { notebookText } from '../engine/format.js';
import { SCHEMA } from '../shared/result-object.js';
import { decodeEnvelope, encodeEnvelope, readC1, INTEGRITY_SCOPE_STATEMENT } from '../shared/transport.js';
import { CONFIG } from '../config.js';
import { C1_MASS_BASIS, C1_MW_PROVENANCE } from '../engine/declarations.js';
import { renderDeclarations, renderFlagSummary, renderResult, renderDerivation } from './render.js';
import { renderPageContent, escapeHtml as esc } from './page-content.js';
import { PRIVACY_PARAGRAPHS, PRIVACY_VERSION, PRIVACY_DATE } from './privacy.js';
import { markDataUri } from './mark.js';
import { renderHeader, renderFooter, renderDisclaimer, renderColophon } from './chrome.js';

const $ = (id) => document.getElementById(id);

/**
 * C7-UN-01: every unit selector starts unselected — a wrong unit is a
 * factor-of-1000 error with nothing on screen to show it. The one pre-selected
 * unit is the minimum transfer's, visibly marked as a suggestion (C7-PC-01).
 */
function fillUnits(select, groups, { preferred = '', keep = true } = {}) {
  const previous = select.value;
  select.innerHTML = '';
  const o = document.createElement('option');
  o.value = '';
  o.textContent = '— select —';
  select.appendChild(o);
  for (const [label, units] of groups) {
    const parent = label ? document.createElement('optgroup') : select;
    if (label) { parent.label = label; select.appendChild(parent); }
    for (const u of units) {
      const opt = document.createElement('option');
      opt.value = u.symbol;
      opt.textContent = u.symbol;
      // The suggested unit is the control's default, so a form reset restores it (C7-PC-01).
      if (preferred && u.symbol === preferred) opt.defaultSelected = true;
      parent.appendChild(opt);
    }
  }
  const all = groups.flatMap(([, us]) => us.map((u) => u.symbol));
  select.value = keep && all.includes(previous) ? previous : preferred;
}

const val = (id) => $(id).value;
const checked = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value || '';

let c1State = null; // { c1 } while an import is accepted
let minTouched = false;
let lastResult = null;

function readInput() {
  return {
    direction: checked('direction'),
    content: { value: val('content-value'), unit: val('content-unit') },
    contentBasis: checked('content-basis'),
    provenance: val('provenance'),
    conjugate: checked('conjugate'),
    carrier: checked('carrier'),
    wholeVial: $('whole-vial').checked,
    totalSolids: val('solids-value').trim() ? { value: val('solids-value'), unit: val('solids-unit') } : null,
    volumeBasis: checked('volume-basis'),
    target: { value: val('target-value'), unit: val('target-unit') },
    volume: { value: val('volume-value'), unit: val('volume-unit') },
    reportUnit: val('report-unit'),
    molarUnit: val('molar-unit'),
    minTransfer: { value: val('min-value'), unit: val('min-unit') },
    minTransferTouched: minTouched,
    capacity: val('capacity-value').trim() ? { value: val('capacity-value'), unit: val('capacity-unit') } : null,
    c1: c1State ? c1State.c1 : null,
  };
}

function syncImport() {
  const text = val('import-text').trim();
  const status = $('import-status');
  if (!text) {
    c1State = null;
    status.textContent = `The Molarity Converter (C1) does not yet offer a transport link, so there is nothing to paste until it does; the mass-based determination needs none. Nothing is fetched; the object is read here and nowhere else. It supplies the molecular weight, its source, its mass-basis declaration and every flag raised on it. ${INTEGRITY_SCOPE_STATEMENT}`;
    return;
  }
  const decoded = decodeEnvelope(text, 'c1-conversion');
  if (!decoded.ok) { c1State = null; status.textContent = `Import not accepted: ${decoded.message}`; return; }
  const read = readC1(decoded.payload);
  if (!read.ok) { c1State = null; status.textContent = `Import not accepted: ${read.message}`; return; }
  c1State = { c1: read.c1 };
  const c = read.c1;
  status.textContent = `Imported from C1: molecular weight ${c.mw.value} ${c.mw.unit}; source ${C1_MW_PROVENANCE[c.provenance] || c.provenance}; mass basis ${C1_MASS_BASIS[c.massBasis]}; ${c.flags.length} flag${c.flags.length === 1 ? '' : 's'} carried. The integrity check passed.`;
}

function syncConditionalFields() {
  const dir = checked('direction');
  const cu = unitInfo(val('content-unit'));
  const activity = cu && cu.family !== FAMILY.MASS;
  const basis = checked('content-basis');

  $('basis-field').hidden = !!activity;
  $('basis-activity').hidden = !activity;
  $('conjugate-field').hidden = !!activity;

  $('solids-block').hidden = !(activity || basis === 'reagent-alone');
  $('solids-total').hidden = activity || basis !== 'total-vial-contents';
  $('solids-unoffered').hidden = activity || basis !== 'not-recorded';

  $('carrier-note').hidden = !(checked('carrier') === 'present' && (activity || basis === 'reagent-alone'));

  for (const el of document.querySelectorAll('.dir-target')) el.hidden = dir !== 'target';
  for (const el of document.querySelectorAll('.dir-volume')) el.hidden = dir !== 'volume';
  $('step3-title').textContent = dir === 'target' ? 'Target' : dir === 'volume' ? 'Volume' : 'Target and volume';
  $('vb-label').textContent = dir === 'volume' ? 'The volume entered is the' : 'Which volume to show first and hand onward first';
  $('vb-help').textContent = dir === 'volume'
    ? 'A datasheet that says "reconstitute in 1 mL" means 1 mL of diluent. The concentration does not depend on this choice; which volume is known does.'
    : dir === 'target'
      ? 'You always deliver a diluent volume; this chooses which of the two volumes is shown first. Both are always reported.'
      : 'Choose a direction first.';

  // The report unit follows the content's family (C7-UN-02). A unit no longer in
  // the family is cleared, visibly, rather than silently carried (C7-ST-05).
  const fam = cu ? concFamilyForContent(cu.family) : null;
  const reportUnits = fam === FAMILY.MASS_CONC ? MASS_CONC_UNITS : fam ? ACTIVITY_CONC_UNITS.filter((u) => u.family === fam) : [...MASS_CONC_UNITS, ...ACTIVITY_CONC_UNITS];
  const key = reportUnits.map((u) => u.symbol).join('|');
  if ($('report-unit').dataset.key !== key) {
    fillUnits($('report-unit'), [['', reportUnits]]);
    $('report-unit').dataset.key = key;
  }

  const targetMolar = unitInfo(val('target-unit'))?.family === FAMILY.MOLAR;
  $('molar-unit-field').hidden = !(c1State && !(dir === 'target' && targetMolar));

  $('min-suggested').hidden = minTouched || val('min-value').trim() !== '2' || val('min-unit') !== 'µL';
}

function compute() {
  syncImport();
  syncConditionalFields();
  const r = determine(readInput());
  lastResult = r;
  $('declarations-content').innerHTML = renderDeclarations(r);
  const summary = renderFlagSummary(r);
  $('flag-summary').innerHTML = summary;
  $('flag-summary').hidden = !summary;
  $('result-region').innerHTML = renderResult(r);
  const derivation = renderDerivation(r);
  $('derivation').innerHTML = derivation;
  $('derivation-panel').hidden = !derivation;
  const has = r.status !== 'incomplete';
  $('result-actions').hidden = !has;
  $('copy-envelope').hidden = r.status !== 'result';
  $('object-panel').hidden = !has;
  $('object-text').textContent = has ? JSON.stringify(r, null, 2) : '';
  $('notebook-text').value = has ? notebookText(r) : '';
  keepInView();
}

/**
 * C7-NF-04. The sticky block is held inside the stock panel, and is pushed off
 * the top as the panel's end scrolls past. A trailing spacer (a child, since a
 * sticky box is bounded by its parent's content box, not its padding) at least
 * its own height guarantees the last result line has left the viewport first, at every
 * scroll position (verified by a sweep at 1366 × 650).
 */
function keepInView() {
  $('keep-spacer').style.height = `${Math.ceil($('kept-in-view').getBoundingClientRect().height) + 24}px`;
}

async function copyText(text, button, label) {
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = 'Copied';
    setTimeout(() => { button.textContent = label; }, 2000);
    $('notebook-fallback').hidden = true;
    $('copy-status').hidden = true;
  } catch {
    $('notebook-text').value = text;
    $('notebook-fallback').hidden = false;
    $('copy-status').hidden = false;
    $('copy-status').textContent = 'Clipboard unavailable; the text is below.';
  }
}

function init() {
  document.title = `${CONFIG.publisher} · ${CONFIG.toolTitle}`;
  $('site-header').innerHTML = renderHeader();
  $('site-footer').innerHTML = renderFooter();
  $('disclaimer').innerHTML = renderDisclaimer(DETERMINES_NOT_VERIFIES);
  $('colophon').innerHTML = renderColophon();
  $('favicon').href = markDataUri();
  $('page-content-body').innerHTML = renderPageContent(CONFIG);
  $('privacy-body').innerHTML = PRIVACY_PARAGRAPHS.map((p) => `<p>${esc(p)}</p>`).join('');
  $('privacy-version').textContent = `tool-set text v${PRIVACY_VERSION}, ${PRIVACY_DATE}`;
  $('object-hint').textContent = `The machine-readable object (${SCHEMA.name} ${SCHEMA.version}), carrying the unrounded value of every quantity with its unit, every flag with its reason code and every declaration the result rests on. The result above is rendered from it, so the two cannot disagree.`;

  $('copy-citation').addEventListener('click', () => copyText($('citation-text').textContent, $('copy-citation'), 'Copy'));

  fillUnits($('content-unit'), [['mass', CONTENT_UNITS.filter((u) => u.family === FAMILY.MASS)], ['activity', CONTENT_UNITS.filter((u) => u.family !== FAMILY.MASS)]]);
  fillUnits($('solids-unit'), [['', SOLIDS_UNITS]]);
  fillUnits($('target-unit'), [['mass concentration', MASS_CONC_UNITS], ['activity concentration', ACTIVITY_CONC_UNITS], ['molar (needs a C1 molecular weight)', MOLAR_UNITS]]);
  fillUnits($('molar-unit'), [['', MOLAR_UNITS]]);
  fillUnits($('volume-unit'), [['', VOLUME_UNITS]]);
  fillUnits($('capacity-unit'), [['', VOLUME_UNITS]]);
  fillUnits($('min-unit'), [['', VOLUME_UNITS]], { preferred: 'µL' });

  // A transport link opened directly: the envelope is read from this page's
  // fragment into the visible import field (after the reset below), never written back.

  for (const id of ['min-value', 'min-unit']) $(id).addEventListener('input', () => { minTouched = true; });
  const form = $('recon-form');
  // C7-ST-04 / C7-ST-05: every load starts from a clean form. A browser may try to
  // restore some field values after a reload (form-state restoration), which could
  // leave a half-restored set of declarations — values present, answers gone, or the
  // reverse — that the user did not make on this page. Reset explicitly, whatever the
  // browser restored, so nothing entered before a reload can reappear. (The one
  // exception is a transport link's fragment, re-read visibly below.)
  form.reset();
  minTouched = false;
  if (/^#c1=/.test(location.hash)) {
    $('import-text').value = location.href;
    // The envelope carries another tool's entered data. Once it is in the visible
    // import field, remove it from the address, so that no script on the page that
    // reads or reports the URL — an analytics beacon, in particular — can see it,
    // and it does not persist in the reloadable address (NADIRA's production note,
    // item 3; C7-ST-04). A fragment is never sent to a server either way.
    history.replaceState(null, '', location.pathname + location.search);
  }
  form.addEventListener('input', compute);
  form.addEventListener('change', compute);
  form.addEventListener('submit', (e) => e.preventDefault());

  $('copy-notebook').addEventListener('click', () => { if (lastResult) copyText(notebookText(lastResult), $('copy-notebook'), 'Copy for notebook'); });
  $('copy-envelope').addEventListener('click', () => {
    if (lastResult && lastResult.status === 'result') copyText(encodeEnvelope('c7-stock', lastResult), $('copy-envelope'), 'Copy stock envelope');
  });
  window.addEventListener('resize', keepInView);
  for (const el of document.querySelectorAll('details')) el.addEventListener('toggle', keepInView);
  compute();
}

window.addEventListener('error', (e) => {
  // A system error, not a rejection: one of the two places the restricted red is used.
  const el = $('system-error');
  el.hidden = false;
  el.textContent = `System error: ${e.message}. The result shown may be stale; reload the page.`;
});

init();
