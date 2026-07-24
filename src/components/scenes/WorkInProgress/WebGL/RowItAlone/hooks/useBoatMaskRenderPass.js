import * as THREE from 'three';

import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import oceanShaderChunks from '../shaders/oceanShaderChunks';

const MASK_CAMERA_HEIGHT = 10;
const MASK_CROSS_SECTION_DEPTH = 0.12;
const MASK_PADDING = 5;
const MASK_SIZE = 2048;
const MASK_SCALE_MULTIPLIER = 1.005;
const MASK_SURFACE_EPSILON = 0.02;
const MIN_MASK_HALF_FRUSTUM = 5;

const MASK_VERTEX_SHADER = [
  'varying vec3 vWorldPos;',
  '',
  'void main() {',
  '  vec4 worldPos = modelMatrix * vec4(position, 1.0);',
  '  vWorldPos = worldPos.xyz;',
  '  gl_Position = projectionMatrix * viewMatrix * worldPos;',
  '}',
].join('\n');

const MASK_FRAGMENT_SHADER = [
  oceanShaderChunks.OCEAN_HEIGHT_GLSL,
  'varying vec3 vWorldPos;',
  '',
  'void main() {',
  '  initOceanWaves();',
  '  float waveY = sampleOceanHeight(vWorldPos.xz);',
  '  float submersion = waveY - vWorldPos.y;',
  '',
  `  if (submersion < 0.0 || submersion > ${MASK_CROSS_SECTION_DEPTH.toFixed(3)}) {`,
  '    discard;',
  '  }',
  '',
  '  gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);',
  '}',
].join('\n');

function createMaskMaterial(runtimeUniforms) {
  return new THREE.ShaderMaterial({
    fragmentShader: MASK_FRAGMENT_SHADER,
    side: THREE.DoubleSide,
    toneMapped: false,
    uniforms: {
      uTime: runtimeUniforms.uTime,
      uSwellAmplitude: runtimeUniforms.uSwellAmplitude,
      uSwellFrequency: runtimeUniforms.uSwellFrequency,
      uSwellSpeed: runtimeUniforms.uSwellSpeed,
      uChopAmplitude: runtimeUniforms.uChopAmplitude,
      uChopFrequency: runtimeUniforms.uChopFrequency,
      uChopSpeed: runtimeUniforms.uChopSpeed,
      uDetailAmplitude: runtimeUniforms.uDetailAmplitude,
      uDetailFrequency: runtimeUniforms.uDetailFrequency,
      uDetailSpeed: runtimeUniforms.uDetailSpeed,
      uNormalEpsilon: runtimeUniforms.uNormalEpsilon,
      uInteractionBounds: runtimeUniforms.uInteractionBounds,
      uInteractionHeightmap: runtimeUniforms.uInteractionHeightmap,
    },
    vertexShader: MASK_VERTEX_SHADER,
  });
}

function createMaskCapMaterial() {
  return new THREE.MeshBasicMaterial({
    color: 0x000000,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
}

function getMaskHalfFrustum(geometry) {
  geometry.computeBoundingBox();

  const { min, max } = geometry.boundingBox;
  const width = max.x - min.x;
  const depth = max.z - min.z;

  return Math.max(
    MIN_MASK_HALF_FRUSTUM,
    width * 0.5 + MASK_PADDING,
    depth * 0.5 + MASK_PADDING
  );
}

function hullIntersectsWaterSurface({
  runtime,
  sourceHull,
  worldBounds,
  worldCenter,
  worldCorners,
}) {
  sourceHull.geometry.computeBoundingBox();

  const { min, max } = sourceHull.geometry.boundingBox;
  let cornerIndex = 0;
  let maxWaterHeight = -Infinity;
  let minWaterHeight = Infinity;

  worldBounds.makeEmpty();

  for (let xIndex = 0; xIndex < 2; xIndex += 1) {
    const localX = xIndex === 0 ? min.x : max.x;

    for (let yIndex = 0; yIndex < 2; yIndex += 1) {
      const localY = yIndex === 0 ? min.y : max.y;

      for (let zIndex = 0; zIndex < 2; zIndex += 1) {
        const localZ = zIndex === 0 ? min.z : max.z;
        const worldCorner = worldCorners[cornerIndex];

        cornerIndex += 1;
        worldCorner
          .set(localX, localY, localZ)
          .applyMatrix4(sourceHull.matrixWorld);
        const waterHeight = runtime.sampleHeight(worldCorner.x, worldCorner.z);

        worldBounds.expandByPoint(worldCorner);
        minWaterHeight = Math.min(minWaterHeight, waterHeight);
        maxWaterHeight = Math.max(maxWaterHeight, waterHeight);
      }
    }
  }

  worldCenter.copy(min).lerp(max, 0.5).applyMatrix4(sourceHull.matrixWorld);
  minWaterHeight = Math.min(
    minWaterHeight,
    runtime.sampleHeight(worldCenter.x, worldCenter.z)
  );
  maxWaterHeight = Math.max(
    maxWaterHeight,
    runtime.sampleHeight(worldCenter.x, worldCenter.z)
  );

  return (
    worldBounds.max.y >= minWaterHeight - MASK_SURFACE_EPSILON &&
    worldBounds.min.y <= maxWaterHeight + MASK_SURFACE_EPSILON
  );
}

export default function useBoatMaskRenderPass({ runtime }) {
  const { gl } = useThree();
  const maskCamera = useMemo(
    () =>
      new THREE.OrthographicCamera(
        -MIN_MASK_HALF_FRUSTUM,
        MIN_MASK_HALF_FRUSTUM,
        MIN_MASK_HALF_FRUSTUM,
        -MIN_MASK_HALF_FRUSTUM,
        0.1,
        50
      ),
    []
  );
  const maskCenterUniform = useMemo(() => ({ value: new THREE.Vector2() }), []);
  const maskCapMeshRef = useRef(null);
  const maskHalfFrustumRef = useRef(MIN_MASK_HALF_FRUSTUM);
  const maskMeshRef = useRef(null);
  const maskScaleUniform = useMemo(
    () => ({ value: MIN_MASK_HALF_FRUSTUM * 2 }),
    []
  );
  const maskScene = useMemo(() => {
    const scene = new THREE.Scene();

    scene.background = new THREE.Color(0xffffff);

    return scene;
  }, []);
  const maskTarget = useMemo(() => {
    const target = new THREE.WebGLRenderTarget(MASK_SIZE, MASK_SIZE, {
      format: THREE.RGBAFormat,
      magFilter: THREE.LinearFilter,
      minFilter: THREE.LinearFilter,
    });

    target.texture.colorSpace = THREE.NoColorSpace;

    return target;
  }, []);
  const sourceCapRef = useRef(null);
  const sourceHullRef = useRef(null);
  const tempWorldBoundsRef = useRef(new THREE.Box3());
  const tempWorldCenterRef = useRef(new THREE.Vector3());
  const tempWorldCornersRef = useMemo(
    () => Array.from({ length: 8 }, () => new THREE.Vector3()),
    []
  );
  const tempPositionRef = useRef(new THREE.Vector3());
  const tempQuaternionRef = useRef(new THREE.Quaternion());
  const tempScaleRef = useRef(new THREE.Vector3());

  useEffect(() => {
    maskCamera.position.set(0, -MASK_CAMERA_HEIGHT, 0);
    maskCamera.up.set(0, 0, -1);
    maskCamera.lookAt(0, 0, 0);
  }, [maskCamera]);

  const setHullSource = useCallback(
    (sourceMesh) => {
      sourceHullRef.current = sourceMesh;

      if (maskMeshRef.current) {
        maskScene.remove(maskMeshRef.current);
        maskMeshRef.current.material.dispose();
        maskMeshRef.current = null;
      }

      if (!sourceMesh) {
        return;
      }

      maskHalfFrustumRef.current = getMaskHalfFrustum(sourceMesh.geometry);

      const maskMesh = new THREE.Mesh(
        sourceMesh.geometry,
        createMaskMaterial(runtime.uniforms)
      );

      maskMesh.frustumCulled = false;
      maskScene.add(maskMesh);
      maskMeshRef.current = maskMesh;
    },
    [maskScene, runtime.uniforms]
  );

  const setCapSource = useCallback(
    (sourceMesh) => {
      sourceCapRef.current = sourceMesh;

      if (maskCapMeshRef.current) {
        maskScene.remove(maskCapMeshRef.current);
        maskCapMeshRef.current.material.dispose();
        maskCapMeshRef.current = null;
      }

      if (!sourceMesh) {
        return;
      }

      const maskCapMesh = new THREE.Mesh(
        sourceMesh.geometry,
        createMaskCapMaterial()
      );

      maskCapMesh.frustumCulled = false;
      maskScene.add(maskCapMesh);
      maskCapMeshRef.current = maskCapMesh;
    },
    [maskScene]
  );

  useFrame(() => {
    const maskCapMesh = maskCapMeshRef.current;
    const maskMesh = maskMeshRef.current;
    const previousAutoClear = gl.autoClear;
    const previousRenderTarget = gl.getRenderTarget();
    const sourceCap = sourceCapRef.current;
    const sourceHull = sourceHullRef.current;
    let shouldRenderMask = false;

    if (maskMesh && sourceHull) {
      sourceHull.updateWorldMatrix(true, false);
      sourceHull.matrixWorld.decompose(
        tempPositionRef.current,
        tempQuaternionRef.current,
        tempScaleRef.current
      );

      maskMesh.position.copy(tempPositionRef.current);
      maskMesh.quaternion.copy(tempQuaternionRef.current);
      maskMesh.scale
        .copy(tempScaleRef.current)
        .multiplyScalar(MASK_SCALE_MULTIPLIER);
      maskMesh.updateMatrixWorld();

      shouldRenderMask = hullIntersectsWaterSurface({
        runtime,
        sourceHull,
        worldBounds: tempWorldBoundsRef.current,
        worldCenter: tempWorldCenterRef.current,
        worldCorners: tempWorldCornersRef,
      });
      maskMesh.visible = shouldRenderMask;

      if (maskCapMesh && sourceCap) {
        sourceCap.updateWorldMatrix(true, false);
        sourceCap.matrixWorld.decompose(
          tempPositionRef.current,
          tempQuaternionRef.current,
          tempScaleRef.current
        );

        maskCapMesh.position.copy(tempPositionRef.current);
        maskCapMesh.quaternion.copy(tempQuaternionRef.current);
        maskCapMesh.scale.copy(tempScaleRef.current);
        maskCapMesh.updateMatrixWorld();
        maskCapMesh.visible = shouldRenderMask;
      }

      maskCenterUniform.value.set(
        tempPositionRef.current.x,
        tempPositionRef.current.z
      );
      maskScaleUniform.value = maskHalfFrustumRef.current * 2;

      maskCamera.left = -maskHalfFrustumRef.current;
      maskCamera.right = maskHalfFrustumRef.current;
      maskCamera.top = maskHalfFrustumRef.current;
      maskCamera.bottom = -maskHalfFrustumRef.current;
      maskCamera.position.set(
        tempPositionRef.current.x,
        -MASK_CAMERA_HEIGHT,
        tempPositionRef.current.z
      );
      maskCamera.lookAt(
        tempPositionRef.current.x,
        0,
        tempPositionRef.current.z
      );
      maskCamera.updateProjectionMatrix();
    }

    gl.autoClear = true;
    gl.setRenderTarget(maskTarget);
    gl.render(maskScene, maskCamera);
    gl.setRenderTarget(previousRenderTarget);
    gl.autoClear = previousAutoClear;
  }, -100);

  useEffect(
    () => () => {
      if (maskCapMeshRef.current) {
        maskScene.remove(maskCapMeshRef.current);
        maskCapMeshRef.current.material.dispose();
      }

      if (maskMeshRef.current) {
        maskScene.remove(maskMeshRef.current);
        maskMeshRef.current.material.dispose();
      }

      maskTarget.dispose();
    },
    [maskScene, maskTarget]
  );

  return useMemo(
    () => ({
      maskCenterUniform,
      maskScaleUniform,
      setCapSource,
      maskTextureUniform: { value: maskTarget.texture },
      setHullSource,
    }),
    [
      maskCenterUniform,
      maskScaleUniform,
      maskTarget.texture,
      setCapSource,
      setHullSource,
    ]
  );
}
