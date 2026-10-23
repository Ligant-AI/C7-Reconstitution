import { escapeHtml as esc } from '@ligant/bench-chrome';
import { CONFIG } from '../config.js';
import { ENGINE_VERSION } from '../engine/version.js';
export const CANONICAL = `${CONFIG.publicBase}${CONFIG.slug}/`;
export const SEO = Object.freeze({
    title: 'Ligant · Reconstitution: Lyophilized Vial Calculator',
    h1: "Reconstitution calculator: how much diluent to add to a lyophilized vial",
    lead: "This tool works out how much diluent to add to a vial to reach a target concentration, or what concentration a stated volume gives. It also records what the stated content is the content of, where the figure came from, whether carrier is present, the conjugate state, and whether the volume taken up by the dry solids was accounted for. It does not verify what was delivered or whether the solids dissolved, does not plan dilutions of the stock, and does not convert between mass and activity.",
    description: "Free reconstitution calculator for lyophilized vials. Diluent to add for a target concentration, or the concentration a volume gives, solids counted or flagged.",
    related: { text: "Dilution Planner plans dilutions of the stock once the vial is reconstituted. Enter the concentration by hand, in mass or molar units, with \"computed by Reconstitution\" as its source.", name: 'Dilution Planner', href: "/dilution-planner/" },
    faqHeading: 'Questions and answers',
    faq: Object.freeze([
        { q: "How do I work out how much diluent to add to a lyophilized vial?", a: "Choose the direction: \"target → volumes\" if you know the concentration you want, \"volume → concentration\" if the datasheet says \"reconstitute in 1 mL\". Enter the stated vial content and its unit from the label or certificate; the tool never infers or suggests it. Say what that content is the content of, where the figure came from, the conjugate state, and whether carrier protein is present. Enter the total solids mass if the certificate gives it, so the tool can compute the volume the dry solids occupy. Confirm the whole vial is reconstituted. Enter the target concentration or the volume, and say which volume you mean: the diluent you draw up and inject, or the final volume the vial will contain. Declare your minimum reliable transfer volume, replacing the 2 µL suggestion with your syringe's or pipette's value. Then read the result and every flag, and add the diluent volume shown." },
        { q: "Does the dry powder change the volume when I reconstitute?", a: "Yes. Dry solute occupies volume. Adding 1 mL of diluent to 100 mg of protein gives about 1.07 mL of solution, not 1 mL, and there is no mark on a sealed vial to bring it to. Where the total solids mass is known, the displacement is D = solids × v̄, and the diluent to add is smaller than the final volume by D: add the diluent volume shown, not the final volume. Here v̄ is the partial specific volume, the volume each gram of dissolved solid adds; the tool uses 0.73 mL/g, an average for globular proteins, for all solids. That suits protein-, sugar- and sugar-alcohol-rich cakes and is not guaranteed for salt-rich ones. Where the total solids mass is not known, mass-based reagent-alone content is corrected for the reagent's own volume only and its concentration is reported as \"at most\"; activity content, and content whose basis was not recorded, are not corrected." },
        { q: "What does the amount printed on the vial mean, and does it matter?", a: "It can be the amount of the reagent alone (the protein or molecule of interest, exclusive of carrier and excipient) or of the total vial contents (the whole dry mass: reagent, carrier protein, excipient and buffer salts together), and nothing in the resulting solution reveals which. It matters: from the total vial contents, the concentration is of total solids, not of the reagent. A figure such as \"1 mg total protein\" counts the reagent and carrier but not sugars or salts, so it is neither; choose \"not recorded\" for it and keep the datasheet wording in your notes. If carrier protein is present, a total-protein measurement of the stock (A280, BCA, Bradford) includes the carrier, so do not use one to check the reagent's concentration. The result records the basis, where the figure came from, whether carrier is present and the conjugate state." },
        { q: "Can I reconstitute part of a vial, or a vial I have already reconstituted?", a: "Not with this tool. The whole vial is reconstituted; no fraction of a cake is accepted. A previously reconstituted vial is a liquid stock: plan its dilution in the Dilution Planner, which takes mass and molar concentrations but not activity units (IU/mL, U/mL)." },
        { q: "Can it convert micrograms to units?", a: "No conversion is made between mass and activity. Mass units (µg, mg, g) and activity units (IU, U) are different things and are never converted into each other, and IU and U are not equated either. A conversion needs the lot's specific activity, and the tool does not supply specific activities or molecular weights; if you convert by hand before entering a value, check that the specific activity is the lot's." },
        { q: "What can go wrong that the calculator cannot detect?", a: "It states the volume; it does not observe what was delivered. It cannot detect a stated content that is wrong (mislabeled, or from a different lot than the certificate consulted), incomplete dissolution (the solution may look clear), protein lost by adsorption to the glass or stopper, loss during reconstitution (foaming, vortexing, material left on the stopper or wall), loss of activity before reconstitution, the wrong diluent, a collapsed, discolored or partially melted cake, or vial vacuum, which can make the delivered volume differ from the volume drawn up. Nor can it know whether the built-in partial specific volume suits your cake: it is for protein-dominated solids, and for a cake that is mostly excipient the correction overshoots by a bounded amount in a stated direction. It never holds a specific activity, so it cannot check one you used elsewhere." },
        { q: "Is my data uploaded anywhere?", a: "No. Calculations run entirely in your browser, and your inputs are never transmitted, stored, or logged. The page sends an email address only if you choose to submit one in the newsletter signup, and its web analytics counts visits and sees how quickly the page loads, with further analytics only if you allow it in the banner; no analytics ever receives anything you type into this tool." },
        { q: "Is it free?", a: "Yes. It is free to use and open source under the Apache 2.0 licence. Its source code is on GitHub, so you can download it and run it on your own computer." },
    ]),
    featureList: Object.freeze([
        "Diluent volume for a target concentration, or the concentration a stated volume gives",
        "Volume taken up by the dry solids applied, bounded, or flagged as not computable",
        "Records what the stated content is the content of, where it came from, the conjugate state and carrier presence",
        "Mass and activity units are carried and never converted into each other",
        "Notebook copy of the declarations, constants, flags and engine version",
    ]),
});
export function relatedHtml() {
    const { text, name, href } = SEO.related;
    return `<p class="related">${esc(text).replace(esc(name), `<a href="${href}">${esc(name)}</a>`)}</p>`;
}
export function faqHtml() {
    return SEO.faq.map(({ q, a }) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join('');
}
export function softwareApplication() {
    return {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: `Ligant · ${CONFIG.toolTitle}`,
        url: CANONICAL,
        description: SEO.description,
        applicationCategory: 'ScientificApplication',
        operatingSystem: 'Any (runs in a web browser)',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0' },
        license: `${CANONICAL}LICENSE`,
        softwareVersion: ENGINE_VERSION,
        codeRepository: CONFIG.repositoryUrl,
        featureList: [...SEO.featureList],
    };
}
export function faqPage() {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: SEO.faq.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    };
}
export function breadcrumbs() {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: CONFIG.productLine, item: CONFIG.publicBase },
            { '@type': 'ListItem', position: 2, name: CONFIG.toolTitle, item: CANONICAL },
        ],
    };
}
const block = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
export function jsonLdHtml() {
    return [softwareApplication(), faqPage(), breadcrumbs()].map(block).join('\n  ');
}
