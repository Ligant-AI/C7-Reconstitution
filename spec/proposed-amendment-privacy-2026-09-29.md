# PROPOSAL — amended acceptance 16 and 17 under the analytics policy

| Field | Value |
|---|---|
| Status | **Draft for review.** Not binding until NADIRA reviews it and A. Modi approves; the privacy *wording* (§14.1 version 2) is A. Modi's with THERON's review, and is not drafted here |
| Drafted | 29 September 2026, by the builder, at NADIRA's request (production note, item 6) |
| Amends | URS v1.0 §14.1 (the five claims table), acceptance 16, acceptance 17, and — see "Conflict" — C7-NF-12 |
| Unchanged | C7-NF-01 ("no user-entered data leaves the browser") and C7-ST-07 ("nothing the user enters shall survive closing the page") — these are the policy |

## The policy it implements

As relayed by NADIRA from A. Modi, 29 September 2026: **anything a user enters into
a tool never leaves their browser, with no exceptions; and usage analytics are
collected to understand how the tools are used.** Every claim below holds the first
half to 100 %; the analytics are permitted only to the extent that claim 1 still
holds, verified.

## Proposed acceptance 16

At the deployed address, in a real browser, with network monitoring initialised
before page load, and **with the page's analytics live**: distinctive sentinel values
are entered in every field; a determination is completed; the notebook text and the
stock envelope are copied; and **no outbound request — URL, headers or body —
contains any sentinel in plain, URL-encoded, base64 or base64url form**, nor any
transport payload. The analytics endpoints observed are recorded and compared with
the disclosed list. Run on every tool; re-run after any analytics, CDN or CSP change.
Verification against a build artefact does not satisfy it. (Procedure:
verification/deploy/sentinel-test.md.)

## Proposed acceptance 17 — the statement's claims, each verified

| # | Claim (version-2 statement, wording to be set by A. Modi / THERON) | Verified by |
|---|---|---|
| 1 | **Nothing entered leaves the browser** | Acceptance 16 as above, with analytics live |
| 2 | **Closing the page ends it** | No user-entered data in any storage that outlives the page — checked after a determination — for **this tool and for every other tool on the same origin**, since same-origin storage is readable by any script the origin runs (C7-ST-07; extends to the origin because analytics now run on it) |
| 3 | **The only third-party code is the disclosed analytics** | The loaded-resource list at the deployed address equals the page's own origin **plus exactly the disclosed analytics endpoints**; edge-injected scripts match that list; the CSP allows exactly those endpoints and nothing else (`script-src`, `connect-src`) |
| 4 | **The analytics record only what the statement says** | Each analytics product's configuration read and compared with the wording; **no session-replay or form-capture product runs on a tool page** (Contentsquare excluded, or — if A. Modi decides otherwise — every input masked *and the masking verified by the sentinel test*, not configured and assumed); GA4 enhanced-measurement form interactions off on tool pages |
| 5 | **No entered value ever appears in a URL**, fragment included, on a page where analytics run | Inspection of every transport mechanism and every place the tool writes the address; the transport's fragment removed from the address on receipt; the analytics' URL recording checked (whether it records fragments or query strings) |
| 6 | **The description of what the hosting provider and the analytics record is accurate** | Compared with what each provider actually records for the deployed site (was claim 4 of v1) |
| 7 | **Free and open source** | The source repository is public under the stated licence at go-live, checked **logged out**, and linked from the page |

Re-verified on the same triggers as acceptance 16, and on any change to the
statement's version.

## Conflict to resolve

**C7-NF-12** requires "every font, script, style and image the page loads" to be
served from the page's own origin. Under the new policy the analytics script loads
from its provider's origin. Either NF-12 gains "except the disclosed analytics
endpoints of §14.1", or the analytics are served from the page's own origin
(first-party proxying). Which is A. Modi's decision; the CSP follows it.

## A transport caveat for claim 5

The C1 → C4 → C7 transport carries another tool's entered data in the URL fragment.
C7 now removes the fragment from the address as soon as it is read, but a script
that runs *before* the page's own code (an edge-injected beacon can) may already
have read `location.href`. The only guarantees are (a) no analytics script on a page
that can receive a transport link, or (b) analytics configured not to record
fragments, verified by claim 5 — or a transport that does not use the URL at all
(for example, paste of the envelope, which C7 already accepts). A decision for
A. Modi and the transport's owners (C4 open item 9).
