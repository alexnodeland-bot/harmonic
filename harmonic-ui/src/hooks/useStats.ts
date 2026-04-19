import { useMemo } from 'react';

export interface FitnessHistory {
  gen: number;
  best: number;
  avg: number;
  worst: number;
}

export interface EvolutionStats {
  bestGeneration: number | null;
  improvementRate: number;
  populationDiversity: number;
  timeElapsedMs: number;
  estimatedConvergenceGen: number | null;
  convergenceScore: number; // 0-1, how close to convergence
}

/**
 * Calculate best generation (when peak fitness was reached)
 */
const getBestGeneration = (history: FitnessHistory[]): number | null => {
  if (history.length === 0) return null;

  let bestGen = 0;
  let bestFitness = history[0].best;

  history.forEach((entry, i) => {
    if (entry.best > bestFitness) {
      bestFitness = entry.best;
      bestGen = i;
    }
  });

  return bestGen;
};

/**
 * Calculate improvement rate (fitness gain per generation)
 */
const getImprovementRate = (history: FitnessHistory[]): number => {
  if (history.length < 2) return 0;

  const recent = history.slice(-10); // Last 10 generations
  const firstFitness = recent[0].best;
  const lastFitness = recent[recent.length - 1].best;
  const generationSpan = recent.length;

  return (lastFitness - firstFitness) / generationSpan;
};

/**
 * Calculate population diversity (based on fitness distribution)
 */
const getPopulationDiversity = (history: FitnessHistory[]): number => {
  if (history.length === 0) return 0;

  const latest = history[history.length - 1];
  if (latest.best === 0) return 0;

  // Diversity score: how spread out is the population?
  // 0 = all same fitness, 1 = very diverse
  const range = latest.best - latest.worst;
  const normalized = range / latest.best;
  return Math.min(normalized, 1);
};

/**
 * Estimate when convergence will occur
 */
const getEstimatedConvergenceGen = (history: FitnessHistory[]): number | null => {
  if (history.length < 3) return null;

  // Calculate improvement rate trend
  const recent = history.slice(-Math.min(10, history.length));
  const improvements = [];

  for (let i = 1; i < recent.length; i++) {
    improvements.push(recent[i].best - recent[i - 1].best);
  }

  const avgImprovement = improvements.reduce((a, b) => a + b, 0) / improvements.length;

  if (avgImprovement <= 0.001) {
    // Already converged or converging very slowly
    return history.length + 10; // Assume 10 more generations
  }

  // Estimate based on diminishing returns
  const remainingToOptimal = 1 - (history[history.length - 1].best || 0);
  const generationsNeeded = remainingToOptimal / Math.abs(avgImprovement);

  return Math.ceil(history.length + generationsNeeded);
};

/**
 * Calculate convergence score (how close to convergence we are)
 * 0 = just started, 1 = fully converged
 */
const getConvergenceScore = (history: FitnessHistory[]): number => {
  if (history.length === 0) return 0;

  const recent = history.slice(-Math.min(5, history.length));
  const improvements = [];

  for (let i = 1; i < recent.length; i++) {
    improvements.push(recent[i].best - recent[i - 1].best);
  }

  const avgImprovement = improvements.reduce((a, b) => a + b, 0) / improvements.length;
  // If improvement is very small, we're converged
  // Return value between 0 and 1
  const convergence = 1 - Math.exp(-3 * Math.abs(avgImprovement) * 100);
  return Math.max(0, Math.min(1, convergence));
};

/**
 * Hook for evolution statistics
 */
export const useStats = (
  history: FitnessHistory[],
  startTimeMs?: number
): EvolutionStats => {
  return useMemo(() => {
    const now = startTimeMs ? Date.now() - startTimeMs : 0;

    return {
      bestGeneration: getBestGeneration(history),
      improvementRate: getImprovementRate(history),
      populationDiversity: getPopulationDiversity(history),
      timeElapsedMs: now,
      estimatedConvergenceGen: getEstimatedConvergenceGen(history),
      convergenceScore: getConvergenceScore(history),
    };
  }, [history, startTimeMs]);
};

/**
 * Format time elapsed
 */
export const formatTimeElapsed = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Format generation estimate
 */
export const formatGenerationEstimate = (estimatedGen: number | null, currentGen: number): string => {
  if (!estimatedGen) return 'Unknown';
  const remaining = Math.max(0, estimatedGen - currentGen);
  return `~${remaining} gens`;
};

/**
 * Get convergence status text
 */
export const getConvergenceStatus = (score: number): string => {
  if (score < 0.2) return 'Early Stage';
  if (score < 0.4) return 'Growing';
  if (score < 0.6) return 'Developing';
  if (score < 0.8) return 'Nearly Converged';
  return 'Converged';
};

/**
 * Get convergence status color
 */
export const getConvergenceStatusColor = (score: number): string => {
  if (score < 0.2) return '#0066ff'; // blue
  if (score < 0.4) return '#00ff88'; // green
  if (score < 0.6) return '#ffaa00'; // orange
  if (score < 0.8) return '#ff8800'; // darker orange
  return '#ff3344'; // red (fully converged)
};
