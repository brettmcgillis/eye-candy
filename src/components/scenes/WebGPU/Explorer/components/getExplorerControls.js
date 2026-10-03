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
  altitude: 0.12,
  altitudeBand: 0.04,
  altitudeHold: 1.2,
  agentRadius: 0.02,
  agentRunning: true,
  albedo: '#ffffff',
  ambientColor: '#16343a',
  ambientStrength: 0.12,
  aoStep: 0.012,
  aoFloor: 0.125,
  aoStrength: 0,
  avoidance: 2.5,
  bounceDamping: 0.4,
  cameraClearance: 0.012,
  cameraClear: 0.06,
  comfort: 0.03,
  coronaDensity: 1,
  coronaThickness: 0.004,
  confine: true,
  creviceDarkening: 0,
  cruiseMax: 9,
  cruiseMin: 4,
  cruiseSpeed: 0.04,
  exposure: 1.8,
  fogColor: '#010407',
  fogDensity: 0,
  filmic: 1,
  folds: 7,
  gloss: 24,
  hugDistance: 0.03,
  hugStrength: 1.5,
  haloStrength: 0.05,
  followDistance: 0.2,
  followFov: 60,
  followPitch: 8,
  followTurn: 1.5,
  leash: 0.8,
  leashStrength: 1.5,
  levelFlight: 0.6,
  lightWrap: 1,
  lightColor: '#ffffff',
  lanternRange: 0.7,
  lightFacing: 0.5,
  lightFalloff: 1,
  lightIntensity: 1.3,
  lookAhead: 0.05,
  margin: 0.02,
  minBoom: 0.035,
  maxSteps: 96,
  normalEpsilon: 0.003,
  opennessBias: 1.2,
  paletteAmp: 1,
  paletteBias: 1,
  paletteDecay: 0.533,
  paletteFreq: 1,
  palettePhase: 0,
  paletteSpan: 2,
  paletteSpread: 0.55,
  peerMax: 3.5,
  peerMin: 1.5,
  peerSpeed: 0.01,
  periodXZ: 2,
  periodY: 2,
  pivotX: 0,
  pivotY: 0.95,
  pivotZ: 1,
  probeRange: 0.15,
  renderScale: 0.6,
  rockNoiseScale: 1,
  rockVariation: 0.5,
  saturation: 0,
  scaleBase: 1.3,
  scaleGain: 0.95,
  shadowBias: 0.008,
  shadowDepth: 0.5,
  shadowHardness: 4,
  shadowSteps: 12,
  specular: 0.25,
  spawnX: 0.435,
  spawnY: 0.215,
  spawnZ: 0.535,
  sphereBrightness: 2.5,
  sphereCore: '#ffe0b0',
  sphereEdge: '#ff7326',
  sphereRadius: 0.008,
  steamAbsorb: 1.5,
  steamBoil: 0.6,
  steamEnabled: true,
  steamFade: 2,
  steamGrowth: 0.008,
  steamLifespan: 2,
  steamNoiseScale: 120,
  steamRise: 0.01,
  steamScatter: 6,
  steamStartSize: 1.3,
  steamSteps: 12,
  steamWisp: 0.45,
  stepSafety: 1,
  postGamma: 1,
  surfaceEpsilon: 0.0003,
  timeScale: 1,
  trailDensity: 1,
  turnRate: 1.6,
  twist: Math.PI / 5.5,
  vignette: 0.6,
  waterAbsorbB: 0.8,
  waterAbsorbG: 1.1,
  waterAbsorbR: 2.5,
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
        altitude: slider(v.altitude, 'Cruise Altitude', 0.02, 1.5, 0.001),
        altitudeBand: slider(
          v.altitudeBand,
          'Altitude Band',
          0.005,
          0.5,
          0.001
        ),
        altitudeHold: slider(v.altitudeHold, 'Altitude Hold', 0, 6, 0.01),
        levelFlight: slider(v.levelFlight, 'Level Flight', 0, 1, 0.001),
        hugDistance: slider(v.hugDistance, 'Hug Distance', 0.01, 0.3, 0.001),
        hugStrength: slider(v.hugStrength, 'Hug Strength', 0, 6, 0.01),
        avoidance: slider(v.avoidance, 'Avoidance', 0, 8, 0.01),
        comfort: slider(v.comfort, 'Comfort', 0.01, 0.4, 0.001),
        bounceDamping: slider(v.bounceDamping, 'Bounce Damping', 0, 1, 0.01),
        leash: slider(v.leash, 'Leash', 0.2, 6, 0.01),
        leashStrength: slider(v.leashStrength, 'Leash Pull', 0, 6, 0.01),
        specular: 0.25,
        spawnX: slider(v.spawnX, 'Spawn X', -4, 4, 0.001),
        spawnY: slider(v.spawnY, 'Spawn Y', -4, 6, 0.001),
        spawnZ: slider(v.spawnZ, 'Spawn Z', -4, 4, 0.001),
      },
      { collapsed: true }
    ),
    Chase: folder(
      {
        followDistance: slider(v.followDistance, 'Distance', 0.01, 1.5, 0.001),
        followPitch: slider(v.followPitch, 'Pitch°', -30, 80, 0.1),
        followTurn: slider(v.followTurn, 'Turn Smoothing', 0.1, 8, 0.01),
        minBoom: slider(v.minBoom, 'Min Distance', 0.005, 0.5, 0.001),
        lookAhead: slider(v.lookAhead, 'Look Ahead', 0, 1.5, 0.001),
        followFov: slider(v.followFov, 'FOV', 25, 110, 0.5),
        cameraClearance: slider(v.cameraClearance, 'Clearance', 0, 0.4, 0.001),
      },
      { collapsed: true }
    ),
    Light: folder(
      {
        lightColor: { label: 'Colour', value: v.lightColor },
        lightIntensity: slider(v.lightIntensity, 'Intensity', 0, 8, 0.001),
        lanternRange: slider(v.lanternRange, 'Range', 0.1, 4, 0.01),
        lightFalloff: slider(v.lightFalloff, 'Falloff Trim', 0.25, 4, 0.01),
        lightFacing: slider(v.lightFacing, 'Facing (N·L)', 0, 1, 0.001),
        lightWrap: slider(v.lightWrap, 'Wrap', 0, 2, 0.001),
        shadowDepth: slider(v.shadowDepth, 'Shadow Depth', 0, 1, 0.001),
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
    Palette: folder(
      {
        paletteSpan: slider(v.paletteSpan, 'Span', 0, 6, 0.001),
        paletteDecay: slider(v.paletteDecay, 'Cooling', 0, 6, 0.001),
        paletteBias: slider(v.paletteBias, 'Bias', 0, 2, 0.001),
        paletteAmp: slider(v.paletteAmp, 'Amplitude', 0, 2, 0.001),
        paletteFreq: slider(v.paletteFreq, 'Frequency', 0, 4, 0.001),
        palettePhase: slider(v.palettePhase, 'Phase', 0, 1, 0.001),
        paletteSpread: slider(v.paletteSpread, 'Spread', 0, 2, 0.001),
      },
      { collapsed: true }
    ),
    Steam: folder(
      {
        steamEnabled: { label: 'Enabled', value: v.steamEnabled },
        steamSteps: slider(v.steamSteps, 'Steps', 4, 64, 1),
        coronaDensity: slider(v.coronaDensity, 'Corona', 0, 4, 0.001),
        coronaThickness: slider(
          v.coronaThickness,
          'Corona Thickness',
          0.001,
          0.06,
          0.0001
        ),
        trailDensity: slider(v.trailDensity, 'Trail', 0, 4, 0.001),
        steamLifespan: slider(v.steamLifespan, 'Lifespan', 0.2, 12, 0.01),
        steamStartSize: slider(v.steamStartSize, 'Start Size', 0.5, 4, 0.01),
        steamGrowth: slider(v.steamGrowth, 'Growth', 0, 0.2, 0.0001),
        steamRise: slider(v.steamRise, 'Rise', -0.05, 0.2, 0.0001),
        steamFade: slider(v.steamFade, 'Fade', 0.2, 6, 0.01),
        steamScatter: slider(v.steamScatter, 'Scatter', 0, 100, 0.01),
        steamAbsorb: slider(v.steamAbsorb, 'Absorb', 0, 60, 0.01),
        steamNoiseScale: slider(v.steamNoiseScale, 'Noise Scale', 2, 200, 0.1),
        steamWisp: slider(v.steamWisp, 'Wisp', 0, 1.5, 0.001),
        steamBoil: slider(v.steamBoil, 'Boil', 0, 4, 0.001),
        cameraClear: slider(v.cameraClear, 'Camera Clear', 0, 0.2, 0.0001),
        haloStrength: slider(v.haloStrength, 'Air Glow', 0, 3, 0.001),
      },
      { collapsed: true }
    ),
    Water: folder(
      {
        waterAbsorbR: slider(v.waterAbsorbR, 'Absorb Red', 0, 30, 0.01),
        waterAbsorbG: slider(v.waterAbsorbG, 'Absorb Green', 0, 30, 0.01),
        waterAbsorbB: slider(v.waterAbsorbB, 'Absorb Blue', 0, 30, 0.01),
      },
      { collapsed: true }
    ),
    Look: folder(
      {
        albedo: { label: 'Rock', value: v.albedo },
        rockVariation: slider(v.rockVariation, 'Rock Mottle', 0, 1, 0.001),
        rockNoiseScale: slider(v.rockNoiseScale, 'Mottle Scale', 0.1, 20, 0.01),
        specular: slider(v.specular, 'Wet Sheen', 0, 2, 0.001),
        gloss: slider(v.gloss, 'Gloss', 2, 128, 0.1),
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
        fogDensity: slider(v.fogDensity, 'Fog Trim', 0, 3, 0.01),
        exposure: slider(v.exposure, 'Exposure', 0.1, 4, 0.01),
        filmic: slider(v.filmic, 'Filmic', 0, 1, 0.001),
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
