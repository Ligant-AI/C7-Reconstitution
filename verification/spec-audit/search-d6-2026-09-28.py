# Targeted search: can row 3 of the §6 table (D at 6 sf, final = Vd' + displayed D) reach 5 ulp inside the stated domain?
# Analytic: |departure| < 0.5 * f * m_C / m_D ulp (+ rounding), so 5 needs f > 0.8, m_C near 10, m_D near 1.
import random, math
from decimal import Decimal as D, ROUND_HALF_UP
def rnd(x, sf):
    b = D(float(x)); e = b.adjusted(); r = b.quantize(D(1).scaleb(e-sf+1), rounding=ROUND_HALF_UP)
    if r.adjusted() > e: r = r.quantize(D(1).scaleb(e-sf+2), rounding=ROUND_HALF_UP)
    return r
rng = random.Random(1); best = (0, None)
for _ in range(400000):
    target = math.exp(rng.uniform(math.log(1), math.log(316)))
    f = rng.uniform(0.80, 0.99)                    # displacement fraction; TS conc = f/0.73 g/mL <= 1356 mg/mL
    tsconc = f / 0.73 * 1000                        # mg/mL of total solids
    ratio = tsconc / target
    if not (1 <= ratio <= 50): continue
    content = 10 ** rng.uniform(-3, 3)
    solids = content * ratio
    F = content / target; Dv = solids / 1000 * 0.73
    if Dv >= F: continue
    vdp = float(rnd(F - Dv, 3)); fa = vdp + Dv; ca = content / fa
    C6 = rnd(ca, 6); ulp = D(1).scaleb(C6.adjusted() - 5)
    R = rnd(content / (vdp + float(rnd(Dv, 6))), 6)
    u = abs(int((R - C6) / ulp))
    if u > best[0]: best = (u, (content, target, ratio, f))
print("max ulp for D-at-6-sf row, targeted f in [0.80, 0.99]:", best)

# Re-check the reported case step by step.
content, target, ratio, _ = best[1]
solids = content * ratio; F = content / target; Dv = solids / 1000 * 0.73
vdp = float(rnd(F - Dv, 3)); fa = vdp + Dv; C6 = rnd(content / fa, 6); Dd6 = rnd(Dv, 6)
R = rnd(content / (vdp + float(Dd6)), 6)
print(f"content {content!r} mg, target {target!r} mg/mL, solids {solids!r} mg, TS conc {solids/F!r} mg/mL (< 1369.86: not rejected)")
print(f"F {F!r}, D {Dv!r} -> 6 sf {Dd6}, f {Dv/F!r}, Vd' {vdp}, Fa {fa!r}")
print(f"Ca (6 sf) {C6}; content / (Vd' + D6) (6 sf) {R}; difference {abs(R-C6)} = {abs(R-C6)/D(1).scaleb(C6.adjusted()-5)} ulp")
