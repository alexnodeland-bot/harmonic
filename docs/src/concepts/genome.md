# Genome

A **genome** in Harmonic is an encoded audio synthesis patch.

## Representation

Genomes are stored as JSON serializations of quiver patches:

```json
{
  "modules": [
    {
      "id": "osc1",
      "type": "VCO",
      "frequency": 440.0,
      "waveform": "sine"
    },
    {
      "id": "adsr1",
      "type": "ADSR",
      "attack": 0.01,
      "decay": 0.1,
      "sustain": 0.7,
      "release": 0.5
    }
  ],
  "cables": [
    {"from": "osc1", "to": "adsr1"}
  ]
}
```

## Mutation

Mutations randomly modify genome parameters:

- **Module parameter mutation**: Change a parameter's value slightly
- **Cable addition/removal**: Add or remove connections between modules
- **Module addition/removal**: Add new modules or remove existing ones

## Crossover

Crossover creates new genomes by combining two parents:

1. Select random crossover points
2. Swap module sections between parents
3. Resolve cable conflicts
4. Validate resulting genome

## Properties

Each genome has metadata:

- **ID**: Unique identifier
- **Generation**: When it was created
- **Fitness**: Score from evaluation
- **Parent IDs**: IDs of parent genomes (if mutated)

## Example

```rust
use harmonic_core::genome::Genome;

// Create a random genome
let genome = Genome::random();

// Mutate it
let mutated = genome.mutate(0.3); // 30% mutation rate

// Encode to JSON
let json = genome.to_json_string()?;

// Decode from JSON
let restored = Genome::from_json_string(&json)?;
```
