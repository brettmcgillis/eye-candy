import { Fn, sin, vec3 } from 'three/tsl';

// Registry of strange-attractor vector fields. Each entry carries the same
// equation twice: `derivative` is a TSL Fn(position, b) -> vec3 for the
// GPU-compute swarm, `deriveJS(position, b) -> [dx, dy, dz]` is the plain-JS
// twin the CPU-stepped field-line walkers use (see components/FieldLines.jsx)
// — keeping both next to each other makes it easy to check they stay in
// sync. `defaults`/`ranges` seed the shared Leva controls. Add a new
// attractor by adding an entry here — createAttractorSwarm, FieldLines, and
// getSwarmControls all read this registry, so nothing else needs to change.
const attractorFields = {
  'Thomas Labyrinth': {
    defaults: { b: 0.1 },
    ranges: { b: [0, 0.5, 0.001] },
    derivative: Fn(([position, b]) => {
      const { x, y, z } = position;
      return vec3(
        sin(y).sub(b.mul(x)),
        sin(z).sub(b.mul(y)),
        sin(x).sub(b.mul(z))
      );
    }),
    deriveJS: (position, b) => [
      Math.sin(position.y) - b * position.x,
      Math.sin(position.z) - b * position.y,
      Math.sin(position.x) - b * position.z,
    ],
  },
};

export default attractorFields;
