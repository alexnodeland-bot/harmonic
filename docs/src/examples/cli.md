# CLI Usage Examples

Using Harmonic from the command line.

## Basic Evolution Run

```bash
# Run evolution with default settings
harmonic run

# Run with custom config
harmonic run --config my_config.toml

# Specify output file
harmonic run --output result.json
```

## Configuration File Example

Create `config.toml`:

```toml
[evolution]
generations = 100
population_size = 30
mutation_rate = 0.25
crossover_rate = 0.75
elite_size = 2

[audio]
sample_rate = 44100.0
duration_seconds = 2.0

[fitness]
spectrum_weight = 0.6
energy_weight = 0.3
centroid_weight = 0.1

[target]
target_spectrum = [0.8, 0.6, 0.4, 0.2, 0.1]
```

## Listening to Results

```bash
# Play the best patch from evolution
harmonic listen --patch result.json

# Export to audio file
harmonic export --patch result.json --output best.wav --format wav

# Export patch as JSON for later use
harmonic export --patch result.json --output patch.json --format json
```

## Workflow Example

```bash
# 1. Initialize project
mkdir my_evolution
cd my_evolution

# 2. Create config
cat > config.toml << 'EOF'
[evolution]
generations = 100
population_size = 50
[audio]
sample_rate = 44100.0
[fitness]
spectrum_weight = 0.5
EOF

# 3. Run evolution
harmonic run --config config.toml --output evolution.json

# 4. Listen to result
harmonic listen --patch evolution.json

# 5. Export best patch
harmonic export --patch evolution.json --output best_patch.json
```

## Advanced Options

```bash
# Run with logging
harmonic run --verbose --output result.json

# Run multiple evolutions in parallel
harmonic run --config config1.toml --output result1.json &
harmonic run --config config2.toml --output result2.json &
wait

# Compare results
harmonic compare result1.json result2.json
```

## Tips

- **Start simple**: Use default config first, then tune
- **Monitor progress**: Use `--verbose` to see fitness over time
- **Save often**: Export intermediate results with `--output`
- **Batch runs**: Use shell scripts to run multiple evolutions
