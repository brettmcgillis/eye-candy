import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { uniform, uniformArray } from 'three/tsl';
import * as THREE from 'three/webgpu';

import usePuffNoise from '../hooks/usePuffNoise';
import createPlumeMaterial from '../utils/plumeMaterial';
import { FIRE_LIGHTS, PLUMES } from '../utils/plumes';

const flicker = (t, i) =>
  1 +
  0.35 *
    (Math.sin(t * 9.1 + i * 1.7) * 0.5 +
      Math.sin(t * 15.7 + i * 2.9) * 0.3 +
      Math.sin(t * 23.3 + i * 0.6) * 0.2);

function createUniforms() {
  return {
    billow: uniform(0.6),
    billowScale: uniform(0.35),
    edgeJag: uniform(0.3),
    ease: uniform(0.85),
    fadeStart: uniform(0.7),
    faded: uniform(new THREE.Color()),
    fire: {
      cool: uniform(new THREE.Color()),
      hot: uniform(new THREE.Color()),
      intensity: uniform(1),
      mid: uniform(new THREE.Color()),
    },
    fireShare: uniform(0.3),
    glow: uniform(1),
    glowColor: uniform(new THREE.Color()),
    grain: uniform(0.08),
    life: uniform(6),
    lit: uniform(new THREE.Color()),
    mottle: uniform(0.35),
    rim: uniform(0.45),
    shadow: uniform(new THREE.Color()),
    sizeEnd: uniform(4),
    sizeStart: uniform(0.5),
    soot: uniform(0.15),
    spreadEnd: uniform(2),
    spreadStart: uniform(0.3),
    swirl: uniform(3),
    thinning: uniform(0),
    time: uniform(0),
  };
}

function createPlume({ path }, index, u, noise) {
  const count = uniform(1);
  const material = createPlumeMaterial({
    count,
    noise,
    path: uniformArray(
      path.map(([x, y, z]) => new THREE.Vector4(x, y, z, 0)),
      'vec4'
    ),
    salt: uniform(index),
    u,
  });
  const sprite = new THREE.Sprite(material);
  sprite.frustumCulled = false;
  return { count, material, sprite };
}

// Fire and smoke pouring off both engines and the wing roots, in the plane's
// own space so they ride along with it, each engine lighting its wing.
function EnginePlumes({ config }) {
  const u = useMemo(createUniforms, []);
  const noise = usePuffNoise();
  const plumes = useMemo(
    () => PLUMES.map((plume, i) => createPlume(plume, i, u, noise)),
    [noise, u]
  );
  useEffect(
    () => () => plumes.forEach(({ material }) => material.dispose()),
    [plumes]
  );
  const lights = useRef([]);

  u.billow.value = config.plumeBillow;
  u.billowScale.value = config.plumeBillowScale;
  u.edgeJag.value = config.plumeEdgeJag;
  u.ease.value = config.plumeEase;
  u.fadeStart.value = config.plumeFadeStart;
  u.faded.value.set(config.plumeSmokeFaded);
  u.fire.cool.value.set(config.plumeFireCool);
  u.fire.hot.value.set(config.plumeFireHot);
  u.fire.intensity.value = config.plumeFireIntensity;
  u.fire.mid.value.set(config.plumeFireMid);
  u.fireShare.value = config.plumeFireShare;
  u.glow.value = config.plumeGlow;
  u.glowColor.value.set(config.plumeGlowColor);
  u.grain.value = config.plumeGrain;
  u.life.value = config.plumeLife;
  u.lit.value.set(config.plumeSmokeLit);
  u.mottle.value = config.plumeMottle;
  u.rim.value = config.plumeRim;
  u.shadow.value.set(config.plumeSmokeShadow);
  u.sizeEnd.value = config.plumeSizeEnd;
  u.sizeStart.value = config.plumeSizeStart;
  u.soot.value = config.plumeSoot;
  u.spreadEnd.value = config.plumeSpreadEnd;
  u.spreadStart.value = config.plumeSpreadStart;
  u.swirl.value = config.plumeSwirl;
  u.thinning.value = config.plumeThinning;
  PLUMES.forEach(({ share }, i) => {
    const plume = plumes[i];
    plume.count.value = Math.max(1, Math.round(config.plumeCount * share));
    plume.sprite.count = plume.count.value;
  });

  useFrame((state, delta) => {
    u.time.value += Math.min(delta, 1 / 15) * config.plumeSpeed;
    const t = state.clock.elapsedTime;
    FIRE_LIGHTS.forEach((_, i) => {
      const light = lights.current[i];
      if (light) light.intensity = config.plumeLightIntensity * flicker(t, i);
    });
  });

  return (
    <>
      {PLUMES.map(({ key }, i) =>
        config[key] ? <primitive key={key} object={plumes[i].sprite} /> : null
      )}
      {config.plumeLightIntensity > 0
        ? FIRE_LIGHTS.map((position, i) => (
            <pointLight
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              ref={(light) => {
                lights.current[i] = light;
              }}
              color={config.plumeGlowColor}
              decay={2}
              distance={config.plumeLightDistance}
              intensity={config.plumeLightIntensity}
              position={position}
            />
          ))
        : null}
    </>
  );
}

export default memo(EnginePlumes);
