"""Independent reimplementation of the C7 determination (acceptance 3), in Python.

Written from URS v1.0 §5 and §4, not from the JavaScript: it reads the same
inputs and emits the unrounded values of every reported quantity, and the
displayed strings, for comparison on the full fixture set (tests/reimpl.test.js).

Operation order follows §5 and the order fixed in the engine's header, one
correctly rounded IEEE-754 double operation per step, so agreement is expected
to be EXACT on unrounded values — stronger than any tolerance, and so not
waiting on the derivation memo (outstanding item 3).

Display rounding: half away from zero on the exact binary value (C7-UN-06),
via Decimal(float), which is exact, and ROUND_HALF_UP, which on a Decimal is
half away from zero.

Usage: python3 reconstitution.py < cases.json > results.json
"""
import json
import sys
from decimal import Decimal, ROUND_HALF_UP

VBAR_ML_PER_G = 0.73

# (operation, factor): value in base unit = value * f, or value / f.
MASS_TO_MG = {"µg": ("div", 1e3), "ug": ("div", 1e3), "mg": ("mul", 1.0), "g": ("mul", 1e3)}
MASS_TO_G = {"µg": ("div", 1e6), "ug": ("div", 1e6), "mg": ("div", 1e3), "g": ("mul", 1.0)}
VOL_TO_ML = {"µL": ("div", 1e3), "uL": ("div", 1e3), "mL": ("mul", 1.0)}
CONC_TO_BASE = {
    "mg/mL": ("mul", 1.0), "µg/mL": ("div", 1e3), "ng/mL": ("div", 1e6), "g/L": ("mul", 1.0), "mg/L": ("div", 1e3),
    "IU/mL": ("mul", 1.0), "U/mL": ("mul", 1.0),
    "M": ("mul", 1.0), "mM": ("div", 1e3), "µM": ("div", 1e6), "nM": ("div", 1e9), "pM": ("div", 1e12),
}
ACTIVITY = {"IU", "U"}
MOLAR = {"M", "mM", "µM", "nM", "pM"}


def to_base(table, unit, v):
    op, f = table[unit]
    return v / f if op == "div" else v * f


def from_base(table, unit, v):
    op, f = table[unit]
    return v * f if op == "div" else v / f


def sig(x, n):
    d = Decimal(x)  # exact binary value
    if d == 0:
        return Decimal(0)
    e = d.adjusted() - n + 1
    q = d.quantize(Decimal(1).scaleb(e), rounding=ROUND_HALF_UP)
    if q.adjusted() > d.adjusted():  # a carry, 99.96 -> 100.0: keep n significant figures
        q = q.quantize(Decimal(1).scaleb(e + 1), rounding=ROUND_HALF_UP)
    return q


def sig_dir(x, n, up):
    """Directed rounding of a displayed bound (spec/decision-2026-09-28-directed-rounding.md):
    up for an "at most" concentration, down for an "at least" final volume, exact binary value."""
    from decimal import ROUND_CEILING, ROUND_FLOOR
    d = Decimal(x)
    e = d.adjusted() - n + 1
    q = d.quantize(Decimal(1).scaleb(e), rounding=ROUND_CEILING if up else ROUND_FLOOR)
    if q.adjusted() > d.adjusted():  # carry, 999.9 -> 1000: keep n significant figures
        q = q.quantize(Decimal(1).scaleb(e + 1), rounding=ROUND_CEILING if up else ROUND_FLOOR)
    return q


def plain(d):
    s = format(d, "f")
    return s


PAIRING = [  # §8, evaluated in order; first match wins: (row, predicate, permitted)
    (1, lambda b, cj, m: b == "total-vial-contents", False),
    (2, lambda b, cj, m: b == "not-recorded", False),
    (3, lambda b, cj, m: b == "reagent-activity", False),
    (4, lambda b, cj, m: b == "reagent-alone" and cj == "not-recorded", False),
    (5, lambda b, cj, m: m == "not-recorded", False),
    (6, lambda b, cj, m: m == "monomer", False),
    (7, lambda b, cj, m: m == "assembled" and b == "reagent-alone" and cj == "none", True),
    (8, lambda b, cj, m: m == "assembled" and b == "reagent-alone" and cj == "protein", True),
    (9, lambda b, cj, m: m == "conjugate" and b == "reagent-alone" and cj == "conjugate", True),
    (10, lambda b, cj, m: m == "conjugate" and b == "reagent-alone" and cj in ("none", "protein"), False),
    (11, lambda b, cj, m: m == "assembled" and b == "reagent-alone" and cj == "conjugate", False),
]


def pairing(basis, conj, c1_basis):
    for row, pred, ok in PAIRING:
        if pred(basis, conj, c1_basis):
            return row, ok
    raise ValueError("no pairing row")


MASS_CONC = {"mg/mL", "µg/mL", "ng/mL", "g/L", "mg/L"}


def conc_family(unit):
    if unit in MASS_CONC:
        return "mass"
    if unit == "IU/mL":
        return "IU"
    if unit == "U/mL":
        return "U"
    return "molar"


def rejections(c):
    """§7, in the order the conditions are listed; codes only."""
    out = []
    cu = c["content"]["unit"]
    content_fam = "mass" if cu not in ACTIVITY else cu
    if float(c["content"]["value"]) <= 0:
        out.append("C7-HI-01")
    if c["direction"] == "target" and float(c["target"]["value"]) <= 0:
        out.append("C7-HI-02")
    if c["direction"] == "volume" and float(c["volume"]["value"]) <= 0:
        out.append("C7-HI-02")
    if c.get("capacity") and float(c["capacity"]["value"]) <= 0:
        out.append("C7-HI-02")
    if float(c["minTransfer"]["value"]) <= 0:
        out.append("C7-HI-06")
    cunit = c["target"]["unit"] if c["direction"] == "target" else c["reportUnit"]
    fam = conc_family(cunit)
    if fam != "molar" and fam != content_fam:
        out.append("C7-HI-09" if content_fam != "mass" and fam != "mass" else "C7-HI-03")
    if fam == "molar":
        if content_fam != "mass" or c.get("c1MassBasis") is None:
            out.append("C7-HI-04")
        elif not pairing(c["contentBasis"], c["conjugate"], c["c1MassBasis"])[1]:
            out.append("C7-HI-04")
    solids = c.get("totalSolids")
    if solids and content_fam == "mass" and c["contentBasis"] == "reagent-alone":
        if to_base(MASS_TO_MG, solids["unit"], float(solids["value"])) < to_base(MASS_TO_MG, cu, float(c["content"]["value"])):
            out.append("C7-HI-07")
    return out


def determine(c):
    rej = rejections(c)
    if rej:
        return {"id": c["id"], "status": "rejected", "rejections": rej}
    content_unit = c["content"]["unit"]
    content_text = c["content"]["value"]
    content_v = float(content_text)
    is_mass = content_unit not in ACTIVITY
    basis = "reagent-activity" if not is_mass else c["contentBasis"]
    content = to_base(MASS_TO_MG, content_unit, content_v) if is_mass else content_v

    solids = c.get("totalSolids")
    solids_g = None
    if basis == "total-vial-contents":
        solids_g = to_base(MASS_TO_G, content_unit, content_v)
    elif solids and basis in ("reagent-alone", "reagent-activity"):
        solids_g = to_base(MASS_TO_G, solids["unit"], float(solids["value"]))
    D = solids_g * VBAR_ML_PER_G if solids_g is not None else None
    Dmin = to_base(MASS_TO_G, content_unit, content_v) * VBAR_ML_PER_G if (D is None and basis == "reagent-alone") else None
    Dapp = D if D is not None else (Dmin if Dmin is not None else 0.0)

    direction = c["direction"]
    if direction == "target":
        tu = c["target"]["unit"]
        tv = float(c["target"]["value"])
        target = to_base(CONC_TO_BASE, tu, tv) * c["mwGperMol"] if tu in MOLAR else to_base(CONC_TO_BASE, tu, tv)
        vol_unit = "mL"
    else:
        vol_unit = c["volume"]["unit"]
        target = None

    diluent_entered = direction == "volume" and c["volumeBasis"] == "diluent"
    if not diluent_entered:
        F = content / target if direction == "target" else to_base(VOL_TO_ML, vol_unit, float(c["volume"]["value"]))
        guard = D if D is not None else Dmin
        if guard is not None and guard >= F:  # C7-HI-08, evaluated in this form
            return {"id": c["id"], "status": "rejected", "rejections": ["C7-HI-08"]}
        Vd = F - Dapp
        vdp_dec = sig(from_base(VOL_TO_ML, vol_unit, Vd), 3)
        vdp = to_base(VOL_TO_ML, vol_unit, float(vdp_dec))
        vdp_display = plain(vdp_dec)
    else:
        vdp = to_base(VOL_TO_ML, vol_unit, float(c["volume"]["value"]))
        vdp_display = c["volume"]["value"]
        Vd = vdp
        F = vdp + Dapp
    Fa = vdp + Dapp
    Ca = content / Fa
    f = D / F if D is not None else None
    fmin = Dmin / F if Dmin is not None else None

    treatment = "computed" if D is not None else ("reagent-own-volume-only" if Dmin is not None else "not-computable-uncorrected")
    if treatment == "computed":
        label = "obtained" if diluent_entered else "achieved"
    elif treatment == "reagent-own-volume-only":
        label = "at-most"
    else:
        label = "uncorrected-for-displacement"

    th = c["threshold"]
    conj = c.get("conjugate") if is_mass else None
    c1b = c.get("c1MassBasis")
    molar = None
    if c1b is not None:
        row, ok = pairing(basis, conj, c1b)
        molar = {"row": row, "status": "reported" if ok else "withheld"}
    vd_ul = (Decimal(vdp_display) * (1000 if vol_unit == "mL" else 1))
    min_ul = Decimal(c["minTransfer"]["value"]) * (1000 if c["minTransfer"]["unit"] == "mL" else 1)
    flags = []
    if basis == "total-vial-contents": flags.append("C7-FL-01")
    if basis == "not-recorded": flags.append("C7-FL-02")
    if c["provenance"] == "nominal": flags.append("C7-FL-03")
    if c["provenance"] == "not-recorded": flags.append("C7-FL-04")
    if treatment != "computed": flags.append("C7-FL-05")
    if c.get("capacity") and Fa > to_base(VOL_TO_ML, c["capacity"]["unit"], float(c["capacity"]["value"])): flags.append("C7-FL-06")
    if vd_ul < min_ul: flags.append("C7-FL-07")
    if treatment == "computed" and f > th: flags.append("C7-FL-08")
    if molar and molar["status"] == "withheld": flags.append("C7-FL-09")
    if c1b is not None and c.get("c1FlagCount", 0) > 0: flags.append("C7-FL-10")
    if c["carrier"] == "present": flags.append("C7-FL-11")
    if c["carrier"] == "not-recorded": flags.append("C7-FL-12")
    if conj in ("protein", "conjugate"): flags.append("C7-FL-13")
    if conj == "not-recorded": flags.append("C7-FL-14")

    bound = treatment == "reagent-own-volume-only"
    if direction == "target":
        disp_unit = "mg/mL" if c["target"]["unit"] in MOLAR else c["target"]["unit"]
    else:
        disp_unit = c["reportUnit"]
    ca_disp = from_base(CONC_TO_BASE, disp_unit, Ca)
    return {
        "id": c["id"],
        "status": "result",
        "flags": flags,
        "label": label,
        "treatment": treatment,
        "molar": molar,
        "unrounded": {"F": F, "D": D, "Dmin": Dmin, "Dapp": Dapp, "Vd": Vd, "VdPrime": vdp, "Fa": Fa, "Ca": Ca, "f": f, "fmin": fmin, "target": target},
        "displayed": {
            "diluent": vdp_display,
            "final": plain(sig_dir(from_base(VOL_TO_ML, vol_unit, Fa), 3, False) if bound else sig(from_base(VOL_TO_ML, vol_unit, Fa), 3)),
            "concentration": plain(sig_dir(ca_disp, 6, True) if bound else sig(ca_disp, 6)),
        },
    }


def main():
    cases = json.load(sys.stdin)
    json.dump([determine(c) for c in cases], sys.stdout)


if __name__ == "__main__":
    main()
