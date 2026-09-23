/* eslint-disable no-param-reassign */
import { agaricHead, stipeRadius } from './agaric';
import { fanHead, fanLayout, stalkRadius } from './fan';
import { mutate } from './genome';
import solveLayout, { touching } from './layout';

const HABITS = ['solitary', 'clump', 'troop'];
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

export function reachOf(genome) {
  if (genome.plan === 'agaric') return genome.cap.radius;
  if (genome.plan === 'fan') return genome.fan.radius;
  if (genome.plan === 'sporangia') return genome.spor.colony;
  if (genome.plan === 'coral') return genome.coral.reach;

  return genome.reaction.domain * 0.5;
}

export function heightOf(genome) {
  if (genome.plan === 'agaric') return genome.stipe.height + genome.cap.height;
  if (genome.plan === 'fan') return genome.fan.stalk + genome.fan.radius;
  if (genome.plan === 'sporangia') return genome.spor.height;
  if (genome.plan === 'coral') return genome.coral.height;

  return genome.reaction.height;
}

const CLUSTERED = new Set(['agaric', 'fan']);

function pickHabit(rng, genome, params) {
  if (!CLUSTERED.has(genome.plan)) return 'solitary';
  if (params.habit && params.habit !== 'auto') return params.habit;
  if (genome.habit && rng.chance(0.85)) return genome.habit;

  return HABITS[Math.floor(rng() * HABITS.length)];
}

const normalize = (v) => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;

  return [v[0] / l, v[1] / l, v[2] / l];
};

function toWorld(v, yaw) {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);

  return [c * v[0] + s * v[2], v[1], -s * v[0] + c * v[2]];
}

function toLocal(v, yaw) {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);

  return [c * v[0] - s * v[2], v[1], s * v[0] + c * v[2]];
}

// A member as the layout sees it: its stem from `foot` to the top it would
// grow to on its own, and its head as spheres around that top.
function memberBody(member, rng) {
  const { genome: g, scale, yaw } = member;
  let localTop;
  let head;
  let tube;
  let curve;
  let footLean;

  if (g.plan === 'agaric') {
    const { stipe } = g;

    localTop = [stipe.bendX, stipe.height, stipe.bendZ];
    head = agaricHead(g);
    const flare = stipe.ring > 0 ? g.cap.radius * stipe.ringFlare : 0;

    tube = (v) =>
      (stipeRadius(stipe, v) +
        (Math.abs(v - stipe.ringAt) < stipe.ringLength ? flare : 0)) *
      scale;
    curve = stipe;
    footLean = stipe.footLean;
  } else {
    g.layout = fanLayout(g, rng);
    localTop = g.layout.top;
    head = fanHead(g, g.layout);
    tube = (v) => stalkRadius(g.fan, v) * scale;
    curve = g.fan;
    footLean = g.fan.footLean;
  }

  const offset = toWorld(localTop, yaw).map((v) => v * scale);
  const top = member.position.map((p, i) => p + offset[i]);

  return {
    curve: {
      lane: curve.lane,
      sway: curve.sway,
      swayPhase: curve.swayPhase - yaw,
      swayShift: curve.swayShift,
      wobble: curve.wobble,
    },
    foot: member.position,
    footLean,
    head: head.map(([x, y, z, r]) => [
      ...toWorld([x, y, z], yaw).map((v) => v * scale),
      r * scale,
    ]),
    home: [...top],
    maxLean: g.plan === 'fan' ? 0.75 : 0.9,
    rise: [top[1] * 0.78, top[1] * (g.plan === 'fan' ? 2.4 : 1.2)],
    shrink: 1,
    top,
    tube,
  };
}

// Shrinks a member that cannot be laid clear, about its foot.
function shrinkBody(body, by) {
  body.shrink *= by;
  body.head = body.head.map(([x, y, z, r]) => [x * by, y * by, z * by, r * by]);
  const { tube } = body;

  body.tube = (v) => tube(v) * by;
  body.top = body.top.map((v, i) => body.foot[i] + (v - body.foot[i]) * by);
  body.home = body.home.map((v, i) => body.foot[i] + (v - body.foot[i]) * by);
  body.rise = body.rise.map((v) => v * by);
}

function writeBack(member, body) {
  member.scale *= body.shrink;
  const local = toLocal(
    body.top.map((v, i) => (v - member.position[i]) / member.scale),
    member.yaw
  );
  const g = member.genome;

  if (g.plan === 'agaric') {
    [g.stipe.bendX, g.stipe.height, g.stipe.bendZ] = local;
  } else {
    g.layout.top = local;
  }
}

// Spreads a clump's heads around one shared foot: tallest near the middle,
// the rest thrown out on a golden-angle spiral, then solved apart.
function arrange(members, habit, spread, rng) {
  const count = members.length;
  const reach =
    members.reduce((sum, m) => sum + reachOf(m.genome) * m.scale, 0) / count;
  const stem =
    members.reduce(
      (sum, m) =>
        sum +
        (m.genome.plan === 'agaric'
          ? m.genome.stipe.radius
          : m.genome.fan.stalkRadius) *
          m.scale,
      0
    ) / count;
  const wide = habit === 'troop' ? 1.35 : 0.8;
  const turn = rng() * Math.PI * 2;

  members.forEach((m, i) => {
    const a = turn + i * GOLDEN;
    const f = count > 1 ? Math.sqrt(i / (count - 1)) : 0;

    m.position = [
      Math.cos(a) * stem * 1.3 * f * Math.sqrt(count),
      0,
      Math.sin(a) * stem * 1.3 * f * Math.sqrt(count),
    ];
    const out = reach * wide * spread * (0.35 + 0.9 * f);

    if (m.genome.plan === 'agaric') {
      const local = toLocal(
        [Math.cos(a) * out, 0, Math.sin(a) * out],
        m.yaw
      ).map((v) => v / m.scale);

      [m.genome.stipe.bendX, , m.genome.stipe.bendZ] = local;
      m.genome.stipe.footLean = habit === 'troop' ? 1.6 : 1.3;
    } else {
      m.genome.fan.footLean = habit === 'troop' ? 1.3 : 1.1;
    }
  });

  const bodies = members.map((m) => memberBody(m, rng));

  members.forEach((m, i) => {
    if (m.genome.plan === 'fan') {
      const a = turn + i * GOLDEN;
      const f = count > 1 ? Math.sqrt(i / (count - 1)) : 0;
      const out = reach * wide * spread * (0.35 + 0.9 * f);

      bodies[i].top[0] = m.position[0] + Math.cos(a) * out;
      bodies[i].top[2] = m.position[2] + Math.sin(a) * out;
      bodies[i].home = [...bodies[i].top];
    }
  });

  const gap = reach * 0.04;
  let kept = members.map((m, i) => i);

  for (let round = 0; round < 5; round += 1) {
    const live = kept.map((i) => bodies[i]);

    solveLayout(live, { gap, iterations: 120 });
    const current = kept;
    const stuck = touching(live, gap * 0.5).map((k) => current[k]);

    if (stuck.length === 0) break;
    if (round === 4) {
      const worst = stuck.filter((i) => i !== 0);

      kept = kept.filter((i) => !worst.includes(i));
      break;
    }
    stuck.forEach((i) => {
      if (i === 0) return;
      const b = bodies[i];

      shrinkBody(b, 0.86);
      b.home = [b.home[0] * 1.15, b.home[1], b.home[2] * 1.15];
      b.maxLean = Math.min(1.3, b.maxLean + 0.08);
    });
  }

  kept.forEach((i) => writeBack(members[i], bodies[i]));

  return kept.map((i) => members[i]);
}

export default function buildCluster(rng, genome, params) {
  const habit = pickHabit(rng, genome, params);
  const count =
    habit === 'solitary' ? 1 : Math.max(2, Math.round(params.members));
  const spread = params.spread ?? 1;
  const variance = params.variance ?? 0.35;
  let members = [];

  for (let i = 0; i < count; i += 1) {
    const own = i === 0 ? genome : mutate(genome, rng, variance * 0.7);
    const scale = i === 0 ? 1 : 1 - rng() * variance * 0.55;
    let up = [0, 1, 0];

    if (genome.reaction?.mode === 'terrace') {
      up = normalize([rng.signed() * 0.2, 0.55, 0.85]);
    } else if (genome.reaction?.mode === 'bloom') {
      up = normalize([rng.signed() * 0.15, 0.8, 0.5]);
    }

    members.push({
      genome: own,
      position: [0, 0, 0],
      scale,
      up,
      yaw:
        genome.plan === 'agaric' || genome.plan === 'coral'
          ? rng() * Math.PI * 2
          : rng.signed() * 0.5,
    });
  }

  if (habit !== 'solitary') {
    members = arrange(members, habit, spread, rng.fork('layout'));
  }
  members.forEach((m) => {
    m.height = heightOf(m.genome) * m.scale;
    m.reach = reachOf(m.genome) * m.scale;
  });

  const order = members
    .map((m, i) => [i, m.scale + rng() * 0.2])
    .sort((a, b) => b[1] - a[1]);
  const last = Math.max(1, members.length - 1);

  order.forEach(([index], rank) => {
    members[index].delay = members.length > 1 ? rank / last : 0;
  });

  return { habit, members };
}
