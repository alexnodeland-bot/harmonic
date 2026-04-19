import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import {
  startPlayback,
  stopPlayback,
  generateRandomPatch,
  mutatePatches,
  getDefaultPatch,
  getAnalyser,
  type PatchConfig,
} from './synth';

interface PatchAnalysis {
  rms: number;
  centroid: number;
  spectrum_peaks: [number, number][];
}

export const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [patch, setPatch] = useState<string>(JSON.stringify(getDefaultPatch(), null, 2));
  const [analysis, setAnalysis] = useState<PatchAnalysis | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationFrameRef = useRef<number | null>(null);

  // Spectrum visualization
  useEffect(() => {
    if (!isPlaying || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = getAnalyser();
    if (!analyser) return;

    const draw = () => {
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      // Clear
      ctx.fillStyle = 'rgb(20, 20, 20)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw bars
      ctx.fillStyle = '#00ff88';
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i += 3) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  const generatePatch = () => {
    const newPatch = generateRandomPatch();
    setPatch(JSON.stringify(newPatch, null, 2));
  };

  const analyzePatch = async () => {
    try {
      const config: PatchConfig = JSON.parse(patch);
      const totalAmp = config.oscillators.reduce((sum, o) => sum + o.amplitude, 0);
      const centroid = config.oscillators.reduce(
        (sum, o) => sum + (o.frequency * o.amplitude),
        0
      ) / (totalAmp || 1);

      setAnalysis({
        rms: totalAmp / config.oscillators.length,
        centroid: centroid,
        spectrum_peaks: config.oscillators.map((o, i) => [o.frequency, o.amplitude] as [number, number]),
      });
    } catch (error) {
      console.error('Error analyzing patch:', error);
    }
  };

  const mutate = () => {
    const mutated = mutatePatches(patch);
    setPatch(mutated);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      stopPlayback();
      setIsPlaying(false);
    } else {
      const success = startPlayback(patch);
      if (success) {
        setIsPlaying(true);
        analyzePatch();
      }
    }
  };

  const exportPatch = () => {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(patch));
    element.setAttribute('download', 'harmonic-patch.json');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const importPatch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        setPatch(JSON.stringify(parsed, null, 2));
      } catch (error) {
        alert('Invalid patch file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎵 Harmonic</h1>
        <p>Evolve audio synthesis patches interactively</p>
      </header>

      <main className="app-main">
        <div className="layout">
          {/* Control Panel */}
          <section className="control-panel">
            <h2>Patch Control</h2>
            <div className="button-group">
              <button onClick={generatePatch} className="btn btn-primary">
                ✨ Random
              </button>
              <button onClick={mutate} className="btn btn-secondary">
                🧬 Mutate
              </button>
              <button
                onClick={togglePlayback}
                className={`btn ${isPlaying ? 'btn-danger' : 'btn-success'}`}
              >
                {isPlaying ? '⏹️ Stop' : '▶️ Play'}
              </button>
            </div>

            <div className="button-group">
              <button onClick={analyzePatch} className="btn btn-secondary">
                📊 Analyze
              </button>
              <button onClick={exportPatch} className="btn btn-secondary">
                💾 Export
              </button>
              <label className="btn btn-secondary">
                📂 Import
                <input
                  type="file"
                  accept=".json"
                  onChange={importPatch}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* Spectrum Visualizer */}
            <div className="spectrum-section">
              <h3>Spectrum</h3>
              <canvas
                ref={canvasRef}
                width={300}
                height={150}
                className="spectrum-canvas"
              />
            </div>

            {/* Analysis */}
            {analysis && (
              <div className="analysis-panel">
                <h3>Analysis</h3>
                <div className="metrics">
                  <div className="metric">
                    <label>Avg Amplitude</label>
                    <span>{analysis.rms.toFixed(3)}</span>
                  </div>
                  <div className="metric">
                    <label>Centroid</label>
                    <span>{analysis.centroid.toFixed(0)} Hz</span>
                  </div>
                </div>
                <div className="peaks">
                  <h4>Oscillators</h4>
                  <ul>
                    {analysis.spectrum_peaks.slice(0, 5).map((peak, i) => (
                      <li key={i}>
                        {peak[0].toFixed(0)} Hz ({peak[1].toFixed(3)} amp)
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>

          {/* Patch Editor */}
          <section className="patch-editor">
            <h2>Patch JSON</h2>
            <textarea
              value={patch}
              onChange={(e) => setPatch(e.target.value)}
              className="patch-input"
              placeholder="Edit patch configuration"
            />
            <p className="help-text">
              Edit oscillators, envelope, and filter settings. Click Play to hear changes.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default App;
