// The structure's vocabulary, in metres. A part is a solid the renderer draws
// and the plot traces; a cutter is a solid carved out of one part; a light is
// a lit pane at the back of an opening. Every solid is a box, a prism (a
// local-XY profile extruded through local Z) or a cylinder (local-Y axis),
// placed by `center` and turned by `yaw` about Y, then `tilt` about its own Z
// (a lean), then `pitch` about its own X.
//
// box       half = [hx, hy, hz]
// prism     half = [_, _, hz], profile = [[x, y], …] counter-clockwise
// cylinder  half = [r, hy, r]

export const ROLES = [
  'mass',
  'slab',
  'fin',
  'core',
  'parapet',
  'column',
  'step',
  'spout',
  'blade',
  'plinth',
];
export const CUT_ROLES = ['window', 'slot', 'door', 'recess', 'void'];

const roleIndex = (role) => Math.max(0, ROLES.indexOf(role));

export function createBook(rng) {
  const parts = [];
  const cutters = [];
  const lights = [];

  // Breaks exact coplanarity between neighbouring masses, which would
  // z-fight: every part grows or shrinks by a few centimetres.
  const nudge = () => 0.02 + rng() * 0.07;

  function add(part) {
    const id = parts.length;
    parts.push({
      pitch: 0,
      tilt: 0,
      yaw: 0,
      ...part,
      id,
      seed: rng(),
    });
    return id;
  }

  return {
    cutters,
    lights,
    parts,

    box(center, half, role = 'mass', extra = {}) {
      const n = role === 'mass' || role === 'core' ? nudge() : 0;
      return add({
        center: [...center],
        half: half.map((h) => h + n),
        kind: 'box',
        role,
        ...extra,
      });
    },

    prism(center, profile, depth, role = 'blade', extra = {}) {
      return add({
        center: [...center],
        half: [0, 0, depth / 2],
        kind: 'prism',
        profile,
        role,
        ...extra,
      });
    },

    cylinder(center, radius, halfHeight, role = 'mass', extra = {}) {
      return add({
        center: [...center],
        half: [radius, halfHeight, radius],
        kind: 'cylinder',
        role,
        ...extra,
      });
    },

    // Cutters of one part are merged into a single brush, which is only a
    // valid solid while they are disjoint, so an overlapping cut is refused.
    cut(part, cutter) {
      const placed = {
        kind: 'box',
        pitch: 0,
        tilt: 0,
        yaw: 0,
        ...cutter,
        part,
      };
      // eslint-disable-next-line no-use-before-define
      const box = boundsOf([placed]);
      const clash = cutters.some(
        (other) =>
          other.part === part &&
          other.box.min.every((v, a) => v < box.max[a] + 0.05) &&
          other.box.max.every((v, a) => v > box.min[a] - 0.05)
      );
      if (!clash) cutters.push({ ...placed, box });
      return !clash;
    },

    light(pane) {
      lights.push({ pitch: 0, tilt: 0, yaw: 0, ...pane });
    },
  };
}

export const rotateY = ([x, y, z], yaw) => {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return [x * c + z * s, y, -x * s + z * c];
};

export const rotateX = ([x, y, z], angle) => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [x, y * c - z * s, y * s + z * c];
};

export const rotateZ = ([x, y, z], angle) => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [x * c - y * s, x * s + y * c, z];
};

// Local → world for any solid.
export function placePoint(solid, local) {
  const leaned = rotateZ(rotateX(local, solid.pitch ?? 0), solid.tilt ?? 0);
  return rotateY(leaned, solid.yaw ?? 0).map((v, a) => v + solid.center[a]);
}

const CYLINDER_STEPS = 24;

// The solid's vertices and edges in local space, for bounds and the plot.
export function localOutline(solid) {
  if (solid.kind === 'prism') {
    const hz = solid.half[2];
    const n = solid.profile.length;
    const points = [
      ...solid.profile.map(([x, y]) => [x, y, -hz]),
      ...solid.profile.map(([x, y]) => [x, y, hz]),
    ];
    const edges = [];
    for (let i = 0; i < n; i += 1) {
      edges.push([i, (i + 1) % n], [n + i, n + ((i + 1) % n)], [i, n + i]);
    }
    return { edges, points };
  }

  if (solid.kind === 'cylinder') {
    const [r, hy] = solid.half;
    const points = [];
    const edges = [];
    for (let i = 0; i < CYLINDER_STEPS; i += 1) {
      const a = (i / CYLINDER_STEPS) * Math.PI * 2;
      points.push([Math.cos(a) * r, -hy, Math.sin(a) * r]);
      points.push([Math.cos(a) * r, hy, Math.sin(a) * r]);
      const next = ((i + 1) % CYLINDER_STEPS) * 2;
      edges.push([i * 2, next], [i * 2 + 1, next + 1]);
    }
    return { edges, points };
  }

  const [hx, hy, hz] = solid.half;
  const points = [];
  for (let i = 0; i < 8; i += 1) {
    // eslint-disable-next-line no-bitwise
    points.push([i & 1 ? hx : -hx, i & 2 ? hy : -hy, i & 4 ? hz : -hz]);
  }
  const edges = [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7],
    [0, 2],
    [1, 3],
    [4, 6],
    [5, 7],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ];
  return { edges, points };
}

export function worldPoints(solid) {
  return localOutline(solid).points.map((p) => placePoint(solid, p));
}

export function boundsOf(solids) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  solids.forEach((solid) =>
    worldPoints(solid).forEach((p) =>
      p.forEach((v, a) => {
        min[a] = Math.min(min[a], v);
        max[a] = Math.max(max[a], v);
      })
    )
  );
  return { max, min };
}

// The per-vertex record the shader weathers by: the solid's top (where its
// rain streaks start), its bottom, a die, and its role.
export function weatherRecord(solid) {
  const ys = worldPoints(solid).map((p) => p[1]);
  return [
    Math.max(...ys),
    Math.min(...ys),
    solid.seed ?? 0,
    roleIndex(solid.role),
  ];
}

// Whether a world point lies inside a part's footprint (ignoring height),
// grown by `margin`. Leaning solids are tested unleaned.
export function inFootprint(part, x, z, margin = 0) {
  const local = rotateY([x - part.center[0], 0, z - part.center[2]], -part.yaw);
  if (part.kind === 'prism') {
    const xs = part.profile.map((p) => p[0]);
    return (
      local[0] >= Math.min(...xs) - margin &&
      local[0] <= Math.max(...xs) + margin &&
      Math.abs(local[2]) <= part.half[2] + margin
    );
  }
  if (part.kind === 'cylinder') {
    return Math.hypot(local[0], local[2]) <= part.half[0] + margin;
  }
  return (
    Math.abs(local[0]) <= part.half[0] + margin &&
    Math.abs(local[2]) <= part.half[2] + margin
  );
}
