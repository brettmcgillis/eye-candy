import { BODY_TRACKING_MODE } from '../../../../../../hooks/pose/useMediaPipeBodyTracking';

export const ENVIRONMENTS = {
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
  // ---- Tracking ----
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

  // ---- Simulation ----
  runSimulation: true,
  particles: 8192 * 4,
  maxParticles: 8192 * 16,
  particleSize: 1,
  speed: 1,
  noise: 1,
  stiffness: 3,
  restDensity: 1,
  dynamicViscosity: 0.1,
  gravityX: 0,
  gravityY: 0,
  gravityZ: 0.2,
  bloom: true,

  // ---- Color ----
  colorMode: 'Presence',
  colorScale: 3,
  colorA: '#101040',
  colorB: '#ff66cc',

  // ---- Interactivity ----
  interactivityEnabled: false,
  interactionMode: 'attract',
  enableGestureToggle: false,
  attractorRadius: 9,
  landmarksPerPerson: 8,
  xScale: 18,
  yScale: -18,
  zScale: 20,
  yOffset: 28,
  zOffset: 26,
  // WS1 — signed body field
  outlineStrength: 3,
  coreRepelStrength: 2,
  coreRepelRadius: 14,
  fieldMode: 'positive',
  fieldAutoRate: 0.05,
  // WS2 — motion → sim
  motionToNoise: 0.8,
  motionToSpeed: 0.5,
  motionToCohesion: 0.5,
  motionSensitivity: 1.2,
  calmRate: 0.6,
  agitateRate: 5,
  armsToGravity: 0.6,
  impulseGain: 0.6,
  impulseThreshold: 0.6,
  impulseLead: 6,
  impulseMax: 4,
  // multi-person colour ownership
  perPersonHue: true,
  hueBase: 0,
  hueSpread: 0.18,
  hueBlend: 1,

  // ---- Ambient (WS0) ----
  autonomousMotion: true,
  autonomousRate: 1,
  autonomousDepth: 1,
  ghostApparitions: true,
  ghostStrength: 1.2,
  ghostCount: 3,
  ghostRadius: 7,

  // ---- Presence (WS3) ----
  presenceEnabled: false,
  enterThreshold: 0.5,
  exitThreshold: 0.4,
  enterDwell: 0.4,
  engageDwell: 1,
  exitDwell: 1.2,
  dissolveTime: 2.5,
  presenceRamp: 2,
  sensedPulseStrength: 1.2,
  sensedPulseDecay: 1.5,
  dormantParticleScale: 0.55,
  dormantBloomScale: 0.7,

  // ---- Audio (WS4) ----
  audioInEnabled: false,
  audioBassGain: 0.4,
  audioHighGain: 0.6,
  audioBeatGain: 1.5,
  audioOutEnabled: false,
  bpm: 90,
  subdivision: '8n',
  root: 'A',
  scale: 'pentatonicMinor',
  customScaleText: '0,3,5,7,10',
  octaveLow: 3,
  octaveHigh: 5,
  voiceCap: 3,

  // ---- Debug ----
  showAttractors: false,
  // Gizmo Scale is display-only (1 = sphere radius matches the attractor's
  // grid-unit influence radius, which overlaps heavily; 0.5 reads as markers).
  attractorGizmoScale: 0.5,
  attractorOpacity: 0.22,
  colorBySource: false,
  showImpulseLeads: true,
  showBounds: true,

  // ---- Stage ----
  environmentMode: ENVIRONMENTS.flow,
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

// The black-void stage shared by every interactive/showcase preset.
const VOID_STAGE = {
  environmentMode: ENVIRONMENTS.outsideSpaceTime,
  // Particle Y always spans 0..1 (center 0.5) — the renderer never recenters Y.
  boundsCenterY: 0.5,
  boundsCenterZ: 0,
  boundsDepth: 1,
  boundsSize: 1,
  particleDepthScale: 1,
  particleZOffset: -0.5,
  autoOrbit: true,
  autoOrbitSpeed: 0.12,
};

// Presets are named snapshots of WHICH LAYERS ARE ON (see the modality table in
// todo.md). "As-is" = every interaction layer off. Each row of the table below
// maps to one preset:
//
//   Preset                   Ghost LFO Viewer Motion AudioIn AudioOut Presence
//   Showcase (as-is)          on   on    –      –       –        –        –
//   Viewer                    on   on  silh.   on       –        –        on
//   Viewer + Audio-reactive   on   on  silh.   on      on        –        on
//   Viewer + Audio-gen        on   on  silh.   on       –       on        on
//   Audio-reactive only       on   on    –      –      on        –        –
//   Audio-gen only            on   on    –      –       –       on        –

// All interaction layers off: ghosts + LFO carry it. The cold-open demo.
const SHOWCASE = {
  ...FLOW_BASE,
  ...VOID_STAGE,
  interactivityEnabled: false,
  presenceEnabled: false,
  audioInEnabled: false,
  audioOutEnabled: false,
  autonomousMotion: true,
  autonomousDepth: 1.1,
  ghostApparitions: true,
  ghostCount: 4,
  ghostStrength: 1.4,
  bloom: true,
  autoOrbitSpeed: 0.14,
};

// Walk-past wall: presence conductor on, silhouette field forms/dissolves with
// viewers, motion mappings live. The base for the audio variants.
const VIEWER = {
  ...FLOW_BASE,
  ...VOID_STAGE,
  interactivityEnabled: true,
  enableGestureToggle: true,
  presenceEnabled: true,
  fieldMode: 'positive',
  audioInEnabled: false,
  audioOutEnabled: false,
  autoOrbitSpeed: 0.1,
};

export const PRESETS = {
  // As-is showpiece.
  Showcase: SHOWCASE,

  // Viewer-driven silhouette.
  Viewer: VIEWER,
  'Viewer + Audio-reactive': { ...VIEWER, audioInEnabled: true },
  'Viewer + Audio-gen': { ...VIEWER, audioOutEnabled: true },

  // Ambient (no viewer) but audio-coupled.
  'Audio-reactive only': {
    ...SHOWCASE,
    audioInEnabled: true,
  },
  'Audio-gen only': {
    ...SHOWCASE,
    audioOutEnabled: true,
  },

  // The absence is the portrait: dense field, body carves a person-shaped void.
  'Negative Space': {
    ...VIEWER,
    fieldMode: 'negative',
    restDensity: 1.8,
    particles: 8192 * 8,
    outlineStrength: 3.5,
    coreRepelStrength: 0,
    perPersonHue: false,
  },

  // Original aesthetic look presets (HDR-lit flow + plain void). These mirror
  // the reference flow sim: pure gravity + noise, no ambient ghost attractors
  // or autonomous gravity/noise LFO.
  Flow: {
    ...FLOW_BASE,
    autonomousMotion: false,
    ghostApparitions: false,
  },
  'Outside Space and Time': {
    ...FLOW_BASE,
    ...VOID_STAGE,
    bloom: false,
    autonomousMotion: false,
    ghostApparitions: false,
  },
};

export const DEFAULT_PRESET = 'Showcase';
