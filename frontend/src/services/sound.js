/**
 * Zero-dependency Procedural Audio Synthesizer using Web Audio API
 * Plus Hardware Haptic Vibration for mobile devices
 */

let audioCtx = null;

const getAudioContext = () => {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// Play cheerful arpeggio for correct answer
export const playCorrectSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const startTime = ctx.currentTime;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime + i * 0.08);

      gain.gain.setValueAtTime(0.001, startTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.25, startTime + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + i * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + i * 0.08);
      osc.stop(startTime + i * 0.08 + 0.3);
    });
  } catch (e) {
    // Audio might be blocked until user gesture, safe to ignore
  }
};

// Play deep buzzer and error buzz for wrong answer
export const playWrongSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const startTime = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, startTime);
    osc.frequency.exponentialRampToValueAtTime(80, startTime + 0.35);

    gain.gain.setValueAtTime(0.3, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.36);
  } catch (e) {
    // safe ignore
  }
};

// Play magical chime for unlocking hint
export const playHintSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const startTime = ctx.currentTime;
    const freqs = [440, 554.37, 659.25, 880];

    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime + i * 0.06);

      gain.gain.setValueAtTime(0.15, startTime + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + i * 0.06 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + i * 0.06);
      osc.stop(startTime + i * 0.06 + 0.45);
    });
  } catch (e) {
    // safe ignore
  }
};

// Play soft tactile click
export const playClickSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {
    // safe ignore
  }
};

// Hardware vibration on supported devices
export const triggerVibration = (pattern = [100, 50, 100, 50, 150]) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // safe ignore
    }
  }
};

export default {
  playCorrectSound,
  playWrongSound,
  playHintSound,
  playClickSound,
  triggerVibration,
};
