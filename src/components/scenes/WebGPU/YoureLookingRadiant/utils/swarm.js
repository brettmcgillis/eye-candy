/* eslint-disable no-continue, no-param-reassign */
import { mulberry32 } from '@utils/noise2d';

import curlFlow from './flow';
import ROLE_MODES from './roleModes';

// Field space is x in [0, aspect], y in [0, 1] — resolution independent, so
// every size control reads as a fraction of field height.

// A body is one analytic arc concentric with the field centre: its radius is
// how far the particle has drifted from the middle, its angle is where it sits
// around it, and Arc Span is how far it sweeps. Zero span is a plain disc.
// This replaced a chain of capsules following the particle's path — enough
// capsules looked smooth but none of them was, and the piles of short ones
// read as clutter rather than curves. One arc is exact at any length.
const SEPARATION_PASSES = 3;
const EMISSION_EPSILON = 1e-3;

// Speed is authored for drift across the field; as an angular rate it needs
// scaling up to land near 3cKczD's 0.6-1.0 rad/s.
const ARC_SPIN_SCALE = 12;

export default function createSwarm({ aspect, count, seed = 1 }) {
  const rand = mulberry32(seed);
  let fieldAspect = aspect;
  const particles = [];
  const flow = [0, 0];
  let clock = 0;

  function respawn(p, ctx) {
    p.angle = rand() * Math.PI * 2;
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
      // Concentric rings at fixed radii, each with its own rate and direction,
      // straight from 3cKczD's ring loop. Radius is assigned here and never
      // drifts — deriving it from the particle's position instead made the
      // arcs expand and contract, which is not what the reference does.
      orbitT: (i + 0.5) / count,
      spin: (0.6 + rand() * 0.4) * (i % 2 === 0 ? 1 : -1),
      spanScale: 0.25 + rand() * 0.75,
      sweepPhase: rand() * Math.PI * 2,
      angle: rand() * Math.PI * 2,
      dead: false,
      emission: 1,
      index: i,
      life: rand(),
      phase: rand() * Math.PI * 2,
      presence: 1,
      radiusScale: 0.6 + rand() * 0.9,
      rate: 1,
      x: rand() * fieldAspect,
      y: rand(),
    });
  }

  // Push overlapping bodies apart along the line between their heads, half the
  // overlap each. A few relaxation passes rather than one, because separating
  // one pair routinely pushes a particle into a third. O(n^2) over a few dozen
  // particles is nothing, and it is what stops the field reading as a pile.
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

          // Coincident heads have no direction to separate along; nudge them
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
    clock = time;
    const ctx = { aspect: fieldAspect, dt, params, rand, time };
    const mode = ROLE_MODES[params.roleMode] ?? ROLE_MODES.age;

    // Arc mode is a different motion entirely: rings turn on fixed radii, as
    // in the reference. Curl drift, border push and separation are all about
    // particles wandering a field, and none of them apply to a ring.
    if (params.arcSpan > 0) {
      for (let i = 0; i < count; i += 1) {
        const p = particles[i];

        p.angle += p.spin * params.speed * ARC_SPIN_SCALE * dt;
        p.x =
          fieldAspect * 0.5 + Math.cos(p.angle) * p.orbitT * params.arcSpread;
        p.y = 0.5 + Math.sin(p.angle) * p.orbitT * params.arcSpread;

        mode.step(p, ctx);
        if (p.dead) respawn(p, ctx);
      }
      return;
    }

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
      // wrapping, which would snap an arc across the field.
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

  // Fills two flat lists, in pixels.
  //
  // A long arc lit from a single point glows from its middle and falls dark at
  // its ends — the mechanism has no extended light source, so an emitter is
  // approximated by several point lights spread along itself, sharing its
  // output. Below about ten per arc the beads are visible.
  //
  // Only particles that are actually emitting get slots. Half the population
  // is usually occluding, and giving those a light costs a shadow-map row and
  // a compose iteration to contribute nothing — spending the budget on the
  // ones that emit roughly doubles the sample density for free.
  function writeScene(out, params, palette, scale, maxLights) {
    const centerX = fieldAspect * 0.5 * scale;
    const centerY = 0.5 * scale;
    const aperture = (params.arcSpan * Math.PI) / 180;
    let emitters = 0;
    for (let i = 0; i < count; i += 1) {
      if (particles[i].emission > EMISSION_EPSILON) emitters += 1;
    }

    const samples =
      params.arcSpan <= 0
        ? 1
        : Math.max(
            1,
            Math.min(
              params.arcLights,
              Math.floor(maxLights / Math.max(1, emitters)) || 1
            )
          );

    let lightCount = 0;

    for (let i = 0; i < count; i += 1) {
      const p = particles[i];
      const radius = params.particleRadius * p.radiusScale * p.presence;
      const color = palette[p.colorIndex % palette.length];

      const dx = p.x - fieldAspect * 0.5;
      const dy = p.y - 0.5;
      const orbit = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);

      // Each ring's sweep breathes on its own phase, as in the reference:
      // range = (sin(time + hash) * 0.45 + 0.55) * range. Pulse at 0 holds
      // every arc at its full length, at 1 it matches the reference's swing.
      const pulse =
        1 -
        params.sweepPulse * 0.45 +
        Math.sin(clock * params.sweepRate + p.sweepPhase) *
          0.45 *
          params.sweepPulse;

      const body = out.bodies[i];
      body.aperture = aperture * 0.5 * p.spanScale * pulse;
      body.centerX = centerX;
      body.centerY = centerY;
      body.orbit = orbit * scale;
      body.angle = angle;
      body.bodyRadius = radius * scale;
      body.occluderRadius = radius * (1 - p.emission) * scale;
      body.emission = p.emission;
      body.owner = i;
      body.color = color;

      if (p.emission <= EMISSION_EPSILON) continue;

      for (let s = 0; s < samples; s += 1) {
        const t =
          samples === 1 ? 0 : (s / (samples - 1) - 0.5) * body.aperture * 2;
        const at = angle + t;
        const light = out.lights[lightCount];

        light.x = centerX + Math.cos(at) * orbit * scale;
        light.y = centerY + Math.sin(at) * orbit * scale;
        light.radius = radius * scale;
        light.intensity = (p.emission * params.lightStrength) / samples;
        light.owner = i;
        light.color = color;

        lightCount += 1;
      }
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
      angle: 0,
      aperture: 0,
      bodyRadius: 0,
      centerX: 0,
      centerY: 0,
      color: '#ffffff',
      emission: 0,
      occluderRadius: 0,
      orbit: 0,
      owner: 0,
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
