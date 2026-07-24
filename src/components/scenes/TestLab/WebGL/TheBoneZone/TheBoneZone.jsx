import { useControls } from 'leva';

import React from 'react';

import { Grid, OrbitControls, PerspectiveCamera } from '@react-three/drei';

import useMediaPipeBodyTracking, {
  BODY_TRACKING_MODE,
} from '../../../../../hooks/pose/useMediaPipeBodyTracking';
import usePoseControls from '../../../../../hooks/pose/usePoseControls';
import PoseDrivenSkeleton from './PoseDrivenSkeleton';
import PoseLandmarksDebug from './PoseLandmarksDebug';

export default function TheBoneZone() {
  const mediaPipe = useControls(
    'MediaPipe Tracking',
    {
      trackingMode: {
        label: 'Mode',
        options: {
          Holistic: BODY_TRACKING_MODE.holistic,
          Pose: BODY_TRACKING_MODE.pose,
        },
        value: BODY_TRACKING_MODE.pose,
      },
      showVideo: { label: 'Show Video', value: true },
      showDebugSkeleton: { label: 'Show Overlay Landmarks', value: true },
      landmarkColor: { label: 'Landmark Color', value: '#38bdf8' },
      connectorColor: { label: 'Connector Color', value: '#f97316' },
      landmarkRadius: { label: 'Landmark Radius', value: 4, min: 1, max: 10 },
      connectorLineWidth: {
        label: 'Connector Line Width',
        value: 3,
        min: 1,
        max: 10,
      },
      videoSize: {
        label: 'Video Size (x)',
        value: 1,
        min: 0.1,
        max: 3,
        step: 0.1,
      },
      minPoseDetectionConfidence: {
        label: 'Min Detection',
        value: 0.6,
        min: 0.1,
        max: 1,
        step: 0.01,
      },
      minPosePresenceConfidence: {
        label: 'Min Presence',
        value: 0.6,
        min: 0.1,
        max: 1,
        step: 0.01,
      },
      minTrackingConfidence: {
        label: 'Min Pose Tracking',
        value: 0.6,
        min: 0.1,
        max: 1,
        step: 0.01,
      },
      minHandLandmarksConfidence: {
        label: 'Min Hand Landmarks',
        value: 0.6,
        min: 0.1,
        max: 1,
        step: 0.01,
      },
      minFaceDetectionConfidence: {
        label: 'Min Face Detection',
        value: 0.6,
        min: 0.1,
        max: 1,
        step: 0.01,
      },
      minFacePresenceConfidence: {
        label: 'Min Face Presence',
        value: 0.6,
        min: 0.1,
        max: 1,
        step: 0.01,
      },
    },
    { collapsed: true }
  );

  const mapping = useControls(
    'Pose Mapping',
    {
      xScale: { label: 'X', value: 6, min: 1, max: 12, step: 0.1 },
      yScale: { label: 'Y', value: 4, min: 1, max: 12, step: 0.1 },
      zScale: { label: 'Z', value: 6, min: 1, max: 16, step: 0.1 },
      depthOffset: {
        label: 'Depth Offset',
        value: 0,
        min: -1,
        max: 1,
        step: 0.01,
      },
    },
    { collapsed: true }
  );

  const skeleton = useControls(
    'Skeleton',
    {
      showModel: { label: 'Show Model', value: true },
      scaleMultiplier: {
        label: 'Scale Multiplier',
        value: 1.75,
        min: 0.25,
        max: 4,
        step: 0.01,
      },
      rotationLerp: {
        label: 'Rotation Lerp',
        value: 0.2,
        min: 0.01,
        max: 1,
        step: 0.01,
      },
      visibilityThreshold: {
        label: 'Visibility Threshold',
        value: 0.45,
        min: 0,
        max: 1,
        step: 0.01,
      },
      baseY: {
        label: 'Base Y',
        value: 0,
        min: -3,
        max: 3,
        step: 0.01,
      },
    },
    { collapsed: true }
  );

  const debug = useControls(
    'Debug',
    {
      showLandmarks: { label: 'Show 3D Landmarks', value: true },
      offsetX: {
        label: 'Debug X',
        value: 2.5,
        min: -8,
        max: 8,
        step: 0.1,
      },
      pointRadius: {
        label: 'Point Radius',
        value: 0.035,
        min: 0.005,
        max: 0.15,
        step: 0.001,
      },
      pointColor: { label: 'Point Color', value: '#38bdf8' },
      connectorColor: { label: '3D Connector Color', value: '#f97316' },
      connectorOpacity: {
        label: '3D Connector Opacity',
        value: 0.85,
        min: 0,
        max: 1,
        step: 0.01,
      },
    },
    { collapsed: true }
  );

  const results = useMediaPipeBodyTracking({
    mode: mediaPipe.trackingMode,
    minPoseDetectionConfidence: mediaPipe.minPoseDetectionConfidence,
    minPosePresenceConfidence: mediaPipe.minPosePresenceConfidence,
    minTrackingConfidence: mediaPipe.minTrackingConfidence,
    minHandLandmarksConfidence: mediaPipe.minHandLandmarksConfidence,
    minFaceDetectionConfidence: mediaPipe.minFaceDetectionConfidence,
    minFacePresenceConfidence: mediaPipe.minFacePresenceConfidence,
    showVideo: mediaPipe.showVideo,
    showDebugSkeleton: mediaPipe.showDebugSkeleton,
    landmarkStyle: {
      color: mediaPipe.landmarkColor,
      radius: mediaPipe.landmarkRadius,
    },
    connectorStyle: {
      color: mediaPipe.connectorColor,
      lineWidth: mediaPipe.connectorLineWidth,
    },
    videoSize: mediaPipe.videoSize,
  });

  const poseState = usePoseControls(results, mapping);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 1.5, 6]} fov={45} />
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 6, 4]} intensity={2} />
      <directionalLight position={[-4, 3, -3]} intensity={0.8} />
      <color attach="background" args={['#0f172a']} />
      <OrbitControls />
      <Grid
        args={[16, 16]}
        cellColor="#334155"
        sectionColor="#94a3b8"
        position={[0, -2, 0]}
        infiniteGrid
        fadeDistance={32}
        fadeStrength={2}
      />
      {skeleton.showModel && (
        <PoseDrivenSkeleton
          pose={poseState.primary}
          trackingResults={results}
          mapping={mapping}
          scaleMultiplier={skeleton.scaleMultiplier}
          rotationLerp={skeleton.rotationLerp}
          visibilityThreshold={skeleton.visibilityThreshold}
          basePosition={[0, skeleton.baseY, 0]}
        />
      )}
      {debug.showLandmarks && poseState.primary && (
        <PoseLandmarksDebug
          pose={poseState.primary}
          trackingResults={results}
          mapping={mapping}
          offset={[debug.offsetX, skeleton.baseY, 0]}
          pointRadius={debug.pointRadius}
          pointColor={debug.pointColor}
          connectorColor={debug.connectorColor}
          connectorOpacity={debug.connectorOpacity}
        />
      )}
    </>
  );
}
