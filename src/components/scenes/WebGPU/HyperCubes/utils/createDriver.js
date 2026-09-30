import {
  TREE_KEYS,
  buildInstances,
  buildTree,
  easeMorph,
  growAt,
  growCycleSeconds,
  treeDepth,
} from '@modules/hyperCubes';

const MAX_DELTA = 1 / 15;
const REST_SECONDS = 0.5;

const treeKeyOf = (c) => TREE_KEYS.map((key) => c[key]).join('|');

// The scene's clock over the kernel: a changed tree morphs in from the one
// on screen, `grow` loops the split cycle (a new seed each rest), `reseed`
// rolls a new seed every hold. Returns instances only when they changed.
export default function createDriver() {
  let target = null;
  let source = null;
  let depth = 0;
  let treeKey = null;
  let lastConfig = null;
  let morphTime = 0;
  let growTime = 0;
  let growEpoch = 0;
  let cycle = 0;
  let reseedTime = 0;

  return {
    step(c, delta, { onReseed, replay, stops }) {
      const dt = Math.min(delta, MAX_DELTA);
      let dirty = c !== lastConfig;
      lastConfig = c;

      const key = treeKeyOf(c);
      if (key !== treeKey) {
        const next = buildTree(c);
        source =
          target && c.morphSeconds > 0 && c.motionMode !== 'grow'
            ? target
            : null;
        target = next;
        depth = treeDepth(next.root);
        treeKey = key;
        morphTime = 0;
        dirty = true;
      }

      let t = 0;
      if (source) {
        morphTime += dt;
        t = easeMorph(morphTime / c.morphSeconds);
        if (morphTime >= c.morphSeconds) source = null;
        dirty = true;
      }

      let grow = null;
      if (c.motionMode === 'grow') {
        if (replay !== growEpoch) {
          growEpoch = replay;
          growTime = 0;
          cycle = 0;
        }
        growTime += dt;
        grow = growAt(growTime, c, depth);
        const turn = Math.floor(
          (growTime + REST_SECONDS) / growCycleSeconds(c, depth)
        );
        if (turn !== cycle) {
          cycle = turn;
          onReseed();
        }
        dirty = true;
      } else if (c.motionMode === 'manual') {
        grow = c.growProgress * depth;
      }

      if (c.motionMode === 'reseed') {
        reseedTime += dt;
        if (reseedTime >= c.holdSeconds + c.morphSeconds) {
          reseedTime = 0;
          onReseed();
        }
      }

      if (!dirty) return null;
      return buildInstances({
        config: c,
        from: source ? source.root : target.root,
        grow,
        stops,
        t,
        to: source ? target.root : null,
      });
    },
  };
}
