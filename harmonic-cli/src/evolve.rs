use harmonic_core::{
    EvolutionConfig, Genome, Individual, AudioAnalyzer, FitnessEvaluator, Fitness, GenomeEncoding,
};
use rand::Rng;
use std::collections::VecDeque;

pub struct EvolutionRunner {
    config: EvolutionConfig,
}

#[derive(Debug, Clone)]
pub struct GenerationStats {
    pub generation: u32,
    pub best_fitness: f32,
    pub avg_fitness: f32,
}

impl EvolutionRunner {
    pub fn new(config: EvolutionConfig) -> Self {
        Self { config }
    }

    pub async fn run(&self) -> anyhow::Result<Individual> {
        let analyzer = AudioAnalyzer::new(
            self.config.audio_spec.sample_rate,
            self.config.audio_spec.duration,
        );
        let evaluator = FitnessEvaluator::new(
            self.config.fitness_weights.clone(),
            None, // Load target spectrum if config.target_audio is set
        );

        // Initialize population
        let mut population: Vec<Individual> = (0..self.config.population_size)
            .map(|_| {
                let mut genome = Genome::random();
                genome.metadata.generation = 0;
                Individual::new(genome)
            })
            .collect();

        // Evaluate initial population
        println!("Evaluating initial population...");
        for individual in population.iter_mut() {
            let audio = analyzer.synthesize(&individual.genome.patch)?;
            individual.fitness = Some(evaluator.evaluate(&audio));
        }

        let mut history = VecDeque::new();
        let mut best_individual = population[0].clone();

        // Evolution loop
        for gen in 0..self.config.generations {
            // Find best in current generation
            let gen_best = population
                .iter()
                .max_by(|a, b| {
                    let a_score = a.fitness.map(|f| f.score).unwrap_or(0.0);
                    let b_score = b.fitness.map(|f| f.score).unwrap_or(0.0);
                    a_score.partial_cmp(&b_score).unwrap_or(std::cmp::Ordering::Equal)
                })
                .cloned()
                .unwrap();

            if let Some(gen_fitness) = gen_best.fitness {
                if gen_fitness.score
                    > best_individual
                        .fitness
                        .map(|f| f.score)
                        .unwrap_or(0.0)
                {
                    best_individual = gen_best.clone();
                }
            }

            // Compute stats
            let fitness_scores: Vec<f32> = population
                .iter()
                .filter_map(|i| i.fitness.map(|f| f.score))
                .collect();

            let avg_fitness = if !fitness_scores.is_empty() {
                fitness_scores.iter().sum::<f32>() / fitness_scores.len() as f32
            } else {
                0.0
            };

            let stats = GenerationStats {
                generation: gen,
                best_fitness: gen_best.fitness.map(|f| f.score).unwrap_or(0.0),
                avg_fitness,
            };

            history.push_back(stats.clone());
            if history.len() > 100 {
                history.pop_front();
            }

            if gen % 10 == 0 {
                println!(
                    "Gen {:3}: best={:.4}, avg={:.4}",
                    gen, stats.best_fitness, avg_fitness
                );
            }

            // Selection and reproduction
            let mut new_population = Vec::new();

            // Keep elite
            let elite_size = self.config.elite_size.min(population.len());
            let mut population_sorted = population.clone();
            population_sorted.sort_by(|a, b| {
                let a_score = a.fitness.map(|f| f.score).unwrap_or(0.0);
                let b_score = b.fitness.map(|f| f.score).unwrap_or(0.0);
                b_score.partial_cmp(&a_score).unwrap_or(std::cmp::Ordering::Equal)
            });

            new_population.extend_from_slice(&population_sorted[0..elite_size]);

            // Create offspring
            let mut rng = rand::thread_rng();
            while new_population.len() < self.config.population_size as usize {
                let p1_idx = rng.gen_range(0..population.len());
                let p2_idx = rng.gen_range(0..population.len());

                let mut offspring = if rng.gen::<f32>() < self.config.crossover_rate {
                    population[p1_idx].genome.crossover(&population[p2_idx].genome)
                } else {
                    population[p1_idx].genome.clone()
                };

                if rng.gen::<f32>() < self.config.mutation_rate {
                    offspring.mutate(0.3); // Mutation intensity
                }

                offspring.metadata.generation = gen + 1;
                new_population.push(Individual::new(offspring));
            }

            population = new_population[0..self.config.population_size as usize].to_vec();

            // Evaluate new population
            for individual in population.iter_mut() {
                let audio = analyzer.synthesize(&individual.genome.patch)?;
                individual.fitness = Some(evaluator.evaluate(&audio));
            }
        }

        // Save best patch
        let best_json = best_individual.genome.to_json_string()?;
        std::fs::write("best_patch.json", best_json)?;

        println!("\n═══════════════════════════════════════");
        println!(
            "Final Best Fitness: {:.4}",
            best_individual.fitness.map(|f| f.score).unwrap_or(0.0)
        );
        println!("═══════════════════════════════════════");

        Ok(best_individual)
    }
}
