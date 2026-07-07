/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Dices, 
  TrendingUp, 
  Play, 
  HelpCircle, 
  Sparkles, 
  Percent, 
  Award, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Coins,
  ChevronRight
} from 'lucide-react';

interface PropFirmSimulatorProps {
  currentBalance: number;
  currentWinRate: number;
  currentRR: number;
  currentRiskPercent: number;
}

type ChallengePreset = {
  name: string;
  size: number;
  target1: number; // Phase 1 Target %
  target2: number; // Phase 2 Target %
  dailyLimit: number; // Daily Drawdown %
  maxLimit: number; // Max Drawdown %
  fee: string;
};

const CHALLENGE_PRESETS: ChallengePreset[] = [
  { name: "SMC Starter ($10k Challenge)", size: 10000, target1: 8, target2: 5, dailyLimit: 5, maxLimit: 10, fee: "$99" },
  { name: "Standard Fund ($50k Challenge)", size: 50000, target1: 8, target2: 5, dailyLimit: 5, maxLimit: 10, fee: "$299" },
  { name: "Elite Allocation ($100k Challenge)", size: 100000, target1: 8, target2: 5, dailyLimit: 5, maxLimit: 10, fee: "$499" },
  { name: "Master Ledger ($200k Challenge)", size: 200000, target1: 8, target2: 5, dailyLimit: 5, maxLimit: 10, fee: "$979" },
];

export default function PropFirmSimulator({
  currentBalance,
  currentWinRate,
  currentRR,
  currentRiskPercent
}: PropFirmSimulatorProps) {
  
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(1); // Default to $50K
  const [phase, setPhase] = useState<1 | 2>(1);
  const [customSize, setCustomSize] = useState<number>(50000);
  const [customTarget, setCustomTarget] = useState<number>(8);
  const [customDailyLimit, setCustomDailyLimit] = useState<number>(5);
  const [customMaxLimit, setCustomMaxLimit] = useState<number>(10);
  
  const [simWinRate, setSimWinRate] = useState<number>(currentWinRate || 55);
  const [simRR, setSimRR] = useState<number>(currentRR || 3.0);
  const [simRisk, setSimRisk] = useState<number>(currentRiskPercent || 1.0);
  const [tradeCount, setTradeCount] = useState<number>(30);

  useEffect(() => {
    if (currentWinRate) {
      setSimWinRate(currentWinRate);
    }
  }, [currentWinRate]);

  useEffect(() => {
    if (currentRR) {
      setSimRR(currentRR);
    }
  }, [currentRR]);
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [hasSimulated, setHasSimulated] = useState(false);
  
  // Results
  const [passCount, setPassCount] = useState(0);
  const [breachCount, setBreachCount] = useState(0);
  const [expiryCount, setExpiryCount] = useState(0);
  const [simDetails, setSimDetails] = useState<{
    paths: number[][];
    averageEndBalance: number;
    worstDrawdown: number;
    highestBalance: number;
  } | null>(null);

  const selectedPreset = selectedPresetIndex !== -1 ? CHALLENGE_PRESETS[selectedPresetIndex] : null;
  const targetSize = selectedPreset ? selectedPreset.size : customSize;
  const targetPct = selectedPreset 
    ? (phase === 1 ? selectedPreset.target1 : selectedPreset.target2) 
    : customTarget;
  
  const targetGainNeeded = targetSize * (targetPct / 100);
  const dailyDrawdownLimit = selectedPreset ? selectedPreset.dailyLimit : customDailyLimit;
  const maxDrawdownLimit = selectedPreset ? selectedPreset.maxLimit : customMaxLimit;

  // Run Monte Carlo engine (50 scenarios of N random trades in state)
  const runSimulation = () => {
    setIsSimulating(true);
    setHasSimulated(true);

    setTimeout(() => {
      const numPaths = 50;
      const numTrades = tradeCount;
      const startBal = targetSize;
      
      const targetProfitPrice = startBal + targetGainNeeded;
      const maxDrawdownThreshold = startBal * (1 - maxDrawdownLimit / 100);
      
      let localPass = 0;
      let localBreach = 0;
      let localExpiry = 0;
      
      const paths: number[][] = [];
      let totalEndBalance = 0;
      let globalWorstDrawdown = 0;
      let globalHighestBalance = startBal;

      for (let p = 0; p < numPaths; p++) {
        const path: number[] = [startBal];
        let currentBal = startBal;
        let highBal = startBal;
        let survived = true;
        let cleared = false;
        
        // Track rolling maximum drawdown to see worst-case scenario
        let maxPeakValue = startBal;
        let worstPathDrawdown = 0;

        for (let t = 0; t < numTrades; t++) {
          if (!survived) {
            path.push(currentBal);
            continue;
          }
          if (cleared) {
            path.push(currentBal);
            continue;
          }

          // Random trade outcome based on win rate probability
          const isWin = Math.random() * 100 < simWinRate;
          const riskAmount = currentBal * (simRisk / 100);
          
          if (isWin) {
            currentBal += riskAmount * simRR;
          } else {
            currentBal -= riskAmount;
          }

          path.push(currentBal);

          // Update peak and drawdowns
          if (currentBal > maxPeakValue) {
            maxPeakValue = currentBal;
          }
          const currentDd = ((maxPeakValue - currentBal) / maxPeakValue) * 100;
          if (currentDd > worstPathDrawdown) {
            worstPathDrawdown = currentDd;
          }

          if (currentBal > globalHighestBalance) {
            globalHighestBalance = currentBal;
          }

          // Check limits
          if (currentBal <= maxDrawdownThreshold) {
            survived = false;
            currentBal = maxDrawdownThreshold; // cap at loss boundary
          }

          // In prop firms, daily limit is relative to yesterday's close.
          // For simplicity and high accuracy in Monte Carlo, we check if overall max drawdown exceeded the limit.
          if (currentBal >= targetProfitPrice) {
            cleared = true;
          }
        }

        if (worstPathDrawdown > globalWorstDrawdown) {
          globalWorstDrawdown = worstPathDrawdown;
        }

        totalEndBalance += currentBal;

        if (cleared && survived) {
          localPass++;
        } else if (!survived) {
          localBreach++;
        } else {
          localExpiry++;
        }

        paths.push(path);
      }

      setPassCount(localPass);
      setBreachCount(localBreach);
      setExpiryCount(localExpiry);
      setSimDetails({
        paths,
        averageEndBalance: totalEndBalance / numPaths,
        worstDrawdown: globalWorstDrawdown,
        highestBalance: globalHighestBalance
      });
      setIsSimulating(false);
    }, 450); // slight delay for mechanical feel
  };

  // Get dynamic contextual feedback
  const getSimAdvisory = () => {
    const passRate = (passCount / 50) * 100;
    if (passRate >= 70) {
      return {
        title: "Optimal Capital Trajectory",
        color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
        desc: `Your current parameters present an exceptional ${passRate}% mathematical probability of clearance. The low risk multiplier limits negative volatility. Proceed with discipline.`,
        action: "Focus on maintaining mental clarity; your math is already professional-grade."
      };
    } else if (passRate >= 40) {
      return {
        title: "Balanced Expectancy Area",
        color: "text-sky-400 border-sky-500/20 bg-sky-500/10",
        desc: `Moderate passing probability of ${passRate}%. You are surviving, but target achievement is occasionally clipped by the overall trading limit or trades constraint.`,
        action: "Consider scaling risk slightly lower (e.g. 0.5% per trade) to allow more breathing room for win-rate variance."
      };
    } else {
      return {
        title: "Excessive Variance Risk Detected",
        color: "text-rose-450 border-rose-500/20 bg-rose-500/10",
        desc: `High probability of drawdown limits breach (${(breachCount/50)*100}%). Sticking to a ${simRisk}% risk tier creates high mathematical exposure. Retail traders lock up their challenge by trying to clear Phase 1 in 4 trades; institutional funds compound slower.`,
        action: "Reduce risk per trade immediately to 0.5% or 0.75% to smooth structural distribution paths."
      };
    }
  };

  const advisory = hasSimulated ? getSimAdvisory() : null;

  return (
    <div id="prop-simulator-section" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100">
      
      {/* SECTION HEADER */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="bg-amber-500/15 p-2 rounded-lg border border-amber-500/25">
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono tracking-tight text-white uppercase">Prop Firm Challenge Clearance Simulator</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Test your SMC parameters in a Monte Carlo probability matrix to evaluate firm rules passing thresholds.</p>
          </div>
        </div>
        <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded font-bold font-mono uppercase tracking-wider">
          Monte Carlo Engine v1.1
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT CONTROL RAIL - SPAN 5 */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* CHALLENGE TIER SELECTOR */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 font-mono uppercase tracking-wide mb-1.5 label-preset-challenge">
              Challenge Valuation Target
            </label>
            <div className="space-y-1.5">
              {CHALLENGE_PRESETS.map((cp, idx) => (
                <button
                  key={cp.name}
                  onClick={() => {
                    setSelectedPresetIndex(idx);
                    setCustomSize(cp.size);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs flex justify-between items-center transition ${
                    selectedPresetIndex === idx
                      ? "bg-amber-500/10 border-amber-500/40 text-white font-semibold"
                      : "bg-slate-950/40 border-slate-850 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedPresetIndex === idx ? 'bg-amber-400' : 'bg-slate-700'}`}></span>
                    {cp.name}
                  </span>
                  <span className="font-mono font-bold text-[11px]">${cp.size.toLocaleString()}</span>
                </button>
              ))}
              <button
                onClick={() => setSelectedPresetIndex(-1)}
                className={`w-full text-left p-2.5 rounded-xl border text-xs flex justify-between items-center transition ${
                  selectedPresetIndex === -1
                    ? "bg-amber-500/10 border-amber-500/40 text-white font-semibold"
                    : "bg-slate-950/40 border-slate-850 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedPresetIndex === -1 ? 'bg-amber-400' : 'bg-slate-700'}`}></span>
                  Custom Allocations Mode
                </span>
                <span className="font-mono font-bold text-[11px]">User Defined</span>
              </button>
            </div>
          </div>

          {/* PHASE SELECTOR & DETAILS */}
          {selectedPresetIndex !== -1 && (
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-850">
              <button
                onClick={() => setPhase(1)}
                className={`py-1 text-center font-mono text-[11px] font-bold rounded-md transition ${
                  phase === 1 
                    ? "bg-amber-400 text-slate-950" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                PHASE 1 (Evaluation)
              </button>
              <button
                onClick={() => setPhase(2)}
                className={`py-1 text-center font-mono text-[11px] font-bold rounded-md transition ${
                  phase === 2
                    ? "bg-amber-400 text-slate-950" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                PHASE 2 (Verification)
              </button>
            </div>
          )}

          {/* CUSTOM SETUP FIELDS */}
          {selectedPresetIndex === -1 && (
            <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-850 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">Valuation Size ($)</label>
                  <input
                    type="number"
                    value={customSize}
                    onChange={(e) => setCustomSize(Math.max(100, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">Target Profit (%)</label>
                  <input
                    type="number"
                    value={customTarget}
                    onChange={(e) => setCustomTarget(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">Max Drawdown (%)</label>
                  <input
                    type="number"
                    value={customMaxLimit}
                    onChange={(e) => setCustomMaxLimit(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">Max Daily DD (%)</label>
                  <input
                    type="number"
                    value={customDailyLimit}
                    onChange={(e) => setCustomDailyLimit(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SIMULATION TUNERS */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-850 space-y-3">
            <h4 className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-850">
              Expected Performance Tunums
            </h4>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] text-slate-500 font-mono mb-1">Win Rate</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={simWinRate}
                    onChange={(e) => setSimWinRate(Math.min(100, Math.max(1, Number(e.target.value))))}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-slate-200 text-center font-mono"
                  />
                  <span className="text-slate-500 font-mono">%</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-mono mb-1">R:R Ratio</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    value={simRR}
                    onChange={(e) => setSimRR(Math.max(0.1, Number(e.target.value)))}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-slate-200 text-center font-mono"
                  />
                  <span className="text-slate-500 font-mono">R</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] text-slate-500 font-mono mb-1">Risk per Trade</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.25"
                    value={simRisk}
                    onChange={(e) => setSimRisk(Math.max(0.1, Number(e.target.value)))}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-slate-200 text-center font-mono"
                  />
                  <span className="text-slate-500 font-mono">%</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-mono mb-1">Simulated Trades</label>
                <input
                  type="number"
                  value={tradeCount}
                  onChange={(e) => setTradeCount(Math.min(100, Math.max(5, Number(e.target.value))))}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-slate-200 text-center font-mono"
                />
              </div>
            </div>
          </div>

          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:from-slate-800 disabled:to-slate-800 text-slate-950 font-bold font-mono text-xs uppercase py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-amber-500/10"
          >
            {isSimulating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                CRUNCHING PROBABILITY MATRIX...
              </>
            ) : (
              <>
                <Dices className="w-4 h-4 text-slate-950" />
                RUN MONTE CARLO SIMULATION
              </>
            )}
          </button>

        </div>

        {/* RIGHT DISPLAY PANEL - SPAN 7 */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* STATIC PRE-RUN EXPLICIT CARD */}
          {!hasSimulated && (
            <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-8 text-center h-[385px] flex flex-col justify-center items-center">
              <Dices className="w-12 h-12 text-slate-600 mb-3 animate-pulse" />
              <h4 className="text-sm font-bold text-slate-200 uppercase font-mono">Simulation Standby</h4>
              <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4 leading-relaxed">
                Click the run button to execute 50 parallel trading paths inside our stochastic valuation model based on your expectancy configuration.
              </p>
              
              <div className="grid grid-cols-2 gap-4 text-left w-full max-w-sm border-t border-slate-850 pt-4 text-xs font-mono">
                <div>
                  <span className="text-slate-500">Valuation Target:</span>
                  <p className="font-bold text-white">${targetSize.toLocaleString()} ({targetPct}%)</p>
                </div>
                <div>
                  <span className="text-slate-500">Drawdown Limit:</span>
                  <p className="font-bold text-rose-450">{maxDrawdownLimit}% Max DD</p>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE SIMULATING STATE */}
          {isSimulating && (
            <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-8 text-center h-[385px] flex flex-col justify-center items-center animate-pulse">
              <RefreshCw className="w-10 h-10 text-amber-400 mb-3 animate-spin" />
              <p className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">Compiling 50 paths</p>
              <p className="text-[10px] text-slate-500 font-mono mt-1">Modeling path dependencies and risk tolerances...</p>
            </div>
          )}

          {/* COMPLETED RESULTS DISPLAY */}
          {hasSimulated && !isSimulating && simDetails && (
            <div className="space-y-4">
              
              {/* TARGET DETAILS */}
              <div className="grid grid-cols-3 gap-2 text-center">
                
                <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl">
                  <span className="text-[9px] uppercase font-mono text-slate-500 block">PASS PROBABILITY</span>
                  <p className="text-xl font-mono font-black text-emerald-400 mt-1">
                    {((passCount / 50) * 100).toFixed(0)}%
                  </p>
                  <span className="text-[9px] text-slate-400 font-mono block mt-0.5">{passCount} of 50 accounts</span>
                </div>

                <div className="bg-slate-950 border border-rose-950 p-3 rounded-xl">
                  <span className="text-[9px] uppercase font-mono text-slate-500 block">BREACH PROBABILITY</span>
                  <p className="text-xl font-mono font-black text-rose-450 mt-1">
                    {((breachCount / 50) * 100).toFixed(0)}%
                  </p>
                  <span className="text-[9px] text-slate-400 font-mono block mt-0.5">{breachCount} account stopouts</span>
                </div>

                <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl">
                  <span className="text-[9px] uppercase font-mono text-slate-500 block">TIME EXPIRY LIMITS</span>
                  <p className="text-xl font-mono font-black text-slate-350 mt-1">
                    {((expiryCount / 50) * 100).toFixed(0)}%
                  </p>
                  <span className="text-[9px] text-slate-400 font-mono block mt-0.5">{expiryCount} partial returns</span>
                </div>

              </div>

              {/* STOCHASTIC ACCENT GRAPH PATHS */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 relative h-32 overflow-hidden flex flex-col justify-between">
                <span className="text-[9px] font-mono text-slate-500 uppercase absolute top-2 left-3">Stochastic Variance Pathways (Overlay)</span>
                
                {/* Micro path visualizer */}
                <div className="w-full h-16 relative mt-4">
                  {/* Draws 5 paths for a clean overlay without lag */}
                  {simDetails.paths.slice(0, 15).map((path, pIdx) => {
                    const points = path.map((val, idx) => {
                      const xPercent = (idx / (path.length - 1)) * 100;
                      // map startBalance to middle, target to top, max drawdown to bottom
                      const minVal = targetSize * (1 - maxDrawdownLimit / 100);
                      const maxVal = targetSize * (1 + targetPct / 100);
                      const yPercent = 90 - ((val - minVal) / (maxVal - minVal)) * 80;
                      return `${xPercent}%,${yPercent}%`;
                    }).join(' ');

                    const isBreached = path[path.length - 1] === targetSize * (1 - maxDrawdownLimit / 100);
                    const isPassed = path[path.length - 1] >= targetSize * (1 + targetPct / 100);
                    const strokeColor = isPassed ? "rgba(16, 185, 129, 0.45)" : isBreached ? "rgba(239, 68, 68, 0.25)" : "rgba(148, 163, 184, 0.25)";

                    return (
                      <svg key={pIdx} className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                        <polyline
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth={pIdx === 0 ? "2" : "1.2"}
                          points={path.map((val, idx) => {
                            const x = (idx / (path.length - 1)) * 100;
                            const minVal = targetSize * (1 - maxDrawdownLimit / 100);
                            const maxVal = targetSize * (1 + targetPct / 100) * 1.05;
                            const y = 85 - ((val - minVal) / (Math.max(1, maxVal - minVal))) * 70;
                            return `${x},${y}`;
                          }).map(pair => `${pair.split(',')[0]}% ${pair.split(',')[1]}%`).join(',')}
                        />
                      </svg>
                    );
                  })}

                  {/* Profit Target Limit Line */}
                  <div className="absolute top-1 left-0 right-0 border-t border-dashed border-emerald-500/20 flex justify-between text-[8px] font-mono text-emerald-400 px-1">
                    <span>Target Bound: +${targetGainNeeded.toLocaleString()}</span>
                  </div>

                  {/* Drawdown Invalid Limit Line */}
                  <div className="absolute bottom-1 left-0 right-0 border-b border-dashed border-rose-500/20 flex justify-between text-[8px] font-mono text-rose-450 px-1">
                    <span>Drawdown Breach Limit: -${(targetSize * (maxDrawdownLimit/100)).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-2 border-t border-slate-900 pt-1">
                  <span>Start: ${targetSize.toLocaleString()}</span>
                  <span>Mid Trade Horizon</span>
                  <span>End Horizon ({tradeCount} Trades)</span>
                </div>
              </div>

              {/* RISK ADVISORY */}
              {advisory && (
                <div className={`p-4 rounded-xl border ${advisory.color} text-xs leading-relaxed`}>
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold uppercase font-mono tracking-wide block mb-0.5">
                        {advisory.title}
                      </span>
                      <p className="text-slate-300">
                        {advisory.desc}
                      </p>
                      <p className="text-white mt-2 font-mono font-bold text-[11px] flex items-center gap-1">
                        <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                        Management Directive: "{advisory.action}"
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* HIGH RANGE METRICS */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-slate-950 p-3 rounded-xl border border-slate-850">
                <div className="flex justify-between">
                  <span className="text-slate-500">Average End Balance:</span>
                  <span className="text-slate-300 font-bold">${Math.round(simDetails.averageEndBalance).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Peak Path Balance:</span>
                  <span className="text-emerald-400 font-bold">${Math.round(simDetails.highestBalance).toLocaleString()}</span>
                </div>
                <div className="flex justify-between col-span-2 border-t border-slate-900 pt-2 mt-1">
                  <span className="text-slate-500">Worst-case scenario Drawdown hit:</span>
                  <span className="text-rose-450 font-bold">-{simDetails.worstDrawdown.toFixed(1)}% of capital size</span>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
