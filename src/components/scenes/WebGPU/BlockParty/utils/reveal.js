/* eslint-disable no-param-reassign */
import {
  bool,
  float,
  floor,
  fract,
  instancedBufferAttribute,
  mix,
  positionLocal,
  sin,
  smoothstep,
  step,
  time,
  vec3,
} from 'three/tsl';

import { select } from './nodes';

const TWO_PI = 6.28318;
const UNBORN = 0.002;
const TOWER_FLOORS = 8;
const EXPO_NORMAL = 1 / (1 - 2 ** -10);

function ease(t, uniforms) {
  const smooth = t.mul(t).mul(float(3).sub(t.mul(2)));
  const expo = float(1)
    .sub(float(2).pow(t.mul(-10)))
    .mul(EXPO_NORMAL);
  const u = t.sub(1);
  const s = uniforms.overshoot;
  const back = float(1).add(s.add(1).mul(u).mul(u).mul(u)).add(s.mul(u).mul(u));

  return select(uniforms.easing, [smooth, t, expo, back]);
}

function progress(start, uniforms) {
  return uniforms.build.sub(start).div(uniforms.revealBand).clamp(0, 1);
}

// Unfold plays a cell's parts one after another: treads cascade down, terrace
// rings deepen in turn. Receding reverses the order.
function sequenced(t, sequence, uniforms) {
  if (!sequence) {
    return t;
  }

  const staged = t.mul(sequence.count).sub(sequence.index.sub(1)).clamp(0, 1);

  return mix(t, staged, uniforms.emergeStyle);
}

export function wave(buffers, rate) {
  const seed = instancedBufferAttribute(buffers.seed);

  return sin(time.mul(rate).add(seed.mul(TWO_PI)));
}

export function pulse(buffers, uniforms) {
  const w = wave(buffers, uniforms.pulseRate).mul(0.5).add(0.5);

  return mix(
    float(1).sub(uniforms.pulseDepth),
    float(1).add(uniforms.pulseDepth),
    w
  );
}

export function flicker(buffers, uniforms) {
  const seed = instancedBufferAttribute(buffers.seed);
  const tick = floor(time.mul(uniforms.neonFlickerRate)).add(seed.mul(97.13));
  const noise = fract(sin(tick.mul(12.9898)).mul(43758.5453));

  return float(1).sub(uniforms.neonFlicker.mul(step(0.55, noise)));
}

function floorByFloor(height, uniforms) {
  const x = height.mul(TOWER_FLOORS);
  const floors = floor(x)
    .add(smoothstep(0.6, 1, fract(x)))
    .div(TOWER_FLOORS);

  return mix(height, floors, uniforms.emergeStyle);
}

// Every cell emerges from ground level at its birth and recedes back to it at
// its death, on one clock. Sunken cells are never masked: they collapse to a
// flush floor so their hole never shows.
export function applyReveal(material, buffers, uniforms, options = {}) {
  const { bob, breathe, pivot, sequence, sink, stack } = options;
  const life = instancedBufferAttribute(buffers.reveal);
  const emerge = ease(
    sequenced(progress(life.x, uniforms), sequence, uniforms),
    uniforms
  );
  const remain = ease(
    sequenced(float(1).sub(progress(life.y, uniforms)), sequence, uniforms),
    uniforms
  );
  const grow = emerge.mul(remain);
  const settled = grow.clamp(0, 1);

  let height = stack ? floorByFloor(grow, uniforms) : grow;
  let footprint = positionLocal.xz;
  let y;

  if (breathe) {
    height = height.mul(
      wave(buffers, uniforms.towerBreatheRate).mul(uniforms.towerBreathe).add(1)
    );
  }

  if (pivot) {
    const unroll = mix(float(1), settled, uniforms.emergeStyle);

    footprint = pivot.add(positionLocal.xz.sub(pivot).mul(unroll));
  }

  y = positionLocal.y.mul(height);

  if (bob) {
    y = y.add(
      wave(buffers, uniforms.cardBobRate).mul(uniforms.cardBob).mul(settled)
    );
  }

  material.positionNode = vec3(footprint.x, y, footprint.y);

  if (!sink) {
    material.maskNode = bool(grow.greaterThan(UNBORN));
  }

  return settled;
}
