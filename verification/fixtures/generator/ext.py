"""Hand derivation of the protocol-2 `extended` block, from the URS relations only.
Every quantity is derived twice: once from the IEEE-754 double chain (exact value of each double,
rounded on that exact value) and once from the exact-decimal chain; a displayed string or number on
which the two disagree (a value within an ulp-scale distance of a rounding critical point) is omitted."""
from model import *

GAPS = []
def D3(x, n=17):
    if x is None: return "n/a"
    return format(Decimal(x), ".%dg" % n)

DEP_SMALL = Decimal("1e-9")     # below: departure is indistinguishable from double noise -> omitted
DEP_NUM = Decimal("5e-4")       # below: the number is stated to less than 1e-12 relative only by luck -> display only
CLOSE = Decimal("0.01")         # a displayed figure within 1 % of its quantum of a tie/grid point is not asserted

def pct(x, up=False):
    """fraction (Decimal) -> ('display', close?) ; 3 sf half away on the exact value, x100 exact, ' %'.
    up=True: rounded toward +inf on the signed exact value (away from zero if positive, toward zero if negative);
    closeness is then the distance to the nearest 3-sf grid point."""
    if x == 0: return "0 %", False
    a = abs(x)
    if up:
        r = rnd(x, 3, ROUND_CEILING)
        d, qq = grid_dist(a, 3)
        return format(r.scaleb(2), "f") + " %", (d / qq) < CLOSE
    r = rnd(a, 3)
    d, qq = tie_dist(a, 3)
    s = format(r.scaleb(2), "f")
    return ("-" if x < 0 else "") + s + " %", (d / qq) < CLOSE

def sgn_pct(x, up=False):
    s, c = pct(x, up)
    if x > 0: s = "+" + s
    return s, c

def sf(x, n, mode=ROUND_HALF_UP):
    """display + closeness. tie distance for half-away, grid distance for directed"""
    r = rnd(x, n, mode)
    d, qq = (tie_dist(x, n) if mode == ROUND_HALF_UP else grid_dist(x, n))
    return format(r, "f"), (d / qq) < CLOSE

def ext(case, r, flags, N):
    v = r["_vals"]; c = case
    D = lambda x: None if x is None else Decimal(x)
    E = {}
    txt = []
    act = c["content"]["unit"] in ("IU", "U")
    basis = c["contentBasis"]
    bound = v["bound"]
    # C7-DT-04
    tv_ = (not act) and basis == "total-vial-contents"
    E["reagentConcentration"] = "not-computable" if tv_ else "computable"
    txt.append("EXT reagentConcentration (C7-DT-04): %s" % ("content basis is the total vial contents -> every computed concentration is that of total solids; reagent-alone concentration not computable" if tv_ else "content basis is not the total vial contents (%s) -> computable" % ("activity content, basis ignored" if act else basis)))
    # rounding directions
    E["concentrationRounding"] = "up" if bound else "half-away"
    E["final"] = {"isLowerBound": bool(bound), "rounding": "down" if bound else "half-away"}
    txt.append("EXT rounding: Dapp %s Dmin -> concentration rounded %s, final volume %s (decision 2026-09-28)" % ("=" if bound else "is not", "UP and labelled 'at most'" if bound else "half away (C7-UN-06)", "an 'at least' lower bound rounded DOWN" if bound else "half away, not a bound"))
    close = []
    # departure
    if c["direction"] == "target":
        Ca = D(v["Ca_disp"]); T = D(v["Tdisp"])
        dep = Ca / T - 1
        s, cl = sgn_pct(dep, bool(bound))
        # the double chain: Ca/T - 1 in IEEE doubles, its exact binary value rounded the same way
        if N is float:
            depd = Decimal(float(v["Ca_disp"]) / float(v["Tdisp"]) - 1.0)
            sd, _ = sgn_pct(depd, bool(bound))
            if sd != s: cl = True
        zero = (dep == 0) and (N is not float or depd == 0)
        E["departure"] = {"unrounded": dep, "display": s, "_close": cl, "_abs": abs(dep), "_zero": zero,
                          "isUpperBound": bool(bound), "rounding": "up" if bound else "half-away"}
        if bound:
            alt = sgn_pct(dep, False)[0]
            txt.append("EXT departure (C7-DT-07, addendum 29 Sept 2026): the concentration is 'at most' so the departure is an upper bound (isUpperBound, rounded UP): Ca/target - 1 = %s / %s - 1 = %s (exact binary value of the quotient's double: %s) -> 3 sf toward +inf on the signed fraction, x100: %s (half away from zero would give %s)%s" % (D3(v["Ca_disp"]), D3(v["Tdisp"]), format(dep, ".12g"), format(depd, ".12g") if N is float else "n/a", s, alt, "" if abs(dep) >= DEP_NUM else " [|departure| small: number not asserted]"))
        else:
            txt.append("EXT departure (C7-DT-07): Ca/target - 1 = %s / %s - 1 = %s -> not a bound (isUpperBound false), 3 sf half away then x100: %s%s" % (D3(v["Ca_disp"]), D3(v["Tdisp"]), format(dep, ".12g"), s, "" if abs(dep) >= DEP_NUM else " [|departure| small: number and/or display not asserted, see generator]"))
    else:
        E["departure"] = None
    # fl05
    if v["Dmin"] is not None and r["treatment"] == "reagent-own-volume-only":
        u = v["dispunit"]; scl = VOL[u]
        Dmin = D(v["Dmin"]); fmin = D(v["fmin"])
        Dd = scale(Dmin, -scl, Decimal)
        ds, c1_ = sf(Dd, 3)
        ps, c2_ = pct(fmin)
        exc = (v["fmin"] > c["threshold"]) if N is float else (v["fmin"] > Decimal(repr(c["threshold"])))
        E["fl05"] = {"Dmin": {"unrounded": Dmin, "display": ds, "_close": c1_}, "fmin": {"unrounded": fmin, "display": ps, "_close": c2_}, "exceedsThreshold": bool(exc)}
        txt.append("EXT fl05 (C7-FL-05): Dmin = content_g x 0.73 = %s mL -> %s %s (3 sf); fmin = Dmin/F = %s -> %s; fmin %s the threshold %r (strict, doubles)" % (D3(v["Dmin"]), ds, u, D3(v["fmin"], 12), ps, ">" if exc else "<=", c["threshold"]))
    else:
        E["fl05"] = None
    # fl08
    if "C7-FL-08" in flags and v["f"] is not None:
        f = D(v["f"])
        dilk = c["direction"] == "volume" and c["volumeBasis"] == "diluent"
        if dilk:
            fac = 1 / (1 - f); per = f / (1 - f); kv = "diluent"
        else:
            fac = 1 / (1 + f); per = f / (1 + f); kv = "final"
        fs, c1_ = sf(fac, 3)
        ps, c2_ = pct(per)
        E["fl08"] = {"knownVolume": kv, "factor": {"unrounded": fac, "display": fs, "_close": c1_}, "percent": {"unrounded": per, "display": ps, "_close": c2_}}
        txt.append("EXT fl08 (C7-FL-08, keyed to the known volume = %s): f = D/F = %s; %s = %s -> %s; %s = %s -> %s" % (kv, D3(v["f"], 12), "1/(1-f)" if dilk else "1/(1+f)", D3(fac, 12), fs, "f/(1-f) overstatement" if dilk else "f/(1+f) shortfall", D3(per, 12), ps))
    else:
        E["fl08"] = None
    # molar
    if c["c1"] is not None:
        row = v["row"]; permitted = row in (7, 8, 9)
        mt = v["molar_target"]
        unit = c["target"]["unit"] if mt else c.get("molarUnit")
        if not permitted:
            E["molar"] = {"row": row, "status": "withheld", "of": None, "unit": None, "unrounded": None, "display": None, "rounding": None}
            txt.append("EXT molar (C7-DT-06): pairing row %d not permitted -> withheld, nothing reported" % row)
        elif unit is None:
            E["molar"] = {"row": row, "status": "unit-not-selected", "of": None, "unit": None, "unrounded": None, "display": None, "rounding": None}
            txt.append("EXT molar (C7-DT-06): pairing row %d permitted, mass target, no molar unit selected -> unit-not-selected" % row)
        else:
            Cab = D(v["Ca"]); mw = D(v["mw"])
            molL = Cab / mw
            val = scale(molL, -MOLAR[unit], Decimal)
            mode = ROUND_CEILING if bound else ROUND_HALF_UP
            ds, cl = sf(val, 6, mode)
            # alternative reading: divide the DISPLAYED concentration (string) rather than the unrounded one
            cu_disp = v["unit"]
            k = 0 if (act or mt) else CONC[c["target"]["unit"] if c["direction"] == "target" else c["reportUnit"]]
            alt = scale(Decimal(r["displayed"]["concentration"]), k, Decimal) / mw
            alt = scale(alt, -MOLAR[unit], Decimal)
            alts, _ = sf(alt, 6, mode)
            amb = alts != ds
            E["molar"] = {"row": row, "status": "reported", "of": {7: "reagent", 8: "protein", 9: "conjugate"}[row], "unit": unit,
                          "unrounded": val, "display": ds, "rounding": "up" if bound else "half-away", "_close": cl or amb, "_amb": amb}
            txt.append("EXT molar (C7-DT-06, row %d): Ca %s mg/mL / MW %s g/mol = %s mol/L = %s %s (of the %s) -> 6 sf rounded %s: %s%s" % (row, D3(v["Ca"], 12), D3(v["mw"], 12), D3(molL, 12), D3(val, 12), unit, E["molar"]["of"], "UP ('at most')" if bound else "half away", ds, " [display omitted: within a critical point or the displayed-vs-unrounded reading differs]" if (cl or amb) else ""))
    else:
        E["molar"] = None
    return E, txt

def merge(id, a, b, path=""):
    """a: float-chain tree; b: decimal-chain tree; returns JSON tree with omissions"""
    if isinstance(a, dict):
        out = {}
        for k, x in a.items():
            if k.startswith("_"): continue
            y = b.get(k) if isinstance(b, dict) else None
            if x is None:
                out[k] = None; continue
            m = merge(id, x, y, path + "." + k)
            if m is not OMIT: out[k] = m
        # closeness flags
        if a.get("_close") or a.get("_amb"):
            out.pop("display", None); GAPS.append((id, path, "display omitted: within %s of a rounding critical point / ambiguous reading" % CLOSE))
        return out
    if isinstance(a, bool) or isinstance(a, str):
        if path.endswith("exceedsThreshold") or a == b: return a
        GAPS.append((id, path, "float/decimal disagree: %r vs %r" % (a, b))); return OMIT
    if isinstance(a, Decimal):
        if b is None: return float(a)
        if a == 0 and b == 0: return 0.0
        if abs(a - b) <= abs(a) * Decimal("1e-9"): return float(a)
        GAPS.append((id, path, "float/decimal numbers disagree")); return OMIT
    return a

class _O: pass
OMIT = _O()

def build(id, case, rf, rd):
    """returns (extended JSON, text lines)"""
    flags = rf["flags"]
    Ef, txt = ext(case, rf, flags, float)
    try:
        Ed, _ = ext(case, rd, flags, Decimal)
    except Exception as e:
        Ed = None
    if Ed is None:
        Ed = {}
    # departure special handling
    dep = Ef["departure"]
    if dep is not None:
        ab = dep["_abs"]
        if dep.get("_zero") and bound_of(case, rf):
            dep["unrounded"] = Decimal(0)
            dep["display"] = "0 %"; dep["_close"] = False
            GAPS.append((id, "departure", "exactly zero in both chains (Fa = F exactly): '0 %' asserted, isUpperBound true; the boundary of the grid, direction immaterial"))
        elif ab < DEP_SMALL:
            GAPS.append((id, "departure", "omitted: |departure| %s below 1e-9 (mathematically zero or double noise)" % format(ab, ".3g")))
            Ef["departure"] = {"isUpperBound": dep["isUpperBound"], "rounding": dep["rounding"]}
        elif ab < DEP_NUM:
            dep["unrounded"] = None
            GAPS.append((id, "departure.unrounded", "omitted: |departure| %s < 5e-4, relative 1e-12 not attainable through the subtraction" % format(ab, ".3g")))
    out = {}
    for k, x in Ef.items():
        if x is OMIT_KEY: continue
        if isinstance(x, dict):
            y = Ed.get(k)
            m = merge(id, x, y, k)
            if k == "departure" and x.get("unrounded", 1) is None: m.pop("unrounded", None)
            out[k] = m
        else:
            out[k] = x
    return out, txt

OMIT_KEY = object()
def bound_of(case, r): return bool(r["_vals"]["bound"])
