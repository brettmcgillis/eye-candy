/* eslint-disable no-continue, no-param-reassign */
import { mulberry32 } from '@utils/noise2d';

import curlFlow from './flow';
import ROLE_MODES from './roleModes';

// Field space is x in [0, aspect], y in [0, 1] — resolution independent, so
// every size control reads as a fraction of field height.
const SEPARATION_PASSES = 3;
const EMISSION_EPSILON = 1e-3;

// 1 at the wall, easing to 0 once `gap` reaches the margin.
function edgeWeight(gap, margin) {
  return Math.min(1, Math.max(0, (margin - gap) / margin));
}

export default function createSwarm({ aspect, count, seed = 1 }) {
  const rand = mulberry32(seed);
  let fieldAspect = aspect;
  const particles = [];
  const flow = [0, 0];
  const heading = [0, 0];
  let orbitPhase = 0;

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

  // A body's own radius is the wall, so what stays on screen is the disc and
  // not just its centre. Capped at half the field for the degenerate case
  // where Radius is larger than the window is wide.
  function wallGap(p, params) {
    return Math.min(
      params.particleRadius * p.radiusScale,
      fieldAspect * 0.5,
      0.5
    );
  }

  // Curl noise knows nothing about the frame it is being watched through, so
  // there are always stretches of boundary the flow points straight out of.
  // Mirroring at the wall only fixed one step of that: the field steered the
  // body back out on the next, and a slow Speed left it grinding along the
  // edge for a minute at a time, which is what piled bodies into the corners.
  //
  // Blending the HEADING instead turns a body away before it arrives, and at
  // the wall the drift is ignored entirely. Unit vectors in, unit vector out,
  // so no amount of curl can overpower it — the mistake the original border
  // push made by adding to a velocity that was normalised afterwards.
  function steerInward(out, p, params, ux, uy) {
    out[0] = ux;
    out[1] = uy;

    const margin = params.edgeMargin;
    if (margin <= 0) return;

    const r = wallGap(p, params);
    const inX =
      edgeWeight(p.x - r, margin) - edgeWeight(fieldAspect - r - p.x, margin);
    const inY = edgeWeight(p.y - r, margin) - edgeWeight(1 - r - p.y, margin);
    const inLen = Math.hypot(inX, inY);

    if (inLen < 1e-6) return;

    const w = Math.min(1, inLen);
    const ease = w * w * (3 - 2 * w);
    const bx = ux * (1 - ease) + (inX / inLen) * ease;
    const by = uy * (1 - ease) + (inY / inLen) * ease;
    const len = Math.hypot(bx, by) || 1;

    out[0] = bx / len;
    out[1] = by / len;
  }

  function confine(p, params) {
    const r = wallGap(p, params);

    p.x = Math.min(Math.max(p.x, r), fieldAspect - r);
    p.y = Math.min(Math.max(p.y, r), 1 - r);
  }

  // Port of the rings shader in plans/youre-looking-radiant.md. Its uv is
  // height-normalised and centred, which is field space shifted to the middle,
  // and its `uv *= rotation` accumulates across rings, so ring j sits at the
  // triangular-number multiple of the twist. y is flipped because shader y
  // points up and field y points down.
  function placeOrbits(dt, params, ctx, mode) {
    const dots = Math.max(1, Math.round(params.orbitDots));
    const rings = Math.max(1, Math.round(params.orbitRings));
    const twist = (params.orbitTwist * Math.PI) / 180;
    const gap = params.orbitGap * params.particleRadius;

    orbitPhase += dt * params.orbitSpeed;

    for (let i = 0; i < count; i += 1) {
      const p = particles[i];
      const ring = Math.floor(i / dots);
      const theta = (twist * ring * (ring + 1)) / 2;
      const angle = ((i % dots) + orbitPhase) * ((Math.PI * 2) / dots);
      const cx = params.orbitOffset + params.orbitRadius * Math.cos(angle);
      const cy = params.orbitRadius * Math.sin(angle);
      const c = Math.cos(theta);
      const sn = Math.sin(theta);

      // Every ring passes within a dot's width of the centre, and outside
      // that the shader's timing never lets two dots meet. Pushing distance
      // from the centre through sqrt(d² + gap²) opens a hole there and
      // leaves everything further out almost exactly where it was.
      const x = cx * c + cy * sn;
      const y = -cx * sn + cy * c;
      const d = Math.hypot(x, y);
      const lifted = Math.sqrt(d * d + gap * gap);
      const push = d > 1e-9 ? lifted / d : 0;

      p.hidden = ring >= rings;
      p.x = fieldAspect * 0.5 + (d > 1e-9 ? x * push : gap);
      p.y = 0.5 - y * push;

      mode.step(p, ctx);
      if (p.dead) respawn(p, ctx);
    }
  }

  function step(dt, time, params) {
    const ctx = { aspect: fieldAspect, dt, params, rand, time };
    const mode = ROLE_MODES[params.roleMode] ?? ROLE_MODES.age;

    if (params.layout === 'orbits') {
      placeOrbits(dt, params, ctx, mode);
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

      const len = Math.hypot(vx, vy) || 1;
      const r = wallGap(p, params);

      steerInward(heading, p, params, vx / len, vy / len);

      const move = params.speed * dt;
      let ux = heading[0] * move;
      let uy = heading[1] * move;

      // Last resort behind the steering: mirror a step that would still cross.
      // Only ever reverses motion INTO a wall, because a body already outside
      // — the frame a resize lands on — must keep its inward motion.
      if (ux < 0 ? p.x + ux < r : p.x + ux > fieldAspect - r) ux = -ux;
      if (uy < 0 ? p.y + uy < r : p.y + uy > 1 - r) uy = -uy;

      p.x += ux;
      p.y += uy;

      mode.step(p, ctx);
      if (p.dead) respawn(p, ctx);
    }

    separate(params);

    // After separation, not before: pushing one pair apart routinely shoves a
    // third body through a wall, and nothing renders between here and there.
    for (let i = 0; i < count; i += 1) confine(particles[i], params);
  }

  // Fills two flat lists, in pixels. One body per particle, and one light per
  // particle that is actually emitting — a disc is its own light source, so
  // nothing here needs several lights to stand in for one body.
  function writeScene(out, params, palette, scale) {
    let lightCount = 0;

    for (let i = 0; i < count; i += 1) {
      const p = particles[i];
      let size = p.radiusScale;
      if (params.layout === 'orbits') size = p.hidden ? 0 : 1;
      const radius = params.particleRadius * size * p.presence * scale;
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

  // Field x runs 0..aspect, so narrowing the window moves the right wall left
  // and strands everything past it outside the frame. Remapping proportionally
  // squeezes the composition instead, which keeps the arrangement you were
  // looking at rather than walking a dozen bodies home one at a time.
  function setAspect(next) {
    if (!(next > 0)) return;

    if (fieldAspect > 0 && next !== fieldAspect) {
      const scale = next / fieldAspect;

      for (let i = 0; i < count; i += 1) particles[i].x *= scale;
    }

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
