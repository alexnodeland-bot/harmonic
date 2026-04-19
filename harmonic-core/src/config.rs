use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Evolution configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvolutionConfig {
    /// Number of generations to run
    pub generations: u32,
    /// Population size per generation
    pub population_size: u32,
    /// Mutation rate (0.0-1.0)
    pub mutation_rate: f32,
    /// Crossover rate (0.0-1.0)
    pub crossover_rate: f32,
    /// Elite size (number of best individuals to preserve)
    pub elite_size: u32,
    /// Fitness weights
    pub fitness_weights: crate::fitness::FitnessWeights,
    /// Optional target audio file for spectrum matching
    pub target_audio: Option<PathBuf>,
    /// Audio synthesis parameters
    pub audio_spec: crate::audio::AudioSpec,
}

impl Default for EvolutionConfig {
    fn default() -> Self {
        Self {
            generations: 100,
            population_size: 50,
            mutation_rate: 0.3,
            crossover_rate: 0.7,
            elite_size: 5,
            fitness_weights: crate::fitness::FitnessWeights::default(),
            target_audio: None,
            audio_spec: crate::audio::AudioSpec::default(),
        }
    }
}

impl EvolutionConfig {
    /// Load config from JSON file
    pub fn from_file(path: &PathBuf) -> anyhow::Result<Self> {
        let content = std::fs::read_to_string(path)?;
        let config: EvolutionConfig = serde_json::from_str(&content)?;
        Ok(config)
    }

    /// Save config to JSON file
    pub fn to_file(&self, path: &PathBuf) -> anyhow::Result<()> {
        let content = serde_json::to_string_pretty(self)?;
        std::fs::write(path, content)?;
        Ok(())
    }

    /// Validate configuration
    pub fn validate(&self) -> anyhow::Result<()> {
        if self.mutation_rate < 0.0 || self.mutation_rate > 1.0 {
            return Err(anyhow::anyhow!(
                "mutation_rate must be between 0.0 and 1.0"
            ));
        }
        if self.crossover_rate < 0.0 || self.crossover_rate > 1.0 {
            return Err(anyhow::anyhow!(
                "crossover_rate must be between 0.0 and 1.0"
            ));
        }
        if self.elite_size > self.population_size {
            return Err(anyhow::anyhow!(
                "elite_size must be <= population_size"
            ));
        }
        if self.generations == 0 {
            return Err(anyhow::anyhow!("generations must be > 0"));
        }
        if self.population_size == 0 {
            return Err(anyhow::anyhow!("population_size must be > 0"));
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_default() {
        let config = EvolutionConfig::default();
        assert_eq!(config.generations, 100);
        assert_eq!(config.population_size, 50);
    }

    #[test]
    fn test_config_validation() {
        let mut config = EvolutionConfig::default();
        assert!(config.validate().is_ok());

        config.mutation_rate = 1.5;
        assert!(config.validate().is_err());

        config.mutation_rate = 0.3;
        config.population_size = 0;
        assert!(config.validate().is_err());
    }

    #[test]
    fn test_config_serialization() {
        let config = EvolutionConfig::default();
        let json = serde_json::to_string(&config).unwrap();
        let restored: EvolutionConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(restored.generations, config.generations);
    }
}
