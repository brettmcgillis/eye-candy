import { useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { uniform, uniformArray } from 'three/tsl';
import * as THREE from 'three/webgpu';

import herdLayout, { MAX_HERD } from '../utils/herdLayout';

// wolf2 advances two different quantities off one speed, and they are not
// interchangeable: `time` walks the noise field (small, unitless — the ground
// undulating) while `distForward` is a world-space distance (time scaled by
// terrainSize/noiseScale — the grass actually travelling). Collapsing them into
// one value leaves the grass crawling at noise-time speed, which reads as a
// stationary field under a running horse.
export default function useFieldScroll({
  herdCount,
  herdSeed,
  herdSpread,
  pushBend,
  pushRadius,
  pushStrength,
  shadowRadius,
  shadowStrength,
  speed,
  terrainExtent,
  terrainNoiseScale,
}) {
  const travelRef = useRef(0);

  const travelUniform = useMemo(() => uniform(0), []);
  const scrollUniform = useMemo(() => uniform(0), []);

  const herd = useMemo(
    () => ({
      bend: uniform(pushBend),
      count: uniform(herdCount),
      positions: uniformArray(
        Array.from({ length: MAX_HERD }, () => new THREE.Vector2()),
        'vec2'
      ),
      pushRadius: uniform(pushRadius),
      pushStrength: uniform(pushStrength),
      shadowRadius: uniform(shadowRadius),
      shadowStrength: uniform(shadowStrength),
    }),
    []
  );

  useEffect(() => {
    herd.bend.value = pushBend;
    herd.pushRadius.value = pushRadius;
    herd.pushStrength.value = pushStrength;
    herd.shadowRadius.value = shadowRadius;
    herd.shadowStrength.value = shadowStrength;
  }, [herd, pushBend, pushRadius, pushStrength, shadowRadius, shadowStrength]);

  useEffect(() => {
    const members = herdLayout({
      count: herdCount,
      seed: herdSeed,
      spread: herdSpread,
    });

    members.forEach((member, index) => {
      herd.positions.array[index].set(member.position[0], member.position[2]);
    });
    herd.positions.needsUpdate = true;
    herd.count.value = members.length;
  }, [herd, herdCount, herdSeed, herdSpread]);

  useFrame((_, delta) => {
    travelRef.current += delta * speed;
    travelUniform.value = travelRef.current;
    scrollUniform.value =
      travelRef.current * (terrainExtent / terrainNoiseScale);
  });

  return { herd, scrollUniform, travelRef, travelUniform };
}
