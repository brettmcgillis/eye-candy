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

export function voidRadiusAt(depth, p) {
  const drift = fbm1(depth / p.radiusDriftWavelength + 3.7, 3);
  return Math.max(2, p.voidRadius * (1 + p.radiusDriftAmount * drift));
}

export function axisAt(depth, p, origin) {
  const t = depth / p.axisDriftWavelength;
  return {
    x: p.axisDriftAmount * fbm1(t + 11.3, 3) - (origin ? origin.x : 0),
    z: p.axisDriftAmount * fbm1(t + 71.7, 3) - (origin ? origin.z : 0),
  };
}

// The camera orbits the world origin, so the shaft is re-centred on its own
// axis at camera height. Without this, axis drift walks the stair into the
// camera.
export function axisOriginFor(windowTop, p) {
  return axisAt(windowTop + p.aboveCamera, p);
}

// The warp displaces depth before it becomes rotation, so turns crowd where
// the warp rises. Capped so d(depth + warp)/d(depth) can never reach zero —
// a non-monotonic angle would fold the helix back through itself.
const WARP_SLOPE_LIMIT = 0.9;
const NOISE_MAX_SLOPE = 4.1;

function pitchWarpAt(depth, p) {
  if (p.overlapAmount <= 0) return 0;
  const ceiling =
    (WARP_SLOPE_LIMIT * p.overlapWavelength) / NOISE_MAX_SLOPE / p.risePerTurn;
  const turns = Math.min(p.overlapAmount, ceiling);
  return turns * p.risePerTurn * fbm1(depth / p.overlapWavelength + 29.1, 3);
}

export function angleAt(depth, p) {
  const warped = depth + pitchWarpAt(depth, p);
  return ((TAU * warped) / p.risePerTurn) * (p.clockwise ? 1 : -1);
}

export function landingDepth(index, p) {
  const drift = fbm1(index / p.landingDriftPeriod + 53.3, 3);
  return (
    index * p.landingSpacing + p.landingDriftAmount * p.landingSpacing * drift
  );
}

export function landingIndicesInRange(fromDepth, toDepth, p) {
  const slack = p.landingDriftAmount * p.landingSpacing + p.landingSpacing;
  return {
    first: Math.floor((fromDepth - slack) / p.landingSpacing),
    last: Math.ceil((toDepth + slack) / p.landingSpacing),
  };
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

export function fillProfile(
  arrays,
  windowTop,
  windowDepth,
  p,
  landings,
  origin
) {
  const { axisData, angleData, lightData } = arrays;
  const ds = windowDepth / (SLICE_COUNT - 1);
  const h = Math.max(0.05, ds * 0.5);
  let colX = 0;
  let colZ = 0;
  let colR = -1;

  for (let i = 0; i < SLICE_COUNT; i += 1) {
    const s = i * ds;
    const depth = windowTop + s;
    const radius = voidRadiusAt(depth, p);
    const axis = axisAt(depth, p, origin);
    const angle = angleAt(depth, p);
    const o = i * 4;

    axisData[o] = axis.x;
    axisData[o + 1] = axis.z;
    axisData[o + 2] = radius;
    axisData[o + 3] = 0;
    for (let k = 0; k < landings.length; k += 1) {
      const landing = landings[k];
      if (s >= landing.s && s <= landing.s + landing.span) {
        axisData[o + 3] = 1;
        break;
      }
    }

    angleData[o] = Math.cos(angle);
    angleData[o + 1] = Math.sin(angle);
    angleData[o + 2] =
      (angleAt(depth + h, p) - angleAt(depth - h, p)) / (2 * h);
    angleData[o + 3] = 0;

    if (colR < 0) {
      colX = axis.x;
      colZ = axis.z;
      colR = radius;
    } else {
      colR = Math.min(colR + p.columnRecovery * ds, radius);
      const merged = intersectDisc(colX, colZ, colR, axis.x, axis.z, radius);
      colX = merged.x;
      colZ = merged.z;
      colR = merged.r;
    }

    lightData[o] = colX;
    lightData[o + 1] = colZ;
    lightData[o + 2] = colR;
    lightData[o + 3] =
      p.shaftFloor + (1 - p.shaftFloor) * Math.exp(-p.shaftFalloff * s);
  }
}
