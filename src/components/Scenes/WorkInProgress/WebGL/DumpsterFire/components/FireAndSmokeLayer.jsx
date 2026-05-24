import React from 'react';

import FireAndSmoke from '../../../../../elements/fireAndSmoke/FireAndSmoke';
import SplineLine from '../../../../../elements/spline/SplineLine';
import SplinePoints from '../../../../../elements/spline/SplinePoints';
import useTrashBlasterStore from '../hooks/useTrashBlasterStore';
import { SCENE_ROOT_POSITION } from '../utils/sceneData';

export default function FireAndSmokeLayer({
  instances,
  showEffects,
  editSplines,
  setFireAndSmokePoints,
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
              />
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
