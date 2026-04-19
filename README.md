# 🎵 Harmonic

[![CI](https://github.com/alexnodeland-bot/harmonic/workflows/CI/badge.svg)](https://github.com/alexnodeland-bot/harmonic/actions)
[![Docs](https://img.shields.io/badge/docs-latest-blue.svg)](https://alexnodeland-bot.github.io/harmonic/)
[![Crates.io](https://img.shields.io/crates/v/harmonic-core.svg)](https://crates.io/crates/harmonic-core)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**Harmonic** is a Rust library and CLI tool for evolving audio synthesis patches using genetic algorithms and fugue-evo. It combines the power of evolutionary computing with audio synthesis to discover novel and interesting soundscapes.

## 📚 [Documentation](https://alexnodeland-bot.github.io/harmonic/)

Explore the complete guide:
- [Introduction](https://alexnodeland-bot.github.io/harmonic/intro.html)
- [Quick Start](https://alexnodeland-bot.github.io/harmonic/quickstart.html)
- [Core Concepts](https://alexnodeland-bot.github.io/harmonic/concepts.html)
- [API Reference](https://alexnodeland-bot.github.io/harmonic/api.html)
- [Examples](https://alexnodeland-bot.github.io/harmonic/examples.html)
- [Performance Tips](https://alexnodeland-bot.github.io/harmonic/performance.html)
- [Architecture](https://alexnodeland-bot.github.io/harmonic/architecture.html)

## Features

- 🧬 **Genetic Algorithm Evolution** - Uses fugue-evo for efficient population-based optimization
- 🎛️ **Quiver Integration** - Works with quiver modular synthesis patches as genomes
- 📊 **Multi-objective Fitness** - Optimizes spectrum distance, energy, and spectral centroid
- 🎼 **Real-time Audio Analysis** - FFT-based spectrum analysis for fitness evaluation
- 💾 **Config-driven** - JSON-based evolution configuration
- 🎶 **CLI Tools** - Easy-to-use command-line interface
- 🖥️ **Web UI** - React + TypeScript interface with WASM bindings

## Project Structure

```
harmonic/
├── harmonic-core/      # Core library with genome, fitness, and audio evaluation
├── harmonic-cli/       # Command-line interface
├── harmonic-ui/        # Web UI (React + WASM)
└── README.md
```

## Quick Start

### Prerequisites

- Rust 1.70+
- Cargo
- Node.js 16+ (for web UI)

### Installation

```bash
git clone https://github.com/alexnodeland-bot/harmonic.git
cd harmonic
cargo build --release
```

### Using the CLI

#### Initialize a new evolution project

```bash
cargo run --bin harmonic -- init --dir ./my-evolution
```

This creates an `evolution.json` config file:

```json
{
  "generations": 100,
  "population_size": 50,
  "mutation_rate": 0.3,
  "crossover_rate": 0.7,
  "elite_size": 5,
  "fitness_weights": {
    "spectrum_weight": 0.4,
    "energy_weight": 0.3,
    "centroid_weight": 0.3,
    "target_energy": 0.5,
    "target_centroid": 1000.0
  },
  "target_audio": null,
  "audio_spec": {
    "sample_rate": 44100.0,
    "duration": 1.0,
    "channels": 1
  }
}
```

#### Run evolution

```bash
cargo run --bin harmonic -- run --config evolution.json --generations 200
```

Output:
```
Starting evolution with config:
  Generations: 200
  Population: 50
  Mutation rate: 0.3
Gen   0: best=0.5234, avg=0.4891
Gen  10: best=0.6102, avg=0.5567
Gen  20: best=0.6845, avg=0.6234
...
═══════════════════════════════════════
Final Best Fitness: 0.8934
═══════════════════════════════════════
```

#### Listen to a patch

```bash
cargo run --bin harmonic -- listen --patch best_patch.json --duration 2.0
```

#### Export a patch

```bash
cargo run --bin harmonic -- export --patch best_patch.json --output final.json
```

## Architecture

### harmonic-core

The core library provides:

**Genome Encoding**
- Quiver synthesis patches represented as JSON
- Serialization to/from bytes for fugue-evo compatibility
- Mutation and crossover operations

**Fitness Evaluation**
- FFT-based spectrum analysis
- Energy computation
- Spectral centroid calculation
- Configurable fitness weights

**Audio Analysis**
- Real-time synthesis from patches
- Spectral analysis
- ADSR envelope processing
- Simple lowpass filtering

### harmonic-cli

Command-line interface with:
- `init` - Create new evolution projects
- `run` - Execute genetic evolution
- `listen` - Synthesize and analyze patches
- `export` - Save patches as JSON

### harmonic-ui

Web interface (React + TypeScript):
- Visual patch editor
- Real-time synthesis (WASM)
- Spectrum visualization
- Mutation and crossover controls
- Audio playback
- Patch export

## Example Workflow

```rust
// Create initial population
let mut population: Vec<Genome> = (0..50)
    .map(|_| Genome::random())
    .collect();

// Evaluate fitness
let evaluator = FitnessEvaluator::new(config.fitness_weights, None);
for genome in &mut population {
    let audio = analyzer.synthesize(&genome.patch)?;
    let fitness = evaluator.evaluate(&audio);
    // ... update genome fitness
}

// Evolution loop
for generation in 0..100 {
    // Selection and reproduction
    let offspring: Vec<Genome> = population
        .iter()
        .map(|g| {
            let mut child = g.crossover(&population[random()]);
            child.mutate(0.3);
            child
        })
        .collect();
    
    // Evaluate and select
    population = select_best(offspring, 50);
}
```

## Configuration Guide

### Fitness Weights

- **spectrum_weight** (0.0-1.0): How much to prioritize matching target spectrum
- **energy_weight** (0.0-1.0): How much to prioritize target energy level
- **centroid_weight** (0.0-1.0): How much to prioritize target spectral centroid
- **target_energy** (0.0-1.0): RMS energy target
- **target_centroid** (Hz): Target spectral centroid frequency

### Evolution Parameters

- **generations**: Number of generations to run
- **population_size**: Individuals per generation
- **mutation_rate**: Probability of mutation (0.0-1.0)
- **crossover_rate**: Probability of crossover (0.0-1.0)
- **elite_size**: Number of best individuals to preserve

### Audio Spec

- **sample_rate**: Synthesis sample rate (typically 44100)
- **duration**: Synthesis duration in seconds
- **channels**: Number of audio channels (1 = mono)

## Testing

Run all tests:

```bash
cargo test --workspace
```

Run specific test:

```bash
cargo test --package harmonic-core genome::tests::test_genome_mutation
```

## Performance Notes

- FFT computation uses simple DFT (replace with proper FFT library for production)
- Audio synthesis is CPU-bound; consider using rayon for parallel population evaluation
- WASM builds require wasm-pack and have limited audio I/O capabilities

## Future Enhancements

- [ ] Full FFT implementation (rustfft or similar)
- [ ] Parallel audio evaluation with rayon
- [ ] Perlin noise-based perturbation
- [ ] Target spectrum matching from audio files
- [ ] Real-time audio playback in Web UI
- [ ] Neural network-based fitness predictor
- [ ] Export to VST/AU plugin format
- [ ] Interactive TUI with progress visualization

## Building for Web

```bash
cd harmonic-ui
npm install
npm run build:wasm
npm run build
```

## License

MIT

## Author

Alex Nodeland <alex@ournature.studio>

---

**Made with 🎵 and 🧬**
