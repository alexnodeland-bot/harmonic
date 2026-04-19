# Evolution Algorithm

Harmonic uses **genetic algorithms** to evolve patches toward better fitness.

## Algorithm Overview

```
1. Initialize: Create random population
2. Evaluate: Score each genome
3. Select: Choose best genomes (tournament selection)
4. Breed: Create children via crossover & mutation
5. Replace: Swap weak genomes with children
6. Repeat: Go to step 2 until target reached
```

## Selection Strategy

Harmonic uses **tournament selection**:

1. Randomly pick K genomes (tournament size ≈ 3-5)
2. Select the best one
3. Repeat to build parent pool

**Why tournament selection?**
- Maintains diversity (doesn't always pick absolute best)
- Prevents premature convergence
- Simple and effective

## Reproduction

### Crossover (70% of children)
Combine two parents:
```
Parent 1: [A B C D E]
Parent 2: [a b c d e]
          ↓ crossover at point 2
Child 1:  [A B c d e]
Child 2:  [a b C D E]
```

### Mutation (30% of children)
Small random changes:
```
Parent:   [A B C D E]
           ↓ mutate position 2
Mutant:   [A B' C D E]
```

## Parameters

Key evolution parameters:

| Parameter | Default | Effect |
|-----------|---------|--------|
| `population_size` | 50 | More = slower but better |
| `generations` | 100 | More = longer search |
| `mutation_rate` | 0.2 | Higher = more exploration |
| `crossover_rate` | 0.7 | Higher = more blending |
| `elite_size` | 2 | Best genomes kept unchanged |

## Convergence

Evolution stops when:

1. **Max generations reached** (configured limit)
2. **Fitness plateaus** (no improvement for N gens)
3. **User stops it** (Ctrl+C)

## Example Run

```
Generation 1:  Best Fitness = 0.42
Generation 2:  Best Fitness = 0.48
Generation 3:  Best Fitness = 0.51
...
Generation 47: Best Fitness = 0.89
Generation 48: Best Fitness = 0.89  (plateaued)
```

## Tips for Better Evolution

- **Start simple**: Begin with small populations
- **Increase gradually**: Grow population/generations as needed
- **Tune mutation rate**: Too high = chaos, too low = stagnation
- **Watch convergence**: Monitor fitness over time
- **Use elitism**: Keep best solutions to prevent regression
