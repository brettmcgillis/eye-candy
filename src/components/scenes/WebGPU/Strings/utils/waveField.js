import {
  PI,
  atan,
  cos,
  float,
  length,
  max,
  mix,
  sin,
  smoothstep,
  vec2,
  vec3,
} from 'three/tsl';

import { simplex3d } from './simplex3d';

const TAU = Math.PI * 2;
const LOOP_RADIUS = 0.2;

// The wave runs ALONG the threads, so a crest line lies ACROSS them: the
// reference is a comb of thread with ridges travelling down its length, and
// the supplied sine-thread shader is the same motion (sin(k*x - t + offset)).
// Neighbouring threads carry different phase offsets, which is what bends a
// crest line into an organic wandering ridge instead of a straight bar.
function wavePhase(rest, strandA, u) {
  return rest.x
    .mul(u.waveFrequency)
    .sub(u.phase.mul(u.waveSpeed))
    .add(strandA.w.mul(u.phaseSpread));
}

function crestShape(w, u) {
  return smoothstep(u.crestThreshold, 1, w);
}

// Clumping, the way a groom does it: each thread belongs to a clump centre and
// is drawn toward it, hardest where the wave crests. Troughs stay spread and
// silky, crests gather into locks with gaps between them — that separation is
// most of what makes a thread field read as thread rather than a sheet.
function clumpTo(rest, crest, u) {
  const spacing = max(u.clumpSpacing, 1e-4);
  const cell = rest.z.div(spacing);
  const jitter = simplex3d(vec3(cell.floor().mul(0.7), 11.2, 4.5)).mul(0.35);
  const centre = cell.round().add(jitter).mul(spacing);

  return centre.sub(rest.z).mul(u.clump).mul(crest);
}

function travellingWave(rest, strandA, strandB, u) {
  const meander = simplex3d(
    vec3(rest.z.mul(u.waveMeanderScale), rest.x.mul(0.15), 3.1)
  ).mul(u.waveMeander);
  const w = sin(wavePhase(rest, strandA, u).add(meander));
  const crest = crestShape(w, u);
  // Neighbouring threads must ride the same ridge: per-thread variation here
  // has to stay well under thread spacing or the mat scrambles into noise
  // instead of reading as a surface.
  const lift = crest
    .pow(1.3)
    .mul(u.waveAmplitude)
    .mul(mix(0.94, 1.06, strandB.y));

  return { crest, offset: vec3(0, lift, clumpTo(rest, crest, u)) };
}

// The sine-thread shader's own damping: its ripple is strongest in the middle
// of the lens and dies at the rim, so the field ripples in a pool rather than
// everywhere at once.
function sineThreads(rest, strandA, strandB, u) {
  const lens = smoothstep(
    0.25,
    0.75,
    length(rest.xz.sub(u.focus.xz)).div(max(u.waveLens, 1e-3)).oneMinus()
  );
  const w = sin(wavePhase(rest, strandA, u));
  const crest = crestShape(w, u).mul(lens);
  const lift = w.mul(u.waveAmplitude).mul(lens);

  return { crest, offset: vec3(0, lift, clumpTo(rest, crest, u)) };
}

// The noise-ring shader's motion: each ring of threads walks a small circle
// through noise space (the shader's looping trick), damped by distance the way
// the original damps by d*d, so ring-shaped ridges travel out through the
// field instead of straight ones.
function noiseRings(rest, strandA, strandB, u) {
  const p = rest.xz.sub(u.focus.xz);
  const a = atan(p.y, p.x).add(PI);
  const ring = length(p).div(max(u.ringSpacing, 1e-3)).floor().add(1);
  const loopAngle = u.loopPhase.mul(TAU).sub(a.mul(u.ringLobes));
  const loop = vec2(sin(loopAngle), cos(loopAngle)).mul(LOOP_RADIUS);
  const inner = simplex3d(vec3(sin(a), cos(a), ring));

  const ny = simplex3d(
    vec3(ring.mul(2).add(loop.x), ring.mul(2).add(loop.y), inner)
  );
  const damp = length(p.sub(vec2(-0.4))).mul(u.ringDamp);
  const lift = ny.mul(damp).mul(damp).mul(u.waveAmplitude);
  const crest = crestShape(ny.abs().mul(2), u);

  return { crest, offset: vec3(0, lift, clumpTo(rest, crest, u)) };
}

const MODES = {
  rings: noiseRings,
  sine: sineThreads,
  wave: travellingWave,
};

// The mode is a JS constant: switching it rebuilds the kernel rather than
// branching per point on the GPU.
export default function waveField(mode, rest, strandA, strandB, u) {
  return (MODES[mode] ?? travellingWave)(rest, strandA, strandB, u);
}

// Height of the field's own surface at a point, for shadowing threads that lie
// under a lock. Only the lift matters here, so this is the cheap half of the
// wave rather than the whole displacement.
export function surfaceLift(mode, at, strandA, u) {
  if (mode === 'rings') {
    const p = at.xz.sub(u.focus.xz);
    const a = atan(p.y, p.x).add(PI);
    const ring = length(p).div(max(u.ringSpacing, 1e-3)).floor().add(1);
    const loopAngle = u.loopPhase.mul(TAU).sub(a.mul(u.ringLobes));
    const inner = simplex3d(vec3(sin(a), cos(a), ring));
    const ny = simplex3d(
      vec3(
        ring.mul(2).add(sin(loopAngle).mul(LOOP_RADIUS)),
        ring.mul(2).add(cos(loopAngle).mul(LOOP_RADIUS)),
        inner
      )
    );
    const damp = length(p.sub(vec2(-0.4))).mul(u.ringDamp);

    return ny.mul(damp).mul(damp).mul(u.waveAmplitude);
  }

  const w = sin(wavePhase(at, strandA, u));

  return mode === 'sine'
    ? w.mul(u.waveAmplitude)
    : crestShape(w, u).pow(1.3).mul(u.waveAmplitude);
}

export function flatField() {
  return { crest: float(0), offset: vec3(0) };
}
