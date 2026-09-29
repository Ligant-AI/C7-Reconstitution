"""Oracle sensitivity check (standing rule 2 applied to the amended checks): mutate the
engine's real results on the directed cases and confirm the oracle fails each mutant.
Run: python3 verification/adversarial/mutate_oracle.py"""
import sys, json, copy
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from adv_lib import run, round_sf, fmt, D, pct, signed
from oracle import check, model
import gen_directed
G = gen_directed.cases()
cs = [c for c, _ in G]
rs = run(cs)
disc = {"conc": 0, "final": 0, "dep": 0, "molar": 0}
def muts(c, r):
    m = model(c)
    out = []
    ex = r.get("extended")
    if r["status"] != "result" or not ex: return out
    atm = m["treatment"] == "reagent-own-volume-only"
    k = 1 if m["vol_unit"] == "mL" else 0.001
    if atm:
        kc = {"mg/mL":1,"g/L":1,"µg/mL":0.001,"mg/L":0.001,"ng/mL":1e-6}.get(m["conc_unit"],1)
        h = fmt(round_sf(D(r["unrounded"]["Ca"]) / D(kc), 6))
        if h != r["displayed"]["concentration"]:
            disc["conc"] += 1; x = copy.deepcopy(r); x["displayed"]["concentration"] = h; out.append(("conc-half-away", x))
        h = fmt(round_sf(D(r["unrounded"]["Fa"]) / D(repr(k)) if k != 1 else D(r["unrounded"]["Fa"]), 3))
        if h != r["displayed"]["final"]:
            disc["final"] += 1; x = copy.deepcopy(r); x["displayed"]["final"] = h; out.append(("final-half-away", x))
        if ex["departure"]:
            du = ex["departure"]["unrounded"]
            h = "0 %" if du == 0 else signed(pct(round_sf(du, 3)))
            if h != ex["departure"]["display"]:
                disc["dep"] += 1; x = copy.deepcopy(r); x["extended"]["departure"]["display"] = h; out.append(("dep-half-away", x))
        if ex["molar"] and ex["molar"]["status"] == "reported":
            h = fmt(round_sf(ex["molar"]["unrounded"], 6))
            if h != ex["molar"]["display"]:
                disc["molar"] += 1; x = copy.deepcopy(r); x["extended"]["molar"]["display"] = h; out.append(("molar-half-away", x))
        x = copy.deepcopy(r); x["extended"]["final"]["rounding"] = "half-away"; out.append(("final-flag", x))
        x = copy.deepcopy(r); x["extended"]["fl05"]["exceedsThreshold"] = not x["extended"]["fl05"]["exceedsThreshold"]; out.append(("fl05-thr", x))
        x = copy.deepcopy(r); x["extended"]["fl05"] = None; out.append(("fl05-null", x))
    if ex["fl08"]:
        x = copy.deepcopy(r); x["extended"]["fl08"]["knownVolume"] = "final" if ex["fl08"]["knownVolume"] == "diluent" else "diluent"; out.append(("fl08-kv", x))
        x = copy.deepcopy(r); f = r["unrounded"]["f"]; x["extended"]["fl08"]["factor"]["unrounded"] = 1/(1-f) if ex["fl08"]["knownVolume"]=="final" and f<1 else 1/(1+f); out.append(("fl08-mirrored-factor", x))
    if ex["departure"] and ex["departure"]["unrounded"] != 0:
        x = copy.deepcopy(r); x["extended"]["departure"]["display"] = x["extended"]["departure"]["display"].lstrip("+"); out.append(("dep-no-plus", x))
    x = copy.deepcopy(r); x.pop("extended"); out.append(("no-extended", x))
    return out
caught, missed = {}, {}
for c, r in zip(cs, rs):
    for name, x in muts(c, r):
        f, _ = check(c, x)
        hit = any(z["kind"] == "fail" for z in f)
        (caught if hit else missed)[name] = (caught if hit else missed).get(name, 0) + 1
print("discriminating at-most cases (up/down differs from half-away):", disc)
print("caught", caught); print("missed", missed)
