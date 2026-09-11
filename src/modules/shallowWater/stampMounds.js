/* eslint-disable no-param-reassign */
import { fbm2, valueNoise2 } from '@utils/noise2d';

function ridged(x, z, seed, octaves) {
  return 1 - Math.abs(fbm2(x, z, { seed, octaves }) * 2 - 1);
}

// Radial bumps stamped onto a baked heightfield: sea stacks standing off a
// coast, boulders and cobbles sitting in a stream bed. Each mound carries a
// footprint, an elongation and heading, a lobed outline and a profile exponent
// that runs from dome to flat-topped table, because every one of these being
// the same object at a different scale is what makes a field of them read as
// scattered confetti rather than as rock.
//
// Only the cells inside a mound's reach are touched, so re-stamping is cheap
// enough to drive from a slider while the expensive terrain bake underneath
// stays cached.
export default function stampMounds(field, mounds, { resolution, worldSize }) {
  const n = resolution;
  const cell = worldSize / (n - 1);

  for (let m = 0; m < mounds.length; m += 1) {
    const mound = mounds[m];
    const iLo = Math.max(
      0,
      Math.ceil((mound.x - mound.reach) / cell + (n - 1) / 2)
    );
    const iHi = Math.min(
      n - 1,
      Math.floor((mound.x + mound.reach) / cell + (n - 1) / 2)
    );
    const jLo = Math.max(
      0,
      Math.ceil((n - 1) / 2 - (mound.z + mound.reach) / cell)
    );
    const jHi = Math.min(
      n - 1,
      Math.floor((n - 1) / 2 - (mound.z - mound.reach) / cell)
    );

    const cos = Math.cos(mound.heading);
    const sin = Math.sin(mound.heading);

    for (let j = jLo; j <= jHi; j += 1) {
      const worldZ = (0.5 - j / (n - 1)) * worldSize;
      for (let i = iLo; i <= iHi; i += 1) {
        const worldX = (i / (n - 1) - 0.5) * worldSize;
        const ox = worldX - mound.x;
        const oz = worldZ - mound.z;
        // Into the mound's own frame, stretched along its heading.
        const along = (ox * cos + oz * sin) / (mound.radius * mound.stretch);
        const across = (oz * cos - ox * sin) / mound.radius;
        // Lobed rather than elliptical. Without this every outline is a
        // perfect oval and the cluster reads as scattered pebbles.
        const warp =
          1 +
          (valueNoise2(worldX * 0.55, worldZ * 0.55, mound.seed) - 0.5) *
            mound.rough;
        const r = Math.sqrt(along * along + across * across) * warp;
        const falloff = Math.exp(-(r ** (mound.sharpness * 2)) * 1.1);
        field[(j * n + i) * 4] +=
          mound.height *
          falloff *
          (0.65 +
            0.7 *
              ridged(
                worldX * mound.mottleScale,
                worldZ * mound.mottleScale,
                mound.seed,
                2
              ));
      }
    }
  }

  return field;
}
