import { folder } from 'leva';

import { BODY_TRACKING_MODE } from '../../../../../../../hooks/pose/useMediaPipeBodyTracking';

const confidence = (label, value) => ({
  label,
  value,
  min: 0.1,
  max: 1,
  step: 0.01,
});

export default function getTrackingControls(snapshot) {
  return folder(
    {
      trackingMode: {
        label: 'Tracking Mode',
        options: {
          Pose: BODY_TRACKING_MODE.pose,
          Holistic: BODY_TRACKING_MODE.holistic,
        },
        value: snapshot.trackingMode,
      },
      maxPeople: {
        label: 'People',
        value: snapshot.maxPeople,
        min: 1,
        max: 4,
        step: 1,
      },
      showVideo: { label: 'Show Video', value: snapshot.showVideo },
      showDebugSkeleton: {
        label: 'Show Skeleton',
        value: snapshot.showDebugSkeleton,
      },
      videoSize: {
        label: 'Video Size',
        value: snapshot.videoSize,
        min: 0.25,
        max: 2,
        step: 0.05,
      },
      minPoseDetectionConfidence: confidence(
        'Min Detection',
        snapshot.minPoseDetectionConfidence
      ),
      minPosePresenceConfidence: confidence(
        'Min Presence',
        snapshot.minPosePresenceConfidence
      ),
      minTrackingConfidence: confidence(
        'Min Tracking',
        snapshot.minTrackingConfidence
      ),
      minHandLandmarksConfidence: confidence(
        'Min Hands',
        snapshot.minHandLandmarksConfidence
      ),
      minFaceDetectionConfidence: confidence(
        'Min Face Detect',
        snapshot.minFaceDetectionConfidence
      ),
      minFacePresenceConfidence: confidence(
        'Min Face Presence',
        snapshot.minFacePresenceConfidence
      ),
    },
    { collapsed: true }
  );
}
