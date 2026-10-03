/* eslint-disable no-param-reassign */
import {
  Fn,
  attribute,
  clamp,
  float,
  floor,
  instanceIndex,
  int,
  mix,
  normalLocal,
  positionLocal,
  smoothstep,
  uniform,
  varying,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { createCurveSampler, createTubeMaterial } from '@modules/gpuTubes';

import { createPaletteLook, syncPaletteLook } from './palette';

export function createLook() {
  return {
    palette: createPaletteLook(),
    panelColor: uniform(new THREE.Color('#ffffff')),
    panelRoughness: uniform(0.55),
    wallColor: uniform(new THREE.Color('#b9b6b0')),
    cavityShade: uniform(0.5),
    occlusion: uniform(0.5),
    cylinderColor: uniform(new THREE.Color('#ffffff')),
    cylinderRoughness: uniform(0.2),
    wireColor: uniform(new THREE.Color('#ffffff')),
    wireRadius: uniform(0.08),
    wireRoughness: uniform(0.45),
  };
}

export function syncLook(look, config) {
  syncPaletteLook(look.palette, config);
  look.panelColor.value.set(config.panelColor);
  look.panelRoughness.value = config.panelRoughness;
  look.wallColor.value.set(config.wallColor);
  look.cavityShade.value = config.cavityShade;
  look.occlusion.value = config.wireOcclusion;
  look.cylinderColor.value.set(config.cylinderColor);
  look.cylinderRoughness.value = config.cylinderRoughness;
  look.wireColor.value.set(config.wireColor);
  look.wireRadius.value = config.wireRadius;
  look.wireRoughness.value = config.wireRoughness;
}

// Packed white tubes are a white mush without occlusion, and screen-space AO
// would be a second pipeline. The solver already knows how hard each point is
// being squeezed and how deep in the cavity it sits, so both darken it here.
function createFrameSampler({ frames, pointsPerWire }) {
  const segments = pointsPerWire - 1;
  return Fn(([progress]) => {
    const f = clamp(progress, 0, 1).mul(float(segments));
    const i0 = int(floor(f)).min(int(segments - 1));
    const base = int(instanceIndex).mul(int(pointsPerWire)).add(i0);
    return mix(
      frames.element(base).xyz,
      frames.element(base.add(1)).xyz,
      f.sub(float(i0))
    );
  });
}

export function createWireMaterial(tangle, look, tubularSegments) {
  const { buffers, layout } = tangle;
  const curve = createCurveSampler({
    points: buffers.render,
    pointsPerStrand: layout.pointsPerWire,
  });
  const frame = createFrameSampler({
    frames: buffers.frame,
    pointsPerWire: layout.pointsPerWire,
  });
  const material = createTubeMaterial({
    material: new THREE.MeshStandardNodeMaterial(),
    radius: () => look.wireRadius,
    sampleCurve: (t) => curve(t).xyz,
    tubularSegments,
    upAxis: (point, progress) => frame(progress),
  });

  const sample = curve(attribute('progress', 'float'));
  const depth = sample.z
    .sub(layout.zFront)
    .div(layout.zBack - layout.zFront)
    .clamp(0, 1);
  const squeeze = smoothstep(0, 1.5, sample.w).mul(look.occlusion);
  const shade = mix(1, look.cavityShade, depth).mul(squeeze.oneMinus());

  const { palette } = look;
  const tone = varying(palette.random(instanceIndex));
  const base = palette.paint(palette.uniforms.paintWires, look.wireColor, tone);
  material.colorNode = base.mul(varying(shade));
  material.roughnessNode = look.wireRoughness;
  return material;
}

// The front cap and its fillet scale with the radius; the back ring is pinned
// to the puck's back face, so its depth is live.
export function createCylinderMaterial(tangle, look) {
  const { buffers, layout } = tangle;
  const body = buffers.bodies.element(instanceIndex);
  const front = positionLocal.mul(body.w).add(vec3(body.xy, layout.zFront));
  const material = new THREE.MeshStandardNodeMaterial();
  material.positionNode = mix(
    front,
    vec3(front.xy, tangle.uniforms.puckBack),
    attribute('back', 'float')
  );
  const { palette } = look;
  const pu = palette.uniforms;
  material.colorNode = palette.paint(
    pu.paintCylinders,
    look.cylinderColor,
    pu.cylinderTone
  );
  material.roughnessNode = look.cylinderRoughness;
  return material;
}

// The rim is wherever the surface turns away from the face — the hole walls
// and most of their fillet — with a narrow seam so each reads as one colour.
export function createPanelMaterial(look) {
  const { palette } = look;
  const pu = palette.uniforms;
  const face = palette.paint(pu.paintPanelFace, look.panelColor, pu.faceTone);
  const rim = palette.paint(pu.paintPanelRim, look.panelColor, pu.rimTone);
  const material = new THREE.MeshStandardNodeMaterial();
  material.colorNode = mix(
    rim,
    face,
    smoothstep(0.72, 0.8, normalLocal.z.abs())
  );
  material.roughnessNode = look.panelRoughness;
  return material;
}

export function createWallMaterial(look) {
  const material = new THREE.MeshStandardNodeMaterial();
  material.colorNode = look.wallColor;
  material.roughnessNode = float(0.9);
  return material;
}
