import { determine, DETERMINES_NOT_VERIFIES } from '../engine/determine.js';
import { CONTENT_UNITS, SOLIDS_UNITS, VOLUME_UNITS, MASS_CONC_UNITS, ACTIVITY_CONC_UNITS, MOLAR_UNITS, FAMILY, unitInfo, concFamilyForContent } from '../engine/units.js';
import { notebookText } from '../engine/format.js';
import { SCHEMA } from '../shared/result-object.js';
import { decodeEnvelope, encodeEnvelope, readC1, INTEGRITY_SCOPE_STATEMENT } from '../shared/transport.js';
import { CONFIG } from '../config.js';
import { C1_MASS_BASIS, C1_MW_PROVENANCE } from '../engine/declarations.js';
import { renderDeclarations, renderFlagSummary, renderResult, renderDerivation } from './render.js';
import { renderPageContent, escapeHtml as esc } from './page-content.js';
import { PRIVACY_STATEMENT, PRIVACY_DATE } from './privacy.js';
import '@ligant/bench-chrome/chrome.css';
import { bindCopy, markDataUri } from '@ligant/bench-chrome';
import { renderHeader, renderFooter, renderDisclaimer, renderColophon } from './chrome.js';
const $ = (id) => document.getElementById(id);
function fillUnits(select, groups, { preferred = '', keep = true } = {}) {
    const previous = select.value;
    select.innerHTML = '';
    const o = document.createElement('option');
    o.value = '';
    o.textContent = '— select —';
    select.appendChild(o);
    for (const [label, units] of groups) {
        const parent = label ? document.createElement('optgroup') : select;
        if (label) {
            parent.label = label;
            select.appendChild(parent);
        }
        for (const u of units) {
            const opt = document.createElement('option');
            opt.value = u.symbol;
            opt.textContent = u.symbol;
            if (preferred && u.symbol === preferred)
                opt.defaultSelected = true;
            parent.appendChild(opt);
        }
    }
    const all = groups.flatMap(([, us]) => us.map((u) => u.symbol));
    select.value = keep && all.includes(previous) ? previous : preferred;
}
const val = (id) => $(id).value;
const checked = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value || '';
let c1State = null;
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
    if (!decoded.ok) {
        c1State = null;
        status.textContent = `Import not accepted: ${decoded.message}`;
        return;
    }
    const read = readC1(decoded.payload);
    if (!read.ok) {
        c1State = null;
        status.textContent = `Import not accepted: ${read.message}`;
        return;
    }
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
    for (const el of document.querySelectorAll('.dir-target'))
        el.hidden = dir !== 'target';
    for (const el of document.querySelectorAll('.dir-volume'))
        el.hidden = dir !== 'volume';
    $('step3-title').textContent = dir === 'target' ? 'Target' : dir === 'volume' ? 'Volume' : 'Target and volume';
    $('vb-label').textContent = dir === 'volume' ? 'The volume entered is the' : 'Which volume to show first and hand onward first';
    $('vb-help').textContent = dir === 'volume'
        ? 'A datasheet that says "reconstitute in 1 mL" means 1 mL of diluent. The concentration does not depend on this choice; which volume is known does.'
        : dir === 'target'
            ? 'You always deliver a diluent volume; this chooses which of the two volumes is shown first. Both are always reported.'
            : 'Choose a direction first.';
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
    }
    catch {
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
    $('privacy-body').innerHTML = `<p>${esc(PRIVACY_STATEMENT)}</p><p><a href="${esc(CONFIG.privacyUrl)}" target="_blank" rel="noopener noreferrer">Privacy Policy</a></p>`;
    $('privacy-version').textContent = PRIVACY_DATE;
    $('object-hint').textContent = `The machine-readable object (${SCHEMA.name} ${SCHEMA.version}), carrying the unrounded value of every quantity with its unit, every flag with its reason code and every declaration the result rests on. The result above is rendered from it, so the two cannot disagree.`;
    bindCopy($('site-footer'));
    fillUnits($('content-unit'), [['mass', CONTENT_UNITS.filter((u) => u.family === FAMILY.MASS)], ['activity', CONTENT_UNITS.filter((u) => u.family !== FAMILY.MASS)]]);
    fillUnits($('solids-unit'), [['', SOLIDS_UNITS]]);
    fillUnits($('target-unit'), [['mass concentration', MASS_CONC_UNITS], ['activity concentration', ACTIVITY_CONC_UNITS], ['molar (needs a C1 molecular weight)', MOLAR_UNITS]]);
    fillUnits($('molar-unit'), [['', MOLAR_UNITS]]);
    fillUnits($('volume-unit'), [['', VOLUME_UNITS]]);
    fillUnits($('capacity-unit'), [['', VOLUME_UNITS]]);
    fillUnits($('min-unit'), [['', VOLUME_UNITS]], { preferred: 'µL' });
    for (const id of ['min-value', 'min-unit'])
        $(id).addEventListener('input', () => { minTouched = true; });
    const form = $('recon-form');
    form.reset();
    minTouched = false;
    if (/^#c1=/.test(location.hash)) {
        $('import-text').value = location.href;
        history.replaceState(null, '', location.pathname + location.search);
    }
    form.addEventListener('input', compute);
    form.addEventListener('change', compute);
    form.addEventListener('submit', (e) => e.preventDefault());
    $('copy-notebook').addEventListener('click', () => { if (lastResult)
        copyText(notebookText(lastResult), $('copy-notebook'), 'Copy for notebook'); });
    $('copy-envelope').addEventListener('click', () => {
        if (lastResult && lastResult.status === 'result')
            copyText(encodeEnvelope('c7-stock', lastResult), $('copy-envelope'), 'Copy stock envelope');
    });
    window.addEventListener('resize', keepInView);
    for (const el of document.querySelectorAll('details'))
        el.addEventListener('toggle', keepInView);
    compute();
}
window.addEventListener('error', (e) => {
    const el = $('system-error');
    el.hidden = false;
    el.textContent = `System error: ${e.message}. The result shown may be stale; reload the page.`;
});
init();
