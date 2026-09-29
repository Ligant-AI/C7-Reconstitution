"""Property 4: every §7/§8 boundary exactly on, next double below, next double above.

Boundaries are set from the engine's own reported unrounded values wherever the
quantity compared is a computed double (f, Fa, D, Dmin), so that "on" is exact.
Each record: (case, expectation-string, predicate(result) -> bool or None).
None = unspecified by the URS; the engine's behaviour is recorded, not judged.
"""
from decimal import Decimal
from adv_lib import base_case, run, nextdown, nextup, D

ENGINE_THR = 0.006  # the registered threshold the engine is observed to use (see PROT-THR)


def rej(code):
    return lambda r: r["status"] == "rejected" and code in r["rejections"]


def res_ok(r):
    return r["status"] == "result"


def has_flag(code, want):
    return lambda r: r["status"] == "result" and ((code in r["flags"]) == want)


def records():
    R = []

    def add(case, expect, pred):
        R.append((case, expect, pred))

    # ---------------- C7-FL-08: f > threshold -----------------------------
    # Protocol probe: the case field `threshold` should be the threshold in force.
    for t in ("0.01", "0.0073", "0.5"):
        c = base_case(id="ADV-PROT-THR-%s" % t, threshold=float(t))  # f = 0.0073 (80 mg, 100 mg solids, 8 mg/mL)
        add(c, "PROTOCOL: flag iff f > case threshold %s" % t, (lambda tt: lambda r: res_ok(r) and (("C7-FL-08" in r["flags"]) == (r["unrounded"]["f"] > tt)))(float(t)))
    # f against the engine's threshold, set from the engine's own f, three forms
    forms = []
    # target direction: content = solids = 1 mg, f = 0.73e-3 * T; scan T near 0.006/0.00073
    T0 = 0.006 / 0.00073
    Ts = [T0]
    for _ in range(40):
        Ts.append(nextup(Ts[-1]))
    t = T0
    for _ in range(40):
        t = nextdown(t)
        Ts.insert(0, t)
    probe = [base_case(id="p", content={"value": "1", "unit": "mg"}, totalSolids={"value": "1", "unit": "mg"},
                       target={"value": repr(x), "unit": "mg/mL"}) for x in Ts]
    forms.append(("TGT", probe))
    # final entered: F = D / 0.006
    Dv = 0.73 / 1000
    Fs = [Dv / 0.006]
    x = Fs[0]
    for _ in range(40):
        x = nextup(x); Fs.append(x)
    x = Fs[0]
    for _ in range(40):
        x = nextdown(x); Fs.insert(0, x)
    forms.append(("FIN", [base_case(id="p", direction="volume", volumeBasis="final", content={"value": "1", "unit": "mg"},
                                    totalSolids={"value": "1", "unit": "mg"}, volume={"value": repr(v), "unit": "mL"}) for v in Fs]))
    Vs = [Dv / 0.006 - Dv]
    x = Vs[0]
    for _ in range(40):
        x = nextup(x); Vs.append(x)
    x = Vs[0]
    for _ in range(40):
        x = nextdown(x); Vs.insert(0, x)
    forms.append(("DIL", [base_case(id="p", direction="volume", volumeBasis="diluent", content={"value": "1", "unit": "mg"},
                                    totalSolids={"value": "1", "unit": "mg"}, volume={"value": repr(v), "unit": "mL"}) for v in Vs]))
    for tag, cs in forms:
        rs = run(cs)
        fs = [r["unrounded"]["f"] for r in rs]
        picks = {}
        for c, r in zip(cs, rs):
            f = r["unrounded"]["f"]
            if f == ENGINE_THR and "ON" not in picks:
                picks["ON"] = c
            if f < ENGINE_THR and (("BELOW" not in picks) or f > picks["BELOW"][1]):
                picks["BELOW"] = (c, f)
            if f > ENGINE_THR and (("ABOVE" not in picks) or f < picks["ABOVE"][1]):
                picks["ABOVE"] = (c, f)
        for k in ("ON", "BELOW", "ABOVE"):
            if k not in picks:
                continue
            c = picks[k] if k == "ON" else picks[k][0]
            c = dict(c, id="ADV-BND-FL08-%s-%s" % (tag, k))
            add(c, "C7-FL-08 raised iff f > %r (f %s threshold)" % (ENGINE_THR, {"ON": "==", "BELOW": "= nextdown", "ABOVE": "= nextup"}[k]),
                (lambda kk: lambda r: res_ok(r) and (("C7-FL-08" in r["flags"]) == (r["unrounded"]["f"] > ENGINE_THR)))(k))
        R.append(("__scan__", tag, sorted(set(fs))))

    # ---------------- C7-FL-06: Fa > capacity -----------------------------
    seeds = [
        ("TGT", base_case(id="p", content={"value": "0.7318", "unit": "mg"}, totalSolids={"value": "1.407", "unit": "mg"},
                          target={"value": "0.4631", "unit": "mg/mL"})),
        ("FIN", base_case(id="p", direction="volume", volumeBasis="final", content={"value": "0.7318", "unit": "mg"},
                          totalSolids={"value": "1.407", "unit": "mg"}, volume={"value": "1.37", "unit": "mL"})),
        ("DIL", base_case(id="p", direction="volume", volumeBasis="diluent", content={"value": "0.7318", "unit": "mg"},
                          totalSolids={"value": "1.407", "unit": "mg"}, volume={"value": "0.713", "unit": "mL"})),
        ("DMIN", base_case(id="p", content={"value": "0.7318", "unit": "mg"}, totalSolids=None,
                           target={"value": "0.4631", "unit": "mg/mL"})),
    ]
    rs = run([s for _, s in seeds])
    for (tag, s), r in zip(seeds, rs):
        Fa = r["unrounded"]["Fa"]
        for k, cap in (("ON", Fa), ("BELOW", nextdown(Fa)), ("ABOVE", nextup(Fa))):
            c = dict(s, id="ADV-BND-FL06-%s-%s" % (tag, k), capacity={"value": repr(cap), "unit": "mL"})
            add(c, "C7-FL-06 raised iff Fa > capacity (%s)" % k, has_flag("C7-FL-06", k == "BELOW"))
        # µL unit-conversion probe: capacity equal to the exact decimal of Fa, in µL
        cap_ul = format(D(Fa) * 1000, "f")
        c = dict(s, id="ADV-BND-FL06-%s-UL-EXACT" % tag, capacity={"value": cap_ul, "unit": "µL"})
        add(c, "UNSPECIFIED probe: capacity in µL equal to Fa exactly as decimals; exact comparison gives no flag", None)
        c = dict(s, id="ADV-BND-FL06-%s-UL-3SF" % tag, capacity={"value": format(D(r["displayed"]["final"]) * 1000, "f"), "unit": "µL"})
        add(c, "C7-FL-06 iff Fa > displayed final (µL)", lambda r, Fa=Fa: res_ok(r) and (("C7-FL-06" in r["flags"]) == (D(Fa) > D(c_disp_ml(r)))))

    # ---------------- C7-FL-07: Vd′ < minimum, decimals, µL -----------------
    # diluent entered: Vd′ is the typed decimal
    for k, v in (("ON", "0.002"), ("BELOW", repr(nextdown(0.002))), ("ABOVE", repr(nextup(0.002)))):
        c = base_case(id="ADV-BND-FL07-DIL-%s" % k, direction="volume", volumeBasis="diluent",
                      content={"value": "0.01", "unit": "mg"}, totalSolids={"value": "0.012", "unit": "mg"},
                      volume={"value": v, "unit": "mL"})
        add(c, "C7-FL-07 iff %s mL < 2 µL as decimals" % v, has_flag("C7-FL-07", k == "BELOW"))
    for k, mt in (("ON", "2"), ("MINBELOW", repr(nextdown(2.0))), ("MINABOVE", repr(nextup(2.0)))):
        c = base_case(id="ADV-BND-FL07-DILMIN-%s" % k, direction="volume", volumeBasis="diluent",
                      content={"value": "0.01", "unit": "mg"}, totalSolids={"value": "0.012", "unit": "mg"},
                      volume={"value": "0.002", "unit": "mL"}, minTransfer={"value": mt, "unit": "µL"})
        add(c, "C7-FL-07 iff 2 µL < min %s" % mt, has_flag("C7-FL-07", k == "MINABOVE"))
    # decimals whose binary mL<->µL conversion is inexact
    inexact = []
    for n in range(10, 1000):
        for e in (3, 4):
            ml = Decimal(n).scaleb(-e - 1)
            ul = ml * 1000
            if ul < 1:
                continue
            a = float(str(ml)) * 1000
            b = float(str(ul))
            cdiv = float(str(ul)) / 1000
            if a != b or cdiv != float(str(ml)):
                inexact.append((format(ml.normalize(), "f"), format(ul.normalize(), "f")))
    for i, (ml, ul) in enumerate(inexact[:12]):
        c = base_case(id="ADV-BND-FL07-INEXACT-DIL-%02d" % i, direction="volume", volumeBasis="diluent",
                      content={"value": "0.01", "unit": "mg"}, totalSolids={"value": "0.012", "unit": "mg"},
                      volume={"value": ml, "unit": "mL"}, minTransfer={"value": ul, "unit": "µL"})
        add(c, "C7-FL-07 not raised: %s mL == %s µL as decimals (PROTOCOL 6)" % (ml, ul), has_flag("C7-FL-07", False))
        # target direction, activity (Dapp = 0): F = N / 1e6 mL, Vd′ = round3 = ml exactly
        N = format((D(ml) * 1000000).normalize(), "f")
        c = base_case(id="ADV-BND-FL07-INEXACT-TGT-%02d" % i, content={"value": N, "unit": "IU"}, totalSolids=None,
                      target={"value": "1000000", "unit": "IU/mL"}, minTransfer={"value": ul, "unit": "µL"})
        add(c, "C7-FL-07 not raised: Vd′ displayed %s mL == %s µL" % (ml, ul), has_flag("C7-FL-07", False))
        # final entered in µL (Dapp=0 activity): Vd′ = round3(Vd) µL
        c = base_case(id="ADV-BND-FL07-INEXACT-FIN-%02d" % i, direction="volume", volumeBasis="final",
                      content={"value": N, "unit": "IU"}, totalSolids=None, volume={"value": ml, "unit": "mL"},
                      reportUnit="IU/mL", minTransfer={"value": ul, "unit": "µL"})
        add(c, "C7-FL-07 not raised: Vd′ (final entered) %s mL == %s µL" % (ml, ul), has_flag("C7-FL-07", False))
    # target direction on/below/above via the minimum
    for k, mt in (("ON", "2.1"), ("MINBELOW", repr(nextdown(2.1))), ("MINABOVE", repr(nextup(2.1)))):
        c = base_case(id="ADV-BND-FL07-TGT-%s" % k, content={"value": "2100", "unit": "IU"}, totalSolids=None,
                      target={"value": "1000000", "unit": "IU/mL"}, minTransfer={"value": mt, "unit": "µL"})
        add(c, "C7-FL-07 iff 2.10 µL < %s" % mt, has_flag("C7-FL-07", k == "MINABOVE"))

    # final entered on/below/above via the minimum (Dapp = 0 activity: Vd′ = 0.00210 mL)
    for k, mt in (("ON", "2.1"), ("MINBELOW", repr(nextdown(2.1))), ("MINABOVE", repr(nextup(2.1)))):
        c = base_case(id="ADV-BND-FL07-FIN-%s" % k, direction="volume", volumeBasis="final",
                      content={"value": "2100", "unit": "IU"}, totalSolids=None, volume={"value": "0.0021", "unit": "mL"},
                      reportUnit="IU/mL", minTransfer={"value": mt, "unit": "µL"})
        add(c, "C7-FL-07 iff Vd′ 2.10 µL < %s (final entered)" % mt, has_flag("C7-FL-07", k == "MINABOVE"))
    # FL-08 against the case threshold (PROTOCOL), exact on/below/above the engine's own f
    fx = run([base_case(id="p")])[0]["unrounded"]["f"]
    for k, t in (("ON", fx), ("BELOW", nextdown(fx)), ("ABOVE", nextup(fx))):
        c = base_case(id="ADV-BND-FL08-CASETHR-%s" % k, threshold=t)
        add(c, "C7-FL-08 iff f > case threshold (threshold %s f)" % {"ON": "==", "BELOW": "just below", "ABOVE": "just above"}[k],
            has_flag("C7-FL-08", k == "BELOW"))

    # ---------------- C7-HI-08: D ≥ F, Dmin ≥ F ------------------------------
    for tag, solids in (("D", {"value": "1000", "unit": "mg"}), ("DMIN", None), ("TOTAL", None)):
        cb = "total-vial-contents" if tag == "TOTAL" else "reagent-alone"
        big = base_case(id="p", direction="volume", volumeBasis="final", content={"value": "1000", "unit": "mg"},
                        contentBasis=cb, totalSolids=solids, volume={"value": "100", "unit": "mL"})
        r = run([big])[0]
        dd = r["unrounded"]["D"] if r["unrounded"]["D"] is not None else r["unrounded"]["Dmin"]
        for k, F in (("ON", dd), ("BELOW", nextdown(dd)), ("ABOVE", nextup(dd))):
            c = dict(big, id="ADV-BND-HI08-FIN-%s-%s" % (tag, k), volume={"value": repr(F), "unit": "mL"})
            add(c, "%s ≥ F rejects (C7-HI-08); F = %s" % (tag, k),
                rej("C7-HI-08") if k != "ABOVE" else (lambda r: res_ok(r)))
        # target direction: scan targets around content/dd, verify against F = content/T computed in binary
        T0 = 1000 / dd
        Ts = [T0]
        x = T0
        for _ in range(6):
            x = nextup(x); Ts.append(x)
        x = T0
        for _ in range(6):
            x = nextdown(x); Ts.insert(0, x)
        for j, T in enumerate(Ts):
            c = base_case(id="ADV-BND-HI08-TGT-%s-%+d" % (tag, j - 6), content={"value": "1000", "unit": "mg"},
                          contentBasis=cb, totalSolids=solids, target={"value": repr(T), "unit": "mg/mL"})
            Fb = 1000 / T  # content ÷ target as one binary division
            want_rej = dd >= Fb
            add(c, "HI-08 iff %s(%r) ≥ F=1000/T(%r): %s" % (tag, dd, Fb, "reject" if want_rej else "result"),
                (lambda w: (lambda r: rej("C7-HI-08")(r)) if w else (lambda r: res_ok(r)))(want_rej))
    # diluent entered: HI-08 cannot fire
    for j, (sol, vol) in enumerate((("1000000", "0.000001"), ("1e9", "1e-9"), ("5000", "0.001"))):
        c = base_case(id="ADV-BND-HI08-DIL-%d" % j, direction="volume", volumeBasis="diluent",
                      content={"value": "1", "unit": "mg"}, totalSolids={"value": sol, "unit": "mg"},
                      volume={"value": vol, "unit": "mL"})
        add(c, "HI-08 cannot fire with a diluent entered (§7 note)", res_ok)

    # ---------------- ≤ 0 rejections: HI-01, HI-02, HI-06 ----------------
    for v, want in (("0", True), ("-0", True), ("5e-324", False), ("-5e-324", True), ("-1", True), ("1e-320", False)):
        tag = v.replace("-", "m").replace(".", "p")
        add(base_case(id="ADV-BND-HI01-%s" % tag, content={"value": v, "unit": "mg"}, totalSolids=None),
            "HI-01 iff content ≤ 0 (%s)" % v, rej("C7-HI-01") if want else (lambda r: not (r["status"] == "rejected" and "C7-HI-01" in r["rejections"])))
        add(base_case(id="ADV-BND-HI02T-%s" % tag, target={"value": v, "unit": "mg/mL"}, totalSolids=None),
            "HI-02 iff target ≤ 0 (%s)" % v, rej("C7-HI-02") if want else (lambda r: not (r["status"] == "rejected" and "C7-HI-02" in r["rejections"])))
        add(base_case(id="ADV-BND-HI02V-%s" % tag, direction="volume", volume={"value": v, "unit": "mL"}),
            "HI-02 iff volume ≤ 0 (%s)" % v, rej("C7-HI-02") if want else (lambda r: not (r["status"] == "rejected" and "C7-HI-02" in r["rejections"])))
        add(base_case(id="ADV-BND-HI06-%s" % tag, minTransfer={"value": v, "unit": "µL"}),
            "HI-06 iff min ≤ 0 (%s)" % v, rej("C7-HI-06") if want else (lambda r: not (r["status"] == "rejected" and "C7-HI-06" in r["rejections"])))

    # ---------------- HI-07: solids < content ----------------------------
    for k, sv, su, want in (("ON", "1", "mg", False), ("BELOW", repr(nextdown(1.0)), "mg", True),
                            ("ABOVE", repr(nextup(1.0)), "mg", False), ("UG-ON", "1000", "µg", False),
                            ("UG-BELOW", "999.9999999999999", "µg", True), ("G-ON", "0.001", "g", False),
                            ("DEC-BELOW", "0.99999999999999999999", "mg", None)):
        c = base_case(id="ADV-BND-HI07-%s" % k, content={"value": "1", "unit": "mg"}, totalSolids={"value": sv, "unit": su})
        if want is None:
            add(c, "UNSPECIFIED: solids below content only beyond double precision", None)
        else:
            add(c, "HI-07 iff solids %s %s < content 1 mg" % (sv, su),
                rej("C7-HI-07") if want else res_ok)
    return R


def c_disp_ml(r):
    return D(r["displayed"]["final"])
