"""Shared helpers for the C7 black-box adversarial suite.

Only the URS (spec/reconstitution-urs-v1.0.md) and verification/PROTOCOL.md
are used to derive expectations. The engine is executed only through
verification/run-engine.mjs.
"""
import json
import math
import subprocess
from decimal import Decimal, getcontext, ROUND_HALF_UP, ROUND_FLOOR

getcontext().prec = 1500

ROOT = "/Users/moszart/Private-Developement/Ligant-Projects/benchtools-OS/C7-Reconstitution"
RUNNER = ROOT + "/verification/run-engine.mjs"
VBAR = Decimal("0.73")  # mL/g (PROTOCOL convention 2, URS §11)
THR = 0.006

MASS_UNITS = {"µg": Decimal("0.001"), "mg": Decimal(1), "g": Decimal(1000)}  # -> mg
CONC_MASS = {"mg/mL": Decimal(1), "µg/mL": Decimal("0.001"), "ng/mL": Decimal("0.000001"),
             "g/L": Decimal(1), "mg/L": Decimal("0.001")}  # -> mg/mL
MOLAR = {"M": Decimal(1), "mM": Decimal("1e-3"), "µM": Decimal("1e-6"), "nM": Decimal("1e-9"),
         "pM": Decimal("1e-12")}  # -> mol/L
VOL = {"mL": Decimal(1), "µL": Decimal("0.001")}  # -> mL
ACT = {"IU": "IU/mL", "U": "U/mL"}


def base_case(**kw):
    c = {
        "direction": "target",
        "content": {"value": "80", "unit": "mg"},
        "contentBasis": "reagent-alone",
        "provenance": "coa",
        "conjugate": "none",
        "carrier": "absent",
        "wholeVial": True,
        "totalSolids": {"value": "100", "unit": "mg"},
        "volumeBasis": "diluent",
        "target": {"value": "8", "unit": "mg/mL"},
        "molarUnit": None,
        "minTransfer": {"value": "2", "unit": "µL"},
        "capacity": None,
        "c1": None,
        "threshold": THR,
    }
    c.update(kw)
    if c["direction"] == "volume":
        c.pop("target", None)
        c.setdefault("volume", {"value": "1.00", "unit": "mL"})
        c.setdefault("reportUnit", "mg/mL")
    return c


def _run1(cases):
    p = subprocess.run(["node", RUNNER], input=json.dumps(cases).encode(), capture_output=True, cwd=ROOT)
    if p.returncode != 0:
        err = p.stderr.decode().strip().splitlines()
        msg = next((l for l in err if l.startswith("Error") or "Error:" in l), err[-1] if err else "")
        return None, msg
    out = json.loads(p.stdout.decode())
    assert len(out) == len(cases)
    return out, None


def run(cases):
    """Batch run; if the process dies, bisect so one crashing case does not
    take the others with it. A crashing case gets status 'CRASH' (not a
    protocol status) with the first error line."""
    out, err = _run1(cases)
    if out is not None:
        return out
    if len(cases) == 1:
        return [{"id": cases[0].get("id"), "status": "CRASH", "error": err}]
    mid = len(cases) // 2
    return run(cases[:mid]) + run(cases[mid:])


def run_raw(cases):
    p = subprocess.run(["node", RUNNER], input=json.dumps(cases).encode(), capture_output=True, cwd=ROOT)
    return p.returncode, p.stdout.decode(), p.stderr.decode()


def D(x):
    """Exact decimal of a float / decimal string."""
    if isinstance(x, Decimal):
        return x
    if isinstance(x, str):
        return Decimal(x)
    return Decimal(float(x))


def place_exp(d, n):
    """Exponent of the last kept place at n sf for positive decimal d."""
    e = d.adjusted()
    return e - n + 1


def round_sf(x, n):
    """Half away from zero on the exact value; returns Decimal with the kept places."""
    d = D(x)
    if d == 0:
        return Decimal(0)
    s = 1 if d > 0 else -1
    a = abs(d)
    q = Decimal(1).scaleb(place_exp(a, n))
    r = a.quantize(q, rounding=ROUND_HALF_UP)
    if r.adjusted() > a.adjusted():  # carry: keep n figures
        q = Decimal(1).scaleb(place_exp(r, n))
        r = r.quantize(q, rounding=ROUND_HALF_UP)
    return r if s > 0 else -r


def fmt(dq):
    return format(dq, "f")


def tie_distance(x, n):
    """Relative distance from exact value to the nearest n-sf tie (half-step)."""
    a = abs(D(x))
    if a == 0:
        return Decimal(1)
    q = Decimal(1).scaleb(place_exp(a, n))
    lower = (a / q).to_integral_value(rounding=ROUND_FLOOR) * q
    tie = lower + q / 2
    cands = [tie, tie - q]
    return min(abs(a - t) for t in cands) / a


def near_tie(x, n, ulps=8):
    return tie_distance(x, n) < Decimal(ulps) * Decimal(2) ** -52


def ulp_diff(a, b):
    if a == b:
        return 0
    if a is None or b is None:
        return math.inf
    if not (math.isfinite(a) and math.isfinite(b)):
        return math.inf
    import struct
    ia = struct.unpack("<q", struct.pack("<d", a))[0]
    ib = struct.unpack("<q", struct.pack("<d", b))[0]
    return abs(ia - ib)


def rel(a, b):
    if a is None or b is None:
        return None
    if a == b:
        return 0.0
    return abs(float((D(a) - D(b)) / D(b)))


def nextdown(x):
    return math.nextafter(x, -math.inf)


def nextup(x):
    return math.nextafter(x, math.inf)


# ---- amended specification (decision 2026-09-28 + addendum 2026-09-29) ----
from decimal import ROUND_CEILING, ROUND_DOWN  # noqa: E402


class OracleNA(Exception):
    """Deliberate: the input lies outside the URS/PROTOCOL grammar, so the
    oracle has no expectation. Any OTHER exception from the oracle is a failure
    of this run (verification/README.md standing rule 3)."""


def _round_dir(x, n, mode):
    d = D(x)
    if d == 0:
        return Decimal(0)
    e = place_exp(abs(d), n)
    r = d.quantize(Decimal(1).scaleb(e), rounding=mode)
    if r != 0 and abs(r).adjusted() > abs(d).adjusted():  # carry: keep n figures
        r = r.quantize(Decimal(1).scaleb(place_exp(abs(r), n)), rounding=mode)
    return r


def round_up_sf(x, n):
    """Toward +inf at n sf on the exact value (decision item 1, addendum)."""
    return _round_dir(x, n, ROUND_CEILING)


def round_down_sf(x, n):
    """Toward zero at n sf on the exact value (decision item 2)."""
    return _round_dir(x, n, ROUND_DOWN)


def near_grid(x, n, ulps=8):
    """Relative distance to the nearest n-sf grid point < ulps * 2^-52."""
    a = abs(D(x))
    if a == 0:
        return False
    q = Decimal(1).scaleb(place_exp(a, n))
    lo = (a / q).to_integral_value(rounding=ROUND_FLOOR) * q
    return min(a - lo, lo + q - a) / a < Decimal(ulps) * Decimal(2) ** -52


def pct(fr_rounded):
    """PROTOCOL format: the fraction at 3 sf, times 100 exactly, ' %'; zero '0 %'."""
    if fr_rounded == 0:
        return "0 %"
    return format(fr_rounded.scaleb(2), "f") + " %"


def signed(s):
    return s if s.startswith("-") or s == "0 %" else "+" + s
