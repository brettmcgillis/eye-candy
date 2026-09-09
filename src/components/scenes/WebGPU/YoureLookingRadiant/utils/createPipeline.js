import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { buildShadowMapMaterial, marchShadow } from '@modules/radialShadow';
import {
  createDistanceField,
  createGrayScottField,
} from '@modules/reactionDiffusion';

import buildComposeMaterial from './buildComposeMaterial';
import buildRefractMaterial from './refractPass';
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

// Sim resolution. Gray-Scott's feature size is fixed in texels, so this is
// really a feature-size control: fewer texels across the same frame makes the
// spots bigger. Low enough that the pattern reads as structure rather than
// noise, high enough that the jump flood's distance is not visibly blocky.
const RD_WIDTH = 192;
const RD_HEIGHT = 108;

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
  // The sim is fixed-size and 16:9; the visible field is whatever the window
  // is, and the two meet in normalised space.
  const growthField = createGrayScottField({
    height: RD_HEIGHT,
    seeds: { count: sceneUniforms.lightCount, data: sceneUniforms.lightData },
    width: RD_WIDTH,
  });

  const growthDistance = createDistanceField({
    height: RD_HEIGHT,
    source: growthField.fieldTexture,
    width: RD_WIDTH,
  });

  const growthEnabled = uniform(0);

  const growth = {
    enabled: growthEnabled.greaterThan(0.5),
    dispatch: (renderer) => {
      growthField.update(renderer);
      growthDistance.dispatch(renderer);
    },
    distanceAt: (worldPos) =>
      growthDistance.distanceAt(worldPos, growthField.uniforms.fieldSize),
    dispose: () => {
      growthField.dispose();
      growthDistance.dispose();
    },
    uniforms: {
      ...growthField.uniforms,
      ...growthDistance.uniforms,
      enabled: growthEnabled,
    },
  };

  const sceneFn = buildSceneSDF(sceneUniforms, growth);
  const bodyFn = buildBodySDF(sceneUniforms, bodyTint, fieldColor, growth);

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

  // Compose lands here rather than on screen whenever there are refractors to
  // bend it; the refraction pass reads it back as the image to look through.
  const litTarget = new THREE.RenderTarget(4, 4, {
    depthBuffer: false,
    type: THREE.HalfFloatType,
  });

  // In ball radii, measured behind the ball's centre. A distance, not a gain:
  // the offset it produces scales with the ball, so a 90px bend no longer
  // swallows a 45px ball and paints it one flat colour.
  const refractDepth = uniform(2.5);
  const refractDispersion = uniform(0.06);
  const refractIor = uniform(1.45);
  const refractReflect = uniform(0.6);

  const refractors = {
    bodyCount: sceneUniforms.bodyCount,
    bodyData: sceneUniforms.bodyData,
    bodyInfo: sceneUniforms.bodyInfo,
    bodyRefract: sceneUniforms.bodyRefract,
    refractDepth,
    refractIor,
  };

  const refractMaterial = buildRefractMaterial({
    ...refractors,
    fieldSize: viewSize,
    litTexture: litTarget.texture,
    refractDispersion,
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
    growth,
    litTarget,
    refractCamera,
    refractDepth,
    refractDispersion,
    refractIor,
    refractMaterial,
    refractReflect,
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
