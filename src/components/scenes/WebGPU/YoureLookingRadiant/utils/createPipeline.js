import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { buildShadowMapMaterial, marchShadow } from '@modules/radialShadow';

import buildComposeMaterial from './buildComposeMaterial';
import {
  MAX_BODIES,
  MAX_LIGHTS,
  buildBodySDF,
  buildSceneSDF,
  createSceneUniforms,
} from './sceneTSL';
import { createSceneBuffers } from './swarm';

// Angular resolution of the shadow map, and by far the biggest lever on cost:
// the march runs once per column per light, so halving it halves the shadow
// pass. Low values show as stepped edges on shadows cast by a nearby occluder,
// which Shadow Softness can hide some of.
export const DEFAULT_ANGLE_STEPS = 1024;

function makeShadowTarget() {
  const target = new THREE.RenderTarget(DEFAULT_ANGLE_STEPS, MAX_LIGHTS, {
    depthBuffer: false,
    format: THREE.RGBAFormat,
    generateMipmaps: false,
    magFilter: THREE.NearestFilter,
    minFilter: THREE.NearestFilter,
    stencilBuffer: false,
    type: THREE.HalfFloatType,
  });

  // Angle wraps at the 0/2pi seam; rows must not blend into each other, hence
  // NearestFilter above.
  target.texture.wrapS = THREE.RepeatWrapping;

  return target;
}

// Every target, uniform and material the scene needs, with no React in it.
// Deliberately not inlined in the hook: the headless still harness renders
// through this exact function, so a wiring mistake between the hook and the
// materials — a node input that never arrives and lands in the generated WGSL
// as `null` — shows up in a still rather than only in the browser.
export default function createRadiancePipeline() {
  const buffers = createSceneBuffers(MAX_LIGHTS, MAX_BODIES);
  const sceneUniforms = createSceneUniforms();
  const ambient = uniform(0);
  const bodyTint = uniform(new THREE.Color(0, 0, 0));
  const exposure = uniform(1);
  const fieldColor = uniform(new THREE.Color(1, 1, 1));
  const lightStrength = uniform(1);
  const origin = uniform(new THREE.Vector2());
  const softness = uniform(0.02);
  const viewSize = uniform(new THREE.Vector2(1, 1));

  const shadowTarget = makeShadowTarget();
  const sceneFn = buildSceneSDF(sceneUniforms);
  const bodyFn = buildBodySDF(sceneUniforms, bodyTint, fieldColor);

  const shadowMaterial = buildShadowMapMaterial({
    lightCount: sceneUniforms.lightCount,
    lightData: sceneUniforms.lightData,
    // The row index identifies a LIGHT, and an arc carries many of them, so
    // the exclusion has to go through lightOwner to the body. Excluding the
    // row index instead leaves every light sitting inside its own arc, which
    // it then hits at t = 0 — the whole frame reads as shadowed and only the
    // bodies' own glow survives.
    marchFn: (rayOrigin, rayDir, lightIndex) =>
      marchShadow(
        (p) => sceneFn(p, sceneUniforms.lightOwner.element(lightIndex)),
        rayOrigin,
        rayDir
      ),
    maxLights: MAX_LIGHTS,
  });

  const composeMaterial = buildComposeMaterial({
    ambient,
    bodyFn,
    exposure,
    fieldColor,
    lightColor: sceneUniforms.lightColor,
    lightCount: sceneUniforms.lightCount,
    lightData: sceneUniforms.lightData,
    lightStrength,
    maxLights: MAX_LIGHTS,
    origin,
    shadowTexture: shadowTarget.texture,
    size: viewSize,
    softness,
  });

  const passCamera = new THREE.OrthographicCamera(0, 1, 1, 0, 0.1, 10);
  passCamera.position.set(0, 0, 1);
  const passMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    shadowMaterial
  );
  passMesh.position.set(0.5, 0.5, 0);
  const passScene = new THREE.Scene();
  passScene.add(passMesh);

  return {
    ambient,
    buffers,
    bodyTint,
    composeMaterial,
    exposure,
    fieldColor,
    lightStrength,
    origin,
    passCamera,
    passMesh,
    passScene,
    sceneUniforms,
    shadowMaterial,
    shadowTarget,
    softness,
    viewSize,
  };
}
