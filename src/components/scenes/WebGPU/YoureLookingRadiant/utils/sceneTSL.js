/* eslint-disable no-param-reassign */
import {
  Loop,
  cos,
  float,
  mix,
  select,
  sin,
  uniform,
  uniformArray,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { NO_HIT, rotate2D, sdArc } from '@modules/radialShadow';

// Lights and bodies are separate lists: one body per particle, but several
// lights spread along it, because a long arc lit from one point glows from its
// middle. Both loops run to a live count rather than the array cap, so a scene
// with a handful of particles does not pay for the maximum it could hold.
export const MAX_LIGHTS = 128;
export const MAX_BODIES = 32;

function filled(count, factory) {
  return Array.from({ length: count }, factory);
}

export function createSceneUniforms() {
  return {
    bodyColor: uniformArray(
      filled(MAX_BODIES, () => new THREE.Color(0, 0, 0)),
      'color'
    ),
    bodyCount: uniform(0, 'int'),
    // vec4(centreX, centreY, orbitRadius, angle) in pixels.
    bodyData: uniformArray(
      filled(MAX_BODIES, () => new THREE.Vector4(0, 0, 0, 0)),
      'vec4'
    ),
    // vec4(occluderThickness, bodyThickness, emission, halfAperture).
    bodyInfo: uniformArray(
      filled(MAX_BODIES, () => new THREE.Vector4(0, 0, 0, 0)),
      'vec4'
    ),
    lightColor: uniformArray(
      filled(MAX_LIGHTS, () => new THREE.Color(0, 0, 0)),
      'color'
    ),
    lightCount: uniform(0, 'int'),
    // vec4(x, y, radius, intensity) — intensity <= 0 means "not emitting".
    lightData: uniformArray(
      filled(MAX_LIGHTS, () => new THREE.Vector4(0, 0, 0, 0)),
      'vec4'
    ),
    // Which body each light belongs to, so the march can skip its own.
    lightOwner: uniformArray(
      filled(MAX_LIGHTS, () => 0),
      'float'
    ),
  };
}

// sdArc is symmetric about +y, so rotate the point into the arc's own frame
// before evaluating it.
function arcDistance(u, worldPos, i, thickness) {
  const data = u.bodyData.element(i);
  // Per body, not one shared uniform: the reference gives every ring its own
  // sweep, and a field of identically-swept arcs reads as a machine part.
  const aperture = u.bodyInfo.element(i).w;
  const local = rotate2D(worldPos.sub(data.xy), float(Math.PI / 2).sub(data.w));
  const sc = vec2(sin(aperture), cos(aperture));

  return sdArc(local, sc, data.z, thickness);
}

// Signed distance to everything that occludes, skipping the body the marching
// light belongs to. A light sits on its own arc, so without the exclusion
// every ray it casts terminates on itself at t = 0 and the whole frame reads
// as shadowed.
export function buildSceneSDF(u) {
  return (worldPos, exclude) => {
    const best = float(NO_HIT).toVar();

    Loop({ end: u.bodyCount, start: 0, type: 'int' }, ({ i }) => {
      const mine = float(i).equal(exclude);
      const dist = arcDistance(u, worldPos, i, u.bodyInfo.element(i).x);

      best.assign(select(mine, best, best.min(dist)));
    });

    return best;
  };
}

// Nearest visible body: its distance, the albedo to paint it with, and how
// much light it is putting out.
//
// The albedo crosses from the occluder tint to the field colour as a particle
// lights up, so an emitter has no surface of its own — exactly like CrossTalk's
// lights. What you see where it sits is `glow` fed into the same accumulator
// the halo comes from, and multiplied by the same albedo, so the body and its
// radiance are continuous rather than a flat disc sitting on top of a gradient.
//
// Returns plain node fields rather than an Fn: an Fn returns one node, and
// splitting this into two would walk every body twice.
export function buildBodySDF(u, occluderTint, fieldColor) {
  return (worldPos) => {
    const nearest = vec4(0, 0, 0, NO_HIT).toVar();
    const glow = vec3(0).toVar();

    Loop({ end: u.bodyCount, start: 0, type: 'int' }, ({ i }) => {
      const info = u.bodyInfo.element(i);
      const dist = arcDistance(u, worldPos, i, info.y);
      const albedo = mix(occluderTint, fieldColor, info.z);
      const closer = dist.lessThan(nearest.w);

      nearest.assign(select(closer, vec4(albedo, dist), nearest));
      glow.assign(select(closer, u.bodyColor.element(i).mul(info.z), glow));
    });

    return { albedo: nearest.xyz, dist: nearest.w, glow };
  };
}

export function updateSceneUniforms(u, buffers, counts) {
  for (let i = 0; i < counts.lightCount; i += 1) {
    const light = buffers.lights[i];
    u.lightData.array[i].set(light.x, light.y, light.radius, light.intensity);
    u.lightColor.array[i].set(light.color);
    u.lightOwner.array[i] = light.owner;
  }

  for (let i = 0; i < counts.bodyCount; i += 1) {
    const body = buffers.bodies[i];
    u.bodyData.array[i].set(body.centerX, body.centerY, body.orbit, body.angle);
    u.bodyInfo.array[i].set(
      body.occluderRadius,
      body.bodyRadius,
      body.emission,
      body.aperture
    );
    u.bodyColor.array[i].set(body.color);
  }

  u.lightCount.value = counts.lightCount;
  u.bodyCount.value = counts.bodyCount;
}
