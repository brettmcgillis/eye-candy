import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import buildRadianceComposeMaterial from '../utils/buildRadianceComposeMaterial';
import buildShadowMapMaterial from '../utils/buildShadowMapMaterial';
import {
  buildDecorSDF,
  buildSceneSDF,
  marchShadow,
} from '../utils/radialShadowTSL';
import { MAX_WINDOWS } from '../utils/radianceConstants';
import { createSceneUniforms, updateSceneUniforms } from '../utils/sceneTSL';

// Angular resolution of the shadow map (columns). Higher = smoother shadow
// edges; the whole buffer is only ANGLE_STEPS×MAX_WINDOWS texels, so this is
// cheap.
const ANGLE_STEPS = 1024;
const RADIAL_PIPELINE_VERSION = 1;

function makeShadowRT() {
  const rt = new THREE.RenderTarget(ANGLE_STEPS, MAX_WINDOWS, {
    depthBuffer: false,
    format: THREE.RGBAFormat,
    generateMipmaps: false,
    magFilter: THREE.NearestFilter,
    minFilter: THREE.NearestFilter,
    stencilBuffer: false,
    type: THREE.HalfFloatType,
  });
  // Angle wraps at the 0/2π seam; rows (lights) must not blend into each other,
  // hence NearestFilter above.
  rt.texture.wrapS = THREE.RepeatWrapping;
  return rt;
}

// Owns the two-pass radial-shadow render: one offscreen pass fills the 1D
// shadow map for every window's light, then the visible mesh's compose
// material reads it back. Runs from a priority-1 useFrame (same reasoning as
// the retired cascade pipeline — offscreen passes must each be a complete,
// non-nested renderer.render call, so we own the frame and do the real scene
// render last).
export default function useRadialShadowPipeline({
  ambient,
  decor,
  exposure,
  selfId,
  selfLight,
  selfOccluder,
  selfRect,
  shadowSoftness,
  windows,
}) {
  const meshRef = useRef(null);

  const liveRef = useRef(null);
  liveRef.current = {
    ambient,
    decor,
    exposure,
    selfId,
    selfLight,
    selfOccluder,
    selfRect,
    shadowSoftness,
    windows,
  };

  const stable = useMemo(() => {
    const sceneUniforms = createSceneUniforms();
    const timeU = uniform(0);
    const decorU = {
      color: uniform(new THREE.Color(1, 1, 1)),
      enabled: uniform(0),
      origin: uniform(new THREE.Vector2()),
      scale: uniform(1000),
      spin: uniform(1),
    };
    const ambientU = uniform(0);
    const exposureU = uniform(1);
    const softU = uniform(0.02);
    const origin = uniform(new THREE.Vector2());
    const size = uniform(new THREE.Vector2(1, 1));

    const shadowRT = makeShadowRT();
    const decorFn = buildDecorSDF(timeU, decorU);
    const sceneFn = buildSceneSDF(sceneUniforms, decorFn);
    const marchFn = (rayOrigin, rayDir) =>
      marchShadow(sceneFn, rayOrigin, rayDir);

    const shadowMaterial = buildShadowMapMaterial({
      lightData: sceneUniforms.lightData,
      marchFn,
      windowCount: sceneUniforms.windowCount,
    });

    const composeMaterial = buildRadianceComposeMaterial({
      ambient: ambientU,
      decorColor: decorU.color,
      decorFn,
      exposure: exposureU,
      lightColor: sceneUniforms.lightColor,
      lightData: sceneUniforms.lightData,
      origin,
      sceneFn,
      shadowTexture: shadowRT.texture,
      size,
      softness: softU,
      windowCount: sceneUniforms.windowCount,
    });

    const passCamera = new THREE.OrthographicCamera(0, 1, 1, 0, 0.1, 10);
    passCamera.position.set(0, 0, 1);
    const passMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1));
    passMesh.position.set(0.5, 0.5, 0);
    const passScene = new THREE.Scene();
    passScene.add(passMesh);

    return {
      ambientU,
      composeMaterial,
      decorU,
      exposureU,
      origin,
      passCamera,
      passMesh,
      passScene,
      sceneUniforms,
      shadowMaterial,
      shadowRT,
      size,
      softU,
      timeU,
    };
  }, [RADIAL_PIPELINE_VERSION]);

  useEffect(
    () => () => {
      stable.shadowRT.dispose();
      stable.shadowMaterial.dispose();
      stable.composeMaterial.dispose();
      stable.passMesh.geometry.dispose();
    },
    [stable]
  );

  const { camera, gl, scene } = useThree();

  useFrame((state, delta) => {
    const live = liveRef.current;
    const rect = live.selfRect;

    if (!rect || rect.w < 1 || rect.h < 1) {
      gl.render(scene, camera);
      return;
    }

    updateSceneUniforms(stable.sceneUniforms, {
      selfId: live.selfId,
      selfLight: live.selfLight,
      selfOccluder: live.selfOccluder,
      selfRect: live.selfRect,
      windows: live.windows,
    });
    stable.origin.value.set(rect.x + rect.w * 0.5, rect.y + rect.h * 0.5);
    stable.size.value.set(rect.w, rect.h);
    stable.ambientU.value = live.ambient;
    stable.exposureU.value = live.exposure;
    stable.softU.value = live.shadowSoftness;
    stable.decorU.color.value.set(live.decor.color);
    stable.decorU.enabled.value = live.decor.enabled ? 1 : 0;
    stable.decorU.origin.value.set(live.decor.originX, live.decor.originY);
    stable.decorU.scale.value = live.decor.scale;
    stable.decorU.spin.value = live.decor.spin;
    stable.timeU.value += delta;

    const savedTarget = gl.getRenderTarget?.() ?? null;

    stable.passMesh.material = stable.shadowMaterial;
    gl.setRenderTarget(stable.shadowRT);
    gl.render(stable.passScene, stable.passCamera);

    gl.setRenderTarget(savedTarget);
    gl.render(scene, camera);
  }, 1);

  return { material: stable.composeMaterial, meshRef };
}
