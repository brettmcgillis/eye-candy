import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three';

import { fragmentShader, vertexShader } from '../shaders/apollianShader';
import { sliceRotation } from '../utils/sliceRotation';

const BASE_DPR = () =>
  typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio, 1.5);

function buildUniforms() {
  return {
    uResolution: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    uDomain: { value: 0 },
    uFolds: { value: 7 },
    uFoldScale: { value: 1 / 0.75 },
    uSliceW: { value: 0.125 },
    uSliceRot: { value: new THREE.Vector3() },
    uTreeScaleBase: { value: 1.3 },
    uTreeScaleGain: { value: 0.95 },
    uTreeTwist: { value: Math.PI / 5.5 },
    uTreePeriodY: { value: 2 },
    uTreePeriodXZ: { value: 2 },
    uZoom: { value: 1 },
    uPivot: { value: new THREE.Vector3() },
    uUseCamera: { value: 0 },
    uCamPos: { value: new THREE.Vector3() },
    uCamRight: { value: new THREE.Vector3(1, 0, 0) },
    uCamUp: { value: new THREE.Vector3(0, 1, 0) },
    uCamForward: { value: new THREE.Vector3(0, 0, -1) },
    uTanHalfFov: { value: Math.tan(THREE.MathUtils.degToRad(36.87) / 2) },
    uOrbitPeriod: { value: 120 },
    uLensShift: { value: 0.225 },
    uMaxSteps: { value: 130 },
    uEpsilon: { value: 0.0003 },
    uBone: { value: new THREE.Color(0.89, 0.855, 0.788) },
    uAoStrength: { value: 1 },
    uFogAmount: { value: 0.001 },
    uPostGamma: { value: 0.65 },
    uSaturation: { value: -0.5 },
    uVignette: { value: 1 },
  };
}

function FractalField({ config }) {
  const configRef = useRef(config);
  configRef.current = config;

  const timeRef = useRef(0);
  const { renderScale } = config;
  const setDpr = useThree((state) => state.setDpr);

  const uniforms = useMemo(buildUniforms, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        depthTest: false,
        depthWrite: false,
        fragmentShader,
        uniforms,
        vertexShader,
      }),
    [uniforms]
  );

  useEffect(() => () => material.dispose(), [material]);

  // The fractal is the whole frame, so the canvas drawing buffer *is* the
  // march resolution — dropping DPR is the render scale, and the browser
  // upscales for free. Restore it on unmount so the next scene isn't soft.
  useEffect(() => {
    setDpr(BASE_DPR() * renderScale);
    return () => setDpr(BASE_DPR());
  }, [renderScale, setDpr]);

  useFrame((state, delta) => {
    const c = configRef.current;
    const u = uniforms;

    timeRef.current += delta * c.timeScale;
    u.uTime.value = timeRef.current;

    const { width, height } = state.size;
    u.uResolution.value.set(width, height);

    u.uDomain.value = c.domain === 'tree' ? 1 : 0;
    u.uFolds.value = c.folds;
    u.uFoldScale.value = c.foldScale;
    u.uSliceW.value = c.sliceW;
    u.uSliceRot.value.copy(
      sliceRotation({
        animate: c.sliceAnimate,
        manual: [c.sliceRotXW, c.sliceRotYW, c.sliceRotZW],
        time: timeRef.current,
      })
    );
    u.uTreeScaleBase.value = c.treeScaleBase;
    u.uTreeScaleGain.value = c.treeScaleGain;
    u.uTreeTwist.value = c.treeTwist;
    u.uTreePeriodY.value = c.treePeriodY;
    u.uTreePeriodXZ.value = c.treePeriodXZ;

    u.uOrbitPeriod.value = c.orbitPeriod;
    u.uLensShift.value = c.lensShift;
    u.uMaxSteps.value = c.maxSteps;
    u.uEpsilon.value = c.epsilon;

    u.uBone.value.setStyle(c.boneColor, THREE.LinearSRGBColorSpace);
    u.uAoStrength.value = c.aoStrength;
    u.uFogAmount.value = c.fogAmount;
    u.uPostGamma.value = c.postGamma;
    u.uSaturation.value = c.saturation;
    u.uVignette.value = c.vignette;

    const useCamera = c.viewMode === 'camera';
    u.uUseCamera.value = useCamera ? 1 : 0;
    if (!useCamera) return;

    const { camera } = state;
    u.uZoom.value = c.zoom;
    u.uPivot.value.set(c.pivotX, c.pivotY, c.pivotZ);
    u.uCamPos.value.copy(camera.position);
    camera.matrixWorld.extractBasis(
      u.uCamRight.value,
      u.uCamUp.value,
      u.uCamForward.value
    );
    u.uCamForward.value.negate();
    u.uTanHalfFov.value = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  });

  return (
    <mesh frustumCulled={false} material={material} renderOrder={-1}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

export default memo(FractalField);
