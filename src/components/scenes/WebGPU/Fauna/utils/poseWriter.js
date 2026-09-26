import { SNAPSHOT_STRIDE } from '@modules/fauna';

const INTERVAL_MS = 33;

function lerpAngle(a, b, t) {
  const delta = Math.atan2(Math.sin(b - a), Math.cos(b - a));

  return a + delta * t;
}

export function writePoses(store, frames, now) {
  const { current, previous, receivedAt } = frames;
  const pose = store.pose.image.data;
  const motion = store.motion.image.data;

  if (!current) return;

  const t = Math.min(1, (now - receivedAt) / INTERVAL_MS);

  for (let slot = 0; slot < store.capacity; slot += 1) {
    const i = slot * SNAPSHOT_STRIDE;
    const o = slot * 4;

    if (!store.occupied[slot] || current[i + 7] === 0) {
      motion[o] = 0;
    } else {
      const same = previous && previous[i + 7] === current[i + 7];
      const p = same ? previous : current;
      const mix = (k) => p[i + k] + (current[i + k] - p[i + k]) * t;

      pose[o] = mix(0);
      pose[o + 1] = mix(1);
      pose[o + 2] = mix(2);
      pose[o + 3] = lerpAngle(p[i + 3], current[i + 3], t);
      motion[o] = mix(4) * mix(6);
      motion[o + 1] = mix(5);
      motion[o + 2] = mix(6);
      motion[o + 3] = current[i + 7] * 0.618;
    }
  }

  store.pose.needsUpdate = true; // eslint-disable-line no-param-reassign
  store.motion.needsUpdate = true; // eslint-disable-line no-param-reassign
}

export function nearestSlot(store, point, maxDistance) {
  const pose = store.pose.image.data;
  const motion = store.motion.image.data;
  let best = -1;
  let bestDistance = maxDistance;

  for (let slot = 0; slot < store.capacity; slot += 1) {
    if (motion[slot * 4] > 0) {
      const d =
        Math.hypot(pose[slot * 4] - point.x, pose[slot * 4 + 2] - point.z) -
        motion[slot * 4] * 0.5;

      if (d < bestDistance) {
        best = slot;
        bestDistance = d;
      }
    }
  }

  return best;
}
