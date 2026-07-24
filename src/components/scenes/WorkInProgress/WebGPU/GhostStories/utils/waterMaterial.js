/* eslint-disable camelcase */
import {
  attribute,
  cameraPosition,
  clamp,
  float,
  floor,
  int,
  min,
  mix,
  positionLocal,
  positionWorld,
  select,
  smoothstep,
  time,
  transformNormalToView,
  uint,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { BOUNDS, CELL, WIDTH } from './waterSim';

// Material for one water chunk (a flat basin-only grid from waterChunk.js).
// The vertex stage samples the shared ripple field by world position
// (bilinear height + per-cell gradient normals), layers analytic ambient
// wavelets on top, and scales ALL displacement by the baked `depth`
// attribute so the surface stays pinned at the shoreline — no waves
// climbing onto paths or banks. Fragment: fresnel toward a night-sky tint
// and depth-faded opacity for soft shores.
export default function createWaterMaterial({
  chunkOffsetX,
  chunkOffsetZ,
  sim,
}) {
  const { uniforms } = sim;

  const material = new THREE.MeshStandardNodeMaterial({
    metalness: 0.85,
    roughness: 0.12,
    side: THREE.DoubleSide,
    transparent: true,
  });

  const depth = attribute('depth', 'float');
  // 0 at the shoreline -> 1 a little way out; pins displacement to shore.
  const depthMask = smoothstep(0.02, 0.35, depth);

  const worldX = positionLocal.x.add(float(chunkOffsetX));
  const worldZ = positionLocal.z.add(float(chunkOffsetZ));

  // ── Ripple field sample (bilinear, world-anchored) ──
  const fi = worldX
    .sub(uniforms.anchor.x)
    .add(BOUNDS / 2)
    .div(CELL);
  const fj = worldZ
    .sub(uniforms.anchor.y)
    .add(BOUNDS / 2)
    .div(CELL);

  const i0 = clamp(int(floor(fi)), 0, WIDTH - 2);
  const j0 = clamp(int(floor(fj)), 0, WIDTH - 2);
  const fx = clamp(fi.sub(floor(fi)), 0, 1);
  const fz = clamp(fj.sub(floor(fj)), 0, 1);

  const sampleHeight = (ix, iz) => {
    const index = uint(iz.mul(WIDTH).add(ix));
    return select(
      uniforms.readFromA,
      sim.stateStorageA.element(index),
      sim.stateStorageB.element(index)
    ).x;
  };

  const h00 = sampleHeight(i0, j0);
  const h10 = sampleHeight(i0.add(1), j0);
  const h01 = sampleHeight(i0, j0.add(1));
  const h11 = sampleHeight(i0.add(1), j0.add(1));
  const rippleHeight = mix(mix(h00, h10, fx), mix(h01, h11, fx), fz);

  // Per-cell gradient — free from the four fetches above.
  const rippleDx = h10.sub(h00).add(h11.sub(h01)).mul(0.5).div(CELL);
  const rippleDz = h01.sub(h00).add(h11.sub(h10)).mul(0.5).div(CELL);

  // Fade ripples out near the patch border (the field snaps there).
  const borderDist = min(
    min(fi, float(WIDTH).sub(fi)),
    min(fj, float(WIDTH).sub(fj))
  );
  const patchFade = smoothstep(2.0, 8.0, borderDist);

  // ── Ambient wavelets (analytic, everywhere) ──
  const wavePhaseA = worldX.mul(0.9).add(worldZ.mul(0.4)).add(time.mul(1.1));
  const wavePhaseB = worldX.mul(-0.35).add(worldZ.mul(0.8)).add(time.mul(0.7));
  const ambient = wavePhaseA
    .sin()
    .add(wavePhaseB.sin())
    .mul(uniforms.ambientAmp);
  const ambientDx = wavePhaseA
    .cos()
    .mul(0.9)
    .add(wavePhaseB.cos().mul(-0.35))
    .mul(uniforms.ambientAmp);
  const ambientDz = wavePhaseA
    .cos()
    .mul(0.4)
    .add(wavePhaseB.cos().mul(0.8))
    .mul(uniforms.ambientAmp);

  const displacement = rippleHeight.mul(patchFade).add(ambient).mul(depthMask);

  material.positionNode = positionLocal.add(vec3(0, displacement, 0));

  const nx = rippleDx.mul(patchFade).add(ambientDx).mul(depthMask).negate();
  const nz = rippleDz.mul(patchFade).add(ambientDz).mul(depthMask).negate();
  material.normalNode = transformNormalToView(vec3(nx, 1, nz).normalize());

  // Fresnel toward the night-sky tint: reads as a reflective sheet at
  // grazing angles even without an environment map.
  const viewDir = cameraPosition.sub(positionWorld).normalize();
  const fresnel = clamp(float(1).sub(viewDir.y), 0, 1).pow(3);
  material.colorNode = mix(
    uniforms.deepColor,
    uniforms.skyColor,
    fresnel.mul(0.85)
  );

  // Soft shoreline: shallow water goes translucent.
  material.opacityNode = uniforms.opacity.mul(
    mix(float(0.45), float(1), smoothstep(0, 0.5, depth))
  );

  return material;
}
