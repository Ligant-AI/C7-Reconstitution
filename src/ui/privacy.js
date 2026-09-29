// The standing privacy statement (§14.1), tool-set text version 1.0,
// 16 September 2026. Owner: A. Modi. Legal review: THERON (outstanding item 4).
//
// VERBATIM. It is not reworded per tool (C7-NF-03, C7-OUT-06); a change bumps
// its version and is applied to every deployed page at once, with acceptance
// 17 re-run on each. Do not edit these strings locally.
export const PRIVACY_VERSION = '1.0, one sentence withdrawn';
export const PRIVACY_DATE = '16 September 2026; withdrawal 29 September 2026, pending version 2';
export const PRIVACY_PARAGRAPHS = Object.freeze([
  'Your data stays in your browser. Everything you enter into this tool is calculated on your own device and never sent anywhere. We do not see it, store it, or have any way to retrieve it. Closing the page ends it.',
  // WITHDRAWN IN PART, 29 September 2026, on the specification owner's instruction
  // (NADIRA, production note): the hosting edge injects an analytics beacon and the
  // domain carries analytics cookies, so "no tracking of you", "no cookies for
  // advertising", "no analytics scripts" and "no third party code of any kind runs
  // on this page" cannot stand. Only what remains true is shown. The replacement
  // tool-set text (version 2, stating which analytics run and what they record) is
  // A. Modi's, with THERON's review; it replaces this whole statement when issued.
  'There is no account. No login, no sign up.',
  'We do count visits. Our hosting provider records basic traffic: which pages get opened, how often, and roughly where in the world from. Because we collect nothing about who you are, this is the only signal we have about whether these tools are useful and which one to build next.',
  'Ligant Bench Tools are free and open source. Research use only, not qualified for GxP decision-making.',
]);
