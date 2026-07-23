import React, { useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import FireAndSmoke from '../../../../../elements/fireAndSmoke/FireAndSmoke';
import SplineLine from '../../../../../elements/spline/SplineLine';
import SplinePoints from '../../../../../elements/spline/SplinePoints';
import useTrashBlasterStore from '../hooks/useTrashBlasterStore';
import { SCENE_ROOT_POSITION } from '../utils/sceneData';
import FireAudioEmitter from './FireAudioEmitter';

const DEFAULT_FIRE_LIGHT_RIG = Object.freeze({
  enabled: true,
  color: '#ff7a1f',
  intensity: 12,
  intensityJitter: 3.75,
  secondaryJitter: 1.25,
  distance: 10,
  decay: 1.4,
  flickerSpeed: 7,
  swayX: 0.08,
  swayY: 0.05,
  swayZ: 0.08,
  leftX: 0.15,
  leftY: 0.45,
  leftZ: 0,
  rightX: 1.15,
  rightY: 0.45,
  rightZ: 0,
});

function DumpsterFireLights({ rig }) {
  const leftLightRef = useRef(null);
  const rightLightRef = useRef(null);
  const phaseOffsetsRef = useRef([
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2 + Math.PI * 0.45,
  ]);
  const config = {
    ...DEFAULT_FIRE_LIGHT_RIG,
    ...rig,
  };

  useFrame(({ clock }) => {
    const lights = [
      {
        ref: leftLightRef,
        basePosition: [config.leftX, config.leftY, config.leftZ],
        phaseOffset: phaseOffsetsRef.current[0],
        speedScale: 1,
      },
      {
        ref: rightLightRef,
        basePosition: [config.rightX, config.rightY, config.rightZ],
        phaseOffset: phaseOffsetsRef.current[1],
        speedScale: 1.11,
      },
    ];

    lights.forEach(({ ref, basePosition, phaseOffset, speedScale }) => {
      const light = ref.current;

      if (!light) {
        return;
      }

      const t = clock.elapsedTime * config.flickerSpeed * speedScale;
      const primary = t + phaseOffset;
      const secondary = t * 1.87 + phaseOffset * 0.7;

      light.position.x = basePosition[0] + Math.sin(primary) * config.swayX;
      light.position.y = basePosition[1] + Math.sin(secondary) * config.swayY;
      light.position.z =
        basePosition[2] + Math.cos(primary * 0.82) * config.swayZ;
      light.intensity = Math.max(
        0,
        config.intensity +
          Math.sin(primary * 1.13) * config.intensityJitter +
          Math.cos(secondary * 0.93) * config.secondaryJitter
      );
    });
  });

  return (
    <>
      <pointLight
        ref={leftLightRef}
        color={config.color}
        intensity={config.intensity}
        distance={config.distance}
        decay={config.decay}
        position={[config.leftX, config.leftY, config.leftZ]}
      />
      <pointLight
        ref={rightLightRef}
        color={config.color}
        intensity={config.intensity}
        distance={config.distance}
        decay={config.decay}
        position={[config.rightX, config.rightY, config.rightZ]}
      />
    </>
  );
}

export default function FireAndSmokeLayer({
  instances,
  showEffects,
  editSplines,
  setFireAndSmokePoints,
  attractorsRef,
  attractorStrength,
  attractorRadius,
  fireLightRig,
  fireAudioConfig,
  igniteOnHit,
}) {
  const setPointerInteractionActive = useTrashBlasterStore(
    (s) => s.setPointerInteractionActive
  );

  if (!instances.length) {
    return null;
  }

  return (
    <group
      position={SCENE_ROOT_POSITION}
      name="dumpster-fire-fire-and-smoke-layer"
    >
      {instances.map((instance) => {
        const splinePositions = instance.controlPoints.map(
          (point) => point.position
        );
        const isVisible = instance.visible ?? true;
        const emitsFireLight = /fire/i.test(instance.name ?? '');
        const instanceAttractorsRef =
          instance.config.enableAttractors === false ? null : attractorsRef;

        return (
          <group
            key={instance.id}
            position={instance.pos}
            rotation={instance.rot}
            scale={instance.scale}
          >
            {showEffects && isVisible ? (
              <FireAndSmoke
                controlPoints={instance.controlPoints}
                {...instance.config}
                attractorsRef={instanceAttractorsRef}
                attractorStrength={attractorStrength}
                attractorRadius={attractorRadius}
              />
            ) : null}

            {showEffects &&
            isVisible &&
            emitsFireLight &&
            fireLightRig.enabled ? (
              <DumpsterFireLights rig={fireLightRig} />
            ) : null}

            {isVisible &&
            emitsFireLight &&
            fireAudioConfig?.enabled &&
            (!igniteOnHit || showEffects) ? (
              <FireAudioEmitter config={fireAudioConfig} />
            ) : null}

            <SplineLine
              points={splinePositions}
              curveType="centripetal"
              color={instance.config.particleColor}
              visible={editSplines && isVisible && instance.showSpline}
              arcSegments={200}
            />

            <SplinePoints
              points={instance.controlPoints}
              setPoints={(updater) =>
                setFireAndSmokePoints(instance.id, updater)
              }
              onInteractionChange={setPointerInteractionActive}
              visible={editSplines && isVisible && instance.showHandles}
              mode={instance.pointMode}
              pointSize={0.15}
            />
          </group>
        );
      })}
    </group>
  );
}
