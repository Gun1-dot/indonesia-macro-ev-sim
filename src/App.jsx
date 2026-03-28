import { useState, useEffect, useCallback, useMemo, useRef } from "react";

/* ═══ SIMULATION ENGINE ═══ */
function simulate(inp) {
  const { brent, usdIdr, passThrough, evFleetPct, timeHorizon, avgKmPerBike, subsidyIntensity } = inp;
  const BB=75,BI=15800,CR=10,FR=0.05,RT=10000,VL=30,IB=300000,MT=130,GDP=1400,FK=0.025,CW=0.04,CM=0.7,PB=80;
  const ld=((brent+CR)/159)*(1+FR)*usdIdr, bld=((BB+CR)/159)*(1+FR)*BI;
  const er=RT+(passThrough/100)*Math.max(0,ld-RT), gp=Math.max(0,ld-er), bg=Math.max(0,bld-RT);
  const eu=(evFleetPct/100)*MT*1e6, dp=(eu*avgKmPerBike*FK)/1e9, ev=Math.max(0,VL-dp);
  const sb=(gp*ev*1e9)/1e12*subsidyIntensity, bs=(bg*VL*1e9)/1e12, sc2=sb-bs;
  const fp=(sc2*1e12/(GDP*1e9*usdIdr))*100;
  const ib=(IB*365*(brent+CR))/1e9, bi2=(IB*365*(BB+CR))/1e9;
  const ai=(dp*1e9*(brent+CR)/159)/1e9, ni=ib-ai, td=ni-bi2, cp=(td/GDP)*100;
  const fc=((er-RT)/RT)*100, cd=CW*(fc/100)*100, ct=cd*(1+CM);
  const fx=Math.min(10,Math.max(0,((usdIdr-BI)/BI)*30+(td/5)*2+((brent-BB)/BB)*5));
  const as2=(gp*dp*1e9)/1e12;
  const co2=(dp*1e9*2.31)/1000;
  const st={fiscal:Math.min(10,Math.max(0,(sb/100)*3+fp*5)),external:Math.min(10,Math.max(0,(td/3)*2+cp*10)),inflation:Math.min(10,Math.max(0,ct*2)),fx};
  const hm=timeHorizon<=1?1:timeHorizon<=3?0.85:0.7;
  const ov=(st.fiscal*0.3+st.external*0.25+st.inflation*0.25+st.fx*0.2)*hm;
  return{ld:Math.round(ld),er:Math.round(er),gp:Math.round(gp),sb:+(sb).toFixed(1),sc:+(sc2).toFixed(1),fp:+(fp).toFixed(2),ni:+(ni).toFixed(1),td:+(td).toFixed(1),cp:+(cp).toFixed(2),fc:+(fc).toFixed(1),ct:+(ct).toFixed(2),fx:+(fx).toFixed(1),dp:+(dp).toFixed(2),ai:+(ai).toFixed(2),as2:+(as2).toFixed(1),evM:+(eu/1e6).toFixed(1),co2:Math.round(co2),st,ov:+(ov).toFixed(1)};
}

/* ═══ POLICY ENGINE ═══ */
function genPol(r,inp){
  const e=Object.entries(r.st).sort((a,b)=>b[1]-a[1]);
  const nm={fiscal:"Fiscal",external:"External",inflation:"Inflation",fx:"Exchange Rate"};
  const sv=r.ov>7?"severe":r.ov>5?"significant":r.ov>3?"moderate":"manageable";
  let hl=r.ov<=2?`Indonesia\u2019s macro position is stable at USD ${inp.brent}/bbl. No material stress.`:r.ov<=4?`${sv.charAt(0).toUpperCase()+sv.slice(1)} pressure through the ${nm[e[0][0]].toLowerCase()} channel.`:r.ov<=6?`Significant stress across ${nm[e[0][0]].toLowerCase()} and ${nm[e[1][0]].toLowerCase()} channels. Intervention advisable.`:`Warning: Severe macro stress. Coordinated response required.`;
  let first=[];
  if(r.st.fiscal>3)first.push("Fuel subsidy burden consumes fiscal space meant for infrastructure, health, and education.");
  if(r.st.inflation>2)first.push(`Consumer prices rise ~${r.ct}pp, eroding purchasing power of 280M Indonesians.`);
  if(r.st.external>3)first.push("Widening oil trade deficit drains FX reserves and raises investor risk perception.");
  if(r.st.fx>3)first.push("Rupiah depreciation makes all imports costlier \u2014 fuel, food, medicine \u2014 compounding the shock.");
  if(!first.length)first.push("Direct economic impacts remain contained.");
  let second=[];
  if(r.st.inflation>3&&inp.passThrough>30){second.push("Rising prices risk public protests \u2014 Indonesia has history of unrest following fuel hikes (1998, 2005, 2013, 2022).");second.push("Ojol drivers, vendors, farmers hit hardest \u2014 10-30% transport cost rise can push households below poverty line.");}
  if(r.st.fiscal>4){second.push("Subsidy crowding-out: delayed infrastructure, frozen hiring, reduced healthcare/education.");second.push("Political trap: backlash for raising prices AND for not building roads. No cost-free option.");}
  if(r.st.fx>4)second.push("Weakening rupiah erodes public confidence, dominates media, shapes voter sentiment.");
  if(r.ov>5)second.push("Sustained stress slows FDI, weakens job creation, risks turning demographic dividend into liability.");
  if(!second.length)second.push("Social and political risks remain low.");
  let whyNow=["Oil dependence is structural: production fell from 1.6M bpd (1990s) to <600K. Vulnerability deepens annually."];
  if(inp.brent>85)whyNow.push(`At $${inp.brent}/bbl, every month of delay = ~IDR ${Math.round(r.sb/12*10)/10}T in subsidy obligations.`);
  whyNow.push("Global EV race accelerating. Countries moving early lock in manufacturing. Delay = importing EVs instead of building them.");
  whyNow.push("Indonesia\u2019s 2030 demographic window: wasting fiscal space on subsidies = failing to invest in human capital.");
  let whatIfNot=[];
  if(r.ov>3){whatIfNot.push("Without action, import bill grows, subsidy expands, oil sensitivity increases \u2014 not decreases.");whatIfNot.push("130M motorcycles burning 25-30B liters/year of imported gasoline. A permanent, compounding drain.");}
  if(r.st.fiscal>4)whatIfNot.push("Risk of repeat 2013-14 crisis: energy subsidies consumed 20%+ of budget, forced emergency austerity.");
  whatIfNot.push("Inaction is not stasis \u2014 it is structural decline. Vietnam, India, Thailand are moving. Standing still = falling behind.");
  let rc=[];
  if(r.st.fiscal>4&&inp.passThrough<50)rc.push("Partial fuel price pass-through + targeted cash transfers (BLT) to protect vulnerable households");
  if(r.st.fiscal>3)rc.push("Reprioritize spending: protect infrastructure, health, education from subsidy crowding-out");
  if(r.st.inflation>3)rc.push("Coordinate with Bank Indonesia on inflation management");
  if(r.st.external>4)rc.push("Strengthen FX reserves; activate bilateral swap arrangements");
  if(inp.evFleetPct<5&&inp.brent>85)rc.push("Accelerate EV 2W incentives \u2014 macro resilience peaks during high oil");
  if(inp.evFleetPct>=5)rc.push("Sustain EV momentum; extend to ride-hailing and delivery segments");
  rc.push("Ensure APBN-P revision preparedness for Pertamina compensation");
  return{hl,sv,top:nm[e[0][0]],rc,first,second,whyNow,whatIfNot};
}

const PR=[
  {n:"Base Case",d:"Current conditions",b:75,u:15800,p:15,e:0.2,t:1,k:8000,s:1},
  {n:"Oil Shock",d:"Brent $110",b:110,u:16200,p:15,e:0.2,t:1,k:8000,s:1},
  {n:"Double Hit",d:"Oil + weak IDR",b:110,u:17500,p:10,e:0.2,t:1,k:8000,s:1},
  {n:"Reform Path",d:"Pass-through + EV",b:100,u:16000,p:50,e:3,t:3,k:8000,s:1},
  {n:"EV Future",d:"12% EV fleet",b:95,u:16000,p:30,e:12,t:5,k:8000,s:1},
];

// Image paths (from public/images/ folder)
const IMG = {
  hero: "/images/hero-ev.jpg",
  oil: "/images/oil-refinery.jpg",
  traffic: "/images/motorcycle-traffic.jpg",
  skyline: "/images/jakarta-skyline.jpg",
};

/* ═══ HOOKS ═══ */
function useLiveCounter(ps){const[c,sc]=useState(0);useEffect(()=>{const i=setInterval(()=>sc(v=>v+ps),100);return()=>clearInterval(i);},[ps]);return c;}
function useW(){const[w,sw]=useState(1200);useEffect(()=>{sw(window.innerWidth);const h=()=>sw(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);return w;}
function useCounter(target,active){const[v,sv]=useState(0);useEffect(()=>{if(!active)return;let s=0;const d=Math.max(10,2000/Math.max(1,target));const i=setInterval(()=>{s+=target/Math.ceil(2000/d);if(s>=target){sv(target);clearInterval(i);}else sv(Math.round(s*10)/10);},d);return()=>clearInterval(i);},[target,active]);return v;}

/* ═══ MAIN ═══ */
export default function App(){
  const[inp,si]=useState({brent:75,usdIdr:15800,passThrough:15,evFleetPct:0.2,timeHorizon:1,avgKmPerBike:8000,subsidyIntensity:1});
  const[pr,spr]=useState(0);
  const[vis,sv]=useState({});
  const[loaded,setLoaded]=useState(false);
  const[scrollPct,setScrollPct]=useState(0);
  const[compareMode,setCmp]=useState(false);
  const[compareIdx,setCmpIdx]=useState(1);
  const refs=useRef({});
  const W=useW();
  const M=W<768;
  const counter=useLiveCounter(93.8);

  useEffect(()=>{setTimeout(()=>setLoaded(true),1000);},[]);
  useEffect(()=>{const h=()=>{const d=document.documentElement;setScrollPct(d.scrollTop/(d.scrollHeight-d.clientHeight)*100);};window.addEventListener("scroll",h);return()=>window.removeEventListener("scroll",h);},[]);

  const set=useCallback((k,v)=>{si(p=>({...p,[k]:v}));spr(-1);},[]);
  const aply=useCallback(i=>{const p=PR[i];si({brent:p.b,usdIdr:p.u,passThrough:p.p,evFleetPct:p.e,timeHorizon:p.t,avgKmPerBike:p.k,subsidyIntensity:p.s});spr(i);},[]);

  const res=useMemo(()=>simulate(inp),[inp]);
  const pol=useMemo(()=>genPol(res,inp),[res,inp]);
  const cmpRes=useMemo(()=>{const p=PR[compareIdx];return simulate({brent:p.b,usdIdr:p.u,passThrough:p.p,evFleetPct:p.e,timeHorizon:p.t,avgKmPerBike:p.k,subsidyIntensity:p.s});},[compareIdx]);
  const tenPct=useMemo(()=>simulate({...inp,evFleetPct:10}),[inp]);
  const sav=tenPct.as2, hospitals=Math.round(sav/0.3), schools=Math.round(sav/0.015), tollKm=Math.round(sav/0.25);
  const co2M=(tenPct.co2/1e6).toFixed(2), treesM=(Math.round(tenPct.co2/0.022)/1e6).toFixed(1);

  const takeaway=res.ov<=2?"No immediate action required. Indonesia can absorb current oil prices.":res.sc>20?`Indonesia spends an additional IDR ${res.sc}T/year on fuel subsidies \u2014 equivalent to ${Math.round(res.sc/0.3)} hospitals that will never be built.`:res.td>3?`Oil import bill increases USD ${res.td}B/year \u2014 money leaving Indonesia that could fund domestic infrastructure and jobs.`:`Moderate pressure building: +IDR ${res.sc}T subsidy, +USD ${res.td}B imports. Manageable today, compounds if oil stays elevated.`;

  useEffect(()=>{
    const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)sv(p=>({...p,[e.target.dataset.s]:true}));});},{threshold:0.08});
    Object.values(refs.current).forEach(el=>{if(el)obs.observe(el);});
    return()=>obs.disconnect();
  },[]);

  const rf=id=>el=>{if(el){el.dataset.s=id;refs.current[id]=el;}};
  const an=(id,d=0)=>({style:{opacity:vis[id]?1:0,transform:vis[id]?"translateY(0)":"translateY(36px)",transition:`opacity 0.9s ease ${d}s, transform 0.9s ease ${d}s`}});

  const sc2=res.ov<=2.5?"#16a34a":res.ov<=5?"#b45309":res.ov<=7.5?"#c2410c":"#991b1b";
  const sl=res.ov<=2.5?"LOW":res.ov<=5?"MODERATE":res.ov<=7.5?"HIGH":"SEVERE";
  const sbg2=res.ov<=2.5?"#f0fdf4":res.ov<=5?"#fef9ee":res.ov<=7.5?"#fef3ec":"#fef2f2";

  // Design tokens — vintage-futuristic
  const T = {
    bg: "#faf8f3",       // warm cream
    bg2: "#f5f0e8",      // parchment
    ink: "#1a1a2e",      // deep ink
    ink2: "#2d2d44",     // softer ink
    muted: "#8b8680",    // warm gray
    muted2: "#b5afa6",   // lighter warm gray
    border: "#e0dbd2",   // warm border
    accent: "#06b6d4",   // electric teal
    accent2: "#0e7490",  // deeper teal
    amber: "#b45309",
    red: "#991b1b",
    green: "#166534",
    ev: "#06d6a0",       // electric green
    card: "#fffdf7",     // card white
  };

  function Sl({label,value,onChange,min,max,step,unit,sub}){
    const pc=((value-min)/(max-min))*100;
    return(<div style={{marginBottom:24}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}><span style={{fontSize:13,fontWeight:500,color:T.ink2,fontFamily:"'DM Serif Text',serif"}}>{label}</span><span style={{fontSize:17,fontWeight:700,color:T.ink,fontFamily:"'Space Mono',monospace"}}>{typeof value==="number"?value.toLocaleString():value}{unit}</span></div><input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(parseFloat(e.target.value))} style={{width:"100%",height:5,appearance:"none",background:`linear-gradient(to right,${T.accent} 0%,${T.accent} ${pc}%,${T.border} ${pc}%,${T.border} 100%)`,borderRadius:3,outline:"none",cursor:"pointer"}}/><div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.muted2,marginTop:4}}><span>{min}{unit}</span><span>{max}{unit}</span></div>{sub&&<div style={{fontSize:11,color:T.muted,marginTop:4}}>{sub}</div>}</div>);
  }
  function PBar({label,value}){const pc=Math.min(100,(value/10)*100);const c=value<=2.5?T.green:value<=5?T.amber:value<=7.5?"#c2410c":T.red;return(<div style={{marginBottom:16}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:13,color:T.ink2}}>{label}</span><span style={{fontSize:13,fontWeight:700,color:c,fontFamily:"'Space Mono',monospace"}}>{(Math.round(value*10)/10).toFixed(1)}</span></div><div style={{height:8,background:T.border,borderRadius:4,overflow:"hidden"}}><div style={{width:`${pc}%`,height:"100%",background:c,borderRadius:4,transition:"width 0.8s cubic-bezier(.4,0,.2,1)"}}/></div></div>);}
  function Met({label,value,unit,note,good}){return(<div style={{padding:M?"18px":"24px 28px",borderRadius:14,background:T.card,border:`1px solid ${T.border}`,boxShadow:"0 1px 3px rgba(26,26,46,0.04)"}}><div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8,fontFamily:"'Space Mono',monospace"}}>{label}</div><div style={{fontSize:M?24:32,fontWeight:700,color:T.ink,fontFamily:"'Space Mono',monospace",lineHeight:1.1}}>{value}</div><div style={{fontSize:11,color:T.muted,marginTop:4}}>{unit}</div>{note&&<div style={{fontSize:11,color:good?T.green:T.red,fontWeight:600,marginTop:6}}>{note}</div>}</div>);}

  // Loading
  if(!loaded)return(
    <div style={{height:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:T.bg,fontFamily:"'DM Serif Text',serif"}}>
      <div style={{fontSize:28,fontWeight:400,color:T.ink,letterSpacing:-0.5,marginBottom:8}}>Indonesia Macro-EV</div>
      <div style={{fontSize:13,color:T.muted,fontFamily:"'Space Mono',monospace",marginBottom:24}}>Loading simulation engine...</div>
      <div style={{width:40,height:40,border:`2px solid ${T.border}`,borderTop:`2px solid ${T.accent}`,borderRadius:"50%",animation:"spin 0.9s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Text:ital@0;1&family=Space+Mono:wght@400;700&family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
    </div>
  );

  return(
    <div style={{background:T.bg,color:T.ink,fontFamily:"'Instrument Sans',-apple-system,sans-serif",overflowX:"hidden",position:"relative"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Text:ital@0;1&family=Space+Mono:wght@400;700&family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:${T.accent};cursor:pointer;border:3px solid ${T.bg};box-shadow:0 2px 8px rgba(6,182,212,0.3)}
        input[type=range]::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:${T.accent};cursor:pointer;border:3px solid ${T.bg}}
        *{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}
        .grain{position:relative}.grain::before{content:'';position:absolute;inset:0;opacity:0.03;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");pointer-events:none;z-index:1}
      `}</style>

      {/* Scroll progress */}
      <div style={{position:"fixed",top:0,left:0,width:`${scrollPct}%`,height:3,background:`linear-gradient(90deg,${T.accent},${T.ev})`,zIndex:9999,transition:"width 0.1s"}}/>

      {/* ═══ HERO ═══ */}
      <section ref={rf("hero")} className="grain" style={{minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",textAlign:"center",padding:M?"40px 20px":"60px 24px",position:"relative",overflow:"hidden",background:`linear-gradient(180deg,${T.bg} 0%,${T.bg2} 100%)`}}>
        {/* Background image with fallback */}
        <div style={{position:"absolute",inset:0,backgroundImage:`url(${IMG.hero})`,backgroundSize:"cover",backgroundPosition:"center",opacity:0.08}}/>
        {/* Decorative circles */}
        <div style={{position:"absolute",top:M?"-10%":"-15%",right:M?"-20%":"-10%",width:M?400:600,height:M?400:600,borderRadius:"50%",border:`1px solid ${T.border}`,opacity:0.4}}/>
        <div style={{position:"absolute",bottom:M?"-10%":"-15%",left:M?"-20%":"-10%",width:M?350:500,height:M?350:500,borderRadius:"50%",border:`1px solid ${T.accent}33`,opacity:0.3}}/>

        <div style={{position:"relative",zIndex:2}} {...an("hero")}>
          <div style={{fontSize:11,fontWeight:600,color:T.muted,textTransform:"uppercase",letterSpacing:8,marginBottom:32,fontFamily:"'Space Mono',monospace"}}>Indonesia Macro Simulation</div>
          <h1 style={{fontSize:M?"34px":"clamp(44px,6.5vw,78px)",fontWeight:400,lineHeight:1.05,color:T.ink,maxWidth:850,letterSpacing:-2,fontFamily:"'DM Serif Text',serif"}}>
            How oil prices shape<br/><span style={{color:T.accent}}>Indonesia's</span> economy.
          </h1>
          <p style={{fontSize:M?14:18,color:T.muted,maxWidth:500,marginTop:28,lineHeight:1.7}}>An interactive decision-support tool for policy makers and investors. Simulate oil shocks. Discover how EV 2-wheelers build macro resilience.</p>

          {/* Live counter */}
          <div style={{marginTop:40,padding:"22px 36px",borderRadius:14,background:`${T.card}ee`,border:`1px solid ${T.border}`,backdropFilter:"blur(10px)",display:"inline-block",boxShadow:"0 4px 24px rgba(26,26,46,0.06)"}}>
            <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:3,marginBottom:8,fontFamily:"'Space Mono',monospace"}}>Since opening this page, Indonesia has spent</div>
            <div style={{fontSize:M?28:44,fontWeight:700,color:T.red,fontFamily:"'Space Mono',monospace",letterSpacing:-1}}>${Math.floor(counter).toLocaleString()}</div>
            <div style={{fontSize:11,color:T.muted2,fontFamily:"'Space Mono',monospace"}}>on oil imports (~$938/second)</div>
          </div>

          <div style={{marginTop:40,display:"flex",gap:14,flexWrap:"wrap",justifyContent:"center"}}>
            <button onClick={()=>document.getElementById("sim")?.scrollIntoView({behavior:"smooth"})} style={{padding:"15px 40px",borderRadius:6,background:T.ink,color:T.bg,fontSize:14,fontWeight:600,border:"none",cursor:"pointer",letterSpacing:0.5}}>Start Simulation</button>
            <button onClick={()=>document.getElementById("why")?.scrollIntoView({behavior:"smooth"})} style={{padding:"15px 40px",borderRadius:6,background:"transparent",color:T.ink,fontSize:14,fontWeight:600,border:`1.5px solid ${T.border}`,cursor:"pointer"}}>Learn More</button>
          </div>
        </div>
      </section>

      {/* ═══ THE CHALLENGE ═══ */}
      <section id="why" ref={rf("why")} className="grain" style={{padding:M?"80px 20px":"120px 24px",maxWidth:1140,margin:"0 auto"}}>
        <div {...an("why")} style={{textAlign:"center",marginBottom:M?48:72}}>
          <div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:6,marginBottom:16,fontFamily:"'Space Mono',monospace"}}>The Challenge</div>
          <h2 style={{fontSize:M?"28px":"clamp(32px,5vw,56px)",fontWeight:400,lineHeight:1.1,color:T.ink,letterSpacing:-1,fontFamily:"'DM Serif Text',serif"}}>Indonesia imports more oil<br/>than it produces.</h2>
          <p style={{fontSize:M?14:17,color:T.muted,maxWidth:560,margin:"24px auto 0",lineHeight:1.75}}>Consuming 1.6 million barrels per day while producing only 580,000. Every dollar increase flows into the trade deficit, the subsidy budget, and the cost of living.</p>
        </div>
        <div {...an("why",0.2)} style={{display:"grid",gridTemplateColumns:M?"1fr":"repeat(3,1fr)",gap:20}}>
          {[{n:"1.6M",u:"barrels / day",d:"consumed \u2014 2.5x domestic production",bg:"linear-gradient(135deg,#1a1a2e,#2d2d44)"},{n:"IDR 713T",u:"energy subsidies 2024",d:"90% supporting fossil fuels \u2014 largest budget item",bg:"linear-gradient(135deg,#2d2d44,#1a1a2e)"},{n:"130M",u:"motorcycles",d:"world\u2019s 3rd largest fleet, 25-30% of gasoline",bg:`linear-gradient(135deg,${T.accent2},#0a3d4f)`}].map((c,i)=>(
            <div key={i} {...an("why",0.15+i*0.12)} style={{borderRadius:16,overflow:"hidden",border:`1px solid ${T.border}`,background:T.card,boxShadow:"0 2px 12px rgba(26,26,46,0.06)"}}>
              <div style={{height:120,background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
                {i===0&&<div style={{position:"absolute",inset:0,backgroundImage:`url(${IMG.oil})`,backgroundSize:"cover",backgroundPosition:"center",opacity:0.3}}/>}
                {i===2&&<div style={{position:"absolute",inset:0,backgroundImage:`url(${IMG.traffic})`,backgroundSize:"cover",backgroundPosition:"center",opacity:0.25}}/>}
                <span style={{fontSize:42,fontWeight:700,color:"#fff",fontFamily:"'Space Mono',monospace",position:"relative",zIndex:2,textShadow:"0 2px 12px rgba(0,0,0,0.4)"}}>{c.n}</span>
              </div>
              <div style={{padding:"16px 22px 24px"}}>
                <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:8,fontFamily:"'Space Mono',monospace"}}>{c.u}</div>
                <div style={{fontSize:13,color:T.ink2,lineHeight:1.6}}>{c.d}</div>
              </div>
            </div>))}
        </div>
      </section>

      {/* ═══ BIG STAT ═══ */}
      <section className="grain" style={{position:"relative",padding:M?"70px 20px":"100px 24px",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:T.ink}}/>
        <div style={{position:"absolute",inset:0,backgroundImage:`url(${IMG.oil})`,backgroundSize:"cover",backgroundPosition:"center",opacity:0.15}}/>
        <div ref={rf("stat")} style={{maxWidth:900,margin:"0 auto",textAlign:"center",position:"relative",zIndex:2}}>
          <div {...an("stat")}>
            <div style={{fontSize:M?"44px":"clamp(52px,9vw,96px)",fontWeight:700,color:"#fff",fontFamily:"'Space Mono',monospace",lineHeight:1,letterSpacing:-3}}>$29.6<span style={{color:T.accent}}>B</span></div>
            <div style={{width:60,height:2,background:T.accent,margin:"20px auto"}}/>
            <div style={{fontSize:M?15:19,color:"#ccc",maxWidth:550,margin:"0 auto",lineHeight:1.65,fontFamily:"'DM Serif Text',serif",fontStyle:"italic"}}>Indonesia's total oil and refined petroleum import bill in 2024 \u2014 money flowing out of the economy every single year.</div>
          </div>
        </div>
      </section>

      {/* ═══ TRANSMISSION ═══ */}
      <section ref={rf("chain")} className="grain" style={{padding:M?"80px 20px":"100px 24px",background:T.bg2,position:"relative"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:`url(${IMG.traffic})`,backgroundSize:"cover",backgroundPosition:"center",opacity:0.04}}/>
        <div style={{maxWidth:1000,margin:"0 auto",textAlign:"center",position:"relative",zIndex:2}}>
          <div {...an("chain")}><div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:6,marginBottom:16,fontFamily:"'Space Mono',monospace"}}>Transmission Chain</div><h2 style={{fontSize:M?"26px":"clamp(30px,4.5vw,50px)",fontWeight:400,lineHeight:1.1,letterSpacing:-1,marginBottom:48,fontFamily:"'DM Serif Text',serif",color:T.ink}}>From barrel to household.</h2></div>
          <div {...an("chain",0.15)} style={{display:"grid",gridTemplateColumns:M?"1fr 1fr":"repeat(6,1fr)",gap:10}}>
            {[{s:"01",t:"Oil Price",d:"Brent moves",ic:"\uD83D\uDEE2\uFE0F"},{s:"02",t:"Landed Cost",d:"Price \u00D7 FX",ic:"\uD83D\uDCB1"},{s:"03",t:"Govt Decision",d:"Absorb / Pass",ic:"\uD83C\uDFDB\uFE0F"},{s:"04",t:"Fiscal / CPI",d:"Budget or prices",ic:"\u26A0\uFE0F"},{s:"05",t:"Macro Ripple",d:"Trade, IDR, rates",ic:"\uD83C\uDF0A"},{s:"06",t:"EV Offset",d:"Demand reduction",ic:"\u26A1"}].map((c,i)=>(
              <div key={i} style={{padding:"20px 12px",borderRadius:12,background:T.card,border:`1px solid ${T.border}`,textAlign:"center",boxShadow:"0 1px 4px rgba(26,26,46,0.04)"}}><div style={{fontSize:24,marginBottom:6}}>{c.ic}</div><div style={{fontSize:9,color:T.muted,fontFamily:"'Space Mono',monospace",marginBottom:3}}>{c.s}</div><div style={{fontSize:13,fontWeight:600,color:T.ink,marginBottom:3}}>{c.t}</div><div style={{fontSize:10,color:T.muted,lineHeight:1.4}}>{c.d}</div></div>))}
          </div>
        </div>
      </section>

      {/* ═══ SIMULATION ═══ */}
      <section id="sim" ref={rf("sim")} className="grain" style={{padding:M?"80px 16px":"100px 24px",maxWidth:1200,margin:"0 auto"}}>
        <div {...an("sim")} style={{textAlign:"center",marginBottom:48}}>
          <div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:6,fontFamily:"'Space Mono',monospace",marginBottom:16}}>Interactive Simulation</div>
          <h2 style={{fontSize:M?"28px":"clamp(32px,5vw,54px)",fontWeight:400,lineHeight:1.08,color:T.ink,letterSpacing:-1,fontFamily:"'DM Serif Text',serif"}}>Adjust. Simulate. <span style={{color:T.accent}}>Understand.</span></h2>
        </div>

        {/* Presets */}
        <div {...an("sim",0.1)} style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",marginBottom:36}}>
          {PR.map((p,i)=>(<button key={i} onClick={()=>aply(i)} style={{padding:"9px 18px",borderRadius:6,border:pr===i?`2px solid ${T.ink}`:`1px solid ${T.border}`,background:pr===i?T.ink:T.card,color:pr===i?T.bg:T.muted,fontSize:12,fontWeight:600,cursor:"pointer",transition:"all 0.2s",fontFamily:"'Space Mono',monospace"}}>{p.n}</button>))}
          <button onClick={()=>setCmp(!compareMode)} style={{padding:"9px 18px",borderRadius:6,border:compareMode?`2px solid ${T.accent}`:`1px solid ${T.border}`,background:compareMode?"#ecfeff":T.card,color:compareMode?T.accent2:T.muted,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Space Mono',monospace"}}>{compareMode?"\u2713 Compare":"Compare"}</button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:M?"1fr":"360px 1fr",gap:M?24:40,alignItems:"start"}}>
          {/* Controls */}
          <div {...an("sim",0.15)} style={{padding:M?"24px 20px":"28px 24px",borderRadius:16,border:`1px solid ${T.border}`,background:T.bg2,position:M?"relative":"sticky",top:24,boxShadow:"0 2px 12px rgba(26,26,46,0.04)"}}>
            <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:3,marginBottom:20,fontFamily:"'Space Mono',monospace"}}>Scenario Inputs</div>
            <Sl label="Brent Crude Oil" value={inp.brent} onChange={v=>set("brent",v)} min={40} max={150} step={5} unit=" $/bbl"/>
            <Sl label="USD/IDR Rate" value={inp.usdIdr} onChange={v=>set("usdIdr",v)} min={14000} max={19000} step={100} unit=""/>
            <Sl label="Pass-Through" value={inp.passThrough} onChange={v=>set("passThrough",v)} min={0} max={100} step={5} unit="%" sub="0% = govt absorbs all"/>
            <Sl label="EV 2W Fleet" value={inp.evFleetPct} onChange={v=>set("evFleetPct",v)} min={0} max={20} step={0.5} unit="%" sub={`${Math.round(inp.evFleetPct*1.3)}M of 130M`}/>
            <div style={{marginBottom:12}}><div style={{fontSize:13,fontWeight:500,color:T.ink2,marginBottom:8,fontFamily:"'DM Serif Text',serif"}}>Time Horizon</div><div style={{display:"flex",gap:6}}>{[1,3,5].map(y=>(<button key={y} onClick={()=>set("timeHorizon",y)} style={{flex:1,padding:"9px",borderRadius:6,border:inp.timeHorizon===y?`2px solid ${T.accent}`:`1px solid ${T.border}`,background:inp.timeHorizon===y?T.accent:T.card,color:inp.timeHorizon===y?"#fff":T.muted,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Space Mono',monospace"}}>{y}Y</button>))}</div></div>
          </div>

          {/* Results */}
          <div>
            {/* Stress */}
            <div {...an("sim",0.2)} style={{padding:M?"32px 20px":"44px",borderRadius:20,background:sbg2,border:`1.5px solid ${sc2}22`,marginBottom:24,textAlign:"center",position:"relative",overflow:"hidden"}}>
              <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:3,marginBottom:12,fontFamily:"'Space Mono',monospace"}}>Macro Stress Level</div>
              <div style={{fontSize:M?60:88,fontWeight:700,color:sc2,fontFamily:"'Space Mono',monospace",lineHeight:1}}>{res.ov}</div>
              <div style={{fontSize:14,fontWeight:700,color:sc2,letterSpacing:5,marginTop:8,textTransform:"uppercase",fontFamily:"'Space Mono',monospace"}}>{sl}</div>
              <div style={{width:40,height:2,background:sc2,margin:"16px auto",opacity:0.4}}/>
              <div style={{fontSize:M?13:15,color:T.ink2,marginTop:12,maxWidth:480,margin:"12px auto 0",lineHeight:1.65}}>{pol.hl}</div>
            </div>

            {/* Key Takeaway */}
            <div {...an("sim",0.25)} style={{padding:"24px 28px",borderRadius:14,background:T.ink,marginBottom:24,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,width:4,height:"100%",background:T.accent}}/>
              <div style={{fontSize:10,color:T.accent,textTransform:"uppercase",letterSpacing:3,marginBottom:8,fontFamily:"'Space Mono',monospace"}}>What This Means</div>
              <div style={{fontSize:M?14:16,color:"#e0dbd2",lineHeight:1.7,fontFamily:"'DM Serif Text',serif",fontStyle:"italic"}}>{takeaway}</div>
            </div>

            {/* Compare */}
            {compareMode&&<div {...an("sim",0.27)} style={{padding:"24px",borderRadius:14,border:`2px solid ${T.accent}44`,background:"#ecfeff",marginBottom:24}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div style={{fontSize:10,color:T.accent2,fontWeight:700,textTransform:"uppercase",letterSpacing:3,fontFamily:"'Space Mono',monospace"}}>Compare</div>
                <select value={compareIdx} onChange={e=>setCmpIdx(parseInt(e.target.value))} style={{padding:"6px 10px",borderRadius:6,border:`1px solid ${T.accent}44`,fontSize:12,background:"#fff",color:T.ink,fontFamily:"'Space Mono',monospace"}}>{PR.map((p,i)=><option key={i} value={i}>{p.n}</option>)}</select>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 50px 1fr",gap:6,fontSize:12}}>
                <div style={{fontWeight:700,color:T.ink,textAlign:"center",fontFamily:"'Space Mono',monospace",fontSize:11}}>Yours</div><div/><div style={{fontWeight:700,color:T.accent2,textAlign:"center",fontFamily:"'Space Mono',monospace",fontSize:11}}>{PR[compareIdx].n}</div>
                {[["Stress",res.ov,cmpRes.ov,""],["Subsidy",res.sb,cmpRes.sb,"T"],["Imports",res.ni,cmpRes.ni,"$B"],["CPI",res.ct,cmpRes.ct,"pp"],["EV Save",res.ai,cmpRes.ai,"$B"]].map(([l,a,b,u],i)=>(
                  <React.Fragment key={i}><div style={{textAlign:"center",padding:"7px 0",background:i%2?`${T.accent}11`:"transparent",borderRadius:4}}><span style={{fontFamily:"'Space Mono',monospace",fontWeight:600}}>{a}</span><span style={{color:T.muted,fontSize:10}}>{u}</span></div><div style={{textAlign:"center",padding:"7px 0",color:T.muted,fontSize:10,display:"flex",alignItems:"center",justifyContent:"center"}}>{l}</div><div style={{textAlign:"center",padding:"7px 0",background:i%2?`${T.accent}11`:"transparent",borderRadius:4}}><span style={{fontFamily:"'Space Mono',monospace",fontWeight:600,color:T.accent2}}>{b}</span><span style={{color:T.muted,fontSize:10}}>{u}</span></div></React.Fragment>
                ))}
              </div>
            </div>}

            {/* Pressure */}
            <div {...an("sim",0.3)} style={{padding:M?"20px":"28px 32px",borderRadius:16,border:`1px solid ${T.border}`,marginBottom:24,background:T.card,boxShadow:"0 1px 4px rgba(26,26,46,0.04)"}}>
              <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:3,marginBottom:16,fontFamily:"'Space Mono',monospace"}}>Pressure Channels</div>
              <PBar label="Fiscal \u2014 Subsidy Burden" value={res.st.fiscal}/><PBar label="External \u2014 Trade Deficit" value={res.st.external}/><PBar label="Inflation \u2014 Consumer Prices" value={res.st.inflation}/><PBar label="FX \u2014 Rupiah" value={res.st.fx}/>
            </div>

            {/* Metrics */}
            <div {...an("sim",0.4)} style={{display:"grid",gridTemplateColumns:M?"1fr 1fr":"repeat(3,1fr)",gap:12}}>
              <Met label="Subsidy" value={res.sb} unit="IDR Tn/yr" note={res.sc>0?`+${res.sc} vs base`:null}/><Met label="Import Bill" value={res.ni} unit="USD Bn/yr" note={res.td>0?`+${res.td}`:null}/><Met label="Inflation" value={res.ct>0?`+${res.ct}`:"0"} unit="pp CPI"/><Met label="CA Impact" value={res.cp>0?`+${res.cp}`:res.cp} unit="pp GDP"/><Met label="EV Import\u00A0Saved" value={res.ai} unit="USD Bn/yr" note={res.ai>0.5?"Material":null} good={true}/><Met label="EV Sub\u00A0Saved" value={res.as2} unit="IDR Tn/yr" note={res.as2>5?"Significant":null} good={true}/>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ EV SECTION ═══ */}
      <section ref={rf("evh")} className="grain" style={{padding:M?"80px 20px":"100px 24px",background:`linear-gradient(180deg,#ecfdf5,${T.bg})`}}>
        <div style={{maxWidth:900,margin:"0 auto",textAlign:"center"}}>
          <div {...an("evh")}>
            <div style={{fontSize:48,marginBottom:16}}>{"\u26A1"}</div>
            <div style={{fontSize:11,color:T.green,textTransform:"uppercase",letterSpacing:6,marginBottom:16,fontFamily:"'Space Mono',monospace"}}>The EV Solution</div>
            <h2 style={{fontSize:M?"26px":"clamp(30px,5vw,50px)",fontWeight:400,lineHeight:1.1,color:T.ink,letterSpacing:-1,fontFamily:"'DM Serif Text',serif"}}>Every electric motorcycle<br/>reduces Indonesia's <span style={{color:T.accent}}>oil exposure</span>.</h2>
            <p style={{fontSize:M?14:16,color:T.muted,maxWidth:500,margin:"20px auto 0",lineHeight:1.7}}>Not just climate. A structural macro-resilience tool that cuts imports, subsidies, and trade deficits simultaneously.</p>
          </div>
        </div>
      </section>

      {/* ═══ EV TABLE ═══ */}
      <section ref={rf("evt")} style={{padding:M?"40px 16px 80px":"60px 24px 100px",maxWidth:1000,margin:"0 auto"}}>
        <div {...an("evt")} style={{borderRadius:16,overflow:"hidden",border:`1px solid ${T.border}`,background:T.card,boxShadow:"0 2px 12px rgba(26,26,46,0.04)",overflowX:"auto"}}>
          <div style={{padding:M?"20px":"24px 28px",minWidth:580}}>
            <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:3,marginBottom:14,fontFamily:"'Space Mono',monospace"}}>EV Impact by Adoption Level (Brent ${inp.brent}/bbl)</div>
            <table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr style={{borderBottom:`2px solid ${T.border}`}}>{["Share","Units","Gas Cut","Import\u00A0Save","Sub\u00A0Save","CO2\u00A0Cut"].map(h=>(<th key={h} style={{textAlign:"left",padding:"8px 8px",fontSize:9,color:T.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:1,fontFamily:"'Space Mono',monospace"}}>{h}</th>))}</tr></thead>
            <tbody>{[0.2,1,3,5,8,10,15].map((pct,i)=>{const s=simulate({...inp,evFleetPct:pct});const cur=Math.abs(pct-inp.evFleetPct)<0.3;return(<tr key={pct} style={{borderBottom:`1px solid ${T.border}44`,background:cur?"#ecfdf5":i%2===1?T.bg2:"transparent"}}><td style={{padding:"10px 8px",fontSize:13,fontWeight:cur?700:400,color:cur?T.green:T.ink,fontFamily:"'Space Mono',monospace"}}>{pct}%{cur?" \u2190":""}</td><td style={{padding:"10px 8px",fontSize:12,color:T.muted,fontFamily:"'Space Mono',monospace"}}>{Math.round(pct*1.3)}M</td><td style={{padding:"10px 8px",fontSize:12,color:T.ink2,fontFamily:"'Space Mono',monospace"}}>{s.dp}B L</td><td style={{padding:"10px 8px",fontSize:12,color:T.green,fontWeight:600,fontFamily:"'Space Mono',monospace"}}>${s.ai}B</td><td style={{padding:"10px 8px",fontSize:12,color:T.green,fontWeight:600,fontFamily:"'Space Mono',monospace"}}>Rp{s.as2}T</td><td style={{padding:"10px 8px",fontSize:12,color:T.green,fontWeight:600,fontFamily:"'Space Mono',monospace"}}>{(s.co2/1e6).toFixed(1)}Mt</td></tr>);})}</tbody></table>
          </div>
        </div>
      </section>

      {/* ═══ FISCAL DIVIDEND ═══ */}
      <section ref={rf("bld")} className="grain" style={{padding:M?"80px 20px":"100px 24px",background:T.bg,position:"relative"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:`url(${IMG.skyline})`,backgroundSize:"cover",backgroundPosition:"center top",opacity:0.04}}/>
        <div style={{maxWidth:1100,margin:"0 auto",position:"relative",zIndex:2}}>
          <div {...an("bld")} style={{textAlign:"center",marginBottom:56}}>
            <div style={{fontSize:11,color:T.green,textTransform:"uppercase",letterSpacing:6,marginBottom:16,fontFamily:"'Space Mono',monospace"}}>Fiscal Dividend</div>
            <h2 style={{fontSize:M?"26px":"clamp(30px,5vw,50px)",fontWeight:400,lineHeight:1.1,color:T.ink,letterSpacing:-1,fontFamily:"'DM Serif Text',serif"}}>What IDR {sav} Trillion<br/>could <span style={{color:T.accent}}>build</span> every year.</h2>
          </div>
          <div {...an("bld",0.15)} style={{display:"grid",gridTemplateColumns:M?"1fr":"repeat(3,1fr)",gap:20}}>
            {[{n:hospitals,l:"Hospitals",d:`At ~IDR 300B each \u2014 healthcare across the archipelago.`,c:"#0369a1"},{n:schools.toLocaleString(),l:"Schools",d:`At ~IDR 15B each \u2014 education infrastructure nationwide.`,c:"#7c3aed"},{n:`${tollKm}km`,l:"Toll Road",d:`At ~IDR 250B/km \u2014 connectivity and logistics.`,c:T.amber}].map((c,i)=>(
              <div key={i} {...an("bld",0.2+i*0.1)} style={{borderRadius:16,background:T.card,border:`1px solid ${T.border}`,padding:"32px 24px",textAlign:"center",boxShadow:"0 2px 12px rgba(26,26,46,0.04)"}}>
                <div style={{fontSize:M?40:56,fontWeight:700,color:c.c,fontFamily:"'Space Mono',monospace",lineHeight:1}}>{c.n}</div>
                <div style={{fontSize:14,fontWeight:600,color:T.ink,marginTop:8,marginBottom:8,fontFamily:"'DM Serif Text',serif"}}>{c.l}</div>
                <div style={{fontSize:12,color:T.muted,lineHeight:1.6}}>{c.d}</div>
              </div>))}
          </div>
          <div {...an("bld",0.5)} style={{textAlign:"center",marginTop:40,padding:"24px 28px",borderRadius:12,background:T.card,border:`1px solid ${T.border}`,maxWidth:650,margin:"40px auto 0"}}>
            <div style={{fontSize:M?14:16,color:T.ink2,lineHeight:1.75,fontFamily:"'DM Serif Text',serif",fontStyle:"italic"}}>Every IDR trillion on subsidies is an IDR trillion <em>not</em> spent on hospitals, schools, and roads. <strong style={{fontStyle:"normal",color:T.accent2}}>EV adoption unlocks fiscal space for development.</strong></div>
          </div>
        </div>
      </section>

      {/* ═══ ENVIRONMENTAL ═══ */}
      <section ref={rf("env")} className="grain" style={{padding:M?"80px 20px":"100px 24px",background:"linear-gradient(180deg,#ecfdf5,#f0fdf4)"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div {...an("env")} style={{textAlign:"center",marginBottom:48}}>
            <div style={{fontSize:11,color:T.green,textTransform:"uppercase",letterSpacing:6,marginBottom:16,fontFamily:"'Space Mono',monospace"}}>Environmental Impact</div>
            <h2 style={{fontSize:M?"26px":"clamp(30px,5vw,48px)",fontWeight:400,lineHeight:1.1,color:T.ink,letterSpacing:-1,fontFamily:"'DM Serif Text',serif"}}>Cleaner air. <span style={{color:T.green}}>Greener</span> Indonesia.</h2>
          </div>
          <div {...an("env",0.15)} style={{display:"grid",gridTemplateColumns:M?"1fr":"1fr 1fr",gap:20}}>
            <div style={{borderRadius:16,background:T.card,border:`1px solid #bbf7d0`,padding:"32px 28px",textAlign:"center",boxShadow:"0 2px 12px rgba(22,101,52,0.06)"}}>
              <div style={{fontSize:M?40:56,fontWeight:700,color:T.green,fontFamily:"'Space Mono',monospace",lineHeight:1}}>{co2M}M</div>
              <div style={{fontSize:14,fontWeight:600,color:T.ink,marginTop:8,marginBottom:8,fontFamily:"'DM Serif Text',serif"}}>Tons CO2 Reduced / Year</div>
              <div style={{fontSize:12,color:T.muted,lineHeight:1.6}}>Each liter = 2.31 kg CO2. At 10% EV share, {tenPct.dp}B liters not burned annually.</div>
            </div>
            <div style={{borderRadius:16,background:T.card,border:`1px solid #bbf7d0`,padding:"32px 28px",textAlign:"center",boxShadow:"0 2px 12px rgba(22,101,52,0.06)"}}>
              <div style={{fontSize:M?40:56,fontWeight:700,color:"#15803d",fontFamily:"'Space Mono',monospace",lineHeight:1}}>{treesM}M</div>
              <div style={{fontSize:14,fontWeight:600,color:T.ink,marginTop:8,marginBottom:8,fontFamily:"'DM Serif Text',serif"}}>Trees Equivalent / Year</div>
              <div style={{fontSize:12,color:T.muted,lineHeight:1.6}}>A tree absorbs ~22 kg CO2/yr. Equivalent to planting {treesM}M trees \u2014 permanently.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ POLICY BRIEF ═══ */}
      <section ref={rf("pol")} className="grain" style={{padding:M?"80px 16px":"100px 24px",background:T.bg2}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <div {...an("pol")} style={{textAlign:"center",marginBottom:48}}>
            <div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:6,fontFamily:"'Space Mono',monospace",marginBottom:16}}>Auto-Generated</div>
            <h2 style={{fontSize:M?"28px":"clamp(30px,5vw,48px)",fontWeight:400,lineHeight:1.1,color:T.ink,letterSpacing:-1,fontFamily:"'DM Serif Text',serif"}}>Policy Brief</h2>
            <p style={{fontSize:11,color:T.muted,marginTop:10,fontFamily:"'Space Mono',monospace"}}>${inp.brent}/bbl \u00B7 IDR {inp.usdIdr.toLocaleString()} \u00B7 {inp.passThrough}%PT \u00B7 {inp.evFleetPct}%EV \u00B7 {inp.timeHorizon}Y</p>
          </div>
          <div {...an("pol",0.1)}>
            {/* Assessment */}
            <div style={{padding:M?"24px 20px":"32px",borderRadius:16,border:`1.5px solid ${sc2}33`,background:sbg2,marginBottom:16}}><div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:3,marginBottom:10,fontFamily:"'Space Mono',monospace"}}>Assessment</div><div style={{fontSize:M?15:18,color:T.ink,lineHeight:1.7,fontFamily:"'DM Serif Text',serif"}}>{pol.hl}</div></div>

            {[{t:"1st Order \u2014 Economic",items:pol.first,bg:T.card,br:"#fecaca",dot:T.red,tc:"#7f1d1d"},
              {t:"2nd Order \u2014 Social & Political",items:pol.second,bg:"#fef9ee",br:"#fde68a",dot:T.amber,tc:"#78350f"},
              {t:"Why Now",items:pol.whyNow,bg:"#eff6ff",br:"#93c5fd",dot:"#1d4ed8",tc:"#1e3a5f"},
              {t:"What If Not",items:pol.whatIfNot,bg:T.ink,br:"#334155",dot:"#ef4444",tc:"#f87171"}
            ].map((s,si)=>(
              <div key={si} style={{padding:M?"22px 18px":"28px 32px",borderRadius:14,border:`1px solid ${s.br}`,background:s.bg,marginBottom:12}}>
                <div style={{fontSize:10,color:s.tc,textTransform:"uppercase",letterSpacing:3,marginBottom:12,fontWeight:700,fontFamily:"'Space Mono',monospace"}}>{s.t}</div>
                {s.items.map((t,i)=><div key={i} style={{display:"flex",gap:10,marginBottom:10}}><div style={{width:6,height:6,borderRadius:"50%",background:s.dot,marginTop:6,flexShrink:0}}/><div style={{fontSize:13,color:s.bg===T.ink?"#cbd5e1":T.ink2,lineHeight:1.65}}>{t}</div></div>)}
              </div>
            ))}

            <div style={{padding:M?"22px 18px":"28px 32px",borderRadius:14,border:`1px solid ${T.border}`,background:T.card,marginBottom:12}}>
              <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:3,marginBottom:12,fontFamily:"'Space Mono',monospace"}}>Recommended Actions</div>
              {pol.rc.map((r,i)=><div key={i} style={{display:"flex",gap:12,marginBottom:12}}><div style={{width:22,height:22,borderRadius:"50%",background:T.bg2,color:T.ink,fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:"'Space Mono',monospace"}}>{i+1}</div><div style={{fontSize:13,color:T.ink2,lineHeight:1.6}}>{r}</div></div>)}
            </div>

            <div style={{padding:"16px 20px",borderRadius:10,background:"#fef9ee",border:"1px solid #fde68a"}}><div style={{fontSize:10,fontWeight:700,color:"#78350f",marginBottom:4,fontFamily:"'Space Mono',monospace"}}>Confidence Note</div><div style={{fontSize:11,color:T.muted,lineHeight:1.6}}>Simplified macro model. Directional, not precise. Key uncertainties: avg km/yr (6K-10K), Pertamina compensation, EV trajectory. CO2: IPCC 2.31 kg/L. Trees: EPA 22 kg/yr.</div></div>
          </div>
        </div>
      </section>

      {/* ═══ METHODOLOGY ═══ */}
      <section ref={rf("me")} className="grain" style={{padding:M?"80px 20px":"100px 24px",background:T.bg}}>
        <div style={{maxWidth:760,margin:"0 auto"}}>
          <div {...an("me")} style={{textAlign:"center",marginBottom:48}}><div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:6,fontFamily:"'Space Mono',monospace",marginBottom:16}}>Transparency</div><h2 style={{fontSize:M?"26px":"clamp(28px,4.5vw,44px)",fontWeight:400,lineHeight:1.1,color:T.ink,letterSpacing:-1,fontFamily:"'DM Serif Text',serif"}}>How this works.</h2></div>
          {[["Transmission","Oil price \u2192 landed cost (FX) \u2192 subsidy gap \u2192 fiscal burden \u2192 trade deficit \u2192 inflation \u2192 FX pressure. EVs reduce gasoline flowing through the chain."],["Assumptions","Crack: $10/bbl. Freight: 5%. 159 L/bbl. Pertalite: IDR 10K/L. Vol: ~30B L/yr. Net imports: ~300K bpd. CPI fuel: 4%. Fleet: 130M. GDP: ~$1,400B. CO2: 2.31 kg/L. Trees: 22 kg/yr."],["Sources","Bank Indonesia \u00B7 MoF \u00B7 BPS \u00B7 ESDM \u00B7 IEA \u00B7 World Bank \u00B7 IISD \u00B7 Pertamina \u00B7 ICCT \u00B7 IPCC"],["Limits","No GDP model, endogenous FX, BI reaction, provincial data, grid constraints, battery imports, or air quality benefits."]].map(([t,d],i)=><div key={i} {...an("me",i*0.07)} style={{padding:M?"18px":"22px 26px",borderRadius:12,border:`1px solid ${T.border}`,background:T.card,marginBottom:10,boxShadow:"0 1px 3px rgba(26,26,46,0.03)"}}><div style={{fontSize:13,fontWeight:600,color:T.ink,marginBottom:6,fontFamily:"'DM Serif Text',serif"}}>{t}</div><div style={{fontSize:12,color:T.muted,lineHeight:1.7}}>{d}</div></div>)}
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="grain" style={{padding:M?"60px 20px 40px":"80px 24px 48px",borderTop:`1px solid ${T.border}`,background:T.bg2}}>
        <div style={{maxWidth:660,margin:"0 auto",textAlign:"center"}}>
          <div style={{fontSize:18,fontWeight:400,color:T.ink,marginBottom:8,fontFamily:"'DM Serif Text',serif"}}>Indonesia Oil-Macro-EV Simulator</div>
          <div style={{fontSize:11,color:T.muted,lineHeight:1.9,marginBottom:20,fontFamily:"'Space Mono',monospace"}}>BI \u00B7 MoF \u00B7 BPS \u00B7 ESDM \u00B7 IEA \u00B7 World Bank \u00B7 IISD \u00B7 ICCT \u00B7 IPCC</div>
          <div style={{padding:"22px 24px",borderRadius:12,background:T.card,border:`1px solid ${T.border}`,marginBottom:16,textAlign:"left"}}>
            <div style={{fontSize:13,color:T.muted,lineHeight:1.8,fontStyle:"italic",fontFamily:"'DM Serif Text',serif"}}>This simulation combines research with simplifying assumptions to make complex macroeconomics accessible. It is not a definitive conclusion \u2014 rather, an <strong style={{fontStyle:"normal",color:T.ink}}>invitation to think</strong>. The model is imperfect. I\u2019d be genuinely happy if others improve it or challenge its assumptions. The goal was never perfection \u2014 it was to start a more informed conversation.</div>
          </div>
          <div style={{padding:"22px 24px",borderRadius:12,background:T.ink,color:"#fff"}}>
            <div style={{fontSize:15,fontWeight:400,marginBottom:6,fontFamily:"'DM Serif Text',serif"}}>Created by Gunawan Panjaitan</div>
            <div style={{fontSize:12,color:T.muted2,marginBottom:10}}>An EV enthusiast exploring energy economics and Indonesia\u2019s future.</div>
            <div style={{fontSize:12,color:T.muted}}><span style={{marginRight:14}}>{"\u2709"} <a href="mailto:gunawan_pnjaitan@yahoo.co.id" style={{color:T.accent,textDecoration:"none"}}>gunawan_pnjaitan@yahoo.co.id</a></span><span>in <a href="https://www.linkedin.com/in/gunawan-panjaitan/" target="_blank" rel="noopener noreferrer" style={{color:T.accent,textDecoration:"none"}}>Gunawan Panjaitan</a></span></div>
          </div>
          <div style={{fontSize:10,color:T.muted2,marginTop:16,fontFamily:"'Space Mono',monospace"}}>All estimates provisional \u00B7 Validate before policy use \u00B7 \u00A9 2026</div>
        </div>
      </footer>

      {/* ═══ CHATBOT ═══ */}
      <ChatBot inp={inp} res={res} T={T}/>
    </div>
  );
}

/* ═══ CHATBOT ═══ */
function ChatBot({inp,res,T}){
  const[open,setOpen]=useState(false);
  const[msgs,setMsgs]=useState([{role:"assistant",content:"Hello! I can answer questions about this simulation \u2014 methodology, results, assumptions, EV impact, or policy implications. What would you like to know?"}]);
  const[input,setInput]=useState("");
  const[loading,setLoading]=useState(false);
  const end=useRef(null);
  const W=useW();
  useEffect(()=>{end.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  const sys=`You are the assistant for the Indonesia Oil-Macro-EV Simulator. Current: Brent $${inp.brent}, IDR ${inp.usdIdr}, ${inp.passThrough}% pass-through, ${inp.evFleetPct}% EV. Results: stress ${res.ov}/10, subsidy IDR ${res.sb}T, imports USD ${res.ni}B, CPI +${res.ct}pp, EV savings $${res.ai}B + IDR ${res.as2}T. Be concise, Indonesia-specific, honest about limitations. By Gunawan Panjaitan.`;
  async function send(){if(!input.trim()||loading)return;const nm=[...msgs,{role:"user",content:input.trim()}];setMsgs(nm);setInput("");setLoading(true);try{const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,system:sys,messages:nm.map(m=>({role:m.role,content:m.content}))})});const d=await r.json();setMsgs(p=>[...p,{role:"assistant",content:d.content?.filter(i=>i.type==="text").map(i=>i.text).join("\n")||"Please try again."}]);}catch{setMsgs(p=>[...p,{role:"assistant",content:"Connection issue. Please retry."}]);}setLoading(false);}
  if(!open)return(<button onClick={()=>setOpen(true)} style={{position:"fixed",bottom:20,right:20,width:52,height:52,borderRadius:12,background:T.ink,color:"#fff",border:"none",cursor:"pointer",boxShadow:"0 4px 20px rgba(26,26,46,0.25)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}} aria-label="Chat"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button>);
  return(<div style={{position:"fixed",bottom:20,right:20,width:Math.min(370,W-32),height:460,background:T.card,borderRadius:16,boxShadow:"0 8px 40px rgba(26,26,46,0.2)",display:"flex",flexDirection:"column",overflow:"hidden",zIndex:9999,border:`1px solid ${T.border}`}}>
    <div style={{padding:"14px 18px",background:T.ink,color:"#fff",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:14,fontWeight:400,fontFamily:"'DM Serif Text',serif"}}>Ask the Simulator</div><div style={{fontSize:10,color:T.muted2,fontFamily:"'Space Mono',monospace"}}>Powered by Claude AI</div></div><button onClick={()=>setOpen(false)} style={{background:"none",border:"none",color:T.muted2,fontSize:16,cursor:"pointer",padding:"4px 8px"}}>x</button></div>
    <div style={{flex:1,overflowY:"auto",padding:12,display:"flex",flexDirection:"column",gap:8,background:T.bg}}>
      {msgs.map((m,i)=><div key={i} style={{alignSelf:m.role==="user"?"flex-end":"flex-start",maxWidth:"85%",padding:"10px 14px",borderRadius:m.role==="user"?"12px 12px 4px 12px":"12px 12px 12px 4px",background:m.role==="user"?T.ink:T.card,color:m.role==="user"?"#fff":T.ink2,fontSize:12,lineHeight:1.55,whiteSpace:"pre-wrap",border:m.role==="user"?"none":`1px solid ${T.border}`}}>{m.content}</div>)}
      {loading&&<div style={{alignSelf:"flex-start",padding:"10px 14px",borderRadius:"12px 12px 12px 4px",background:T.card,color:T.muted,fontSize:12,border:`1px solid ${T.border}`}}>Thinking...</div>}
      <div ref={end}/>
    </div>
    <div style={{padding:"10px 12px",borderTop:`1px solid ${T.border}`,display:"flex",gap:8,background:T.card}}>
      <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask about the model..." style={{flex:1,padding:"10px 14px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,outline:"none",fontFamily:"inherit",background:T.bg}}/>
      <button onClick={send} disabled={loading} style={{padding:"10px 16px",borderRadius:8,background:T.accent,color:"#fff",border:"none",fontSize:11,fontWeight:700,cursor:"pointer",opacity:loading?0.5:1,fontFamily:"'Space Mono',monospace"}}>Send</button>
    </div>
  </div>);
}
