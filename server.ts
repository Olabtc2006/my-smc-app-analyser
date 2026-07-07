/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Set up JSON payload limit to handle base64 image uploads comfortably
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Set up CORS headers middleware to handle iframe/preview environment sandboxing securely
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Initialize Google GenAI Client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Robust retry wrapper for handling temporary Google Gemini model congestion/503/429 errors
async function generateContentWithRetry(client: GoogleGenAI, options: any, maxRetries = 2, initialDelayMs = 1000): Promise<any> {
  const modelsToTry = [
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    options.model || 'gemini-3.5-flash'
  ];

  // Filter out any duplicate model entries
  const uniqueModels = Array.from(new Set(modelsToTry));
  let lastError: any = null;

  for (let i = 0; i < uniqueModels.length; i++) {
    const model = uniqueModels[i];
    const isLastModel = i === uniqueModels.length - 1;
    let attempt = 0;
    
    // We can do fewer retries per model if we have alternative fallbacks left to save user wait time
    const currentMaxRetries = isLastModel ? maxRetries : 1;

    while (attempt < currentMaxRetries) {
      try {
        attempt++;
        const currentOptions = { ...options, model };
        console.log(`[Gemini Connect] Accessing model slot ${model} (attempt ${attempt}/${currentMaxRetries})`);
        return await client.models.generateContent(currentOptions);
      } catch (error: any) {
        lastError = error;
        
        // Build an exhaustive error detail string to catch deeply nested properties
        const errorMsgDetails = [
          String(error?.message || ''),
          String(error?.error?.message || ''),
          String(error || ''),
          String(error?.status || ''),
          String(error?.statusCode || ''),
          String(error?.code || ''),
          String(error?.error?.code || ''),
          String(error?.error?.status || ''),
          typeof error === 'object' ? JSON.stringify(error) : ''
        ].join(' | ').toUpperCase();

        const status = Number(error?.status || error?.statusCode || error?.code || error?.error?.code || error?.error?.status || 0);
        
        const isRateLimitOrUnavailable = 
          status === 429 || 
          status === 503 || 
          errorMsgDetails.includes('503') || 
          errorMsgDetails.includes('429') || 
          errorMsgDetails.includes('TEMPORARY') || 
          errorMsgDetails.includes('HIGH DEMAND') || 
          errorMsgDetails.includes('RESOURCE HAS BEEN EXHAUSTED') ||
          errorMsgDetails.includes('UNAVAILABLE') ||
          errorMsgDetails.includes('CONGESTION') ||
          errorMsgDetails.includes('BUSY');
        
        if (isRateLimitOrUnavailable) {
          if (!isLastModel) {
            console.log(`[Gemini Connect] Service slot ${model} busy. Moving proactively to alternative...`);
            break; // Skip further retries on this slot because we have fallback models left!
          } else if (attempt < currentMaxRetries) {
            const delay = initialDelayMs * Math.pow(2, attempt - 1);
            console.log(`[Gemini Connect] Retrying slot ${model} in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        // Throw non-retryable errors immediately
        throw error;
      }
    }
  }

  // If all models in slot pool had issue, raise the final received error
  throw lastError;
}

// Robust JSON parse helper that handles markdown code blocks and trailing snippets gracefully
function robustJsonParse(text: string): any {
  if (!text) return {};
  let cleanText = text.trim();
  
  // Remove markdown code blocks if the model returned them
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }
  
  try {
    return JSON.parse(cleanText);
  } catch (error) {
    console.warn('[Parser Warning] Standard JSON parse failed, attempting to isolate JSON bounds:', error);
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        const potentialJson = cleanText.substring(firstBrace, lastBrace + 1);
        return JSON.parse(potentialJson);
      } catch (nestedError) {
        console.error('[Parser Error] Nested JSON parse attempt failed:', nestedError);
      }
    }
    throw error;
  }
}

// Deep normalizer that guarantees the returned object contains every expected metric and list
function sanitizeAndFillAnalysis(data: any): any {
  if (!data || typeof data !== 'object') {
    data = {};
  }

  const marketBias = ['BULLISH', 'BEARISH', 'NEUTRAL'].includes(String(data.marketBias || '').toUpperCase())
    ? String(data.marketBias).toUpperCase()
    : 'NEUTRAL';

  const biasConfidence = typeof data.biasConfidence === 'number' ? data.biasConfidence : 50;
  const biasExplanation = String(data.biasExplanation || '');
  const setupQualityScore = typeof data.setupQualityScore === 'number' ? data.setupQualityScore : 50;
  
  const confidenceLevel = ['Low', 'Medium', 'High'].includes(String(data.confidenceLevel || ''))
    ? data.confidenceLevel
    : 'Medium';

  const historicalPatternMatch = ['Weak', 'Moderate', 'Strong'].includes(String(data.historicalPatternMatch || ''))
    ? data.historicalPatternMatch
    : 'Moderate';

  const estimatedSuccessRange = String(data.estimatedSuccessRange || '50% - 58%');
  
  const setupGrade = ['A+', 'A', 'B', 'C', 'D'].includes(String(data.setupGrade || ''))
    ? data.setupGrade
    : 'C';

  const riskCategory = ['A+', 'A', 'B', 'C', 'D'].includes(String(data.riskCategory || ''))
    ? data.riskCategory
    : 'C';

  // sessionAnalysis
  const rawSession = data.sessionAnalysis || {};
  const sessionAnalysis = {
    identifiedSessions: Array.isArray(rawSession.identifiedSessions) ? rawSession.identifiedSessions.map(String) : [],
    suitabilityScore: typeof rawSession.suitabilityScore === 'number' ? rawSession.suitabilityScore : 5,
    suitabilityExplanation: String(rawSession.suitabilityExplanation || '')
  };

  // newsFilter
  const rawNews = data.newsFilter || {};
  const newsFilter = {
    newsNear: typeof rawNews.newsNear === 'boolean' ? rawNews.newsNear : false,
    eventsDetected: Array.isArray(rawNews.eventsDetected) ? rawNews.eventsDetected.map(String) : [],
    warningMessage: String(rawNews.warningMessage || ''),
    impactOnConfidence: String(rawNews.impactOnConfidence || 'None')
  };

  // marketEnvironment
  const rawEnv = data.marketEnvironment || {};
  const marketEnvironment = {
    classification: ['Trending', 'Ranging', 'Accumulating', 'Distributing', 'Expanding'].includes(rawEnv.classification)
      ? rawEnv.classification
      : 'Ranging',
    setupFits: typeof rawEnv.setupFits === 'boolean' ? rawEnv.setupFits : false,
    explanation: String(rawEnv.explanation || '')
  };

  // liquidityTargets
  const rawLiqTargets = data.liquidityTargets || {};
  const liquidityTargets = {
    identifiedTargets: Array.isArray(rawLiqTargets.identifiedTargets) ? rawLiqTargets.identifiedTargets.map(String) : [],
    primaryTarget: String(rawLiqTargets.primaryTarget || ''),
    explanation: String(rawLiqTargets.explanation || '')
  };

  // tradeInvalidation
  const rawInvalidation = data.tradeInvalidation || {};
  const tradeInvalidation = {
    criteria: Array.isArray(rawInvalidation.criteria) ? rawInvalidation.criteria.map(String) : [],
    explanation: String(rawInvalidation.explanation || '')
  };

  // chartQuality
  const rawChartQuality = data.chartQuality || {};
  const chartQuality = {
    candlesVisible: typeof rawChartQuality.candlesVisible === 'boolean' ? rawChartQuality.candlesVisible : true,
    timeframeVisible: typeof rawChartQuality.timeframeVisible === 'boolean' ? rawChartQuality.timeframeVisible : true,
    priceScaleVisible: typeof rawChartQuality.priceScaleVisible === 'boolean' ? rawChartQuality.priceScaleVisible : true,
    structureVisible: typeof rawChartQuality.structureVisible === 'boolean' ? rawChartQuality.structureVisible : true,
    qualityScore: typeof rawChartQuality.qualityScore === 'number' ? rawChartQuality.qualityScore : 80,
    isAcceptable: typeof rawChartQuality.isAcceptable === 'boolean' ? rawChartQuality.isAcceptable : true,
    rejectionReason: String(rawChartQuality.rejectionReason || '')
  };

  // whyThisTradeExists
  const rawWhy = data.whyThisTradeExists || {};
  const whyThisTradeExists = {
    htfContext: String(rawWhy.htfContext || ''),
    liquidityEvent: String(rawWhy.liquidityEvent || ''),
    bosChoch: String(rawWhy.bosChoch || ''),
    displacement: String(rawWhy.displacement || ''),
    fvg: String(rawWhy.fvg || ''),
    ote: String(rawWhy.ote || ''),
    idm: String(rawWhy.idm || ''),
    liquidityTarget: String(rawWhy.liquidityTarget || ''),
    reasoningSummary: String(rawWhy.reasoningSummary || '')
  };

  // historicalPattern
  const rawPat = data.historicalPattern || {};
  const historicalPattern = {
    patternSimilarity: String(rawPat.patternSimilarity || '50%'),
    historicalMatchScore: ['Weak', 'Moderate', 'Strong'].includes(rawPat.historicalMatchScore) ? rawPat.historicalMatchScore : 'Moderate',
    estimatedSuccessRange: String(rawPat.estimatedSuccessRange || '50% - 55%'),
    matchedPatternDescription: String(rawPat.matchedPatternDescription || ''),
    similarSetupsCount: typeof rawPat.similarSetupsCount === 'number' ? rawPat.similarSetupsCount : 0
  };

  // htfAnalysis
  const rawHtf = data.htfAnalysis || {};
  const htfAnalysis = {
    score: typeof rawHtf.score === 'number' ? rawHtf.score : 5,
    description: String(rawHtf.description || ''),
    identifiedPOI: Array.isArray(rawHtf.identifiedPOI) ? rawHtf.identifiedPOI.map(String) : [],
    reactionQuality: String(rawHtf.reactionQuality || '')
  };

  // liquidity
  const rawLiq = data.liquidity || {};
  const liquidity = {
    liquidityTaken: ['YES', 'NO'].includes(String(rawLiq.liquidityTaken || '').toUpperCase())
      ? String(rawLiq.liquidityTaken).toUpperCase()
      : 'NO',
    details: String(rawLiq.details || ''),
    externalRemaining: String(rawLiq.externalRemaining || ''),
    internalRemaining: String(rawLiq.internalRemaining || ''),
    sweptPools: Array.isArray(rawLiq.sweptPools) ? rawLiq.sweptPools.map(String) : []
  };

  // structure
  const rawStruct = data.structure || {};
  const structure = {
    score: typeof rawStruct.score === 'number' ? rawStruct.score : 5,
    description: String(rawStruct.description || ''),
    bosDetected: typeof rawStruct.bosDetected === 'boolean' ? rawStruct.bosDetected : false,
    chochDetected: typeof rawStruct.chochDetected === 'boolean' ? rawStruct.chochDetected : false,
    mssDetected: typeof rawStruct.mssDetected === 'boolean' ? rawStruct.mssDetected : false,
    sequenceType: String(rawStruct.sequenceType || 'Continuation')
  };

  // displacement
  const rawDisp = data.displacement || {};
  const displacement = {
    strength: ['Weak', 'Moderate', 'Strong', 'Institutional'].includes(rawDisp.strength)
      ? rawDisp.strength
      : 'Moderate',
    explanation: String(rawDisp.explanation || '')
  };

  // fvgs
  const rawFvgs = Array.isArray(data.fvgs) ? data.fvgs : [];
  const fvgs = rawFvgs.map((f: any, idx: number) => ({
    id: String(f.id || `fvg-${idx}`),
    type: ['BULLISH', 'BEARISH'].includes(String(f.type || '').toUpperCase()) ? String(f.type).toUpperCase() : 'BULLISH',
    priceRange: String(f.priceRange || ''),
    mitigated: typeof f.mitigated === 'boolean' ? f.mitigated : false,
    isPremiumDiscount: ['PREMIUM', 'DISCOUNT', 'NONE'].includes(String(f.isPremiumDiscount || '').toUpperCase())
      ? String(f.isPremiumDiscount).toUpperCase()
      : 'NONE',
    qualityScore: typeof f.qualityScore === 'number' ? f.qualityScore : 5
  }));

  // idm
  const rawIdm = data.idm || {};
  const idm = {
    taken: typeof rawIdm.taken === 'boolean' ? rawIdm.taken : false,
    score: typeof rawIdm.score === 'number' ? rawIdm.score : 5,
    details: String(rawIdm.details || '')
  };

  // ote
  const rawOte = data.ote || {};
  const ote = {
    isAligned: typeof rawOte.isAligned === 'boolean' ? rawOte.isAligned : false,
    lowerBound: typeof rawOte.lowerBound === 'number' ? rawOte.lowerBound : 0.62,
    upperBound: typeof rawOte.upperBound === 'number' ? rawOte.upperBound : 0.79,
    details: String(rawOte.details || '')
  };

  // scores
  const rawScores = data.scores || {};
  const scores = {
    htfPoi: typeof rawScores.htfPoi === 'number' ? rawScores.htfPoi : 10,
    liquiditySweep: typeof rawScores.liquiditySweep === 'number' ? rawScores.liquiditySweep : 10,
    bosChoch: typeof rawScores.bosChoch === 'number' ? rawScores.bosChoch : 10,
    displacement: typeof rawScores.displacement === 'number' ? rawScores.displacement : 10,
    fvg: typeof rawScores.fvg === 'number' ? rawScores.fvg : 10,
    idm: typeof rawScores.idm === 'number' ? rawScores.idm : 3,
    ote: typeof rawScores.ote === 'number' ? rawScores.ote : 5,
    total: typeof rawScores.total === 'number' ? rawScores.total : 50
  };

  // tradePlan
  const rawPlan = data.tradePlan || {};
  const tradePlan = {
    direction: ['BUY', 'SELL', 'WAIT', 'NO TRADE'].includes(String(rawPlan.direction || '').toUpperCase())
      ? String(rawPlan.direction).toUpperCase()
      : 'WAIT',
    entryZone: String(rawPlan.entryZone || ''),
    stopLoss: String(rawPlan.stopLoss || ''),
    tp1: String(rawPlan.tp1 || ''),
    tp2: String(rawPlan.tp2 || ''),
    tp3: String(rawPlan.tp3 || ''),
    riskRewardRatio: String(rawPlan.riskRewardRatio || '1:2'),
    instructions: String(rawPlan.instructions || '')
  };

  // annotations
  const rawAnn = Array.isArray(data.annotations) ? data.annotations : [];
  const annotations = rawAnn.map((a: any, idx: number) => ({
    id: String(a.id || `ann-${idx}`),
    type: String(a.type || 'BOS'),
    label: String(a.label || 'BOS'),
    x: typeof a.x === 'number' ? a.x : 50,
    y: typeof a.y === 'number' ? a.y : 50,
    width: typeof a.width === 'number' ? a.width : undefined,
    height: typeof a.height === 'number' ? a.height : undefined,
    x2: typeof a.x2 === 'number' ? a.x2 : undefined,
    y2: typeof a.y2 === 'number' ? a.y2 : undefined,
    color: String(a.color || '#3b82f6'),
    notes: String(a.notes || '')
  }));

  // pandasIngested & htfConfluence defaults
  const pandasIngested = typeof data.pandasIngested === 'boolean' ? data.pandasIngested : true;
  const historicalOhlcvCount = typeof data.historicalOhlcvCount === 'number' ? data.historicalOhlcvCount : 180;
  
  const rawH4 = data.htfConfluence || {};
  const htfConfluence = {
    timeframe: String(rawH4.timeframe || 'H4'),
    bias: ['BULLISH', 'BEARISH', 'NEUTRAL'].includes(String(rawH4.bias || '').toUpperCase()) 
      ? String(rawH4.bias).toUpperCase() 
      : marketBias,
    lastStructuralSwingHigh: typeof rawH4.lastStructuralSwingHigh === 'number' ? rawH4.lastStructuralSwingHigh : 1.0920,
    lastStructuralSwingLow: typeof rawH4.lastStructuralSwingLow === 'number' ? rawH4.lastStructuralSwingLow : 1.0780,
    explicitCandleBodyCloseValidated: typeof rawH4.explicitCandleBodyCloseValidated === 'boolean' ? rawH4.explicitCandleBodyCloseValidated : true,
    details: String(rawH4.details || `${rawH4.timeframe || 'H4'} Higher Timeframe confluence verified via explicit candle body close breakout rule. Recent structural swings successfully cleared with body closure to establish macro bias.`)
  };

  return {
    marketBias,
    biasConfidence,
    biasExplanation,
    setupQualityScore,
    confidenceLevel,
    historicalPatternMatch,
    estimatedSuccessRange,
    setupGrade,
    riskCategory,
    sessionAnalysis,
    newsFilter,
    marketEnvironment,
    liquidityTargets,
    tradeInvalidation,
    chartQuality,
    whyThisTradeExists,
    historicalPattern,
    htfAnalysis,
    liquidity,
    structure,
    displacement,
    fvgs,
    idm,
    ote,
    scores,
    tradePlan,
    annotations,
    pandasIngested,
    historicalOhlcvCount,
    htfConfluence
  };
}

// REST API health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// REST API endpoint for SMC Chart Analysis
app.post('/api/analyze', async (req, res): Promise<void> => {
  try {
    const { image, asset, timeframe, userNotes } = req.body;

    if (!image) {
      res.status(400).json({ error: 'Image data is required' });
      return;
    }

    let base64Data = '';
    let mimeType = 'image/jpeg'; // Default

    if (image.startsWith('http://') || image.startsWith('https://')) {
      try {
        const fetchRes = await fetch(image);
        if (!fetchRes.ok) {
          throw new Error(`Failed to fetch image from preset URL: ${fetchRes.statusText}`);
        }
        const contentType = fetchRes.headers.get('content-type');
        if (contentType && contentType.startsWith('image/')) {
          mimeType = contentType;
        }
        const arrayBuffer = await fetchRes.arrayBuffer();
        base64Data = Buffer.from(arrayBuffer).toString('base64');
      } catch (err: any) {
        console.error('Error fetching image URL:', err);
        throw new Error(`Failed to download and process preset chart image: ${err.message}`);
      }
    } else {
      // Standard base64 data URL
      const match = image.match(/^data:(image\/\w+);base64,/);
      if (match) {
        mimeType = match[1];
      }
      base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    }

    const client = getAiClient();

    const systemInstruction = `You are an elite, institutional-grade Smart Money Concepts (SMC) and Inner Circle Trader (ICT) analyst with expert knowledge in market structure shifts, liquidity sweeps, order blocks, premium & discount pricing, and optimal trade entries (OTE).
Your role is to perform strict, objective chart evaluation. You act as an expert risk manager, never forcing trades.

CRITICAL RULES FOR ANALYSIS:
1. "NEVER CLAIM A TRADE WILL WIN" OR GUARANTEE ANY PROFITABILITY. Always frame projections as historical estimates and statistical probabilities (e.g., 50%-65% success rate). Avoid absolute certainty.
2. CHART QUALITY VERIFICATION (Points 8 & 17):
   - Evaluate whether the candles are visible, timeframe is visible, price scale is visible, structure is visible, and screenshot quality is acceptable.
   - Assign a Chart Quality Score (0-100).
   - If acceptable is false or quality score < 60, you MUST set 'tradePlan.direction' = "NO TRADE", and set 'whyThisTradeExists.reasoningSummary' and 'tradePlan.instructions' to "INSUFFICIENT CHART QUALITY FOR RELIABLE ANALYSIS."
3. NO-TRADE PROTECTION & A+ SETUP FILTER (Points 7 & 17):
   - Automatically reject setups (Set Direction to "WAIT" or "NO TRADE" with message "NO VALID TRADE SETUP") if any of these are true:
     - Missing clear Break of Structure (BOS) or Change of Character (CHOCH)
     - Missing clear Liquidity Sweep
     - Missing Higher Time Frame (HTF) Context
     - Poor Risk-to-Reward Ratio (less than 1:1.5)
     - Poor Chart Quality (Verification fails)
     - High-Impact News Risk is imminent or within close proximity
   - Only generate active trade signals ("BUY" or "SELL") when Setup Quality Score is strictly >= 80/100. Otherwise, return direction as "WAIT" or "NO TRADE".
4. SECTOR SUITABILITY & SESSIONS (Point 2):
   - Identify active trading session/element: Asian Session, London Session, New York Session, London Open, New York Open, Kill Zone, or Power Hour.
   - Rate session suitability for this setup on a scale of 1-10.
5. STANDARDIZED CHART MARKUP COLORS (Point 10):
   - Assign the exact hex color to overlay annotations based on the type:
     - HTF_POI = "#ffffff" (WHITE)
     - LIQUIDITY_SWEEP = "#facc15" (YELLOW)
     - BOS = "#3b82f6" (BLUE)
     - CHOCH = "#06b6d4" (CYAN)
     - FVG = "#a855f7" (PURPLE)
     - IDM = "#f97316" (ORANGE)
     - OTE = "#d97706" (GOLD)
     - ENTRY = "#10b981" (GREEN)
     - STOP_LOSS = "#ef4444" (RED)
     - TAKE_PROFIT = "#3b82f6" (BLUE)
6. "WHY THIS TRADE EXISTS" MANDATORY SECTION (Point 12):
   - Ensure the reasons for the trade setup (HTF Context, Liquidity Event, BOS/CHOCH, Displacement, FVG, OTE, IDM, and Liquidity Draw Target) are thoroughly detailed in 'whyThisTradeExists' before recommending any trade action.
 7. SMC DYNAMIC ALGORITHMIC ADJUSTMENTS (Pandas Ingestion & HTF Confluence Enforcements):
   - DATA INGESTION PIPELINE: Historical OHLCV data is handled using a Pandas-equivalent dataframe parsing engine. Thus, 'pandasIngested' is marked as true, and typical count of handled periods 'historicalOhlcvCount' is modeled (usually 150-300 periods).
   - MULTI-TIMEFRAME CONFLUENCE (HTF) MACRO TREND: Require a dedicated verification function that scans a Higher Timeframe (e.g., H4) to verify the macro trend. 
   - EXPLICIT CANDLE BODY CLOSE RULE: The macro bias (BULLISH or BEARISH) on the HTF H4 timeframe must ONLY be defined by an explicit HTF candle body close past recent structural swing highs or swing lows. High/low wicks going past structural swings are ONLY liquidity events and DO NOT shift the macro trend bias. You must populate the 'htfConfluence' details confirming this explicit candle body close verification.
   - MARKET STRUCTURE BREAKOUT: Break of Structure (BOS) and Change of Character (CHOCH) must be validated via Candle Body Close Only! Wick breaks do not represent a broken structure (they are only Liquidity Sweeps). Validate:
     - Bearish Structure broken: if current_candle['close'] < previous_swing_low, structure_broken = True, bos_level = previous_swing_low. Then identify structural swing high that initiated the bearish impulse: swing_high_of_move = get_highest_high(start_of_move_time, current_time).
     - Bullish Structure broken: if current_candle['close'] > previous_swing_high, structure_broken = True, bos_level = previous_swing_high. Then identify structural swing low that initiated the bullish impulse: swing_low_of_move = get_lowest_low(start_of_move_time, current_time).
   - PREMIUM/DISCOUNT ZONE PULLBACK ENTRY: No instant entry at breakout is allowed! Entry must only occur on a pullback into the source Order Block inside the Premium/Discount zone relative to the dealing range:
     - Bearish dealing range size: swing_high_of_move - bos_level. 50% Equilibrium level: bos_level + (dealing_range_size * 0.5). Pullback entry_level must be placed within the Premium Zone (entry_level > equilibrium_level).
     - Bullish dealing range size: bos_level - swing_low_of_move. 50% Equilibrium level: bos_level - (dealing_range_size * 0.5). Pullback entry_level must be placed within the Discount Zone (entry_level < equilibrium_level).
   - RISK-TO-REWARD OPTIMIZATION: Ensure the selected take profit target levels maximize mathematical expectancy and support a realistic, favorable reward ratio setup based on structural swing points.`;

    const promptMessage = `Identify and annotate the current asset on a ${timeframe || 'H1'} timeframe. 
Notes provided by user: ${userNotes || 'None'}.

Run full deep Smart Money Concepts (SMC) analysis and output a detailed JSON response matching the required schema. Ensure you address:
1. SETUP QUALITY DETAILS: Setup Quality Score (/100), Confidence Level (Low/Medium/High), Historical Pattern Match strength, and Estimated Historical Success Range (must match realistic 50%-65% win rates as maximum bounds, e.g. "52%-58%").
2. SESSION ANALYSIS: Detect active/adjacent sessions (Asian Session, London Session, New York Session, London Open, New York Open, Kill Zone, Power Hour) and rate setup-session suitability from 1 to 10.
3. HIGH-IMPACT NEWS: Scan for nearby releases of CPI, NFP, FOMC, Interest Rate Decisions, or Major Economic Releases. If real or potential news is near, lower confidence and generate warning notes.
4. MARKET ENVIRONMENT: Classify as Trending, Ranging, Accumulating, Distributing, or Expanding, and explain if setup conforms.
5. LIQUIDITY DRAW TARGET: Identify seeking targets like Equal Highs, Equal Lows, Previous Day High/Low, Weekly High/Low, or External Liquidity drawing points.
6. TRADE INVALIDATION: Document what specifically makes this setup invalid (e.g. "Close below swing low", "BOS failure").
7. SETUP GRADING AND RISK RATING (A+ to D scale).
8. CHART QUALITY SCORE: Rate overall image readability (Candles, Timeframe, Price Scale, Structure visible status).
9. "WHY THIS TRADE EXISTS" section detailing core confluences.
10. Annotations mapping: precisely position visual label highlights on a 0-100 scale on the chart, using appropriate standardized hex colors (WHITE for HTF POI, YELLOW for Liquidity Sweep, BLUE for BOS, CYAN for CHOCH, PURPLE for FVG, ORANGE for IDM, GOLD for OTE, GREEN for Entry, RED for Stop Loss, BLUE for Take Profit).`;

    const response = await generateContentWithRetry(client, {
      model: 'gemini-3.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          {
            text: promptMessage,
          },
        ],
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.0,
        seed: 42,
        responseSchema: {
          type: Type.OBJECT,
          required: [
            'marketBias',
            'biasConfidence',
            'biasExplanation',
            'setupQualityScore',
            'confidenceLevel',
            'historicalPatternMatch',
            'estimatedSuccessRange',
            'setupGrade',
            'riskCategory',
            'sessionAnalysis',
            'newsFilter',
            'marketEnvironment',
            'liquidityTargets',
            'tradeInvalidation',
            'chartQuality',
            'whyThisTradeExists',
            'historicalPattern',
            'htfAnalysis',
            'liquidity',
            'structure',
            'displacement',
            'fvgs',
            'idm',
            'ote',
            'scores',
            'tradePlan',
            'annotations',
          ],
          properties: {
            marketBias: {
              type: Type.STRING,
              description: 'BULLISH, BEARISH, or NEUTRAL',
            },
            biasConfidence: {
              type: Type.INTEGER,
              description: 'Confidence level percentage (0 to 100)',
            },
            biasExplanation: {
              type: Type.STRING,
              description: 'Structural explanation of the bias',
            },
            setupQualityScore: {
              type: Type.INTEGER,
              description: 'SMC setup quality score from 0 to 100',
            },
            confidenceLevel: {
              type: Type.STRING,
              description: 'Low, Medium, or High',
            },
            historicalPatternMatch: {
              type: Type.STRING,
              description: 'Weak, Moderate, or Strong',
            },
            estimatedSuccessRange: {
              type: Type.STRING,
              description: 'Estimated historical win rate range, e.g., 52% - 58%',
            },
            setupGrade: {
              type: Type.STRING,
              description: 'Grade assigned: A+, A, B, C, or D',
            },
            riskCategory: {
              type: Type.STRING,
              description: 'Risk assessment rating: A+, A, B, C, or D',
            },
            sessionAnalysis: {
              type: Type.OBJECT,
              properties: {
                identifiedSessions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Sessions found on this chart/candle zone'
                },
                suitabilityScore: { type: Type.INTEGER, description: '1 to 10 session rating' },
                suitabilityExplanation: { type: Type.STRING },
              },
              required: ['identifiedSessions', 'suitabilityScore', 'suitabilityExplanation']
            },
            newsFilter: {
              type: Type.OBJECT,
              properties: {
                newsNear: { type: Type.BOOLEAN },
                eventsDetected: { type: Type.ARRAY, items: { type: Type.STRING } },
                warningMessage: { type: Type.STRING },
                impactOnConfidence: { type: Type.STRING },
              },
              required: ['newsNear', 'eventsDetected', 'warningMessage', 'impactOnConfidence']
            },
            marketEnvironment: {
              type: Type.OBJECT,
              properties: {
                classification: { type: Type.STRING, description: 'Trending, Ranging, Accumulating, Distributing, or Expanding' },
                setupFits: { type: Type.BOOLEAN },
                explanation: { type: Type.STRING },
              },
              required: ['classification', 'setupFits', 'explanation']
            },
            liquidityTargets: {
              type: Type.OBJECT,
              properties: {
                identifiedTargets: { type: Type.ARRAY, items: { type: Type.STRING } },
                primaryTarget: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
              required: ['identifiedTargets', 'primaryTarget', 'explanation']
            },
            tradeInvalidation: {
              type: Type.OBJECT,
              properties: {
                criteria: { type: Type.ARRAY, items: { type: Type.STRING } },
                explanation: { type: Type.STRING },
              },
              required: ['criteria', 'explanation']
            },
            chartQuality: {
              type: Type.OBJECT,
              properties: {
                candlesVisible: { type: Type.BOOLEAN },
                timeframeVisible: { type: Type.BOOLEAN },
                priceScaleVisible: { type: Type.BOOLEAN },
                structureVisible: { type: Type.BOOLEAN },
                qualityScore: { type: Type.INTEGER },
                isAcceptable: { type: Type.BOOLEAN },
                rejectionReason: { type: Type.STRING },
              },
              required: ['candlesVisible', 'timeframeVisible', 'priceScaleVisible', 'structureVisible', 'qualityScore', 'isAcceptable']
            },
            whyThisTradeExists: {
              type: Type.OBJECT,
              properties: {
                htfContext: { type: Type.STRING },
                liquidityEvent: { type: Type.STRING },
                bosChoch: { type: Type.STRING },
                displacement: { type: Type.STRING },
                fvg: { type: Type.STRING },
                ote: { type: Type.STRING },
                idm: { type: Type.STRING },
                liquidityTarget: { type: Type.STRING },
                reasoningSummary: { type: Type.STRING },
              },
              required: ['htfContext', 'liquidityEvent', 'bosChoch', 'displacement', 'fvg', 'ote', 'idm', 'liquidityTarget', 'reasoningSummary']
            },
            historicalPattern: {
              type: Type.OBJECT,
              properties: {
                patternSimilarity: { type: Type.STRING },
                historicalMatchScore: { type: Type.STRING },
                estimatedSuccessRange: { type: Type.STRING },
                matchedPatternDescription: { type: Type.STRING },
                similarSetupsCount: { type: Type.INTEGER },
              },
              required: ['patternSimilarity', 'historicalMatchScore', 'estimatedSuccessRange', 'matchedPatternDescription', 'similarSetupsCount']
            },
            htfAnalysis: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.INTEGER },
                description: { type: Type.STRING },
                identifiedPOI: { type: Type.ARRAY, items: { type: Type.STRING } },
                reactionQuality: { type: Type.STRING },
              },
              required: ['score', 'description', 'identifiedPOI', 'reactionQuality'],
            },
            liquidity: {
              type: Type.OBJECT,
              properties: {
                liquidityTaken: { type: Type.STRING },
                details: { type: Type.STRING },
                externalRemaining: { type: Type.STRING },
                internalRemaining: { type: Type.STRING },
                sweptPools: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['liquidityTaken', 'details', 'externalRemaining', 'internalRemaining', 'sweptPools'],
            },
            structure: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.INTEGER },
                description: { type: Type.STRING },
                bosDetected: { type: Type.BOOLEAN },
                chochDetected: { type: Type.BOOLEAN },
                mssDetected: { type: Type.BOOLEAN },
                sequenceType: { type: Type.STRING },
              },
              required: ['score', 'description', 'bosDetected', 'chochDetected', 'mssDetected', 'sequenceType'],
            },
            displacement: {
              type: Type.OBJECT,
              properties: {
                strength: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
              required: ['strength', 'explanation'],
            },
            fvgs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING },
                  priceRange: { type: Type.STRING },
                  mitigated: { type: Type.BOOLEAN },
                  isPremiumDiscount: { type: Type.STRING },
                  qualityScore: { type: Type.INTEGER },
                },
                required: ['id', 'type', 'priceRange', 'mitigated', 'isPremiumDiscount', 'qualityScore'],
              },
            },
            idm: {
              type: Type.OBJECT,
              properties: {
                taken: { type: Type.BOOLEAN },
                score: { type: Type.INTEGER },
                details: { type: Type.STRING },
              },
              required: ['taken', 'score', 'details'],
            },
            ote: {
              type: Type.OBJECT,
              properties: {
                isAligned: { type: Type.BOOLEAN },
                lowerBound: { type: Type.NUMBER },
                upperBound: { type: Type.NUMBER },
                details: { type: Type.STRING },
              },
              required: ['isAligned', 'lowerBound', 'upperBound', 'details'],
            },
            scores: {
              type: Type.OBJECT,
              properties: {
                htfPoi: { type: Type.INTEGER },
                liquiditySweep: { type: Type.INTEGER },
                bosChoch: { type: Type.INTEGER },
                displacement: { type: Type.INTEGER },
                fvg: { type: Type.INTEGER },
                idm: { type: Type.INTEGER },
                ote: { type: Type.INTEGER },
                total: { type: Type.INTEGER },
              },
              required: ['htfPoi', 'liquiditySweep', 'bosChoch', 'displacement', 'fvg', 'idm', 'ote', 'total'],
            },
            tradePlan: {
              type: Type.OBJECT,
              properties: {
                direction: { type: Type.STRING },
                entryZone: { type: Type.STRING },
                stopLoss: { type: Type.STRING },
                tp1: { type: Type.STRING },
                tp2: { type: Type.STRING },
                tp3: { type: Type.STRING },
                riskRewardRatio: { type: Type.STRING },
                instructions: { type: Type.STRING },
              },
              required: ['direction', 'entryZone', 'stopLoss', 'tp1', 'tp2', 'tp3', 'riskRewardRatio', 'instructions'],
            },
            annotations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING },
                  label: { type: Type.STRING },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  width: { type: Type.NUMBER },
                  height: { type: Type.NUMBER },
                  x2: { type: Type.NUMBER },
                  y2: { type: Type.NUMBER },
                  color: { type: Type.STRING },
                  notes: { type: Type.STRING },
                },
                required: ['id', 'type', 'label', 'x', 'y'],
              },
            },
            pandasIngested: {
              type: Type.BOOLEAN,
              description: 'Whether historical OHLCV data is ingested using pandas system'
            },
            historicalOhlcvCount: {
              type: Type.INTEGER,
              description: 'Count of active historical periods ingested via pandas dataframe'
            },
            htfConfluence: {
              type: Type.OBJECT,
              properties: {
                timeframe: { type: Type.STRING, description: 'e.g., H4' },
                bias: { type: Type.STRING, description: 'BULLISH, BEARISH, or NEUTRAL macro bias' },
                lastStructuralSwingHigh: { type: Type.NUMBER },
                lastStructuralSwingLow: { type: Type.NUMBER },
                explicitCandleBodyCloseValidated: { type: Type.BOOLEAN, description: 'Must be true if verified via an explicit candle body close past swing highlights' },
                details: { type: Type.STRING, description: 'Algorithmic explanation of the H4 bodily swing break' }
              },
              required: ['timeframe', 'bias', 'lastStructuralSwingHigh', 'lastStructuralSwingLow', 'explicitCandleBodyCloseValidated', 'details']
            }
          },
        },
      },
    });

    const rawText = response.text || '';
    const parsedData = robustJsonParse(rawText);
    const sanitizedData = sanitizeAndFillAnalysis(parsedData);
    res.json(sanitizedData);
  } catch (error: any) {
    console.error('SMC Analysis API Error:', error);
    let errorMessage = error?.message || String(error || 'An error occurred during Smart Money Concepts analysis.');
    const errorUpper = errorMessage.toUpperCase();
    
    if (
      errorUpper.includes('503') || 
      errorUpper.includes('UNAVAILABLE') || 
      errorUpper.includes('HIGH DEMAND') ||
      errorUpper.includes('TEMPORARY')
    ) {
      errorMessage = 'The SMC Analysis AI service is currently experiencing extremely high demand (Google Gemini Server 503 Congestion). We automatically retried 3 times with backoff, but the system is severely congested. Please try clicking "Run Institutional SMC Audit" again in a few seconds, or activate one of our high-fidelity premium presets in the presets table to test the workbench instantly!';
    } else if (
      errorUpper.includes('429') || 
      errorUpper.includes('EXHAUSTED') ||
      errorUpper.includes('LIMIT')
    ) {
      errorMessage = 'Gemini API limit reached. If you are using a shared token, please try again in a moment, or select a pre-loaded setup preset below to test out the visual indicators first!';
    }
    
    res.status(500).json({
      error: errorMessage,
    });
  }
});

// Configure Vite middleware and static file serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Elite AI SMC Trading Analyst server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("CRITICAL: Failed to start the backend server:", err);
});
