import React, { memo, useEffect, useMemo } from 'react';

import { hash, instanceIndex, uniform, uniformArray } from 'three/tsl';
import * as THREE from 'three/webgpu';

import usePuffNoise from '../hooks/usePuffNoise';
import cloudPuffs, { CLOUD_PUFFS } from '../utils/cloudPuffs';
import { CLOUDS } from '../utils/controls';
import createPuffMaterial from '../utils/puffShading';

function createCloud(u, noise) {
  const puffs = uniformArray(
    Array.from({ length: CLOUD_PUFFS }, () => new THREE.Vector4()),
    'vec4'
  );
  const seed = uniform(-1);
  const puff = puffs.element(instanceIndex);
  const material = createPuffMaterial({
    mass: puff.y.div(0.2).clamp(0, 1).toVarying('cloudMass'),
    noise,
    seed: hash(instanceIndex.toFloat().add(seed.mul(97))).toVarying(
      'cloudSeed'
    ),
    u,
  });
  material.positionNode = puff.xyz;
  material.scaleNode = puff.w.mul(2);
  const sprite = new THREE.Sprite(material);
  sprite.count = CLOUD_PUFFS;
  sprite.frustumCulled = false;
  return { material, puffs, seed, sprite };
}

// A few cumulus painted in the same wash as the smoke: white tops, cool
// grey-blue bellies, pigment-dark edges.
function PaintedClouds({ config }) {
  const u = useMemo(
    () => ({
      edgeJag: uniform(0.25),
      glowColor: uniform(new THREE.Color('#000000')),
      grain: uniform(0.06),
      lit: uniform(new THREE.Color()),
      mottle: uniform(0.3),
      rim: uniform(0.2),
      shadow: uniform(new THREE.Color()),
    }),
    []
  );
  const noise = usePuffNoise();
  const clouds = useMemo(
    () => CLOUDS.map(() => createCloud(u, noise)),
    [noise, u]
  );
  useEffect(
    () => () => clouds.forEach(({ material }) => material.dispose()),
    [clouds]
  );

  u.edgeJag.value = config.cloudEdgeJag;
  u.grain.value = config.plumeGrain;
  u.lit.value.set(config.cloudColor);
  u.mottle.value = config.cloudMottle;
  u.rim.value = config.cloudRim;
  u.shadow.value.set(config.cloudShadow);

  return CLOUDS.map((c, i) => {
    if (!config[`${c}Visible`]) return null;
    const cloud = clouds[i];
    const layout = config[`${c}Seed`];
    if (cloud.seed.value !== layout) {
      cloud.seed.value = layout;
      cloudPuffs(layout).forEach((puff, k) =>
        cloud.puffs.array[k].set(...puff)
      );
    }
    return (
      <primitive
        key={c}
        object={cloud.sprite}
        position={[config[`${c}PosX`], config[`${c}PosY`], config[`${c}PosZ`]]}
        scale={config[`${c}Width`]}
      />
    );
  });
}

export default memo(PaintedClouds);
