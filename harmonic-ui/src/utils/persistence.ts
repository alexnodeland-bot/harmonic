import { PatchWithFitness, GenerationStats } from '../EvolutionRunner';

interface EvolutionSnapshot {
  timestamp: string;
  generationStats: GenerationStats[];
  population: PatchWithFitness[];
  parameters: {
    populationSize: number;
    mutationRate: number;
    crossoverRate: number;
    eliteSize: number;
    targetFitnessMode: 'spectrum' | 'energy' | 'random';
  };
}

export function saveEvolutionToLocalStorage(
  key: string,
  generationStats: GenerationStats[],
  population: PatchWithFitness[],
  parameters: {
    populationSize: number;
    mutationRate: number;
    crossoverRate: number;
    eliteSize: number;
    targetFitnessMode: 'spectrum' | 'energy' | 'random';
  }
): void {
  try {
    const snapshot: EvolutionSnapshot = {
      timestamp: new Date().toISOString(),
      generationStats,
      population,
      parameters,
    };
    localStorage.setItem(key, JSON.stringify(snapshot));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

export function loadEvolutionFromLocalStorage(key: string): EvolutionSnapshot | null {
  try {
    const data = localStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data) as EvolutionSnapshot;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
}

export function exportEvolutionAsJSON(
  generationStats: GenerationStats[],
  population: PatchWithFitness[],
  parameters: {
    populationSize: number;
    mutationRate: number;
    crossoverRate: number;
    eliteSize: number;
    targetFitnessMode: 'spectrum' | 'energy' | 'random';
  }
): string {
  const snapshot: EvolutionSnapshot = {
    timestamp: new Date().toISOString(),
    generationStats,
    population,
    parameters,
  };
  return JSON.stringify(snapshot, null, 2);
}

export function downloadJSON(filename: string, data: string): void {
  const element = document.createElement('a');
  element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(data));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

export function saveFavoritesToLocalStorage(favorites: Set<string>): void {
  try {
    localStorage.setItem('harmonic-favorites', JSON.stringify(Array.from(favorites)));
  } catch (error) {
    console.error('Error saving favorites:', error);
  }
}

export function loadFavoritesFromLocalStorage(): Set<string> {
  try {
    const data = localStorage.getItem('harmonic-favorites');
    if (!data) return new Set();
    return new Set(JSON.parse(data));
  } catch (error) {
    console.error('Error loading favorites:', error);
    return new Set();
  }
}
