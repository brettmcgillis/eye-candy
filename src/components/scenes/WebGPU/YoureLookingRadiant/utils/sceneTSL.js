/* eslint-disable no-param-reassign */
import {
  Loop,
  float,
  mix,
  select,
  uniform,
  uniformArray,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { NO_HIT } from '@modules/radialShadow';

// Every body is a circle. That is the whole scene: a population of discs, each
// one emitting, occluding or refracting. Nothing here branches on a shape id
// because there is only one shape, which is what lets the shadow pass solve
// rather than march.
export const MAX_LIGHTS = 64;
export const MAX_BODIES = 64;

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
    // vec4(x, y, occluderRadius, bodyRadius) in pixels. The occluder radius
    // shrinks toward zero as a body lights up, which is how anything here
    // stops casting a shadow.
    bodyData: uniformArray(
      filled(MAX_BODIES, () => new THREE.Vector4(0, 0, 0, 0)),
      'vec4'
    ),
    // vec4(emission, refract, 0, 0).
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
    // Which body each light belongs to, so the trace can skip its own.
    lightOwner: uniformArray(
      filled(MAX_LIGHTS, () => 0),
      'float'
    ),
  };
}

// Nearest visible body: its distance, the albedo to paint it with, and how
// much light it is putting out.
//
// The albedo crosses from the occluder tint to the body's own colour as it
// lights up. Fading to the FIELD colour instead made an emitter invisible —
// you saw dark bodies and unexplained light with nothing joining them.
//
// Returns plain node fields rather than an Fn: an Fn returns one node, and
// splitting this into two would walk every body twice.
export function buildBodySDF(u, occluderTint) {
  return (worldPos) => {
    const nearest = vec4(0, 0, 0, NO_HIT).toVar();
    const glow = vec3(0).toVar();

    Loop({ end: u.bodyCount, start: 0, type: 'int' }, ({ i }) => {
      const data = u.bodyData.element(i);
      const info = u.bodyInfo.element(i);
      const glass = info.y.greaterThan(0.5);
      const dist = select(
        glass,
        float(NO_HIT),
        worldPos.sub(data.xy).length().sub(data.w)
      );
      const albedo = mix(occluderTint, u.bodyColor.element(i), info.x);
      const closer = dist.lessThan(nearest.w);

      nearest.assign(select(closer, vec4(albedo, dist), nearest));
      glow.assign(select(closer, u.bodyColor.element(i).mul(info.x), glow));
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
    u.bodyData.array[i].set(body.x, body.y, body.occluderRadius, body.radius);
    u.bodyInfo.array[i].set(body.emission, body.refract, 0, 0);
    u.bodyColor.array[i].set(body.color);
  }

  u.lightCount.value = counts.lightCount;
  u.bodyCount.value = counts.bodyCount;
}
