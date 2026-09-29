"""Harness self-test only: adapts the SAME-AUTHOR reimpl/reconstitution.py to the
protocol so compare.mjs can be shown to report agreement. This is not a
clean-room implementation and discharges nothing."""
import json, sys, subprocess, os
cases = json.load(sys.stdin)
for c in cases:
    c1 = c.get("c1")
    c["mwGperMol"] = (c1["mw"]["value"] * 1e3 if c1["mw"]["unit"] == "kDa" else c1["mw"]["value"]) if c1 else None
    c["c1MassBasis"] = c1["massBasis"] if c1 else None
    c["c1FlagCount"] = len(c1["flagCodes"]) if c1 else 0
here = os.path.dirname(os.path.abspath(__file__))
out = subprocess.run([sys.executable, os.path.join(here, "..", "reimpl", "reconstitution.py")], input=json.dumps(cases), capture_output=True, text=True, check=True)
res = json.loads(out.stdout)
for r in res:
    r.setdefault("rejections", [])
json.dump(res, sys.stdout)
