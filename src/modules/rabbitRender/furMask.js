import * as THREE from 'three/webgpu';

export const FUR_ATTRIBUTE = 'furDensity';
export const EYE_ATTRIBUTE = 'eyeMask';
// Skin this close to a bald piece (mesh units, centimetres) thins to
// nothing, so the lids' fur does not stand over the eyes.
const FADE = [0.15, 0.6];
// A bald piece painted this dark (median luminance) is an eye; the teeth
// are pale.
const EYE_LUMINANCE = 0.2;

function imagePixels(image) {
  if (!image) return null;
  if (image.data) return image;
  const canvas = new OffscreenCanvas(image.width, image.height);
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0);
  return context.getImageData(0, 0, image.width, image.height);
}

function luminanceAt(pixels, u, v) {
  const { data, height, width } = pixels;
  const stride = data.length / (width * height);
  const x = Math.min(width - 1, Math.max(0, Math.floor(u * width)));
  const y = Math.min(height - 1, Math.max(0, Math.floor(v * height)));
  const i = (y * width + x) * stride;
  return (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
}

// The connected pieces of a mesh, joined by shared positions so UV seams do
// not split them: a piece id per vertex.
function pieces(position, index) {
  const { count } = position;
  const ids = new Map();
  const welded = new Uint32Array(count);
  for (let i = 0; i < count; i += 1) {
    const key = `${Math.round(position.getX(i) * 1e4)},${Math.round(position.getY(i) * 1e4)},${Math.round(position.getZ(i) * 1e4)}`;
    if (!ids.has(key)) ids.set(key, ids.size);
    welded[i] = ids.get(key);
  }
  const parent = Uint32Array.from({ length: ids.size }, (_, i) => i);
  const find = (x) => {
    let root = x;
    while (parent[root] !== root) root = parent[root];
    let node = x;
    while (parent[node] !== root) {
      const next = parent[node];
      parent[node] = root;
      node = next;
    }
    return root;
  };
  const corners = index ?? Uint32Array.from({ length: count }, (_, i) => i);
  for (let t = 0; t + 2 < corners.length; t += 3) {
    const a = find(welded[corners[t]]);
    parent[find(welded[corners[t + 1]])] = a;
    parent[find(welded[corners[t + 2]])] = a;
  }
  return Uint32Array.from({ length: count }, (_, i) => find(welded[i]));
}

// The rabbit is one mesh whose eyeballs, irises and teeth are separate
// pieces: the eye bones carry no weights and the eye is painted brown and
// grey, so neither the skeleton nor the texture alone finds it. Written
// once onto the geometry, which the shell fur shares:
// - furDensity: 1 on the largest piece (the skin), fading out round the
//   others, 0 on them — hair grows on none of them;
// - eyeMask: 1 on the bald pieces `map` paints dark (the eyes), else 0.
export default function ensureSkinMasks(geometry, map = null) {
  const existing = geometry.getAttribute(FUR_ATTRIBUTE);
  if (existing) {
    return { eye: geometry.getAttribute(EYE_ATTRIBUTE), fur: existing };
  }
  const { position, uv } = geometry.attributes;
  const { count } = position;
  const piece = pieces(position, geometry.index?.array);
  const sizes = new Map();
  piece.forEach((id) => sizes.set(id, (sizes.get(id) ?? 0) + 1));
  const skin = [...sizes].reduce((best, entry) =>
    entry[1] > best[1] ? entry : best
  )[0];

  const pixels = uv ? imagePixels(map?.image) : null;
  const shades = new Map();
  if (pixels) {
    for (let i = 0; i < count; i += 1) {
      if (piece[i] !== skin) {
        if (!shades.has(piece[i])) shades.set(piece[i], []);
        shades.get(piece[i]).push(luminanceAt(pixels, uv.getX(i), uv.getY(i)));
      }
    }
  }
  const eyes = new Set(
    [...shades]
      .filter(([, values]) => {
        const sorted = values.sort((a, b) => a - b);
        return sorted[Math.floor(sorted.length / 2)] < EYE_LUMINANCE;
      })
      .map(([id]) => id)
  );

  const bald = [];
  for (let i = 0; i < count; i += 1) {
    if (piece[i] !== skin) {
      bald.push(position.getX(i), position.getY(i), position.getZ(i));
    }
  }
  const [near, far] = FADE;
  const density = new Float32Array(count);
  const eye = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    if (piece[i] === skin) {
      const x = position.getX(i);
      const y = position.getY(i);
      const z = position.getZ(i);
      let closest = Infinity;
      for (let b = 0; b < bald.length; b += 3) {
        closest = Math.min(
          closest,
          (bald[b] - x) ** 2 + (bald[b + 1] - y) ** 2 + (bald[b + 2] - z) ** 2
        );
      }
      const t = Math.min(
        1,
        Math.max(0, (Math.sqrt(closest) - near) / (far - near))
      );
      density[i] = t * t * (3 - 2 * t);
    } else if (eyes.has(piece[i])) {
      eye[i] = 1;
    }
  }
  const fur = new THREE.BufferAttribute(density, 1);
  const eyeMask = new THREE.BufferAttribute(eye, 1);
  geometry.setAttribute(FUR_ATTRIBUTE, fur);
  geometry.setAttribute(EYE_ATTRIBUTE, eyeMask);
  return { eye: eyeMask, fur };
}
