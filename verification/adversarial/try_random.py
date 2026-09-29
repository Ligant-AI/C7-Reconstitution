import json, sys
from collections import Counter
from adv_lib import run
from oracle import check
from gen_random import random_cases, fx14_cases

cases = random_cases() + fx14_cases()
res = run(cases)
cnt = Counter()
fails = []
for c, r in zip(cases, res):
    f, o = check(c, r)
    cnt[r["status"]] += 1
    for x in f:
        cnt[x["kind"] + ":" + x["prop"]] += 1
        if x["kind"] == "fail":
            fails.append(x)
print(cnt)
seen = Counter()
for x in fails:
    key = x["prop"] + x["msg"][:40]
    seen[key] += 1
    if seen[key] <= 2:
        print(x["id"], x["prop"], x["msg"])
