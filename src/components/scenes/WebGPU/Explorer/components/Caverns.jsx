import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import useRenderScale from '@hooks/useRenderScale';

import lantern from '../utils/lantern';
import { buildCavernsMaterial, createUniforms } from '../utils/sceneTSL';

// Every useFrame here stays at the default priority: anything above 0 switches
// off R3F's automatic render and hands rendering to the callback, which is why
// only PostEffects components in this repo use one.
function Caverns({ config, worldRef }) {
  const configRef = useRef(config);
  configRef.current = config;

  // The caverns are the whole frame, so the canvas drawing buffer *is* the
  // march resolution — dropping DPR is the render scale.
  useRenderScale(config.renderScale);

  const uniforms = useMemo(createUniforms, []);
  const material = useMemo(() => buildCavernsMaterial(uniforms), [uniforms]);

  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    const c = configRef.current;
    const u = uniforms;
    const scale = c.worldScale;
    const lit = lantern(c);

    u.resolution.value.set(state.size.width, state.size.height);
    u.tanHalfFov.value = Math.tan(
      THREE.MathUtils.degToRad(state.camera.fov) / 2
    );

    u.folds.value = c.folds;
    u.scaleBase.value = c.scaleBase;
    u.scaleGain.value = c.scaleGain;
    u.twist.value = c.twist;
    u.periodY.value = c.periodY;
    u.periodXZ.value = c.periodXZ;
    u.confine.value = c.confine ? 1 : 0;
    u.worldScale.value = scale;
    u.pivot.value.set(c.pivotX, c.pivotY, c.pivotZ);

    u.maxSteps.value = c.maxSteps;
    u.maxStepsF.value = c.maxSteps;
    u.shadowSteps.value = c.shadowSteps;
    u.stepSafety.value = c.stepSafety;
    u.escapeDistance.value = lit.range;
    // Not scaled: the hit test is `d < epsilon * t` with both in world units,
    // so epsilon is a ratio, not a length. Scaling it made the test 20x
    // looser than the reference's and the surfaces blobby.
    u.epsilon.value = c.surfaceEpsilon;
    u.normalEpsilon.value = c.normalEpsilon * scale;
    u.shadowBias.value = c.shadowBias * scale;
    u.aoStep.value = c.aoStep * scale;

    u.lightPos.value.copy(worldRef.current.position);
    u.lightColor.value.setStyle(c.lightColor, THREE.LinearSRGBColorSpace);
    u.lightIntensity.value = c.lightIntensity;
    u.lightFalloff.value = lit.falloff;
    u.shadowHardness.value = c.shadowHardness;

    u.albedo.value.setStyle(c.albedo, THREE.LinearSRGBColorSpace);
    u.ambientColor.value.setStyle(c.ambientColor, THREE.LinearSRGBColorSpace);
    u.ambientStrength.value = c.ambientStrength;
    u.aoStrength.value = c.aoStrength;
    u.aoFloor.value = c.aoFloor;
    u.creviceDarkening.value = c.creviceDarkening;
    u.fogColor.value.setStyle(c.fogColor, THREE.LinearSRGBColorSpace);
    u.fogDensity.value = lit.fogDensity;

    u.exposure.value = c.exposure;
    u.postGamma.value = c.postGamma;
    u.saturation.value = c.saturation;
    u.vignette.value = c.vignette;
  });

  return (
    <mesh frustumCulled={false} material={material} renderOrder={-1}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

export default memo(Caverns);
