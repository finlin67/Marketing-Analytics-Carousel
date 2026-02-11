'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types & Constants ---

type KpiDef = {
  key: 'conv' | 'cpl' | 'ret';
  title: string;
  sub: string;
  tone: 'indigo' | 'sky' | 'emerald';
  unit: string;
  target: number;
};

const KPI_DEFS: KpiDef[] = [
  { key: "conv", title: "Conversion Rate", sub: "Paid + Organic blend", tone: "indigo", unit: "%", target: 6.2 },
  { key: "cpl", title: "Cost per Lead", sub: "All channels", tone: "sky", unit: "$", target: 52 },
  { key: "ret", title: "Retention Lift", sub: "Lifecycle impact", tone: "emerald", unit: "%", target: 18 },
];

// --- Helpers ---

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const fmtMoney = (v: number) => "$" + Math.round(v).toLocaleString();

const toneColors = (tone: string) => {
  if (tone === "sky") return { fg: "text-sky-200", bar: "rgba(56,189,248,0.30)", glow: "rgba(56,189,248,0.12)", badge: "text-sky-200 border-sky-500/20 bg-sky-500/10" };
  if (tone === "emerald") return { fg: "text-emerald-200", bar: "rgba(34,197,94,0.30)", glow: "rgba(34,197,94,0.12)", badge: "text-emerald-200 border-emerald-500/20 bg-emerald-500/10" };
  return { fg: "text-indigo-200", bar: "rgba(99,102,241,0.30)", glow: "rgba(99,102,241,0.12)", badge: "text-indigo-200 border-indigo-500/20 bg-indigo-500/10" };
};

// --- Components ---

export default function MarketingAnalytics() {
  // --- State ---

  // KPIs
  const [kpiValues, setKpiValues] = useState({
    conv: 3.8,
    cpl: 74,
    ret: 12,
  });
  
  // Ref for access inside closure without dependency loop
  const kpiValuesRef = useRef(kpiValues);
  
  // Previous values for momentum calculation
  const [prevKpiValues, setPrevKpiValues] = useState({
    conv: 3.8,
    cpl: 74,
    ret: 12,
  });

  // Global Stats
  const [stats, setStats] = useState({
    sessions: 18640,
    ctr: 2.4,
    cac: 820,
    leads: 0,
    mql: 0,
    roi: 18
  });

  // Carousel Order: indices [0, 1, 2] -> corresponding to KPI_DEFS indices
  // The first element in `order` is "Front", second is "Mid", third is "Back"
  const [order, setOrder] = useState([0, 1, 2]);

  // Sparkline
  const [sparkPath, setSparkPath] = useState("");
  const [sparkFill, setSparkFill] = useState("");
  const [sparkSeed, setSparkSeed] = useState(0.0);

  // Hover state for Tooltips
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // --- Logic ---

  // Sync ref
  useEffect(() => {
    kpiValuesRef.current = kpiValues;
  }, [kpiValues]);

  // Data Simulation Loop
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const loop = () => {
      // 1. Snapshot current values for momentum
      const currentKpis = kpiValuesRef.current;
      setPrevKpiValues(currentKpis);
      
      // 2. Update KPI Values (Drift)
      setKpiValues(current => ({
        conv: clamp(current.conv + (Math.random() * 0.1 - 0.05), 2.1, 6.8),
        cpl: clamp(current.cpl + (Math.random() * 1.5 - 0.75), 42, 98),
        ret: clamp(current.ret + (Math.random() * 0.3 - 0.15), 7, 22),
      }));

      // 3. Update Footer/Global Stats
      setStats(current => {
        const addedLeads = Math.floor(1 + Math.random() * 4);
        const addedMql = Math.random() < 0.3 ? 1 : 0;
        
        return {
          leads: current.leads + addedLeads,
          mql: current.mql + addedMql,
          roi: clamp(current.roi + (Math.random() * 1.0 - 0.5), 8, 44),
          sessions: current.sessions + Math.floor(5 + Math.random() * 20),
          ctr: clamp(current.ctr + (Math.random() * 0.08 - 0.04), 1.2, 4.8),
          cac: clamp(current.cac + (Math.random() * 10 - 5), 520, 1200),
        };
      });

      // 4. Rebuild Sparkline
      setSparkSeed(prevSeed => {
        const newSeed = prevSeed + 0.02;
        const W = 800; 
        const H = 340;
        const pts = 32; 

        let d = "";
        let f = `M 0 ${H} L 0 `;
        
        for (let i = 0; i < pts; i++) {
          const x = (i / (pts - 1)) * W;
          
          const n = Math.sin((i * 0.35) + newSeed) * 35 +
                    Math.sin((i * 0.9) + newSeed * 1.5) * 18 +
                    Math.cos((i * 1.8) - newSeed * 0.8) * 12 +
                    (Math.sin((i * 5) + newSeed * 3) * 5) +
                    (Math.random() * 28 - 14);

          const base = H * 0.55;
          const y = clamp(base - n, 50, H - 50);

          if (i === 0) d = `M ${x} ${y}`;
          else d += ` L ${x} ${y}`;

          f += `${x} ${y} `;
        }
        f += `L ${W} ${H} Z`;

        setSparkPath(d);
        setSparkFill(f);
        
        return newSeed;
      });

      timeoutId = setTimeout(loop, 2000 + (Math.random() * 2000));
    };

    timeoutId = setTimeout(loop, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  // Carousel Rotation Loop
  useEffect(() => {
    const rotate = () => {
      setOrder(prevOrder => [prevOrder[1], prevOrder[2], prevOrder[0]]);
    };
    const intervalId = setInterval(rotate, 12000);
    return () => clearInterval(intervalId);
  }, []);

  // --- Render Helpers ---

  const getPositionConfig = (kpiIndex: number) => {
    const posIndex = order.indexOf(kpiIndex); // 0 = Front, 1 = Mid, 2 = Back

    // Optimized for 600x600 Tile - Larger scale and wider spread
    if (posIndex === 0) {
      return { 
        y: 0, 
        scale: 1, 
        opacity: 1, 
        filter: 'blur(0px)', 
        zIndex: 30 
      };
    }
    if (posIndex === 1) {
      return { 
        y: 35, // More vertical separation
        scale: 0.92, 
        opacity: 0.5, 
        filter: 'blur(0.5px)', 
        zIndex: 20 
      };
    }
    return { 
      y: 70, // More vertical separation
      scale: 0.84, 
      opacity: 0.2, 
      filter: 'blur(1px)', 
      zIndex: 10 
    };
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-900 p-4 font-sans overflow-hidden">
      
      {/* Safety Box / Tile - Fixed 1:1 Aspect Ratio (Square) */}
      <div className="relative w-full max-w-[600px] aspect-square rounded-[32px] overflow-hidden border border-white/5 shadow-[0_30px_90px_rgba(0,0,0,0.55)] bg-gradient-to-br from-[#0b1224] via-[#091025] to-[#070c18] flex flex-col p-8">
        
        {/* Calm wash */}
        <motion.div 
          className="pointer-events-none absolute top-1/2 left-1/2 w-[220%] h-[220%]"
          style={{
            background: 'radial-gradient(circle at 32% 26%, rgba(99,102,241,0.14) 0%, rgba(56,189,248,0.10) 28%, rgba(244,114,182,0.08) 44%, transparent 66%)',
            opacity: 0.26,
            x: "-50%",
            y: "-50%"
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 128, repeat: Infinity, ease: "linear" }}
        />
        <div className="pointer-events-none absolute inset-0" style={{ boxShadow: 'inset 0 0 150px rgba(0,0,0,0.55)' }}></div>

        {/* 1. Header (Top 12%) */}
        <div className="relative z-10 h-[12%] flex items-start justify-between border-b border-white/5 pb-4">
          <div>
            <h1 className="text-white font-semibold text-[20px] tracking-tight">Marketing Analytics</h1>
            <p className="text-slate-400 text-[12px] font-semibold uppercase tracking-[0.22em] mt-1">Live Dashboard</p>
          </div>
          <div className="flex flex-col items-end gap-2">
             <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">Online</span>
             </div>
             {/* Switched from font-mono to font-medium for standard Inter usage */}
             <div className="text-[10px] text-slate-500 font-medium tracking-wide opacity-80">{new Date().toLocaleDateString()}</div>
          </div>
        </div>

        {/* 2. Hero Section (Middle 65%) - Centered Focal Point */}
        <div className="relative z-10 flex-1 flex flex-col py-6 gap-5">
           
           {/* Carousel Container */}
           <div className="relative flex-1 rounded-2xl overflow-hidden border border-white/6 bg-white/[0.02]">
              
              {/* Sparkline Background */}
              <motion.svg 
                className="absolute left-0 bottom-0 w-[120%] h-[80%] opacity-30 pointer-events-none"
                style={{ filter: 'drop-shadow(0 0 18px rgba(99,102,241,0.10))' }}
                viewBox="0 0 800 340" 
                preserveAspectRatio="none" 
                aria-hidden="true"
                animate={{
                  x: ["-3%", "-10%"],
                }}
                transition={{
                  duration: 25,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
              >
                <defs>
                  <linearGradient id="sg1" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(56,189,248,0.0)"/>
                    <stop offset="35%" stopColor="rgba(56,189,248,0.18)"/>
                    <stop offset="70%" stopColor="rgba(99,102,241,0.18)"/>
                    <stop offset="100%" stopColor="rgba(244,114,182,0.0)"/>
                  </linearGradient>
                  <linearGradient id="sg2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.10)"/>
                    <stop offset="100%" stopColor="rgba(255,255,255,0.0)"/>
                  </linearGradient>
                </defs>

                <motion.path 
                  d={sparkPath} 
                  fill="none" 
                  stroke="url(#sg1)" 
                  strokeWidth="4" 
                  strokeLinecap="round"
                  animate={{ d: sparkPath }}
                  transition={{ duration: 3.5, ease: "linear" }}
                />
                <motion.path 
                  d={sparkFill} 
                  fill="url(#sg2)" 
                  opacity="0.28"
                  animate={{ d: sparkFill }}
                  transition={{ duration: 3.5, ease: "linear" }}
                />
              </motion.svg>

              {/* Stacked Cards */}
              <div className="absolute inset-0 flex items-center justify-center p-4">
                 {/* Increased width to 440px for square layout dominance */}
                 <div className="relative w-full max-w-[440px] h-[220px]">
                    {KPI_DEFS.map((kpi, i) => {
                        const posConfig = getPositionConfig(i);
                        const colors = toneColors(kpi.tone);
                        const currentValue = kpiValues[kpi.key];
                        const prevValue = prevKpiValues[kpi.key];
                        const mom = prevValue !== 0 ? Math.round(((currentValue - prevValue) / prevValue) * 100) : 0;
                        const sign = mom >= 0 ? "+" : "";
                        const momTxt = sign + mom + "%";

                        const maxSpan = kpi.key === "cpl" ? 120 : 10;
                        const minSpan = kpi.key === "cpl" ? 30  : 0;
                        const pct = clamp(((currentValue - minSpan) / (maxSpan - minSpan)) * 100, 12, 96);

                        let displayVal = "0";
                        if (kpi.key === "cpl") displayVal = "$" + Math.round(currentValue);
                        if (kpi.key === "conv") displayVal = currentValue.toFixed(1) + "%";
                        if (kpi.key === "ret") displayVal = Math.round(currentValue) + "%";

                        return (
                          <motion.div
                            key={kpi.key}
                            className="absolute inset-0 overflow-hidden cursor-pointer"
                            style={{
                              borderRadius: '24px',
                              border: '1px solid rgba(255,255,255,0.10)',
                              background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.94) 0%, rgba(15, 23, 42, 0.98) 100%)',
                              backdropFilter: 'blur(16px)',
                              WebkitBackdropFilter: 'blur(16px)',
                              boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
                            }}
                            animate={posConfig}
                            onHoverStart={() => setHoveredIndex(i)}
                            onHoverEnd={() => setHoveredIndex(null)}
                            whileHover={{ scale: posConfig.scale * 1.02, boxShadow: '0 30px 70px rgba(0,0,0,0.6)' }}
                            transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
                          >
                            <div className="relative z-10 h-full flex flex-col justify-between p-6">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-500 mb-1">KPI Metric</div>
                                    <div className="text-[18px] font-semibold text-white">{kpi.title}</div>
                                    <div className="text-[12px] text-slate-400">{kpi.sub}</div>
                                  </div>
                                  <div className={`px-3 py-1 rounded-full border bg-white/5 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider ${colors.badge}`}>
                                    Target {kpi.unit === "$" ? "$" : ""}{kpi.target}{kpi.unit === "%" ? "%" : ""}
                                  </div>
                                </div>

                                <div>
                                  <div className="flex items-end justify-between mb-2">
                                    <div className="text-[42px] font-bold text-white tracking-tighter tabular-nums">{displayVal}</div>
                                    <div className="text-right">
                                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Momentum</div>
                                      {/* Switched from font-mono to font-bold for standard Inter usage */}
                                      <div className={`text-[14px] font-bold tracking-tight ${mom >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{momTxt}</div>
                                    </div>
                                  </div>
                                  <div className="h-2.5 rounded-full bg-slate-800/50 overflow-hidden border border-white/5">
                                    <motion.div 
                                      className="h-full rounded-full shadow-[0_0_10px_currentColor]"
                                      style={{ background: colors.bar, color: colors.bar }}
                                      animate={{ width: `${Math.round(pct)}%` }}
                                      transition={{ duration: 2.0, ease: [0.4, 0, 0.2, 1] }}
                                    />
                                  </div>
                                </div>
                            </div>
                            
                            {/* Card Effects */}
                            <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: `inset 0 0 120px rgba(0,0,0,0.35), 0 0 80px ${colors.glow}` }}></div>
                            
                            {/* Tooltip */}
                            <AnimatePresence>
                               {hoveredIndex === i && (
                                 <motion.div
                                   className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                                   initial={{ opacity: 0, y: -4 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   exit={{ opacity: 0, y: -4 }}
                                 >
                                   <div className="px-3 py-1 bg-slate-900/95 border border-white/20 rounded shadow-xl text-[10px] text-white">
                                     {kpi.title} Details
                                   </div>
                                 </motion.div>
                               )}
                            </AnimatePresence>
                          </motion.div>
                        );
                    })}
                 </div>
              </div>
           </div>

           {/* Secondary Data Cards (Stacked vertically between Hero and Footer) */}
           <div className="grid grid-cols-3 gap-3 h-[18%]">
              {[
                { label: "Sessions", val: stats.sessions.toLocaleString(), color: "text-white", sub: "Active" },
                { label: "CTR", val: stats.ctr.toFixed(1) + "%", color: "text-sky-200", sub: "Avg" },
                { label: "CAC", val: fmtMoney(stats.cac), color: "text-emerald-200", sub: "Blended" }
              ].map((stat) => (
                <div key={stat.label} className="relative group overflow-hidden rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] transition-colors p-3 flex flex-col justify-center items-center text-center">
                   <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">{stat.label}</div>
                   <div className={`text-[18px] font-bold tabular-nums tracking-tight ${stat.color}`}>{stat.val}</div>
                   <div className="text-[9px] text-slate-600 font-medium mt-1">{stat.sub}</div>
                </div>
              ))}
           </div>

        </div>

        {/* 3. Footer (Bottom 12%) - Technical/System Metrics */}
        <div className="relative z-10 h-[12%] border-t border-white/5 pt-4 grid grid-cols-3 gap-4">
          <div className="flex flex-col justify-center items-center border-r border-white/5 last:border-0">
             <div className="text-[20px] font-bold text-white tabular-nums tracking-tight leading-none">{stats.leads.toLocaleString()}</div>
             <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1.5">Leads</div>
          </div>
          <div className="flex flex-col justify-center items-center border-r border-white/5 last:border-0">
             <div className="text-[20px] font-bold text-indigo-200 tabular-nums tracking-tight leading-none">{stats.mql.toLocaleString()}</div>
             <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1.5">MQL</div>
          </div>
          <div className="flex flex-col justify-center items-center">
             <div className="text-[20px] font-bold text-emerald-200 tabular-nums tracking-tight leading-none">{Math.round(stats.roi)}%</div>
             <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1.5">ROI</div>
          </div>
        </div>

      </div>
    </div>
  );
}