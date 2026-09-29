"""Property 8 (amended specification, 29 September 2026): directed rounding of
displayed bounds and the PROTOCOL protocol-2 `extended` block.

Sources, and nothing else:
  spec/decision-2026-09-28-directed-rounding.md (items 1-6, the FX-06 figures,
    the Stated limit, and the 29 September addendum on the departure)
  verification/PROTOCOL.md protocol 2 (`extended`), conventions 4, 5, 7
  spec/reconstitution-urs-v1.0.md C7-DT-04, C7-DT-06, C7-DT-07, C7-FL-05, C7-FL-08, §8 table.

Each record is (case, exp) where exp is None (judged by the generic oracle
only) or a dict {what, want, why, get} stating a fixed expectation derived from
the documents above. The generic oracle (oracle.check / check_extended) also
runs on every case.

Seed: SEED_DR. Scans set their "on / below / above" points from the engine's
own reported doubles, as gen_boundary does, so that "on" is exact.
"""
import random
from decimal import Decimal
from adv_lib import base_case, run, nextdown, nextup, D

SEED_DR = 20260929
M = lambda v, u="mg": {"value": v, "unit": u}  # noqa: E731
C1 = lambda mb="assembled", mw=148.3, u="kDa", fc=None: {"mw": {"value": mw, "unit": u}, "massBasis": mb, "flagCodes": fc or []}  # noqa: E731


def g(*path):
    def f(r):
        x = r
        for p in path:
            x = x[p]
        return x
    return f


def cases():
    R = []

    def add(tid, exp=None, **kw):
        c = base_case(**kw)
        c["id"] = "ADV-DR-" + tid
        R.append((c, exp))
        return c

    def E(what, want, why, get):
        return {"what": what, "want": want, "why": why, "get": get}

    # ---- A. the decision's C7-FX-06 figures, verbatim ----------------------
    fx = "decision, Consequences for the fixtures"
    add("FX06-TGT", E("displayed.concentration", "79.9681", fx, g("displayed", "concentration")), totalSolids=None, target=M("80", "mg/mL"))
    add("FX06-TGT-FIN", E("displayed.final", "1.00", fx, g("displayed", "final")), totalSolids=None, target=M("80", "mg/mL"))
    add("FX06-TGT-DEP", E("extended.departure.display", "-0.0399 %", "addendum: at most −0.0399 %", g("extended", "departure", "display")),
        totalSolids=None, target=M("80", "mg/mL"))
    add("FX06-TGT-FMIN", E("extended.fl05.fmin.display", "5.84 %", "C7-FX-06 fmin = 5.84 %", g("extended", "fl05", "fmin", "display")),
        totalSolids=None, target=M("80", "mg/mL"))
    add("FX06-DIL100", E("displayed.concentration", "75.5858", fx, g("displayed", "concentration")),
        direction="volume", totalSolids=None, volume=M("1.00", "mL"))
    add("FX06-DIL100-FIN", E("displayed.final", "1.05", fx + " (final at least 1.05 mL)", g("displayed", "final")),
        direction="volume", totalSolids=None, volume=M("1.00", "mL"))
    add("FX06-DIL100-FMIN", E("extended.fl05.fmin.display", "5.52 %", "C7-FX-06 fmin = 5.52 %", g("extended", "fl05", "fmin", "display")),
        direction="volume", totalSolids=None, volume=M("1.00", "mL"))
    add("FX06-DIL942", E("displayed.concentration", "79.9681", fx, g("displayed", "concentration")),
        direction="volume", totalSolids=None, volume=M("0.942", "mL"))
    add("FX06-1p0044", E("displayed.concentration", "1.00367", fx, g("displayed", "concentration")),
        content=M("1.0044"), totalSolids=None, target=M("1", "mg/mL"))
    add("FX06-1p0044-DEP", E("extended.departure.display", "+0.367 %", "addendum: at most +0.367 %", g("extended", "departure", "display")),
        content=M("1.0044"), totalSolids=None, target=M("1", "mg/mL"))
    add("FX06-1p0044-DIL", E("displayed.diluent", "1.00", "C7-FX-06 diluent 1.00 mL (decision item 3: half away)", g("displayed", "diluent")),
        content=M("1.0044"), totalSolids=None, target=M("1", "mg/mL"))
    add("FX17-DEP", E("extended.departure.display", "+0.452 %", "addendum: C7-FX-17 not a bound, +0.452 %, unchanged", g("extended", "departure", "display")),
        content=M("1.0054"), totalSolids=M("1.2"), target=M("1", "mg/mL"))
    add("FX17-CONC", E("displayed.concentration", "1.00452", "C7-FX-17", g("displayed", "concentration")),
        content=M("1.0054"), totalSolids=M("1.2"), target=M("1", "mg/mL"))
    add("FX17-FLAGS", E("flags", [], "C7-FX-17 no flags", g("flags")),
        content=M("1.0054"), totalSolids=M("1.2"), target=M("1", "mg/mL"))
    # C7-FX-05 FL-08 payloads (C7-FL-08 prose: shortfall 6.80 %, overstatement 7.88 %)
    add("FX05-FL08-TGT", E("extended.fl08.percent.display", "6.80 %", "C7-FL-08: f ÷ (1 + f) at f = 7.3 %", g("extended", "fl08", "percent", "display")),
        content=M("80"), totalSolids=M("100"), target=M("80", "mg/mL"))
    add("FX05-FL08-TGT-KV", E("extended.fl08.knownVolume", "final", "C7-FL-08: target direction, final volume known", g("extended", "fl08", "knownVolume")),
        content=M("80"), totalSolids=M("100"), target=M("80", "mg/mL"))
    add("FX05-FL08-TGT-DILBASIS-KV", E("extended.fl08.knownVolume", "final",
                                       "C7-FL-08 keyed to the known volume: target direction, volume basis 'diluent' still has the final known",
                                       g("extended", "fl08", "knownVolume")),
        content=M("80"), totalSolids=M("100"), target=M("80", "mg/mL"), volumeBasis="diluent")
    add("FX05-FL08-TGT-FINBASIS-KV", E("extended.fl08.knownVolume", "final", "C7-FL-08", g("extended", "fl08", "knownVolume")),
        content=M("80"), totalSolids=M("100"), target=M("80", "mg/mL"), volumeBasis="final")
    add("FX05-FL08-FIN-KV", E("extended.fl08.knownVolume", "final", "C7-FL-08: final entered", g("extended", "fl08", "knownVolume")),
        content=M("80"), totalSolids=M("100"), direction="volume", volumeBasis="final", volume=M("1.00", "mL"))
    add("FX05-FL08-FIN-FACTOR", E("extended.fl08.factor.display", "0.932", "1 ÷ (1 + 0.073) = 0.93197 at 3 sf", g("extended", "fl08", "factor", "display")),
        content=M("80"), totalSolids=M("100"), direction="volume", volumeBasis="final", volume=M("1.00", "mL"))
    add("FX05-FL08-DIL-KV", E("extended.fl08.knownVolume", "diluent", "C7-FL-08: diluent entered", g("extended", "fl08", "knownVolume")),
        content=M("80"), totalSolids=M("100"), direction="volume", volumeBasis="diluent", volume=M("0.927", "mL"))
    add("FX05-FL08-DIL-PCT", E("extended.fl08.percent.display", "7.87 %",
                               "f ÷ (1 − f) = 0.073/0.927 = 0.0787486… → 3 sf 0.0787 → 7.87 % (PROTOCOL format). "
                               "NOTE URS C7-FL-08 / C7-FX-11 prose says 7.88 %", g("extended", "fl08", "percent", "display")),
        content=M("80"), totalSolids=M("100"), direction="volume", volumeBasis="diluent", volume=M("0.927", "mL"))
    add("FX05-FL08-DIL-FACTOR", E("extended.fl08.factor.display", "1.08", "1 ÷ (1 − 0.073) = 1.07875 at 3 sf", g("extended", "fl08", "factor", "display")),
        content=M("80"), totalSolids=M("100"), direction="volume", volumeBasis="diluent", volume=M("0.927", "mL"))
    add("FX05-ROUNDING", E("extended.concentrationRounding", "half-away", "decision item 3: D computed, not a bound", g("extended", "concentrationRounding")),
        content=M("80"), totalSolids=M("100"), target=M("80", "mg/mL"))
    add("FX05-DEP-ZERO", E("extended.departure.display", "0 %", "PROTOCOL: zero displays as 0 % (Ca = 80 = target exactly)", g("extended", "departure", "display")),
        content=M("80"), totalSolids=M("100"), target=M("80", "mg/mL"))

    # ---- B. extended-block presence / absence -------------------------------
    add("FL05-NULL-IU", E("extended.fl05", None, "PROTOCOL: fl05 present exactly when Dmin is applied; activity content has no Dmin", g("extended", "fl05")),
        content=M("1e6", "IU"), target=M("1e4", "IU/mL"), totalSolids=None)
    add("FL05-NULL-IU-FLAG", E("flags has C7-FL-05", True, "C7-FL-05 raised for activity content", lambda r: "C7-FL-05" in r["flags"]),
        content=M("1e6", "IU"), target=M("1e4", "IU/mL"), totalSolids=None)
    add("FL05-NULL-NOTREC", E("extended.fl05", None, "no Dmin for content basis not recorded (§11 Dmin row)", g("extended", "fl05")),
        contentBasis="not-recorded", totalSolids=None)
    add("FL05-NULL-NOTREC-ROUND", E("extended.final.isLowerBound", False, "Dapp = 0: not 'at least' (C7-DT-07)", g("extended", "final", "isLowerBound")),
        contentBasis="not-recorded", totalSolids=None)
    add("RC-TVC", E("extended.reagentConcentration", "not-computable", "C7-DT-04", g("extended", "reagentConcentration")),
        contentBasis="total-vial-contents", totalSolids=None)
    add("RC-TVC-VOL", E("extended.reagentConcentration", "not-computable", "C7-DT-04", g("extended", "reagentConcentration")),
        contentBasis="total-vial-contents", totalSolids=None, direction="volume")
    add("RC-IU-TVC", E("extended.reagentConcentration", "computable", "PROTOCOL: contentBasis ignored for IU/U content", g("extended", "reagentConcentration")),
        content=M("1e6", "IU"), target=M("1e4", "IU/mL"), totalSolids=None, contentBasis="total-vial-contents")
    add("RC-NOTREC", E("extended.reagentConcentration", "computable", "C7-DT-04 names only total vial contents", g("extended", "reagentConcentration")),
        contentBasis="not-recorded", totalSolids=None)
    add("DEP-NULL-VOL", E("extended.departure", None, "PROTOCOL: target direction only", g("extended", "departure")),
        direction="volume", totalSolids=None)
    add("FL05-UL", E("extended.fl05.Dmin.display", "58.4", "Dmin 0.0584 mL in the displayed volume unit µL, 3 sf", g("extended", "fl05", "Dmin", "display")),
        direction="volume", totalSolids=None, volume=M("1000", "µL"))
    add("FL05-UL-FIN", E("displayed.final", "1050", "Fa = 1058.4 µL rounded down at 3 sf (decision item 2)", g("displayed", "final")),
        direction="volume", totalSolids=None, volume=M("1000", "µL"))
    add("FL05-UL-FINBASIS", None, direction="volume", volumeBasis="final", totalSolids=None, volume=M("1000", "µL"))
    add("FL08-UL-FIN", E("extended.fl08.knownVolume", "final", "C7-FL-08", g("extended", "fl08", "knownVolume")),
        content=M("80"), totalSolids=M("100"), direction="volume", volumeBasis="final", volume=M("1000", "µL"))

    # FL-08 percent formats: ≥ 100 % and ≥ 1000 %; the huge factor from a 1e-300 mL diluent
    add("FL08-PCT-243", E("extended.fl08.percent.display", "243 %", "f/(1−f) = 0.073/0.03 = 2.4333 → 2.43 → 243 %", g("extended", "fl08", "percent", "display")),
        direction="volume", volume=M("0.03", "mL"))
    add("FL08-PCT-1460", E("extended.fl08.percent.display", "1460 %", "f/(1−f) = 0.073/0.005 = 14.6 → 1460 %", g("extended", "fl08", "percent", "display")),
        direction="volume", volume=M("0.005", "mL"))
    add("FL08-FACTOR-1560", E("extended.fl08.factor.display", "15.6", "1/(1−f) = 0.078/0.005 = 15.6", g("extended", "fl08", "factor", "display")),
        direction="volume", volume=M("0.005", "mL"))
    add("FL08-HUGE", E("no exponent in fl08 displays", True, "PROTOCOL: No exponent notation anywhere",
                       lambda r: all("e" not in x.lower() for x in (r["extended"]["fl08"]["factor"]["display"], r["extended"]["fl08"]["percent"]["display"]))),
        direction="volume", volume=M("1e-300", "mL"))
    # final known, large f: f/(1+f) and 1/(1+f)
    add("FL08-FIN-LARGEF", None, direction="volume", volumeBasis="final", volume=M("0.103", "mL"))

    # ---- C. molar form (C7-DT-06; decision item 1 "and its molar form") ---
    for row, mb, cj in ((7, "assembled", "none"), (8, "assembled", "protein"), (9, "conjugate", "conjugate")):
        of = {7: "reagent", 8: "protein", 9: "conjugate"}[row]
        add("MOL-R%d-ATMOST-MASS" % row, E("extended.molar.rounding", "up", "decision item 1: the molar form of an 'at most' concentration", g("extended", "molar", "rounding")),
            totalSolids=None, conjugate=cj, c1=C1(mb), molarUnit="µM")
        add("MOL-R%d-ATMOST-OF" % row, E("extended.molar.of", of, "PROTOCOL: row 7, 8, 9", g("extended", "molar", "of")),
            totalSolids=None, conjugate=cj, c1=C1(mb), molarUnit="nM")
        add("MOL-R%d-COMPUTED" % row, E("extended.molar.rounding", "half-away", "decision item 3", g("extended", "molar", "rounding")),
            conjugate=cj, c1=C1(mb), molarUnit="µM")
        add("MOL-R%d-MOLTGT-ATMOST" % row, E("extended.molar.unit", "µM", "PROTOCOL: the molar target's unit", g("extended", "molar", "unit")),
            totalSolids=None, conjugate=cj, c1=C1(mb), target=M("0.5", "µM"), molarUnit="nM")
        add("MOL-R%d-MOLTGT-COMP" % row, None, conjugate=cj, c1=C1(mb, 52000, "g/mol"), target=M("12.5", "mM"), content=M("800"), totalSolids=M("900"))
        add("MOL-R%d-NOUNIT" % row, E("extended.molar.status", "unit-not-selected", "PROTOCOL: permitted, mass target, no molarUnit", g("extended", "molar", "status")),
            totalSolids=None, conjugate=cj, c1=C1(mb))
        add("MOL-R%d-VOL-ATMOST" % row, E("extended.molar.rounding", "up", "decision item 1", g("extended", "molar", "rounding")),
            direction="volume", totalSolids=None, conjugate=cj, c1=C1(mb), molarUnit="pM")
        add("MOL-R%d-VOL-NOUNIT" % row, None, direction="volume", totalSolids=None, conjugate=cj, c1=C1(mb))
    add("MOL-R10-WITHHELD", E("extended.molar.status", "withheld", "§8 row 10 not permitted", g("extended", "molar", "status")),
        totalSolids=None, conjugate="none", c1=C1("conjugate"), molarUnit="µM")
    add("MOL-R6-WITHHELD-NULLS", E("extended.molar.display", None, "PROTOCOL: null unless reported", g("extended", "molar", "display")),
        totalSolids=None, c1=C1("monomer"), molarUnit="µM")
    add("MOL-R3-IU", E("extended.molar.status", "withheld", "§8 row 3 (activity content)", g("extended", "molar", "status")),
        content=M("1e6", "IU"), target=M("1e4", "IU/mL"), totalSolids=None, c1=C1(), molarUnit="µM")
    # molar target with at-most: departure against the mg/mL equivalent
    add("MOL-DEP-ATMOST", E("extended.departure.isUpperBound", True, "addendum", g("extended", "departure", "isUpperBound")),
        totalSolids=None, c1=C1(), target=M("539.4", "µM"), molarUnit=None)

    # ---- D. scans around grid points (the directed-rounding critical points) -
    # D1. at-most Ca exactly on the 6-sf grid (64, 100) and the adjacent doubles:
    #     ceil(64.0) = 64.0000, ceil(nextup 64) = 64.0001, ceil(nextdown 64) = 64.0000
    for tag, Ca_t, Vtxt in (("64", 64.0, "1.00"), ("100", 100.0, "1.00"), ("0p5", 0.5, "2.00")):
        V = float(Vtxt)
        c0 = Ca_t * V / (1 - 0.00073 * Ca_t)  # c/(V + 0.00073 c) = Ca
        xs, x = [c0], c0
        for _ in range(300):
            x = nextup(x); xs.append(x)
        x = c0
        for _ in range(300):
            x = nextdown(x); xs.insert(0, x)
        probe = [base_case(id="p", direction="volume", totalSolids=None, content=M(repr(v)), volume=M(Vtxt, "mL")) for v in xs]
        rs = run(probe)
        best = {}
        for cc, r in zip(probe, rs):
            if r.get("status") != "result":
                continue
            ca = r["unrounded"]["Ca"]
            if ca == Ca_t:
                best.setdefault("ON", cc)
            elif ca < Ca_t and ("BELOW" not in best or ca > best["BELOW"][1]):
                best["BELOW"] = (cc, ca)
            elif ca > Ca_t and ("ABOVE" not in best or ca < best["ABOVE"][1]):
                best["ABOVE"] = (cc, ca)
        for k in ("ON", "BELOW", "ABOVE"):
            if k not in best:
                R.append((dict(base_case(id="x"), id="ADV-DR-CAGRID-%s-%s-NOTFOUND" % (tag, k)), {
                    "what": "scan found a %s point" % k, "want": True, "why": "tooling: scan coverage", "get": lambda r: False}))
                continue
            cc = best[k] if k == "ON" else best[k][0]
            c = dict(cc, id="ADV-DR-CAGRID-%s-%s" % (tag, k))
            R.append((c, None))  # the generic oracle judges ceil6 on the reported double
    # D2. at-least Fa exactly on the 3-sf grid (1.25, 0.5) and adjacent doubles, diluent entered
    for tag, Fa_t, Vtxt in (("1p25", 1.25, "1.2"), ("0p5", 0.5, "0.45")):
        c0 = (Fa_t - float(Vtxt)) / 0.00073
        xs, x = [c0], c0
        for _ in range(300):
            x = nextup(x); xs.append(x)
        x = c0
        for _ in range(300):
            x = nextdown(x); xs.insert(0, x)
        probe = [base_case(id="p", direction="volume", totalSolids=None, content=M(repr(v)), volume=M(Vtxt, "mL")) for v in xs]
        rs = run(probe)
        best = {}
        for cc, r in zip(probe, rs):
            if r.get("status") != "result":
                continue
            fa = r["unrounded"]["Fa"]
            if fa == Fa_t:
                best.setdefault("ON", cc)
            elif fa < Fa_t and ("BELOW" not in best or fa > best["BELOW"][1]):
                best["BELOW"] = (cc, fa)
            elif fa > Fa_t and ("ABOVE" not in best or fa < best["ABOVE"][1]):
                best["ABOVE"] = (cc, fa)
        want = {"ON": format(Decimal(repr(Fa_t)).quantize(Decimal("0.01") if Fa_t >= 1 else Decimal("0.001")), "f")}
        want["ABOVE"] = want["ON"]
        want["BELOW"] = format(Decimal(want["ON"]) - (Decimal("0.01") if Fa_t >= 1 else Decimal("0.001")), "f")
        for k in ("ON", "BELOW", "ABOVE"):
            if k not in best:
                R.append((dict(base_case(id="x"), id="ADV-DR-FAGRID-%s-%s-NOTFOUND" % (tag, k)), {
                    "what": "scan found a %s point" % k, "want": True, "why": "tooling: scan coverage", "get": lambda r: False}))
                continue
            cc = best[k] if k == "ON" else best[k][0]
            c = dict(cc, id="ADV-DR-FAGRID-%s-%s" % (tag, k))
            R.append((c, E("displayed.final", want[k], "floor3 of Fa (%s the grid point %r); decision item 2" % (k, Fa_t), g("displayed", "final"))))
    # D3. departure carry: at-most departure in (0.000999, 0.001) -> ceil -> "+0.100 %"
    #     target direction, 1 mg content: departure = F/Fa − 1 with F = 1/t
    probe = []
    for j in range(-400, 401):
        F = Decimal("1.0017302") + Decimal(j) * Decimal("1e-9")
        t = format(Decimal(1) / F, ".12g")
        probe.append(base_case(id="p", content=M("1"), totalSolids=None, target=M(t, "mg/mL")))
    rs = run(probe)
    found = 0
    for cc, r in zip(probe, rs):
        if r.get("status") == "result":
            du = r["extended"]["departure"]["unrounded"] if r.get("extended") and r["extended"].get("departure") else None
            if du is not None and 0.000999 < du < 0.001 and found < 3:
                found += 1
                R.append((dict(cc, id="ADV-DR-DEPCARRY-%d" % found), E("extended.departure.display", "+0.100 %",
                          "ceil3(%r) = 0.00100 (carry keeps 3 figures) → +0.100 %% (addendum; PROTOCOL format)" % du,
                          g("extended", "departure", "display"))))
    if not found:
        R.append((dict(base_case(id="x"), id="ADV-DR-DEPCARRY-NOTFOUND"),
                  {"what": "scan found a carry departure", "want": True, "why": "tooling: scan coverage", "get": lambda r: False}))
    # D4. at-most Ca just below 100 (99.9999x): ceil6 carries to "100.000"
    probe = []
    for j in range(1, 400):
        c_ = Decimal("100") - Decimal(j) * Decimal("1e-9")
        probe.append(base_case(id="p", direction="volume", totalSolids=None, content=M(format(c_ * 1 / (1 - Decimal("0.073")), ".17g")), volume=M("1.00", "mL")))
    rs = run(probe)
    n = 0
    for cc, r in zip(probe, rs):
        if r.get("status") == "result" and 99.9999 < r["unrounded"]["Ca"] < 100 and n < 3:
            n += 1
            R.append((dict(cc, id="ADV-DR-CA100CARRY-%d" % n), E("displayed.concentration", "100.000",
                      "ceil6(%r) = 100.000 (PROTOCOL 4: a carry keeps n figures)" % r["unrounded"]["Ca"], g("displayed", "concentration"))))
    if not n:
        R.append((dict(base_case(id="x"), id="ADV-DR-CA100CARRY-NOTFOUND"),
                  {"what": "scan found 99.9999 < Ca < 100", "want": True, "why": "tooling: scan coverage", "get": lambda r: False}))
    # D5. fl05.exceedsThreshold: fmin == case threshold, and the adjacent doubles
    for tag, kw in (("TGT", dict(totalSolids=None, target=M("8.21917808219178", "mg/mL"))),
                    ("DIL", dict(totalSolids=None, direction="volume", volume=M("9.9", "mL"))),
                    ("FIN", dict(totalSolids=None, direction="volume", volumeBasis="final", volume=M("7.3", "mL")))):
        r = run([base_case(id="p", **kw)])[0]
        fm = r["unrounded"]["fmin"]
        for k, t in (("ON", fm), ("BELOW", nextdown(fm)), ("ABOVE", nextup(fm))):
            add("FL05THR-%s-%s" % (tag, k), E("extended.fl05.exceedsThreshold", k == "BELOW",
                                               "C7-FL-05: fmin > threshold strictly; threshold %s fmin" % {"ON": "==", "BELOW": "= nextdown", "ABOVE": "= nextup"}[k],
                                               g("extended", "fl05", "exceedsThreshold")), threshold=t, **kw)
    # D6. registered threshold 0.006 against fmin = v̄ × target, scanned on target
    T0 = 0.006 / 0.00073
    Ts, x = [T0], T0
    for _ in range(30):
        x = nextup(x); Ts.append(x)
    x = T0
    for _ in range(30):
        x = nextdown(x); Ts.insert(0, x)
    probe = [base_case(id="p", content=M("1"), totalSolids=None, target=M(repr(t), "mg/mL")) for t in Ts]
    rs = run(probe)
    picks = {}
    for cc, r in zip(probe, rs):
        fm = r["unrounded"]["fmin"]
        if fm == 0.006:
            picks.setdefault("ON", cc)
        elif fm < 0.006 and ("BELOW" not in picks or fm > picks["BELOW"][1]):
            picks["BELOW"] = (cc, fm)
        elif fm > 0.006 and ("ABOVE" not in picks or fm < picks["ABOVE"][1]):
            picks["ABOVE"] = (cc, fm)
    for k in ("ON", "BELOW", "ABOVE"):
        if k in picks:
            cc = picks[k] if k == "ON" else picks[k][0]
            R.append((dict(cc, id="ADV-DR-FL05REG-%s" % k), E("extended.fl05.exceedsThreshold", k == "ABOVE",
                      "C7-FL-05: fmin > 0.006 strictly (fmin %s 0.006)" % k, g("extended", "fl05", "exceedsThreshold"))))

    # ---- E. seeded random cases: Dmin applied (bounds), and computed (half-away) ----
    rng = random.Random(SEED_DR)
    conc_units = ["mg/mL", "µg/mL", "ng/mL", "g/L", "mg/L"]
    for i in range(500):
        atmost = i < 350
        cu = rng.choice(["µg", "mg", "g"])
        cmg = Decimal(rng.randint(100, 999999)).scaleb(rng.randint(-8, -3))  # 1e-6 .. 1e3 mg
        sc = {"µg": Decimal(1000), "mg": Decimal(1), "g": Decimal("0.001")}[cu]
        content = M(format((cmg * sc).normalize(), "f"), cu)
        solids = None if atmost else M(format((cmg * Decimal(rng.randint(1001, 40000)) / 1000).quantize(Decimal(1).scaleb(cmg.as_tuple().exponent - 1)).normalize(), "f"))
        direction = rng.choice(["target", "target", "volume"])
        c1 = None
        mu = None
        if rng.random() < 0.35:
            row = rng.choice([7, 8, 9])
            mb, cj = {7: ("assembled", "none"), 8: ("assembled", "protein"), 9: ("conjugate", "conjugate")}[row]
            c1 = C1(mb, round(rng.uniform(5, 900), 1), "kDa") if rng.random() < 0.7 else C1(mb, round(rng.uniform(300, 5000), 2), "g/mol")
            mu = rng.choice(["M", "mM", "µM", "nM", "pM"])
        else:
            cj = rng.choice(["none", "none", "protein"])
        kw = dict(content=content, totalSolids=solids, conjugate=cj, c1=c1, molarUnit=mu,
                  volumeBasis=rng.choice(["diluent", "final"]), threshold=rng.choice([0.006, 0.006, 0.01, 0.008]))
        if direction == "target":
            tu = rng.choice(conc_units)
            # F between 0.05 and 50 mL
            Fml = Decimal(rng.randint(100, 9999)).scaleb(rng.randint(-5, -2))
            tmg = cmg / Fml
            tv = (tmg / {"mg/mL": 1, "µg/mL": Decimal("0.001"), "ng/mL": Decimal("1e-6"), "g/L": 1, "mg/L": Decimal("0.001")}[tu])
            tv = format(Decimal(format(tv, ".%dg" % rng.choice([2, 3, 4, 5, 6]))).normalize(), "f")
            if c1 is not None and rng.random() < 0.3:
                mwg = D(repr(c1["mw"]["value"])) * (1000 if c1["mw"]["unit"] == "kDa" else 1)
                molar = tmg / mwg / {"M": 1, "mM": Decimal("1e-3"), "µM": Decimal("1e-6"), "nM": Decimal("1e-9"), "pM": Decimal("1e-12")}[mu]
                tv, tu = format(Decimal(format(molar, ".4g")).normalize(), "f"), mu
            kw["target"] = M(tv, tu)
        else:
            vu = rng.choice(["mL", "µL"])
            vml = Decimal(rng.randint(100, 9999)).scaleb(rng.randint(-5, -2))
            kw.update(direction="volume", volume=M(format((vml * (1000 if vu == "µL" else 1)).normalize(), "f"), vu),
                      reportUnit=rng.choice(conc_units))
        add("RND-%s-%03d" % ("ATMOST" if atmost else "COMP", i), None, **kw)
    return [x for x in R if x is not None]
