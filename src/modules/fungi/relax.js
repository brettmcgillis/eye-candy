const MAX_LEAN = 1.05;
const ITERATIONS = 48;

const norm = (v) => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

// The member's rotation as the renderer builds it: swing +Y onto `up`, after
// turning `yaw` about +Y. Returned as a function that rotates a local vector.
function orientation(up, yaw) {
  const u = norm(up);
  const axis = [-u[2], 0, u[0]];
  const s = Math.hypot(axis[0], axis[2]);
  const c = u[1];
  const k = s > 1e-6 ? [axis[0] / s, 0, axis[2] / s] : [1, 0, 0];
  const swing = (v) => {
    const dot = k[0] * v[0] + k[2] * v[2];
    const cross = [
      k[1] * v[2] - k[2] * v[1],
      k[2] * v[0] - k[0] * v[2],
      k[0] * v[1] - k[1] * v[0],
    ];
    return [0, 1, 2].map((i) => v[i] * c + cross[i] * s + k[i] * dot * (1 - c));
  };
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  return (v) => swing([v[0] * cy + v[2] * sy, v[1], -v[0] * sy + v[2] * cy]);
}

// Where a member's mature cap sits, as a sphere in cluster space.
function capSphere(member) {
  const mature = member.keyframes.grow[member.keyframes.grow.length - 1];
  let peak = -Infinity;
  let low = Infinity;
  for (let i = 1; i < mature.top.length; i += 2) {
    peak = Math.max(peak, mature.top[i]);
    low = Math.min(low, mature.top[i]);
  }
  const { genome } = member;
  const local = [
    mature.capOrigin[0],
    mature.capOrigin[1] + (peak + low) / 2,
    0,
  ];
  const offset = orientation(member.up, member.yaw)(local);
  return {
    center: member.position.map((p, i) => p + offset[i]),
    height: Math.max(local[1], genome.capR),
    radius: genome.capR * (1 + 0.18 * (genome.tiers - 1)),
  };
}

const leanOf = (up) => Math.acos(Math.min(1, norm(up)[1]));

// Pushes overlapping caps apart: members lean away from each other about
// their bases, and where leaning runs out (or the habit allows it) the bases
// slide apart too. Geometry is untouched, so keyframes stay valid.
export default function relaxCluster(members, habit) {
  if (members.length < 2 || habit === 'rosette') return members;
  const slide = habit !== 'clump';
  const placed = members.map((m) => ({
    ...m,
    position: [...m.position],
    up: [...m.up],
  }));

  for (let pass = 0; pass < ITERATIONS; pass += 1) {
    const spheres = placed.map(capSphere);
    let moved = false;
    for (let i = 0; i < placed.length; i += 1) {
      for (let j = i + 1; j < placed.length; j += 1) {
        const a = spheres[i];
        const b = spheres[j];
        const d = [0, 1, 2].map((k) => a.center[k] - b.center[k]);
        const dist = Math.hypot(...d);
        const overlap = (a.radius + b.radius) * 0.96 - dist;
        if (overlap > 0) {
          moved = true;
          let h = [d[0], 0, d[2]];
          if (Math.hypot(h[0], h[2]) < 1e-6)
            h = [Math.cos(i + j), 0, Math.sin(i + j)];
          h = norm(h);
          [
            [placed[i], a, 1],
            [placed[j], b, -1],
          ].forEach(([member, sphere, sign]) => {
            const step = (overlap * 0.5) / sphere.height;
            const next = norm(member.up.map((u, k) => u + h[k] * sign * step));
            if (leanOf(next) <= MAX_LEAN) {
              // eslint-disable-next-line no-param-reassign
              member.up = next;
            }
            if (slide || leanOf(next) > MAX_LEAN) {
              [0, 2].forEach((k) => {
                // eslint-disable-next-line no-param-reassign
                member.position[k] += h[k] * sign * overlap * 0.25;
              });
            }
          });
        }
      }
    }
    if (!moved) break;
  }
  return placed;
}
