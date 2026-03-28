import { useState, useEffect, useCallback, useMemo, useRef } from "react";

/* ═══ SIMULATION ENGINE ═══ */
function simulate(inp) {
  const { brent, usdIdr, passThrough, evFleetPct, timeHorizon, avgKmPerBike, subsidyIntensity } = inp;
  const BB=75,BI=15800,CR=10,FR=0.05,RT=10000,VL=30,IB=300000,MT=130,GDP=1400,FK=0.025,CW=0.04,CM=0.7,PB=80;
  const ld=((brent+CR)/159)*(1+FR)*usdIdr, bld=((BB+CR)/159)*(1+FR)*BI;
  const er=RT+(passThrough/100)*Math.max(0,ld-RT), gp=Math.max(0,ld-er), bg=Math.max(0,bld-RT);
  const eu=(evFleetPct/100)*MT*1e6, dp=(eu*avgKmPerBike*FK)/1e9, ev=Math.max(0,VL-dp);
  const sb=(gp*ev*1e9)/1e12*subsidyIntensity, bs=(bg*VL*1e9)/1e12, sc2=sb-bs;
  const pn=PB*(brent/BB)*0.7, fp=(sc2*1e12/(GDP*1e9*usdIdr))*100;
  const ib=(IB*365*(brent+CR))/1e9, bi2=(IB*365*(BB+CR))/1e9;
  const ai=(dp*1e9*(brent+CR)/159)/1e9, ni=ib-ai, td=ni-bi2, cp=(td/GDP)*100;
  const fc=((er-RT)/RT)*100, cd=CW*(fc/100)*100, ct=cd*(1+CM);
  const fx=Math.min(10,Math.max(0,((usdIdr-BI)/BI)*30+(td/5)*2+((brent-BB)/BB)*5));
  const as2=(gp*dp*1e9)/1e12;
  // CO2: gasoline emits ~2.31 kg CO2 per liter
  const co2ReducedTons = (dp * 1e9 * 2.31) / 1000; // tons
  const st={fiscal:Math.min(10,Math.max(0,(sb/100)*3+fp*5)),external:Math.min(10,Math.max(0,(td/3)*2+cp*10)),inflation:Math.min(10,Math.max(0,ct*2)),fx};
  const hm=timeHorizon<=1?1:timeHorizon<=3?0.85:0.7;
  const ov=(st.fiscal*0.3+st.external*0.25+st.inflation*0.25+st.fx*0.2)*hm;
  return{ld:Math.round(ld),er:Math.round(er),gp:Math.round(gp),sb:+(sb).toFixed(1),sc:+(sc2).toFixed(1),fp:+(fp).toFixed(2),ni:+(ni).toFixed(1),td:+(td).toFixed(1),cp:+(cp).toFixed(2),fc:+(fc).toFixed(1),ct:+(ct).toFixed(2),fx:+(fx).toFixed(1),dp:+(dp).toFixed(2),ai:+(ai).toFixed(2),as2:+(as2).toFixed(1),evM:+(eu/1e6).toFixed(1),co2:Math.round(co2ReducedTons),st,ov:+(ov).toFixed(1)};
}

/* ═══ ENHANCED POLICY ENGINE with social/political impacts ═══ */
function genPol(r, inp) {
  const e = Object.entries(r.st).sort((a,b) => b[1] - a[1]);
  const nm = { fiscal:"Fiscal", external:"External", inflation:"Inflation", fx:"Exchange Rate" };
  const sv = r.ov > 7 ? "severe" : r.ov > 5 ? "significant" : r.ov > 3 ? "moderate" : "manageable";

  let hl = r.ov <= 2
    ? `Indonesia's macro position is stable at USD ${inp.brent}/bbl. No material stress detected across fiscal, external, or inflation channels.`
    : r.ov <= 4
    ? `${sv.charAt(0).toUpperCase()+sv.slice(1)} pressure detected, primarily through the ${nm[e[0][0]].toLowerCase()} channel. The situation is manageable but requires monitoring.`
    : r.ov <= 6
    ? `Significant stress across ${nm[e[0][0]].toLowerCase()} and ${nm[e[1][0]].toLowerCase()} channels simultaneously. Policy intervention is advisable.`
    : `Warning: Severe macro stress across multiple channels. Without coordinated policy response, cascading economic and social consequences are likely.`;

  // ─── 1st Order Impacts (direct economic) ───
  let first = [];
  if (r.st.fiscal > 3) first.push("Fuel subsidy burden consumes fiscal space that would otherwise fund infrastructure, health, and education — every IDR spent on subsidies is an IDR not invested in development.");
  if (r.st.inflation > 2) first.push(`Consumer prices rise by an estimated ${r.ct} percentage points, directly eroding the purchasing power of 280 million Indonesians — with the poorest households hit hardest as they spend a larger share of income on fuel and food.`);
  if (r.st.external > 3) first.push("The widening oil trade deficit drains foreign exchange reserves, increases Indonesia's external financing needs, and raises the country's perceived risk among international investors.");
  if (r.st.fx > 3) first.push("Rupiah depreciation makes all imports more expensive — not just fuel, but food, medicine, raw materials — creating a cost-of-living spiral that compounds the original oil shock.");
  if (first.length === 0) first.push("Under this scenario, direct economic impacts remain contained. No single transmission channel is under significant pressure.");

  // ─── 2nd Order Impacts (social & political) ───
  let second = [];
  if (r.st.inflation > 3 && inp.passThrough > 30) {
    second.push("Rising fuel and food prices risk triggering public protests and social unrest — Indonesia has a documented history of fuel price hikes leading to street demonstrations (1998, 2005, 2013, 2022). The political cost of visible price increases is high and immediate.");
    second.push("Low-income and informal sector workers — ojol drivers, street vendors, farmers — face disproportionate impact. Their margins are already thin; a 10-30% increase in transport costs can push vulnerable households below the poverty line.");
  }
  if (r.st.fiscal > 4) {
    second.push("Subsidy crowding-out forces painful trade-offs: delayed infrastructure projects, frozen civil servant hiring, reduced healthcare and education budgets. These cuts are invisible in the short term but compound into long-term development setbacks.");
    second.push("Political pressure to maintain subsidies creates a fiscal trap — elected officials face backlash for raising fuel prices but also face backlash when roads aren't built, hospitals are understaffed, and schools deteriorate. There is no cost-free option.");
  }
  if (r.st.fx > 4) {
    second.push("A weakening rupiah erodes public confidence in economic management. Currency instability becomes a visible, emotionally charged metric that dominates media coverage and shapes voter sentiment, even when underlying fundamentals are manageable.");
  }
  if (r.ov > 5) {
    second.push("Sustained macro stress creates an environment where foreign direct investment slows, job creation weakens, and the demographic dividend — Indonesia's young, growing workforce — risks becoming a demographic liability if employment absorption falls short.");
  }
  if (second.length === 0) second.push("Social and political risks remain low under this scenario. No immediate pressure on household welfare or political stability.");

  // ─── Why Now ───
  let whyNow = [];
  whyNow.push("Indonesia's oil import dependence is structural and growing — domestic production has declined from 1.6M bpd in the 1990s to under 600,000 bpd today, while consumption continues to rise with population and economic growth. The vulnerability is not cyclical; it deepens every year that passes without structural change.");
  if (inp.brent > 85) whyNow.push(`At USD ${inp.brent}/bbl, the window for low-cost adjustment is already closing. Every month of delay at elevated oil prices adds IDR ${Math.round(r.sb / 12 * 10) / 10} trillion in additional subsidy obligations that must eventually be paid — by taxpayers, consumers, or through forgone development.`);
  whyNow.push("The global EV transition is accelerating. Indonesia has a narrow window to build domestic EV manufacturing capacity and capture the supply chain value. Countries that move early (China, Vietnam, India, Thailand) are already locking in manufacturing investment. Delay means Indonesia imports EVs rather than builds them.");
  whyNow.push("Indonesia's 2030 demographic window — the period of peak working-age population relative to dependents — is a once-in-a-generation opportunity. Wasting fiscal space on fuel subsidies during this window means failing to invest in the human capital and infrastructure that will determine whether Indonesia becomes a high-income economy or stalls at middle-income status.");

  // ─── What If Not ───
  let whatIfNot = [];
  if (r.ov > 3) {
    whatIfNot.push("If no structural action is taken, Indonesia's oil import bill will continue to grow as a share of GDP, the subsidy burden will consume an ever-larger share of the budget, and the economy's sensitivity to global oil volatility will increase — not decrease — over time.");
    whatIfNot.push("Each year of delayed EV adoption means 130 million motorcycles continue burning imported gasoline. At current consumption rates, that is approximately 25-30 billion liters of imported fuel per year — a permanent, recurring drain on the trade balance and budget that compounds annually.");
  }
  if (r.st.fiscal > 4) whatIfNot.push("Without subsidy reform, Indonesia risks a repeat of the 2013-2014 fiscal crisis, when energy subsidies consumed over 20% of the national budget and forced emergency austerity measures that damaged growth and public services for years.");
  if (r.st.inflation > 3) whatIfNot.push("Without proactive management, inflationary pressure from fuel costs will force Bank Indonesia into reactive rate hikes that slow credit growth, dampen investment, and reduce GDP growth by an estimated 0.3-0.5 percentage points — a self-inflicted wound on top of the external shock.");
  whatIfNot.push("The long-term cost of inaction is not stasis — it is structural decline. Indonesia's peer competitors (Vietnam, India, Thailand) are moving aggressively on energy transition and EV industrialization. Standing still means falling behind.");

  // ─── Recommendations ───
  let rc = [];
  if (r.st.fiscal > 4 && inp.passThrough < 50) rc.push("Implement partial fuel price pass-through with targeted cash transfers (BLT) to protect vulnerable households while reducing the fiscal burden");
  if (r.st.fiscal > 3) rc.push("Reprioritize fiscal spending to prevent subsidy crowding-out of development budget — protect infrastructure, health, and education allocations");
  if (r.st.inflation > 3) rc.push("Coordinate with Bank Indonesia on inflation expectations management and prepare for potential rate adjustment");
  if (r.st.external > 4) rc.push("Strengthen FX reserves and activate bilateral swap arrangements to buffer against external pressure");
  if (inp.evFleetPct < 5 && inp.brent > 85) rc.push("Accelerate EV 2-wheeler incentives — the macro resilience case is strongest during elevated oil prices");
  if (inp.evFleetPct >= 5) rc.push("Sustain EV momentum; extend incentives to high-mileage segments (ride-hailing, delivery) for maximum gasoline displacement");
  rc.push("Ensure APBN-P revision preparedness for Pertamina compensation obligations");

  return { hl, sv, top: nm[e[0][0]], rc, first, second, whyNow, whatIfNot };
}

const PR=[
  {n:"Base Case",d:"Current conditions",b:75,u:15800,p:15,e:0.2,t:1,k:8000,s:1},
  {n:"Oil Shock",d:"Brent $110",b:110,u:16200,p:15,e:0.2,t:1,k:8000,s:1},
  {n:"Double Hit",d:"Oil + weak IDR",b:110,u:17500,p:10,e:0.2,t:1,k:8000,s:1},
  {n:"Reform Path",d:"Pass-through + EV",b:100,u:16000,p:50,e:3,t:3,k:8000,s:1},
  {n:"EV Future",d:"12% EV fleet",b:95,u:16000,p:30,e:12,t:5,k:8000,s:1},
];

/* ═══ SVG ILLUSTRATIONS ═══ */
function OilBarrelSVG(){return(<svg viewBox="0 0 200 200" width="100%" height="100%"><defs><linearGradient id="og" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1e293b"/><stop offset="100%" stopColor="#0f172a"/></linearGradient></defs><rect width="200" height="200" fill="#f1f5f9" rx="12"/><ellipse cx="100" cy="60" rx="40" ry="14" fill="#334155"/><rect x="60" y="60" width="80" height="80" fill="url(#og)"/><ellipse cx="100" cy="140" rx="40" ry="14" fill="#1e293b"/><ellipse cx="100" cy="60" rx="40" ry="14" fill="#475569"/><text x="100" y="108" textAnchor="middle" fill="#94a3b8" fontSize="16" fontWeight="700" fontFamily="monospace">OIL</text><circle cx="100" cy="85" r="4" fill="#f59e0b"/></svg>);}
function MoneySVG(){return(<svg viewBox="0 0 200 200" width="100%" height="100%"><rect width="200" height="200" fill="#f1f5f9" rx="12"/><rect x="35" y="55" width="130" height="75" rx="8" fill="#1e293b"/><rect x="40" y="60" width="120" height="65" rx="6" fill="#334155"/><circle cx="100" cy="92" r="20" fill="none" stroke="#64748b" strokeWidth="2"/><text x="100" y="98" textAnchor="middle" fill="#94a3b8" fontSize="18" fontWeight="700" fontFamily="serif">Rp</text><rect x="50" y="70" width="8" height="8" rx="4" fill="#475569"/><rect x="142" y="70" width="8" height="8" rx="4" fill="#475569"/></svg>);}
function MotorcycleSVG(){return(<svg viewBox="0 0 200 200" width="100%" height="100%"><rect width="200" height="200" fill="#f0fdf4" rx="12"/><circle cx="60" cy="140" r="22" fill="none" stroke="#16a34a" strokeWidth="3"/><circle cx="60" cy="140" r="8" fill="#16a34a"/><circle cx="150" cy="140" r="22" fill="none" stroke="#16a34a" strokeWidth="3"/><circle cx="150" cy="140" r="8" fill="#16a34a"/><path d="M60 140 L80 110 L130 105 L150 140" fill="none" stroke="#0f172a" strokeWidth="3" strokeLinejoin="round"/><path d="M80 110 L90 85 L110 80 L130 105" fill="#0f172a" opacity="0.15" stroke="#0f172a" strokeWidth="2"/><path d="M110 80 L125 75" stroke="#0f172a" strokeWidth="2"/><circle cx="90" cy="85" r="3" fill="#16a34a"/><text x="100" y="175" textAnchor="middle" fill="#16a34a" fontSize="10" fontWeight="700">EV</text></svg>);}
function HospitalSVG(){return(<svg viewBox="0 0 200 200" width="100%" height="100%"><rect width="200" height="200" fill="#eff6ff" rx="12"/><rect x="55" y="60" width="90" height="100" rx="4" fill="#1e293b"/><rect x="45" y="100" width="30" height="60" rx="3" fill="#334155"/><rect x="125" y="100" width="30" height="60" rx="3" fill="#334155"/><rect x="85" y="40" width="30" height="30" rx="2" fill="#0ea5e9"/><rect x="96" y="44" width="8" height="22" rx="1" fill="#fff"/><rect x="89" y="51" width="22" height="8" rx="1" fill="#fff"/><rect x="70" y="75" width="14" height="14" rx="2" fill="#475569"/><rect x="93" y="75" width="14" height="14" rx="2" fill="#475569"/><rect x="116" y="75" width="14" height="14" rx="2" fill="#475569"/><rect x="90" y="130" width="20" height="30" rx="2" fill="#64748b"/></svg>);}
function SchoolSVG(){return(<svg viewBox="0 0 200 200" width="100%" height="100%"><rect width="200" height="200" fill="#faf5ff" rx="12"/><polygon points="100,35 160,75 40,75" fill="#8b5cf6" opacity="0.2" stroke="#8b5cf6" strokeWidth="2"/><rect x="50" y="75" width="100" height="80" rx="3" fill="#1e293b"/><rect x="60" y="85" width="18" height="20" rx="2" fill="#475569"/><rect x="90" y="85" width="18" height="20" rx="2" fill="#475569"/><rect x="120" y="85" width="18" height="20" rx="2" fill="#475569"/><rect x="88" y="125" width="24" height="30" rx="2" fill="#64748b"/><rect x="94" y="60" width="12" height="18" rx="1" fill="#8b5cf6"/><circle cx="100" cy="56" r="6" fill="#8b5cf6"/></svg>);}
function RoadSVG(){return(<svg viewBox="0 0 200 200" width="100%" height="100%"><rect width="200" height="200" fill="#fffbeb" rx="12"/><path d="M0 200 L70 80 L130 80 L200 200" fill="#334155"/><path d="M0 200 L75 85 L125 85 L200 200" fill="#475569"/><rect x="95" y="100" width="10" height="20" rx="1" fill="#fbbf24"/><rect x="95" y="130" width="10" height="20" rx="1" fill="#fbbf24"/><rect x="95" y="160" width="10" height="20" rx="1" fill="#fbbf24"/></svg>);}
function CO2SVG(){return(<svg viewBox="0 0 200 200" width="100%" height="100%"><rect width="200" height="200" fill="#ecfdf5" rx="12"/><circle cx="100" cy="75" r="30" fill="#16a34a" opacity="0.15"/><circle cx="75" cy="65" r="22" fill="#16a34a" opacity="0.2"/><circle cx="125" cy="65" r="22" fill="#16a34a" opacity="0.2"/><circle cx="85" cy="50" r="18" fill="#16a34a" opacity="0.25"/><circle cx="115" cy="50" r="18" fill="#16a34a" opacity="0.25"/><rect x="95" y="90" width="10" height="50" rx="3" fill="#15803d"/><rect x="88" y="140" width="24" height="6" rx="3" fill="#14532d" opacity="0.3"/><text x="100" y="175" textAnchor="middle" fill="#16a34a" fontSize="11" fontWeight="700" fontFamily="sans-serif">CO2</text></svg>);}
function TreeSVG(){return(<svg viewBox="0 0 200 200" width="100%" height="100%"><rect width="200" height="200" fill="#f0fdf4" rx="12"/>{[40,75,110,145,160].map((x,i)=><g key={i}><circle cx={x} cy={70+i*8-Math.abs(i-2)*12} r={14+i*2} fill="#16a34a" opacity={0.15+i*0.05}/><rect x={x-3} y={70+i*8-Math.abs(i-2)*12+10} width="6" height={25+i*3} rx="2" fill="#15803d" opacity={0.4+i*0.1}/></g>)}<text x="100" y="180" textAnchor="middle" fill="#15803d" fontSize="10" fontWeight="700" fontFamily="sans-serif">FOREST</text></svg>);}

/* ═══ MAIN APP ═══ */
export default function App(){
  const[inp,si]=useState({brent:75,usdIdr:15800,passThrough:15,evFleetPct:0.2,timeHorizon:1,avgKmPerBike:8000,subsidyIntensity:1});
  const[pr,spr]=useState(0);
  const[vis,sv]=useState({});
  const refs=useRef({});

  const set=useCallback((k,v)=>{si(p=>({...p,[k]:v}));spr(-1);},[]);
  const aply=useCallback(i=>{const p=PR[i];si({brent:p.b,usdIdr:p.u,passThrough:p.p,evFleetPct:p.e,timeHorizon:p.t,avgKmPerBike:p.k,subsidyIntensity:p.s});spr(i);},[]);

  const res=useMemo(()=>simulate(inp),[inp]);
  const pol=useMemo(()=>genPol(res,inp),[res,inp]);

  // 10% adoption calcs
  const tenPct=useMemo(()=>simulate({...inp,evFleetPct:10}),[inp]);
  const sav=tenPct.as2;
  const hospitals=Math.round(sav/0.3);
  const schools=Math.round(sav/0.015);
  const tollKm=Math.round(sav/0.25);
  // CO2 at 10%: gasoline displaced * 2.31 kg CO2/liter
  const co2_10pct = tenPct.co2; // tons
  const co2_million = (co2_10pct / 1e6).toFixed(2);
  // Each mature tree absorbs ~22 kg CO2/year
  const treesEquiv = Math.round(co2_10pct / 0.022); // thousands scaled below
  const treesMillions = (treesEquiv / 1e6).toFixed(1);

  useEffect(()=>{
    const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)sv(p=>({...p,[e.target.dataset.s]:true}));});},{threshold:0.1});
    Object.values(refs.current).forEach(el=>{if(el)obs.observe(el);});
    return()=>obs.disconnect();
  },[]);

  const rf=id=>el=>{if(el){el.dataset.s=id;refs.current[id]=el;}};
  const an=(id,d=0)=>({style:{opacity:vis[id]?1:0,transform:vis[id]?"translateY(0)":"translateY(40px)",transition:`opacity 0.85s ease ${d}s, transform 0.85s ease ${d}s`}});

  const sc=res.ov<=2.5?"#16a34a":res.ov<=5?"#d97706":res.ov<=7.5?"#ea580c":"#dc2626";
  const sl=res.ov<=2.5?"LOW":res.ov<=5?"MODERATE":res.ov<=7.5?"HIGH":"SEVERE";
  const sbg=res.ov<=2.5?"#f0fdf4":res.ov<=5?"#fffbeb":res.ov<=7.5?"#fff7ed":"#fef2f2";

  function Sl({label,value,onChange,min,max,step,unit,sub}){
    const pc=((value-min)/(max-min))*100;
    return(<div style={{marginBottom:28}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}><span style={{fontSize:14,fontWeight:600,color:"#1e293b"}}>{label}</span><span style={{fontSize:18,fontWeight:700,color:"#0f172a",fontFamily:"'Space Mono',monospace"}}>{typeof value==="number"?value.toLocaleString():value}{unit}</span></div><input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(parseFloat(e.target.value))} style={{width:"100%",height:4,appearance:"none",background:`linear-gradient(to right,#0f172a 0%,#0f172a ${pc}%,#e2e8f0 ${pc}%,#e2e8f0 100%)`,borderRadius:2,outline:"none",cursor:"pointer"}}/><div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#94a3b8",marginTop:4}}><span>{min}{unit}</span><span>{max}{unit}</span></div>{sub&&<div style={{fontSize:12,color:"#94a3b8",marginTop:4}}>{sub}</div>}</div>);
  }
  function PB2({label,value}){
    const pc=Math.min(100,(value/10)*100);const c=value<=2.5?"#16a34a":value<=5?"#d97706":value<=7.5?"#ea580c":"#dc2626";
    return(<div style={{marginBottom:16}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:13,color:"#475569"}}>{label}</span><span style={{fontSize:13,fontWeight:700,color:c,fontFamily:"'Space Mono',monospace"}}>{(Math.round(value*10)/10).toFixed(1)}</span></div><div style={{height:6,background:"#f1f5f9",borderRadius:3,overflow:"hidden"}}><div style={{width:`${pc}%`,height:"100%",background:c,borderRadius:3,transition:"width 0.7s ease"}}/></div></div>);
  }
  function Met({label,value,unit,note,good}){
    return(<div style={{padding:"24px 28px",borderRadius:16,background:"#fff",border:"1px solid #e2e8f0"}}><div style={{fontSize:11,color:"#94a3b8",textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>{label}</div><div style={{fontSize:34,fontWeight:800,color:"#0f172a",fontFamily:"'Space Mono',monospace",lineHeight:1.1}}>{value}</div><div style={{fontSize:13,color:"#64748b",marginTop:4}}>{unit}</div>{note&&<div style={{fontSize:12,color:good?"#16a34a":"#dc2626",fontWeight:600,marginTop:8}}>{note}</div>}</div>);
  }

  return(
    <div style={{background:"#fff",color:"#0f172a",fontFamily:"'Instrument Sans','SF Pro Display',-apple-system,sans-serif",overflowX:"hidden"}}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"/>
      <style>{`input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:#0f172a;cursor:pointer;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.2)}input[type=range]::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:#0f172a;cursor:pointer;border:3px solid #fff}*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}`}</style>

      {/* ═══ HERO ═══ */}
      <section ref={rf("hero")} style={{minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",textAlign:"center",padding:"60px 24px",background:"linear-gradient(180deg,#f8fafc 0%,#fff 100%)"}}>
        <div {...an("hero")}>
          <div style={{fontSize:13,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:5,marginBottom:28}}>Indonesia Macro Simulation</div>
          <h1 style={{fontSize:"clamp(38px,6.5vw,76px)",fontWeight:800,lineHeight:1.02,color:"#0f172a",maxWidth:820,letterSpacing:-3}}>How oil prices shape<br/>Indonesia's economy.</h1>
          <p style={{fontSize:"clamp(16px,2vw,20px)",color:"#64748b",maxWidth:540,marginTop:28,lineHeight:1.65}}>An interactive decision-support tool for policy makers and investors. Simulate oil shocks and discover how EV 2-wheelers build macro resilience.</p>
          <div style={{marginTop:44,display:"flex",gap:14,flexWrap:"wrap",justifyContent:"center"}}>
            <button onClick={()=>document.getElementById("sim")?.scrollIntoView({behavior:"smooth"})} style={{padding:"15px 36px",borderRadius:30,background:"#0f172a",color:"#fff",fontSize:15,fontWeight:600,border:"none",cursor:"pointer"}}>Start Simulation</button>
            <button onClick={()=>document.getElementById("why")?.scrollIntoView({behavior:"smooth"})} style={{padding:"15px 36px",borderRadius:30,background:"transparent",color:"#0f172a",fontSize:15,fontWeight:600,border:"1.5px solid #cbd5e1",cursor:"pointer"}}>Learn More</button>
          </div>
        </div>
      </section>

      {/* ═══ WHY THIS MATTERS ═══ */}
      <section id="why" ref={rf("why")} style={{padding:"120px 24px",maxWidth:1140,margin:"0 auto"}}>
        <div {...an("why")} style={{textAlign:"center",marginBottom:72}}>
          <div style={{fontSize:13,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:5,marginBottom:16}}>The Challenge</div>
          <h2 style={{fontSize:"clamp(30px,4.5vw,52px)",fontWeight:800,lineHeight:1.08,color:"#0f172a",letterSpacing:-1.5}}>Indonesia imports more oil<br/>than it produces.</h2>
          <p style={{fontSize:18,color:"#64748b",maxWidth:580,margin:"24px auto 0",lineHeight:1.7}}>Consuming 1.6 million barrels per day while producing only 580,000. Every dollar increase flows into the trade deficit, the subsidy budget, and the cost of living.</p>
        </div>
        <div {...an("why",0.2)} style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20}}>
          {[{num:"1.6M",unit:"barrels / day",desc:"consumed by Indonesia — more than 2.5x domestic production",Svg:OilBarrelSVG},{num:"IDR 713T",unit:"energy subsidies 2024",desc:"with nearly 90% supporting fossil fuels — the largest single budget item",Svg:MoneySVG},{num:"130M",unit:"motorcycles on the road",desc:"the world's 3rd largest fleet — consuming 25-30% of all gasoline sold",Svg:MotorcycleSVG}].map((c,i)=>(
            <div key={i} {...an("why",0.15+i*0.12)} style={{borderRadius:20,overflow:"hidden",border:"1px solid #e2e8f0",background:"#fff"}}>
              <div style={{height:180,padding:20}}><c.Svg/></div>
              <div style={{padding:"4px 24px 28px"}}><div style={{fontSize:38,fontWeight:800,color:"#0f172a",fontFamily:"'Space Mono',monospace",lineHeight:1}}>{c.num}</div><div style={{fontSize:12,color:"#94a3b8",marginTop:4,marginBottom:10,textTransform:"uppercase",letterSpacing:1}}>{c.unit}</div><div style={{fontSize:14,color:"#475569",lineHeight:1.6}}>{c.desc}</div></div>
            </div>))}
        </div>
      </section>

      {/* ═══ BIG STAT ═══ */}
      <section style={{background:"#0f172a",padding:"80px 24px"}}>
        <div ref={rf("stat")} style={{maxWidth:900,margin:"0 auto",textAlign:"center"}}>
          <div {...an("stat")}><div style={{fontSize:"clamp(48px,8vw,88px)",fontWeight:800,color:"#fff",fontFamily:"'Space Mono',monospace",lineHeight:1,letterSpacing:-3}}>$29.6B</div><div style={{fontSize:20,color:"#94a3b8",marginTop:16,maxWidth:600,margin:"16px auto 0",lineHeight:1.6}}>Indonesia's total oil and refined petroleum import bill in 2024 — money flowing out of the economy every year.</div></div>
        </div>
      </section>

      {/* ═══ TRANSMISSION ═══ */}
      <section ref={rf("chain")} style={{padding:"100px 24px",background:"#f8fafc"}}>
        <div style={{maxWidth:1000,margin:"0 auto",textAlign:"center"}}>
          <div {...an("chain")}><div style={{fontSize:13,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:5,marginBottom:16}}>The Transmission Chain</div><h2 style={{fontSize:"clamp(28px,4.5vw,48px)",fontWeight:800,lineHeight:1.08,letterSpacing:-1.5,marginBottom:56}}>From barrel to household.</h2></div>
          <div {...an("chain",0.15)} style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
            {[{s:"01",t:"Global Oil Price",d:"Brent/ICP benchmark moves",ic:"\uD83D\uDEE2\uFE0F"},{s:"02",t:"Landed Cost in IDR",d:"Crude price x FX rate = domestic cost",ic:"\uD83D\uDCB1"},{s:"03",t:"Government Decision",d:"Absorb via budget or pass to consumers?",ic:"\uD83C\uDFDB\uFE0F"},{s:"04",t:"Fiscal or Inflation",d:"Subsidy burden grows OR prices spike",ic:"\u26A0\uFE0F"},{s:"05",t:"Macro Ripple Effects",d:"Trade deficit widens, IDR weakens",ic:"\uD83C\uDF0A"},{s:"06",t:"EV Mitigation",d:"Electric motorcycles reduce gasoline demand",ic:"\u26A1"}].map((c,i)=>(
              <div key={i} {...an("chain",0.1+i*0.07)} style={{padding:"28px 20px",borderRadius:16,background:"#fff",border:"1px solid #e2e8f0",textAlign:"center"}}><div style={{fontSize:32,marginBottom:8}}>{c.ic}</div><div style={{fontSize:11,color:"#94a3b8",fontFamily:"'Space Mono',monospace",marginBottom:6}}>{c.s}</div><div style={{fontSize:16,fontWeight:700,color:"#0f172a",marginBottom:6}}>{c.t}</div><div style={{fontSize:12,color:"#64748b",lineHeight:1.5}}>{c.d}</div></div>))}
          </div>
        </div>
      </section>

      {/* ═══ SIMULATION ═══ */}
      <section id="sim" ref={rf("sim")} style={{padding:"100px 24px",maxWidth:1200,margin:"0 auto"}}>
        <div {...an("sim")} style={{textAlign:"center",marginBottom:56}}>
          <div style={{fontSize:13,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:5,marginBottom:16}}>Interactive Simulation</div>
          <h2 style={{fontSize:"clamp(30px,4.5vw,52px)",fontWeight:800,lineHeight:1.08,color:"#0f172a",letterSpacing:-1.5}}>Adjust. Simulate. Understand.</h2>
        </div>

        <div {...an("sim",0.1)} style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginBottom:48}}>
          {PR.map((p,i)=>(<button key={i} onClick={()=>aply(i)} style={{padding:"10px 22px",borderRadius:24,border:pr===i?"2px solid #0f172a":"1.5px solid #e2e8f0",background:pr===i?"#0f172a":"#fff",color:pr===i?"#fff":"#475569",fontSize:13,fontWeight:600,cursor:"pointer",transition:"all 0.2s"}}>{p.n}</button>))}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"380px 1fr",gap:48,alignItems:"start"}}>
          <div {...an("sim",0.15)} style={{padding:"32px 28px",borderRadius:20,border:"1px solid #e2e8f0",background:"#fafafa",position:"sticky",top:24}}>
            <div style={{fontSize:11,color:"#94a3b8",textTransform:"uppercase",letterSpacing:2,marginBottom:24}}>Scenario Inputs</div>
            <Sl label="Brent Crude Oil" value={inp.brent} onChange={v=>set("brent",v)} min={40} max={150} step={5} unit=" USD/bbl"/>
            <Sl label="USD/IDR Rate" value={inp.usdIdr} onChange={v=>set("usdIdr",v)} min={14000} max={19000} step={100} unit=""/>
            <Sl label="Fuel Price Pass-Through" value={inp.passThrough} onChange={v=>set("passThrough",v)} min={0} max={100} step={5} unit="%" sub="0% = govt absorbs all"/>
            <Sl label="EV 2W Fleet Share" value={inp.evFleetPct} onChange={v=>set("evFleetPct",v)} min={0} max={20} step={0.5} unit="%" sub={`${Math.round(inp.evFleetPct*1.3)}M of 130M motorcycles`}/>
            <div style={{marginBottom:20}}><div style={{fontSize:14,fontWeight:600,color:"#1e293b",marginBottom:10}}>Time Horizon</div><div style={{display:"flex",gap:8}}>{[1,3,5].map(y=>(<button key={y} onClick={()=>set("timeHorizon",y)} style={{flex:1,padding:"10px",borderRadius:10,border:inp.timeHorizon===y?"2px solid #0f172a":"1.5px solid #e2e8f0",background:inp.timeHorizon===y?"#0f172a":"#fff",color:inp.timeHorizon===y?"#fff":"#64748b",fontSize:14,fontWeight:600,cursor:"pointer"}}>{y}Y</button>))}</div></div>
          </div>

          <div>
            {/* Stress Gauge */}
            <div {...an("sim",0.2)} style={{padding:"44px",borderRadius:24,background:sbg,border:`1px solid ${sc}22`,marginBottom:28,textAlign:"center"}}>
              <div style={{fontSize:12,color:"#94a3b8",textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>Overall Macro Stress</div>
              <div style={{fontSize:88,fontWeight:800,color:sc,fontFamily:"'Space Mono',monospace",lineHeight:1}}>{res.ov}</div>
              <div style={{fontSize:16,fontWeight:700,color:sc,letterSpacing:4,marginTop:8,textTransform:"uppercase"}}>{sl}</div>
              <div style={{fontSize:15,color:"#64748b",marginTop:20,maxWidth:500,margin:"20px auto 0",lineHeight:1.65}}>{pol.hl}</div>
            </div>
            {/* Pressure Channels */}
            <div {...an("sim",0.3)} style={{padding:"28px 32px",borderRadius:20,border:"1px solid #e2e8f0",marginBottom:28,background:"#fff"}}>
              <div style={{fontSize:11,color:"#94a3b8",textTransform:"uppercase",letterSpacing:2,marginBottom:20}}>Pressure Channels</div>
              <PB2 label="Fiscal — Subsidy Burden" value={res.st.fiscal}/><PB2 label="External — Trade & CA Deficit" value={res.st.external}/><PB2 label="Inflation — Consumer Prices" value={res.st.inflation}/><PB2 label="FX — Rupiah Vulnerability" value={res.st.fx}/>
            </div>
            {/* Metrics */}
            <div {...an("sim",0.4)} style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
              <Met label="Subsidy Burden" value={res.sb} unit="IDR Trillion/yr" note={res.sc>0?`+${res.sc} vs base`:null}/><Met label="Oil Import Bill" value={res.ni} unit="USD Billion/yr" note={res.td>0?`+${res.td} vs base`:null}/><Met label="Inflation Impact" value={res.ct>0?`+${res.ct}`:"0"} unit="pp CPI"/><Met label="CA Impact" value={res.cp>0?`+${res.cp}`:res.cp} unit="pp GDP"/><Met label="EV Import Savings" value={res.ai} unit="USD Bn/yr" note={res.ai>0.5?"Material":null} good={true}/><Met label="EV Subsidy Savings" value={res.as2} unit="IDR Tn/yr" note={res.as2>5?"Significant":null} good={true}/>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ EV SECTION ═══ */}
      <section ref={rf("evh")} style={{padding:"100px 24px",background:"#f0fdf4"}}>
        <div style={{maxWidth:900,margin:"0 auto",textAlign:"center"}}>
          <div {...an("evh")}><div style={{width:200,height:200,margin:"0 auto 32px"}}><MotorcycleSVG/></div><div style={{fontSize:13,fontWeight:600,color:"#16a34a",textTransform:"uppercase",letterSpacing:5,marginBottom:16}}>The EV Solution</div><h2 style={{fontSize:"clamp(28px,4.5vw,48px)",fontWeight:800,lineHeight:1.08,color:"#0f172a",letterSpacing:-1.5}}>Every electric motorcycle<br/>reduces Indonesia's oil exposure.</h2><p style={{fontSize:17,color:"#64748b",maxWidth:540,margin:"20px auto 0",lineHeight:1.65}}>Not just a climate solution. A structural macro-resilience tool that cuts imports, subsidies, and trade deficits simultaneously.</p></div>
        </div>
      </section>

      {/* ═══ EV TABLE ═══ */}
      <section ref={rf("evt")} style={{padding:"60px 24px 100px",maxWidth:1000,margin:"0 auto"}}>
        <div {...an("evt")} style={{borderRadius:20,overflow:"hidden",border:"1px solid #dcfce7",background:"#fff"}}>
          <div style={{padding:"28px 32px"}}><div style={{fontSize:11,color:"#94a3b8",textTransform:"uppercase",letterSpacing:2,marginBottom:20}}>EV Impact at Different Adoption Levels (Brent ${inp.brent}/bbl)</div>
            <table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr style={{borderBottom:"2px solid #e2e8f0"}}>{["Fleet Share","Units","Gasoline Displaced","Import Savings","Subsidy Savings","CO2 Reduced"].map(h=>(<th key={h} style={{textAlign:"left",padding:"10px 12px",fontSize:11,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>{h}</th>))}</tr></thead>
            <tbody>{[0.2,1,3,5,8,10,15].map((pct,i)=>{const s=simulate({...inp,evFleetPct:pct});const cur=Math.abs(pct-inp.evFleetPct)<0.3;return(<tr key={pct} style={{borderBottom:"1px solid #f1f5f9",background:cur?"#f0fdf4":i%2===1?"#fafafa":"#fff"}}><td style={{padding:"12px",fontSize:14,fontWeight:cur?700:500,color:cur?"#16a34a":"#0f172a"}}>{pct}%{cur?" \u2190":""}</td><td style={{padding:"12px",fontSize:14,color:"#475569",fontFamily:"'Space Mono',monospace"}}>{Math.round(pct*1.3)}M</td><td style={{padding:"12px",fontSize:14,color:"#475569",fontFamily:"'Space Mono',monospace"}}>{s.dp} Bn L</td><td style={{padding:"12px",fontSize:14,color:"#16a34a",fontWeight:600,fontFamily:"'Space Mono',monospace"}}>USD {s.ai} Bn</td><td style={{padding:"12px",fontSize:14,color:"#16a34a",fontWeight:600,fontFamily:"'Space Mono',monospace"}}>IDR {s.as2} Tn</td><td style={{padding:"12px",fontSize:14,color:"#16a34a",fontWeight:600,fontFamily:"'Space Mono',monospace"}}>{(s.co2/1e6).toFixed(2)}M tons</td></tr>);})}</tbody></table>
          </div>
        </div>
      </section>

      {/* ═══ FISCAL DIVIDEND ═══ */}
      <section ref={rf("bld")} style={{padding:"100px 24px",background:"#fff"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div {...an("bld")} style={{textAlign:"center",marginBottom:64}}>
            <div style={{fontSize:13,fontWeight:600,color:"#16a34a",textTransform:"uppercase",letterSpacing:5,marginBottom:16}}>The Fiscal Dividend</div>
            <h2 style={{fontSize:"clamp(28px,4.5vw,48px)",fontWeight:800,lineHeight:1.08,color:"#0f172a",letterSpacing:-1.5}}>What IDR {sav} Trillion<br/>in annual savings could build.</h2>
            <p style={{fontSize:17,color:"#64748b",maxWidth:600,margin:"20px auto 0",lineHeight:1.65}}>At 10% EV motorcycle adoption and Brent at USD {inp.brent}/bbl, the avoided fuel subsidy alone could fund transformative public investment every single year.</p>
          </div>
          <div {...an("bld",0.15)} style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:24}}>
            {[{num:hospitals,label:"Regional Hospitals",desc:`At ~IDR 300 billion per facility, the savings could fund ${hospitals} new regional hospitals annually — expanding healthcare access across the archipelago.`,Svg:HospitalSVG,color:"#0ea5e9"},{num:schools.toLocaleString(),label:"Elementary Schools",desc:`At ~IDR 15 billion per school, ${schools.toLocaleString()} new elementary schools — transforming education infrastructure nationwide.`,Svg:SchoolSVG,color:"#8b5cf6"},{num:`${tollKm} km`,label:"Toll Road",desc:`At ~IDR 250 billion per km, ${tollKm} km of new toll road — improving connectivity and logistics efficiency.`,Svg:RoadSVG,color:"#f59e0b"}].map((c,i)=>(
              <div key={i} {...an("bld",0.2+i*0.1)} style={{borderRadius:20,overflow:"hidden",background:"#fff",border:"1px solid #e2e8f0"}}><div style={{height:180,padding:16}}><c.Svg/></div><div style={{padding:"8px 28px 32px"}}><div style={{fontSize:52,fontWeight:800,color:c.color,fontFamily:"'Space Mono',monospace",lineHeight:1}}>{c.num}</div><div style={{fontSize:14,fontWeight:700,color:"#0f172a",marginTop:8,marginBottom:10}}>{c.label}</div><div style={{fontSize:13,color:"#64748b",lineHeight:1.65}}>{c.desc}</div></div></div>))}
          </div>
          <div {...an("bld",0.5)} style={{textAlign:"center",marginTop:48,padding:"28px 36px",borderRadius:16,background:"#f0fdf4",border:"1px solid #dcfce7",maxWidth:720,margin:"48px auto 0"}}>
            <div style={{fontSize:17,color:"#334155",lineHeight:1.75}}>Every IDR trillion on fuel subsidies is an IDR trillion <em>not</em> spent on hospitals, schools, and roads. EV adoption doesn't just reduce oil dependence — <strong style={{color:"#16a34a"}}>it unlocks fiscal space for development.</strong></div>
          </div>
        </div>
      </section>

      {/* ═══ ENVIRONMENTAL IMPACT — NEW ═══ */}
      <section ref={rf("env")} style={{padding:"100px 24px",background:"#ecfdf5"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div {...an("env")} style={{textAlign:"center",marginBottom:64}}>
            <div style={{fontSize:13,fontWeight:600,color:"#15803d",textTransform:"uppercase",letterSpacing:5,marginBottom:16}}>Environmental Impact</div>
            <h2 style={{fontSize:"clamp(28px,4.5vw,48px)",fontWeight:800,lineHeight:1.08,color:"#0f172a",letterSpacing:-1.5}}>Cleaner air. Lower emissions.<br/>A greener Indonesia.</h2>
            <p style={{fontSize:17,color:"#64748b",maxWidth:600,margin:"20px auto 0",lineHeight:1.65}}>At 10% EV motorcycle adoption, the gasoline no longer burned translates directly into massive CO2 reduction — equivalent to planting millions of trees.</p>
          </div>
          <div {...an("env",0.15)} style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:24}}>
            <div style={{borderRadius:20,overflow:"hidden",background:"#fff",border:"1px solid #bbf7d0"}}>
              <div style={{height:180,padding:16}}><CO2SVG/></div>
              <div style={{padding:"8px 28px 32px"}}>
                <div style={{fontSize:52,fontWeight:800,color:"#16a34a",fontFamily:"'Space Mono',monospace",lineHeight:1}}>{co2_million}M</div>
                <div style={{fontSize:14,fontWeight:700,color:"#0f172a",marginTop:8,marginBottom:10}}>Tons of CO2 Reduced per Year</div>
                <div style={{fontSize:13,color:"#64748b",lineHeight:1.65}}>Each liter of gasoline burned produces 2.31 kg of CO2. At 10% EV fleet share ({tenPct.evM}M motorcycles), approximately {tenPct.dp} billion liters of gasoline are no longer burned annually — preventing {co2_million} million tons of CO2 from entering the atmosphere every year.</div>
              </div>
            </div>
            <div style={{borderRadius:20,overflow:"hidden",background:"#fff",border:"1px solid #bbf7d0"}}>
              <div style={{height:180,padding:16}}><TreeSVG/></div>
              <div style={{padding:"8px 28px 32px"}}>
                <div style={{fontSize:52,fontWeight:800,color:"#15803d",fontFamily:"'Space Mono',monospace",lineHeight:1}}>{treesMillions}M</div>
                <div style={{fontSize:14,fontWeight:700,color:"#0f172a",marginTop:8,marginBottom:10}}>Trees Equivalent Planted per Year</div>
                <div style={{fontSize:13,color:"#64748b",lineHeight:1.65}}>A mature tree absorbs approximately 22 kg of CO2 per year. The CO2 reduction from 10% EV adoption is equivalent to planting {treesMillions} million mature trees — roughly {Math.round(parseFloat(treesMillions)*10)/10}x the total trees in Jakarta's entire urban forest. Every year, automatically, as long as the EVs are on the road.</div>
              </div>
            </div>
          </div>
          <div {...an("env",0.4)} style={{textAlign:"center",marginTop:48,padding:"28px 36px",borderRadius:16,background:"#fff",border:"1px solid #bbf7d0",maxWidth:720,margin:"48px auto 0"}}>
            <div style={{fontSize:17,color:"#334155",lineHeight:1.75}}>This is not a one-time benefit. Unlike tree planting, which takes decades to reach full absorption, <strong style={{color:"#15803d"}}>EV gasoline displacement delivers immediate, compounding, and permanent emission reductions</strong> — every year the motorcycles are on the road.</div>
          </div>
        </div>
      </section>

      {/* ═══ POLICY BRIEF — ENHANCED ═══ */}
      <section ref={rf("pol")} style={{padding:"100px 24px",background:"#f8fafc"}}>
        <div style={{maxWidth:840,margin:"0 auto"}}>
          <div {...an("pol")} style={{textAlign:"center",marginBottom:56}}>
            <div style={{fontSize:13,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:5,marginBottom:16}}>Auto-Generated</div>
            <h2 style={{fontSize:"clamp(28px,4.5vw,48px)",fontWeight:800,lineHeight:1.08,color:"#0f172a",letterSpacing:-1.5}}>Policy Brief</h2>
            <p style={{fontSize:14,color:"#94a3b8",marginTop:12}}>Brent ${inp.brent}/bbl · IDR {inp.usdIdr.toLocaleString()} · {inp.passThrough}% pass-through · {inp.evFleetPct}% EV · {inp.timeHorizon}Y</p>
          </div>
          <div {...an("pol",0.1)}>
            {/* Assessment */}
            <div style={{padding:"32px",borderRadius:20,border:`1.5px solid ${sc}33`,background:sbg,marginBottom:20}}>
              <div style={{fontSize:11,color:"#94a3b8",textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>Situation Assessment</div>
              <div style={{fontSize:18,color:"#0f172a",lineHeight:1.7,fontWeight:500}}>{pol.hl}</div>
            </div>

            {/* 1st Order */}
            <div style={{padding:"32px",borderRadius:20,border:"1px solid #e2e8f0",background:"#fff",marginBottom:20}}>
              <div style={{fontSize:11,color:"#dc2626",textTransform:"uppercase",letterSpacing:2,marginBottom:16,fontWeight:700}}>1st Order Impact — Direct Economic</div>
              {pol.first.map((t,i) => (
                <div key={i} style={{display:"flex",gap:12,marginBottom:14,alignItems:"flex-start"}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:"#dc2626",marginTop:7,flexShrink:0}}/>
                  <div style={{fontSize:14,color:"#334155",lineHeight:1.7}}>{t}</div>
                </div>
              ))}
            </div>

            {/* 2nd Order */}
            <div style={{padding:"32px",borderRadius:20,border:"1px solid #fde68a",background:"#fffbeb",marginBottom:20}}>
              <div style={{fontSize:11,color:"#92400e",textTransform:"uppercase",letterSpacing:2,marginBottom:16,fontWeight:700}}>2nd Order Impact — Social & Political</div>
              {pol.second.map((t,i) => (
                <div key={i} style={{display:"flex",gap:12,marginBottom:14,alignItems:"flex-start"}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:"#d97706",marginTop:7,flexShrink:0}}/>
                  <div style={{fontSize:14,color:"#334155",lineHeight:1.7}}>{t}</div>
                </div>
              ))}
            </div>

            {/* Why Now */}
            <div style={{padding:"32px",borderRadius:20,border:"1px solid #bfdbfe",background:"#eff6ff",marginBottom:20}}>
              <div style={{fontSize:11,color:"#1d4ed8",textTransform:"uppercase",letterSpacing:2,marginBottom:16,fontWeight:700}}>Why Now — The Urgency of Acting Today</div>
              {pol.whyNow.map((t,i) => (
                <div key={i} style={{display:"flex",gap:12,marginBottom:14,alignItems:"flex-start"}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:"#2563eb",marginTop:7,flexShrink:0}}/>
                  <div style={{fontSize:14,color:"#334155",lineHeight:1.7}}>{t}</div>
                </div>
              ))}
            </div>

            {/* What If Not */}
            <div style={{padding:"32px",borderRadius:20,border:"1px solid #1e293b",background:"#0f172a",marginBottom:20}}>
              <div style={{fontSize:11,color:"#f87171",textTransform:"uppercase",letterSpacing:2,marginBottom:16,fontWeight:700}}>What If Not — The Cost of Inaction</div>
              {pol.whatIfNot.map((t,i) => (
                <div key={i} style={{display:"flex",gap:12,marginBottom:14,alignItems:"flex-start"}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:"#ef4444",marginTop:7,flexShrink:0}}/>
                  <div style={{fontSize:14,color:"#cbd5e1",lineHeight:1.7}}>{t}</div>
                </div>
              ))}
            </div>

            {/* Recommendations */}
            <div style={{padding:"32px",borderRadius:20,border:"1px solid #e2e8f0",background:"#fff",marginBottom:20}}>
              <div style={{fontSize:11,color:"#94a3b8",textTransform:"uppercase",letterSpacing:2,marginBottom:16}}>Recommended Actions</div>
              {pol.rc.map((r,i)=>(<div key={i} style={{display:"flex",gap:14,marginBottom:16,alignItems:"flex-start"}}><div style={{width:28,height:28,borderRadius:"50%",background:"#f1f5f9",color:"#0f172a",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</div><div style={{fontSize:15,color:"#334155",lineHeight:1.65}}>{r}</div></div>))}
            </div>

            <div style={{padding:"20px 24px",borderRadius:12,background:"#fffbeb",border:"1px solid #fde68a"}}>
              <div style={{fontSize:12,fontWeight:600,color:"#92400e",marginBottom:4}}>Confidence Note</div>
              <div style={{fontSize:12,color:"#78716c",lineHeight:1.6}}>Based on simplified macro-accounting model. Directionally reliable, not a precise forecast. Key uncertainties: avg km/year per motorcycle (6,000–10,000), Pertamina compensation formula, EV adoption trajectory. CO2 calculations use IPCC standard gasoline emission factor of 2.31 kg CO2/liter. Tree absorption estimate uses average of 22 kg CO2/year per mature tree.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ METHODOLOGY ═══ */}
      <section ref={rf("me")} style={{padding:"100px 24px"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <div {...an("me")} style={{textAlign:"center",marginBottom:56}}><div style={{fontSize:13,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:5,marginBottom:16}}>Transparency</div><h2 style={{fontSize:"clamp(28px,4.5vw,44px)",fontWeight:800,lineHeight:1.08,color:"#0f172a",letterSpacing:-1}}>How this works.</h2></div>
          {[["Transmission Logic","Global oil price \u2192 landed fuel cost (via FX) \u2192 subsidy gap \u2192 fiscal burden \u2192 trade deficit \u2192 inflation (if pass-through) \u2192 FX pressure. EVs reduce gasoline volume through the entire chain."],
            ["Key Assumptions","Crack spread: USD 10/bbl. Freight: 5%. 159 L/barrel. Pertalite retail: IDR 10,000/L. Subsidized volume: ~30 Bn L/yr. Net imports: ~300,000 bpd. CPI fuel weight: 4%. Fleet: 130M. GDP: ~USD 1,400 Bn. CO2 per liter gasoline: 2.31 kg (IPCC). Tree CO2 absorption: 22 kg/year (EPA average)."],
            ["Data Sources","Bank Indonesia \u00B7 Ministry of Finance (APBN) \u00B7 BPS \u00B7 ESDM \u00B7 IEA \u00B7 World Bank \u00B7 IISD (2026) \u00B7 Pertamina \u00B7 ICCT (2025) \u00B7 AISI \u00B7 IPCC Emission Factors"],
            ["Limitations","Does not model GDP growth, endogenous FX, BI monetary reaction, provincial variation, grid constraints, battery import offset, or air quality health benefits (which would make the EV case even stronger)."]
          ].map(([t,d],i)=>(<div key={i} {...an("me",i*0.08)} style={{padding:"24px 28px",borderRadius:16,border:"1px solid #e2e8f0",background:"#fafafa",marginBottom:14}}><div style={{fontSize:15,fontWeight:700,color:"#0f172a",marginBottom:8}}>{t}</div><div style={{fontSize:14,color:"#64748b",lineHeight:1.7}}>{d}</div></div>))}
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{padding:"80px 24px 48px",borderTop:"1px solid #e2e8f0",background:"#f8fafc"}}>
        <div style={{maxWidth:700,margin:"0 auto",textAlign:"center"}}>
          <div style={{fontSize:15,fontWeight:700,color:"#0f172a",marginBottom:12}}>Indonesia Oil-Macro-EV Simulator</div>
          <div style={{fontSize:13,color:"#64748b",lineHeight:1.9,marginBottom:24}}>
            Sources: Bank Indonesia · Ministry of Finance · BPS · ESDM · IEA · World Bank · IISD · ICCT · IPCC
          </div>

          <div style={{padding:"24px 28px",borderRadius:16,background:"#fff",border:"1px solid #e2e8f0",marginBottom:24,textAlign:"left"}}>
            <div style={{fontSize:13,color:"#475569",lineHeight:1.8,fontStyle:"italic"}}>
              This simulation uses various research sources combined with simplifying assumptions to make complex macroeconomic relationships accessible and explorable. It is not intended as a definitive conclusion — rather, it is an <strong style={{fontStyle:"normal"}}>invitation to think</strong> about what makes sense and what doesn't, what matters most and what deserves closer examination. The model is imperfect, as all models are. I would be genuinely happy if others find ways to improve it, challenge its assumptions, or build upon it. The goal was never perfection — it was to start a more informed conversation about Indonesia's oil vulnerability and the macro case for EV adoption.
            </div>
          </div>

          <div style={{padding:"24px 28px",borderRadius:16,background:"#0f172a",color:"#fff",textAlign:"center"}}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:8}}>Created by Gunawan Panjaitan</div>
            <div style={{fontSize:13,color:"#94a3b8",marginBottom:4}}>An EV enthusiast exploring the intersection of energy economics and Indonesia's future.</div>
            <div style={{fontSize:13,color:"#64748b",marginTop:12,lineHeight:1.8}}>
              <span style={{marginRight:16}}>✉ <a href="mailto:gunawan_pnjaitan@yahoo.co.id" style={{color:"#38bdf8",textDecoration:"none"}}>gunawan_pnjaitan@yahoo.co.id</a></span>
              <span>in <a href="https://www.linkedin.com/in/gunawan-panjaitan/" target="_blank" rel="noopener noreferrer" style={{color:"#38bdf8",textDecoration:"none"}}>Gunawan Panjaitan</a></span>
            </div>
          </div>

          <div style={{fontSize:11,color:"#94a3b8",marginTop:24}}>All estimates are provisional and should be validated before policy use. © 2026</div>
        </div>
      </footer>

      {/* ═══ AI CHATBOT ═══ */}
      <ChatBot currentScenario={inp} currentResults={res} />
    </div>
  );
}

/* ═══ AI CHATBOT COMPONENT ═══ */
function ChatBot({ currentScenario, currentResults }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm the Indonesia Macro-EV assistant. Ask me anything about the simulation — how the model works, what the results mean, the methodology, EV impact, or policy implications. I have full context of your current scenario settings." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEnd = useRef(null);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const systemPrompt = `You are an expert assistant embedded in the Indonesia Oil-Macro-EV Simulator dashboard. You help users understand:
- How the simulation model works (transmission chain from oil price to macro outcomes)
- What the current results mean and their implications
- The methodology, assumptions, and limitations
- How EV 2-wheelers provide macro resilience
- Policy implications for Indonesia
- Data sources and confidence levels

CURRENT SCENARIO the user is viewing:
- Brent crude: USD ${currentScenario.brent}/bbl
- USD/IDR rate: ${currentScenario.usdIdr}
- Fuel pass-through: ${currentScenario.passThrough}%
- EV fleet share: ${currentScenario.evFleetPct}% (~${Math.round(currentScenario.evFleetPct * 1.3)}M of 130M motorcycles)
- Time horizon: ${currentScenario.timeHorizon} year(s)

CURRENT RESULTS:
- Overall macro stress: ${currentResults.ov}/10
- Subsidy burden: IDR ${currentResults.sb} trillion/year (${currentResults.sc > 0 ? '+' : ''}${currentResults.sc} vs base)
- Oil import bill: USD ${currentResults.ni} billion/year
- Inflation impact: +${currentResults.ct} pp CPI
- Current account impact: ${currentResults.cp > 0 ? '+' : ''}${currentResults.cp} pp GDP
- EV gasoline displaced: ${currentResults.dp} billion liters/year
- EV avoided imports: USD ${currentResults.ai} billion/year
- EV avoided subsidy: IDR ${currentResults.as2} trillion/year
- CO2 reduced: ${currentResults.co2.toLocaleString()} tons/year

KEY MODEL ASSUMPTIONS:
- Crack spread: USD 10/bbl, Freight: 5%, 159 L/barrel conversion
- Pertalite retail: IDR 10,000/L, Subsidized volume: ~30 Bn L/yr
- Net oil imports: ~300,000 bpd, CPI fuel weight: 4%
- Motorcycle fleet: 130M, GDP: ~USD 1,400 Bn
- CO2 per liter gasoline: 2.31 kg (IPCC), Tree absorption: 22 kg/yr (EPA)

Be concise, clear, and Indonesia-specific. If asked about limitations, be honest. This model is directionally reliable but uses simplified assumptions. Created by Gunawan Panjaitan, an EV enthusiast.`;

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const apiMessages = newMessages
        .filter(m => m.role !== "system")
        .map(m => ({ role: m.role, content: m.content }));

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: apiMessages
        })
      });

      const data = await response.json();
      const assistantText = data.content
        ?.filter(item => item.type === "text")
        .map(item => item.text)
        .join("\n") || "Sorry, I couldn't process that. Please try again.";

      setMessages(prev => [...prev, { role: "assistant", content: assistantText }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "I'm having trouble connecting right now. Please try again in a moment." }]);
    }
    setLoading(false);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{
        position: "fixed", bottom: 24, right: 24, width: 60, height: 60, borderRadius: "50%",
        background: "#0f172a", color: "#fff", border: "none", cursor: "pointer",
        boxShadow: "0 4px 20px rgba(0,0,0,0.25)", fontSize: 24, display: "flex",
        alignItems: "center", justifyContent: "center", zIndex: 9999,
        transition: "transform 0.2s"
      }}
        onMouseEnter={e => e.target.style.transform = "scale(1.1)"}
        onMouseLeave={e => e.target.style.transform = "scale(1)"}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </button>
    );
  }

  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, width: 400, height: 540,
      background: "#fff", borderRadius: 20, boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
      display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 9999,
      border: "1px solid #e2e8f0"
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px", background: "#0f172a", color: "#fff",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Ask the Simulator</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>Powered by Claude AI</div>
        </div>
        <button onClick={() => setOpen(false)} style={{
          background: "none", border: "none", color: "#94a3b8", fontSize: 20,
          cursor: "pointer", padding: "4px 8px", borderRadius: 6
        }}>✕</button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "16px",
        display: "flex", flexDirection: "column", gap: 12
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "85%",
            padding: "10px 14px",
            borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
            background: m.role === "user" ? "#0f172a" : "#f1f5f9",
            color: m.role === "user" ? "#fff" : "#334155",
            fontSize: 13, lineHeight: 1.6,
            whiteSpace: "pre-wrap"
          }}>
            {m.content}
          </div>
        ))}
        {loading && (
          <div style={{
            alignSelf: "flex-start", padding: "10px 14px", borderRadius: "16px 16px 16px 4px",
            background: "#f1f5f9", color: "#94a3b8", fontSize: 13
          }}>
            Thinking...
          </div>
        )}
        <div ref={chatEnd} />
      </div>

      {/* Input */}
      <div style={{
        padding: "12px 16px", borderTop: "1px solid #e2e8f0",
        display: "flex", gap: 8
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Ask about the model, results, or policy..."
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 12,
            border: "1px solid #e2e8f0", fontSize: 13, outline: "none",
            fontFamily: "inherit"
          }}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()} style={{
          padding: "10px 16px", borderRadius: 12, background: "#0f172a",
          color: "#fff", border: "none", fontSize: 13, fontWeight: 600,
          cursor: loading ? "default" : "pointer", opacity: loading ? 0.5 : 1
        }}>
          Send
        </button>
      </div>
    </div>
  );
}
