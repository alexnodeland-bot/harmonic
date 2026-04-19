// Advanced Web Audio API synthesizer with effects

let audioContext: AudioContext | null = null;
let oscillators: OscillatorNode[] = [];
let gainNodes: GainNode[] = [];
let mainGain: GainNode | null = null;
let analyser: AnalyserNode | null = null;

export interface OscillatorConfig {
  type: 'sine' | 'square' | 'triangle' | 'sawtooth';
  frequency: number;
  amplitude: number;
  detuning?: number; // cents
}

export interface EnvelopeConfig {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface FilterConfig {
  frequency: number;
  resonance: number;
  enabled: boolean;
}

export interface PatchConfig {
  oscillators: OscillatorConfig[];
  envelope: EnvelopeConfig;
  filter?: FilterConfig;
  masterVolume: number;
  id?: string;
  generationCreated?: number;
  parents?: string[];
}

export interface SpectrumData {
  frequencies: number[];
  magnitudes: number[];
}

export interface FitnessMetrics {
  rms: number;
  centroid: number;
  spectrumPeaks: [number, number][];
  fitness: number;
}

const defaultPatch: PatchConfig = {
  oscillators: [
    { type: 'square', frequency: 110, amplitude: 0.4, detuning: 0 },
    { type: 'sawtooth', frequency: 110, amplitude: 0.3, detuning: 12 },
    { type: 'sine', frequency: 220, amplitude: 0.2, detuning: -5 },
  ],
  envelope: {
    attack: 0.01,
    decay: 0.1,
    sustain: 0.7,
    release: 0.2,
  },
  filter: {
    frequency: 2000,
    resonance: 5,
    enabled: true,
  },
  masterVolume: 0.3,
};

export function getDefaultPatch(): PatchConfig {
  return JSON.parse(JSON.stringify(defaultPatch));
}

export function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    mainGain = audioContext.createGain();
    mainGain.gain.value = 0.3;
    mainGain.connect(audioContext.destination);
    
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    mainGain.connect(analyser);
  }
  return audioContext;
}

export function getAnalyser(): AnalyserNode | null {
  return analyser;
}

export function startPlayback(patchJson: string, duration: number = 1.0): boolean {
  try {
    const context = initAudio();
    if (!context || !mainGain) return false;

    if (context.state === 'suspended') {
      context.resume();
    }

    let config: PatchConfig;
    try {
      config = JSON.parse(patchJson);
    } catch {
      config = getDefaultPatch();
    }

    stopPlayback();

    mainGain.gain.setValueAtTime(config.masterVolume * 0.1, context.currentTime);

    // Create filter if enabled
    let filterNode: BiquadFilterNode | null = null;
    if (config.filter?.enabled) {
      filterNode = context.createBiquadFilter();
      filterNode.type = 'lowpass';
      filterNode.frequency.value = config.filter.frequency;
      filterNode.Q.value = config.filter.resonance;
      filterNode.connect(mainGain);
    }

    const startTime = context.currentTime;
    const env = config.envelope;
    const sustainDuration = Math.max(0, duration - env.attack - env.decay - env.release);

    // Create oscillators
    config.oscillators.forEach((oscConfig) => {
      const osc = context.createOscillator();
      const gain = context.createGain();

      osc.type = oscConfig.type;
      osc.frequency.value = Math.max(20, Math.min(20000, oscConfig.frequency));
      
      if (oscConfig.detuning) {
        osc.detune.value = oscConfig.detuning;
      }

      // ADSR envelope
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(
        oscConfig.amplitude * (config.masterVolume * 0.5),
        startTime + env.attack
      );
      gain.gain.linearRampToValueAtTime(
        oscConfig.amplitude * env.sustain * (config.masterVolume * 0.5),
        startTime + env.attack + env.decay
      );
      gain.gain.setValueAtTime(
        oscConfig.amplitude * env.sustain * (config.masterVolume * 0.5),
        startTime + env.attack + env.decay + sustainDuration
      );
      gain.gain.linearRampToValueAtTime(
        0,
        startTime + duration + env.release
      );

      osc.connect(gain);
      const target = filterNode || mainGain;
      gain.connect(target);

      osc.start(startTime);
      osc.stop(startTime + duration + env.release);

      oscillators.push(osc);
      gainNodes.push(gain);
    });

    return true;
  } catch (error) {
    console.error('Synth error:', error);
    return false;
  }
}

export function stopPlayback() {
  oscillators.forEach((osc) => {
    try {
      osc.stop();
    } catch (e) {
      // Already stopped
    }
  });
  oscillators = [];
  gainNodes = [];
}

export function isPlaying(): boolean {
  return oscillators.length > 0;
}

export function generateRandomPatch(): PatchConfig {
  const types: Array<'sine' | 'square' | 'triangle' | 'sawtooth'> = [
    'sine',
    'square',
    'triangle',
    'sawtooth',
  ];

  const baseFreq = [55, 110, 220, 440, 880][Math.floor(Math.random() * 5)];
  const numOscs = Math.floor(Math.random() * 3) + 1;

  return {
    oscillators: Array.from({ length: numOscs }, () => ({
      type: types[Math.floor(Math.random() * types.length)],
      frequency: baseFreq * (0.5 + Math.random() * 2),
      amplitude: Math.random() * 0.8 + 0.1,
      detuning: (Math.random() - 0.5) * 50,
    })),
    envelope: {
      attack: Math.random() * 0.05,
      decay: Math.random() * 0.2,
      sustain: Math.random() * 0.8 + 0.1,
      release: Math.random() * 0.3 + 0.1,
    },
    filter: {
      frequency: Math.random() * 8000 + 1000,
      resonance: Math.random() * 8 + 1,
      enabled: Math.random() > 0.3,
    },
    masterVolume: 0.3,
  };
}

export function mutatePatches(patchJson: string, mutationRate: number = 0.2): string {
  let config: PatchConfig;
  try {
    config = JSON.parse(patchJson);
  } catch {
    return JSON.stringify(getDefaultPatch());
  }

  // Apply mutation rate - controls how much things change
  const shouldMutate = (rate: number) => Math.random() < rate;

  // Random mutations with mutation rate control
  config.oscillators = config.oscillators.map((osc) => ({
    ...osc,
    frequency: shouldMutate(mutationRate)
      ? osc.frequency * (0.8 + Math.random() * 0.4)
      : osc.frequency,
    amplitude: shouldMutate(mutationRate)
      ? Math.max(0.01, Math.min(1, osc.amplitude + (Math.random() - 0.5) * 0.3))
      : osc.amplitude,
    detuning: shouldMutate(mutationRate)
      ? (osc.detuning || 0) + (Math.random() - 0.5) * 20
      : osc.detuning || 0,
  }));

  // Occasionally add/remove oscillators
  if (shouldMutate(mutationRate * 0.5)) {
    if (config.oscillators.length < 5 && Math.random() > 0.5) {
      // Add oscillator
      const newOsc: OscillatorConfig = {
        type: ['sine', 'square', 'triangle', 'sawtooth'][Math.floor(Math.random() * 4)] as any,
        frequency: Math.random() * 2000 + 50,
        amplitude: Math.random() * 0.5 + 0.1,
        detuning: (Math.random() - 0.5) * 50,
      };
      config.oscillators.push(newOsc);
    } else if (config.oscillators.length > 1) {
      // Remove oscillator
      config.oscillators = config.oscillators.slice(0, -1);
    }
  }

  if (config.filter && shouldMutate(mutationRate)) {
    config.filter.frequency = Math.max(100, Math.min(20000, config.filter.frequency * (0.7 + Math.random() * 0.6)));
    config.filter.resonance = Math.max(0.1, Math.min(20, config.filter.resonance + (Math.random() - 0.5) * 4));
  }

  return JSON.stringify(config, null, 2);
}

export function crossoverPatches(parent1Json: string, parent2Json: string, crossoverRate: number = 0.5): string {
  let p1: PatchConfig, p2: PatchConfig;
  
  try {
    p1 = JSON.parse(parent1Json);
    p2 = JSON.parse(parent2Json);
  } catch {
    return JSON.stringify(generateRandomPatch());
  }

  const child: PatchConfig = {
    oscillators: [],
    envelope: { ...p1.envelope },
    filter: p1.filter ? { ...p1.filter } : undefined,
    masterVolume: p1.masterVolume,
    parents: [p1.id || 'unknown', p2.id || 'unknown'],
  };

  // Blend oscillators - randomly select from both parents
  const maxOscs = Math.max(p1.oscillators.length, p2.oscillators.length);
  const minOscs = Math.min(p1.oscillators.length, p2.oscillators.length);
  const childOscCount = Math.ceil((minOscs + maxOscs) / 2 + (Math.random() - 0.5) * 2);

  for (let i = 0; i < childOscCount; i++) {
    if (i < p1.oscillators.length && i < p2.oscillators.length) {
      // Blend both parent oscillators
      const o1 = p1.oscillators[i];
      const o2 = p2.oscillators[i];
      const blend = Math.random();

      child.oscillators.push({
        type: Math.random() > 0.5 ? o1.type : o2.type,
        frequency: o1.frequency * blend + o2.frequency * (1 - blend),
        amplitude: o1.amplitude * blend + o2.amplitude * (1 - blend),
        detuning: (o1.detuning || 0) * blend + (o2.detuning || 0) * (1 - blend),
      });
    } else if (i < p1.oscillators.length) {
      child.oscillators.push({ ...p1.oscillators[i] });
    } else if (i < p2.oscillators.length) {
      child.oscillators.push({ ...p2.oscillators[i] });
    }
  }

  // Blend envelope
  const envBlend = Math.random();
  child.envelope = {
    attack: p1.envelope.attack * envBlend + p2.envelope.attack * (1 - envBlend),
    decay: p1.envelope.decay * envBlend + p2.envelope.decay * (1 - envBlend),
    sustain: p1.envelope.sustain * envBlend + p2.envelope.sustain * (1 - envBlend),
    release: p1.envelope.release * envBlend + p2.envelope.release * (1 - envBlend),
  };

  // Blend filter if both have it
  if (p1.filter && p2.filter) {
    const filterBlend = Math.random();
    child.filter = {
      frequency: p1.filter.frequency * filterBlend + p2.filter.frequency * (1 - filterBlend),
      resonance: p1.filter.resonance * filterBlend + p2.filter.resonance * (1 - filterBlend),
      enabled: Math.random() > 0.5 ? p1.filter.enabled : p2.filter.enabled,
    };
  }

  return JSON.stringify(child);
}

export function evaluateFitness(
  patchJson: string,
  targetMode: 'spectrum' | 'energy' | 'random' = 'energy'
): FitnessMetrics {
  let config: PatchConfig;
  try {
    config = JSON.parse(patchJson);
  } catch {
    return { rms: 0, centroid: 0, spectrumPeaks: [], fitness: 0 };
  }

  // Calculate spectrum characteristics
  const totalAmp = config.oscillators.reduce((sum, o) => sum + o.amplitude, 0);
  const rms = totalAmp / config.oscillators.length;

  const centroid = config.oscillators.length > 0
    ? config.oscillators.reduce((sum, o) => sum + o.frequency * o.amplitude, 0) / (totalAmp || 1)
    : 0;

  const spectrumPeaks = config.oscillators
    .map((o) => [o.frequency, o.amplitude] as [number, number])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Calculate fitness based on mode
  let fitness = 0.5; // Base fitness

  if (targetMode === 'energy') {
    // Favor moderate-to-high energy
    fitness = Math.min(1, totalAmp / 2);
  } else if (targetMode === 'spectrum') {
    // Favor balanced spectrum (multiple peaks, not too concentrated)
    const peakVariance = config.oscillators.length > 1
      ? config.oscillators.reduce((sum, o) => sum + Math.pow(o.frequency - centroid, 2), 0) / config.oscillators.length
      : 0;
    fitness = Math.min(1, 0.3 + Math.sqrt(peakVariance) / 5000);
  } else if (targetMode === 'random') {
    // Random fitness for baseline comparison
    fitness = Math.random();
  }

  // Bonus for having multiple oscillators
  fitness = fitness * 0.8 + (config.oscillators.length / 6) * 0.2;

  // Bonus for reasonable values (not extreme)
  const avgFreq = config.oscillators.reduce((sum, o) => sum + o.frequency, 0) / config.oscillators.length;
  if (avgFreq >= 50 && avgFreq <= 5000) {
    fitness *= 1.1;
  }

  return {
    rms,
    centroid,
    spectrumPeaks,
    fitness: Math.min(1, Math.max(0, fitness)),
  };
}
