import {
  PatchConfig,
  generateRandomPatch,
  mutatePatches,
  crossoverPatches,
  evaluateFitness,
  FitnessMetrics,
  getDefaultPatch,
} from './synth';

export interface PatchWithFitness extends PatchConfig {
  fitness: number;
  fitnessMetrics: FitnessMetrics;
}

export interface GenerationStats {
  generation: number;
  bestFitness: number;
  avgFitness: number;
  worstFitness: number;
  bestPatch: PatchWithFitness;
}

export class EvolutionRunner {
  private population: PatchWithFitness[] = [];
  private generationStats: GenerationStats[] = [];
  private currentGeneration = 0;
  private isRunning = false;
  private isPaused = false;

  constructor(
    private populationSize: number = 20,
    private mutationRate: number = 0.3,
    private crossoverRate: number = 0.7,
    private eliteSize: number = 2,
    private targetFitnessMode: 'spectrum' | 'energy' | 'random' = 'energy',
    private onGenerationComplete?: (stats: GenerationStats) => void,
    private onProgressUpdate?: (progress: number) => void
  ) {}

  public initialize(): void {
    this.population = [];
    this.generationStats = [];
    this.currentGeneration = 0;

    for (let i = 0; i < this.populationSize; i++) {
      const patch = this.createPatchWithId(generateRandomPatch(), i);
      const fitnessMetrics = evaluateFitness(JSON.stringify(patch), this.targetFitnessMode);
      this.population.push({
        ...patch,
        fitness: fitnessMetrics.fitness,
        fitnessMetrics,
      });
    }

    // Sort by fitness (descending)
    this.sortByFitness();
  }

  private createPatchWithId(patch: PatchConfig, id: number): PatchConfig {
    return {
      ...patch,
      id: `patch-${Date.now()}-${id}`,
      generationCreated: this.currentGeneration,
    };
  }

  private sortByFitness(): void {
    this.population.sort((a, b) => b.fitness - a.fitness);
  }

  public async runGeneration(): Promise<GenerationStats> {
    if (!this.isRunning) return this.getStats();

    this.currentGeneration++;
    const newPopulation: PatchWithFitness[] = [];

    // Keep elite
    const elite = this.population.slice(0, this.eliteSize);
    newPopulation.push(...elite);

    // Generate offspring
    while (newPopulation.length < this.populationSize) {
      let offspring: PatchConfig;

      if (Math.random() < this.crossoverRate && this.population.length >= 2) {
        // Tournament selection
        const p1 = this.tournamentSelection();
        const p2 = this.tournamentSelection();
        offspring = JSON.parse(
          crossoverPatches(JSON.stringify(p1), JSON.stringify(p2), this.crossoverRate)
        );
      } else {
        // Random selection and mutation
        offspring = JSON.parse(
          mutatePatches(JSON.stringify(this.tournamentSelection()), this.mutationRate)
        );
      }

      // Mutate offspring
      offspring = JSON.parse(mutatePatches(JSON.stringify(offspring), this.mutationRate));

      // Create with ID
      offspring = this.createPatchWithId(offspring, newPopulation.length);

      // Evaluate fitness
      const fitnessMetrics = evaluateFitness(JSON.stringify(offspring), this.targetFitnessMode);
      newPopulation.push({
        ...offspring,
        fitness: fitnessMetrics.fitness,
        fitnessMetrics,
      });
    }

    this.population = newPopulation.slice(0, this.populationSize);
    this.sortByFitness();

    const stats = this.getStats();
    this.generationStats.push(stats); // Track history
    
    if (this.onGenerationComplete) {
      this.onGenerationComplete(stats);
    }

    if (this.onProgressUpdate) {
      this.onProgressUpdate(this.currentGeneration / 500); // Assuming max 500 gens
    }

    return stats;
  }

  private tournamentSelection(tournamentSize: number = 3): PatchWithFitness {
    const tournament = [];
    for (let i = 0; i < tournamentSize; i++) {
      tournament.push(this.population[Math.floor(Math.random() * this.population.length)]);
    }
    return tournament.sort((a, b) => b.fitness - a.fitness)[0];
  }

  public start(maxGenerations: number = 100): void {
    this.isRunning = true;
    this.isPaused = false;
    this.runEvolutionLoop(maxGenerations);
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
  }

  public stop(): void {
    this.isRunning = false;
  }

  private async runEvolutionLoop(maxGenerations: number): Promise<void> {
    while (this.currentGeneration < maxGenerations && this.isRunning) {
      if (!this.isPaused) {
        await this.runGeneration();
        // Small delay to prevent blocking
        await new Promise((resolve) => setTimeout(resolve, 10));
      } else {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    this.isRunning = false;
  }

  public getPopulation(): PatchWithFitness[] {
    return [...this.population];
  }

  public getStats(): GenerationStats {
    if (this.population.length === 0) {
      return {
        generation: 0,
        bestFitness: 0,
        avgFitness: 0,
        worstFitness: 0,
        bestPatch: {} as PatchWithFitness,
      };
    }

    const fitnesses = this.population.map((p) => p.fitness);
    return {
      generation: this.currentGeneration,
      bestFitness: fitnesses[0],
      avgFitness: fitnesses.reduce((a, b) => a + b, 0) / fitnesses.length,
      worstFitness: fitnesses[fitnesses.length - 1],
      bestPatch: this.population[0],
    };
  }

  public getGenerationHistory(): GenerationStats[] {
    return [...this.generationStats];
  }

  public getCurrentGeneration(): number {
    return this.currentGeneration;
  }

  public isRunning_(): boolean {
    return this.isRunning;
  }

  public isPaused_(): boolean {
    return this.isPaused;
  }

  public updateParameters(
    populationSize?: number,
    mutationRate?: number,
    crossoverRate?: number,
    eliteSize?: number,
    targetFitnessMode?: 'spectrum' | 'energy' | 'random'
  ): void {
    if (populationSize !== undefined) this.populationSize = populationSize;
    if (mutationRate !== undefined) this.mutationRate = mutationRate;
    if (crossoverRate !== undefined) this.crossoverRate = crossoverRate;
    if (eliteSize !== undefined) this.eliteSize = eliteSize;
    if (targetFitnessMode !== undefined) this.targetFitnessMode = targetFitnessMode;
  }

  public exportHistory(): string {
    return JSON.stringify(
      {
        generationStats: this.generationStats,
        population: this.population,
        parameters: {
          populationSize: this.populationSize,
          mutationRate: this.mutationRate,
          crossoverRate: this.crossoverRate,
          eliteSize: this.eliteSize,
          targetFitnessMode: this.targetFitnessMode,
        },
      },
      null,
      2
    );
  }
}
