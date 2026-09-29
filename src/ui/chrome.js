// Standard Ligant Bench Tools chrome: the masthead, the footer, the disclaimer
// and the colophon, identical in structure and class names to the shipped
// Dilution Planner (C3) and its siblings (C7-NF-11). Only the strings in
// src/config.js differ between tools — with one deliberate exception: C3's
// footer carries its own reworded privacy paragraphs, and C7 is required to
// display the §14.1 statement verbatim, so the footer here links to that
// statement by name rather than restating it.
import { CONFIG, toolUrl, citationText } from '../config.js';
import { markSvg, lockupHtml } from './mark.js';
import { escapeHtml as esc } from './page-content.js';
import { PRIVACY_PARAGRAPHS } from './privacy.js';

export function renderHeader() {
  const nav = CONFIG.tools.map((t) => `<li>${t.slug === CONFIG.slug
    ? `<span aria-current="page">${esc(t.label)}</span>`
    : `<a href="${esc(toolUrl(t.slug))}">${esc(t.label)}</a>`}</li>`).join('');
  return `
    <div>
      <a class="lockup-link" href="${esc(CONFIG.homeUrl)}">${lockupHtml(28)}</a>
      <h1>${esc(CONFIG.toolTitle)}</h1>
      <p>${esc(CONFIG.tagline)}</p>
    </div>
    <nav class="tool-nav" aria-label="Bench tools">
      <ul>${nav}</ul>
      <a class="eyebrow suite-mark" href="${esc(CONFIG.publicBase)}">${esc(CONFIG.suiteLabel)}</a>
    </nav>`;
}

export function renderFooter() {
  const repo = `<a href="${esc(CONFIG.repositoryUrl)}">${esc(CONFIG.repositoryLabel)}</a>`;
  const mail = `<a href="mailto:${esc(CONFIG.contactEmail)}">${esc(CONFIG.contactEmail)}</a>`;
  return `
    <div class="footer-grid">
      <div class="footer-prose">
        <p><a href="#privacy">Privacy statement</a> — what this page does and does not do with what you enter, displayed in full on this page.</p>
        <p>Every figure on this page comes from code you can read, download or run yourself, at ${repo}. Clone it and <code>npm run dev</code> for a local copy.</p>
        <p>These tools are standalone calculators. Ligant's enterprise platform adds reference databases, connected agentic workflows, on-premise language models, and full GxP validation. If your lab needs that, please email us ${mail}.</p>
      </div>
      <address class="footer-address">
        <span class="eyebrow">${esc(CONFIG.legalEntity)}</span>
        ${CONFIG.address.map(esc).join('<br>')}<br>
        ${mail}
      </address>
    </div>

    <div class="footer-citation">
      <span class="eyebrow">How to cite</span>
      <p class="footer-citation-note">Cite the software as below.</p>
      <div class="footer-citation-row">
        <p id="citation-text">${esc(citationText())}</p>
        <button type="button" id="copy-citation" aria-label="Copy the software citation" aria-live="polite">Copy</button>
      </div>
      <p class="footer-citation-note">${CONFIG.doi ? 'The identifier is given as text, not as a link: a link that navigated to a publisher would disclose a visit that the rest of the tool is built to prevent.' : 'No identifier is stated: one is minted when the tool is released, and a placeholder would read as a record that does not exist.'}</p>
    </div>

    <p class="footer-licence">Licensed under the Apache License, Version 2.0. You may obtain a copy of the License in the <a href="./LICENSE"><code>LICENSE</code></a> file served with this page and distributed with the source. Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" basis, without warranties or conditions of any kind, either express or implied. <strong>${esc(PRIVACY_PARAGRAPHS[3])}</strong></p>`;
}

/** The scope statement: the privacy statement's fourth paragraph, not reworded (C7-OUT-06), and C7-OUT-08. */
export function renderDisclaimer(statement) {
  return `<strong>${esc(PRIVACY_PARAGRAPHS[3])}</strong> ${esc(statement)}`;
}

export function renderColophon() {
  return `${markSvg({ size: 16 })}<span>${esc(CONFIG.publisher)} · ${esc(CONFIG.toolTitle)} v${esc(CONFIG.version)}</span>`;
}
