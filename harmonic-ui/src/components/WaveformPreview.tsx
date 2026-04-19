import React, { useEffect, useRef } from 'react';
import { PatchConfig } from '../synth';
import '../styles/WaveformPreview.css';

interface WaveformPreviewProps {
  patch: PatchConfig;
  width?: number;
  height?: number;
}

export const WaveformPreview: React.FC<WaveformPreviewProps> = ({
  patch,
  width = 250,
  height = 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, width, height);

    // Draw waveform for each oscillator
    drawWaveform(ctx, patch, width, height);

    // Draw spectrum preview (colored bars for each oscillator)
    drawSpectrumPreview(ctx, patch, width, height);

    // Draw centroid needle
    drawCentroidNeedle(ctx, patch, width, height);
  }, [patch, width, height]);

  const drawWaveform = (
    ctx: CanvasRenderingContext2D,
    patch: PatchConfig,
    width: number,
    height: number
  ) => {
    if (!patch.oscillators.length) return;

    const centerY = height / 2;
    const sampleRate = 44100;
    const duration = 0.05; // 50ms window
    const samples = Math.floor(sampleRate * duration);

    // Calculate combined waveform
    const waveform: number[] = [];
    const maxFreq = Math.max(...patch.oscillators.map((o) => o.frequency));
    const totalAmp = patch.oscillators.reduce((sum, o) => sum + o.amplitude, 0) || 1;

    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      let sample = 0;

      patch.oscillators.forEach((osc) => {
        const phase = (2 * Math.PI * osc.frequency * t) + (osc.detuning || 0) * 0.0059;
        let oscSample = 0;

        switch (osc.type) {
          case 'sine':
            oscSample = Math.sin(phase);
            break;
          case 'square':
            oscSample = Math.sin(phase) > 0 ? 1 : -1;
            break;
          case 'triangle':
            oscSample = (Math.asin(Math.sin(phase)) * 2) / Math.PI;
            break;
          case 'sawtooth':
            oscSample = (2 * ((phase / (2 * Math.PI)) % 1)) - 1;
            break;
        }

        sample += oscSample * osc.amplitude;
      });

      waveform.push(sample / totalAmp);
    }

    // Draw waveform
    const pixelsPerSample = width / samples;
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    waveform.forEach((sample, i) => {
      const x = i * pixelsPerSample;
      const y = centerY - (sample * (centerY - 4));

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw center line
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
  };

  const drawSpectrumPreview = (
    ctx: CanvasRenderingContext2D,
    patch: PatchConfig,
    width: number,
    height: number
  ) => {
    if (!patch.oscillators.length) return;

    const barWidth = width / Math.max(4, patch.oscillators.length);
    const maxFreq = 8000; // Assume 8kHz range
    const colors = ['#00ff88', '#0066ff', '#ff0088', '#ffaa00'];

    patch.oscillators.forEach((osc, i) => {
      const x = i * barWidth + 2;
      const w = barWidth - 4;

      // Height based on amplitude
      const barHeight = (osc.amplitude / (patch.masterVolume || 0.5)) * (height * 0.5);
      const y = height - barHeight;

      // Color based on frequency
      const hue = ((osc.frequency / maxFreq) * 360) % 360;
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;

      ctx.fillRect(x, y, w, barHeight);

      // Add subtle border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, barHeight);
    });
  };

  const drawCentroidNeedle = (
    ctx: CanvasRenderingContext2D,
    patch: PatchConfig,
    width: number,
    height: number
  ) => {
    if (!patch.oscillators.length) return;

    // Calculate spectral centroid
    const totalAmp = patch.oscillators.reduce((sum, o) => sum + o.amplitude, 0) || 1;
    const centroid = patch.oscillators.reduce(
      (sum, o) => sum + (o.frequency * o.amplitude),
      0
    ) / totalAmp;

    // Map centroid to x position (0-8000 Hz)
    const maxFreq = 8000;
    const normalizedCentroid = Math.min(centroid / maxFreq, 1);
    const needleX = normalizedCentroid * width;

    // Draw needle
    ctx.strokeStyle = 'rgba(255, 200, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(needleX, height - 2);
    ctx.lineTo(needleX, 2);
    ctx.stroke();

    // Draw dot at top
    ctx.fillStyle = 'rgba(255, 200, 0, 1)';
    ctx.beginPath();
    ctx.arc(needleX, 2, 3, 0, Math.PI * 2);
    ctx.fill();
  };

  return (
    <div className="waveform-preview-container">
      <canvas
        ref={canvasRef}
        className="waveform-preview-canvas"
        width={width}
        height={height}
      />
      <p className="waveform-label">
        {patch.oscillators.length} osc • Centroid: ~{
          Math.round(
            (patch.oscillators.reduce((sum, o) => sum + o.frequency * o.amplitude, 0) /
              (patch.oscillators.reduce((sum, o) => sum + o.amplitude, 0) || 1)) * 10
          ) / 10
        } Hz
      </p>
    </div>
  );
};

export default WaveformPreview;
