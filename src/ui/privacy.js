// The privacy statement, as given by A. Modi on 29 September 2026 for the tool
// footer (replacing the reference footer's "They run entirely in your browser: no
// data is transmitted."). It states the policy of that date: everything entered
// stays on the user's computer, and Cloudflare Web Analytics counts visits. Later
// the same day the owner added Google Analytics, loaded only after the visitor
// clicks Allow in the suite footer's banner (@ligant/bench-chrome 1.1.0); the last
// sentence is that addition, word for word the suite's standard statement.
// On 9 October 2026 the suite footer (@ligant/bench-chrome 1.3.1) added a
// newsletter signup, and the suite's standard statement, used here unchanged,
// now says that signup is separate: only an email address submitted there is sent.
//
// VERBATIM: do not reword it here. Its claims are verified at the deployed address
// (verification/deploy/sentinel-test.md): no input to the tool leaves the browser, the
// Cloudflare analytics set no cookie, and no analytics ever reads what is typed.
export const PRIVACY_DATE = '9 October 2026';
export const PRIVACY_STATEMENT = 'Everything you enter into this calculator stays on your computer. Calculations run entirely in your browser, and your inputs are never transmitted, stored, or logged. The newsletter signup at the foot of this page is separate: only an email address you choose to submit there is sent to us. We use Cloudflare Web Analytics to count visits and measure how quickly this page loads, so we can see which tools are used and improve them. It sets no cookie, does not identify you, and never reads what you type. If you allow it in the banner, we also use Google Analytics, which sets cookies and records which pages you visit; it never receives anything you type into this tool.';
// The Privacy Policy link is CONFIG.privacyUrl (src/config.js).

// The scope statement (C7-OUT-06), displayed with the result and in the footer's
// licence line. Unchanged.
export const SCOPE_STATEMENT = 'Ligant Bench Tools are free and open source. Research use only, not qualified for GxP decision-making.';
