use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::HashMap;

/// A genome represents a quiver synthesis patch as JSON serialized to bytes
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Genome {
    /// Quiver patch configuration as JSON value
    pub patch: serde_json::Value,
    /// Metadata about the patch
    #[serde(skip)]
    pub metadata: GenomeMetadata,
}

#[derive(Debug, Clone, Default)]
pub struct GenomeMetadata {
    pub generation: u32,
    pub id: String,
}

/// Trait for encoding/decoding genomes
pub trait GenomeEncoding {
    fn to_bytes(&self) -> anyhow::Result<Vec<u8>>;
    fn from_bytes(bytes: &[u8]) -> anyhow::Result<Self>
    where
        Self: Sized;
    fn to_json_string(&self) -> anyhow::Result<String>;
}

impl GenomeEncoding for Genome {
    fn to_bytes(&self) -> anyhow::Result<Vec<u8>> {
        Ok(serde_json::to_vec(&self.patch)?)
    }

    fn from_bytes(bytes: &[u8]) -> anyhow::Result<Self> {
        let patch = serde_json::from_slice(bytes)?;
        Ok(Self {
            patch,
            metadata: GenomeMetadata::default(),
        })
    }

    fn to_json_string(&self) -> anyhow::Result<String> {
        Ok(serde_json::to_string_pretty(&self.patch)?)
    }
}

impl Genome {
    /// Create a new genome from a JSON patch
    pub fn new(patch: serde_json::Value) -> Self {
        Self {
            patch,
            metadata: GenomeMetadata::default(),
        }
    }

    /// Create a random genome with basic synthesis parameters
    pub fn random() -> Self {
        let mut rng = rand::thread_rng();
        use rand::Rng;

        let patch = json!({
            "oscillators": [
                {
                    "type": "sine",
                    "frequency": rng.gen_range(20.0..2000.0),
                    "amplitude": rng.gen_range(0.1..1.0),
                    "phase": rng.gen_range(0.0..std::f32::consts::PI * 2.0),
                }
            ],
            "envelope": {
                "attack": rng.gen_range(0.001..0.5),
                "decay": rng.gen_range(0.01..1.0),
                "sustain": rng.gen_range(0.0..1.0),
                "release": rng.gen_range(0.01..2.0),
            },
            "filter": {
                "type": "lowpass",
                "cutoff": rng.gen_range(100.0..8000.0),
                "resonance": rng.gen_range(0.0..2.0),
            },
            "effects": {
                "reverb_mix": rng.gen_range(0.0..0.5),
                "delay_time": rng.gen_range(0.01..0.5),
                "delay_feedback": rng.gen_range(0.0..0.7),
            }
        });

        Self {
            patch,
            metadata: GenomeMetadata::default(),
        }
    }

    /// Mutate the genome by slightly adjusting parameters
    pub fn mutate(&mut self, mutation_rate: f32) {
        use rand::Rng;
        let mut rng = rand::thread_rng();

        if let Some(oscs) = self.patch.get_mut("oscillators").and_then(|v| v.as_array_mut()) {
            for osc in oscs.iter_mut() {
                if rng.gen::<f32>() < mutation_rate {
                    if let Some(freq) = osc.get_mut("frequency") {
                        let f = freq.as_f64().unwrap_or(440.0) as f32;
                        *freq = json!(f * rng.gen_range(0.9..1.1));
                    }
                }
                if rng.gen::<f32>() < mutation_rate {
                    if let Some(amp) = osc.get_mut("amplitude") {
                        let a = amp.as_f64().unwrap_or(0.5) as f32;
                        *amp = json!((a * rng.gen_range(0.9..1.1)).clamp(0.0, 1.0));
                    }
                }
            }
        }

        if let Some(env) = self.patch.get_mut("envelope").and_then(|v| v.as_object_mut()) {
            for (_, val) in env.iter_mut() {
                if rng.gen::<f32>() < mutation_rate {
                    if let Some(v) = val.as_f64() {
                        let new_val = (v as f32 * rng.gen_range(0.95..1.05)).clamp(0.001, 2.0);
                        *val = json!(new_val);
                    }
                }
            }
        }

        if let Some(filter) = self.patch.get_mut("filter").and_then(|v| v.as_object_mut()) {
            for (key, val) in filter.iter_mut() {
                if key != "type" && rng.gen::<f32>() < mutation_rate {
                    if let Some(v) = val.as_f64() {
                        let new_val = if key == "cutoff" {
                            (v as f32 * rng.gen_range(0.9..1.1)).clamp(20.0, 20000.0)
                        } else {
                            (v as f32 * rng.gen_range(0.95..1.05)).clamp(0.0, 2.0)
                        };
                        *val = json!(new_val);
                    }
                }
            }
        }
    }

    /// Crossover two genomes
    pub fn crossover(&self, other: &Genome) -> Self {
        use rand::Rng;
        let mut rng = rand::thread_rng();

        let mut new_patch = self.patch.clone();

        if rng.gen::<f32>() > 0.5 {
            if let Some(other_envelope) = other.patch.get("envelope") {
                new_patch["envelope"] = other_envelope.clone();
            }
        }

        if rng.gen::<f32>() > 0.5 {
            if let Some(other_filter) = other.patch.get("filter") {
                new_patch["filter"] = other_filter.clone();
            }
        }

        if rng.gen::<f32>() > 0.5 {
            if let Some(other_effects) = other.patch.get("effects") {
                new_patch["effects"] = other_effects.clone();
            }
        }

        Self {
            patch: new_patch,
            metadata: GenomeMetadata::default(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_genome_creation() {
        let patch = json!({
            "oscillators": [{"type": "sine", "frequency": 440.0}]
        });
        let genome = Genome::new(patch.clone());
        assert_eq!(genome.patch, patch);
    }

    #[test]
    fn test_genome_random() {
        let genome = Genome::random();
        assert!(genome.patch.get("oscillators").is_some());
        assert!(genome.patch.get("envelope").is_some());
    }

    #[test]
    fn test_genome_serialization() {
        let genome = Genome::random();
        let bytes = genome.to_bytes().unwrap();
        let restored = Genome::from_bytes(&bytes).unwrap();
        assert_eq!(genome.patch, restored.patch);
    }

    #[test]
    fn test_genome_mutation() {
        let mut genome = Genome::random();
        let original = genome.patch.clone();
        genome.mutate(1.0);
        // Should be different after mutation with 100% rate
        assert_ne!(genome.patch, original);
    }

    #[test]
    fn test_genome_crossover() {
        let g1 = Genome::random();
        let g2 = Genome::random();
        let offspring = g1.crossover(&g2);
        assert!(offspring.patch.get("oscillators").is_some());
    }
}
