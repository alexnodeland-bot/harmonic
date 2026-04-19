use clap::{Parser, Subcommand};
use harmonic_core::{
    EvolutionConfig, FitnessEvaluator, FitnessWeights, AudioAnalyzer, Genome, Individual,
};
use std::path::PathBuf;

mod evolve;
mod ui;
mod commands;

use commands::*;

#[derive(Parser)]
#[command(name = "harmonic")]
#[command(about = "Audio synthesis patch evolution using genetic algorithms", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,

    #[arg(global = true, short, long)]
    verbose: bool,
}

#[derive(Subcommand)]
enum Commands {
    /// Initialize a new evolution project
    Init {
        #[arg(short, long, default_value = ".")]
        dir: PathBuf,

        #[arg(short, long, default_value = "evolution.json")]
        config: PathBuf,
    },

    /// Run the genetic evolution
    Run {
        #[arg(short, long, default_value = "evolution.json")]
        config: PathBuf,

        #[arg(short, long)]
        generations: Option<u32>,
    },

    /// Export a patch to JSON
    Export {
        #[arg(short, long)]
        patch: PathBuf,

        #[arg(short, long)]
        output: PathBuf,
    },

    /// Listen to a patch (playback/synthesis)
    Listen {
        #[arg(short, long)]
        patch: PathBuf,

        #[arg(short, long)]
        duration: Option<f32>,
    },
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();

    if cli.verbose {
        std::env::set_var("RUST_LOG", "debug");
    }
    env_logger::init();

    match cli.command {
        Commands::Init { dir, config } => {
            init_command(&dir, &config)?;
        }
        Commands::Run { config, generations } => {
            run_command(&config, generations).await?;
        }
        Commands::Export { patch, output } => {
            export_command(&patch, &output)?;
        }
        Commands::Listen { patch, duration } => {
            listen_command(&patch, duration).await?;
        }
    }

    Ok(())
}
