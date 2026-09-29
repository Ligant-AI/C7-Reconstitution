# Spec-audit smoke recomputation, 2026-09-28. Inputs from spec/reconstitution-urs-v1.0.md only.
from decimal import Decimal as D, getcontext, ROUND_HALF_UP
getcontext().prec=60
def r(x,sf):
    b=D(float(x))  # exact binary value of the nearest double
    if b==0: return b
    e=b.copy_abs().adjusted()
    q=D(1).scaleb(e-sf+1)
    return b.quantize(q,rounding=ROUND_HALF_UP)  # decimal HALF_UP = half away from zero
def show(name,x,sf):
    print(f"{name}: exact={x}  double={D(float(x))}  {sf}sf={r(x,sf)}")
v=D('0.73')
print("== (1) FL-08 at f=0.073")
f=D('0.073')
show("shortfall f/(1+f) %",f/(1+f)*100,3)
show("overstatement f/(1-f) %",f/(1-f)*100,3)
show("1/(1+f)",1/(1+f),6); show("1/(1-f)",1/(1-f),6)
print("== (2) FX-05")
c=D(80); s=D(100); t=D(80)
F=c/t; Dd=s/1000*v; fx=Dd/F; Vd=F-Dd; Vdp=r(Vd,3); Fa=Vdp+Dd; Ca=c/Fa
show("TS conc mg/mL",s/F,6); show("F",F,3); show("F 4sf",F,4); show("D",Dd,3); show("f %",fx*100,3)
show("Vd",Vd,3); show("Fa",Fa,3); show("Fa 4sf",Fa,4); show("Ca",Ca,6); show("shortfall %",fx/(1+fx)*100,3)
Df=0.1*0.73; Vdf=1.0-Df
print(" float D=",repr(Df),"Vd=",repr(Vdf),"Fa(float)=",repr(0.927+Df),"Ca(float)=",repr(80/(0.927+Df)), "Ca 6sf of float:", r(D(80/(0.927+Df)),6))
print("== (3) FX-06")
Dmin=c/1000*v; show("Dmin",Dmin,3); Vd=F-Dmin; show("Vd",Vd,3); Vdp=r(Vd,3)
Fa=Vdp+Dmin; show("Fa",Fa,3); show("Ca",c/Fa,6); show("fmin %",Dmin/F*100,3)
print(" gap Vd-0.9415 =", Vd-D('0.9415'), " gap 0.9425-Vd:", D('0.9425')-Vd)
print(" float Vd:", repr(1.0-0.08*0.73), " gap of double to 0.9415:", D(1.0-0.08*0.73)-D('0.9415'))
print(" Ca gap to 79.96805:", D('79.96805')-c/Fa, " to 79.96795:", c/Fa-D('79.96795'))
for vd in (D('1.00'),D('0.942')):
    Fe=vd+Dmin; show(f" entered {vd}: Ca",c/Fe,6); show(f" entered {vd}: fmin %",Dmin/Fe*100,3); show(f" entered {vd}: Fa",Fe,3)
c2=D('1.0044'); F2=c2/1; Dm2=c2/1000*v; Vd2=F2-Dm2; show("1.0044: Dmin",Dm2,3); show("1.0044: Vd",Vd2,7); show("1.0044: Vd",Vd2,3)
Fa2=r(Vd2,3)+Dm2; show("1.0044: Fa",Fa2,3); show("1.0044: Ca",c2/Fa2,6); show("1.0044: fmin %",Dm2/F2*100,3)
print(" 1.0044 Vd gap to 3-sf tie 1.005:", D('1.005')-Vd2, " per step:", (D('1.005')-Vd2)/D('0.01'))
print(" 1.0044 Ca - 1.003665:", c2/Fa2-D('1.003665'), " Ca - 1.003655:", c2/Fa2-D('1.003655'))
print("== (4) FX-17")
c3=D('1.0054'); s3=D('1.2'); F3=c3; D3=s3/1000*v; Vd3=F3-D3; show("D",D3,3); show("Vd",Vd3,7); show("Vd 3sf",Vd3,3)
Fa3=r(Vd3,3)+D3; show("Fa",Fa3,7); show("Fa 3sf",Fa3,3); Ca3=c3/Fa3; show("Ca",Ca3,6); show("dep %",(Ca3-1)*100,3); show("f %",D3/F3*100,3)
print(" gap 1.005-Vd:",D('1.005')-Vd3, " per step:", (D('1.005')-Vd3)/D('0.01'))
print(" Ca gap 1.004525-Ca:", D('1.004525')-Ca3, " Ca-1.004515:", Ca3-D('1.004515'))
print("== (5) register")
for p in ('0.01','0.008','0.006'):
    x=D(p)/v*1000; show(f"thr {p}",x,3); show(f"thr {p} 2sf",x,2)
show("1/vbar mg/mL",1/v*1000,3); show("1/vbar mg/mL",1/v*1000,6)
print("== gap summary (3-sf ties for volumes and percentages, 6-sf ties for concentrations)")
ov=D('0.073')/(1-D('0.073'))*100
print(" overstatement gap to 7.875 %:", D('7.875')-ov, " per 0.01 step:", (D('7.875')-ov)/D('0.01'))
print(" flip point f where f/(1-f)=0.07875:", D('0.07875')/D('1.07875')*100, "%")
print(" FX-05 Vd 0.927 gap to 0.9275:", D('0.9275')-D('0.927'), " per step:", (D('0.9275')-D('0.927'))/D('0.001'))
print(" FX-06 Vd gap per step:", D('0.0001')/D('0.001'), " relative:", D('0.0001')/D('0.9416'))
g=D('1.003665')-c2/Fa2; print(" 1.0044 Ca gap:", g, " per step:", g/D('0.00001'), " relative:", g/(c2/Fa2))
g=D('79.96805')-c/(D('0.942')+Dmin); print(" FX-06 Ca gap:", g, " per step:", g/D('0.0001'))
g=D('1.004525')-Ca3; print(" FX-17 Ca gap:", g, " per step:", g/D('0.00001'))
