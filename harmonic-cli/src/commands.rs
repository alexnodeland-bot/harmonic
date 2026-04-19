use harmonic_core::{EvolutionConfig, Genome, GenomeEncoding};
use std::path::PathBuf;

pub fn init_command(dir: &PathBuf, config_path: &PathBuf) -> anyhow::Result<()> {
    std::fs::create_dir_all(dir)?;

    let config = EvolutionConfig::default();
    let full_path = dir.join(config_path);
    config.to_file(&full_path)?;

    println!("✓ Initialized harmonic project in {:?}", dir);
    println!("✓ Created config at {:?}", full_path);
    println!("\nNext steps:");
    println!("  1. Edit {} to customize parameters", config_path.display());
    println!("  2. Run: harmonic run --config {}", config_path.display());

    Ok(())
}

pub async fn run_command(config_path: &PathBuf, generations: Option<u32>) -> anyhow::Result<()> {
    let mut config = EvolutionConfig::from_file(config_path)?;
    config.validate()?;

    if let Some(gen_override) = generations {
        config.generations = gen_override;
    }

    println!("Starting evolution with config:");
    println!("  Generations: {}", config.generations);
    println!("  Population: {}", config.population_size);
    println!("  Mutation rate: {}", config.mutation_rate);

    use crate::evolve::EvolutionRunner;
    let runner = EvolutionRunner::new(config);
    let best = runner.run().await?;

    println!("\n✓ Evolution complete!");
    println!("  Best fitness: {:.4}", best.fitness.map(|f| f.score).unwrap_or(0.0));
    println!("  Patch saved to: best_patch.json");

    Ok(())
}

pub fn export_command(patch_path: &PathBuf, output_path: &PathBuf) -> anyhow::Result<()> {
    let content = std::fs::read_to_string(patch_path)?;
    let patch: serde_json::Value = serde_json::from_str(&content)?;
    let genome = Genome::new(patch);
    let json_str = genome.to_json_string()?;
    std::fs::write(output_path, json_str)?;

    println!("✓ Exported patch to {:?}", output_path);

    Ok(())
}

pub async fn listen_command(patch_path: &PathBuf, duration: Option<f32>) -> anyhow::Result<()> {
    let content = std::fs::read_to_string(patch_path)?;
    let patch: serde_json::Value = serde_json::from_str(&content)?;

    let duration = duration.unwrap_or(2.0);
    let analyzer = harmonic_core::AudioAnalyzer::new(44100.0, duration);

    println!("Synthesizing patch...");
    let audio = analyzer.synthesize(&patch)?;

    let analysis = analyzer.analyze_spectrum(&audio);
    println!("\nAudio analysis:");
    println!("  RMS Energy: {:.4}", analysis.rms);
    println!("  Spectral Centroid: {:.2} Hz", analysis.centroid);
    println!("  Duration: {:.2}s", duration);
    println!("\n(Audio playback would be implemented with actual audio device)");

    Ok(())
}
