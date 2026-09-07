import {
  angleAt,
  axisAt,
  hash01,
  openingAngularWidth,
  openingScaleFor,
  voidRadiusAt,
} from '@modules/houseOfLeaves';

// How many hallways leave a given landing. Most have none — a landing that
// always offered somewhere else to go would read as a junction rather than as
// a place the stair happens to pass.
function countFor(index, config) {
  const roll = hash01(index * 3.11 + 1.7);
  if (roll < config.mouthChanceNone) return 0;
  if (roll < config.mouthChanceNone + config.mouthChanceOne) return 1;
  return 2;
}

// Every threshold is the same arched profile and never the same size twice:
// from something a person fits through to an opening a train could take. The
// shape is the constant; the proportion is what refuses to settle.
export default function collectMouths(landings, config) {
  const p = config.shaft;
  const mouths = [];
  landings.forEach((landing) => {
    const count = countFor(landing.index, config);
    for (let k = 0; k < count; k += 1) {
      const seed = landing.index * 17.3 + k * 5.1;
      const scale = openingScaleFor(seed, config.mouthSpread);
      const width = Math.max(1.1, config.mouthWidth * scale);
      const height = Math.max(2, config.mouthHeight * scale);
      const radius = voidRadiusAt(landing.u, p) + config.stairWidth;
      // Placed inside the landing's own arc, so a mouth always opens onto
      // floor rather than onto the drop beside it.
      const t = 0.25 + hash01(seed + 0.9) * 0.5;
      mouths.push({
        key: `${landing.index}-${k}`,
        index: landing.index,
        u: landing.u,
        angle: angleAt(landing.u + landing.plateau * t, p),
        width,
        height,
        archRise: height * config.archRatio,
        radius,
        axis: axisAt(landing.u, p),
        // The loft is far too coarse to carve an arch — a doorway is barely a
        // quad or two across it. So the wall gives up a plain patch and a
        // curved panel carries the real arched opening into it. The panel is
        // sized generously and the patch cut tightly inside it: both sit at
        // the same radius in the same material, so an overlap is invisible
        // where a gap would not be.
        panelArc: openingAngularWidth(radius, width) * 1.6,
        panelHeight: height * 1.35,
        panelBase: -1,
        flare: hash01(seed * 2.7 + 31.1) < config.flareChance,
      });
    }
  });
  return mouths;
}

// Flares left on the landings themselves. Placed toward the outer edge, so
// what the walker meets first is the spill across the floor rather than the
// thing burning.
export function collectLandingFlares(landings, config) {
  const p = config.shaft;
  return landings
    .filter(
      (landing) =>
        hash01(landing.index * 9.13 + 7.7) < config.flareLandingChance
    )
    .map((landing) => {
      const t = 0.3 + hash01(landing.index * 4.4 + 2.2) * 0.4;
      const radius =
        voidRadiusAt(landing.u, p) + config.stairWidth * (0.55 + t * 0.3);
      const angle = angleAt(landing.u + landing.plateau * t, p);
      return {
        key: `L${landing.index}`,
        index: landing.index,
        u: landing.u,
        angle,
        radius,
      };
    });
}
