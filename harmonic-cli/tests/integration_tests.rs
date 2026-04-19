use harmonic_core::{
    AudioAnalyzer, EvolutionConfig, FitnessEvaluator, FitnessWeights, Genome, GenomeEncoding,
};
use serde_json::json;
use std::fs;
use tempfile::TempDir;

#[test]
fn test_config_roundtrip() {
    let config = EvolutionConfig::default();
    let temp_dir = TempDir::new().unwrap();
    let config_path = temp_dir.path().join("config.json");

    config.to_file(&config_path).unwrap();
    assert!(config_path.exists());

    let loaded = EvolutionConfig::from_file(&config_path).unwrap();
    assert_eq!(loaded.generations, config.generations);
    assert_eq!(loaded.population_size, config.population_size);
}

#[test]
fn test_genome_file_roundtrip() {
    let genome = Genome::random();
    let temp_dir = TempDir::new().unwrap();
    let genome_path = temp_dir.path().join("genome.json");

    let json_string = genome.to_json_string().unwrap();
    fs::write(&genome_path, json_string).unwrap();
    assert!(genome_path.exists());

    let content = fs::read_to_string(&genome_path).unwrap();
    assert!(content.contains("oscillators"));
}

#[test]
fn test_fitness_evaluation_pipeline() {
    let analyzer = AudioAnalyzer::new(44100.0, 0.1);
    let evaluator = FitnessEvaluator::new(FitnessWeights::default(), None);

    let patch = json!({
        "oscillators": [
            {"frequency": 440.0, "amplitude": 0.5, "phase": 0.0}
        ]
    });
    let genome = Genome::new(patch);

    let audio = analyzer.synthesize(&genome.patch).unwrap();
    let fitness = evaluator.evaluate(&audio);

    assert!(fitness.score >= 0.0 && fitness.score <= 1.0);
}

#[test]
fn test_evolution_config_validation_pipeline() {
    let mut config = EvolutionConfig {
        generations: 50,
        population_size: 20,
        mutation_rate: 0.3,
        crossover_rate: 0.7,
        ..Default::default()
    };

    assert!(config.validate().is_ok());

    // Invalid config
    config.mutation_rate = 1.5;
    assert!(config.validate().is_err());
}

#[test]
fn test_multiple_genomes_evolution_simulation() {
    let analyzer = AudioAnalyzer::new(44100.0, 0.1);
    let evaluator = FitnessEvaluator::new(FitnessWeights::default(), None);

    // Create initial population
    let mut population: Vec<Genome> = (0..10).map(|_| Genome::random()).collect();

    // Evaluate initial population
    let mut fitness_scores = Vec::new();
    for genome in &population {
        let audio = analyzer.synthesize(&genome.patch).unwrap();
        let fitness = evaluator.evaluate(&audio);
        fitness_scores.push(fitness.score);
    }

    // Check that we have valid fitness scores
    assert_eq!(fitness_scores.len(), 10);
    for score in &fitness_scores {
        assert!(*score >= 0.0 && *score <= 1.0);
    }

    // Simulate one generation of evolution
    for _ in 0..5 {
        population.iter_mut().for_each(|g| g.mutate(0.3));
    }

    // Verify population is still valid
    assert_eq!(population.len(), 10);
}

#[test]
fn test_genome_crossover_produces_valid_offspring() {
    let parent1 = Genome::random();
    let parent2 = Genome::random();

    for _ in 0..5 {
        let offspring = parent1.crossover(&parent2);
        assert!(offspring.patch.get("oscillators").is_some());
    }
}

#[test]
fn test_audio_synthesis_parameters_respected() {
    let analyzer = AudioAnalyzer::new(44100.0, 0.5);

    let patch = json!({
        "oscillators": [
            {"frequency": 880.0, "amplitude": 0.7, "phase": 0.0}
        ]
    });

    let audio = analyzer.synthesize(&patch).unwrap();
    let expected_samples = (44100.0 * 0.5) as usize;
    assert_eq!(audio.len(), expected_samples);
}

#[test]
fn test_spectrum_analysis_consistency() {
    let analyzer = AudioAnalyzer::new(44100.0, 0.1);

    // Same audio should produce same spectrum
    let audio = vec![0.5; 4410];
    let analysis1 = analyzer.analyze_spectrum(&audio);
    let analysis2 = analyzer.analyze_spectrum(&audio);

    assert_eq!(analysis1.rms, analysis2.rms);
    assert_eq!(analysis1.centroid, analysis2.centroid);
}

#[test]
fn test_fitness_weights_normalization() {
    let weights = FitnessWeights::default();
    let sum = weights.spectrum_weight + weights.energy_weight + weights.centroid_weight;
    assert!((sum - 1.0).abs() < 0.01);
}
