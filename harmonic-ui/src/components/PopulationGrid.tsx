import React, { useState, useRef, useEffect } from 'react';
import { PatchWithFitness } from '../EvolutionRunner';
import '../styles/PopulationGrid.css';

interface PopulationGridProps {
  population: PatchWithFitness[];
  onSelectPatch: (patch: PatchWithFitness) => void;
  onPlayPatch: (patch: PatchWithFitness) => void;
  onMutatePatch: (patch: PatchWithFitness) => void;
  selectedPatchId?: string;
  favorites: Set<string>;
  onToggleFavorite: (patchId: string) => void;
  isPlaying: boolean;
  playingPatchId?: string;
}

export const PopulationGrid: React.FC<PopulationGridProps> = ({
  population,
  onSelectPatch,
  onPlayPatch,
  onMutatePatch,
  selectedPatchId,
  favorites,
  onToggleFavorite,
  isPlaying,
  playingPatchId,
}) => {
  const canvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());

  // Draw simple waveform visualization for each patch
  useEffect(() => {
    population.forEach((patch) => {
      const canvas = canvasRefs.current.get(patch.id || '');
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw oscillator frequencies as vertical bars
      const oscs = patch.oscillators;
      const maxFreq = 2000; // Max frequency for visualization
      const barWidth = canvas.width / oscs.length;
      const centerY = canvas.height / 2;

      ctx.fillStyle = '#00ff88';
      oscs.forEach((osc, i) => {
        const freqRatio = Math.min(1, osc.frequency / maxFreq);
        const x = i * barWidth + 2;
        const height = (freqRatio * canvas.height) / 2;
        const amplitude = osc.amplitude;

        // Draw with amplitude affecting opacity
        ctx.globalAlpha = amplitude;
        ctx.fillRect(x, centerY - height / 2, barWidth - 4, height);
        ctx.globalAlpha = 1.0;
      });

      // Draw center line
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(canvas.width, centerY);
      ctx.stroke();
    });
  }, [population]);

  const getFitnessColor = (fitness: number): string => {
    // Red (bad) to green (good)
    const hue = fitness * 120; // 0=red, 120=green
    return `hsl(${hue}, 100%, 50%)`;
  };

  return (
    <div className="population-grid">
      <h2>🧬 Population ({population.length})</h2>
      
      {population.length === 0 ? (
        <div className="empty-state">
          <p>Initialize or run evolution to see population</p>
        </div>
      ) : (
        <div className="grid-container">
          {population.map((patch, index) => {
            const isFavorite = favorites.has(patch.id || '');
            const isSelected = selectedPatchId === patch.id;
            const isCurrentlyPlaying = playingPatchId === patch.id && isPlaying;

            return (
              <div
                key={patch.id}
                className={`patch-card ${isSelected ? 'selected' : ''} ${isCurrentlyPlaying ? 'playing' : ''}`}
                onClick={() => onSelectPatch(patch)}
              >
                <div className="card-header">
                  <span className="rank">#{index + 1}</span>
                  <button
                    className={`favorite-btn ${isFavorite ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(patch.id || '');
                    }}
                  >
                    {isFavorite ? '⭐' : '☆'}
                  </button>
                </div>

                <canvas
                  ref={(el) => {
                    if (el) canvasRefs.current.set(patch.id || '', el);
                  }}
                  width={180}
                  height={100}
                  className="waveform-canvas"
                />

                <div className="fitness-display">
                  <div
                    className="fitness-bar"
                    style={{
                      width: `${patch.fitness * 100}%`,
                      backgroundColor: getFitnessColor(patch.fitness),
                    }}
                  />
                  <span className="fitness-value">{(patch.fitness * 100).toFixed(1)}%</span>
                </div>

                <div className="card-info">
                  <div className="info-row">
                    <span className="label">Gen:</span>
                    <span className="value">{patch.generationCreated || 0}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Oscs:</span>
                    <span className="value">{patch.oscillators.length}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Freq:</span>
                    <span className="value">
                      {(patch.fitnessMetrics.centroid || 0).toFixed(0)} Hz
                    </span>
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    className={`action-btn play-btn ${isCurrentlyPlaying ? 'playing' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayPatch(patch);
                    }}
                  >
                    {isCurrentlyPlaying ? '⏸️' : '▶️'}
                  </button>
                  <button
                    className="action-btn mutate-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMutatePatch(patch);
                    }}
                  >
                    🧬
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
