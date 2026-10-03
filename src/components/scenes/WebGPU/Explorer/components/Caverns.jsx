import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import useRenderScale from '@hooks/useRenderScale';

import { buildCavernsMaterial, createUniforms } from '../utils/sceneTSL';
import { createTrail } from '../utils/steamTrail';
import syncCavernUniforms from '../utils/syncCavernUniforms';

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

  const trail = useMemo(createTrail, []);

  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => () => uniforms.steam.noise.dispose(), [uniforms]);

  useFrame((state, delta) => {
    syncCavernUniforms(uniforms, configRef.current, {
      cameraPosition: state.camera.position,
      delta,
      fov: state.camera.fov,
      height: state.size.height,
      light: worldRef.current.position,
      trail,
      width: state.size.width,
    });
  });

  return (
    <mesh frustumCulled={false} material={material} renderOrder={-1}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

export default memo(Caverns);
