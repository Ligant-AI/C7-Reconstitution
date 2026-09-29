from model import *
def q(v,u): return {"value":v,"unit":u}
base = dict(direction="target", content=q("2.3719","mg"), contentBasis="reagent-alone", provenance="coa", conjugate="none", carrier="absent", wholeVial=True, totalSolids=q("3.1","mg"), volumeBasis="diluent", target=q("0.8137","mg/mL"), minTransfer=q("2","µL"), capacity=None, c1=None, molarUnit=None, threshold=0.006)
def C(**k):
    d=dict(base); d.update(k); return d
for name,c in [("fx05",C(content=q("80","mg"),totalSolids=q("100","mg"),target=q("80","mg/mL"))),
 ("fx06",C(content=q("80","mg"),totalSolids=None,target=q("80","mg/mL"))),
 ("fx17",C(content=q("1.0054","mg"),totalSolids=q("1.2","mg"),target=q("1","mg/mL"))),
 ("fx06c",C(content=q("1.0044","mg"),totalSolids=None,target=q("1","mg/mL")))]:
    for N in (float,Decimal):
        r=solve(c,N); print(name,N.__name__,r["displayed"],r["flags"],r["label"],{k:str(v)[:12] for k,v in r["_vals"].items()})
