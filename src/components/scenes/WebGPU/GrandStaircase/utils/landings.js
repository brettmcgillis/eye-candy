import {
  angleAt,
  angleRateAt,
  axisAt,
  hash01,
  landingIndicesInRange,
  landingPosition,
  riseAt,
  rotateXZ,
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

export function collectLandings(uTop, uSpan, p) {
  const { first, last } = landingIndicesInRange(uTop, uTop + uSpan, p);
  const landings = [];
  for (let n = first; n <= last && landings.length < MAX_LANDINGS; n += 1) {
    const u = landingPosition(n, p);
    if (u >= uTop - p.landingSpacing && u <= uTop + uSpan) {
      const rate = Math.max(1e-4, Math.abs(angleRateAt(u, p)));
      landings.push({
        index: n,
        u,
        plateau: (p.landingArc * TAU) / rate,
        arc: p.landingArc * TAU,
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

export function fillLandingBuffers(arrays, landings, p, origin, spin, riseTop) {
  const { landingData, landingAxisData, mouthData, mouthExtraData, flareData } =
    arrays;
  const halfArc = p.landingArc * TAU * 0.5;
  let mouths = 0;
  let flares = 0;

  for (let i = 0; i < landings.length; i += 1) {
    const landing = landings[i];
    const o = i * 4;
    const height = riseAt(landing.u, landings) - riseTop;
    const y = p.aboveCamera - height;
    // Sweep the arc the helix actually climbs across the plateau, not the
    // nominal one — pitch warp varies the rate, so the nominal arc misses
    // where the next flight resumes.
    const baseAngle = angleAt(landing.u, p) + spin;
    const sweptArc =
      angleAt(landing.u + landing.plateau, p) - angleAt(landing.u, p);
    const raw = axisAt(landing.u, p, origin);
    const axis = rotateXZ(raw.x, raw.z, spin);
    const voidRadius = voidRadiusAt(landing.u, p);

    landingData[o] = height;
    landingData[o + 1] = sweptArc;
    landingData[o + 2] = Math.cos(baseAngle);
    landingData[o + 3] = Math.sin(baseAngle);
    landingAxisData[o] = axis.x;
    landingAxisData[o + 1] = axis.z;
    landingAxisData[o + 2] = voidRadius;
    landingAxisData[o + 3] = 0;
    const wallRadius = voidRadius + p.stairWidth + p.wallGap;
    const count = mouthCountFor(landing.index, p);

    for (let slot = 0; slot < count && mouths < MAX_MOUTHS; slot += 1) {
      const jitter = hash01(landing.index * 5.7 + slot * 2.3) * 2 - 1;
      const angle = baseAngle + sweptArc * 0.5 + jitter * halfArc * 0.7;
      const m = mouths * 4;
      mouthData[m] = y + p.mouthSill;
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
