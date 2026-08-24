// Combines attractor contributions from every source into a single list bound
// by the sim's hard budget (MAX_ATTRACTORS). When the combined list overflows,
// lower-priority attractors are evicted first.
//
// Each attractor: { position: Vector3, strength (signed), radius?, hue?, priority }
//
// The bus owns its output array (reused across frames, no per-frame alloc).

// Eviction order when the combined list exceeds the budget. Higher = kept.
export const PRIORITY = {
  coreRepel: 100, // hollows the torso — essential to the silhouette read
  outlineCore: 90, // nose / shoulders / hips
  handImpulse: 75, // fast-hand comet leads
  outlineLimb: 70, // elbows / knees / wrists / ankles
  face: 45,
  hand: 40,
  ghost: 20, // ambient filler, first to go
};

function byPriorityDesc(a, b) {
  return (b.priority ?? 0) - (a.priority ?? 0);
}

export function createAttractorBus(maxAttractors) {
  const out = [];

  function combine(lists) {
    out.length = 0;

    for (let i = 0; i < lists.length; i += 1) {
      const list = lists[i];
      if (list) {
        for (let j = 0; j < list.length; j += 1) {
          out.push(list[j]);
        }
      }
    }

    if (out.length > maxAttractors) {
      out.sort(byPriorityDesc);
      out.length = maxAttractors;
    }

    return out;
  }

  return { combine };
}
