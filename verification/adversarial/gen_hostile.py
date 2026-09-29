"""Property 6: hostile input. Each case is run in its own process as well as in a batch."""
from adv_lib import base_case

M = lambda v, u="mg": {"value": v, "unit": u}


def hostile():
    H = []

    def add(tid, note, spec, **kw):
        c = base_case(**kw)
        c["id"] = "ADV-HOST-" + tid
        H.append((c, note, spec))

    # extreme magnitudes (spec: result when every needed quantity is a finite positive double, else not-representable)
    add("CONT-1e-300", "content 1e-300 mg, Dmin applied", "result-or-NR", content=M("1e-300"), totalSolids=None)
    add("CONT-1e300", "content 1e300 mg, target 1 mg/mL", "result-or-NR", content=M("1e300"), totalSolids=None, target=M("1", "mg/mL"))
    add("CONT-1e300-T1e300", "content 1e300 mg, target 1e300 mg/mL (F=1, HI-08 fires on Dmin)", "HI-08",
        content=M("1e300"), totalSolids=None, target=M("1e300", "mg/mL"))
    add("TGT-1e-300", "target 1e-300 mg/mL: F = 8e301 mL overflows nothing yet", "result-or-NR", totalSolids=None, target=M("1e-300", "mg/mL"))
    add("TGT-1e-310-ng", "target 1e-310 ng/mL: F = content/target overflows to Infinity", "NR", totalSolids=None, target=M("1e-310", "ng/mL"))
    add("CONT-5e-324-UG", "content 5e-324 µg: base mg underflows to 0", "NR", content=M("5e-324", "µg"), totalSolids=None)
    add("CONT-1e-300-IU", "activity 1e-300 IU", "result-or-NR", content=M("1e-300", "IU"), target=M("1e-300", "IU/mL"), totalSolids=None)
    add("CONT-1e300-IU", "activity 1e300 IU at 1 IU/mL: F = 1e300 mL", "result-or-NR", content=M("1e300", "IU"), target=M("1", "IU/mL"), totalSolids=None)
    add("VOL-1e300", "diluent 1e300 mL", "result-or-NR", direction="volume", volume=M("1e300", "mL"))
    add("VOL-1e-300-FIN", "final 1e-300 mL: D ≥ F", "HI-08", direction="volume", volumeBasis="final", volume=M("1e-300", "mL"))
    add("VOL-1e-300-DIL", "diluent 1e-300 mL: computable, F = 0.073", "result", direction="volume", volume=M("1e-300", "mL"))
    add("VOL-5e-324-DIL", "diluent 5e-324 mL (denormal); FL-08 overstatement factor F/Vd′ ≈ 1.5e322 is not a finite double, and protocol 2 makes it a reported number (extended.fl08.factor.unrounded) — result-or-NR since 29 Sep", "result-or-NR", direction="volume", volume=M("5e-324", "mL"))
    add("VOL-1e-310-UL-DIL", "diluent 1e-310 µL", "result-or-NR", direction="volume", volume=M("1e-310", "µL"))
    add("SOL-1e300", "solids 1e300 mg, diluent entered", "result-or-NR", direction="volume", totalSolids=M("1e300"))
    add("MIN-1e300", "minimum 1e300 µL", "result", minTransfer=M("1e300", "µL"))
    add("MIN-1e-300", "minimum 1e-300 µL", "result", minTransfer=M("1e-300", "µL"))
    add("CAP-1e-300", "capacity 1e-300 mL", "result", capacity=M("1e-300", "mL"))
    add("CONC-SMALL-DISP", "Ca ≈ 1e-200 mg/mL, display must be exponent-free at 6 sf", "result-or-NR",
        content=M("1e-200"), totalSolids=None, contentBasis="not-recorded", target=M("1e-200", "mg/mL"))
    add("CONC-LARGE-DISP", "Ca ≈ 1e200 IU/mL, display exponent-free", "result-or-NR",
        content=M("1e200", "IU"), target=M("1e200", "IU/mL"), totalSolids=None)
    # scientific notation / many digits
    add("SCI-1", "1e-3 g content, 8E0 mg/mL", "result", content=M("1e-3", "g"), target=M("8E0", "mg/mL"))
    add("SCI-2", "8.0e+1 mg", "result", content=M("8.0e+1"), target=M("8", "mg/mL"))
    add("DIGITS-40", "40 significant digits", "result", content=M("80.00000000000000000000000000000000000001"))
    add("DIGITS-LEAD0", "leading zeros", "result", content=M("0000080"))
    add("DIGITS-TRAIL", "trailing dot '80.'", "unspecified", content=M("80."))
    add("DIGITS-LEADDOT", "'.5' mg", "unspecified", content=M(".5"), totalSolids=None)
    add("PLUS", "'+80'", "unspecified", content=M("+80"))
    add("SPACES", "' 80 '", "unspecified", content=M(" 80 "))
    add("COMMA", "'1,000'", "unspecified", content=M("1,000"))
    add("HEX", "'0x50'", "unspecified", content=M("0x50"))
    add("INF", "'Infinity'", "unspecified", content=M("Infinity"))
    add("NAN", "'NaN'", "unspecified", content=M("NaN"))
    add("EMPTY", "''", "unspecified", content=M(""))
    add("OVERFLOW-STR", "'1e400' (not a finite double)", "NR-or-unspecified", content=M("1e400"))
    add("UNDERFLOW-STR", "'1e-400' mg (positive decimal, rounds to 0)", "NR-or-unspecified", content=M("1e-400"), totalSolids=None)
    add("NEG-ZERO-SOL", "solids '-0' (HI-07: -0 < 80)", "HI-07", totalSolids=M("-0"))
    # units mixed across families
    add("MIX-MG-IUML", "mg content, IU/mL target", "HI-03", target=M("8", "IU/mL"))
    add("MIX-IU-MGML", "IU content, mg/mL target", "HI-03", content=M("1e6", "IU"), target=M("8", "mg/mL"), totalSolids=None)
    add("MIX-U-IUML", "U content, IU/mL target", "HI-09", content=M("1e6", "U"), target=M("8", "IU/mL"), totalSolids=None)
    add("MIX-IU-UML", "IU content, U/mL target", "HI-09", content=M("1e6", "IU"), target=M("8", "U/mL"), totalSolids=None)
    add("MIX-IU-IUML", "IU content, IU/mL target", "result", content=M("1e6", "IU"), target=M("1e4", "IU/mL"), totalSolids=None)
    add("MIX-U-UML", "U content, U/mL target", "result", content=M("1e6", "U"), target=M("1e4", "U/mL"), totalSolids=None)
    add("MIX-VOL-U-IU", "volume dir: U content, IU/mL report", "HI-09", direction="volume", content=M("1e6", "U"), reportUnit="IU/mL", totalSolids=None)
    add("MIX-VOL-IU-U", "volume dir: IU content, U/mL report", "HI-09", direction="volume", content=M("1e6", "IU"), reportUnit="U/mL", totalSolids=None)
    add("MIX-SOL-IU", "solids unit IU", "unspecified", totalSolids=M("5", "IU"))
    add("MIX-VOL-MG", "volume unit mg", "unspecified", direction="volume", volume=M("1", "mg"))
    add("MIX-MIN-ML", "minimum transfer in mL", "unspecified", minTransfer=M("0.002", "mL"))
    add("MIX-TGT-UL", "target unit µL", "unspecified", target=M("8", "µL"))
    add("UNIT-lower-iu", "unit 'iu'", "unspecified", content=M("1e6", "iu"), target=M("1e4", "IU/mL"), totalSolids=None)
    add("UNIT-ug-ascii", "unit 'ug' (ASCII)", "unspecified", content=M("80000", "ug"))
    add("UNIT-micro-sign", "unit 'μg' (Greek mu U+03BC, not micro sign U+00B5)", "unspecified", content=M("80000", "μg"))
    add("MW-ZERO", "MW 0 kDa with molar target", "unspecified", target=M("1", "µM"),
        c1={"mw": {"value": 0, "unit": "kDa"}, "massBasis": "assembled", "flagCodes": []}, molarUnit="µM")
    add("MW-NEG", "MW -148 kDa with molar target", "unspecified", target=M("1", "µM"),
        c1={"mw": {"value": -148, "unit": "kDa"}, "massBasis": "assembled", "flagCodes": []}, molarUnit="µM")
    add("MW-HUGE", "MW 1e300 kDa, 1 M target", "NR-or-unspecified", target=M("1", "M"),
        c1={"mw": {"value": 1e300, "unit": "kDa"}, "massBasis": "assembled", "flagCodes": []}, molarUnit="µM")
    return H
