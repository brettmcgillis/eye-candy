/* eslint-disable no-continue, no-param-reassign */
import { mulberry32 } from '@utils/noise2d';

import curlFlow from './flow';
import ROLE_MODES from './roleModes';

// Field space is x in [0, aspect], y in [0, 1] — resolution independent, so
// every size control reads as a fraction of field height.
const SEPARATION_PASSES = 3;
const EMISSION_EPSILON = 1e-3;

export default function createSwarm({ aspect, count, seed = 1 }) {
  const rand = mulberry32(seed);
  let fieldAspect = aspect;
  const particles = [];
  const flow = [0, 0];

  function respawn(p, ctx) {
    p.x = rand() * fieldAspect;
    p.y = rand();
    p.emission = 1;
    p.presence = 0;
    p.dead = false;

    const mode = ROLE_MODES[ctx.params.roleMode];
    mode.init(p, ctx);
    mode.spawn?.(p, ctx);
  }

  // Round-robin rather than random: with a dozen particles split four ways,
  // a random draw regularly leaves one colour with two members, and if both
  // happen to be mid-cycle that colour reads as "not emissive" when it is
  // only outnumbered.
  for (let i = 0; i < count; i += 1) {
    particles.push({
      colorIndex: i % 4,
      dead: false,
      emission: 1,
      index: i,
      life: rand(),
      phase: rand() * Math.PI * 2,
      presence: 1,
      radiusScale: 0.6 + rand() * 0.9,
      // Fixed at birth so Refract Share can be dragged without the set of
      // glass particles reshuffling under the cursor.
      refractRoll: rand(),
      rate: 1,
      x: rand() * fieldAspect,
      y: rand(),
    });
  }

  // Push overlapping bodies apart along the line between their centres, half
  // the overlap each. A few relaxation passes rather than one, because
  // separating one pair routinely pushes a particle into a third. O(n^2) over
  // a few dozen particles is nothing, and it is what stops the field reading
  // as a pile.
  function separate(params) {
    if (params.separation <= 0) return;

    for (let pass = 0; pass < SEPARATION_PASSES; pass += 1) {
      for (let i = 0; i < count; i += 1) {
        const a = particles[i];
        const ra = params.particleRadius * a.radiusScale;

        for (let j = i + 1; j < count; j += 1) {
          const b = particles[j];
          const minGap = ra + params.particleRadius * b.radiusScale;

          let dx = b.x - a.x;
          let dy = b.y - a.y;
          let d = Math.hypot(dx, dy);

          if (d >= minGap) continue;

          // Coincident centres have no direction to separate along; nudge them
          // onto a deterministic axis rather than dividing by zero.
          if (d < 1e-6) {
            dx = 1e-3;
            dy = 0;
            d = 1e-3;
          }

          const push = ((minGap - d) * 0.5 * params.separation) / d;
          a.x -= dx * push;
          a.y -= dy * push;
          b.x += dx * push;
          b.y += dy * push;
        }
      }
    }
  }

  function step(dt, time, params) {
    const ctx = { aspect: fieldAspect, dt, params, rand, time };
    const mode = ROLE_MODES[params.roleMode] ?? ROLE_MODES.age;

    for (let i = 0; i < count; i += 1) {
      const p = particles[i];

      curlFlow(flow, p.x, p.y, time, params.flowScale);

      let vx = flow[0];
      let vy = flow[1];

      if (params.pointerStrength !== 0) {
        const dx = params.pointerX - p.x;
        const dy = params.pointerY - p.y;
        const d = Math.hypot(dx, dy);
        if (d > 1e-4 && d < params.pointerRadius) {
          const falloff = 1 - d / params.pointerRadius;
          vx += (dx / d) * falloff * params.pointerStrength;
          vy += (dy / d) * falloff * params.pointerStrength;
        }
      }

      // Soft inward push near the border keeps the swarm in frame without
      // wrapping a body across the field.
      const margin = 0.12;
      vx += Math.max(0, margin - p.x) / margin;
      vx -= Math.max(0, p.x - (fieldAspect - margin)) / margin;
      vy += Math.max(0, margin - p.y) / margin;
      vy -= Math.max(0, p.y - (1 - margin)) / margin;

      const len = Math.hypot(vx, vy) || 1;
      p.x += (vx / len) * params.speed * dt;
      p.y += (vy / len) * params.speed * dt;

      mode.step(p, ctx);
      if (p.dead) respawn(p, ctx);
    }

    separate(params);
  }

  // Fills two flat lists, in pixels. One body per particle, and one light per
  // particle that is actually emitting — a disc is its own light source, so
  // nothing here needs several lights to stand in for one body.
  function writeScene(out, params, palette, scale) {
    let lightCount = 0;

    for (let i = 0; i < count; i += 1) {
      const p = particles[i];
      const radius = params.particleRadius * p.radiusScale * p.presence * scale;
      const glass = p.refractRoll < params.refractShare;
      const color = palette[p.colorIndex % palette.length];

      const body = out.bodies[i];
      body.x = p.x * scale;
      body.y = p.y * scale;
      body.radius = radius;
      // Glass neither blocks nor makes light; it only bends it.
      body.occluderRadius = glass ? 0 : radius * (1 - p.emission);
      body.emission = glass ? 0 : p.emission;
      body.refract = glass ? 1 : 0;
      body.color = color;

      if (glass || p.emission <= EMISSION_EPSILON) continue;

      const light = out.lights[lightCount];

      light.x = body.x;
      light.y = body.y;
      light.radius = radius;
      light.intensity = p.emission * params.lightStrength;
      light.owner = i;
      light.color = color;

      lightCount += 1;
    }

    return { bodyCount: count, lightCount };
  }

  function setAspect(next) {
    fieldAspect = next;
  }

  return { count, particles, setAspect, step, writeScene };
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
