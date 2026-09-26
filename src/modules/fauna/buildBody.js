import blobSkin from './bodies/blob';
import { invaderSkin, invaderVoxels } from './bodies/invader';
import { decode, fullBitmap } from './genome';
import { BEAD_BLOCK, BODY_BEAD_PAIRS, TENTACLE_BEADS } from './params';
import express, { tentacleCount } from './phenotype';

export const GENE_ROWS = 10;
export const PLAN_CODES = { blob: 1, invader: 0, swimmer: 2 };

function beadLayout(genome) {
  const tentacles = tentacleCount(genome);
  const info = new Float32Array(BEAD_BLOCK * 4);
  let count = 0;
  const push = (t, side, strand) => {
    info.set([t, side, strand, tentacles], count * 4);
    count += 1;
  };

  if (genome.plan === 'swimmer') {
    for (let k = 0; k < BODY_BEAD_PAIRS; k += 1) {
      push(k / (BODY_BEAD_PAIRS - 1), 1, 0);
      push(k / (BODY_BEAD_PAIRS - 1), -1, 0);
    }
  }

  for (let j = 1; j <= tentacles; j += 1) {
    for (let b = 0; b < TENTACLE_BEADS; b += 1) {
      push(b / (TENTACLE_BEADS - 1), 0, j);
    }
  }

  return { count, info };
}

function rowPopulation(genome) {
  return fullBitmap(genome, 0).map(
    (row) => row.reduce((sum, bit) => sum + bit, 0) / row.length
  );
}

export function geneColumn(genome, phenotype, blob) {
  const g = genome.genes;
  const col = new Float32Array(GENE_ROWS * 4);
  const rows = rowPopulation(genome);
  const ifs = blob?.ifs;

  col.set([...phenotype.colors.base, decode(genome, 'roughness')], 0);
  col.set([...phenotype.colors.accent, g.skin], 4);
  col.set(
    [
      PLAN_CODES[genome.plan],
      phenotype.features.tentacles,
      decode(genome, 'tentacleLength'),
      g.tentacleWave,
    ],
    8
  );

  if (ifs) {
    col.set([ifs.count, ifs.range, ifs.radius, ifs.falloff], 12);
    col.set([ifs.balance, ifs.twist, ifs.pulse, ifs.tempo], 16);
    col.set([blob.norm, ...blob.offset], 20);
    col.set([0, 0, 0, ifs.flipMask], 28);
  }

  col.set(
    [
      decode(genome, 'swimLength'),
      decode(genome, 'swimWidth'),
      decode(genome, 'swimFin'),
      decode(genome, 'swimFinFreq'),
    ],
    24
  );
  col.set(
    [decode(genome, 'swimHead'), decode(genome, 'swimTail'), g.swimUndulate],
    28
  );
  col.set(rows.slice(0, 4), 32);
  col.set(rows.slice(4, 8), 36);

  return col;
}

export default function buildBody(genome, { detail = 'world' } = {}) {
  const hero = detail === 'hero';
  const phenotype = express(genome);
  const blob = genome.plan === 'blob' ? blobSkin(genome, hero ? 64 : 34) : null;
  const invader = genome.plan === 'invader';

  return {
    beads: beadLayout(genome),
    genes: geneColumn(genome, phenotype, blob),
    plan: genome.plan,
    skin: blob ?? (invader ? invaderSkin(genome, hero ? 6 : 3) : null),
    voxels: invader ? invaderVoxels(genome) : { count: 0 },
  };
}

export function bodyTransferables(body) {
  const arrays = [
    body.genes,
    body.beads.info,
    body.voxels.local,
    body.voxels.info,
    ...Object.values(body.skin ?? {}).filter(ArrayBuffer.isView),
  ].filter(Boolean);

  return [...new Set(arrays.map((array) => array.buffer))];
}
