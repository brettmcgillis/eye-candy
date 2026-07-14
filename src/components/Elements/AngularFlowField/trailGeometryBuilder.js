/* eslint-disable no-bitwise, no-param-reassign, prefer-destructuring */
// prefer-destructuring is disabled file-wide: this module copies individual
// x/y/z components between pre-allocated Float32Array scratch buffers in
// hot loops — `[a[0], a[1], a[2]] = [b[0], b[1], b[2]]`-style destructuring
// reads worse here than the plain indexed assignments it would replace.
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DynamicDrawUsage,
} from 'three';

const PROFILE_CORNERS = [
  [1, 1],
  [-1, 1],
  [-1, -1],
  [1, -1],
];
const PROFILE_EDGES = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
];

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function hashUint32(value) {
  let x = value >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
}

function seededRandom01(seed, index) {
  const mixed = hashUint32((seed ^ Math.imul(index + 1, 0x9e3779b9)) >>> 0);
  return mixed / 0x100000000;
}

function normalizeVector(x, y, z) {
  const length = Math.sqrt(x * x + y * y + z * z);
  if (length <= 1e-8) {
    return [0, 1, 0];
  }
  return [x / length, y / length, z / length];
}

function choosePerpendicular(tx, ty, tz) {
  let ax = 0;
  let ay = 1;
  let az = 0;
  if (Math.abs(ty) > 0.92) {
    ax = 1;
    ay = 0;
    az = 0;
  }
  const nx = ay * tz - az * ty;
  const ny = az * tx - ax * tz;
  const nz = ax * ty - ay * tx;
  return normalizeVector(nx, ny, nz);
}

function blurScalarSeries(values, count, strength) {
  if (count <= 2 || strength <= 0) {
    return;
  }
  const passes = Math.max(1, Math.round(strength * 6));
  const amount = Math.min(0.55, Math.max(0, strength * 0.55));
  const temp = new Float32Array(count);
  for (let pass = 0; pass < passes; pass += 1) {
    temp[0] = values[0];
    temp[count - 1] = values[count - 1];
    for (let i = 1; i < count - 1; i += 1) {
      const avg = (values[i - 1] + values[i] + values[i + 1]) / 3;
      temp[i] = values[i] + (avg - values[i]) * amount;
    }
    for (let i = 1; i < count - 1; i += 1) {
      values[i] = temp[i];
    }
  }
}

function readTrailPoint(state, emitterIndex, pointIndex, out) {
  const read = (emitterIndex * state.trailCapacity + pointIndex) * 3;
  out[0] = state.trailPoints[read];
  out[1] = state.trailPoints[read + 1];
  out[2] = state.trailPoints[read + 2];
}

// Arc-length displacement (0..1 along the trail) and bend-angle curvature
// (0..1, 0 at the endpoints) per point — the two gradient axes `colorMode`
// can drive. `out.displacement`/`out.curvature` must be at least `filled` long.
function computeGradientScalars(state, emitter, filled, gradientBlur, out) {
  const { displacement, curvature, p0, p1, p2 } = out;

  displacement[0] = 0;
  curvature[0] = 0;
  let totalLength = 0;
  readTrailPoint(state, emitter, 0, p0);
  for (let i = 1; i < filled; i += 1) {
    readTrailPoint(state, emitter, i, p1);
    const dx = p1[0] - p0[0];
    const dy = p1[1] - p0[1];
    const dz = p1[2] - p0[2];
    totalLength += Math.sqrt(dx * dx + dy * dy + dz * dz);
    displacement[i] = totalLength;
    p0[0] = p1[0];
    p0[1] = p1[1];
    p0[2] = p1[2];
  }
  if (totalLength > 1e-8) {
    const inv = 1 / totalLength;
    for (let i = 1; i < filled; i += 1) {
      displacement[i] *= inv;
    }
  }

  for (let i = 1; i < filled - 1; i += 1) {
    readTrailPoint(state, emitter, i - 1, p0);
    readTrailPoint(state, emitter, i, p1);
    readTrailPoint(state, emitter, i + 1, p2);
    const ax = p1[0] - p0[0];
    const ay = p1[1] - p0[1];
    const az = p1[2] - p0[2];
    const bx = p2[0] - p1[0];
    const by = p2[1] - p1[1];
    const bz = p2[2] - p1[2];
    const al = Math.sqrt(ax * ax + ay * ay + az * az);
    const bl = Math.sqrt(bx * bx + by * by + bz * bz);
    if (al > 1e-6 && bl > 1e-6) {
      const dot = Math.min(
        1,
        Math.max(-1, (ax * bx + ay * by + az * bz) / (al * bl))
      );
      curvature[i] = Math.acos(dot) / Math.PI;
    } else {
      curvature[i] = 0;
    }
  }
  curvature[filled - 1] = 0;

  blurScalarSeries(displacement, filled, gradientBlur);
  blurScalarSeries(curvature, filled, gradientBlur);
}

function gradientT(colorMode, displacement, curvature, index, contrast, bias) {
  if (colorMode === 'solid') {
    return 0;
  }
  const raw =
    colorMode === 'curvature' ? curvature[index] : displacement[index];
  return clamp01(raw * contrast + bias);
}

// Allocates the fixed-size typed arrays a rebuild of either render mode
// writes into — sized once from structural capacity (emitterCount *
// trailCapacity), never reallocated per frame. `renderMode` picks which
// geometry attributes get a backing BufferGeometry.
export function createTrailScratch({
  emitterCount,
  trailCapacity,
  renderMode,
}) {
  const maxPoints = emitterCount * trailCapacity;
  const geometry = new BufferGeometry();

  if (renderMode === 'tube') {
    // Per emitter: `filled` ring vertices (4 corners each). Open-ended tube —
    // no start/end cap geometry (see writeTubeGeometry's doc comment).
    const maxVertices = maxPoints * 4;
    // Per emitter: (filled - 1) ring segments, 24 indices each.
    const maxIndices = Math.max(0, maxPoints - emitterCount) * 24;

    const positions = new BufferAttribute(new Float32Array(maxVertices * 3), 3);
    const normals = new BufferAttribute(new Float32Array(maxVertices * 3), 3);
    const colors = new BufferAttribute(new Float32Array(maxVertices * 3), 3);
    positions.setUsage(DynamicDrawUsage);
    normals.setUsage(DynamicDrawUsage);
    colors.setUsage(DynamicDrawUsage);
    geometry.setAttribute('position', positions);
    geometry.setAttribute('normal', normals);
    geometry.setAttribute('color', colors);
    geometry.setIndex(new BufferAttribute(new Uint32Array(maxIndices), 1));
    geometry.setDrawRange(0, 0);

    return {
      geometry,
      scratchPoint0: new Float32Array(3),
      scratchPoint1: new Float32Array(3),
      scratchPoint2: new Float32Array(3),
      displacement: new Float32Array(trailCapacity),
      curvature: new Float32Array(trailCapacity),
    };
  }

  const positions = new BufferAttribute(new Float32Array(maxPoints * 3), 3);
  const colors = new BufferAttribute(new Float32Array(maxPoints * 3), 3);
  positions.setUsage(DynamicDrawUsage);
  colors.setUsage(DynamicDrawUsage);
  geometry.setAttribute('position', positions);
  geometry.setAttribute('color', colors);
  geometry.setDrawRange(0, 0);

  return {
    geometry,
    displacement: new Float32Array(trailCapacity),
    curvature: new Float32Array(trailCapacity),
  };
}

// Writes every emitter's current points straight into `scratch`'s pre-sized
// position/color attributes (one vertex per trail point — no ring/tube
// geometry). Colors follow `colorMode`.
export function writePointsGeometry(state, paletteSettings, scratch) {
  const { geometry, displacement, curvature } = scratch;
  const positionAttr = geometry.getAttribute('position');
  const colorAttr = geometry.getAttribute('color');
  const positions = positionAttr.array;
  const colors = colorAttr.array;
  const gradientStart = new Color(paletteSettings.colorStart);
  const gradientEnd = new Color(paletteSettings.colorEnd);
  const point = new Float32Array(3);
  const scratchOut = {
    displacement,
    curvature,
    p0: new Float32Array(3),
    p1: new Float32Array(3),
    p2: new Float32Array(3),
  };

  let write = 0;
  for (let emitter = 0; emitter < state.emitterCount; emitter += 1) {
    const filled = state.filledLengths[emitter];
    if (filled <= 0) {
      // eslint-disable-next-line no-continue
      continue;
    }
    if (filled > 1) {
      computeGradientScalars(
        state,
        emitter,
        filled,
        paletteSettings.gradientBlur,
        scratchOut
      );
    } else {
      displacement[0] = 0;
      curvature[0] = 0;
    }

    for (let i = 0; i < filled; i += 1) {
      readTrailPoint(state, emitter, i, point);
      const base = write * 3;
      positions[base] = point[0];
      positions[base + 1] = point[1];
      positions[base + 2] = point[2];

      const t = gradientT(
        paletteSettings.colorMode,
        displacement,
        curvature,
        i,
        paletteSettings.curvatureContrast,
        paletteSettings.curvatureBias
      );
      colors[base] = gradientStart.r + (gradientEnd.r - gradientStart.r) * t;
      colors[base + 1] =
        gradientStart.g + (gradientEnd.g - gradientStart.g) * t;
      colors[base + 2] =
        gradientStart.b + (gradientEnd.b - gradientStart.b) * t;
      write += 1;
    }
  }

  positionAttr.needsUpdate = true;
  colorAttr.needsUpdate = true;
  geometry.setDrawRange(0, write);
  geometry.computeBoundingSphere();
}

// Writes every emitter's trail as a swept square-profile tube (parallel-
// transport frame along the trail, quad-strip walls) into `scratch`'s
// pre-sized attributes. Simplifications vs. the ported reference: no
// start/end cap geometry (open-ended tube) and no thickness-based point
// smoothing/compaction — every trail point becomes its own ring, which is
// fine since points are already discrete-direction snapped (already blocky)
// and keeps the vertex/index bounds exact and known upfront.
export function writeTubeGeometry(
  state,
  particleSettings,
  paletteSettings,
  scratch
) {
  const {
    geometry,
    displacement,
    curvature,
    scratchPoint0,
    scratchPoint1,
    scratchPoint2,
  } = scratch;
  const positionAttr = geometry.getAttribute('position');
  const normalAttr = geometry.getAttribute('normal');
  const colorAttr = geometry.getAttribute('color');
  const indexAttr = geometry.getIndex();
  const positions = positionAttr.array;
  const normals = normalAttr.array;
  const colors = colorAttr.array;
  const indices = indexAttr.array;

  const gradientStart = new Color(paletteSettings.colorStart);
  const gradientEnd = new Color(paletteSettings.colorEnd);
  const minRaw = Math.min(10, Math.max(0.1, particleSettings.thicknessMin));
  const maxRaw = Math.min(10, Math.max(0.1, particleSettings.thicknessMax));
  const thicknessMin = Math.min(minRaw, maxRaw);
  const thicknessMax = Math.max(minRaw, maxRaw);
  const thicknessSpan = thicknessMax - thicknessMin;
  const thicknessSeed =
    Math.max(0, Math.round(particleSettings.thicknessSeed)) >>> 0;

  const scratchOut = {
    displacement,
    curvature,
    p0: scratchPoint0,
    p1: scratchPoint1,
    p2: scratchPoint2,
  };
  const tangent = new Float32Array(3);
  const normal = new Float32Array(3);
  const prevNormal = new Float32Array(3);
  const binormal = new Float32Array(3);

  let vertexWrite = 0;
  let indexWrite = 0;

  for (let emitter = 0; emitter < state.emitterCount; emitter += 1) {
    const filled = state.filledLengths[emitter];
    if (filled < 2) {
      // eslint-disable-next-line no-continue
      continue;
    }

    computeGradientScalars(
      state,
      emitter,
      filled,
      paletteSettings.gradientBlur,
      scratchOut
    );

    const thicknessRandom = seededRandom01(thicknessSeed, emitter);
    const trailThickness =
      thicknessSpan <= 1e-6
        ? thicknessMin
        : thicknessMin + thicknessRandom * thicknessSpan;
    const profileHalfSize = Math.max(0.00075, trailThickness * 0.0032);
    const ringBase = vertexWrite;

    for (let i = 0; i < filled; i += 1) {
      readTrailPoint(state, emitter, i, scratchPoint1);
      if (i === 0) {
        readTrailPoint(state, emitter, 1, scratchPoint2);
        tangent.set(
          normalizeVector(
            scratchPoint2[0] - scratchPoint1[0],
            scratchPoint2[1] - scratchPoint1[1],
            scratchPoint2[2] - scratchPoint1[2]
          )
        );
        normal.set(choosePerpendicular(tangent[0], tangent[1], tangent[2]));
      } else {
        readTrailPoint(state, emitter, i - 1, scratchPoint0);
        const prev = i < filled - 1 ? i + 1 : i;
        readTrailPoint(state, emitter, prev, scratchPoint2);
        tangent.set(
          normalizeVector(
            scratchPoint2[0] - scratchPoint0[0],
            scratchPoint2[1] - scratchPoint0[1],
            scratchPoint2[2] - scratchPoint0[2]
          )
        );
        prevNormal.set(normal);
        const projectedDot =
          prevNormal[0] * tangent[0] +
          prevNormal[1] * tangent[1] +
          prevNormal[2] * tangent[2];
        let nx = prevNormal[0] - projectedDot * tangent[0];
        let ny = prevNormal[1] - projectedDot * tangent[1];
        let nz = prevNormal[2] - projectedDot * tangent[2];
        if (nx * nx + ny * ny + nz * nz <= 1e-12) {
          const fallback = choosePerpendicular(
            tangent[0],
            tangent[1],
            tangent[2]
          );
          [nx, ny, nz] = fallback;
        }
        normal.set(normalizeVector(nx, ny, nz));
      }
      binormal.set(
        normalizeVector(
          tangent[1] * normal[2] - tangent[2] * normal[1],
          tangent[2] * normal[0] - tangent[0] * normal[2],
          tangent[0] * normal[1] - tangent[1] * normal[0]
        )
      );

      const t = gradientT(
        paletteSettings.colorMode,
        displacement,
        curvature,
        i,
        paletteSettings.curvatureContrast,
        paletteSettings.curvatureBias
      );
      const cr = gradientStart.r + (gradientEnd.r - gradientStart.r) * t;
      const cg = gradientStart.g + (gradientEnd.g - gradientStart.g) * t;
      const cb = gradientStart.b + (gradientEnd.b - gradientStart.b) * t;

      for (let corner = 0; corner < PROFILE_CORNERS.length; corner += 1) {
        const [sx, sy] = PROFILE_CORNERS[corner];
        const ox = (normal[0] * sx + binormal[0] * sy) * profileHalfSize;
        const oy = (normal[1] * sx + binormal[1] * sy) * profileHalfSize;
        const oz = (normal[2] * sx + binormal[2] * sy) * profileHalfSize;
        const vBase = vertexWrite * 3;
        positions[vBase] = scratchPoint1[0] + ox;
        positions[vBase + 1] = scratchPoint1[1] + oy;
        positions[vBase + 2] = scratchPoint1[2] + oz;
        const faceNormal = normalizeVector(
          normal[0] * sx + binormal[0] * sy,
          normal[1] * sx + binormal[1] * sy,
          normal[2] * sx + binormal[2] * sy
        );
        normals[vBase] = faceNormal[0];
        normals[vBase + 1] = faceNormal[1];
        normals[vBase + 2] = faceNormal[2];
        colors[vBase] = cr;
        colors[vBase + 1] = cg;
        colors[vBase + 2] = cb;
        vertexWrite += 1;
      }

      if (i > 0) {
        const ringA = ringBase + (i - 1) * 4;
        const ringB = ringBase + i * 4;
        for (let edge = 0; edge < PROFILE_EDGES.length; edge += 1) {
          const [a, b] = PROFILE_EDGES[edge];
          indices[indexWrite] = ringA + a;
          indices[indexWrite + 1] = ringA + b;
          indices[indexWrite + 2] = ringB + b;
          indices[indexWrite + 3] = ringA + a;
          indices[indexWrite + 4] = ringB + b;
          indices[indexWrite + 5] = ringB + a;
          indexWrite += 6;
        }
      }
    }
  }

  positionAttr.needsUpdate = true;
  normalAttr.needsUpdate = true;
  colorAttr.needsUpdate = true;
  indexAttr.needsUpdate = true;
  geometry.setDrawRange(0, indexWrite);
  geometry.computeBoundingSphere();
}
