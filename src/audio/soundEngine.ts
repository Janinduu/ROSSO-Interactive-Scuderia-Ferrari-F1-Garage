import type { EngineProfile } from "./engineProfile";

// All ROSSO audio is synthesised with the Web Audio API: no audio files are
// downloaded and no recordings need licensing. Browsers only allow sound after
// the visitor's first click or key press, so the context starts then.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ambience: { gain: GainNode; stop: () => void } | null = null;
let enabled = true;
let wantAmbience = false;

const MASTER_LEVEL = 0.9;

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
  gain.gain.setTargetAtTime(0.06, c.currentTime, 1.5);
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

/** Duck the room tone while something else is playing. */
function duck(seconds: number) {
  if (!ctx || !ambience) return;
  const g = ambience.gain.gain;
  g.cancelScheduledValues(ctx.currentTime);
  g.setTargetAtTime(0.015, ctx.currentTime, 0.1);
  g.setTargetAtTime(0.06, ctx.currentTime + seconds, 0.8);
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
  gain.gain.linearRampToValueAtTime(0.08, t + 0.35);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.15);
  src.connect(band).connect(gain).connect(master);
  src.start(t);
  src.stop(t + 1.2);
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
  gain.gain.linearRampToValueAtTime(0.05, t + 0.08);
  gain.gain.setValueAtTime(0.05, t + 0.8);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
  osc.connect(band).connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + 1.15);
}

let running: { stop: () => void } | null = null;

/**
 * A synthesised engine note: idle, a blip, a full rev to the limiter and back.
 * The firing frequency follows the cylinder count (rpm / 60 × cylinders / 2).
 * Returns the duration in seconds.
 */
export function playEngine(p: EngineProfile, onEnd?: () => void): number {
  const c = context();
  if (!c || !master || c.state !== "running") return 0;
  running?.stop();
  const t = c.currentTime;
  const DURATION = 6.2;
  duck(DURATION);

  const firing = (rpm: number) => (rpm / 60) * (p.cylinders / 2);
  // rpm curve: idle, blip, idle, full rev, lift off, settle.
  const curve: [number, number][] = [
    [0, p.idleRpm * 0.8],
    [0.6, p.idleRpm],
    [1.2, p.idleRpm * 2.2],
    [1.7, p.idleRpm * 1.05],
    [2.4, p.idleRpm],
    [4.4, p.peakRpm],
    [4.7, p.peakRpm * 0.98],
    [5.5, p.idleRpm * 1.3],
    [DURATION, p.idleRpm],
  ];

  const out = c.createGain();
  out.gain.setValueAtTime(0, t);
  out.gain.linearRampToValueAtTime(0.2, t + 0.15);
  out.gain.setValueAtTime(0.2, t + DURATION - 0.5);
  out.gain.linearRampToValueAtTime(0, t + DURATION);

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

  const oscs: OscillatorNode[] = [];
  const voice = (ratio: number, level: number, type: OscillatorType) => {
    const o = c.createOscillator();
    o.type = type;
    const g = c.createGain();
    g.gain.value = level;
    for (const [dt, rpm] of curve) o.frequency.linearRampToValueAtTime(firing(rpm) * ratio, t + dt);
    o.connect(g).connect(shaper);
    oscs.push(o);
  };
  voice(1, 0.55, "sawtooth");
  voice(0.5, 0.35, "square"); // crankshaft order: the rumble under the note
  voice(2, 0.18, "sawtooth");
  if (p.layout === "flat") voice(1.5, 0.12, "triangle"); // flat-12 howl
  for (const [dt, rpm] of curve)
    tone.frequency.linearRampToValueAtTime(Math.min(9000, firing(rpm) * 6), t + dt);

  // Combustion grit: noise gated at the firing rate.
  const grit = c.createBufferSource();
  grit.buffer = noiseBuffer(c, DURATION + 0.2);
  const gritGain = c.createGain();
  gritGain.gain.value = 0.08;
  const gate = c.createOscillator();
  gate.type = "square";
  for (const [dt, rpm] of curve) gate.frequency.linearRampToValueAtTime(firing(rpm), t + dt);
  const gateDepth = c.createGain();
  gateDepth.gain.value = 0.06;
  gate.connect(gateDepth).connect(gritGain.gain);
  grit.connect(gritGain).connect(tone);

  shaper.connect(tone).connect(body).connect(out).connect(master);

  // Forced induction and hybrid systems add their own voices.
  const extras: AudioScheduledSourceNode[] = [grit, gate];
  if (p.turbo || p.supercharged) {
    const whine = c.createOscillator();
    whine.type = "sine";
    const wg = c.createGain();
    wg.gain.value = 0.025;
    for (const [dt, rpm] of curve) whine.frequency.linearRampToValueAtTime(rpm * (p.supercharged ? 0.5 : 0.9), t + dt);
    whine.connect(wg).connect(out);
    extras.push(whine);
  }
  if (p.hybrid) {
    const mguk = c.createOscillator();
    mguk.type = "triangle";
    const mg = c.createGain();
    mg.gain.value = 0.02;
    for (const [dt, rpm] of curve) mguk.frequency.linearRampToValueAtTime(rpm / 6, t + dt);
    mguk.connect(mg).connect(out);
    extras.push(mguk);
  }

  for (const s of [...oscs, ...extras]) {
    s.start(t);
    s.stop(t + DURATION + 0.1);
  }
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    out.disconnect();
    running = null;
    onEnd?.();
  };
  oscs[0].onended = finish;
  running = {
    stop: () => {
      out.gain.cancelScheduledValues(c.currentTime);
      out.gain.setTargetAtTime(0, c.currentTime, 0.05);
      for (const s of [...oscs, ...extras]) s.stop(c.currentTime + 0.3);
    },
  };
  return DURATION;
}

export function stopEngine() {
  running?.stop();
}
