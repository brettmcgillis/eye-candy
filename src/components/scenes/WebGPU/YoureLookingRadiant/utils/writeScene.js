/* eslint-disable no-continue, no-param-reassign */
import { EMISSION_EPSILON, readBody } from '@modules/radiantSwarm';

const body = {};

// Fills two flat lists, in pixels. One body per particle, and one light per
// particle that is actually emitting — a disc is its own light source, so
// nothing here needs several lights to stand in for one body.
export default function writeScene(out, swarm, params, palette, scale) {
  let lightCount = 0;

  for (let i = 0; i < swarm.count; i += 1) {
    const p = swarm.particles[i];
    readBody(body, p, params);
    const radius = body.radius * scale;
    const color = palette[body.colorIndex % palette.length];

    const target = out.bodies[i];
    target.x = p.x * scale;
    target.y = p.y * scale;
    target.radius = radius;
    target.occluderRadius = body.occluderRadius * scale;
    target.emission = body.emission;
    target.refract = body.glass ? 1 : 0;
    target.color = color;

    if (body.glass || p.emission <= EMISSION_EPSILON) continue;

    const light = out.lights[lightCount];

    light.x = target.x;
    light.y = target.y;
    light.radius = radius;
    light.intensity = p.emission * params.lightStrength;
    light.owner = i;
    light.color = color;

    lightCount += 1;
  }

  return { bodyCount: swarm.count, lightCount };
}

export function createSceneBuffers(maxLights, maxBodies) {
  return {
    bodies: Array.from({ length: maxBodies }, () => ({
      color: '#ffffff',
      emission: 0,
      occluderRadius: 0,
      radius: 0,
      refract: 0,
      x: 0,
      y: 0,
    })),
    lights: Array.from({ length: maxLights }, () => ({
      color: '#ffffff',
      intensity: 0,
      owner: 0,
      radius: 0,
      x: 0,
      y: 0,
    })),
  };
}
