// Page-level configuration. Single strings, sourced here and nowhere else.
// The chrome (header, tool navigation, footer) is standard across Ligant Bench
// Tools; see src/ui/chrome.js. Anything here that differs between tools is the
// only thing a sibling tool changes.
import { ENGINE_VERSION } from './engine/version.js';

export const CONFIG = Object.freeze({
  toolTitle: 'Reconstitution',
  toolId: 'C7',
  productLine: 'Ligant Bench Tools',
  publisher: 'Ligant',
  legalEntity: 'Ligant AI Incorporated',
  version: ENGINE_VERSION, // moves with the engine
  // Outstanding item 5: /reconstitution/ follows the C1 and C4 pattern; the slug
  // is not yet decided, and the address is not citable until it is.
  slug: 'reconstitution',
  publicBase: 'https://benchtools.ligant.ai/',
  homeUrl: 'https://ligant.ai/',
  suiteLabel: 'Bench Tools',
  // §14.1 claim 5: the repository is public under the stated licence at go-live.
  // Named on the sibling pattern; it must exist before the page is published.
  repositoryUrl: 'https://github.com/Ligant-ai/C7-Reconstitution',
  repositoryLabel: 'github.com/Ligant-ai/C7-Reconstitution',
  contactEmail: 'hello@ligant.ai',
  address: ['3675 Market Street', 'Suite 200', 'Philadelphia PA 19104'],
  doi: null,
  citationAuthor: 'Modi, A.B.',
  citationYear: '2026',
  // Sibling tools, in the order the shipped tools list them, with this one added.
  tools: [
    { label: 'Antibody titration', slug: 'antibody-titration-planner' },
    { label: 'Molarity', slug: 'molarity-converter' },
    { label: 'Antigen density', slug: 'antigen-density-calculator' },
    { label: 'Dilution', slug: 'dilution-planner' },
    { label: 'Reconstitution', slug: 'reconstitution' },
  ],
  tagline: 'The volume of diluent to add to a vial for a target concentration, or the concentration a stated volume gives, in either direction. Every value is computed deterministically by arithmetic you can read. No model and no inference is applied to any reported number.',
  standfirst: 'The arithmetic of reconstitution is trivial. What is not trivial is what the number on the vial is the amount of, what else is in the vial, and how much volume the dry solids take up, and nothing in the resulting solution reveals any of them. This tool asks for each and puts it in the result.',
});

export function toolUrl(slug) {
  return `${CONFIG.publicBase}${slug}/`;
}

export function citationText() {
  const base = `${CONFIG.citationAuthor} (${CONFIG.citationYear}). ${CONFIG.toolTitle} (v${CONFIG.version}) [Computer software]. ${CONFIG.legalEntity}. ${CONFIG.publicBase.replace('https://', '')}${CONFIG.slug}/`;
  return CONFIG.doi ? `${base} doi:${CONFIG.doi}` : base;
}
