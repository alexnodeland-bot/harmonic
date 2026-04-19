import React, { useState, useRef, useEffect } from 'react';
import {
  generateRandomPatch,
  mutatePatches,
  crossoverPatches,
  evaluateFitness,
  startPlayback,
  stopPlayback,
  type PatchConfig,
  type FitnessMetrics,
} from './synth';
import { useAudio } from './hooks/useAudio';
import { useStats, formatTimeElapsed, formatGenerationEstimate, getConvergenceStatus, getConvergenceStatusColor } from './hooks/useStats';
import { useAnimations } from './hooks/useAnimations';
import WaveformPreview from './components/WaveformPreview';
import PatchDetailsPanel from './components/PatchDetailsPanel';
import './styles/animations.css';
import './Evolution.css';

interface PopulationEntry {
  patch: PatchConfig;
  metrics: FitnessMetrics;
  generation: number;
}

interface EvolutionState {
  population: PopulationEntry[];
  generation: number;
  isRunning: boolean;
  history: { gen: number; best: number; avg: number; worst: number }[];
}

interface EvolutionConfig {
  populationSize: number;
  maxGenerations: number;
  mutationRate: number;
  crossoverRate: number;
  eliteSize: number;
  fitnessTarget: 'energy' | 'spectrum' | 'random';
}

export const Evolution: React.FC = () => {
  const [config, setConfig] = useState<EvolutionConfig>({
    populationSize: 20,
    maxGenerations: 100,
    mutationRate: 0.3,
    crossoverRate: 0.7,
    eliteSize: 2,
    fitnessTarget: 'energy',
  });

  const [state, setState] = useState<EvolutionState>({
    population: [],
    generation: 0,
    isRunning: false,
    history: [],
  });

  const [selectedPatch, setSelectedPatch] = useState<PopulationEntry | null>(null);
  const [playingPatch, setPlayingPatch] = useState<string | null>(null);
  const [startTimeMs, setStartTimeMs] = useState<number | undefined>();
  const [bestFitnessThisSession, setBestFitnessThisSession] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Audio feedback
  const { playSuccessChime, playSweepTone } = useAudio();
  
  // Animations
  const { staggerElements, celebrationGlow } = useAnimations();
  
  // Stats
  const stats = useStats(state.history, startTimeMs);

  // Initialize population
  const initializePopulation = () => {
    const newPop: PopulationEntry[] = [];
    for (let i = 0; i < config.populationSize; i++) {
      const patch = generateRandomPatch();
      patch.id = `${Date.now()}-${i}`;
      patch.generationCreated = 0;
      const metrics = evaluateFitness(JSON.stringify(patch), config.fitnessTarget);
      newPop.push({ patch, metrics, generation: 0 });
    }
    return newPop;
  };

  // Evolution loop
  const runEvolution = async () => {
    setState((prev) => ({ ...prev, isRunning: true }));
    setStartTimeMs(Date.now());
    setBestFitnessThisSession(0);

    let population = state.population.length > 0 ? state.population : initializePopulation();
    let generation = state.generation || 0;
    const history: typeof state.history = [];

    for (gen; gen < config.maxGenerations; gen++) {
      // Evaluate population
      population = population.map((entry) => ({
        ...entry,
        metrics: evaluateFitness(JSON.stringify(entry.patch), config.fitnessTarget),
      }));

      // Sort by fitness
      population.sort((a, b) => b.metrics.fitness - a.metrics.fitness);

      // Track history
      const fitnesses = population.map((p) => p.metrics.fitness);
      const bestFitness = Math.max(...fitnesses);
      const avgFitness = fitnesses.reduce((a, b) => a + b) / fitnesses.length;
      const worstFitness = Math.min(...fitnesses);
      
      history.push({
        gen,
        best: bestFitness,
        avg: avgFitness,
        worst: worstFitness,
      });
      
      // Celebration logic: new best found
      if (bestFitness > bestFitnessThisSession) {
        setBestFitnessThisSession(bestFitness);
        playSuccessChime();
      }

      // Keep elite
      const elite = population.slice(0, config.eliteSize);

      // Tournament selection for breeding
      const breed = () => {
        const tournament = [];
        for (let i = 0; i < 3; i++) {
          tournament.push(population[Math.floor(Math.random() * population.length)]);
        }
        tournament.sort((a, b) => b.metrics.fitness - a.metrics.fitness);
        return tournament[0];
      };

      // Create offspring
      const offspring: PopulationEntry[] = [];
      while (offspring.length < population.length - elite.length) {
        let child: PopulationEntry;

        if (Math.random() < config.crossoverRate && population.length > 1) {
          // Crossover
          const p1 = breed();
          const p2 = breed();
          const childPatch = JSON.parse(
            crossoverPatches(JSON.stringify(p1.patch), JSON.stringify(p2.patch))
          ) as PatchConfig;
          childPatch.id = `${Date.now()}-${offspring.length}`;
          childPatch.generationCreated = gen + 1;
          const metrics = evaluateFitness(JSON.stringify(childPatch), config.fitnessTarget);
          child = { patch: childPatch, metrics, generation: gen + 1 };
        } else {
          // Mutation
          const parent = breed();
          const mutated = JSON.parse(
            mutatePatches(JSON.stringify(parent.patch), config.mutationRate)
          ) as PatchConfig;
          mutated.id = `${Date.now()}-${offspring.length}`;
          mutated.generationCreated = gen + 1;
          const metrics = evaluateFitness(JSON.stringify(mutated), config.fitnessTarget);
          child = { patch: mutated, metrics, generation: gen + 1 };
        }

        offspring.push(child);
      }

      // New population = elite + offspring
      population = [...elite, ...offspring.slice(0, population.length - elite.length)];

      // Update state
      setState({
        population,
        generation: gen + 1,
        isRunning: true,
        history,
      });

      // Visualize fitness graph
      drawFitnessGraph(history);

      // Yield to browser
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Check if still running
      if (!state.isRunning) break;
    }

    setState((prev) => ({ ...prev, isRunning: false }));
  };

  const drawFitnessGraph = (history: typeof state.history) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (history.length === 0) return;

    const padding = 40;
    const graphWidth = canvas.width - padding * 2;
    const graphHeight = canvas.height - padding * 2;

    // Draw axes
    ctx.strokeStyle = '#444';
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.stroke();

    // Draw lines for best/avg/worst
    const drawLine = (data: number[], color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      data.forEach((value, i) => {
        const x = padding + (i / (data.length - 1)) * graphWidth;
        const y = canvas.height - padding - (value * graphHeight);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.stroke();
    };

    const bestFitnesses = history.map((h) => h.best);
    const avgFitnesses = history.map((h) => h.avg);

    drawLine(bestFitnesses, '#00ff88');
    drawLine(avgFitnesses, '#0066ff');

    // Labels
    ctx.fillStyle = '#999';
    ctx.font = '12px monospace';
    ctx.fillText('Gen 0', padding, canvas.height - padding + 20);
    ctx.fillText(`Gen ${history.length - 1}`, canvas.width - padding - 40, canvas.height - padding + 20);
    ctx.fillText('Fitness', 5, 20);
  };

  const playPatch = (entry: PopulationEntry) => {
    stopPlayback();
    const success = startPlayback(JSON.stringify(entry.patch), 2.0);
    if (success) {
      setPlayingPatch(entry.patch.id || '');
    }
  };

  return (
    <div className="evolution-container">
      <div className="evo-controls">
        <h2>Evolution Settings</h2>

        <div className="control-group">
          <label>
            Population Size ({config.populationSize})
            <input
              type="range"
              min="5"
              max="100"
              value={config.populationSize}
              onChange={(e) => setConfig({ ...config, populationSize: parseInt(e.target.value) })}
              disabled={state.isRunning}
            />
          </label>

          <label>
            Generations ({config.maxGenerations})
            <input
              type="range"
              min="1"
              max="500"
              value={config.maxGenerations}
              onChange={(e) => setConfig({ ...config, maxGenerations: parseInt(e.target.value) })}
              disabled={state.isRunning}
            />
          </label>

          <label>
            Mutation Rate ({config.mutationRate.toFixed(2)})
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={config.mutationRate}
              onChange={(e) => setConfig({ ...config, mutationRate: parseFloat(e.target.value) })}
              disabled={state.isRunning}
            />
          </label>

          <label>
            Crossover Rate ({config.crossoverRate.toFixed(2)})
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={config.crossoverRate}
              onChange={(e) => setConfig({ ...config, crossoverRate: parseFloat(e.target.value) })}
              disabled={state.isRunning}
            />
          </label>

          <label>
            Elite Size ({config.eliteSize})
            <input
              type="range"
              min="1"
              max="10"
              value={config.eliteSize}
              onChange={(e) => setConfig({ ...config, eliteSize: parseInt(e.target.value) })}
              disabled={state.isRunning}
            />
          </label>

          <label>
            Fitness Target:
            <select
              value={config.fitnessTarget}
              onChange={(e) => setConfig({ ...config, fitnessTarget: e.target.value as any })}
              disabled={state.isRunning}
            >
              <option value="energy">Energy (Loud)</option>
              <option value="spectrum">Spectrum (Diverse)</option>
              <option value="random">Random</option>
            </select>
          </label>
        </div>

        <button
          onClick={() => {
            if (state.isRunning) {
              setState((prev) => ({ ...prev, isRunning: false }));
              stopPlayback();
            } else {
              setState({ ...state, population: [], generation: 0, history: [] });
              runEvolution();
            }
          }}
          className={`btn ${state.isRunning ? 'btn-danger' : 'btn-primary'}`}
        >
          {state.isRunning ? '⏹️ Stop' : '▶️ Start Evolution'}
        </button>

        <div className="stats">
          <div className="stat">
            <label>Generation</label>
            <span>{state.generation}</span>
          </div>
          <div className="stat">
            <label>Population</label>
            <span>{state.population.length}</span>
          </div>
          {state.history.length > 0 && (
            <>
              <div className="stat">
                <label>Best Fitness</label>
                <span>{state.history[state.history.length - 1].best.toFixed(3)}</span>
              </div>
              <div className="stat">
                <label>Avg Fitness</label>
                <span>{state.history[state.history.length - 1].avg.toFixed(3)}</span>
              </div>
              <div className="stat">
                <label>Improvement Rate</label>
                <span>{stats.improvementRate.toFixed(4)}</span>
              </div>
              <div className="stat">
                <label>Diversity</label>
                <span>{(stats.populationDiversity * 100).toFixed(1)}%</span>
              </div>
              <div className="stat">
                <label>Time Elapsed</label>
                <span>{formatTimeElapsed(stats.timeElapsedMs)}</span>
              </div>
              {stats.bestGeneration !== null && (
                <div className="stat">
                  <label>Best Generation</label>
                  <span>Gen {stats.bestGeneration}</span>
                </div>
              )}
              <div className="stat">
                <label>Est. Convergence</label>
                <span>{formatGenerationEstimate(stats.estimatedConvergenceGen, state.generation)}</span>
              </div>
              <div className="stat">
                <label>Status</label>
                <span style={{ color: getConvergenceStatusColor(stats.convergenceScore) }}>
                  {getConvergenceStatus(stats.convergenceScore)}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="fitness-graph">
          <h3>Fitness Progress</h3>
          <canvas ref={canvasRef} width={400} height={200} />
        </div>
      </div>

      <div className="evo-population">
        <h2>Population (Best First)</h2>
        <div className="patch-grid">
          {state.population.slice(0, 12).map((entry, i) => (
            <div
              key={entry.patch.id}
              className={`patch-card ${playingPatch === entry.patch.id ? 'playing' : ''} ${
                selectedPatch?.patch.id === entry.patch.id ? 'selected' : ''
              }`}
              style={{
                backgroundColor: `rgba(${Math.floor((1 - entry.metrics.fitness) * 255)}, ${Math.floor(entry.metrics.fitness * 200)}, 0, 0.08)`,
              }}
            >
              <div className="patch-header">
                <span className="rank">#{i + 1}</span>
                <span className="fitness" style={{ 
                  color: `hsl(${Math.max(0, Math.min(120, entry.metrics.fitness * 120))}, 100%, ${50 - entry.metrics.fitness * 10}%)` 
                }}>
                  {entry.metrics.fitness.toFixed(3)}
                </span>
              </div>
              <div className="patch-info">
                <div>Osc: {entry.patch.oscillators.length}</div>
                <div>Gen: {entry.generation}</div>
              </div>
              <div className="patch-buttons">
                <button
                  onClick={() => playPatch(entry)}
                  className="btn-small"
                  title="Play patch"
                >
                  ▶️
                </button>
                <button
                  onClick={() => setSelectedPatch(entry)}
                  className="btn-small"
                  title="Select patch"
                >
                  ✓
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedPatch && (
        <div className="patch-detail">
          <PatchDetailsPanel
            patch={selectedPatch.patch}
            fitness={selectedPatch.metrics.fitness}
            generation={selectedPatch.generation}
            rank={state.population.indexOf(selectedPatch) + 1}
          />
          
          {/* Waveform Preview */}
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>🌊 Waveform Preview</h3>
            <WaveformPreview patch={selectedPatch.patch} width={400} height={150} />
          </div>
          
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>📄 Patch JSON</h3>
            <textarea
              value={JSON.stringify(selectedPatch.patch, null, 2)}
              readOnly
              className="patch-json"
            />
            <button
              onClick={() => {
                const element = document.createElement('a');
                element.setAttribute(
                  'href',
                  'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(selectedPatch.patch, null, 2))
                );
                element.setAttribute('download', `patch-${selectedPatch.patch.id}.json`);
                element.style.display = 'none';
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
              }}
              className="btn btn-primary"
            >
              💾 Export
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Evolution;
