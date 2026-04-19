import React, { useRef, useEffect } from 'react';
import { GenerationStats } from '../EvolutionRunner';
import '../styles/FitnessGraph.css';

interface FitnessGraphProps {
  generationHistory: GenerationStats[];
}

export const FitnessGraph: React.FC<FitnessGraphProps> = ({ generationHistory }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || generationHistory.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const padding = 40;
    const width = canvas.width - padding * 2;
    const height = canvas.height - padding * 2;

    // Clear
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw axes
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(padding, padding);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    // Draw axis labels
    ctx.fillStyle = '#aaa';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Generation', canvas.width / 2, canvas.height - 10);

    ctx.save();
    ctx.translate(15, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Fitness', 0, 0);
    ctx.restore();

    if (generationHistory.length < 2) return;

    // Get data ranges
    const maxGen = generationHistory[generationHistory.length - 1].generation;
    const minFitness = 0;
    const maxFitness = 1;

    // Draw best fitness line (green)
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.beginPath();

    let first = true;
    generationHistory.forEach((stats) => {
      const x = padding + (stats.generation / maxGen) * width;
      const y = canvas.height - padding - (stats.bestFitness / maxFitness) * height;

      if (first) {
        ctx.moveTo(x, y);
        first = false;
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw average fitness line (yellow)
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 2;
    ctx.beginPath();

    first = true;
    generationHistory.forEach((stats) => {
      const x = padding + (stats.generation / maxGen) * width;
      const y = canvas.height - padding - (stats.avgFitness / maxFitness) * height;

      if (first) {
        ctx.moveTo(x, y);
        first = false;
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw worst fitness line (red)
    ctx.strokeStyle = '#ff4466';
    ctx.lineWidth = 2;
    ctx.beginPath();

    first = true;
    generationHistory.forEach((stats) => {
      const x = padding + (stats.generation / maxGen) * width;
      const y = canvas.height - padding - (stats.worstFitness / maxFitness) * height;

      if (first) {
        ctx.moveTo(x, y);
        first = false;
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    // Vertical grid
    for (let i = 0; i <= 5; i++) {
      const x = padding + (i / 5) * width;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, canvas.height - padding);
      ctx.stroke();

      // Generation label
      const gen = Math.round((i / 5) * maxGen);
      ctx.fillStyle = '#666';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(gen.toString(), x, canvas.height - padding + 15);
    }

    // Horizontal grid
    for (let i = 0; i <= 5; i++) {
      const y = canvas.height - padding - (i / 5) * height;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();

      // Fitness label
      const fitness = (i / 5).toFixed(1);
      ctx.fillStyle = '#666';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(fitness, padding - 10, y + 3);
    }

    // Draw legend
    const legendY = padding + 15;
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';

    ctx.fillStyle = '#00ff88';
    ctx.fillRect(canvas.width - 150, legendY, 10, 10);
    ctx.fillStyle = '#fff';
    ctx.fillText('Best', canvas.width - 135, legendY + 10);

    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(canvas.width - 150, legendY + 20, 10, 10);
    ctx.fillStyle = '#fff';
    ctx.fillText('Average', canvas.width - 135, legendY + 30);

    ctx.fillStyle = '#ff4466';
    ctx.fillRect(canvas.width - 150, legendY + 40, 10, 10);
    ctx.fillStyle = '#fff';
    ctx.fillText('Worst', canvas.width - 135, legendY + 50);
  }, [generationHistory]);

  return (
    <div className="fitness-graph">
      <h2>📊 Fitness Over Time</h2>
      <canvas ref={canvasRef} width={600} height={300} className="graph-canvas" />
      <p className="graph-info">
        Green: Best | Orange: Average | Red: Worst
      </p>
    </div>
  );
};
