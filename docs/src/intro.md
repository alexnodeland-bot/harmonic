# Introduction to Harmonic

**Harmonic** is a Rust library and CLI tool for evolving audio synthesis patches using genetic algorithms.

## What is Harmonic?

Harmonic bridges the worlds of **generative audio** and **evolutionary computation**. It uses `quiver` (a modular audio synthesis library) as genomes and `fugue-evo` (a probabilistic genetic algorithm framework) to evolve them toward target sounds or aesthetic goals.

### Key Features

- **Evolve synthesis patches** using genetic algorithms
- **Real-time audio evaluation** with spectral analysis
- **Audio metrics**: spectrum distance, energy, spectral centroid
- **CLI tool** for running evolution from the command line
- **Web UI** for interactive listening and visualization
- **Full Rust implementation** for type safety and performance

## Architecture

```
┌─────────────────────────────────────────┐
│       Harmonic (This Library)           │
│  Genetic Algorithm + Audio Synthesis    │
└─────────────────────────────────────────┘
         │                    │
    ┌────▼────┐         ┌─────▼────┐
    │ Fugue   │         │  Quiver  │
    │  Evo    │         │ Synthesis│
    └────────┘         └──────────┘
    (GA Engine)      (Audio Patches)
```

## Quick Example

```bash
# Initialize a new evolution
harmonic init --config evolution.toml

# Run evolution for 100 generations
harmonic run --generations 100

# Listen to the best patch
harmonic listen --patch best.json

# Export the final patch
harmonic export --patch best.json --output final.json
```

## How It Works

1. **Genome Representation**: Audio synthesis patches (quiver) are encoded as genomes
2. **Mutation & Crossover**: Genetic operations create variations of patches
3. **Fitness Evaluation**: Each patch is evaluated based on audio metrics
4. **Selection**: Best patches are selected for the next generation
5. **Iteration**: Repeat until convergence or target reached

## Typical Use Cases

- **Sound design**: Evolve patches toward a target aesthetic
- **Creative exploration**: Discover novel synthesis patches
- **Optimization**: Fine-tune synthesis parameters automatically
- **Research**: Study audio synthesis and genetic algorithms

## Try the Web UI

The interactive demo is deployed alongside the docs:

👉 **[Launch Web UI](../ui/)**

(Build and tune patches visually in your browser)

## Next Steps

- [Quick Start](quickstart.md): Get up and running in 5 minutes
- [Core Concepts](concepts.md): Understand genomes, fitness, and evolution
- [Examples](examples.md): See real-world usage patterns
