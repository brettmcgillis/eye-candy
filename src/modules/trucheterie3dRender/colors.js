import * as THREE from 'three/webgpu';

import { buildLaneChannels } from '@modules/trucheterieBlob';
import { laneColorAt, resolveLaneColors } from '@modules/trucheterieBlobRender';

const SRGB_TO_LINEAR = Float32Array.from(
  { length: 256 },
  (_, i) => new THREE.Color().setRGB(i / 255, 0, 0, THREE.SRGBColorSpace).r
);
const linear = (c) => SRGB_TO_LINEAR[Math.round(c)];

// The 2D lane colours, per chain sample: the same channel solve and palette
// modes as the flat field (with Weave's joins when the junctions weave), so
// a seed's tubes wear its 2D colours. Wires take the stroke colour.
export function laneOptions(config, phase = 0) {
  return {
    exact: config.blobPaletteExact,
    fallback: config.bgColor,
    mode: config.blobLaneMode,
    monoColor: config.blobMonoColor,
    monochrome: config.blobMonochrome,
    palette: config.blobPalette,
    pathDiv: config.blobPathsPerUnit,
    phase,
    seed: config.blobSeed,
    shuffleSeed: config.blobPaletteShuffle,
    weave: config.junction === 'weave',
  };
}

export const COLOR_KEYS = [
  'bgColor',
  'blobLaneMode',
  'blobMonoColor',
  'blobMonochrome',
  'blobPalette',
  'blobPaletteExact',
  'blobPaletteShuffle',
  'strokeColor',
];

// The channel solve depends only on the field and its weave, so it is kept
// per field and a drifting palette only re-picks colours.
const solves = new WeakMap();
function solvedFor(field, options) {
  const key = `${options.pathDiv}|${options.weave}`;
  const cached = solves.get(field);
  if (cached?.key === key) return cached.solved;
  const solved = buildLaneChannels(field.cells, options.pathDiv, {
    weave: options.weave,
  });
  solves.set(field, { key, solved });
  return solved;
}

export default function sampleColors(tubes, field, config, phase = 0) {
  const options = laneOptions(config, phase);
  const lanes = resolveLaneColors(field.cells, {
    ...options,
    solved: solvedFor(field, options),
  });
  const wire = new THREE.Color(config.strokeColor).toArray();
  const total = tubes.chains.reduce((sum, c) => sum + c.points.length / 3, 0);
  const out = new Float32Array(total * 3);
  let at = 0;
  tubes.chains.forEach((chain) => {
    const n = chain.points.length / 3;
    for (let k = 0; k < n; k += 1) {
      if (chain.kind === 'wire') {
        out.set(wire, at * 3);
      } else {
        const [r, g, b] = laneColorAt(
          lanes,
          chain.cell[k],
          chain.slot[k],
          chain.lane[k],
          chain.u[k]
        );
        out[at * 3] = linear(r);
        out[at * 3 + 1] = linear(g);
        out[at * 3 + 2] = linear(b);
      }
      at += 1;
    }
  });
  return out;
}
