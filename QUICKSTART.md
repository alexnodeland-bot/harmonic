# Harmonic Evolution - Quick Start

## Setup (One-Time)

```bash
cd harmonic/harmonic-ui
npm install      # Already done, but in case you're setting up fresh
```

## Run

```bash
npm run dev      # Start dev server
npm run build    # Build for production
```

Then open http://localhost:5173 in your browser.

## 30-Second First Run

1. **Open the app** - You'll see the evolution interface
2. **Click "▶️ Run Evolution"** in the left panel
3. **Watch it go** - Patches improve over 50 generations (~2-3 seconds)
4. **Click patches** in the center grid to hear them
5. **Click ⭐** on ones you like to save them
6. **Tweak sliders** and run again if you want different results

## What Each Panel Does

### Left: Controls
- Set how many patches and generations
- Adjust mutation (0.3 = good default)
- Pick what to optimize for (Energy = loud, Spectrum = complex)
- Start/pause/stop evolution
- Master volume control

### Center: Population
- All patches ranked by fitness
- Click to hear, ⭐ to save
- 🧬 to mutate one patch
- Green fitness bar = better

### Right: Details
- Shows full info about selected patch
- Live spectrum when playing
- Full JSON configuration

### Bottom: Progress
- Green line: best fitness getting better
- Orange line: average patch quality
- Red line: worst patch (for comparison)

## Examples

### 30 Seconds to Good Sound
1. Population: 20
2. Generations: 50
3. Mutation: 0.3
4. Fitness: Energy
5. Click Run → Wait → Click best patch → Play

### Complex, Evolving Patches
1. Population: 30
2. Generations: 100
3. Mutation: 0.35
4. Fitness: Spectrum
5. Click Run → Let it go → Select winners → Mutate them

### Experimental Sounds
1. Population: 15
2. Generations: 200
3. Mutation: 0.6
4. Fitness: Random
5. Click Run → More variety, less optimization

## Tips

- **Favorites stick around** - They auto-save (⭐)
- **Save your evolution** - Top of page has Save/Load buttons
- **Export to share** - "📥 Export JSON" gives you a file
- **Mute if loud** - 🔇 button in left panel
- **Pause to inspect** - Pause mid-evolution, click patches, resume

## Troubleshooting

| Problem | Solution |
|---------|----------|
| No sound | Check volume 🔊 and master volume > 0% |
| Too slow | Lower population or generations |
| Not improving | Try different fitness mode or higher mutation |
| Browser freezes | Reduce population (try 10-15) |
| Forgot to save | Click "💾 Save Session" top of page |

## Files to Know

- `synth.ts` - Audio generation
- `EvolutionRunner.ts` - Genetic algorithm
- `App.tsx` - Main interface
- `components/` - Control panel, population grid, fitness graph
- `EVOLUTION_GUIDE.md` - Full documentation
- `IMPLEMENTATION_SUMMARY.md` - Technical details

## Next Steps

- Read `EVOLUTION_GUIDE.md` for full feature list
- Experiment with different parameter combinations
- Save your best evolutions for later
- Try the mutation button (🧬) on good patches
- Use favorites to bookmark discoveries

Enjoy! 🧬🎵
