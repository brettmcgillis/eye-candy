import { createRng } from '@modules/flora';

import buildAgaric from './agaric';
import buildCluster from './cluster';
import buildCoral from './coral';
import createEmitter, { MAX_SEGMENTS, memberTransform } from './emit';
import buildFan from './fan';
import { rollGenome } from './genome';
import createNoise from './noise';
import { resolveParams } from './params';
import buildReaction from './reaction';
import buildSporangia from './sporangia';

const MAX_MEMBERS = 16;
const BUILDERS = {
  agaric: buildAgaric,
  coral: buildCoral,
  fan: buildFan,
  reaction: buildReaction,
  sporangia: buildSporangia,
};

// Rough segments a member costs at detail 1, so a clump thins its fibres
// instead of blowing the budget and a lone specimen packs them tighter.
function costOf(genome) {
  if (genome.plan === 'agaric') {
    const { cap, gills, stipe } = genome;

    return (
      stipe.fibers * 90 * (1 + stipe.ring * 0.15 + stipe.volva * 0.1) +
      (cap.surface === 'lattice'
        ? cap.netDensity * 12 + cap.fibrils * 6
        : cap.fibrils * 20) +
      gills.count * 20 +
      cap.fringe * 2000 +
      cap.scales * 5000
    );
  }
  if (genome.plan === 'fan') {
    const { fan } = genome;
    const faces = fan.funnel ? 1 : fan.lobes;

    return (
      faces *
        (fan.ridgeCount * 5 * 30 * (1 + fan.backing) + fan.netDensity * 12) +
      8000
    );
  }

  if (genome.plan === 'sporangia') {
    const { spor } = genome;

    return spor.stalks * (spor.netDensity * 14 + 40) + 3000;
  }

  if (genome.plan === 'coral') {
    const { coral } = genome;
    let sum = 0;

    for (let k = 0; k <= Math.round(coral.depth); k += 1) {
      sum += (2.2 * coral.taper) ** k;
    }

    return coral.fibers * 2 * 18 * sum;
  }

  if (genome.reaction?.mode === 'bloom') {
    const r = genome.reaction;
    const tiers = Math.round(r.tiers);
    let area = 0;

    for (let k = 0; k < tiers; k += 1) area += r.tierShrink ** k;

    return (r.fibers * area * 1.55 * r.terraces * 7 * 0.5 * r.radius) / 2.5;
  }

  return 0;
}

export default function buildSpecimen(params = {}) {
  const resolved = resolveParams(params);
  const rng = createRng(resolved.seed ?? 'fungi');
  const genome = rollGenome(rng.fork('genome'), resolved);
  const cluster = buildCluster(rng.fork('cluster'), genome, {
    ...resolved,
    members: Math.min(resolved.members, MAX_MEMBERS),
  });
  const emitter = createEmitter();
  const cost = cluster.members.reduce(
    (sum, m) => sum + costOf(m.genome) * m.scale,
    0
  );
  const detail =
    cost > 0 ? Math.min(2.2, Math.max(0.3, (MAX_SEGMENTS * 0.8) / cost)) : 1;
  const size = genome.size / 2.4;

  const members = cluster.members.map((member, index) => {
    const own = rng.fork(`member-${index}`);

    emitter.setTransform(
      memberTransform({
        position: member.position.map((v) => v * size),
        scale: member.scale * size,
        up: member.up,
        yaw: member.yaw,
      })
    );
    emitter.setDelay(member.delay);
    const shape = BUILDERS[member.genome.plan](
      emitter,
      member.genome,
      own,
      createNoise(own()),
      detail * (member.scale > 0.8 ? 1 : 0.8)
    );

    return {
      delay: member.delay,
      height: shape?.height ?? member.height,
      position: member.position,
      scale: member.scale,
      up: member.up,
    };
  });
  const built = emitter.finish();
  const { max, min } = built.bounds;
  const center = min.map((v, a) => (v + max[a]) / 2);
  const radius =
    Math.hypot(max[0] - min[0], max[1] - min[1], max[2] - min[2]) / 2;

  return {
    beads: built.beads,
    mesh: built.mesh,
    bounds: { center, max, min, radius },
    detail,
    genome,
    habit: cluster.habit,
    members,
    palette: genome.palette,
    seed: String(resolved.seed),
    segments: built.segments,
    truncated: built.truncated,
  };
}
