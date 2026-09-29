// C7-NF-04 / acceptance 22 kept-in-view sweep — TOP-LEVEL variant, for an address
// that forbids framing (the deployed page sends frame-ancestors 'none'; sweep.js's
// iframe variant is for the dev server). Run it in the page's own tab through the
// browser tool's JavaScript execution: paste the whole file; the last expression
// returns the result table. It fills each case through the page's own DOM, scrolls
// 0 → end in 10 px steps, and at every step where a result-bearing element is painted
// asserts that #kept-in-view lies wholly inside the viewport. It REFUSES to measure
// unless the viewport is exactly 1366 × 650 CSS px (C7-NF-06).
(async () => {
  const SEL = '.figure, .result-flags li, .derivation li, .derivation dd, #object-text, .plan-summary';
  // A synthetic C1 envelope (150 kDa, assembled, one flag), built to C1's serialise.ts shape.
  const ENV = 'eyJ2IjoxLCJraW5kIjoiYzEtY29udmVyc2lvbiIsInBheWxvYWQiOnsic2NoZW1hIjp7Im5hbWUiOiJsaWdhbnQtYmVuY2h0b29scy1jMS1jb252ZXJzaW9uIiwidmVyc2lvbiI6IjEuNC4wIn0sInRvb2wiOnsiaWQiOiJDMSIsIm5hbWUiOiJNb2xhcml0eSBDb252ZXJ0ZXIiLCJlbmdpbmVWZXJzaW9uIjoiMS4wLjAifSwicXVhbnRpdGllcyI6eyJtb2xlY3VsYXJXZWlnaHQiOnsidmFsdWUiOjE1MCwidW5pdCI6ImtEYSIsInVuZGVyZmxvd2VkIjpmYWxzZX19LCJkZWNsYXJhdGlvbnMiOnsibW9sZWN1bGFyV2VpZ2h0UHJvdmVuYW5jZSI6InZlbmRvci1kYXRhc2hlZXQiLCJtYXNzQmFzaXMiOiJhc3NlbWJsZWQifSwiZmxhZ3MiOlt7ImNvZGUiOiJDMS1GTC0wNiIsIm1lc3NhZ2UiOiJUaGUgbW9sZWN1bGFyIHdlaWdodCBpcyBkZWNsYXJlZCBhcyBhIG1vbm9tZXIuIn1dfSwiY2hlY2tzdW0iOiJhMzFmNGU5Njg4NzhhOTUxIn0';
  const CASES = [
    { name: 'nine flags, set A', c1: true, worst: true, content: '1', basis: 'not-recorded', prov: 'not-recorded', conj: 'not-recorded', carrier: 'not-recorded', target: '1' },
    { name: 'nine flags, set B', c1: true, worst: true, content: '80', basis: 'total-vial-contents', prov: 'nominal', conj: 'protein', carrier: 'present', target: '80' },
    { name: 'no flags (C7-FX-08)', content: '0.2537', basis: 'reagent-alone', prov: 'coa', conj: 'none', carrier: 'absent', target: '0.317', solids: '1.13' },
  ];
  // TOP-LEVEL variant, for a deployment that forbids framing (frame-ancestors 'none'):
  // acts on this page itself. It refuses to measure unless the viewport is exactly
  // the reference 1366 × 650 (C7-NF-06) — a sweep at another size is not the
  // measurement C7-NF-05 names, and must not be recorded as one.
  if (window.innerWidth !== 1366 || window.innerHeight !== 650) {
    return { refused: true, reason: `viewport is ${window.innerWidth} × ${window.innerHeight}, not 1366 × 650; size the browser window so the page viewport is exactly 1366 × 650 (e.g. a device-toolbar preset) and run again` };
  }
  async function sweep(cfg, dir, open) {
    const d = document; const w = window;
    location.hash = ''; // no transport link
    d.getElementById('recon-form').reset();
    const set = (id, v) => { const e = d.getElementById(id); e.value = v; e.dispatchEvent(new w.Event('input', { bubbles: true })); };
    const radio = (n, v) => { const e = d.querySelector(`input[name="${n}"][value="${v}"]`); e.checked = true; e.dispatchEvent(new w.Event('change', { bubbles: true })); };
    set('import-text', cfg.c1 ? ENV : '');
    radio('direction', dir); set('content-value', cfg.content); set('content-unit', 'mg'); radio('content-basis', cfg.basis);
    set('provenance', cfg.prov); radio('conjugate', cfg.conj); radio('carrier', cfg.carrier);
    set('solids-value', cfg.solids || ''); if (cfg.solids) set('solids-unit', 'mg');
    const wv = d.getElementById('whole-vial'); wv.checked = true; wv.dispatchEvent(new w.Event('change', { bubbles: true }));
    set('target-value', cfg.target); set('target-unit', 'mg/mL'); set('volume-value', '1'); set('volume-unit', 'mL'); set('report-unit', 'mg/mL');
    radio('volume-basis', 'diluent'); set('molar-unit', 'µM');
    set('min-value', cfg.worst ? '5000' : '2'); set('capacity-value', cfg.worst ? '0.1' : ''); if (cfg.worst) set('capacity-unit', 'mL');
    d.querySelector('#object-panel details').open = open;
    await new Promise((r) => setTimeout(r, 80));
    const hasResult = !!d.querySelector('#result-region .figure');
    const flags = d.querySelectorAll('#flag-summary li a').length;
    const max = d.documentElement.scrollHeight - w.innerHeight;
    let steps = 0; let resultSteps = 0; let violations = 0; let maxH = 0; const firstBad = [];
    for (let y = 0; y <= max; y += 10) {
      w.scrollTo(0, y); steps++;
      const kv = d.getElementById('kept-in-view').getBoundingClientRect();
      maxH = Math.max(maxH, kv.height);
      const shown = [...d.querySelectorAll(SEL)].some((e) => {
        if (e.closest('details:not([open])')) return false;
        const r = e.getBoundingClientRect();
        return r.height > 0 && r.bottom > 0 && r.top < w.innerHeight;
      });
      if (shown) { resultSteps++; if (kv.top < 0 || kv.bottom > w.innerHeight) { violations++; if (firstBad.length < 3) firstBad.push(y); } }
    }
    w.scrollTo(0, 0);
    return { direction: dir, case: cfg.name, object: open ? 'open' : 'closed', viewport: `${w.innerWidth}×${w.innerHeight}`, address: location.href, hasResult, flagRows: flags, steps, resultSteps, maxKeptInViewPx: Math.round(maxH), violations, firstBad };
  }
  const out = [];
  for (const dir of ['target', 'volume']) for (const open of [false, true]) for (const c of CASES) out.push(await sweep(c, dir, open));
  return out;
})();
