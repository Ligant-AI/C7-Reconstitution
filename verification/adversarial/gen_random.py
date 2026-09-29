"""Property 1, 2, 5 on random cases. Seeded generator; seed recorded below."""
import random
from decimal import Decimal
from adv_lib import base_case, round_sf, D

SEED_RANDOM = 20260928
SEED_FX14 = 14142


def dec_str(rng, lo_exp, hi_exp, sig=None):
    sig = sig or rng.choice([1, 2, 3, 4, 5, 6])
    mant = rng.randint(10 ** (sig - 1), 10 ** sig - 1)
    e = rng.randint(lo_exp, hi_exp)
    d = Decimal(mant).scaleb(e - sig + 1)
    s = format(d, "f")
    if rng.random() < 0.1:
        s = "%se%d" % (format(Decimal(mant).scaleb(-sig + 1), "f"), e)  # scientific notation
    return s


def rand_case(rng, i):
    direction = rng.choice(["target", "volume"])
    activity = rng.random() < 0.15
    if activity:
        cu = rng.choice(["IU", "U"])
        content = {"value": dec_str(rng, 3, 7), "unit": cu}
    else:
        cu = rng.choice(["µg", "mg", "g"])
        # content 1 µg – 1 g in mg: 1e-3..1e3
        content_mg = Decimal(dec_str(rng, -3, 2))
        scale = {"µg": Decimal(1000), "mg": Decimal(1), "g": Decimal("0.001")}[cu]
        content = {"value": format((content_mg * scale).normalize(), "f"), "unit": cu}
    cb = rng.choice(["reagent-alone", "reagent-alone", "total-vial-contents", "not-recorded"])
    solids = None
    if rng.random() < 0.6 and (activity or cb == "reagent-alone"):
        su = rng.choice(["µg", "mg", "g"])
        if activity:
            smg = Decimal(dec_str(rng, -2, 1))
        else:
            cmg = D(content["value"]) * {"µg": Decimal("0.001"), "mg": Decimal(1), "g": Decimal(1000)}[cu]
            smg = round_sf(cmg * Decimal(str(round(rng.uniform(1, 50), 3))), 4)
        sc = {"µg": Decimal(1000), "mg": Decimal(1), "g": Decimal("0.001")}[su]
        solids = {"value": format((smg * sc).normalize(), "f"), "unit": su}
    c = base_case(
        id="ADV-RND-%04d" % i,
        direction=direction,
        content=content,
        contentBasis=cb,
        provenance=rng.choice(["coa", "coa", "nominal", "weighed", "not-recorded"]),
        conjugate=rng.choice(["none", "none", "protein", "conjugate", "not-recorded"]),
        carrier=rng.choice(["absent", "absent", "present", "not-recorded"]),
        totalSolids=solids,
        volumeBasis=rng.choice(["diluent", "final"]),
        minTransfer={"value": rng.choice(["2", "2", "0.5", "5", "10"]), "unit": "µL"},
        capacity=rng.choice([None, None, {"value": dec_str(rng, -1, 1, 2), "unit": "mL"},
                             {"value": dec_str(rng, 2, 4, 2), "unit": "µL"}]),
        threshold=0.006,
    )
    if direction == "target":
        if activity:
            c["target"] = {"value": dec_str(rng, 2, 5), "unit": cu + "/mL"}
        else:
            # target 1–316 mg/mL region plus lower
            tu = rng.choice(["mg/mL", "µg/mL", "ng/mL", "g/L", "mg/L"])
            t_mg = Decimal(dec_str(rng, -2, 2))
            sc = {"mg/mL": 1, "µg/mL": Decimal(1000), "ng/mL": Decimal(10) ** 6, "g/L": 1, "mg/L": Decimal(1000)}[tu]
            c["target"] = {"value": format((t_mg * sc).normalize(), "f"), "unit": tu}
    else:
        vu = rng.choice(["mL", "µL"])
        v_ml = Decimal(dec_str(rng, -2, 1, rng.choice([1, 2, 3])))
        c["volume"] = {"value": format((v_ml * (1000 if vu == "µL" else 1)).normalize(), "f"), "unit": vu}
        if activity:
            c["reportUnit"] = cu + "/mL"
        else:
            c["reportUnit"] = rng.choice(["mg/mL", "µg/mL", "ng/mL", "g/L", "mg/L"])
    if not activity and rng.random() < 0.25:
        c["c1"] = {"mw": {"value": round(rng.uniform(5, 900), 1), "unit": "kDa"},
                   "massBasis": rng.choice(["assembled", "monomer", "conjugate", "not-recorded"]),
                   "flagCodes": rng.choice([[], [], ["C1-FL-06"], ["C1-FL-08"]])}
        c["molarUnit"] = "µM"
    return c


def random_cases(n=600):
    rng = random.Random(SEED_RANDOM)
    return [rand_case(rng, i) for i in range(n)]


def fx14_cases(n=60):
    """Target direction, D computed, where round3(round3(F) − D) != round3(F − D)."""
    rng = random.Random(SEED_FX14)
    out, tries = [], 0
    while len(out) < n and tries < 200000:
        tries += 1
        cmg = Decimal(dec_str(rng, -1, 1, 4))
        t = Decimal(dec_str(rng, -1, 1, 4))
        smg = round_sf(cmg * Decimal(str(round(rng.uniform(1, 40), 2))), 4)
        Fx = cmg / t
        Dx = smg / 1000 * Decimal("0.73")
        if Dx >= Fx:
            continue
        a = round_sf(Fx - Dx, 3)
        b = round_sf(round_sf(Fx, 3) - Dx, 3)
        if a != b:
            out.append(base_case(id="ADV-FX14-%03d" % len(out), content={"value": format(cmg, "f"), "unit": "mg"},
                                 totalSolids={"value": format(smg, "f"), "unit": "mg"},
                                 target={"value": format(t, "f"), "unit": "mg/mL"},
                                 volumeBasis=rng.choice(["diluent", "final"]), threshold=0.006))
    return out
