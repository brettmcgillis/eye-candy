import {
  mx_noise_float as perlin,
  positionWorld,
  vertexColor,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

const SIDES = 8;
// Tube rings drawn per rope segment: the particles are joined by a
// Catmull-Rom curve so a cable bends smoothly rather than in straight runs.
const SUBDIVIDE = 4;

const ringsOf = (rope) => (rope.count - 1) * SUBDIVIDE + 1;

// The Catmull-Rom point `u` of the way from node i to i + 1, ends clamped.
function curvePoint(nodes, i, u) {
  const last = nodes.length / 3 - 1;
  const at = (k) => Math.min(Math.max(k, 0), last) * 3;
  const [a, b, c, d] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
  const u2 = u * u;
  const u3 = u2 * u;
  return [0, 1, 2].map((axis) => {
    const p0 = nodes[a + axis];
    const p1 = nodes[b + axis];
    const p2 = nodes[c + axis];
    const p3 = nodes[d + axis];
    return (
      0.5 *
      (2 * p1 +
        (p2 - p0) * u +
        (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 +
        (3 * p1 - p0 - 3 * p2 + p3) * u3)
    );
  });
}

export default function createCables(group) {
  let patch = null;
  let mesh = null;
  let geometry = null;
  let starts = [];
  // Rubber: a soft sheen running along each cable, faintly mottled.
  const material = new THREE.MeshStandardNodeMaterial({
    vertexColors: true,
    metalness: 0,
  });
  const mottle = perlin(positionWorld.mul(35));
  material.colorNode = vertexColor().rgb.mul(mottle.mul(0.06).add(1));
  material.roughnessNode = perlin(positionWorld.mul(9)).mul(0.08).add(0.42);
  let lastOffsets = null;
  let lastReveals = null;
  let castShadow = true;
  let built = false;
  function load(next) {
    mesh?.removeFromParent();
    geometry?.dispose();
    patch = next;
    let rings = 0;
    starts = patch.world.ropes.map((rope) => {
      const start = rings;
      rings += ringsOf(rope);
      return start;
    });
    geometry = new THREE.BufferGeometry();
    ['position', 'normal', 'color'].forEach((name) =>
      geometry.setAttribute(
        name,
        new THREE.BufferAttribute(
          new Float32Array(rings * SIDES * 3),
          3
        ).setUsage(THREE.DynamicDrawUsage)
      )
    );
    const indices = [];
    patch.world.ropes.forEach((rope, id) => {
      const count = ringsOf(rope);
      const tint =
        0.9 + ((0.2 * (((Math.sin(id * 12.9898) * 43758.5453) % 1) + 1)) % 1);
      for (let i = 0; i < count; i += 1) {
        const ring = starts[id] + i;
        for (let j = 0; j < SIDES; j += 1)
          geometry.attributes.color.array.set(
            patch.cables[id].color.map((v) => v * tint),
            (ring * SIDES + j) * 3
          );
        if (i + 1 < count) {
          for (let j = 0; j < SIDES; j += 1) {
            const a = ring * SIDES + j;
            const b = ring * SIDES + ((j + 1) % SIDES);
            indices.push(a, b, a + SIDES, b, b + SIDES, a + SIDES);
          }
        }
      }
    });
    geometry.setIndex(indices);
    mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.visible = rings > 0;
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    group.add(mesh);
    lastOffsets = new Float64Array(patch.world.positions.length / 3).fill(
      Infinity
    );
    lastReveals = null;
    built = false;
  }

  const same = (a, b) =>
    a === b ||
    (a && b && a.length === b.length && a.every((v, i) => v === b[i]));

  return {
    // `reveals` (per cable, 0..1) draws each cable only that far out of its
    // first socket, for a build-in; null draws them whole.
    update(next, offsets, reveals = null) {
      if (next !== patch) load(next);
      if (
        built &&
        patch.world.sleeping &&
        offsets.every((v, i) => v === lastOffsets[i]) &&
        same(reveals, lastReveals)
      )
        return;
      const p = patch.world.positions;
      const positions = geometry.attributes.position.array;
      const normals = geometry.attributes.normal.array;
      patch.world.ropes.forEach((rope, id) => {
        const nodes = new Float64Array(rope.count * 3);
        for (let i = 0; i < rope.count; i += 1) {
          const node = rope.start + i;
          nodes[i * 3] = p[node * 3];
          nodes[i * 3 + 1] = p[node * 3 + 1];
          nodes[i * 3 + 2] = p[node * 3 + 2] + offsets[node];
        }
        const count = ringsOf(rope);
        const reveal = reveals ? reveals[id] : 1;
        const cut = reveal * (count - 1);
        const sample = (k) => {
          const at = Math.min(Math.max(k, 0), count - 1);
          const i = Math.min(Math.floor(at / SUBDIVIDE), rope.count - 2);
          return curvePoint(nodes, i, at / SUBDIVIDE - i);
        };
        let nx = 1;
        let ny = 0;
        let nz = 0;
        for (let k = 0; k < count; k += 1) {
          const shown = Math.min(k, cut);
          const point = sample(shown);
          const forward = shown + 0.5 <= count - 1;
          const ahead = forward
            ? sample(shown + 0.5)
            : sample(shown - 0.5).map((v, axis) => 2 * point[axis] - v);
          let tx = ahead[0] - point[0];
          let ty = ahead[1] - point[1];
          let tz = ahead[2] - point[2];
          const length = Math.hypot(tx, ty, tz) || 1;
          tx /= length;
          ty /= length;
          tz /= length;
          const projection = nx * tx + ny * ty + nz * tz;
          nx -= tx * projection;
          ny -= ty * projection;
          nz -= tz * projection;
          if (Math.hypot(nx, ny, nz) < 1e-6) {
            nx = -ty;
            ny = tx;
            nz = 0;
            if (Math.hypot(nx, ny) < 1e-6) {
              nx = 1;
              ny = 0;
            }
          }
          const nl = Math.hypot(nx, ny, nz) || 1;
          nx /= nl;
          ny /= nl;
          nz /= nl;
          const bx = ty * nz - tz * ny;
          const by = tz * nx - tx * nz;
          const bz = tx * ny - ty * nx;
          const radius = k > cut ? 0 : rope.radius;
          const ring = starts[id] + k;
          for (let j = 0; j < SIDES; j += 1) {
            const c = Math.cos((j / SIDES) * Math.PI * 2);
            const s = Math.sin((j / SIDES) * Math.PI * 2);
            const x = nx * c + bx * s;
            const y = ny * c + by * s;
            const z = nz * c + bz * s;
            const o = (ring * SIDES + j) * 3;
            normals[o] = x;
            normals[o + 1] = y;
            normals[o + 2] = z;
            positions[o] = point[0] + x * radius;
            positions[o + 1] = point[1] + y * radius;
            positions[o + 2] = point[2] + z * radius;
          }
        }
      });
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.normal.needsUpdate = true;
      lastOffsets.set(offsets);
      lastReveals = reveals ? [...reveals] : null;
      built = true;
    },
    setShadows(cast) {
      castShadow = cast;
      if (mesh) mesh.castShadow = cast;
    },
    dispose() {
      mesh?.removeFromParent();
      geometry?.dispose();
      material.dispose();
    },
  };
}
