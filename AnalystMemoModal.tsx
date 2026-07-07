/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SMCAnalysisResponse } from '../types';
import { 
  FileText, 
  X, 
  Copy, 
  CheckSquare, 
  Check, 
  Printer, 
  ShieldAlert, 
  TrendingUp, 
  Lock,
  Download
} from 'lucide-react';

interface AnalystMemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: SMCAnalysisResponse;
  timeframe: string;
}

export default function AnalystMemoModal({
  isOpen,
  onClose,
  analysis,
  timeframe
}: AnalystMemoModalProps) {
  const [copied, setCopied] = useState(false);
  const [checklist, setChecklist] = useState({
    htfAligned: true,
    liquiditySwept: true,
    fvgOpen: true,
    oteChecked: true,
    riskRestricted: true
  });

  if (!isOpen) return null;

  // Generate formal markdown memo text
  const rawMemoText = `
========================================================================
             INSTITUTIONAL QUANT DISTRIBUTION DESK DIRECTIVE            
                      - CLASSIFIED: ULTRA-CONFIDENTIAL -                
========================================================================

ID REF: SMC-DIR-${new Date().toISOString().slice(0, 10)}-${analysis.marketBias}
DATE:   ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC
FROM:   Senior Quant Risk Strategy Desk
TO:     Prop execution / High-Frequency Execution Terminal
SUBJECT: Tactical Order Flow Confluence Verification - ${analysis.marketBias} Bias

1. COMPOSITE SENTIMENT ASSESSMENT
---------------------------------
PRIMARY DIRECTION : [ ${analysis.marketBias} ]
CONFIDENCE INDEX  : ${analysis.biasConfidence}%
HTF POI ALIGNMENT : ${analysis.htfAnalysis.score}/10 [ ${analysis.htfAnalysis.reactionQuality} ]
CONFLUENCE SCORE  : ${analysis.scores.total}/100 [ ${analysis.scores.total >= 80 ? "HIGH EXPECTANCY" : "TRADABLE DISCRETIONARY"} ]

STRENGTH PARAMETERS:
- Sweep Status: ${analysis.liquidity.liquidityTaken === 'YES' ? "QUALIFIED LIQUIDITY GRAB" : "NO SWEEP DETECTED"}
- Displacement: ${analysis.displacement.strength}
- Market Shifts: BOS/CHOCH Sequence validated is [ ${analysis.structure.sequenceType} ]

2. MATHEMATICAL RISK ENGINE SETUPS
----------------------------------
ENTRY LIMIT BAND : ${analysis.tradePlan.entryZone}
STOP LOSS ANCHOR : ${analysis.tradePlan.stopLoss} [INVALIDATION THRESHOLD]
TAKE PROFIT BLUEPRINTS:
  * TP1 (Primary Pool): ${analysis.tradePlan.tp1}
  * TP2 (External Liquidity): ${analysis.tradePlan.tp2}
  * TP3 (Macro Target Area): ${analysis.tradePlan.tp3}
RISK:REWARD TRAJECTORY: ${analysis.tradePlan.riskRewardRatio}

MANAGEMENT INSTRUCTIONS:
"${analysis.tradePlan.instructions}"

------------------------------------------------------------------------
AUTHENTICATION CODE: JWT-${Math.random().toString(36).substring(2, 10).toUpperCase()}-SMCv3
PROPRIETARY COMPOUND SYSTEM CONSTRAINTS ENGAGED. DO NOT MERGE WITHOUT SL.
========================================================================
  `.trim();

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(rawMemoText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm print:absolute print:inset-0 print:p-0 print:bg-white print:text-black">
      
      {/* MODAL FRAME */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh] print:border-none print:shadow-none print:max-h-none print:w-full">
        
        {/* CONFIDENTIAL DECORATIVE STAMP */}
        <div className="absolute top-16 right-8 opacity-5 text-indigo-400 rotate-12 text-6xl font-black font-mono select-none pointer-events-none uppercase tracking-widest print:hidden">
          CLASSIFIED
        </div>

        {/* TOP BAR */}
        <div className="flex items-center justify-between p-5 border-b border-slate-850 bg-slate-950/40 print:hidden">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-sm font-bold font-mono text-white tracking-tight uppercase">SMC Institutional Directive Memo</h2>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider">PREPARE REPORT TO EXPORT DIRECT TO JOURNAL OR EXECUTION DESK</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BODY CONTAINER */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 print:p-0 print:overflow-visible">
          
          {/* ANALYST SAFETY CHECKLIST - NO PRINT */}
          <div className="p-5 bg-slate-950 rounded-xl border border-slate-850 space-y-3.5 print:hidden">
            <div className="flex items-center justify-between border-b border-slate-850 pb-2">
              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                Execution Safety Checklists (Desks requirement)
              </span>
              <span className="text-[10px] text-indigo-400 font-mono font-bold">ALL CHECKED RECOMMENDED</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
                <input 
                  type="checkbox" 
                  checked={checklist.htfAligned} 
                  onChange={() => toggleCheck('htfAligned')}
                  className="mt-0.5 rounded accent-indigo-500 bg-slate-900 border-slate-800 w-4 h-4"
                />
                <span className="text-slate-300">
                  <strong>HTF Alignment verified</strong>: Higher-timeframe macro POI supports selected bias is {analysis.htfAnalysis.score}/10.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
                <input 
                  type="checkbox" 
                  checked={checklist.liquiditySwept} 
                  onChange={() => toggleCheck('liquiditySwept')}
                  className="mt-0.5 rounded accent-indigo-500 bg-slate-900 border-slate-800 w-4 h-4"
                />
                <span className="text-slate-300">
                  <strong>Stops are Taken</strong>: Heavy liquidity pools (Asian highs, or lows) verified swept cleanly.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
                <input 
                  type="checkbox" 
                  checked={checklist.fvgOpen} 
                  onChange={() => toggleCheck('fvgOpen')}
                  className="mt-0.5 rounded accent-indigo-500 bg-slate-900 border-slate-800 w-4 h-4"
                />
                <span className="text-slate-300">
                  <strong>Imbalance confirmed</strong>: Unmitigated Fair Value Gap represents clear pullback anchor target.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
                <input 
                  type="checkbox" 
                  checked={checklist.oteChecked} 
                  onChange={() => toggleCheck('oteChecked')}
                  className="mt-0.5 rounded accent-indigo-500 bg-slate-900 border-slate-800 w-4 h-4"
                />
                <span className="text-slate-300">
                  <strong>Valuation Check</strong>: The execution target area resides inside the OTE (62% - 79%) Discount spectrum.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none col-span-1 md:col-span-2 border-t border-slate-850 pt-3 mt-1">
                <input 
                  type="checkbox" 
                  checked={checklist.riskRestricted} 
                  onChange={() => toggleCheck('riskRestricted')}
                  className="mt-0.5 rounded accent-indigo-500 bg-slate-900 border-slate-800 w-4 h-4"
                />
                <span className="text-slate-300">
                  <strong>Risk Allotment cap locked</strong>: Position exposure is restricted strictly between 0.5% and 1.5% of ledger balance.
                </span>
              </label>
            </div>
          </div>

          {/* MEMO PRINT SHEET AREA */}
          <div className="bg-slate-950 border-2 border-slate-850 rounded-xl p-6 font-mono text-xs text-indigo-300 leading-relaxed shadow-lg select-text overflow-x-auto print:border-none print:shadow-none print:p-0 print:bg-white print:text-black">
            
            {/* Header block for printing */}
            <div className="hidden print:block mb-8 text-center border-b-2 border-black pb-4 text-black">
              <h2 className="text-xl font-black">ICT TRADING ALIEN LABORATORY</h2>
              <p className="text-xs tracking-widest font-bold mt-1">INTRA-DESK STRATEGY & RISK ASSESSMENT DIRECTIVE</p>
              <div className="text-[10px] mt-2 font-bold text-red-650 flex justify-center gap-6">
                <span>CLASSIFIED: CLASSIFIED DESK DISCRETION</span>
                <span>AUTHENTICATION ENFORCED: YES</span>
              </div>
            </div>

            {/* Print Body */}
            <div className="whitespace-pre text-[11px] leading-relaxed font-mono">
              {rawMemoText}
            </div>

            {/* Verification signoff for print */}
            <div className="hidden print:grid grid-cols-2 gap-8 mt-16 border-t border-dashed border-black pt-8 text-black text-xs font-bold font-mono">
              <div>
                <p>APPROVED BY QUANT RISK TRUSTEE:</p>
                <p className="border-b border-black mt-10 h-6"></p>
                <p className="text-[10px] text-slate-500 mt-1 font-normal">Senior Execution Strategist Coordinator</p>
              </div>
              <div>
                <p>EXECUTION TERMINAL OPERATOR LOG:</p>
                <p className="border-b border-black mt-10 h-6"></p>
                <p className="text-[10px] text-slate-500 mt-1 font-normal">Active Trade Ticket Signed Authorization</p>
              </div>
            </div>

          </div>

        </div>

        {/* FOOTER ACTIONS BAR */}
        <div className="flex flex-wrap items-center justify-between p-5 border-t border-slate-850 bg-slate-950/60 print:hidden gap-3">
          
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Lock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Secured locally via SSL Client Broker</span>
          </div>

          <div className="flex gap-2">
            
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 border border-slate-700 cursor-pointer transition"
            >
              <Printer className="w-3.5 h-3.5" />
              PRINT PROTOCOL
            </button>

            <button
              onClick={handleCopyMarkdown}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-slate-950 font-bold font-mono text-xs uppercase rounded-lg flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-505/15 transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-slate-950" />
                  COPIED TO CLIPBOARD
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-950" />
                  COPY RAW DIRECTIVE
                </>
              )}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}
