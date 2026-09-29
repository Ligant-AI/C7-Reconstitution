"""URS-derived expectations and per-result checks (black box).

Every expectation cites the URS clause it is derived from. Nothing here is
taken from the engine's source.
"""
from decimal import Decimal
from adv_lib import (D, round_sf, fmt, near_tie, ulp_diff, rel, VBAR, MASS_UNITS, CONC_MASS,
                     MOLAR, VOL, ACT, OracleNA, round_up_sf, round_down_sf, near_grid, pct, signed)
import math

REJ_ORDER = ["C7-HI-01", "C7-HI-02", "C7-HI-03", "C7-HI-04", "C7-HI-06", "C7-HI-07", "C7-HI-08", "C7-HI-09"]
RELATION_FAIL_REL = 1e-9  # classification only: a relation off by more than this is not FP noise


def is_mass(c):
    return c["content"]["unit"] in MASS_UNITS


def conc_family(u):
    if u in CONC_MASS:
        return "mass"
    if u in MOLAR:
        return "molar"
    if u == "IU/mL":
        return "IU"
    if u == "U/mL":
        return "U"
    return "?"


def dec_or_none(s):
    try:
        return Decimal(s)
    except Exception:
        return None


def mw_gmol(c1):
    v = D(repr(float(c1["mw"]["value"])) if not isinstance(c1["mw"]["value"], str) else c1["mw"]["value"])
    return v * 1000 if c1["mw"]["unit"] == "kDa" else v


def pairing_row(c):
    """§8 permitted-pairs table, first matching row (rows numbered 1..11)."""
    mb = c["c1"]["massBasis"]
    if is_mass(c):
        cb, cj = c["contentBasis"], c["conjugate"]
        if cb == "total-vial-contents":
            return 1
        if cb == "not-recorded":
            return 2
    else:
        return 3
    if cj == "not-recorded":
        return 4
    if mb == "not-recorded":
        return 5
    if mb == "monomer":
        return 6
    if mb == "assembled" and cj == "none":
        return 7
    if mb == "assembled" and cj == "protein":
        return 8
    if mb == "conjugate" and cj == "conjugate":
        return 9
    if mb == "conjugate" and cj in ("none", "protein"):
        return 10
    if mb == "assembled" and cj == "conjugate":
        return 11
    raise ValueError("unreachable pairing")


PERMITTED = {7, 8, 9}


def model(c):
    """Exact-decimal model of the determination from the URS (§5, §7, §8)."""
    m = {"unspecified": [], "optional_rej": set()}
    known = set(MASS_UNITS) | set(ACT)
    if c["content"]["unit"] not in known or (c.get("totalSolids") and c["totalSolids"]["unit"] not in MASS_UNITS) \
            or c["minTransfer"]["unit"] not in ("µL", "mL") or (c.get("capacity") and c["capacity"]["unit"] not in VOL):
        raise OracleNA("unit outside the URS/PROTOCOL sets")
    texts = [c["content"]["value"], c["minTransfer"]["value"]]
    texts += [c[k]["value"] for k in ("target", "volume", "totalSolids", "capacity") if c.get(k)]
    for t in texts:
        d = dec_or_none(t) if isinstance(t, str) else None
        if d is None or not d.is_finite() or t != t.strip() or "," in t:
            raise OracleNA("number text %r outside the URS/PROTOCOL grammar" % (t,))
    mass = is_mass(c)
    cv = dec_or_none(c["content"]["value"])
    m["content"] = cv * MASS_UNITS[c["content"]["unit"]] if mass else cv
    tgt_unit = c["target"]["unit"] if c["direction"] == "target" else None
    conc_unit = tgt_unit if tgt_unit else c.get("reportUnit")
    fam = conc_family(conc_unit)
    molar_target = c["direction"] == "target" and fam == "molar"
    # ---- §7 rejections -----------------------------------------------------
    rej = []
    if m["content"] is not None and m["content"] <= 0:
        rej.append("C7-HI-01")
    if c["direction"] == "target":
        tv = dec_or_none(c["target"]["value"])
        if tv is not None and tv <= 0:
            rej.append("C7-HI-02")
    else:
        vv = dec_or_none(c["volume"]["value"])
        if vv is not None and vv <= 0:
            rej.append("C7-HI-02")
    cfam = "mass" if mass else c["content"]["unit"]
    if c["direction"] == "target":
        if (cfam == "mass" and fam in ("IU", "U")) or (cfam in ("IU", "U") and fam == "mass"):
            rej.append("C7-HI-03")
        if cfam in ("IU", "U") and fam == "molar":
            m["unspecified"].append("HI-03 alongside HI-04 for activity content with a molar target")
    else:
        if (cfam == "mass" and fam in ("IU", "U")) or (cfam in ("IU", "U") and fam == "mass"):
            m["unspecified"].append("HI-03 on a volume-direction reportUnit (§7 names the target)")
            m["optional_rej"].add("C7-HI-03")
    if molar_target and c.get("c1") and float(c["c1"]["mw"]["value"]) <= 0:
        m["unspecified"].append("molecular weight <= 0 in the imported C1 object")
        m["optional_rej"].add("C7-HI-04")
    if molar_target:
        if c.get("c1") is None or not mass or pairing_row(c) not in PERMITTED:
            rej.append("C7-HI-04")
    mt = dec_or_none(c["minTransfer"]["value"])
    if mt is not None and mt <= 0:
        rej.append("C7-HI-06")
    solids = None
    if c.get("totalSolids") and mass and c["contentBasis"] != "reagent-alone":
        m["unspecified"].append("total solids declared with content basis '%s' (C7-VC-06 offers solids only for reagent-alone content)" % c["contentBasis"])
        m["solids_unspecified"] = True
    if c.get("totalSolids"):
        solids = dec_or_none(c["totalSolids"]["value"]) * MASS_UNITS[c["totalSolids"]["unit"]]
        if mass and m["content"] is not None and solids < m["content"]:
            if float(str(solids)) >= float(str(m["content"])):
                m["unspecified"].append("HI-07: solids < content as decimals but not as doubles")
                m["optional_rej"].add("C7-HI-07")
            else:
                rej.append("C7-HI-07")
    if (cfam == "U" and fam == "IU") or (cfam == "IU" and fam == "U"):
        rej.append("C7-HI-09")
    m["rej_pre"] = rej
    # ---- displacement (§5, C7-DT-03) --------------------------------------
    if mass and c["contentBasis"] == "total-vial-contents":
        solids = m["content"]  # the stated content is the total solids (C7-DT-03)
    if mass and c["contentBasis"] == "not-recorded" and m.get("solids_unspecified"):
        solids = None  # unspecified; engine's choice recorded, not judged
    m["solids"] = solids
    Dx = solids / 1000 * VBAR if solids is not None else None
    Dmin = None
    if Dx is None and mass and c["contentBasis"] == "reagent-alone":
        Dmin = m["content"] / 1000 * VBAR
    m["D"], m["Dmin"] = Dx, Dmin
    m["Dapp"] = Dx if Dx is not None else (Dmin if Dmin is not None else Decimal(0))
    m["treatment"] = "computed" if Dx is not None else ("reagent-own-volume-only" if Dmin is not None else "not-computable-uncorrected")
    # ---- target base (PROTOCOL convention 1) ------------------------------
    if c["direction"] == "target":
        tv = dec_or_none(c["target"]["value"])
        if fam == "mass":
            m["target"] = tv * CONC_MASS[tgt_unit]
        elif fam == "molar":
            m["target"] = tv * MOLAR[tgt_unit] * mw_gmol(c["c1"]) if c.get("c1") else None
        else:
            m["target"] = tv
    else:
        m["target"] = None
    # label (C7-DT-07)
    if m["treatment"] == "computed":
        m["label"] = "obtained" if (c["direction"] == "volume" and c["volumeBasis"] == "diluent") else "achieved"
    elif m["treatment"] == "reagent-own-volume-only":
        m["label"] = "at-most"
    else:
        m["label"] = "uncorrected-for-displacement"
    # display units (PROTOCOL conventions 3, 4)
    m["vol_unit"] = "mL" if c["direction"] == "target" else c["volume"]["unit"]
    if c["direction"] == "target":
        m["conc_unit"] = "mg/mL" if fam == "molar" else tgt_unit
    else:
        m["conc_unit"] = c["reportUnit"]
    return m


def conc_to_display(Ca, unit):
    """mg/mL (or IU/mL, U/mL) exact -> display unit, exact."""
    if unit in CONC_MASS:
        return D(Ca) / CONC_MASS[unit]
    return D(Ca)


def expected_flags(c, res, m):
    fl = set()
    mass = is_mass(c)
    if mass and c["contentBasis"] == "total-vial-contents":
        fl.add(1)
    if mass and c["contentBasis"] == "not-recorded":
        fl.add(2)
    if c["provenance"] == "nominal":
        fl.add(3)
    if c["provenance"] == "not-recorded":
        fl.add(4)
    if m["D"] is None:
        fl.add(5)
    u = res.get("unrounded") or {}
    if c.get("capacity") and u.get("Fa") is not None:
        cap_ml = D(c["capacity"]["value"]) * VOL[c["capacity"]["unit"]]
        exact = D(u["Fa"]) > cap_ml
        binary = u["Fa"] > float(str(cap_ml))
        if exact != binary:
            m.setdefault("flag_optional", set()).add("C7-FL-06")
            m["unspecified"].append("FL-06: Fa vs capacity differs as exact decimals vs as doubles")
        if binary:
            fl.add(6)
    disp = res.get("displayed") or {}
    if disp.get("diluent") is not None:
        vd_ul = D(disp["diluent"]) * VOL[m["vol_unit"]] * 1000
        min_ul = D(c["minTransfer"]["value"]) * (1 if c["minTransfer"]["unit"] == "µL" else 1000)
        if vd_ul < min_ul:
            fl.add(7)
    if u.get("f") is not None and u["f"] > c.get("threshold", 0.006):
        fl.add(8)
    if c.get("c1"):
        if pairing_row(c) not in PERMITTED:
            fl.add(9)
        if c["c1"].get("flagCodes"):
            fl.add(10)
    if c["carrier"] == "present":
        fl.add(11)
    if c["carrier"] == "not-recorded":
        fl.add(12)
    if mass and c["conjugate"] in ("protein", "conjugate"):
        fl.add(13)
    if mass and c["conjugate"] == "not-recorded":
        fl.add(14)
    return ["C7-FL-%02d" % i for i in sorted(fl)]


def check(c, res):
    """Return (findings, observations). finding: dict(prop, kind, msg)."""
    out, obs = [], {}
    m = model(c)
    cid = c["id"]

    def F(prop, msg, kind="fail"):
        out.append({"id": cid, "prop": prop, "kind": kind, "msg": msg})

    for u in m["unspecified"]:
        F("unspecified", u + f"; engine: status={res['status']} rejections={res.get('rejections')}", "unspecified")
    if res["status"] == "rejected":
        exp = [r for r in REJ_ORDER if r in m["rej_pre"]]
        got = [r for r in res["rejections"] if r not in m["optional_rej"] or r in exp]
        if not exp and not got and res["rejections"]:
            return out, obs  # only unspecified conditions fired
        if got != exp and exp:
            F("rejections", f"expected {exp} (§7 order), engine {res['rejections']}")
        if not exp and got != ["C7-HI-08"]:
            F("rejections", f"no §7 condition applies (model), engine rejected {res['rejections']}")
        if not exp and res["rejections"] == ["C7-HI-08"]:
            obs["hi08"] = True
            Fm = (m["content"] / m["target"]) if (c["direction"] == "target" and m.get("target")) else (
                D(c["volume"]["value"]) * VOL[c["volume"]["unit"]] if c["direction"] == "volume" and c["volumeBasis"] == "final" else None)
            dd = m["D"] if m["D"] is not None else m["Dmin"]
            if c["direction"] == "volume" and c["volumeBasis"] == "diluent":
                F("rejections", "C7-HI-08 raised with a diluent entered; §7 says it cannot fire (F = entered + D > D)")
            elif dd is None:
                F("rejections", "C7-HI-08 raised with neither D nor Dmin defined")
            elif Fm is not None and dd / Fm < Decimal("0.999999999999"):
                F("rejections", f"C7-HI-08 raised but exact D/F = {dd / Fm:.6g} < 1")
        return out, obs
    if m["rej_pre"]:
        F("rejections", f"expected rejection {m['rej_pre']}, engine status={res['status']}")
        return out, obs
    if res["status"] != "result":
        obs["status"] = res["status"]
        return out, obs

    u, disp = res["unrounded"], res["displayed"]
    content = m["content"]
    dd_e = u["D"] if u["D"] is not None else u["Dmin"]
    if dd_e is not None and dd_e >= u["F"] and c["direction"] == "volume" and c["volumeBasis"] == "diluent":
        F("unspecified", f"binary F = Vd′ + D equals D={dd_e!r} with a diluent entered: §7's 'cannot fire when a diluent volume is entered' "
                         f"and D ≥ F on doubles conflict (carried over from 28 Sep; spec audit finding 16); engine returned a result", "unspecified")
    elif dd_e is not None and dd_e >= u["F"]:
        F("boundary", f"result returned although {'D' if u['D'] is not None else 'Dmin'}={dd_e!r} >= F={u['F']!r} (C7-HI-08)")
    VdP, Dapp, Fa, Ca, Vd, Fv = u["VdPrime"], u["Dapp"], u["Fa"], u["Ca"], u["Vd"], u["F"]
    vu = m["vol_unit"]
    k = VOL[vu]  # display-unit -> mL

    # R: label / treatment / Dapp choice (§5, DT-03, DT-07)
    if res["label"] != m["label"]:
        F("relations", f"label {res['label']} != URS {m['label']} (C7-DT-07)")
    if res["treatment"] != m["treatment"]:
        F("relations", f"treatment {res['treatment']} != URS {m['treatment']} (C7-DT-03)")
    for key, mv in (("D", m["D"]), ("Dmin", m["Dmin"])):
        if mv is None and m["treatment"] != "computed" and u[key] is not None:
            F("relations", f"{key} reported {u[key]} where URS leaves it undefined")
        if mv is not None:
            if u[key] is None:
                F("relations", f"{key} is null; URS defines it = {mv}")
            else:
                r = rel(u[key], mv)
                obs.setdefault("rel_" + key, []).append(r)
                if r > RELATION_FAIL_REL:
                    F("relations", f"{key}={u[key]} vs solids×v̄ exact {mv} (rel {r:.3g})")
    r = rel(Dapp, m["Dapp"]) if m["Dapp"] != 0 else (0.0 if Dapp == 0 else 1.0)
    if r > RELATION_FAIL_REL:
        F("relations", f"Dapp={Dapp} vs URS {m['Dapp']}")

    # R: F and Vd relations
    if c["direction"] == "target":
        if m["target"] is not None:
            rt = rel(u["target"], m["target"])
            obs.setdefault("rel_target", []).append(rt)
            if rt > RELATION_FAIL_REL:
                F("relations", f"target base {u['target']} vs {m['target']}")
            rF = rel(Fv, content / m["target"])
            obs.setdefault("rel_F", []).append(rF)
            if rF > RELATION_FAIL_REL:
                F("relations", f"F={Fv} vs content/target {content / m['target']}")
        if ulp_diff(Vd, Fv - Dapp) > 1:
            obs.setdefault("vd_ulp", []).append(ulp_diff(Vd, Fv - Dapp))
    elif c["volumeBasis"] == "diluent":
        ent = D(c["volume"]["value"]) * k
        if rel(VdP, ent) > RELATION_FAIL_REL or rel(Vd, ent) > RELATION_FAIL_REL:
            F("relations", f"entered diluent {ent} mL: Vd={Vd} VdPrime={VdP} (DT-02 Vd′=Vd=entered)")
        if disp["diluent"] != c["volume"]["value"]:
            F("relations", f"displayed diluent '{disp['diluent']}' != as typed '{c['volume']['value']}' (C7-UN-04, IV-03)")
        if Fv != Fa:
            F("relations", f"diluent entered: F={Fv} != Fa={Fa} (DT-02 F = Fa)")
    else:
        ent = D(c["volume"]["value"]) * k
        rr = rel(Fv, ent)
        if rr > RELATION_FAIL_REL:
            F("relations", f"final entered {ent} mL but F={Fv}")
        if ulp_diff(Vd, Fv - Dapp) > 1:
            obs.setdefault("vd_ulp", []).append(ulp_diff(Vd, Fv - Dapp))

    # R: Vd′ is round3(Vd) from Vd's own value, in the displayed unit (IV-03)
    if not (c["direction"] == "volume" and c["volumeBasis"] == "diluent"):
        vd_disp_exact = D(Vd) / k
        exp_vdp = round_sf(vd_disp_exact, 3)
        if near_tie(vd_disp_exact, 3):
            F("tie", f"Vd={Vd} within 8 ULP of a 3-sf tie; Vd′ rounding not judged", "tie")
        else:
            if disp["diluent"] != fmt(exp_vdp):
                F("relations", f"displayed diluent '{disp['diluent']}' != round3(Vd={Vd!r} {vu}) = '{fmt(exp_vdp)}' (C7-IV-03)")
            if rel(VdP, exp_vdp * k) > 1e-15:
                F("relations", f"VdPrime={VdP!r} != round3(Vd) {exp_vdp * k} mL")
            # derived-quantity rounding (FX-14): round3(round3(F) - Dapp)
            alt = round_sf(round_sf(D(Fv) / k, 3) - D(Dapp) / k, 3) if D(Fv) / k > D(Dapp) / k else None
            if alt is not None and alt != exp_vdp:
                obs["fx14_discriminating"] = True
                if disp["diluent"] == fmt(alt):
                    F("relations", f"Vd′ '{disp['diluent']}' is the rounding of round3(F)−Dapp, not of Vd (C7-IV-03)")

    # R: Fa = Vd′ + Dapp (float sum) (§5)
    fa_sum = VdP + Dapp
    ud = ulp_diff(Fa, fa_sum)
    obs.setdefault("fa_ulp", []).append(ud)
    rfa = rel(Fa, D(VdP) + D(Dapp))
    if rfa > RELATION_FAIL_REL:
        F("relations", f"Fa={Fa!r} != Vd′+Dapp={D(VdP) + D(Dapp)} (rel {rfa:.3g})")

    # R: Ca = content ÷ (Vd′ + Dapp) from the result's own values (§5, DT-07)
    if content is not None and Fa:
        exact = content / (D(VdP) + D(Dapp))
        rc = rel(Ca, exact)
        obs.setdefault("rel_Ca", []).append(rc)
        if rc > RELATION_FAIL_REL:
            F("relations", f"Ca={Ca!r} vs content/(Vd′+Dapp)={exact:.17g} (rel {rc:.3g})")

    # R: f = D/F, fmin = Dmin/F (§5, FL-05)
    if u["D"] is not None and u["f"] is not None:
        rf = rel(u["f"], D(u["D"]) / D(Fv))
        obs.setdefault("rel_f", []).append(rf)
        if rf > RELATION_FAIL_REL:
            F("relations", f"f={u['f']} vs D/F")
    if m["D"] is not None and u["f"] is None:
        F("relations", "f null although D computable")
    if u.get("Dmin") is not None and m["D"] is None:
        if u["fmin"] is None:
            F("relations", "fmin null although Dmin applied (C7-FL-05 payload)")
        else:
            rf = rel(u["fmin"], D(u["Dmin"]) / D(Fv))
            obs.setdefault("rel_fmin", []).append(rf)
            if rf > RELATION_FAIL_REL:
                F("relations", f"fmin={u['fmin']} vs Dmin/F={D(u['Dmin']) / D(Fv)}")

    # R: displayed final = Fa at 3 sf in the displayed unit; an "at least" final
    # (Dmin applied, C7-DT-07) is rounded DOWN on the exact binary value
    # (decision 2026-09-28 item 2), everything else half away (C7-UN-06).
    atmost = m["treatment"] == "reagent-own-volume-only"
    fa_d = D(Fa) / k
    if atmost:
        exp_fin = round_down_sf(fa_d, 3)
        if k != 1 and near_grid(fa_d, 3):
            F("tie", f"Fa={Fa!r} {vu}: µL conversion within 8 ULP of a 3-sf grid point; floor not judged", "tie")
        elif disp["final"] != fmt(exp_fin):
            F("directed", f"'at least' final '{disp['final']}' != floor3(Fa={Fa!r} {vu}) '{fmt(exp_fin)}' (decision item 2)")
        # the lower bound against its exact rational value Vd′ + content·v̄ (decision "Why")
        try:
            fin_s = D(disp["final"]) * k
            vdp_dec = D(disp["diluent"]) * k
            exact_fa = vdp_dec + content / 1000 * VBAR
            obs.setdefault("fin_bound_margin", []).append(float((exact_fa - fin_s) / exact_fa))
            if fin_s > exact_fa:
                over = fin_s - exact_fa
                ulp = D(math.ulp(Fa))
                kind = "unspecified" if over <= ulp else "fail"
                F("bound", f"'at least' final {disp['final']} {vu} exceeds exact Vd′+content·v̄ = {exact_fa} mL by {over} "
                           f"({'within' if kind != 'fail' else 'beyond'} one ULP of Fa; the decision discloses its limit only for the upper bound)", kind)
        except Exception as e:  # noqa
            F("tooling", f"lower-bound check could not evaluate: {e!r}", "tooling")
    else:
        if near_tie(fa_d, 3):
            F("tie", f"Fa={Fa!r} near a 3-sf tie", "tie")
        elif disp["final"] != fmt(round_sf(fa_d, 3)):
            F("relations", f"displayed final '{disp['final']}' != round3(Fa={Fa!r}) '{fmt(round_sf(fa_d, 3))}'")

    # R: displayed concentration = Ca at 6 sf in display unit, padded, no exponent
    ca_d = conc_to_display(Ca, m["conc_unit"])
    s = disp["concentration"]
    if "e" in s.lower():
        F("relations", f"exponent notation in displayed concentration '{s}' (PROTOCOL 4)")
    kc = CONC_MASS.get(m["conc_unit"], Decimal(1))
    if atmost:
        # "at most": 6 sf rounded UP on the exact binary value (decision item 1)
        exp_c = round_up_sf(ca_d, 6)
        if kc != 1 and near_grid(ca_d, 6):
            F("tie", f"Ca={Ca!r}: {m['conc_unit']} conversion within 8 ULP of a 6-sf grid point; ceiling not judged", "tie")
        elif s != fmt(exp_c):
            F("directed", f"'at most' concentration '{s}' != ceil6(Ca={Ca!r} in {m['conc_unit']}) '{fmt(exp_c)}' (decision item 1)")
        if kc == 1 and not ("e" in s.lower()) and D(s) < D(Ca):
            F("bound", f"'at most' display {s} below its own double Ca={Ca!r}")
        # against the exact rational bound content ÷ (Vd′ + content·v̄), in the displayed unit
        try:
            vdp_dec = D(disp["diluent"]) * k
            exact_b = content / (vdp_dec + content / 1000 * VBAR) / kc
            shown = D(s)
            obs.setdefault("conc_bound_margin", []).append(float((shown - exact_b) / exact_b))
            if shown < exact_b:
                short = exact_b - shown
                zone = short <= D(math.ulp(float(ca_d))) and shown == round_up_sf(ca_d, 6)
                F("bound", f"'at most' {s} {m['conc_unit']} is below the exact bound {exact_b:.25g} by {short:.3g}"
                           + (" — inside the disclosed one-ULP zone (decision, Stated limit)" if zone else " — OUTSIDE the disclosed one-ULP zone"),
                  "disclosed" if zone else "fail")
        except Exception as e:  # noqa
            F("tooling", f"upper-bound check could not evaluate: {e!r}", "tooling")
    elif near_tie(ca_d, 6):
        F("tie", f"Ca near a 6-sf tie in {m['conc_unit']}", "tie")
    elif s != fmt(round_sf(ca_d, 6)):
        F("relations", f"displayed concentration '{s}' != round6(Ca {m['conc_unit']}) '{fmt(round_sf(ca_d, 6))}'")

    # Additivity (C7-IV-03), all in the displayed volume unit
    try:
        vdp_s, fin_s = D(disp["diluent"]), D(disp["final"])
        typed = c["direction"] == "volume" and c["volumeBasis"] == "diluent"
        p_vd = vdp_s.as_tuple().exponent if typed else vdp_s.adjusted() - 2
        places = [p_vd, fin_s.adjusted() - 2]
        dd = Decimal(0)
        if Dapp:
            dd = round_sf(D(Dapp) / k, 3)
            places.append(dd.adjusted() - 2)
        if atmost:
            # decision item 5: final rounded down -> one unit of the final's place
            # plus half a unit of the displacement's place
            unit = Decimal(1).scaleb(fin_s.adjusted() - 2) + (Decimal(1).scaleb(dd.adjusted() - 2) / 2 if Dapp else 0)
            rule = "decision item 5"
        else:
            unit = Decimal(1).scaleb(max(places))
            rule = "coarsest place"
        gap = abs(vdp_s + dd - fin_s)
        obs["add_gap_units"] = float(gap / unit)
        obs.setdefault("add_gap_atmost" if atmost else "add_gap_other", []).append(float(gap / unit))
        if gap > unit:
            F("additivity", f"|{vdp_s} + {dd} − {fin_s}| = {gap} > {unit} ({rule})")
    except Exception as e:  # noqa
        F("additivity", f"could not evaluate: {e}")

    check_extended(c, res, m, F, obs)

    # Flags (§8)
    ef = expected_flags(c, res, m)
    for u_ in m["unspecified"][len(m["unspecified"]) - (1 if m.get("flag_optional") else 0):] if m.get("flag_optional") else []:
        F("unspecified", u_ + f"; engine flags {res['flags']}", "unspecified")
    opt = m.get("flag_optional", set())
    if [x for x in res["flags"] if x not in opt] != [x for x in ef if x not in opt]:
        F("flags", f"flags {res['flags']} != URS {ef}")
    # molar row
    if c.get("c1"):
        row = pairing_row(c)
        em = {"row": row, "status": "reported" if row in PERMITTED else "withheld"}
        if res["molar"] != em:
            F("pairing", f"molar {res['molar']} != table {em}")
    elif res["molar"] is not None:
        F("pairing", f"molar {res['molar']} with no c1")
    sub = [k for k, v in u.items() if isinstance(v, float) and v != 0 and abs(v) < 2.2250738585072014e-308]
    if sub:
        for x in out:
            if x["kind"] == "fail" and x["prop"] in ("relations", "directed", "bound", "extended"):
                x["kind"] = "subnormal"
                x["msg"] += " [subnormal operands %s: reduced binary precision, not judged]" % sub
    return out, obs


MOLAR_OF = {7: "reagent", 8: "protein", 9: "conjugate"}


def _obs(obs, key, v):
    obs.setdefault(key, []).append(v)


def check_extended(c, res, m, F, obs):
    """PROTOCOL protocol 2 `extended` block, each field against the requirement it names."""
    ext = res.get("extended")
    if ext is None:
        F("extended", "result without the protocol-2 `extended` block (PROTOCOL: reported as missing)")
        return
    u = res["unrounded"]
    atmost = m["treatment"] == "reagent-own-volume-only"
    k = VOL[m["vol_unit"]]
    # C7-DT-04 (contentBasis is ignored for IU/U content: PROTOCOL case schema)
    er = "not-computable" if (is_mass(c) and c["contentBasis"] == "total-vial-contents") else "computable"
    if ext.get("reagentConcentration") != er:
        F("extended", f"reagentConcentration {ext.get('reagentConcentration')!r} != {er!r} (C7-DT-04)")
    ecr = "up" if atmost else "half-away"
    if ext.get("concentrationRounding") != ecr:
        F("extended", f"concentrationRounding {ext.get('concentrationRounding')!r} != {ecr!r} (decision items 1, 3)")
    efin = {"isLowerBound": atmost, "rounding": "down" if atmost else "half-away"}
    if ext.get("final") != efin:
        F("extended", f"final {ext.get('final')} != {efin} (C7-DT-07; decision item 2)")
    # departure (C7-DT-07 / C7-FX-17; addendum)
    dep = ext.get("departure")
    if c["direction"] != "target":
        if dep is not None:
            F("extended", f"departure {dep} in the volume direction (PROTOCOL: target direction only, else null)")
    elif dep is None:
        F("extended", "departure null in the target direction")
    else:
        du = dep.get("unrounded")
        if not isinstance(du, (int, float)) or isinstance(du, bool):
            F("extended", f"departure.unrounded not a number: {du!r}")
        else:
            exact = D(u["Ca"]) / D(u["target"]) - 1
            _obs(obs, "dep_abs", float(abs(D(du) - exact)))
            if abs(D(du) - exact) > Decimal("1e-9"):
                F("extended", f"departure.unrounded {du!r} != Ca/target − 1 = {exact:.17g}")
            r = round_up_sf(du, 3) if atmost else round_sf(du, 3)
            exp_s = "0 %" if du == 0 else signed(pct(r))
            if dep.get("display") != exp_s:
                how = "toward +∞" if atmost else "half away"
                F("directed" if atmost else "extended",
                  f"departure display {dep.get('display')!r} != {exp_s!r} ({du!r} at 3 sf {how}; addendum / PROTOCOL format)")
            if atmost and du != 0 and r < exact:
                F("bound", f"departure 'at most' {exp_s} (from its double {du!r}) is below the exact Ca/target − 1 of the reported doubles {exact:.20g}", "unspecified")
            if not (dep.get("isUpperBound") is atmost and dep.get("rounding") == ("up" if atmost else "half-away")):
                F("extended", f"departure isUpperBound/rounding {dep.get('isUpperBound')}/{dep.get('rounding')} != {atmost}/{'up' if atmost else 'half-away'} (addendum)")
    # C7-FL-05 payload: present exactly when Dmin is applied
    fl05 = ext.get("fl05")
    if not atmost:
        if fl05 is not None:
            F("extended", f"fl05 payload present although Dmin is not applied (treatment {m['treatment']})")
    elif fl05 is None:
        F("extended", "fl05 null although Dmin is applied")
    else:
        dm, fm = fl05.get("Dmin") or {}, fl05.get("fmin") or {}
        if dm.get("unrounded") != u["Dmin"]:
            F("extended", f"fl05.Dmin.unrounded {dm.get('unrounded')!r} != unrounded.Dmin {u['Dmin']!r}")
        dd = D(u["Dmin"]) / k
        if k != 1 and near_tie(dd, 3):
            F("tie", "fl05.Dmin near a 3-sf tie in µL", "tie")
        elif dm.get("display") != fmt(round_sf(dd, 3)):
            F("extended", f"fl05.Dmin.display {dm.get('display')!r} != round3 half-away of Dmin in {m['vol_unit']} {fmt(round_sf(dd, 3))!r} (decision item 3)")
        fu = fm.get("unrounded")
        if fu != u["fmin"]:
            F("extended", f"fl05.fmin.unrounded {fu!r} != unrounded.fmin {u['fmin']!r}")
        if isinstance(fu, float) or isinstance(fu, int):
            _obs(obs, "rel_fl05_fmin_vs_Dmin_over_F", rel(fu, D(u["Dmin"]) / D(u["F"])))
            if fm.get("display") != pct(round_sf(fu, 3)):
                F("extended", f"fl05.fmin.display {fm.get('display')!r} != {pct(round_sf(fu, 3))!r} (PROTOCOL percent format)")
            thr = c.get("threshold", 0.006)
            if fl05.get("exceedsThreshold") is not (fu > thr):
                F("extended", f"fl05.exceedsThreshold {fl05.get('exceedsThreshold')!r} but fmin {fu!r} > threshold {thr!r} is {fu > thr} (C7-FL-05, strict)")
    # C7-FL-08 payload, keyed to the known volume
    fl08 = ext.get("fl08")
    raised = "C7-FL-08" in (res.get("flags") or [])
    if not raised:
        if fl08 is not None:
            F("extended", f"fl08 payload present although C7-FL-08 is not raised: {fl08}")
    elif fl08 is None:
        F("extended", "fl08 null although C7-FL-08 is raised")
    else:
        dil = c["direction"] == "volume" and c["volumeBasis"] == "diluent"
        ekv = "diluent" if dil else "final"
        if fl08.get("knownVolume") != ekv:
            F("extended", f"fl08.knownVolume {fl08.get('knownVolume')!r} != {ekv!r} (C7-FL-08 keyed to the known volume)")
        # Expected values from the exact relations on exact decimals (never from the
        # engine's f double, whose 1 − f cancels: a 28 Sep oracle bug found 29 Sep).
        Dx = m["D"]
        if dil:
            vd = D(c["volume"]["value"]) * k
            efac, epc = (vd + Dx) / vd, Dx / vd                  # 1/(1−f) = F/Vd′, f/(1−f) = D/Vd′
        else:
            if c["direction"] == "target":
                Fx = m["content"] / m["target"] if m.get("target") else D(u["F"])
            else:
                Fx = D(c["volume"]["value"]) * k
            efac, epc = Fx / (Fx + Dx), Dx / (Fx + Dx)            # 1/(1+f), f/(1+f) with f = D/F
        fd = D(u["f"])
        if (1 - fd) != 0 and dil:
            _obs(obs, "rel_fl08_factor_vs_engine_f", rel(fl08.get("factor", {}).get("unrounded"), 1 / (1 - fd)))
        fa_, pc_ = (fl08.get("factor") or {}), (fl08.get("percent") or {})
        fu, pu = fa_.get("unrounded"), pc_.get("unrounded")
        if not all(isinstance(z, (int, float)) and not isinstance(z, bool) for z in (fu, pu)):
            F("extended", f"fl08 unrounded values not numbers: {fu!r} {pu!r}")
        else:
            rf_, rp_ = rel(fu, efac), rel(pu, epc)
            _obs(obs, "rel_fl08_factor_" + ekv, rf_)
            _obs(obs, "rel_fl08_percent_" + ekv, rp_)
            if dil:
                _obs(obs, "rel_fl08_factor_vs_F_over_Vd", rel(fu, D(u["F"]) / D(u["VdPrime"])))
            if rf_ > 1e-9 or rp_ > 1e-9:
                F("extended", f"fl08 factor {fu!r} / percent {pu!r} vs {'1/(1−f), f/(1−f)' if dil else '1/(1+f), f/(1+f)'} = {efac:.17g} / {epc:.17g}")
            if (fu > 1) != dil:
                F("extended", f"fl08 factor {fu!r} on the wrong side of 1 for the {ekv} known (C7-DT-05 direction)")
            if fa_.get("display") != fmt(round_sf(fu, 3)):
                F("extended", f"fl08.factor.display {fa_.get('display')!r} != {fmt(round_sf(fu, 3))!r} (3 sf half away)")
            if pc_.get("display") != pct(round_sf(pu, 3)):
                F("extended", f"fl08.percent.display {pc_.get('display')!r} != {pct(round_sf(pu, 3))!r} (PROTOCOL percent format)")
    # molar form (C7-DT-06 / §8 pairing)
    mo = ext.get("molar")
    if not c.get("c1"):
        if mo is not None:
            F("extended", f"extended.molar present with no c1: {mo}")
        return
    if mo is None:
        F("extended", "extended.molar null although a c1 object is given")
        return
    row = pairing_row(c)
    if mo.get("row") != row:
        F("extended", f"extended.molar.row {mo.get('row')} != table row {row}")
    molar_target = c["direction"] == "target" and c["target"]["unit"] in MOLAR
    if row not in PERMITTED:
        est = "withheld"
    elif molar_target or c.get("molarUnit"):
        est = "reported"
    elif c["direction"] == "target":
        est = "unit-not-selected"
    else:
        est = None  # volume direction, permitted, no molarUnit: PROTOCOL names only "a mass target"
        F("unspecified", f"extended.molar status for volume direction with no molarUnit is not defined; engine {mo.get('status')!r}", "unspecified")
    if est is not None and mo.get("status") != est:
        F("extended", f"extended.molar.status {mo.get('status')!r} != {est!r} (PROTOCOL protocol 2)")
    if mo.get("status") == "reported" and est == "reported":
        unit = c["target"]["unit"] if molar_target else c["molarUnit"]
        exp_of = MOLAR_OF[row]
        if mo.get("of") != exp_of or mo.get("unit") != unit:
            F("extended", f"extended.molar of/unit {mo.get('of')!r}/{mo.get('unit')!r} != {exp_of!r}/{unit!r}")
        mu = mo.get("unrounded")
        if not isinstance(mu, (int, float)) or isinstance(mu, bool):
            F("extended", f"extended.molar.unrounded not a number: {mu!r}")
        else:
            exact = D(u["Ca"]) / mw_gmol(c["c1"]) / MOLAR.get(unit, Decimal(1))
            r_ = rel(mu, exact)
            _obs(obs, "rel_molar", r_)
            if r_ > 1e-9:
                F("extended", f"extended.molar.unrounded {mu!r} != Ca/MW in {unit} = {exact:.17g}")
            ed = round_up_sf(mu, 6) if atmost else round_sf(mu, 6)
            if mo.get("display") != fmt(ed):
                F("directed" if atmost else "extended",
                  f"molar display {mo.get('display')!r} != {fmt(ed)!r} ({mu!r} at 6 sf {'up' if atmost else 'half away'}; decision item 1)")
            if mo.get("rounding") != ("up" if atmost else "half-away"):
                F("extended", f"extended.molar.rounding {mo.get('rounding')!r} != {'up' if atmost else 'half-away'!r}")
    elif mo.get("status") in ("withheld", "unit-not-selected"):
        if any(mo.get(x) is not None for x in ("of", "unit", "unrounded", "display", "rounding")):
            F("extended", f"extended.molar {mo.get('status')} carries non-null fields: {mo}")
