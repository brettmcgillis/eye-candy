import { createRng } from '@modules/flora';

import buildCluster from './cluster';
import { rollGenome } from './genome';
import buildMycelium from './mycelium';
import { resolveParams } from './params';
import { fitTiers, keyframesFor } from './profile';
import relaxCluster from './relax';

const MAX_MEMBERS = 40;

function boundsOf(members, mycelium) {
  let min = [Infinity, Infinity, Infinity];
  let max = [-Infinity, -Infinity, -Infinity];
  const grow = (p) => {
    min = min.map((v, i) => Math.min(v, p[i]));
    max = max.map((v, i) => Math.max(v, p[i]));
  };
  members.forEach(({ genome, keyframes, position, up }) => {
    const mature = keyframes.grow[keyframes.grow.length - 1];
    const reach =
      genome.capR * (1 + 0.22 * (genome.tiers - 1)) +
      Math.abs(mature.capOrigin[0]);
    let peak = 0;
    for (let i = 1; i < mature.top.length; i += 2) {
      peak = Math.max(peak, mature.top[i]);
    }
    const tall = mature.capOrigin[1] + peak;
    const tip = up.map((u, i) => position[i] + u * tall);
    grow([tip[0] - reach, position[1], tip[2] - reach]);
    grow([tip[0] + reach, tip[1] + reach * 0.2, tip[2] + reach]);
  });
  for (let i = 0; i < mycelium.count; i += 1) {
    grow([
      mycelium.end[i * 4],
      mycelium.end[i * 4 + 1],
      mycelium.end[i * 4 + 2],
    ]);
  }
  const center = min.map((v, i) => (v + max[i]) / 2);
  const radius =
    Math.hypot(max[0] - min[0], max[1] - min[1], max[2] - min[2]) / 2;
  return { center, max, min, radius };
}

// The mycelial mat a clump, colony or rosette rises from, so its bases share
// one foot instead of standing apart on nothing.
function padsFor(members, habit, genome) {
  if (members.length < 2 || !['clump', 'colony', 'rosette'].includes(habit)) {
    return [];
  }
  const center = [0, 1, 2].map(
    (k) => members.reduce((sum, m) => sum + m.position[k], 0) / members.length
  );
  const reach = Math.max(
    ...members.map(
      (m) =>
        Math.hypot(m.position[0] - center[0], m.position[2] - center[2]) +
        m.genome.stipeR * 1.3
    )
  );
  return [
    {
      center,
      height: genome.size * (habit === 'colony' ? 0.012 : 0.03),
      radius: reach,
      woody: habit === 'rosette',
    },
  ];
}

export default function buildSpecimen(params = {}) {
  const resolved = resolveParams(params);
  const rng = createRng(resolved.seed ?? 'fungi');
  const genome = rollGenome(rng.fork('genome'), resolved);
  const cluster = buildCluster(rng.fork('cluster'), genome, {
    ...resolved,
    members: Math.min(resolved.members, MAX_MEMBERS),
  });
  const members = relaxCluster(
    cluster.members.map((member) => {
      const own = fitTiers(member.genome);
      return { ...member, genome: own, keyframes: keyframesFor(own) };
    }),
    cluster.habit
  );
  const mycelium = buildMycelium(rng.fork('mycelium'), genome, members);

  return {
    bounds: boundsOf(members, mycelium),
    pads: padsFor(members, cluster.habit, genome),
    genome,
    habit: cluster.habit,
    members,
    seed: String(resolved.seed),
    mycelium,
  };
}
