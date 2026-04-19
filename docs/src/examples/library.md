# Library Usage Examples

Using Harmonic as a Rust library.

## Basic Setup

```rust
use harmonic_core::{
    audio::AudioAnalyzer,
    config::EvolutionConfig,
    fitness::FitnessEvaluator,
    genome::Genome,
};

fn main() -> Result<()> {
    // Create analyzer
    let analyzer = AudioAnalyzer::new(44100.0, 1.0);
    let evaluator = FitnessEvaluator::new(analyzer);
    
    // Create genome and evaluate
    let genome = Genome::random();
    let fitness = evaluator.evaluate(&genome);
    
    println!("Fitness: {}", fitness.score);
    Ok(())
}
```

## Simple Evolution Loop

```rust
fn evolve() -> Result<()> {
    let config = EvolutionConfig::default();
    let analyzer = AudioAnalyzer::new(44100.0, 1.0);
    let evaluator = FitnessEvaluator::new(analyzer);
    
    let mut population: Vec<Genome> = (0..config.population_size)
        .map(|_| Genome::random())
        .collect();
    
    for gen in 0..config.generations {
        // Evaluate
        let mut fitnesses: Vec<_> = population
            .iter()
            .map(|g| evaluator.evaluate(g))
            .collect();
        
        // Sort by fitness
        let mut indexed: Vec<_> = (0..population.len()).collect();
        indexed.sort_by(|&a, &b| fitnesses[b].cmp(&fitnesses[a]));
        
        // Print best
        let best_idx = indexed[0];
        println!("Gen {}: {:.4}", gen, fitnesses[best_idx].score);
        
        // Create next generation
        let mut next_gen = Vec::new();
        
        // Keep elite
        for i in 0..config.elite_size as usize {
            next_gen.push(population[indexed[i]].clone());
        }
        
        // Fill rest with offspring
        while next_gen.len() < population.len() {
            let parent = population[indexed[0]].clone();
            let child = parent.mutate(config.mutation_rate);
            next_gen.push(child);
        }
        
        population = next_gen;
    }
    
    Ok(())
}
```

## Custom Fitness Function

```rust
use harmonic_core::fitness::{Fitness, FitnessWeights};

fn custom_fitness_evaluation(
    genome: &Genome,
    analyzer: &AudioAnalyzer,
) -> Fitness {
    // Generate audio from genome
    // (in real code, you'd interface with quiver here)
    
    // Compute metrics
    let spectrum = analyzer.compute_spectrum(&audio);
    let energy = analyzer.compute_energy(&audio);
    let centroid = analyzer.compute_centroid(&audio);
    
    // Custom scoring logic
    let spectrum_distance = compute_target_distance(&spectrum);
    let score = if energy > 0.9 {
        // Penalize clipping
        (1.0 - spectrum_distance) * 0.8
    } else {
        1.0 - spectrum_distance
    };
    
    Fitness::new(score, spectrum_distance, energy, centroid)
}
```

## Parallel Evolution

```rust
use rayon::prelude::*;

fn parallel_evaluate(
    population: &[Genome],
    evaluator: &FitnessEvaluator,
) -> Vec<Fitness> {
    population
        .par_iter()
        .map(|genome| evaluator.evaluate(genome))
        .collect()
}
```

## Serialization

```rust
fn save_and_load() -> Result<()> {
    // Create and evaluate
    let genome = Genome::random();
    
    // Save to JSON
    let json = genome.to_json_string()?;
    std::fs::write("genome.json", &json)?;
    
    // Load from JSON
    let loaded = Genome::from_json_string(&json)?;
    
    Ok(())
}
```

## Using with Custom Config

```rust
fn custom_config() -> Result<()> {
    let config = EvolutionConfig {
        generations: 200,
        population_size: 100,
        mutation_rate: 0.15,
        crossover_rate: 0.8,
        elite_size: 5,
        ..Default::default()
    };
    
    config.validate()?;
    println!("Config validated: {:?}", config);
    Ok(())
}
```

## Tips

- **Type safety**: Rust's compiler catches many errors at compile time
- **Parallel evaluation**: Use rayon for faster fitness computation
- **Serialize often**: Save genomes to JSON for later analysis
- **Batch operations**: Process multiple genomes together for efficiency
