# Performance Tips

Optimize your evolution runs for speed and quality.

## Hardware Optimization

### Use Release Mode

```bash
# Always build with optimizations
cargo build --release
cargo run --release
```

Release builds are 10-100x faster than debug builds.

### Parallel Evaluation

```rust
use rayon::prelude::*;

// Evaluate population in parallel
let fitnesses: Vec<_> = population
    .par_iter()
    .map(|genome| evaluator.evaluate(genome))
    .collect();
```

This can provide 4-8x speedup on modern CPUs.

## Algorithm Tuning

### Population Size

| Size | Speed | Quality | Use Case |
|------|-------|---------|----------|
| 10 | Very Fast | Poor | Testing |
| 30 | Fast | Good | Quick exploration |
| 50 | Medium | Better | Balanced |
| 100+ | Slow | Best | Production |

**Strategy**: Start small, increase gradually.

### Generation Count

- **100 generations**: Quick taste (5-10 min)
- **500 generations**: Good exploration (30-60 min)
- **1000+ generations**: Deep optimization (hours)

Monitor convergence to avoid wasting time:

```
Gen 1:    0.45
Gen 10:   0.72  (improving)
Gen 100:  0.88  (improving)
Gen 500:  0.89  (plateau)  ← Could stop here
Gen 1000: 0.89  (no change) ← Definitely stop
```

### Mutation Rate Tuning

- **High (0.4+)**: More exploration, slower convergence
- **Medium (0.2-0.3)**: Balanced (recommended)
- **Low (0.1)**: Faster convergence, may get stuck

### Elite Size

Keep elite size small (2-5% of population):
- Too small: Lose best solutions
- Too large: Premature convergence

## Fitness Optimization

### Simplify Evaluation

Expensive operations:
- DFT computation: O(n²) - consider FFT alternatives
- Full audio synthesis: O(duration)

Optimizations:
- Cache spectrum computations
- Use shorter audio duration (0.5s instead of 2s)
- Reduce FFT resolution

### Target Specification

Better targets = faster convergence:

```rust
// Bad: No target (search space is huge)
let evaluator = FitnessEvaluator::new(analyzer);

// Better: Specific target spectrum
evaluator.set_target_spectrum(target);
```

## Monitoring

### Track Progress

```bash
# Run with timing
time harmonic run --generations 100 --output result.json
```

### Fitness Plateau Detection

Stop early when fitness plateaus:

```rust
if gen > 50 && (current_best - prev_best).abs() < 0.001 {
    println!("Converged at generation {}", gen);
    break;
}
```

## Storage

### Minimize Output

- Save only the best genome
- Store as compressed JSON
- Archive old runs

```bash
# Compress results
gzip evolution_result.json

# Clean up old runs
rm evolution_*.json
```

## Example Tuned Config

```toml
[evolution]
generations = 500        # Balance of time and quality
population_size = 50    # Good trade-off
mutation_rate = 0.25    # Balanced exploration
crossover_rate = 0.7    # Effective breeding
elite_size = 2          # Keep best without stagnation

[audio]
sample_rate = 44100.0
duration_seconds = 0.5  # Shorter = faster evaluation

[fitness]
spectrum_weight = 0.6   # Most important
energy_weight = 0.2
centroid_weight = 0.2
```

## Benchmarks

On a 2021 MacBook Pro M1:

- Population 50, 100 gens: ~2 minutes
- Population 100, 500 gens: ~30 minutes
- Population 50, 1000 gens: ~60 minutes

(Times vary based on audio duration and target complexity)
