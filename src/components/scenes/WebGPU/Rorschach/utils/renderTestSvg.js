/* eslint-disable no-bitwise, no-param-reassign */
import { hslToHex } from './palette';

// Deliberately three.js-free so this runs unchanged under Node (see
// scripts/rorschach-generate.mjs). The scene's strokes are unlit, flat-color
// LineBasicNodeMaterial with no tone mapping (see components/TestStrokes.jsx
// and the canvas setup), so an SVG polyline at the same projected position
// is the same image, not an approximation of one — the only thing without an
// SVG equivalent is bloom, faked below.

const DEFAULT_FOV = 42;
const DEFAULT_DISTANCE = 22;
// Screen-space decimation floor. Successive RK4 steps land a small fraction
// of a pixel apart at any sane output size, so emitting all of them costs
// megabytes of SVG for sub-pixel detail nobody can see. Distance is measured
// after projection, so this adapts to the output resolution on its own.
const DEFAULT_SIMPLIFY_PX = 0.4;
// Points per depth-sorted chunk. Small enough that interpenetrating strokes
// cross over gradually as the camera orbits, large enough that the SVG stays a
// list of polylines rather than a list of segments.
const DEFAULT_CHUNK_POINTS = 24;
const NEAR = 0.01;
const COORD_DECIMALS = 2;

function subtract(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function normalize(v) {
  const length = Math.hypot(v[0], v[1], v[2]);
  return length > 0 ? [v[0] / length, v[1] / length, v[2] / length] : [0, 0, 1];
}

export function viewEye(view, distance = DEFAULT_DISTANCE) {
  switch (view) {
    case 'back':
      return [0, 0, -distance];
    case 'top':
      return [0, distance, 0];
    case 'bottom':
      return [0, -distance, 0];
    default:
      return [0, 0, distance];
  }
}

export function orbitEye(azimuth, elevation = 0, distance = DEFAULT_DISTANCE) {
  const cosE = Math.cos(elevation);
  return [
    Math.sin(azimuth) * cosE * distance,
    Math.sin(elevation) * distance,
    Math.cos(azimuth) * cosE * distance,
  ];
}

// Right-handed lookAt + perspective divide, returning screen pixels and a
// positive forward depth. `up` is swung aside when the eye is straight above
// or below the target (the top/bottom views), where the usual +Y up is
// parallel to the view direction and would collapse the basis.
function createProjector({ eye, target, up, fov, width, height }) {
  const forward = normalize(subtract(eye, target));
  const safeUp = Math.abs(dot(forward, up)) > 0.999 ? [0, 0, -1] : up;
  const xAxis = normalize(cross(safeUp, forward));
  const yAxis = cross(forward, xAxis);

  const focal = 1 / Math.tan((fov * Math.PI) / 180 / 2);
  const aspect = width / height;
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  return function project(x, y, z, out) {
    const rx = x - eye[0];
    const ry = y - eye[1];
    const rz = z - eye[2];
    const depth = -(rx * forward[0] + ry * forward[1] + rz * forward[2]);

    if (depth <= NEAR) {
      out[2] = -1;
      return out;
    }

    const vx = rx * xAxis[0] + ry * xAxis[1] + rz * xAxis[2];
    const vy = rx * yAxis[0] + ry * yAxis[1] + rz * yAxis[2];

    out[0] = halfWidth + ((focal / aspect) * vx * halfWidth) / depth;
    out[1] = halfHeight - (focal * vy * halfHeight) / depth;
    out[2] = depth;
    return out;
  };
}

function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(c) {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
}

function hexToLinear(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((byte) =>
    srgbToLinear(byte / 255)
  );
}

function linearToHex(rgb) {
  const bytes = rgb.map((c) =>
    Math.round(linearToSrgb(Math.min(1, Math.max(0, c))) * 255)
  );
  return `#${bytes.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

// TestStrokes.jsx multiplies the color uniform by the intensity in the
// renderer's linear working space, and leaves the result unclamped — that HDR
// headroom above 1.0 is the whole reason an emissive bundle blooms and a
// normal one doesn't. So the multiply happens in linear here too, and the
// unclamped value is kept for the threshold test below; only the visible
// stroke gets clamped down to something sRGB can express.
function bundleLinear(hex, emissive, intensity) {
  const linear = hexToLinear(hex);
  return emissive ? linear.map((c) => c * intensity) : linear;
}

// The bright pass, matching PostEffects.jsx's bloomThreshold: whatever a
// color exceeds the threshold by, in linear light. Returns null when nothing
// clears it, so the caller can skip the layer entirely.
function excessOverThreshold(linear, threshold) {
  const excess = linear.map((c) => Math.max(0, c - threshold));
  return excess.some((c) => c > 0) ? linearToHex(excess) : null;
}

// Whether anything in the frame clears `bloomThreshold` — i.e. whether a
// bright pass would contain anything but black. Lets callers skip the whole
// bloom pipeline instead of blurring an empty layer.
export function hasBloomContent({
  backgroundColor,
  bloomThreshold = 1,
  styles,
}) {
  const backgroundBlooms =
    excessOverThreshold(hexToLinear(backgroundColor), bloomThreshold) !== null;
  if (backgroundBlooms) return true;

  return styles.some((style) => {
    if (!style || style.visible === false) return false;
    const linear = bundleLinear(
      hslToHex(style.color.h, style.color.s, style.color.l),
      style.emissive === true,
      style.emissiveIntensity ?? 2
    );
    return excessOverThreshold(linear, bloomThreshold) !== null;
  });
}

function axisScale(scale, flatten, flattenAxis) {
  const squash = 1 - flatten;
  return flattenAxis === 'y'
    ? [scale, scale * squash, scale]
    : [scale, scale, scale * squash];
}

// Walks a strand, dropping points closer than `simplifyPx` to the last one
// kept and breaking wherever a point falls behind the camera. Emits the result
// as depth-sorted chunks of at most `chunkPoints` kept points, each carrying
// its own mean depth — consecutive chunks share a point so the seam is
// invisible. Chunking is what makes the painter's ordering below fine-grained
// enough to survive an orbit.
function projectStrand(
  strand,
  grownSteps,
  sx,
  sy,
  sz,
  project,
  simplifyPx,
  chunkPoints
) {
  const chunks = [];
  const out = [0, 0, 0];
  const minDistanceSq = simplifyPx * simplifyPx;

  let points = null;
  let depthSum = 0;
  let lastX = 0;
  let lastY = 0;
  let lastPoint = null;
  let lastDepth = 0;

  // `carry` repeats the previous chunk's final point as the next chunk's
  // first, so a split never leaves a visible gap in the stroke.
  const flush = (carry) => {
    if (points && points.length > 1) {
      chunks.push({ depth: depthSum / points.length, points });
    }
    if (carry && lastPoint !== null) {
      points = [lastPoint];
      depthSum = lastDepth;
    } else {
      points = null;
      depthSum = 0;
    }
  };

  for (let i = 0; i < grownSteps; i += 1) {
    const o = i * 3;
    project(strand[o] * sx, strand[o + 1] * sy, strand[o + 2] * sz, out);

    if (out[2] < 0) {
      flush(false);
      lastPoint = null;
    } else {
      const x = out[0];
      const y = out[1];
      const isLast = i === grownSteps - 1;
      const far =
        !points ||
        (x - lastX) * (x - lastX) + (y - lastY) * (y - lastY) >= minDistanceSq;

      if (!points) {
        points = [];
        depthSum = 0;
      }
      if (far || isLast) {
        lastPoint = `${x.toFixed(COORD_DECIMALS)},${y.toFixed(COORD_DECIMALS)}`;
        [, , lastDepth] = out;
        points.push(lastPoint);
        depthSum += out[2];
        lastX = x;
        lastY = y;
        if (chunkPoints > 0 && points.length >= chunkPoints) flush(true);
      }
    }
  }
  flush(false);

  return chunks;
}

function bloomFilter(strength, radiusPx) {
  return `<filter id="bloom" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${radiusPx.toFixed(2)}" result="glow"/><feComposite in="glow" in2="SourceGraphic" operator="arithmetic" k1="0" k2="${strength.toFixed(3)}" k3="1" k4="0"/></filter>`;
}

// `bundles` and `styles` come straight from generateStructure/computeStyles;
// grow the bundles first (growBundle) or only the validated prefix renders.
//
// `layer: 'bright'` draws each bundle (and the background) as its excess over
// `bloomThreshold` in linear light, black where nothing clears it — the bright
// pass for the raster bloom in scripts/rorschach-generate.mjs. Thresholding
// properly rather than just picking the emissive bundles matters because some
// presets ship bloomThreshold below 1, where bright ordinary strokes and a
// light background bloom too.
export default function renderTestSvg({
  backgroundColor = '#f4efe4',
  bloomEnabled = true,
  bloomRadius = 0.3,
  bloomStrength = 0.5,
  bloomThreshold = 1,
  bundles,
  chunkPoints = DEFAULT_CHUNK_POINTS,
  distance = DEFAULT_DISTANCE,
  eye,
  flatten = 0,
  flattenAxis = 'z',
  fov = DEFAULT_FOV,
  height = 1080,
  layer = 'all',
  scale = 1,
  simplifyPx = DEFAULT_SIMPLIFY_PX,
  strokeWidth = 1,
  styles,
  target = [0, 0, 0],
  view = 'front',
  width = 1080,
}) {
  const project = createProjector({
    eye: eye ?? viewEye(view, distance),
    fov,
    height,
    target,
    up: [0, 1, 0],
    width,
  });

  const [sx, sy, sz] = axisScale(scale, flatten, flattenAxis);

  const brightPass = layer === 'bright';
  const pieces = [];
  let hasEmissive = false;

  bundles.forEach((bundle, index) => {
    const style = styles[index];
    if (!style || style.visible === false) return;

    const emissive = style.emissive === true;
    const linear = bundleLinear(
      hslToHex(style.color.h, style.color.s, style.color.l),
      emissive,
      style.emissiveIntensity ?? 2
    );
    const stroke = brightPass
      ? excessOverThreshold(linear, bloomThreshold)
      : linearToHex(linear);
    if (stroke === null) return;
    if (emissive) hasEmissive = true;

    bundle.strands.forEach((strand) => {
      projectStrand(
        strand,
        bundle.grownSteps,
        sx,
        sy,
        sz,
        project,
        simplifyPx,
        chunkPoints
      ).forEach((chunk) => {
        pieces.push({
          depth: chunk.depth,
          emissive,
          points: chunk.points.join(' '),
          stroke,
        });
      });
    });
  });

  // Painter's algorithm over short chunks of stroke rather than whole bundles.
  // Per-bundle ordering is fine head-on but falls apart under rotation: two
  // interpenetrating bundles swap places all at once the moment their mean
  // depths cross, which reads as the whole form popping inside out. Chunks
  // cross over individually, so the transition is gradual and local. Still an
  // approximation of the scene's real depth buffer, just a much finer one.
  pieces.sort((a, b) => b.depth - a.depth);

  const useBloom = bloomEnabled && hasEmissive && !brightPass;
  const body = pieces
    .map(
      (piece) => `<polyline stroke="${piece.stroke}" points="${piece.points}"/>`
    )
    .join('');

  // The standalone .svg can't express the raster bloom the PNG gets, so the
  // emissive chunks are drawn a second time through a blur filter on top of
  // the correctly sorted geometry — additive glow without disturbing the
  // depth order underneath.
  const glow = useBloom
    ? `<g filter="url(#bloom)">${pieces
        .filter((piece) => piece.emissive)
        .map(
          (piece) =>
            `<polyline stroke="${piece.stroke}" points="${piece.points}"/>`
        )
        .join('')}</g>`
    : '';

  const defs = useBloom
    ? `<defs>${bloomFilter(bloomStrength, bloomRadius * 0.02 * Math.min(width, height))}</defs>`
    : '';

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">${
      defs
    }<rect width="${width}" height="${height}" fill="${
      brightPass
        ? (excessOverThreshold(hexToLinear(backgroundColor), bloomThreshold) ??
          '#000000')
        : backgroundColor
    }"/>` +
    `<g fill="none" stroke-width="${strokeWidth}" stroke-linecap="round" ` +
    `stroke-linejoin="round">${body}${glow}</g>` +
    `</svg>`
  );
}
