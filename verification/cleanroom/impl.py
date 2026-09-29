#!/usr/bin/env python3
"""Clean-room C7 Reconstitution determination (URS v1.0 sections 4, 5, 7, 8, C7-DT-07).

Reads a JSON array of protocol cases on stdin, writes a JSON array of results.
Standard library only.  See NOTES.md for interpretations.
"""
import json
import math
import sys
from decimal import Decimal, ROUND_UP, ROUND_HALF_UP, ROUND_CEILING, ROUND_DOWN, getcontext

getcontext().prec = 200

VBAR = 0.73  # mL/g, URS section 11 (C7-CN-01), applied to a mass in grams

# ---------------------------------------------------------------- units
# Conversions are single divisions/multiplications (C7-UN-03: no rounding).
def mass_to_mg(v, u):
    return {"µg": v / 1000.0, "mg": v, "g": v * 1000.0}[u]


def mass_to_g(v, u):
    return {"µg": v / 1e6, "mg": v / 1000.0, "g": v}[u]


def vol_to_ml(v, u):
    return {"µL": v / 1000.0, "mL": v}[u]


def ml_to_unit(v, u):
    return {"µL": v * 1000.0, "mL": v}[u]


# concentration unit -> (family, to_base(value), from_base(value)); base mg/mL, IU/mL, U/mL
def conc_to_base(v, u):
    return {
        "mg/mL": v, "g/L": v, "µg/mL": v / 1000.0, "mg/L": v / 1000.0,
        "ng/mL": v / 1e6, "IU/mL": v, "U/mL": v,
    }[u]


def conc_from_base(v, u):
    return {
        "mg/mL": v, "g/L": v, "µg/mL": v * 1000.0, "mg/L": v * 1000.0,
        "ng/mL": v * 1e6, "IU/mL": v, "U/mL": v,
    }[u]


MOLAR = {"M": 1.0, "mM": 1e3, "µM": 1e6, "nM": 1e9, "pM": 1e12}  # divisor


def family(u):
    if u in ("mg/mL", "µg/mL", "ng/mL", "g/L", "mg/L"):
        return "mass"
    if u == "IU/mL":
        return "IU"
    if u == "U/mL":
        return "U"
    if u in MOLAR:
        return "molar"
    return "?"


class NotRepresentable(Exception):
    """Raised only by an explicit decision on a named quantity (PROTOCOL 7)."""


def fnum(text):
    # Unparseable text (comma, hex, empty) is not a number at all: the
    # ValueError propagates and becomes status "error" for that case only.
    # Parseable but non-finite text ("NaN", "inf") is an entered quantity that
    # is not a finite double: decided not-representable (PROTOCOL 7).
    v = float(text)
    if not math.isfinite(v):
        raise NotRepresentable("entered value %r is not finite" % (text,))
    return v


# ---------------------------------------------------------------- rounding
def round_sf(x, n, mode=ROUND_HALF_UP):
    """Round the exact binary value of x to n significant figures, half away
    from zero (C7-UN-06).  Returns Decimal."""
    d = Decimal(x)
    if d == 0:
        return d
    e = d.adjusted()
    r = d.quantize(Decimal(1).scaleb(e - n + 1), rounding=mode)
    if r.adjusted() > e:  # carry, e.g. 99.99 -> 100.0
        r = d.quantize(Decimal(1).scaleb(e - n + 2), rounding=mode)
    return r


def fmt(dec):
    s = format(dec, "f")
    return s


def display_sf(x, n, mode=ROUND_HALF_UP):
    return fmt(round_sf(x, n, mode))



def pct(x, signed=False, up=False):
    """Percentage display (PROTOCOL 2 format rules): the fraction rounded to 3 sf
    (half away, exact binary value), then multiplied by 100 exactly."""
    if x == 0:
        return "0 %"
    # up=True: directed rounding toward +inf on the signed value (addendum
    # 2026-09-29): away from zero if positive, toward zero if negative.
    mode = (ROUND_UP if x > 0 else ROUND_DOWN) if up else ROUND_HALF_UP
    r = round_sf(abs(x), 3, mode)
    body = format(r.scaleb(2), "f") + " %"
    if x < 0:
        return "-" + body
    return ("+" + body) if signed else body


# ---------------------------------------------------------------- pairing table
def pairing_row(c1_basis, cbasis, conj, activity):
    """Return (row number, permitted) per section 8 table, first match wins."""
    if not activity and cbasis == "total-vial-contents":
        return 1, False
    if not activity and cbasis == "not-recorded":
        return 2, False
    if activity:
        return 3, False
    if cbasis == "reagent-alone" and conj == "not-recorded":
        return 4, False
    if c1_basis == "not-recorded":
        return 5, False
    if c1_basis == "monomer":
        return 6, False
    if c1_basis == "assembled" and conj == "none":
        return 7, True
    if c1_basis == "assembled" and conj == "protein":
        return 8, True
    if c1_basis == "conjugate" and conj == "conjugate":
        return 9, True
    if c1_basis == "conjugate" and conj in ("none", "protein"):
        return 10, False
    if c1_basis == "assembled" and conj == "conjugate":
        return 11, False
    return 0, False  # unreachable for valid declarations


def rejected(cid, codes):
    return {"id": cid, "status": "rejected", "rejections": codes, "flags": [],
            "label": None, "treatment": None, "molar": None,
            "unrounded": None, "displayed": None}


def notrep(cid):
    return {"id": cid, "status": "not-representable", "rejections": [], "flags": [],
            "label": None, "treatment": None, "molar": None,
            "unrounded": None, "displayed": None}


def finite_pos(x):
    return x is not None and isinstance(x, float) and math.isfinite(x) and x > 0


def solve(c):
    cid = c["id"]
    direction = c["direction"]
    cu = c["content"]["unit"]
    activity = cu in ("IU", "U")
    content_v = fnum(c["content"]["value"])
    cbasis = c.get("contentBasis")
    conj = c.get("conjugate")
    carrier = c.get("carrier")
    prov = c.get("provenance")
    vbasis = c["volumeBasis"]
    c1 = c.get("c1")
    solids = c.get("totalSolids")
    threshold = c["threshold"]

    # ---- inputs in base units
    if activity:
        content = content_v  # IU or U
        content_g = None
    else:
        content = mass_to_mg(content_v, cu)
        content_g = mass_to_g(content_v, cu)
    solids_v = None
    solids_g = None
    solids_mg = None
    if solids is not None:
        solids_v = fnum(solids["value"])
        solids_g = mass_to_g(solids_v, solids["unit"])
        solids_mg = mass_to_mg(solids_v, solids["unit"])

    tgt_unit = None
    tgt_text_v = None
    if direction == "target":
        tgt_unit = c["target"]["unit"]
        tgt_text_v = fnum(c["target"]["value"])
        entered_v = None
        vol_unit = None
        rep_unit = tgt_unit
    else:
        vol_unit = c["volume"]["unit"]
        entered_v = fnum(c["volume"]["value"])
        rep_unit = c.get("reportUnit")
    conc_unit = tgt_unit if direction == "target" else rep_unit
    target_is_molar = (direction == "target" and family(tgt_unit) == "molar")

    # ---- section 7 rejections (HI-08 deferred).  C7-HI-* in table order.
    rej = []
    if content_v <= 0:
        rej.append("C7-HI-01")
    if direction == "target":
        if tgt_text_v <= 0:
            rej.append("C7-HI-02")
    else:
        if entered_v <= 0:
            rej.append("C7-HI-02")
    cfam = "mass" if not activity else cu  # "IU" / "U" / "mass"
    ufam = family(conc_unit) if conc_unit else None
    # HI-03: mass vs activity mixed
    if ufam in ("mass", "IU", "U") and ((cfam == "mass") != (ufam == "mass")):
        rej.append("C7-HI-03")
    # HI-04: molar target
    if target_is_molar:
        ok = False
        if c1 is not None and not activity:
            _, ok = pairing_row(c1["massBasis"], cbasis, conj, activity)
        if not ok:
            rej.append("C7-HI-04")
    # HI-06
    mt = c["minTransfer"]
    mt_v = fnum(mt["value"])
    if mt_v <= 0:
        rej.append("C7-HI-06")
    # HI-07: solids used (reagent-alone or not-recorded), mass content
    if (not activity) and solids is not None and cbasis in ("reagent-alone", "not-recorded"):
        if solids_mg < content:
            rej.append("C7-HI-07")
    # HI-09: IU vs U
    if ufam in ("IU", "U") and cfam in ("IU", "U") and ufam != cfam:
        rej.append("C7-HI-09")
    if rej:
        return rejected(cid, rej)

    # ---- treatment / displacement (C7-DT-03, section 5 notation)
    D = None
    Dmin = None
    if not activity and cbasis == "total-vial-contents":
        D = content_g * VBAR              # solids = content
        treatment = "computed"
    elif solids is not None:
        D = solids_g * VBAR
        treatment = "computed"
    elif not activity and cbasis == "reagent-alone":
        Dmin = content_g * VBAR
        treatment = "reagent-own-volume-only"
    else:
        treatment = "not-computable-uncorrected"
    if treatment == "computed":
        Dapp = D
    elif treatment == "reagent-own-volume-only":
        Dapp = Dmin
    else:
        Dapp = 0.0

    # target in base units
    target_base = None
    mw_g = None
    if direction == "target":
        if target_is_molar:
            mw = c1["mw"]
            mw_g = float(mw["value"]) * (1000.0 if mw["unit"] == "kDa" else 1.0)
            target_base = tgt_text_v / MOLAR[tgt_unit] * mw_g   # g/L == mg/mL
        else:
            target_base = conc_to_base(tgt_text_v, tgt_unit)
        # F = content / target (C7-DT-01): the target in base units must be a
        # finite positive double (PROTOCOL 7).  Covers underflow of the unit
        # conversion and a molecular weight of 0 or below.
        if not finite_pos(target_base):
            return notrep(cid)

    # ---- F (determination final volume), C7-DT-01/02
    if direction == "target":
        F = content / target_base
    elif vbasis == "final":
        F = vol_to_ml(entered_v, vol_unit)
    else:
        F = None  # needs Dapp: entered diluent + Dapp

    if F is not None and not finite_pos(F):
        return notrep(cid)
    # C7-HI-08, evaluated on computed values, only where F is known
    if F is not None and Dapp >= F:
        return rejected(cid, ["C7-HI-08"])

    # ---- Vd, Vd', Fa, Ca
    diluent_entered = (direction == "volume" and vbasis == "diluent")
    if diluent_entered:
        VdPrime = vol_to_ml(entered_v, vol_unit)
        Vd = VdPrime
        F = VdPrime + Dapp
        vd_disp = c["volume"]["value"]  # as typed
        vd_dec = Decimal(c["volume"]["value"])  # for FL-07 (exact decimal, in vol_unit)
    else:
        Vd = F - Dapp
        dunit = "mL" if direction == "target" else vol_unit
        vd_r = round_sf(ml_to_unit(Vd, dunit), 3)   # C7-IV-03: from its own value
        vd_disp = fmt(vd_r)
        vd_dec = vd_r
        VdPrime = vol_to_ml(float(vd_r), dunit)
    Fa = VdPrime + Dapp
    Ca = content / Fa

    for q in (F, Vd, VdPrime, Fa, Ca, Dapp if Dapp != 0 else 1.0):
        if not finite_pos(q):
            return notrep(cid)
    if D is not None and not finite_pos(D):
        return notrep(cid)
    if Dmin is not None and not finite_pos(Dmin):
        return notrep(cid)

    f = D / F if D is not None else None
    fmin = Dmin / F if Dmin is not None else None
    # fmin = vbar*content/F: content_g*VBAR/F (same relation as Dmin/F)

    # ---- label (C7-DT-07)
    if treatment == "computed":
        label = "obtained" if diluent_entered else "achieved"
    elif treatment == "reagent-own-volume-only":
        label = "at-most"
    else:
        label = "uncorrected-for-displacement"

    # ---- molar pairing
    molar = None
    permitted = False
    if c1 is not None:
        row, permitted = pairing_row(c1["massBasis"], cbasis, conj, activity)
        molar = {"row": row, "status": "reported" if permitted else "withheld"}

    # ---- flags (section 8)
    fl = set()
    if not activity:
        if cbasis == "total-vial-contents":
            fl.add(1)
        if cbasis == "not-recorded":
            fl.add(2)
    if prov == "nominal":
        fl.add(3)
    if prov == "not-recorded":
        fl.add(4)
    if treatment != "computed":
        fl.add(5)
    if c.get("capacity") is not None:
        cap = c["capacity"]
        if Fa > vol_to_ml(fnum(cap["value"]), cap["unit"]):
            fl.add(6)
    # FL-07: Vd' as a decimal against the minimum, exactly, in microlitres
    if diluent_entered:
        vd_ul = vd_dec * (Decimal(1000) if vol_unit == "mL" else Decimal(1))
    else:
        vd_ul = vd_dec * (Decimal(1000) if dunit == "mL" else Decimal(1))
    min_ul = Decimal(mt["value"]) * (Decimal(1000) if mt["unit"] == "mL" else Decimal(1))
    if vd_ul < min_ul:
        fl.add(7)
    if f is not None and f > threshold:
        fl.add(8)
    if c1 is not None and not permitted:
        fl.add(9)
    if c1 is not None and c1.get("flagCodes"):
        fl.add(10)
    if carrier == "present":
        fl.add(11)
    if carrier == "not-recorded":
        fl.add(12)
    if not activity:
        if conj in ("protein", "conjugate"):
            fl.add(13)
        if conj == "not-recorded":
            fl.add(14)
    flags = ["C7-FL-%02d" % n for n in sorted(fl)]

    # ---- display (protocol conventions 3-5)
    if direction == "target":
        unit_f = "mL"
        if target_is_molar:
            cu_disp = "mg/mL"
        else:
            cu_disp = tgt_unit
    else:
        unit_f = vol_unit
        cu_disp = rep_unit
    # Decision 2026-09-28 items 1-3: an "at most" concentration is rounded up
    # (toward +inf) at 6 sf; an "at least" final volume is rounded down (toward
    # zero) at 3 sf; all else half away from zero.  Both apply exactly when the
    # label is "at-most" (C7-DT-07, Dapp = Dmin).
    bound = (label == "at-most")
    if family(cu_disp) == "molar":
        # molar form of Ca: (g/L) / (g/mol) * scale.  Single division then
        # multiplication in this order (C7-UN-03); order is a choice, see NOTES.
        mw = c1["mw"]
        mwg = float(mw["value"]) * (1000.0 if mw["unit"] == "kDa" else 1.0)
        disp_conc = Ca / mwg * MOLAR[cu_disp]
    else:
        disp_conc = conc_from_base(Ca, cu_disp)
    displayed = {
        "diluent": vd_disp,
        "final": display_sf(ml_to_unit(Fa, unit_f), 3, ROUND_DOWN if bound else ROUND_HALF_UP),
        "concentration": display_sf(disp_conc, 6, ROUND_CEILING if bound else ROUND_HALF_UP),
    }

    # ---------------------------------------------------------- extended (protocol 2)
    # C7-DT-04
    reagent_conc = ("not-computable" if (not activity and cbasis == "total-vial-contents")
                    else "computable")
    ext = {
        "reagentConcentration": reagent_conc,
        "concentrationRounding": "up" if bound else "half-away",
        "final": {"isLowerBound": bound, "rounding": "down" if bound else "half-away"},
        "departure": None, "fl05": None, "fl08": None, "molar": None,
    }
    # C7-DT-07 / C7-FX-17: reported concentration / target - 1, in the displayed unit.
    if direction == "target":
        if target_is_molar:
            dep = Ca / target_base - 1.0      # both mg/mL
        else:
            dep = conc_from_base(Ca, cu_disp) / tgt_text_v - 1.0
        ext["departure"] = {"unrounded": dep, "display": pct(dep, True, up=bound),
                            "isUpperBound": bound,
                            "rounding": "up" if bound else "half-away"}
    # C7-FL-05 payload
    if Dmin is not None:
        ext["fl05"] = {
            "Dmin": {"unrounded": Dmin, "display": display_sf(ml_to_unit(Dmin, unit_f), 3)},
            "fmin": {"unrounded": fmin, "display": pct(fmin)},
            "exceedsThreshold": fmin > threshold,
        }
    # C7-FL-08 payload, keyed to the known volume (form as the URS writes it)
    if 8 in fl:
        if diluent_entered:
            # C7-FL-08, diluent known: 1 / (1 - f).  When f = D/F rounds to 1 in
            # double, (1 - f) is not a finite positive double, so the payload
            # quantity is not representable (PROTOCOL 7); the case is decided so.
            if not finite_pos(1.0 - f):
                return notrep(cid)
            known, fac = "diluent", 1.0 / (1.0 - f)
            pc = f / (1.0 - f)
        else:
            known, fac = "final", 1.0 / (1.0 + f)
            pc = f / (1.0 + f)
        if not (finite_pos(fac) and finite_pos(pc)):
            return notrep(cid)
        ext["fl08"] = {"knownVolume": known,
                       "factor": {"unrounded": fac, "display": display_sf(fac, 3)},
                       "percent": {"unrounded": pc, "display": pct(pc)}}
    # C7-DT-06 molar form
    if c1 is not None:
        m = {"row": molar["row"], "status": "withheld", "of": None, "unit": None,
             "unrounded": None, "display": None, "rounding": None}
        if permitted:
            if target_is_molar:
                munit = tgt_unit
            else:
                munit = c.get("molarUnit")
                if munit is None and family(rep_unit or "") == "molar":
                    munit = rep_unit
            if munit is None:
                m["status"] = "unit-not-selected"
            else:
                mw = c1["mw"]
                mwg2 = float(mw["value"]) * (1000.0 if mw["unit"] == "kDa" else 1.0)
                mv = Ca / mwg2 * MOLAR[munit]
                m.update({"status": "reported",
                          "of": {7: "reagent", 8: "protein", 9: "conjugate"}[molar["row"]],
                          "unit": munit, "unrounded": mv,
                          "display": display_sf(mv, 6, ROUND_CEILING if bound else ROUND_HALF_UP),
                          "rounding": "up" if bound else "half-away"})
        ext["molar"] = m

    unrounded = {"F": F, "D": D, "Dmin": Dmin, "Dapp": Dapp, "Vd": Vd,
                 "VdPrime": VdPrime, "Fa": Fa, "Ca": Ca, "f": f, "fmin": fmin,
                 "target": target_base}
    return {"id": cid, "status": "result", "rejections": [], "flags": flags,
            "label": label, "treatment": treatment, "molar": molar,
            "unrounded": unrounded, "displayed": displayed,
            "extended": ext}


def main():
    cases = json.load(sys.stdin)
    out = []
    for c in cases:
        try:
            out.append(solve(c))
        except NotRepresentable:
            out.append(notrep(c["id"]))
        except Exception as e:  # PROTOCOL convention 7: never map a crash to a status
            out.append({"id": c.get("id") if isinstance(c, dict) else None,
                        "status": "error",
                        "message": "%s: %s" % (type(e).__name__, e)})
    json.dump(out, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
