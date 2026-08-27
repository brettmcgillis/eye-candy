import React, { memo, useEffect, useMemo } from 'react';

import {
  Fn,
  float,
  mix,
  normalize,
  positionLocal,
  select,
  texture as tslTexture,
  uniform,
  uv,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import useSceneTexture from '../hooks/useSceneTexture';

const DAY_TEXTURE = 'wildHorses/day.jpg';
const NIGHT_TEXTURE = 'wildHorses/winter.jpg';
const SEGMENTS = 96;

function SkyDome({ config, dayNight }) {
  const { skyTint, terrainExtent } = config;
  const dayMap = useSceneTexture(DAY_TEXTURE);
  const nightMap = useSceneTexture(NIGHT_TEXTURE);

  const radius = terrainExtent * 0.75;

  const { material, uniforms } = useMemo(() => {
    const values = { tint: uniform(new THREE.Color(skyTint)) };

    const center = normalize(dayNight.waveCenter).mul(dayNight.radius);
    const distToCenter = positionLocal.distance(center).toVar();
    const distToWave = distToCenter.sub(dayNight.waveFront).abs().toVar();
    const scale = distToWave.smoothstep(0.0, dayNight.waveLength).toVar();

    // Everything the collapsing front has already passed shows the outgoing
    // sky; beyond it the incoming sky blends in over waveLength.
    const offset = select(
      distToCenter.lessThan(dayNight.waveFront),
      float(1.0),
      float(1.0).sub(scale)
    );

    // The dome physically dents along the wave, which is what sells the wipe
    // as a wave rather than a dissolve.
    const displaced = Fn(() => {
      return positionLocal.sub(
        normalize(positionLocal).mul(scale.add(1.0)).mul(dayNight.waveHeight)
      );
    });

    const color = Fn(() => {
      const day = tslTexture(dayMap, uv()).rgb;
      const night = tslTexture(nightMap, uv()).rgb;
      const incoming = mix(day, night, dayNight.flip);
      const outgoing = mix(night, day, dayNight.flip);

      const blended = mix(incoming, outgoing, offset);
      const frontGlow = float(1.0).sub(scale).mul(1.15).add(1.0);

      return blended.mul(frontGlow).mul(values.tint);
    });

    const nodeMaterial = new THREE.MeshBasicNodeMaterial({
      depthWrite: false,
      side: THREE.BackSide,
    });
    nodeMaterial.positionNode = displaced();
    nodeMaterial.colorNode = color();

    return { material: nodeMaterial, uniforms: values };
  }, [dayMap, dayNight, nightMap]);

  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    uniforms.tint.value.set(skyTint);
  }, [skyTint, uniforms]);

  return (
    <mesh material={material} renderOrder={-1}>
      <sphereGeometry args={[radius, SEGMENTS, SEGMENTS / 2]} />
    </mesh>
  );
}

export default memo(SkyDome);
