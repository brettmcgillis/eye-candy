import { angleAt, axisAt, riseAt, voidRadiusAt } from '@modules/houseOfLeaves';

const QUANTA = { radius: 0.25, riser: 0.002, arc: 1e-6 };

const snap = (value, step) => Math.round(value / step) * step;

// A flight is whatever lies between two landings, so the landing drift decides
// how many steps it has — the number between landings never settles, which is
// the one countable cue a viewer has to hold onto.
//
// Geometry is keyed on the quantised shape rather than the flight index, so
// two flights that happen to come out the same size share one buffer. With the
// drift off that collapses to a single geometry for the whole descent; with it
// on the cache fills slowly and stays bounded.
export function collectRuns(progress, behind, ahead, config, frame) {
  const p = config.shaft;
  const fromU = progress - behind;
  const toU = progress + ahead;
  const { landings, riseRef } = frame;
  const ordered = [...landings].sort((a, b) => a.u - b.u);
  const heightAt = (u) => -(riseAt(u, landings) - riseRef);
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
      // Both ends snap the same quantity, so the radius a flight arrives at is
      // bit-for-bit the radius the landing below it leaves from — the taper is
      // continuous across every joint even though each piece is quantised.
      const innerRadius = radiusAt(u0);
      const innerRadiusEnd = radiusAt(u1);
      const axis = axisAt(u0, p);
      runs.push({
        key: [
          stepCount,
          innerRadius,
          innerRadiusEnd,
          snap(riser, QUANTA.riser),
          snap(arcPerStep, QUANTA.arc),
        ].join('|'),
        u0,
        u1,
        stepCount,
        riser,
        arcPerStep,
        innerRadius,
        innerRadiusEnd,
        x: axis.x,
        y: heightAt(u0),
        z: axis.z,
        rotation: -angleAt(u0, p),
      });
    }
  }

  const plates = ordered
    .filter((landing) => landing.u >= fromU && landing.u <= toU)
    .map((landing) => {
      const end = landing.u + landing.plateau;
      const innerRadius = radiusAt(landing.u);
      const innerRadiusEnd = radiusAt(end);
      const axis = axisAt(landing.u, p);
      // The arc the helix actually climbs across the plateau, not the nominal
      // one: pitch warp varies the rate, so the nominal arc misses where the
      // next flight resumes and leaves a wedge of missing floor.
      const swept = angleAt(end, p) - angleAt(landing.u, p);
      return {
        key: [innerRadius, innerRadiusEnd, snap(swept, QUANTA.arc)].join('|'),
        innerRadius,
        innerRadiusEnd,
        uStart: landing.u,
        arc: swept,
        x: axis.x,
        y: heightAt(landing.u),
        z: axis.z,
        rotation: -angleAt(landing.u, p),
      };
    });

  return { landings: ordered, runs, plates };
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
