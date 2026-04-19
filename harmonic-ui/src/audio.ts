// Simple Web Audio API synthesizer

let audioContext: AudioContext | null = null;
let oscillator: OscillatorNode | null = null;
let gainNode: GainNode | null = null;

export interface Patch {
  oscillators?: Array<{
    type: string;
    frequency: number;
    amplitude: number;
  }>;
}

export function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

export function startPlayback(patch: string): boolean {
  try {
    const context = initAudio();
    if (context.state === 'suspended') {
      context.resume();
    }

    const data = JSON.parse(patch) as Patch;
    const osc = data.oscillators?.[0];
    
    if (!osc) {
      console.error('No oscillator in patch');
      return false;
    }

    // Stop any existing playback
    stopPlayback();

    // Create fresh nodes
    oscillator = context.createOscillator();
    gainNode = context.createGain();

    // Configure oscillator
    oscillator.type = (osc.type || 'sine') as OscillatorType;
    oscillator.frequency.value = Math.max(20, Math.min(20000, osc.frequency || 440));

    // Configure gain (envelope)
    gainNode.gain.setValueAtTime(0.3 * (osc.amplitude || 0.5), context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);

    // Connect and start
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(context.currentTime);

    return true;
  } catch (error) {
    console.error('Audio playback error:', error);
    return false;
  }
}

export function stopPlayback() {
  if (oscillator) {
    try {
      oscillator.stop();
    } catch (e) {
      // Already stopped
    }
    oscillator = null;
  }
  if (gainNode) {
    gainNode = null;
  }
}

export function isPlaying(): boolean {
  return oscillator !== null;
}
