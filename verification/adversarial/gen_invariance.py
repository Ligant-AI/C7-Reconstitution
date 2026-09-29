"""Property 3: invariances on unrounded values. Variant inputs are built as
decimal strings (decimal-point shifts / exact products), never by float
multiplication. Tolerances are open (outstanding item 3): discrepancies are
reported, not judged."""
import random
from decimal import Decimal
from adv_lib import base_case, run, D

SEED_IV01 = 101
SEED_IV04 = 104
SEED_IV05 = 105
SEED_VB = 303

FIELDS = ["F", "D", "Dmin", "Dapp", "Vd", "VdPrime", "Fa", "Ca", "f", "fmin", "target"]


def s(d):
    return format(Decimal(d).normalize(), "f")


def rnd(rng, lo, hi, sig=4):
    e = rng.randint(lo, hi)
    m = rng.randint(10 ** (sig - 1), 10 ** sig - 1)
    return Decimal(m).scaleb(e - sig + 1)


def relerr(a, b):
    if a is None or b is None:
        return None if a is None and b is None else float("inf")
    if a == b:
        return 0.0
    if b == 0:
        return float("inf")
    return abs(float((D(a) - D(b)) / D(b)))


def path_case(rng, path, cid):
    cmg = rnd(rng, -2, 2)
    t = rnd(rng, -1, 2)
    while cmg / t < Decimal("0.01"):
        t = t / 10
    if path == "computed":
        solids = cmg * Decimal(str(round(rng.uniform(1, 20), 2)))
        return base_case(id=cid, content={"value": s(cmg), "unit": "mg"}, totalSolids={"value": s(solids), "unit": "mg"},
                         target={"value": s(t), "unit": "mg/mL"})
    if path == "dmin":
        return base_case(id=cid, content={"value": s(cmg), "unit": "mg"}, totalSolids=None, target={"value": s(t), "unit": "mg/mL"})
    # zero correction: content basis not recorded, no solids
    return base_case(id=cid, content={"value": s(cmg), "unit": "mg"}, contentBasis="not-recorded", totalSolids=None,
                     target={"value": s(t), "unit": "mg/mL"})


def iv01(n=60):
    """target -> unrounded Vd -> (enter Vd as diluent) -> Ca vs target; and
    volume -> Ca -> (enter Ca as target) -> Vd vs volume."""
    rng = random.Random(SEED_IV01)
    report = {}
    keep = []
    for path in ("computed", "dmin", "zero"):
        fw = [path_case(rng, path, "ADV-IV01-%s-%03d-T" % (path, i)) for i in range(n)]
        rf = run(fw)
        ok = [(c, r) for c, r in zip(fw, rf) if r["status"] == "result"]
        report["skipped (rejected forward) [%s]" % path] = len(fw) - len(ok)
        fw = [c for c, _ in ok]
        rf = [r for _, r in ok]
        back = []
        for c, r in zip(fw, rf):
            b = dict(c, id=c["id"][:-2] + "-B", direction="volume", volumeBasis="diluent",
                     volume={"value": repr(r["unrounded"]["Vd"]), "unit": "mL"}, reportUnit="mg/mL")
            b.pop("target")
            back.append(b)
        rb = run(back)
        worst = (0.0, None)
        for c, r, b, q in zip(fw, rf, back, rb):
            if q["status"] != "result":
                report.setdefault("back-run not a result", []).append((b["id"], q["status"]))
                continue
            e = relerr(q["unrounded"]["Ca"], r["unrounded"]["target"])
            if e > worst[0]:
                worst = (e, c["id"])
        report["target->Vd->Ca [%s]" % path] = worst
        keep += fw[:3] + back[:3]
        if worst[1]:
            i = [c["id"] for c in fw].index(worst[1])
            keep += [fw[i], back[i]]
        # reverse: diluent entered -> Ca -> target -> Vd
        vols = [dict(c, id=c["id"][:-2] + "-V", direction="volume", volumeBasis="diluent",
                     volume={"value": s(rnd(rng, -1, 1, 3)), "unit": "mL"}, reportUnit="mg/mL") for c in fw]
        for v in vols:
            v.pop("target")
        rv = run(vols)
        tg = [dict(v, id=v["id"][:-2] + "-VT", direction="target", target={"value": repr(r["unrounded"]["Ca"]), "unit": "mg/mL"})
              for v, r in zip(vols, rv)]
        for t in tg:
            t.pop("volume"); t.pop("reportUnit")
        rt = run(tg)
        trip = [(v, a, t, b) for v, a, t, b in zip(vols, rv, tg, rt) if a["status"] == b["status"] == "result"]
        vols = [x[0] for x in trip]; rv = [x[1] for x in trip]; tg = [x[2] for x in trip]; rt = [x[3] for x in trip]
        worst = (0.0, None)
        for v, a, t, b in zip(vols, rv, tg, rt):
            e = relerr(b["unrounded"]["Vd"], a["unrounded"]["Vd"])
            if e > worst[0]:
                worst = (e, v["id"])
        report["diluent->Ca->target->Vd [%s]" % path] = worst
        keep += vols[:2] + tg[:2]
        if worst[1]:
            i = [c["id"] for c in vols].index(worst[1])
            keep += [vols[i], tg[i]]
    return report, keep


def iv04(n=60):
    rng = random.Random(SEED_IV04)
    per_field = {f: (0.0, None) for f in FIELDS}
    keep, disp_diff = [], []
    for i in range(n):
        cmg = rnd(rng, -2, 2)
        t = rnd(rng, -1, 2)
        sol = cmg * Decimal(str(round(rng.uniform(1, 20), 2))) if rng.random() < 0.7 else None
        vol = rnd(rng, -1, 1, 3)
        direction = rng.choice(["target", "volume"])
        vb = rng.choice(["diluent", "final"])
        variants = []
        for cu, cf in (("mg", 1), ("µg", 1000), ("g", Decimal("0.001"))):
            for su, sf in (("mg", 1), ("µg", 1000), ("g", Decimal("0.001"))):
                if sol is None and su != "mg":
                    continue
                kw = dict(content={"value": s(cmg * cf), "unit": cu},
                          totalSolids={"value": s(sol * sf), "unit": su} if sol is not None else None, volumeBasis=vb)
                if direction == "target":
                    for tu, tf in (("mg/mL", 1), ("µg/mL", 1000), ("ng/mL", 10 ** 6), ("g/L", 1), ("mg/L", 1000)):
                        variants.append(base_case(direction="target", target={"value": s(t * tf), "unit": tu}, **kw))
                else:
                    for vu, vf in (("mL", 1), ("µL", 1000)):
                        for ru in ("mg/mL", "µg/mL"):
                            variants.append(base_case(direction="volume", volume={"value": s(vol * vf), "unit": vu}, reportUnit=ru, **kw))
        for j, v in enumerate(variants):
            v["id"] = "ADV-IV04-%03d-%02d" % (i, j)
        rs = run(variants)
        ref = rs[0]
        if ref["status"] != "result":
            continue
        for v, r in zip(variants, rs):
            if r["status"] != "result":
                disp_diff.append((v["id"], "status " + r["status"]))
                continue
            for f in FIELDS:
                e = relerr(r["unrounded"][f], ref["unrounded"][f])
                if e is not None and e > per_field[f][0]:
                    per_field[f] = (e, v["id"] + " vs " + variants[0]["id"])
            if r["flags"] != ref["flags"] or r["label"] != ref["label"]:
                disp_diff.append((v["id"], "flags/label %s vs %s" % (r["flags"], ref["flags"])))
        keep += variants[:2] + variants[-1:]
    return per_field, keep, disp_diff


def iv05(n=60):
    rng = random.Random(SEED_IV05)
    worst = {f: (0.0, None) for f in ("Vd", "VdPrime", "F", "Ca", "target")}
    keep = []
    fails = []
    units = {"M": Decimal(1), "mM": Decimal("1e-3"), "µM": Decimal("1e-6"), "nM": Decimal("1e-9"), "pM": Decimal("1e-12")}
    for i in range(n):
        mwu = rng.choice(["kDa", "g/mol"])
        mw = rnd(rng, 1, 2, 4) if mwu == "kDa" else rnd(rng, 4, 5, 5)
        mw_gmol = mw * 1000 if mwu == "kDa" else mw
        mu = rng.choice(list(units))
        # choose mass target t (mg/mL) then molar value = t / MW exactly? not terminating; instead choose molar value
        tmass = rnd(rng, -1, 1, 4)
        mol = tmass / mw_gmol / units[mu]  # may not terminate: pick a terminating molar value instead
        mol = Decimal(format(mol, ".4g"))
        tmass = mol * units[mu] * mw_gmol  # exact decimal product
        cmg = rnd(rng, -1, 1)
        row = rng.choice([(7, "none", "assembled"), (8, "protein", "assembled"), (9, "conjugate", "conjugate")])
        sol = cmg * Decimal(str(round(rng.uniform(1, 20), 2))) if rng.random() < 0.7 else None
        kw = dict(content={"value": s(cmg), "unit": "mg"}, conjugate=row[1],
                  totalSolids={"value": s(sol), "unit": "mg"} if sol is not None else None,
                  c1={"mw": {"value": float(mw), "unit": mwu}, "massBasis": row[2], "flagCodes": []}, molarUnit=mu)
        a = base_case(id="ADV-IV05-%03d-MASS" % i, target={"value": s(tmass), "unit": "mg/mL"}, **kw)
        b = base_case(id="ADV-IV05-%03d-MOLAR" % i, target={"value": s(mol), "unit": mu}, **kw)
        ra, rb = run([a, b])
        if ra["status"] == rb["status"] == "rejected" and ra["rejections"] == rb["rejections"]:
            continue  # both rejected identically (generator reached HI-08); agreement, no value to compare
        if ra["status"] != "result" or rb["status"] != "result":
            fails.append((a["id"], ra["status"], rb["status"], rb.get("rejections")))
            continue
        for f in worst:
            e = relerr(rb["unrounded"][f], ra["unrounded"][f])
            if e > worst[f][0]:
                worst[f] = (e, b["id"])
        if i < 4 or (worst["Vd"][1] == b["id"]):
            keep += [a, b]
    return worst, keep, fails


def basis_invariance(n=80):
    """Target direction: volume basis (diluent vs final) must not change any value (§3.3)."""
    rng = random.Random(SEED_VB)
    diffs, keep = [], []
    for i in range(n):
        c = path_case(rng, rng.choice(["computed", "dmin", "zero"]), "ADV-VB-%03d-D" % i)
        e = dict(c, id="ADV-VB-%03d-F" % i, volumeBasis="final")
        ra, rb = run([c, e])
        ka = {k: ra[k] for k in ra if k != "id"}
        kb = {k: rb[k] for k in rb if k != "id"}
        if ka != kb:
            diffs.append((c["id"], [k for k in ka if ka[k] != kb.get(k)]))
        if i < 3:
            keep += [c, e]
    return diffs, keep
