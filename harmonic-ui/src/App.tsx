import React, { useState } from 'react';
import './App.css';
import { startPlayback, stopPlayback } from './audio';

interface PatchAnalysis {
  rms: number;
  centroid: number;
  spectrum_peaks: [number, number][];
}

export const App: React.FC = () => {
  const [patch, setPatch] = useState<string>(JSON.stringify({
    oscillators: [{
      type: 'sine',
      frequency: 440,
      amplitude: 0.5,
    }]
  }, null, 2));
  const [analysis, setAnalysis] = useState<PatchAnalysis | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const generatePatch = async () => {
    try {
      // In production, this would call the WASM function
      // const wasm = await import('./pkg/harmonic_ui');
      // const newPatch = wasm.create_random_patch();
      // setPatch(newPatch);
      setPatch(JSON.stringify({
        oscillators: [{
          type: 'sine',
          frequency: Math.random() * 1980 + 20,
          amplitude: Math.random() * 0.9 + 0.1,
        }]
      }, null, 2));
    } catch (error) {
      console.error('Error generating patch:', error);
    }
  };

  const analyzePatch = async () => {
    try {
      // In production, this would call the WASM function
      // const wasm = await import('./pkg/harmonic_ui');
      // const result = wasm.analyze_patch(patch, 1.0);
      // setAnalysis(result);
      setAnalysis({
        rms: Math.random(),
        centroid: Math.random() * 20000,
        spectrum_peaks: [[440, 0.5], [880, 0.3]]
      });
    } catch (error) {
      console.error('Error analyzing patch:', error);
    }
  };

  const mutate = async () => {
    try {
      // const wasm = await import('./pkg/harmonic_ui');
      // const mutated = wasm.mutate_patch(patch);
      // setPatch(mutated);
      const current = JSON.parse(patch);
      current.oscillators[0].frequency *= (0.9 + Math.random() * 0.2);
      setPatch(JSON.stringify(current, null, 2));
    } catch (error) {
      console.error('Error mutating patch:', error);
    }
  };

  const togglePlayback = () => {
    if (isPlaying) {
      stopPlayback();
      setIsPlaying(false);
    } else {
      const success = startPlayback(patch);
      if (success) {
        setIsPlaying(true);
      } else {
        console.error('Failed to start playback');
      }
    }
  };

  const exportPatch = () => {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(patch));
    element.setAttribute('download', 'patch.json');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎵 Harmonic - Patch Evolution</h1>
        <p>Evolve audio synthesis patches with genetic algorithms</p>
      </header>

      <main className="app-main">
        <section className="patch-editor">
          <h2>Patch Editor</h2>
          <textarea
            value={patch}
            onChange={(e) => setPatch(e.target.value)}
            className="patch-input"
            placeholder="Paste or edit patch JSON"
          />
        </section>

        <section className="controls">
          <button onClick={generatePatch} className="btn btn-primary">
            ✨ Generate Random
          </button>
          <button onClick={mutate} className="btn btn-secondary">
            🧬 Mutate
          </button>
          <button onClick={analyzePatch} className="btn btn-secondary">
            📊 Analyze
          </button>
          <button
            onClick={togglePlayback}
            className={`btn ${isPlaying ? 'btn-danger' : 'btn-success'}`}
          >
            {isPlaying ? '⏹️ Stop' : '▶️ Play'}
          </button>
          <button onClick={exportPatch} className="btn btn-secondary">
            💾 Export
          </button>
        </section>

        {analysis && (
          <section className="analysis">
            <h2>Analysis</h2>
            <div className="metrics">
              <div className="metric">
                <label>RMS Energy</label>
                <span>{analysis.rms.toFixed(4)}</span>
              </div>
              <div className="metric">
                <label>Spectral Centroid</label>
                <span>{analysis.centroid.toFixed(2)} Hz</span>
              </div>
            </div>
            <div className="spectrum">
              <h3>Spectrum Peaks</h3>
              <ul>
                {analysis.spectrum_peaks.slice(0, 5).map((peak, i) => (
                  <li key={i}>
                    {peak[0].toFixed(2)} Hz: {peak[1].toFixed(3)}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default App;
