# ---------------- FX-01 non-round
CV = "Constructed under the assumption that no displayed value lies within 1 ULP of a 3-sf/6-sf tie (recorded distances in tieDistances), f < 0.006 so no material-threshold flag, all declarations clean."
dirs("IND-FX-01a", ["C7-FX-01","C7-FX-12"], "Non-round content 2.3719 mg, solids 3.1 mg, target 0.8137 mg/mL. " + CV,
     C(content=q("2.3719","mg"), totalSolids=q("3.1","mg"), target=q("0.8137","mg/mL")))
dirs("IND-FX-01b", ["C7-FX-01","C7-FX-12"], "Non-round content 17.463 mg, solids 21.9 mg, target 6.437 mg/mL. " + CV,
     C(content=q("17.463","mg"), totalSolids=q("21.9","mg"), target=q("6.437","mg/mL")))
dirs("IND-FX-01c", ["C7-FX-01","C7-FX-12"], "Non-round content 731.2 ug, solids 905 ug, target 152.6 ug/mL (leading digit 4 in the diluent). " + CV,
     C(content=q("731.2","µg"), totalSolids=q("905","µg"), target=q("152.6","µg/mL")))
dirs("IND-FX-01d", ["C7-FX-01","C7-FX-12"], "Non-round content 0.0418 g, solids 0.0537 g, target 4.81 g/L (mass in g). " + CV,
     C(content=q("0.0418","g"), totalSolids=q("0.0537","g"), target=q("4.81","g/L")))

# ---------------- FX-02 unit families
b_ = dict(content=q("2.3719","mg"), totalSolids=q("3.1","mg"), target=q("0.8137","mg/mL"))
cx = "Same physical determination as IND-FX-01a entered in a different unit; displayed values must equal IND-FX-01a-T (C7-IV-04; unrounded agreement within the derived tolerance is the check-fixtures side, tolerance not yet derived)."
add("IND-FX-02-c-ug", ["C7-FX-02","C7-IV-04"], "Content as ug. " + cx, C(content=q("2371.9","µg"), totalSolids=q("3.1","mg"), target=q("0.8137","mg/mL")))
add("IND-FX-02-c-g", ["C7-FX-02","C7-IV-04"], "Content and solids as g. " + cx, C(content=q("0.0023719","g"), totalSolids=q("0.0031","g"), target=q("0.8137","mg/mL")))
add("IND-FX-02-s-ug", ["C7-FX-02","C7-IV-04"], "Solids as ug. " + cx, C(content=q("2.3719","mg"), totalSolids=q("3100","µg"), target=q("0.8137","mg/mL")))
add("IND-FX-02-t-ugmL", ["C7-FX-02","C7-IV-04"], "Target as ug/mL. " + cx, C(target=q("813.7","µg/mL"), content=q("2.3719","mg"), totalSolids=q("3.1","mg")))
add("IND-FX-02-t-ngmL", ["C7-FX-02","C7-IV-04"], "Target as ng/mL. " + cx, C(target=q("813700","ng/mL"), content=q("2.3719","mg"), totalSolids=q("3.1","mg")))
add("IND-FX-02-t-gL", ["C7-FX-02","C7-IV-04"], "Target as g/L. " + cx, C(target=q("0.8137","g/L"), content=q("2.3719","mg"), totalSolids=q("3.1","mg")))
add("IND-FX-02-t-mgL", ["C7-FX-02","C7-IV-04"], "Target as mg/L. " + cx, C(target=q("813.7","mg/L"), content=q("2.3719","mg"), totalSolids=q("3.1","mg")))
add("IND-FX-02-all-units", ["C7-FX-02","C7-IV-04"], "Content ug, solids g, target ng/mL together. " + cx, C(content=q("2371.9","µg"), totalSolids=q("0.0031","g"), target=q("813700","ng/mL")))
vb = dict(C(direction="volume", content=q("2.3719","mg"), totalSolids=q("3.1","mg"), volume=q("2.91","mL"), volumeBasis="diluent", reportUnit="mg/mL"))
add("IND-FX-02-v-dil-mL", ["C7-FX-02","C7-IV-04"], "Diluent 2.91 mL entered in mL; reported mg/mL.", vb)
add("IND-FX-02-v-dil-uL", ["C7-FX-02","C7-IV-04"], "The same diluent entered as 2910 uL; final displayed in uL (unit of the entered volume); concentration equals the mL entry.", C(direction="volume", content=q("2.3719","mg"), totalSolids=q("3.1","mg"), volume=q("2910","µL"), volumeBasis="diluent", reportUnit="mg/mL"))
add("IND-FX-02-v-dil-ugmL", ["C7-FX-02","C7-IV-04"], "The same diluent 2.91 mL reported in ug/mL: digits equal the mg/mL report.", C(direction="volume", content=q("2.3719","mg"), totalSolids=q("3.1","mg"), volume=q("2.91","mL"), volumeBasis="diluent", reportUnit="µg/mL"))
add("IND-FX-02-v-fin-mL", ["C7-FX-02","C7-IV-04"], "Final 2.915 mL entered in mL (volume basis final).", C(direction="volume", content=q("2.3719","mg"), totalSolids=q("3.1","mg"), volume=q("2.915","mL"), volumeBasis="final", reportUnit="mg/mL"))
add("IND-FX-02-v-fin-uL", ["C7-FX-02","C7-IV-04"], "The same final entered as 2915 uL; Vd' is rounded in uL (3 sf of the entered unit), displayed volumes in uL.", C(direction="volume", content=q("2.3719","mg"), totalSolids=q("3.1","mg"), volume=q("2915","µL"), volumeBasis="final", reportUnit="mg/mL"))
add("IND-FX-02-v-fin-ngmL", ["C7-FX-02","C7-IV-04"], "Final 2.915 mL, reported in ng/mL.", C(direction="volume", content=q("2.3719","mg"), totalSolids=q("3.1","mg"), volume=q("2.915","mL"), volumeBasis="final", reportUnit="ng/mL"))

# ---------------- FX-03 round trip (displayed-level); tolerance side is unrounded
t03 = C(content=q("6.7412","mg"), totalSolids=q("8.03","mg"), target=q("3.406","mg/mL"))
r03 = add("IND-FX-03-fwd-T", ["C7-FX-03","C7-IV-01"], "Target -> volumes; its displayed Vd' is then fed back as an entered diluent (next entry). Displayed-level check: Ca(VD) must equal Ca(T). The unrounded round trip (C7-IV-01) is outside what displayed fields can assert; tolerance is not yet derived.", t03)
add("IND-FX-03-fwd-VD", ["C7-FX-03","C7-IV-01"], "Diluent = displayed Vd' of IND-FX-03-fwd-T.", vol_from(t03, r03, "diluent"))
v03 = C(direction="volume", content=q("6.7412","mg"), totalSolids=q("8.03","mg"), volume=q("1.98","mL"), volumeBasis="diluent", reportUnit="mg/mL")
rv03 = add("IND-FX-03-rev-VD", ["C7-FX-03","C7-IV-01"], "Volume -> concentration with diluent 1.98 mL; its displayed Ca is then used as the target (next entry): the target direction must give back Vd' = 1.98.", v03)
t03b = C(content=q("6.7412","mg"), totalSolids=q("8.03","mg"), target=q(rv03["displayed"]["concentration"],"mg/mL"))
rt = add("IND-FX-03-rev-T", ["C7-FX-03","C7-IV-01"], "Target = displayed Ca of IND-FX-03-rev-VD.", t03b)
assert rt["displayed"]["diluent"] == "1.98"
# URS wording: 'target -> UNROUNDED diluent -> concentration, and the reverse'
Vd_un = r03["_vals"]["Vd"]
ru = add("IND-FX-03-fwd-unrounded", ["C7-FX-03","C7-IV-01"], "Forward leg with the UNROUNDED diluent: Vd = %s mL (full double of IND-FX-03-fwd-T) entered as the diluent; volume -> concentration must return the 3.406 mg/mL target: displayed 3.40600 (true departure ~1e-16 relative, half a quantum from a tie). The unrounded tolerance of C7-IV-01 is not yet derived." % repr(Vd_un),
    C(direction="volume", content=q("6.7412","mg"), totalSolids=q("8.03","mg"), volume=q(repr(Vd_un),"mL"), volumeBasis="diluent", reportUnit="mg/mL"))
assert ru["displayed"]["concentration"] == "3.40600"
Ca_un = rv03["_vals"]["Ca"]
rr_ = add("IND-FX-03-rev-unrounded", ["C7-FX-03","C7-IV-01"], "Reverse leg with the UNROUNDED concentration %s mg/mL (full double of IND-FX-03-rev-VD) as the target: the diluent returns 1.98 mL." % repr(Ca_un),
    C(content=q("6.7412","mg"), totalSolids=q("8.03","mg"), target=q(repr(Ca_un),"mg/mL")))
assert rr_["displayed"]["diluent"] == "1.98"

# ---------------- FX-04 total protein
t04 = C(content=q("1","mg"), contentBasis="total-vial-contents", provenance="nominal", carrier="present", totalSolids=None, target=q("1","mg/mL"))
dirs("IND-FX-04a", ["C7-FX-04","C7-FL-01"], "Antibody vial 1 mg total protein, BSA-stabilised (carrier present), nominal, target 1 mg/mL. Total-solids concentration reported; the reagent concentration is NOT COMPUTABLE (C7-DT-04) - PROTOCOL has no field for it, asserted in handDerivation only. Solids = content (total vial contents) so D = 0.001 g x 0.73.", t04, allow_close=True, note="C7-DT-04: the reported concentration is that of TOTAL SOLIDS; the reagent-alone concentration is NOT COMPUTABLE (reason 'content is the total vial contents') and must never equal the total. Not asserted in expect: PROTOCOL has no field for it.")
dirs("IND-FX-04b", ["C7-FX-04","C7-FL-01"], "Non-round total-protein vial 1.37 mg, target 0.85 mg/mL, carrier present, coa. Reagent concentration not computable.",
     C(content=q("1.37","mg"), contentBasis="total-vial-contents", carrier="present", totalSolids=None, target=q("0.85","mg/mL")), note="C7-DT-04: reagent-alone concentration not computable (not asserted; no PROTOCOL field).")

# ---------------- FX-05 high-concentration displacement
t05 = C(content=q("80","mg"), totalSolids=q("100","mg"), target=q("80","mg/mL"))
r05 = add("IND-FX-05-T", ["C7-FX-05","C7-FX-11","C7-FL-08"], "URS C7-FX-05 verbatim: F = 1.000, D = 0.0730, f = 7.30 %, Vd' = 0.927, Fa = 1.000, Ca = 80.0000. FL-08 payload (final known): 1/(1+f) = 0.93197, shortfall f/(1+f) = 6.80 %. Round numbers are the URS's own; the tie distances are recorded.", t05, allow_close=True)
add("IND-FX-05-VD", ["C7-FX-05","C7-FX-11","C7-FL-08"], "Same vial, diluent 0.927 mL entered: F = Vd + D = 1.000, f = 0.073; payload (diluent entered) 1/(1-f) = 1.07875, overstatement f/(1-f) = 7.87 % (URS text says 7.88 %; see gaps).", vol_from(t05, r05, "diluent"), allow_close=True)
add("IND-FX-05-VF", ["C7-FX-05","C7-FX-11","C7-FL-08"], "Same vial, final 1.00 mL entered (final known): shortfall 6.80 %.", vol_from(t05, r05, "final", "1.00"), allow_close=True)
add("IND-FX-05-T-finalbasis", ["C7-FX-05","C7-FX-14"], "As IND-FX-05-T with volume basis 'final' (final volume primary): displayed diluent and final unchanged.", C(content=q("80","mg"), totalSolids=q("100","mg"), target=q("80","mg/mL"), volumeBasis="final"), allow_close=True)

# ---------------- FX-06 no solids, Dmin
t06 = C(content=q("80","mg"), totalSolids=None, target=q("80","mg/mL"))
OM = ("flags",)
r06 = add("IND-FX-06-T", ["C7-FX-06","C7-FL-05","C7-FX-11"], "URS C7-FX-06: Dmin = 0.0584 mL applied; diluent 0.942 (unrounded 0.941600, 1.00e-4 mL above the tie 0.9415); at most 79.9680 mg/mL; fmin = 5.84 %. Flags [FL-05]: FL-08 is evaluated on f = D/F, defined only where D is computable; fmin above the threshold is stated inside the FL-05 payload, not as FL-08. Labelled 'at most'.", t06, allow_close=True)
add("IND-FX-06-VD1", ["C7-FX-06","C7-FL-05","C7-FX-11"], "Diluent 1.00 mL entered: F = 1.00 + 0.0584 = 1.0584, at most 75.5858 mg/mL, fmin = 0.0584/1.0584 = 5.52 %.", C(direction="volume", content=q("80","mg"), totalSolids=None, volume=q("1.00","mL"), volumeBasis="diluent", reportUnit="mg/mL"), allow_close=True)
add("IND-FX-06-VD2", ["C7-FX-06","C7-FL-05"], "Diluent 0.942 mL entered: at most 79.9680 mg/mL.", C(direction="volume", content=q("80","mg"), totalSolids=None, volume=q("0.942","mL"), volumeBasis="diluent", reportUnit="mg/mL"), allow_close=True)
add("IND-FX-06-VF", ["C7-FX-06","C7-FL-05"], "Final 1.00 mL entered, Dmin applied: Vd = 0.9416 -> 0.942; Fa = 1.0004.", C(direction="volume", content=q("80","mg"), totalSolids=None, volume=q("1.00","mL"), volumeBasis="final", reportUnit="mg/mL"), allow_close=True)
t06c = C(content=q("1.0044","mg"), totalSolids=None, target=q("1","mg/mL"))
r06c = add("IND-FX-06c-T", ["C7-FX-06","C7-FL-05"], "URS: 1.0044 mg at 1 mg/mL, diluent rounds down to 1.00, at most 1.00366 mg/mL. fmin = 0.073 % (below every threshold candidate) so flags are exactly [FL-05].", t06c, allow_close=True)
add("IND-FX-06c-VD", ["C7-FX-06","C7-FL-05"], "Diluent 1.00 mL entered, same vial.", vol_from(t06c, r06c, "diluent"), allow_close=True)
add("IND-FX-06c-VF", ["C7-FX-06","C7-FL-05"], "Final 1.0044 mL entered, same vial.", vol_from(t06c, r06c, "final", "1.0044"), allow_close=True)
# fmin above threshold but threshold configured higher: FL-05 alone is unambiguous
dirs("IND-FX-06d", ["C7-FX-06","C7-FL-05"], "The FX-06 vial with the material threshold configured at 0.1 (threshold is a configured constant, PROTOCOL), so fmin 5.84 % is below it: flags are exactly [FL-05] with no reading needed.",
     C(content=q("80","mg"), totalSolids=None, target=q("80","mg/mL"), threshold=0.1), allow_close=True)
# activity, no solids
ta = C(content=q("1e6","IU"), totalSolids=None, target=q("1e4","IU/mL"), contentBasis="reagent-alone", conjugate="none")
ra = dirs("IND-FX-06e", ["C7-FX-06","C7-FX-07","C7-FL-05"], "Activity content 1e6 IU, no solids, 1e4 IU/mL: uncorrected (no Dmin for activity), F = 100 mL, unbounded wording; label uncorrected-for-displacement; basis 'the reagent (activity)'. Values are the URS's own round numbers.", ta, allow_close=True)
dirs("IND-FX-06f", ["C7-FX-06","C7-FL-05"], "Non-round activity content 7.3e5 U, no solids, target 1.9e4 U/mL: uncorrected, FL-05 alone.",
     C(content=q("7.3e5","U"), totalSolids=None, target=q("1.9e4","U/mL")))

# ---------------- FX-07 activity
add("IND-FX-07-a-molar", ["C7-FX-07","C7-HI-04"], "Activity content with a molar target (c1 object imported): rejected, HI-04.",
    C(content=q("1e6","IU"), totalSolids=None, target=q("20","µM"), molarUnit="µM", c1={"mw":q(148.3,"kDa"),"massBasis":"assembled","flagCodes":[]}))
add("IND-FX-07-a-molar-noc1", ["C7-FX-07","C7-HI-04"], "Activity content with a molar target and no c1: rejected, HI-04.",
    C(content=q("1e6","IU"), totalSolids=None, target=q("20","µM"), molarUnit="µM"))
t07b = C(content=q("1e6","IU"), totalSolids=q("5","mg"), target=q("1e4","IU/mL"))
dirs("IND-FX-07b", ["C7-FX-07","C7-DT-03"], "URS C7-FX-07 second case: same vial with 5 mg declared total solids: D = 0.005 g x 0.73 = 0.00365 mL, treatment computed (mass is mass), f = 3.65e-5. Ca = 1e6/100.00365 = 9999.635013..., which lies 1.3e-5 IU/mL (0.13 % of the 6-sf quantum, relative 1.3e-9, ~1e7 ULP) from the tie 9999.635 - closest approach in this set apart from the boundary fixtures; the 6 mg variant IND-FX-07b6 is clear of ties.", t07b, allow_close=True)
dirs("IND-FX-07b6", ["C7-FX-07","C7-DT-03"], "As IND-FX-07b with 6 mg declared solids (D = 0.00438 mL), chosen away from ties.", C(content=q("1e6","IU"), totalSolids=q("6","mg"), target=q("1e4","IU/mL")))
dirs("IND-FX-07c", ["C7-FX-07","C7-DT-03"], "Activity U content 2.85e5 with 41.7 mg solids, target 3.3e3 U/mL: D = 0.03044; f = 0.035 (above every threshold), FL-08 raised, no FL-05.",
     C(content=q("2.85e5","U"), totalSolids=q("41.7","mg"), target=q("3.3e3","U/mL")))

# ---------------- FX-08 negative controls (no flags in either direction)
dirs("IND-FX-08a", ["C7-FX-08","C7-FX-12"], "Negative control: whole vial, reagent alone, not a conjugate, carrier absent, lot certificate, declared solids, moderate target, volumes inside bounds (no capacity declared, minimum 2 uL), f = 0.22 %.",
     C(content=q("3.2","mg"), totalSolids=q("3.9","mg"), target=q("2.5","mg/mL")))
dirs("IND-FX-08b", ["C7-FX-08","C7-FX-12"], "Negative control, larger vial with an ample declared capacity 5 mL: content 12.6 mg, solids 14.1 mg, target 4.3 mg/mL (F = 2.93 mL, f = 0.31 %).",
     C(content=q("12.6","mg"), totalSolids=q("14.1","mg"), target=q("4.3","mg/mL"), capacity=q("5","mL")))
dirs("IND-FX-08c", ["C7-FX-08","C7-FX-12"], "Negative control in ug, weighed-from-bulk provenance (no flag for 'weighed'), target in ug/mL.",
     C(content=q("640","µg"), totalSolids=q("702","µg"), target=q("310","µg/mL"), provenance="weighed"))
dirs("IND-FX-08d", ["C7-FX-08","C7-FX-12"], "Negative control, activity content with declared solids, small f: 4.4e5 IU, solids 3.1 mg, target 8.2e3 IU/mL.",
     C(content=q("4.4e5","IU"), totalSolids=q("3.1","mg"), target=q("8.2e3","IU/mL")))

# ---------------- FX-13 datasheet case: reconstitute in 1 mL
cont = q("47.3","mg"); sol = q("60.1","mg")
d13 = add("IND-FX-13a", ["C7-FX-13","C7-DT-02"], "Datasheet 'reconstitute in 1 mL': 1.00 mL entered as DILUENT, solids 60.1 mg declared. Fa = 1.00 + D (D = 0.043873): the volume-basis choice changes the concentration by exactly the displacement's effect.",
    C(direction="volume", content=cont, totalSolids=sol, volume=q("1.00","mL"), volumeBasis="diluent", reportUnit="mg/mL"))
f13 = add("IND-FX-13b", ["C7-FX-13","C7-DT-02","C7-DT-07"], "Same vial, 1.00 mL entered as FINAL volume: Vd = 1 - D = 0.956127 -> 0.956; Ca computed from Vd' (Fa = 0.999873), Fa displayed beside the entered final.",
    C(direction="volume", content=cont, totalSolids=sol, volume=q("1.00","mL"), volumeBasis="final", reportUnit="mg/mL"))
add("IND-FX-13c", ["C7-FX-13","C7-FL-05"], "Same vial, 1.00 mL DILUENT, no solids declared: Dmin = 0.047300 x 0.73 = 0.034529 applied, at most; FL-05.",
    C(direction="volume", content=cont, totalSolids=None, volume=q("1.00","mL"), volumeBasis="diluent", reportUnit="mg/mL"))
add("IND-FX-13d", ["C7-FX-13","C7-FL-05"], "Same vial, 1.00 mL FINAL, no solids declared: Vd = 1 - 0.034529 = 0.965471 -> 0.965.",
    C(direction="volume", content=cont, totalSolids=None, volume=q("1.00","mL"), volumeBasis="final", reportUnit="mg/mL"))
# low-f datasheet cases: flags unambiguous
c2 = q("2.94","mg"); s2 = q("3.6","mg")
add("IND-FX-13e", ["C7-FX-13"], "Datasheet 1 mL, low content 2.94 mg, solids 3.6 mg declared, DILUENT: f = 0.0026 (no flags).",
    C(direction="volume", content=c2, totalSolids=s2, volume=q("1.00","mL"), volumeBasis="diluent", reportUnit="mg/mL"))
add("IND-FX-13f", ["C7-FX-13"], "As 13e with 1.00 mL as FINAL.",
    C(direction="volume", content=c2, totalSolids=s2, volume=q("1.00","mL"), volumeBasis="final", reportUnit="mg/mL"))
add("IND-FX-13g", ["C7-FX-13","C7-FL-05"], "As 13e without solids (Dmin = 0.002146 applied; fmin 0.21 %): flags [FL-05], at most.",
    C(direction="volume", content=c2, totalSolids=None, volume=q("1.00","mL"), volumeBasis="diluent", reportUnit="mg/mL"))
add("IND-FX-13h", ["C7-FX-13","C7-FL-05"], "As 13e without solids, 1.00 mL FINAL.",
    C(direction="volume", content=c2, totalSolids=None, volume=q("1.00","mL"), volumeBasis="final", reportUnit="mg/mL"))

# ---------------- FX-14 rounding direction
t14 = C(content=q("401.6","mg"), totalSolids=q("450","mg"), target=q("40","mg/mL"), volumeBasis="final")
r14 = dirs("IND-FX-14a", ["C7-FX-14","C7-IV-03","C7-FL-08"], "Final volume primary. F = 401.6/40 = 10.04 mL; D = 0.3285. Rounding F first to 3 sf (10.0) and deriving the diluent from it would give 10.0 - 0.3285 = 9.6715 -> 9.67, four display steps (0.01) from the correct Vd = 9.7115 -> 9.71. Fa = 9.71 + 0.3285 = 10.0385 -> 10.0; Ca = 401.6/10.0385 from the single Fa, not from the displayed final. Additivity: |9.71 + 0.329 - 10.0| = 0.039 <= 0.1.", t14, ftxt_n=4)
assert r14["displayed"]["diluent"] == "9.71"
dirs("IND-FX-14b", ["C7-FX-14","C7-IV-03"], "Second construction, final primary: F = 350.7/35 = 10.02 mL, D = 0.584 mL. Rounding F first (10.0) then subtracting D gives 9.416 -> 9.42; the correct Vd = 9.436 -> 9.44 (two display steps apart). Fa = 9.44 + 0.584 = 10.024 -> 10.0. FL-08 raised (f = 5.83 %).",
     C(content=q("350.7","mg"), totalSolids=q("800","mg"), target=q("35","mg/mL"), volumeBasis="final"))
add("IND-FX-14c", ["C7-FX-14","C7-IV-03"], "Volume direction, final 10.04 mL entered (volume basis final) for the FX-14a vial: Vd rounded from its own value = 9.71, Fa = 10.0385 beside the entered 10.04.",
    C(direction="volume", content=q("401.6","mg"), totalSolids=q("450","mg"), volume=q("10.04","mL"), volumeBasis="final", reportUnit="mg/mL"))
add("IND-FX-14d", ["C7-FX-14","C7-IV-03"], "Rounding direction in uL: final 10040 uL entered; Vd' is rounded in the entered unit: 9710 uL.",
    C(direction="volume", content=q("401.6","mg"), totalSolids=q("450","mg"), volume=q("10040","µL"), volumeBasis="final", reportUnit="mg/mL"))

# ---------------- FX-15 U vs IU
add("IND-FX-15a-T", ["C7-FX-15","C7-HI-09"], "Content in U, target in IU/mL.", C(content=q("1e5","U"), totalSolids=None, target=q("2e3","IU/mL")))
add("IND-FX-15b-T", ["C7-FX-15","C7-HI-09"], "Content in IU, target in U/mL.", C(content=q("1e5","IU"), totalSolids=None, target=q("2e3","U/mL")))
add("IND-FX-15a-V", ["C7-FX-15","C7-HI-09"], "Volume direction: content in U, concentration reported in IU/mL.", C(direction="volume", content=q("1e5","U"), totalSolids=None, volume=q("5","mL"), volumeBasis="diluent", reportUnit="IU/mL"))
add("IND-FX-15b-V", ["C7-FX-15","C7-HI-09"], "Volume direction: content in IU, reported in U/mL, final volume basis.", C(direction="volume", content=q("1e5","IU"), totalSolids=None, volume=q("5","mL"), volumeBasis="final", reportUnit="U/mL"))
add("IND-FX-15c-T", ["C7-FX-15","C7-HI-09"], "HI-09 with solids declared and D >= F: HI-08 is not evaluated when another rejection applies (PROTOCOL 8); only HI-09.", C(content=q("1e5","IU"), totalSolids=q("50","g"), target=q("2e3","U/mL")))

# ---------------- FX-16 carrier
dirs("IND-FX-16a", ["C7-FX-16","C7-FL-11"], "Carrier present, solids declared (BSA counted in the 12.4 mg): FL-11, displacement computed; content 6.3 mg reagent alone, target 1.7 mg/mL; f = 0.24 %.",
     C(content=q("6.3","mg"), totalSolids=q("12.4","mg"), target=q("1.7","mg/mL"), carrier="present"))
dirs("IND-FX-16b", ["C7-FX-16","C7-FL-11","C7-FL-05"], "Carrier present, solids not declared: FL-11 with FL-05 (Dmin applied, at most); low target so fmin < threshold.",
     C(content=q("6.3","mg"), totalSolids=None, target=q("1.7","mg/mL"), carrier="present"))
dirs("IND-FX-16c", ["C7-FX-16","C7-FL-12"], "Carrier not recorded (solids declared): FL-12.",
     C(content=q("6.3","mg"), totalSolids=q("7.4","mg"), target=q("1.7","mg/mL"), carrier="not-recorded"))
dirs("IND-FX-16d", ["C7-FX-16","C7-FL-11","C7-FL-05"], "Carrier present, activity content, solids not declared: FL-05 (uncorrected) and FL-11.",
     C(content=q("3.1e5","IU"), totalSolids=None, target=q("7.7e3","IU/mL"), carrier="present"))
dirs("IND-FX-16e", ["C7-FX-16","C7-FL-12","C7-FL-05"], "Carrier not recorded, solids not declared: FL-05 and FL-12.",
     C(content=q("6.3","mg"), totalSolids=None, target=q("1.7","mg/mL"), carrier="not-recorded"))

# ---------------- FX-17
t17 = C(content=q("1.0054","mg"), totalSolids=q("1.2","mg"), target=q("1","mg/mL"))
r17 = add("IND-FX-17-T", ["C7-FX-17","C7-FX-12","C7-DT-07"], "URS C7-FX-17 verbatim. Diluent leading digit 1 (coarsest 3-sf resolution); unrounded Vd = 1.004524, nearest 3-sf tie 1.005 is 4.76e-4 mL away. Ca = 1.0054/(1.00 + 1.2e-3 x 0.73) = 1.00452 beside target 1.00000: departure +0.452 %. No flags.", t17)
add("IND-FX-17-VD", ["C7-FX-17"], "Diluent 1.00 mL entered (displayed diluent of the target case): Ca 'obtained' = 1.00452.", vol_from(t17, r17, "diluent"))
add("IND-FX-17-VF", ["C7-FX-17"], "Final 1.0054 mL entered: Vd rounds to 1.00, Fa = 1.000876, Ca = 1.00452 (not the 1.00000 that content/final would give).", vol_from(t17, r17, "final", "1.0054"))

# ======================= FLAG MATRIX (every §8 flag, both directions) =======================
dirs("IND-FL-01", ["C7-FL-01","C7-DT-04"], "FL-01 alone: content basis 'total vial contents' (solids = content, D computed), low f. Reagent concentration not computable (handDerivation only).",
     C(content=q("2.4","mg"), contentBasis="total-vial-contents", totalSolids=None, target=q("1.2","mg/mL")))
dirs("IND-FL-02", ["C7-FL-02","C7-FL-05"], "FL-02: basis not recorded, no solids: no correction, uncorrected label, FL-05 as well.",
     C(content=q("2.6","mg"), contentBasis="not-recorded", totalSolids=None, target=q("1.3","mg/mL")))
dirs("IND-FL-03", ["C7-FL-03"], "FL-03 alone: nominal (vial label) provenance.", C(provenance="nominal"))
dirs("IND-FL-04", ["C7-FL-04"], "FL-04 alone: provenance not recorded.", C(provenance="not-recorded"))
dirs("IND-FL-05a", ["C7-FL-05"], "FL-05 alone, mass reagent-alone, no solids: Dmin applied, at most; fmin = 0.0011 x 0.73/... low so below every threshold.",
     C(content=q("2.6","mg"), totalSolids=None, target=q("1.1","mg/mL")))
dirs("IND-FL-05b", ["C7-FL-05"], "FL-05 alone, activity content no solids: uncorrected.", C(content=q("5.2e4","IU"), totalSolids=None, target=q("610","IU/mL")), ftxt_n=5)
dirs("IND-FL-06a", ["C7-FL-06"], "FL-06 raised: Fa about 3.71 mL exceeds the declared 3 mL capacity (content 6.3 mg, target 1.7 mg/mL, solids 7.4 mg).",
     C(content=q("6.3","mg"), totalSolids=q("7.4","mg"), target=q("1.7","mg/mL"), capacity=q("3","mL")))
dirs("IND-FL-06b", ["C7-FL-06"], "FL-06 not raised: capacity 10 mL is ample (negative control for the flag).",
     C(content=q("6.3","mg"), totalSolids=q("7.4","mg"), target=q("1.7","mg/mL"), capacity=q("10","mL")))
dirs("IND-FL-06c", ["C7-FL-06","C7-FL-05"], "FL-06 with Dmin applied (check may understate the true final; flag text differs, code the same).",
     C(content=q("6.3","mg"), totalSolids=None, target=q("1.7","mg/mL"), capacity=q("3","mL")))
dirs("IND-FL-06d", ["C7-FL-06","C7-FL-05"], "FL-06 with no correction (activity, uncorrected).",
     C(content=q("5.2e4","IU"), totalSolids=None, target=q("610","IU/mL"), capacity=q("50","mL")), ftxt_n=5)
dirs("IND-FL-07", ["C7-FL-07"], "FL-07: content 0.0047 mg at 2.5 mg/mL gives Vd' = 0.00188 mL = 1.88 uL < 2 uL.",
     C(content=q("0.0047","mg"), totalSolids=q("0.0057","mg"), target=q("2.5","mg/mL")), ftxt_n=3)
dirs("IND-FL-08a", ["C7-FL-08","C7-FX-11"], "FL-08 alone: content 20.7 mg, solids 26.1 mg, target 18.3 mg/mL: F = 1.1311, D = 0.019053, f = 1.68 % (> every threshold candidate).",
     C(content=q("20.7","mg"), totalSolids=q("26.1","mg"), target=q("18.3","mg/mL")))
dirs("IND-FL-13a", ["C7-FL-13"], "FL-13: conjugate, mass of the protein alone.", C(conjugate="protein"))
dirs("IND-FL-13b", ["C7-FL-13"], "FL-13: conjugate, mass of the conjugate.", C(conjugate="conjugate"))
dirs("IND-FL-14", ["C7-FL-14"], "FL-14: conjugate state not recorded.", C(conjugate="not-recorded"))
dirs("IND-FL-all", ["C7-FL-01","C7-FL-03","C7-FL-06","C7-FL-08","C7-FL-11","C7-FL-14"], "Many flags together (FL-01, 03, 06, 08, 11, 14), total-vial content 160 mg, nominal, carrier present, conjugate not recorded, capacity 0.3 mL, target 60 mg/mL: F = 2.667 mL; Fa > capacity; f = 4.38 %.",
     C(content=q("160","mg"), contentBasis="total-vial-contents", totalSolids=None, provenance="nominal", carrier="present", conjugate="not-recorded", target=q("60","mg/mL"), capacity=q("0.3","mL")))
dirs("IND-FL-all2", ["C7-FL-02","C7-FL-04","C7-FL-05","C7-FL-07","C7-FL-12","C7-FL-14"], "Nothing recorded: basis, provenance, carrier, conjugate all 'not recorded', no solids, tiny volume.",
     C(content=q("0.0043","mg"), contentBasis="not-recorded", totalSolids=None, provenance="not-recorded", carrier="not-recorded", conjugate="not-recorded", target=q("2.5","mg/mL")), ftxt_n=3)

# ======================= REJECTIONS (§7) =======================
def rej(id, covers, constr, **k):
    return add(id, covers, constr, C(**k))
rej("IND-HI-01a-T", ["C7-HI-01"], "Content 0 (target direction).", content=q("0","mg"))
rej("IND-HI-01b-T", ["C7-HI-01"], "Content negative.", content=q("-1.5","mg"))
rej("IND-HI-01c-V", ["C7-HI-01"], "Content 0, volume direction.", direction="volume", content=q("0","mg"), volume=q("1","mL"), reportUnit="mg/mL")
rej("IND-HI-01d-V", ["C7-HI-01"], "Negative activity content, volume direction, final basis.", direction="volume", content=q("-3","IU"), totalSolids=None, volume=q("1","mL"), volumeBasis="final", reportUnit="IU/mL")
rej("IND-HI-02a-T", ["C7-HI-02"], "Target 0.", target=q("0","mg/mL"))
rej("IND-HI-02b-T", ["C7-HI-02"], "Target negative.", target=q("-2","mg/mL"))
rej("IND-HI-02c-V", ["C7-HI-02"], "Entered diluent volume 0.", direction="volume", volume=q("0","mL"), reportUnit="mg/mL")
rej("IND-HI-02d-V", ["C7-HI-02"], "Entered final volume negative.", direction="volume", volume=q("-1","mL"), volumeBasis="final", reportUnit="mg/mL")
rej("IND-HI-01-02-T", ["C7-HI-01","C7-HI-02"], "Two rejections at once, reported in table order (PROTOCOL 8).", content=q("0","mg"), target=q("0","mg/mL"))
rej("IND-HI-03a-T", ["C7-HI-03"], "Mass content, activity target.", target=q("100","IU/mL"))
rej("IND-HI-03b-T", ["C7-HI-03"], "Activity content, mass target.", content=q("1e5","IU"), totalSolids=None, target=q("2","mg/mL"))
rej("IND-HI-04a-T", ["C7-HI-04"], "Molar target, no imported C1 object.", target=q("20","µM"), molarUnit="µM")
rej("IND-HI-04b-T", ["C7-HI-04"], "Molar target, activity content, C1 object present.", content=q("1e5","IU"), totalSolids=None, target=q("20","µM"), molarUnit="µM", c1={"mw":q(148.3,"kDa"),"massBasis":"assembled","flagCodes":[]})
rej("IND-HI-06a-T", ["C7-HI-06"], "Minimum transfer volume 0.", minTransfer=q("0","µL"))
rej("IND-HI-06b-V", ["C7-HI-06"], "Minimum transfer volume negative, volume direction.", direction="volume", volume=q("1","mL"), reportUnit="mg/mL", minTransfer=q("-2","µL"))
rej("IND-HI-07a-T", ["C7-HI-07"], "Solids 2.9 mg below reagent 3.2 mg.", totalSolids=q("2.9","mg"))
rej("IND-HI-07b-T", ["C7-HI-07"], "Solids 0.0031 g below reagent 3.2 mg (unit mismatch).", totalSolids=q("0.0031","g"))
rej("IND-HI-07c-V", ["C7-HI-07"], "Solids below reagent, volume direction, diluent entered.", direction="volume", totalSolids=q("2900","µg"), volume=q("1","mL"), reportUnit="mg/mL")
rej("IND-HI-07d-T", ["C7-HI-07"], "HI-07 and would-be HI-08 (D >= F): only HI-07, HI-08 not evaluated (PROTOCOL 8). Content 1000 mg, solids 900 mg, target 2000 mg/mL: F = 0.5, D = 0.657.", content=q("1000","mg"), totalSolids=q("900","mg"), target=q("2000","mg/mL"))
add("IND-HI-07e-T", ["C7-HI-07"], "Control: solids exactly equal to the reagent (3.2 mg = 3.2 mg) is not rejected ('less than' is strict).", C(totalSolids=q("3.2","mg")))
rej("IND-HI-07f-T", ["C7-HI-07"], "Mixed units: solids 0.0031 g (3.1 mg) below content 3200 ug (3.2 mg) -> rejected.", content=q("3200","µg"), totalSolids=q("0.0031","g"))
# HI-08 (target direction, clear margins)
add("IND-HI-08a-T", ["C7-HI-08"], "Total-vial content 5 g at 1400 mg/mL: total-solids concentration above 1/v = 1369.86 mg/mL: F = 3.571, D = 3.65 -> reject.", C(content=q("5","g"), contentBasis="total-vial-contents", totalSolids=None, target=q("1400","mg/mL")))
r = add("IND-HI-08b-T", ["C7-HI-08","C7-FL-08"], "Same at 1300 mg/mL: F = 3.846 > D = 3.65: computed (Vd = 0.196), f = 94.9 %.", C(content=q("5","g"), contentBasis="total-vial-contents", totalSolids=None, target=q("1300","mg/mL")))
add("IND-HI-08c-T", ["C7-HI-08"], "Declared solids 5 g (reagent 2 g) at 1500 mg/mL: F = 1.333, D = 3.65 -> reject.", C(content=q("2","g"), totalSolids=q("5","g"), target=q("1500","mg/mL")))
add("IND-HI-08d-T", ["C7-HI-08"], "Dmin form: reagent 5 g, no solids, target 1400 mg/mL: Dmin = 3.65 >= F = 3.571 -> reject.", C(content=q("5","g"), totalSolids=None, target=q("1400","mg/mL")))
add("IND-HI-08e-T", ["C7-HI-08","C7-FL-05"], "Dmin form just inside: 1300 mg/mL, Dmin 3.65 < F 3.846: computed, at most.", C(content=q("5","g"), totalSolids=None, target=q("1300","mg/mL")))
add("IND-HI-08f-V", ["C7-HI-08"], "Final entered 0.05 mL, solids 100 mg (D = 0.073 >= 0.05).", C(direction="volume", totalSolids=q("100","mg"), content=q("80","mg"), volume=q("0.05","mL"), volumeBasis="final", reportUnit="mg/mL"))
add("IND-HI-08g-V", ["C7-HI-08"], "Final entered 0.05 mL, no solids: Dmin = 80 mg x 0.73 = 0.0584 >= 0.05.", C(direction="volume", totalSolids=None, content=q("80","mg"), volume=q("0.05","mL"), volumeBasis="final", reportUnit="mg/mL"))
add("IND-HI-08h-V", ["C7-HI-08"], "Diluent entered: HI-08 cannot fire (F = entered + D > D). Solids 100 mg with 0.01 mL diluent computes: F = 0.083, f = 87.6 %.", C(direction="volume", totalSolids=q("100","mg"), content=q("80","mg"), volume=q("0.01","mL"), volumeBasis="diluent", reportUnit="mg/mL"))
add("IND-HI-08i-T", ["C7-HI-08"], "Activity, no solids: neither D nor Dmin is defined, so HI-08 does not fire at any target: 1e6 IU at 1e9 IU/mL gives F = 0.001 mL (FL-05, FL-07).", C(content=q("1e6","IU"), totalSolids=None, target=q("1e9","IU/mL")))
add("IND-HI-08j-T", ["C7-HI-08"], "Content basis not recorded, no solids: Dmin undefined; no HI-08 at 2000 mg/mL: F = 0.002 mL.", C(content=q("4","mg"), contentBasis="not-recorded", totalSolids=None, target=q("2000","mg/mL")))

# ======================= FX-09 pairing table =======================
def c1o(basis, codes, mw=None):
    return {"mw": mw or q(148.3, "kDa"), "massBasis": basis, "flagCodes": codes}
ROWS = [
 ("1",  "row 1 (total vial contents): molar not permitted", dict(contentBasis="total-vial-contents", totalSolids=None), c1o("assembled", [])),
 ("1b", "row 1 wins over the C1-side rows (total contents with C1 basis not recorded and conjugate not recorded)", dict(contentBasis="total-vial-contents", totalSolids=None, conjugate="not-recorded"), c1o("not-recorded", ["C1-FL-07"])),
 ("2",  "row 2 (content basis not recorded)", dict(contentBasis="not-recorded", totalSolids=None), c1o("assembled", [])),
 ("2b", "row 2 wins over row 4 (basis not recorded, conjugate not recorded)", dict(contentBasis="not-recorded", totalSolids=None, conjugate="not-recorded"), c1o("assembled", [])),
 ("3",  "row 3 (activity content)", dict(content=q("1e6","IU"), totalSolids=None), c1o("assembled", [])),
 ("3b", "row 3 wins over row 1 (activity content, basis field 'total-vial-contents' is ignored for IU)", dict(content=q("1e6","IU"), contentBasis="total-vial-contents", totalSolids=None), c1o("monomer", ["C1-FL-06"])),
 ("4",  "row 4 (conjugate state not recorded)", dict(conjugate="not-recorded"), c1o("assembled", [])),
 ("4b", "row 4 wins over row 6 (monomer MW, conjugate not recorded)", dict(conjugate="not-recorded"), c1o("monomer", ["C1-FL-06"])),
 ("5",  "row 5 (C1 mass basis not recorded)", dict(), c1o("not-recorded", ["C1-FL-07"])),
 ("6",  "row 6 (monomer or single chain)", dict(), c1o("monomer", ["C1-FL-06"])),
 ("7",  "row 7 PERMITTED: assembled molecule, reagent alone, not a conjugate; clean C1 object (flagCodes empty)", dict(), c1o("assembled", [])),
 ("7b", "row 7 PERMITTED with an imported C1 flag: FL-10 restated", dict(), c1o("assembled", ["C1-FL-02"], q(148300, "g/mol"))),
 ("8",  "row 8 PERMITTED: assembled MW, conjugate with the mass of the PROTEIN: molarity of the protein", dict(conjugate="protein"), c1o("assembled", [])),
 ("9",  "row 9 PERMITTED: conjugate MW, conjugate with the mass of the conjugate: molarity of the conjugate; C1 conjugate flag carried (FL-10)", dict(conjugate="conjugate"), c1o("conjugate", ["C1-FL-08"], q(198.6, "kDa"))),
 ("10a","row 10 (conjugate MW, stated mass not a conjugate)", dict(), c1o("conjugate", ["C1-FL-08"], q(198.6, "kDa"))),
 ("10b","row 10 (conjugate MW, stated mass is the protein of a conjugate)", dict(conjugate="protein"), c1o("conjugate", ["C1-FL-08"], q(198.6, "kDa"))),
 ("11", "row 11 (assembled MW, stated mass is the conjugate)", dict(conjugate="conjugate"), c1o("assembled", [])),
]
EXPROW = {"1":1,"1b":1,"2":2,"2b":2,"3":3,"3b":3,"4":4,"4b":4,"5":5,"6":6,"7":7,"7b":7,"8":8,"9":9,"10a":10,"10b":10,"11":11}
for key, desc, over, c1 in ROWS:
    row = EXPROW[key]
    isact = over.get("content", q("", "mg"))["unit"] in ("IU", "U")
    # molar target
    mc = C(target=q("20","µM"), molarUnit="µM", c1=c1, **over)
    pref = "IND-FX-09-r%s" % key
    if isact:
        add(pref + "-molar", ["C7-FX-09","C7-HI-04","C7-TG-03"], desc + " - as a MOLAR target (activity content): rejected HI-04.", mc)
    else:
        rm = add(pref + "-molar", ["C7-FX-09","C7-TG-03","C7-HI-04"], desc + " - as a MOLAR target (20 uM, MW %s %s -> mass-concentration equivalent in mg/mL): %s." % (c1["mw"]["value"], c1["mw"]["unit"], "accepted, carries the C1 object's basis and flags" if row in (7,8,9) else "rejected HI-04"), mc)
        if rm["status"] == "result":
            add(pref + "-molar-VD", ["C7-FX-09","C7-DT-06"], desc + " - molar-target result re-entered as a diluent volume (volume -> concentration), molar form reported.", vol_from(mc, rm, "diluent"))
    # mass target with c1
    tmass = q("2.5","IU/mL") if isact else q("2.5","mg/mL")
    if isact: tmass = q("1e4","IU/mL")
    mt = C(target=tmass, c1=c1, molarUnit="µM", **over)
    rmt = add(pref + "-mass", ["C7-FX-09","C7-DT-06","C7-FL-09","C7-FL-10"], desc + " - as a MASS target with the C1 object: molar form %s (row %d)." % ("reported" if row in (7,8,9) else "withheld with the row's reason", row), mt)
    add(pref + "-mass-VD", ["C7-FX-09","C7-DT-06","C7-FL-09"], desc + " - mass result, volume -> concentration (diluent entered).", vol_from(mt, rmt, "diluent"))
    add(pref + "-mass-VF", ["C7-FX-09","C7-DT-06","C7-FL-09"], desc + " - mass result, volume -> concentration (final entered).", vol_from(mt, rmt, "final", ftext_of(rmt, 4)))
# molar target with no c1 at all is in IND-HI-04a-T.  IV-05: mass and molar route agree.
tm = C(target=q("20","µM"), molarUnit="µM", c1=c1o("assembled", [], q(148.3,"kDa")))
add("IND-FX-09-iv05-mass", ["C7-FX-09","C7-IV-05"], "IV-05 pair, mass side: 148.3 kDa x 20 uM = 2.966 mg/mL as a mass target (mass equivalent of the next entry).", C(target=q("2.966","mg/mL"), c1=c1o("assembled", [], q(148.3,"kDa")), molarUnit="µM"))
add("IND-FX-09-iv05-molar", ["C7-FX-09","C7-IV-05"], "IV-05 pair, molar side: 20 uM x 148.3 kDa = 2.966 mg/mL; displayed values equal the previous entry; unrounded agreement is within the (undecided) tolerance.", tm)
add("IND-FX-09-molar-nM-gmol", ["C7-FX-09","C7-TG-03"], "Molar target in nM with MW in g/mol (row 7): 15000 nM x 148300 g/mol = 2.2245 mg/mL.", C(target=q("15000","nM"), molarUnit="nM", c1=c1o("assembled", [], q(148300,"g/mol"))))
add("IND-FX-09-molar-mM", ["C7-FX-09","C7-TG-03"], "Molar target in mM (row 8): 0.0117 mM x 148.3 kDa = 1.7351 mg/mL.", C(target=q("0.0117","mM"), molarUnit="mM", conjugate="protein", c1=c1o("assembled", [])))

# ======================= FX-10 boundaries =======================
BD = dict(boundary=True, allow_close=True)
def bd_note(): return " Boundary fixture: assumed chain (PROTOCOL convention 2): solids entered in g go straight into x 0.73 with no mg round-trip, volumes in mL and capacity in mL are parsed directly as doubles; a disagreement on an 'on' entry is therefore a conversion-order finding. Expected flags follow the operator as written; the exact-decimal cross-check is not applied."
# (a) minimum transfer volume, against Vd' (decimal)
for label, mn, dv in [("below","2","0.00199"),("on","2","0.00200"),("above","2","0.00201")]:
    add("IND-FX-10a-VD-%s" % label, ["C7-FX-10","C7-FL-07"], "Diluent entered %s mL against min 2 uL (%s): FL-07 iff strictly below. Vd' is compared as a decimal, exactly, in uL." % (dv, label),
        C(direction="volume", content=q("1","IU"), totalSolids=None, contentBasis="reagent-alone", volume=q(dv,"mL"), volumeBasis="diluent", reportUnit="IU/mL"), allow_close=True)
for label, dv in [("below","1.99"),("on","2.00"),("above","2.01")]:
    add("IND-FX-10a-VDuL-%s" % label, ["C7-FX-10","C7-FL-07"], "Diluent entered %s uL against min 2 uL (%s)." % (dv, label),
        C(direction="volume", content=q("1","IU"), totalSolids=None, volume=q(dv,"µL"), volumeBasis="diluent", reportUnit="IU/mL"), allow_close=True)
for label, tg in [("below","502"),("unrounded-below-displayed-on","501"),("on","500"),("above","498")]:
    add("IND-FX-10a-T-%s" % label, ["C7-FX-10","C7-FL-07"], "Target direction: 1 IU at %s IU/mL: F = %.9g mL; Vd' displayed 3 sf. FL-07 is decided on the displayed Vd' (%s)%s." % (tg, 1/float(tg), label, " - unrounded 1.996 uL is below 2 uL but the displayed Vd' 0.00200 mL equals it, so no flag" if tg=="501" else ""),
        C(content=q("1","IU"), totalSolids=None, target=q(tg,"IU/mL")), allow_close=True)
add("IND-FX-10a-T-min25-on", ["C7-FX-10","C7-FL-07"], "Non-default minimum 2.5 uL with diluent 0.0025 mL entered: on the boundary, no flag.", C(direction="volume", content=q("1","IU"), totalSolids=None, volume=q("0.0025","mL"), volumeBasis="diluent", reportUnit="IU/mL", minTransfer=q("2.5","µL")), allow_close=True)
add("IND-FX-10a-T-min25-below", ["C7-FX-10","C7-FL-07"], "Minimum 2.5 uL, diluent 0.00249 mL: below.", C(direction="volume", content=q("1","IU"), totalSolids=None, volume=q("0.00249","mL"), volumeBasis="diluent", reportUnit="IU/mL", minTransfer=q("2.5","µL")), allow_close=True)
add("IND-FX-10a-T-min25-above", ["C7-FX-10","C7-FL-07"], "Minimum 2.5 uL, diluent 0.00251 mL: above.", C(direction="volume", content=q("1","IU"), totalSolids=None, volume=q("0.00251","mL"), volumeBasis="diluent", reportUnit="IU/mL", minTransfer=q("2.5","µL")), allow_close=True)

# (b) capacity vs Fa (nextafter of the modelled double Fa; capacity text = shortest repr of the double)
def cap_triple(tag, base, chain):
    r0 = solve(base, float)
    Fa = r0["_vals"]["Fa"]
    for label, val in [("below", math.nextafter(Fa, -math.inf)), ("on", Fa), ("above", math.nextafter(Fa, math.inf))]:
        cc = dict(base); cc["capacity"] = q(repr(val), "mL")
        cc = {k: v for k, v in cc.items() if k != "id"}
        exp_flag = label == "below"
        rr = solve(C(**cc), float)
        assert (("C7-FL-06" in rr["flags"]) == exp_flag), (tag, label, rr["flags"])
        add("IND-FX-10b-%s-%s" % (tag, label), ["C7-FX-10","C7-FL-06"], "Capacity %s mL = %s the double Fa = %s. Evaluated form: Fa > capacity (strict): FL-06 %s. Chain (doubles): %s.%s" % (repr(val), label, repr(Fa), "raised" if exp_flag else "not raised", chain, bd_note()), C(**cc), **BD)
cap_triple("VD", C(direction="volume", content=q("400","mg"), totalSolids=q("0.5","g"), volume=q("1.00","mL"), volumeBasis="diluent", reportUnit="mg/mL", threshold=0.5),
           "Vd' = 1.00 as typed; D = 0.5 g x 0.73 (exact half of double 0.73); Fa = fl(1.0 + D)")
cap_triple("T", C(content=q("400","mg"), totalSolids=q("0.5","g"), target=q("79","mg/mL"), threshold=0.5),
           "F = 400/79; D = 0.5 x 0.73; Vd = F - D rounded to 3 sf (4.70) parsed as a double; Fa = fl(4.70 + D)")
cap_triple("Dmin", C(direction="volume", content=q("500","mg"), totalSolids=None, volume=q("1.00","mL"), volumeBasis="diluent", reportUnit="mg/mL", threshold=0.5),
           "Dmin = 0.5 g x 0.73; Fa = fl(1.00 + Dmin)")
cap_triple("VF", C(direction="volume", content=q("400","mg"), totalSolids=q("0.45","g"), volume=q("2.00","mL"), volumeBasis="final", reportUnit="mg/mL", threshold=0.5),
           "F = 2.00; D = fl(0.45 x 0.73); Vd = F - D -> 1.67 (3 sf); Fa = fl(1.67 + D)")

# (c) HI-08: D >= F / Dmin >= F, final volume entered, exactly on and either side
def hi08_triple(tag, base, what):
    F0 = 1.0 * 0.73
    for label, val, rejected in [("below", math.nextafter(F0, -math.inf), True), ("on", F0, True), ("above", math.nextafter(F0, math.inf), False)]:
        cc = dict(base); cc["volume"] = q(repr(val), "mL")
        cc = {k: v for k, v in cc.items() if k != "id"}
        rr = solve(C(**cc), float)
        assert (rr["status"] == "rejected") == rejected, (tag, label, rr)
        om = ("displayed.diluent",) if not rejected else ()
        add("IND-FX-10c-%s-%s" % (tag, label), ["C7-FX-10","C7-HI-08"], "Final volume entered %s mL (%s the double 0.73). %s = 1 g x 0.73 = the double 0.73 exactly. Evaluated form: %s >= F: %s." % (repr(val), label, what, what, "rejected HI-08" if rejected else "computed, Vd = 2^-53 = 1.11e-16 mL, f ~ 1 (displayed diluent omitted: a 1e-16 mL figure is outside what the URS/PROTOCOL fix)"), C(**cc), omit=om, **BD)
hi08_triple("D", C(direction="volume", content=q("400","mg"), totalSolids=q("1","g"), volumeBasis="final", reportUnit="mg/mL"), "D")
hi08_triple("Dmin", C(direction="volume", content=q("1","g"), totalSolids=None, volumeBasis="final", reportUnit="mg/mL"), "Dmin")
# target direction: T doubles either side of 1000/0.73; on-boundary omitted (the double F=1000/T depends on the order of the unit conversions)
t0 = 1000 / 0.73
Tlo = math.nextafter(t0, -math.inf); Thi = math.nextafter(t0, math.inf)
for tag, base, what in [("D", dict(content=q("1","g"), contentBasis="total-vial-contents", totalSolids=None), "D (total-vial content = solids = 1 g)"),
                        ("Dmin", dict(content=q("1","g"), contentBasis="reagent-alone", totalSolids=None), "Dmin (reagent alone 1 g, no solids)")]:
    for label, T, rejected in [("below", Tlo, False), ("above", Thi, True)]:
        rr = solve(C(target=q(repr(T),"mg/mL"), **base), float)
        assert (rr["status"] == "rejected") == rejected, (tag, label)
        add("IND-FX-10c-T%s-%s" % (tag, label), ["C7-FX-10","C7-HI-08"], "Target %s mg/mL, the double %s of 1000/0.73 = %s. %s: F = 1000 mg / T vs 0.73; %s. (The exact-on case is not fixed: fl(1000/T) equals 0.73 only under some conversion orders, so it is left out.)%s" % (repr(T), label, repr(t0), what, "D >= F rejected" if rejected else "D < F computed, Vd = F - D ~ 1e-16 mL", bd_note()), C(target=q(repr(T),"mg/mL"), **base), omit=(() if rejected else ("displayed",)), **BD)

# (d) FL-08 threshold: f = D/F against the configured threshold; f = fl(s x 0.73) with F = 1.000
v = 0.73
s0 = 0.006 / v
sm = math.nextafter(s0, -math.inf); sp = math.nextafter(s0, math.inf)
assert s0 * v == 0.006 and sm * v < 0.006 and sp * v > 0.006
for label, s, want in [("below", sm, False), ("on", s0, False), ("above", sp, True)]:
    for tag, case in [("T", C(content=q("5","mg"), totalSolids=q(repr(s),"g"), target=q("5","mg/mL"))),
                      ("VF", C(direction="volume", content=q("5","mg"), totalSolids=q(repr(s),"g"), volume=q("1","mL"), volumeBasis="final", reportUnit="mg/mL"))]:
        rr = solve(case, float)
        assert (("C7-FL-08" in rr["flags"]) == want), (label, tag, rr["flags"], rr["_vals"]["f"])
        add("IND-FX-10d-%s-%s" % (tag, label), ["C7-FX-10","C7-FL-08"], "Threshold 0.006. Solids %s g so D = fl(%s x 0.73) = %s, F = 1.0 exactly (5 mg / 5 mg/mL, or 1 mL final entered): f = D/F = %s is %s the double 0.006. Evaluated form: f > threshold, strict: FL-08 %s.%s" % (repr(s), repr(s), repr(s*v), repr(s*v), {"below":"below","on":"equal to","above":"above"}[label], "raised" if want else "not raised", bd_note()), case, **BD)
# threshold varied around a computed f (diluent entered: F = 1.00 + D)
Dd = 0.0082 * v
F_ = 1.0 + Dd
fd = Dd / F_
for label, thr, want in [("below", math.nextafter(fd, math.inf), False), ("on", fd, False), ("above", math.nextafter(fd, -math.inf), True)]:
    case = C(direction="volume", content=q("5","mg"), totalSolids=q("0.0082","g"), volume=q("1.00","mL"), volumeBasis="diluent", reportUnit="mg/mL", threshold=thr)
    rr = solve(case, float)
    assert (("C7-FL-08" in rr["flags"]) == want), (label, rr["flags"])
    add("IND-FX-10d-VD-thr-%s" % label, ["C7-FX-10","C7-FL-08"], "Diluent entered 1.00 mL, solids 0.0082 g: F = fl(1.00 + D), f = fl(D/F) = %s. Threshold configured as the double %s (%s f): FL-08 %s (strict >).%s" % (repr(fd), repr(thr), {"below":"one ULP above","on":"equal to","above":"one ULP below"}[label], "raised" if want else "not raised", bd_note()), case, **BD)

# ================= Decision 2026-09-28 (directed rounding of bounds): fixtures that test the direction =================
DEC = "spec/decision-2026-09-28-directed-rounding.md"
def vdirect(id, covers, constr, content, vol, unit="mL", rep="mg/mL", cunit="mg"):
    return add(id, covers, constr, C(direction="volume", content=q(content, cunit), totalSolids=None, volume=q(vol, unit), volumeBasis="diluent", reportUnit=rep), allow_close=True)
# (a) bound just above a grid point: must go up to the next
vdirect("IND-DR-a1", ["C7-FX-06", DEC], "'At most' concentration whose exact value lies 0.0683 of a 6-sf quantum above a grid point (exact value 11.9937068...): rounds UP to 11.9938; half away from zero would give 11.9937, a figure below the bound it states", "34", "2.81")
vdirect("IND-DR-a2", ["C7-FX-06", DEC], "'At most' 0.0372 of a quantum above a grid point: must round up (half away would stay). Also final 2.61694 mL: at-least rounds DOWN to 2.61 where half away would give 2.62.", "78", "2.56")
vdirect("IND-DR-a3", ["C7-FX-06", DEC], "'At most' 0.0320 of a quantum above a grid point; final 1.01745 mL: down 1.01, half-away 1.02.", "65", "0.97")
vdirect("IND-DR-a4", ["C7-FX-06", DEC], "'At most' 0.0659 of a quantum above a grid point; final 4.7769 mL: down 4.77, half-away 4.78.", "9.44", "4.77")
vdirect("IND-DR-a5", ["C7-FX-06", DEC], "Microlitre/microgram units: 1.47 mg into 12.1 uL, reported in ug/mL; final 13.1731 uL rounds down to 13.1 (half away 13.2); concentration 0.0454 of a quantum above a grid point rounds up.", "1.47", "12.1", unit="µL", rep="µg/mL")
# (b) pairs the other way round: 'at most' whose exact value is just BELOW the next grid point (half away also rounds up) - control that up is not 'plus one'
vdirect("IND-DR-b1", ["C7-FX-06", DEC], "'At most' 0.9425 of a quantum above a grid point (i.e. 0.0575 below the next): rounds up to the next; here half away from zero agrees, so this is a control that only the correct grid point is chosen.", "14.3", "0.88")
# (c) exactly on a grid point: must stay. 1 g reagent alone, Dmin = fl(0.73); diluent v with fl(v) + fl(0.73) == an integer exactly (in doubles and in exact decimals)
for tag, vd, F_, conc in [("c1", "1.27", "2", "500.000"), ("c2", "0.27", "1", "1000.00"), ("c3", "7.27", "8", "125.000")]:
    tc = C(content=q("1","g"), totalSolids=None, target=q(conc.rstrip("0").rstrip(".") if "." in conc else conc, "mg/mL"))
    rr = solve(tc, float); rd_ = solve(tc, Decimal)
    assert rr["displayed"] == rd_["displayed"] and rr["displayed"]["concentration"] == conc and rr["displayed"]["final"] == ("%.2f" % float(F_)), (tag, rr["displayed"], rd_["displayed"])
    assert rr["_vals"]["Fa"] == float(F_) and rr["_vals"]["Ca_disp"] == 1000 / float(F_)
    dirs("IND-DR-%s" % tag, ["C7-FX-06", DEC], "Exactly on a grid point: 1 g reagent alone, no solids, Dmin = fl(0.73) = 0.73 mL; diluent %s mL + 0.73 = %s mL exactly (both in doubles, fl(%s)+fl(0.73) == %s, and in exact decimals); Ca = 1000 mg / %s mL = %s mg/mL exactly; the displayed bound must STAY %s (not step up to the next grid point) and the final %s.00 stays. Distances to the grid are 0." % (vd, F_, vd, F_, F_, conc, conc, F_), tc, boundary=True, allow_close=True)
# (d) 'at least' final that half-away would round up: already IND-FX-13d (0.99953 -> 0.999). More, at 3-digit and 2-decimal places:
vdirect("IND-DR-d1", ["C7-FX-06", DEC], "'At least' final (see also IND-FX-13d, 0.999529 -> 0.999 not 1.00): 26 mg into 3.43 mL: the final volume's fractional position is 0.898 of its 0.01 quantum, so it displays 3.44 (down) where half away would give 3.45; concentration 0.0646 of a quantum above a grid point rounds up.", "26", "3.43")

# ======================= extended: molar unit not selected =======================
for key, over, c1x in [("7", dict(), c1o("assembled", [])), ("8", dict(conjugate="protein"), c1o("assembled", [])), ("9", dict(conjugate="conjugate"), c1o("conjugate", ["C1-FL-08"], q(198.6, "kDa")))]:
    mt_ = C(target=q("2.5","mg/mL"), c1=c1x, molarUnit=None, **over)
    rr_ = add("IND-EXT-unitns-r%s-T" % key, ["C7-DT-06","C7-FX-09"], "Pairing row %s permitted, mass target, no molar unit selected: molar status unit-not-selected (protocol 2); no molar figure." % key, mt_)
    add("IND-EXT-unitns-r%s-VD" % key, ["C7-DT-06","C7-FX-09"], "Same, volume direction (diluent entered), no molar unit selected.", vol_from(mt_, rr_, "diluent"))

# ======= Addendum 29 Sept 2026: the departure of an "at most" concentration is itself an upper bound (rounded toward +inf, 3 sf) =======
ADD = "spec/decision-2026-09-28-directed-rounding.md#addendum-29-september-2026"
def dep_fx(id, constr, content, T, tu="mg/mL", cu="mg", **kw):
    return add(id, ["C7-FX-06", "C7-FX-17", "C7-DT-07", ADD], constr, C(**dict(dict(content=q(content, cu), totalSolids=None, target=q(T, tu)), **kw)), allow_close=True)
dep_fx("IND-DEP-pos1", "'At most' departure positive, unrounded +0.349383 %: half away gives +0.349 %, a figure below the bound; rounded toward +inf gives +0.350 %. 12 mg to 9.5 mg/mL, Dmin applied.", "12", "9.5")
dep_fx("IND-DEP-pos2", "'At most' departure positive, +0.137461 %: half away +0.137 %, toward +inf +0.138 %.", "47", "2.2")
dep_fx("IND-DEP-neg1", "'At most' departure NEGATIVE, unrounded -0.0658566 %: half away from zero would give -0.0659 % (away from zero, below the bound); toward +inf is toward zero: -0.0658 %.", "12", "3.3")
dep_fx("IND-DEP-neg2", "'At most' departure negative, -0.126673 %: half away -0.127 %, toward +inf -0.126 %.", "150", "9.5")
dep_fx("IND-DEP-neg3", "'At most' departure negative, -0.172862 %: half away -0.173 %, toward +inf -0.172 %.", "90", "0.85")
dep_fx("IND-DEP-negpos-ug", "Same kind in ug/mL: 25 mg to 23000 ug/mL, departure negative (-0.118859 %), toward zero -0.118 %.", "25", "23000", tu="µg/mL")
dep_fx("IND-DEP-molar", "Molar target 10 uM of a 148.3 kDa assembled protein, 'at most' (no solids, Dmin): the departure is against the mass-concentration equivalent (1.483 mg/mL); rounded toward +inf.", "12", "10", tu="µM", c1=c1o("assembled", []))
# not an upper bound: unrounded control with the same magnitudes (solids declared -> computed, achieved): half away from zero
dep_fx("IND-DEP-ctl-computed", "Negative control: solids declared, concentration is achieved (not 'at most'): departure not an upper bound, half away from zero.", "12", "9.5", totalSolids=q("14","mg"))
