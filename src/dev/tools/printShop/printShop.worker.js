import Module from 'manifold-3d';

import { assemblePrint, creasedNormals } from './kernel';
import { getPrintable } from './printables';

const images = new Map();

// The CLI decodes with sharp; here the same RGBA comes off an offscreen
// canvas, unpremultiplied and without colour conversion.
function loadImage(url) {
  if (!images.has(url)) {
    images.set(
      url,
      (async () => {
        const blob = await (await fetch(url)).blob();
        const bitmap = await createImageBitmap(blob, {
          colorSpaceConversion: 'none',
          premultiplyAlpha: 'none',
        });
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const context = canvas.getContext('2d');
        context.drawImage(bitmap, 0, 0);
        const { data } = context.getImageData(
          0,
          0,
          bitmap.width,
          bitmap.height
        );
        return { data, height: bitmap.height, width: bitmap.width };
      })()
    );
  }
  return images.get(url);
}

// Optimised deps move manifold.js away from its wasm, so point at the copy
// the dev server serves from node_modules (dev tools never build).
const manifold = Module({
  locateFile: () => '/node_modules/manifold-3d/manifold.wasm',
}).then((wasm) => {
  wasm.setup();
  return wasm;
});

// The page gets each body split at creases and colour seams, with normals,
// so the preview shades exactly as the GLB and the thumbnail do.
function previewOf(body) {
  const { model } = body;
  const creased = creasedNormals(model);
  return {
    colors: creased.colors,
    id: body.id,
    indices: creased.indices,
    label: body.label,
    normals: creased.normals,
    parts: model.parts,
    positions: Float32Array.from(creased.positions),
    triPart: Uint8Array.from(model.triPart),
  };
}

// eslint-disable-next-line no-restricted-globals
self.onmessage = async ({ data }) => {
  const { id } = data;
  try {
    const printable = getPrintable(data.printable);
    const result = await assemblePrint(printable, data.options, {
      loadImage,
      manifold: await manifold,
      previewLattice: true,
    });
    const bodies = result.bodies.map(previewOf);
    // eslint-disable-next-line no-restricted-globals
    self.postMessage(
      { bodies, id, report: result.report, type: 'built' },
      bodies.flatMap((body) =>
        [body.positions, body.indices, body.triPart, body.colors, body.normals]
          .filter(Boolean)
          .map((array) => array.buffer)
      )
    );
  } catch (error) {
    // eslint-disable-next-line no-restricted-globals
    self.postMessage({ id, message: error.message, type: 'error' });
  }
};
