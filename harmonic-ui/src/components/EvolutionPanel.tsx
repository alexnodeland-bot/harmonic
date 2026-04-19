import React from 'react';
import '../styles/EvolutionPanel.css';

interface EvolutionPanelProps {
  populationSize: number;
  setPopulationSize: (size: number) => void;
  generationCount: number;
  setGenerationCount: (count: number) => void;
  mutationRate: number;
  setMutationRate: (rate: number) => void;
  crossoverRate: number;
  setCrossoverRate: (rate: number) => void;
  eliteSize: number;
  setEliteSize: (size: number) => void;
  targetFitnessMode: 'spectrum' | 'energy' | 'random';
  setTargetFitnessMode: (mode: 'spectrum' | 'energy' | 'random') => void;
  masterVolume: number;
  setMasterVolume: (volume: number) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  onRunEvolution: () => void;
  onPauseResume: () => void;
  onStop: () => void;
  isRunning: boolean;
  isPaused: boolean;
  progress: number;
}

export const EvolutionPanel: React.FC<EvolutionPanelProps> = ({
  populationSize,
  setPopulationSize,
  generationCount,
  setGenerationCount,
  mutationRate,
  setMutationRate,
  crossoverRate,
  setCrossoverRate,
  eliteSize,
  setEliteSize,
  targetFitnessMode,
  setTargetFitnessMode,
  masterVolume,
  setMasterVolume,
  isMuted,
  setIsMuted,
  onRunEvolution,
  onPauseResume,
  onStop,
  isRunning,
  isPaused,
  progress,
}) => {
  return (
    <div className="evolution-panel">
      <h2>🧬 Evolution Control</h2>

      {/* Population & Generations */}
      <div className="control-group">
        <label className="control-label">
          Population Size: <span className="value">{populationSize}</span>
        </label>
        <input
          type="range"
          min="5"
          max="100"
          value={populationSize}
          onChange={(e) => setPopulationSize(parseInt(e.target.value))}
          disabled={isRunning}
          className="slider"
        />
      </div>

      <div className="control-group">
        <label className="control-label">
          Max Generations: <span className="value">{generationCount}</span>
        </label>
        <input
          type="range"
          min="1"
          max="500"
          value={generationCount}
          onChange={(e) => setGenerationCount(parseInt(e.target.value))}
          disabled={isRunning}
          className="slider"
        />
      </div>

      {/* Mutation & Crossover */}
      <div className="control-group">
        <label className="control-label">
          Mutation Rate: <span className="value">{mutationRate.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={mutationRate}
          onChange={(e) => setMutationRate(parseFloat(e.target.value))}
          disabled={isRunning}
          className="slider"
        />
      </div>

      <div className="control-group">
        <label className="control-label">
          Crossover Rate: <span className="value">{crossoverRate.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={crossoverRate}
          onChange={(e) => setCrossoverRate(parseFloat(e.target.value))}
          disabled={isRunning}
          className="slider"
        />
      </div>

      {/* Elite Size */}
      <div className="control-group">
        <label className="control-label">
          Elite Size: <span className="value">{eliteSize}</span>
        </label>
        <input
          type="number"
          min="1"
          max={Math.floor(populationSize / 2)}
          value={eliteSize}
          onChange={(e) => setEliteSize(Math.max(1, parseInt(e.target.value) || 1))}
          disabled={isRunning}
          className="number-input"
        />
      </div>

      {/* Target Fitness Mode */}
      <div className="control-group">
        <label className="control-label">Target Fitness Mode:</label>
        <div className="mode-buttons">
          {(['spectrum', 'energy', 'random'] as const).map((mode) => (
            <button
              key={mode}
              className={`mode-btn ${targetFitnessMode === mode ? 'active' : ''}`}
              onClick={() => setTargetFitnessMode(mode)}
              disabled={isRunning}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Audio Controls */}
      <div className="control-group audio-controls">
        <label className="control-label">
          Master Volume: <span className="value">{(masterVolume * 100).toFixed(0)}%</span>
        </label>
        <div className="volume-control">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={masterVolume}
            onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
            className="slider"
          />
          <button
            className={`mute-btn ${isMuted ? 'muted' : ''}`}
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {isRunning && (
        <div className="progress-section">
          <label className="control-label">Evolution Progress</label>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${Math.min(100, progress * 100)}%` }} />
          </div>
          <span className="progress-text">{Math.round(progress * 100)}%</span>
        </div>
      )}

      {/* Control Buttons */}
      <div className="button-group">
        <button
          onClick={onRunEvolution}
          disabled={isRunning}
          className="btn btn-primary"
        >
          ▶️ Run Evolution
        </button>
        <button
          onClick={onPauseResume}
          disabled={!isRunning}
          className={`btn ${isPaused ? 'btn-primary' : 'btn-secondary'}`}
        >
          {isPaused ? '▶️ Resume' : '⏸️ Pause'}
        </button>
        <button
          onClick={onStop}
          disabled={!isRunning}
          className="btn btn-danger"
        >
          ⏹️ Stop
        </button>
      </div>
    </div>
  );
};
