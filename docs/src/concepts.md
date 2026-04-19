# Core Concepts

Understand the fundamental building blocks of Harmonic.

## Overview

Harmonic combines three core concepts:

1. **Genomes**: Representation of audio synthesis patches
2. **Fitness**: Evaluation metrics for patch quality
3. **Evolution**: Genetic algorithms for optimization

## The Evolution Loop

```
Initialize Population
        │
        ▼
    Evaluate Fitness
        │
        ▼
    Select Best (Tournament)
        │
        ▼
    Crossover & Mutate
        │
        ▼
    Repeat (until convergence)
```

## Key Terms

| Term | Definition |
|------|-----------|
| **Genome** | A quiver patch encoded as JSON; represents a candidate solution |
| **Population** | Collection of genomes being evolved together |
| **Fitness** | Numeric score (0-1) indicating how good a genome is |
| **Generation** | One iteration of the evolution loop |
| **Mutation** | Random change to a genome's parameters |
| **Crossover** | Creation of new genomes by combining two parents |
| **Selection** | Process of choosing genomes for reproduction |

## Detailed Concepts

- [Genome](concepts/genome.md): How patches are encoded
- [Fitness Evaluation](concepts/fitness.md): Measuring audio quality
- [Evolution Algorithm](concepts/evolution.md): How patches improve over time
