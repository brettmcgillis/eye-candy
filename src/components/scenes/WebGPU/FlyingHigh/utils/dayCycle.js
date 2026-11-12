import * as THREE from 'three/webgpu';

import { PRESETS } from '../presets/presets';
import { skyDirection } from './sky/flight';

const ease = (x) => x * x * (3 - 2 * x);

// How far from the start look toward the other one at `t` seconds: hold,
// ease across, hold, ease back, repeating.
export function cycleDay(t, hold, transition, startDay) {
  const period = 2 * (hold + transition);
  const phase = ((t % period) + period) % period;
  let v = 1;
  if (phase < hold) v = 0;
  else if (phase < hold + transition) v = ease((phase - hold) / transition);
  else if (phase >= 2 * hold + transition) {
    v = 1 - ease((phase - 2 * hold - transition) / transition);
  }
  return startDay ? 1 - v : v;
}

// The colour grade a set of controls describes, as SkyGrade takes it.
export const gradeFrom = (c) => ({
  contrast: c.gradeContrast,
  exposure: c.gradeExposure,
  grain: c.gradeGrain,
  high: c.gradeHigh,
  highAmt: c.gradeHighAmt,
  lift: c.gradeLift,
  rays: c.gradeRays,
  sat: c.gradeSat,
  shadow: c.gradeShadow,
  shadowAmt: c.gradeShadowAmt,
  temp: c.gradeTemp,
  tint: c.gradeTint,
  vignette: c.gradeVignette,
});

// The rig's fill lights a set of controls describes.
const fillFrom = (c) => ({
  ambientColor: new THREE.Color(c.lightAmbientColor),
  ambientIntensity: c.lightAmbientIntensity,
  ground: new THREE.Color(c.lightSkyGroundColor),
  sky: new THREE.Color(c.lightSkySkyColor),
  skyIntensity: c.lightSkyIntensity,
});

// The two ends of the cycle are the Night and Day presets' own looks.
export const LOOKS = {
  day: { fill: fillFrom(PRESETS.Day), grade: gradeFrom(PRESETS.Day) },
  night: { fill: fillFrom(PRESETS.Night), grade: gradeFrom(PRESETS.Night) },
};

const { lerp } = THREE.MathUtils;
const COLOURS = ['shadow', 'high'];
const colours = (grade) =>
  Object.fromEntries(COLOURS.map((k) => [k, new THREE.Color(grade[k])]));
const nightColours = colours(LOOKS.night.grade);
const dayColours = colours(LOOKS.day.grade);
const blended = { ...LOOKS.night.grade, ...colours(LOOKS.night.grade) };

// What sunrise and sunset pull the grade toward: warm highlights over
// violet shadows.
const GOLDEN = {
  high: new THREE.Color('#ffc58a'),
  highAmt: 0.3,
  sat: 1.15,
  shadow: new THREE.Color('#4b3f86'),
  shadowAmt: 0.35,
  temp: 0.3,
  tint: 0.1,
};

// The grade between night (0) and day (1), drawn toward GOLDEN by `glow`.
// One shared object, refilled on each call, since the cycle asks every
// frame.
export function blendGrade(t, glow = 0) {
  Object.keys(LOOKS.night.grade).forEach((k) => {
    if (COLOURS.includes(k)) {
      blended[k].copy(nightColours[k]).lerp(dayColours[k], t);
      if (GOLDEN[k]) blended[k].lerp(GOLDEN[k], glow);
    } else {
      blended[k] = lerp(LOOKS.night.grade[k], LOOKS.day.grade[k], t);
      if (k in GOLDEN) blended[k] = lerp(blended[k], GOLDEN[k], glow);
    }
  });
  return blended;
}

// Where a set sun or moon rests, in degrees below the horizon.
const SET = -8;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smoothstep = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// How golden the sun's light is, low in the sky; the same as the sky
// shaders' nsWarm.
export const sunWarmth = (sunY) => 1 - smoothstep(0.02, 0.25, sunY);

// How much the sky glows with sunrise or sunset; the shaders' nsDusk.
const duskGlow = (sunY) =>
  smoothstep(-0.13, -0.03, sunY) * (1 - smoothstep(0.03, 0.17, sunY));

// The sun and moon for a day value, in sky space. The sun climbs from below
// the horizon to its elevation as day goes 0.4 to 1, the moon as day goes
// 0.6 to 0, so a cycle sets one as it raises the other, each at a steady
// pace. The higher body is the key light, fading in from just under the
// horizon to ~10 degrees, and out wherever the two cross, so the hand-over
// happens in the dark; `warm` is how golden a low sun's light is, `glow`
// how much the sky glows with it.
export function bodies(day, c) {
  const sunEl = lerp(SET, c.skySunEl, clamp01((day - 0.4) / 0.6));
  const moonEl = lerp(SET, c.skyLightEl, clamp01((0.6 - day) / 0.6));
  const sun = skyDirection(c.skySunAz, sunEl);
  const moon = skyDirection(c.skyLightAz, moonEl);
  const sunKey = sunEl >= moonEl;
  return {
    glow: duskGlow(sun.y),
    key: sunKey ? sun : moon,
    keyI:
      smoothstep(-3, 10, Math.max(sunEl, moonEl)) *
      smoothstep(0, 4, Math.abs(sunEl - moonEl)),
    moon,
    sun,
    warm: sunKey ? sunWarmth(sun.y) : 0,
  };
}
