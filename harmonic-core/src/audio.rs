use serde::{Deserialize, Serialize};

/// Audio analyzer for patch evaluation
pub struct AudioAnalyzer {
    pub sample_rate: f32,
    pub duration: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioSpec {
    pub sample_rate: f32,
    pub duration: f32,
    pub channels: u32,
}

impl Default for AudioSpec {
    fn default() -> Self {
        Self {
            sample_rate: 44100.0,
            duration: 1.0, // 1 second
            channels: 1,
        }
    }
}

impl AudioAnalyzer {
    pub fn new(sample_rate: f32, duration: f32) -> Self {
        Self {
            sample_rate,
            duration,
        }
    }

    /// Generate audio from a patch (placeholder - real implementation would use quiver)
    pub fn synthesize(&self, patch: &serde_json::Value) -> anyhow::Result<Vec<f32>> {
        let num_samples = (self.sample_rate * self.duration) as usize;
        let mut audio = vec![0.0; num_samples];

        // Extract oscillator parameters
        if let Some(oscs) = patch.get("oscillators").and_then(|v| v.as_array()) {
            for osc in oscs {
                let freq = osc
                    .get("frequency")
                    .and_then(|v| v.as_f64())
                    .unwrap_or(440.0) as f32;
                let amp = osc
                    .get("amplitude")
                    .and_then(|v| v.as_f64())
                    .unwrap_or(0.5) as f32;
                let phase = osc
                    .get("phase")
                    .and_then(|v| v.as_f64())
                    .unwrap_or(0.0) as f32;

                // Generate sine wave
                for (i, sample) in audio.iter_mut().enumerate() {
                    let t = i as f32 / self.sample_rate;
                    let sine = (2.0 * std::f32::consts::PI * freq * t + phase).sin();
                    *sample += amp * sine;
                }
            }
        }

        // Apply envelope if present
        if let Some(env) = patch.get("envelope").and_then(|v| v.as_object()) {
            let attack = env
                .get("attack")
                .and_then(|v| v.as_f64())
                .unwrap_or(0.01) as f32;
            let decay = env
                .get("decay")
                .and_then(|v| v.as_f64())
                .unwrap_or(0.2) as f32;
            let sustain = env
                .get("sustain")
                .and_then(|v| v.as_f64())
                .unwrap_or(0.7) as f32;
            let release = env
                .get("release")
                .and_then(|v| v.as_f64())
                .unwrap_or(0.5) as f32;

            let attack_samples = (attack * self.sample_rate) as usize;
            let decay_samples = (decay * self.sample_rate) as usize;
            let release_samples = (release * self.sample_rate) as usize;
            let sustain_samples = num_samples.saturating_sub(attack_samples + decay_samples + release_samples);

            for i in 0..num_samples {
                let env_val = if i < attack_samples {
                    i as f32 / attack_samples as f32
                } else if i < attack_samples + decay_samples {
                    let decay_i = i - attack_samples;
                    1.0 - (1.0 - sustain) * (decay_i as f32 / decay_samples as f32)
                } else if i < attack_samples + decay_samples + sustain_samples {
                    sustain
                } else {
                    let release_i = i - (attack_samples + decay_samples + sustain_samples);
                    sustain * (1.0 - (release_i as f32 / release_samples as f32))
                };
                audio[i] *= env_val;
            }
        }

        // Apply filter if present (simple first-order lowpass)
        if let Some(filter) = patch.get("filter").and_then(|v| v.as_object()) {
            let cutoff = filter
                .get("cutoff")
                .and_then(|v| v.as_f64())
                .unwrap_or(8000.0) as f32;
            
            // Simple RC lowpass filter coefficient
            let rc = 1.0 / (2.0 * std::f32::consts::PI * cutoff);
            let dt = 1.0 / self.sample_rate;
            let alpha = dt / (rc + dt);

            let mut filtered = vec![0.0; audio.len()];
            filtered[0] = audio[0];
            for i in 1..audio.len() {
                filtered[i] = filtered[i - 1] + alpha * (audio[i] - filtered[i - 1]);
            }
            audio = filtered;
        }

        // Normalize to prevent clipping
        let max_amp = audio.iter().map(|s| s.abs()).fold(0.0, f32::max);
        if max_amp > 1.0 {
            audio.iter_mut().for_each(|s| *s /= max_amp);
        }

        Ok(audio)
    }

    /// Analyze audio spectral characteristics
    pub fn analyze_spectrum(&self, audio: &[f32]) -> SpectralAnalysis {
        let rms = (audio.iter().map(|&s| s * s).sum::<f32>() / audio.len() as f32).sqrt();
        
        // Simple spectrum computation
        let n = audio.len();
        let mut spectrum = vec![0.0; n / 2];
        for k in 0..spectrum.len() {
            let mut real = 0.0;
            let mut imag = 0.0;
            let angle_step = 2.0 * std::f32::consts::PI * k as f32 / n as f32;
            
            for (i, &sample) in audio.iter().enumerate() {
                let angle = angle_step * i as f32;
                real += sample * angle.cos();
                imag += sample * angle.sin();
            }
            spectrum[k] = (real * real + imag * imag).sqrt() / n as f32;
        }

        let sum: f32 = spectrum.iter().sum();
        let centroid = if sum > 0.0 {
            let sample_rate = self.sample_rate;
            let freq_resolution = sample_rate / (spectrum.len() * 2) as f32;
            let mut weighted_sum = 0.0;
            for (i, &magnitude) in spectrum.iter().enumerate() {
                let freq = i as f32 * freq_resolution;
                weighted_sum += freq * magnitude;
            }
            weighted_sum / sum
        } else {
            0.0
        };

        SpectralAnalysis {
            rms,
            spectrum,
            centroid,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpectralAnalysis {
    pub rms: f32,
    pub spectrum: Vec<f32>,
    pub centroid: f32,
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_analyzer_creation() {
        let analyzer = AudioAnalyzer::new(44100.0, 1.0);
        assert_eq!(analyzer.sample_rate, 44100.0);
    }

    #[test]
    fn test_synthesize_simple() {
        let analyzer = AudioAnalyzer::new(44100.0, 0.1);
        let patch = json!({
            "oscillators": [
                {"frequency": 440.0, "amplitude": 0.5, "phase": 0.0}
            ]
        });
        let audio = analyzer.synthesize(&patch).unwrap();
        assert_eq!(audio.len(), 4410);
    }

    #[test]
    fn test_analyze_spectrum() {
        let analyzer = AudioAnalyzer::new(44100.0, 0.1);
        let audio = vec![0.5; 4410];
        let analysis = analyzer.analyze_spectrum(&audio);
        assert!(analysis.rms > 0.0);
        assert!(analysis.spectrum.len() > 0);
    }
}
