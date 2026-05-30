import { gaussianBlur } from 'three/addons/tsl/display/GaussianBlurNode.js';
import {
  clamp,
  float,
  length,
  max,
  mix,
  pass,
  screenUV,
  smoothstep,
  step,
  uniform,
  vec2,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import {
  BlackHoleSimulation,
  createBlackHoleGeometry,
} from '../utils/blackHoleSimulation';

const WORLD_ORIGIN = new THREE.Vector3();
const MAX_SCREEN_OUTER_RADIUS = 0.42;
const DEFAULT_BLACK_HOLE_POSITION = Object.freeze({ x: 0, y: 0, z: 0 });
const DEFAULT_BLACK_HOLE_ROTATION = Object.freeze({ x: 0, y: 0, z: 0 });
const DEFAULT_BLACK_HOLE_SCALE = Object.freeze({ x: 1, y: 1, z: 1 });
const MIN_BLACK_HOLE_SCALE = 0.001;

function setVector3FromControl(target, value, fallback) {
  target.set(
    value?.x ?? fallback.x,
    value?.y ?? fallback.y,
    value?.z ?? fallback.z
  );

  return target;
}

function setEulerFromDegrees(target, value, fallback) {
  target.set(
    THREE.MathUtils.degToRad(value?.x ?? fallback.x),
    THREE.MathUtils.degToRad(value?.y ?? fallback.y),
    THREE.MathUtils.degToRad(value?.z ?? fallback.z)
  );

  return target;
}

function setScaleFromControl(target, value, fallback) {
  target.set(
    Math.max(value?.x ?? fallback.x, MIN_BLACK_HOLE_SCALE),
    Math.max(value?.y ?? fallback.y, MIN_BLACK_HOLE_SCALE),
    Math.max(value?.z ?? fallback.z, MIN_BLACK_HOLE_SCALE)
  );

  return target;
}

function getProjectedRadius(originProjection, pointProjection, aspect) {
  return Math.hypot(
    (pointProjection.x - originProjection.x) * 0.5 * aspect,
    (pointProjection.y - originProjection.y) * 0.5
  );
}

const PostEffects = memo(function PostEffects({ config }) {
  const { gl: renderer, scene, camera, size } = useThree();
  const postRef = useRef(null);
  const originProjectionRef = useRef(new THREE.Vector3());
  const originViewRef = useRef(new THREE.Vector3());
  const innerProjectionRef = useRef(new THREE.Vector3());
  const outerProjectionRef = useRef(new THREE.Vector3());
  const innerWorldRef = useRef(new THREE.Vector3());
  const outerWorldRef = useRef(new THREE.Vector3());
  const blackHoleTransformRef = useRef({
    localToWorldMatrix: new THREE.Matrix4(),
    worldToLocalMatrix: new THREE.Matrix4(),
    position: new THREE.Vector3(),
    rotation: new THREE.Euler(),
    quaternion: new THREE.Quaternion(),
    scale: new THREE.Vector3(1, 1, 1),
    originWorld: new THREE.Vector3(),
    innerDepthWorld: new THREE.Vector3(),
    outerDepthWorld: new THREE.Vector3(),
    innerDepthProjection: new THREE.Vector3(),
    outerDepthProjection: new THREE.Vector3(),
  });
  const simulation = useMemo(() => new BlackHoleSimulation(config, size), []);
  const geometry = useMemo(() => createBlackHoleGeometry(), []);
  const material = useMemo(() => simulation.createMaterial(), [simulation]);
  const maskMaterial = useMemo(
    () => simulation.createMaskMaterial(),
    [simulation]
  );
  const blackHoleScene = useMemo(() => {
    const nextScene = new THREE.Scene();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.renderOrder = -1000;
    nextScene.add(mesh);
    return nextScene;
  }, [geometry, material]);
  const blackHoleMaskScene = useMemo(() => {
    const nextScene = new THREE.Scene();
    const mesh = new THREE.Mesh(geometry, maskMaterial);
    mesh.frustumCulled = false;
    mesh.renderOrder = -1000;
    nextScene.add(mesh);
    return nextScene;
  }, [geometry, maskMaterial]);
  const blackHoleConfig = useMemo(
    () =>
      config.presentationMode === 'storeWarp'
        ? {
            ...config,
            starsEnabled: false,
            nebulaEnabled: false,
            backgroundOpacity: 0,
            starBackgroundColor: '#000000',
          }
        : { ...config, backgroundOpacity: 1 },
    [config]
  );
  const uniforms = useMemo(
    () => ({
      aspect: uniform(size.width / Math.max(size.height, 1)),
      center: uniform(new THREE.Vector2(0.5, 0.5)),
      effectVisibility: uniform(1),
      holeDepth: uniform(1),
      blackHoleMass: uniform(config.blackHoleMass),
      gravitationalLensing: uniform(config.gravitationalLensing),
      screenInnerRadius: uniform(0.05),
      screenOuterRadius: uniform(0.18),
      bloomThreshold: uniform(config.bloomThreshold),
      bloomStrength: uniform(config.bloomStrength),
    }),
    []
  );

  useEffect(() => {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
  }, [renderer]);

  useEffect(() => {
    material.depthTest = false;
    material.depthWrite = false;
  }, [material]);

  useEffect(() => {
    maskMaterial.depthTest = false;
    maskMaterial.depthWrite = false;
  }, [maskMaterial]);

  useEffect(() => {
    uniforms.blackHoleMass.value = config.blackHoleMass;
    uniforms.gravitationalLensing.value = config.gravitationalLensing;
    uniforms.bloomThreshold.value = config.bloomThreshold;
    uniforms.bloomStrength.value = config.bloomStrength;
  }, [config, uniforms]);

  useEffect(() => {
    simulation.updateUniforms(blackHoleConfig);
  }, [blackHoleConfig, simulation]);

  useEffect(() => {
    uniforms.aspect.value = size.width / Math.max(size.height, 1);
    simulation.onResize(size.width, size.height);
  }, [simulation, size.height, size.width, uniforms]);

  useEffect(() => {
    return () => {
      material.dispose();
      maskMaterial.dispose();
      geometry.dispose();
    };
  }, [geometry, maskMaterial, material]);

  useEffect(() => {
    if (!renderer || !scene || !camera) {
      return undefined;
    }

    const scenePass = pass(scene, camera);
    const sceneColor = scenePass.getTextureNode();
    const sceneDepth = scenePass.getTextureNode('depth');
    const blackHolePass = pass(blackHoleScene, camera);
    const blackHoleColor = blackHolePass.getTextureNode();
    const blackHoleMaskPass = pass(blackHoleMaskScene, camera);
    const blackHoleMask = blackHoleMaskPass.getTextureNode();

    const baseScene =
      config.presentationMode === 'backgroundField'
        ? blackHolePass
        : (() => {
            const effectVisibility = uniforms.effectVisibility.clamp(0.0, 1.0);
            const centeredUv = vec2(
              screenUV.x.sub(uniforms.center.x).mul(uniforms.aspect),
              screenUV.y.sub(uniforms.center.y)
            );
            const dist = length(centeredUv);
            const innerRadius = uniforms.screenInnerRadius.max(0.02);
            const outerRadius = uniforms.screenOuterRadius.max(
              innerRadius.add(0.02)
            );
            const coreRadius = innerRadius
              .mul(0.58)
              .max(uniforms.blackHoleMass.mul(0.015));
            const lensRadius = outerRadius.mul(1.35).add(coreRadius.mul(0.55));
            const safeDist = dist.max(0.0001);
            const direction = centeredUv.div(safeDist);
            const directionUv = vec2(
              direction.x.div(uniforms.aspect),
              direction.y
            );
            const holeVisibleMask = step(
              uniforms.holeDepth.sub(0.0015),
              sceneDepth.sample(screenUV)
            ).mul(effectVisibility);
            const blackHoleAlpha = blackHoleMask.r
              .mul(holeVisibleMask)
              .clamp(0.0, 1.0);
            const lensMask = float(1.0).sub(
              smoothstep(coreRadius, lensRadius, dist)
            );
            const visibleLensMask = lensMask.mul(holeVisibleMask);
            const warpStrength = uniforms.gravitationalLensing
              .mul(
                visibleLensMask
                  .mul(visibleLensMask)
                  .add(visibleLensMask.mul(0.2))
              )
              .mul(outerRadius.mul(0.32).add(coreRadius.mul(0.65)));
            const warpedUvRaw = vec2(
              screenUV.x.sub(directionUv.x.mul(warpStrength)),
              screenUV.y.sub(directionUv.y.mul(warpStrength))
            );
            const safeWarpedUv = vec2(
              clamp(warpedUvRaw.x, 0.0, 1.0),
              clamp(warpedUvRaw.y, 0.0, 1.0)
            );
            const inBoundsMask = step(0.0, warpedUvRaw.x)
              .mul(step(warpedUvRaw.x, 1.0))
              .mul(step(0.0, warpedUvRaw.y))
              .mul(step(warpedUvRaw.y, 1.0));
            const warpedStore = mix(
              sceneColor.sample(screenUV).rgb,
              sceneColor.sample(safeWarpedUv).rgb,
              inBoundsMask.mul(holeVisibleMask)
            );
            const dimmedStore = warpedStore.mul(
              float(1.0).sub(
                visibleLensMask.mul(0.08).add(blackHoleAlpha.mul(0.45))
              )
            );
            const withBlackHole = dimmedStore
              .mul(float(1.0).sub(blackHoleAlpha))
              .add(blackHoleColor.rgb.mul(effectVisibility));

            return vec4(withBlackHole, 1.0);
          })();

    const bloomContribution = config.bloomEnabled
      ? gaussianBlur(
          max(baseScene.sub(uniforms.bloomThreshold), 0.0),
          config.bloomRadius,
          6,
          {
            resolutionScale: 1 / config.bloomDownSampleRatio,
          }
        ).mul(uniforms.bloomStrength)
      : vec4(0, 0, 0, 0);

    const postProcessing = new THREE.PostProcessing(renderer);
    postProcessing.outputNode = baseScene.add(bloomContribution);
    postRef.current = postProcessing;

    return () => {
      postRef.current = null;
    };
  }, [
    camera,
    config.bloomDownSampleRatio,
    config.bloomEnabled,
    config.bloomRadius,
    config.presentationMode,
    blackHoleMaskScene,
    blackHoleScene,
    renderer,
    scene,
    uniforms,
  ]);

  useFrame((_, deltaTime) => {
    const aspect = size.width / Math.max(size.height, 1);
    const blackHoleTransform = blackHoleTransformRef.current;

    setVector3FromControl(
      blackHoleTransform.position,
      config.blackHolePosition,
      DEFAULT_BLACK_HOLE_POSITION
    );
    setEulerFromDegrees(
      blackHoleTransform.rotation,
      config.blackHoleRotation,
      DEFAULT_BLACK_HOLE_ROTATION
    );
    setScaleFromControl(
      blackHoleTransform.scale,
      config.blackHoleScale,
      DEFAULT_BLACK_HOLE_SCALE
    );
    blackHoleTransform.quaternion.setFromEuler(blackHoleTransform.rotation);
    blackHoleTransform.localToWorldMatrix.compose(
      blackHoleTransform.position,
      blackHoleTransform.quaternion,
      blackHoleTransform.scale
    );
    blackHoleTransform.worldToLocalMatrix
      .copy(blackHoleTransform.localToWorldMatrix)
      .invert();

    blackHoleTransform.originWorld
      .copy(WORLD_ORIGIN)
      .applyMatrix4(blackHoleTransform.localToWorldMatrix);
    originProjectionRef.current
      .copy(blackHoleTransform.originWorld)
      .project(camera);
    originViewRef.current
      .copy(blackHoleTransform.originWorld)
      .applyMatrix4(camera.matrixWorldInverse);

    simulation.update(deltaTime, camera, blackHoleTransform.worldToLocalMatrix);

    innerWorldRef.current
      .set(config.diskInnerRadius, 0, 0)
      .applyMatrix4(blackHoleTransform.localToWorldMatrix);
    outerWorldRef.current
      .set(config.diskOuterRadius, 0, 0)
      .applyMatrix4(blackHoleTransform.localToWorldMatrix);
    blackHoleTransform.innerDepthWorld
      .set(0, 0, config.diskInnerRadius)
      .applyMatrix4(blackHoleTransform.localToWorldMatrix);
    blackHoleTransform.outerDepthWorld
      .set(0, 0, config.diskOuterRadius)
      .applyMatrix4(blackHoleTransform.localToWorldMatrix);

    innerProjectionRef.current.copy(innerWorldRef.current).project(camera);
    outerProjectionRef.current.copy(outerWorldRef.current).project(camera);
    blackHoleTransform.innerDepthProjection
      .copy(blackHoleTransform.innerDepthWorld)
      .project(camera);
    blackHoleTransform.outerDepthProjection
      .copy(blackHoleTransform.outerDepthWorld)
      .project(camera);

    const projectedInnerRadius = Math.max(
      getProjectedRadius(
        originProjectionRef.current,
        innerProjectionRef.current,
        aspect
      ),
      getProjectedRadius(
        originProjectionRef.current,
        blackHoleTransform.innerDepthProjection,
        aspect
      )
    );
    const projectedOuterRadius = Math.max(
      getProjectedRadius(
        originProjectionRef.current,
        outerProjectionRef.current,
        aspect
      ),
      getProjectedRadius(
        originProjectionRef.current,
        blackHoleTransform.outerDepthProjection,
        aspect
      )
    );
    const safeProjectedInnerRadius = Number.isFinite(projectedInnerRadius)
      ? projectedInnerRadius
      : 0;
    const safeProjectedOuterRadius = Number.isFinite(projectedOuterRadius)
      ? projectedOuterRadius
      : 0;
    const radiusScale =
      safeProjectedOuterRadius > MAX_SCREEN_OUTER_RADIUS
        ? MAX_SCREEN_OUTER_RADIUS / safeProjectedOuterRadius
        : 1;
    const screenInnerRadius = safeProjectedInnerRadius
      ? Math.max(safeProjectedInnerRadius * radiusScale, 0.02)
      : 0;
    const screenOuterRadius = safeProjectedOuterRadius
      ? Math.max(
          safeProjectedOuterRadius * radiusScale,
          screenInnerRadius + 0.02
        )
      : 0;
    const rawCenterX = originProjectionRef.current.x * 0.5 + 0.5;
    const rawCenterY = originProjectionRef.current.y * 0.5 + 0.5;
    const projectedDepthSamples = [
      originProjectionRef.current.z,
      innerProjectionRef.current.z,
      outerProjectionRef.current.z,
      blackHoleTransform.innerDepthProjection.z,
      blackHoleTransform.outerDepthProjection.z,
    ]
      .map((projectionZ) => projectionZ * 0.5 + 0.5)
      .filter((depth) => Number.isFinite(depth) && depth >= 0 && depth <= 1);
    const holeInFront = originViewRef.current.z < -config.cameraNear;
    const intersectsViewport =
      rawCenterX + screenOuterRadius >= 0 &&
      rawCenterX - screenOuterRadius <= 1 &&
      rawCenterY + screenOuterRadius >= 0 &&
      rawCenterY - screenOuterRadius <= 1;
    const effectVisibility =
      holeInFront &&
      Number.isFinite(rawCenterX) &&
      Number.isFinite(rawCenterY) &&
      screenOuterRadius > 0 &&
      projectedDepthSamples.length > 0 &&
      intersectsViewport
        ? 1
        : 0;
    const holeDepth =
      effectVisibility > 0 ? Math.min(...projectedDepthSamples) : 1;

    uniforms.aspect.value = aspect;
    uniforms.center.value.set(rawCenterX, rawCenterY);
    uniforms.effectVisibility.value = effectVisibility;
    uniforms.holeDepth.value = holeDepth;
    uniforms.screenInnerRadius.value = screenInnerRadius;
    uniforms.screenOuterRadius.value = screenOuterRadius;

    if (!postRef.current) {
      return;
    }

    postRef.current.render();
  }, 1);

  return null;
});

export default PostEffects;
