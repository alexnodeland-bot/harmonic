# Quick Start

Get up and running with Harmonic in 5 minutes.

## Installation

### Build from source

```bash
git clone https://github.com/alexnodeland/harmonic.git
cd harmonic
cargo build --release
```

### Add to your Rust project

```toml
[dependencies]
harmonic-core = "0.1.0"
```

## Your First Evolution

### 1. Create a config file

Create `config.toml`:

```toml
[evolution]
generations = 50
population_size = 20
mutation_rate = 0.3
crossover_rate = 0.7

[audio]
sample_rate = 44100.0
duration_seconds = 1.0

[fitness]
spectrum_weight = 0.5
energy_weight = 0.3
centroid_weight = 0.2
```

### 2. Run evolution

```bash
# Using the CLI
harmonic run --config config.toml --output evolution_result.json
```

### 3. Listen to results

```bash
# Play the best patch found
harmonic listen --patch evolution_result.json

# Export as audio file
harmonic export --patch evolution_result.json --audio best.wav
```

## Using as a Library

```rust
use harmonic_core::{
    audio::AudioAnalyzer,
    config::EvolutionConfig,
    fitness::FitnessEvaluator,
    genome::Genome,
};

fn main() {
    // Create configuration
    let config = EvolutionConfig::default();
    
    // Create evaluator
    let analyzer = AudioAnalyzer::new(44100.0, 1.0);
    let evaluator = FitnessEvaluator::new(analyzer);
    
    // Create random genome
    let genome = Genome::random();
    
    // Evaluate fitness
    let fitness = evaluator.evaluate(&genome);
    println!("Fitness: {}", fitness.score);
}
```

## Common Patterns

### Evolving toward a target spectrum

```rust
let target_spectrum = [0.8, 0.6, 0.4, 0.2];
let mut evaluator = FitnessEvaluator::new(analyzer);
evaluator.set_target_spectrum(target_spectrum.to_vec());
```

### Using custom fitness weights

```rust
let config = EvolutionConfig {
    fitness_weights: FitnessWeights {
        spectrum_weight: 0.7,
        energy_weight: 0.2,
        centroid_weight: 0.1,
    },
    ..Default::default()
};
```

## Next Steps

- Explore [Core Concepts](concepts.md) for deeper understanding
- Check out [Examples](examples.md) for more patterns
- Read [Performance Tips](performance.md) to optimize your runs
