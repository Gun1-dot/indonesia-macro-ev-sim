import { useState, useEffect, useCallback, useMemo, useRef } from "react";

/* ════════════════════════════════════════════════════════════════
   INDONESIA MACRO-EV SIMULATOR
   Cleaned replacement App.jsx
   Main fix:
   - Policy Brief never renders blank
   - safer policy generation fallback
   - animation helper no longer hides the section forever
   - cleaner section rendering
   ════════════════════════════════════════════════════════════════ */

function sim(inp) {
  const {
    brent: B,
    usdIdr: U,
    passThrough: PT,
    evFleetPct: EV,
    timeHorizon: TH,
    avgKmPerBike: KM,
    subsidyIntensity: SI,
  } = inp;

  const BB = 75;
  const BI = 15800;
  const CR = 10;
  const FR = 0.05;
  const RT = 10000;
  const VL = 30;
  const IB = 300000;
  const MT = 130;
  const GDP = 1400;
  const FK = 0.025;
  const CW = 0.04;
  const CM = 0.7;

  const ld = ((B + CR) / 159) * (1 + FR) * U;
  const bld = ((BB + CR) / 159) * (1 + FR) * BI;
  const er = RT + (PT / 100) * Math.max(0, ld - RT);
  const gp = Math.max(0, ld - er);
  const bg = Math.max(0, bld - RT);

  const eu = (EV / 100) * MT * 1e6;
  const dp = (eu * KM * FK) / 1e9;
  const ev = Math.max(0, VL - dp);

  const sb = (gp * ev * 1e9) / 1e12 * SI;
  const bs = (bg * VL * 1e9) / 1e12;
  const sc = sb - bs;
  const fp = (sc * 1e12 / (GDP * 1e9 * U)) * 100;

  const ib = (IB * 365 * (B + CR)) / 1e9;
  const bi2 = (IB * 365 * (BB + CR)) / 1e9;
  const ai = (dp * 1e9 * (B + CR) / 159) / 1e9;
  const ni = ib - ai;
  const td = ni - bi2;
  const cp = (td / GDP) * 100;

  const fc = ((er - RT) / RT) * 100;
  const cd = CW * (fc / 100) * 100;
  const ct = cd * (1 + CM);

  const fx = Math.min(
    10,
    Math.max(0, ((U - BI) / BI) * 30 + (td / 5) * 2 + ((B - BB) / BB) * 5)
  );

  const as2 = (gp * dp * 1e9) / 1e12;
  const co2 = (dp * 1e9 * 2.31) / 1000;

  const st = {
    fiscal: Math.min(10, Math.max(0, (sb / 100) * 3 + fp * 5)),
    external: Math.min(10, Math.max(0, (td / 3) * 2 + cp * 10)),
    inflation: Math.min(10, Math.max(0, ct * 2)),
    fx,
  };

  const hm = TH <= 1 ? 1 : TH <= 3 ? 0.85 : 0.7;
  const ov = (st.fiscal * 0.3 + st.external * 0.25 + st.inflation * 0.25 + st.fx * 0.2) * hm;

  return {
    ld: Math.round(ld),
    er: Math.round(er),
    gp: Math.round(gp),
    sb: +sb.toFixed(1),
    sc: +sc.toFixed(1),
    fp: +fp.toFixed(2),
    ni: +ni.toFixed(1),
    td: +td.toFixed(1),
    cp: +cp.toFixed(2),
    ct: +ct.toFixed(2),
    fx: +fx.toFixed(1),
    dp: +dp.toFixed(2),
    ai: +ai.toFixed(2),
    as2: +as2.toFixed(1),
    evM: +(eu / 1e6).toFixed(1),
    co2: Math.round(co2),
    st,
    ov: +ov.toFixed(1),
  };
}

function pol(r, inp) {
  const e = Object.entries(r.st).sort((a, b) => b[1] - a[1]);
  const nm = {
    fiscal: "Fiscal",
    external: "External",
    inflation: "Inflation",
    fx: "Exchange Rate",
  };

  const sv = r.ov > 7 ? "severe" : r.ov > 5 ? "significant" : r.ov > 3 ? "moderate" : "manageable";

  let hl =
    r.ov <= 2
      ? "Indonesia can absorb current oil prices without material fiscal or external stress. Macro fundamentals are stable."
      : r.ov <= 4
        ? `${sv.charAt(0).toUpperCase() + sv.slice(1)} macro pressure detected, primarily through the ${nm[e[0][0]].toLowerCase()} channel. Manageable but warrants active monitoring and preparedness.`
        : r.ov <= 6
          ? `Significant stress building across ${nm[e[0][0]].toLowerCase()} and ${nm[e[1][0]].toLowerCase()} channels. Policy intervention is advisable before pressures compound.`
          : "Warning: Severe multi-channel macro stress. Without coordinated fiscal, monetary, and structural response, cascading economic and social consequences are likely.";

  const f1 = [];
  f1.push(
    `Oil import bill: Indonesia pays USD ${r.ni} billion/year for oil imports${r.td > 0 ? ` (+${r.td}B vs baseline), directly widening the trade deficit.` : "."}`
  );
  if (r.st.fiscal > 2) {
    f1.push(
      `Fiscal burden: Government spends IDR ${r.sb} trillion/year on fuel subsidies${r.sc > 0 ? ` (+${r.sc}T vs baseline), consuming budget meant for development.` : "."}`
    );
  }
  if (r.st.inflation > 1.5) {
    f1.push(
      `Inflation: Consumer prices rise by an estimated ${r.ct} percentage points, driven by fuel cost pass-through into transport, food, and logistics across the archipelago.`
    );
  }
  if (r.st.fx > 2) {
    f1.push(
      `Currency pressure: The rupiah faces depreciation pressure (FX stress score ${r.fx}/10), making all imports more expensive and creating a compounding cost spiral.`
    );
  }
  f1.push(
    `Current account: Oil trade deficit contributes ${r.cp > 0 ? "+" : ""}${r.cp} percentage points to the current account balance as share of GDP.`
  );

  const f2 = [];
  if (r.st.inflation > 2 && inp.passThrough > 20) {
    f2.push(
      "Household welfare: Rising fuel and food prices hit lower-income households hardest. Motorcycle-dependent workers (ojol, delivery, farmers) spend a higher share of income on fuel. A 20-30% transport cost increase can push vulnerable families below the poverty line."
    );
  }
  if (r.st.inflation > 3 && inp.passThrough > 30) {
    f2.push(
      "Social stability risk: Indonesia has documented history of public unrest following fuel price hikes (1998, 2005, 2013, 2022). The political cost of visible price increases is high and immediate."
    );
  }
  if (r.st.fiscal > 3) {
    f2.push(
      "Development trade-off: Every IDR trillion absorbed by fuel subsidies is an IDR trillion NOT spent on hospitals, schools, roads, and job creation. This is invisible in the short term but compounds into long-term development setbacks."
    );
  }
  if (r.st.fiscal > 4) {
    f2.push(
      "Political dilemma: Elected officials face backlash for raising fuel prices AND backlash when infrastructure is delayed. There is no cost-free option. The subsidy trap limits policy flexibility."
    );
  }
  if (r.st.fx > 3) {
    f2.push(
      "Public confidence: A weakening rupiah erodes confidence in economic management. Currency movements dominate media coverage and shape voter sentiment, even when underlying fundamentals are manageable."
    );
  }
  if (r.ov > 4) {
    f2.push(
      "Investment climate: Sustained macro stress slows foreign direct investment, weakens job creation, and risks turning Indonesia's demographic dividend (young growing workforce) into a demographic liability if employment absorption falls short."
    );
  }
  if (f2.length === 0) {
    f2.push(
      "Under this scenario, social and political risks remain contained. Household welfare is not materially threatened, and no significant political pressure points are activated."
    );
  }

  const wn = [];
  wn.push(
    "Oil import dependence is structural and growing: domestic production has declined from 1.6M bpd (1990s) to under 600,000 bpd today. The vulnerability deepens every year without structural change."
  );
  if (inp.brent > 85) {
    wn.push(
      `At USD ${inp.brent}/bbl, every month of delay adds approximately IDR ${Math.round((r.sb / 12) * 10) / 10} trillion in subsidy obligations that must eventually be paid by taxpayers, consumers, or through forgone development.`
    );
  }
  wn.push(
    "The global EV transition is accelerating. Countries that move early (China, Vietnam, India, Thailand) are locking in manufacturing investment. Delay means Indonesia imports EVs rather than builds them, missing the industrial opportunity."
  );
  wn.push(
    "Indonesia's 2030 demographic window is once-in-a-generation. Wasting fiscal space on fuel subsidies during this window means failing to invest in the human capital that determines whether Indonesia becomes a high-income economy."
  );

  const wif = [];
  wif.push(
    "Without structural action, Indonesia's oil import bill will continue to grow as a share of GDP. The subsidy burden will expand. Sensitivity to global oil volatility will increase, not decrease."
  );
  wif.push(
    "130 million motorcycles will continue burning 25-30 billion liters per year of imported gasoline. This is a permanent, recurring drain on the trade balance and fiscal budget that compounds annually."
  );
  if (r.st.fiscal > 3) {
    wif.push(
      "Risk of repeating the 2013-2014 fiscal crisis, when energy subsidies consumed over 20% of the national budget and forced emergency austerity measures that damaged growth and public services for years."
    );
  }
  wif.push(
    "The long-term cost of inaction is not stasis. It is structural decline. Indonesia's peer competitors (Vietnam, India, Thailand) are moving aggressively on energy transition and EV industrialization. Standing still means falling behind."
  );

  const rcShort = [];
  if (r.st.fiscal > 4 && inp.passThrough < 50) {
    rcShort.push(
      "Implement partial fuel price pass-through (30-50%) combined with targeted cash transfers (BLT/BST) to cushion vulnerable households while reducing the fiscal hemorrhage."
    );
  }
  if (r.st.fiscal > 3) {
    rcShort.push(
      "Conduct emergency fiscal review to protect infrastructure, health, and education budgets from subsidy crowding-out. Prepare APBN-P budget revision for Pertamina compensation."
    );
  }
  if (r.st.inflation > 3) {
    rcShort.push(
      "Coordinate with Bank Indonesia on inflation expectations management. Prepare communication strategy before any administered price adjustment."
    );
  }
  if (r.st.external > 3) {
    rcShort.push(
      "Strengthen FX reserve buffers through bilateral swap line activation and SRBI issuance to stabilize rupiah."
    );
  }
  rcShort.push(
    "Extend EV 2-wheeler purchase subsidy (IDR 7M/unit) and fast-track the conversion program for ride-hailing and delivery fleets, which have the highest daily km and therefore the highest per-unit gasoline displacement."
  );
  rcShort.push(
    "Announce a clear 12-month EV adoption target and charging infrastructure roadmap to signal policy commitment and crowd-in private investment."
  );

  const rcLong = [];
  rcLong.push(
    "Set a binding national target: 10% EV motorcycle fleet share by 2030 (13M units). At this threshold, Indonesia saves USD 1.5-2.5B/year in imports and IDR 13-20T/year in subsidies, structurally reducing oil vulnerability."
  );
  rcLong.push(
    "Develop domestic EV and battery manufacturing capacity. Indonesia controls 22% of global nickel reserves. Vertical integration from nickel mining to battery cells to EV assembly creates an industrial ecosystem worth tens of billions."
  );
  rcLong.push(
    "Implement gradual, pre-announced fuel subsidy reform roadmap with 3-year transition timeline. Link subsidy reduction to visible increases in infrastructure and social spending so the public sees what the savings buy."
  );
  rcLong.push(
    "Build nationwide battery swap and charging infrastructure targeting 50,000+ points by 2028. Focus on Java first (59% of motorcycles), then expand to Sumatra and Kalimantan."
  );
  rcLong.push(
    "Establish an Energy Transition Fund: redirect a fixed percentage of annual fuel subsidy savings (e.g., 30%) into a ring-fenced fund for EV incentives, renewable energy, and green infrastructure. This creates a self-reinforcing cycle where more EVs = less subsidy = more fund = more EVs."
  );

  return { hl, sv, top: nm[e[0][0]], rcShort, rcLong, f1, f2, wn, wif };
}

const EMPTY_POLICY = {
  hl: "Policy assessment unavailable. Please adjust the simulation inputs or reload the page.",
  sv: "manageable",
  top: "Fiscal",
  rcShort: [
    "Maintain EV 2-wheeler subsidy support for high-usage fleets.",
    "Prepare targeted social protection if fuel pass-through increases.",
  ],
  rcLong: [
    "Build a long-term EV ecosystem and subsidy reform roadmap.",
  ],
  f1: ["Economic impact is being recalculated."],
  f2: ["Social and political impact is being recalculated."],
  wn: ["The urgency case is being recalculated."],
  wif: ["The cost of inaction is being recalculated."],
};

const PR = [
  { n: "Base Case", d: "Current", b: 75, u: 15800, p: 15, e: 0.2, t: 1, k: 8000, s: 1 },
  { n: "Oil Shock", d: "$110/bbl", b: 110, u: 16200, p: 15, e: 0.2, t: 1, k: 8000, s: 1 },
  { n: "Double Hit", d: "Oil+weak IDR", b: 110, u: 17500, p: 10, e: 0.2, t: 1, k: 8000, s: 1 },
  { n: "Reform", d: "Pass-through+EV", b: 100, u: 16000, p: 50, e: 3, t: 3, k: 8000, s: 1 },
  { n: "EV Future", d: "12% fleet", b: 95, u: 16000, p: 30, e: 12, t: 5, k: 8000, s: 1 },
];

const I = {
  hero: "/hero-ev.jpg",
  oil: "/oil-refinery.jpg",
  traffic: "/motorcycle-traffic.jpg",
  sky: "/jakarta-skyline.jpg",
};

const T = {
  bg: "#faf8f3",
  bg2: "#f3efe6",
  ink: "#1a1a2e",
  ink2: "#3a3a52",
  mut: "#8b8680",
  mut2: "#b5afa6",
  brd: "#ddd8ce",
  acc: "#06b6d4",
  acc2: "#0e7490",
  amb: "#b45309",
  red: "#991b1b",
  grn: "#166534",
  ev: "#06d6a0",
  card: "#fffdf7",
  ser: "'DM Serif Text', Georgia, serif",
  mon: "'Space Mono', monospace",
  san: "'Instrument Sans', -apple-system, sans-serif",
};

function useW() {
  const [w, s] = useState(1200);
  useEffect(() => {
    s(window.innerWidth);
    const h = () => s(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

function normalizePolicy(result) {
  if (!result) return EMPTY_POLICY;
  return {
    hl: result.hl || EMPTY_POLICY.hl,
    sv: result.sv || EMPTY_POLICY.sv,
    top: result.top || EMPTY_POLICY.top,
    rcShort: Array.isArray(result.rcShort) && result.rcShort.length ? result.rcShort : EMPTY_POLICY.rcShort,
    rcLong: Array.isArray(result.rcLong) && result.rcLong.length ? result.rcLong : EMPTY_POLICY.rcLong,
    f1: Array.isArray(result.f1) && result.f1.length ? result.f1 : EMPTY_POLICY.f1,
    f2: Array.isArray(result.f2) && result.f2.length ? result.f2 : EMPTY_POLICY.f2,
    wn: Array.isArray(result.wn) && result.wn.length ? result.wn : EMPTY_POLICY.wn,
    wif: Array.isArray(result.wif) && result.wif.length ? result.wif : EMPTY_POLICY.wif,
  };
}

function PolicyList({ items, dotColor, textColor = T.ink2 }) {
  return items.map((x, i) => (
    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
      <div
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: dotColor,
          marginTop: 5,
          flexShrink: 0,
        }}
      />
      <div style={{ fontSize: 12, color: textColor, lineHeight: 1.6 }}>{x}</div>
    </div>
  ));
}

export default function App() {
  const [inp, si] = useState({
    brent: 75,
    usdIdr: 15800,
    passThrough: 15,
    evFleetPct: 0.2,
    timeHorizon: 1,
    avgKmPerBike: 8000,
    subsidyIntensity: 1,
  });
  const [pr, spr] = useState(0);
  const [vis, sv] = useState({});
  const [loaded, setL] = useState(false);
  const [sp, setSp] = useState(0);
  const [cmp, setCmp] = useState(false);
  const [ci, setCi] = useState(1);
  const [cnt, setCnt] = useState(0);
  const refs = useRef({});
  const W = useW();
  const M = W < 768;

  useEffect(() => {
    const i = setInterval(() => setCnt((c) => c + 93.8), 100);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setL(true), 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const h = () => {
      const d = document.documentElement;
      const denom = d.scrollHeight - d.clientHeight;
      setSp(denom > 0 ? (d.scrollTop / denom) * 100 : 0);
    };
    window.addEventListener("scroll", h);
    h();
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            sv((prev) => ({ ...prev, [entry.target.dataset.s]: true }));
          }
        });
      },
      { threshold: 0.06 }
    );

    Object.values(refs.current).forEach((el) => {
      if (el) obs.observe(el);
    });

    return () => obs.disconnect();
  }, []);

  const set = useCallback((k, v) => {
    si((p) => ({ ...p, [k]: v }));
    spr(-1);
  }, []);

  const aply = useCallback((i) => {
    const p = PR[i];
    si({
      brent: p.b,
      usdIdr: p.u,
      passThrough: p.p,
      evFleetPct: p.e,
      timeHorizon: p.t,
      avgKmPerBike: p.k,
      subsidyIntensity: p.s,
    });
    spr(i);
  }, []);

  const r = useMemo(() => sim(inp), [inp]);
  const p = useMemo(() => {
    try {
      return normalizePolicy(pol(r, inp));
    } catch (err) {
      console.error("Policy brief generation failed:", err);
      return EMPTY_POLICY;
    }
  }, [r, inp]);

  const cr = useMemo(() => {
    const x = PR[ci];
    return sim({
      brent: x.b,
      usdIdr: x.u,
      passThrough: x.p,
      evFleetPct: x.e,
      timeHorizon: x.t,
      avgKmPerBike: x.k,
      subsidyIntensity: x.s,
    });
  }, [ci]);

  const t10 = useMemo(() => sim({ ...inp, evFleetPct: 10 }), [inp]);
  const sav = t10.as2;
  const hosp = Math.round(sav / 0.3);
  const sch = Math.round(sav / 0.015);
  const toll = Math.round(sav / 0.25);
  const co2M = (t10.co2 / 1e6).toFixed(2);
  const treM = (Math.round(t10.co2 / 0.022) / 1e6).toFixed(1);

  const tk =
    r.ov <= 2
      ? "Stable. No immediate action needed."
      : r.sc > 20
        ? `+IDR ${r.sc}T/yr in subsidies = ${Math.round(r.sc / 0.3)} hospitals never built.`
        : r.td > 3
          ? `+USD ${r.td}B/yr leaving Indonesia for oil imports.`
          : `+IDR ${r.sc}T subsidy, +USD ${r.td}B imports. Compounds if sustained.`;

  const rf = (id) => (el) => {
    if (el) {
      el.dataset.s = id;
      refs.current[id] = el;
    }
  };

  const an = (id, d = 0) => ({
    style: {
      opacity: vis[id] ? 1 : 0,
      transform: vis[id] ? "translateY(0)" : "translateY(30px)",
      transition: `all 0.8s cubic-bezier(.25,.46,.45,.94) ${d}s`,
    },
  });

  const sc = r.ov <= 2.5 ? T.grn : r.ov <= 5 ? T.amb : r.ov <= 7.5 ? "#c2410c" : T.red;
  const sl = r.ov <= 2.5 ? "LOW" : r.ov <= 5 ? "MODERATE" : r.ov <= 7.5 ? "HIGH" : "SEVERE";
  const sb = r.ov <= 2.5 ? "#eef7ee" : r.ov <= 5 ? "#fef9ee" : r.ov <= 7.5 ? "#fef3ec" : "#fef2f2";

  function S({ l, v, fn, mn, mx, st, u, sub }) {
    const pc = ((v - mn) / (mx - mn)) * 100;
    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: T.ink2 }}>{l}</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: T.ink, fontFamily: T.mon }}>
            {v.toLocaleString()}
            {u}
          </span>
        </div>
        <input
          type="range"
          min={mn}
          max={mx}
          step={st}
          value={v}
          onChange={(e) => fn(parseFloat(e.target.value))}
          style={{
            width: "100%",
            height: 5,
            appearance: "none",
            background: `linear-gradient(90deg,${T.acc} ${pc}%,${T.brd} ${pc}%)`,
            borderRadius: 3,
            outline: "none",
            cursor: "pointer",
          }}
        />
        {sub && <div style={{ fontSize: 10, color: T.mut2, marginTop: 3 }}>{sub}</div>}
      </div>
    );
  }

  function PB({ l, v }) {
    const pc = Math.min(100, (v / 10) * 100);
    const c = v <= 2.5 ? T.grn : v <= 5 ? T.amb : v <= 7.5 ? "#c2410c" : T.red;
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: T.ink2 }}>{l}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: c, fontFamily: T.mon }}>{v.toFixed(1)}</span>
        </div>
        <div style={{ height: 7, background: T.brd, borderRadius: 4, overflow: "hidden" }}>
          <div
            style={{
              width: `${pc}%`,
              height: "100%",
              background: `linear-gradient(90deg,${c}88,${c})`,
              borderRadius: 4,
              transition: "width 0.7s ease",
            }}
          />
        </div>
      </div>
    );
  }

  function MC({ l, v, u, n, g }) {
    return (
      <div style={{ padding: M ? "14px 16px" : "20px 22px", borderRadius: 12, background: T.card, border: `1px solid ${T.brd}` }}>
        <div style={{ fontSize: 9, color: T.mut, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6, fontFamily: T.mon }}>{l}</div>
        <div style={{ fontSize: M ? 22 : 28, fontWeight: 700, color: T.ink, fontFamily: T.mon, lineHeight: 1 }}>{v}</div>
        <div style={{ fontSize: 10, color: T.mut, marginTop: 3 }}>{u}</div>
        {n && <div style={{ fontSize: 10, color: g ? T.grn : T.red, fontWeight: 600, marginTop: 4 }}>{n}</div>}
      </div>
    );
  }

  if (!loaded) {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: T.bg }}>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Text:ital@0;1&family=Space+Mono:wght@400;700&family=Instrument+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <div style={{ fontSize: 24, color: T.ink, fontFamily: T.ser, marginBottom: 6 }}>Indonesia Macro-EV</div>
        <div style={{ fontSize: 11, color: T.mut, fontFamily: T.mon }}>Loading...</div>
        <div style={{ width: 36, height: 36, border: `2px solid ${T.brd}`, borderTop: `2px solid ${T.acc}`, borderRadius: "50%", animation: "sp .8s linear infinite", marginTop: 20 }} />
        <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ background: T.bg, color: T.ink, fontFamily: T.san, overflowX: "hidden" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Serif+Text:ital@0;1&family=Space+Mono:wght@400;700&family=Instrument+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:${T.acc};cursor:pointer;border:3px solid ${T.bg};box-shadow:0 2px 8px ${T.acc}44}
        input[type=range]::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:${T.acc};cursor:pointer;border:3px solid ${T.bg}}
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
      `}</style>

      <div style={{ position: "fixed", top: 0, left: 0, width: `${sp}%`, height: 2, background: `linear-gradient(90deg,${T.acc},${T.ev})`, zIndex: 99998 }} />

      <section ref={rf("h")} style={{ position: "relative", overflow: "hidden", padding: 0 }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${I.hero})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(250,248,243,0.92) 0%,rgba(250,248,243,0.75) 50%,rgba(250,248,243,0.5) 100%)" }} />
        <div style={{ position: "relative", zIndex: 2, padding: M ? "48px 20px 40px" : "72px 48px 56px", maxWidth: 1200, margin: "0 auto" }}>
          <div {...an("h")} style={{ maxWidth: 600 }}>
            <div style={{ fontSize: 10, color: T.mut, textTransform: "uppercase", letterSpacing: 6, marginBottom: 20, fontFamily: T.mon }}>Indonesia Macro Simulation</div>
            <h1 style={{ fontSize: M ? "32px" : "clamp(40px,5.5vw,64px)", fontWeight: 400, lineHeight: 1.08, color: T.ink, letterSpacing: -2, fontFamily: T.ser }}>
              How oil prices shape<br /><span style={{ color: T.acc }}>Indonesia's</span> economy.
            </h1>
            <p style={{ fontSize: M ? 13 : 16, color: T.mut, maxWidth: 440, marginTop: 20, lineHeight: 1.7 }}>
              Interactive decision-support for policy makers and investors. Simulate shocks. Discover EV resilience.
            </p>
            <div style={{ marginTop: 28, padding: "16px 24px", borderRadius: 10, background: "rgba(26,26,46,0.06)", border: `1px solid ${T.brd}`, display: "inline-block", backdropFilter: "blur(8px)" }}>
              <div style={{ fontSize: 9, color: T.mut, textTransform: "uppercase", letterSpacing: 3, marginBottom: 4, fontFamily: T.mon }}>Indonesia has spent on oil imports since you opened this page</div>
              <div style={{ fontSize: M ? 26 : 38, fontWeight: 700, color: T.red, fontFamily: T.mon, letterSpacing: -1 }}>${Math.floor(cnt).toLocaleString()}</div>
              <div style={{ fontSize: 10, color: T.mut2, fontFamily: T.mon }}>~$938 per second, 24/7</div>
            </div>
            <div style={{ marginTop: 28, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => document.getElementById("sim")?.scrollIntoView({ behavior: "smooth" })} style={{ padding: "12px 28px", borderRadius: 4, background: T.ink, color: T.bg, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: T.mon, letterSpacing: 1 }}>SIMULATE</button>
              <button onClick={() => document.getElementById("why")?.scrollIntoView({ behavior: "smooth" })} style={{ padding: "12px 28px", borderRadius: 4, background: "transparent", color: T.ink, fontSize: 13, fontWeight: 600, border: `1.5px solid ${T.brd}`, cursor: "pointer", fontFamily: T.mon, letterSpacing: 1 }}>LEARN MORE</button>
            </div>
          </div>
        </div>
      </section>

      <section ref={rf("st")} style={{ background: T.ink, padding: M ? "32px 20px" : "28px 48px" }}>
        <div {...an("st")} style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: M ? "1fr" : "repeat(4,1fr)", gap: M ? 16 : 0, textAlign: "center" }}>
          {[
            { n: "1.6M", l: "bbl/day consumed" },
            { n: "580K", l: "bbl/day produced" },
            { n: "$29.6B", l: "annual oil imports" },
            { n: "130M", l: "motorcycles" },
          ].map((x, i) => (
            <div key={i} style={{ padding: "12px 0", borderRight: !M && i < 3 ? "1px solid #333" : "none" }}>
              <div style={{ fontSize: M ? 24 : 30, fontWeight: 700, color: "#fff", fontFamily: T.mon }}>{x.n}</div>
              <div style={{ fontSize: 10, color: "#888", fontFamily: T.mon, textTransform: "uppercase", letterSpacing: 2, marginTop: 4 }}>{x.l}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="why" ref={rf("w")} style={{ padding: M ? "56px 20px" : "80px 48px", maxWidth: 1200, margin: "0 auto" }}>
        <div {...an("w")} style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: T.mut, textTransform: "uppercase", letterSpacing: 6, fontFamily: T.mon, marginBottom: 12 }}>The Challenge</div>
          <h2 style={{ fontSize: M ? "26px" : "clamp(30px,4vw,48px)", fontWeight: 400, lineHeight: 1.1, color: T.ink, fontFamily: T.ser }}>
            A nation dependent on <span style={{ color: T.red }}>imported oil</span>.
          </h2>
        </div>

        <div {...an("w", 0.08)} style={{ maxWidth: 800, margin: "0 auto 40px", padding: M ? "24px 20px" : "32px 36px", borderRadius: 14, background: T.ink, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: T.red }} />
          <div style={{ fontSize: 10, color: "#f87171", textTransform: "uppercase", letterSpacing: 3, fontFamily: T.mon, marginBottom: 12, fontWeight: 700 }}>NET OIL IMPORTER SINCE 2004</div>
          <div style={{ display: "grid", gridTemplateColumns: M ? "1fr" : "1fr auto 1fr auto 1fr", gap: M ? 12 : 0, alignItems: "center", marginBottom: 16 }}>
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: M ? 28 : 36, fontWeight: 700, color: "#fff", fontFamily: T.mon }}>1.6M</div>
              <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: T.mon }}>bbl/day consumed</div>
            </div>
            {!M && <div style={{ fontSize: 24, color: "#475569", textAlign: "center", padding: "0 16px" }}>-</div>}
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: M ? 28 : 36, fontWeight: 700, color: "#fbbf24", fontFamily: T.mon }}>580K</div>
              <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: T.mon }}>bbl/day produced</div>
            </div>
            {!M && <div style={{ fontSize: 24, color: "#475569", textAlign: "center", padding: "0 16px" }}>=</div>}
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: M ? 28 : 36, fontWeight: 700, color: "#f87171", fontFamily: T.mon }}>1.02M</div>
              <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: T.mon }}>bbl/day IMPORTED</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.7, fontFamily: T.ser, fontStyle: "italic" }}>
            Every single day, Indonesia must import over 1 million barrels of oil from abroad. That is over USD 80 million leaving the country daily at current prices.
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: "#f87171", fontWeight: 600, fontFamily: T.mon }}>This is not a future risk. This is happening right now.</div>
        </div>
      </section>

      <section id="sim" ref={rf("sm")} style={{ padding: M ? "56px 16px" : "80px 48px", maxWidth: 1200, margin: "0 auto" }}>
        <div {...an("sm")} style={{ textAlign: "center", marginBottom: 36 }}>
          <h2 style={{ fontSize: M ? "26px" : "clamp(30px,4vw,50px)", fontWeight: 400, color: T.ink, fontFamily: T.ser }}>
            Adjust. Simulate. <span style={{ color: T.acc }}>Understand.</span>
          </h2>
        </div>

        <div {...an("sm", 0.08)} style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginBottom: 32 }}>
          {PR.map((x, i) => (
            <button key={i} onClick={() => aply(i)} style={{ padding: "7px 14px", borderRadius: 4, border: pr === i ? `2px solid ${T.ink}` : `1px solid ${T.brd}`, background: pr === i ? T.ink : T.card, color: pr === i ? T.bg : T.mut, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: T.mon }}>
              {x.n}
            </button>
          ))}
          <button onClick={() => setCmp(!cmp)} style={{ padding: "7px 14px", borderRadius: 4, border: `1px solid ${cmp ? T.acc : T.brd}`, background: cmp ? "#ecfeff" : T.card, color: cmp ? T.acc2 : T.mut, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: T.mon }}>
            {cmp ? "✓ Compare" : "Compare"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: M ? "1fr" : "340px 1fr", gap: M ? 20 : 36, alignItems: "start" }}>
          <div {...an("sm", 0.12)} style={{ padding: "24px 22px", borderRadius: 14, border: `1px solid ${T.brd}`, background: T.bg2, position: M ? "static" : "sticky", top: 16 }}>
            <S l="Brent Oil" v={inp.brent} fn={(v) => set("brent", v)} mn={40} mx={150} st={5} u=" $/bbl" />
            <S l="USD/IDR" v={inp.usdIdr} fn={(v) => set("usdIdr", v)} mn={14000} mx={19000} st={100} u="" />
            <S l="Pass-Through" v={inp.passThrough} fn={(v) => set("passThrough", v)} mn={0} mx={100} st={5} u="%" sub="0%=govt absorbs" />
            <S l="EV Fleet" v={inp.evFleetPct} fn={(v) => set("evFleetPct", v)} mn={0} mx={20} st={0.5} u="%" sub={`${Math.round(inp.evFleetPct * 1.3)}M of 130M`} />
            <div style={{ display: "flex", gap: 5 }}>
              {[1, 3, 5].map((y) => (
                <button key={y} onClick={() => set("timeHorizon", y)} style={{ flex: 1, padding: "8px", borderRadius: 4, border: inp.timeHorizon === y ? `2px solid ${T.acc}` : `1px solid ${T.brd}`, background: inp.timeHorizon === y ? T.acc : T.card, color: inp.timeHorizon === y ? "#fff" : T.mut, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: T.mon }}>
                  {y}Y
                </button>
              ))}
            </div>
          </div>

          <div>
            <div {...an("sm", 0.18)} style={{ display: "grid", gridTemplateColumns: M ? "1fr" : "200px 1fr", gap: 16, marginBottom: 20 }}>
              <div style={{ padding: "28px", borderRadius: 14, background: sb, border: `1.5px solid ${sc}33`, textAlign: "center" }}>
                <div style={{ fontSize: 9, color: T.mut, textTransform: "uppercase", letterSpacing: 3, fontFamily: T.mon, marginBottom: 8 }}>Stress</div>
                <div style={{ fontSize: M ? 52 : 64, fontWeight: 700, color: sc, fontFamily: T.mon, lineHeight: 1 }}>{r.ov}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: sc, letterSpacing: 4, marginTop: 6, fontFamily: T.mon }}>{sl}</div>
              </div>
              <div style={{ padding: "24px", borderRadius: 14, background: T.ink, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: T.acc }} />
                <div style={{ fontSize: 9, color: T.acc, textTransform: "uppercase", letterSpacing: 3, fontFamily: T.mon, marginBottom: 8 }}>What This Means</div>
                <div style={{ fontSize: M ? 13 : 15, color: "#ddd", lineHeight: 1.65, fontFamily: T.ser, fontStyle: "italic" }}>{tk}</div>
                <div style={{ fontSize: 12, color: "#999", marginTop: 10 }}>{p.hl}</div>
              </div>
            </div>

            {cmp && (
              <div {...an("sm", 0.2)} style={{ padding: "20px", borderRadius: 12, border: `1.5px solid ${T.acc}44`, background: "#ecfeff", marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 10, color: T.acc2, fontWeight: 700, fontFamily: T.mon, letterSpacing: 2 }}>COMPARE</span>
                  <select value={ci} onChange={(e) => setCi(parseInt(e.target.value, 10))} style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${T.acc}44`, fontSize: 11, fontFamily: T.mon, background: "#fff" }}>
                    {PR.map((x, i) => (
                      <option key={i} value={i}>{x.n}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
                  {[
                    ["Stress", r.ov, cr.ov],
                    ["Subsidy", `${r.sb}T`, `${cr.sb}T`],
                    ["Imports", `$${r.ni}B`, `$${cr.ni}B`],
                    ["CPI", `+${r.ct}`, `+${cr.ct}`],
                    ["EV Save", `$${r.ai}B`, `$${cr.ai}B`],
                  ].map(([l, a, b], i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: i % 2 ? `${T.acc}08` : "transparent", borderRadius: 4 }}>
                      <span style={{ color: T.mut, fontFamily: T.mon, fontSize: 10 }}>{l}</span>
                      <span><span style={{ fontFamily: T.mon, fontWeight: 600, marginRight: 12 }}>{a}</span><span style={{ fontFamily: T.mon, fontWeight: 600, color: T.acc2 }}>vs {b}</span></span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div {...an("sm", 0.25)} style={{ padding: "20px 22px", borderRadius: 14, border: `1px solid ${T.brd}`, background: T.card, marginBottom: 20 }}>
              <PB l="Fiscal — Subsidy" v={r.st.fiscal} />
              <PB l="External — Trade" v={r.st.external} />
              <PB l="Inflation" v={r.st.inflation} />
              <PB l="FX — Rupiah" v={r.st.fx} />
            </div>

            <div {...an("sm", 0.3)} style={{ display: "grid", gridTemplateColumns: M ? "1fr 1fr" : "repeat(3,1fr)", gap: 10 }}>
              <MC l="Subsidy" v={r.sb} u="IDR Tn/yr" n={r.sc > 0 ? `+${r.sc}` : null} />
              <MC l="Import Bill" v={r.ni} u="USD Bn/yr" n={r.td > 0 ? `+${r.td}` : null} />
              <MC l="Inflation" v={r.ct > 0 ? `+${r.ct}` : "0"} u="pp CPI" />
              <MC l="CA Impact" v={r.cp > 0 ? `+${r.cp}` : r.cp} u="pp GDP" />
              <MC l="EV Import Save" v={r.ai} u="USD Bn" n={r.ai > 0.5 ? "Material" : null} g />
              <MC l="EV Sub Save" v={r.as2} u="IDR Tn" n={r.as2 > 5 ? "Significant" : null} g />
            </div>
          </div>
        </div>
      </section>

      <section ref={rf("fd")} style={{ padding: M ? "56px 20px" : "80px 48px", background: T.bg2, position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${I.sky})`, backgroundSize: "cover", backgroundPosition: "center top", opacity: 0.05 }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 2 }}>
          <div {...an("fd")} style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: M ? "24px" : "clamp(28px,4vw,44px)", fontWeight: 400, lineHeight: 1.1, color: T.ink, fontFamily: T.ser }}>
              What IDR {sav}T in savings<br />could <span style={{ color: T.acc }}>build</span> every year.
            </h2>
          </div>
          <div {...an("fd", 0.15)} style={{ display: "grid", gridTemplateColumns: M ? "1fr 1fr" : "repeat(5,1fr)", gap: 12 }}>
            {[
              { n: hosp, l: "Hospitals", c: "#0369a1" },
              { n: sch.toLocaleString(), l: "Schools", c: "#7c3aed" },
              { n: `${toll}km`, l: "Toll Road", c: T.amb },
              { n: `${co2M}M`, l: "Tons CO2 Cut", c: T.grn },
              { n: `${treM}M`, l: "Trees Equiv", c: "#15803d" },
            ].map((x, i) => (
              <div key={i} {...an("fd", 0.1 + i * 0.06)} style={{ padding: "24px 16px", borderRadius: 12, background: T.card, border: `1px solid ${T.brd}`, textAlign: "center" }}>
                <div style={{ fontSize: M ? 28 : 36, fontWeight: 700, color: x.c, fontFamily: T.mon, lineHeight: 1 }}>{x.n}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.ink, marginTop: 6, fontFamily: T.ser }}>{x.l}</div>
              </div>
            ))}
          </div>
          <div {...an("fd", 0.5)} style={{ textAlign: "center", marginTop: 32, padding: "20px 28px", borderRadius: 10, background: T.card, border: `1px solid ${T.brd}`, maxWidth: 600, margin: "32px auto 0" }}>
            <div style={{ fontSize: M ? 13 : 15, color: T.ink2, lineHeight: 1.7, fontFamily: T.ser, fontStyle: "italic" }}>
              Every rupiah on subsidies is a rupiah <em>not</em> spent on hospitals, schools, and roads. <strong style={{ fontStyle: "normal", color: T.acc2 }}>EV adoption unlocks fiscal space.</strong>
            </div>
          </div>
        </div>
      </section>

      {/* FIXED POLICY BRIEF */}
      <section ref={rf("po")} style={{ padding: M ? "56px 16px" : "80px 48px", background: T.bg }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40, opacity: 1, transform: "none" }}>
            <h2 style={{ fontSize: M ? "24px" : "clamp(28px,4vw,44px)", fontWeight: 400, color: T.ink, fontFamily: T.ser }}>
              Policy Brief
            </h2>
            <div style={{ fontSize: 10, color: T.mut, fontFamily: T.mon, marginTop: 8 }}>
              {"$" + inp.brent + "/bbl | IDR" + inp.usdIdr.toLocaleString() + " | " + inp.passThrough + "%PT | " + inp.evFleetPct + "%EV | " + inp.timeHorizon + "Y"}
            </div>
          </div>

          <div style={{ opacity: 1, transform: "none" }}>
            <div style={{ padding: "24px", borderRadius: 12, border: "1.5px solid " + sc + "33", background: sb, marginBottom: 12 }}>
              <div style={{ fontSize: 9, color: T.mut, textTransform: "uppercase", letterSpacing: 3, fontFamily: T.mon, marginBottom: 8 }}>SITUATION ASSESSMENT</div>
              <div style={{ fontSize: M ? 14 : 17, color: T.ink, lineHeight: 1.7, fontFamily: T.ser }}>{p.hl}</div>
            </div>

            <div style={{ padding: "20px 24px", borderRadius: 12, border: "1px solid #fca5a5", background: T.card, marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#7f1d1d", textTransform: "uppercase", letterSpacing: 3, fontFamily: T.mon, marginBottom: 10, fontWeight: 700 }}>1ST ORDER IMPACT: ECONOMIC</div>
              <PolicyList items={p.f1} dotColor={T.red} />
            </div>

            <div style={{ padding: "20px 24px", borderRadius: 12, border: "1px solid #fcd34d", background: "#fef9ee", marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#78350f", textTransform: "uppercase", letterSpacing: 3, fontFamily: T.mon, marginBottom: 10, fontWeight: 700 }}>2ND ORDER IMPACT: SOCIAL AND POLITICAL</div>
              <PolicyList items={p.f2} dotColor={T.amb} />
            </div>

            <div style={{ padding: "20px 24px", borderRadius: 12, border: "1px solid #93c5fd", background: "#eff6ff", marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#1e3a5f", textTransform: "uppercase", letterSpacing: 3, fontFamily: T.mon, marginBottom: 10, fontWeight: 700 }}>WHY NOW: THE URGENCY OF ACTING TODAY</div>
              <PolicyList items={p.wn} dotColor="#1d4ed8" />
            </div>

            <div style={{ padding: "20px 24px", borderRadius: 12, border: "1px solid #334155", background: T.ink, marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#f87171", textTransform: "uppercase", letterSpacing: 3, fontFamily: T.mon, marginBottom: 10, fontWeight: 700 }}>WHAT IF NOT: THE COST OF INACTION</div>
              <PolicyList items={p.wif} dotColor="#ef4444" textColor="#bbb" />
            </div>

            <div style={{ padding: "20px 24px", borderRadius: 12, border: "1px solid " + T.acc + "44", background: "#ecfeff", marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: T.acc2, textTransform: "uppercase", letterSpacing: 3, fontFamily: T.mon, marginBottom: 10, fontWeight: 700 }}>SHORT-TERM ACTIONS (0-12 MONTHS)</div>
              {(p.rcShort || []).map((x, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, background: T.acc + "22", color: T.acc2, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: T.mon }}>{"S" + (i + 1)}</div>
                  <div style={{ fontSize: 12, color: T.ink2, lineHeight: 1.55 }}>{x}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: "20px 24px", borderRadius: 12, border: "1px solid " + T.grn + "44", background: "#f0fdf4", marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: T.grn, textTransform: "uppercase", letterSpacing: 3, fontFamily: T.mon, marginBottom: 10, fontWeight: 700 }}>LONG-TERM STRUCTURAL ACTIONS (1-5 YEARS)</div>
              {(p.rcLong || []).map((x, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, background: T.grn + "22", color: T.grn, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: T.mon }}>{"L" + (i + 1)}</div>
                  <div style={{ fontSize: 12, color: T.ink2, lineHeight: 1.55 }}>{x}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: "14px 18px", borderRadius: 8, background: "#fef9ee", border: "1px solid #fcd34d" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#78350f", fontFamily: T.mon, marginBottom: 3 }}>CONFIDENCE NOTE</div>
              <div style={{ fontSize: 10, color: T.mut, lineHeight: 1.5 }}>
                Simplified macro-accounting model. Directionally reliable, not a precise forecast. Key uncertainties: average km/year per motorcycle (6,000-10,000), Pertamina compensation formula, EV adoption trajectory. CO2: IPCC standard 2.31 kg/liter. Tree absorption: EPA average 22 kg/year.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: M ? "48px 20px 72px" : "64px 48px 88px", background: T.bg2 }}>
        <div style={{ maxWidth: 780, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 10, color: T.mut, textTransform: "uppercase", letterSpacing: 4, fontFamily: T.mon, marginBottom: 10 }}>
            Methodology
          </div>
          <div style={{ fontSize: M ? 13 : 15, color: T.ink2, lineHeight: 1.8 }}>
            This simulator is a directional macro-policy tool, not a precise forecasting engine. It links global oil prices, exchange rates, subsidy pass-through, and EV penetration to first-order and second-order effects on Indonesia’s fiscal burden, trade balance, inflation, and policy space.
          </div>
        </div>
      </section>
    </div>
  );
}
