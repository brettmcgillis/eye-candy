import * as THREE from 'three/webgpu';

import { buildLaneChannels } from '@modules/trucheterieBlob';
import { hexToRgb } from '@utils/gradientPalette';

import {
  channelColors,
  hashSeed,
  resolvePaletteStops,
  shuffleStops,
  spectrumColor,
} from './palette';

// SVG slices per palette stop along a blended Spectrum lane.
const SLICES_PER_STOP = 16;

function lookupTexture(data, type, colorSpace) {
  const texture = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat, type);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.colorSpace = colorSpace;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

// Lookup tables, not images, all fetched with textureLoad so nothing is
// filtered or interpolated:
//   colors — one row per cell, one texel per (family slot, lane): the lane's
//            flat colour. A texture rather than instance attributes is what
//            lets a single instance carry a different colour per lane.
//   along  — the same layout, float: where each lane piece sits along its
//            channel (laneChannels.js's `along`), for Spectrum mode.
//   stops  — one row, the palette's stops, for Spectrum mode to blend.
export function createLaneTextures() {
  return {
    along: lookupTexture(
      new Float32Array(4),
      THREE.FloatType,
      THREE.NoColorSpace
    ),
    colors: lookupTexture(
      new Uint8Array([0, 0, 0, 255]),
      THREE.UnsignedByteType,
      THREE.SRGBColorSpace
    ),
    stops: lookupTexture(
      new Uint8Array([0, 0, 0, 255]),
      THREE.UnsignedByteType,
      THREE.SRGBColorSpace
    ),
  };
}

export function disposeLaneTextures(textures) {
  Object.values(textures).forEach((texture) => texture.dispose());
}

// Every (cell, family slot, lane) resolved to a colour, shared by the lane
// textures and the SVG so the two cannot drift apart. `flat` is set when
// every lane is one colour (monochrome, or no palette) and `data` is then
// absent; `spectrum` is set in Spectrum mode.
export function resolveLaneColors(
  drawn,
  {
    exact,
    fallback,
    mode,
    monoColor,
    monochrome,
    palette,
    pathDiv,
    phase = 0,
    seed,
    shuffleSeed,
  }
) {
  const stops = monochrome
    ? null
    : shuffleStops(resolvePaletteStops(palette), shuffleSeed);
  if (!stops || drawn.length === 0) {
    return {
      channelCount: 0,
      flat: hexToRgb(monochrome ? monoColor : fallback),
      maxLanes: 1,
    };
  }

  const { along, channelOf, channels, maxLanes, slotStride } =
    buildLaneChannels(drawn, pathDiv);
  // Rerolling the shuffle must also move Random mode's picks, so it salts
  // that stream too rather than only reordering the stops.
  const colors = channelColors(channels, stops, {
    exact,
    mode,
    phase,
    seed: hashSeed(`${seed}:${shuffleSeed}`),
  });

  const data = new Uint8Array(drawn.length * slotStride * 4);
  for (let id = 0; id < channelOf.length; id += 1) {
    const channel = channelOf[id];
    if (channel >= 0) {
      const [r, g, b] = colors[channel];
      data[id * 4 + 0] = r;
      data[id * 4 + 1] = g;
      data[id * 4 + 2] = b;
      data[id * 4 + 3] = 255;
    }
  }
  return {
    channelCount: channels.length,
    data,
    maxLanes,
    slotStride,
    spectrum:
      mode === 'Spectrum'
        ? { along, exact: Boolean(exact), phase, stops }
        : null,
  };
}

// A Spectrum lane's palette position (in stops) at wedge parameter u.
function spectrumPosition(spectrum, id, u) {
  const { along, phase, stops } = spectrum;
  const s = (along[id * 4] + along[id * 4 + 1] * u) * along[id * 4 + 2];
  return along[id * 4 + 3] + s * stops.length + phase;
}

const slotId = (lanes, cellIndex, slot, lane) =>
  cellIndex * lanes.slotStride + slot * lanes.maxLanes + lane;

export function laneColorAt(lanes, cellIndex, slot, lane, u = 0.5) {
  if (lanes.flat) return lanes.flat;
  const id = slotId(lanes, cellIndex, slot, lane);
  if (lanes.spectrum) {
    const { exact, stops } = lanes.spectrum;
    return spectrumColor(stops, spectrumPosition(lanes.spectrum, id, u), exact);
  }
  return [lanes.data[id * 4], lanes.data[id * 4 + 1], lanes.data[id * 4 + 2]];
}

// Where along a Spectrum lane (as wedge parameters 0..1) its colour changes:
// exactly at each stop boundary when exact, every 1/SLICES_PER_STOP of a stop
// when blended. Null for a flat lane.
export function laneBreaks(lanes, cellIndex, slot, lane) {
  if (!lanes.spectrum) return null;
  const id = slotId(lanes, cellIndex, slot, lane);
  const p0 = spectrumPosition(lanes.spectrum, id, 0);
  const p1 = spectrumPosition(lanes.spectrum, id, 1);
  if (p1 === p0) return null;
  const step = lanes.spectrum.exact ? 1 : 1 / SLICES_PER_STOP;
  const lo = Math.min(p0, p1);
  const hi = Math.max(p0, p1);
  const breaks = [0, 1];
  for (let p = Math.ceil(lo / step) * step; p < hi; p += step) {
    if (p > lo) breaks.push((p - p0) / (p1 - p0));
  }
  return breaks.sort((a, b) => a - b);
}

/* eslint-disable no-param-reassign */
function setImage(texture, image) {
  texture.image = image;
  texture.dispose();
  texture.needsUpdate = true;
}

// Refills the textures in place rather than making new ones: they are baked
// into the material's node graph, so replacing one would force a shader
// rebuild — and rebuilding the material recreates the InstancedMesh (it is
// one of its `args`), dropping the instance matrices with it.
export default function fillLaneTextures(textures, drawn, options) {
  const lanes = resolveLaneColors(drawn, options);
  if (lanes.flat) {
    setImage(textures.colors, {
      data: new Uint8Array([...lanes.flat, 255]),
      height: 1,
      width: 1,
    });
  } else {
    setImage(textures.colors, {
      data: lanes.data,
      height: drawn.length,
      width: lanes.slotStride,
    });
  }
  if (lanes.spectrum) {
    setImage(textures.along, {
      data: lanes.spectrum.along,
      height: drawn.length,
      width: lanes.slotStride,
    });
    setImage(textures.stops, {
      data: new Uint8Array(
        lanes.spectrum.stops.flatMap((hex) => [...hexToRgb(hex), 255])
      ),
      height: 1,
      width: lanes.spectrum.stops.length,
    });
  }
  return {
    channelCount: lanes.channelCount,
    exact: Boolean(options.exact),
    maxLanes: lanes.maxLanes,
    spectrum: Boolean(lanes.spectrum),
    stopCount: lanes.spectrum ? lanes.spectrum.stops.length : 1,
  };
}
/* eslint-enable no-param-reassign */
