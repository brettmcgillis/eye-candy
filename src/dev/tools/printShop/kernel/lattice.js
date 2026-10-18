// A wireframe piece: struts along `edges` between `nodes`, a ball at every
// node so joints are round. `latticeMesh` lays them over each other, which
// draws right and is instant (the preview); `latticeSolid` unions them into
// one watertight solid, which is what a print needs and takes seconds.

const SIDES = 8;

function frameAlong(a, b) {
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const length = Math.hypot(...d);
  const z = d.map((v) => v / length);
  const ref = Math.abs(z[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let x = [
    ref[1] * z[2] - ref[2] * z[1],
    ref[2] * z[0] - ref[0] * z[2],
    ref[0] * z[1] - ref[1] * z[0],
  ];
  const lx = Math.hypot(...x);
  x = x.map((v) => v / lx);
  const y = [
    z[1] * x[2] - z[2] * x[1],
    z[2] * x[0] - z[0] * x[2],
    z[0] * x[1] - z[1] * x[0],
  ];
  return { length, x, y, z };
}

const nodeAt = (lattice, scale, i) => [
  lattice.nodes[i * 3] * scale,
  lattice.nodes[i * 3 + 1] * scale,
  lattice.nodes[i * 3 + 2] * scale,
];

const usedNodes = (lattice) => [...new Set(lattice.edges)];

export function latticeMesh(lattice, scale, radius) {
  const positions = [];
  const indices = [];
  const colors = [];
  const colourOf = (node) =>
    lattice.colors
      ? [0, 1, 2].map((k) => lattice.colors[node * 3 + k])
      : [1, 1, 1];

  for (let e = 0; e < lattice.edges.length; e += 2) {
    const a = nodeAt(lattice, scale, lattice.edges[e]);
    const b = nodeAt(lattice, scale, lattice.edges[e + 1]);
    const { length, x, y, z } = frameAlong(a, b);
    if (length > 1e-6) {
      const start = positions.length / 3;
      [0, length].forEach((t, end) => {
        const c = colourOf(lattice.edges[e + end]);
        for (let s = 0; s < SIDES; s += 1) {
          const angle = (s / SIDES) * Math.PI * 2;
          const cx = Math.cos(angle) * radius;
          const cy = Math.sin(angle) * radius;
          for (let k = 0; k < 3; k += 1) {
            positions.push(a[k] + x[k] * cx + y[k] * cy + z[k] * t);
          }
          colors.push(...c);
        }
      });
      for (let s = 0; s < SIDES; s += 1) {
        const s1 = (s + 1) % SIDES;
        indices.push(start + s, start + s1, start + SIDES + s1);
        indices.push(start + s, start + SIDES + s1, start + SIDES + s);
      }
      for (let s = 1; s < SIDES - 1; s += 1) {
        indices.push(start, start + s + 1, start + s);
        indices.push(start + SIDES, start + SIDES + s, start + SIDES + s + 1);
      }
    }
  }

  // Octahedral balls: a node is small next to the camera, and six points
  // round a strut's octagon are enough to round its joint off.
  const ball = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ];
  const faces = [
    [0, 2, 4],
    [2, 1, 4],
    [1, 3, 4],
    [3, 0, 4],
    [2, 0, 5],
    [1, 2, 5],
    [3, 1, 5],
    [0, 3, 5],
  ];
  usedNodes(lattice).forEach((node) => {
    const p = nodeAt(lattice, scale, node);
    const start = positions.length / 3;
    const c = colourOf(node);
    ball.forEach((dir) => {
      positions.push(...dir.map((v, k) => p[k] + v * radius * 1.08));
      colors.push(...c);
    });
    faces.forEach((face) => indices.push(...face.map((v) => start + v)));
  });

  return {
    colors: Float64Array.from(colors),
    indices: Uint32Array.from(indices),
    positions: Float64Array.from(positions),
  };
}

export function latticeSolid(wasm, lattice, scale, radius) {
  const { Manifold } = wasm;
  const parts = [];
  for (let e = 0; e < lattice.edges.length; e += 2) {
    const a = nodeAt(lattice, scale, lattice.edges[e]);
    const b = nodeAt(lattice, scale, lattice.edges[e + 1]);
    const { length, x, y, z } = frameAlong(a, b);
    if (length > 1e-6) {
      parts.push(
        Manifold.cylinder(length, radius, radius, SIDES).transform([
          ...x,
          0,
          ...y,
          0,
          ...z,
          0,
          ...a,
          1,
        ])
      );
    }
  }
  usedNodes(lattice).forEach((node) => {
    parts.push(
      Manifold.sphere(radius * 1.04, SIDES).translate(
        nodeAt(lattice, scale, node)
      )
    );
  });
  return Manifold.union(parts);
}
