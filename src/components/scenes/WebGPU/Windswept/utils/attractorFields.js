import { Fn, sin, vec3 } from 'three/tsl';

// Registry of strange-attractor vector fields. Each entry carries the same
// equation twice: `derivative` is a TSL Fn(position, ...paramNodes) -> vec3
// for the GPU-compute swarm, `deriveJS(position, paramValues) -> [dx, dy, dz]`
// is the plain-JS twin the CPU-stepped field-line walkers use (see
// components/FieldLines.jsx) — keeping both next to each other makes it
// easy to check they stay in sync. `paramNames` lists `derivative`'s
// positional params in call order — TSL Fns take individual node arguments
// rather than an object, so createFlowStep spreads uniforms in this order
// to stay generic across attractors with different arities. `key` is a
// short, unique prefix used to namespace each param's flat Leva key (see
// getSwarmControls.js's paramKey) so e.g. Thomas's `b` and Four-Wing
// Butterfly's `b` don't collide. `defaults`/`ranges` (keyed by param name)
// seed each control. Add a new attractor by adding an entry here —
// createAttractorSwarm, FieldLines, and getSwarmControls all read this
// registry, so nothing else needs to change.
const attractorFields = {
  'Thomas Labyrinth': {
    key: 'thomas',
    paramNames: ['b'],
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
    deriveJS: (position, params) => [
      Math.sin(position.y) - params.b * position.x,
      Math.sin(position.z) - params.b * position.y,
      Math.sin(position.x) - params.b * position.z,
    ],
  },
  'Four-Wing Butterfly': {
    key: 'butterfly',
    paramNames: ['a', 'b', 'c'],
    defaults: { a: 0.2, b: 0.01, c: -0.4 },
    ranges: {
      a: [0.1, 0.5, 0.01],
      b: [-0.1, 0.1, 0.001],
      c: [-1.0, 0.0, 0.01],
    },
    derivative: Fn(([position, a, b, c]) => {
      const { x, y, z } = position;
      return vec3(
        a.mul(x).add(y.mul(z)),
        b.mul(x).add(c.mul(y)).sub(x.mul(z)),
        z.negate().sub(x.mul(y))
      );
    }),
    deriveJS: (position, params) => {
      const { x, y, z } = position;
      return [
        params.a * x + y * z,
        params.b * x + params.c * y - x * z,
        -z - x * y,
      ];
    },
  },
};

// Flat, globally-unique Leva key for one attractor's param — e.g.
// paramKey('thomas', 'b') -> 'thomasB'. Shared by getSwarmControls (schema),
// LeafSwarm (uniform sync), and FieldLines (CPU param lookup) so the three
// stay in lockstep by construction.
export function paramKey(attractorKey, paramName) {
  return `${attractorKey}${paramName.charAt(0).toUpperCase()}${paramName.slice(1)}`;
}

export default attractorFields;
