import json, math, sys
from model import *
import ext as EXT

OUT = []
FAILS = []
IDS = set()
def q(v,u): return {"value":v,"unit":u}
BASE = dict(direction="target", content=q("3.2","mg"), contentBasis="reagent-alone", provenance="coa",
            conjugate="none", carrier="absent", wholeVial=True, totalSolids=q("3.9","mg"),
            volumeBasis="diluent", target=q("2.5","mg/mL"), minTransfer=q("2","µL"), capacity=None,
            c1=None, molarUnit=None, threshold=0.006)
KEYORDER = ["id","direction","content","contentBasis","provenance","conjugate","carrier","wholeVial","totalSolids",
            "volumeBasis","target","volume","reportUnit","molarUnit","minTransfer","capacity","c1","threshold"]
def C(id="x", **k):
    d = dict(BASE); d.update(k)
    if d["direction"] == "volume":
        d.pop("target", None)
    else:
        d.pop("volume", None); d.pop("reportUnit", None)
    d["id"] = id
    return {kk: d[kk] for kk in KEYORDER if kk in d}

def D3(x, n=17):
    if x is None: return "n/a"
    return format(Decimal(x), ".%dg" % n)

def tiestr(t, unit):
    if t is None: return None
    d, qq = t
    return format(d, "f")

def tienote(ties, units, directed=False):
    parts = []
    for k in ("diluent", "final", "concentration"):
        t = ties[k]
        if t is None: parts.append("%s: entered as typed, no rounding" % k)
        else:
            d, qq = t
            if directed and k != "diluent":
                parts.append("%s: DIRECTED rounding (%s) - distance %s %s = %s of the display quantum %s to the nearest grid point (the critical point; a value within it of a grid point rounds to the grid point on one side or the other)" % (k, "up, 'at most'" if k == "concentration" else "down, 'at least'", format(d, "f"), units[k], format(float(d/qq), ".4g"), format(qq, "f")))
                continue
            parts.append("%s: tie distance %s %s = %s of the display quantum %s" % (k, format(d, "f"), units[k], format(float(d/qq), ".4g"), format(qq, "f")))
    return "Tie audit (C7-FX-12): " + "; ".join(parts) + "."

def derivation(case, r):
    v = r["_vals"]
    c = case
    L = []
    cu = c["content"]
    L.append("content = %s %s -> %s %s base" % (cu["value"], cu["unit"], D3(v["content_base"]), "IU/U" if cu["unit"] in ("IU","U") else "mg"))
    if c["direction"] == "target":
        L.append("target = %s %s; F = content / target = %s mL" % (c["target"]["value"], c["target"]["unit"], D3(v["F"])))
    else:
        L.append("volume entered = %s %s (%s basis)" % (c["volume"]["value"], c["volume"]["unit"], c["volumeBasis"]))
    if v["D"] is not None:
        L.append("D = solids_g x 0.73 mL/g = %s mL; f = D/F = %s" % (D3(v["D"]), D3(v["f"])))
    elif v["Dmin"] is not None:
        L.append("total solids not declared: Dmin = content_g x 0.73 = %s mL applied; fmin = Dmin/F = %s" % (D3(v["Dmin"]), D3(v["fmin"])))
    else:
        L.append("no solids mass and Dmin undefined: Dapp = 0, no correction")
    if "C7-FL-08" in r["flags"]:
        f_ = Decimal(v["f"])
        if c["direction"] == "volume" and c["volumeBasis"] == "diluent":
            L.append("FL-08 payload (diluent entered): f = D/F = %s (F = entered diluent + D); content/diluent overstates by factor 1/(1-f) = %s, i.e. f/(1-f) = %s %%" % (D3(f_, 6), D3(1/(1-f_), 6), format(rnd(f_/(1-f_)*100, 3), "f")))
        else:
            L.append("FL-08 payload (final volume known): f = D/F = %s; delivering F as diluent gives concentration x 1/(1+f) = %s, shortfall f/(1+f) = %s %%" % (D3(f_, 6), D3(1/(1+f_), 6), format(rnd(f_/(1+f_)*100, 3), "f")))
    if v["fmin"] is not None:
        L.append("FL-05 payload: fmin = v x content / F = Dmin/F = %s (%s in the target direction: v x target); %s the threshold %s" % (D3(v["fmin"], 6), "= 0.73 x target" , "above" if v["fmin"] > c["threshold"] else "not above", c["threshold"]))
    L.append("Vd = F - Dapp = %s mL; Vd' = %s (%s); Fa = Vd' + Dapp = %s mL" % (D3(v["Vd"]), D3(v["Vdp"]), r["displayed"]["diluent"], D3(v["Fa"])))
    if r["_directed"]:
        L.append("Ca = content / Fa = %s (exact binary value) -> 'at most' displayed rounded UP (toward +inf) at 6 sf: %s %s; Fa = %s (exact binary value) -> 'at least' final rounded DOWN at 3 sf: %s (half away from zero would give %s)" % (D3(v["Ca_disp"]), r["displayed"]["concentration"], v["unit"] if c["direction"]=="target" else c.get("reportUnit",""), D3(v["Fa"] if r["_vals"]["dispunit"]=="mL" else v["Fa"]*1000), r["displayed"]["final"], fmt(rnd(Decimal(v["Fa"] if r["_vals"]["dispunit"]=="mL" else v["Fa"]*1000),3))))
    else:
        L.append("Ca = content / Fa = %s -> displayed %s %s; final displayed %s" % (D3(v["Ca_disp"]), r["displayed"]["concentration"], v["unit"] if c["direction"]=="target" else c.get("reportUnit",""), r["displayed"]["final"]))
    return "; ".join(L)

def add(id, covers, constr, case, boundary=False, omit=(), extra=None, allow_close=False, note=""):
    assert id not in IDS, id
    IDS.add(id)
    case = dict(case); case["id"] = id
    rf = solve(case, float)
    entry = {"id": id, "covers": covers, "construction": constr, "case": case}
    if rf["status"] == "rejected":
        rd = solve(case, Decimal)
        assert rd == rf, (id, rd, rf)
        entry["expect"] = {"status": "rejected", "rejections": rf["rejections"]}
        entry["handDerivation"] = "Rejected before computation: %s. %s" % (", ".join(rf["rejections"]), note)
        OUT.append(entry); return rf
    rd = solve(case, Decimal)
    if not boundary:
        try:
            assert rd["displayed"] == rf["displayed"], (id, rd["displayed"], rf["displayed"])
            assert rd["flags"] == rf["flags"], (id, rd["flags"], rf["flags"])
            assert rd["treatment"] == rf["treatment"] and rd["label"] == rf["label"], id
            for k, t in rf["_ties"].items():
                if t is None: continue
                d, qq = t
                if not allow_close:
                    assert d / qq >= Decimal("0.01"), (id, k, float(d/qq), rf["displayed"])
            v = rf["_vals"]
            for key in ("f", "fmin"):
                if v[key] is not None and not allow_close:
                    assert not (0.006 <= v[key] <= 0.0100000001), (id, key, v[key])
        except AssertionError as e:
            FAILS.append(e.args[0])
    ex = {"status": "result", "flags": rf["flags"], "label": rf["label"], "treatment": rf["treatment"]}
    ex["molar"] = rf.get("molar")
    ex["displayed"] = dict(rf["displayed"])
    exj, exttxt = EXT.build(id, case, rf, rd)
    ex["extended"] = exj
    for o in omit:
        if "." in o:
            a, b = o.split("."); ex[a].pop(b, None)
        else: ex.pop(o, None)
    if extra: ex.update(extra)
    entry["expect"] = ex
    u = rf["_vals"]["dispunit"]
    tu = rf["_vals"]["unit"]
    cu_ = rf["_vals"]["unit"] if case["direction"]=="target" else case["reportUnit"]
    if exj.get("fl08") and exj["fl08"]["knownVolume"] == "diluent" and abs(rf["_vals"]["f"] - 0.073) < 1e-9:
        entry["construction"] += " URS PRINTED-FIGURE CONTRADICTION: C7-FL-08 / C7-FX-11 print the overstatement at f = 7.3 % as 7.88 %; derived here f/(1-f) = 0.073/0.927 = 0.0787487 -> fraction to 3 sf 0.0787 -> 7.87 %. The derivation is used, not the printed figure."
    entry["handDerivation"] = derivation(case, rf) + " " + " | ".join(exttxt) + ((" " + note) if note else "") + " " + tienote(rf["_ties"], {"diluent": u, "final": u, "concentration": cu_}, rf["_directed"])
    entry["tieDistances"] = {"diluent": tiestr(rf["_ties"]["diluent"], u),
                             "final": tiestr(rf["_ties"]["final"], u),
                             "concentration": tiestr(rf["_ties"]["concentration"], rf["_vals"]["unit"] if case["direction"]=="target" else case["reportUnit"])}
    OUT.append(entry)
    return rf

def vol_from(tcase, r, mode, ftext=None):
    """volume-direction twin of a target case"""
    c = dict(tcase); c["direction"] = "volume"
    c.pop("target", None)
    c["reportUnit"] = tcase["target"]["unit"] if tcase["target"]["unit"] not in MOLAR else "mg/mL"
    if mode == "diluent":
        c["volumeBasis"] = "diluent"; c["volume"] = q(r["displayed"]["diluent"], "mL")
    else:
        c["volumeBasis"] = "final"; c["volume"] = q(ftext, "mL")
    return C(**{k: v for k, v in c.items() if k != "id"})

def ftext_of(r, n=4):
    return fmt(rnd(Decimal(r["_vals"]["F"]), n))

def dirs(id, covers, constr, tcase, ftxt_n=4, **kw):
    """the case in target direction and in volume direction (diluent entered, final entered)"""
    r = add(id + "-T", covers, constr + " [target -> volumes]", tcase, **kw)
    if r["status"] == "rejected": return r
    d = vol_from(tcase, r, "diluent")
    add(id + "-VD", covers, constr + " [volume -> concentration, diluent entered = displayed diluent of the target case]", d, **kw)
    ft = ftext_of(r, ftxt_n)
    fcase = vol_from(tcase, r, "final", ft)
    add(id + "-VF", covers, constr + " [volume -> concentration, final volume entered = %s mL]" % ft, fcase, **kw)
    return r

import os as _os
exec(open(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "fixtures.py")).read())

import os as _os
OUT_PATH = _os.environ.get("OUT", _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "..", "expected.json"))
json.dump(OUT, open(OUT_PATH, "w"), ensure_ascii=False, indent=1)
print(len(OUT), "entries")
json.dump([dict(id=a,path=b,why=c) for a,b,c in EXT.GAPS], open(_os.path.join(_os.path.dirname(OUT_PATH), "extended-omissions.json"), "w"), indent=1, ensure_ascii=False)
for f_ in FAILS: print("FAIL", f_)
