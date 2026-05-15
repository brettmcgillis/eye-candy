import React, { useMemo } from 'react';

import { HolisticLandmarker } from '@mediapipe/tasks-vision';
import { Line, Sphere } from '@react-three/drei';

import {
  POSE_CONNECTIONS,
  POSE_LANDMARK_NAMES,
  averagePosePoints,
  mapPoseNormalizedOffsetToWorld,
} from '../../../../../hooks/pose/poseLandmarkUtils';

function buildMappedPointList(points, hipCenter, mapping, keyPrefix) {
  if (!points?.length || !hipCenter) return [];

  return points.map((point, index) => ({
    key: `${keyPrefix}-${index}`,
    position: mapPoseNormalizedOffsetToWorld(point, hipCenter, mapping),
  }));
}

function buildMappedConnectionList(points, connections, keyPrefix) {
  if (!points?.length) return [];

  return connections.flatMap((connection) => {
    const startIndex = Array.isArray(connection)
      ? connection[0]
      : connection?.start;
    const endIndex = Array.isArray(connection)
      ? connection[1]
      : connection?.end;

    if (!Number.isInteger(startIndex) || !Number.isInteger(endIndex)) {
      return [];
    }

    const start = points[startIndex]?.position;
    const end = points[endIndex]?.position;

    if (!start || !end) return [];

    return [
      {
        key: `${keyPrefix}-${startIndex}-${endIndex}`,
        points: [start, end],
      },
    ];
  });
}

export default function PoseLandmarksDebug({
  pose,
  trackingResults,
  mapping = { xScale: 6, yScale: 4, zScale: 6 },
  offset = [0, 0, 0],
  pointColor = '#38bdf8',
  connectorColor = '#f97316',
  pointRadius = 0.035,
  connectorOpacity = 0.85,
}) {
  const { points, connectors, facePoints, faceConnectors, handPoints } =
    useMemo(() => {
      if (!pose?.mappedLandmarks) {
        return {
          connectors: [],
          faceConnectors: [],
          facePoints: [],
          handPoints: [],
          points: [],
        };
      }

      const nextPoints = POSE_LANDMARK_NAMES.flatMap((name, index) => {
        const position = pose.mappedLandmarks[name];
        if (!position) return [];

        return [
          {
            key: `${name}-${index}`,
            position,
          },
        ];
      });

      const nextConnectors = POSE_CONNECTIONS.flatMap(
        ([startIndex, endIndex]) => {
          const start = pose.mappedLandmarks[POSE_LANDMARK_NAMES[startIndex]];
          const end = pose.mappedLandmarks[POSE_LANDMARK_NAMES[endIndex]];

          if (!start || !end) return [];

          return [
            {
              key: `${startIndex}-${endIndex}`,
              points: [start, end],
            },
          ];
        }
      );

      if (trackingResults?.mode !== 'holistic') {
        return {
          connectors: nextConnectors,
          faceConnectors: [],
          facePoints: [],
          handPoints: [],
          points: nextPoints,
        };
      }

      const primaryPoseLandmarks = trackingResults.landmarks?.[0];
      const hipCenter = primaryPoseLandmarks
        ? averagePosePoints([
            primaryPoseLandmarks[23],
            primaryPoseLandmarks[24],
          ])
        : null;

      const mappedLeftHand = buildMappedPointList(
        trackingResults.leftHandLandmarks?.[0],
        hipCenter,
        mapping,
        'left-hand'
      );
      const mappedRightHand = buildMappedPointList(
        trackingResults.rightHandLandmarks?.[0],
        hipCenter,
        mapping,
        'right-hand'
      );
      const mappedFace = buildMappedPointList(
        trackingResults.faceLandmarks?.[0],
        hipCenter,
        mapping,
        'face'
      );

      return {
        connectors: [
          ...nextConnectors,
          ...buildMappedConnectionList(
            mappedLeftHand,
            HolisticLandmarker.HAND_CONNECTIONS,
            'left-hand-connection'
          ),
          ...buildMappedConnectionList(
            mappedRightHand,
            HolisticLandmarker.HAND_CONNECTIONS,
            'right-hand-connection'
          ),
        ],
        faceConnectors: buildMappedConnectionList(
          mappedFace,
          HolisticLandmarker.FACE_LANDMARKS_FACE_OVAL,
          'face-connection'
        ),
        facePoints: mappedFace,
        handPoints: [...mappedLeftHand, ...mappedRightHand],
        points: nextPoints,
      };
    }, [mapping, pose, trackingResults]);

  return (
    <group position={offset}>
      {connectors.map((connector) => (
        <Line
          key={connector.key}
          points={connector.points}
          color={connectorColor}
          lineWidth={1.5}
          transparent
          opacity={connectorOpacity}
        />
      ))}
      {faceConnectors.map((connector) => (
        <Line
          key={connector.key}
          points={connector.points}
          color={connectorColor}
          lineWidth={1}
          transparent
          opacity={connectorOpacity * 0.8}
        />
      ))}
      {points.map((point) => (
        <Sphere
          key={point.key}
          args={[pointRadius, 12, 12]}
          position={point.position}
        >
          <meshStandardMaterial color={pointColor} emissive={pointColor} />
        </Sphere>
      ))}
      {handPoints.map((point) => (
        <Sphere
          key={point.key}
          args={[pointRadius * 0.8, 10, 10]}
          position={point.position}
        >
          <meshStandardMaterial color={pointColor} emissive={pointColor} />
        </Sphere>
      ))}
      {facePoints.map((point) => (
        <Sphere
          key={point.key}
          args={[pointRadius * 0.35, 8, 8]}
          position={point.position}
        >
          <meshStandardMaterial
            color={pointColor}
            emissive={pointColor}
            transparent
            opacity={0.9}
          />
        </Sphere>
      ))}
    </group>
  );
}
