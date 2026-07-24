/* eslint-disable no-plusplus */
import {
  Fn,
  attribute,
  float,
  fract,
  mix,
  smoothstep,
  uniform,
  uv,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';

import { useFrame } from '@react-three/fiber';

const DEAD_TIME = -1e6;

// Ring-buffer instanced sprite embers. Spawning writes CPU-side attributes;
// motion, fade, and flicker run entirely on the GPU from spawn time.
const Embers = forwardRef(function Embers(
  {
    count = 800,
    size = 0.02,
    rise = 0.55,
    drift = 0.25,
    windDirX = 1,
    windDirZ = 0,
    lifeMin = 0.7,
    lifeMax = 1.6,
    colorHot = '#ffe8a3',
    colorCool = '#ff3c00',
    intensity = 4,
  },
  ref
) {
  const cursorRef = useRef(0);
  const clockRef = useRef(0);

  const { mesh, attrs, uniforms } = useMemo(() => {
    const spawnPos = new THREE.InstancedBufferAttribute(
      new Float32Array(count * 3),
      3
    );
    const velocity = new THREE.InstancedBufferAttribute(
      new Float32Array(count * 3),
      3
    );
    const spawnTime = new THREE.InstancedBufferAttribute(
      new Float32Array(count).fill(DEAD_TIME),
      1
    );
    const seed = new THREE.InstancedBufferAttribute(new Float32Array(count), 1);
    for (let i = 0; i < count; i++) seed.array[i] = Math.random();
    spawnPos.setUsage(THREE.DynamicDrawUsage);
    velocity.setUsage(THREE.DynamicDrawUsage);
    spawnTime.setUsage(THREE.DynamicDrawUsage);

    const geometry = new THREE.PlaneGeometry(1, 1);
    const instGeometry = new THREE.InstancedBufferGeometry().copy(geometry);
    instGeometry.instanceCount = count;
    instGeometry.setAttribute('aSpawnPos', spawnPos);
    instGeometry.setAttribute('aVelocity', velocity);
    instGeometry.setAttribute('aSpawnTime', spawnTime);
    instGeometry.setAttribute('aSeed', seed);

    const timeU = uniform(0);
    const sizeU = uniform(size);
    const riseU = uniform(rise);
    const lifeMinU = uniform(lifeMin);
    const lifeMaxU = uniform(lifeMax);
    const colorHotU = uniform(new THREE.Color(colorHot));
    const colorCoolU = uniform(new THREE.Color(colorCool));
    const intensityU = uniform(intensity);

    const material = new THREE.SpriteNodeMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const age = timeU.sub(attribute('aSpawnTime')).toVar('emberAge');
    const life = mix(lifeMinU, lifeMaxU, attribute('aSeed')).toVar('emberLife');
    const ageNorm = age.div(life).clamp(0, 1).toVar('emberAgeNorm');

    material.positionNode = Fn(() => {
      const s = attribute('aSeed');
      const wobble = vec3(
        age
          .mul(mix(float(5), float(11), s))
          .add(s.mul(40))
          .sin(),
        0,
        age.mul(mix(float(4), float(9), fract(s.mul(7.31)))).cos()
      ).mul(0.04);
      const buoyancy = vec3(
        0,
        riseU.mul(age).mul(ageNorm.mul(0.7).add(0.3)),
        0
      );
      return attribute('aSpawnPos')
        .add(attribute('aVelocity').mul(age))
        .add(buoyancy)
        .add(wobble);
    })();

    material.scaleNode = sizeU
      .mul(smoothstep(0, 0.05, ageNorm))
      .mul(float(1).sub(ageNorm).pow(0.7))
      .mul(mix(float(0.6), float(1.4), fract(attribute('aSeed').mul(13.7))));

    material.colorNode = Fn(() => {
      const d = uv().sub(0.5).length();
      const mask = smoothstep(0.5, 0.12, d);
      const flicker = age
        .mul(mix(float(18), float(30), attribute('aSeed')))
        .sin()
        .mul(0.25)
        .add(0.75);
      const col = mix(colorHotU, colorCoolU, ageNorm.pow(1.5));
      const alive = smoothstep(0, 0.001, age).mul(
        float(1).sub(smoothstep(0.85, 1.0, ageNorm))
      );
      return vec4(col.mul(intensityU).mul(flicker), mask.mul(alive));
    })();

    const emberMesh = new THREE.Mesh(instGeometry, material);
    emberMesh.frustumCulled = false;

    return {
      mesh: emberMesh,
      attrs: { spawnPos, velocity, spawnTime },
      uniforms: {
        timeU,
        sizeU,
        riseU,
        lifeMinU,
        lifeMaxU,
        colorHotU,
        colorCoolU,
        intensityU,
      },
    };
  }, [count]);

  useEffect(() => {
    uniforms.sizeU.value = size;
    uniforms.riseU.value = rise;
    uniforms.lifeMinU.value = lifeMin;
    uniforms.lifeMaxU.value = lifeMax;
    uniforms.colorHotU.value.set(colorHot);
    uniforms.colorCoolU.value.set(colorCool);
    uniforms.intensityU.value = intensity;
  }, [uniforms, size, rise, lifeMin, lifeMax, colorHot, colorCool, intensity]);

  useEffect(() => {
    return () => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    };
  }, [mesh]);

  useImperativeHandle(
    ref,
    () => ({
      // Spawn n embers around (x, y, z) within the given radius.
      spawn(x, y, z, n, radius = 0.15) {
        const { spawnPos, velocity, spawnTime } = attrs;
        for (let k = 0; k < n; k++) {
          const i = cursorRef.current;
          cursorRef.current = (cursorRef.current + 1) % count;
          spawnPos.array[i * 3 + 0] = x + (Math.random() - 0.5) * 2 * radius;
          spawnPos.array[i * 3 + 1] = y + (Math.random() - 0.5) * 2 * radius;
          spawnPos.array[i * 3 + 2] = z + (Math.random() - 0.5) * 2 * radius;
          velocity.array[i * 3 + 0] =
            windDirX * drift * (0.5 + Math.random()) +
            (Math.random() - 0.5) * 0.1;
          velocity.array[i * 3 + 1] = (Math.random() - 0.2) * 0.15;
          velocity.array[i * 3 + 2] =
            windDirZ * drift * (0.5 + Math.random()) +
            (Math.random() - 0.5) * 0.1;
          spawnTime.array[i] = clockRef.current;
        }
        spawnPos.needsUpdate = true;
        velocity.needsUpdate = true;
        spawnTime.needsUpdate = true;
      },
    }),
    [attrs, count, windDirX, windDirZ, drift]
  );

  useFrame((_, delta) => {
    clockRef.current += Math.min(delta, 0.05);
    uniforms.timeU.value = clockRef.current;
  });

  return <primitive object={mesh} />;
});

export default Embers;
