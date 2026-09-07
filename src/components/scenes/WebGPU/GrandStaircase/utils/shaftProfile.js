export const SLICE_COUNT = 1024;

export const FEET = 0.3048;

const TAU = Math.PI * 2;
const FBM_GAIN = 0.5;
const FBM_LACUNARITY = 2.03;

function hash1(n) {
  const s = Math.sin(n * 127.1) * 43758.5453123;
  return (s - Math.floor(s)) * 2 - 1;
}

export function hash01(n) {
  return hash1(n) * 0.5 + 0.5;
}

function valueNoise1(x) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash1(i) * (1 - u) + hash1(i + 1) * u;
}

export function fbm1(x, octaves = 4) {
  let sum = 0;
  let total = 0;
  let amp = 1;
  let freq = 1;
  for (let o = 0; o < octaves; o += 1) {
    sum += amp * valueNoise1(x * freq);
    total += amp;
    amp *= FBM_GAIN;
    freq *= FBM_LACUNARITY;
  }
  return sum / total;
}

export function voidRadiusAt(u, p) {
  const drift = fbm1(u / p.radiusDriftWavelength + 3.7, 3);
  return Math.max(2, p.voidRadius * (1 + p.radiusDriftAmount * drift));
}

export function axisAt(u, p, origin) {
  const t = u / p.axisDriftWavelength;
  return {
    x: p.axisDriftAmount * fbm1(t + 11.3, 3) - (origin ? origin.x : 0),
    z: p.axisDriftAmount * fbm1(t + 71.7, 3) - (origin ? origin.z : 0),
  };
}

const WARP_SLOPE_LIMIT = 0.9;
const NOISE_MAX_SLOPE = 4.1;

function pitchWarpAt(u, p) {
  if (p.overlapAmount <= 0) return 0;
  const ceiling =
    (WARP_SLOPE_LIMIT * p.overlapWavelength) / NOISE_MAX_SLOPE / p.risePerTurn;
  const turns = Math.min(p.overlapAmount, ceiling);
  return turns * p.risePerTurn * fbm1(u / p.overlapWavelength + 29.1, 3);
}

export function angleAt(u, p) {
  const warped = u + pitchWarpAt(u, p);
  return ((TAU * warped) / p.risePerTurn) * (p.clockwise ? 1 : -1);
}

export function angleRateAt(u, p) {
  const h = 0.25;
  return (angleAt(u + h, p) - angleAt(u - h, p)) / (2 * h);
}

export function spinAt(u, p) {
  return -angleAt(u, p) * p.spinLock;
}

export function rotateXZ(x, z, angle) {
  const c = Math.cos(angle);
  const sn = Math.sin(angle);
  return { x: x * c - z * sn, z: x * sn + z * c };
}

export function landingPosition(index, p) {
  const drift = fbm1(index / p.landingDriftPeriod + 53.3, 3);
  return (
    index * p.landingSpacing + p.landingDriftAmount * p.landingSpacing * drift
  );
}

export function landingIndicesInRange(fromU, toU, p) {
  const slack = p.landingDriftAmount * p.landingSpacing + p.landingSpacing;
  return {
    first: Math.floor((fromU - slack) / p.landingSpacing),
    last: Math.ceil((toU + slack) / p.landingSpacing),
  };
}

// A landing is flat: it consumes an arc of the helix but no rise at all. So
// height is not the path parameter — `u` advances along the stair, and `rise`
// stalls across each landing's plateau. Without this the stair resumes a
// plateau's worth of rise below the landing it just left.
export function plateauBefore(u, landings) {
  let total = 0;
  for (let i = 0; i < landings.length; i += 1) {
    const landing = landings[i];
    const past = u - landing.u;
    if (past > 0) total += Math.min(past, landing.plateau);
  }
  return total;
}

export function riseAt(u, landings) {
  return u - plateauBefore(u, landings);
}

// Walks `u` forward until `delta` metres of rise have been consumed, stepping
// over plateaus for free. A plain solve would stall the treadmill whenever the
// window top sat inside a landing, since rise is flat there.
export function advanceRise(uTop, delta, landings) {
  let u = uTop;
  let remaining = delta;
  let guard = 0;
  while (remaining > 1e-9 && guard < 128) {
    let inside = null;
    let nextStart = Infinity;
    for (let i = 0; i < landings.length; i += 1) {
      const landing = landings[i];
      const end = landing.u + landing.plateau;
      if (u >= landing.u && u < end) {
        if (inside === null || end > inside) inside = end;
      } else if (landing.u > u && landing.u < nextStart) {
        nextStart = landing.u;
      }
    }
    if (inside !== null) {
      u = inside;
    } else {
      const step = Math.min(remaining, nextStart - u);
      u += step;
      remaining -= step;
    }
    guard += 1;
  }
  return u;
}

export function axisOriginFor(uAtCamera, p) {
  return axisAt(uAtCamera, p);
}

function intersectDisc(cx, cz, r, ax, az, ar) {
  const dx = ax - cx;
  const dz = az - cz;
  const dist = Math.hypot(dx, dz);
  if (dist < 1e-4) {
    return { x: cx, z: cz, r: Math.min(r, ar) };
  }
  const nx = dx / dist;
  const nz = dz / dist;
  const near = Math.max(-r, dist - ar);
  const far = Math.min(r, dist + ar);
  const width = far - near;
  if (width <= 0) {
    return { x: cx + nx * dist * 0.5, z: cz + nz * dist * 0.5, r: 0 };
  }
  const mid = (near + far) * 0.5;
  return {
    x: cx + nx * mid,
    z: cz + nz * mid,
    r: Math.min(r, ar, width * 0.5),
  };
}

// Two parameterisations, because they answer different questions. Steps and
// landings walk the stair, so they index by `u`. The wall and the volumetric
// ask "what is at this height", so they index by rise.
export function fillProfile(arrays, uTop, uSpan, p, landings, origin, spin) {
  const { axisData, angleData, wallData, lightData } = arrays;
  const du = uSpan / (SLICE_COUNT - 1);
  const riseTop = riseAt(uTop, landings);

  const heights = new Float32Array(SLICE_COUNT);

  for (let i = 0; i < SLICE_COUNT; i += 1) {
    const u = uTop + i * du;
    const radius = voidRadiusAt(u, p);
    const raw = axisAt(u, p, origin);
    const axis = rotateXZ(raw.x, raw.z, spin);
    const angle = angleAt(u, p) + spin;
    const rise = riseAt(u, landings) - riseTop;
    const o = i * 4;

    heights[i] = rise;

    axisData[o] = axis.x;
    axisData[o + 1] = axis.z;
    axisData[o + 2] = radius;
    axisData[o + 3] = 0;
    for (let k = 0; k < landings.length; k += 1) {
      const landing = landings[k];
      if (u >= landing.u && u <= landing.u + landing.plateau) {
        axisData[o + 3] = 1;
        break;
      }
    }

    angleData[o] = Math.cos(angle);
    angleData[o + 1] = Math.sin(angle);
    angleData[o + 2] = angleRateAt(u, p);
    angleData[o + 3] = rise;
  }

  const riseSpan = Math.max(1, heights[SLICE_COUNT - 1]);
  const dh = riseSpan / (SLICE_COUNT - 1);
  let cursor = 0;
  let colX = 0;
  let colZ = 0;
  let colR = -1;

  for (let j = 0; j < SLICE_COUNT; j += 1) {
    const height = j * dh;
    while (cursor < SLICE_COUNT - 2 && heights[cursor + 1] < height)
      cursor += 1;
    const lo = heights[cursor];
    const hi = heights[cursor + 1];
    const t = hi > lo ? (height - lo) / (hi - lo) : 0;
    const a = cursor * 4;
    const b = (cursor + 1) * 4;
    const axisX = axisData[a] + (axisData[b] - axisData[a]) * t;
    const axisZ = axisData[a + 1] + (axisData[b + 1] - axisData[a + 1]) * t;
    const radius = axisData[a + 2] + (axisData[b + 2] - axisData[a + 2]) * t;
    const o = j * 4;

    wallData[o] = axisX;
    wallData[o + 1] = axisZ;
    wallData[o + 2] = radius;
    wallData[o + 3] = 0;

    const aperture = radius * p.columnTighten;
    if (colR < 0) {
      colX = axisX;
      colZ = axisZ;
      colR = aperture;
    } else {
      colR = Math.min(colR + p.columnRecovery * dh, aperture);
      const merged = intersectDisc(colX, colZ, colR, axisX, axisZ, aperture);
      colX = merged.x;
      colZ = merged.z;
      colR = merged.r;
    }

    lightData[o] = colX;
    lightData[o + 1] = colZ;
    lightData[o + 2] = colR;
    lightData[o + 3] =
      p.shaftFloor + (1 - p.shaftFloor) * Math.exp(-p.shaftFalloff * height);
  }

  return riseSpan;
}
