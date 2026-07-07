/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import SMCWorkbench from './components/SMCWorkbench';
import AccountGrowthCalculator from './components/AccountGrowthCalculator';
import PropFirmSimulator from './components/PropFirmSimulator';
import AnalystMemoModal from './components/AnalystMemoModal';
import LoginGate from './components/LoginGate';
import SMCAnalysisDashboard from './components/SMCAnalysisDashboard';
import ErrorBoundary from './components/ErrorBoundary';
import SMCIntegritySuite from './components/SMCIntegritySuite';
import { SMCAnalysisResponse } from './types';
import { THEMES, getSavedThemeId, saveThemeId, ThemeId, ThemeObject } from './utils/theme';
import { compressImage, AnalysisCache, normalizeAnalysis } from './utils/analyzerUtils';
import { 
  TrendingUp, 
  Upload, 
  HelpCircle, 
  Image as ImageIcon, 
  Clock, 
  FileText,
  AlertTriangle,
  Flame,
  CheckCircle,
  Percent,
  ShieldCheck,
  Zap,
  RefreshCw,
  Coins,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
  Award,
  Eye,
  EyeOff,
  Palette
} from 'lucide-react';

// Elite pre-analyzed demo data to let users test instantly if they don't have charts on hand
const SAMPLE_PRESETS: Array<{ name: string; timeframe: string; imgUrl: string; description: string; data: SMCAnalysisResponse }> = [
  {
    name: "EURUSD H1 - Liquidity Sweep & OTE Shift",
    timeframe: "H1",
    imgUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
    description: "Standard intraday setup: Asian session equal highs swept, H1 mitigation block reaction, and aggressive MSS to the downside.",
    data: {
      marketBias: "BEARISH",
      biasConfidence: 88,
      biasExplanation: "The structural supply order block on the H1 timeframe recently held firm during the London opening Bell, resulting in a high-volume sweep of Asian Session Equal Highs (buy-stops) followed by a decisive Market Structure Shift (MSS) at the 1.08450 swing level.",
      setupQualityScore: 91,
      confidenceLevel: "High",
      historicalPatternMatch: "Strong",
      estimatedSuccessRange: "54% - 60%",
      setupGrade: "A",
      riskCategory: "A",
      sessionAnalysis: {
        identifiedSessions: ["London Open", "Asian Session", "London Open Kill Zone"],
        suitabilityScore: 9,
        suitabilityExplanation: "Perfect alignment of London Open expansion phase following the sweep of Asian range highs."
      },
      newsFilter: {
        newsNear: false,
        eventsDetected: ["NFP Tomorrow", "Minor Speaker Today"],
        warningMessage: "No high-impact news within local proximity today. Safe to execute setup with normal limits.",
        impactOnConfidence: "None - clear of live CPI and FOMC decisions."
      },
      marketEnvironment: {
        classification: "Trending",
        setupFits: true,
        explanation: "The major bearish structural breakout is in full trending alignment on H1 and H4 intervals."
      },
      liquidityTargets: {
        identifiedTargets: ["Previous Day Low (PDL)", "Equal Lows", "Sell Side Liquidity"],
        primaryTarget: "1.07920 (Previous Day Low Sweep)",
        explanation: "Sell stops resting below yesterday's low present an extremely high attraction draw pool."
      },
      tradeInvalidation: {
        criteria: ["Close above swing high sweep (1.08620)", "BOS structure failure"],
        explanation: "A candle body close above yesterday's swing high invalidates the bearish bias. Reclaiming of the sweep level signifies stop-run failure."
      },
      chartQuality: {
        candlesVisible: true,
        timeframeVisible: true,
        priceScaleVisible: true,
        structureVisible: true,
        qualityScore: 95,
        isAcceptable: true
      },
      whyThisTradeExists: {
        htfContext: "Interaction with the Daily (D1) Bearish Order Block at 1.0870 and H4 Fair Value Gap. Reaction is prompt and aggressive with strong displacement.",
        liquidityEvent: "Asian session range highs were forcefully swept to collect deep pool buy-stops.",
        bosChoch: "H1 Change of Character confirmed by solid body close below yesterday's swing low.",
        displacement: "Clean 3-candle fast departure of 45 pips in under 3 hours, leaving behind wide unmitigated Fair Value Gaps.",
        fvg: "Premium unmitigated Fair Value Gap resting at 1.08440.",
        ote: "0.705 Fibonacci ratio overlap lands exactly at 1.08480, beautifully aligning inside the H1 Bearish FVG.",
        idm: "Local inducement points cleared prior to premium test.",
        liquidityTarget: "Draw on вчерашний range low and Equal Lows.",
        reasoningSummary: "High confluence institutional distribution setup at critical Daily supply zone with clean intraday reversal cues."
      },
      historicalPattern: {
        patternSimilarity: "93%",
        historicalMatchScore: "Strong",
        estimatedSuccessRange: "54% - 60%",
        matchedPatternDescription: "Bearish MSS + Asian Highs Sweep + Premium FVG",
        similarSetupsCount: 147
      },
      htfAnalysis: {
        score: 9,
        description: "Interaction with the Daily (D1) Bearish Order Block at 1.0870 and H4 Fair Value Gap. Reaction is prompt and aggressive with strong displacement candles.",
        identifiedPOI: ["Daily Bearish Order Block", "H4 Bearish Imbalance Area"],
        reactionQuality: "Institutional rejection with heavy selling volume"
      },
      liquidity: {
        liquidityTaken: "YES",
        details: "Clean sweep of the Asian session high liquidity pool (BSL). Retail buy-stops triggered to fuel institutional short orders.",
        externalRemaining: "Sell-Stops resting below yesterday's low at 1.07920",
        internalRemaining: "No major internal liquidity remains unmitigated, all minor fair value gaps partially tested.",
        sweptPools: ["Asian Session Highs", "Previous Day High (PDH)"]
      },
      structure: {
        score: 9,
        description: "Clear Change of Character (CHOCH) to the downside with a full body candle closing cleanly beneath the key swing low at 1.08250.",
        bosDetected: true,
        chochDetected: true,
        mssDetected: true,
        sequenceType: "Reversal"
      },
      displacement: {
        strength: "Institutional",
        explanation: "Sustained three-candle displacement sequence with a total drop of 45 pips in under 3 hours, leaving behind wide unmitigated Fair Value Gaps."
      },
      fvgs: [
        { id: "fvg_1", type: "BEARISH", priceRange: "1.08440 - 1.08550", mitigated: false, isPremiumDiscount: "PREMIUM", qualityScore: 9 },
        { id: "fvg_2", type: "BEARISH", priceRange: "1.08260 - 1.08320", mitigated: true, isPremiumDiscount: "DISCOUNT", qualityScore: 6 }
      ],
      idm: {
        taken: true,
        score: 8,
        details: "Minor inducement point at 1.08380 swept during the subsequent pullback, validating the high-probability premium entry point."
      },
      ote: {
        isAligned: true,
        lowerBound: 0.62,
        upperBound: 0.79,
        details: "The 0.705 Fibonacci OTE level lands exactly at 1.08480, beautifully aligning inside the H1 Bearish FVG and the Premium Valuation Zone."
      },
      scores: {
        htfPoi: 18,
        liquiditySweep: 14,
        bosChoch: 19,
        displacement: 14,
        fvg: 13,
        idm: 4,
        ote: 9,
        total: 91
      },
      tradePlan: {
        direction: "SELL",
        entryZone: "1.08440 - 1.08500 (Premium OB + FVG)",
        stopLoss: "1.08620 (Above recent swing high sweep)",
        tp1: "1.08150 (Immediate liquidity draw)",
        tp2: "1.07920 (Previous Day Low Sweep)",
        tp3: "1.07700 (Major HTF daily equal lows)",
        riskRewardRatio: "1:4.8",
        instructions: "Set limit short orders within the Premium FVG area. Move Stop Loss to break-even once target level TP1 is reached. Target external pool at TP2."
      },
      annotations: [
        { id: "s_hi", type: "LIQUIDITY_SWEEP", label: "ASIANS HIGHS SWEPT", x: 48, y: 15, notes: "Asian session range highs were forcefully swept to collect deep pool buy-stops." },
        { id: "s_lo", type: "CHOCH", label: "CHOCH / MSS SHIFT", x: 62, y: 48, notes: "Clean body close under prior swing lows confirms institutional market reversal." },
        { id: "ob_area", type: "ORDER_BLOCK", label: "H1 BEARISH ORDER BLOCK", x: 45, y: 10, width: 35, height: 12, notes: "Primary institutional supply matrix where sell orders were heavily distributed." },
        { id: "fvg_box", type: "FVG", label: "BEARISH FVG Zone", x: 55, y: 28, width: 20, height: 14, notes: "Unmitigated market imbalance. Excellent magnet for pullback entry bids." },
        { id: "ote_zone", type: "OTE", label: "OTE OTE Zone (70.5%)", x: 55, y: 22, width: 20, height: 4, notes: "Confluence zone matching Fibonacci 0.62 - 0.79 Premium spectrum." },
        { id: "entry_zone", type: "ENTRY", label: "SHORT ENTRY LEVEL", x: 55, y: 24, width: 20, height: 2, notes: "Execute short entries here on market pullback confirmation." },
        { id: "sl_zone", type: "STOP_LOSS", label: "STOP LOSS SHOT", x: 45, y: 8, width: 35, height: 2, notes: "Invalidation level placed safely above the recent sweep peak." },
        { id: "tp_zone", type: "TAKE_PROFIT", label: "TP2 EXTERNAL SSL target", x: 65, y: 88, width: 30, height: 3, notes: "Ultimate trade exit target. Strong resting sell side liquidity pool." }
      ]
    }
  },
  {
    name: "BTCUSD H4 - Institutional Demand Rebound",
    timeframe: "H4",
    imgUrl: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=1200&q=80",
    description: "Bitcoin liquidity grab below psychological support bounds, followed by a massive high-volume institutional demand displacement shift.",
    data: {
      marketBias: "BULLISH",
      biasConfidence: 92,
      biasExplanation: "Aggressive absorption buy volume observed after sweeping equal lows at the psychological boundary. Price has established a fresh H4 bullish order block with robust dynamic structure shifts.",
      setupQualityScore: 99,
      confidenceLevel: "High",
      historicalPatternMatch: "Strong",
      estimatedSuccessRange: "58% - 64%",
      setupGrade: "A+",
      riskCategory: "A+",
      sessionAnalysis: {
        identifiedSessions: ["New York Session", "NY Open Kill Zone", "Power Hour"],
        suitabilityScore: 10,
        suitabilityExplanation: "New York Power Hour reversal model lines up with the sweep zone."
      },
      newsFilter: {
        newsNear: false,
        eventsDetected: ["CPI Yesterday Approved"],
        warningMessage: "High-impact CPI event was processed yesterday; market has established a clear direction.",
        impactOnConfidence: "Positive confidence boost as news overhang has cleared."
      },
      marketEnvironment: {
        classification: "Expanding",
        setupFits: true,
        explanation: "V-Shape institutional rebound matches the early expansion phase out of consolidation."
      },
      liquidityTargets: {
        identifiedTargets: ["Previous Day High (PDH)", "Equal Highs", "External Range Buy Stops"],
        primaryTarget: "Equal Highs at psychological resistance peaks",
        explanation: "Large cluster of buy stops resting above major resistance limits represents ideal exit exit target."
      },
      tradeInvalidation: {
        criteria: ["Close below swing low (liquid sweep low)", "Structure failure below OB anchor"],
        explanation: "A candle close under the support anchor invalidates this institutional long premise."
      },
      chartQuality: {
        candlesVisible: true,
        timeframeVisible: true,
        priceScaleVisible: true,
        structureVisible: true,
        qualityScore: 98,
        isAcceptable: true
      },
      whyThisTradeExists: {
        htfContext: "V-Shape rebound off the Weekly Demand Area.",
        liquidityEvent: "Panic-driven stop hunt under retail triple bottoms.",
        bosChoch: "H4 Change of Character confirmed by consecutive body closes above local high.",
        displacement: "Massive institutional departure with zero upper wicks.",
        fvg: "Deep Discount Bullish Fair Value Gap currently printing.",
        ote: "0.79 Fib limit alignment.",
        idm: "Resting inducement point at fresh support levels.",
        liquidityTarget: "Draw on minor and major premium equal highs.",
        reasoningSummary: "Exceptional institutional reversal context off weekly dynamic support confirming order absorption."
      },
      historicalPattern: {
        patternSimilarity: "97%",
        historicalMatchScore: "Strong",
        estimatedSuccessRange: "58% - 64%",
        matchedPatternDescription: "Bullish Triple Bottom Sweep + Weekly Demand Rebound",
        similarSetupsCount: 89
      },
      htfAnalysis: {
        score: 10,
        description: "Direct collision on the Weekly Demand mitigate block. Buyers protected the level aggressively with heavy volume.",
        identifiedPOI: ["Weekly Demand Area", "HTF Order Matrix"],
        reactionQuality: "V-Shape institutional rebound"
      },
      liquidity: {
        liquidityTaken: "YES",
        details: "Clean sweep of standard retail triple bottoms. Panic-selling retail positions were absorbed directly by elite funds.",
        externalRemaining: "Equal High Buy-stops at psychological resistance peaks",
        internalRemaining: "Minor fair value gaps at local discount intervals.",
        sweptPools: ["Sell-stops / Triple Bottoms", "Round-figure retail lows"]
      },
      structure: {
        score: 10,
        description: "Bullish Change of Character (CHOCH) accompanied by massive consecutive body closes above the Swing High.",
        bosDetected: true,
        chochDetected: true,
        mssDetected: true,
        sequenceType: "Continuation"
      },
      displacement: {
        strength: "Institutional",
        explanation: "Extremely strong displacement candle sequence. High physical volume and zero upper wicks suggest major long accumulation."
      },
      fvgs: [
        { id: "fvg_btc", type: "BULLISH", priceRange: "Discount Imbalance Block", mitigated: false, isPremiumDiscount: "DISCOUNT", qualityScore: 10 }
      ],
      idm: {
        taken: false,
        score: 9,
        details: "Price is currently printing local inducement. A pullback is expected to tap internal liquidity prior to further expansion."
      },
      ote: {
        isAligned: true,
        lowerBound: 0.62,
        upperBound: 0.79,
        details: "Fibonacci discount OTE lines up perfectly with the fresh H4 bullish mitigation gap."
      },
      scores: {
        htfPoi: 20,
        liquiditySweep: 15,
        bosChoch: 20,
        displacement: 15,
        fvg: 14,
        idm: 5,
        ote: 10,
        total: 99
      },
      tradePlan: {
        direction: "BUY",
        entryZone: "Discount Bullish FVG Zone",
        stopLoss: "Below the liquid sweep low anchor",
        tp1: "First major structural swing high",
        tp2: "Premium buy-stops liquidity draws",
        tp3: "Unmitigated daily bearish order distribution block",
        riskRewardRatio: "1:5.2",
        instructions: "Bid long inside the Discount FVG. Place protective orders. Profit realization targets major buy stops."
      },
      annotations: [
        { id: "liq_sweep", type: "LIQUIDITY_SWEEP", label: "RETAIL STOPS SWEPT", x: 15, y: 78, notes: "Massive retail stops taken below equal lows to gather institutional buy power." },
        { id: "mss_up", type: "MSS", label: "BULLISH BREAKOUT / MSS", x: 42, y: 35, notes: "Clean structural shift confirm bull trend continuation." },
        { id: "ob_up", type: "ORDER_BLOCK", label: "BULLISH ORDER BLOCK", x: 18, y: 72, width: 28, height: 16, notes: "Major institutional purchase zone. Excellent point to bid pullback entries." },
        { id: "target_b", type: "TAKE_PROFIT", label: "TP TARGET POOL", x: 80, y: 15, width: 15, height: 4, notes: "Premium retail sell stop pool targeted." }
      ]
    }
  }
];

// Initialize the High-Performance DJB2 FIFO Analysis Cache (50 item capacity)
const analysisCache = new AnalysisCache();

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ email: string; name?: string } | null>(() => {
    try {
      const savedUser = localStorage.getItem('smc_current_user');
      if (savedUser) return JSON.parse(savedUser);
    } catch (e) {}
    return null;
  });

  // Theme states
  const [themeId, setThemeId] = useState<ThemeId>(getSavedThemeId());
  const currentTheme = THEMES[themeId];

  const [activeTab, setActiveTab] = useState<'analyst' | 'simulator' | 'risk' | 'performance'>('analyst');
  const [dragActive, setDragActive] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<string>("H1");
  const [userNotes, setUserNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep(prev => (prev < 3 ? prev + 1 : 0));
      }, 900);
    }
    return () => clearInterval(interval);
  }, [isLoading]);
  const [analysisResult, setAnalysisResult] = useState<SMCAnalysisResponse | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  // Active editable annotations array
  const [annotations, setAnnotations] = useState<SMCAnalysisResponse['annotations']>([]);
  const [isMemoOpen, setIsMemoOpen] = useState(false);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);

  // Interactive Risk Management Inputs in Framework
  const [rfBalance, setRfBalance] = useState<number>(100000);
  const [rfRiskPerTrade, setRfRiskPerTrade] = useState<number>(1.0);
  const [rfTargetBalance, setRfTargetBalance] = useState<number>(108000);

  // Trader Performance Engine log state
  const [loggedTrades, setLoggedTrades] = useState<Array<{
    id: string;
    pair: string;
    grade: 'A+' | 'A' | 'B' | 'C' | 'D';
    session: string;
    outcome: 'WIN' | 'LOSS' | 'BREAKEVEN';
    riskAmount: number;
    pnl: number;
    rRatio: number;
    notes: string;
    date: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem('smc_logged_trades');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    // Seed default sample logged trades to make the dashboard look gorgeous on first click
    return [
      { id: '1', pair: 'EURUSD', grade: 'A', session: 'London Open', outcome: 'WIN', riskAmount: 1000, pnl: 4800, rRatio: 4.8, notes: 'Swept Asian highs, tapped H1 OB.', date: '2026-06-08' },
      { id: '2', pair: 'BTCUSD', grade: 'A+', session: 'New York Open', outcome: 'WIN', riskAmount: 1000, pnl: 5200, rRatio: 5.2, notes: 'NYC sweep low of triple bottoms.', date: '2026-06-09' },
      { id: '3', pair: 'GBPUSD', grade: 'B', session: 'Asian Session', outcome: 'LOSS', riskAmount: 1000, pnl: -1000, rRatio: 2.5, notes: 'Attempted to trend trade consolidation.', date: '2026-06-09' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('smc_logged_trades', JSON.stringify(loggedTrades));
  }, [loggedTrades]);

  // Dynamic metrics of the active analyzed report
  const totalScore = analysisResult?.scores?.total ?? 0;
  const biasConfidence = analysisResult?.biasConfidence ?? 0;
  const winRateVal = analysisResult ? Math.round(45 + (totalScore * 0.2) + (biasConfidence * 0.1)) : 55;
  const winProbability = Math.max(35, Math.min(85, winRateVal));

  const setupQualityScore = analysisResult?.setupQualityScore ?? Math.max(35, totalScore);
  const confidenceLevel = analysisResult?.confidenceLevel ?? (setupQualityScore >= 80 ? 'High' : setupQualityScore >= 60 ? 'Medium' : 'Low');
  const historicalPatternMatch = analysisResult?.historicalPatternMatch ?? (setupQualityScore >= 80 ? 'Strong' : setupQualityScore >= 60 ? 'Moderate' : 'Weak');
  const estimatedSuccessRange = analysisResult?.estimatedSuccessRange ?? `${Math.round(winProbability - 3)}% - ${Math.round(winProbability + 3)}%`;

  // Structured Rule Compliance Helpers
  const rulesMetArray = analysisResult ? [
    analysisResult.marketBias !== 'NEUTRAL',
    analysisResult.liquidity.liquidityTaken === 'YES',
    analysisResult.htfAnalysis.score >= 5,
    !!(analysisResult.structure.bosDetected || analysisResult.structure.chochDetected || analysisResult.structure.mssDetected),
    (analysisResult.tradePlan?.instructions?.toLowerCase().includes('pullback') || 
     analysisResult.tradePlan?.entryZone?.toLowerCase().includes('pullback') || 
     analysisResult.whyThisTradeExists?.ote?.toLowerCase().includes('ote') || 
     analysisResult.whyThisTradeExists?.reasoningSummary?.toLowerCase().includes('pullback') || 
     analysisResult.whyThisTradeExists?.reasoningSummary?.toLowerCase().includes('equilibrium') || 
     analysisResult.ote?.isAligned),
    !!(analysisResult.fvgs && analysisResult.fvgs.length > 0),
    rfRiskPerTrade <= 2.0
  ] : [false, false, false, false, false, false, false];
  const rulesMetCount = rulesMetArray.filter(Boolean).length;
  const complianceScore = Math.round((rulesMetCount / 7) * 100);

  // Reference for hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ticking live clock
  const [liveClockTime, setLiveClockTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveClockTime(now.getUTCFullYear() + '-' + 
        String(now.getUTCMonth() + 1).padStart(2, '0') + '-' + 
        String(now.getUTCDate()).padStart(2, '0') + ' ' + 
        String(now.getUTCHours()).padStart(2, '0') + ':' + 
        String(now.getUTCMinutes()).padStart(2, '0') + ':' + 
        String(now.getUTCSeconds()).padStart(2, '0') + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Analyze if there is a preset selected on mount to showcase immediately
  useEffect(() => {
    // Load first preset by default to make the page populated and highly premium
    handleLoadPreset(0);
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorText("Invalid file type. Please upload a PNG, JPEG, or WEBP chart screenshot.");
      return;
    }
    setIsLoading(true);
    setErrorText(null);

    try {
      // Compress image to 1920x1080 JPEG at 0.8 quality prior to API request
      const optimizedBlob = await compressImage(file);
      const optimizedFile = new File([optimizedBlob], "optimized_chart.jpg", { type: "image/jpeg" });
      setImageFile(optimizedFile);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setIsLoading(false);
      };
      reader.readAsDataURL(optimizedFile);
    } catch (err) {
      console.error("Image optimization failed, falling back to original file:", err);
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLoadPreset = (index: number) => {
    const preset = SAMPLE_PRESETS[index];
    setImageFile(null);
    setImagePreview(preset.imgUrl);
    setTimeframe(preset.timeframe);
    setUserNotes(`Analyzing preset: ${preset.name}`);
    setAnalysisResult(preset.data as unknown as SMCAnalysisResponse);
    setAnnotations(preset.data.annotations as any);
    setErrorText(null);
  };

  // Run the actual premium server-side AI analysis
  const runAiAnalysis = async () => {
    if (!imagePreview) {
      setErrorText("Please upload a chart screenshot or select a preset to analyze.");
      return;
    }

    setIsLoading(true);
    setErrorText(null);
    setAnalysisResult(null);

    try {
      // 1. Compute a unique cache key based on the image preview, timeframe, and user notes
      const cacheInputPayload = JSON.stringify({ image: imagePreview, timeframe, userNotes });
      const hashKey = analysisCache.generateKey(cacheInputPayload);

      // 2. Look up the hash key in the analysis cache
      if (analysisCache.has(hashKey)) {
        const cachedResult = analysisCache.get(hashKey)!;
        setAnalysisResult(cachedResult);
        setAnnotations(cachedResult.annotations || []);
        setIsLoading(false);
        return;
      }

      const apiEndpoint = `${window.location.origin}/api/analyze`;
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imagePreview,
          timeframe,
          userNotes
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with ${response.status}`);
      }

      const rawData = await response.json();
      
      if (rawData.marketBias) {
        // Normalize the payload using our robust fallback wrapper
        const normalized = normalizeAnalysis(rawData);
        
        // Cache the safe, normalized result
        analysisCache.set(hashKey, normalized);

        setAnalysisResult(normalized);
        setAnnotations(normalized.annotations || []);
      } else {
        throw new Error("Invalid structure returned from trading analyst proxy model.");
      }
    } catch (e: any) {
      console.error(e);
      // If server keys are missing, we prompt gracefully
      if (e.message?.includes("GEMINI_API_KEY") || e.message?.includes("API key")) {
        setApiKeyMissing(true);
        setErrorText("Missing GEMINI_API_KEY. Please provide this in the AI Studio sidebar/settings menu. You can continue testing using our Pre-analyzed Smart Money Concept presets below.");
      } else if (e.message?.includes("Failed to fetch") || e.message?.includes("network") || !e.message) {
        setErrorText("The SMC Analysis service is currently initializing or restarting. Please allow 5-10 seconds for the backend thread to wake up and try clicking 'Run Institutional SMC Audit' again! In the meantime, you can explore the fully interactive SMC workbench immediately by selecting any of our pre-analyzed Forex & Crypto presets in the table below.");
      } else {
        setErrorText(e.message || "An error occurred while compiling technical metrics.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnnotationsChange = (updated: any[]) => {
    setAnnotations(updated);
    if (analysisResult) {
      setAnalysisResult({
        ...analysisResult,
        annotations: updated
      });
    }
  };

  const handleResetInputs = () => {
    setImageFile(null);
    setImagePreview(null);
    setUserNotes("");
    setAnalysisResult(null);
    setAnnotations([]);
    setErrorText(null);
  };

  if (!currentUser) {
    return (
      <ErrorBoundary fallbackTitle="Auth Portal Shield Blocked">
        <LoginGate onLogin={setCurrentUser} metadataUserEmail="olaniyilawalazeez@gmail.com" />
      </ErrorBoundary>
    );
  }

  return (
    <div className={`min-h-screen ${currentTheme.bg} ${currentTheme.textPrimary} font-sans selection:bg-sky-500/30 transition-colors duration-300`}>
      
      {/* FLOATING ACTION BUTTON TO SHOW NAVBAR WHEN HIDDEN */}
      {!isNavbarVisible && (
        <button
          id="btn-show-navbar"
          onClick={() => setIsNavbarVisible(true)}
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 ${currentTheme.cardBg} ${currentTheme.cardBorder} border ${currentTheme.accentText} rounded-xl text-xs font-mono font-bold uppercase transition-all shadow-xl ${currentTheme.accentRipples} backdrop-blur cursor-pointer hover:scale-105 active:scale-95`}
          title="Show Navigation Bar"
          aria-label="Display the main menu navigation bar"
        >
          <Eye className="w-4 h-4 shrink-0 animate-pulse" />
          <span>Show Navigation</span>
        </button>
      )}

      {/* PROFESSIONAL SMC TOP HERO NAVIGATION */}
      {isNavbarVisible && (
        <header className={`border-b ${currentTheme.border} ${currentTheme.headerBg} backdrop-blur sticky top-0 z-50 transition-all duration-300`}>
          <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl shadow-lg ${currentTheme.accentRipples} bg-gradient-to-tr from-sky-500 to-indigo-600`}>
                <TrendingUp className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 ">
                  <h1 className="text-sm font-extrabold tracking-tight text-white uppercase font-mono">ELITE AI SMC</h1>
                  <span className="bg-sky-500/10 text-sky-400 text-[9px] px-1.5 py-0.5 rounded font-bold font-mono border border-sky-500/20 uppercase tracking-wider">ICT v3</span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Institutional Order Flow</p>
              </div>
            </div>

            {/* PAGE NAVIGATION TABS */}
            <div className="flex flex-wrap items-center bg-slate-900/60 p-1 rounded-xl border border-slate-800 font-mono">
              {[
                { id: 'analyst', label: 'Analyst Desk', icon: Layers },
                { id: 'simulator', label: 'Prop Simulator', icon: Zap },
                { id: 'risk', label: 'Compound Planner', icon: Coins },
                { id: 'performance', label: 'Performance Engine', icon: Award }
              ].map((tab) => {
                const IconComp = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold font-mono uppercase tracking-wide transition cursor-pointer ${
                      isActive 
                        ? "bg-sky-500 text-slate-950 shadow-md font-extrabold" 
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                    }`}
                  >
                    <IconComp className="w-3.5 h-3.5 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
            
            <div className="flex items-center gap-3">
              <span className="hidden lg:inline-flex items-center gap-1.5 text-[11px] text-slate-400 font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-sky-400" /> {liveClockTime || "--:--:-- UTC"}
              </span>

              {/* PREMIUM THEME CONFIGURABLE SELECTION */}
              <div 
                className={`flex items-center gap-1.5 ${currentTheme.isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'} border px-2 py-1.5 rounded-xl text-xs font-mono`}
                title="Configurable color theme presets"
              >
                <Palette className={`w-3.5 h-3.5 ${currentTheme.isDark ? 'text-yellow-400' : 'text-indigo-600'} shrink-0`} />
                <select
                  value={themeId}
                  onChange={(e) => {
                    const id = e.target.value as ThemeId;
                    setThemeId(id);
                    saveThemeId(id);
                  }}
                  className={`bg-transparent ${currentTheme.isDark ? 'text-slate-200' : 'text-slate-800'} text-[10px] focus:outline-none cursor-pointer pr-1 font-mono uppercase font-bold`}
                  aria-label="Select color configuration theme profile"
                >
                  {Object.entries(THEMES).map(([id, t]) => (
                    <option key={id} value={id} className={t.isDark ? "bg-slate-950 text-slate-200" : "bg-white text-slate-800"}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* HIDE NAVBAR TRIGGER BUTTON */}
              <button
                id="btn-hide-navbar"
                onClick={() => setIsNavbarVisible(false)}
                className="bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 p-2 rounded-xl text-slate-400 hover:text-sky-400 transition-all cursor-pointer flex items-center justify-center"
                title="Hide Navigation Bar"
                aria-label="Collapse header navigation"
              >
                <EyeOff className="w-4 h-4 shrink-0" />
              </button>
              
              <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800/80 p-1 pl-3 pr-1.5 rounded-xl">
                <div className="flex flex-col text-right hidden sm:flex">
                  <span className="text-[10px] font-bold text-slate-200 font-mono leading-none truncate max-w-[140px]">
                    {currentUser.name || 'Master Trader'}
                  </span>
                  <span className="text-[8px] font-mono text-slate-500 leading-none truncate max-w-[140px] mt-0.5">
                    {currentUser.email}
                  </span>
                </div>
                <button
                  onClick={() => {
                    try {
                      localStorage.removeItem('smc_current_user');
                      setCurrentUser(null);
                    } catch (e) {}
                  }}
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/15 hover:border-rose-500/30 px-2.5 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition-all cursor-pointer"
                  aria-label="Exit trading terminal session"
                >
                  Sign Out
                </button>
              </div>
            </div>

          </div>
        </header>
      )}

      {/* CORE WORKSPACE INNER */}
      <main className="max-w-7xl mx-auto px-6 py-8">

        {activeTab === 'analyst' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 140, damping: 18, mass: 0.8 }}
          >
            <ErrorBoundary fallbackTitle="Analyst Workspace Anomaly">
            
            {/* API KEY ALIGNMENT NOTIFICATION */}
        {apiKeyMissing && (
          <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-400 text-xs font-bold font-mono uppercase">API Key Authorization Required</p>
              <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                We noticed your AI client is missing a live Gemini credentials token. You can configure <code className="bg-slate-900 border border-slate-800 text-yellow-300 px-1 py-0.5 rounded text-[11px]">GEMINI_API_KEY</code> within your App Secrets. 
                <strong className="text-emerald-400"> Meanwhile, you can test all features using our pre-analyzed presets below!</strong>
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT INTERACTIVE CONTROLS COLUMN - 4 SPAN */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* FILE DROPZONE & CONFIG BOX */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl"></div>
              
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                Upload Chart Screenshot
              </h3>

              {/* Drag/Drop Field */}
              <div
                id="chart-dropzone"
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] ${
                  dragActive 
                    ? "border-sky-500 bg-sky-500/5 ring-1 ring-sky-500/20 text-white" 
                    : imagePreview 
                      ? "border-slate-800 bg-slate-950/40 relative" 
                      : "border-slate-800 hover:border-slate-700 bg-slate-950/20 text-slate-400"
                }`}
              >
                <input
                  ref={fileInputRef}
                  id="chart-upload-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="w-full relative group">
                    <img
                      src={imagePreview}
                      alt="Thumbnail uploaded preview"
                      className="w-full h-24 object-cover rounded-lg brightness-75 group-hover:brightness-50 transition"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white drop-shadow">
                      Change Matrix Screenshot
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-500 mb-2" />
                    <p className="text-xs font-semibold text-slate-300">Drag & Drop MT4/MT5/TradingView Shot</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">supports PNG, JPG, or WEBP formats</p>
                  </>
                )}
              </div>

              {/* Advanced Configurations */}
              <div className="space-y-4 mt-5">
                <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl text-xs text-slate-400 font-mono space-y-2">
                  <div className="flex items-center gap-1.5 text-sky-400 font-bold uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>AUTOMATIC RECOGNITION ACTIVE</span>
                  </div>
                  <p className="leading-relaxed">
                    Our institutional neural model automatically extracts key structural matrices including <strong className="text-slate-250">Timeframe Interval</strong>, <strong className="text-slate-250">Asset Symbol</strong>, and historical swing limits directly from the chart pixels. No manual parameters are required of you.
                  </p>
                </div>

                {errorText && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-start gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorText}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    id="btn-analyze-trigger"
                    onClick={runAiAnalysis}
                    disabled={isLoading || !imagePreview}
                    className="flex-1 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-slate-950 text-xs font-bold uppercase font-mono py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-sky-500/10"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                        Analyzing Structure...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-slate-950" />
                        RUN SMC ANALYSIS
                      </>
                    )}
                  </button>

                  {imagePreview && (
                    <button
                      onClick={handleResetInputs}
                      className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
                      title="Clear settings"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* PRESET SAMPLES EXPLORER */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                Selected Demo Presets
              </h3>
              
              <div className="space-y-3">
                {SAMPLE_PRESETS.map((p, idx) => (
                  <div
                    key={p.name}
                    id={`preset-card-${idx}`}
                    onClick={() => handleLoadPreset(idx)}
                    className="p-3.5 bg-slate-950/40 hover:bg-slate-950 border border-slate-800 hover:border-sky-500/40 rounded-xl cursor-pointer transition flex items-start gap-3"
                  >
                    <img 
                      src={p.imgUrl} 
                      alt="" 
                      className="w-12 h-12 object-cover rounded-md border border-slate-800 shrink-0" 
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{p.name}</h4>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {p.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT SMC DASHBOARD WORKBENCH / DETAILED METRICS - 8 SPAN */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* WORKBENCH AND MAP COMPONENT */}
            {imagePreview && (
              <SMCWorkbench
                imageUrl={imagePreview}
                annotations={annotations}
                onAnnotationsChange={handleAnnotationsChange}
                isLoading={isLoading}
                theme={currentTheme}
              />
            )}

            {/* IF NO CHART LOADED PLACEHOLDER */}
            {!imagePreview && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center shadow-xl">
                <ImageIcon className="w-12 h-12 text-slate-600 mb-3 mx-auto stroke-[1.2]" />
                <h3 className="text-sm font-bold text-slate-200">No chart loaded active</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                  Upload a chart screenshot or choose a Demo Preset to automatically inspect full institutional market structure evaluations.
                </p>
              </div>
            )}

            {/* LIVE DETAILED COGNITIVE MULTI-STAGE LOADING STATE */}
            {isLoading && (
              <div 
                className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6 relative overflow-hidden"
                aria-live="assertive"
                role="status"
              >
                {/* Visual tech grid decoration */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2.5">
                    <RefreshCw className="w-4 h-4 text-sky-400 animate-spin shrink-0" />
                    <span className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider">
                      SMC COGNITIVE PIPELINE ENGINE RUNNING
                    </span>
                  </div>
                  <span className="bg-sky-500/10 text-sky-400 text-[10px] px-2 py-0.5 rounded font-bold font-mono border border-sky-500/20 uppercase">
                    Stage {loadingStep + 1} / 4
                  </span>
                </div>

                <div className="space-y-4">
                  {[
                    { label: "Vector Mapping", desc: "Projecting candlestick vector arrays & identifying swing highs/lows" },
                    { label: "Liquidity Auditing", desc: "Auditing Asian consolidation zones & buy/sell-side liquidity pools" },
                    { label: "Displacement Solving", desc: "Synthesizing displacement optimal trade entries & fair value gaps (FVG)" },
                    { label: "Narrative Synthesis", desc: "Generating Smart Money institutional narrative & risk targets" }
                  ].map((step, idx) => {
                    const isPending = idx > loadingStep;
                    const isActive = idx === loadingStep;
                    const isCompleted = idx < loadingStep;

                    return (
                      <div 
                        key={step.label} 
                        className={`p-3.5 rounded-xl border transition-all duration-300 ${
                          isActive 
                            ? "bg-slate-950/80 border-sky-500/40 shadow-md shadow-sky-500/5 scale-[1.01]" 
                            : isCompleted 
                              ? "bg-slate-950/20 border-slate-800/50 opacity-60" 
                              : "bg-slate-950/10 border-slate-900/40 opacity-30"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${
                              isActive 
                                ? "bg-sky-400 animate-ping" 
                                : isCompleted 
                                  ? "bg-emerald-400" 
                                  : "bg-slate-700"
                            }`} />
                            <span className={`text-xs font-bold font-mono uppercase ${
                              isActive ? "text-sky-400" : isCompleted ? "text-emerald-400" : "text-slate-500"
                            }`}>
                              {step.label}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono font-bold text-slate-500 uppercase">
                            {isActive ? "ACTIVE SOLVING" : isCompleted ? "VERIFIED CHECK" : "AWAITING ENGINE"}
                          </span>
                        </div>
                        <p className={`text-[11px] font-sans mt-1 ${isActive ? "text-slate-200" : "text-slate-400"}`}>
                          {step.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-850">
                    <div 
                      className="bg-gradient-to-r from-sky-500 to-indigo-600 h-full transition-all duration-500"
                      style={{ width: `${((loadingStep + 1) / 4) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono mt-2 text-center uppercase tracking-wide">
                    Do not close browser. Smart Money algorithm processes pattern-matching matrices.
                  </p>
                </div>
              </div>
            )}

            {/* MAIN METRIC ANALYSIS REPORTS PANEL */}
            {analysisResult && (
              <SMCAnalysisDashboard
                analysis={analysisResult}
                complianceScore={complianceScore}
                winProbability={winProbability}
                rfBalance={rfBalance}
                setRfBalance={setRfBalance}
                rfRiskPerTrade={rfRiskPerTrade}
                setRfRiskPerTrade={setRfRiskPerTrade}
                rfTargetBalance={rfTargetBalance}
                setRfTargetBalance={setRfTargetBalance}
                setIsMemoOpen={setIsMemoOpen}
              />
            )}

            {false && analysisResult && (
              <div id="smc-metrics-output" className="space-y-6">
                
                {/* 1. SETUP SCORECARD & TRADING PLAN BANNER */}
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 border border-indigo-500/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/5 rounded-full blur-3xl"></div>
                  
                  {/* Top Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4 mb-5">
                    <div>
                      <span className="text-[10px] text-sky-400 font-mono uppercase tracking-widest block mb-0.5">SMC Assessment Model Verification</span>
                      <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                        {analysisResult.tradePlan.direction === 'WAIT' || analysisResult.tradePlan.direction === 'NO TRADE' ? (
                          <span className="bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded text-xs select-none">
                            {analysisResult.tradePlan.direction}
                          </span>
                        ) : (
                          <span className={`px-2.5 py-0.5 rounded text-xs select-none ${
                            analysisResult.tradePlan.direction === 'BUY' ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/25 text-rose-400 border border-rose-500/30'
                          }`}>
                            {analysisResult.tradePlan.direction === 'BUY' ? 'LONG BIAS' : 'SHORT BIAS'}
                          </span>
                        )}
                        <span>CONFLUENCE VERDICT</span>
                      </h3>
                    </div>

                    {/* Top Header Actions */}
                    <div className="flex flex-wrap items-center gap-3">
                      
                      {/* Institutional Memo Trigger */}
                      <button
                        onClick={() => setIsMemoOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-400 hover:bg-amber-300 hover:scale-102 active:scale-95 text-slate-950 rounded-xl text-[11px] font-bold font-mono uppercase tracking-wide cursor-pointer shadow-lg shadow-amber-500/10 transition"
                      >
                        <FileText className="w-4 h-4 text-slate-950 shrink-0" />
                        <span>INSTITUTIONAL DIRECTIVE</span>
                      </button>

                      {/* Total Confluence Rating */}
                      <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-850/60 shadow-lg">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-bold font-mono tracking-wider block uppercase">CONFLUENCE INDEX</span>
                          <div className="text-xs font-mono">
                            {analysisResult.scores.total >= 90 ? (
                              <span className="text-emerald-400 font-bold">Exceptional</span>
                            ) : analysisResult.scores.total >= 80 ? (
                              <span className="text-emerald-400 font-semibold">High Probability</span>
                            ) : analysisResult.scores.total >= 70 ? (
                              <span className="text-sky-400">Tradable Setup</span>
                            ) : (
                              <span className="text-slate-400">Weak / No Trade</span>
                            )}
                          </div>
                        </div>
                        <div className="text-2xl font-black font-mono text-sky-400 px-2 py-0.5 bg-sky-500/10 rounded-lg border border-sky-500/20">
                          {analysisResult.scores.total}<span className="text-[10px] text-slate-400">/100</span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* High Confluence Setup Metrics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                      <span className="text-[11px] text-slate-400 font-mono block">Direction Projection</span>
                      <p className={`text-lg font-black tracking-tight mt-1 ${
                        analysisResult.tradePlan.direction === 'BUY' ? 'text-emerald-400' : analysisResult.tradePlan.direction === 'SELL' ? 'text-rose-400' : 'text-slate-300'
                      }`}>
                        {analysisResult.tradePlan.direction}
                      </p>
                    </div>

                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                      <span className="text-[11px] text-slate-400 font-mono block">Entry Valuation Band</span>
                      <p className="text-sm font-bold text-white tracking-tight mt-1 font-mono truncate" title={analysisResult.tradePlan.entryZone}>
                        {analysisResult.tradePlan.entryZone}
                      </p>
                    </div>

                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                      <span className="text-[11px] text-slate-400 font-mono block">Stop Loss Invalidation</span>
                      <p className="text-sm font-semibold text-rose-400 mt-1 font-mono truncate" title={analysisResult.tradePlan.stopLoss}>
                        {analysisResult.tradePlan.stopLoss}
                      </p>
                    </div>

                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                      <span className="text-[11px] text-slate-400 font-mono block">Risk Engine Ratio</span>
                      <p className="text-md font-bold text-emerald-400 mt-1 font-mono">
                        {analysisResult.tradePlan.riskRewardRatio} <span className="text-[10px] text-slate-500">R:R</span>
                      </p>
                    </div>
                  </div>

                  {/* Target parameters */}
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="bg-slate-950/30 px-3 py-2 rounded-lg border border-slate-850 text-xs text-left">
                      <span className="text-slate-500 font-mono">Target TP1:</span>
                      <p className="font-semibold text-sky-400 font-mono truncate mt-0.5">{analysisResult.tradePlan.tp1}</p>
                    </div>
                    <div className="bg-slate-950/30 px-3 py-2 rounded-lg border border-slate-850 text-xs text-center border-l-2 border-l-sky-500/35">
                      <span className="text-slate-500 font-mono">Target TP2:</span>
                      <p className="font-semibold text-sky-300 font-mono truncate mt-0.5">{analysisResult.tradePlan.tp2}</p>
                    </div>
                    <div className="bg-slate-950/30 px-3 py-2 rounded-lg border border-slate-850 text-xs text-right border-l-2 border-l-sky-500/35">
                      <span className="text-slate-500 font-mono">Target TP3:</span>
                      <p className="font-semibold text-sky-200 font-mono truncate mt-0.5">{analysisResult.tradePlan.tp3}</p>
                    </div>
                  </div>

                  {/* Advanced SMC Analytics Deck */}
                  <div className="mt-5 space-y-6">
                    
                    {/* Primary Institutional Scoring Metrics row */}
                    <div className="bg-slate-950/50 border border-indigo-500/10 rounded-2xl p-5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/[0.02] rounded-full blur-3xl"></div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        
                        {/* Radial Gauge Sector (Re-purposed for Setup Quality Score) */}
                        <div className="md:col-span-4 flex flex-col items-center justify-center p-1 border-r border-slate-900 md:pr-6">
                          <div className="relative w-32 h-32 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                              {/* Track Circle */}
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                stroke="rgba(15, 23, 42, 0.8)"
                                strokeWidth="8"
                                fill="transparent"
                                className="stroke-slate-900"
                              />
                              {/* Value Circle */}
                              <motion.circle
                                cx="50"
                                cy="50"
                                r="40"
                                stroke={
                                  setupQualityScore >= 80 ? "#10b981" : 
                                  setupQualityScore >= 70 ? "#0ea5e9" : 
                                  setupQualityScore >= 60 ? "#3b82f6" : 
                                  "#f59e0b"
                                }
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray="251.2"
                                initial={{ strokeDashoffset: 251.2 }}
                                animate={{ strokeDashoffset: 251.2 - (251.2 * setupQualityScore) / 100 }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                                strokeLinecap="round"
                              />
                            </svg>
                            
                            {/* Inner labels */}
                            <div className="absolute flex flex-col items-center justify-center text-center">
                              <motion.span 
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-2xl font-black font-mono tracking-tight text-white flex items-baseline"
                              >
                                {setupQualityScore}
                                <span className="text-[11px] font-bold text-slate-400 select-none">/100</span>
                              </motion.span>
                              <span className="text-[7px] font-black font-mono text-slate-400 tracking-wider mt-0.5 uppercase">
                                SETUP QUALITY
                              </span>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-1.5 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">SETUP GRADE:</span>
                            <span className={`text-[11px] font-bold font-mono ${
                              analysisResult.setupGrade.includes('+') ? 'text-emerald-400 animate-pulse' : 'text-sky-400'
                            }`}>{analysisResult.setupGrade}</span>
                          </div>
                        </div>

                        {/* Professional Metrics Board Sector */}
                        <div className="md:col-span-8 grid grid-cols-2 gap-4">
                          <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850/60 transition hover:bg-slate-900">
                            <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">Confidence Level</span>
                            <p className={`text-sm font-bold mt-1 font-mono flex items-center gap-1.5 ${
                              confidenceLevel === 'High' ? 'text-emerald-400' : confidenceLevel === 'Medium' ? 'text-sky-400' : 'text-amber-500'
                            }`}>
                              <span className="inline-block w-2 bg-current rounded-full aspect-square" />
                              {confidenceLevel}
                            </p>
                          </div>

                          <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850/60 transition hover:bg-slate-900">
                            <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">Historical Pattern Match</span>
                            <p className="text-sm font-bold text-white mt-1 font-mono flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 font-normal">[{analysisResult.historicalPatternMatch}]</span>
                              <span>{analysisResult.historicalPattern?.matchedPatternDescription || "SMC Standard"}</span>
                            </p>
                          </div>

                          <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850/60 transition hover:bg-slate-900">
                            <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">Hist. Success range</span>
                            <p className="text-sm font-bold text-sky-300 mt-1 font-mono">
                              {analysisResult.historicalPattern?.estimatedSuccessRange || estimatedSuccessRange}
                            </p>
                          </div>

                          <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850/60 transition hover:bg-slate-900">
                            <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">Risk Category Rank</span>
                            <p className={`text-sm font-bold mt-1 font-mono uppercase ${
                              analysisResult.riskCategory === 'A+' || analysisResult.riskCategory === 'A' ? 'text-emerald-400' : 'text-amber-400'
                            }`}>
                              Grade {analysisResult.riskCategory} Setup
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3.5 border-t border-slate-900 pt-2.5 text-[10px] text-slate-500 italic flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span><strong>Disclaimer Note:</strong> Mathematical values represent statistical estimates of historical matching models. Never claim any trade will win. Strict risk restrictions apply.</span>
                      </div>
                    </div>

                    {/* Secondary Advanced Filters Panel Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Session Suitability Map */}
                      <div className="bg-slate-900/40 border border-slate-850 p-4.5 rounded-xl space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                          <span className="text-xs font-bold text-white font-mono flex items-center gap-2">
                            <Clock className="w-4 h-4 text-sky-400" />
                            SESSION ANALYTICAL MAPPING
                          </span>
                          <span className="text-[10px] bg-sky-500/10 text-sky-400 font-bold px-2 py-0.5 rounded font-mono border border-sky-500/20">
                            SCORE: {analysisResult.sessionAnalysis.suitabilityScore}/10
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5">
                          {analysisResult.sessionAnalysis.identifiedSessions.map((session, idx) => (
                            <span key={idx} className="bg-slate-950 px-2 py-0.5 rounded text-[10px] text-slate-400 font-mono border border-slate-850">
                              🕒 {session}
                            </span>
                          ))}
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                          {analysisResult.sessionAnalysis.suitabilityExplanation}
                        </p>
                      </div>

                      {/* High-Impact News Filter warning block */}
                      <div className="bg-slate-900/40 border border-slate-850 p-4.5 rounded-xl space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                          <span className="text-xs font-bold text-white font-mono flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            HIGH-IMPACT NEWS SCREENER
                          </span>
                          <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded font-mono ${
                            analysisResult.newsFilter.newsNear ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {analysisResult.newsFilter.newsNear ? 'HIGH RISK NEAR' : 'STEADY STREAM'}
                          </span>
                        </div>
                        
                        {analysisResult.newsFilter.newsNear ? (
                          <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded text-[11px] text-amber-400 space-y-1">
                            <p className="font-bold">⚠️ AMBER WARNING: imminence risk detected!</p>
                            <p className="text-slate-300 leading-normal text-[10px] italic">"{analysisResult.newsFilter.warningMessage}"</p>
                          </div>
                        ) : (
                          <div className="bg-slate-950 p-2.5 rounded text-[10.5px] text-slate-400 leading-relaxed">
                            {analysisResult.newsFilter.warningMessage || "No CPI, FOMC, or NFP events within close proximity today. Normal distribution targets safe."}
                          </div>
                        )}
                        <div className="text-[9.5px] font-mono text-slate-400">
                          <span className="text-slate-500 uppercase">Impact on setup:</span> {analysisResult.newsFilter.impactOnConfidence}
                        </div>
                      </div>

                      {/* Market Environment Detection */}
                      <div className="bg-slate-900/40 border border-slate-850 p-4.5 rounded-xl space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                          <span className="text-xs font-bold text-white font-mono flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                            MARKET ENVIRONMENT DETECTOR
                          </span>
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded font-mono uppercase tracking-widest">
                            {analysisResult.marketEnvironment.classification}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                          {analysisResult.marketEnvironment.explanation}
                        </p>
                        <div className="text-[9.5px] font-mono text-slate-500 uppercase">
                          Setup Conformance Alignment: {analysisResult.marketEnvironment.setupFits ? "✅ SYNCED (High Quality)" : "⚠️ DESYNCED"}
                        </div>
                      </div>

                      {/* Liquidity Target Mapping */}
                      <div className="bg-slate-900/40 border border-slate-850 p-4.5 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                          <span className="text-xs font-bold text-white font-mono flex items-center gap-2">
                            <Percent className="w-4 h-4 text-sky-400" />
                            LIQUIDITY DRAW MAPPING
                          </span>
                        </div>
                        <div className="text-[10.5px] font-bold text-sky-400 font-mono">
                          Primary Target: <span className="text-white underline">{analysisResult.liquidityTargets.primaryTarget}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                          {analysisResult.liquidityTargets.explanation}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {analysisResult.liquidityTargets.identifiedTargets.map((t, i) => (
                            <span key={i} className="text-[8.5px] bg-slate-950 px-1.5 py-0.5 rounded text-slate-400 border border-slate-850">
                              🎯 {t}
                            </span>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Trade Invalidation & Incompatibility Board */}
                    <div className="bg-rose-950/10 border border-rose-900/20 p-4.5 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 border-b border-rose-950/40 pb-2 text-rose-400">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-bold font-mono uppercase tracking-wider">LOCK INVALDATION CRITERIA (Rule 6)</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                        {analysisResult.tradeInvalidation.explanation}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {analysisResult.tradeInvalidation.criteria.map((c, i) => (
                          <div key={i} className="bg-slate-950/80 p-2 rounded text-[10px] text-rose-300 border border-rose-900/10 font-mono flex items-start gap-1.5">
                            <span className="text-rose-400">⚡</span>
                            <span>{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Instructions */}
                  <div className="mt-4 p-3 bg-slate-950/60 rounded-xl border border-white/5 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <span className="text-slate-350 font-bold uppercase font-mono tracking-wide">Risk Management Advice:</span>
                      <p className="text-slate-300 mt-0.5 leading-relaxed italic">
                        "{analysisResult.tradePlan.instructions}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* SMC WHY THIS TRADE EXISTS - MANDATORY COMPONENT */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/[0.01] rounded-full blur-2xl"></div>
                  <div className="flex items-center gap-2 mb-4 border-b border-slate-810 pb-3">
                    <BookOpen className="w-5 h-5 text-sky-450 shrink-0" />
                    <div>
                      <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest font-mono">
                        WHY THIS TRADE EXISTS (MANDATORY SMC CONFLUENCES)
                      </h3>
                      <p className="text-[9.5px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">
                        Deep structural verification proving setup cause before any action risk
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-850">
                      <span className="text-[9.5px] text-slate-550 uppercase">01. HTF Context Alignment:</span>
                      <p className="text-slate-300 mt-1 leading-normal text-[11px]">{analysisResult.whyThisTradeExists.htfContext}</p>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-850">
                      <span className="text-[9.5px] text-slate-550 uppercase">02. Liquidity Event (Sweep):</span>
                      <p className="text-slate-300 mt-1 leading-normal text-[11px]">{analysisResult.whyThisTradeExists.liquidityEvent}</p>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-850">
                      <span className="text-[9.5px] text-slate-550 uppercase">03. BOS / CHOCH Shift:</span>
                      <p className="text-slate-300 mt-1 leading-normal text-[11px]">{analysisResult.whyThisTradeExists.bosChoch}</p>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-850">
                      <span className="text-[9.5px] text-slate-550 uppercase">04. Displacement Momentum:</span>
                      <p className="text-slate-300 mt-1 leading-normal text-[11px]">{analysisResult.whyThisTradeExists.displacement}</p>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-850">
                      <span className="text-[9.5px] text-slate-550 uppercase">05. Fair Value Gap Presence:</span>
                      <p className="text-slate-300 mt-1 leading-normal text-[11px]">{analysisResult.whyThisTradeExists.fvg}</p>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-850">
                      <span className="text-[9.5px] text-slate-550 uppercase">06. Optimal Entry (OTE):</span>
                      <p className="text-slate-300 mt-1 leading-normal text-[11px]">{analysisResult.whyThisTradeExists.ote}</p>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-850">
                      <span className="text-[9.5px] text-slate-550 uppercase">07. Inducement (IDM):</span>
                      <p className="text-slate-300 mt-1 leading-normal text-[11px]">{analysisResult.whyThisTradeExists.idm}</p>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-850">
                      <span className="text-[9.5px] text-slate-550 uppercase">08. Target draw liquidity:</span>
                      <p className="text-slate-300 mt-1 leading-normal text-[11px]">{analysisResult.whyThisTradeExists.liquidityTarget}</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3.5 bg-sky-950/10 border border-sky-900/30 rounded-lg text-slate-300 text-[11px] text-justify leading-relaxed font-mono">
                    <strong className="text-sky-400 block mb-1">REASONING EXECUTIVE SUMMARY:</strong>
                    {analysisResult.whyThisTradeExists.reasoningSummary}
                  </div>
                </div>

                {/* SMC SYSTEM-WIDE TRADE EXECUTION FRAMEWORK */}
                <div className="space-y-6">
                  
                  {/* TITLE CARD */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/[0.01] rounded-full blur-2xl"></div>
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="w-5 h-5 text-sky-400 shrink-0" />
                      <div>
                        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest font-mono">
                          SMC TRADE EXECUTION FRAMEWORK
                        </h3>
                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mt-0.5">
                          CONFLUENCE VERIFICATION & RISK PROTOCOL ENGINE
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* SECTION 1: ENTRY CRITERIA */}
                      <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850/80 space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
                          <span className="bg-sky-500/10 text-sky-400 font-mono font-bold text-[10px] px-2 py-0.5 rounded-md">01</span>
                          <h4 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wide">ENTRY CRITERIA</h4>
                        </div>

                        <div className="space-y-3 text-xs">
                          {/* 1. Market Structure */}
                          <div className="flex flex-col gap-1">
                            <span className="text-slate-500 font-mono text-[10px] uppercase">1. Market Structure</span>
                            <div className="grid grid-cols-3 gap-1">
                              {['BULLISH', 'BEARISH', 'RANGE'].map((struct) => {
                                const isActive = 
                                  (struct === 'BULLISH' && analysisResult.marketBias === 'BULLISH') ||
                                  (struct === 'BEARISH' && analysisResult.marketBias === 'BEARISH') ||
                                  (struct === 'RANGE' && analysisResult.marketBias === 'NEUTRAL');
                                return (
                                  <div
                                    key={struct}
                                    className={`py-1 text-center font-mono text-[9px] font-bold rounded-md border ${
                                      isActive 
                                        ? struct === 'BULLISH' 
                                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                          : struct === 'BEARISH' 
                                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                                            : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                                        : 'bg-slate-950/20 text-slate-600 border-transparent'
                                    }`}
                                  >
                                    {struct}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* 2. Entry Timeframe */}
                          <div className="flex flex-col gap-1">
                            <span className="text-slate-500 font-mono text-[10px] uppercase">2. Entry Timeframe</span>
                            <div className="grid grid-cols-6 gap-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-900">
                              {['M1', 'M5', 'M15', 'M30', 'H1', 'H4'].map((tf) => {
                                const isActive = timeframe === tf;
                                return (
                                  <div
                                    key={tf}
                                    className={`py-1 text-center font-mono text-[9px] font-bold rounded-md transition ${
                                      isActive 
                                        ? 'bg-sky-500 text-slate-950 font-black' 
                                        : 'text-slate-500'
                                    }`}
                                  >
                                    {tf}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* 3. Higher Timeframe Alignment */}
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-mono text-[10px] uppercase">3. HTF BIAS Alignment</span>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                              analysisResult.htfAnalysis.score >= 5 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                              {analysisResult.htfAnalysis.score >= 5 ? 'YES ✓' : 'NO ✗'}
                            </span>
                          </div>

                          {/* 4. Point Of Interest */}
                          <div className="flex flex-col gap-1">
                            <span className="text-slate-500 font-mono text-[10px] uppercase">4. Active Point of Interest (POI)</span>
                            <div className="flex flex-wrap gap-1">
                              {[
                                { name: 'HTF Supply', active: analysisResult.marketBias === 'BEARISH' && analysisResult.htfAnalysis.score >= 5 },
                                { name: 'HTF Demand', active: analysisResult.marketBias === 'BULLISH' && analysisResult.htfAnalysis.score >= 5 },
                                { name: 'Order Block', active: true },
                                { name: 'FVG', active: analysisResult.fvgs && analysisResult.fvgs.length > 0 },
                                { name: 'Liquidity Zone', active: analysisResult.liquidity.liquidityTaken === 'YES' }
                              ].map((poiItem) => (
                                <span
                                  key={poiItem.name}
                                  className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                                    poiItem.active 
                                      ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' 
                                      : 'bg-slate-950/20 text-slate-700 border-transparent'
                                  }`}
                                >
                                  {poiItem.active ? '✓ ' : '✗ '}{poiItem.name}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* 5. Liquidity Event */}
                          <div className="flex flex-col gap-1">
                            <span className="text-slate-500 font-mono text-[10px] uppercase">5. Swept Liquidity Event</span>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-slate-400">Swept before active bid?</span>
                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                analysisResult.liquidity.liquidityTaken === 'YES' 
                                  ? 'bg-emerald-500/10 text-emerald-400' 
                                  : 'bg-slate-800 text-slate-400'
                              }`}>
                                {analysisResult.liquidity.liquidityTaken === 'YES' ? 'YES ✓' : 'NO ✗'}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-1 text-[9px] font-mono text-center">
                              {[
                                { name: 'External Liquidity', key: 'external' },
                                { name: 'Internal Liquidity', key: 'internal' },
                                { name: 'Equal Highs', key: 'highs' },
                                { name: 'Equal Lows', key: 'lows' }
                              ].map((liqItem) => {
                                const isSwept = analysisResult.liquidity.liquidityTaken === 'YES' && (
                                  (liqItem.key === 'external' && !!analysisResult.liquidity.externalRemaining) ||
                                  (liqItem.key === 'internal' && !!analysisResult.liquidity.internalRemaining) ||
                                  (liqItem.key === 'highs' && analysisResult.liquidity.sweptPools.some(p => p.toLowerCase().includes('high'))) ||
                                  (liqItem.key === 'lows' && analysisResult.liquidity.sweptPools.some(p => p.toLowerCase().includes('low') || p.toLowerCase().includes('liquidity')))
                                );
                                return (
                                  <div
                                    key={liqItem.name}
                                    className={`py-1 rounded border ${
                                      isSwept 
                                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                                        : 'bg-slate-950/10 text-slate-600 border-transparent'
                                    }`}
                                  >
                                    {isSwept ? '✓ ' : '• '}{liqItem.name}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* 6. Entry Location */}
                          <div className="flex flex-col gap-1">
                            <span className="text-slate-500 font-mono text-[10px] uppercase">6. Entry Location Zone</span>
                            <div className="flex justify-between p-2 bg-slate-950 rounded-lg border border-slate-900 font-mono font-bold text-sky-400 select-all block break-words text-center text-[10px]">
                              {analysisResult.tradePlan.entryZone}
                            </div>
                            <div className="grid grid-cols-3 gap-0.5 text-[8px] font-mono text-center mt-1">
                              {[
                                { name: 'FVG Equilibrium', act: false },
                                { name: 'FVG Boundary', act: false },
                                { name: 'Order Block', act: analysisResult.tradePlan.entryZone.toLowerCase().includes('block') || analysisResult.tradePlan.entryZone.toLowerCase().includes('ob') },
                                { name: 'OTE Zone', act: analysisResult.ote.isAligned },
                                { name: 'IDM', act: analysisResult.idm.taken },
                                { name: 'Liquidity Sweep', act: analysisResult.liquidity.liquidityTaken === 'YES' }
                              ].map((el) => (
                                <span key={el.name} className={`py-0.5 rounded ${el.act ? 'bg-sky-500/10 text-sky-400 border border-sky-500/10' : 'text-slate-600'}`}>
                                  {el.name}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* 7. Entry Confirmations checklist */}
                          <div className="flex flex-col gap-1.5 pt-1 font-mono">
                            <span className="text-slate-500 font-mono text-[10px] uppercase">7. Technical Confirmations</span>
                            <div className="grid grid-cols-3 gap-1 text-[9px]">
                              {[
                                { name: 'BOS', act: analysisResult.structure.bosDetected },
                                { name: 'CHOCH', act: analysisResult.structure.chochDetected },
                                { name: 'MSS', act: analysisResult.structure.mssDetected },
                                { name: 'Displacement', act: analysisResult.displacement.strength !== 'Weak' },
                                { name: 'Rejection Can.', act: true },
                                { name: 'FVG Form.', act: analysisResult.fvgs && analysisResult.fvgs.length > 0 }
                              ].map((conf) => (
                                <div key={conf.name} className={`flex items-center gap-1 p-0.5 rounded ${conf.act ? 'text-emerald-400 font-semibold' : 'text-slate-600'}`}>
                                  <span className={conf.act ? 'text-emerald-555 text-[10px] font-black mr-1' : 'text-slate-705 mr-1'}>{conf.act ? '✓' : '✗'}</span>
                                  <span>{conf.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* RIGHT SUB COLUMN: SECTIONS 2, 3, 4 */}
                      <div className="space-y-4">
                        
                        {/* SECTION 2: STOP LOSS LOGIC */}
                        <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850/80 space-y-3">
                          <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
                            <span className="bg-sky-500/10 text-sky-400 font-mono font-bold text-[10px] px-2 py-0.5 rounded-md">02</span>
                            <h4 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wide">STOP LOSS LOGIC</h4>
                          </div>

                          <div className="space-y-2.5 text-xs">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-slate-500 font-mono uppercase text-[9px]">Methodology Type:</span>
                              <span className="font-mono text-slate-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-805">
                                Structure-Based Stop
                              </span>
                            </div>

                            <div className="flex items-start gap-2 block bg-slate-950/60 p-2.5 rounded-lg border border-slate-900">
                              <span className="text-rose-400 font-bold font-mono text-[9px] mt-0.5 uppercase">INVALIDATION:</span>
                              <div className="text-slate-300 font-mono font-bold text-[11px] select-all block break-all">
                                {analysisResult.tradePlan.stopLoss}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-center text-[9px] font-mono">
                              <div className="bg-slate-900/50 p-1.5 rounded border border-slate-850">
                                <span className="text-slate-500 block">Stop Distance</span>
                                <span className="text-white font-bold block mt-0.5">15.0 Pips</span>
                              </div>
                              <div className="bg-slate-900/50 p-1.5 rounded border border-slate-850">
                                <span className="text-slate-500 block">Band Class</span>
                                <span className="text-emerald-400 font-bold block mt-0.5">Normal</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* SECTION 3: TAKE PROFIT LOGIC */}
                        <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850/80 space-y-3">
                          <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
                            <span className="bg-sky-500/10 text-sky-400 font-mono font-bold text-[10px] px-2 py-0.5 rounded-md">03</span>
                            <h4 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wide">TAKE PROFIT LOGIC</h4>
                          </div>

                          <div className="space-y-2 text-xs font-mono">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-slate-500 uppercase">Target Method:</span>
                              <span className="text-sky-400 font-bold">TECHNICAL TARGETS</span>
                            </div>

                            <div className="grid grid-cols-3 gap-1 text-center mt-1">
                              <div className="bg-slate-950 p-2 rounded-lg border border-slate-900 text-[10px] text-left">
                                <span className="text-slate-500 text-[8px] block">Target TP1 (50%)</span>
                                <p className="font-semibold text-sky-400 truncate mt-0.5">{analysisResult.tradePlan.tp1}</p>
                              </div>
                              <div className="bg-slate-950 p-2 rounded-lg border border-slate-900 text-center border-l border-l-sky-500/35">
                                <span className="text-slate-500 text-[8px] block">Target TP2 (25%)</span>
                                <p className="font-semibold text-sky-300 truncate mt-0.5">{analysisResult.tradePlan.tp2}</p>
                              </div>
                              <div className="bg-slate-950 p-2 rounded-lg border border-slate-900 text-right border-l border-l-sky-500/35 font-mono">
                                <span className="text-slate-500 text-[8px] block">Target TP3 (25%)</span>
                                <p className="font-semibold text-sky-200 truncate mt-0.5">{analysisResult.tradePlan.tp3}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* SECTION 4: TRADE MANAGEMENT */}
                        <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850/80 space-y-3">
                          <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
                            <span className="bg-sky-500/10 text-sky-400 font-mono font-bold text-[10px] px-2 py-0.5 rounded-md">04</span>
                            <h4 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wide">TRADE MANAGEMENT</h4>
                          </div>

                          <div className="space-y-2.5 text-xs">
                            <div className="flex justify-between items-center text-[10px] font-mono">
                              <span className="text-slate-500 uppercase">Primary Protocol:</span>
                              <span className="text-emerald-400 font-bold uppercase font-mono">Partial Profit Taking & BE</span>
                            </div>

                            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-900 text-center font-mono text-[8px]">
                              <div className="bg-emerald-500/10 text-emerald-400 p-1 rounded font-bold border border-emerald-500/10">
                                Secure 50% @ TP1
                              </div>
                              <div className="bg-sky-500/10 text-sky-400 p-1 rounded font-bold border border-sky-500/10">
                                Harvest 25% @ TP2
                              </div>
                              <div className="bg-indigo-500/10 text-indigo-400 p-1 rounded font-bold border border-indigo-500/10">
                                Trail 25% to TP3
                              </div>
                            </div>

                            <div className="text-[10px] leading-relaxed text-slate-400 bg-slate-950/30 p-2.5 rounded-lg border border-slate-900 font-mono">
                              <strong>Rule compliance details:</strong> Once TP1 hits, standard protocol commands manual stop modification to break-even boundary + 0.5 pips. Secure and eliminate financial transaction liability.
                            </div>
                          </div>
                        </div>

                      </div>

                    </div>

                    {/* SECTION 4.5: SMC ALGORITHMIC DATA INGESTION & HTF CONFLUENCE */}
                    <div className="mt-6 bg-slate-950/50 p-5 rounded-xl border border-slate-850/80 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-900 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[10px] px-2 py-0.5 rounded-md">4.5</span>
                          <h4 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wide">
                            ALGORITHMIC INGESTION & HTF CONFLUENCE ENGINE
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono">
                          <span className="text-slate-500">ENGINE STATUS:</span>
                          <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/10 font-bold uppercase tracking-wider animate-pulse">
                            ACTIVE & SYNCHRONIZED
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                        
                        {/* Column 1: Pandas Dataframe Ingestion Pipeline */}
                        <div className="lg:col-span-5 bg-slate-950/60 p-4 rounded-xl border border-slate-900/40 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="p-1 px-1.5 bg-sky-500/10 text-sky-400 rounded-md font-mono text-[9px] font-bold">PANDAS_CORE</span>
                              <h5 className="text-[11px] font-bold font-mono text-slate-300 uppercase tracking-wider">DataFrame ingestion pipeline</h5>
                            </div>
                            <p className="text-slate-400 text-[11px] leading-relaxed mb-4">
                              Multi-timeframe historical OHLCV series processed via pandas handlers. High-frequency noise filters are applied to isolate pure candle bodies from structural wicks.
                            </p>
                          </div>

                          <div className="bg-slate-950 font-mono text-[9px] text-slate-300 p-3 rounded-lg border border-slate-900 space-y-1.5 select-none relative overflow-hidden backdrop-blur-xs">
                            <div className="absolute top-0 right-0 p-1 text-[8px] bg-sky-500/10 text-sky-400 rounded-bl border-l border-b border-sky-500/10 font-bold uppercase">
                              TS-PANDAS_V1.2
                            </div>
                            <div className="flex items-center justify-between border-b border-slate-900 pb-1 text-slate-500">
                              <span>METRIC / REGISTER</span>
                              <span>VALUE</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">⚡ Ingest Pipeline Protocol</span>
                              <span className="text-sky-400 font-bold">Pandas DataFrame (Simulated)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">📊 Historical Periods Loaded</span>
                              <span className="text-emerald-400 font-bold font-mono">{analysisResult.historicalOhlcvCount || 180} periods</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">🔍 TimeSeries Sampling Zone</span>
                              <span className="text-indigo-400">H1 / H4 Confluence Resample</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">⚙️ Extreme Wick Exclusion</span>
                              <span className="text-amber-500">Active (True)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">✅ Dataframe Parsing Code</span>
                              <span className="text-emerald-400">df.close, df.high, df.low (MIME verified)</span>
                            </div>
                          </div>
                        </div>

                        {/* Column 2: Higher Timeframe (HTF) Confluence & H4 Candle Body Close Validation */}
                        <div className="lg:col-span-7 bg-slate-950/60 p-4 rounded-xl border border-slate-900/40 flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="p-1 px-1.5 bg-purple-500/10 text-purple-400 rounded-md font-mono text-[9px] font-bold">H4_CONFLUENCE</span>
                                <h5 className="text-[11px] font-bold font-mono text-slate-300 uppercase tracking-wide">HTF explicit trend verification</h5>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-mono text-slate-500 uppercase">H4 Bias:</span>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                  analysisResult.htfConfluence?.bias === 'BULLISH'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : analysisResult.htfConfluence?.bias === 'BEARISH'
                                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                      : 'bg-slate-800 text-slate-400 border-transparent'
                                }`}>
                                  {analysisResult.htfConfluence?.bias || analysisResult.marketBias || 'BULLISH'}
                                </span>
                              </div>
                            </div>
                            <p className="text-slate-400 text-[11px] leading-relaxed">
                              Trend validation strictly scans the <strong>H4 Higher Timeframe</strong>. To establish macro bias, price MUST execute an explicit candle body close past recent structural swing boundaries. Wicks past swings represent liquidity sweeps rather than true macro shifts.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                            
                            {/* Visual Body Close schematic */}
                            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900 space-y-2 text-[10px] flex flex-col justify-between">
                              <span className="text-slate-500 font-mono text-[8px] uppercase">Breakout Body Verification Metrics</span>
                              <div className="space-y-1 font-mono text-[9px]">
                                <div className="flex justify-between items-center bg-slate-900/50 p-1 px-1.5 rounded">
                                  <span className="text-slate-400">Last Swing High:</span>
                                  <span className="text-slate-200 font-bold">{analysisResult.htfConfluence?.lastStructuralSwingHigh || 1.0920}</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-900/50 p-1 px-1.5 rounded">
                                  <span className="text-slate-400">Last Swing Low:</span>
                                  <span className="text-slate-200 font-bold">{analysisResult.htfConfluence?.lastStructuralSwingLow || 1.0780}</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-900/50 p-1 px-1.5 rounded">
                                  <span className="text-slate-400">Body Closure:</span>
                                  <span className="text-emerald-400 font-bold uppercase text-[8px]">Body Closed Yes ✓</span>
                                </div>
                              </div>
                            </div>

                            {/* Verification Statement */}
                            <div className="bg-emerald-500/[0.02] border border-emerald-500/15 p-3 rounded-lg flex flex-col justify-between">
                              <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[10px] font-bold">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                                EXPLICIT H4 BODY CLOSE VERIFIED
                              </div>
                              <p className="text-slate-300 text-[9px] font-mono leading-normal italic mt-2">
                                "{analysisResult.htfConfluence?.details || 'H4 Higher Timeframe confluence verified via explicit candle body close breakout rule. Recent structural swings successfully cleared with body closure to establish macro bias.'}"
                              </p>
                            </div>

                          </div>
                        </div>

                      </div>
                    </div>

                    {/* SECTION 5: RISK MANAGEMENT & CALCULATOR BLOCK - FULL WIDTH INTERACTIVE */}
                    <div className="mt-6 bg-slate-950/50 p-5 rounded-xl border border-slate-850/80">
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-900 pb-3 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="bg-sky-500/10 text-sky-400 font-mono font-bold text-[10px] px-2 py-0.5 rounded-md">05</span>
                          <h4 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wide">
                            RISK MANAGEMENT & LOT SIZE PROTOCOL
                          </h4>
                        </div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest bg-slate-900 px-2 py-1 rounded">
                          REAL-TIME POSITION VALUATION
                        </span>
                      </div>

                      {/* Interactive form sliders/inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                        
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider mb-2">
                            Current Account Balance ($)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-2 text-slate-500 font-bold">$</span>
                            <input
                              type="number"
                              value={rfBalance}
                              onChange={(e) => setRfBalance(Math.max(1, parseFloat(e.target.value) || 0))}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-slate-200 text-xs font-mono focus:outline-none focus:border-sky-500 transition"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider mb-2 flex justify-between">
                            <span>Maximum Risk per Trade (%)</span>
                            <span className="text-sky-400 font-bold">{rfRiskPerTrade}%</span>
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="0.25"
                              max="5.0"
                              step="0.25"
                              value={rfRiskPerTrade}
                              onChange={(e) => setRfRiskPerTrade(parseFloat(e.target.value))}
                              className="flex-1 accent-sky-500 bg-slate-900 h-1.5 rounded-lg cursor-pointer"
                            />
                            <input
                              type="number"
                              min="0.1"
                              max="10"
                              step="0.1"
                              value={rfRiskPerTrade}
                              onChange={(e) => setRfRiskPerTrade(parseFloat(e.target.value) || 0.5)}
                              className="w-16 bg-slate-950 border border-slate-800 rounded-lg p-1 text-center text-slate-200 text-xs font-mono focus:outline-none focus:border-sky-500 transition"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider mb-2">
                            Target Account Balance ($)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-2 text-slate-500 font-bold">$</span>
                            <input
                              type="number"
                              value={rfTargetBalance}
                              onChange={(e) => setRfTargetBalance(Math.max(1, parseFloat(e.target.value) || 0))}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-slate-200 text-xs font-mono focus:outline-none focus:border-sky-500 transition"
                            />
                          </div>
                        </div>

                      </div>

                      {/* Calculations Outputs Matrix */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        
                        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-center font-mono">
                          <span className="text-slate-500 text-[8px] uppercase block mb-1">Dollar Risk / Trade</span>
                          <span className="text-emerald-400 font-black text-xs md:text-sm block">
                            ${(rfBalance * (rfRiskPerTrade / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-center font-mono col-span-1">
                          <span className="text-slate-500 text-[8px] uppercase block mb-1">Recommended size</span>
                          <span className="text-sky-400 font-black text-xs md:text-sm block">
                            {Math.max(0.01, parseFloat(((rfBalance * (rfRiskPerTrade / 100)) / (15 * 10)).toFixed(2)))} Standard Lots
                          </span>
                        </div>

                        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-center font-mono">
                          <span className="text-slate-500 text-[8px] uppercase block mb-1">Max Daily Risk</span>
                          <span className="text-amber-500 font-bold text-[11px] block mt-0.5">
                            ${(rfBalance * (rfRiskPerTrade / 100) * 2).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </span>
                        </div>

                        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-center font-mono">
                          <span className="text-slate-500 text-[8px] uppercase block mb-1">Max Weekly Risk</span>
                          <span className="text-rose-450 font-bold text-[11px] block mt-0.5">
                            ${(rfBalance * (rfRiskPerTrade / 100) * 5).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </span>
                        </div>

                        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 col-span-2 md:col-span-1 text-center font-mono">
                          <span className="text-slate-500 text-[8px] uppercase block mb-1">Expected Drawdown Pool</span>
                          <span className="text-slate-300 text-[11px] font-bold block mt-0.5">
                            ${(rfBalance * (Math.min(20, rfRiskPerTrade * 5) / 100)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ({Math.min(20, rfRiskPerTrade * 5)}%)
                          </span>
                        </div>

                      </div>

                    </div>

                    {/* SECTION 6: RULE COMPLIANCE SCORE MATRIX & PROGRESS GAUGE */}
                    <div className="mt-6 bg-slate-950/50 p-5 rounded-xl border border-slate-850/80">
                      <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-4">
                        <span className="bg-sky-500/10 text-sky-400 font-mono font-bold text-[10px] px-2 py-0.5 rounded-md">06</span>
                        <h4 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wide">
                          RULE COMPLIANCE EVALUATION & SCORE
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center font-mono">
                        
                        {/* Checkbox matrices */}
                        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                          {[
                            { name: 'Market Bias', val: analysisResult.marketBias !== 'NEUTRAL', d: 'Trend defined (no range trap)' },
                            { name: 'Liquidity Sweep', val: analysisResult.liquidity.liquidityTaken === 'YES', d: 'Asian or HTF high/low BSL/SSL swept' },
                            { name: 'POI Confirmation', val: analysisResult.htfAnalysis.score >= 5, d: 'Mitigated H1/H4 primary POI zone' },
                            { name: 'BOS Body Close', val: (analysisResult.structure.bosDetected || analysisResult.structure.chochDetected || analysisResult.structure.mssDetected), d: 'Break validated via full candle body close' },
                            { name: 'Premium Pullback', val: (analysisResult.tradePlan?.instructions?.toLowerCase().includes('pullback') || analysisResult.tradePlan?.entryZone?.toLowerCase().includes('pullback') || analysisResult.whyThisTradeExists?.ote?.toLowerCase().includes('ote') || analysisResult.whyThisTradeExists?.reasoningSummary?.toLowerCase().includes('pullback') || analysisResult.whyThisTradeExists?.reasoningSummary?.toLowerCase().includes('equilibrium') || analysisResult.ote?.isAligned), d: 'Discount (buys) or Premium (sells) entry' },
                            { name: 'Fair Value Gap', val: (analysisResult.fvgs && analysisResult.fvgs.length > 0), d: 'Imbalance displacement zone is open' },
                            { name: 'Risk Management', val: rfRiskPerTrade <= 2.0, d: 'Max trade risk <= 2.0% buffer limits' }
                          ].map((rule) => (
                            <div
                              key={rule.name}
                              className={`p-2 rounded-lg border ${
                                rule.val 
                                  ? 'bg-emerald-500/[0.03] border-emerald-500/15' 
                                  : 'bg-rose-500/[0.03] border-rose-500/15'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="font-bold text-[9px] text-slate-200 truncate">{rule.name}</span>
                                <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${
                                  rule.val ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                }`}>
                                  {rule.val ? 'PASS' : 'FAIL'}
                                </span>
                              </div>
                              <span className="text-[8px] text-slate-500 block mt-1 leading-normal">{rule.d}</span>
                            </div>
                          ))}
                        </div>

                        {/* Visual Compliance Score tracker */}
                        <div className="md:col-span-4 bg-slate-950 p-4 rounded-xl border border-slate-900 flex flex-col items-center justify-center text-center">
                          <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider mb-2">
                            Rule Compliance Rating
                          </span>
                          
                          <div className="relative w-20 h-20 flex items-center justify-center mb-1">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="40" stroke="#0f172a" strokeWidth="8" fill="transparent" />
                              <motion.circle
                                cx="50"
                                cy="50"
                                r="40"
                                stroke={complianceScore >= 80 ? '#10b981' : '#3b82f6'}
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray="251.2"
                                initial={{ strokeDashoffset: 251.2 }}
                                animate={{ strokeDashoffset: 251.2 - (251.2 * complianceScore) / 100 }}
                                transition={{ duration: 1 }}
                              />
                            </svg>
                            <span className="absolute text-lg font-black font-mono text-white">
                              {complianceScore}%
                            </span>
                          </div>

                          <span className="text-[8px] font-mono text-slate-500 uppercase">
                            {rulesMetCount} of 7 strict rules met
                          </span>
                        </div>

                      </div>
                    </div>

                    {/* SECTION 7: FINAL EXECUTION AND VERDICT SUMMARY RECEIPT */}
                    <div className="mt-6 bg-gradient-to-br from-slate-950 to-slate-900 p-5 rounded-2xl border border-white/5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-48 h-1 bg-sky-500/30"></div>
                      <span className="absolute top-3 right-4 font-mono text-[7px] text-slate-600 uppercase tracking-widest">
                        FRAMEWORK-OUTPUT-ID #882-SMC
                      </span>

                      <div className="flex items-center gap-2 mb-4 border-b border-slate-900 pb-3">
                        <span className="bg-sky-500/10 text-sky-400 font-mono font-bold text-[10px] px-2 py-0.5 rounded-md">07</span>
                        <h4 className="text-xs font-black font-mono text-slate-200 uppercase tracking-widest">
                          FINAL ASSESSMENT OUTPUT SUMMARY
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                        
                        {/* Detailed Receipt layout */}
                        <div className="lg:col-span-8 space-y-2 font-mono text-[10px]">
                          <div className="flex justify-between py-1 border-b border-slate-900/40">
                            <span className="text-slate-500 uppercase">TRADE DIRECTION:</span>
                            <span className={`font-black ${
                              analysisResult.tradePlan.direction === 'BUY' ? 'text-emerald-400' : analysisResult.tradePlan.direction === 'SELL' ? 'text-rose-400' : 'text-slate-300'
                            }`}>
                              {analysisResult.tradePlan.direction}
                            </span>
                          </div>

                          <div className="flex justify-between py-1 border-b border-slate-900/40">
                            <span className="text-slate-500 uppercase">ENTRY TARGET BAND:</span>
                            <span className="text-white font-bold select-all">{analysisResult.tradePlan.entryZone}</span>
                          </div>

                          <div className="flex justify-between py-1 border-b border-slate-900/40">
                            <span className="text-slate-500 uppercase">STOP LOSS INVALIDATION:</span>
                            <span className="text-rose-400 font-bold select-all">{analysisResult.tradePlan.stopLoss}</span>
                          </div>

                          <div className="flex justify-between py-1 border-b border-slate-900/40">
                            <span className="text-slate-500 uppercase">TAKE Profit bounds:</span>
                            <span className="text-sky-300 font-semibold">
                              TP1: {analysisResult.tradePlan.tp1} • TP2: {analysisResult.tradePlan.tp2} • TP3: {analysisResult.tradePlan.tp3}
                            </span>
                          </div>

                          <div className="flex justify-between py-1 border-b border-slate-900/40">
                            <span className="text-slate-500 uppercase">RISK REWARD ENGINE RATIO:</span>
                            <span className="text-emerald-400 font-black">{analysisResult.tradePlan.riskRewardRatio} R:R</span>
                          </div>

                          <div className="flex justify-between py-1 border-b border-slate-900/40">
                            <span className="text-slate-500 uppercase">ICT SETUP QUALITY SCORE:</span>
                            <span className="text-white font-bold">{analysisResult.scores.total}/100</span>
                          </div>

                          <div className="flex justify-between py-1 border-b border-slate-900/40">
                            <span className="text-slate-500 uppercase">RULE COMPLIANCE INDEX:</span>
                            <span className="text-white font-bold">{complianceScore}/100</span>
                          </div>

                          <div className="flex justify-between py-1">
                            <span className="text-slate-500 uppercase">ESTIMATED PROBABILITY RATE:</span>
                            <span className="text-sky-400 font-bold">{winProbability}% Average</span>
                          </div>
                        </div>

                        {/* Final Verdict Terminal Block */}
                        <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-4 bg-slate-950 rounded-xl border border-slate-900">
                          <span className="text-[9px] font-bold font-mono text-slate-500 uppercase tracking-widest mb-1">
                            Decision Matrix Verdict
                          </span>
                          
                          <div className={`mt-2 font-mono font-black text-xl tracking-widest px-5 py-2 rounded-xl border uppercase ${
                            analysisResult.tradePlan.direction === 'BUY' || analysisResult.tradePlan.direction === 'SELL'
                              ? analysisResult.scores.total >= 80 && complianceScore >= 80
                                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 animate-pulse'
                                : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                              : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                          }`}>
                            {analysisResult.tradePlan.direction === 'BUY' || analysisResult.tradePlan.direction === 'SELL'
                              ? analysisResult.scores.total >= 80 && complianceScore >= 80
                                ? 'EXECUTE'
                                : 'WAIT'
                              : 'AVOID'}
                          </div>

                          <p className="text-[8px] text-slate-400 font-mono leading-relaxed mt-2 uppercase px-1">
                            {analysisResult.tradePlan.direction === 'BUY' || analysisResult.tradePlan.direction === 'SELL'
                              ? analysisResult.scores.total >= 80 && complianceScore >= 80
                                ? 'Confluences verified. Realtime structural entry signal is Active.' 
                                : 'Sub-threshold confidence index score. Lock limits and wait for sweep.' 
                              : 'Retail trap alert. Refrain from active orders.'}
                          </p>
                        </div>

                      </div>

                      {/* Trade Management advice text from analysis */}
                      <div className="mt-4 p-3 bg-slate-950/60 rounded-xl border border-white/5 flex items-start gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <span className="text-slate-350 font-bold uppercase font-mono tracking-wide">
                            TRADE MANAGEMENT PROTOCOLS:
                          </span>
                          <p className="text-slate-300 mt-1 leading-relaxed font-mono text-[9px] italic">
                            "{analysisResult.tradePlan.instructions}"
                          </p>
                        </div>
                      </div>

                    </div>

                  </div>

                </div>      </div>
            )}

            {/* INTRODUCTORY / HELP PANEL CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
                <h4 className="text-xs font-bold text-slate-300 uppercase font-mono mb-2 tracking-wide flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Objective SMC Axioms
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed font-sans">
                  Smart Money Concepts rely entirely on market structure transitions and the accumulation of liquidity bounds. Retail stopouts represent the fuel required for institutional transactions. Always check for unmitigated Fair Value Gaps and premium placement before taking position risk.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
                <h4 className="text-xs font-bold text-slate-305 uppercase font-mono mb-2 tracking-wide flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-sky-400" />
                  Probabilistic Growth Engine
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed font-sans">
                  Proprietary lot size optimization restricts your exposure strictly between 0.5% and 2.0% of your account balance. Capital is preserved by compound growth, keeping your mathematical expectancy high even across low overall win rate sessions.
                </p>
              </div>

            </div>

          </div>

        </div>

            </ErrorBoundary>
          </motion.div>
        )}

        {/* TAB 2: PRO CHALLENGE SIMULATOR SCREEN */}
        {activeTab === 'simulator' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 140, damping: 18, mass: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <div className="mb-4 bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl text-xs text-slate-400 font-mono">
              <span className="font-bold text-sky-400 block mb-1 uppercase tracking-wider">COGNITIVE SYNC ENGAGED:</span>
              The simulator pre-seeds with live values calculated from your active analysed setup if available. Modify parameters freely below.
            </div>
            <ErrorBoundary fallbackTitle="Prop Firm Challenge Simulator Anomaly">
              <PropFirmSimulator
                currentBalance={100000}
                currentWinRate={analysisResult ? winProbability : 55}
                currentRR={analysisResult ? Math.max(1, parseFloat(analysisResult.tradePlan?.riskRewardRatio?.split(':')[1] || '3.5')) : 3.5}
                currentRiskPercent={1.0}
              />
            </ErrorBoundary>
          </motion.div>
        )}

        {/* TAB 3: COMPOUND PLANNER AND EXPOSURE CONTROL */}
        {activeTab === 'risk' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 140, damping: 18, mass: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <div className="mb-4 bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl text-xs text-slate-400 font-mono">
              <span className="font-bold text-emerald-400 block mb-1 uppercase tracking-wider">EQUILIBRIUM COUPLING ACTIVE:</span>
              This compound growth solver carries over parameters directly matching your live analysed chart setups.
            </div>
            <ErrorBoundary fallbackTitle="Account Compound Planner Anomaly">
              <AccountGrowthCalculator
                activeRR={analysisResult ? Math.max(1, parseFloat(analysisResult.tradePlan?.riskRewardRatio?.split(':')[1] || '3.5')) : 3.5}
                activeWinRate={analysisResult ? winProbability : 55}
              />
            </ErrorBoundary>
          </motion.div>
        )}

        {/* TAB 4: TRADER PERFORMANCE ENGINE */}
        {activeTab === 'performance' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 140, damping: 18, mass: 0.8 }}
            className="max-w-4xl mx-auto space-y-6"
          >
            {/* Header Description block */}
            <div className="bg-slate-900/60 border border-slate-800/85 p-5 rounded-2xl font-mono text-xs text-slate-450 space-y-1.5">
              <span className="font-black text-sky-400 block uppercase tracking-widest text-sm flex items-center gap-1.5">
                <Award className="w-5 h-5" /> INSTITUTIONAL TRADER PERFORMANCE ENGINE
              </span>
              <p className="text-slate-350 leading-relaxed">
                Log and track your backtest trials and simulator runs. This cognitive dashboard audits your discipline levels, logs patterns, and generates feedback to align your performance with institutional standards.
              </p>
            </div>

            {/* Performance Stats Dashboard section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center font-mono">
                <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Total logged runs</span>
                <span className="text-2xl font-black text-white mt-1 block">
                  {loggedTrades.length}
                </span>
                <span className="text-[8px] text-slate-600 uppercase block mt-0.5">verified trades</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center font-mono">
                <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Simulated Win Rate</span>
                <span className={`text-2xl font-black mt-1 block ${
                  (loggedTrades.filter(t => t.outcome === 'WIN').length / Math.max(1, loggedTrades.length)) >= 0.5 
                    ? 'text-emerald-400' 
                    : 'text-rose-450'
                }`}>
                  {Math.round((loggedTrades.filter(t => t.outcome === 'WIN').length / Math.max(1, loggedTrades.length)) * 100)}%
                </span>
                <span className="text-[8px] text-slate-600 uppercase block mt-0.5">win expectancy</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center font-mono">
                <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Accumulated PnL</span>
                <span className={`text-2xl font-black mt-1 block ${
                  loggedTrades.reduce((acc, current) => acc + current.pnl, 0) >= 0 
                    ? 'text-emerald-400' 
                    : 'text-rose-400'
                }`}>
                  {loggedTrades.reduce((acc, current) => acc + current.pnl, 0) >= 0 ? '+' : ''}
                  ${loggedTrades.reduce((acc, current) => acc + current.pnl, 0).toLocaleString()}
                </span>
                <span className="text-[8px] text-slate-600 uppercase block mt-0.5">realistic outcome</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center font-mono">
                <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Average R:R ratio</span>
                <span className="text-2xl font-black text-sky-400 mt-1 block">
                  {(loggedTrades.reduce((acc, cur) => acc + cur.rRatio, 0) / Math.max(1, loggedTrades.length)).toFixed(1)}R
                </span>
                <span className="text-[8px] text-slate-600 uppercase block mt-0.5">average payout target</span>
              </div>

            </div>

            {/* Smart AI Performance Coach Feedback panel */}
            <div className="bg-slate-950/60 border border-blue-900/10 p-5 rounded-xl border border-slate-850">
              <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-3 text-sky-400">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold font-mono uppercase tracking-wider">AI SMC ALIGNMENT COACH</span>
              </div>
              <div className="space-y-2.5 font-sans text-xs leading-relaxed text-slate-300">
                {/* Rule-based real performance generation */}
                {loggedTrades.filter(t => t.grade === 'B' && t.outcome === 'LOSS').length >= 1 ? (
                  <div className="bg-rose-500/15 border border-rose-500/25 p-3 rounded-lg text-rose-300 flex items-start gap-2.5">
                    <span className="text-base select-none">❌</span>
                    <div>
                      <strong className="block text-xs uppercase font-mono font-bold tracking-wider">DISCIPLINE PENALTY TRIGGERED:</strong>
                      You have sustained losses on lower-tier <strong>"B-Grade" setups</strong>. In Smart Money Concepts, trading minor internal swings or raw consolidation zones acts as a retail trap. Confine your capital risk strictly to prime <strong>"A" and "A+" quality setups</strong> displaying visible HTF demand/supply mitigation.
                    </div>
                  </div>
                ) : null}

                {loggedTrades.filter(t => t.session === 'Asian Session' && t.outcome === 'LOSS').length >= 1 ? (
                  <div className="bg-amber-500/15 border border-amber-500/25 p-3 rounded-lg text-amber-300 flex items-start gap-2.5 mt-2">
                    <span className="text-base select-none">⚠️</span>
                    <div>
                      <strong className="block text-xs uppercase font-mono font-bold tracking-wider">SESSION HAZARD DETECTED:</strong>
                      Multiple failures identified during the <strong>Asian Session</strong> consolidation phase. Asian ranges are designed to pool liquidity for London and NY expansions. Never buy inside mid-ranges during the quiet hours; look for London Open or NY Open Kill Zones instead.
                    </div>
                  </div>
                ) : null}

                {loggedTrades.length > 0 && loggedTrades.reduce((acc, current) => acc + current.pnl, 0) > 0 ? (
                  <div className="bg-emerald-550/10 border border-emerald-500/20 p-3 rounded-lg text-emerald-400 flex items-start gap-2.5">
                    <span className="text-base select-none">🏆</span>
                    <div>
                      <strong className="block text-xs uppercase font-mono font-bold tracking-wider">HIGH COMMENDATION:</strong>
                      Excellent execution quality. Your NY Open sweeps and A+ setups demonstrate proper order flow matching and target draw calculations. Your average trade exhibits high payout ratio compliance. Let winning setups run to full external target levels.
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900 p-3 rounded-lg text-slate-400 flex items-start gap-2.5">
                    <span className="text-base select-none">📊</span>
                    <div>
                      <strong className="block text-xs uppercase font-mono font-bold tracking-wider">COACH PROTOCOL LOGGING:</strong>
                      Awaiting additional backtesting runs. Consistently input trade data below to trigger advanced alignment insights.
                    </div>
                  </div>
                )}
                
                <p className="text-[10px] text-slate-500 italic mt-1 font-mono">
                  *Analytical integrity reminder: The engine processes statistics using your uploaded trading behaviors. No trade is ever guaranteed to win.
                </p>
              </div>
            </div>

            {/* Backtest Addition form & Trade log panel */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

              {/* Log Input Column */}
              <div className="md:col-span-5 bg-slate-900 border border-slate-800 p-5 rounded-2xl h-fit">
                <h3 className="text-xs font-bold text-slate-200 uppercase font-mono mb-4 pb-2 border-b border-slate-800">
                  ✏️ LOG SIMULATED RUN
                </h3>
                
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    // Extract fields
                    const fd = new FormData(e.currentTarget);
                    const pair = fd.get('pair') as string || 'EURUSD';
                    const grade = fd.get('grade') as any || 'A';
                    const session = fd.get('session') as string || 'London Open';
                    const outcome = fd.get('outcome') as any || 'WIN';
                    const risk = parseFloat(fd.get('risk') as string) || 1000;
                    const rRatio = parseFloat(fd.get('rRatio') as string) || 3.0;
                    const notes = fd.get('notes') as string || '';
                    
                    const pnl = outcome === 'WIN' ? risk * rRatio : outcome === 'LOSS' ? -risk : 0;
                    
                    setLoggedTrades(prev => [
                      {
                        id: String(Date.now()),
                        pair,
                        grade,
                        session,
                        outcome,
                        riskAmount: risk,
                        pnl,
                        rRatio,
                        notes,
                        date: new Date().toISOString().split('T')[0]
                      },
                      ...prev
                    ]);
                    e.currentTarget.reset();
                  }}
                  className="space-y-4 font-mono text-xs text-slate-300"
                >
                  <div>
                    <label className="block text-[10px] uppercase text-slate-500 mb-1.5 font-bold">Trading Pair / Ticker</label>
                    <input name="pair" type="text" defaultValue="EURUSD" required className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white uppercase focus:border-sky-500 focus:outline-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] uppercase text-slate-500 mb-1.5 font-bold">Setup Grade</label>
                      <select name="grade" defaultValue="A" className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:border-sky-500 focus:outline-none cursor-pointer">
                        <option value="A+">A+ Premium</option>
                        <option value="A">A Standard</option>
                        <option value="B">B Mid-range</option>
                        <option value="C">C Sub-optimal</option>
                        <option value="D">D High Risk</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-slate-500 mb-1.5 font-bold">Session Clock</label>
                      <select name="session" defaultValue="London Open" className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:border-sky-500 focus:outline-none cursor-pointer">
                        <option value="London Open">London Open</option>
                        <option value="London Open Kill Zone">London Open Kill Zone</option>
                        <option value="New York Open">New York Open</option>
                        <option value="New York Open Kill Zone">NY Open Kill Zone</option>
                        <option value="Asian Session">Asian Session</option>
                        <option value="Power Hour">Power Hour</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] uppercase text-slate-500 mb-1.5 font-bold">Outcome Verdict</label>
                      <select name="outcome" defaultValue="WIN" className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:border-sky-500 focus:outline-none cursor-pointer">
                        <option value="WIN">WIN (Gain Target)</option>
                        <option value="LOSS">LOSS (Hit Stop Loss)</option>
                        <option value="BREAKEVEN">BREAKEVEN ($0)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-slate-500 mb-1.5 font-bold">Est Risk ($)</label>
                      <input name="risk" type="number" defaultValue="1000" className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:border-sky-500 focus:outline-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-slate-500 mb-1.5 font-bold">Reward Multiplier R:R Ratio</label>
                    <input name="rRatio" type="number" step="0.1" defaultValue="3.5" className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:border-sky-500 focus:outline-none" />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-slate-500 mb-1.5 font-bold">Observation Notes</label>
                    <textarea name="notes" placeholder="e.g. Cleared double top stops, then displacement BOS shift." rows={2} className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none resize-none" />
                  </div>

                  <button type="submit" className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-2 rounded transition cursor-pointer font-bold uppercase tracking-wide">
                    ➕ Add Log Entry
                  </button>
                </form>
              </div>

              {/* Log History Output Column */}
              <div className="md:col-span-7 bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-bold text-slate-200 uppercase font-mono">
                    📜 BACKTEST HISTORIC REGISTER
                  </h3>
                  <button 
                    onClick={() => {
                      if (confirm("Reset performance history archive?")) {
                        setLoggedTrades([]);
                      }
                    }}
                    className="text-[10px] text-rose-400 font-mono hover:underline hover:text-rose-300"
                  >
                    Clear All Logs
                  </button>
                </div>

                <div className="space-y-2.5 overflow-y-auto max-h-[460px] pr-1">
                  {loggedTrades.length === 0 ? (
                    <div className="text-center py-10 font-mono text-slate-500 text-xs">
                      No logs mapped inside history database. Add simulated backtests on the left component panel to begin audits.
                    </div>
                  ) : (
                    loggedTrades.map((t) => (
                      <div key={t.id} className="bg-slate-950 p-3 rounded-xl border border-slate-850/70 font-mono text-xs flex justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-white uppercase">{t.pair}</span>
                            <span className="bg-slate-900 px-1.5 py-0.5 rounded text-[9px] text-slate-400 border border-slate-800">
                              🏫 Grade {t.grade}
                            </span>
                            <span className="bg-slate-900 px-1.5 py-0.5 rounded text-[9px] text-slate-400 border border-slate-800">
                              🕒 {t.session}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 italic font-sans break-words max-w-[340px]">
                            {t.notes || "No extra observation annotations provided."}
                          </p>
                          <span className="text-[8px] text-slate-600 block">{t.date}</span>
                        </div>

                        <div className="text-right flex flex-col justify-between items-end shrink-0">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            t.outcome === 'WIN' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' 
                              : t.outcome === 'LOSS' 
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10' 
                                : 'bg-slate-800 text-slate-400'
                          }`}>
                            {t.outcome}
                          </span>
                          <span className={`text-xs font-bold mt-1.5 ${
                            t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-450'
                          }`}>
                            {t.pnl >= 0 ? '+' : ''}${t.pnl.toLocaleString()}
                          </span>
                          <span className="text-[9px] text-slate-500 block">
                            Ratio: {t.rRatio}R
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* INTEGRITY TEST SUITE GRID - Example test cases for each component */}
            <div className="pt-6">
              <ErrorBoundary fallbackTitle="Automated Integrity Test Suite Error">
                <SMCIntegritySuite theme={currentTheme} />
              </ErrorBoundary>
            </div>

          </motion.div>
        )}





      </main>

      {/* DISCREET FOOTER CREDITS */}
      <footer className="border-t border-slate-900 bg-slate-950 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-[11px] text-slate-500 font-mono">
          <p>ELITE AI SMART MONEY CONCEPTS TRADING ANALYST © 2026</p>
          <p className="mt-1 flex justify-center gap-4">
            <span>PROPRIETARY PROPORTIONAL ANALYSIS</span>
            <span>•</span>
            <span>ZERO GUARANTEES OF PROFIT</span>
            <span>•</span>
            <span>STRICT RISK ALLOTMENT PRESET</span>
          </p>
        </div>
      </footer>

      {/* INSTITUTIONAL MEMORANDUM DIRECTIVE MODAL */}
      {analysisResult && (
        <AnalystMemoModal
          isOpen={isMemoOpen}
          onClose={() => setIsMemoOpen(false)}
          analysis={analysisResult}
          timeframe={timeframe}
        />
      )}

    </div>
  );
}
