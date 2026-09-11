/* eslint-disable no-param-reassign */
import {
  abs,
  bool,
  float,
  floor,
  fract,
  instancedBufferAttribute,
  min,
  mix,
  normalGeometry,
  positionGeometry,
  positionLocal,
  sin,
  smoothstep,
  step,
  time,
  uniform,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

const TWO_PI = 6.28318;
const UNBORN = 0.002;
const CHEVRON_RINGS = 10;
const TOWER_FADE = 0.75;

// The reference is a print, not a render: 80% of its pixels are paper white,
// about a tenth are a handful of flat mid-greys, a tenth is near-black, and
// under 1% carries colour. So every material here is unlit and authored —
// tone comes from which face you are looking at and where you are on it,
// never from a light.
export function createCityUniforms() {
  return {
    build: uniform(1),
    chevronColor: uniform(new THREE.Color('#0af0ff')),
    chevronSpacing: uniform(10),
    chevronWidth: uniform(1.2),
    darkCardColor: uniform(new THREE.Color('#0b0b0b')),
    darkEdgeColor: uniform(new THREE.Color('#1c1c1c')),
    edgeLightColor: uniform(new THREE.Color('#cfcfcf')),
    edgeDarkColor: uniform(new THREE.Color('#adadad')),
    falloffWidth: uniform(10),
    glowIntensity: uniform(1.8),
    neonIntensity: uniform(1.15),
    paperColor: uniform(new THREE.Color('#fcfcfc')),
    pulseDepth: uniform(0.35),
    pulseRate: uniform(1.1),
    revealBand: uniform(0.3),
    stairAlphaStep: uniform(0.15),
    stairHighColor: uniform(new THREE.Color('#b4b4b4')),
    stairLowColor: uniform(new THREE.Color('#0d0d0d')),
    towerStriation: uniform(24),
  };
}

// Instancing assigns positionLocal before `positionNode` runs, so this reads
// the instance-placed position and a y scale about the paper plane reveals
// every layer at once. The mask matters: a zero scale flattens a card onto
// the paper rather than hiding it.
function applyReveal(material, reveal, uniforms) {
  const grow = smoothstep(
    reveal,
    reveal.add(uniforms.revealBand),
    uniforms.build
  );

  material.positionNode = positionLocal.mul(vec3(1, grow, 1));
  material.maskNode = bool(grow.greaterThan(UNBORN));

  return grow;
}

function unlit() {
  return new THREE.MeshBasicNodeMaterial({ color: 0xffffff });
}

function isTop() {
  return abs(normalGeometry.y).greaterThan(0.5);
}

// Two authored greys rather than one, because the reference's stacked outlines
// leave a card's two visible sides at different tones. Still flat — a choice
// of tone per face, not a gradient across it.
function sideTone(uniforms) {
  return mix(
    uniforms.edgeDarkColor,
    uniforms.edgeLightColor,
    step(0.5, abs(normalGeometry.x))
  );
}

// Distance from the card's topmost corner, in reference pixels. The reference
// offsets every stacked fill by (10, 10) in cell space, which lands straight
// down the screen, so its shadow falloff and its glow rings are both contours
// of this one value.
function cornerDistance(size) {
  const u = positionGeometry.x.add(0.5).mul(size.x);
  const v = positionGeometry.z.add(0.5).mul(size.y);

  return min(u, v);
}

function pulse(seed, uniforms) {
  const wave = sin(time.mul(uniforms.pulseRate).add(seed.mul(TWO_PI)))
    .mul(0.5)
    .add(0.5);

  return mix(
    float(1).sub(uniforms.pulseDepth),
    float(1).add(uniforms.pulseDepth),
    wave
  );
}

export function createPlazaMaterial({ buffers, uniforms }) {
  const material = unlit();

  applyReveal(material, instancedBufferAttribute(buffers.reveal), uniforms);
  material.colorNode = mix(sideTone(uniforms), uniforms.paperColor, isTop());

  return material;
}

// The reference builds a tower by stroking the same quad hundreds of times up
// the screen with `alpha = pow((i / tot) * 0.75, 2)`, so its sides darken with
// height and carry the banding of the individual strokes.
export function createTowerMaterial({ buffers, uniforms }) {
  const material = unlit();

  applyReveal(material, instancedBufferAttribute(buffers.reveal), uniforms);

  const size = instancedBufferAttribute(buffers.size);
  const height = positionGeometry.y;
  const ramp = height.mul(TOWER_FADE).pow(2);
  const bands = fract(height.mul(size.z).mul(uniforms.towerStriation).div(100));
  const striation = mix(float(1), float(0.88), step(0.5, bands));
  const side = mix(uniforms.paperColor, vec3(0), ramp).mul(striation);

  material.colorNode = mix(side, uniforms.paperColor, isTop());

  return material;
}

// Every third landuse cell. The reference clips the stack inside the cell, so
// what survives is a near-black fill with the paper showing through a narrow
// band along the two edges nearest the top of the screen.
export function createDarkCardMaterial({ buffers, uniforms }) {
  const material = unlit();

  applyReveal(material, instancedBufferAttribute(buffers.reveal), uniforms);

  const size = instancedBufferAttribute(buffers.size);
  const edge = smoothstep(
    float(0),
    uniforms.falloffWidth,
    cornerDistance(size)
  );
  const top = mix(uniforms.edgeLightColor, uniforms.darkCardColor, edge);

  material.colorNode = mix(uniforms.darkEdgeColor, top, isTop());

  return material;
}

// A dark card in the flagged district, plus the reference's ten nested rings:
// the cell outline stroked in blue and offset (10, 10) each pass, which under
// the clip reads as chevrons nesting toward the bottom of the screen.
export function createGlowCardMaterial({ buffers, uniforms }) {
  const material = unlit();

  applyReveal(material, instancedBufferAttribute(buffers.reveal), uniforms);

  const size = instancedBufferAttribute(buffers.size);
  const seed = instancedBufferAttribute(buffers.seed);
  const distance = cornerDistance(size);
  const edge = smoothstep(float(0), uniforms.falloffWidth, distance);
  const base = mix(uniforms.edgeLightColor, uniforms.darkCardColor, edge);

  const steps = distance.div(uniforms.chevronSpacing);
  const ring = fract(steps);
  const nearest = min(ring, float(1).sub(ring)).mul(uniforms.chevronSpacing);
  const line = smoothstep(uniforms.chevronWidth, float(0), nearest);
  // The reference strokes each successive ring at `0.8 - i / 10`, so the
  // nesting fades away rather than filling the cell with blue.
  const fade = float(0.8).sub(floor(steps).div(CHEVRON_RINGS)).clamp(0, 1);
  const glow = uniforms.chevronColor
    .mul(uniforms.glowIntensity)
    .mul(pulse(seed, uniforms));
  const top = mix(base, glow, line.mul(fade));

  material.colorNode = mix(uniforms.darkEdgeColor, top, isTop());

  return material;
}

// The reference fills each tread with black at `a += 0.15` per step, so a
// short staircase stays mostly grey and a long one goes solid black a third
// of the way down. Step count is per variant, hence a material per variant.
export function createStairMaterial({ buffers, steps, uniforms }) {
  const material = unlit();

  applyReveal(material, instancedBufferAttribute(buffers.reveal), uniforms);

  const index = float(1)
    .sub(positionGeometry.y)
    .mul(steps + 1);
  const alpha = uniforms.stairAlphaStep.mul(index).clamp(0, 1);
  const tone = mix(uniforms.stairHighColor, uniforms.stairLowColor, alpha);

  material.colorNode = mix(tone.mul(0.82), tone, isTop());

  return material;
}

export function createNeonMaterial({ buffers, uniforms }) {
  const material = unlit();

  applyReveal(material, instancedBufferAttribute(buffers.reveal), uniforms);

  const tint = instancedBufferAttribute(buffers.tint);
  const seed = instancedBufferAttribute(buffers.seed);

  material.colorNode = tint
    .mul(uniforms.neonIntensity)
    .mul(pulse(seed, uniforms));

  return material;
}
