use serde::{Deserialize, Serialize};
use std::cmp::Ordering;

/// Fitness score for a genome
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub struct Fitness {
    /// Overall fitness score (0-1, higher is better)
    pub score: f32,
    /// Spectrum distance component (lower is better)
    pub spectrum_distance: f32,
    /// Energy component (0-1, closer to target is better)
    pub energy: f32,
    /// Spectral centroid component
    pub centroid: f32,
}

impl Fitness {
    pub fn new(score: f32, spectrum_distance: f32, energy: f32, centroid: f32) -> Self {
        Self {
            score: score.clamp(0.0, 1.0),
            spectrum_distance,
            energy,
            centroid,
        }
    }

    pub fn is_better_than(&self, other: &Fitness) -> bool {
        self.score > other.score
    }
}

impl Default for Fitness {
    fn default() -> Self {
        Self {
            score: 0.0,
            spectrum_distance: f32::MAX,
            energy: 0.0,
            centroid: 0.0,
        }
    }
}

impl PartialOrd for Fitness {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        self.score.partial_cmp(&other.score)
    }
}

impl Eq for Fitness {}

impl Ord for Fitness {
    fn cmp(&self, other: &Self) -> Ordering {
        self.partial_cmp(other).unwrap_or(Ordering::Equal)
    }
}

/// Fitness evaluator for audio patches
pub struct FitnessEvaluator {
    pub weights: FitnessWeights,
    pub target_spectrum: Option<Vec<f32>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FitnessWeights {
    /// Weight for spectrum matching (default 0.4)
    pub spectrum_weight: f32,
    /// Weight for energy (default 0.3)
    pub energy_weight: f32,
    /// Weight for centroid (default 0.3)
    pub centroid_weight: f32,
    /// Target energy level (0-1)
    pub target_energy: f32,
    /// Target spectral centroid (Hz)
    pub target_centroid: f32,
}

impl Default for FitnessWeights {
    fn default() -> Self {
        Self {
            spectrum_weight: 0.4,
            energy_weight: 0.3,
            centroid_weight: 0.3,
            target_energy: 0.5,
            target_centroid: 1000.0,
        }
    }
}

impl FitnessEvaluator {
    pub fn new(weights: FitnessWeights, target_spectrum: Option<Vec<f32>>) -> Self {
        Self {
            weights,
            target_spectrum,
        }
    }

    /// Evaluate a patch based on audio output
    pub fn evaluate(&self, audio_data: &[f32]) -> Fitness {
        // Compute FFT spectrum
        let spectrum = self.compute_spectrum(audio_data);

        // Compute spectrum distance
        let spectrum_distance = if let Some(target) = &self.target_spectrum {
            self.spectrum_distance(&spectrum, target)
        } else {
            // Without target, measure peak presence
            spectrum.iter().fold(0.0f32, |a: f32, &b| a.max(b))
        };

        // Compute energy
        let energy = self.compute_energy(audio_data);
        let energy_diff = (energy - self.weights.target_energy).abs();
        let energy_score = 1.0 - (energy_diff / self.weights.target_energy).clamp(0.0, 1.0);

        // Compute spectral centroid
        let centroid = self.compute_centroid(&spectrum);
        let centroid_diff = (centroid - self.weights.target_centroid).abs();
        let centroid_score = 1.0 - (centroid_diff / 20000.0).clamp(0.0, 1.0);

        // Combine scores
        let spectrum_score = 1.0 - spectrum_distance.clamp(0.0, 1.0);
        let combined_score = self.weights.spectrum_weight * spectrum_score
            + self.weights.energy_weight * energy_score
            + self.weights.centroid_weight * centroid_score;

        Fitness::new(
            combined_score,
            spectrum_distance,
            energy_score,
            centroid_score,
        )
    }

    /// Compute FFT spectrum using Goertzel-like approach or simple periodogram
    fn compute_spectrum(&self, audio_data: &[f32]) -> Vec<f32> {
        let n = audio_data.len();
        let mut spectrum = vec![0.0; n / 2];

        // Simple DFT for demonstration (in production, use proper FFT library)
        for k in 0..spectrum.len() {
            let mut real = 0.0;
            let mut imag = 0.0;
            let angle_step = 2.0 * std::f32::consts::PI * k as f32 / n as f32;

            for (i, &sample) in audio_data.iter().enumerate() {
                let angle = angle_step * i as f32;
                real += sample * angle.cos();
                imag += sample * angle.sin();
            }

            spectrum[k] = (real * real + imag * imag).sqrt() / n as f32;
        }

        spectrum
    }

    /// Compute energy of audio signal
    fn compute_energy(&self, audio_data: &[f32]) -> f32 {
        let rms = (audio_data.iter().map(|&s| s * s).sum::<f32>() / audio_data.len() as f32)
            .sqrt();
        // Normalize to 0-1 range (assuming max amplitude 1.0)
        rms.clamp(0.0, 1.0)
    }

    /// Compute spectral centroid
    fn compute_centroid(&self, spectrum: &[f32]) -> f32 {
        let sum: f32 = spectrum.iter().sum();
        if sum == 0.0 {
            return 0.0;
        }

        let mut weighted_sum = 0.0;
        let sample_rate = 44100.0; // Standard sample rate
        let freq_resolution = sample_rate / (spectrum.len() * 2) as f32;

        for (i, &magnitude) in spectrum.iter().enumerate() {
            let freq = i as f32 * freq_resolution;
            weighted_sum += freq * magnitude;
        }

        weighted_sum / sum
    }

    /// Calculate distance between two spectra
    fn spectrum_distance(&self, spectrum: &[f32], target: &[f32]) -> f32 {
        let len = spectrum.len().min(target.len());
        let mut distance = 0.0;

        for i in 0..len {
            let diff = spectrum[i] - target[i];
            distance += diff * diff;
        }

        (distance / len as f32).sqrt().clamp(0.0, 1.0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fitness_creation() {
        let fitness = Fitness::new(0.8, 0.2, 0.7, 0.9);
        assert_eq!(fitness.score, 0.8);
    }

    #[test]
    fn test_fitness_ordering() {
        let f1 = Fitness::new(0.8, 0.2, 0.7, 0.9);
        let f2 = Fitness::new(0.6, 0.4, 0.5, 0.7);
        assert!(f1.is_better_than(&f2));
    }

    #[test]
    fn test_weights_default() {
        let weights = FitnessWeights::default();
        let sum = weights.spectrum_weight + weights.energy_weight + weights.centroid_weight;
        assert!((sum - 1.0).abs() < 0.01);
    }

    #[test]
    fn test_evaluator_energy() {
        let evaluator = FitnessEvaluator::new(FitnessWeights::default(), None);
        let audio = vec![0.5; 1024];
        let energy = evaluator.compute_energy(&audio);
        assert!(energy > 0.0 && energy <= 1.0);
    }

    #[test]
    fn test_evaluator_spectrum() {
        let evaluator = FitnessEvaluator::new(FitnessWeights::default(), None);
        let audio = vec![0.5; 1024];
        let spectrum = evaluator.compute_spectrum(&audio);
        assert_eq!(spectrum.len(), 512);
    }

    #[test]
    fn test_evaluator_centroid() {
        let evaluator = FitnessEvaluator::new(FitnessWeights::default(), None);
        let audio = vec![0.5; 1024];
        let spectrum = evaluator.compute_spectrum(&audio);
        let centroid = evaluator.compute_centroid(&spectrum);
        assert!(centroid >= 0.0);
    }

    #[test]
    fn test_fitness_evaluation() {
        let evaluator = FitnessEvaluator::new(FitnessWeights::default(), None);
        let audio = vec![0.5; 1024];
        let fitness = evaluator.evaluate(&audio);
        assert!(fitness.score >= 0.0 && fitness.score <= 1.0);
    }
}
