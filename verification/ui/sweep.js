// C7-NF-04 / acceptance 22 kept-in-view sweep, run in the page's own tab through
// the browser tool's JavaScript execution. Paste the whole file; the last
// expression returns the result table. Loads the page in an iframe of exactly
// 1366 × 650 CSS px (C7-NF-06), fills each case through the DOM, scrolls 0 → end
// in 10 px steps, and at every step where a result-bearing element is painted
// asserts that #kept-in-view lies wholly inside the viewport.
//
// Works against any address serving the page (dev server or deployed), since
// the iframe loads the tab's own origin and path.
(async () => {
  const SEL = '.figure, .result-flags li, .derivation li, .derivation dd, #object-text, .plan-summary';
  // A synthetic C1 envelope (150 kDa, assembled, one flag), built to C1's serialise.ts shape.
  const ENV = 'eyJ2IjoxLCJraW5kIjoiYzEtY29udmVyc2lvbiIsInBheWxvYWQiOnsic2NoZW1hIjp7Im5hbWUiOiJsaWdhbnQtYmVuY2h0b29scy1jMS1jb252ZXJzaW9uIiwidmVyc2lvbiI6IjEuNC4wIn0sInRvb2wiOnsiaWQiOiJDMSIsIm5hbWUiOiJNb2xhcml0eSBDb252ZXJ0ZXIiLCJlbmdpbmVWZXJzaW9uIjoiMS4wLjAifSwicXVhbnRpdGllcyI6eyJtb2xlY3VsYXJXZWlnaHQiOnsidmFsdWUiOjE1MCwidW5pdCI6ImtEYSIsInVuZGVyZmxvd2VkIjpmYWxzZX19LCJkZWNsYXJhdGlvbnMiOnsibW9sZWN1bGFyV2VpZ2h0UHJvdmVuYW5jZSI6InZlbmRvci1kYXRhc2hlZXQiLCJtYXNzQmFzaXMiOiJhc3NlbWJsZWQifSwiZmxhZ3MiOlt7ImNvZGUiOiJDMS1GTC0wNiIsIm1lc3NhZ2UiOiJUaGUgbW9sZWN1bGFyIHdlaWdodCBpcyBkZWNsYXJlZCBhcyBhIG1vbm9tZXIuIn1dfSwiY2hlY2tzdW0iOiJhMzFmNGU5Njg4NzhhOTUxIn0';
  const CASES = [
    { name: 'nine flags, set A', c1: true, worst: true, content: '1', basis: 'not-recorded', prov: 'not-recorded', conj: 'not-recorded', carrier: 'not-recorded', target: '1' },
    { name: 'nine flags, set B', c1: true, worst: true, content: '80', basis: 'total-vial-contents', prov: 'nominal', conj: 'protein', carrier: 'present', target: '80' },
    { name: 'no flags (C7-FX-08)', content: '0.2537', basis: 'reagent-alone', prov: 'coa', conj: 'none', carrier: 'absent', target: '0.317', solids: '1.13' },
  ];
  async function sweep(cfg, dir, open) {
    const f = document.createElement('iframe');
    f.style.cssText = 'width:1366px;height:650px;position:fixed;left:0;top:0;border:0;z-index:99999;transform:scale(.4);transform-origin:0 0;background:#fff';
    f.src = `${location.pathname}?sweep=${Math.random()}`;
    document.body.appendChild(f);
    await new Promise((r) => { f.onload = r; });
    await new Promise((r) => setTimeout(r, 400));
    const d = f.contentDocument; const w = f.contentWindow;
    const set = (id, v) => { const e = d.getElementById(id); e.value = v; e.dispatchEvent(new w.Event('input', { bubbles: true })); };
    const radio = (n, v) => { const e = d.querySelector(`input[name="${n}"][value="${v}"]`); e.checked = true; e.dispatchEvent(new w.Event('change', { bubbles: true })); };
    if (cfg.c1) set('import-text', ENV);
    radio('direction', dir); set('content-value', cfg.content); set('content-unit', 'mg'); radio('content-basis', cfg.basis);
    set('provenance', cfg.prov); radio('conjugate', cfg.conj); radio('carrier', cfg.carrier);
    if (cfg.solids) { set('solids-value', cfg.solids); set('solids-unit', 'mg'); }
    const wv = d.getElementById('whole-vial'); wv.checked = true; wv.dispatchEvent(new w.Event('change', { bubbles: true }));
    set('target-value', cfg.target); set('target-unit', 'mg/mL'); set('volume-value', '1'); set('volume-unit', 'mL'); set('report-unit', 'mg/mL');
    radio('volume-basis', 'diluent'); set('molar-unit', 'µM');
    if (cfg.worst) { set('min-value', '5000'); set('capacity-value', '0.1'); set('capacity-unit', 'mL'); }
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
        if (e.closest('details:not([open])')) return false; // not painted
        const r = e.getBoundingClientRect();
        return r.height > 0 && r.bottom > 0 && r.top < w.innerHeight;
      });
      if (shown) { resultSteps++; if (kv.top < 0 || kv.bottom > w.innerHeight) { violations++; if (firstBad.length < 3) firstBad.push(y); } }
    }
    const vp = `${w.innerWidth}×${w.innerHeight}`;
    f.remove();
    return { direction: dir, case: cfg.name, object: open ? 'open' : 'closed', viewport: vp, hasResult, flagRows: flags, steps, resultSteps, maxKeptInViewPx: Math.round(maxH), violations, firstBad };
  }
  const out = [];
  for (const dir of ['target', 'volume']) for (const open of [false, true]) for (const c of CASES) out.push(await sweep(c, dir, open));
  return out;
})();
