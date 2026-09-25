import { audioOutput, setUnlockListener } from "./soundEngine";

// Generative ambient music for the rooms: slow pad chords, a soft bell melody
// and a synthetic reverb. Nothing is downloaded; each visit plays a slightly
// different arrangement of the same progression.

export type Theme = "hall" | "legacy" | "race";

interface ThemeDef {
  /** Chords as MIDI note numbers, lowest first. */
  chords: number[][];
  secondsPerChord: number;
  /** Notes the melody may choose from (MIDI). */
  melody: number[];
  padLevel: number;
  bass: boolean;
  /** Lowpass cutoff for the pad: lower is warmer. */
  warmth: number;
  pulse: boolean;
}

const themes: Record<Theme, ThemeDef> = {
  // Calm and warm: D major, gently resolving.
  hall: {
    chords: [
      [50, 62, 66, 69, 73], // Dmaj7
      [47, 59, 62, 66, 69], // Bm7
      [43, 59, 62, 67, 71], // Gmaj7
      [45, 57, 61, 64, 69], // A
    ],
    secondsPerChord: 8,
    melody: [74, 76, 78, 81, 83, 86],
    padLevel: 0.05,
    bass: true,
    warmth: 1100,
    pulse: false,
  },
  // Majestic and ambitious: C minor rising to a bright E-flat.
  legacy: {
    chords: [
      [36, 55, 60, 63, 67], // Cm
      [44, 56, 60, 63, 68], // Ab
      [39, 55, 58, 63, 67], // Eb
      [46, 58, 62, 65, 70], // Bb
    ],
    secondsPerChord: 7,
    melody: [72, 75, 77, 79, 82, 84],
    padLevel: 0.055,
    bass: true,
    warmth: 1500,
    pulse: true,
  },
  // Race replays: a driving, restrained A minor with a steady pulse.
  race: {
    chords: [
      [45, 57, 60, 64, 69], // Am
      [41, 57, 60, 65, 69], // F
      [48, 55, 60, 64, 67], // C
      [43, 55, 59, 62, 67], // G
    ],
    secondsPerChord: 4,
    melody: [76, 79, 81, 84],
    padLevel: 0.04,
    bass: true,
    warmth: 1800,
    pulse: true,
  },
};

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

function reverb(c: AudioContext, seconds = 3.6) {
  const len = Math.floor(c.sampleRate * seconds);
  const impulse = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = impulse.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2.6;
  }
  const conv = c.createConvolver();
  conv.buffer = impulse;
  return conv;
}

let current: { theme: Theme; stop: () => void } | null = null;
let pending: Theme | null = null;

/** Start a room's music (or keep it if already playing). */
export function startMusic(theme: Theme) {
  if (current?.theme === theme) return;
  stopMusic();
  const out = audioOutput();
  if (!out) {
    // Audio not unlocked yet: begin on the next gesture.
    pending = theme;
    return;
  }
  pending = null;
  const { ctx: c, destination } = out;
  const def = themes[theme];

  const bus = c.createGain();
  bus.gain.value = 0;
  bus.gain.setTargetAtTime(1, c.currentTime, 2.5);
  const wet = c.createGain();
  wet.gain.value = 0.55;
  const dry = c.createGain();
  dry.gain.value = 0.6;
  const verb = reverb(c);
  bus.connect(dry).connect(destination);
  bus.connect(verb).connect(wet).connect(destination);

  let next = c.currentTime + 0.1;
  let index = 0;
  const playChord = (at: number, notes: number[]) => {
    const dur = def.secondsPerChord;
    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = def.warmth;
    filter.Q.value = 0.4;
    const env = c.createGain();
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(def.padLevel, at + dur * 0.35);
    env.gain.setValueAtTime(def.padLevel, at + dur * 0.8);
    env.gain.linearRampToValueAtTime(0, at + dur * 1.25);
    filter.connect(env).connect(bus);
    notes.forEach((n, i) => {
      if (i === 0 && !def.bass) return;
      // Two slightly detuned voices per note make the pad breathe.
      for (const detune of [-7, 6]) {
        const o = c.createOscillator();
        o.type = i === 0 ? "sine" : "sawtooth";
        o.frequency.value = hz(n);
        o.detune.value = detune;
        const g = c.createGain();
        g.gain.value = i === 0 ? 1.6 : 0.45;
        o.connect(g).connect(filter);
        o.start(at);
        o.stop(at + dur * 1.3);
      }
    });
    // A slow, soft timpani-like pulse for the Legacy theme.
    if (def.pulse)
      for (const beat of [0, dur / 2]) {
        const o = c.createOscillator();
        o.type = "sine";
        const t0 = at + beat;
        o.frequency.setValueAtTime(hz(notes[0] - 12) * 2, t0);
        o.frequency.exponentialRampToValueAtTime(hz(notes[0] - 12), t0 + 0.3);
        const g = c.createGain();
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(0.12, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.6);
        o.connect(g).connect(bus);
        o.start(t0);
        o.stop(t0 + 1.7);
      }
    // Two or three bell notes over each chord, never quite the same.
    const count = 2 + Math.floor(Math.random() * 2);
    for (let k = 0; k < count; k++) {
      const t0 = at + 1 + (k * dur) / count + Math.random() * 0.8;
      const n = def.melody[Math.floor(Math.random() * def.melody.length)];
      for (const [ratio, level] of [[1, 0.05], [2.76, 0.012]] as const) {
        const o = c.createOscillator();
        o.type = "sine";
        o.frequency.value = hz(n) * ratio;
        const g = c.createGain();
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(level, t0 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.5);
        o.connect(g).connect(bus);
        o.start(t0);
        o.stop(t0 + 3.6);
      }
    }
  };

  // Schedule a couple of chords ahead so playback never gaps.
  const timer = window.setInterval(() => {
    while (next < c.currentTime + def.secondsPerChord * 1.5) {
      playChord(next, def.chords[index % def.chords.length]);
      next += def.secondsPerChord;
      index++;
    }
  }, 500);
  playChord(next, def.chords[0]);
  next += def.secondsPerChord;
  index = 1;

  current = {
    theme,
    stop: () => {
      window.clearInterval(timer);
      bus.gain.cancelScheduledValues(c.currentTime);
      bus.gain.setTargetAtTime(0, c.currentTime, 0.7);
      window.setTimeout(() => {
        bus.disconnect();
        verb.disconnect();
      }, 4000);
    },
  };
}

export function stopMusic() {
  pending = null;
  current?.stop();
  current = null;
}

/** Called after audio unlocks, to start music a room asked for earlier. */
export function resumePendingMusic() {
  if (pending) startMusic(pending);
}

// Music waiting for the first gesture starts once audio is unlocked.
setUnlockListener(resumePendingMusic);
