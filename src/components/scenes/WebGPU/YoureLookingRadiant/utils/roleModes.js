/* eslint-disable no-param-reassign */

// What drives a particle between emitting light and occluding it. Each mode
// writes `emission` (1 = full emitter, 0 = pure occluder) and `presence`
// (0 = not yet/no longer in the field, used to fade radius so nothing pops),
// and may set `dead` to ask the swarm to respawn it.
//
// Keyed registry so a new modality is one entry here plus its controls — the
// sim itself never learns the mode names.

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

const ROLE_MODES = {
  age: {
    label: 'Age & Respawn',
    // Staggered on first fill so the population is not synchronised, but a
    // respawn starts a full life — otherwise a particle reappears part-worn,
    // already past the fade-in, and pops in at full size.
    init(p, ctx) {
      p.life = ctx.rand();
    },
    spawn(p) {
      p.life = 1;
    },
    step(p, ctx) {
      p.life -= ctx.params.dieSpeed * ctx.dt;
      if (p.life <= 0) {
        p.dead = true;
        return;
      }
      p.emission = smoothstep(0.3, 0.7, p.life);
      p.presence = smoothstep(0, 0.1, p.life) * smoothstep(1, 0.9, p.life);
    },
  },

  oscillate: {
    label: 'Slow Oscillation',
    init(p, ctx) {
      p.phase = ctx.rand() * Math.PI * 2;
      p.rate = 0.7 + ctx.rand() * 0.6;
    },
    step(p, ctx) {
      p.phase += (ctx.dt * p.rate * Math.PI * 2) / ctx.params.oscillatePeriod;
      p.emission = smoothstep(-0.35, 0.35, Math.sin(p.phase));
      p.presence = 1;
    },
  },
};

export const ROLE_MODE_OPTIONS = Object.fromEntries(
  Object.entries(ROLE_MODES).map(([id, mode]) => [mode.label, id])
);

export default ROLE_MODES;
