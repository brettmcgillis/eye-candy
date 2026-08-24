import { useMemo } from 'react';

import {
  averagePosePoints,
  mapPoseAnchorToWorld,
  mapPoseNormalizedOffsetToWorld,
  mapPosePointToWorld,
  mapPoseWorldOffsetToWorld,
  namePoseLandmarks,
} from './poseLandmarkUtils';

const emptyState = {
  poses: [],
  primary: null,
  position: null,
  landmarks: null,
  mappedLandmarks: null,
  worldLandmarks: null,
};

function averageVisibility(landmarks) {
  if (!landmarks?.length) return 0;

  const visibleCount = landmarks.reduce((sum, landmark) => {
    const visibility = landmark?.visibility ?? 1;
    return sum + visibility;
  }, 0);

  return visibleCount / landmarks.length;
}

function mapNamedLandmarks(
  namedLandmarks,
  namedWorldLandmarks,
  hipCenter,
  mapping
) {
  if (!namedLandmarks) return null;

  const anchorPosition = hipCenter
    ? mapPoseAnchorToWorld(hipCenter, mapping)
    : null;
  const worldHipCenter = namedWorldLandmarks
    ? averagePosePoints([
        namedWorldLandmarks.leftHip,
        namedWorldLandmarks.rightHip,
      ])
    : null;
  const useWorldLandmarks = Boolean(
    anchorPosition && namedWorldLandmarks && worldHipCenter
  );

  return Object.fromEntries(
    Object.entries(namedLandmarks)
      .filter(([, point]) => Boolean(point))
      .map(([name, point]) => {
        if (useWorldLandmarks && namedWorldLandmarks[name]) {
          const worldPoint = namedWorldLandmarks[name];

          return [
            name,
            mapPoseWorldOffsetToWorld(
              {
                x: worldPoint.x - worldHipCenter.x,
                y: worldPoint.y - worldHipCenter.y,
                z: worldPoint.z - worldHipCenter.z,
              },
              mapping
            ),
          ];
        }

        if (hipCenter) {
          return [
            name,
            mapPoseNormalizedOffsetToWorld(point, hipCenter, mapping),
          ];
        }

        return [name, mapPosePointToWorld(point, mapping)];
      })
  );
}

export default function usePoseControls(
  results,
  { xScale = 6, yScale = 4, zScale = 6, depthOffset = 0 } = {}
) {
  return useMemo(() => {
    if (!results?.landmarks?.length) {
      return emptyState;
    }

    const poses = results.landmarks
      .map((landmarks, index) => {
        const namedLandmarks = namePoseLandmarks(landmarks);
        const namedWorldLandmarks = namePoseLandmarks(
          results.worldLandmarks?.[index]
        );
        const hipCenter = averagePosePoints([
          namedLandmarks?.leftHip,
          namedLandmarks?.rightHip,
        ]);
        const shoulderCenter = averagePosePoints([
          namedLandmarks?.leftShoulder,
          namedLandmarks?.rightShoulder,
        ]);

        return {
          index,
          rawLandmarks: landmarks,
          rawWorldLandmarks: results.worldLandmarks?.[index] ?? null,
          landmarks: namedLandmarks,
          mappedLandmarks: mapNamedLandmarks(
            namedLandmarks,
            namedWorldLandmarks,
            hipCenter,
            {
              xScale,
              yScale,
              zScale,
              depthOffset,
            }
          ),
          worldLandmarks: namedWorldLandmarks,
          hipCenter,
          shoulderCenter,
          position: hipCenter
            ? mapPoseAnchorToWorld(hipCenter, {
                xScale,
                yScale,
                zScale,
                depthOffset,
              })
            : null,
          visibility: averageVisibility(landmarks),
        };
      })
      .sort((a, b) => b.visibility - a.visibility);

    const primary = poses[0] ?? null;

    return {
      poses,
      primary,
      position: primary?.position ?? null,
      landmarks: primary?.landmarks ?? null,
      mappedLandmarks: primary?.mappedLandmarks ?? null,
      worldLandmarks: primary?.worldLandmarks ?? null,
    };
  }, [results, xScale, yScale, zScale, depthOffset]);
}
