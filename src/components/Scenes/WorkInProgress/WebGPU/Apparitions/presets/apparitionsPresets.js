import { BODY_TRACKING_MODE } from '../../../../../../hooks/pose/useMediaPipeBodyTracking';

export const APPARITIONS_ENVIRONMENTS = {
  flow: 'flow',
  outsideSpaceTime: 'outsideSpaceTime',
};

export const FLOW_VOLUME_BOUNDS = {
  boundsSize: 1.101316,
  boundsCenterY: 0.5,
  boundsCenterZ: 0.244814,
  boundsDepth: 0.451689,
};

const FLOW_BASE = {
  trackingMode: BODY_TRACKING_MODE.holistic,
  maxPeople: 3,
  showVideo: false,
  showDebugSkeleton: false,
  videoSize: 1,
  minPoseDetectionConfidence: 0.6,
  minPosePresenceConfidence: 0.6,
  minTrackingConfidence: 0.6,
  minHandLandmarksConfidence: 0.6,
  minFaceDetectionConfidence: 0.6,
  minFacePresenceConfidence: 0.6,

  runSimulation: true,
  particles: 8192 * 4,
  maxParticles: 8192 * 16,
  particleSize: 1,
  speed: 1,
  noise: 1,
  stiffness: 3,
  restDensity: 1,
  dynamicViscosity: 0.1,
  gravityY: 0,
  gravityZ: 0.2,
  bloom: true,

  interactivityEnabled: false,
  interactionMode: 'attract',
  enableGestureToggle: false,
  baseStrength: 2.5,
  attractorRadius: 9,
  landmarksPerPerson: 8,
  xScale: 18,
  yScale: -18,
  zScale: 20,
  yOffset: 28,
  zOffset: 26,

  environmentMode: APPARITIONS_ENVIRONMENTS.flow,
  flowEnvironmentIntensity: 0.5,
  outsideBackgroundColor: '#000000',
  boundsLineColor: '#e5e7eb',
  boundsLineWeight: 1,
  ...FLOW_VOLUME_BOUNDS,
  particleDepthScale: 0.451689,
  particleZOffset: 0.018969,
  autoOrbit: false,
  autoOrbitSpeed: 0.22,
};

export const APPARITIONS_PRESETS = {
  Flow: FLOW_BASE,
  'Outside Space and Time': {
    ...FLOW_BASE,
    environmentMode: APPARITIONS_ENVIRONMENTS.outsideSpaceTime,
    boundsSize: 1,
    // Particle Y always spans 0..1 (center 0.5) — the renderer never recenters Y.
    boundsCenterY: 0.5,
    boundsCenterZ: 0,
    boundsDepth: 1,
    bloom: false,
    particleDepthScale: 1,
    particleZOffset: -0.5,
    autoOrbit: true,
  },
  Interactive: {
    ...FLOW_BASE,
    environmentMode: APPARITIONS_ENVIRONMENTS.outsideSpaceTime,
    interactivityEnabled: true,
    enableGestureToggle: true,
    autoOrbit: true,
  },
};

export const DEFAULT_APPARITIONS_PRESET = 'Flow';
