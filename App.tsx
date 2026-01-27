import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

  // --- Logic ---

  // Data Simulation Loop
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const loop = () => {
      // 1. Update KPI Values (Drift)
      setPrevKpiValues(prev => ({ ...kpiValues })); // Snapshot current as previous
      
      setKpiValues(current => ({
        conv: clamp(current.conv + (Math.random() * 0.18 - 0.06), 2.1, 6.8),
        cpl: clamp(current.cpl + (Math.random() * 2.4 - 1.25), 42, 98),
        ret: clamp(current.ret + (Math.random() * 0.50 - 0.10), 7, 22),
      }));

      // 2. Update Footer/Global Stats
      setStats(current => {
        const addedLeads = Math.floor(12 + Math.random() * 26);
        const addedMql = Math.random() < 0.66 ? Math.floor(4 + Math.random() * 9) : Math.floor(1 + Math.random() * 4);
        
        return {
          leads: current.leads + addedLeads,
          mql: current.mql + addedMql,
          roi: clamp(current.roi + (Math.random() * 2.2 - 0.9), 8, 44),
          sessions: current.sessions + Math.floor(80 + Math.random() * 180),
          ctr: clamp(current.ctr + (Math.random() * 0.18 - 0.06), 1.2, 4.8),
          cac: clamp(current.cac + (Math.random() * 26 - 14), 520, 1200),
        };
      });

      // 3. Rebuild Sparkline
      setSparkSeed(prevSeed => {
        const newSeed = prevSeed + 0.15; // Increased flow speed
        const W = 800; 
        const H = 340;
        const pts = 32; // Increased points for smoother curves

        let d = "";
        let f = `M 0 ${H} L 0 `;
        
        for (let i = 0; i < pts; i++) {
          const x = (i / (pts - 1)) * W;
          
          // Refined organic noise algorithm
          const n = Math.sin((i * 0.35) + newSeed) * 35 +                    // Main swell
                    Math.sin((i * 0.9) + newSeed * 1.5) * 18 +               // Mid-frequency rhythm
                    Math.cos((i * 1.8) - newSeed * 0.8) * 12 +               // Counter-wave
                    (Math.sin((i * 5) + newSeed * 3) * 5) +                  // High-frequency jitter
                    (Math.random() * 28 - 14);                               // Organic noise floor

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

      // Schedule next tick - faster timing for more responsive feel
      timeoutId = setTimeout(loop, 900 + (Math.random() * 300));
    };

    // Start loop
    timeoutId = setTimeout(loop, 100);

    return () => clearTimeout(timeoutId);
  }, [kpiValues]);

  // Carousel Rotation Loop
  useEffect(() => {
    const rotate = () => {
      setOrder(prevOrder => [prevOrder[1], prevOrder[2], prevOrder[0]]);
    };
    
    const intervalId = setInterval(rotate, 3800);
    return () => clearInterval(intervalId);
  }, []);

  // --- Render Helpers ---

  // Get position style for a card based on its index and the current order
  const getPositionConfig = (kpiIndex: number) => {
    // order array: [frontIndex, midIndex, backIndex]
    // We need to find where kpiIndex is within order.
    const posIndex = order.indexOf(kpiIndex); // 0 = Front, 1 = Mid, 2 = Back

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
        y: 24, // Increased spacing
        scale: 0.94, 
        opacity: 0.5, // Reduced opacity
        filter: 'blur(0.3px)', 
        zIndex: 20 
      };
    }
    // posIndex === 2
    return { 
      y: 48, // Increased spacing
      scale: 0.88, 
      opacity: 0.2, // Reduced opacity
      filter: 'blur(0.8px)', 
      zIndex: 10 
    };
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center p-8 font-[Inter] overflow-hidden">
      
      {/* Safety Box / Tile */}
      <div className="relative w-[463px] h-[632px] rounded-[28px] overflow-hidden border border-white/5 shadow-[0_30px_90px_rgba(0,0,0,0.55)] bg-gradient-to-br from-[#0b1224] via-[#091025] to-[#070c18] flex flex-col p-6">
        
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
          transition={{ duration: 64, repeat: Infinity, ease: "linear" }}
        />
        <div className="pointer-events-none absolute inset-0" style={{ boxShadow: 'inset 0 0 150px rgba(0,0,0,0.55)' }}></div>

        {/* Header */}
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h1 className="text-white font-semibold text-[18px] tracking-tight">Marketing Analytics</h1>
            <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-[0.22em] mt-1">KPI carousel</p>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">Live</span>
          </div>
        </div>

        {/* Main */}
        <div className="relative z-10 mt-5 flex-1 rounded-2xl overflow-hidden" 
             style={{ 
               background: 'rgba(255,255,255,0.04)', 
               backdropFilter: 'blur(14px)',
               WebkitBackdropFilter: 'blur(14px)',
               border: '1px solid rgba(255,255,255,0.09)'
             }}>
          
          {/* subtle grid */}
          <div className="absolute inset-0 opacity-[0.16]"
              style={{
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.10) 1px, transparent 1px)',
                backgroundSize: '18px 18px'
              }}></div>

          <div className="absolute left-5 top-5 right-5 flex items-center justify-between">
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Dashboard</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Pulse → Rotate → Learn</div>
          </div>

          <div className="absolute left-4 right-4 top-12 bottom-4 flex flex-col">
            
            {/* sparkline background area */}
            <div className="relative flex-1 rounded-2xl overflow-hidden border border-white/6 bg-white/3">
              
              <motion.svg 
                className="absolute left-0 top-0 w-[120%] h-[120%] opacity-40 pointer-events-none"
                style={{ filter: 'drop-shadow(0 0 18px rgba(99,102,241,0.10))' }}
                viewBox="0 0 800 340" 
                preserveAspectRatio="none" 
                aria-hidden="true"
                animate={{
                  x: ["-3%", "-10%"],
                  y: ["-3%", "-6%"]
                }}
                transition={{
                  duration: 8,
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
                  transition={{
                    duration: 1.2,
                    ease: "linear"
                  }}
                />
                <motion.path 
                  d={sparkFill} 
                  fill="url(#sg2)" 
                  opacity="0.28"
                  animate={{ d: sparkFill }}
                  transition={{
                    duration: 1.2,
                    ease: "linear"
                  }}
                />
              </motion.svg>

              {/* Carousel stack */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-[340px] h-[200px]">
                  {KPI_DEFS.map((kpi, i) => {
                    const posConfig = getPositionConfig(i);
                    const colors = toneColors(kpi.tone);
                    const currentValue = kpiValues[kpi.key];
                    const prevValue = prevKpiValues[kpi.key];
                    
                    // Momentum Logic
                    const mom = prevValue !== 0 ? Math.round(((currentValue - prevValue) / prevValue) * 100) : 0;
                    const sign = mom >= 0 ? "+" : "";
                    const momTxt = sign + mom + "%";

                    // Bar Logic
                    const maxSpan = kpi.key === "cpl" ? 120 : 10;
                    const minSpan = kpi.key === "cpl" ? 30  : 0;
                    const pct = clamp(((currentValue - minSpan) / (maxSpan - minSpan)) * 100, 12, 96);

                    // Display Format
                    let displayVal = "0";
                    if (kpi.key === "cpl") displayVal = "$" + Math.round(currentValue);
                    if (kpi.key === "conv") displayVal = currentValue.toFixed(1) + "%";
                    if (kpi.key === "ret") displayVal = Math.round(currentValue) + "%";

                    return (
                      <motion.div
                        key={kpi.key}
                        className="absolute inset-0 overflow-hidden"
                        style={{
                          borderRadius: '20px',
                          border: '1px solid rgba(255,255,255,0.10)',
                          // Dark opaque gradient to prevent bleed-through
                          background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.92) 0%, rgba(15, 23, 42, 0.96) 100%)',
                          backdropFilter: 'blur(12px)',
                          WebkitBackdropFilter: 'blur(12px)',
                          boxShadow: '0 18px 46px rgba(0,0,0,0.40)',
                        }}
                        initial={false}
                        animate={posConfig}
                        transition={{
                          duration: 0.52,
                          ease: [0.4, 0, 0.2, 1]
                        }}
                      >
                         {/* Card Content */}
                         <div className="relative z-10 h-full flex flex-col justify-between p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">KPI</div>
                                <div className="mt-1 text-[16px] font-semibold text-white">{kpi.title}</div>
                                <div className="mt-1 text-[11px] font-semibold text-slate-400">{kpi.sub}</div>
                              </div>
                              <div className={`badge px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] rounded-full border bg-white/5 backdrop-blur-sm shadow-sm ${colors.fg}`}
                                   style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
                                Target
                              </div>
                            </div>

                            <div className="mt-5">
                              <div className="flex items-end justify-between">
                                <div className="text-[32px] font-semibold text-white tabular-nums tracking-tight">
                                  {displayVal}
                                </div>
                                <div className="text-[12px] font-bold text-slate-500 tabular-nums">
                                  {kpi.unit === "$" ? "$" : ""}{kpi.target}{kpi.unit === "%" ? "%" : ""}
                                </div>
                              </div>
                              
                              <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                                <motion.div 
                                  className="h-full rounded-full"
                                  style={{ background: colors.bar }}
                                  animate={{ width: `${Math.round(pct)}%` }}
                                  transition={{ duration: 0.72, ease: [0.4, 0, 0.2, 1] }}
                                />
                              </div>
                              
                              <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.20em] text-slate-500">
                                Momentum: <span className="text-white/70 tabular-nums">{momTxt}</span>
                              </div>
                            </div>
                         </div>

                         {/* Glow Effect */}
                         <div className="absolute inset-0 pointer-events-none"
                              style={{ 
                                boxShadow: `inset 0 0 120px rgba(0,0,0,0.35), 0 0 60px ${colors.glow}` 
                              }}
                         ></div>

                         {/* Background Pattern */}
                         <div className="absolute inset-0 pointer-events-none"
                              style={{
                                background: 'radial-gradient(circle at 18% 22%, rgba(255,255,255,0.20), transparent 62%)',
                                opacity: 0.50
                              }}>
                         </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* mini stats */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: "Sessions", val: stats.sessions.toLocaleString(), color: "text-white" },
                { label: "CTR", val: stats.ctr.toFixed(1) + "%", color: "text-sky-200" },
                { label: "CAC", val: fmtMoney(stats.cac), color: "text-emerald-200" }
              ].map((stat) => (
                <div key={stat.label} className="px-4 py-3 text-center rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-lg">
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{stat.label}</div>
                  <div className={`mt-1 text-[20px] font-semibold tabular-nums tracking-tight ${stat.color}`}>{stat.val}</div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Footer strip */}
        <div className="relative z-10 mt-5 pt-5 border-t border-white/10 grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-[22px] font-semibold text-white tabular-nums tracking-tight">{stats.leads.toLocaleString()}</div>
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.16em] mt-1">Leads</div>
          </div>
          <div className="text-center">
            <div className="text-[22px] font-semibold text-indigo-200 tabular-nums tracking-tight">{stats.mql.toLocaleString()}</div>
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.16em] mt-1">MQL</div>
          </div>
          <div className="text-center">
            <div className="text-[22px] font-semibold text-emerald-200 tabular-nums tracking-tight">{Math.round(stats.roi)}%</div>
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.16em] mt-1">ROI</div>
          </div>
        </div>

      </div>
    </div>
  );
}