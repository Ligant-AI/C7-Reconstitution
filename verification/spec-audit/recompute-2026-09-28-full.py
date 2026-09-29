# Full spec-audit recomputation, 2026-09-28.
# Inputs: spec/reconstitution-urs-v1.0.md, spec/c7-developer-handoff.md, spec/cr-c3-bound-and-activity.md only.
# Independent of recompute-2026-09-28-smoke.py (nothing imported from it).
#
# Display rule (C7-UN-06): half away from zero, applied to the exact binary value of an IEEE-754 double.
#   Path (a) "nearest": the exact decimal result, converted to its nearest double, then rounded.
#   Path (b) "chain":   the native float chain evaluated in the order the spec writes the relation, then rounded.
# Both are printed; any disagreement between (a) and (b) at the displayed precision is reported.
#
# Run: python3 verification/spec-audit/recompute-2026-09-28-full.py
import math, random
from decimal import Decimal as D, getcontext, ROUND_HALF_UP, ROUND_FLOOR

getcontext().prec = 60
V = D("0.73")          # registered partial specific volume, mL/g (§11)
Vf = 0.73

def rnd(x, sf):
    """Half away from zero at sf significant figures, on Decimal(float(x))."""
    b = D(float(x))
    if b == 0:
        return b
    e = b.copy_abs().adjusted()
    q = D(1).scaleb(e - sf + 1)
    r = b.quantize(q, rounding=ROUND_HALF_UP)  # decimal HALF_UP is half away from zero on magnitude
    if r.copy_abs().adjusted() > e:            # carry into the next decade (0.99973 -> 1.000): re-express at sf
        r = r.quantize(D(1).scaleb(e - sf + 2), rounding=ROUND_HALF_UP)
    return r

def tie_gap(x, sf):
    """Absolute distance from x to the nearest rounding tie at sf significant figures,
    including the decade-boundary tie just below 10^e; also the gap as a fraction of the step
    of x's own decade, and relative to x."""
    x = D(x)
    e = x.copy_abs().adjusted()
    step = D(1).scaleb(e - sf + 1)
    k = (x / step).to_integral_value(rounding=ROUND_FLOOR)
    cands = [(k - D("0.5")) * step, (k + D("0.5")) * step, (k + D("1.5")) * step]
    cands.append(D(10) ** e - D("0.5") * D(1).scaleb(e - sf))   # boundary tie, e.g. 0.9995 at 3 sf
    g = min(abs(x - c) for c in cands)
    t = min(cands, key=lambda c: abs(x - c))
    return g, t, g / step, g / abs(x)

ROWS = []
def fig(no, loc, rel, exact, chain, sf, stated, unit="", note=""):
    a = rnd(exact, sf)
    b = rnd(chain, sf) if chain is not None else None
    s = D(stated) if stated is not None else None
    verdict = "agrees" if (s is not None and a == s) else ("DISAGREES" if s is not None else "n/a")
    ab = "" if b is None or a == b else f"  [chain display {b} differs]"
    ROWS.append((no, loc, rel, exact, a, stated, verdict, note))
    print(f"{no:>3} | {loc} | {rel} | exact={exact} | double={D(float(exact))} | "
          f"disp({sf}sf)={a}{unit} | chain={chain!r} -> {b} | stated={stated} | {verdict}{ab} {note}")
    return a

def claim(no, loc, text, ok, evidence):
    v = "agrees" if ok else "DISAGREES"
    ROWS.append((no, loc, text, evidence, "", "", v, ""))
    print(f"{no:>3} | {loc} | {text} | {evidence} | {v}")

pct = lambda x: x * 100

print("=== §0.1, §1 worked arithmetic")
fig(1, "§0.1", "F = content ÷ target, 1e6 IU ÷ 1e4 IU/mL", D(10**6) / D(10**4), 1e6 / 1e4, 3, "100", " mL")
fig(2, "§0.1", "F = 1 mg ÷ 1 mg/mL", D(1), 1.0 / 1.0, 3, "1", " mL")
fig(3, "§1", "F = 1 mg ÷ 1 mg/mL (naive, displacement ignored)", D(1), 1.0, 3, "1", " mL")
fig(4, "§1", "C = 1 mg ÷ 1 mL (naive)", D(1), 1.0, 6, "1", " mg/mL",
    "C7's own relation (Dmin applied) gives at most 1 ÷ 1.00073 = 0.999271 mg/mL; §1 is stated as the naive arithmetic")
print("  C7 own result for §1 case, diluent 1 mL entered, reagent alone, no solids:",
      rnd(D(1) / (1 + D("0.001") * V), 6))

print("=== §0.3 method note: 7.3 % against 7.9 %")
fig(5, "§0.3", "D ÷ F = 0.073 ÷ 1", D("0.073") / 1 * 100, 0.073 / 1 * 100, 2, "7.3", " %")
fig(6, "§0.3", "D ÷ Vd = 0.073 ÷ 0.927", D("0.073") / D("0.927") * 100, 0.073 / 0.927 * 100, 2, "7.9", " %")

print("=== §4 C7-UN-04 / §11 displayed-volume resolution: half-step 0.005 on mantissa 1.00..9.99")
fig(7, "§4 UN-04, §11", "lower end 0.005 ÷ 9.99", D("0.005") / D("9.99") * 100, 0.005 / 9.99 * 100, 1, "0.05", " %")
fig(8, "§4 UN-04, §11", "upper end 0.005 ÷ 1.00", D("0.005") / D("1.00") * 100, 0.005 / 1.0 * 100, 1, "0.5", " %")
# §5 On DT-07 "can differ from the target by up to 0.5 %": sup of |F/Fa - 1| with |Vd'-Vd| <= 0.005 * 10^e,
# worst at Vd -> 1.005^- (rounds down to 1.00), D -> 0: departure 0.005 / (1.00 + D) -> 0.5 %.
sup = max(abs((D("1.004999999") + d) / (D("1.00") + d) - 1) for d in (D(0), D("1e-9"), D("1e-3")))
fig(9, "§5 On C7-DT-07", "sup |target/Ca - 1| from 3-sf diluent rounding (Vd->1.005-, D->0)", sup * 100, None, 1, "0.5", " %",
    "supremum, approached not reached")

print("=== §6 additivity example 9.93 + 0.0730 = 10.003 against 10.0")
fig(10, "§6", "Vd' + displayed D", D("9.93") + D("0.0730"), 9.93 + 0.0730, 5, "10.003", " mL")
# Fa = 9.93 + D with D in [0.07295, 0.07305) displays as 10.0 at 3 sf for every such D
lo, hi = rnd(D("9.93") + D("0.07295"), 3), rnd(D("9.93") + D("0.073049999"), 3)
claim(11, "§6", "displayed final 10.0 for any D that displays 0.0730", lo == hi == D("10.0"), f"Fa in [10.00295, 10.00305) -> {lo}..{hi}")
fig(12, "§6", "disagreement |9.93 + 0.0730 - 10.0|", abs(D("9.93") + D("0.0730") - D("10.0")), None, 1, "0.003", " mL")
claim(13, "§6", "0.003 <= one unit of the coarsest place (0.1)", D("0.003") <= D("0.1"), "places: 9.93 -> 0.01, 0.0730 -> 0.0001, 10.0 -> 0.1")
# Supremum claim: error of each rounding in (-u/2, +u/2] for positive values under half away from zero
claim(14, "§6", "sup = u(D)/2 + u(F)/2, approached not reached", True,
      "(dD - D) attains +u(D)/2 at a tie; -(dF - Fa) needs dF - Fa = -u(F)/2, which half-away-from-zero never produces on positives")

print("=== §7 / §11 C7-HI-08 boundary")
fig(15, "§7 On C7-HI-08", "1 ÷ v̄", 1 / V * 1000, 1 / 0.73 * 1000, 3, "1370", " mg/mL")
fig(16, "§11 HI-08 row", "1 ÷ v̄", 1 / V * 1000, 1 / 0.73 * 1000, 3, "1370", " mg/mL")
claim(17, "§7 C7-HI-08", "target form: D >= F <=> (solids ÷ F) >= 1 ÷ v̄; Dmin >= F <=> target >= 1 ÷ v̄", True,
      "D = s·v̄, F = content ÷ target; s·v̄ >= F <=> (s/F)·v̄ >= 1; with s = content, F = content ÷ target -> target·v̄ >= 1")
# 'Cannot fire at all when a diluent volume is entered': in floating point F = fl(entered + D) == D for tiny entered.
Dbig = 1.0; ent = 1e-17
claim(18, "§7 On C7-HI-08, §11 row", "'cannot fire with a diluent entered' (F = entered + D > D)", not (Dbig + ent >= Dbig) or ent == 0,
      f"float: D = {Dbig}, entered = {ent} -> fl(entered + D) = {Dbig + ent!r}, so D >= F evaluates True on computed values")

print("=== §8 C7-FL-08 and §10 C7-FX-11 at f = 7.3 %")
f = D("0.073"); ff = 0.073
fig(19, "§8 FL-08", "shortfall f ÷ (1 + f)", pct(f / (1 + f)), ff / (1 + ff) * 100, 3, "6.80", " %")
fig(20, "§8 FL-08", "overstatement f ÷ (1 − f)", pct(f / (1 - f)), ff / (1 - ff) * 100, 3, "7.88", " %")
fig(21, "§10 FX-11", "shortfall f ÷ (1 + f)", pct(f / (1 + f)), ff / (1 + ff) * 100, 3, "6.80", " %")
fig(22, "§10 FX-11", "overstatement f ÷ (1 − f)", pct(f / (1 - f)), ff / (1 - ff) * 100, 3, "7.88", " %")
print("  mirror path: round6(1/(1-f)) =", rnd(1 / (1 - f), 6), "-> minus 1 =", rnd(1 / (1 - f), 6) - 1,
      "-> 3 sf % =", rnd((rnd(1 / (1 - f), 6) - 1) * 100, 3))
print("  gap of 7.8748651...% below tie 7.875 %:", D("7.875") - pct(f / (1 - f)),
      " flip f where f/(1-f) = 0.07875:", D("0.07875") / D("1.07875") * 100, "%")
print("  1/(1+f) =", 1 / (1 + f), " 1/(1-f) =", 1 / (1 - f))
claim(23, "§5 notation, FL-08", "final known: content ÷ (F + D) = (content ÷ F) ÷ (1 + f); diluent known: content ÷ Vd = (content ÷ F) ÷ (1 − f)", True,
      "F + D = F(1 + f); Vd = F − D = F(1 − f)")

print("=== C7-FX-05")
c, s, t = D(80), D(100), D(80)
F = c / t; Dd = s / 1000 * V; fx = Dd / F; Vd = F - Dd; Vdp = rnd(Vd, 3); Fa = Vdp + Dd; Ca = c / Fa
cF = 80.0 / 80.0; Df = 100.0 / 1000 * Vf; Vdf = cF - Df; Vdpf = float(rnd(Vdf, 3)); Faf = Vdpf + Df; Caf = 80.0 / Faf
fig(24, "FX-05", "total-solids conc = solids ÷ F", s / F, 100.0 / cF, 6, "100", " mg/mL")
fig(25, "FX-05", "F = content ÷ target", F, cF, 3, "1.000", " mL", "(stated at 4 sf; see finding on precision)")
fig(26, "FX-05", "D = solids × v̄", Dd, Df, 3, "0.0730", " mL")
fig(27, "FX-05", "f = D ÷ F", pct(fx), Df / cF * 100, 3, "7.30", " %")
fig(28, "FX-05", "Vd' = round3(F − D)", Vd, Vdf, 3, "0.927", " mL")
fig(29, "FX-05", "Fa = Vd' + D", Fa, Faf, 3, "1.000", " mL", "(stated at 4 sf)")
fig(30, "FX-05", "shortfall f ÷ (1 + f)", pct(fx / (1 + fx)), (Df / cF) / (1 + Df / cF) * 100, 3, "6.80", " %")
fig(31, "FX-05", "Ca = content ÷ Fa", Ca, Caf, 6, "80.0000", " mg/mL")
claim(32, "FX-05", "additivity |Vd' + disp D − disp Fa| <= 1 unit coarsest", abs(Vdp + rnd(Dd, 3) - rnd(Fa, 3)) <= D("0.01"),
      f"|0.927 + 0.0730 − {rnd(Fa,3)}| = {abs(Vdp + rnd(Dd, 3) - rnd(Fa, 3))}")
claim(33, "FX-05", "diluent smaller than content ÷ target by the displacement", F - Vdp == Dd, f"1 − 0.927 = {F - Vdp}")

print("=== C7-FX-06")
Dmin = c / 1000 * V; Vd6 = F - Dmin; Vdp6 = rnd(Vd6, 3); Fa6 = Vdp6 + Dmin; Ca6 = c / Fa6
Dminf = 80.0 / 1000 * Vf; Vd6f = 1.0 - Dminf; Vdp6f = float(rnd(Vd6f, 3)); Fa6f = Vdp6f + Dminf
fig(34, "FX-06", "Dmin = content × v̄", Dmin, Dminf, 3, "0.0584", " mL")
fig(35, "FX-06", "diluent Vd' = round3(F − Dmin)", Vd6, Vd6f, 3, "0.942", " mL")
fig(36, "FX-06", "at most Ca = content ÷ (Vd' + Dmin)", Ca6, 80.0 / Fa6f, 6, "79.9680", " mg/mL")
fig(37, "FX-06", "fmin = v̄ × content ÷ F", pct(Dmin / F), Dminf / 1.0 * 100, 3, "5.84", " %")
claim(38, "FX-06", "fmin 5.84 % exceeds the material threshold (every candidate 0.6/0.8/1 %)", pct(Dmin / F) > 1, "5.84 > 1")
Fe = D("1.00") + Dmin
fig(39, "FX-06", "1.00 mL entered: at most content ÷ (1.00 + Dmin)", c / Fe, 80.0 / (1.00 + Dminf), 6, "75.5858", " mg/mL")
fig(40, "FX-06", "1.00 mL entered: fmin = Dmin ÷ (1.00 + Dmin)", pct(Dmin / Fe), Dminf / (1.00 + Dminf) * 100, 3, "5.52", " %")
fig(41, "FX-06", "0.942 mL entered: at most content ÷ (0.942 + Dmin)", c / (D("0.942") + Dmin), 80.0 / (0.942 + Dminf), 6, "79.9680", " mg/mL")
c2 = D("1.0044"); F2 = c2 / 1; Dm2 = c2 / 1000 * V; Vd2 = F2 - Dm2; Vdp2 = rnd(Vd2, 3); Fa2 = Vdp2 + Dm2; Ca2 = c2 / Fa2
Dm2f = 1.0044 / 1000 * Vf; Vd2f = 1.0044 - Dm2f
fig(42, "FX-06", "1.0044 mg at 1 mg/mL: diluent round3(F − Dmin)", Vd2, Vd2f, 3, "1.00", " mL")
claim(43, "FX-06", "the 1.0044 mg diluent rounds down", Vdp2 < Vd2, f"{Vd2} -> {Vdp2}")
fig(44, "FX-06", "1.0044 mg: at most content ÷ (Vd' + Dmin)", Ca2, 1.0044 / (float(Vdp2) + Dm2f), 6, "1.00366", " mg/mL")
fig(45, "FX-06", "unrounded diluent F − Dmin (80 mg case)", Vd6, Vd6f, 6, "0.941600", " mL")
g, tt, gs, gr = tie_gap(Vd6, 3)
fig(46, "FX-06", "gap of 0.9416 above 3-sf tie", g, D(Vd6f) - D("0.9415"), 3, "1.00e-4", " mL")
claim(47, "FX-06", "nearest 3-sf tie is 0.9415", tt == D("0.9415"), f"nearest tie {tt}")
print("  FX-06 1.0044 case fmin (not stated in the spec):", rnd(pct(Dm2 / F2), 3), "%")

print("=== C7-FX-17")
c3 = D("1.0054"); s3 = D("1.2"); F3 = c3 / 1; D3 = s3 / 1000 * V; Vd3 = F3 - D3; Vdp3 = rnd(Vd3, 3); Fa3 = Vdp3 + D3; Ca3 = c3 / Fa3
D3f = 1.2 / 1000 * Vf; Vd3f = 1.0054 - D3f; Fa3f = float(rnd(Vd3f, 3)) + D3f; Ca3f = 1.0054 / Fa3f
fig(48, "FX-17", "D = solids × v̄", D3, D3f, 3, "0.000876", " mL")
fig(49, "FX-17", "unrounded diluent F − D", Vd3, Vd3f, 7, "1.004524", " mL")
fig(50, "FX-17", "displayed diluent", Vd3, Vd3f, 3, "1.00", " mL")
fig(51, "FX-17", "Fa = Vd' + D (stated unrounded)", Fa3, Fa3f, 7, "1.000876", " mL")
g3, t3, gs3, gr3 = tie_gap(Vd3, 3)
claim(52, "FX-17", "nearest 3-sf tie to the diluent is 1.005 mL", t3 == D("1.005"), f"nearest tie {t3}")
fig(53, "FX-17", "gap 1.005 − 1.004524", g3, D("1.005") - D(Vd3f), 3, "4.76e-4", " mL")
fig(54, "FX-17", "f = D ÷ F", pct(D3 / F3), D3f / 1.0054 * 100, 3, "0.0871", " %")
claim(55, "FX-17", "f below the material threshold (every candidate)", pct(D3 / F3) < D("0.6"), "0.0871 < 0.6")
fig(56, "FX-17", "Ca = content ÷ Fa", Ca3, Ca3f, 6, "1.00452", " mg/mL")
fig(57, "FX-17", "target at 6 sf", D(1), 1.0, 6, "1.00000", " mg/mL")
fig(58, "FX-17", "departure Ca ÷ target − 1", pct(Ca3 - 1), (Ca3f - 1) * 100, 3, "0.452", " %")
claim(59, "FX-17", "above target because the diluent rounds down", Vdp3 < Vd3 and Ca3 > 1, f"{Vd3} -> {Vdp3}; Ca {Ca3}")
fig(60, "FX-17", "hand reproduction 1.0054 ÷ (1.00 + 1.2 × 0.73 × 10^-3)", c3 / (D("1.00") + D("1.2") * D("0.73") * D("1e-3")),
    1.0054 / (1.00 + 1.2 * 0.73e-3), 6, "1.00452", " mg/mL")
claim(61, "FX-17", "no flags: every §8 condition false under the stated declarations", True,
      "FL-01/02 basis reagent alone; FL-03/04 certificate; FL-05 solids declared; FL-06 no capacity; FL-07 1.00 mL >> 2 µL; "
      "FL-08 0.0871 % < 0.6 %; FL-09/10 no C1 import; FL-11/12 carrier absent; FL-13/14 not a conjugate")
claim(62, "FX-17 additivity", "|1.00 + 0.000876 − 1.00| <= 0.01", abs(D("1.00") + D("0.000876") - rnd(Fa3, 3)) <= D("0.01"), "0.000876")

print("=== §11 scope-error bound of v̄")
c100 = D("0.1"); vt = D("0.3"); eps = (V - vt) * c100
fig(63, "§11 scope-error", "first order ε = (0.73 − 0.3) × 0.1 g/mL", pct(eps), (0.73 - 0.3) * 0.1 * 100, 3, "4.30", " %")
fig(64, "§11 scope-error", "exact excess ε ÷ (1 − ε)", pct(eps / (1 - eps)), ((0.73 - 0.3) * 0.1) / (1 - (0.73 - 0.3) * 0.1) * 100, 3, "4.49", " %")
e10 = (V - vt) * D("0.01")
claim(65, "§11 scope-error", "below 10 mg/mL, under 0.5 % for any v̄ >= 0.3", eps / (1 - eps) > 0 and e10 / (1 - e10) < D("0.005"),
      f"at 10 mg/mL, v̄ 0.3: first order {pct(e10)} %, exact {rnd(pct(e10/(1-e10)),3)} %")
claim(66, "§11 scope-error", "ε exact as fractional final-volume error, both directions", True,
      "final known: true final = F − (0.73 − v)s = F(1 − ε); diluent known: computed F = Vd + 0.73s, true = Vd + vs = F(1 − ε); ε = (0.73 − v)s/F")
fig(67, "§11 scope-error, §11 assumption 1", "volume crossover |0.73 − v| = v", V / 2, 0.73 / 2, 3, "0.365", " mL/g")

def solve(fun, a=D("0.01"), b=D("0.7299")):
    fa = fun(a)
    for _ in range(200):
        m = (a + b) / 2
        fm = fun(m)
        if (fm > 0) == (fa > 0):
            a, fa = m, fm
        else:
            b = m
    return (a + b) / 2

def ratios(direction, v, cc):
    """true/reported for corrected and uncorrected, c = solids ÷ tool's computed (corrected) final."""
    if direction == "final known":
        return 1 / (1 - (V - v) * cc), 1 / (1 + v * cc)
    else:  # diluent known; Vd = s(1/c − 0.73)
        return 1 / (1 - (V - v) * cc), (1 - V * cc) / (1 - V * cc + v * cc)

measures = {
    "true/reported − 1 (spec's 'concentration excess')": lambda r: abs(r - 1),
    "reported/true − 1": lambda r: abs(1 / r - 1),
    "|ln(true/reported)|": lambda r: abs(D(r).ln()),
}
print("  crossover v̄ at which corrected and uncorrected concentration errors are equal:")
GRID = {}
for dn in ("final known", "diluent known"):
    for mn, m in measures.items():
        row = []
        for cc in (D("0.001"), D("0.01"), D("0.1")):
            x = solve(lambda v: m(ratios(dn, v, cc)[0]) - m(ratios(dn, v, cc)[1]))
            row.append(rnd(x, 3))
            GRID[(dn, mn, cc)] = x
        print(f"   {dn:13s} | {mn:48s} | 1 mg/mL {row[0]} | 10 mg/mL {row[1]} | 100 mg/mL {row[2]}")
fig(68, "§11 scope-error", "concentration crossover at 1 mg/mL (every grid cell)", GRID[("final known", list(measures)[0], D("0.001"))], None, 3, "0.365", " mL/g")
fig(69, "§11 scope-error", "concentration crossover at 100 mg/mL, final known, spec's excess measure",
    GRID[("final known", list(measures)[0], D("0.1"))], None, 3, "0.378", " mL/g")

print("=== §11 material threshold (orientation values) and handoff / §17 repeats")
for no, loc, p, st in ((70, "§11", "0.01", "13.7"), (71, "§11", "0.008", "11.0"), (72, "§11", "0.006", "8.2"),
                       (73, "§17 item 1", "0.01", "13.7"), (74, "§17 item 1", "0.008", "11.0"), (75, "§17 item 1", "0.006", "8.2"),
                       (76, "handoff", "0.01", "13.7"), (77, "handoff", "0.008", "11.0"), (78, "handoff", "0.006", "8.2")):
    sf = 2 if st == "8.2" else 3
    fig(no, loc, f"c = f ÷ v̄ at f = {p}", D(p) / V * 1000, float(p) / 0.73 * 1000, sf, st, " mg/mL",
        "(8.22 at 3 sf)" if st == "8.2" else "")

print("=== §11 Dmin row")
fig(79, "§11 Dmin row", "fmin = v̄ × target, 100 mg/mL", pct(V * D("0.1")), 0.73 * 0.1 * 100, 2, "7.3", " %")
fig(80, "§11 Dmin row", "fmin = v̄ × target, 10 mg/mL", pct(V * D("0.01")), 0.73 * 0.01 * 100, 2, "0.73", " %")
fig(81, "§11 Dmin row", "fmin = v̄ × target, 13.7 mg/mL", pct(V * D("0.0137")), 0.73 * 0.0137 * 100, 1, "1", " %")
claim(82, "§5 notation / FL-05", "fmin = v̄ × content ÷ F = v̄ × target in the target direction", True, "F = content ÷ target")

print("=== §11 Dmin assumption rows")
fig(83, "§11 assumption 3", "0.70 ÷ 0.73", D("0.70") / V, 0.70 / 0.73, 3, "0.959")
fig(84, "§11 assumption 3", "Dmin exceeds own displacement: 0.73 ÷ 0.70 − 1", pct(V / D("0.70") - 1), (0.73 / 0.70 - 1) * 100, 1, "4", " %",
    "(4.29 %; 1 − 0.959 gives 4.11 %; both ≈ 4 %)")
fig(85, "§11 assumption 3", "over-correction (0.73 − 0.70) × 0.1 g/mL", pct((V - D("0.70")) * D("0.1")), (0.73 - 0.70) * 0.1 * 100, 1, "0.3", " %",
    "(exact conc excess 0.003/0.997 = 0.301 %)")

print("=== §6 invariance departure table — simulation (target direction; see report for assumptions)")
def sim(seed, n, sampler):
    rng = random.Random(seed)
    worst = {"6sf": 0, "7sf": 0, "D6": 0}; miss = {"6sf": 0, "7sf": 0, "D6": 0}; kept = 0; rej = 0
    firstdiff = {}
    for _ in range(n):
        content, target, ratio = sampler(rng)
        solids = content * ratio
        Fv = content / target; Dv = solids / 1000 * Vf
        if Dv >= Fv:
            rej += 1; continue
        kept += 1
        vdp = float(rnd(Fv - Dv, 3)); fa = vdp + Dv; ca = content / fa
        C6 = rnd(ca, 6); ulp = D(1).scaleb(C6.adjusted() - 5)
        for key, fin in (("6sf", float(rnd(fa, 6))), ("7sf", float(rnd(fa, 7))), ("D6", vdp + float(rnd(Dv, 6)))):
            R = rnd(content / fin, 6)
            u = abs(int((R - C6) / ulp))
            if u:
                miss[key] += 1
            worst[key] = max(worst[key], u)
        # 'fourth to sixth significant figure': final built from displayed D (3 sf), concentration from unrounded
        Rd = rnd(content / (vdp + float(rnd(Dv, 3))), 6)
        if Rd != C6:
            rel = abs(Rd - C6) / C6          # relative departure; binned by the significant figure it reaches
            k = "<=3rd sf" if rel >= D("1e-3") else ("4th" if rel >= D("1e-4") else ("5th" if rel >= D("1e-5") else "6th"))
            firstdiff[k] = firstdiff.get(k, 0) + 1
            if rel > worst.get("relD3", D(0)):
                worst["relD3"] = rel; worst["relD3_f"] = round(Dv / Fv, 4)
    return worst, {k: v / kept for k, v in miss.items()}, kept, rej, dict(sorted(firstdiff.items()))

def logu(rng, a, b):
    return math.exp(rng.uniform(math.log(a), math.log(b)))
samplers = {
    "log-uniform content 1e-3..1e3 mg, target 1..316 mg/mL, ratio 1..50": lambda r: (logu(r, 1e-3, 1e3), logu(r, 1, 316), logu(r, 1, 50)),
    "log content/target, ratio uniform 1..50": lambda r: (logu(r, 1e-3, 1e3), logu(r, 1, 316), r.uniform(1, 50)),
    "uniform target 1..316, log content, ratio uniform 1..50": lambda r: (logu(r, 1e-3, 1e3), r.uniform(1, 316), r.uniform(1, 50)),
}
SIMRES = []
for name, smp in samplers.items():
    for seed in (20260928, 7):
        w, m, k, rj, fd = sim(seed, 60000, smp)
        SIMRES.append((name, seed, w, m, k, rj, fd))
        print(f"  {name} | seed {seed} | kept {k}, rejected by HI-08 {rj} | worst ulp/rel {w} | miss rate "
              f"{ {kk: round(vv*100, 2) for kk, vv in m.items()} } % | first differing sf (3-sf D) {fd}")

print("=== displayed-value tie gaps (C7-FX-12 / FX-06 'closest approach')")
TIES = [
    ("FX-05 TS conc 100.000 mg/mL", D(100), 6), ("FX-05 F 1.00 mL", D(1), 3), ("FX-05 D 0.0730 mL", D("0.073"), 3),
    ("FX-05 f 7.30 %", D("7.3"), 3), ("FX-05 Vd' 0.927 mL (unrounded 0.927)", D("0.927"), 3), ("FX-05 Fa 1.00 mL", D(1), 3),
    ("FX-05 Ca 80.0000 mg/mL", D(80), 6), ("FX-05 shortfall 6.80 %", pct(D("0.073") / D("1.073")), 3),
    ("FX-06 Dmin 0.0584 mL", Dmin, 3), ("FX-06 diluent 0.942 mL (unrounded 0.9416)", Vd6, 3), ("FX-06 Fa 1.00 mL (1.0004)", Fa6, 3),
    ("FX-06 Ca at most 79.9680", Ca6, 6), ("FX-06 fmin 5.84 %", pct(Dmin), 3),
    ("FX-06 1.00 entered: Ca 75.5858", c / Fe, 6), ("FX-06 1.00 entered: fmin 5.52 %", pct(Dmin / Fe), 3), ("FX-06 1.00 entered: Fa 1.06 (1.0584)", Fe, 3),
    ("FX-06 1.0044: Dmin 0.000733 mL", Dm2, 3), ("FX-06 1.0044: diluent 1.00 (1.003666788)", Vd2, 3), ("FX-06 1.0044: Fa 1.00 (1.000733212)", Fa2, 3),
    ("FX-06 1.0044: Ca at most 1.00366", Ca2, 6), ("FX-06 1.0044: fmin 0.0730 % (not stated)", pct(Dm2 / F2), 3),
    ("FX-17 D 0.000876 mL", D3, 3), ("FX-17 diluent 1.00 (1.004524)", Vd3, 3), ("FX-17 Fa 1.00 (1.000876)", Fa3, 3),
    ("FX-17 Ca 1.00452", Ca3, 6), ("FX-17 target 1.00000", D(1), 6), ("FX-17 f 0.0871 %", pct(D3 / F3), 3), ("FX-17 departure 0.452 %", pct(Ca3 - 1), 3),
    ("FL-08/FX-11 overstatement (7.87 %)", pct(f / (1 - f)), 3), ("FL-08/FX-11 shortfall 6.80 %", pct(f / (1 + f)), 3),
]
for name, x, sf in TIES:
    g, tt, gs, gr = tie_gap(D(float(x)), sf)
    print(f"  {name:45s} | exact {x} | nearest tie {tt} | gap {g:.3E} | per own step {gs:.3f} | relative {gr:.3E}")

print("=== derived, not stated (FX-04, FX-07 carry no expected values)")
F4 = D(1); D4 = D(1) / 1000 * V; Vd4 = F4 - D4; Vdp4 = rnd(Vd4, 3); Fa4 = Vdp4 + D4
print("  FX-04 (1 mg total, target 1 mg/mL): D", D4, " Vd", Vd4, "->", Vdp4, " Fa", Fa4, "->", rnd(Fa4, 3),
      " Ca (total solids)", rnd(1 / Fa4, 6), " f", rnd(pct(D4 / F4), 3), "%  diluent tie gap", tie_gap(Vd4, 3)[0])
F7 = D(10**6) / D(10**4); D7 = D(5) / 1000 * V; Vd7 = F7 - D7; Vdp7 = rnd(Vd7, 3); Fa7 = Vdp7 + D7
print("  FX-07 second case (1e6 IU, 1e4 IU/mL, 5 mg solids): D", D7, " f", rnd(pct(D7 / F7), 3), "%  Vd", Vd7, "->", Vdp7,
      " Fa", Fa7, "->", rnd(Fa7, 3), " Ca", rnd(D(10**6) / Fa7, 6), "IU/mL")

print("=== direction pass: labelled bounds against their displayed figures")
for name, unr, sf, kind in (("FX-06 80 mg target: Ca 'at most'", Ca6, 6, "max"), ("FX-06 80 mg target: Fa 'at least'", Fa6, 3, "min"),
                            ("FX-06 1.00 entered: Ca 'at most'", c / Fe, 6, "max"), ("FX-06 1.00 entered: Fa 'at least'", Fe, 3, "min"),
                            ("FX-06 1.0044: Ca 'at most'", Ca2, 6, "max"), ("FX-06 1.0044: Fa 'at least'", Fa2, 3, "min")):
    d = rnd(unr, sf)
    ok = (d >= unr) if kind == "max" else (d <= unr)
    print(f"  {name:36s} unrounded {unr} displayed {d} -> displayed figure is {'a valid' if ok else 'NOT a valid'} "
          f"{'upper' if kind == 'max' else 'lower'} bound on the unrounded bound (diff {d - unr:+.3E})")

print("=== summary")
n = len(ROWS); dis = [r for r in ROWS if r[6] == "DISAGREES"]
print(f"  script rows: {n}; DISAGREES: {[r[0] for r in dis]}")
