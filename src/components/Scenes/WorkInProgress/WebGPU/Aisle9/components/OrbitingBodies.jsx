import React, { memo, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import BigGulp from '../../../../../elements/BigGulp/BigGulp';
import DoubleGulp from '../../../../../elements/DoubleGulp/DoubleGulp';
import LaysChips from '../../../../../elements/LaysChips/LaysChips';
import { Snickers } from '../../../../../elements/Snickers/Snickers';
import { SodaCan } from '../../../../../elements/SodaCan/SodaCan';
import { vectorFromObject } from '../utils/vectors';

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
  {
    Component: DoubleGulp,
    instancesKey: 'body4Instances',
    phase: 1.05,
    scale: 0.04,
    scaleKey: 'body4Scale',
    spin: [0.3, 1.1, 0.6],
  },
  {
    Component: LaysChips,
    instancesKey: 'body5Instances',
    phase: 3.15,
    scale: 0.3,
    scaleKey: 'body5Scale',
    spin: [0.8, 0.4, 1.0],
  },
];

// Deterministic per-instance random so values are stable across renders
function seededRand(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

const OrbitingBody = memo(function OrbitingBody({ body, center, orbitProps }) {
  const groupRef = useRef(null);
  // Track accumulated rotation separately so we can seed the starting offset
  const rotState = useRef([...body.initRotation]);

  const { metricWorldScale, bodyOrbitRadius, bodyOrbitHeight, bodyOrbitSpeed } =
    orbitProps;
  const bodyScale = orbitProps[body.scaleKey] ?? 1;
  const orbitRadius = bodyOrbitRadius * body.radiusJitter * metricWorldScale;
  const orbitHeight = bodyOrbitHeight * metricWorldScale;
  const verticalDrift = 0.05 * metricWorldScale;

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const angle = state.clock.elapsedTime * bodyOrbitSpeed + body.phase;

    groupRef.current.position.set(
      center.x + Math.cos(angle) * orbitRadius,
      center.y + orbitHeight + Math.sin(angle * 1.7) * verticalDrift,
      center.z + Math.sin(angle) * orbitRadius
    );

    rotState.current[0] += delta * body.spin[0];
    rotState.current[1] += delta * body.spin[1];
    rotState.current[2] += delta * body.spin[2];
    groupRef.current.rotation.set(
      rotState.current[0],
      rotState.current[1],
      rotState.current[2]
    );
  });

  const { Component } = body;

  return (
    <group ref={groupRef} scale={body.scale * bodyScale * metricWorldScale}>
      <Component />
    </group>
  );
});

const OrbitingBodies = memo(function OrbitingBodies({
  blackHolePosition,
  metricWorldScale,
  bodyOrbitRadius,
  bodyOrbitHeight,
  bodyOrbitSpeed,
  body1Scale,
  body1Instances,
  body2Scale,
  body2Instances,
  body3Scale,
  body3Instances,
  body4Scale,
  body4Instances,
  body5Scale,
  body5Instances,
}) {
  const center = useMemo(
    () => vectorFromObject(blackHolePosition),
    [blackHolePosition]
  );

  const orbitProps = useMemo(
    () => ({
      metricWorldScale,
      bodyOrbitRadius,
      bodyOrbitHeight,
      bodyOrbitSpeed,
      body1Scale,
      body2Scale,
      body3Scale,
      body4Scale,
      body5Scale,
    }),
    [
      metricWorldScale,
      bodyOrbitRadius,
      bodyOrbitHeight,
      bodyOrbitSpeed,
      body1Scale,
      body2Scale,
      body3Scale,
      body4Scale,
      body5Scale,
    ]
  );

  // Stable per-instance configs: seeded random spin, rotation offset, and radius jitter
  const instanceConfigs = useMemo(() => {
    const counts = {
      body1Instances,
      body2Instances,
      body3Instances,
      body4Instances,
      body5Instances,
    };

    return STORE_BODIES.flatMap((body, bodyIndex) => {
      const instances = Math.max(0, Math.floor(counts[body.instancesKey] ?? 1));

      return Array.from({ length: instances }, (_, index) => {
        const seed = bodyIndex * 137 + index * 31;
        const r = (offset) => seededRand(seed + offset);

        // Even spacing + small jitter so they don't form a perfect ring
        const basePhase = (Math.PI * 2 * index) / Math.max(instances, 1);
        const phaseJitter =
          (r(0) - 0.5) * (Math.PI / Math.max(instances * 2, 1));

        return {
          ...body,
          phase: body.phase + basePhase + phaseJitter,
          // Orbit radius ±15% so instances aren't stacked on the same ring
          radiusJitter: 0.85 + r(9) * 0.3,
          // Per-instance spin: randomize magnitude and direction per axis
          spin: [
            body.spin[0] * (0.5 + r(1)) * (r(4) < 0.5 ? 1 : -1),
            body.spin[1] * (0.5 + r(2)) * (r(5) < 0.5 ? 1 : -1),
            body.spin[2] * (0.5 + r(3)) * (r(6) < 0.5 ? 1 : -1),
          ],
          // Random starting orientation so they don't tumble in lockstep
          initRotation: [
            r(7) * Math.PI * 2,
            r(8) * Math.PI * 2,
            r(9) * Math.PI * 2,
          ],
          key: `${body.instancesKey}-${index}`,
        };
      });
    });
  }, [
    body1Instances,
    body2Instances,
    body3Instances,
    body4Instances,
    body5Instances,
  ]);

  return instanceConfigs.map((body) => (
    <OrbitingBody
      key={body.key}
      body={body}
      center={center}
      orbitProps={orbitProps}
    />
  ));
});

export default OrbitingBodies;
