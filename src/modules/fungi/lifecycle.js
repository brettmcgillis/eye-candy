const clamp01 = (v) => Math.min(1, Math.max(0, v));

// Mycelium spreads first and pins knot up from it before it has finished;
// the fruit then grows, holds, spores and rots; the mycelium unravels last.
export function timeline(config) {
  const stagger = config.stagger * config.growSeconds;
  const fruitAt = config.myceliumSeconds * 0.6;
  const matured = fruitAt + config.growSeconds + stagger;
  const sporeAt = matured + config.holdSeconds;
  const rotAt = sporeAt + config.sporeSeconds;
  const rotEnd = rotAt + config.rotSeconds + stagger * 0.5;
  const unravelEnd = rotEnd + config.unravelSeconds;

  return {
    cycleEnd: unravelEnd + config.restSeconds,
    fruitAt,
    matured,
    rotAt,
    rotEnd,
    sporeAt,
    stagger,
    unravelEnd,
  };
}

// A member's lifecycle levels at `t` seconds into the cycle; `delay` (0..1)
// is its place in the cluster's age order.
export function levelsAt(config, delay, t) {
  const { fruitAt, rotAt, rotEnd, sporeAt, stagger } = timeline(config);

  return {
    grow: clamp01((t - fruitAt - delay * stagger) / config.growSeconds),
    mycelium:
      clamp01(t / config.myceliumSeconds) -
      clamp01((t - rotEnd) / config.unravelSeconds),
    rot: clamp01((t - rotAt - delay * stagger * 0.5) / config.rotSeconds),
    spore: clamp01((t - sporeAt) / Math.max(config.sporeSeconds, 1e-3)),
  };
}
// Every member's levels plus the shared mycelium's, at `t` seconds.
export function specimenLevels(config, specimen, t) {
  const members = specimen.members.map((member) =>
    levelsAt(config, member.delay, t)
  );
  return {
    members,
    mycelium: members.length > 0 ? members[0].mycelium : 0,
  };
}

// The levels of a still: every member at the same point, whatever its age.
export function stillLevels(specimen, { grow, mycelium, rot }) {
  return {
    members: specimen.members.map(() => ({ grow, mycelium, rot, spore: 0 })),
    mycelium,
  };
}

export function seedFor(seed, cycle) {
  return cycle === 0 ? String(seed) : `${seed}-${cycle}`;
}

export function randomSeed() {
  return Math.random().toString(36).slice(2, 8);
}
