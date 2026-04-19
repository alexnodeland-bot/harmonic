import { useRef, useCallback, useState, useEffect } from 'react';

interface AudioContextConfig {
  enabled?: boolean;
}

export const useAudio = (config: AudioContextConfig = {}) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Initialize audio context
  useEffect(() => {
    if (!audioContextRef.current && !config.enabled) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn('Web Audio API not supported');
      }
    }
  }, [config.enabled]);

  const playClickSound = useCallback(() => {
    if (isMuted || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {
      // Silently fail
    }
  }, [isMuted]);

  const playSuccessChime = useCallback(() => {
    if (isMuted || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    try {
      const now = ctx.currentTime;
      const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5

      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);

        gain.gain.setValueAtTime(0, now + i * 0.05);
        gain.gain.linearRampToValueAtTime(0.15, now + i * 0.05 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc.start(now + i * 0.05);
        osc.stop(now + 0.4);
      });
    } catch (e) {
      // Silently fail
    }
  }, [isMuted]);

  const playSweepTone = useCallback((startFreq = 200, endFreq = 800, duration = 0.3) => {
    if (isMuted || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      // Silently fail
    }
  }, [isMuted]);

  const playFadeOut = useCallback((duration = 0.5) => {
    if (isMuted || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    try {
      // Get current destination gain (if we had set one up)
      // For now, just play a descending tone to indicate fade
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      // Silently fail
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted]);

  return {
    playClickSound,
    playSuccessChime,
    playSweepTone,
    playFadeOut,
    isMuted,
    toggleMute,
  };
};
