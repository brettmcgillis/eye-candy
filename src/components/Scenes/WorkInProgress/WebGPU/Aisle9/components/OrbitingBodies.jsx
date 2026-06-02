import * as THREE from 'three';

import React, { memo, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import BigGulp from '../../../../../elements/BigGulp/BigGulp';
import { Snickers } from '../../../../../elements/Snickers/Snickers';
import { SodaCan } from '../../../../../elements/SodaCan/SodaCan';

const STORE_BODIES = [
  {
    Component: SodaCan,
    instancesKey: 'body1Instances',
    phase: 0,
    scale: 0.02,
    scaleKey: 'body1Scale',
    spin: [0.5, 1.4, 0.3],
  },
  {
    Component: BigGulp,
    instancesKey: 'body2Instances',
    phase: 2.1,
    scale: 0.007,
    scaleKey: 'body2Scale',
    spin: [0.4, 0.8, 1.3],
  },
  {
    Component: Snickers,
    instancesKey: 'body3Instances',
    phase: 4.2,
    scale: 0.035,
    scaleKey: 'body3Scale',
    spin: [1.2, 0.5, 0.8],
  },
];

function vectorFromObject(value) {
  return new THREE.Vector3(value.x ?? 0, value.y ?? 0, value.z ?? 0);
}

const OrbitingBody = memo(function OrbitingBody({ body, center, config }) {
  const groupRef = useRef(null);
  const metricWorldScale = config.metricWorldScale ?? 1;
  const bodyScale = config[body.scaleKey] ?? 1;
  const orbitRadius = config.bodyOrbitRadius * metricWorldScale;
  const orbitHeight = config.bodyOrbitHeight * metricWorldScale;
  const verticalDrift = 0.05 * metricWorldScale;

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const angle = state.clock.elapsedTime * config.bodyOrbitSpeed + body.phase;

    groupRef.current.position.set(
      center.x + Math.cos(angle) * orbitRadius,
      center.y + orbitHeight + Math.sin(angle * 1.7) * verticalDrift,
      center.z + Math.sin(angle) * orbitRadius
    );
    groupRef.current.rotation.x += delta * body.spin[0];
    groupRef.current.rotation.y += delta * body.spin[1];
    groupRef.current.rotation.z += delta * body.spin[2];
  });

  const { Component } = body;

  return (
    <group ref={groupRef} scale={body.scale * bodyScale * metricWorldScale}>
      <Component />
    </group>
  );
});

const OrbitingBodies = memo(function OrbitingBodies({ config }) {
  const center = useMemo(
    () => vectorFromObject(config.blackHolePosition),
    [config.blackHolePosition]
  );

  return STORE_BODIES.flatMap((body) => {
    const instances = Math.max(0, Math.floor(config[body.instancesKey] ?? 1));

    return Array.from({ length: instances }, (_, index) => {
      const phaseOffset = (Math.PI * 2 * index) / Math.max(instances, 1);
      const instanceBody = {
        ...body,
        phase: body.phase + phaseOffset,
      };

      return (
        <OrbitingBody
          key={`${body.instancesKey}-${index}`}
          body={instanceBody}
          center={center}
          config={config}
        />
      );
    });
  });
});

export default OrbitingBodies;
