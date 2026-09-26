import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import noiseRingsNode from '../utils/noiseRings';
import { createPlateMaterial, createPlateUniforms } from '../utils/shaderPlate';
import sineThreadsNode from '../utils/sineThreads';

const NODES = {
  noiseRings: noiseRingsNode,
  sineThreads: sineThreadsNode,
};

const SCALARS = [
  'plateBrightness',
  'plateThreadAmplitude',
  'plateThreadFrequency',
  'plateThreadEdge',
  'plateThreadSpacing',
  'plateThreadNoise',
  'plateRingRadius',
  'plateRingNoise',
  'plateRingGlow',
  'plateRingLoopSpeed',
  'plateRingLobes',
];

function ShaderPlate({ config }) {
  const configRef = useRef(config);
  configRef.current = config;

  const u = useMemo(createPlateUniforms, []);
  const material = useMemo(
    () => createPlateMaterial(NODES[config.renderMode](u)),
    [config.renderMode, u]
  );

  useEffect(() => () => material.dispose(), [material]);

  const timeRef = useRef(0);

  useFrame((state, delta) => {
    const c = configRef.current;

    timeRef.current += delta * c.timeScale;
    u.time.value = timeRef.current;
    u.resolution.value.set(state.size.width, state.size.height);
    u.tint.value.setStyle(c.plateTint);
    SCALARS.forEach((key) => {
      u[key].value = c[key];
    });
  });

  return (
    <mesh frustumCulled={false} material={material} renderOrder={-1}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

export default memo(ShaderPlate);
