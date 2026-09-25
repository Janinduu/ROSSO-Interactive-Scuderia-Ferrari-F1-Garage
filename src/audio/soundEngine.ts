import type { EngineProfile } from "./engineProfile";

// All ROSSO audio is synthesised with the Web Audio API: no audio files are
// downloaded and no recordings need licensing. Browsers only allow sound after
// the visitor's first click or key press, so the context starts then.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ambience: { gain: GainNode; stop: () => void } | null = null;
let enabled = true;
let wantAmbience = false;

const MASTER_LEVEL = 1;
const AMBIENCE_LEVEL = 0.13;

function context() {
  if (ctx) return ctx;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  master = ctx.createGain();
  master.gain.value = enabled ? MASTER_LEVEL : 0;
  // A gentle limiter keeps engine peaks civilised.
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -14;
  limiter.ratio.value = 6;
  master.connect(limiter).connect(ctx.destination);
  return ctx;
}

/** Call from any user gesture; safe to call repeatedly. */
export function unlockAudio() {
  const c = context();
  if (c && c.state === "suspended") void c.resume();
  if (wantAmbience) startAmbience();
}

export function setSoundEnabled(on: boolean) {
  enabled = on;
  if (!ctx || !master) return;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setTargetAtTime(on ? MASTER_LEVEL : 0, ctx.currentTime, 0.08);
}

function noiseBuffer(c: AudioContext, seconds: number, brown = false) {
  const buffer = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    if (brown) {
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    } else data[i] = white;
  }
  return buffer;
}

/** Quiet room tone: a low air-handling rumble and a faint mains hum. */
export function startAmbience() {
  wantAmbience = true;
  const c = context();
  if (!c || !master || ambience || c.state !== "running") return;
  const gain = c.createGain();
  gain.gain.value = 0;
  gain.gain.setTargetAtTime(AMBIENCE_LEVEL, c.currentTime, 1.5);
  const air = c.createBufferSource();
  air.buffer = noiseBuffer(c, 6, true);
  air.loop = true;
  const lowpass = c.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 260;
  const hum = c.createOscillator();
  hum.frequency.value = 50;
  const humGain = c.createGain();
  humGain.gain.value = 0.05;
  air.connect(lowpass).connect(gain);
  hum.connect(humGain).connect(gain);
  gain.connect(master);
  air.start();
  hum.start();
  ambience = {
    gain,
    stop: () => {
      air.stop();
      hum.stop();
      gain.disconnect();
    },
  };
}

export function stopAmbience() {
  wantAmbience = false;
  if (!ctx || !ambience) return;
  const a = ambience;
  ambience = null;
  a.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
  setTimeout(a.stop, 1600);
}

/** Lower the room tone while an engine runs. */
function duckWhile(on: boolean) {
  if (!ctx || !ambience) return;
  const g = ambience.gain.gain;
  g.cancelScheduledValues(ctx.currentTime);
  g.setTargetAtTime(on ? 0.03 : AMBIENCE_LEVEL, ctx.currentTime, on ? 0.1 : 0.8);
}

/** Soft low swell for moving between bays. */
export function playTransition() {
  const c = context();
  if (!c || !master || c.state !== "running") return;
  const t = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 1.2);
  const band = c.createBiquadFilter();
  band.type = "bandpass";
  band.Q.value = 0.8;
  band.frequency.setValueAtTime(180, t);
  band.frequency.exponentialRampToValueAtTime(700, t + 0.5);
  band.frequency.exponentialRampToValueAtTime(160, t + 1.1);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.16, t + 0.35);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.15);
  src.connect(band).connect(gain).connect(master);
  src.start(t);
  src.stop(t + 1.2);
}

/** A warm, bell-like chord for arriving in the Hall of Champions. */
export function playChime() {
  const c = context();
  if (!c || !master || c.state !== "running") return;
  const t = c.currentTime;
  [261.63, 329.63, 392, 523.25].forEach((f, i) => {
    const start = t + i * 0.12;
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.value = f;
    const partial = c.createOscillator();
    partial.type = "sine";
    partial.frequency.value = f * 2.76; // a bell's inharmonic overtone
    const pg = c.createGain();
    pg.gain.value = 0.25;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.07, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 3.2);
    osc.connect(gain);
    partial.connect(pg).connect(gain);
    gain.connect(master!);
    osc.start(start);
    partial.start(start);
    osc.stop(start + 3.3);
    partial.stop(start + 3.3);
  });
}

/** A short mechanical servo for the exploded view. */
export function playServo(opening: boolean) {
  const c = context();
  if (!c || !master || c.state !== "running") return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(opening ? 90 : 160, t);
  osc.frequency.linearRampToValueAtTime(opening ? 160 : 90, t + 0.9);
  const band = c.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 900;
  band.Q.value = 2;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.1, t + 0.08);
  gain.gain.setValueAtTime(0.1, t + 0.8);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
  osc.connect(band).connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + 1.15);
}

let running: { stop: () => void } | null = null;

type Curve = [number, number][];

/** Start-up: idle, a throttle blip, then a full rev to the limiter and back. */
function startCurve(p: EngineProfile): Curve {
  return [
    [0, p.idleRpm * 0.8],
    [0.6, p.idleRpm],
    [1.2, p.idleRpm * 2.2],
    [1.7, p.idleRpm * 1.05],
    [2.4, p.idleRpm],
    [4.4, p.peakRpm],
    [4.7, p.peakRpm * 0.98],
    [5.5, p.idleRpm * 1.3],
    [6.2, p.idleRpm],
  ];
}

/** One cycle of a running engine: idle, a blip, a rev of varying depth. */
function runningCurve(p: EngineProfile): Curve {
  const r = () => 0.85 + Math.random() * 0.3;
  const depth = 0.55 + Math.random() * 0.45;
  const rev = p.idleRpm + (p.peakRpm - p.idleRpm) * depth;
  return [
    [1.6 * r(), p.idleRpm * (0.98 + Math.random() * 0.06)],
    [2.1 * r(), p.idleRpm * (1.7 + Math.random() * 0.7)],
    [2.6 * r(), p.idleRpm * 1.04],
    [3.8 * r(), p.idleRpm],
    [5.6 * r(), rev],
    [5.9 * r(), rev * 0.98],
    [6.7 * r(), p.idleRpm * 1.3],
    [7.6 * r(), p.idleRpm],
  ].sort((a, b) => a[0] - b[0]) as Curve;
}

/**
 * A synthesised engine that runs until stopped: a start-up sequence, then a
 * living idle with blips and revs. The firing frequency follows the cylinder
 * count (rpm / 60 × cylinders / 2). Returns false if audio is unavailable.
 */
export function playEngine(
  p: EngineProfile,
  onEnd?: () => void,
  opts: { once?: boolean } = {},
): boolean {
  const c = context();
  if (!c || !master || c.state !== "running") return false;
  running?.stop();
  const t = c.currentTime;
  const firing = (rpm: number) => (rpm / 60) * (p.cylinders / 2);

  const out = c.createGain();
  out.gain.setValueAtTime(0, t);
  out.gain.linearRampToValueAtTime(0.34, t + 0.15);

  // Exhaust tone: fewer, harder pulses sound rougher; high cylinder counts smoother.
  const shaper = c.createWaveShaper();
  const k = p.cylinders <= 4 ? 8 : p.cylinders <= 8 ? 5 : 3;
  const shape = new Float32Array(1024);
  for (let i = 0; i < shape.length; i++) {
    const x = (i / shape.length) * 2 - 1;
    shape[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  shaper.curve = shape;
  const tone = c.createBiquadFilter();
  tone.type = "lowpass";
  tone.Q.value = 1.4;
  const body = c.createBiquadFilter();
  body.type = "peaking";
  body.frequency.value = p.layout === "flat" ? 420 : p.layout === "inline" ? 260 : 600;
  body.gain.value = 5;

  // Every parameter that follows engine speed, with its rpm → value mapping.
  const tracks: { param: AudioParam; map: (rpm: number) => number }[] = [];
  const sources: AudioScheduledSourceNode[] = [];
  const voice = (ratio: number, level: number, type: OscillatorType) => {
    const o = c.createOscillator();
    o.type = type;
    const g = c.createGain();
    g.gain.value = level;
    o.connect(g).connect(shaper);
    tracks.push({ param: o.frequency, map: (rpm) => firing(rpm) * ratio });
    sources.push(o);
  };
  voice(1, 0.55, "sawtooth");
  voice(0.5, 0.35, "square"); // crankshaft order: the rumble under the note
  voice(2, 0.18, "sawtooth");
  if (p.layout === "flat") voice(1.5, 0.12, "triangle"); // flat-12 howl
  tracks.push({ param: tone.frequency, map: (rpm) => Math.min(9000, firing(rpm) * 6) });

  // Combustion grit: noise gated at the firing rate.
  const grit = c.createBufferSource();
  grit.buffer = noiseBuffer(c, 2);
  grit.loop = true;
  const gritGain = c.createGain();
  gritGain.gain.value = 0.08;
  const gate = c.createOscillator();
  gate.type = "square";
  const gateDepth = c.createGain();
  gateDepth.gain.value = 0.06;
  gate.connect(gateDepth).connect(gritGain.gain);
  grit.connect(gritGain).connect(tone);
  tracks.push({ param: gate.frequency, map: firing });
  sources.push(grit, gate);

  shaper.connect(tone).connect(body).connect(out).connect(master);

  // Forced induction and hybrid systems add their own voices.
  if (p.turbo || p.supercharged) {
    const whine = c.createOscillator();
    whine.type = "sine";
    const wg = c.createGain();
    wg.gain.value = 0.025;
    whine.connect(wg).connect(out);
    tracks.push({ param: whine.frequency, map: (rpm) => rpm * (p.supercharged ? 0.5 : 0.9) });
    sources.push(whine);
  }
  if (p.hybrid) {
    const mguk = c.createOscillator();
    mguk.type = "triangle";
    const mg = c.createGain();
    mg.gain.value = 0.02;
    mguk.connect(mg).connect(out);
    tracks.push({ param: mguk.frequency, map: (rpm) => rpm / 6 });
    sources.push(mguk);
  }

  // Automation is written a cycle ahead, so the engine keeps running with no gaps.
  let scheduledUntil = t;
  const schedule = (curve: Curve) => {
    const start = scheduledUntil;
    for (const [dt, rpm] of curve)
      for (const { param, map } of tracks) param.linearRampToValueAtTime(map(rpm), start + dt);
    scheduledUntil = start + curve[curve.length - 1][0];
  };
  for (const { param, map } of tracks) param.setValueAtTime(map(p.idleRpm * 0.8), t);
  let timer = 0;
  let stopSelf = () => {};
  if (opts.once) {
    // A single rev: pick-up, a pull towards the limiter and back.
    schedule([
      [0.25, p.idleRpm * 1.4],
      [1.3, p.idleRpm + (p.peakRpm - p.idleRpm) * 0.85],
      [1.55, p.idleRpm + (p.peakRpm - p.idleRpm) * 0.82],
      [2.3, p.idleRpm * 1.1],
    ]);
    // Stops this engine only, never one started after it.
    timer = window.setTimeout(() => stopSelf(), 2300);
  } else {
    schedule(startCurve(p));
    schedule(runningCurve(p));
    timer = window.setInterval(() => {
      if (scheduledUntil - c.currentTime < 3) schedule(runningCurve(p));
    }, 500);
  }

  for (const s of sources) s.start(t);
  duckWhile(true);
  let stopped = false;
  const handle = {
    stop: () => {
      if (stopped) return;
      stopped = true;
      window.clearInterval(timer);
      window.clearTimeout(timer);
      const now = c.currentTime;
      // Settle to idle and fade, like switching the engine off.
      for (const { param, map } of tracks) {
        param.cancelScheduledValues(now);
        param.setValueAtTime(param.value, now);
        param.linearRampToValueAtTime(map(p.idleRpm * 0.7), now + 0.5);
      }
      out.gain.cancelScheduledValues(now);
      out.gain.setValueAtTime(out.gain.value, now);
      out.gain.linearRampToValueAtTime(0, now + 0.6);
      for (const s of sources) s.stop(now + 0.7);
      window.setTimeout(() => out.disconnect(), 900);
      duckWhile(false);
      if (running === handle) running = null;
      onEnd?.();
    },
  };
  running = handle;
  stopSelf = handle.stop;
  return true;
}

export function stopEngine() {
  running?.stop();
}

export const engineRunning = () => running !== null;
