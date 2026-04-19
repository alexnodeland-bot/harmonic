# Fitness Evaluation

**Fitness** measures how good a genome (patch) is, from 0 (worst) to 1 (best).

## Fitness Components

Harmonic uses multiple audio metrics:

### 1. Spectrum Distance
Measures similarity between the patch's spectrum and a target:

- Lower is better
- Uses simple DFT (Discrete Fourier Transform)
- Good for frequency-based matching

### 2. Energy
Measures the overall loudness/amplitude:

- 0-1 scale
- Clamp to prevent clipping
- Good for dynamic matching

### 3. Spectral Centroid
Measures the "brightness" of the sound:

- Center of mass of the spectrum
- Lower values = darker sounds
- Higher values = brighter sounds

## Fitness Weights

You control how much each component matters:

```rust
let weights = FitnessWeights {
    spectrum_weight: 0.5,  // Emphasize spectral shape
    energy_weight: 0.3,    // Moderate energy matching
    centroid_weight: 0.2,  // Less emphasis on brightness
};
```

## Computing Fitness

The final fitness score combines all components:

```
fitness = (spectrum * spectrum_weight + 
           energy * energy_weight + 
           centroid * centroid_weight)
```

All components are normalized to 0-1 before combining.

## Example

```rust
use harmonic_core::fitness::FitnessEvaluator;
use harmonic_core::audio::AudioAnalyzer;

let analyzer = AudioAnalyzer::new(44100.0, 1.0);
let evaluator = FitnessEvaluator::new(analyzer);

// Evaluate a genome
let fitness = evaluator.evaluate(&genome);
println!("Score: {}", fitness.score);
println!("Spectrum distance: {}", fitness.spectrum_distance);
println!("Energy: {}", fitness.energy);
println!("Centroid: {}", fitness.centroid);
```

## Tips for Better Fitness

- **Set realistic targets**: Don't aim for impossible combinations
- **Tune weights**: Emphasize what matters most to you
- **Use multiple metrics**: Single metrics can lead to local optima
- **Provide feedback**: Use listener preferences as fitness signals
