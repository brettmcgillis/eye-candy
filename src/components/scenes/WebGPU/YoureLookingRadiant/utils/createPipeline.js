import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { buildShadowMapMaterial } from '@modules/radialShadow';

import buildComposeMaterial from './buildComposeMaterial';
import buildRefractMaterial from './refractPass';
import {
  MAX_BODIES,
  MAX_LIGHTS,
  buildBodySDF,
  createSceneUniforms,
} from './sceneTSL';
import { createSceneBuffers } from './swarm';
import buildCircleTrace from './traceCircles';

// Angular resolution of the shadow map. Still the biggest lever on cost, but a
// much smaller one than it was: each column now solves one quadratic per body
// instead of sphere-tracing up to 64 steps through an SDF.
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
  const bodyFn = buildBodySDF(sceneUniforms, bodyTint);

  const shadowMaterial = buildShadowMapMaterial({
    lightCount: sceneUniforms.lightCount,
    lightData: sceneUniforms.lightData,
    marchFn: buildCircleTrace(sceneUniforms),
    maxLights: MAX_LIGHTS,
  });

  // Compose lands here rather than on screen whenever there are refractors to
  // bend it; the refraction pass reads it back as the image to look through.
  const litTarget = new THREE.RenderTarget(4, 4, {
    depthBuffer: false,
    type: THREE.HalfFloatType,
  });

  // In ball radii, measured behind the ball's centre. A distance, not a gain:
  // the offset it produces scales with the ball.
  const refractDepth = uniform(2.5);
  const refractDispersion = uniform(0.06);
  const refractIor = uniform(1.45);
  const refractReflect = uniform(0.6);

  const refractMaterial = buildRefractMaterial({
    bodyCount: sceneUniforms.bodyCount,
    bodyData: sceneUniforms.bodyData,
    bodyInfo: sceneUniforms.bodyInfo,
    fieldSize: viewSize,
    litTexture: litTarget.texture,
    refractDepth,
    refractDispersion,
    refractIor,
    refractReflect,
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
  // Y-down, matching RadiantField's camera. The compose writes litTarget
  // through that one, so reading it back through a Y-up camera hands the
  // refraction pass a vertically mirrored frame and puts every lens on the
  // wrong side of the field.
  const refractCamera = new THREE.OrthographicCamera(0, 1, 0, 1, 0.1, 10);
  refractCamera.position.set(0, 0, 1);
  const passMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    shadowMaterial
  );
  passMesh.position.set(0.5, 0.5, 0);
  const passScene = new THREE.Scene();
  passScene.add(passMesh);

  return {
    ambient,
    bodyTint,
    buffers,
    composeMaterial,
    exposure,
    fieldColor,
    lightStrength,
    litTarget,
    origin,
    passCamera,
    passMesh,
    passScene,
    refractCamera,
    refractDepth,
    refractDispersion,
    refractIor,
    refractMaterial,
    refractReflect,
    sceneUniforms,
    shadowMaterial,
    shadowTarget,
    softness,
    viewSize,
  };
}
