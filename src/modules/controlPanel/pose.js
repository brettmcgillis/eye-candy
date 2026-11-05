import { moveAll, placeAll } from './parts';
import { proceduralAudio, sequencerStep, signalValue } from './signals';

// Stills are taken this far in, past the first beat, so meters and
// counters read mid-song rather than all lit at t = 0.
export const STILL_TIME = 3.3;

const SINK = 0.9;
const RISE = 0.3;
// Modules are all up by this share of a build-in; cables plug in after.
const MODULES_DONE = 0.7;
const CABLE_STAGGER = 0.45;

const smooth = (x) => x * x * (3 - 2 * x);

// How far module `order` (0..1) has risen `t` seconds into a build of
// `seconds`: each module rises over RISE of the build, staggered by order.
export function riseAt(order, t, seconds) {
  if (seconds <= 0) return 1;
  const start = order * (MODULES_DONE - RISE) * seconds;
  return smooth(Math.min(Math.max((t - start) / (RISE * seconds), 0), 1));
}

const clamp01 = (x) => Math.min(Math.max(x, 0), 1);

// How far below its seat a module of build `order` sits `build` seconds
// into a build-in.
export const buildSink = (order, build, seconds) =>
  (1 - riseAt(order, build, seconds)) * SINK;

// How much of cable `id` of `count` has been drawn out of its first socket
// `t` seconds into a build-in: none until the modules are up, then each
// cable in turn along its length. null outside a build.
export function cableReveal(id, count, t, seconds) {
  if (t == null) return null;
  if (seconds <= 0) return 1;
  const phase = clamp01(
    (t - MODULES_DONE * seconds) / ((1 - MODULES_DONE) * seconds)
  );
  const start = count > 1 ? (CABLE_STAGGER * id) / (count - 1) : 0;
  return smooth(clamp01((phase - start) / (1 - CABLE_STAGGER)));
}

export function motionOf(config) {
  return {
    busyShare: config.busyShare,
    gesturePeriod: config.gesturePeriod,
    motionAmount: config.motionAmount,
    motionSpeed: config.motionSpeed,
  };
}

const sameValues = (a, b) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

// Most controls sit still between gestures, so a control whose pose reads
// only its values reuses its last parts while they hold.
function posed(control, values, state) {
  const { memo } = control;
  if (!control.live && memo && sameValues(memo.values, values)) {
    return memo.parts;
  }
  const parts = placeAll(control.pose(values, state), control.transform);
  // eslint-disable-next-line no-param-reassign
  control.memo = { parts, values };
  return parts;
}

// What every pose in one frame shares: the audio (`audioAt` reads the
// track at any time, the procedural one away from now), the motion knobs
// and `sample`, any control's signal at any time (a hand's overrides only
// hold now), so a control can read the rest of the panel at moments it is
// not posed.
export function poseFrame(controls, config, { audio = null, t = 0 } = {}) {
  const bands = audio ?? proceduralAudio(t, config.bpm);
  const motion = motionOf(config);
  const sample = (control, signal, at) => {
    const s = controls[control].signals[signal];
    const audioAt =
      s.kind === 'audio' && at !== t ? proceduralAudio(at, config.bpm) : bands;
    return signalValue(s, at, audioAt, motion);
  };
  return {
    bands,
    motion,
    state: {
      audio: bands,
      audioAt: (at) => (at === t ? bands : proceduralAudio(at, config.bpm)),
      sample,
      step: sequencerStep(t, config.bpm),
      t,
    },
    t,
  };
}

// One module's parts into `out`: its posed controls, and with `statics` its
// plate and fixed parts too, all carried by `move` (a rigid move, see
// moveAll) when it is travelling.
export function poseModule(
  module,
  frame,
  out,
  { move = null, overrides = null, statics = false } = {}
) {
  const carry = (items) => (move ? moveAll(items, move) : items);
  if (statics) {
    out.push(...carry(module.statics));
    module.controls.forEach((control) => out.push(...carry(control.statics)));
  }
  module.controls.forEach((control) => {
    if (!control.pose) return;
    const values = control.signals.map(
      (s, i) =>
        overrides?.get(`${control.key}:${i}`) ??
        signalValue(s, frame.t, frame.bands, frame.motion)
    );
    out.push(...carry(posed(control, values, frame.state)));
  });
  return out;
}

// The moving parts at time `t`, in panel space. `audio` (BANDS levels)
// defaults to the procedural track. With `build` (seconds into a build-in)
// every module's static parts come too, sunk by how far it has to rise.
// `overrides` (signal key → value) are the controls a hand has set.
export function posePanel(
  panel,
  config,
  { audio = null, build = null, overrides = null, t = 0 } = {}
) {
  const frame = poseFrame(panel.controls, config, { audio, t });
  const out = [];
  panel.modules.forEach((module) => {
    const sink =
      build == null ? 0 : buildSink(module.order, build, config.buildSeconds);
    poseModule(module, frame, out, {
      move: sink ? { offset: [0, 0, -sink] } : null,
      overrides,
      statics: build != null,
    });
  });
  return out;
}

// Every part of the panel at `t`: what a still and its plot draw.
export function panelParts(panel, config, options = {}) {
  if (options.build != null)
    return [...panel.chassis, ...posePanel(panel, config, options)];
  return [...panel.statics, ...posePanel(panel, config, options)];
}

// One signal's value now (`key` is "control:signal"), as a pose would read
// it: a hand's override first, else its own motion.
export function readSignal(
  panel,
  config,
  key,
  { audio = null, overrides = null, t = 0 } = {}
) {
  if (overrides?.has(key)) return overrides.get(key);
  const [control, signal] = key.split(':').map(Number);
  const bands = audio ?? proceduralAudio(t, config.bpm);
  return signalValue(
    panel.controls[control].signals[signal],
    t,
    bands,
    motionOf(config)
  );
}
