/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  ShieldAlert, 
  BarChart3, 
  HelpCircle,
  Gem,
  DollarSign
} from 'lucide-react';

interface AccountGrowthCalculatorProps {
  activeRR: number; // passed from active SMC setup if any (default to 3)
  activeWinRate?: number;
}

export default function AccountGrowthCalculator({ activeRR, activeWinRate }: AccountGrowthCalculatorProps) {
  const [balance, setBalance] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(1.0);
  const [targetBalance, setTargetBalance] = useState<number>(12000);
  const [winRate, setWinRate] = useState<number>(activeWinRate || 55);
  const [rrRatio, setRrRatio] = useState<number>(activeRR || 3.0);
  const [slPips, setSlPips] = useState<number>(15);
  const [pipValue, setPipValue] = useState<number>(10); // $10 per standard lot/pip default

  useEffect(() => {
    if (activeWinRate) {
      setWinRate(activeWinRate);
    }
  }, [activeWinRate]);

  useEffect(() => {
    if (activeRR) {
      setRrRatio(activeRR);
    }
  }, [activeRR]);

  // Outputs
  const riskAmount = balance * (riskPercent / 100);
  
  // Standard lot size formula: Size = Risk Amount / (SL in pips * Pip Value of 1 Standard Lot)
  const recommendedLotSize = slPips > 0 ? (riskAmount / (slPips * pipValue)) : 0;
  
  // Gain and Loss parameters
  const winGainAmt = riskAmount * rrRatio;
  const lossLossAmt = riskAmount;
  
  // Expectancy (EV) = (Winrate * Gain) - (Lossrate * Loss)
  const winRateDec = winRate / 100;
  const lossRateDec = 1 - winRateDec;
  const evPerTrade = (winRateDec * winGainAmt) - (lossRateDec * lossLossAmt);
  const evPercent = (evPerTrade / balance) * 100;

  // Needed gain to hit target
  const targetGainNeeded = targetBalance - balance;
  const requiredTradesExpected = targetGainNeeded > 0 && evPerTrade > 0 
    ? Math.ceil(targetGainNeeded / evPerTrade) 
    : 0;

  // Let's model scenarios based on 20 trading days in a month:
  // 1. Conservative (10 trades/month, e.g., high timeframe confluences only)
  // 2. Moderate (22 trades/month, e.g., 1 setup per day)
  // 3. Aggressive (44 trades/month, e.g., 2 setups per day across multiple assets)
  
  const getCompoundedGrowth = (numTrades: number) => {
    let currentBal = balance;
    // Simulate average expectation over N trades
    for (let i = 0; i < numTrades; i++) {
      // Instead of random walks, we grow by the expectancy ratio compounding
      currentBal = currentBal * (1 + evPercent / 100);
    }
    return currentBal;
  };

  const conservativeCompounded = getCompoundedGrowth(10);
  const moderateCompounded = getCompoundedGrowth(22);
  const aggressiveCompounded = getCompoundedGrowth(44);

  const daysRequired = targetGainNeeded > 0 && evPerTrade > 0
    ? Math.round(requiredTradesExpected * (20 / 22)) // Assuming 22 trades per 20 trading days (1.1 trade per day average)
    : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100">
      <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-slate-800">
        <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
          <Calculator className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold font-mono tracking-tight text-white uppercase">SMC RISK & GROWTH CALCULATOR</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Calculate precise lot sizes and project growth trajectories based on positive expectancy.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Left column: Controls */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 font-mono uppercase tracking-wide mb-1.5 flex justify-between">
              <span>Current Account Balance ($)</span>
              <span className="text-emerald-400 font-bold">${balance.toLocaleString()}</span>
            </label>
            <input
              id="input-balance"
              type="number"
              value={balance}
              onChange={(e) => setBalance(Math.max(1, Number(e.target.value)))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-emerald-500 transition font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 font-mono uppercase tracking-wide mb-1.5 flex justify-between">
                <span>Max Risk (%)</span>
                <span className="text-rose-400 font-bold">{riskPercent.toFixed(1)}%</span>
              </label>
              <input
                id="input-risk-percent"
                type="range"
                min="0.2"
                max="5.0"
                step="0.1"
                value={riskPercent}
                onChange={(e) => setRiskPercent(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none mt-2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 font-mono uppercase tracking-wide mb-1.5 flex justify-between">
                <span>Win Rate (%)</span>
                <span className="text-sky-400 font-bold">{winRate}%</span>
              </label>
              <input
                id="input-win-rate"
                type="range"
                min="35"
                max="80"
                step="1"
                value={winRate}
                onChange={(e) => setWinRate(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none mt-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 font-mono uppercase tracking-wide mb-1.5 flex justify-between">
              <span>Target Account Balance ($)</span>
              <span className="text-yellow-400 font-bold">${targetBalance.toLocaleString()}</span>
            </label>
            <input
              id="input-target-balance"
              type="number"
              value={targetBalance}
              onChange={(e) => setTargetBalance(Math.max(balance + 1, Number(e.target.value)))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-emerald-500 transition font-mono"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider mb-1">
                Reward:Risk
              </label>
              <input
                id="input-rr-ratio"
                type="number"
                step="0.1"
                value={rrRatio}
                onChange={(e) => setRrRatio(Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 text-xs focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider mb-1">
                Stop Loss (Pips)
              </label>
              <input
                id="input-sl-pips"
                type="number"
                value={slPips}
                onChange={(e) => setSlPips(Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 text-xs focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider mb-1">
                Pip Value/Lot
              </label>
              <input
                id="input-pip-value"
                type="number"
                value={pipValue}
                onChange={(e) => setPipValue(Math.max(0.1, Number(e.target.value)))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 text-xs focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Right column: Risk Calculations Summary */}
        <div className="flex flex-col justify-between bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Position Sizing parameters</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-mono text-slate-500">Risked Amount</span>
                <p className="text-lg font-bold text-rose-400 font-mono mt-1">${riskAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-mono text-slate-500">Recommended Lots</span>
                <p className="text-lg font-bold text-emerald-400 font-mono mt-1">
                  {recommendedLotSize.toFixed(2)} <span className="text-xs text-slate-500">Lots</span>
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Reward:Risk Expectancy Ratio</span>
                <span className="text-slate-200 font-mono">1 : {rrRatio.toFixed(1)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Mathematical Setup Expectancy (EV)</span>
                <span className={`font-mono font-semibold ${evPerTrade >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  +${evPerTrade.toFixed(2)} per trade ({evPercent.toFixed(2)}%)
                </span>
              </div>
              <div className="flex justify-between text-xs border-t border-slate-800/60 pt-2.5">
                <span className="text-slate-400">Total Account Capital to Gain</span>
                <span className="text-yellow-400 font-semibold font-mono">+${targetGainNeeded.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Required Analytical Trades (Avg)</span>
                <span className="text-sky-400 font-bold font-mono">{requiredTradesExpected || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 flex items-start gap-2.5 mt-4">
            <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-300 leading-relaxed">
              <span className="font-bold text-white uppercase font-mono">Prop Risk Rule:</span> Standardized 1%-1.5% maximum exposure per setup protects trading accounts from drawdowns during variance periods.
            </div>
          </div>
        </div>
      </div>

      {/* Trajectory Scenarios */}
      <div className="border-t border-slate-800 pt-6">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-sky-400" />
          Probabilistic Monthly Growth Trajectories (Compounded Target: ${targetBalance.toLocaleString()})
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Conservative Scenario */}
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold font-mono text-slate-500 uppercase">Conservative</span>
                <span className="bg-sky-500/10 text-sky-400 px-1.5 py-0.5 rounded text-[9px] font-semibold border border-sky-500/20">HTF swings</span>
              </div>
              <p className="text-xs text-slate-400">Low frequency, 10 setups a month.</p>
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-800/60">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-slate-500 text-[10px]">Proj. Balance</span>
                <span className="text-sm font-bold text-white font-mono">${Math.round(conservativeCompounded).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-500 text-[10px]">Monthly Net %</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">+{((conservativeCompounded - balance) / balance * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Moderate Scenario */}
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between ring-1 ring-sky-500/20">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold font-mono text-sky-400 uppercase">Moderate</span>
                <span className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded text-[9px] font-semibold border border-emerald-500/20 font-mono">1 Standard Setup/Day</span>
              </div>
              <p className="text-xs text-slate-400">Standard frequency, 22 setups a month.</p>
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-800/60">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-slate-500 text-[10px]">Proj. Balance</span>
                <span className="text-sm font-bold text-sky-300 font-mono">${Math.round(moderateCompounded).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-500 text-[10px]">Monthly Net %</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">+{((moderateCompounded - balance) / balance * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Aggressive Scenario */}
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold font-mono text-slate-500 uppercase">Aggressive</span>
                <span className="bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded text-[9px] font-semibold border border-rose-500/20">Intraday sweeps</span>
              </div>
              <p className="text-xs text-slate-400">High frequency, 44 setups a month.</p>
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-800/60">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-slate-500 text-[10px]">Proj. Balance</span>
                <span className="text-sm font-bold text-white font-mono">${Math.round(aggressiveCompounded).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-500 text-[10px]">Monthly Net %</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">+{((aggressiveCompounded - balance) / balance * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Estimated Days Required */}
        {targetGainNeeded > 0 && evPerTrade > 0 && (
          <div className="mt-5 p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gem className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-slate-300">Minimum estimated active trading days to probabilistic goal targeting:</span>
            </div>
            <span className="text-sm font-bold text-yellow-400 font-mono">
              ~{daysRequired} Trading Days
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
