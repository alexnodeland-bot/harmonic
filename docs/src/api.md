# API Reference

Core types and functions in harmonic-core.

## Configuration

### `EvolutionConfig`

```rust
pub struct EvolutionConfig {
    pub generations: u32,
    pub population_size: u32,
    pub mutation_rate: f32,
    pub crossover_rate: f32,
    pub elite_size: u32,
    pub fitness_weights: FitnessWeights,
}
```

**Methods:**
- `fn default() -> Self` - Create default configuration
- `fn validate(&self) -> Result<(), String>` - Validate parameters

## Genome

### `Genome`

Represents an audio synthesis patch.

**Methods:**
- `fn random() -> Self` - Create random genome
- `fn mutate(&self, rate: f32) -> Self` - Apply mutation
- `fn crossover(&self, other: &Genome) -> Genome` - Breed with another
- `fn to_json_string(&self) -> Result<String>` - Serialize to JSON
- `fn from_json_string(json: &str) -> Result<Self>` - Deserialize from JSON

## Fitness

### `Fitness`

Audio quality score.

```rust
pub struct Fitness {
    pub score: f32,              // Overall score (0-1)
    pub spectrum_distance: f32,  // Distance from target
    pub energy: f32,             // Overall energy
    pub centroid: f32,           // Spectral centroid
}
```

**Methods:**
- `fn new(score, spectrum_distance, energy, centroid) -> Self`
- `fn is_better_than(&self, other: &Fitness) -> bool`

### `FitnessEvaluator`

Evaluates genomes.

**Methods:**
- `fn new(analyzer: AudioAnalyzer) -> Self`
- `fn evaluate(&self, genome: &Genome) -> Fitness`
- `fn set_target_spectrum(&mut self, spectrum: Vec<f32>)`

## Audio

### `AudioAnalyzer`

Analyzes audio properties.

**Methods:**
- `fn new(sample_rate: f32, duration: f32) -> Self`
- `fn compute_spectrum(&self, audio: &[f32]) -> Vec<f32>`
- `fn compute_energy(&self, audio: &[f32]) -> f32`
- `fn compute_centroid(&self, audio: &[f32]) -> f32`

## Example

```rust
use harmonic_core::{
    config::EvolutionConfig,
    genome::Genome,
    fitness::FitnessEvaluator,
    audio::AudioAnalyzer,
};

fn main() -> Result<()> {
    // Configure
    let config = EvolutionConfig::default();
    
    // Setup evaluation
    let analyzer = AudioAnalyzer::new(44100.0, 1.0);
    let evaluator = FitnessEvaluator::new(analyzer);
    
    // Evolve
    let mut best = Genome::random();
    let mut best_fitness = evaluator.evaluate(&best);
    
    for gen in 0..config.generations {
        let candidate = best.mutate(config.mutation_rate);
        let fitness = evaluator.evaluate(&candidate);
        
        if fitness.is_better_than(&best_fitness) {
            best = candidate;
            best_fitness = fitness;
            println!("Gen {}: {}", gen, best_fitness.score);
        }
    }
    
    println!("Final best: {}", best_fitness.score);
    Ok(())
}
```

For full API documentation, run:

```bash
cargo doc --no-deps --open
```
