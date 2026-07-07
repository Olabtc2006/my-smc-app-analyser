import React from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, TrendingDown, RefreshCw, BarChart2, ShieldCheck, 
  HelpCircle, FileText, Clock, Zap, BookOpen, Layers, Target, 
  AlertTriangle, CheckSquare, Search, AlertOctagon, CheckCircle2,
  XCircle, Award, Shield, Percent, ArrowUpRight, DollarSign, Activity
} from 'lucide-react';
import { SMCAnalysisResponse } from '../types';

interface SMCAnalysisDashboardProps {
  analysis: SMCAnalysisResponse;
  complianceScore: number;
  winProbability: number;
  rfBalance: number;
  setRfBalance: (val: number) => void;
  rfRiskPerTrade: number;
  setRfRiskPerTrade: (val: number) => void;
  rfTargetBalance: number;
  setRfTargetBalance: (val: number) => void;
  setIsMemoOpen: (open: boolean) => void;
}

// ==========================================
// 1. VERDICT SCORECARD COMPONENT
// ==========================================
interface VerdictScorecardProps {
  direction: 'BUY' | 'SELL' | 'WAIT' | 'NO TRADE';
  biasConfidence: number;
  setupQualityScore: number;
  setupGrade: 'A+' | 'A' | 'B' | 'C' | 'D';
  riskCategory: 'A+' | 'A' | 'B' | 'C' | 'D';
  historicalPatternMatch: 'Weak' | 'Moderate' | 'Strong';
  estimatedSuccessRange: string;
  totalConfluenceScore: number;
  complianceScore: number;
  onOpenMemo: () => void;
}

const VerdictScorecard = React.memo(function VerdictScorecard({
  direction,
  biasConfidence,
  setupQualityScore,
  setupGrade,
  riskCategory,
  historicalPatternMatch,
  estimatedSuccessRange,
  totalConfluenceScore,
  complianceScore,
  onOpenMemo
}: VerdictScorecardProps) {
  const isBuy = direction === 'BUY';
  const isSell = direction === 'SELL';
  const isNeutral = direction === 'WAIT' || direction === 'NO TRADE';

  // Determine dynamic success rating label
  const getConfluenceRating = (score: number) => {
    if (score >= 90) return { label: 'Exceptional', color: 'text-emerald-400' };
    if (score >= 80) return { label: 'High Probability', color: 'text-emerald-400' };
    if (score >= 70) return { label: 'Tradable Setup', color: 'text-sky-400' };
    return { label: 'Weak / No Trade', color: 'text-slate-400' };
  };

  const confluenceRating = getConfluenceRating(totalConfluenceScore);

  // SVG Gauge Calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (totalConfluenceScore / 100) * circumference;

  // Decision Verdict calculations
  const isTradeEligible = (direction === 'BUY' || direction === 'SELL') && totalConfluenceScore >= 80 && complianceScore >= 80;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/[0.03] rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-white/5 pb-5 mb-6">
        <div>
          <span className="text-[10px] text-sky-400 font-mono uppercase tracking-widest block mb-1">
            SMC Multi-Timeframe Assessment Model
          </span>
          <div className="flex flex-wrap items-center gap-2.5">
            {isNeutral ? (
              <span className="bg-slate-800 text-slate-300 font-bold px-3 py-1 rounded-lg text-xs font-mono border border-slate-700/50">
                {direction}
              </span>
            ) : (
              <span className={`px-3 py-1 rounded-lg text-xs font-mono font-bold tracking-wider select-none border uppercase ${
                isBuy 
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35' 
                  : 'bg-rose-500/15 text-rose-400 border-rose-500/35'
              }`}>
                {isBuy ? 'LONG BIAS' : 'SHORT BIAS'}
              </span>
            )}
            <h3 className="text-md font-bold text-white font-mono tracking-tight uppercase">
              Confluence Verdict Engine
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Institutional Memo Trigger */}
          <button
            onClick={onOpenMemo}
            className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 rounded-xl text-xs font-extrabold font-mono uppercase tracking-wider cursor-pointer shadow-lg shadow-amber-500/10 transition-all duration-200"
          >
            <FileText className="w-4 h-4 text-slate-950" />
            <span>INSTITUTIONAL DIRECTIVE</span>
          </button>
        </div>
      </div>

      {/* Main Core Scorecard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left: Circular Gauge Indicator (4 cols) */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-5 bg-slate-950/40 rounded-2xl border border-white/5 relative">
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* SVG Arc Gauge */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-slate-800/60"
                strokeWidth="7"
                fill="transparent"
              />
              <motion.circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-sky-400"
                strokeWidth="7"
                fill="transparent"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black font-mono text-white tracking-tight">{totalConfluenceScore}</span>
              <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest font-bold">Score</span>
            </div>
          </div>
          
          <div className="text-center mt-3 font-mono">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest block">CONFLUENCE INDEX</span>
            <span className={`text-xs font-bold ${confluenceRating.color}`}>{confluenceRating.label}</span>
          </div>
        </div>

        {/* Middle: Grid metrics (5 cols) */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3.5">
          
          <div className="bg-slate-950/30 p-3.5 rounded-xl border border-slate-850/60 flex flex-col justify-between">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Setup Grade</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-2xl font-black font-mono ${
                setupGrade.startsWith('A') ? 'text-emerald-400' : setupGrade.startsWith('B') ? 'text-sky-400' : 'text-amber-400'
              }`}>{setupGrade}</span>
              <span className="text-[8px] text-slate-500 uppercase font-mono">Rating</span>
            </div>
          </div>

          <div className="bg-slate-950/30 p-3.5 rounded-xl border border-slate-850/60 flex flex-col justify-between">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Risk Category</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-2xl font-black font-mono ${
                riskCategory.startsWith('A') ? 'text-emerald-400' : riskCategory.startsWith('B') ? 'text-sky-400' : 'text-amber-400'
              }`}>{riskCategory}</span>
              <span className="text-[8px] text-slate-500 uppercase font-mono">Rating</span>
            </div>
          </div>

          <div className="bg-slate-950/30 p-3.5 rounded-xl border border-slate-850/60 flex flex-col justify-between">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Pattern Match</span>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded uppercase ${
                historicalPatternMatch === 'Strong' ? 'bg-emerald-500/10 text-emerald-400' : historicalPatternMatch === 'Moderate' ? 'bg-sky-500/10 text-sky-400' : 'bg-slate-800 text-slate-400'
              }`}>{historicalPatternMatch}</span>
            </div>
          </div>

          <div className="bg-slate-950/30 p-3.5 rounded-xl border border-slate-850/60 flex flex-col justify-between">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Est. Success Range</span>
            <div className="flex items-baseline gap-0.5 mt-1">
              <span className="text-sm font-bold font-mono text-emerald-400">{estimatedSuccessRange}</span>
            </div>
          </div>

        </div>

        {/* Right: Decision Terminal (3 cols) */}
        <div className="lg:col-span-3 flex flex-col items-center justify-center p-5 bg-slate-950 rounded-2xl border border-indigo-500/15 text-center min-h-[160px] relative">
          <div className="absolute inset-0 bg-indigo-500/[0.02] pointer-events-none"></div>
          <span className="text-[9px] font-bold font-mono text-slate-500 uppercase tracking-widest mb-1">
            System Verdict
          </span>

          <div className={`mt-2 font-mono font-black text-xl tracking-widest px-6 py-2.5 rounded-xl border uppercase ${
            isTradeEligible
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 animate-pulse'
              : !isNeutral && totalConfluenceScore >= 70
                ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
          }`}>
            {isTradeEligible ? 'EXECUTE' : !isNeutral && totalConfluenceScore >= 70 ? 'WAIT' : 'AVOID'}
          </div>

          <p className="text-[9px] text-slate-400 font-mono leading-normal mt-3 uppercase px-1">
            {isTradeEligible 
              ? 'Confluences verified. Realtime structural entry signal is Active.' 
              : !isNeutral && totalConfluenceScore >= 70
                ? 'Sub-threshold confidence score. Lock limits and wait for sweep.' 
                : 'Retail trap alert. Refrain from active orders.'}
          </p>
        </div>

      </div>
    </motion.div>
  );
});

// ==========================================
// 2. TRADE PLAN SECTION COMPONENT
// ==========================================
interface TradePlanSectionProps {
  direction: 'BUY' | 'SELL' | 'WAIT' | 'NO TRADE';
  entryZone: string;
  stopLoss: string;
  tp1: string;
  tp2: string;
  tp3: string;
  riskRewardRatio: string;
  instructions: string;
  rfBalance: number;
  setRfBalance: (v: number) => void;
  rfRiskPerTrade: number;
  setRfRiskPerTrade: (v: number) => void;
  rfTargetBalance: number;
  setRfTargetBalance: (v: number) => void;
}

const TradePlanSection = React.memo(function TradePlanSection({
  direction,
  entryZone,
  stopLoss,
  tp1,
  tp2,
  tp3,
  riskRewardRatio,
  instructions,
  rfBalance,
  setRfBalance,
  rfRiskPerTrade,
  setRfRiskPerTrade,
  rfTargetBalance,
  setRfTargetBalance
}: TradePlanSectionProps) {
  const isBuy = direction === 'BUY';
  const isSell = direction === 'SELL';
  
  // Calculate risk values
  const riskAmount = rfBalance * (rfRiskPerTrade / 100);
  const recommendedLotSize = Math.max(0.01, parseFloat((riskAmount / (15 * 10)).toFixed(2)));
  const dailyRiskLimit = riskAmount * 2;
  const weeklyRiskLimit = riskAmount * 5;
  const drawdownPool = rfBalance * (Math.min(20, rfRiskPerTrade * 5) / 100);
  const drawdownPoolPercent = Math.min(20, rfRiskPerTrade * 5);

  return (
    <div className="space-y-6">
      {/* 2A. Core Entry Levels */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden"
      >
        <div className="flex items-center gap-2 mb-5 border-b border-slate-800/80 pb-3">
          <Target className="w-5 h-5 text-sky-400 shrink-0" />
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest font-mono">
              01. Institutional Execution Levels
            </h3>
            <p className="text-[9.5px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">
              Refined entry coordinates and protective invalidation bounds
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
            <span className="text-[10px] text-slate-500 font-mono uppercase">Bias Vector</span>
            <p className={`text-md font-extrabold tracking-tight mt-1 font-mono ${
              isBuy ? 'text-emerald-400' : isSell ? 'text-rose-400' : 'text-slate-300'
            }`}>
              {direction}
            </p>
          </div>

          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
            <span className="text-[10px] text-slate-500 font-mono uppercase">Entry Trigger Zone</span>
            <p className="text-xs font-bold text-white tracking-tight mt-1.5 font-mono truncate" title={entryZone}>
              {entryZone}
            </p>
          </div>

          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
            <span className="text-[10px] text-slate-500 font-mono uppercase">Invalidation Point (SL)</span>
            <p className="text-xs font-semibold text-rose-400 mt-1.5 font-mono truncate" title={stopLoss}>
              {stopLoss}
            </p>
          </div>

          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
            <span className="text-[10px] text-slate-500 font-mono uppercase">Risk-Reward Metric</span>
            <p className="text-xs font-bold text-emerald-400 mt-1.5 font-mono">
              {riskRewardRatio} <span className="text-[9px] text-slate-500">R:R</span>
            </p>
          </div>
        </div>

        {/* Horizontal TP Checklist / Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-slate-950/40 px-3.5 py-2.5 rounded-lg border border-slate-850 text-xs text-left">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
              <span className="text-slate-500 font-mono text-[9px] uppercase">Target TP1 (50%)</span>
            </div>
            <p className="font-bold text-sky-400 font-mono truncate mt-1 select-all">{tp1}</p>
          </div>
          
          <div className="bg-slate-950/40 px-3.5 py-2.5 rounded-lg border border-slate-850 text-xs text-left border-l-2 border-l-sky-500/35">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
              <span className="text-slate-500 font-mono text-[9px] uppercase">Target TP2 (25%)</span>
            </div>
            <p className="font-bold text-sky-300 font-mono truncate mt-1 select-all">{tp2}</p>
          </div>
          
          <div className="bg-slate-950/40 px-3.5 py-2.5 rounded-lg border border-slate-850 text-xs text-left border-l-2 border-l-indigo-500/35">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
              <span className="text-slate-500 font-mono text-[9px] uppercase">Target TP3 (25%)</span>
            </div>
            <p className="font-bold text-indigo-350 font-mono truncate mt-1 select-all">{tp3}</p>
          </div>
        </div>
      </motion.div>

      {/* 2B. Interactive Capital & Risk Optimization */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden"
      >
        <div className="flex items-center gap-2 mb-5 border-b border-slate-800/80 pb-3">
          <Activity className="w-5 h-5 text-indigo-400 shrink-0" />
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest font-mono">
              02. capital & position sizer
            </h3>
            <p className="text-[9.5px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">
              SMC Prop-Firm compliant risk allocation and lot calculation
            </p>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          <div>
            <label className="block text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider mb-2">
              Capital Base ($)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-500 font-mono font-bold">$</span>
              <input
                type="number"
                value={rfBalance}
                onChange={(e) => setRfBalance(Math.max(1, parseFloat(e.target.value) || 0))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-slate-200 text-xs font-mono focus:outline-none focus:border-sky-500 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider">
                Max Risk Per Trade (%)
              </label>
              <span className="text-sky-450 font-bold font-mono text-[10px]">{rfRiskPerTrade}%</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.25"
                max="5.0"
                step="0.25"
                value={rfRiskPerTrade}
                onChange={(e) => setRfRiskPerTrade(parseFloat(e.target.value))}
                className="flex-1 accent-sky-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
              />
              <input
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                value={rfRiskPerTrade}
                onChange={(e) => setRfRiskPerTrade(parseFloat(e.target.value) || 0.5)}
                className="w-16 bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-center text-slate-200 text-xs font-mono focus:outline-none focus:border-sky-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider mb-2">
              Target Milestone ($)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-500 font-mono font-bold">$</span>
              <input
                type="number"
                value={rfTargetBalance}
                onChange={(e) => setRfTargetBalance(Math.max(1, parseFloat(e.target.value) || 0))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-slate-200 text-xs font-mono focus:outline-none focus:border-sky-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Computed Outputs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-850/70 text-center font-mono">
            <span className="text-slate-500 text-[8px] uppercase block mb-1">Dollar Risk / Trade</span>
            <span className="text-emerald-400 font-black text-xs md:text-sm block">
              ${riskAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-850/70 text-center font-mono">
            <span className="text-slate-500 text-[8px] uppercase block mb-1">Lot Size Recommend</span>
            <span className="text-sky-400 font-black text-xs md:text-sm block truncate" title={`${recommendedLotSize} Standard Lots`}>
              {recommendedLotSize} Standard Lots
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-850/70 text-center font-mono">
            <span className="text-slate-500 text-[8px] uppercase block mb-1">Max Daily Risk (2x)</span>
            <span className="text-amber-500 font-bold text-[10.5px] block mt-0.5">
              ${dailyRiskLimit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-850/70 text-center font-mono">
            <span className="text-slate-500 text-[8px] uppercase block mb-1">Max Weekly Risk (5x)</span>
            <span className="text-rose-400 font-bold text-[10.5px] block mt-0.5">
              ${weeklyRiskLimit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-850/70 text-center font-mono col-span-2 md:col-span-1">
            <span className="text-slate-500 text-[8px] uppercase block mb-1">Drawdown Cushion Pool</span>
            <span className="text-slate-300 text-[10px] font-bold block mt-0.5 truncate" title={`$${drawdownPool.toLocaleString()} (${drawdownPoolPercent}%)`}>
              ${drawdownPool.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ({drawdownPoolPercent}%)
            </span>
          </div>
        </div>

        {/* 2C. Trade Management protocols inline */}
        <div className="mt-5 p-4 bg-slate-950/60 rounded-xl border border-white/5 flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="text-slate-300 font-bold uppercase font-mono tracking-wider">
              Management & Partialing Protocols
            </span>
            <p className="text-slate-450 mt-1 leading-relaxed font-mono text-[9.5px] italic">
              "{instructions}"
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

// ==========================================
// 3. SESSION & NEWS SECTION COMPONENT
// ==========================================
interface SessionNewsSectionProps {
  sessionAnalysis: {
    identifiedSessions: string[];
    suitabilityScore: number;
    suitabilityExplanation: string;
  };
  newsFilter: {
    newsNear: boolean;
    eventsDetected: string[];
    warningMessage?: string;
    impactOnConfidence: string;
  };
}

const SessionNewsSection = React.memo(function SessionNewsSection({
  sessionAnalysis,
  newsFilter
}: SessionNewsSectionProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      {/* Session Suitability Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-800/80 pb-3">
          <Clock className="w-5 h-5 text-indigo-400 shrink-0" />
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest font-mono">
              03. Session Timing Alignment
            </h3>
            <p className="text-[9.5px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">
              Liquidity release evaluation per major geographic open
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-mono uppercase">Identified Windows:</span>
            <div className="flex flex-wrap gap-1.5">
              {sessionAnalysis.identifiedSessions.length > 0 ? (
                sessionAnalysis.identifiedSessions.map((session) => (
                  <span key={session} className="bg-sky-500/10 text-sky-400 border border-sky-500/15 text-[9px] font-bold font-mono px-2 py-0.5 rounded uppercase">
                    {session}
                  </span>
                ))
              ) : (
                <span className="bg-slate-800 text-slate-450 text-[9px] font-mono px-2 py-0.5 rounded">None Detected</span>
              )}
            </div>
          </div>

          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
            <div className="flex justify-between items-center mb-1.5 text-xs">
              <span className="text-slate-400 font-mono">Timing Suitability Score:</span>
              <span className={`font-mono font-bold ${
                sessionAnalysis.suitabilityScore >= 7 ? 'text-emerald-400' : sessionAnalysis.suitabilityScore >= 5 ? 'text-sky-400' : 'text-rose-400'
              }`}>{sessionAnalysis.suitabilityScore}/10</span>
            </div>
            {/* Horizontal progress indicator */}
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  sessionAnalysis.suitabilityScore >= 7 ? 'bg-emerald-400' : sessionAnalysis.suitabilityScore >= 5 ? 'bg-sky-400' : 'bg-rose-400'
                }`}
                style={{ width: `${sessionAnalysis.suitabilityScore * 10}%` }}
              ></div>
            </div>
          </div>

          <div className="text-[10.5px] text-slate-350 leading-relaxed font-mono bg-slate-950/20 p-3 rounded-lg border border-slate-900">
            {sessionAnalysis.suitabilityExplanation}
          </div>
        </div>
      </div>

      {/* News Filter Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-800/80 pb-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest font-mono">
              04. Macro News Blackout Filter
            </h3>
            <p className="text-[9.5px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">
              High-impact releases matching strict terminal safety guidelines
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-mono uppercase">News Status:</span>
            {newsFilter.newsNear ? (
              <span className="bg-rose-500/15 text-rose-400 border border-rose-500/20 text-[9px] font-black px-2.5 py-0.5 rounded-md font-mono uppercase tracking-wider animate-pulse">
                HIGH DANGER NEWS NEAR
              </span>
            ) : (
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black px-2.5 py-0.5 rounded-md font-mono uppercase tracking-wider">
                CLEAR BLACKOUT RANGE
              </span>
            )}
          </div>

          {newsFilter.eventsDetected.length > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono uppercase">Detected Events:</span>
              <div className="flex flex-wrap gap-1">
                {newsFilter.eventsDetected.map((evt) => (
                  <span key={evt} className="bg-amber-400/10 text-amber-400 border border-amber-400/20 text-[9px] font-black font-mono px-2 py-0.5 rounded uppercase">
                    {evt}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850/80 text-xs font-mono">
            <span className="text-slate-500 text-[9px] uppercase">Confidence Degradation Impact:</span>
            <p className="text-slate-300 font-bold mt-1 uppercase">{newsFilter.impactOnConfidence}</p>
          </div>

          {newsFilter.warningMessage && (
            <div className="bg-amber-400/[0.02] border border-amber-400/10 rounded-xl p-3 text-[10px] text-amber-300/90 leading-relaxed font-mono">
              <span className="font-extrabold text-amber-400 uppercase text-[9px] block mb-1">NEWS SHIELD ALERT:</span>
              {newsFilter.warningMessage}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

// ==========================================
// 4. STRUCTURE ANALYSIS SECTION COMPONENT
// ==========================================
interface StructureAnalysisSectionProps {
  marketBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  structure: {
    score: number;
    description: string;
    bosDetected: boolean;
    chochDetected: boolean;
    mssDetected: boolean;
  };
  liquidity: {
    liquidityTaken: 'YES' | 'NO';
    details: string;
    externalRemaining: string;
    internalRemaining: string;
    sweptPools: string[];
  };
}

const StructureAnalysisSection = React.memo(function StructureAnalysisSection({
  marketBias,
  structure,
  liquidity
}: StructureAnalysisSectionProps) {
  const isLqSwept = liquidity.liquidityTaken === 'YES';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      {/* Structural health */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-800/80 pb-3">
          <Layers className="w-5 h-5 text-sky-400 shrink-0" />
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest font-mono">
              05. Structural Alignment Validation
            </h3>
            <p className="text-[9.5px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">
              Fractal structures and structural break validations
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-mono uppercase">Structural Rating:</span>
            <span className={`font-mono font-bold ${
              structure.score >= 7 ? 'text-emerald-400' : 'text-sky-400'
            }`}>{structure.score}/10</span>
          </div>

          {/* Checklist indicators */}
          <div className="grid grid-cols-3 gap-2 font-mono text-[10px]">
            <div className={`p-2.5 rounded-lg border text-center font-bold ${
              structure.bosDetected ? 'bg-emerald-500/[0.03] border-emerald-500/20 text-emerald-400' : 'bg-slate-950 border-slate-850 text-slate-600'
            }`}>
              BOS {structure.bosDetected ? 'PASS' : 'FAIL'}
            </div>
            <div className={`p-2.5 rounded-lg border text-center font-bold ${
              structure.chochDetected ? 'bg-emerald-500/[0.03] border-emerald-500/20 text-emerald-400' : 'bg-slate-950 border-slate-850 text-slate-600'
            }`}>
              CHOCH {structure.chochDetected ? 'PASS' : 'FAIL'}
            </div>
            <div className={`p-2.5 rounded-lg border text-center font-bold ${
              structure.mssDetected ? 'bg-emerald-500/[0.03] border-emerald-500/20 text-emerald-400' : 'bg-slate-950 border-slate-850 text-slate-600'
            }`}>
              MSS {structure.mssDetected ? 'PASS' : 'FAIL'}
            </div>
          </div>

          <div className="text-[10.5px] text-slate-350 leading-relaxed font-mono bg-slate-950/20 p-3 rounded-lg border border-slate-900">
            {structure.description}
          </div>
        </div>
      </div>

      {/* Liquidity targets */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-800/80 pb-3">
          <Zap className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest font-mono">
              06. Liquidity Grab & Pool sweeps
            </h3>
            <p className="text-[9.5px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">
              Verification of high-probability retail engineering stop-outs
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-mono uppercase">Liquidity Sweep confirmed:</span>
            <span className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded-md ${
              isLqSwept ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              {liquidity.liquidityTaken === 'YES' ? 'YES ✓' : 'NO ✗'}
            </span>
          </div>

          {liquidity.sweptPools.length > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono uppercase">Swept Pools:</span>
              <div className="flex flex-wrap gap-1 justify-end">
                {liquidity.sweptPools.map((pool) => (
                  <span key={pool} className="bg-emerald-500/5 text-emerald-400 border border-emerald-500/15 text-[9px] font-bold font-mono px-2 py-0.5 rounded">
                    {pool}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
              <span className="text-slate-550 block text-[8px] uppercase">External Liquidity</span>
              <span className="text-slate-300 font-bold block mt-0.5 truncate" title={liquidity.externalRemaining || 'Mitigated'}>
                {liquidity.externalRemaining || 'Mitigated'}
              </span>
            </div>
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
              <span className="text-slate-550 block text-[8px] uppercase">Internal Liquidity</span>
              <span className="text-slate-300 font-bold block mt-0.5 truncate" title={liquidity.internalRemaining || 'Mitigated'}>
                {liquidity.internalRemaining || 'Mitigated'}
              </span>
            </div>
          </div>

          <div className="text-[10.5px] text-slate-350 leading-relaxed font-mono bg-slate-950/20 p-3 rounded-lg border border-slate-900">
            {liquidity.details}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// ==========================================
// 5. ADVANCED METRICS (CONFLUENCE SCORES BAR CHART)
// ==========================================
interface AdvancedMetricsSectionProps {
  scores: {
    htfPoi: number;        // Max 20
    liquiditySweep: number; // Max 15
    bosChoch: number;      // Max 20
    displacement: number;  // Max 15
    fvg: number;           // Max 15
    idm: number;           // Max 5
    ote: number;           // Max 10
    total: number;         // Max 100
  };
  complianceScore: number;
  rulesMet: { name: string; val: boolean; d: string }[];
}

const AdvancedMetricsSection = React.memo(function AdvancedMetricsSection({
  scores,
  complianceScore,
  rulesMet
}: AdvancedMetricsSectionProps) {
  
  // Custom metrics data mapping with weights
  const barMetrics = [
    { name: 'HTF POI Alignment', score: scores.htfPoi, max: 20, color: 'bg-indigo-500', pct: (scores.htfPoi / 20) * 100 },
    { name: 'Liquidity Sweep Verified', score: scores.liquiditySweep, max: 15, color: 'bg-emerald-500', pct: (scores.liquiditySweep / 15) * 100 },
    { name: 'BOS / CHOCH Transition', score: scores.bosChoch, max: 20, color: 'bg-sky-500', pct: (scores.bosChoch / 20) * 100 },
    { name: 'Displacement Strength', score: scores.displacement, max: 15, color: 'bg-amber-500', pct: (scores.displacement / 15) * 100 },
    { name: 'Fair Value Gap Imbalance', score: scores.fvg, max: 15, color: 'bg-cyan-500', pct: (scores.fvg / 15) * 100 },
    { name: 'Inducement (IDM) Confirmation', score: scores.idm, max: 5, color: 'bg-purple-500', pct: (scores.idm / 5) * 100 },
    { name: 'Optimal Entry Zone (OTE)', score: scores.ote, max: 10, color: 'bg-teal-500', pct: (scores.ote / 10) * 100 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-5 border-b border-slate-800/80 pb-3">
        <BarChart2 className="w-5 h-5 text-indigo-400 shrink-0" />
        <div>
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest font-mono">
            07. Advanced Confluence Score breakdown
          </h3>
          <p className="text-[9.5px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">
            Individual weight factors matching objective institutional trading rules
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: Visual Custom Graphical Chart (7 cols) */}
        <div className="lg:col-span-7 space-y-4 font-mono">
          <span className="text-[9.5px] text-slate-500 uppercase tracking-wider block mb-1">Confluence Ingestion weight bars:</span>
          
          <div className="space-y-3">
            {barMetrics.map((bar) => (
              <div key={bar.name} className="space-y-1">
                <div className="flex justify-between items-center text-[10.5px]">
                  <span className="text-slate-350">{bar.name}</span>
                  <span className="text-slate-400">
                    <strong className="text-white font-bold">{bar.score}</strong>/{bar.max} <span className="text-[9px] text-slate-550">({Math.round(bar.pct)}%)</span>
                  </span>
                </div>
                {/* Visual bar container */}
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden relative">
                  <div className="absolute inset-0 bg-slate-900/40 border border-white/[0.02]"></div>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${bar.pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full ${bar.color} rounded-full`}
                  ></motion.div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Rule Compliance Radar list (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-4">
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 flex items-center justify-between">
            <div className="font-mono">
              <span className="text-slate-500 text-[8.5px] uppercase block tracking-wider">COMPLIANCE INDEX</span>
              <span className="text-sm font-bold text-white mt-0.5 block">SMC Protocol Auditing</span>
            </div>
            
            {/* Round compliance gauge */}
            <div className="relative w-14 h-14 flex items-center justify-center bg-slate-900 rounded-full border border-white/5">
              <svg className="absolute w-full h-full transform -rotate-90">
                <circle cx="28" cy="28" r="22" stroke="#1e293b" strokeWidth="3" fill="transparent" />
                <motion.circle 
                  cx="28" 
                  cy="28" 
                  r="22" 
                  stroke={complianceScore >= 80 ? '#10b981' : '#3b82f6'} 
                  strokeWidth="3" 
                  fill="transparent" 
                  strokeDasharray={2 * Math.PI * 22}
                  initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
                  animate={{ strokeDashoffset: (2 * Math.PI * 22) - ((2 * Math.PI * 22) * complianceScore) / 100 }}
                  transition={{ duration: 0.8 }}
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-[10px] font-black font-mono text-white relative">{complianceScore}%</span>
            </div>
          </div>

          {/* Micro indicators list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            {rulesMet.slice(0, 6).map((rule) => (
              <div
                key={rule.name}
                className={`p-2.5 rounded-lg border ${
                  rule.val 
                    ? 'bg-emerald-500/[0.03] border-emerald-500/10' 
                    : 'bg-rose-500/[0.03] border-rose-500/10'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5 mb-0.5">
                  <span className="font-bold text-[9px] text-slate-300 truncate">{rule.name}</span>
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                    rule.val ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                  }`}>
                    {rule.val ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                <p className="text-[7.5px] text-slate-550 truncate leading-none uppercase">{rule.d}</p>
              </div>
            ))}
          </div>

        </div>

      </div>
    </motion.div>
  );
});

// ==========================================
// 6. WHY TRADE EXISTS SECTION COMPONENT
// ==========================================
interface WhyTradeExistsSectionProps {
  whyThisTradeExists: {
    htfContext: string;
    liquidityEvent: string;
    bosChoch: string;
    displacement: string;
    fvg: string;
    ote: string;
    idm: string;
    liquidityTarget: string;
    reasoningSummary: string;
  };
}

const WhyTradeExistsSection = React.memo(function WhyTradeExistsSection({
  whyThisTradeExists
}: WhyTradeExistsSectionProps) {
  
  const rules = [
    { num: '01', title: 'HTF Context Alignment', text: whyThisTradeExists.htfContext },
    { num: '02', title: 'Liquidity Event (Sweep)', text: whyThisTradeExists.liquidityEvent },
    { num: '03', title: 'BOS / CHOCH Shift', text: whyThisTradeExists.bosChoch },
    { num: '04', title: 'Displacement Momentum', text: whyThisTradeExists.displacement },
    { num: '05', title: 'Fair Value Gap Presence', text: whyThisTradeExists.fvg },
    { num: '06', title: 'Optimal Entry (OTE)', text: whyThisTradeExists.ote },
    { num: '07', title: 'Inducement (IDM)', text: whyThisTradeExists.idm },
    { num: '08', title: 'Draw on Liquidity Target', text: whyThisTradeExists.liquidityTarget },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/[0.01] rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="flex items-center gap-2 mb-5 border-b border-slate-800/80 pb-3">
        <BookOpen className="w-5 h-5 text-indigo-400 shrink-0" />
        <div>
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest font-mono">
            08. MANDATORY SMC CONFLUENCES
          </h3>
          <p className="text-[9.5px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">
            Deep structural logic proving setup validity before taking position risk
          </p>
        </div>
      </div>

      {/* 8 points matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
        {rules.map((rule) => (
          <div key={rule.num} className="p-3.5 bg-slate-950/40 rounded-xl border border-slate-850/80 hover:border-slate-800 transition duration-150">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-sky-500/10 text-sky-400 font-bold text-[8.5px] px-1.5 py-0.5 rounded">
                {rule.num}
              </span>
              <span className="text-[9.5px] text-slate-400 uppercase tracking-wide font-extrabold">{rule.title}:</span>
            </div>
            <p className="text-slate-300 mt-1 leading-relaxed text-[10.5px]">{rule.text}</p>
          </div>
        ))}
      </div>

      {/* Reasoning executive summary */}
      <div className="mt-5 p-4 bg-sky-950/10 border border-sky-900/20 rounded-xl text-slate-300 text-[10.5px] leading-relaxed font-mono">
        <strong className="text-sky-400 block mb-1.5 tracking-wider uppercase text-[9.5px]">Reasoning Executive Summary:</strong>
        <p className="text-justify">{whyThisTradeExists.reasoningSummary}</p>
      </div>
    </motion.div>
  );
});

// ==========================================
// 7. VALIDATION SECTION (CHART QUALITY & INVALIDATION)
// ==========================================
interface ValidationSectionProps {
  chartQuality: {
    candlesVisible: boolean;
    timeframeVisible: boolean;
    priceScaleVisible: boolean;
    structureVisible: boolean;
    qualityScore: number;
    isAcceptable: boolean;
    rejectionReason?: string;
  };
  tradeInvalidation: {
    criteria: string[];
    explanation: string;
  };
}

const ValidationSection = React.memo(function ValidationSection({
  chartQuality,
  tradeInvalidation
}: ValidationSectionProps) {
  
  const qualityItems = [
    { label: 'Candlestick Visibility', act: chartQuality.candlesVisible },
    { label: 'Primary Timeframe Label', act: chartQuality.timeframeVisible },
    { label: 'Price Scale Coordinates', act: chartQuality.priceScaleVisible },
    { label: 'Structural Peaks (H/L)', act: chartQuality.structureVisible },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      {/* Chart Quality Validation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-800/80 pb-3">
          <Award className="w-5 h-5 text-sky-400 shrink-0" />
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest font-mono">
              09. Ingestion Chart Quality Check
            </h3>
            <p className="text-[9.5px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">
              OCR verification validating pixel readability and aspect bounds
            </p>
          </div>
        </div>

        <div className="space-y-4 font-mono">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 uppercase">Readability Index:</span>
            <div className="flex items-center gap-2">
              <span className={`font-bold ${chartQuality.qualityScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {chartQuality.qualityScore}/100
              </span>
              <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded uppercase ${
                chartQuality.isAcceptable ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}>
                {chartQuality.isAcceptable ? 'TRUSTED' : 'REJECTED'}
              </span>
            </div>
          </div>

          {/* Checklist list */}
          <div className="space-y-2 text-[10.5px]">
            {qualityItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-850/80">
                <span className="text-slate-400">{item.label}</span>
                <span className={`text-[8.5px] font-bold ${item.act ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {item.act ? 'CONFIRMED ✓' : 'MISSING ✗'}
                </span>
              </div>
            ))}
          </div>

          {chartQuality.rejectionReason && (
            <div className="bg-rose-500/5 border border-rose-500/10 rounded-lg p-3 text-[10px] text-rose-400 leading-normal">
              <span className="font-bold uppercase text-[9px] block mb-1">OCR Warning:</span>
              {chartQuality.rejectionReason}
            </div>
          )}
        </div>
      </div>

      {/* Trade Invalidation Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-800/80 pb-3">
          <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest font-mono">
              10. Invalidation protective criteria
            </h3>
            <p className="text-[9.5px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">
              Specific structure changes commanding immediate manual termination
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2 font-mono text-[10.5px]">
            <span className="text-slate-500 uppercase tracking-wider block mb-1">Invalidation Bulletins:</span>
            {tradeInvalidation.criteria.length > 0 ? (
              tradeInvalidation.criteria.map((crt, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-950 border border-slate-850/80 text-slate-300">
                  <span className="text-rose-450 font-bold shrink-0">⚠</span>
                  <span className="leading-relaxed text-[10px] uppercase">{crt}</span>
                </div>
              ))
            ) : (
              <div className="text-slate-500 text-center py-4">No specific criteria parsed. Close beyond invalidation coordinate.</div>
            )}
          </div>

          <div className="text-[10.5px] text-slate-350 leading-relaxed font-mono bg-slate-950/20 p-3 rounded-lg border border-slate-900">
            <span className="font-bold text-slate-400 block mb-1 uppercase text-[9px]">SMC Invalidation Core Rule:</span>
            {tradeInvalidation.explanation}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// ==========================================
// MAIN DASHBOARD COMPONENT (EXPORTED)
// ==========================================
function SMCAnalysisDashboard({
  analysis,
  complianceScore,
  winProbability,
  rfBalance,
  setRfBalance,
  rfRiskPerTrade,
  setRfRiskPerTrade,
  rfTargetBalance,
  setRfTargetBalance,
  setIsMemoOpen
}: SMCAnalysisDashboardProps) {
  
  // Rules checklist mapping array for AdvancedMetricsSection
  const rulesMet = React.useMemo(() => [
    { name: 'Market Bias', val: analysis.marketBias !== 'NEUTRAL', d: 'Trend defined (no range trap)' },
    { name: 'Liquidity Sweep', val: analysis.liquidity.liquidityTaken === 'YES', d: 'Asian or HTF highs/lows swept' },
    { name: 'POI Confirmation', val: analysis.htfAnalysis.score >= 5, d: 'Mitigated H1/H4 primary POI zone' },
    { name: 'BOS Body Close', val: !!(analysis.structure.bosDetected || analysis.structure.chochDetected || analysis.structure.mssDetected), d: 'Break validated via full candle body close' },
    { name: 'Premium Pullback', val: !!(analysis.tradePlan?.instructions?.toLowerCase().includes('pullback') || 
         analysis.tradePlan?.entryZone?.toLowerCase().includes('pullback') || 
         analysis.whyThisTradeExists?.ote?.toLowerCase().includes('ote') || 
         analysis.whyThisTradeExists?.reasoningSummary?.toLowerCase().includes('pullback') || 
         analysis.whyThisTradeExists?.reasoningSummary?.toLowerCase().includes('equilibrium') || 
         analysis.ote?.isAligned), d: 'Discount (buys) or Premium (sells) entry' },
    { name: 'Fair Value Gap', val: !!(analysis.fvgs && analysis.fvgs.length > 0), d: 'Imbalance displacement zone is open' },
    { name: 'Risk Management', val: rfRiskPerTrade <= 2.0, d: 'Max trade risk <= 2.0% buffer limits' }
  ], [analysis, rfRiskPerTrade]);

  return (
    <div id="smc-metrics-output" className="space-y-6">
      {/* 1. Verdict Scorecard Section */}
      <VerdictScorecard
        direction={analysis.tradePlan.direction}
        biasConfidence={analysis.biasConfidence}
        setupQualityScore={analysis.setupQualityScore}
        setupGrade={analysis.setupGrade}
        riskCategory={analysis.riskCategory}
        historicalPatternMatch={analysis.historicalPatternMatch}
        estimatedSuccessRange={analysis.estimatedSuccessRange || `${Math.round(winProbability - 3)}% - ${Math.round(winProbability + 3)}%`}
        totalConfluenceScore={analysis.scores.total}
        complianceScore={complianceScore}
        onOpenMemo={() => setIsMemoOpen(true)}
      />

      {/* 2. Trade Plan Levels & Position Capital Sizer Section */}
      <TradePlanSection
        direction={analysis.tradePlan.direction}
        entryZone={analysis.tradePlan.entryZone}
        stopLoss={analysis.tradePlan.stopLoss}
        tp1={analysis.tradePlan.tp1}
        tp2={analysis.tradePlan.tp2}
        tp3={analysis.tradePlan.tp3}
        riskRewardRatio={analysis.tradePlan.riskRewardRatio}
        instructions={analysis.tradePlan.instructions}
        rfBalance={rfBalance}
        setRfBalance={setRfBalance}
        rfRiskPerTrade={rfRiskPerTrade}
        setRfRiskPerTrade={setRfRiskPerTrade}
        rfTargetBalance={rfTargetBalance}
        setRfTargetBalance={setRfTargetBalance}
      />

      {/* 3. Session windows suitability & news alerts side-by-side Section */}
      <SessionNewsSection
        sessionAnalysis={analysis.sessionAnalysis}
        newsFilter={analysis.newsFilter}
      />

      {/* 4. Structural validation checklist & Liquidity sweeper Section */}
      <StructureAnalysisSection
        marketBias={analysis.marketBias}
        structure={analysis.structure}
        liquidity={analysis.liquidity}
      />

      {/* 5. Advanced metrics bar weight scores & compliance checklists Section */}
      <AdvancedMetricsSection
        scores={analysis.scores}
        complianceScore={complianceScore}
        rulesMet={rulesMet}
      />

      {/* 6. Deep Confluence reasoning - why the trade exists Section */}
      <WhyTradeExistsSection
        whyThisTradeExists={analysis.whyThisTradeExists}
      />

      {/* 7. Image verification OCR checks & invalidation criteria Section */}
      <ValidationSection
        chartQuality={analysis.chartQuality}
        tradeInvalidation={analysis.tradeInvalidation}
      />
    </div>
  );
}

export default React.memo(SMCAnalysisDashboard);
