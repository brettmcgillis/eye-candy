import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import useRenderScale from '@hooks/useRenderScale';

import { buildFractalMaterial, createUniforms } from '../utils/sceneTSL';
import { sliceRotation } from '../utils/sliceRotation';

function FractalField({ config }) {
  const configRef = useRef(config);
  configRef.current = config;

  const timeRef = useRef(0);

  // The fractal is the whole frame, so the canvas drawing buffer *is* the
  // march resolution — dropping DPR is the render scale, and the browser
  // upscales for free.
  useRenderScale(config.renderScale);

  const uniforms = useMemo(createUniforms, []);
  const material = useMemo(() => buildFractalMaterial(uniforms), [uniforms]);

  useEffect(() => () => material.dispose(), [material]);

  useFrame((state, delta) => {
    const c = configRef.current;
    const u = uniforms;

    timeRef.current += delta * c.timeScale;
    u.time.value = timeRef.current;
    u.resolution.value.set(state.size.width, state.size.height);

    u.folds.value = c.folds;
    u.foldScale.value = c.foldScale;
    u.sliceW.value = c.sliceW;
    u.sliceRot.value.copy(
      sliceRotation({
        animate: c.sliceAnimate,
        manual: [c.sliceRotXW, c.sliceRotYW, c.sliceRotZW],
        time: timeRef.current,
      })
    );

    u.orbitPeriod.value = c.orbitPeriod;
    u.lensShift.value = c.lensShift;
    u.maxSteps.value = c.maxSteps;
    u.maxStepsF.value = c.maxSteps;
    u.epsilon.value = c.epsilon;

    u.bone.value.setStyle(c.boneColor, THREE.LinearSRGBColorSpace);
    u.aoStrength.value = c.aoStrength;
    u.fogAmount.value = c.fogAmount;
    u.postGamma.value = c.postGamma;
    u.saturation.value = c.saturation;
    u.vignette.value = c.vignette;

    const useCamera = c.viewMode === 'camera';
    u.useCamera.value = useCamera ? 1 : 0;
    if (!useCamera) {
      u.zoom.value = 1;
      u.pivot.value.set(0, 0, 0);
      return;
    }

    const { camera } = state;
    u.zoom.value = c.zoom;
    u.pivot.value.set(c.pivotX, c.pivotY, c.pivotZ);
    u.camPos.value.copy(camera.position);
    camera.matrixWorld.extractBasis(
      u.camRight.value,
      u.camUp.value,
      u.camForward.value
    );
    u.camForward.value.negate();
    u.tanHalfFov.value = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  });

  return (
    <mesh frustumCulled={false} material={material} renderOrder={-1}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

export default memo(FractalField);
