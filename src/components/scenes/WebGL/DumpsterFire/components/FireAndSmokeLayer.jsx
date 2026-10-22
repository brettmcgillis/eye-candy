import React from 'react';

import FireAndSmoke from '@elements/FireAndSmoke/FireAndSmoke';
import SplineLine from '@elements/Spline/SplineLine';
import SplinePoints from '@elements/Spline/SplinePoints';
import { FireLights } from '@modules/dumpsterFireRender';

import useTrashBlasterStore from '../hooks/useTrashBlasterStore';
import { SCENE_ROOT_POSITION } from '../utils/sceneData';
import FireAudioEmitter from './FireAudioEmitter';

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
              <FireLights rig={fireLightRig} />
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
