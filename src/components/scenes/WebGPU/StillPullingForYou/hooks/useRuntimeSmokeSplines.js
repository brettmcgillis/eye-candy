import { useMemo } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three';

const ROUGH_WATERS_SMOKE_PRESET = 'Rough Waters';

const PRESET_ATTACHMENT_WEIGHTS = {
  [ROUGH_WATERS_SMOKE_PRESET]: [1, 0, 0, 0, 0, 0],
};

const anchorWorld = new THREE.Vector3();
const anchorDelta = new THREE.Vector3();

function getAttachmentWeight(presetName, pointIndex) {
  const presetWeights = PRESET_ATTACHMENT_WEIGHTS[presetName];
  return presetWeights ? (presetWeights[pointIndex] ?? 0) : 1;
}

function clonePoint(point) {
  return {
    position: point.position.clone(),
    rotation: point.rotation
      ? point.rotation.clone()
      : new THREE.Euler(0, 0, 0),
    scale: point.scale ? point.scale.clone() : new THREE.Vector3(1, 1, 1),
  };
}

export function cloneRuntimeSplines(splines) {
  return splines.map((points) => points.map(clonePoint));
}

export { ROUGH_WATERS_SMOKE_PRESET };

export default function useRuntimeSmokeSplines({
  splines,
  smokeAnchorRef,
  presetName,
}) {
  const runtimeSplines = useMemo(
    () => cloneRuntimeSplines(splines),
    [presetName, splines]
  );

  useFrame(() => {
    const smokeAnchor = smokeAnchorRef.current;
    if (!smokeAnchor) return;

    smokeAnchor.getWorldPosition(anchorWorld);

    splines.forEach((sourcePoints, splineIndex) => {
      const runtimePoints = runtimeSplines[splineIndex];
      const sourceAnchor = sourcePoints[0]?.position;
      if (!runtimePoints || !sourceAnchor) return;

      anchorDelta.subVectors(anchorWorld, sourceAnchor);

      runtimePoints.forEach((runtimePoint, pointIndex) => {
        const sourcePoint = sourcePoints[pointIndex];
        if (!sourcePoint) return;

        runtimePoint.position
          .copy(sourcePoint.position)
          .addScaledVector(
            anchorDelta,
            getAttachmentWeight(presetName, pointIndex)
          );
      });
    });
  }, -1);

  return runtimeSplines;
}
