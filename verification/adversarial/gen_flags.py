"""Property 5: flag logic (both directions), mutual exclusions, clean case, pairing table row by row."""
from adv_lib import base_case

# FX-08-like clean vial (non-round; f ~ 6.5e-4, far below every candidate threshold)
CLEAN = dict(content={"value": "0.7318", "unit": "mg"}, totalSolids={"value": "1.407", "unit": "mg"},
             contentBasis="reagent-alone", provenance="coa", conjugate="none", carrier="absent")
DIRS = {
    "TGTD": dict(direction="target", volumeBasis="diluent", target={"value": "0.4631", "unit": "mg/mL"}),
    "TGTF": dict(direction="target", volumeBasis="final", target={"value": "0.4631", "unit": "mg/mL"}),
    "VOLD": dict(direction="volume", volumeBasis="diluent", volume={"value": "1.58", "unit": "mL"}, reportUnit="mg/mL"),
    "VOLF": dict(direction="volume", volumeBasis="final", volume={"value": "1580", "unit": "µL"}, reportUnit="µg/mL"),
}
C1_OK = {"mw": {"value": 148.3, "unit": "kDa"}, "massBasis": "assembled", "flagCodes": []}


def clean(dk, **kw):
    c = base_case(**{**CLEAN, **DIRS[dk]})
    c.update(kw)
    return c


def toggles():
    """(id, case, expected flag list per URS) — expected from the §8 wording directly."""
    T = []
    for dk in DIRS:
        T.append(("ADV-FLG-%s-CLEAN" % dk, clean(dk), []))
        T.append(("ADV-FLG-%s-CLEAN-CAP" % dk, clean(dk, capacity={"value": "2", "unit": "mL"}), []))
        T.append(("ADV-FLG-%s-WEIGHED" % dk, clean(dk, provenance="weighed"), []))
        T.append(("ADV-FLG-%s-FL01" % dk, clean(dk, contentBasis="total-vial-contents", totalSolids=None), ["C7-FL-01"]))
        T.append(("ADV-FLG-%s-FL02" % dk, clean(dk, contentBasis="not-recorded", totalSolids=None), ["C7-FL-02", "C7-FL-05"]))
        T.append(("ADV-FLG-%s-FL03" % dk, clean(dk, provenance="nominal"), ["C7-FL-03"]))
        T.append(("ADV-FLG-%s-FL04" % dk, clean(dk, provenance="not-recorded"), ["C7-FL-04"]))
        T.append(("ADV-FLG-%s-FL05" % dk, clean(dk, totalSolids=None), ["C7-FL-05"]))
        T.append(("ADV-FLG-%s-FL06" % dk, clean(dk, capacity={"value": "1", "unit": "mL"}), ["C7-FL-06"]))
        T.append(("ADV-FLG-%s-FL07" % dk, clean(dk, minTransfer={"value": "5000", "unit": "µL"}), ["C7-FL-07"]))
        T.append(("ADV-FLG-%s-FL09" % dk, clean(dk, c1={**C1_OK, "massBasis": "monomer"}, molarUnit="µM"), ["C7-FL-09"]))
        T.append(("ADV-FLG-%s-FL10" % dk, clean(dk, c1={**C1_OK, "flagCodes": ["C1-FL-03"]}, molarUnit="µM"), ["C7-FL-10"]))
        T.append(("ADV-FLG-%s-C1OK" % dk, clean(dk, c1=C1_OK, molarUnit="µM"), []))
        T.append(("ADV-FLG-%s-FL11" % dk, clean(dk, carrier="present"), ["C7-FL-11"]))
        T.append(("ADV-FLG-%s-FL12" % dk, clean(dk, carrier="not-recorded"), ["C7-FL-12"]))
        T.append(("ADV-FLG-%s-FL13P" % dk, clean(dk, conjugate="protein"), ["C7-FL-13"]))
        T.append(("ADV-FLG-%s-FL13C" % dk, clean(dk, conjugate="conjugate"), ["C7-FL-13"]))
        T.append(("ADV-FLG-%s-FL14" % dk, clean(dk, conjugate="not-recorded"), ["C7-FL-14"]))
        T.append(("ADV-FLG-%s-FL11-FL05" % dk, clean(dk, carrier="present", totalSolids=None), ["C7-FL-05", "C7-FL-11"]))
    # FL-08, three known-volume forms: 80 mg / 100 mg solids at 80 mg/mL (FX-05)
    T.append(("ADV-FLG-FL08-TGT", base_case(content={"value": "80", "unit": "mg"}, totalSolids={"value": "100", "unit": "mg"},
                                           target={"value": "80", "unit": "mg/mL"}), ["C7-FL-08"]))
    T.append(("ADV-FLG-FL08-FIN", base_case(direction="volume", volumeBasis="final", content={"value": "80", "unit": "mg"},
                                           totalSolids={"value": "100", "unit": "mg"}, volume={"value": "1", "unit": "mL"}), ["C7-FL-08"]))
    T.append(("ADV-FLG-FL08-DIL", base_case(direction="volume", volumeBasis="diluent", content={"value": "80", "unit": "mg"},
                                           totalSolids={"value": "100", "unit": "mg"}, volume={"value": "0.927", "unit": "mL"}), ["C7-FL-08"]))
    # activity content: content basis and conjugate declarations are ignored (PROTOCOL; C7-VC-03a)
    act = dict(content={"value": "1e6", "unit": "IU"}, target={"value": "1e4", "unit": "IU/mL"},
               totalSolids={"value": "5", "unit": "mg"})
    T.append(("ADV-FLG-IU-CLEAN", base_case(**act), []))
    T.append(("ADV-FLG-IU-BASIS-TOTAL", base_case(**act, contentBasis="total-vial-contents"), []))
    T.append(("ADV-FLG-IU-BASIS-NR", base_case(**act, contentBasis="not-recorded"), []))
    T.append(("ADV-FLG-IU-CONJ-NR", base_case(**act, conjugate="not-recorded"), []))
    T.append(("ADV-FLG-IU-CONJ-C", base_case(**act, conjugate="conjugate"), []))
    T.append(("ADV-FLG-IU-NOSOLIDS", base_case(**{**act, "totalSolids": None}), ["C7-FL-05"]))
    T.append(("ADV-FLG-IU-CARRIER", base_case(**act, carrier="present"), ["C7-FL-11"]))
    T.append(("ADV-FLG-IU-NOMINAL", base_case(**act, provenance="nominal"), ["C7-FL-03"]))
    T.append(("ADV-FLG-U-CLEAN", base_case(content={"value": "250000", "unit": "U"}, target={"value": "2500", "unit": "U/mL"},
                                          totalSolids={"value": "5", "unit": "mg"}), []))
    for i, (tid, c, e) in enumerate(T):
        c["id"] = tid
    return T


ROWS = [
    # (row, content kind, contentBasis, conjugate, massBasis)
    (1, "mass", "total-vial-contents", "none", "assembled"),
    (2, "mass", "not-recorded", "none", "assembled"),
    (3, "IU", "reagent-alone", "none", "assembled"),
    (4, "mass", "reagent-alone", "not-recorded", "assembled"),
    (5, "mass", "reagent-alone", "none", "not-recorded"),
    (6, "mass", "reagent-alone", "none", "monomer"),
    (7, "mass", "reagent-alone", "none", "assembled"),
    (8, "mass", "reagent-alone", "protein", "assembled"),
    (9, "mass", "reagent-alone", "conjugate", "conjugate"),
    (10, "mass", "reagent-alone", "none", "conjugate"),
    (10, "mass", "reagent-alone", "protein", "conjugate"),
    (11, "mass", "reagent-alone", "conjugate", "assembled"),
    # precedence: several rows match, the first wins
    (1, "mass", "total-vial-contents", "not-recorded", "monomer"),
    (1, "mass", "total-vial-contents", "none", "not-recorded"),
    (2, "mass", "not-recorded", "not-recorded", "not-recorded"),
    (2, "mass", "not-recorded", "conjugate", "monomer"),
    (3, "IU", "reagent-alone", "not-recorded", "not-recorded"),
    (3, "U", "total-vial-contents", "none", "monomer"),
    (4, "mass", "reagent-alone", "not-recorded", "not-recorded"),
    (4, "mass", "reagent-alone", "not-recorded", "monomer"),
    (4, "mass", "reagent-alone", "not-recorded", "conjugate"),
    (5, "mass", "reagent-alone", "conjugate", "not-recorded"),
    (6, "mass", "reagent-alone", "conjugate", "monomer"),
    (6, "mass", "reagent-alone", "protein", "monomer"),
]


def pairing():
    P = []
    for j, (row, kind, cb, cj, mb) in enumerate(ROWS):
        for fl in ([], ["C1-FL-06", "C1-FL-08"]):
            c1 = {"mw": {"value": 148.3, "unit": "kDa"}, "massBasis": mb, "flagCodes": fl}
            if kind == "mass":
                cont = {"value": "1.0054", "unit": "mg"}
                solids = {"value": "1.2", "unit": "mg"} if cb == "reagent-alone" else None
                mass_t = {"value": "1", "unit": "mg/mL"}
            else:
                cont = {"value": "1e6", "unit": kind}
                solids = None
                mass_t = {"value": "1e4", "unit": kind + "/mL"}
            tag = "%02d-R%d-%s" % (j, row, "F" if fl else "0")
            # as a molar target
            c = base_case(id="ADV-PAIR-MOLAR-" + tag, content=cont, contentBasis=cb, conjugate=cj, totalSolids=solids,
                          target={"value": "6.7", "unit": "µM"}, c1=c1, molarUnit="µM")
            P.append((c, row))
            # as an imported object with a non-molar target
            c = base_case(id="ADV-PAIR-IMPORT-" + tag, content=cont, contentBasis=cb, conjugate=cj, totalSolids=solids,
                          target=mass_t, c1=c1, molarUnit="µM")
            P.append((c, row))
            # and in the volume direction
            c = base_case(id="ADV-PAIR-VOL-" + tag, direction="volume", volumeBasis="final", content=cont, contentBasis=cb,
                          conjugate=cj, totalSolids=solids, volume={"value": "1.00", "unit": "mL"},
                          reportUnit=mass_t["unit"], c1=c1, molarUnit="µM")
            P.append((c, row))
    # molar target with no imported MW
    P.append((base_case(id="ADV-PAIR-MOLAR-NOC1", content={"value": "1.0054", "unit": "mg"}, totalSolids={"value": "1.2", "unit": "mg"},
                        target={"value": "6.7", "unit": "µM"}, c1=None, molarUnit="µM"), None))
    return P


def rejection_combos():
    """Several §7 conditions at once: order, and HI-08 suppression."""
    X = []
    X.append(base_case(id="ADV-REJ-01-02-06", content={"value": "-1", "unit": "mg"}, target={"value": "0", "unit": "mg/mL"},
                       minTransfer={"value": "0", "unit": "µL"}, totalSolids=None))
    X.append(base_case(id="ADV-REJ-03-06", content={"value": "1", "unit": "mg"}, target={"value": "10", "unit": "IU/mL"},
                       minTransfer={"value": "-2", "unit": "µL"}, totalSolids=None))
    X.append(base_case(id="ADV-REJ-04-07", content={"value": "1", "unit": "mg"}, totalSolids={"value": "0.5", "unit": "mg"},
                       target={"value": "1", "unit": "µM"}, c1=None, molarUnit="µM"))
    X.append(base_case(id="ADV-REJ-06-09", content={"value": "1000", "unit": "U"}, target={"value": "10", "unit": "IU/mL"},
                       minTransfer={"value": "0", "unit": "µL"}, totalSolids=None))
    X.append(base_case(id="ADV-REJ-09-IU-U", content={"value": "1000", "unit": "IU"}, target={"value": "10", "unit": "U/mL"}, totalSolids=None))
    X.append(base_case(id="ADV-REJ-09-U-IU-VOL", direction="volume", content={"value": "1000", "unit": "U"}, reportUnit="IU/mL", totalSolids=None))
    X.append(base_case(id="ADV-REJ-03-IU-MG", content={"value": "1000", "unit": "IU"}, target={"value": "10", "unit": "mg/mL"}, totalSolids=None))
    X.append(base_case(id="ADV-REJ-03-VOL-MG-IU", direction="volume", content={"value": "1", "unit": "mg"}, reportUnit="IU/mL", totalSolids=None))
    X.append(base_case(id="ADV-REJ-04-IU-MOLAR", content={"value": "1e6", "unit": "IU"}, target={"value": "1", "unit": "µM"}, totalSolids=None,
                       c1={"mw": {"value": 15.5, "unit": "kDa"}, "massBasis": "assembled", "flagCodes": []}, molarUnit="µM"))
    # HI-08 would fire (target 2000 mg/mL ≥ 1/v̄) but another rejection applies: HI-08 not evaluated (PROTOCOL 8)
    X.append(base_case(id="ADV-REJ-08-SUPPRESSED-06", content={"value": "1000", "unit": "mg"}, totalSolids=None,
                       target={"value": "2000", "unit": "mg/mL"}, minTransfer={"value": "0", "unit": "µL"}))
    X.append(base_case(id="ADV-REJ-08-SUPPRESSED-07", content={"value": "1000", "unit": "mg"}, totalSolids={"value": "999", "unit": "mg"},
                       target={"value": "2000", "unit": "mg/mL"}))
    X.append(base_case(id="ADV-REJ-04-06", content={"value": "1", "unit": "mg"}, totalSolids=None,
                       target={"value": "1", "unit": "µM"}, c1=None, molarUnit="µM", minTransfer={"value": "0", "unit": "µL"}))
    X.append(base_case(id="ADV-REJ-03-06-07", content={"value": "1", "unit": "mg"}, totalSolids={"value": "0.5", "unit": "mg"},
                       target={"value": "10", "unit": "IU/mL"}, minTransfer={"value": "-1", "unit": "µL"}))
    X.append(base_case(id="ADV-REJ-01-03-06", content={"value": "-1", "unit": "mg"}, totalSolids=None,
                       target={"value": "10", "unit": "U/mL"}, minTransfer={"value": "0", "unit": "µL"}))
    X.append(base_case(id="ADV-REJ-06-07", content={"value": "1", "unit": "mg"}, totalSolids={"value": "0.5", "unit": "mg"},
                       minTransfer={"value": "0", "unit": "µL"}))
    X.append(base_case(id="ADV-REJ-06-09B", content={"value": "100", "unit": "U"}, totalSolids=None,
                       target={"value": "10", "unit": "IU/mL"}, minTransfer={"value": "0", "unit": "µL"}))
    X.append(base_case(id="ADV-REJ-08-ALONE", content={"value": "1000", "unit": "mg"}, totalSolids=None, target={"value": "2000", "unit": "mg/mL"}))
    X.append(base_case(id="ADV-REJ-08-ALONE-FINAL", direction="volume", volumeBasis="final", content={"value": "1000", "unit": "mg"},
                       totalSolids={"value": "2000", "unit": "mg"}, volume={"value": "1", "unit": "mL"}))
    return X


def unspecified_probes():
    U = []
    U.append(base_case(id="ADV-UNSPEC-TOTAL-WITH-SOLIDS", contentBasis="total-vial-contents",
                       content={"value": "1", "unit": "mg"}, totalSolids={"value": "5", "unit": "mg"}, target={"value": "1", "unit": "mg/mL"}))
    U.append(base_case(id="ADV-UNSPEC-NR-WITH-SOLIDS", contentBasis="not-recorded",
                       content={"value": "1", "unit": "mg"}, totalSolids={"value": "5", "unit": "mg"}, target={"value": "1", "unit": "mg/mL"}))
    U.append(base_case(id="ADV-UNSPEC-VOL-MOLAR-REPORT", direction="volume", content={"value": "1", "unit": "mg"},
                       totalSolids={"value": "1.2", "unit": "mg"}, reportUnit="µM",
                       c1={"mw": {"value": 148.3, "unit": "kDa"}, "massBasis": "assembled", "flagCodes": []}, molarUnit="µM"))
    U.append(base_case(id="ADV-UNSPEC-WHOLEVIAL-FALSE", wholeVial=False))
    return U
