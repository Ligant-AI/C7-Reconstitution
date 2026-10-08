// The suite's header and footer come from @ligant/bench-chrome, shared by every
// Ligant Bench Tool (C7-NF-11). This file supplies only what is this tool's own:
// its path, title and description, its repository, its citation and its
// disclaimer, which is the privacy statement's scope paragraph, not reworded
// (C7-OUT-06). The footer's privacy statement is the suite's standard one, the
// same words the Privacy section on this page displays.
import { renderHeader as suiteHeader, renderFooter as suiteFooter, markSvg } from '@ligant/bench-chrome';
import { CONFIG } from '../config.js';
import { escapeHtml as esc } from './page-content.js';
import { SCOPE_STATEMENT } from './privacy.js';

export function renderHeader() {
  return suiteHeader({ path: `/${CONFIG.slug}/`, title: CONFIG.toolTitle, description: CONFIG.tagline });
}

/** The software citation, in the pieces the footer shows and copies. */
function citation() {
  const tail = ` (v${CONFIG.version}) [Computer software]. ${CONFIG.legalEntity}. ${CONFIG.publicBase.replace('https://', '')}${CONFIG.slug}/`;
  return {
    lead: `${CONFIG.citationAuthor} (${CONFIG.citationYear}). `,
    title: CONFIG.toolTitle,
    tail: CONFIG.doi ? `${tail} doi:${CONFIG.doi}` : tail,
  };
}

export function renderFooter() {
  return suiteFooter({
    repoUrl: CONFIG.repositoryUrl,
    citations: [citation()],
    citationFootnote: CONFIG.doi
      ? 'References are given as text rather than links, so the page itself sends no visit to a publisher.'
      : 'No identifier is stated: one is minted when the tool is released, and a placeholder would read as a record that does not exist.',
    disclaimer: SCOPE_STATEMENT,
  });
}

/** The scope statement: the privacy statement's fourth paragraph, not reworded (C7-OUT-06), and C7-OUT-08. */
export function renderDisclaimer(statement) {
  return `<strong>${esc(SCOPE_STATEMENT)}</strong> ${esc(statement)}`;
}

export function renderColophon() {
  return `${markSvg({ size: 16 })}<span>${esc(CONFIG.publisher)} · ${esc(CONFIG.toolTitle)} v${esc(CONFIG.version)}</span>`;
}
