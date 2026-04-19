pub mod audio;
pub mod config;
pub mod fitness;
pub mod genome;

pub use audio::AudioAnalyzer;
pub use config::EvolutionConfig;
pub use fitness::{Fitness, FitnessEvaluator, FitnessWeights};
pub use genome::{Genome, GenomeEncoding};

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Individual {
    pub genome: Genome,
    pub fitness: Option<Fitness>,
}

impl Individual {
    pub fn new(genome: Genome) -> Self {
        Self {
            genome,
            fitness: None,
        }
    }

    pub fn with_fitness(genome: Genome, fitness: Fitness) -> Self {
        Self {
            genome,
            fitness: Some(fitness),
        }
    }
}
