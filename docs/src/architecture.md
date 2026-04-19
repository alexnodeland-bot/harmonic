# Architecture

Deep dive into Harmonic's design and structure.

## Crate Structure

```
harmonic/
├── harmonic-core/     # Core library (genome, fitness, evolution)
├── harmonic-cli/      # Command-line interface
├── harmonic-ui/       # Terminal UI
├── docs/              # mdBook documentation
└── justfile           # Build automation
```

### harmonic-core

Core types and algorithms.

**Modules:**
- `config`: Evolution configuration and validation
- `genome`: Patch encoding and genetic operations
- `fitness`: Audio analysis and quality metrics
- `audio`: Spectral analysis utilities

**Key traits:**
- `GenomeEncoding`: Serialize/deserialize genomes
- `AudioAnalyzer`: Spectral analysis interface

### harmonic-cli

Command-line interface built with `clap`.

**Features:**
- Config file parsing (TOML)
- Evolution orchestration
- Audio playback and export
- JSON result handling

### harmonic-ui

Terminal user interface built with `crossterm`.

**Features:**
- Real-time progress visualization
- Fitness history plotting
- Interactive controls
- Live audio preview

## Data Flow

```
User Input (Config)
        │
        ▼
Parse Configuration
        │
        ▼
Initialize Population (Random Genomes)
        │
        ▼
─────────────────────────────────────
│  Loop: for each generation      │
│  ├─ Evaluate Fitness             │
│  ├─ Select Parents (Tournament)  │
│  ├─ Create Children (Crossover)  │
│  ├─ Mutate Children              │
│  ├─ Replace Weak Individuals     │
│  └─ Log Progress                 │
─────────────────────────────────────
        │
        ▼
Export Best Genomes to JSON
        │
        ▼
Result Files
```

## Key Design Decisions

### 1. JSON for Genome Serialization

**Why JSON?**
- Human-readable
- Easy to inspect and debug
- Integrates with quiver's patch format
- Language-agnostic

**Tradeoff:**
- Slightly larger than binary
- Slower to parse than binary

### 2. Trait-Based Audio Analysis

```rust
pub trait AudioAnalyzer {
    fn compute_spectrum(&self, audio: &[f32]) -> Vec<f32>;
    fn compute_energy(&self, audio: &[f32]) -> f32;
    fn compute_centroid(&self, audio: &[f32]) -> f32;
}
```

**Benefits:**
- Easy to swap implementations
- Support multiple backends
- Testable with mocks

### 3. Immutable Genomes

Genomes are immutable; mutations return new genomes:

```rust
let mutated = genome.mutate(rate);  // Returns new genome
// original genome unchanged
```

**Benefits:**
- No accidental mutations
- Easier to parallelize
- Clear ownership semantics

### 4. Fitness Components

Fitness breaks down into components rather than single score:

```rust
pub struct Fitness {
    pub score: f32,              // Overall
    pub spectrum_distance: f32,  // Component 1
    pub energy: f32,             // Component 2
    pub centroid: f32,           // Component 3
}
```

**Benefits:**
- Flexible weighting
- Better diagnostics
- Easier to extend

## Integration Points

### With quiver

Genomes are quiver patches. Integration:

```rust
// In harmonic-core/src/genome.rs
impl Genome {
    // Patch JSON structure compatible with quiver
    pub fn to_quiver_patch(&self) -> QuiverPatch { ... }
    pub fn from_quiver_patch(patch: &QuiverPatch) -> Self { ... }
}
```

### With fugue-evo

Fugue provides the genetic algorithm engine. Harmonic provides:

1. **Genome representation** for patches
2. **Fitness function** for audio metrics
3. **Integration layer** to connect the two

## Performance Characteristics

| Operation | Time | Notes |
|-----------|------|-------|
| Create genome | O(1) | Fixed structure |
| Evaluate fitness | O(n²) | DFT on audio |
| Mutate | O(k) | k = mutation points |
| Crossover | O(m) | m = genome size |
| Generate population | O(p·n²) | p = population |

For 50 population, 1s audio (44.1kHz):
- Fitness evaluation: ~100ms per genome
- Full generation: ~5 seconds
- 100 generations: ~8-10 minutes

## Testing Strategy

- **Unit tests**: Individual components (genome, fitness)
- **Integration tests**: Full evolution loops
- **Property tests**: Genome mutations produce valid results
- **Audio tests**: Metrics compute reasonable values

Run tests:

```bash
cargo test --all --release
```

## Future Directions

1. **FFT optimization**: Use proper FFT library (faster spectrum computation)
2. **Multi-objective**: Support Pareto-front evolution
3. **Constraints**: Enforce valid patches during breeding
4. **Adaptive parameters**: Self-tuning mutation rates
5. **Audio backends**: Support different synthesis engines
