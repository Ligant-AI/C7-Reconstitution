// Deployed-address check, server side (half of acceptances 16, 17, 25; the other
// half is the real-browser run the deployment verifier does with network
// monitoring started before page load).
//
//   node verification/deploy/check-headers.mjs https://benchtools.ligant.ai/reconstitution/
//
// Fetches the page as served — after any edge rewriting — and reports: the
// response headers that carry the privacy claims, every resource the HTML
// references and its origin, any Set-Cookie, and any sign of edge injection
// (Web Analytics beacon, Rocket Loader, email obfuscation). Exits 1 on a failure.
const url = process.argv[2];
if (!url) { console.error('usage: check-headers.mjs <deployed url>'); process.exit(64); }
const origin = new URL(url).origin;
// Request the page AS A BROWSER DOES. The hosting edge injects its analytics
// beacon only into responses to browser-like navigations; a bare request gets
// clean HTML (29 September 2026: this check passed while a real browser was
// served the beacon). These are the headers a top-level navigation sends.
const BROWSER = {
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'accept-language': 'en-US,en;q=0.9',
  'sec-fetch-mode': 'navigate', 'sec-fetch-dest': 'document', 'sec-fetch-site': 'none', 'sec-fetch-user': '?1',
  'upgrade-insecure-requests': '1',
};
const res = await fetch(url, { redirect: 'follow', headers: BROWSER });
const html = await res.text();
const h = Object.fromEntries(res.headers.entries());
const fail = []; const note = [];

const csp = h['content-security-policy'] || '';
if (!csp) fail.push('no Content-Security-Policy response header (frame-ancestors cannot come from the meta tag)');
// Policy of 29 September 2026: Cloudflare Web Analytics is the one disclosed
// analytics product. The CSP must allow exactly its beacon and reporting endpoint.
const DISCLOSED = { script: ['https://static.cloudflareinsights.com/beacon.min.js', 'https://static.cloudflareinsights.com/beacon.min.js/'], connect: [`${origin}/cdn-cgi/rum`] };
for (const d of ["default-src 'self'", "frame-ancestors 'none'"]) if (csp && !csp.includes(d)) fail.push(`CSP header lacks ${d}`);
const directive = (name) => ((new RegExp(`${name}\\s+([^;]*)`).exec(csp) || [])[1] || '').trim().split(/\s+/).filter(Boolean);
const scriptSrc = directive('script-src'); const connectSrc = directive('connect-src');
const extraScript = scriptSrc.filter((x) => x !== "'self'" && !DISCLOSED.script.includes(x));
const extraConnect = connectSrc.filter((x) => !DISCLOSED.connect.includes(x) && x !== "'none'");
if (!scriptSrc.includes("'self'")) fail.push("CSP script-src lacks 'self'");
if (extraScript.length) fail.push(`CSP script-src allows undisclosed sources: ${extraScript.join(' ')}`);
if (extraConnect.length) fail.push(`CSP connect-src allows undisclosed endpoints: ${extraConnect.join(' ')}`);
if (h['set-cookie']) fail.push(`response sets a cookie: ${h['set-cookie']}`);

const refs = [...html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/g)].map((m) => m[1]).filter((r) => !r.startsWith('#') && !r.startsWith('data:') && !r.startsWith('mailto:'));
// A <link> is a loaded resource only for the rels a browser fetches; rel="canonical",
// "alternate" and similar are metadata and are never requested.
const LOADING_RELS = /\b(stylesheet|icon|preload|modulepreload|prefetch|manifest|apple-touch-icon)\b/i;
const resources = [
  ...[...html.matchAll(/<(?:script|img|iframe)\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/g)].map((m) => m[1]),
  ...[...html.matchAll(/<link\b[^>]*>/g)].map((m) => m[0]).filter((tag) => LOADING_RELS.test((/\brel\s*=\s*["']([^"']+)["']/.exec(tag) || [])[1] || '')).map((tag) => (/\bhref\s*=\s*["']([^"']+)["']/.exec(tag) || [])[1]).filter(Boolean),
].filter((r) => !r.startsWith('data:'));
const external = resources.map((r) => new URL(r, url)).filter((u) => u.origin !== origin);
const disclosedScript = (u) => DISCLOSED.script.some((d) => u.href === d || (d.endsWith('/') && u.href.startsWith(d)));
for (const u of external) if (!disclosedScript(u)) fail.push(`loads a resource from another origin: ${u.href}`); else note.push(`disclosed analytics script loaded: ${u.href}`);
for (const [re, what] of [[/rocket-loader|data-cfasync/i, 'Rocket Loader'], [/email-decode|__cf_email__/i, 'email obfuscation'], [/cdn-cgi\/challenge-platform/i, 'challenge script']]) {
  if (re.test(html)) fail.push(`edge injection present in the served HTML: ${what}`);
}
const links = refs.map((r) => new URL(r, url)).filter((u) => u.origin !== origin).map((u) => u.href);
if (!links.some((l) => /github\.com\//.test(l))) note.push('no link to a public source repository found in the served HTML (it may be rendered by script — confirm in the browser)');

console.log(`# Deployed-address header check\n\nURL: ${url}\nStatus: ${res.status}\nFetched: ${new Date().toISOString()}\n`);
console.log('## Headers\n');
for (const k of ['content-security-policy', 'referrer-policy', 'x-content-type-options', 'cross-origin-opener-policy', 'permissions-policy', 'cache-control', 'server', 'cf-ray', 'set-cookie']) console.log(`- ${k}: ${h[k] ?? '(absent)'}`);
console.log(`\n## Resources referenced by the served HTML (${resources.length})\n`);
for (const r of resources) console.log(`- ${new URL(r, url).href}`);
console.log(`\n## Outbound links (not loaded; listed for the repository claim)\n`);
for (const l of links) console.log(`- ${l}`);
console.log(`\n## Result\n\n${fail.length ? fail.map((f) => `- FAIL: ${f}`).join('\n') : '- No server-side failure found.'}${note.length ? `\n${note.map((n) => `- NOTE: ${n}`).join('\n')}` : ''}\n\nThis check requests the page with a browser's navigation headers and sees the HTML as served to it. Scripts injected after load, and requests made by the page, are only visible in the real-browser run.`);
process.exit(fail.length ? 1 : 0);
