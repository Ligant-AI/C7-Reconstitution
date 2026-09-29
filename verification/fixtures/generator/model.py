from decimal import Decimal, getcontext, ROUND_HALF_UP, ROUND_FLOOR, ROUND_CEILING, ROUND_DOWN
import math
getcontext().prec = 60

MASS = {"g":0, "mg":-3, "µg":-6}            # exponent to grams
MASSMG = {"g":3, "mg":0, "µg":-3}           # exponent to mg
CONC = {"mg/mL":0, "µg/mL":-3, "ng/mL":-6, "g/L":0, "mg/L":-3}   # exponent to mg/mL
MOLAR = {"M":0, "mM":-3, "µM":-6, "nM":-9, "pM":-12}
ACT = {"IU/mL","U/mL"}
VOL = {"mL":0, "µL":-3}
VBAR_TXT = "0.73"

def scale(x, k, N):
    if k == 0: return x
    p = N(10) ** abs(k)
    return x * p if k > 0 else x / p

def sf_parts(x, n):
    """x positive Decimal -> (quantum exponent) such that n sig figs"""
    e = x.adjusted()
    return e - n + 1

def rnd(x, n, mode=ROUND_HALF_UP):
    """round Decimal x (exact) to n sf half away from zero; returns Decimal"""
    x = Decimal(x)
    q = sf_parts(x, n)
    r = x.quantize(Decimal(1).scaleb(q), rounding=mode)
    if r.adjusted() > x.adjusted():          # carry -> keep n figures
        q = sf_parts(r, n)
        r = r.quantize(Decimal(1).scaleb(q), rounding=mode)
    return r

def fmt(r):
    s = format(r, "f")
    return s

def tie_dist(x, n):
    x = Decimal(x)
    q = Decimal(1).scaleb(sf_parts(x, n))
    t = x / q
    fl = t.to_integral_value(rounding=ROUND_FLOOR)
    frac = t - fl
    d = abs(frac - Decimal("0.5")) * q
    # tie just below the decade (finer quantum on that side)
    dec = Decimal(1).scaleb(x.adjusted())
    d2 = abs(x - (dec - q / 20))
    return min(d, d2), q

def grid_dist(x, n):
    """directed rounding: distance from x to the nearest n-sf grid point (critical point)"""
    x = Decimal(x)
    q = Decimal(1).scaleb(sf_parts(x, n))
    t = x / q
    fl = t.to_integral_value(rounding=ROUND_FLOOR)
    frac = t - fl
    return min(frac, 1 - frac) * q, q

def pair_row(c1basis, activity, basis, conj):
    if activity: return 3
    if basis == "total-vial-contents": return 1
    if basis == "not-recorded": return 2
    if conj == "not-recorded": return 4
    if c1basis == "not-recorded": return 5
    if c1basis == "monomer": return 6
    if c1basis == "assembled":
        return {"none":7, "protein":8, "conjugate":11}[conj]
    if c1basis == "conjugate":
        return 9 if conj == "conjugate" else 10
    raise ValueError

ROW_REASON = {
1:"content is total solids; dividing by reagent MW counts carrier/excipient as reagent",
2:"content basis not recorded",
3:"content in activity units; no mass to divide by a molecular weight",
4:"conjugate state not recorded",
5:"molecular-weight mass basis not recorded",
6:"MW declared as monomer/single chain",
7:"permitted",8:"permitted (molarity of the protein)",9:"permitted (molarity of the conjugate)",
10:"MW includes label/payload; stated mass does not",
11:"stated mass includes label/payload; MW does not"}

def solve(case, N=float):
    """Returns dict. N=float: IEEE-754 double model. N=Decimal: exact-decimal chain."""
    R = {}
    c = case
    dirn = c["direction"]
    act = c["content"]["unit"] in ("IU","U")
    cval = N(c["content"]["value"])
    basis = "activity" if act else c["contentBasis"]
    conj = c["conjugate"]
    cu = c["content"]["unit"]
    sol = c.get("totalSolids")
    minT = N(c["minTransfer"]["value"])
    thr = N(repr(c["threshold"])) if N is Decimal else c["threshold"]
    cap = c.get("capacity")
    c1 = c.get("c1")
    rej = []
    tgt = c.get("target"); vol = c.get("volume")
    molar_target = bool(tgt) and tgt["unit"] in MOLAR
    concunit = (tgt["unit"] if tgt else c["reportUnit"])
    # --- rejections in table order
    if cval <= 0: rej.append("C7-HI-01")
    if dirn == "target":
        if N(tgt["value"]) <= 0: rej.append("C7-HI-02")
    else:
        if N(vol["value"]) <= 0: rej.append("C7-HI-02")
    cu_mass = not act
    unit_act = concunit in ACT
    unit_mass = concunit in CONC
    if (cu_mass and unit_act) or (act and unit_mass):
        rej.append("C7-HI-03")
    row = None
    if c1 is not None:
        row = pair_row(c1["massBasis"], act, basis, conj)
    if molar_target:
        if c1 is None or act or row not in (7,8,9):
            rej.append("C7-HI-04")
    if N(minT) <= 0: rej.append("C7-HI-06")
    # solids in g
    solids_g = None
    if sol is not None:
        solids_g = scale(N(sol["value"]), MASS[sol["unit"]], N)
    content_g = None if act else scale(cval, MASS[cu], N)
    if (not act) and basis == "reagent-alone" and solids_g is not None and content_g is not None:
        if solids_g < content_g: rej.append("C7-HI-07")
    # 09
    hi09 = (cu == "U" and concunit == "IU/mL") or (cu == "IU" and concunit == "U/mL")
    # treatment
    vb = N(VBAR_TXT)
    D = Dmin = None
    if not act and basis == "total-vial-contents":
        D = content_g * vb
        solids_eff = content_g
    elif solids_g is not None and (act or basis == "reagent-alone"):
        D = solids_g * vb; solids_eff = solids_g
    elif (not act) and basis == "reagent-alone":
        Dmin = content_g * vb
    if D is not None: Dapp = D; treat = "computed"
    elif Dmin is not None: Dapp = Dmin; treat = "reagent-own-volume-only"
    else: Dapp = N(0); treat = "not-computable-uncorrected"
    # F
    content_base = cval if act else scale(cval, MASSMG[cu], N)   # mg or IU/U
    F = None
    mw = None
    Tdisp = None
    if dirn == "target" and "C7-HI-01" not in rej and "C7-HI-02" not in rej:
        tv = N(tgt["value"])
        if molar_target and c1 is not None:
            mw = N(repr(c1["mw"]["value"])) if N is Decimal else c1["mw"]["value"]
            if c1["mw"]["unit"] == "kDa": mw = mw * 1000
            T = scale(tv, MOLAR[tgt["unit"]], N) * mw      # g/L == mg/mL
        elif act:
            T = tv
        else:
            T = scale(tv, CONC[tgt["unit"]], N) if tgt["unit"] in CONC else tv
        if T > 0 and not (act != (concunit in ACT)):
            F = content_base / T
        R["T"] = T
        Tdisp = T if (molar_target or act) else tv
    elif dirn == "volume" and c["volumeBasis"] == "final" and "C7-HI-02" not in rej:
        F = scale(N(vol["value"]), VOL[vol["unit"]], N)
    hi09 = (cu == "U" and concunit == "IU/mL") or (cu == "IU" and concunit == "U/mL")
    if hi09: rej.append("C7-HI-09")
    # HI-08 (skipped if any other rejection applies)
    if not rej and F is not None:
        dd = D if D is not None else Dmin
        if dd is not None and dd >= F: rej.append("C7-HI-08")
    if rej:
        order = ["C7-HI-01","C7-HI-02","C7-HI-03","C7-HI-04","C7-HI-06","C7-HI-07","C7-HI-08","C7-HI-09"]
        return {"status":"rejected","rejections":[r for r in order if r in rej]}
    # determination
    disp_units = "mL"; scl = 0
    if dirn == "volume":
        disp_units = vol["unit"]; scl = VOL[vol["unit"]]
    entered_dil = dirn == "volume" and c["volumeBasis"] == "diluent"
    if dirn == "volume" and entered_dil:
        Vdp = scale(N(vol["value"]), VOL[vol["unit"]], N)
        Vd = Vdp
        F = Vdp + Dapp
        Vdp_txt = vol["value"]
    else:
        Vd = F - Dapp
        # display in entered unit
        Vd_u = scale(Vd, -scl, N)
        r = rnd(Decimal(Vd_u), 3)
        Vdp_txt = fmt(r)
        Vdp = scale(N(Vdp_txt), scl, N)
    Fa = Vdp + Dapp
    Ca_base = content_base / Fa
    # display conc
    if act: cu_disp = concunit; k = 0
    elif molar_target: cu_disp = "mg/mL"; k = 0
    else: cu_disp = concunit; k = CONC[concunit]
    Ca_disp = scale(Ca_base, -k, N)
    f = (D / F) if D is not None else None
    fmin = (Dmin / F) if Dmin is not None else None
    Fa_u = scale(Fa, -scl, N)
    bound = treat == "reagent-own-volume-only"     # decision 2026-09-28: "at most" conc up, "at least" final down
    disp = {"diluent": Vdp_txt,
            "final": fmt(rnd(Decimal(Fa_u), 3, ROUND_DOWN if bound else ROUND_HALF_UP)),
            "concentration": fmt(rnd(Decimal(Ca_disp), 6, ROUND_CEILING if bound else ROUND_HALF_UP))}
    # tie distances
    ties = {}
    if not entered_dil:
        ties["diluent"] = tie_dist(Decimal(scale(Vd, -scl, N)), 3)
    else: ties["diluent"] = None
    td = grid_dist if bound else tie_dist
    ties["final"] = td(Decimal(Fa_u), 3)
    ties["concentration"] = td(Decimal(Ca_disp), 6)
    # label
    if treat == "computed": label = "obtained" if entered_dil else "achieved"
    elif treat == "reagent-own-volume-only": label = "at-most"
    else: label = "uncorrected-for-displacement"
    # flags
    fl = set()
    if not act:
        if basis == "total-vial-contents": fl.add(1)
        if basis == "not-recorded": fl.add(2)
    if c["provenance"] == "nominal": fl.add(3)
    if c["provenance"] == "not-recorded": fl.add(4)
    if treat != "computed": fl.add(5)
    if cap is not None:
        capmL = scale(N(cap["value"]), VOL[cap["unit"]], N)
        if Fa > capmL: fl.add(6)
    vd_uL = Decimal(Vdp_txt) * (1 if disp_units == "µL" else 1000)
    if vd_uL < Decimal(c["minTransfer"]["value"]) * (1 if c["minTransfer"]["unit"]=="µL" else 1000): fl.add(7)
    if f is not None and f > thr: fl.add(8)
    molar = None
    if c1 is not None:
        st = "reported" if row in (7,8,9) else "withheld"
        molar = {"row": row, "status": st}
        if st == "withheld": fl.add(9)
        if c1.get("flagCodes"): fl.add(10)
    if c["carrier"] == "present": fl.add(11)
    if c["carrier"] == "not-recorded": fl.add(12)
    if not act:
        if conj in ("protein","conjugate"): fl.add(13)
        if conj == "not-recorded": fl.add(14)
    flags = ["C7-FL-%02d" % i for i in sorted(fl)]
    out = {"status":"result","flags":flags,"label":label,"treatment":treat,"displayed":disp,
           "_ties":ties,"_directed":bound,"_vals":dict(F=F,D=D,Dmin=Dmin,Dapp=Dapp,Vd=Vd,Vdp=Vdp,Fa=Fa,Ca=Ca_base,f=f,fmin=fmin,
                                     content_base=content_base,unit=cu_disp,Tdisp=Tdisp,mw=(None if c1 is None else (N(repr(c1["mw"]["value"])) if N is Decimal else c1["mw"]["value"]) * (1000 if c1["mw"]["unit"]=="kDa" else 1)),row=row,bound=bound,molar_target=molar_target,dispunit=disp_units,Ca_disp=Ca_disp)}
    if molar is not None: out["molar"] = molar
    return out
