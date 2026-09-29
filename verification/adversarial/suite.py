"""C7 adversarial black-box suite. Run: python3 verification/adversarial/suite.py
Writes verification/adversarial/cases.json (protocol cases, ADV-…) and
verification/adversarial/run-summary.json (evidence for the report).
Seeds: see gen_*.py (SEED_RANDOM, SEED_FX14, SEED_IV01, SEED_IV04, SEED_IV05, SEED_VB) and SEED_SHUFFLE here."""
import json
import random
import sys
from collections import Counter, defaultdict

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from adv_lib import run, ROOT, OracleNA  # noqa: E402
from oracle import check  # noqa: E402
import gen_random, gen_boundary, gen_flags, gen_invariance, gen_hostile, gen_directed  # noqa: E402

SEED_SHUFFLE = 777
OUT = ROOT + "/verification/adversarial/"

summary = {"groups": {}, "findings": [], "unspecified": [], "ties": 0, "tooling_failures": [], "disclosed": [], "oracle_na": []}
keep = []
all_cases = []


def oracle_pass(group, cases, results, extra=None):
    counts = Counter()
    obs_agg = defaultdict(list)
    for c, r in zip(cases, results):
        counts["status:" + r["status"]] += 1
        if r["status"] == "CRASH":
            summary["findings"].append({"group": group, "id": c["id"], "prop": "protocol",
                                        "msg": "engine process threw (%s); no result object for the case" % r["error"],
                                        "input": c})
            continue
        if r["status"] == "error":  # PROTOCOL convention 7: a crash, always a disagreement
            summary["findings"].append({"group": group, "id": c["id"], "prop": "protocol",
                                        "msg": "engine returned status error: %s" % r.get("message"), "input": c, "engine": r})
            continue
        if r["status"] == "incomplete" and group == "hostile":
            summary["unspecified"].append({"group": group, "id": c["id"], "prop": "unspecified",
                                           "msg": "status 'incomplete' (not a PROTOCOL status; PROTOCOL: every case complete) %s" % r.get("incomplete")})
            continue
        if r["status"] not in ("result", "rejected", "not-representable"):
            summary["findings"].append({"group": group, "id": c["id"], "prop": "protocol",
                                        "msg": "status %r is not a PROTOCOL status" % r["status"], "input": c, "engine": r})
            continue
        try:
            f, o = check(c, r)
        except OracleNA as e:  # declared: outside the URS grammar, no expectation (not a pass)
            counts["oracle-na"] += 1
            summary["oracle_na"].append({"group": group, "id": c["id"], "why": str(e), "engine_status": r["status"]})
            continue
        except Exception as e:  # standing rule 3: my own tooling failed; never a pass
            import traceback
            summary["tooling_failures"].append({"group": group, "id": c["id"], "error": repr(e),
                                                "where": traceback.format_exc().strip().splitlines()[-3:]})
            counts["TOOLING-FAILURE"] += 1
            continue
        for x in f:
            if x["kind"] == "fail":
                summary["findings"].append({"group": group, **x, "input": c, "engine": r})
            elif x["kind"] in ("unspecified", "subnormal"):
                summary["unspecified"].append({"group": group, **x})
            elif x["kind"] == "disclosed":
                summary["disclosed"].append({"group": group, **x})
            elif x["kind"] == "tooling":
                summary["tooling_failures"].append({"group": group, "id": x["id"], "error": x["msg"]})
            else:
                summary["ties"] += 1
        for k, v in o.items():
            if isinstance(v, list):
                obs_agg[k] += [z for z in v if z is not None]
            else:
                obs_agg[k].append(v)
    agg = {}
    for k, v in obs_agg.items():
        if v and all(isinstance(z, (int, float)) and not isinstance(z, bool) for z in v):
            agg[k] = {"n": len(v), "max": max(v), "nonzero": sum(1 for z in v if z)}
        else:
            agg[k] = {"n": len(v)}
    summary["groups"][group] = {"cases": len(cases), "counts": dict(counts), "obs": agg}


# 1/2/5. random relations, additivity, flags
rc = gen_random.random_cases(600)
fx = gen_random.fx14_cases(60)
rr = run(rc)
oracle_pass("random", rc, rr)
fr = run(fx)
oracle_pass("fx14", fx, fr)
keep += rc[:150] + fx
all_cases += rc + fx

# 4. boundaries
recs = gen_boundary.records()
bc = [x for x in recs if x[0] != "__scan__"]
scans = [x for x in recs if x[0] == "__scan__"]
br = run([c for c, _, _ in bc])
bres = []
for (c, e, p), r in zip(bc, br):
    if p is None:
        ok = None
    elif r["status"] in ("CRASH", "error"):
        ok = False
    else:
        try:
            ok = bool(p(r))
        except Exception as e:  # standing rule 3
            ok = None
            summary["tooling_failures"].append({"group": "boundary", "id": c["id"], "error": "predicate: %r" % e})
    bres.append({"id": c["id"], "expect": e, "ok": ok, "status": r["status"], "rejections": r.get("rejections"),
                 "flags": r.get("flags"), "f": (r.get("unrounded") or {}).get("f"), "Fa": (r.get("unrounded") or {}).get("Fa"),
                 "input_value": (c.get("volume") or c.get("target") or {}).get("value"), "capacity": c.get("capacity"),
                 "minTransfer": c["minTransfer"], "error": r.get("error")})
    if ok is False:
        summary["findings"].append({"group": "boundary", "id": c["id"], "prop": "boundary", "msg": "expected: " + e,
                                    "input": c, "engine": r})
    if p is None:
        summary["unspecified"].append({"group": "boundary", "id": c["id"], "prop": "unspecified",
                                       "msg": e + " -> engine: %s %s %s" % (r["status"], r.get("rejections"), r.get("flags"))})
oracle_pass("boundary", [c for c, _, _ in bc], br)
summary["boundary"] = bres
summary["fl08_scans"] = {t: len(v) for _, t, v in scans}
keep += [c for c, _, _ in bc]
all_cases += [c for c, _, _ in bc]

# 5. flags, pairing, rejection combos
T = gen_flags.toggles()
tc = [c for _, c, _ in T]
tr = run(tc)
tog = []
for (tid, c, exp), r in zip(T, tr):
    ok = r["status"] == "result" and r["flags"] == exp
    tog.append({"id": tid, "expected": exp, "engine": r.get("flags"), "status": r["status"], "ok": ok})
    if not ok:
        summary["findings"].append({"group": "flags", "id": tid, "prop": "flags",
                                    "msg": "§8 wording gives %s, engine %s" % (exp, r.get("flags")), "input": c, "engine": r})
oracle_pass("flags", tc, tr)
summary["toggles"] = tog
P = gen_flags.pairing()
pc = [c for c, _ in P]
pr = run(pc)
oracle_pass("pairing", pc, pr)
summary["pairing"] = [{"id": c["id"], "row": row, "status": r["status"], "rejections": r.get("rejections"),
                       "molar": r.get("molar"), "flags": r.get("flags")} for (c, row), r in zip(P, pr)]
X = gen_flags.rejection_combos()
xr = run(X)
oracle_pass("rejections", X, xr)
summary["rejcombos"] = [{"id": c["id"], "status": r["status"], "rejections": r.get("rejections")} for c, r in zip(X, xr)]
U = gen_flags.unspecified_probes()
ur = run(U)
summary["unspec_probes"] = [{"id": c["id"], "engine": r} for c, r in zip(U, ur)]
keep += tc + pc + X + U
all_cases += tc + pc + X + U

# mutual exclusions over every result seen so far
excl = [("C7-FL-01", "C7-FL-02"), ("C7-FL-03", "C7-FL-04"), ("C7-FL-11", "C7-FL-12"), ("C7-FL-13", "C7-FL-14"), ("C7-FL-05", "C7-FL-08")]
viol = []
for r in rr + fr + br + tr + pr:
    fl = set(r.get("flags") or [])
    for a, b in excl:
        if a in fl and b in fl:
            viol.append((r["id"], a, b))
summary["exclusion_violations"] = viol

# 3. invariances
iv1, k1 = gen_invariance.iv01(60)
iv4, k4, d4 = gen_invariance.iv04(60)
iv5, k5, f5 = gen_invariance.iv05(60)
vb, kvb = gen_invariance.basis_invariance(80)
summary["iv01"] = iv1
summary["iv04"] = iv4
summary["iv04_flag_label_diffs"] = d4[:50]
summary["iv05"] = iv5
summary["iv05_fail"] = f5
summary["vb_diffs"] = vb
for f in f5:
    summary["findings"].append({"group": "iv05", "id": f[0], "prop": "invariance", "msg": "status mass=%s molar=%s %s" % f[1:]})
for d in vb:
    summary["findings"].append({"group": "volume-basis", "id": d[0], "prop": "invariance",
                                "msg": "target direction: volume basis diluent vs final changed %s (§3.3: concentration not affected)" % d[1]})
kiv = k1 + k4 + k5 + kvb
kir = run(kiv)
oracle_pass("invariance-kept", kiv, kir)
keep += kiv
all_cases += kiv

# 6. hostile: each case alone and in a batch
H = gen_hostile.hostile()
hc = [c for c, _, _ in H]
hb = run(hc)
hosts = []
for (c, note, spec), rb in zip(H, hb):
    ra = run([c])[0]
    same = json.dumps(ra, sort_keys=True) == json.dumps(rb, sort_keys=True)
    st = ra["status"]
    verdict = "recorded"
    if spec == "result":
        verdict = "ok" if st == "result" else "FAIL"
    elif spec == "NR":
        verdict = "ok" if st == "not-representable" else "FAIL"
    elif spec.startswith("HI-"):
        verdict = "ok" if st == "rejected" and ("C7-" + spec) in ra["rejections"] else "FAIL"
    elif spec == "result-or-NR":
        verdict = "ok" if st in ("result", "not-representable") else "FAIL"
    elif spec == "NR-or-unspecified":
        verdict = "ok" if st != "CRASH" else "FAIL"
    if st in ("CRASH", "error") and verdict != "FAIL":
        verdict = "FAIL"
    hosts.append({"id": c["id"], "note": note, "spec": spec, "status": st, "verdict": verdict, "same_in_batch": same,
                  "engine": {k: ra.get(k) for k in ("rejections", "flags", "displayed", "error", "incomplete")},
                  "value": c["content"]["value"]})
    if verdict == "FAIL":
        summary["findings"].append({"group": "hostile", "id": c["id"], "prop": "hostile",
                                    "msg": "%s: expected %s, engine %s %s" % (note, spec, st, ra.get("error") or ra.get("rejections") or ""),
                                    "input": c, "engine": ra})
    if spec == "unspecified":
        summary["unspecified"].append({"group": "hostile", "id": c["id"], "prop": "unspecified",
                                       "msg": "%s -> %s %s" % (note, st, ra.get("incomplete") or ra.get("rejections") or ra.get("displayed"))})
oracle_pass("hostile", hc, hb)
summary["hostile"] = hosts
keep += hc
all_cases += hc

# 8. directed rounding and the extended block (amended specification)
G = gen_directed.cases()
gc = [c for c, _ in G]
gr = run(gc)
oracle_pass("directed", gc, gr)
dres = []
for (c, exp), r in zip(G, gr):
    if exp is None:
        continue
    try:
        got = exp["get"](r)
        ok = got == exp["want"]
    except Exception as e:  # standing rule 3: a failed accessor is a tooling failure, not a pass
        got, ok = "TOOLING: %r" % e, None
        summary["tooling_failures"].append({"group": "directed-fixed", "id": c["id"], "error": repr(e), "engine_status": r.get("status")})
    dres.append({"id": c["id"], "what": exp["what"], "want": exp["want"], "got": got, "ok": ok})
    if ok is False:
        summary["findings"].append({"group": "directed-fixed", "id": c["id"], "prop": "directed",
                                    "msg": "%s: expected %r (%s), engine %r" % (exp["what"], exp["want"], exp["why"], got),
                                    "input": c, "engine": r})
summary["directed_fixed"] = dres
keep += gc
all_cases += gc

# 7. determinism: every case twice, and once in shuffled order
dup = [i for i, n in Counter(c["id"] for c in all_cases).items() if n > 1]
tagged = [dict(c, id="%s#%d" % (c["id"], k)) for k, c in enumerate(all_cases)]
r1 = {r["id"]: json.dumps(r, sort_keys=True) for r in run(tagged)}
r2 = {r["id"]: json.dumps(r, sort_keys=True) for r in run(tagged)}
sh = list(tagged)
random.Random(SEED_SHUFFLE).shuffle(sh)
r3 = {r["id"]: json.dumps(r, sort_keys=True) for r in run(sh)}
nd = [i for i in r1 if not (r1[i] == r2.get(i) == r3.get(i))]
summary["determinism"] = {"cases": len(all_cases), "runs": 3, "shuffle_seed": SEED_SHUFFLE, "differing": nd, "duplicate_ids": dup}
for i in nd:
    summary["findings"].append({"group": "determinism", "id": i, "prop": "determinism", "msg": "output differs between runs"})

# write cases.json (unique ids, protocol inputs only)
seen, out = set(), []
fail_ids = {f["id"] for f in summary["findings"]}
for c in keep + [c for c in all_cases if c["id"] in fail_ids]:
    if c["id"] in seen or not c["id"].startswith("ADV-"):
        continue
    seen.add(c["id"])
    out.append(c)
with open(OUT + "cases.json", "w") as fh:
    json.dump(out, fh, ensure_ascii=False, indent=1)
    fh.write("\n")
summary["kept"] = len(out)
summary["total_run"] = len(all_cases)
with open(OUT + "run-summary.json", "w") as fh:
    json.dump(summary, fh, ensure_ascii=False, indent=1, default=str)
print("total cases run:", len(all_cases), "kept:", len(out))
print("findings:", len(summary["findings"]), Counter(f["prop"] for f in summary["findings"]))
print("unspecified:", len(summary["unspecified"]), "ties:", summary["ties"], "disclosed:", len(summary["disclosed"]),
      "oracle-na:", len(summary["oracle_na"]))
print("TOOLING FAILURES:", len(summary["tooling_failures"]))
