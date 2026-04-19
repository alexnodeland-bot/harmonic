import React from 'react';
import { PatchConfig, OscillatorConfig, EnvelopeConfig, FilterConfig } from '../synth';
import '../styles/PatchDetailsPanel.css';

interface PatchDetailsPanelProps {
  patch: PatchConfig;
  fitness?: number;
  generation?: number;
  rank?: number;
}

export const PatchDetailsPanel: React.FC<PatchDetailsPanelProps> = ({
  patch,
  fitness = 0,
  generation = 0,
  rank = 0,
}) => {
  const getOscillatorTypeIcon = (type: string): string => {
    const icons: Record<string, string> = {
      sine: '〰️',
      square: '⬜',
      triangle: '🔺',
      sawtooth: '⚡',
    };
    return icons[type] || '◯';
  };

  const getOscillatorColor = (frequency: number): string => {
    const maxFreq = 8000;
    const hue = (frequency / maxFreq) * 120; // 0-120 is green-ish range
    return `hsl(${hue}, 100%, 50%)`;
  };

  return (
    <div className="patch-details-panel">
      {/* Header */}
      <div className="patch-details-header">
        <div>
          {rank > 0 && <span className="badge-rank">#{rank}</span>}
          <h3>Patch Details</h3>
        </div>
        <div className="metrics-mini">
          <div className="metric-mini">
            <span className="label">Fitness</span>
            <span className="value" style={{ color: `hsl(${Math.max(0, Math.min(120, fitness * 120))}, 100%, 50%)` }}>
              {fitness.toFixed(3)}
            </span>
          </div>
          <div className="metric-mini">
            <span className="label">Gen</span>
            <span className="value">{generation}</span>
          </div>
        </div>
      </div>

      {/* Master Volume */}
      <div className="detail-section">
        <h4>Master Volume</h4>
        <div className="volume-bar">
          <div
            className="volume-fill"
            style={{
              width: `${patch.masterVolume * 100}%`,
              background: `linear-gradient(90deg, #00ff88, #0066ff)`,
            }}
          />
        </div>
        <p className="value-text">{(patch.masterVolume * 100).toFixed(0)}%</p>
      </div>

      {/* Oscillators */}
      <div className="detail-section">
        <h4>🎵 Oscillators ({patch.oscillators.length})</h4>
        <div className="oscillators-grid">
          {patch.oscillators.map((osc, i) => (
            <div key={i} className="oscillator-item">
              <div className="osc-type">{getOscillatorTypeIcon(osc.type)}</div>
              <div className="osc-info">
                <div className="osc-freq" style={{ color: getOscillatorColor(osc.frequency) }}>
                  {osc.frequency.toFixed(0)} Hz
                </div>
                <div className="osc-amp">
                  Amp: {osc.amplitude.toFixed(2)}
                </div>
                {osc.detuning && osc.detuning !== 0 && (
                  <div className="osc-detune">
                    Det: {osc.detuning > 0 ? '+' : ''}{osc.detuning}¢
                  </div>
                )}
              </div>
              <div className="osc-bar">
                <div
                  className="osc-bar-fill"
                  style={{
                    height: `${osc.amplitude * 100}%`,
                    background: getOscillatorColor(osc.frequency),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Envelope (ADSR) */}
      <div className="detail-section">
        <h4>📈 Envelope (ADSR)</h4>
        <div className="envelope-display">
          <EnvelopeVisualization envelope={patch.envelope} />
        </div>
        <div className="envelope-values">
          <div className="envelope-value">
            <span className="label">Attack</span>
            <span className="value">{(patch.envelope.attack * 1000).toFixed(0)}ms</span>
          </div>
          <div className="envelope-value">
            <span className="label">Decay</span>
            <span className="value">{(patch.envelope.decay * 1000).toFixed(0)}ms</span>
          </div>
          <div className="envelope-value">
            <span className="label">Sustain</span>
            <span className="value">{(patch.envelope.sustain * 100).toFixed(0)}%</span>
          </div>
          <div className="envelope-value">
            <span className="label">Release</span>
            <span className="value">{(patch.envelope.release * 1000).toFixed(0)}ms</span>
          </div>
        </div>
      </div>

      {/* Filter */}
      {patch.filter && (
        <div className="detail-section">
          <h4>🔊 Filter {patch.filter.enabled ? '✓' : '✗'}</h4>
          {patch.filter.enabled ? (
            <div className="filter-info">
              <div className="filter-value">
                <span className="label">Frequency</span>
                <span className="value">{patch.filter.frequency.toFixed(0)} Hz</span>
              </div>
              <div className="filter-value">
                <span className="label">Resonance (Q)</span>
                <span className="value">{patch.filter.resonance.toFixed(1)}</span>
              </div>
              <div className="filter-visual">
                <FilterVisualization filter={patch.filter} />
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-dim)', margin: 0 }}>Filter is disabled</p>
          )}
        </div>
      )}

      {/* Spectral Stats */}
      <div className="detail-section">
        <h4>📊 Spectral Analysis</h4>
        <div className="spectral-stats">
          <div className="stat-row">
            <span className="label">Centroid</span>
            <span className="value">
              {(
                patch.oscillators.reduce((sum, o) => sum + o.frequency * o.amplitude, 0) /
                (patch.oscillators.reduce((sum, o) => sum + o.amplitude, 0) || 1)
              ).toFixed(0)}{' '}
              Hz
            </span>
          </div>
          <div className="stat-row">
            <span className="label">Avg Amplitude</span>
            <span className="value">
              {(patch.oscillators.reduce((sum, o) => sum + o.amplitude, 0) / patch.oscillators.length).toFixed(3)}
            </span>
          </div>
          <div className="stat-row">
            <span className="label">Lowest Note</span>
            <span className="value">{Math.min(...patch.oscillators.map((o) => o.frequency)).toFixed(0)} Hz</span>
          </div>
          <div className="stat-row">
            <span className="label">Highest Note</span>
            <span className="value">{Math.max(...patch.oscillators.map((o) => o.frequency)).toFixed(0)} Hz</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * ADSR Envelope Visualization
 */
const EnvelopeVisualization: React.FC<{ envelope: EnvelopeConfig }> = ({ envelope }) => {
  const width = 200;
  const height = 80;
  const padding = 10;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  // Calculate points
  const attackEnd = (envelope.attack / (envelope.attack + envelope.decay + 0.5)) * graphWidth;
  const decayEnd = attackEnd + (envelope.decay / (envelope.attack + envelope.decay + 0.5)) * graphWidth;

  return (
    <svg width={width} height={height} className="envelope-svg">
      {/* Grid background */}
      <defs>
        <pattern id="grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width={width} height={height} fill="url(#grid-pattern)" />

      {/* Sustain level line */}
      <line
        x1={padding}
        y1={padding + graphHeight * (1 - envelope.sustain)}
        x2={width - padding}
        y2={padding + graphHeight * (1 - envelope.sustain)}
        stroke="rgba(0, 255, 136, 0.3)"
        strokeWidth="1"
        strokeDasharray="3,3"
      />

      {/* Attack line */}
      <line
        x1={padding}
        y1={padding + graphHeight}
        x2={padding + attackEnd}
        y2={padding}
        stroke="var(--primary)"
        strokeWidth="2"
      />

      {/* Decay line */}
      <line
        x1={padding + attackEnd}
        y1={padding}
        x2={padding + decayEnd}
        y2={padding + graphHeight * (1 - envelope.sustain)}
        stroke="var(--primary)"
        strokeWidth="2"
      />

      {/* Sustain line */}
      <line
        x1={padding + decayEnd}
        y1={padding + graphHeight * (1 - envelope.sustain)}
        x2={width - padding}
        y2={padding + graphHeight * (1 - envelope.sustain)}
        stroke="var(--primary)"
        strokeWidth="2"
      />

      {/* Release indicator (dashed) */}
      <line
        x1={width - padding}
        y1={padding + graphHeight * (1 - envelope.sustain)}
        x2={width - padding}
        y2={padding + graphHeight}
        stroke="var(--primary)"
        strokeWidth="2"
        strokeDasharray="4,2"
      />
    </svg>
  );
};

/**
 * Filter Frequency Response Visualization
 */
const FilterVisualization: React.FC<{ filter: FilterConfig }> = ({ filter }) => {
  const width = 200;
  const height = 60;
  const padding = 5;

  // Simple visualization: resonance peak
  const centerX = (filter.frequency / 8000) * (width - padding * 2) + padding;
  const peakHeight = Math.min(filter.resonance / 10, 0.9) * (height - padding * 2);

  return (
    <svg width={width} height={height} className="filter-svg">
      {/* Background */}
      <rect width={width} height={height} fill="rgba(0, 0, 0, 0.3)" rx="4" />

      {/* Baseline */}
      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        stroke="rgba(0, 255, 136, 0.3)"
        strokeWidth="1"
      />

      {/* Resonance peak */}
      <circle
        cx={centerX}
        cy={height - padding - peakHeight}
        r="3"
        fill="var(--primary)"
      />

      {/* Curve approximation */}
      <path
        d={`M ${padding} ${height - padding} 
           Q ${centerX} ${height - padding - peakHeight} ${width - padding} ${height - padding}`}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="1.5"
        opacity="0.6"
      />

      {/* Frequency label */}
      <text
        x={centerX}
        y={height - 2}
        fontSize="10"
        fill="var(--text-dim)"
        textAnchor="middle"
      >
        {(filter.frequency / 1000).toFixed(1)}k
      </text>
    </svg>
  );
};

export default PatchDetailsPanel;
