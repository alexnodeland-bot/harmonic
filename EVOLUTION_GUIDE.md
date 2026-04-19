# Harmonic Evolution Guide

## Overview

Harmonic now includes a complete genetic algorithm-based audio synthesis evolution system. This guide explains how to use the evolution UI to breed better-sounding audio patches.

## Features

### 1. Evolution Control Panel (Left Panel)

The control panel provides sliders and inputs to configure the genetic algorithm:

#### Population Controls
- **Population Size**: (5-100) Number of patches in each generation
  - Larger populations explore more diversity but compute slower
  - Smaller populations converge faster but may get stuck in local optima
  - Recommended: 20-30 for balanced exploration

- **Max Generations**: (1-500) How many generations to evolve
  - Each generation evaluates fitness and creates new offspring
  - More generations = more optimization but takes longer
  - Recommended: 50-100 to see clear improvement

#### Genetic Algorithm Parameters
- **Mutation Rate**: (0.0-1.0) Probability of random changes to offspring
  - 0.0 = No mutations (pure inheritance)
  - 1.0 = Complete randomization
  - Sweet spot: 0.2-0.4 (20-40% of parameters mutate)

- **Crossover Rate**: (0.0-1.0) Probability of breeding two parents
  - 0.0 = Only mutations, no breeding
  - 1.0 = Always breed, never pure mutations
  - Sweet spot: 0.6-0.8 (breed, then mutate offspring)

- **Elite Size**: (1-half population) Best patches kept each generation
  - Higher values preserve good solutions
  - Lower values allow more experimentation
  - Recommended: 1-3

#### Fitness Targets
Choose what characteristics to optimize for:

- **Energy**: Favors patches with higher overall amplitude
  - Good for: Thick, powerful synth sounds
  
- **Spectrum**: Favors balanced multi-harmonic patches
  - Good for: Richer, more complex timbres
  
- **Random**: Baseline fitness (useful for testing)
  - Good for: Exploring the space without bias

#### Audio Controls
- **Master Volume**: Overall output level (0-100%)
- **Mute Button**: Quick mute/unmute for audio output

### 2. Population Grid (Center Panel)

Real-time visualization of all patches in the current population:

Each card shows:
- **Rank**: Position in fitness order (#1 is best)
- **Fitness Bar**: Visual representation of fitness (0-100%)
  - Green = Good fitness
  - Yellow/Orange = Medium fitness
  - Red = Poor fitness
- **Waveform Visualization**: Visual representation of the patch
  - Height = frequency content
  - Opacity = amplitude of each oscillator
- **Generation Created**: Which generation produced this patch
- **Oscillator Count**: Number of oscillators in the patch
- **Spectral Centroid**: Average frequency (Hz)

#### Card Actions
- **⭐ Favorite Button**: Bookmark patches you like
  - Saved to browser local storage
  - Survives between sessions
  
- **▶️ Play Button**: Audition the patch (1.5 seconds)
  - Orange highlight = Currently playing
  - Shows live spectrum analyzer
  
- **🧬 Mutate Button**: Create a mutated copy and play it
  - Useful for fine-tuning good patches
  - One-off variation without running full evolution

#### Selection
Click any card to select it:
- Highlights the card
- Shows full details in the right panel
- Displays patch JSON configuration

### 3. Selected Patch Details (Right Panel)

Shows detailed information about the currently selected patch:

- **Fitness Score**: 0-100% with color coding
- **Generation**: When this patch was created
- **Oscillator Details**: Count, frequencies, amplitudes
- **Spectral Analysis**: 
  - Centroid: Average frequency
  - RMS Energy: Overall amplitude
- **Live Spectrum**: Real-time analyzer while playing
- **Patch JSON**: Full configuration (truncated for display)

### 4. Fitness Over Time Graph (Bottom)

Multi-line graph showing evolution progress:

- **Green Line**: Best fitness each generation
  - Shows if evolution is improving
  - Steeper = faster improvement
  
- **Orange Line**: Average fitness each generation
  - Shows population health
  - Gap from green = diversity
  
- **Red Line**: Worst fitness each generation
  - Shows diversity
  - Shows if bad patches are being phased out

## How to Use

### Basic Evolution Workflow

1. **Set Parameters**
   - Adjust population size, generations, mutation/crossover rates
   - Choose a fitness target (Energy, Spectrum, or Random)
   - Set master volume if you want quieter audio

2. **Run Evolution**
   - Click "▶️ Run Evolution" button
   - Watch patches improve in real-time
   - The progress bar shows generation count

3. **Monitor Progress**
   - Watch the fitness graph grow
   - Scan the population grid for improving patches
   - See best/average/worst fitness trends

4. **Pause and Inspect**
   - Click "⏸️ Pause" to pause mid-evolution
   - Select interesting patches to hear them
   - Resume evolution when ready

5. **Keep Good Patches**
   - Click ⭐ on patches you like
   - These are saved to browser storage

6. **Fine-Tune Results**
   - Select a good patch
   - Click 🧬 to mutate it one-off
   - Tweak parameters and mutate different ways

### Advanced Techniques

#### Selective Breeding
1. Run an initial evolution with broad parameters (Energy mode)
2. Select the top 3-5 patches
3. Favorite them ⭐
4. Run another evolution with stricter elite size
5. Better patches will breed more often

#### Multi-Stage Evolution
1. First pass: Random fitness (200 generations)
   - Explores the space broadly
2. Second pass: Spectrum fitness (100 generations)
   - Refines toward balance
3. Third pass: Energy fitness (50 generations)
   - Pushes amplitude up

#### Parameter Sensitivity Testing
1. Run evolution with high mutation (0.8)
   - See chaotic but potentially innovative results
2. Run same with low mutation (0.1)
   - See incremental, reliable improvement
3. Compare fitness graphs to understand parameter impact

## Technical Details

### Fitness Scoring

Fitness is calculated by analyzing:

1. **Amplitude (RMS Energy)**
   - Total loudness across all oscillators
   - Normalized to 0-1 scale

2. **Spectral Centroid**
   - Weighted average frequency
   - Determines tonal character

3. **Harmonic Distribution**
   - Number and spread of oscillators
   - Indicates complexity

4. **Frequency Range**
   - Patches in 50-5000 Hz range get bonus
   - Avoids extreme/unusable frequencies

### Genetic Operations

#### Crossover
When two parents breed:
- Number of oscillators is averaged (±1 random)
- Oscillator parameters (freq, amp, detune) are interpolated
- ADSR envelope parameters are blended
- Filter parameters are inherited from one parent

#### Mutation
Applied to offspring:
- Frequency: ±20% random change
- Amplitude: ±30% with bounds (0.01-1.0)
- Detuning: ±20 cents
- Filter frequency: ±30% change
- Occasionally adds/removes oscillators

### Evolution Loop

Each generation:
1. **Evaluate**: Calculate fitness for each patch
2. **Sort**: Order patches by fitness (best first)
3. **Preserve**: Keep top N patches (elite)
4. **Select**: Tournament selection picks parents
5. **Breed**: Create offspring via crossover
6. **Mutate**: Apply mutations to offspring
7. **Replace**: Fill rest of population with offspring
8. **Repeat**: Continue to next generation

## Data Persistence

### Auto-Save Features
- **Browser Local Storage**: Favorites are saved automatically
- **Session Save**: Click "💾 Save Session" to save full evolution state
- **Session Load**: Click "📂 Load Session" to restore previous evolution
- **JSON Export**: Click "📥 Export JSON" to download evolution as portable file

### File Formats

#### Exported JSON Structure
```json
{
  "timestamp": "2026-04-18T22:43:00Z",
  "generationStats": [
    {
      "generation": 1,
      "bestFitness": 0.75,
      "avgFitness": 0.52,
      "worstFitness": 0.28,
      "bestPatch": { /* patch data */ }
    }
  ],
  "population": [ /* array of patches */ ],
  "parameters": { /* evolution parameters */ }
}
```

## Troubleshooting

### "Patches not improving"
- Check fitness target matches your goal (Energy for loud, Spectrum for complex)
- Increase mutation rate to explore more
- Increase population size for more diversity
- Run more generations (they improve slowly at first)

### "Population converging too fast"
- Decrease elite size (allow more experimentation)
- Increase mutation rate
- Decrease crossover rate (more randomization)

### "No sound or very quiet"
- Check master volume > 0%
- Check not muted 🔇
- Ensure browser has audio permissions
- Check browser volume isn't muted

### "Browser is slow"
- Reduce population size
- Reduce max generations
- Close other tabs/apps
- Shorter generations run faster

## Tips for Great Sounds

### For Thick, Powerful Sounds
- Use Energy fitness mode
- Set mutation rate 0.25-0.35
- Use larger population (50+)
- Higher elite size (3-5)

### For Complex, Evolving Patches
- Use Spectrum fitness mode
- Medium mutation (0.3-0.4)
- Medium-large population (25-40)
- Elite size 2-3

### For Experimental Sounds
- Use Random fitness mode
- High mutation (0.5-0.7)
- Smaller population (10-15)
- Lower elite size (1)
- Run longer (200+ generations)

## File Structure

```
harmonic-ui/src/
├── synth.ts                    # Core synthesis engine + genetic functions
├── EvolutionRunner.ts          # GA algorithm implementation
├── App.tsx                     # Main UI orchestration
├── components/
│   ├── EvolutionPanel.tsx      # Control panel
│   ├── PopulationGrid.tsx      # Population visualization
│   └── FitnessGraph.tsx        # Fitness timeline
├── utils/
│   └── persistence.ts          # Save/load functionality
└── styles/
    ├── EvolutionPanel.css
    ├── PopulationGrid.css
    └── FitnessGraph.css
```

## API Reference

### EvolutionRunner Class

```typescript
class EvolutionRunner {
  // Initialize with random population
  initialize(): void
  
  // Run one generation and return stats
  runGeneration(): Promise<GenerationStats>
  
  // Start/pause/stop evolution
  start(maxGenerations: number): void
  pause(): void
  resume(): void
  stop(): void
  
  // Get current state
  getPopulation(): PatchWithFitness[]
  getStats(): GenerationStats
  getCurrentGeneration(): number
  getGenerationHistory(): GenerationStats[]
  
  // Configure parameters
  updateParameters(
    populationSize?: number,
    mutationRate?: number,
    crossoverRate?: number,
    eliteSize?: number,
    targetFitnessMode?: 'spectrum' | 'energy' | 'random'
  ): void
  
  // Export data
  exportHistory(): string
}
```

### Synth Functions

```typescript
// Core operations
startPlayback(patchJson: string, duration?: number): boolean
stopPlayback(): void
generateRandomPatch(): PatchConfig
mutatePatches(patchJson: string, mutationRate?: number): string
crossoverPatches(parent1: string, parent2: string, rate?: number): string
evaluateFitness(patchJson: string, mode?: 'spectrum'|'energy'|'random'): FitnessMetrics
```

## Performance Notes

- **Typical evolution**: 20 patches × 50 generations = ~1-5 seconds on modern hardware
- **Large population**: 100 patches × 200 generations = ~30-60 seconds
- **Bottleneck**: Fitness evaluation (spectrum analysis)
- **Optimization**: Use smaller populations for real-time iteration

## Future Enhancements

Potential additions:
- Audio playback while evolving (muted for speed)
- Multi-objective optimization (Pareto frontier)
- Custom fitness functions (user-defined scoring)
- Phylogenetic tree visualization
- A/B comparison between patches
- Batch mutation and crossover operations
- GPU-accelerated fitness evaluation
- Integration with DAWs/plugins

---

Happy evolving! 🧬🎵
