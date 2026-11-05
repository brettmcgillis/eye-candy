import { folder } from 'leva';

const SMOKE_COUNTS = [4096, 8192, 16384, 32768, 65536];

const num = (snap, key, label, min, max, step) => ({
  [key]: { label, max, min, step, value: snap[key] },
});
const plain = (snap, key, label) => ({ [key]: { label, value: snap[key] } });

// The Leva folders for SplineSimFire and SplineCurlSmoke, seeded from the
// active preset's snapshot. Keys are flat `fire*` / `smoke*`.
export function fireFolder(snap, extra = {}) {
  return folder(
    {
      ...plain(snap, 'fireVisible', 'Visible'),
      ...extra,
      Solver: folder(
        {
          ...num(snap, 'fireResolution', 'Resolution', 0.5, 2, 0.05),
          ...num(snap, 'fireForceHeight', 'Force Height', 0.2, 10, 0.1),
          ...num(snap, 'fireBuoyancy', 'Buoyancy', 0, 10, 0.05),
          ...num(snap, 'fireWeight', 'Soot Weight', 0, 2, 0.01),
          ...num(snap, 'fireTurbulence', 'Turbulence', 0, 3, 0.01),
          ...num(snap, 'fireTurbFrequency', 'Turb Frequency', 1, 12, 0.1),
          ...num(snap, 'fireDamping', 'Damping', 0, 3, 0.01),
          ...plain(snap, 'fireWind', 'Wind'),
        },
        { collapsed: true }
      ),
      Emitters: folder(
        {
          ...num(snap, 'fireTemperature', 'Temperature', 1, 60, 0.5),
          ...num(snap, 'fireCooling', 'Cooling', 0.1, 8, 0.05),
          ...num(snap, 'fireSoot', 'Soot', 0, 3, 0.01),
          ...num(snap, 'fireDissipation', 'Soot Fade', 0.02, 4, 0.01),
          ...num(snap, 'fireEmitRadius', 'Radius', 0.02, 1.5, 0.01),
          ...num(snap, 'fireEmitLength', 'Length', 0, 1, 0.01),
          ...num(snap, 'fireFlicker', 'Flicker', 0, 1, 0.01),
        },
        { collapsed: true }
      ),
      Guide: folder(
        {
          ...num(snap, 'fireGuidePull', 'Pull', 0, 30, 0.1),
          ...num(snap, 'fireGuideSpeed', 'Speed', 0, 12, 0.05),
          ...num(snap, 'fireGuideRadius', 'Radius', 0.05, 2, 0.01),
          ...num(snap, 'fireGuideTaper', 'Taper', 0, 1, 0.01),
          ...num(snap, 'firePadding', 'Box Padding', 0, 3, 0.05),
          ...num(snap, 'fireHeadroom', 'Box Headroom', 0, 8, 0.1),
        },
        { collapsed: true }
      ),
      Look: folder(
        {
          ...num(snap, 'fireSteps', 'March Steps', 16, 160, 1),
          ...num(snap, 'fireIntensity', 'Intensity', 0, 6, 0.01),
          ...num(snap, 'fireGlow', 'Glow', 0.1, 120, 0.1),
          ...num(snap, 'fireSootDensity', 'Soot Density', 0, 30, 0.1),
          ...num(snap, 'fireBlue', 'Blue Base', 0, 2, 0.01),
          ...plain(snap, 'fireStartColor', 'Hot'),
          ...plain(snap, 'fireMidColor', 'Mid'),
          ...plain(snap, 'fireEndColor', 'Cool'),
          ...plain(snap, 'fireLightColor', 'Light Color'),
          ...num(snap, 'fireLightIntensity', 'Light Intensity', 0, 80, 0.1),
          ...num(snap, 'fireLightDistance', 'Light Distance', 1, 40, 0.1),
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );
}

export function smokeFolder(snap) {
  return folder(
    {
      ...plain(snap, 'smokeVisible', 'Visible'),
      smokeCount: {
        label: 'Particles',
        options: SMOKE_COUNTS,
        value: snap.smokeCount,
      },
      ...plain(snap, 'smokeColor', 'Color'),
      ...num(snap, 'smokeOpacity', 'Opacity', 0, 1, 0.001),
      ...num(snap, 'smokeAreaFade', 'Thinning', 0, 4, 0.01),
      ...num(snap, 'smokeSize', 'Size', 0.1, 40, 0.1),
      ...num(snap, 'smokeRise', 'Speed', 0, 6, 0.01),
      ...num(snap, 'smokeLife', 'Life', 1, 24, 0.1),
      ...num(snap, 'smokeLaminar', 'Laminar', 0, 4, 0.01),
      ...num(snap, 'smokeCurl', 'Curl', 0, 4, 0.01),
      ...num(snap, 'smokeHold', 'Hold To Path', 0, 1, 0.01),
      ...num(snap, 'smokeCurlScale', 'Curl Scale', 0.05, 3, 0.01),
      ...num(snap, 'smokeCurlSpeed', 'Curl Speed', 0, 1, 0.01),
      ...num(snap, 'smokeSpread', 'Spread', 0, 4, 0.01),
      ...num(snap, 'smokeSway', 'Sway', 0, 4, 0.01),
      ...num(snap, 'smokeEmitRadius', 'Emit Radius', 0, 2, 0.01),
      ...num(snap, 'smokeSeed', 'Seed', 0, 999, 1),
      ...num(snap, 'smokeGlow', 'Fire Glow', 0, 6, 0.01),
      ...plain(snap, 'smokeGlowColor', 'Glow Color'),
      ...num(snap, 'smokeGlowReach', 'Glow Reach', 0.1, 10, 0.05),
    },
    { collapsed: true }
  );
}

const vec = (v) => [v.x, v.y, v.z];

// The control values as SplineSimFire's `fire` prop.
export function fireConfig(c) {
  return {
    blue: c.fireBlue,
    buoyancy: c.fireBuoyancy,
    cooling: c.fireCooling,
    damping: c.fireDamping,
    dissipation: c.fireDissipation,
    emitLength: c.fireEmitLength,
    emitRadius: c.fireEmitRadius,
    endColor: c.fireEndColor,
    flicker: c.fireFlicker,
    forceHeight: c.fireForceHeight,
    glow: c.fireGlow,
    guidePull: c.fireGuidePull,
    guideRadius: c.fireGuideRadius,
    guideSpeed: c.fireGuideSpeed,
    guideTaper: c.fireGuideTaper,
    headroom: c.fireHeadroom,
    intensity: c.fireIntensity,
    lightColor: c.fireLightColor,
    lightDistance: c.fireLightDistance,
    lightIntensity: c.fireLightIntensity,
    look: 'realistic',
    midColor: c.fireMidColor,
    padding: c.firePadding,
    resolution: c.fireResolution,
    soot: c.fireSoot,
    sootDensity: c.fireSootDensity,
    startColor: c.fireStartColor,
    steps: c.fireSteps,
    temperature: c.fireTemperature,
    turbFrequency: c.fireTurbFrequency,
    turbulence: c.fireTurbulence,
    weight: c.fireWeight,
    wind: vec(c.fireWind),
  };
}

// The control values as SplineCurlSmoke's `smoke` prop.
export function smokeConfig(c) {
  return {
    areaFade: c.smokeAreaFade,
    color: c.smokeColor,
    count: c.smokeCount,
    curl: c.smokeCurl,
    curlScale: c.smokeCurlScale,
    curlSpeed: c.smokeCurlSpeed,
    emitRadius: c.smokeEmitRadius,
    glow: c.smokeGlow,
    glowColor: c.smokeGlowColor,
    glowReach: c.smokeGlowReach,
    hold: c.smokeHold,
    laminar: c.smokeLaminar,
    life: c.smokeLife,
    opacity: c.smokeOpacity,
    rise: c.smokeRise,
    seed: c.smokeSeed,
    size: c.smokeSize,
    spread: c.smokeSpread,
    sway: c.smokeSway,
  };
}
