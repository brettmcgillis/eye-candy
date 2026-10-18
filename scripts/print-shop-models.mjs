#!/usr/bin/env node

/* eslint-disable import/no-extraneous-dependencies */
// Bakes scene GLBs into plain three.js JSON for printables: Draco decoded,
// each texture sampled onto its vertices as COLOR_0 (prints carry colour
// per vertex, not per texel), everything a print does not need dropped. A
// printable rebuilds them with ObjectLoader, so skeletons and clips pose
// through three's own mixer and skinning in the CLI and the worker alike.
//   node scripts/print-shop-models.mjs
import { NodeIO } from '@gltf-transform/core';
import {
  EXTTextureWebP,
  KHRDracoMeshCompression,
  KHRMaterialsClearcoat,
  KHRMaterialsSpecular,
} from '@gltf-transform/extensions';

import draco3d from 'draco3dgltf';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { REPO_ROOT } from './lib/loadModules.mjs';

const MODELS = [
  {
    // FakeBird's body: skinned, posed by its look-around clip.
    file: 'pigeon.glb',
    keep: () => true,
    out: 'src/dev/tools/printShop/printables/pigeon/models/pigeon.json',
    skinned: true,
  },
  {
    // CameraHead keeps the two meshes sitting highest (body + lens) and
    // draws their raw geometry, so the bake does the same.
    file: 'security_camera.glb',
    keep: (meshes) =>
      new Set(
        meshes
          .map((mesh) => {
            mesh.geometry.computeBoundingBox();
            const c = new THREE.Vector3();
            mesh.geometry.boundingBox.getCenter(c);
            return { cy: c.y, mesh };
          })
          .sort((a, b) => b.cy - a.cy)
          .slice(0, 2)
          .map(({ mesh }) => mesh)
      ),
    out: 'src/dev/tools/printShop/printables/pigeon/models/camera-head.json',
    capHoles: true,
    skinned: false,
  },
];

async function bakeVertexColors(doc) {
  const decoded = new Map();
  // eslint-disable-next-line no-restricted-syntax
  for (const mesh of doc.getRoot().listMeshes()) {
    // eslint-disable-next-line no-restricted-syntax
    for (const prim of mesh.listPrimitives()) {
      const material = prim.getMaterial();
      const factor = material?.getBaseColorFactor() ?? [1, 1, 1, 1];
      const texture = material?.getBaseColorTexture();
      const uv = prim.getAttribute('TEXCOORD_0');
      const count = prim.getAttribute('POSITION').getCount();
      const colors = new Float32Array(count * 3);
      let image = null;
      if (texture && uv) {
        if (!decoded.has(texture)) {
          // eslint-disable-next-line no-await-in-loop
          const { data, info } = await sharp(Buffer.from(texture.getImage()))
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });
          decoded.set(texture, {
            data,
            height: info.height,
            width: info.width,
          });
        }
        image = decoded.get(texture);
      }
      const texel = [0, 0];
      for (let v = 0; v < count; v += 1) {
        let rgb = [1, 1, 1];
        if (image) {
          uv.getElement(v, texel);
          const u = ((texel[0] % 1) + 1) % 1;
          const w = ((texel[1] % 1) + 1) % 1;
          const x = Math.min(image.width - 1, Math.floor(u * image.width));
          const y = Math.min(image.height - 1, Math.floor(w * image.height));
          const o = (y * image.width + x) * 4;
          rgb = [
            image.data[o] / 255,
            image.data[o + 1] / 255,
            image.data[o + 2] / 255,
          ];
        }
        // sRGB texel × linear factor: kept as the sRGB colour a viewer sees.
        for (let k = 0; k < 3; k += 1) {
          const linear =
            (rgb[k] <= 0.04045
              ? rgb[k] / 12.92
              : ((rgb[k] + 0.055) / 1.055) ** 2.4) * factor[k];
          colors[v * 3 + k] =
            linear <= 0.0031308
              ? linear * 12.92
              : 1.055 * linear ** (1 / 2.4) - 0.055;
        }
      }
      const attribute = doc.createAccessor().setType('VEC3').setArray(colors);
      prim.setAttribute('COLOR_0', attribute);
    }
  }
  doc
    .getRoot()
    .listTextures()
    .forEach((texture) => texture.dispose());
}

// Vertices nearer than this (model units; the camera is ~50 across) are
// one: the camera's back plate has a slit whose two sides miss by less.
const WELD = 1e3;

function openEdges(geometry) {
  const { position } = geometry.attributes;
  const keyOf = (i) =>
    [position.getX(i), position.getY(i), position.getZ(i)]
      .map((v) => Math.round(v * WELD))
      .join(',');
  const ids = new Map();
  const weld = new Uint32Array(position.count);
  for (let i = 0; i < position.count; i += 1) {
    const key = keyOf(i);
    if (!ids.has(key)) ids.set(key, ids.size);
    weld[i] = ids.get(key);
  }
  const index = geometry.index.array;
  const uses = new Map();
  for (let t = 0; t < index.length; t += 3) {
    for (let k = 0; k < 3; k += 1) {
      const a = weld[index[t + k]];
      const b = weld[index[t + ((k + 1) % 3)]];
      const key = `${Math.min(a, b)}:${Math.max(a, b)}`;
      uses.set(key, (uses.get(key) ?? 0) + 1);
    }
  }
  let open = 0;
  let over = 0;
  uses.forEach((n) => {
    if (n === 1) open += 1;
    if (n > 2) over += 1;
  });
  return { open, over, triangles: index.length / 3, vertices: ids.size };
}

// Welds by position and closes every planar opening with a flat cap, nested
// openings in one plane becoming one cap with holes, so a game mesh made of
// open shells becomes the closed solid a print needs. Caps wind against the
// boundary they close, so the solid stays consistently oriented.
function capHoles(geometry) {
  const { color, position } = geometry.attributes;
  const ids = new Map();
  const points = [];
  const colors = [];
  const weld = new Uint32Array(position.count);
  for (let i = 0; i < position.count; i += 1) {
    const p = [position.getX(i), position.getY(i), position.getZ(i)];
    const key = p.map((v) => Math.round(v * WELD)).join(',');
    if (!ids.has(key)) {
      ids.set(key, points.length);
      points.push(p);
      colors.push(
        color ? [color.getX(i), color.getY(i), color.getZ(i)] : [1, 1, 1]
      );
    }
    weld[i] = ids.get(key);
  }
  const triangles = [];
  const index = geometry.index.array;
  for (let t = 0; t < index.length; t += 3) {
    const tri = [weld[index[t]], weld[index[t + 1]], weld[index[t + 2]]];
    if (tri[0] !== tri[1] && tri[1] !== tri[2] && tri[0] !== tri[2]) {
      triangles.push(tri);
    }
  }
  const directed = new Set(
    triangles.flatMap(([a, b, c]) => [`${a}:${b}`, `${b}:${c}`, `${c}:${a}`])
  );
  // Every boundary edge, walked into closed loops; an outline that touches
  // itself has a vertex with two ways out, so edges are consumed, not keyed
  // by vertex.
  const outgoing = new Map();
  triangles.forEach((tri) => {
    for (let k = 0; k < 3; k += 1) {
      const a = tri[k];
      const b = tri[(k + 1) % 3];
      if (!directed.has(`${b}:${a}`)) {
        if (!outgoing.has(a)) outgoing.set(a, []);
        outgoing.get(a).push(b);
      }
    }
  });
  const loops = [];
  outgoing.forEach((list, start) => {
    while (list.length) {
      const loop = [start];
      let v = list.pop();
      while (v !== start && outgoing.get(v)?.length) {
        loop.push(v);
        v = outgoing.get(v).pop();
      }
      if (loop.length >= 3) loops.push(loop);
    }
  });

  // A loop with no area is a slit: points lying along one long boundary
  // edge (a T-junction). Splitting that edge's triangle at them zips the
  // slit shut; there is nothing to cap.
  const sub = (a, b) => a.map((v, k) => v - b[k]);
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const slit = (loop) => {
    let longest = 0;
    loop.forEach((v, i) => {
      const w = loop[(i + 1) % loop.length];
      const d = sub(points[w], points[v]);
      const l = loop[(longest + 1) % loop.length];
      if (
        dot(d, d) >
        dot(
          sub(points[l], points[loop[longest]]),
          sub(points[l], points[loop[longest]])
        )
      ) {
        longest = i;
      }
    });
    const a = loop[longest];
    const b = loop[(longest + 1) % loop.length];
    const ab = sub(points[b], points[a]);
    const span = dot(ab, ab);
    const between = loop.filter((v) => v !== a && v !== b);
    const straight = between.every((v) => {
      const t = dot(sub(points[v], points[a]), ab) / span;
      const off = sub(
        sub(points[v], points[a]),
        ab.map((x) => x * t)
      );
      return t > 0 && t < 1 && dot(off, off) < 1e-8 * span;
    });
    if (!straight) return false;
    const owner = triangles.findIndex((tri) =>
      [0, 1, 2].some((k) => tri[k] === a && tri[(k + 1) % 3] === b)
    );
    if (owner < 0) return false;
    const tri = triangles[owner];
    const x = tri.find((v) => v !== a && v !== b);
    const chain = [
      a,
      ...between.sort(
        (p, q) =>
          dot(sub(points[p], points[a]), ab) -
          dot(sub(points[q], points[a]), ab)
      ),
      b,
    ];
    triangles.splice(owner, 1);
    for (let i = 0; i < chain.length - 1; i += 1) {
      triangles.push([chain[i], chain[i + 1], x]);
    }
    return true;
  };
  const openLoops = loops.filter((loop) => !slit(loop));

  // Group the loops by plane: Newell normal, then the offset along it.
  const planes = [];
  openLoops.forEach((loop) => {
    const n = [0, 0, 0];
    loop.forEach((v, i) => {
      const a = points[v];
      const b = points[loop[(i + 1) % loop.length]];
      n[0] += (a[1] - b[1]) * (a[2] + b[2]);
      n[1] += (a[2] - b[2]) * (a[0] + b[0]);
      n[2] += (a[0] - b[0]) * (a[1] + b[1]);
    });
    const length = Math.hypot(...n) || 1;
    const unit = n.map((value) => value / length);
    const axis = unit.map(Math.abs).indexOf(Math.max(...unit.map(Math.abs)));
    const offset = points[loop[0]][axis];
    let plane = planes.find(
      (entry) => entry.axis === axis && Math.abs(entry.offset - offset) < 1e-3
    );
    if (!plane) {
      plane = { axis, loops: [], offset };
      planes.push(plane);
    }
    plane.loops.push(loop);
  });

  const area = (ring) =>
    ring.reduce((sum, p, i) => {
      const q = ring[(i + 1) % ring.length];
      return sum + p.x * q.y - q.x * p.y;
    }, 0) / 2;
  const inside = (point, ring) => {
    let hit = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
      const a = ring[i];
      const b = ring[j];
      if (
        a.y > point.y !== b.y > point.y &&
        point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
      ) {
        hit = !hit;
      }
    }
    return hit;
  };
  planes.forEach(({ axis, loops: planeLoops }) => {
    const [u, w] = [0, 1, 2].filter((k) => k !== axis);
    const flat = planeLoops.map((loop) =>
      loop.map((v) => new THREE.Vector2(points[v][u], points[v][w]))
    );
    const depth = flat.map(
      (ring, i) =>
        flat.filter((other, j) => j !== i && inside(ring[0], other)).length
    );
    flat.forEach((ring, i) => {
      if (depth[i] % 2 === 1) return;
      const holes = flat
        .map((other, j) => ({ j, other }))
        .filter(
          ({ j, other }) => depth[j] === depth[i] + 1 && inside(other[0], ring)
        );
      const contour = ring;
      const holeRings = holes.map(({ other }) => other);
      const order = [
        planeLoops[i],
        ...holes.map(({ j }) => planeLoops[j]),
      ].flat();
      const faces = THREE.ShapeUtils.triangulateShape(contour, holeRings);
      // The boundary runs one way round the opening; the cap runs the other.
      const flip = area(contour) > 0;
      faces.forEach(([a, b, c]) => {
        triangles.push(
          flip ? [order[a], order[c], order[b]] : [order[a], order[b], order[c]]
        );
      });
    });
  });

  const result = new THREE.BufferGeometry();
  result.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(points.flat(), 3)
  );
  result.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(colors.flat(), 3)
  );
  result.setIndex(triangles.flat());
  return result;
}

function trim(geometry, skinned) {
  const keep = [
    'position',
    'color',
    ...(skinned ? ['skinIndex', 'skinWeight'] : []),
  ];
  Object.keys(geometry.attributes).forEach((name) => {
    if (!keep.includes(name)) geometry.deleteAttribute(name);
  });
  // eslint-disable-next-line no-param-reassign
  geometry.morphAttributes = {};
  geometry.clearGroups();
}

const round = (value) => Math.round(value * 1e5) / 1e5;

async function main() {
  const io = new NodeIO()
    .registerExtensions([
      EXTTextureWebP,
      KHRDracoMeshCompression,
      KHRMaterialsClearcoat,
      KHRMaterialsSpecular,
    ])
    .registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(),
      'draco3d.encoder': await draco3d.createEncoderModule(),
    });

  // eslint-disable-next-line no-restricted-syntax
  for (const model of MODELS) {
    // eslint-disable-next-line no-await-in-loop
    const doc = await io.read(
      path.join(REPO_ROOT, 'public/models', model.file)
    );
    // eslint-disable-next-line no-await-in-loop
    await bakeVertexColors(doc);
    doc
      .getRoot()
      .listExtensionsUsed()
      .forEach((extension) => extension.dispose());
    // eslint-disable-next-line no-await-in-loop
    const glb = await io.writeBinary(doc);
    // eslint-disable-next-line no-await-in-loop
    const gltf = await new GLTFLoader().parseAsync(
      glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.byteLength),
      ''
    );
    const meshes = [];
    gltf.scene.traverse((object) => {
      if (object.isMesh) meshes.push(object);
    });
    const kept = model.keep(meshes);
    const keepSet = kept === true ? null : kept;
    meshes.forEach((mesh) => {
      if (keepSet && !keepSet.has(mesh)) {
        mesh.removeFromParent();
        return;
      }
      trim(mesh.geometry, model.skinned);
      if (model.capHoles) {
        // A self-touching outline triangulates short of full; what it leaves
        // open are simple polygons the next pass closes.
        for (
          let pass = 0;
          pass < 4 && openEdges(mesh.geometry).open;
          pass += 1
        ) {
          // eslint-disable-next-line no-param-reassign
          mesh.geometry = capHoles(mesh.geometry);
        }
      }
      Object.values(mesh.geometry.attributes).forEach((attribute) => {
        if (attribute.array instanceof Float32Array) {
          for (let i = 0; i < attribute.array.length; i += 1) {
            // eslint-disable-next-line no-param-reassign
            attribute.array[i] = round(attribute.array[i]);
          }
        }
      });
      // eslint-disable-next-line no-param-reassign
      mesh.material = new THREE.MeshBasicMaterial({ vertexColors: true });
      const report = openEdges(mesh.geometry);
      process.stdout.write(
        `  ${model.file} ${mesh.name}: ${report.vertices} verts (welded), ${report.triangles} tris, ${report.open} open / ${report.over} non-manifold edges\n`
      );
    });
    if (model.skinned) gltf.scene.animations = gltf.animations;
    const json = gltf.scene.toJSON();
    const out = path.join(REPO_ROOT, model.out);
    // eslint-disable-next-line no-await-in-loop
    await mkdir(path.dirname(out), { recursive: true });
    // eslint-disable-next-line no-await-in-loop
    await writeFile(out, `${JSON.stringify(json)}\n`);
    process.stdout.write(`${model.file} → ${model.out}\n`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    process.stderr.write(`${error.stack ?? error}\n`);
    process.exit(1);
  });
