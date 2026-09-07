import { folder } from 'leva';

// Without the reference's bounding box there is nothing for a ray to escape
// into, so the marcher is the scene's entire cost. The two levers that move it
// are Render Scale and, far more than it looks, the lantern's Range: capping
// the march where the light dies took the frame from 79 to 35 ns/pixel on an
// M-series GPU. Max Steps and Shadow Steps are already slack at the shipped
// Range and buy nothing until you open it up.
//
// Step Safety is *not* a quality dial in this field. The estimator is so
// conservative that shortening the step keeps finding more geometry — mean
// frame luminance runs 49 / 33 / 17 at 0.6 / 1.0 / 2.0 — so it trades how
// dense the lattice reads against how long it takes, and never converges.
// 1.0 is the Shadertoy's own step.
//
// Every length here is in the fractal's own units — the scene multiplies by
// Cavern Scale on sync, so the look survives a scale change. The defaults come
// from a survey of the field: its chambers top out near 0.22 across, and at a
// clearance of 0.02 roughly a third of the volume is free with 99% of that in
// one connected pocket, which is what makes it flyable at all.
const DEFAULTS = {
  accel: 1.5,
  agentRadius: 0.05,
  agentRunning: true,
  albedo: '#8c8075',
  ambientColor: '#101a2b',
  ambientStrength: 0.35,
  aoStep: 0.012,
  aoFloor: 0.125,
  aoStrength: 1,
  avoidance: 2.5,
  bounceDamping: 0.4,
  cameraClearance: 0.05,
  comfort: 0.09,
  confine: false,
  creviceDarkening: 0,
  cruiseMax: 9,
  cruiseMin: 4,
  cruiseSpeed: 0.13,
  exposure: 1,
  fogColor: '#000000',
  fogDensity: 1,
  folds: 7,
  followDistance: 0.16,
  followFov: 60,
  followHeight: 0.04,
  followStiffness: 2.2,
  leash: 1.4,
  leashStrength: 1.5,
  lightColor: '#ffb761',
  lanternRange: 1,
  lightFalloff: 1,
  lightIntensity: 6,
  lookAhead: 0.25,
  margin: 0.09,
  maxSteps: 56,
  normalEpsilon: 0.001,
  opennessBias: 2.5,
  peerMax: 3.5,
  peerMin: 1.5,
  peerSpeed: 0.03,
  periodXZ: 2,
  periodY: 2,
  pivotX: 0,
  pivotY: 0.95,
  pivotZ: 1,
  probeRange: 0.5,
  renderScale: 0.6,
  saturation: 0,
  scaleBase: 1.3,
  scaleGain: 0.95,
  shadowBias: 0.008,
  shadowHardness: 10,
  shadowSteps: 12,
  smokeBuoyancy: 0.02,
  smokeCount: 4096,
  smokeDrag: 1.1,
  smokeEmissive: 0.12,
  smokeEmissiveColor: '#ff8033',
  smokeEnabled: false,
  smokeFade: 1.6,
  smokeGrowth: 2.2,
  smokeLifespan: 4,
  smokeMaxPixels: 96,
  smokeOpacity: 0.07,
  smokeRise: 0.12,
  smokeScatter: 1,
  smokeShadowHardness: 6,
  smokeShadowStride: 8,
  smokeShadowSteps: 16,
  smokeSize: 4,
  sortPasses: 12,
  curlDrift: 0.15,
  curlFrequency: 7,
  curlStrength: 0.12,
  ejectSpeed: 0.06,
  inheritVelocity: 0.6,
  spawnX: -0.066,
  spawnY: 1.004,
  spawnZ: 0.996,
  sphereBrightness: 2.5,
  sphereCore: '#ffe0b0',
  sphereEdge: '#ff7326',
  sphereRadius: 0.03,
  stepSafety: 1,
  postGamma: 0.85,
  surfaceEpsilon: 0.0003,
  timeScale: 1,
  turnRate: 1.6,
  twist: Math.PI / 5.5,
  vignette: 0.6,
  wander: 0.12,
  worldScale: 20,
};

const slider = (value, label, min, max, step) => ({
  label,
  max,
  min,
  step,
  value,
});

export default function getExplorerControls(folderPath, defaultValues = {}) {
  const v = { ...DEFAULTS, ...defaultValues };

  return {
    Caverns: folder(
      {
        confine: { label: 'Confine to Tree', value: v.confine },
        folds: slider(v.folds, 'Folds', 1, 12, 1),
        scaleBase: slider(v.scaleBase, 'Branch Scale', 0.5, 2.5, 0.001),
        scaleGain: slider(v.scaleGain, 'Scale Gain', -1, 2, 0.001),
        twist: slider(v.twist, 'Twist', -Math.PI, Math.PI, 0.001),
        periodY: slider(v.periodY, 'Period Y', 0.5, 6, 0.01),
        periodXZ: slider(v.periodXZ, 'Period XZ', 0.5, 6, 0.01),
        worldScale: slider(v.worldScale, 'Cavern Scale', 1, 80, 0.5),
        pivotX: slider(v.pivotX, 'Pivot X', -4, 4, 0.001),
        pivotY: slider(v.pivotY, 'Pivot Y', -4, 6, 0.001),
        pivotZ: slider(v.pivotZ, 'Pivot Z', -4, 4, 0.001),
      },
      { collapsed: true }
    ),
    Explorer: folder(
      {
        agentRunning: { label: 'Fly', value: v.agentRunning },
        timeScale: slider(v.timeScale, 'Time Scale', 0, 4, 0.01),
        cruiseSpeed: slider(v.cruiseSpeed, 'Cruise Speed', 0, 0.5, 0.001),
        peerSpeed: slider(v.peerSpeed, 'Peer Speed', 0, 0.2, 0.001),
        turnRate: slider(v.turnRate, 'Turn Rate', 0.1, 8, 0.01),
        accel: slider(v.accel, 'Acceleration', 0.1, 8, 0.01),
        probeRange: slider(v.probeRange, 'Probe Range', 0.05, 2, 0.01),
        opennessBias: slider(v.opennessBias, 'Openness Bias', 0.5, 6, 0.01),
        wander: slider(v.wander, 'Wander', 0, 0.6, 0.001),
        cruiseMin: slider(v.cruiseMin, 'Cruise Min', 0.5, 20, 0.1),
        cruiseMax: slider(v.cruiseMax, 'Cruise Max', 0.5, 20, 0.1),
        peerMin: slider(v.peerMin, 'Peer Min', 0.25, 10, 0.05),
        peerMax: slider(v.peerMax, 'Peer Max', 0.25, 10, 0.05),
        agentRadius: slider(v.agentRadius, 'Body Radius', 0.005, 0.2, 0.001),
        margin: slider(v.margin, 'Wall Margin', 0.01, 0.4, 0.001),
        avoidance: slider(v.avoidance, 'Avoidance', 0, 8, 0.01),
        comfort: slider(v.comfort, 'Comfort', 0.01, 0.4, 0.001),
        bounceDamping: slider(v.bounceDamping, 'Bounce Damping', 0, 1, 0.01),
        leash: slider(v.leash, 'Leash', 0.2, 6, 0.01),
        leashStrength: slider(v.leashStrength, 'Leash Pull', 0, 6, 0.01),
        spawnX: slider(v.spawnX, 'Spawn X', -4, 4, 0.001),
        spawnY: slider(v.spawnY, 'Spawn Y', -4, 6, 0.001),
        spawnZ: slider(v.spawnZ, 'Spawn Z', -4, 4, 0.001),
      },
      { collapsed: true }
    ),
    Chase: folder(
      {
        followDistance: slider(v.followDistance, 'Distance', 0.02, 1.5, 0.001),
        followHeight: slider(v.followHeight, 'Height', -0.5, 0.5, 0.001),
        lookAhead: slider(v.lookAhead, 'Look Ahead', 0, 1.5, 0.001),
        followStiffness: slider(v.followStiffness, 'Stiffness', 0.2, 12, 0.01),
        followFov: slider(v.followFov, 'FOV', 25, 110, 0.5),
        cameraClearance: slider(v.cameraClearance, 'Clearance', 0, 0.4, 0.001),
      },
      { collapsed: true }
    ),
    Light: folder(
      {
        lightColor: { label: 'Colour', value: v.lightColor },
        lightIntensity: slider(v.lightIntensity, 'Intensity', 0, 40, 0.01),
        lanternRange: slider(v.lanternRange, 'Range', 0.1, 4, 0.01),
        lightFalloff: slider(v.lightFalloff, 'Falloff Trim', 0.25, 4, 0.01),
        shadowHardness: slider(v.shadowHardness, 'Shadow Hardness', 1, 64, 0.1),
        shadowBias: slider(v.shadowBias, 'Shadow Bias', 0.001, 0.06, 0.0001),
        shadowSteps: slider(v.shadowSteps, 'Shadow Steps', 4, 96, 1),
        sphereCore: { label: 'Sphere Core', value: v.sphereCore },
        sphereEdge: { label: 'Sphere Edge', value: v.sphereEdge },
        sphereBrightness: slider(
          v.sphereBrightness,
          'Sphere Glow',
          0,
          12,
          0.01
        ),
        sphereRadius: slider(
          v.sphereRadius,
          'Sphere Radius',
          0.005,
          0.15,
          0.001
        ),
      },
      { collapsed: true }
    ),
    Smoke: folder(
      {
        smokeEnabled: { label: 'Enabled', value: v.smokeEnabled },
        smokeCount: {
          label: 'Particles',
          options: [4096, 8192, 16384, 32768, 65536],
          value: v.smokeCount,
        },
        smokeLifespan: slider(v.smokeLifespan, 'Lifespan', 0.5, 20, 0.01),
        ejectSpeed: slider(v.ejectSpeed, 'Eject Speed', 0, 0.5, 0.001),
        inheritVelocity: slider(
          v.inheritVelocity,
          'Inherit Motion',
          0,
          2,
          0.01
        ),
        curlStrength: slider(v.curlStrength, 'Curl Strength', 0, 1, 0.001),
        curlFrequency: slider(v.curlFrequency, 'Curl Frequency', 0.2, 40, 0.1),
        curlDrift: slider(v.curlDrift, 'Curl Drift', 0, 2, 0.01),
        smokeBuoyancy: slider(v.smokeBuoyancy, 'Buoyancy', -0.2, 0.2, 0.001),
        smokeDrag: slider(v.smokeDrag, 'Drag', 0, 6, 0.01),
        smokeSize: slider(v.smokeSize, 'Size', 0.5, 40, 0.1),
        smokeGrowth: slider(v.smokeGrowth, 'Growth', 0, 8, 0.01),
        smokeMaxPixels: slider(v.smokeMaxPixels, 'Max Sprite px', 8, 512, 1),
        smokeOpacity: slider(v.smokeOpacity, 'Opacity', 0.005, 0.5, 0.001),
        smokeRise: slider(v.smokeRise, 'Fade In', 0.01, 0.6, 0.001),
        smokeFade: slider(v.smokeFade, 'Fade Out', 0.2, 6, 0.01),
        smokeScatter: slider(v.smokeScatter, 'Scatter', 0, 4, 0.01),
        smokeEmissiveColor: { label: 'Emissive', value: v.smokeEmissiveColor },
        smokeEmissive: slider(v.smokeEmissive, 'Emissive Level', 0, 2, 0.001),
        smokeShadowHardness: slider(
          v.smokeShadowHardness,
          'Shadow Hardness',
          1,
          48,
          0.1
        ),
        smokeShadowSteps: slider(v.smokeShadowSteps, 'Shadow Steps', 4, 64, 1),
        smokeShadowStride: slider(
          v.smokeShadowStride,
          'Shadow Stride',
          1,
          24,
          1
        ),
        sortPasses: slider(v.sortPasses, 'Sort Passes/Frame', 1, 140, 1),
      },
      { collapsed: true }
    ),
    Look: folder(
      {
        albedo: { label: 'Rock', value: v.albedo },
        ambientColor: { label: 'Ambient', value: v.ambientColor },
        ambientStrength: slider(
          v.ambientStrength,
          'Ambient Level',
          0,
          3,
          0.001
        ),
        aoStrength: slider(v.aoStrength, 'AO', 0, 4, 0.01),
        aoFloor: slider(v.aoFloor, 'AO Floor', 0, 1, 0.001),
        creviceDarkening: slider(
          v.creviceDarkening,
          'Crevice Darkening',
          0,
          1,
          0.01
        ),
        aoStep: slider(v.aoStep, 'AO Reach', 0.001, 0.08, 0.0001),
        fogColor: { label: 'Fog', value: v.fogColor },
        fogDensity: slider(v.fogDensity, 'Fog Trim', 0.25, 3, 0.01),
        exposure: slider(v.exposure, 'Exposure', 0.1, 4, 0.01),
        postGamma: slider(v.postGamma, 'Gamma', 0.2, 2, 0.01),
        saturation: slider(v.saturation, 'Saturation', -2, 1, 0.01),
        vignette: slider(v.vignette, 'Vignette', 0, 1, 0.01),
      },
      { collapsed: true }
    ),
    Render: folder(
      {
        renderScale: slider(v.renderScale, 'Render Scale', 0.25, 1, 0.05),
        maxSteps: slider(v.maxSteps, 'Max Steps', 32, 512, 1),
        stepSafety: slider(v.stepSafety, 'Step Safety', 0.25, 4, 0.01),
        surfaceEpsilon: slider(
          v.surfaceEpsilon,
          'Surface Epsilon',
          0.00002,
          0.002,
          0.00001
        ),
        normalEpsilon: slider(
          v.normalEpsilon,
          'Normal Epsilon',
          0.0002,
          0.01,
          0.0001
        ),
      },
      { collapsed: true }
    ),
  };
}

export { DEFAULTS };
