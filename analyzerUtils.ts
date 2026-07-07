/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { SMCAnalysisResponse, SMCOverlayElement } from '../types';

// ============================================================================
// 1. ANALYSIS CACHE
// ============================================================================

/**
 * A FIFO-based Cache to store and retrieve SMC analysis results by image hashes.
 * Ensures that redundant API requests are avoided and limits memory consumption
 * to a maximum of 50 items.
 */
export class AnalysisCache {
  private cache = new Map<string, SMCAnalysisResponse>();
  private order: string[] = [];
  private readonly maxLimit = 50;
  private hits = 0;
  private misses = 0;

  /**
   * Generates a fast, synchronous non-cryptographic hash (DJB2) from string or ArrayBuffer data.
   * Can be used to create keys for cached analysis reports.
   */
  public generateKey(input: string | ArrayBuffer): string {
    if (typeof input === 'string') {
      let hash = 5381;
      for (let i = 0; i < input.length; i++) {
        hash = (hash * 33) ^ input.charCodeAt(i);
      }
      return (hash >>> 0).toString(16);
    } else {
      const view = new DataView(input);
      let hash = 5381;
      for (let i = 0; i < view.byteLength; i++) {
        hash = (hash * 33) ^ view.getUint8(i);
      }
      return (hash >>> 0).toString(16);
    }
  }

  /**
   * Retrieves an item from the cache. Increments cache hit or miss statistics.
   */
  public get(key: string): SMCAnalysisResponse | undefined {
    const result = this.cache.get(key);
    if (result !== undefined) {
      this.hits++;
      return result;
    }
    this.misses++;
    return undefined;
  }

  /**
   * Stores an item in the cache. Evicts the oldest item (FIFO) if capacity of 50 is exceeded.
   */
  public set(key: string, value: SMCAnalysisResponse): void {
    if (this.cache.has(key)) {
      // Re-order for FIFO or update
      this.cache.set(key, value);
      return;
    }

    if (this.order.length >= this.maxLimit) {
      const oldestKey = this.order.shift();
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, value);
    this.order.push(key);
  }

  /**
   * Checks if an item exists in the cache without registering hits/misses.
   */
  public has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Clears the cache and resets internal metrics.
   */
  public clear(): void {
    this.cache.clear();
    this.order = [];
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Returns current cache telemetry stats for debugging and optimization analysis.
   */
  public getStats() {
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      maxCapacity: this.maxLimit,
      hitRate: this.hits + this.misses > 0 
        ? parseFloat(((this.hits / (this.hits + this.misses)) * 100).toFixed(2)) 
        : 0
    };
  }
}

// ============================================================================
// 2. DEBOUNCE FUNCTION
// ============================================================================

/**
 * Creates a debounced function that delays invoking `func` until after `wait` 
 * milliseconds have elapsed since the last time the debounced function was invoked.
 * Provides a `cancel()` method to discard any pending executions.
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };

  debounced.cancel = () => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}

// ============================================================================
// 3. THROTTLE FUNCTION
// ============================================================================

/**
 * Creates a throttled function that only invokes `func` at most once per 
 * `limit` milliseconds. Ensures both immediate execution on first call 
 * and trailing execution on final updates.
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastRan = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = limit - (now - lastRan);

    if (remaining <= 0 || remaining > limit) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      lastRan = now;
      func(...args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        lastRan = Date.now();
        timeout = null;
        func(...args);
      }, remaining);
    }
  };
}

// ============================================================================
// 4. SCORE HELPERS
// ============================================================================

/**
 * Returns a human-friendly text descriptor for a specific confluence score.
 */
export function getScoreDescriptor(score: number): string {
  if (score >= 90) return 'Exceptional A+ Setup';
  if (score >= 80) return 'High Probability A Grade';
  if (score >= 70) return 'Tradable Setup B Grade';
  if (score >= 60) return 'Moderate Confluence C Grade';
  if (score >= 50) return 'Low Confluence D Grade';
  return 'Sub-Standard / Avoid';
}

/**
 * Returns Tailwind text color classes based on setup/confluence scores.
 */
export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-400';
  if (score >= 80) return 'text-teal-400';
  if (score >= 70) return 'text-sky-400';
  if (score >= 60) return 'text-amber-400';
  if (score >= 50) return 'text-orange-400';
  return 'text-rose-400';
}

/**
 * Returns Tailwind text color classes matching confidence ratings (High, Medium, Low).
 */
export function getConfidenceColor(level: string): string {
  const normalized = level.toLowerCase().trim();
  if (normalized === 'high' || normalized === 'strong') {
    return 'text-emerald-400';
  }
  if (normalized === 'medium' || normalized === 'moderate') {
    return 'text-sky-400';
  }
  return 'text-rose-400';
}

// ============================================================================
// 5. PERFORMANCE MONITOR
// ============================================================================

/**
 * Utility class to track code execution and rendering durations.
 * Logs performance metrics to the console in development mode only.
 */
export class PerformanceMonitor {
  private static marks = new Map<string, number>();

  /**
   * Starts a performance measurement under a specific unique label.
   */
  public static start(label: string): void {
    if (process.env.NODE_ENV !== 'production') {
      this.marks.set(label, performance.now());
    }
  }

  /**
   * Completes a performance measurement and prints the duration if in development.
   */
  public static end(label: string): number {
    if (process.env.NODE_ENV !== 'production') {
      const startTime = this.marks.get(label);
      if (startTime !== undefined) {
        const duration = performance.now() - startTime;
        console.log(`[PerfMonitor] ${label} took ${duration.toFixed(2)}ms`);
        return duration;
      }
    }
    return 0;
  }

  /**
   * Reports the current status of all pending/recorded performance labels.
   */
  public static reportAll(): void {
    if (process.env.NODE_ENV !== 'production') {
      console.log('--- [PerfMonitor] ACTIVE METRIC MARKS ---');
      this.marks.forEach((time, label) => {
        console.log(`- ${label}: registered at relative ${time.toFixed(2)}ms`);
      });
      console.log('-----------------------------------------');
    }
  }
}

// ============================================================================
// 6. IMAGE COMPRESSION
// ============================================================================

/**
 * Compress images before uploading to the API to reduce load times,
 * save bandwith, and prevent rate limits or payload size errors.
 * Re-scales images to a maximum boundary of 1920x1080 while fully preserving
 * original aspect ratio, then exports as standard 0.8 JPEG.
 */
export async function compressImage(imageFile: File | Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      const maxWidth = 1920;
      const maxHeight = 1080;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(img.src);
        reject(new Error('Could not obtain canvas 2D render context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(img.src);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas exporting generated a null image blob'));
          }
        },
        'image/jpeg',
        0.8
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(img.src);
      reject(err);
    };

    img.src = URL.createObjectURL(imageFile);
  });
}

// ============================================================================
// 7. BATCH PROCESSOR
// ============================================================================

/**
 * Processes an array of items in batches with configurable delay to prevent API rate limits.
 * Default settings: Batch size of 3 items, 1000ms delay between batch completions.
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  batchSize = 3,
  delayMs = 1000
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchPromises = batch.map((item, index) => processor(item, i + index));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Apply delay only if there are more batches remaining
    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}

// ============================================================================
// 8. ANALYSIS TYPE GUARD
// ============================================================================

/**
 * TypeScript Type Guard ensuring the provided response matches the comprehensive
 * `SMCAnalysisResponse` interface structure.
 */
export function isValidAnalysis(obj: any): obj is SMCAnalysisResponse {
  if (!obj || typeof obj !== 'object') return false;

  const requiredStrFields = [
    'marketBias',
    'biasExplanation',
    'confidenceLevel',
    'historicalPatternMatch',
    'estimatedSuccessRange',
    'setupGrade',
    'riskCategory'
  ];

  for (const key of requiredStrFields) {
    if (typeof obj[key] !== 'string') return false;
  }

  if (typeof obj.biasConfidence !== 'number') return false;
  if (typeof obj.setupQualityScore !== 'number') return false;

  // Verify child structures exist and are correct types
  const requiredSubObjects = [
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
    'idm',
    'ote',
    'scores',
    'tradePlan'
  ];

  for (const key of requiredSubObjects) {
    if (!obj[key] || typeof obj[key] !== 'object') return false;
  }

  if (!Array.isArray(obj.fvgs)) return false;
  if (!Array.isArray(obj.annotations)) return false;

  return true;
}

// ============================================================================
// 9. NORMALIZE ANALYSIS
// ============================================================================

/**
 * Safe baseline fallback representing a complete blank-state SMCAnalysisResponse.
 */
export const DEFAULT_SMC_ANALYSIS: SMCAnalysisResponse = {
  marketBias: 'NEUTRAL',
  biasConfidence: 50,
  biasExplanation: 'Analysis bias could not be determined. Insufficient confluence data.',
  setupQualityScore: 50,
  confidenceLevel: 'Medium',
  historicalPatternMatch: 'Weak',
  estimatedSuccessRange: '45%-55%',
  setupGrade: 'C',
  riskCategory: 'C',
  sessionAnalysis: {
    identifiedSessions: [],
    suitabilityScore: 5,
    suitabilityExplanation: 'Session alignment unspecified.'
  },
  newsFilter: {
    newsNear: false,
    eventsDetected: [],
    warningMessage: '',
    impactOnConfidence: 'None'
  },
  marketEnvironment: {
    classification: 'Ranging',
    setupFits: false,
    explanation: 'Market environment not specified.'
  },
  liquidityTargets: {
    identifiedTargets: [],
    primaryTarget: 'Liquidity Pools',
    explanation: 'Targets not specified.'
  },
  tradeInvalidation: {
    criteria: [],
    explanation: 'Invalidation parameters not set.'
  },
  chartQuality: {
    candlesVisible: true,
    timeframeVisible: true,
    priceScaleVisible: true,
    structureVisible: true,
    qualityScore: 100,
    isAcceptable: true
  },
  whyThisTradeExists: {
    htfContext: 'No high timeframe POI identified.',
    liquidityEvent: 'No major liquidity sweeps detected.',
    bosChoch: 'No structural shift/break identified.',
    displacement: 'No displacement observed.',
    fvg: 'No Fair Value Gaps identified.',
    ote: 'No Optimal Trade Entry alignment.',
    idm: 'No Inducement identified.',
    liquidityTarget: 'No targets identified.',
    reasoningSummary: 'No trade rationale established.'
  },
  historicalPattern: {
    patternSimilarity: '0%',
    historicalMatchScore: 'Weak',
    estimatedSuccessRange: '45% - 50%',
    matchedPatternDescription: 'No historical pattern matched.',
    similarSetupsCount: 0
  },
  htfAnalysis: {
    score: 5,
    description: 'High timeframe alignment unspecified.',
    identifiedPOI: [],
    reactionQuality: 'Low'
  },
  liquidity: {
    liquidityTaken: 'NO',
    details: 'Liquidity levels unspecified.',
    externalRemaining: 'None',
    internalRemaining: 'None',
    sweptPools: []
  },
  structure: {
    score: 5,
    description: 'Structural breakdown unspecified.',
    bosDetected: false,
    chochDetected: false,
    mssDetected: false,
    sequenceType: 'Ranging'
  },
  displacement: {
    strength: 'Weak',
    explanation: 'No clean displacement identified.'
  },
  fvgs: [],
  idm: {
    taken: false,
    score: 0,
    details: 'No inducement details provided.'
  },
  ote: {
    isAligned: false,
    lowerBound: 0.62,
    upperBound: 0.79,
    details: 'No OTE alignment details.'
  },
  scores: {
    htfPoi: 0,
    liquiditySweep: 0,
    bosChoch: 0,
    displacement: 0,
    fvg: 0,
    idm: 0,
    ote: 0,
    total: 0
  },
  tradePlan: {
    direction: 'WAIT',
    entryZone: 'N/A',
    stopLoss: 'N/A',
    tp1: 'N/A',
    tp2: 'N/A',
    tp3: 'N/A',
    riskRewardRatio: '1:1',
    instructions: 'No active trading plan generated.'
  },
  annotations: []
};

/**
 * Merges any partial analysis or potentially invalid JSON response into a safe, fully conforming
 * SMCAnalysisResponse object with sensible default fields. Avoids application crashes when rendering.
 */
export function normalizeAnalysis(obj: any): SMCAnalysisResponse {
  if (!obj || typeof obj !== 'object') {
    return { ...DEFAULT_SMC_ANALYSIS };
  }

  const safeObj = { ...DEFAULT_SMC_ANALYSIS };

  // Top level values
  if (obj.marketBias) safeObj.marketBias = obj.marketBias;
  if (typeof obj.biasConfidence === 'number') safeObj.biasConfidence = obj.biasConfidence;
  if (obj.biasExplanation) safeObj.biasExplanation = obj.biasExplanation;
  if (typeof obj.setupQualityScore === 'number') safeObj.setupQualityScore = obj.setupQualityScore;
  if (obj.confidenceLevel) safeObj.confidenceLevel = obj.confidenceLevel;
  if (obj.historicalPatternMatch) safeObj.historicalPatternMatch = obj.historicalPatternMatch;
  if (obj.estimatedSuccessRange) safeObj.estimatedSuccessRange = obj.estimatedSuccessRange;
  if (obj.setupGrade) safeObj.setupGrade = obj.setupGrade;
  if (obj.riskCategory) safeObj.riskCategory = obj.riskCategory;

  // sessionAnalysis
  if (obj.sessionAnalysis && typeof obj.sessionAnalysis === 'object') {
    safeObj.sessionAnalysis = {
      identifiedSessions: Array.isArray(obj.sessionAnalysis.identifiedSessions)
        ? obj.sessionAnalysis.identifiedSessions
        : [...DEFAULT_SMC_ANALYSIS.sessionAnalysis.identifiedSessions],
      suitabilityScore: typeof obj.sessionAnalysis.suitabilityScore === 'number'
        ? obj.sessionAnalysis.suitabilityScore
        : DEFAULT_SMC_ANALYSIS.sessionAnalysis.suitabilityScore,
      suitabilityExplanation: obj.sessionAnalysis.suitabilityExplanation || DEFAULT_SMC_ANALYSIS.sessionAnalysis.suitabilityExplanation
    };
  }

  // newsFilter
  if (obj.newsFilter && typeof obj.newsFilter === 'object') {
    safeObj.newsFilter = {
      newsNear: typeof obj.newsFilter.newsNear === 'boolean'
        ? obj.newsFilter.newsNear
        : DEFAULT_SMC_ANALYSIS.newsFilter.newsNear,
      eventsDetected: Array.isArray(obj.newsFilter.eventsDetected)
        ? obj.newsFilter.eventsDetected
        : [...DEFAULT_SMC_ANALYSIS.newsFilter.eventsDetected],
      warningMessage: obj.newsFilter.warningMessage || DEFAULT_SMC_ANALYSIS.newsFilter.warningMessage,
      impactOnConfidence: obj.newsFilter.impactOnConfidence || DEFAULT_SMC_ANALYSIS.newsFilter.impactOnConfidence
    };
  }

  // marketEnvironment
  if (obj.marketEnvironment && typeof obj.marketEnvironment === 'object') {
    safeObj.marketEnvironment = {
      classification: obj.marketEnvironment.classification || DEFAULT_SMC_ANALYSIS.marketEnvironment.classification,
      setupFits: typeof obj.marketEnvironment.setupFits === 'boolean'
        ? obj.marketEnvironment.setupFits
        : DEFAULT_SMC_ANALYSIS.marketEnvironment.setupFits,
      explanation: obj.marketEnvironment.explanation || DEFAULT_SMC_ANALYSIS.marketEnvironment.explanation
    };
  }

  // liquidityTargets
  if (obj.liquidityTargets && typeof obj.liquidityTargets === 'object') {
    safeObj.liquidityTargets = {
      identifiedTargets: Array.isArray(obj.liquidityTargets.identifiedTargets)
        ? obj.liquidityTargets.identifiedTargets
        : [...DEFAULT_SMC_ANALYSIS.liquidityTargets.identifiedTargets],
      primaryTarget: obj.liquidityTargets.primaryTarget || DEFAULT_SMC_ANALYSIS.liquidityTargets.primaryTarget,
      explanation: obj.liquidityTargets.explanation || DEFAULT_SMC_ANALYSIS.liquidityTargets.explanation
    };
  }

  // tradeInvalidation
  if (obj.tradeInvalidation && typeof obj.tradeInvalidation === 'object') {
    safeObj.tradeInvalidation = {
      criteria: Array.isArray(obj.tradeInvalidation.criteria)
        ? obj.tradeInvalidation.criteria
        : [...DEFAULT_SMC_ANALYSIS.tradeInvalidation.criteria],
      explanation: obj.tradeInvalidation.explanation || DEFAULT_SMC_ANALYSIS.tradeInvalidation.explanation
    };
  }

  // chartQuality
  if (obj.chartQuality && typeof obj.chartQuality === 'object') {
    safeObj.chartQuality = {
      candlesVisible: typeof obj.chartQuality.candlesVisible === 'boolean' ? obj.chartQuality.candlesVisible : DEFAULT_SMC_ANALYSIS.chartQuality.candlesVisible,
      timeframeVisible: typeof obj.chartQuality.timeframeVisible === 'boolean' ? obj.chartQuality.timeframeVisible : DEFAULT_SMC_ANALYSIS.chartQuality.timeframeVisible,
      priceScaleVisible: typeof obj.chartQuality.priceScaleVisible === 'boolean' ? obj.chartQuality.priceScaleVisible : DEFAULT_SMC_ANALYSIS.chartQuality.priceScaleVisible,
      structureVisible: typeof obj.chartQuality.structureVisible === 'boolean' ? obj.chartQuality.structureVisible : DEFAULT_SMC_ANALYSIS.chartQuality.structureVisible,
      qualityScore: typeof obj.chartQuality.qualityScore === 'number' ? obj.chartQuality.qualityScore : DEFAULT_SMC_ANALYSIS.chartQuality.qualityScore,
      isAcceptable: typeof obj.chartQuality.isAcceptable === 'boolean' ? obj.chartQuality.isAcceptable : DEFAULT_SMC_ANALYSIS.chartQuality.isAcceptable,
      rejectionReason: obj.chartQuality.rejectionReason || DEFAULT_SMC_ANALYSIS.chartQuality.rejectionReason
    };
  }

  // whyThisTradeExists
  if (obj.whyThisTradeExists && typeof obj.whyThisTradeExists === 'object') {
    safeObj.whyThisTradeExists = {
      htfContext: obj.whyThisTradeExists.htfContext || DEFAULT_SMC_ANALYSIS.whyThisTradeExists.htfContext,
      liquidityEvent: obj.whyThisTradeExists.liquidityEvent || DEFAULT_SMC_ANALYSIS.whyThisTradeExists.liquidityEvent,
      bosChoch: obj.whyThisTradeExists.bosChoch || DEFAULT_SMC_ANALYSIS.whyThisTradeExists.bosChoch,
      displacement: obj.whyThisTradeExists.displacement || DEFAULT_SMC_ANALYSIS.whyThisTradeExists.displacement,
      fvg: obj.whyThisTradeExists.fvg || DEFAULT_SMC_ANALYSIS.whyThisTradeExists.fvg,
      ote: obj.whyThisTradeExists.ote || DEFAULT_SMC_ANALYSIS.whyThisTradeExists.ote,
      idm: obj.whyThisTradeExists.idm || DEFAULT_SMC_ANALYSIS.whyThisTradeExists.idm,
      liquidityTarget: obj.whyThisTradeExists.liquidityTarget || DEFAULT_SMC_ANALYSIS.whyThisTradeExists.liquidityTarget,
      reasoningSummary: obj.whyThisTradeExists.reasoningSummary || DEFAULT_SMC_ANALYSIS.whyThisTradeExists.reasoningSummary
    };
  }

  // historicalPattern
  if (obj.historicalPattern && typeof obj.historicalPattern === 'object') {
    safeObj.historicalPattern = {
      patternSimilarity: obj.historicalPattern.patternSimilarity || DEFAULT_SMC_ANALYSIS.historicalPattern.patternSimilarity,
      historicalMatchScore: obj.historicalPattern.historicalMatchScore || DEFAULT_SMC_ANALYSIS.historicalPattern.historicalMatchScore,
      estimatedSuccessRange: obj.historicalPattern.estimatedSuccessRange || DEFAULT_SMC_ANALYSIS.historicalPattern.estimatedSuccessRange,
      matchedPatternDescription: obj.historicalPattern.matchedPatternDescription || DEFAULT_SMC_ANALYSIS.historicalPattern.matchedPatternDescription,
      similarSetupsCount: typeof obj.historicalPattern.similarSetupsCount === 'number' ? obj.historicalPattern.similarSetupsCount : DEFAULT_SMC_ANALYSIS.historicalPattern.similarSetupsCount
    };
  }

  // htfAnalysis
  if (obj.htfAnalysis && typeof obj.htfAnalysis === 'object') {
    safeObj.htfAnalysis = {
      score: typeof obj.htfAnalysis.score === 'number' ? obj.htfAnalysis.score : DEFAULT_SMC_ANALYSIS.htfAnalysis.score,
      description: obj.htfAnalysis.description || DEFAULT_SMC_ANALYSIS.htfAnalysis.description,
      identifiedPOI: Array.isArray(obj.htfAnalysis.identifiedPOI) ? obj.htfAnalysis.identifiedPOI : [...DEFAULT_SMC_ANALYSIS.htfAnalysis.identifiedPOI],
      reactionQuality: obj.htfAnalysis.reactionQuality || DEFAULT_SMC_ANALYSIS.htfAnalysis.reactionQuality
    };
  }

  // liquidity
  if (obj.liquidity && typeof obj.liquidity === 'object') {
    safeObj.liquidity = {
      liquidityTaken: obj.liquidity.liquidityTaken || DEFAULT_SMC_ANALYSIS.liquidity.liquidityTaken,
      details: obj.liquidity.details || DEFAULT_SMC_ANALYSIS.liquidity.details,
      externalRemaining: obj.liquidity.externalRemaining || DEFAULT_SMC_ANALYSIS.liquidity.externalRemaining,
      internalRemaining: obj.liquidity.internalRemaining || DEFAULT_SMC_ANALYSIS.liquidity.internalRemaining,
      sweptPools: Array.isArray(obj.liquidity.sweptPools) ? obj.liquidity.sweptPools : [...DEFAULT_SMC_ANALYSIS.liquidity.sweptPools]
    };
  }

  // structure
  if (obj.structure && typeof obj.structure === 'object') {
    safeObj.structure = {
      score: typeof obj.structure.score === 'number' ? obj.structure.score : DEFAULT_SMC_ANALYSIS.structure.score,
      description: obj.structure.description || DEFAULT_SMC_ANALYSIS.structure.description,
      bosDetected: typeof obj.structure.bosDetected === 'boolean' ? obj.structure.bosDetected : DEFAULT_SMC_ANALYSIS.structure.bosDetected,
      chochDetected: typeof obj.structure.chochDetected === 'boolean' ? obj.structure.chochDetected : DEFAULT_SMC_ANALYSIS.structure.chochDetected,
      mssDetected: typeof obj.structure.mssDetected === 'boolean' ? obj.structure.mssDetected : DEFAULT_SMC_ANALYSIS.structure.mssDetected,
      sequenceType: obj.structure.sequenceType || DEFAULT_SMC_ANALYSIS.structure.sequenceType
    };
  }

  // displacement
  if (obj.displacement && typeof obj.displacement === 'object') {
    safeObj.displacement = {
      strength: obj.displacement.strength || DEFAULT_SMC_ANALYSIS.displacement.strength,
      explanation: obj.displacement.explanation || DEFAULT_SMC_ANALYSIS.displacement.explanation
    };
  }

  // fvgs
  safeObj.fvgs = Array.isArray(obj.fvgs) ? obj.fvgs : [];

  // idm
  if (obj.idm && typeof obj.idm === 'object') {
    safeObj.idm = {
      taken: typeof obj.idm.taken === 'boolean' ? obj.idm.taken : DEFAULT_SMC_ANALYSIS.idm.taken,
      score: typeof obj.idm.score === 'number' ? obj.idm.score : DEFAULT_SMC_ANALYSIS.idm.score,
      details: obj.idm.details || DEFAULT_SMC_ANALYSIS.idm.details
    };
  }

  // ote
  if (obj.ote && typeof obj.ote === 'object') {
    safeObj.ote = {
      isAligned: typeof obj.ote.isAligned === 'boolean' ? obj.ote.isAligned : DEFAULT_SMC_ANALYSIS.ote.isAligned,
      lowerBound: typeof obj.ote.lowerBound === 'number' ? obj.ote.lowerBound : DEFAULT_SMC_ANALYSIS.ote.lowerBound,
      upperBound: typeof obj.ote.upperBound === 'number' ? obj.ote.upperBound : DEFAULT_SMC_ANALYSIS.ote.upperBound,
      details: obj.ote.details || DEFAULT_SMC_ANALYSIS.ote.details
    };
  }

  // scores
  if (obj.scores && typeof obj.scores === 'object') {
    safeObj.scores = {
      htfPoi: typeof obj.scores.htfPoi === 'number' ? obj.scores.htfPoi : DEFAULT_SMC_ANALYSIS.scores.htfPoi,
      liquiditySweep: typeof obj.scores.liquiditySweep === 'number' ? obj.scores.liquiditySweep : DEFAULT_SMC_ANALYSIS.scores.liquiditySweep,
      bosChoch: typeof obj.scores.bosChoch === 'number' ? obj.scores.bosChoch : DEFAULT_SMC_ANALYSIS.scores.bosChoch,
      displacement: typeof obj.scores.displacement === 'number' ? obj.scores.displacement : DEFAULT_SMC_ANALYSIS.scores.displacement,
      fvg: typeof obj.scores.fvg === 'number' ? obj.scores.fvg : DEFAULT_SMC_ANALYSIS.scores.fvg,
      idm: typeof obj.scores.idm === 'number' ? obj.scores.idm : DEFAULT_SMC_ANALYSIS.scores.idm,
      ote: typeof obj.scores.ote === 'number' ? obj.scores.ote : DEFAULT_SMC_ANALYSIS.scores.ote,
      total: typeof obj.scores.total === 'number' ? obj.scores.total : DEFAULT_SMC_ANALYSIS.scores.total
    };
  }

  // tradePlan
  if (obj.tradePlan && typeof obj.tradePlan === 'object') {
    safeObj.tradePlan = {
      direction: obj.tradePlan.direction || DEFAULT_SMC_ANALYSIS.tradePlan.direction,
      entryZone: obj.tradePlan.entryZone || DEFAULT_SMC_ANALYSIS.tradePlan.entryZone,
      stopLoss: obj.tradePlan.stopLoss || DEFAULT_SMC_ANALYSIS.tradePlan.stopLoss,
      tp1: obj.tradePlan.tp1 || DEFAULT_SMC_ANALYSIS.tradePlan.tp1,
      tp2: obj.tradePlan.tp2 || DEFAULT_SMC_ANALYSIS.tradePlan.tp2,
      tp3: obj.tradePlan.tp3 || DEFAULT_SMC_ANALYSIS.tradePlan.tp3,
      riskRewardRatio: obj.tradePlan.riskRewardRatio || DEFAULT_SMC_ANALYSIS.tradePlan.riskRewardRatio,
      instructions: obj.tradePlan.instructions || DEFAULT_SMC_ANALYSIS.tradePlan.instructions
    };
  }

  // annotations
  safeObj.annotations = Array.isArray(obj.annotations) ? obj.annotations : [];

  // additional params
  if (typeof obj.pandasIngested === 'boolean') safeObj.pandasIngested = obj.pandasIngested;
  if (typeof obj.historicalOhlcvCount === 'number') safeObj.historicalOhlcvCount = obj.historicalOhlcvCount;
  
  if (obj.htfConfluence && typeof obj.htfConfluence === 'object') {
    safeObj.htfConfluence = {
      timeframe: obj.htfConfluence.timeframe || '',
      bias: obj.htfConfluence.bias || 'NEUTRAL',
      lastStructuralSwingHigh: typeof obj.htfConfluence.lastStructuralSwingHigh === 'number' ? obj.htfConfluence.lastStructuralSwingHigh : 0,
      lastStructuralSwingLow: typeof obj.htfConfluence.lastStructuralSwingLow === 'number' ? obj.htfConfluence.lastStructuralSwingLow : 0,
      explicitCandleBodyCloseValidated: typeof obj.htfConfluence.explicitCandleBodyCloseValidated === 'boolean' ? obj.htfConfluence.explicitCandleBodyCloseValidated : false,
      details: obj.htfConfluence.details || ''
    };
  }

  return safeObj;
}

// ============================================================================
// 10. CUSTOM REACT HOOKS
// ============================================================================

/**
 * A state management hook that automatically debounces updates.
 * Exposes the debounced state, the immediate setter function, and the current immediate value.
 */
export function useDebouncedState<T>(initialValue: T, delay: number): [T, (value: T) => void, T] {
  const [state, setState] = useState<T>(initialValue);
  const [debouncedState, setDebouncedState] = useState<T>(initialValue);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedState(state);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [state, delay]);

  return [debouncedState, setState, state];
}

/**
 * Debug hook tracking the render count of the component in which it is used.
 */
export function useRenderCount(): number {
  const count = useRef(0);
  count.current++;
  return count.current;
}

/**
 * Hook to check if a component is still mounted. Helps protect async callbacks
 * from setting state on an unmounted component.
 */
export function useIsMounted(): () => boolean {
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback(() => isMountedRef.current, []);
}
