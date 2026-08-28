import {
  angleAt,
  axisAt,
  hash01,
  landingDepth,
  landingIndicesInRange,
  voidRadiusAt,
} from './shaftProfile';

export const MAX_LANDINGS = 24;
export const MAX_MOUTHS = 16;
export const MAX_FLARES = 24;

const TAU = Math.PI * 2;

export function mouthCountFor(index, p) {
  const roll = hash01(index * 3.11 + 1.7);
  if (roll < p.mouthChanceNone) return 0;
  if (roll < p.mouthChanceNone + p.mouthChanceOne) return 1;
  return 2;
}

export function collectLandings(windowTop, windowDepth, p) {
  const { first, last } = landingIndicesInRange(
    windowTop,
    windowTop + windowDepth,
    p
  );
  const landings = [];
  for (let n = first; n <= last && landings.length < MAX_LANDINGS; n += 1) {
    const depth = landingDepth(n, p);
    const s = depth - windowTop;
    if (s >= -p.landingSpacing && s <= windowDepth) {
      const rate = Math.max(
        1e-4,
        Math.abs(angleAt(depth + 0.5, p) - angleAt(depth - 0.5, p))
      );
      landings.push({
        index: n,
        depth,
        s,
        span: (p.landingArc * TAU) / rate,
      });
    }
  }
  return landings;
}

function pushFlare(arrays, count, x, y, z, intensity) {
  if (count >= MAX_FLARES) return count;
  const { flareData } = arrays;
  const o = count * 4;
  flareData[o] = x;
  flareData[o + 1] = y;
  flareData[o + 2] = z;
  flareData[o + 3] = intensity;
  return count + 1;
}

export function fillLandingBuffers(arrays, landings, p, origin) {
  const { landingData, mouthData, mouthExtraData, flareData } = arrays;
  const halfArc = p.landingArc * TAU * 0.5;
  let mouths = 0;
  let flares = 0;

  for (let i = 0; i < landings.length; i += 1) {
    const landing = landings[i];
    const o = i * 4;
    landingData[o] = landing.s;
    landingData[o + 1] = landing.span;
    landingData[o + 2] = halfArc;
    landingData[o + 3] = landing.index;

    const baseAngle = angleAt(landing.depth, p);
    const axis = axisAt(landing.depth, p, origin);
    const voidRadius = voidRadiusAt(landing.depth, p);
    const wallRadius = voidRadius + p.stairWidth + p.wallGap;
    const y = p.aboveCamera - landing.s;
    const count = mouthCountFor(landing.index, p);

    for (let slot = 0; slot < count && mouths < MAX_MOUTHS; slot += 1) {
      const jitter = hash01(landing.index * 5.7 + slot * 2.3) * 2 - 1;
      const angle = baseAngle + jitter * halfArc * 0.7;
      const m = mouths * 4;
      mouthData[m] = landing.s - p.mouthSill;
      mouthData[m + 1] = angle;
      mouthData[m + 2] = p.mouthHeight * 0.5;
      mouthData[m + 3] = p.mouthWidth / Math.max(1, wallRadius) / 2;

      const hasRoom =
        hash01(landing.index * 9.13 + slot * 4.41 + 0.5) < p.flareRoomChance;
      mouthExtraData[m] = hasRoom ? 1 : 0;
      mouthExtraData[m + 1] = wallRadius;
      mouthExtraData[m + 2] = axis.x;
      mouthExtraData[m + 3] = axis.z;

      if (hasRoom) {
        const reach = wallRadius + p.tunnelLength + p.roomDepth * 0.5;
        flares = pushFlare(
          arrays,
          flares,
          axis.x + Math.cos(angle) * reach,
          y - p.mouthHeight * 0.5 + p.flareHeight,
          axis.z + Math.sin(angle) * reach,
          p.flareIntensity
        );
      }

      if (hash01(landing.index * 17.7 + slot * 6.1) < p.flareLandingChance) {
        const reach = voidRadius + p.stairWidth * p.landingWidthScale * 0.6;
        const spill = angle + (hash01(landing.index * 2.9 + slot) - 0.5) * 0.2;
        flares = pushFlare(
          arrays,
          flares,
          axis.x + Math.cos(spill) * reach,
          y + p.flareHeight,
          axis.z + Math.sin(spill) * reach,
          p.flareIntensity
        );
      }

      mouths += 1;
    }
  }

  for (let i = mouths; i < MAX_MOUTHS; i += 1) {
    mouthData[i * 4 + 2] = -1;
    mouthData[i * 4 + 3] = -1;
    mouthExtraData[i * 4] = 0;
  }
  for (let i = flares; i < MAX_FLARES; i += 1) {
    flareData[i * 4 + 3] = 0;
  }

  return { mouths, flares };
}
