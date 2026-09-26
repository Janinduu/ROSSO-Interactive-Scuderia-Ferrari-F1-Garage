import { audioOutput } from "./soundEngine";
import type { EngineProfile } from "./engineProfile";

// Trackside sound for the Legendary Moments replays, synthesised like every
// other ROSSO sound: a distant pack of engines, cars screaming past with a
// Doppler drop and a stereo sweep, and a crowd roar at the chequered flag.
// The engine note follows the Ferrari of the season (V10, V8, turbo V6...).

export interface RaceSound {
  setPlaying: (on: boolean) => void;
  /** Replay speed (0.5, 1, 2): faster replays bring cars past more often. */
  setSpeed: (speed: number) => void;
  /** The chequered flag: the crowd rises and the engines fade away. */
  finish: () => void;
  stop: () => void;
}

const silent: RaceSound = { setPlaying: () => {}, setSpeed: () => {}, finish: () => {}, stop: () => {} };

function noise(c: AudioContext, seconds: number) {
  const b = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

function shaperFor(c: AudioContext, p: EngineProfile) {
  const s = c.createWaveShaper();
  const k = p.cylinders <= 6 ? 6 : p.cylinders <= 8 ? 4.5 : 3;
  const curve = new Float32Array(1024);
  for (let i = 0; i < curve.length; i++) {
    const x = (i / curve.length) * 2 - 1;
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  s.curve = curve;
  return s;
}

export function startRaceSound(p: EngineProfile): RaceSound {
  const out = audioOutput();
  if (!out) return silent;
  const { ctx: c, destination } = out;
  const firing = (rpm: number) => (rpm / 60) * (p.cylinders / 2);
  // Turbo hybrids are quieter and lower than the screaming V10s.
  const loudness = p.hybrid ? 0.75 : 1;

  const bus = c.createGain();
  bus.gain.value = 0;
  bus.connect(destination);
  const air = noise(c, 3);

  // The pack: two engines far away, their revs wandering as they lap.
  const packFilter = c.createBiquadFilter();
  packFilter.type = "lowpass";
  packFilter.frequency.value = 650;
  const packGain = c.createGain();
  packGain.gain.value = 0.05 * loudness;
  const packShaper = shaperFor(c, p);
  packShaper.connect(packFilter).connect(packGain).connect(bus);
  const pack = [0.99, 1.013].map((detune) => {
    const o = c.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = firing(p.peakRpm * 0.75) * detune;
    const g = c.createGain();
    g.gain.value = 0.5;
    o.connect(g).connect(packShaper);
    o.start();
    return { o, detune };
  });
  // Wind and distant crowd under everything.
  const wind = c.createBufferSource();
  wind.buffer = air;
  wind.loop = true;
  const windFilter = c.createBiquadFilter();
  windFilter.type = "bandpass";
  windFilter.frequency.value = 420;
  windFilter.Q.value = 0.6;
  const windGain = c.createGain();
  windGain.gain.value = 0.035;
  wind.connect(windFilter).connect(windGain).connect(bus);
  wind.start();

  /** One car flat out past the camera. */
  const passBy = (at: number, level: number, dir: 1 | -1) => {
    const dur = 1.5 + Math.random() * 0.5;
    const mid = at + dur * 0.5;
    const end = at + dur;
    const r0 = p.peakRpm * (0.8 + Math.random() * 0.06);
    const r1 = p.peakRpm * (0.93 + Math.random() * 0.05);
    const shift = Math.random() < 0.5;
    const shaper = shaperFor(c, p);
    const tone = c.createBiquadFilter();
    tone.type = "lowpass";
    tone.Q.value = 1.2;
    tone.frequency.setValueAtTime(1300, at);
    tone.frequency.exponentialRampToValueAtTime(6500, mid);
    tone.frequency.exponentialRampToValueAtTime(900, end);
    const env = c.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(level * loudness, mid);
    env.gain.exponentialRampToValueAtTime(0.0001, end);
    const pan = c.createStereoPanner();
    pan.pan.setValueAtTime(-0.9 * dir, at);
    pan.pan.linearRampToValueAtTime(0.9 * dir, end);
    shaper.connect(tone).connect(env).connect(pan).connect(bus);
    // Approaching the note is raised, receding it falls: the Doppler drop.
    for (const [ratio, gain, type] of [[1, 0.5, "sawtooth"], [2, 0.16, "sawtooth"], [0.5, 0.2, "square"]] as const) {
      const o = c.createOscillator();
      o.type = type;
      const f = (rpm: number, doppler: number) => firing(rpm) * ratio * doppler;
      o.frequency.setValueAtTime(f(r0, 1.1), at);
      if (shift) {
        // An upshift just before the car reaches the camera.
        o.frequency.linearRampToValueAtTime(f(r1, 1.1), mid - 0.3);
        o.frequency.linearRampToValueAtTime(f(r1 * 0.8, 1.1), mid - 0.24);
        o.frequency.linearRampToValueAtTime(f(r1 * 0.88, 1.08), mid - 0.1);
      } else o.frequency.linearRampToValueAtTime(f(r1, 1.08), mid - 0.1);
      o.frequency.exponentialRampToValueAtTime(f(r1, 0.9), mid + 0.12);
      o.frequency.linearRampToValueAtTime(f(r1 * 1.02, 0.88), end);
      const g = c.createGain();
      g.gain.value = gain;
      o.connect(g).connect(shaper);
      o.start(at);
      o.stop(end + 0.05);
    }
    // Tyre and air rush as it goes by.
    const rush = c.createBufferSource();
    rush.buffer = air;
    const rushFilter = c.createBiquadFilter();
    rushFilter.type = "bandpass";
    rushFilter.frequency.value = 2400;
    rushFilter.Q.value = 0.7;
    const rushEnv = c.createGain();
    rushEnv.gain.setValueAtTime(0.0001, at);
    rushEnv.gain.exponentialRampToValueAtTime(level * 0.35, mid);
    rushEnv.gain.exponentialRampToValueAtTime(0.0001, end);
    rush.connect(rushFilter).connect(rushEnv).connect(pan);
    rush.start(at);
    rush.stop(end + 0.05);
  };

  let playing = false;
  let speed = 0.5;
  let nextAt = c.currentTime + 0.6;
  let wanderAt = c.currentTime;
  const timer = window.setInterval(() => {
    if (!playing) return;
    const now = c.currentTime;
    if (now >= wanderAt) {
      wanderAt = now + 1.6 + Math.random() * 1.4;
      const rpm = p.peakRpm * (0.6 + Math.random() * 0.3);
      for (const { o, detune } of pack) {
        o.frequency.setValueAtTime(o.frequency.value, now);
        o.frequency.linearRampToValueAtTime(firing(rpm) * detune, wanderAt);
      }
    }
    if (now >= nextAt - 0.15) {
      const dir = Math.random() < 0.5 ? 1 : -1;
      passBy(nextAt, 0.2 + Math.random() * 0.06, dir);
      // Now and then a battle: a second car right behind the first.
      if (Math.random() < 0.25) passBy(nextAt + 0.25 + Math.random() * 0.3, 0.16, dir);
      const gap = (2.4 + Math.random() * 3.4) / Math.sqrt(speed / 0.5);
      nextAt += gap;
    }
  }, 120);

  let stopped = false;
  const stop = (fade = 0.6) => {
    if (stopped) return;
    stopped = true;
    window.clearInterval(timer);
    const now = c.currentTime;
    bus.gain.cancelScheduledValues(now);
    bus.gain.setValueAtTime(bus.gain.value, now);
    bus.gain.linearRampToValueAtTime(0, now + fade);
    window.setTimeout(() => {
      pack.forEach(({ o }) => o.stop());
      wind.stop();
      bus.disconnect();
    }, fade * 1000 + 3000);
  };

  return {
    setPlaying: (on) => {
      if (stopped || on === playing) return;
      playing = on;
      const now = c.currentTime;
      bus.gain.cancelScheduledValues(now);
      bus.gain.setValueAtTime(bus.gain.value, now);
      bus.gain.linearRampToValueAtTime(on ? 1 : 0, now + (on ? 0.8 : 0.4));
      if (on) nextAt = Math.max(nextAt, now + 0.5);
    },
    setSpeed: (s) => {
      speed = s;
    },
    finish: () => {
      if (stopped) return;
      playing = false;
      crowd(c, destination, air);
      stop(3);
    },
    stop: () => stop(),
  };
}

/** A crowd rising to its feet: layered bands of noise with a restless swell. */
function crowd(c: AudioContext, destination: AudioNode, air: AudioBuffer) {
  const t = c.currentTime;
  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(0.16, t + 1.4);
  env.gain.setValueAtTime(0.16, t + 3.2);
  env.gain.exponentialRampToValueAtTime(0.0001, t + 7);
  const flutter = c.createGain();
  flutter.gain.value = 0.75;
  const lfo = c.createOscillator();
  lfo.frequency.value = 6.5;
  const depth = c.createGain();
  depth.gain.value = 0.25;
  lfo.connect(depth).connect(flutter.gain);
  flutter.connect(env).connect(destination);
  for (const [freq, q, level] of [[700, 0.8, 1], [1600, 1, 0.7], [3200, 1.4, 0.35]] as const) {
    const src = c.createBufferSource();
    src.buffer = air;
    src.loop = true;
    src.playbackRate.value = 0.9 + Math.random() * 0.2;
    const band = c.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = freq;
    band.Q.value = q;
    const g = c.createGain();
    g.gain.value = level;
    src.connect(band).connect(g).connect(flutter);
    src.start(t);
    src.stop(t + 7.1);
  }
  lfo.start(t);
  lfo.stop(t + 7.1);
}
