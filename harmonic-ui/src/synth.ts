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

export function startPlayback(patchJson: string): boolean {
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
        startTime + 0.5
      );
      gain.gain.linearRampToValueAtTime(
        0,
        startTime + 0.5 + env.release
      );

      osc.connect(gain);
      const target = filterNode || mainGain;
      gain.connect(target);

      osc.start(startTime);
      osc.stop(startTime + 0.5 + env.release);

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

export function mutatePatches(patchJson: string): string {
  let config: PatchConfig;
  try {
    config = JSON.parse(patchJson);
  } catch {
    return JSON.stringify(getDefaultPatch());
  }

  // Random mutations
  config.oscillators = config.oscillators.map((osc) => ({
    ...osc,
    frequency: osc.frequency * (0.8 + Math.random() * 0.4),
    amplitude: Math.max(0.01, Math.min(1, osc.amplitude + (Math.random() - 0.5) * 0.3)),
    detuning: (osc.detuning || 0) + (Math.random() - 0.5) * 20,
  }));

  if (config.filter) {
    config.filter.frequency = Math.max(100, Math.min(20000, config.filter.frequency * (0.7 + Math.random() * 0.6)));
    config.filter.resonance = Math.max(0.1, Math.min(20, config.filter.resonance + (Math.random() - 0.5) * 4));
  }

  return JSON.stringify(config, null, 2);
}
