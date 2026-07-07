/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Represents the overall direction of the market bias.
 */
export type MarketBiasType = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

/**
 * Represents the strength of structural displacement.
 */
export type DisplacementStrengthType = 'Weak' | 'Moderate' | 'Strong' | 'Institutional';

/**
 * Represents the classification of the current market environment.
 */
export type MarketEnvironmentClassificationType = 'Trending' | 'Ranging' | 'Accumulating' | 'Distributing' | 'Expanding';

/**
 * Represents setup score quality grades.
 */
export type SetupGradeType = 'A+' | 'A' | 'B' | 'C' | 'D';

/**
 * Represents confidence assessment categories.
 */
export type ConfidenceLevelType = 'Low' | 'Medium' | 'High';

/**
 * Represents the strength of a historical pattern match.
 */
export type HistoricalMatchScoreType = 'Weak' | 'Moderate' | 'Strong';

/**
 * Represents the trading direction inside the trading plan.
 */
export type TradePlanDirectionType = 'BUY' | 'SELL' | 'WAIT' | 'NO TRADE';

/**
 * Represents structural element types that can be highlighted on a chart overlay.
 */
export type SMCOverlayType =
  | 'BOS'
  | 'CHOCH'
  | 'MSS'
  | 'FVG'
  | 'ORDER_BLOCK'
  | 'BREAKER'
  | 'LIQUIDITY_SWEEP'
  | 'HTF_POI'
  | 'IDM'
  | 'OTE'
  | 'PREMIUM'
  | 'DISCOUNT'
  | 'ENTRY'
  | 'STOP_LOSS'
  | 'TAKE_PROFIT'
  | 'DIRECTIONAL_ARROW';

/**
 * Individual overlay element for annotating trading chart visuals.
 */
export interface SMCOverlayElement {
  /** Unique ID of the overlay element */
  id: string;
  /** Type of Smart Money Concept represented */
  type: SMCOverlayType;
  /** Label text for display */
  label: string;
  /** Percent-based X coordinate on the chart canvas (0 to 100) */
  x: number;
  /** Percent-based Y coordinate on the chart canvas (0 to 100) */
  y: number;
  /** Optional percent-based width */
  width?: number;
  /** Optional percent-based height */
  height?: number;
  /** Optional percent-based secondary X coordinate (for lines/arrows) */
  x2?: number;
  /** Optional percent-based secondary Y coordinate (for lines/arrows) */
  y2?: number;
  /** Optional visual color override hex code or Tailwind class */
  color?: string;
  /** Custom annotations and contextual developer notes */
  notes?: string;
}

/**
 * Detailed metrics and boundaries of an identified Fair Value Gap (FVG).
 */
export interface FVGDetails {
  /** Unique identifier for the gap element */
  id: string;
  /** The direction of the Fair Value Gap */
  type: 'BULLISH' | 'BEARISH';
  /** Human-readable price boundaries (e.g., "1.0830 - 1.0845") */
  priceRange: string;
  /** True if the gap has been previously filled/mitigated by price action */
  mitigated: boolean;
  /** Premium or discount zone alignment of the gap */
  isPremiumDiscount: 'PREMIUM' | 'DISCOUNT' | 'NONE';
  /** Weighted gap quality score from 1 (Weakest) to 10 (Strongest) */
  qualityScore: number;
}

/**
 * Represents a complete Smart Money Concepts analysis response schema.
 */
export interface SMCAnalysisResponse {
  /** Market direction bias */
  marketBias: MarketBiasType;
  /** Numeric confidence percentage for the current bias (0-100) */
  biasConfidence: number;
  /** Contextual explanation supporting the designated bias */
  biasExplanation: string;
  /** Calculated baseline rating score out of 100 */
  setupQualityScore: number;
  /** Level of confidence calculated from multiple confluent data sources */
  confidenceLevel: ConfidenceLevelType;
  /** Historic match strength rating */
  historicalPatternMatch: HistoricalMatchScoreType;
  /** Statistical win-probability range as a string */
  estimatedSuccessRange: string;
  /** Assigned setup quality grade letters */
  setupGrade: SetupGradeType;
  /** Risk tier category mapping */
  riskCategory: SetupGradeType;

  /** Session metrics indicating trade viability during active market trading hours */
  sessionAnalysis: {
    /** Overlapping sessions detected during execution */
    identifiedSessions: string[];
    /** Score out of 10 representing session alignment */
    suitabilityScore: number;
    /** Descriptive explanation of trading hour alignment */
    suitabilityExplanation: string;
  };

  /** News and geopolitical filter information surrounding the instrument */
  newsFilter: {
    /** True if high impact news events are active/upcoming near execution */
    newsNear: boolean;
    /** Names of high impact events detected */
    eventsDetected: string[];
    /** Specific warnings or countdown timers */
    warningMessage?: string;
    /** Risk scaling adjustment notes due to news high-impact events */
    impactOnConfidence: string;
  };

  /** Environmental classification details */
  marketEnvironment: {
    /** Pattern/Structure phase designation */
    classification: MarketEnvironmentClassificationType;
    /** True if the identified setup fits the structural phase safely */
    setupFits: boolean;
    /** Context explaining why the setup matches the current environment */
    explanation: string;
  };

  /** Intraday/Swing level targets representing target zones for liquidity sweeps */
  liquidityTargets: {
    /** Array of identified swing points or pools */
    identifiedTargets: string[];
    /** Specific highest priority sweep target */
    primaryTarget: string;
    /** Rationale for targeting specific price levels */
    explanation: string;
  };

  /** Key trigger zones or actions that invalidate the current technical bias */
  tradeInvalidation: {
    /** Array of explicit invalidation price levels or criteria */
    criteria: string[];
    /** Broad explanation protecting capital from failed continuation runs */
    explanation: string;
  };

  /** Analytical health check on the uploaded chart data */
  chartQuality: {
    /** Visibility of candles on the chart */
    candlesVisible: boolean;
    /** Visibility of the timeframe descriptor */
    timeframeVisible: boolean;
    /** Visibility of the price scale on the axis */
    priceScaleVisible: boolean;
    /** Visibility of clear structural patterns */
    structureVisible: boolean;
    /** Quality checklist score from 0 to 100 */
    qualityScore: number;
    /** True if the chart passes the structural validation gate */
    isAcceptable: boolean;
    /** Stated reasons for failed parsing or structural exclusions */
    rejectionReason?: string;
  };

  /** Contextual checklist answering core SMC requirements */
  whyThisTradeExists: {
    /** Context for the high-timeframe points of interest */
    htfContext: string;
    /** Description of the sweep event triggers */
    liquidityEvent: string;
    /** Explanatory description of the structural break (BOS/CHoCH) */
    bosChoch: string;
    /** Visual acceleration description */
    displacement: string;
    /** Analysis of the primary Fair Value Gaps */
    fvg: string;
    /** Golden pocket fib alignment comments */
    ote: string;
    /** Description of inducement sweeps */
    idm: string;
    /** Ultimate targets for active orders */
    liquidityTarget: string;
    /** Concise rationale matching all structural elements */
    reasoningSummary: string;
  };

  /** Details on closest matching historical setup profiles */
  historicalPattern: {
    /** Exact similarity match percentage */
    patternSimilarity: string;
    /** Qualitative historical confidence rating */
    historicalMatchScore: HistoricalMatchScoreType;
    /** Historical success window percentage */
    estimatedSuccessRange: string;
    /** Description of the closest matched historical pattern template */
    matchedPatternDescription: string;
    /** Number of matching historic setups detected in the dataset */
    similarSetupsCount: number;
  };

  /** Detailed analysis of high timeframe order flow and structure alignment */
  htfAnalysis: {
    /** High timeframe score out of 10 */
    score: number;
    /** Detailed description of high timeframe context */
    description: string;
    /** Identified high timeframe points of interest (POIs) */
    identifiedPOI: string[];
    /** Rating of POI mitigation quality */
    reactionQuality: string;
  };

  /** Liquidity sweep analysis */
  liquidity: {
    /** Indicates if internal or external liquidity has been swept prior to entry */
    liquidityTaken: 'YES' | 'NO';
    /** Detailed breakdown of liquidity sweep context */
    details: string;
    /** Remaining external range liquidity points */
    externalRemaining: string;
    /** Remaining internal structure liquidity points */
    internalRemaining: string;
    /** Array of swept high/low pools */
    sweptPools: string[];
  };

  /** Structural breakout sequence */
  structure: {
    /** Score out of 10 representing structural alignment strength */
    score: number;
    /** Descriptive explanation of current swing structures */
    description: string;
    /** True if a Break of Structure is detected */
    bosDetected: boolean;
    /** True if a Change of Character is detected */
    chochDetected: boolean;
    /** True if Market Structure Shift is detected */
    mssDetected: boolean;
    /** Sequence type */
    sequenceType: string;
  };

  /** Strong physical momentum analysis */
  displacement: {
    /** Relative strength category of physical displacement candles */
    strength: DisplacementStrengthType;
    /** Technical explanation supporting displacement assessment */
    explanation: string;
  };

  /** Array of active Fair Value Gaps details */
  fvgs: FVGDetails[];

  /** Inducement analysis details */
  idm: {
    /** True if inducement level has been swept */
    taken: boolean;
    /** Quality score out of 10 */
    score: number;
    /** Detailed commentary on inducement conditions */
    details: string;
  };

  /** Optimal Trade Entry alignment analysis */
  ote: {
    /** True if entry zone aligns perfectly inside the OTE (0.62 - 0.79) retracement fibs */
    isAligned: boolean;
    /** Lower bound Fibonacci level (typically 0.62) */
    lowerBound: number;
    /** Upper bound Fibonacci level (typically 0.79) */
    upperBound: number;
    /** Detailed description of OTE parameter alignment */
    details: string;
  };

  /** Comprehensive breakdown of all weighted checklist scores */
  scores: {
    /** HTF POI Weight (Max 20) */
    htfPoi: number;
    /** Liquidity Sweep Weight (Max 15) */
    liquiditySweep: number;
    /** Break of Structure / CHoCH Weight (Max 20) */
    bosChoch: number;
    /** Candle Displacement momentum Weight (Max 15) */
    displacement: number;
    /** FVG gaps presence Weight (Max 15) */
    fvg: number;
    /** Inducement sweep Weight (Max 5) */
    idm: number;
    /** OTE Fib Alignment Weight (Max 10) */
    ote: number;
    /** Unified total confluence score (Max 100) */
    total: number;
  };

  /** Direct executable action plan */
  tradePlan: {
    /** Stated order direction to trigger */
    direction: TradePlanDirectionType;
    /** Executable premium/discount buy/sell entry price range */
    entryZone: string;
    /** Limit boundary representing immediate trade invalidation trigger */
    stopLoss: string;
    /** Primary Take Profit target */
    tp1: string;
    /** Secondary Take Profit target */
    tp2: string;
    /** Runner/Target Take Profit */
    tp3: string;
    /** Computed risk reward representation ratio */
    riskRewardRatio: string;
    /** Direct step-by-step instructions for trade management */
    instructions: string;
  };

  /** Canvas elements rendered dynamically above chart upload overlays */
  annotations: SMCOverlayElement[];

  /** Algorithmic Ingestion & Confluence Verification variables */
  pandasIngested?: boolean;
  historicalOhlcvCount?: number;
  htfConfluence?: {
    timeframe: string;
    bias: MarketBiasType;
    lastStructuralSwingHigh: number;
    lastStructuralSwingLow: number;
    explicitCandleBodyCloseValidated: boolean;
    details: string;
  };
}

/**
 * Configuration payload representing trader evaluation accounts on proprietary funding firms.
 */
export interface AccountGrowthConfig {
  /** Starting evaluation account balance (e.g. 100000) */
  balance: number;
  /** Allocated percent risk per single position (e.g. 0.5) */
  riskPercent: number;
  /** Profit target goal requested by the fund (e.g. 108000) */
  targetBalance: number;
  /** Anticipated average position Risk-to-Reward ratio */
  expectedRR: number;
  /** Long-term validated setup win-rate percentage (e.g. 55) */
  winRate: number;
}

/**
 * Result metrics evaluating probability profiles to pass prop firm challenges.
 */
export interface AccountGrowthResult {
  /** Currency value risked per individual position */
  riskAmount: number;
  /** Calculated safe contract size sizing for trade deployment */
  recommendedLotSize: number;
  /** Exact count of consecutive winning positions required to meet targets */
  winningTradesRequired: number;
  /** Projected monthly compound growth potential */
  expectedMonthlyGrowth: number;
  /** Estimated duration in active trading days to pass challenges */
  daysRequired: number;
  /** Detailed progressive scenarios based on historical trader volatility */
  scenarios: {
    /** Conservative trading scenario limits */
    conservative: { wins: number; final: number; timeDays: number };
    /** Normal expected distribution bounds */
    moderate: { wins: number; final: number; timeDays: number };
    /** Aggressive highly positive outlier conditions */
    aggressive: { wins: number; final: number; timeDays: number };
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Utility Type representing partial, incomplete response payload data.
 * Ideal for incremental loading or API streaming scenarios.
 */
export type PartialSMCAnalysisResponse = {
  [K in keyof SMCAnalysisResponse]?: SMCAnalysisResponse[K] extends object
    ? Partial<SMCAnalysisResponse[K]>
    : SMCAnalysisResponse[K];
};

/**
 * Utility Type to enforce strict execution rules across nested child models.
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

// ============================================================================
// TYPE GUARDS & RUNTIME VALIDATORS
// ============================================================================

/**
 * Runtime Type Guard confirming strings are valid MarketBiasType values.
 */
export function isMarketBiasType(value: any): value is MarketBiasType {
  return value === 'BULLISH' || value === 'BEARISH' || value === 'NEUTRAL';
}

/**
 * Runtime Type Guard confirming strings conform to DisplacementStrengthType.
 */
export function isDisplacementStrengthType(value: any): value is DisplacementStrengthType {
  return value === 'Weak' || value === 'Moderate' || value === 'Strong' || value === 'Institutional';
}

/**
 * Runtime Type Guard confirming strings conform to MarketEnvironmentClassificationType.
 */
export function isMarketEnvironmentClassificationType(value: any): value is MarketEnvironmentClassificationType {
  return value === 'Trending' || value === 'Ranging' || value === 'Accumulating' || value === 'Distributing' || value === 'Expanding';
}

/**
 * Runtime Type Guard confirming strings conform to SetupGradeType.
 */
export function isSetupGradeType(value: any): value is SetupGradeType {
  return value === 'A+' || value === 'A' || value === 'B' || value === 'C' || value === 'D';
}

/**
 * Runtime Type Guard confirming strings conform to ConfidenceLevelType.
 */
export function isConfidenceLevelType(value: any): value is ConfidenceLevelType {
  return value === 'Low' || value === 'Medium' || value === 'High';
}

/**
 * Runtime Type Guard confirming strings conform to TradePlanDirectionType.
 */
export function isTradePlanDirectionType(value: any): value is TradePlanDirectionType {
  return value === 'BUY' || value === 'SELL' || value === 'WAIT' || value === 'NO TRADE';
}
