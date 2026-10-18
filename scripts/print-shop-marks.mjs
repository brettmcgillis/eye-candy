#!/usr/bin/env node

/* eslint-disable import/no-extraneous-dependencies */
// Bakes the two-layer maker's marks (Bret, Reversal) from their GLBs into
// flat outlines PrintShop extrudes as signature cutters. The models are
// extruded SVG paths, so the outline each layer projects onto its face is
// the whole mark; storing that keeps Draco out of the browser and the CLI.
//   node scripts/print-shop-marks.mjs
import { NodeIO } from '@gltf-transform/core';
import { KHRDracoMeshCompression } from '@gltf-transform/extensions';

import draco3d from 'draco3dgltf';
import Module from 'manifold-3d';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { REPO_ROOT } from './lib/loadModules.mjs';

const MARKS = [
  { file: 'Bret.glb', id: 'bret', layers: { in: 'bret-in', out: 'bret-out' } },
  {
    file: 'Reversal.glb',
    id: 'reversal',
    layers: { in: 'reversal-in', out: 'reversal-out' },
  },
];
const OUT_DIR = path.join(REPO_ROOT, 'src/dev/tools/printShop/kernel/marks');

async function main() {
  const wasm = await Module();
  wasm.setup();
  const io = new NodeIO()
    .registerExtensions([KHRDracoMeshCompression])
    .registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(),
    });

  // eslint-disable-next-line no-restricted-syntax
  for (const mark of MARKS) {
    // eslint-disable-next-line no-await-in-loop
    const doc = await io.read(path.join(REPO_ROOT, 'public/models', mark.file));
    const nodes = doc.getRoot().listNodes();
    const layers = Object.entries(mark.layers).map(([layer, nodeName]) => {
      const node = nodes.find((entry) => entry.getName() === nodeName);
      const [sx, sy, sz] = node.getScale();
      const prim = node.getMesh().listPrimitives()[0];
      const source = prim.getAttribute('POSITION').getArray();
      // Extruded along the model's Y; projected down it onto X/Z.
      const verts = new Float32Array(source.length);
      for (let i = 0; i < source.length; i += 3) {
        verts[i] = source[i] * sx;
        verts[i + 1] = -source[i + 2] * sz;
        verts[i + 2] = source[i + 1] * sy;
      }
      // The meshes are not closed solids, so their outline is the union of
      // every face, projected flat and wound one way.
      const index = prim.getIndices().getArray();
      const faces = [];
      for (let t = 0; t < index.length; t += 3) {
        const [a, b, c] = [index[t] * 3, index[t + 1] * 3, index[t + 2] * 3];
        const area =
          (verts[b] - verts[a]) * (verts[c + 1] - verts[a + 1]) -
          (verts[c] - verts[a]) * (verts[b + 1] - verts[a + 1]);
        if (Math.abs(area) > 1e-12) {
          const [p, q] = area > 0 ? [b, c] : [c, b];
          faces.push([
            [verts[a], verts[a + 1]],
            [verts[p], verts[p + 1]],
            [verts[q], verts[q + 1]],
          ]);
        }
      }
      const outline = new wasm.CrossSection(faces, 'Positive').simplify(0.0001);
      return {
        layer,
        polygons: outline
          .toPolygons()
          .map((ring) => ring.map(([x, y]) => [x, y])),
      };
    });

    const points = layers.flatMap(({ polygons }) => polygons.flat());
    const xs = points.map(([x]) => x);
    const ys = points.map(([, y]) => y);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const span = Math.max(
      Math.max(...xs) - Math.min(...xs),
      Math.max(...ys) - Math.min(...ys)
    );
    const round = (value) => Math.round(value * 1e5) / 1e5;
    const normalized = layers.map(({ layer, polygons }) => ({
      layer,
      polygons: polygons.map((ring) =>
        ring.map(([x, y]) => [round((x - cx) / span), round((y - cy) / span)])
      ),
    }));
    const file = path.join(OUT_DIR, `${mark.id}.json`);
    // eslint-disable-next-line no-await-in-loop
    await writeFile(
      file,
      `${JSON.stringify({ id: mark.id, layers: normalized })}\n`
    );
    process.stdout.write(
      `${mark.id}: ${normalized.map((l) => `${l.layer} ${l.polygons.length} rings / ${l.polygons.flat().length} pts`).join(', ')} → ${path.relative(REPO_ROOT, file)}\n`
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    process.stderr.write(`${error.stack ?? error}\n`);
    process.exit(1);
  });
