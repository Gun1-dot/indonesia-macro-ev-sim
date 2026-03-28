import { useState, useEffect, useCallback, useMemo, useRef } from "react";

/* ═══════════ SIMULATION ENGINE ═══════════ */
function runSim(inp) {
  var B = inp.brent, U = inp.usdIdr, PT = inp.passThrough, EV = inp.evFleetPct;
  var TH = inp.timeHorizon, KM = inp.avgKmPerBike, SI = inp.subsidyIntensity;
  var BB = 75, BI = 15800, CR = 10, FR = 0.05, RT = 10000, VL = 30;
  var IB = 300000, MT = 130, GDP = 1400, FK = 0.025, CW = 0.04, CM = 0.7;

  var ld = ((B + CR) / 159) * (1 + FR) * U;
  var bld = ((BB + CR) / 159) * (1 + FR) * BI;
  var er = RT + (PT / 100) * Math.max(0, ld - RT);
  var gp = Math.max(0, ld - er);
  var bg = Math.max(0, bld - RT);
  var eu = (EV / 100) * MT * 1e6;
  var dp = (eu * KM * FK) / 1e9;
  var ev = Math.max(0, VL - dp);
  var sb = (gp * ev * 1e9) / 1e12 * SI;
  var bs = (bg * VL * 1e9) / 1e12;
  var sc = sb - bs;
  var fp = (sc * 1e12 / (GDP * 1e9 * U)) * 100;
  var ib = (IB * 365 * (B + CR)) / 1e9;
  var bi2 = (IB * 365 * (BB + CR)) / 1e9;
  var ai = (dp * 1e9 * (B + CR) / 159) / 1e9;
  var ni = ib - ai;
  var td = ni - bi2;
  var cp = (td / GDP) * 100;
  var fc = ((er - RT) / RT) * 100;
  var cd = CW * (fc / 100) * 100;
  var ct = cd * (1 + CM);
  var fx = Math.min(10, Math.max(0, ((U - BI) / BI) * 30 + (td / 5) * 2 + ((B - BB) / BB) * 5));
  var as2 = (gp * dp * 1e9) / 1e12;
  var co2 = (dp * 1e9 * 2.31) / 1000;
  var stF = Math.min(10, Math.max(0, (sb / 100) * 3 + fp * 5));
  var stE = Math.min(10, Math.max(0, (td / 3) * 2 + cp * 10));
  var stI = Math.min(10, Math.max(0, ct * 2));
  var hm = TH <= 1 ? 1 : TH <= 3 ? 0.85 : 0.7;
  var ov = (stF * 0.3 + stE * 0.25 + stI * 0.25 + fx * 0.2) * hm;

  return {
    ld: Math.round(ld), er: Math.round(er), gp: Math.round(gp),
    sb: Math.round(sb * 10) / 10, sc: Math.round(sc * 10) / 10,
    fp: Math.round(fp * 100) / 100, ni: Math.round(ni * 10) / 10,
    td: Math.round(td * 10) / 10, cp: Math.round(cp * 100) / 100,
    ct: Math.round(ct * 100) / 100, fx: Math.round(fx * 10) / 10,
    dp: Math.round(dp * 100) / 100, ai: Math.round(ai * 100) / 100,
    as2: Math.round(as2 * 10) / 10, evM: Math.round(eu / 1e6 * 10) / 10,
    co2: Math.round(co2),
    st: { fiscal: Math.round(stF * 10) / 10, external: Math.round(stE * 10) / 10, inflation: Math.round(stI * 10) / 10, fx: Math.round(fx * 10) / 10 },
    ov: Math.round(ov * 10) / 10
  };
}

/* ═══════════ POLICY ENGINE ═══════════ */
function genPolicy(r, inp) {
  var entries = [];
  entries.push(["fiscal", r.st.fiscal]);
  entries.push(["external", r.st.external]);
  entries.push(["inflation", r.st.inflation]);
  entries.push(["fx", r.st.fx]);
  entries.sort(function(a, b) { return b[1] - a[1]; });

  var names = { fiscal: "Fiscal", external: "External", inflation: "Inflation", fx: "Exchange Rate" };
  var sev = r.ov > 7 ? "severe" : r.ov > 5 ? "significant" : r.ov > 3 ? "moderate" : "manageable";
  var topName = names[entries[0][0]];
  var secName = entries.length > 1 ? names[entries[1][0]] : "";

  // Headline
  var hl = "";
  if (r.ov <= 2) {
    hl = "Indonesia's macroeconomic position is stable at USD " + inp.brent + "/bbl. No material stress detected across fiscal, external, or inflation channels.";
  } else if (r.ov <= 4) {
    hl = sev.charAt(0).toUpperCase() + sev.slice(1) + " pressure detected, primarily through the " + topName.toLowerCase() + " channel. Manageable but requires active monitoring.";
  } else if (r.ov <= 6) {
    hl = "Significant stress across " + topName.toLowerCase() + " and " + secName.toLowerCase() + " channels simultaneously. Policy intervention is advisable.";
  } else {
    hl = "WARNING: Severe multi-channel macro stress. Without coordinated response, cascading economic and social consequences are likely.";
  }

  // 1st Order: Economic
  var f1 = [];
  f1.push("Oil import bill: Indonesia pays USD " + r.ni + " billion/year for oil imports" + (r.td > 0 ? " (+" + r.td + "B vs baseline), directly widening the trade deficit and draining foreign exchange." : "."));
  if (r.st.fiscal > 2) f1.push("Fiscal burden: Government spends IDR " + r.sb + " trillion/year on fuel subsidies" + (r.sc > 0 ? " (+" + r.sc + "T vs baseline), consuming budget meant for development spending." : "."));
  if (r.st.inflation > 1.5) f1.push("Inflation: Consumer prices rise by an estimated " + r.ct + " percentage points, driven by fuel cost pass-through into transport, food, and logistics across the archipelago.");
  if (r.st.fx > 2) f1.push("Currency pressure: The rupiah faces depreciation pressure (FX stress " + r.fx + "/10), making all imports more expensive and creating a compounding cost-of-living spiral.");
  f1.push("Current account: Oil trade deficit contributes " + (r.cp > 0 ? "+" : "") + r.cp + " percentage points to the current account balance as share of GDP.");

  // 2nd Order: Social & Political
  var f2 = [];
  if (r.st.inflation > 2 && inp.passThrough > 20) {
    f2.push("Household welfare: Rising fuel and food prices hit lower-income households hardest. Motorcycle-dependent workers (ojol drivers, delivery riders, farmers) spend a higher share of income on fuel. A 20-30% transport cost increase can push vulnerable families below the poverty line.");
  }
  if (r.st.inflation > 3 && inp.passThrough > 30) {
    f2.push("Social stability risk: Indonesia has documented history of public unrest following fuel price hikes (1998, 2005, 2013, 2022). The political cost of visible price increases is immediate and high.");
  }
  if (r.st.fiscal > 3) {
    f2.push("Development trade-off: Every IDR trillion absorbed by fuel subsidies is an IDR trillion NOT spent on hospitals, schools, roads, and job creation. Invisible in the short term but compounds into long-term development gaps.");
  }
  if (r.st.fiscal > 4) {
    f2.push("Political dilemma: Elected officials face backlash for raising fuel prices AND backlash when infrastructure is delayed and public services deteriorate. The subsidy trap limits all policy options.");
  }
  if (r.st.fx > 3) {
    f2.push("Public confidence: A weakening rupiah erodes public trust in economic management. Currency movements dominate media coverage and shape voter sentiment, even when underlying fundamentals are manageable.");
  }
  if (r.ov > 4) {
    f2.push("Investment climate: Sustained macro stress slows foreign direct investment, weakens job creation, and risks turning Indonesia's demographic dividend into a demographic liability.");
  }
  if (f2.length === 0) {
    f2.push("Under this scenario, social and political risks remain contained. No significant pressure points are activated.");
  }

  // Why Now
  var wn = [];
  wn.push("Oil import dependence is structural and growing: domestic production declined from 1.6M bpd (1990s) to under 600,000 bpd today. The gap widens every year without structural change.");
  if (inp.brent > 85) wn.push("At USD " + inp.brent + "/bbl, every month of delay adds approximately IDR " + (Math.round(r.sb / 12 * 10) / 10) + " trillion in subsidy obligations.");
  wn.push("The global EV transition is accelerating. Countries moving early (China, Vietnam, India, Thailand) are locking in manufacturing investment. Delay means Indonesia imports EVs rather than builds them.");
  wn.push("Indonesia's 2030 demographic window is once-in-a-generation. Wasting fiscal space on fuel subsidies means failing to invest in human capital that determines high-income status.");

  // What If Not
  var wif = [];
  wif.push("Without structural action, oil import bill grows as share of GDP. Subsidy burden expands. Sensitivity to oil volatility increases, not decreases, over time.");
  wif.push("130 million motorcycles continue burning 25-30 billion liters/year of imported gasoline. A permanent, compounding drain on the economy.");
  if (r.st.fiscal > 3) wif.push("Risk of repeating the 2013-2014 fiscal crisis when energy subsidies consumed over 20% of the national budget, forcing emergency austerity.");
  wif.push("The cost of inaction is not stasis. It is structural decline. Vietnam, India, Thailand are moving aggressively. Standing still means falling behind.");

  // Short-term Recommendations
  var rcShort = [];
  if (r.st.fiscal > 4 && inp.passThrough < 50) rcShort.push("Implement partial fuel price pass-through (30-50%) combined with targeted cash transfers (BLT/BST) to protect vulnerable households while reducing fiscal hemorrhage.");
  if (r.st.fiscal > 3) rcShort.push("Emergency fiscal review: protect infrastructure, health, and education budgets from subsidy crowding-out. Prepare APBN-P budget revision.");
  if (r.st.inflation > 3) rcShort.push("Coordinate with Bank Indonesia on inflation expectations management before any administered price adjustment.");
  if (r.st.external > 3) rcShort.push("Strengthen FX reserve buffers through bilateral swap line activation and SRBI issuance.");
  rcShort.push("Extend EV 2-wheeler purchase subsidy (IDR 7M/unit) and fast-track conversion of ride-hailing and delivery fleets, which have the highest daily km and therefore highest per-unit gasoline displacement.");
  rcShort.push("Announce clear 12-month EV adoption target and charging infrastructure roadmap to signal policy commitment and crowd-in private investment.");

  // Long-term Recommendations
  var rcLong = [];
  rcLong.push("Set binding national target: 10% EV motorcycle fleet share by 2030 (13M units). At this level, Indonesia saves USD 1.5-2.5B/year in imports and IDR 13-20T/year in subsidies.");
  rcLong.push("Develop domestic EV and battery manufacturing. Indonesia controls 22% of global nickel reserves. Vertical integration from nickel to battery cells to EV assembly creates an ecosystem worth tens of billions.");
  rcLong.push("Implement gradual, pre-announced fuel subsidy reform with 3-year transition. Link subsidy reduction to visible increases in infrastructure spending so the public sees what savings buy.");
  rcLong.push("Build nationwide battery swap and charging network: 50,000+ points by 2028. Focus Java first (59% of motorcycles), then Sumatra and Kalimantan.");
  rcLong.push("Establish Energy Transition Fund: redirect 30% of annual fuel subsidy savings into ring-fenced fund for EV incentives and green infrastructure. More EVs = less subsidy = more fund = more EVs.");

  return { hl: hl, sv: sev, top: topName, f1: f1, f2: f2, wn: wn, wif: wif, rcShort: rcShort, rcLong: rcLong };
}

/* ═══════════ PRESETS ═══════════ */
var PR = [
  { n: "Base Case", d: "Current", b: 75, u: 15800, p: 15, e: 0.2, t: 1, k: 8000, s: 1 },
  { n: "Oil Shock", d: "$110/bbl", b: 110, u: 16200, p: 15, e: 0.2, t: 1, k: 8000, s: 1 },
  { n: "Double Hit", d: "Oil+weak IDR", b: 110, u: 17500, p: 10, e: 0.2, t: 1, k: 8000, s: 1 },
  { n: "Reform", d: "Pass-through+EV", b: 100, u: 16000, p: 50, e: 3, t: 3, k: 8000, s: 1 },
  { n: "EV Future", d: "12% fleet", b: 95, u: 16000, p: 30, e: 12, t: 5, k: 8000, s: 1 },
];

var IMG = { hero: "/hero-ev.jpg", oil: "/oil-refinery.jpg", traffic: "/motorcycle-traffic.jpg", sky: "/jakarta-skyline.jpg" };

var T = {
  bg: "#faf8f3", bg2: "#f3efe6", ink: "#1a1a2e", ink2: "#3a3a52", mut: "#8b8680", mut2: "#b5afa6",
  brd: "#ddd8ce", acc: "#06b6d4", acc2: "#0e7490", amb: "#b45309", red: "#991b1b", grn: "#166534",
  ev: "#06d6a0", card: "#fffdf7",
  ser: "'DM Serif Text',Georgia,serif", mon: "'Space Mono',monospace", san: "'Instrument Sans',-apple-system,sans-serif"
};

/* ═══════════ VARIABLE DEFINITIONS ═══════════ */
var DEFS = {
  brent: "Brent Crude: The global benchmark oil price, set by international markets. Indonesia's fuel import costs are directly tied to this price.",
  usdIdr: "USD/IDR Exchange Rate: How many rupiah per US dollar. A weaker rupiah makes oil imports more expensive in local currency.",
  passThrough: "Pass-Through: The percentage of oil price increase passed to consumers as higher fuel prices. 0% means government absorbs all cost via subsidies.",
  evFleetPct: "EV Fleet Share: Percentage of Indonesia's 130M motorcycles that are electric. Higher share means less gasoline consumed and imported."
};

/* ═══════════ HOOKS ═══════════ */
function useW() {
  var _s = useState(1200), w = _s[0], sw = _s[1];
  useEffect(function() { sw(window.innerWidth); var h = function() { sw(window.innerWidth); }; window.addEventListener("resize", h); return function() { window.removeEventListener("resize", h); }; }, []);
  return w;
}

/* ═══════════ MAIN APP ═══════════ */
export default function App() {
  var _i = useState({ brent: 75, usdIdr: 15800, passThrough: 15, evFleetPct: 0.2, timeHorizon: 1, avgKmPerBike: 8000, subsidyIntensity: 1 });
  var inp = _i[0], si = _i[1];
  var _p = useState(0), pr = _p[0], spr = _p[1];
  var _v = useState({}), vis = _v[0], sv = _v[1];
  var _l = useState(false), loaded = _l[0], setL = _l[1];
  var _sp = useState(0), scrollP = _sp[0], setSp = _sp[1];
  var _cnt = useState(0), cnt = _cnt[0], setCnt = _cnt[1];
  var _def = useState(null), showDef = _def[0], setShowDef = _def[1];
  var refs = useRef({});
  var W = useW(), M = W < 768;

  useEffect(function() { var i = setInterval(function() { setCnt(function(c) { return c + 93.8; }); }, 100); return function() { clearInterval(i); }; }, []);
  useEffect(function() { setTimeout(function() { setL(true); }, 800); }, []);
  useEffect(function() { var h = function() { var d = document.documentElement; setSp(d.scrollTop / (d.scrollHeight - d.clientHeight) * 100); }; window.addEventListener("scroll", h); return function() { window.removeEventListener("scroll", h); }; }, []);
  useEffect(function() {
    var obs = new IntersectionObserver(function(entries) { entries.forEach(function(e) { if (e.isIntersecting) sv(function(prev) { var n = {}; for (var k in prev) n[k] = prev[k]; n[e.target.dataset.s] = true; return n; }); }); }, { threshold: 0.06 });
    var keys = Object.keys(refs.current);
    for (var i = 0; i < keys.length; i++) { if (refs.current[keys[i]]) obs.observe(refs.current[keys[i]]); }
    return function() { obs.disconnect(); };
  }, [loaded]);

  var set = useCallback(function(k, v) { si(function(prev) { var n = {}; for (var x in prev) n[x] = prev[x]; n[k] = v; return n; }); spr(-1); }, []);
  var aply = useCallback(function(i) { var p = PR[i]; si({ brent: p.b, usdIdr: p.u, passThrough: p.p, evFleetPct: p.e, timeHorizon: p.t, avgKmPerBike: p.k, subsidyIntensity: p.s }); spr(i); }, []);

  var r = useMemo(function() { return runSim(inp); }, [inp]);
  var p = useMemo(function() { return genPolicy(r, inp); }, [r, inp]);
  var t10 = useMemo(function() { return runSim({ brent: inp.brent, usdIdr: inp.usdIdr, passThrough: inp.passThrough, evFleetPct: 10, timeHorizon: inp.timeHorizon, avgKmPerBike: inp.avgKmPerBike, subsidyIntensity: inp.subsidyIntensity }); }, [inp]);

  var sav = t10.as2, hosp = Math.round(sav / 0.3), sch = Math.round(sav / 0.015), toll = Math.round(sav / 0.25);
  var co2M = (t10.co2 / 1e6).toFixed(2), treM = (Math.round(t10.co2 / 0.022) / 1e6).toFixed(1);

  var tk = r.ov <= 2 ? "Stable. No immediate action needed." : r.sc > 20 ? "Indonesia spends +IDR " + r.sc + "T/yr on fuel subsidies. That's " + Math.round(r.sc / 0.3) + " hospitals that will never be built." : r.td > 3 ? "+USD " + r.td + "B/yr leaving Indonesia for oil imports instead of domestic development." : "+IDR " + r.sc + "T subsidy, +USD " + r.td + "B imports. Manageable today, compounds if sustained.";

  var rf = function(id) { return function(el) { if (el) { el.dataset.s = id; refs.current[id] = el; } }; };
  var an = function(id, d) { return { style: { opacity: vis[id] ? 1 : 0, transform: vis[id] ? "translateY(0)" : "translateY(30px)", transition: "all 0.8s ease " + (d || 0) + "s" } }; };

  var stressColor = r.ov <= 2.5 ? T.grn : r.ov <= 5 ? T.amb : r.ov <= 7.5 ? "#c2410c" : T.red;
  var stressLabel = r.ov <= 2.5 ? "LOW" : r.ov <= 5 ? "MODERATE" : r.ov <= 7.5 ? "HIGH" : "SEVERE";
  var stressBg = r.ov <= 2.5 ? "#eef7ee" : r.ov <= 5 ? "#fef9ee" : r.ov <= 7.5 ? "#fef3ec" : "#fef2f2";

  // SLIDER — rendered inline to avoid re-mount issues
  function renderSlider(label, value, onChange, min, max, step, unit, sub, defKey) {
    var pct = ((value - min) / (max - min)) * 100;
    var doMinus = function(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      var nv = Math.round((value - step) * 1000) / 1000;
      if (nv >= min) onChange(nv);
    };
    var doPlus = function(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      var nv = Math.round((value + step) * 1000) / 1000;
      if (nv <= max) onChange(nv);
    };
    var doSlide = function(evt) {
      onChange(parseFloat(evt.target.value));
    };
    var toggleDef = function(evt) {
      evt.preventDefault();
      setShowDef(showDef === defKey ? null : defKey);
    };
    return (
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: T.ink2 }}>{label}</span>
            {defKey && <button type="button" onClick={toggleDef} style={{ width: 16, height: 16, borderRadius: "50%", border: "1px solid " + T.brd, background: showDef === defKey ? T.acc : "transparent", color: showDef === defKey ? "#fff" : T.mut, fontSize: 9, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, lineHeight: 1 }}>?</button>}
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: T.ink, fontFamily: T.mon }}>{typeof value === "number" ? value.toLocaleString() : value}{unit}</span>
        </div>
        {showDef === defKey && <div style={{ fontSize: 11, color: T.mut, lineHeight: 1.5, marginBottom: 8, padding: "8px 10px", borderRadius: 6, background: T.bg, border: "1px solid " + T.brd }}>{DEFS[defKey]}</div>}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button type="button" onClick={doMinus} style={{ width: 32, height: 32, borderRadius: 6, border: "1px solid " + T.brd, background: T.card, color: T.ink, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0, lineHeight: 1, userSelect: "none" }}>-</button>
          <input type="range" min={min} max={max} step={step} value={value} onChange={doSlide} style={{ flex: 1, height: 5, appearance: "none", background: "linear-gradient(90deg," + T.acc + " " + pct + "%," + T.brd + " " + pct + "%)", borderRadius: 3, outline: "none", cursor: "pointer" }} />
          <button type="button" onClick={doPlus} style={{ width: 32, height: 32, borderRadius: 6, border: "1px solid " + T.brd, background: T.card, color: T.ink, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0, lineHeight: 1, userSelect: "none" }}>+</button>
        </div>
        {sub && <div style={{ fontSize: 10, color: T.mut2, marginTop: 3 }}>{sub}</div>}
      </div>
    );
  }

  function PBar(props) {
    var pct = Math.min(100, props.value / 10 * 100);
    var c = props.value <= 2.5 ? T.grn : props.value <= 5 ? T.amb : props.value <= 7.5 ? "#c2410c" : T.red;
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: T.ink2 }}>{props.label}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: c, fontFamily: T.mon }}>{props.value.toFixed(1)}</span>
        </div>
        <div style={{ height: 7, background: T.brd, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ width: pct + "%", height: "100%", background: c, borderRadius: 4, transition: "width 0.7s ease" }} />
        </div>
      </div>
    );
  }

  function MetCard(props) {
    return (
      <div style={{ padding: M ? "14px 16px" : "20px 22px", borderRadius: 12, background: T.card, border: "1px solid " + T.brd }}>
        <div style={{ fontSize: 9, color: T.mut, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6, fontFamily: T.mon }}>{props.label}</div>
        <div style={{ fontSize: M ? 22 : 28, fontWeight: 700, color: T.ink, fontFamily: T.mon, lineHeight: 1 }}>{props.value}</div>
        <div style={{ fontSize: 10, color: T.mut, marginTop: 3 }}>{props.unit}</div>
        {props.note && <div style={{ fontSize: 10, color: props.good ? T.grn : T.red, fontWeight: 600, marginTop: 4 }}>{props.note}</div>}
      </div>
    );
  }

  // Loading screen
  if (!loaded) return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: T.bg }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Text:ital@0;1&family=Space+Mono:wght@400;700&family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ fontSize: 24, color: T.ink, fontFamily: T.ser, marginBottom: 6 }}>Indonesia Macro-EV</div>
      <div style={{ fontSize: 11, color: T.mut, fontFamily: T.mon }}>Loading simulation...</div>
      <div style={{ width: 36, height: 36, border: "2px solid " + T.brd, borderTop: "2px solid " + T.acc, borderRadius: "50%", animation: "sp .8s linear infinite", marginTop: 20 }} />
      <style>{"@keyframes sp{to{transform:rotate(360deg)}}"}</style>
    </div>
  );

  // Helper to render bullet list
  function BulletList(props) {
    return props.items.map(function(text, i) {
      return (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: props.dotColor, marginTop: 6, flexShrink: 0 }} />
          <div style={{ fontSize: 12, color: props.textColor || T.ink2, lineHeight: 1.6 }}>{text}</div>
        </div>
      );
    });
  }

  function NumberedList(props) {
    return props.items.map(function(text, i) {
      return (
        <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
          <div style={{ width: 22, height: 22, borderRadius: 4, background: props.badgeBg, color: props.badgeColor, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: T.mon }}>{props.prefix + (i + 1)}</div>
          <div style={{ fontSize: 12, color: props.textColor || T.ink2, lineHeight: 1.55 }}>{text}</div>
        </div>
      );
    });
  }

  return (
    <div style={{ background: T.bg, color: T.ink, fontFamily: T.san, overflowX: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Text:ital@0;1&family=Space+Mono:wght@400;700&family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{"input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:" + T.acc + ";cursor:pointer;border:3px solid " + T.bg + ";box-shadow:0 2px 8px " + T.acc + "44}input[type=range]::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:" + T.acc + ";cursor:pointer;border:3px solid " + T.bg + "}*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}"}</style>

      {/* Progress */}
      <div style={{ position: "fixed", top: 0, left: 0, width: scrollP + "%", height: 2, background: "linear-gradient(90deg," + T.acc + "," + T.ev + ")", zIndex: 99998 }} />

      {/* ═══ HERO ═══ */}
      <section ref={rf("h")} style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url(" + IMG.hero + ")", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(250,248,243,0.93),rgba(250,248,243,0.75),rgba(250,248,243,0.5))" }} />
        <div style={{ position: "relative", zIndex: 2, padding: M ? "48px 20px 40px" : "72px 48px 56px", maxWidth: 1200, margin: "0 auto" }}>
          <div {...an("h")}>
            <div style={{ maxWidth: 600 }}>
              <div style={{ fontSize: 10, color: T.mut, textTransform: "uppercase", letterSpacing: 6, marginBottom: 20, fontFamily: T.mon }}>Indonesia Macro Simulation</div>
              <h1 style={{ fontSize: M ? "32px" : "clamp(40px,5.5vw,64px)", fontWeight: 400, lineHeight: 1.08, color: T.ink, letterSpacing: -2, fontFamily: T.ser }}>How oil prices shape<br /><span style={{ color: T.acc }}>Indonesia's</span> economy.</h1>
              <p style={{ fontSize: M ? 13 : 16, color: T.mut, maxWidth: 480, marginTop: 20, lineHeight: 1.7 }}>Interactive decision-support for policy makers, EV 2 Wheeler players, researchers, and investors.</p>
              <div style={{ marginTop: 28, padding: "16px 24px", borderRadius: 10, background: "rgba(26,26,46,0.06)", border: "1px solid " + T.brd, display: "inline-block" }}>
                <div style={{ fontSize: 9, color: T.mut, textTransform: "uppercase", letterSpacing: 3, marginBottom: 4, fontFamily: T.mon }}>Indonesia has spent on oil imports since you opened this page</div>
                <div style={{ fontSize: M ? 26 : 38, fontWeight: 700, color: T.red, fontFamily: T.mon, letterSpacing: -1 }}>{"$" + Math.floor(cnt).toLocaleString()}</div>
                <div style={{ fontSize: 10, color: T.mut2, fontFamily: T.mon }}>~$938 per second, 24/7/365</div>
              </div>
              <div style={{ marginTop: 28, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={function() { document.getElementById("sim").scrollIntoView({ behavior: "smooth" }); }} style={{ padding: "12px 28px", borderRadius: 4, background: T.ink, color: T.bg, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: T.mon }}>SIMULATE</button>
                <button onClick={function() { document.getElementById("why").scrollIntoView({ behavior: "smooth" }); }} style={{ padding: "12px 28px", borderRadius: 4, background: "transparent", color: T.ink, fontSize: 13, fontWeight: 600, border: "1.5px solid " + T.brd, cursor: "pointer", fontFamily: T.mon }}>LEARN MORE</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ STATS STRIP ═══ */}
      <section ref={rf("st")} style={{ background: T.ink, padding: M ? "32px 20px" : "28px 48px" }}>
        <div {...an("st")} style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: M ? "1fr 1fr" : "repeat(4,1fr)", gap: M ? 16 : 0, textAlign: "center" }}>
          {[{ n: "1.6M", l: "bbl/day consumed" }, { n: "580K", l: "bbl/day produced" }, { n: "$29.6B", l: "annual oil imports" }, { n: "130M", l: "motorcycles" }].map(function(x, i) {
            return <div key={i} style={{ padding: "12px 0", borderRight: !M && i < 3 ? "1px solid #333" : "none" }}><div style={{ fontSize: M ? 24 : 30, fontWeight: 700, color: "#fff", fontFamily: T.mon }}>{x.n}</div><div style={{ fontSize: 10, color: "#888", fontFamily: T.mon, textTransform: "uppercase", letterSpacing: 2, marginTop: 4 }}>{x.l}</div></div>;
          })}
        </div>
      </section>

      {/* ═══ CHALLENGE — NET IMPORTER ═══ */}
      <section id="why" ref={rf("w")} style={{ padding: M ? "56px 20px" : "80px 48px", maxWidth: 1200, margin: "0 auto" }}>
        <div {...an("w")} style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: T.mut, textTransform: "uppercase", letterSpacing: 6, fontFamily: T.mon, marginBottom: 12 }}>The Challenge</div>
          <h2 style={{ fontSize: M ? "26px" : "clamp(30px,4vw,48px)", fontWeight: 400, lineHeight: 1.1, color: T.ink, fontFamily: T.ser }}>A nation dependent on <span style={{ color: T.red }}>imported oil</span>.</h2>
        </div>

        {/* NET IMPORTER BOX */}
        <div {...an("w", 0.08)} style={{ maxWidth: 800, margin: "0 auto 40px", padding: M ? "24px 20px" : "32px 36px", borderRadius: 14, background: T.ink, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: T.red }} />
          <div style={{ fontSize: 10, color: "#f87171", textTransform: "uppercase", letterSpacing: 3, fontFamily: T.mon, marginBottom: 12, fontWeight: 700 }}>NET OIL IMPORTER SINCE 2004</div>
          <div style={{ display: "grid", gridTemplateColumns: M ? "1fr" : "1fr auto 1fr auto 1fr", gap: M ? 12 : 0, alignItems: "center", marginBottom: 16 }}>
            <div style={{ textAlign: "center" }}><div style={{ fontSize: M ? 28 : 36, fontWeight: 700, color: "#fff", fontFamily: T.mon }}>1.6M</div><div style={{ fontSize: 10, color: "#94a3b8", fontFamily: T.mon }}>bbl/day consumed</div></div>
            {!M && <div style={{ fontSize: 24, color: "#475569", textAlign: "center", padding: "0 16px" }}>-</div>}
            <div style={{ textAlign: "center" }}><div style={{ fontSize: M ? 28 : 36, fontWeight: 700, color: "#fbbf24", fontFamily: T.mon }}>580K</div><div style={{ fontSize: 10, color: "#94a3b8", fontFamily: T.mon }}>bbl/day produced</div></div>
            {!M && <div style={{ fontSize: 24, color: "#475569", textAlign: "center", padding: "0 16px" }}>=</div>}
            <div style={{ textAlign: "center" }}><div style={{ fontSize: M ? 28 : 36, fontWeight: 700, color: "#f87171", fontFamily: T.mon }}>1.02M</div><div style={{ fontSize: 10, color: "#94a3b8", fontFamily: T.mon }}>bbl/day IMPORTED</div></div>
          </div>
          <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.7, fontFamily: T.ser, fontStyle: "italic" }}>Every single day, Indonesia must import over 1 million barrels of oil. That is over USD 80 million leaving the country daily. This money does not build roads, hospitals, or schools. It flows to oil-producing nations while Indonesia's own reserves deplete further.</div>
          <div style={{ marginTop: 12, fontSize: 12, color: "#f87171", fontWeight: 600, fontFamily: T.mon }}>This is not a future risk. This is happening right now.</div>
        </div>

        {/* Image cards */}
        <div {...an("w", 0.15)} style={{ display: "grid", gridTemplateColumns: M ? "1fr" : "1fr 1fr", gap: 16 }}>
          <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid " + T.brd, background: T.card }}>
            <div style={{ height: 180, backgroundImage: "url(" + IMG.oil + ")", backgroundSize: "cover", backgroundPosition: "center", position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent 40%,rgba(26,26,46,0.8))" }} />
              <div style={{ position: "absolute", bottom: 16, left: 20, color: "#fff" }}><div style={{ fontSize: 32, fontWeight: 700, fontFamily: T.mon }}>IDR 713T</div><div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, fontFamily: T.mon, opacity: 0.8 }}>Energy Subsidies 2024</div></div>
            </div>
            <div style={{ padding: "16px 20px" }}><div style={{ fontSize: 13, color: T.ink2, lineHeight: 1.6 }}>Nearly 90% supporting fossil fuels. The single largest budget item.</div></div>
          </div>
          <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid " + T.brd, background: T.card }}>
            <div style={{ height: 180, backgroundImage: "url(" + IMG.traffic + ")", backgroundSize: "cover", backgroundPosition: "center", position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent 40%,rgba(26,26,46,0.8))" }} />
              <div style={{ position: "absolute", bottom: 16, left: 20, color: "#fff" }}><div style={{ fontSize: 32, fontWeight: 700, fontFamily: T.mon }}>130M</div><div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, fontFamily: T.mon, opacity: 0.8 }}>Motorcycles on Road</div></div>
            </div>
            <div style={{ padding: "16px 20px" }}><div style={{ fontSize: 13, color: T.ink2, lineHeight: 1.6 }}>World's 3rd largest fleet. Consuming 25-30% of all gasoline sold.</div></div>
          </div>
        </div>
      </section>

      {/* ═══ TRANSMISSION ═══ */}
      <section ref={rf("ch")} style={{ padding: M ? "48px 20px" : "56px 48px", background: T.bg2 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div {...an("ch")} style={{ textAlign: "center", marginBottom: 32 }}>
            <h2 style={{ fontSize: M ? "22px" : "32px", fontWeight: 400, color: T.ink, fontFamily: T.ser }}>From barrel to household</h2>
          </div>
          <div {...an("ch", 0.1)} style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 4 }}>
            {["Oil Price\nmoves", "Landed cost\n(Price x FX)", "Govt decision\n(absorb?)", "Fiscal or\ninflation", "Macro ripple\n(trade, IDR)", "EV offset\n(demand down)"].map(function(s, i) {
              return <div key={i} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ padding: "14px 16px", borderRadius: 8, background: i === 5 ? T.acc + "15" : T.card, border: "1px solid " + (i === 5 ? T.acc + "44" : T.brd), textAlign: "center", minWidth: M ? 90 : 120 }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{["\uD83D\uDEE2\uFE0F", "\uD83D\uDCB1", "\uD83C\uDFDB\uFE0F", "\u26A0\uFE0F", "\uD83C\uDF0A", "\u26A1"][i]}</div>
                  <div style={{ fontSize: 10, color: i === 5 ? T.acc2 : T.ink2, lineHeight: 1.3, whiteSpace: "pre-line", fontWeight: 500 }}>{s}</div>
                </div>
                {i < 5 && <div style={{ color: T.mut2, fontSize: 16, padding: "0 2px" }}>{"\u2192"}</div>}
              </div>;
            })}
          </div>
        </div>
      </section>

      {/* ═══ SIMULATION ═══ */}
      <section id="sim" ref={rf("sm")} style={{ padding: M ? "56px 16px" : "80px 48px", maxWidth: 1200, margin: "0 auto" }}>
        <div {...an("sm")} style={{ textAlign: "center", marginBottom: 36 }}>
          <h2 style={{ fontSize: M ? "26px" : "clamp(30px,4vw,50px)", fontWeight: 400, color: T.ink, fontFamily: T.ser }}>Adjust. Simulate. <span style={{ color: T.acc }}>Understand.</span></h2>
        </div>

        <div {...an("sm", 0.08)} style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginBottom: 32 }}>
          {PR.map(function(x, i) { return <button key={i} onClick={function() { aply(i); }} style={{ padding: "7px 14px", borderRadius: 4, border: pr === i ? "2px solid " + T.ink : "1px solid " + T.brd, background: pr === i ? T.ink : T.card, color: pr === i ? T.bg : T.mut, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: T.mon }}>{x.n}</button>; })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: M ? "1fr" : "340px 1fr", gap: M ? 20 : 36, alignItems: "start" }}>
          {/* Controls with +/- buttons */}
          <div {...an("sm", 0.12)} style={{ padding: "24px 22px", borderRadius: 14, border: "1px solid " + T.brd, background: T.bg2, position: M ? "static" : "sticky", top: 16 }}>
            {renderSlider("Brent Oil", inp.brent, function(v) { set("brent", v); }, 40, 150, 5, " $/bbl", null, "brent")}
            {renderSlider("USD/IDR", inp.usdIdr, function(v) { set("usdIdr", v); }, 14000, 19000, 100, "", null, "usdIdr")}
            {renderSlider("Pass-Through", inp.passThrough, function(v) { set("passThrough", v); }, 0, 100, 5, "%", "0% = govt absorbs all", "passThrough")}
            {renderSlider("EV Fleet", inp.evFleetPct, function(v) { set("evFleetPct", v); }, 0, 20, 0.5, "%", Math.round(inp.evFleetPct * 1.3) + "M of 130M", "evFleetPct")}
            <div style={{ display: "flex", gap: 5 }}>
              {[1, 3, 5].map(function(y) { return <button key={y} onClick={function() { set("timeHorizon", y); }} style={{ flex: 1, padding: "8px", borderRadius: 4, border: inp.timeHorizon === y ? "2px solid " + T.acc : "1px solid " + T.brd, background: inp.timeHorizon === y ? T.acc : T.card, color: inp.timeHorizon === y ? "#fff" : T.mut, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: T.mon }}>{y + "Y"}</button>; })}
            </div>
          </div>

          {/* Results */}
          <div>
            {/* Stress + Takeaway */}
            <div {...an("sm", 0.18)} style={{ display: "grid", gridTemplateColumns: M ? "1fr" : "200px 1fr", gap: 16, marginBottom: 20 }}>
              <div style={{ padding: "28px", borderRadius: 14, background: stressBg, border: "1.5px solid " + stressColor + "33", textAlign: "center" }}>
                <div style={{ fontSize: 9, color: T.mut, textTransform: "uppercase", letterSpacing: 3, fontFamily: T.mon, marginBottom: 8 }}>Stress</div>
                <div style={{ fontSize: M ? 52 : 64, fontWeight: 700, color: stressColor, fontFamily: T.mon, lineHeight: 1 }}>{r.ov}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: stressColor, letterSpacing: 4, marginTop: 6, fontFamily: T.mon }}>{stressLabel}</div>
              </div>
              <div style={{ padding: "24px", borderRadius: 14, background: T.ink, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: T.acc }} />
                <div style={{ fontSize: 9, color: T.acc, textTransform: "uppercase", letterSpacing: 3, fontFamily: T.mon, marginBottom: 8 }}>What This Means</div>
                <div style={{ fontSize: M ? 13 : 15, color: "#ddd", lineHeight: 1.65, fontFamily: T.ser, fontStyle: "italic" }}>{tk}</div>
                <div style={{ fontSize: 12, color: "#999", marginTop: 10 }}>{p.hl}</div>
              </div>
            </div>

            {/* Pressure bars */}
            <div {...an("sm", 0.25)} style={{ padding: "20px 22px", borderRadius: 14, border: "1px solid " + T.brd, background: T.card, marginBottom: 20 }}>
              <PBar label="Fiscal" value={r.st.fiscal} />
              <PBar label="External" value={r.st.external} />
              <PBar label="Inflation" value={r.st.inflation} />
              <PBar label="FX" value={r.st.fx} />
            </div>

            {/* Metrics */}
            <div {...an("sm", 0.3)} style={{ display: "grid", gridTemplateColumns: M ? "1fr 1fr" : "repeat(3,1fr)", gap: 10 }}>
              <MetCard label="Subsidy" value={r.sb} unit="IDR Tn/yr" note={r.sc > 0 ? "+" + r.sc : null} />
              <MetCard label="Import Bill" value={r.ni} unit="USD Bn/yr" note={r.td > 0 ? "+" + r.td : null} />
              <MetCard label="Inflation" value={r.ct > 0 ? "+" + r.ct : "0"} unit="pp CPI" />
              <MetCard label="CA Impact" value={(r.cp > 0 ? "+" : "") + r.cp} unit="pp GDP" />
              <MetCard label="EV Import Save" value={r.ai} unit="USD Bn" note={r.ai > 0.5 ? "Material" : null} good={true} />
              <MetCard label="EV Sub Save" value={r.as2} unit="IDR Tn" note={r.as2 > 5 ? "Significant" : null} good={true} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ EV SECTION ═══ */}
      <section ref={rf("ev")} style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url(" + IMG.hero + ")", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(6,182,212,0.9),rgba(6,214,160,0.85))" }} />
        <div style={{ position: "relative", zIndex: 2, padding: M ? "56px 20px" : "72px 48px", maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <div {...an("ev")}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{"\u26A1"}</div>
            <h2 style={{ fontSize: M ? "26px" : "clamp(30px,4.5vw,48px)", fontWeight: 400, lineHeight: 1.1, color: "#fff", fontFamily: T.ser }}>Every electric motorcycle reduces oil exposure.</h2>
            <p style={{ fontSize: M ? 13 : 16, color: "rgba(255,255,255,0.8)", maxWidth: 500, margin: "16px auto 0", lineHeight: 1.65 }}>Not just climate. A structural tool that cuts imports, subsidies, and trade deficits.</p>
          </div>
        </div>
      </section>

      {/* ═══ EV TABLE ═══ */}
      <section ref={rf("et")} style={{ padding: M ? "40px 16px" : "56px 48px", maxWidth: 1000, margin: "0 auto" }}>
        <div {...an("et")} style={{ borderRadius: 14, border: "1px solid " + T.brd, background: T.card, overflowX: "auto" }}>
          <div style={{ padding: M ? "16px" : "20px 24px", minWidth: 550 }}>
            <div style={{ fontSize: 9, color: T.mut, textTransform: "uppercase", letterSpacing: 3, fontFamily: T.mon, marginBottom: 12 }}>EV Impact (Brent {"$" + inp.brent + "/bbl"})</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ borderBottom: "2px solid " + T.brd }}>
                {["Share", "Units", "Gas Cut", "$Import", "RpSub", "CO2"].map(function(h) { return <th key={h} style={{ textAlign: "left", padding: "6px 8px", fontSize: 9, color: T.mut, fontFamily: T.mon, textTransform: "uppercase" }}>{h}</th>; })}
              </tr></thead>
              <tbody>
                {[0.2, 1, 3, 5, 8, 10, 15].map(function(pct, i) {
                  var s = runSim({ brent: inp.brent, usdIdr: inp.usdIdr, passThrough: inp.passThrough, evFleetPct: pct, timeHorizon: inp.timeHorizon, avgKmPerBike: inp.avgKmPerBike, subsidyIntensity: inp.subsidyIntensity });
                  var cur = Math.abs(pct - inp.evFleetPct) < 0.3;
                  return <tr key={pct} style={{ borderBottom: "1px solid " + T.brd + "44", background: cur ? "#ecfdf5" : i % 2 ? T.bg2 : "transparent" }}>
                    <td style={{ padding: "8px", fontSize: 12, fontWeight: cur ? 700 : 400, color: cur ? T.grn : T.ink, fontFamily: T.mon }}>{pct + "%"}</td>
                    <td style={{ padding: "8px", fontSize: 11, color: T.mut, fontFamily: T.mon }}>{Math.round(pct * 1.3) + "M"}</td>
                    <td style={{ padding: "8px", fontSize: 11, fontFamily: T.mon }}>{s.dp + "BL"}</td>
                    <td style={{ padding: "8px", fontSize: 11, color: T.grn, fontWeight: 600, fontFamily: T.mon }}>{"$" + s.ai + "B"}</td>
                    <td style={{ padding: "8px", fontSize: 11, color: T.grn, fontWeight: 600, fontFamily: T.mon }}>{"Rp" + s.as2 + "T"}</td>
                    <td style={{ padding: "8px", fontSize: 11, color: T.grn, fontFamily: T.mon }}>{(s.co2 / 1e6).toFixed(1) + "Mt"}</td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══ FISCAL + ENVIRONMENTAL ═══ */}
      <section ref={rf("fd")} style={{ padding: M ? "56px 20px" : "80px 48px", background: T.bg2, position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url(" + IMG.sky + ")", backgroundSize: "cover", backgroundPosition: "center top", opacity: 0.04 }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 2 }}>
          <div {...an("fd")} style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: M ? "24px" : "clamp(28px,4vw,44px)", fontWeight: 400, lineHeight: 1.1, color: T.ink, fontFamily: T.ser }}>What IDR {sav}T in savings could <span style={{ color: T.acc }}>build</span></h2>
          </div>
          <div {...an("fd", 0.15)} style={{ display: "grid", gridTemplateColumns: M ? "1fr 1fr" : "repeat(5,1fr)", gap: 12 }}>
            {[{ n: hosp, l: "Hospitals", c: "#0369a1" }, { n: sch.toLocaleString(), l: "Schools", c: "#7c3aed" }, { n: toll + "km", l: "Toll Road", c: T.amb }, { n: co2M + "M", l: "Tons CO2 Cut", c: T.grn }, { n: treM + "M", l: "Trees Equiv", c: "#15803d" }].map(function(x, i) {
              return <div key={i} {...an("fd", 0.1 + i * 0.06)} style={{ padding: "24px 16px", borderRadius: 12, background: T.card, border: "1px solid " + T.brd, textAlign: "center" }}>
                <div style={{ fontSize: M ? 28 : 36, fontWeight: 700, color: x.c, fontFamily: T.mon, lineHeight: 1 }}>{x.n}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.ink, marginTop: 6, fontFamily: T.ser }}>{x.l}</div>
              </div>;
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ POLICY BRIEF ═══════════ */}
      <section ref={rf("po")} style={{ padding: M ? "56px 16px" : "80px 48px", background: T.bg }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <div {...an("po")} style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontSize: M ? "24px" : "clamp(28px,4vw,44px)", fontWeight: 400, color: T.ink, fontFamily: T.ser }}>Policy Brief</h2>
            <div style={{ fontSize: 10, color: T.mut, fontFamily: T.mon, marginTop: 8 }}>{"$" + inp.brent + "/bbl | IDR " + inp.usdIdr.toLocaleString() + " | " + inp.passThrough + "%PT | " + inp.evFleetPct + "%EV | " + inp.timeHorizon + "Y"}</div>
          </div>

          <div {...an("po", 0.1)}>
            {/* Assessment */}
            <div style={{ padding: "24px", borderRadius: 12, border: "1.5px solid " + stressColor + "33", background: stressBg, marginBottom: 12 }}>
              <div style={{ fontSize: 9, color: T.mut, textTransform: "uppercase", letterSpacing: 3, fontFamily: T.mon, marginBottom: 8 }}>SITUATION ASSESSMENT</div>
              <div style={{ fontSize: M ? 14 : 17, color: T.ink, lineHeight: 1.7, fontFamily: T.ser }}>{p.hl}</div>
            </div>

            {/* 1st Order */}
            <div style={{ padding: "20px 24px", borderRadius: 12, border: "1px solid #fca5a5", background: T.card, marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#7f1d1d", textTransform: "uppercase", letterSpacing: 3, fontFamily: T.mon, marginBottom: 10, fontWeight: 700 }}>1ST ORDER: ECONOMIC IMPACT</div>
              <BulletList items={p.f1} dotColor={T.red} />
            </div>

            {/* 2nd Order */}
            <div style={{ padding: "20px 24px", borderRadius: 12, border: "1px solid #fcd34d", background: "#fef9ee", marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#78350f", textTransform: "uppercase", letterSpacing: 3, fontFamily: T.mon, marginBottom: 10, fontWeight: 700 }}>2ND ORDER: SOCIAL AND POLITICAL IMPACT</div>
              <BulletList items={p.f2} dotColor={T.amb} />
            </div>

            {/* Why Now */}
            <div style={{ padding: "20px 24px", borderRadius: 12, border: "1px solid #93c5fd", background: "#eff6ff", marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#1e3a5f", textTransform: "uppercase", letterSpacing: 3, fontFamily: T.mon, marginBottom: 10, fontWeight: 700 }}>WHY NOW: THE URGENCY</div>
              <BulletList items={p.wn} dotColor="#1d4ed8" />
            </div>

            {/* What If Not */}
            <div style={{ padding: "20px 24px", borderRadius: 12, border: "1px solid #334155", background: T.ink, marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#f87171", textTransform: "uppercase", letterSpacing: 3, fontFamily: T.mon, marginBottom: 10, fontWeight: 700 }}>COST OF INACTION</div>
              <BulletList items={p.wif} dotColor="#ef4444" textColor="#bbb" />
            </div>

            {/* SHORT TERM */}
            <div style={{ padding: "20px 24px", borderRadius: 12, border: "1px solid " + T.acc + "44", background: "#ecfeff", marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: T.acc2, textTransform: "uppercase", letterSpacing: 3, fontFamily: T.mon, marginBottom: 10, fontWeight: 700 }}>SHORT-TERM ACTIONS (0-12 MONTHS)</div>
              <NumberedList items={p.rcShort} prefix="S" badgeBg={T.acc + "22"} badgeColor={T.acc2} />
            </div>

            {/* LONG TERM */}
            <div style={{ padding: "20px 24px", borderRadius: 12, border: "1px solid " + T.grn + "44", background: "#f0fdf4", marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: T.grn, textTransform: "uppercase", letterSpacing: 3, fontFamily: T.mon, marginBottom: 10, fontWeight: 700 }}>LONG-TERM STRUCTURAL ACTIONS (1-5 YEARS)</div>
              <NumberedList items={p.rcLong} prefix="L" badgeBg={T.grn + "22"} badgeColor={T.grn} />
            </div>

            {/* Confidence */}
            <div style={{ padding: "14px 18px", borderRadius: 8, background: "#fef9ee", border: "1px solid #fcd34d" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#78350f", fontFamily: T.mon, marginBottom: 3 }}>CONFIDENCE NOTE</div>
              <div style={{ fontSize: 10, color: T.mut, lineHeight: 1.5 }}>Simplified macro model. Directionally reliable, not precise. Uncertainties: avg km/yr (6K-10K), Pertamina compensation formula, EV adoption trajectory. CO2: IPCC 2.31 kg/L. Trees: EPA 22 kg/yr.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ METHODOLOGY ═══ */}
      <section ref={rf("me")} style={{ padding: M ? "48px 20px" : "64px 48px", background: T.bg2 }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div {...an("me")} style={{ marginBottom: 32, textAlign: "center" }}><h2 style={{ fontSize: M ? "22px" : "32px", fontWeight: 400, color: T.ink, fontFamily: T.ser }}>How this works</h2></div>
          {[["Model", "Oil price to landed cost (via FX) to subsidy gap to fiscal burden to trade deficit to inflation to FX pressure. EVs reduce gasoline volume through entire chain."],
            ["Data", "Crack $10/bbl. 159L/bbl. Pertalite IDR10K/L. Vol ~30BL/yr. Imports ~300Kbpd. CPI 4%. Fleet 130M. GDP ~$1,400B."],
            ["Sources", "BI, MoF, BPS, ESDM, IEA, World Bank, IISD, ICCT, IPCC"],
            ["Limits", "No GDP model, endogenous FX, BI reaction, provincial data, grid constraints, battery imports."]
          ].map(function(item, i) {
            return <div key={i} {...an("me", i * 0.06)} style={{ padding: "16px 20px", borderRadius: 10, border: "1px solid " + T.brd, background: T.card, marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.ink, fontFamily: T.ser, marginBottom: 4 }}>{item[0]}</div>
              <div style={{ fontSize: 11, color: T.mut, lineHeight: 1.6 }}>{item[1]}</div>
            </div>;
          })}
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ padding: M ? "48px 20px 32px" : "64px 48px 40px", borderTop: "1px solid " + T.brd, background: T.bg }}>
        <div style={{ maxWidth: 620, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 16, color: T.ink, fontFamily: T.ser, marginBottom: 6 }}>Indonesia Oil-Macro-EV Simulator</div>
          <div style={{ fontSize: 10, color: T.mut, fontFamily: T.mon, marginBottom: 20 }}>BI | MoF | BPS | ESDM | IEA | World Bank | IISD | ICCT</div>
          <div style={{ padding: "18px 20px", borderRadius: 10, background: T.card, border: "1px solid " + T.brd, marginBottom: 14, textAlign: "left" }}>
            <div style={{ fontSize: 12, color: T.mut, lineHeight: 1.75, fontStyle: "italic", fontFamily: T.ser }}>This simulation combines research with simplifying assumptions. Not a conclusion but an <strong style={{ fontStyle: "normal", color: T.ink }}>invitation to think</strong>. I would be happy if others improve it. The goal: a more informed conversation.</div>
          </div>
          <div style={{ padding: "18px 20px", borderRadius: 10, background: T.ink, color: "#fff" }}>
            <div style={{ fontSize: 14, fontFamily: T.ser, marginBottom: 4 }}>Created by Gunawan Panjaitan</div>
            <div style={{ fontSize: 11, color: T.mut2, marginBottom: 8 }}>EV enthusiast exploring energy economics and Indonesia's future</div>
            <div style={{ fontSize: 11, color: T.mut }}>
              <a href="mailto:gunawan_pnjaitan@yahoo.co.id" style={{ color: T.acc, textDecoration: "none" }}>gunawan_pnjaitan@yahoo.co.id</a>
              <span style={{ margin: "0 8px" }}>|</span>
              <a href="https://www.linkedin.com/in/gunawan-panjaitan/" target="_blank" rel="noopener noreferrer" style={{ color: T.acc, textDecoration: "none" }}>LinkedIn</a>
            </div>
          </div>
          <div style={{ fontSize: 9, color: T.mut2, marginTop: 14, fontFamily: T.mon }}>Provisional estimates | Validate before policy use | 2026</div>
        </div>
      </footer>
    </div>
  );
}
