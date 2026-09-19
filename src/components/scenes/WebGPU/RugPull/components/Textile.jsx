import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import useRenderScale from '@hooks/useRenderScale';

import buildMaterial from '../utils/material';
import {
  createUniforms,
  getTextileSize,
  syncUniforms,
} from '../utils/uniforms';

const FLAT = [-Math.PI / 2, 0, 0];

function Textile({ config }) {
  const configRef = useRef(config);
  configRef.current = config;
  const timeRef = useRef(0);

  const { fringeLength, layout, pattern, rugLength, rugWidth } = config;
  const fullscreen = layout === 'fullscreen';

  useRenderScale(config.renderScale);

  const uniforms = useMemo(createUniforms, []);
  const material = useMemo(
    () => buildMaterial(uniforms, { fullscreen, pattern }),
    [fullscreen, pattern, uniforms]
  );
  useEffect(() => () => material.dispose(), [material]);

  const meshSize = useMemo(
    () => getTextileSize({ fringeLength, layout, rugLength, rugWidth }).mesh,
    [fringeLength, layout, rugLength, rugWidth]
  );

  useFrame((_, delta) => {
    const c = configRef.current;
    timeRef.current += delta * c.timeScale;
    syncUniforms(uniforms, c, timeRef.current + c.seed);
  });

  if (fullscreen) {
    return (
      <mesh frustumCulled={false} material={material} renderOrder={-1}>
        <planeGeometry args={[2, 2]} />
      </mesh>
    );
  }

  return (
    <mesh material={material} rotation={FLAT}>
      <planeGeometry args={meshSize} />
    </mesh>
  );
}

export default memo(Textile);
