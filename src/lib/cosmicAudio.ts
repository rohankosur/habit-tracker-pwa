// Cosmic Web Audio Synthesis Engine (Zero dependencies, pure Web Audio API)

let sharedAudioCtx: AudioContext | null = null;
let activeUrgeOscillator: OscillatorNode | null = null;
let activeUrgeGain: GainNode | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;

  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

// 1. Tactile Mechanical Astrolabe Click (Tick on habit toggle)
export function playMechanicalTick() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const soundEnabled = typeof window !== 'undefined' && localStorage.getItem('reflect_sound_enabled') !== 'false';
  if (!soundEnabled) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // High frequency brief wood/metal transient
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.045);
  } catch (e) {
    console.warn('Audio tick error:', e);
  }
}

// 2. Alchemical Bad-Habit Transmutation Swoosh
export function playTransmutationSwoosh() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const soundEnabled = typeof window !== 'undefined' && localStorage.getItem('reflect_sound_enabled') !== 'false';
  if (!soundEnabled) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);

    gain.gain.setValueAtTime(0.02, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.36);
  } catch (e) {
    console.warn('Transmutation audio error:', e);
  }
}

// 3. 528Hz Solfeggio Celestial Lock Gong (Played upon locking day completion)
export function playCelestialLockGong() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const soundEnabled = typeof window !== 'undefined' && localStorage.getItem('reflect_sound_enabled') !== 'false';
  if (!soundEnabled) return;

  try {
    const now = ctx.currentTime;

    // Harmonic Overtones: 528Hz (Fundamental), 1056Hz (Octave), 1584Hz (5th)
    const freqs = [528, 1056, 1584];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const amp = idx === 0 ? 0.2 : idx === 1 ? 0.09 : 0.04;
      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.65);
    });
  } catch (e) {
    console.warn('Gong audio error:', e);
  }
}

// 4. 432Hz Binaural Ambient Drone for Emergency SOS Urge Defuser
export function startUrgeDefuserDrone() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (activeUrgeOscillator) return; // Already playing

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(432, now); // 432Hz calming tuning

    // Gentle fade in
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 1.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    activeUrgeOscillator = osc;
    activeUrgeGain = gain;
  } catch (e) {
    console.warn('Urge drone error:', e);
  }
}

export function stopUrgeDefuserDrone() {
  if (!activeUrgeOscillator || !activeUrgeGain) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    activeUrgeGain.gain.linearRampToValueAtTime(0.0001, now + 1.0);
    setTimeout(() => {
      try {
        activeUrgeOscillator?.stop();
        activeUrgeOscillator?.disconnect();
        activeUrgeGain?.disconnect();
      } catch {}
      activeUrgeOscillator = null;
      activeUrgeGain = null;
    }, 1100);
  } catch (e) {
    activeUrgeOscillator = null;
    activeUrgeGain = null;
  }
}
