import {
  allLandings,
  angleAt,
  axisAt,
  riseTo,
  voidRadiusAt,
} from '@modules/houseOfLeaves';

const QUANTA = { radius: 0.25, riser: 0.002, arc: 1e-6 };

const snap = (value, step) => Math.round(value / step) * step;

// A flight is whatever lies between two landings, so the landing drift decides
// how many steps it has — the number between landings never settles, which is
// the one countable cue a viewer has to hold onto.
//
// Geometry is keyed on the quantised shape rather than the flight index, so
// two flights that happen to come out the same size share one buffer.
export function collectRuns(fromU, toU, config) {
  const p = config.shaft;
  const all = allLandings(p);
  // The descent is bracketed by a virtual landing at the top (the room's
  // rim, where the stair begins) and the floor at the bottom.
  const ordered = [
    { u: 0, plateau: 0, virtual: true },
    ...all,
    { u: p.descentLength, plateau: 0, virtual: true },
  ].sort((a, b) => a.u - b.u);
  const heightAt = (u) => -riseTo(u, p);
  const radiusAt = (u) => snap(voidRadiusAt(u, p), QUANTA.radius);

  const runs = [];
  for (let i = 0; i < ordered.length - 1; i += 1) {
    const above = ordered[i];
    const below = ordered[i + 1];
    const u0 = above.u + above.plateau;
    const u1 = below.u;
    if (u1 > u0 && u1 >= fromU && u0 <= toU) {
      const rise = u1 - u0;
      const stepCount = Math.max(1, Math.round(rise / config.riser));
      const riser = rise / stepCount;
      const arcPerStep = (angleAt(u1, p) - angleAt(u0, p)) / stepCount;
      const innerRadius = radiusAt(u0);
      const innerRadiusEnd = radiusAt(u1);
      const axis = axisAt(u0, p);
      const axisEnd = axisAt(u1, p);
      runs.push({
        key: [
          stepCount,
          innerRadius,
          innerRadiusEnd,
          snap(riser, QUANTA.riser),
          snap(arcPerStep, QUANTA.arc),
          snap(axisEnd.x - axis.x, 0.01),
          snap(axisEnd.z - axis.z, 0.01),
        ].join('|'),
        u0,
        u1,
        stepCount,
        riser,
        arcPerStep,
        innerRadius,
        innerRadiusEnd,
        axisShift: { x: axisEnd.x - axis.x, z: axisEnd.z - axis.z },
        x: axis.x,
        y: heightAt(u0),
        z: axis.z,
        rotation: -angleAt(u0, p),
      });
    }
  }

  const plates = all
    .filter(
      (landing) => landing.u >= fromU - landing.plateau && landing.u <= toU
    )
    .map((landing) => {
      const end = landing.u + landing.plateau;
      const innerRadius = radiusAt(landing.u);
      const axis = axisAt(landing.u, p);
      const swept = angleAt(end, p) - angleAt(landing.u, p);
      return {
        key: [innerRadius, snap(swept, QUANTA.arc)].join('|'),
        innerRadius,
        uStart: landing.u,
        arc: swept,
        x: axis.x,
        y: heightAt(landing.u),
        z: axis.z,
        rotation: -angleAt(landing.u, p),
      };
    });

  return { landings: all, runs, plates };
}

export function createGeometryCache(limit = 96) {
  const entries = new Map();
  return {
    get(key, build) {
      const hit = entries.get(key);
      if (hit) {
        entries.delete(key);
        entries.set(key, hit);
        return hit;
      }
      const made = build();
      entries.set(key, made);
      if (entries.size > limit) {
        const oldest = entries.keys().next().value;
        entries.get(oldest)?.dispose?.();
        entries.delete(oldest);
      }
      return made;
    },
    dispose() {
      entries.forEach((geometry) => geometry.dispose?.());
      entries.clear();
    },
  };
}
