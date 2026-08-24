import * as THREE from 'three';

import { PRIORITY } from './attractorBus';

const GRID_CENTER = 32;

// Autonomous phantom apparitions (WS0). Even with nobody present, a few
// procedurally drifting attractor points trace slow Lissajous paths through the
// bounds, fading in and out so faint coloured forms wander the void. This is the
// bridge to WS3 Dormant, but stands alone as the as-is performance.
export default function createGhostSource(maxGhosts = 6) {
  const ghosts = [];
  for (let i = 0; i < maxGhosts; i += 1) {
    ghosts.push({
      seed: Math.random() * 1000,
      fx: 0.03 + Math.random() * 0.04,
      fy: 0.025 + Math.random() * 0.04,
      fz: 0.02 + Math.random() * 0.03,
      px: Math.random() * Math.PI * 2,
      py: Math.random() * Math.PI * 2,
      pz: Math.random() * Math.PI * 2,
      fadeFreq: 0.04 + Math.random() * 0.05,
      fadePhase: Math.random() * Math.PI * 2,
      hue: Math.random(),
      hueDrift: (Math.random() - 0.5) * 0.008,
      attractor: {
        position: new THREE.Vector3(),
        strength: 0,
        radius: 7,
        hue: 0,
        priority: PRIORITY.ghost,
      },
    });
  }

  let elapsed = 0;
  const out = [];

  function update(dt, options = {}) {
    const { count = 3, strength = 1.2, radius = 7, gain = 1 } = options;
    elapsed += dt;
    out.length = 0;

    const active = Math.min(count, ghosts.length);
    for (let i = 0; i < active; i += 1) {
      const g = ghosts[i];
      const t = elapsed + g.seed;
      const amp = 15;

      g.attractor.position.set(
        GRID_CENTER + Math.sin(t * g.fx + g.px) * amp,
        GRID_CENTER + Math.sin(t * g.fy + g.py) * amp * 0.9,
        GRID_CENTER + Math.sin(t * g.fz + g.pz) * amp
      );

      // Cosine breathing so ghosts fade in and out rather than blinking.
      const fade = 0.5 + 0.5 * Math.sin(t * g.fadeFreq + g.fadePhase);
      g.hue = (g.hue + g.hueDrift * dt * 60 + 1) % 1;

      g.attractor.strength = strength * fade * gain;
      g.attractor.radius = radius;
      g.attractor.hue = g.hue;

      if (g.attractor.strength > 0.001) out.push(g.attractor);
    }

    return out;
  }

  return { update };
}
