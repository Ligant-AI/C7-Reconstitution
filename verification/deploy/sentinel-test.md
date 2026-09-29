# Acceptance 16 under the analytics policy — the sentinel test

Specified by NADIRA, 29 September 2026: under the policy that entered data never
leaves the browser while usage analytics run, acceptance 16 is tested against live
analytics. Run at the deployed address, on every tool, and after any analytics, CDN
or CSP change; record which analytics endpoints were observed each time.

## Procedure

1. Open the deployed page in a real browser; **arm network monitoring**, then reload,
   so the capture starts before the page's first request. Also arrive once through
   a transport link (`#c1=…`), so the fragment path is exercised.
2. Enter **distinctive sentinel values** in every numeric field — values no request
   could contain by chance (e.g. content 71.975317 mg, solids 93.864208 mg, target
   65.432109 mg/mL, minimum 3.141593 µL, capacity 8.642097 mL).
3. Complete a determination; **copy the notebook text and the stock envelope**.
4. Take every outbound request — URL, headers and body — and search for each
   sentinel in plain, URL-encoded, base64 and base64url form. Also search for any
   transport fragment's payload.
5. **Pass** only if no request contains any form of any sentinel. List every
   analytics endpoint observed, to compare with the disclosed list.

Browser-extension requests (`chrome-extension://…`) are the tester's own, not the
page's; exclude them and say so.

## C7, 29 September 2026 — https://benchtools.ligant.ai/reconstitution/ (engine 0.1.0)

Chrome, monitoring armed before a fresh load through a `#c1=` transport link. The
envelope reached the visible import field and was then removed from the address
(the tab's URL read `…/reconstitution/?s=1`). Sentinels as in step 2; determination
1.03 mL; notebook text and stock envelope copied to the clipboard.

- Requests: 9 to the page's own origin (document, 1 JS, 1 CSS, 5 fonts, all GET,
  no body); 1 to `static.cloudflareinsights.com/beacon.min.js/…` (the edge-injected
  beacon; status 503 — blocked by the page's CSP); 4 browser-extension requests,
  excluded. **No request after data entry.**
- 20 sentinel forms searched across every request URL: **0 hits.** No request had
  a body.
- **Analytics endpoints observed:** the Cloudflare Web Analytics beacon script only
  (blocked; it made no report).
- **Result: pass — trivially, because the page's CSP (`connect-src 'none'`) allows
  no outbound connection at all.** The test has its real force once analytics are
  allowed to report; it must be re-run then.

## C7, 29 September 2026, second run — with Cloudflare Web Analytics live

A. Modi decided Cloudflare Web Analytics is the one analytics product. The CSP now
allows exactly `https://static.cloudflareinsights.com/beacon.min.js(/…)` and
`https://benchtools.ligant.ai/cdn-cgi/rum`. Same procedure and sentinels, arriving
through a `#c1=` link; this time the page's outbound calls (`navigator.sendBeacon`,
`fetch`, `XMLHttpRequest`) were wrapped after load so that report **bodies** could
be read, not only URLs.

- **The analytics work:** beacon script 200; its load-time report to `/cdn-cgi/rum`
  204.
- **The report captured after data entry** (via `sendBeacon`, 368 bytes) carried
  `location: "https://benchtools.ligant.ai/reconstitution/"` — no fragment, and not
  even the `?s=2` query — plus page-load id, navigation type, browser engine and
  version, OS version, the site token and time-to-first-byte. **No sentinel, in any
  form; no transport payload.**
- **The load-time report** was sent before the wrapper could be installed, so its
  body was not seen. It cannot carry the fragment: the beacon's own code
  (`beacon.min.js/v31edd6d…`) passes every reported location and referrer through
  `cleanLocation`, which sets `hash = ""`, `search = ""` and strips credentials. At
  load, no sentinel had yet been entered.
- **Cookies and storage:** no cookie added (the same four pre-existing `.ligant.ai`
  cookies before and after); no C7 key in any storage.
- **Result: pass**, with the load-time body established from the beacon's code
  rather than observed. Re-run after any change to the analytics, the CDN or the CSP.

**For THERON (disclosure):** the report also carries browser engine and version, OS
version and the (cleaned) referrer; the page's wording names page, frequency,
approximate location and load speed, but not those.
