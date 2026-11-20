import {
  CLOUD_MODEL,
  boltPaths,
  cloudScale,
} from '@elements/WebGPU/rainCloud/rainCloudRig';

import cloudMesh from './cloud-mesh.json';

// A strike drawn in 64 segments is a flicker; a print wants the few sharp
// turns of a bolt icon, so the scene's own seeded path is thinned to this many.
const BOLT_SEGMENTS = 4;
// A bolt is a flat zigzag slab: this many bolt radii wide at the cloud, and
// this fraction of that where it lands, with a kink this many radii off the
// line between them.
const BOLT_HALF_WIDTH = 1.3;
const BOLT_TAPER = 0.55;
const BOLT_KINK = 2.4;

const hex = (value) => (/^#[0-9a-f]{6}$/iu.test(value) ? value : '#ffffff');

export const stormWanted = (options, params) =>
  options.storm === 'on' ||
  (options.storm === 'auto' &&
    (params.cloudVisible || params.lightningVisible));

const decode = (text, Type) => {
  const bytes = Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
  return new Type(bytes.buffer);
};
const cloudPositions = decode(cloudMesh.positions, Float32Array);
const cloudTriangles = decode(cloudMesh.triangles, Uint32Array);

// The cloud stood on its flat base at `base`, over (cx, cz). `mm` is the
// print's millimetres per model unit. It is stylized_cloud_2.glb itself:
// `npm run print-shop:cloud` rebuilds the model's outer surface as a
// watertight mesh (the glTF is unwelded, interpenetrating puffs no boolean
// can take), already cut flat at the base, and the print scales and stands it.
function cloudSolid(wasm, { base, cx, cz, mm }) {
  const { Manifold, Mesh } = wasm;
  const vertices = Float32Array.from(cloudPositions, (value, n) => {
    const axis = n % 3;
    if (axis === 0) return cx + value * mm;
    if (axis === 1) return base + value * mm;
    return cz + value * mm;
  });
  return new Manifold(
    new Mesh({
      numProp: 3,
      triVerts: Uint32Array.from(cloudTriangles),
      vertProperties: vertices,
    })
  ).trimByPlane([0, 1, 0], base);
}

// One bolt from the cloud's underside to the head: a flat zigzag slab, wide
// at the cloud and tapering to where it lands, the way a lightning bolt is
// drawn. It keeps the scene's own seeded strike (where it leaves the cloud and
// how hard each turn kicks), thinned to a few sharp turns, in the vertical
// plane facing `turn`.
function boltSolid(wasm, bolt) {
  const { base, land, options, params, radius, scale, strike, topAt, turn } =
    bolt;
  const { CrossSection } = wasm;
  const main = boltPaths(params, options.boltSeed, strike)[0].points;
  const pick = (i) => main[Math.round((i * (main.length - 1)) / BOLT_SEGMENTS)];
  const [fromX, , fromZ] = pick(0);
  const dir = [Math.cos(turn), Math.sin(turn)];
  // It leaves the cloud a little off the line down to its landing, by the
  // seeded strike's own sideways start, and always inside the cloud's body.
  const lean =
    Math.max(
      -radius * 3,
      Math.min(radius * 3, (fromX * dir[0] + fromZ * dir[1]) * scale)
    ) || 0;
  const top = [land[0] + lean * dir[0], base, land[1] + lean * dir[1]];
  const foot = topAt(land[0], land[1]);
  const end = [land[0], foot - bolt.wall * 0.4, land[1]];

  // Plane coordinates: s along the slab's horizontal direction (from the top
  // point), y up. The kinks follow the seeded path's own sideways kicks.
  const along = (x, z) => (x - top[0]) * dir[0] + (z - top[2]) * dir[1];
  const sEnd = along(end[0], end[2]);
  const kicks = Array.from({ length: BOLT_SEGMENTS + 1 }, (_, i) => {
    const [x, , z] = pick(i);
    return Math.abs((x - fromX) * dir[0] + (z - fromZ) * dir[1]);
  });
  const kickMax = Math.max(...kicks, 1e-6);
  const rows = Array.from({ length: BOLT_SEGMENTS + 1 }, (_, i) => {
    const t = i / BOLT_SEGMENTS;
    const edgeRow = i === 0 || i === BOLT_SEGMENTS;
    const kink = edgeRow
      ? 0
      : (i % 2 === 1 ? 1 : -1) *
        radius *
        BOLT_KINK *
        (0.7 + 0.6 * (kicks[i] / kickMax));
    const s = sEnd * t + kink;
    const px = top[0] + s * dir[0];
    const pz = top[2] + s * dir[1];
    const ground = i === 0 ? null : topAt(px, pz);
    const line = base + (end[1] - base) * t;
    return {
      half: radius * BOLT_HALF_WIDTH * (1 - (1 - BOLT_TAPER) * t),
      s,
      y: ground == null ? line : Math.max(line, ground + radius * 1.5),
    };
  });
  // Rows run down the slab, so each must sit below the one above.
  for (let i = 1; i < rows.length; i += 1) {
    rows[i].y = Math.min(rows[i].y, rows[i - 1].y - radius * 0.5);
  }
  const [, endY] = end;
  rows.at(-1).y = endY;
  rows[0].y = base + radius;

  const left = rows.map((row) => [row.s - row.half, row.y]);
  const right = rows.map((row) => [row.s + row.half, row.y]).reverse();
  const thickness = radius * 2;
  const slab = new CrossSection([[...left, ...right]], 'Positive')
    .extrude(thickness)
    .translate([0, 0, -thickness / 2]);
  const placed = slab.transform([
    dir[0],
    0,
    dir[1],
    0,
    0,
    1,
    0,
    0,
    -dir[1],
    0,
    dir[0],
    0,
    top[0],
    0,
    top[2],
    1,
  ]);

  return placed;
}

// Everything the kernel needs to add a storm to the piece: a cloud over the
// head and bolts holding it there. `ctx` carries the final print scale, the
// thickened-sheet surface, the head axis and a `topAt(x, z)` that casts down
// onto the sheet.
export function buildStorm(params, options, ctx) {
  const { axis, manifold: wasm, scale, topAt, wall } = ctx;
  const warnings = [];
  const [cx, cz] = axis;
  const crown = topAt(cx, cz);
  if (crown == null) {
    warnings.push(
      'The head axis misses the sheet, so there is nothing to hang the cloud over. Fix: Storm → Storm "Off", or Pose → Extra lean back toward 0°.'
    );
    return { solids: [], warnings };
  }
  const mm = cloudScale(params) * options.cloudSize * scale;
  const base = crown + params.cloudHeight * options.cloudGap * scale;
  const radius = options.boltWidth / 2;
  const solids = [
    { manifold: cloudSolid(wasm, { base, cx, cz, mm }), part: 'cloud' },
  ];

  const count = Math.round(options.bolts);
  const pitch = Math.min(radius * 5.5, (CLOUD_MODEL.halfWidth * mm) / 3);
  const bolts = Array.from({ length: count }, (_, k) => {
    const land = [cx + (k - (count - 1) / 2) * pitch, cz];
    return boltSolid(wasm, {
      base,
      land,
      options,
      params,
      radius,
      scale,
      strike: k,
      topAt,
      turn: 0,
      wall,
    });
  });
  if (bolts.length) {
    solids.push({ manifold: wasm.Manifold.union(bolts), part: 'bolt' });
  }
  if (count === 0) {
    warnings.push(
      'The cloud has no bolts, so it floats free of the head and prints as a separate piece. Fix: Storm → Bolts holding the cloud up to 1 or more, or Print → Loose pieces "Keep" to print the cloud on its own.'
    );
  }
  if (wall && radius * 2 < wall) {
    warnings.push(
      `The bolts are thinner than the ${wall} mm wall. Fix: Storm → Bolt thickness (mm) up.`
    );
  }
  return {
    parts: {
      bolt: { color: hex(params.lightningColor), label: 'Lightning' },
      cloud: { color: hex(params.cloudColor), label: 'Cloud' },
    },
    solids,
    warnings,
  };
}
