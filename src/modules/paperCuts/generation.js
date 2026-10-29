import { createRng } from '@modules/flora';

import { decodeDesign, frameFromDesign } from './design.mjs';
import { coveredArea, orbitOf, overlaps } from './geometry';
import { sceneDefaults } from './renderOptions.mjs';

const snap = (v) => Math.round(v * 4) / 4;
const CORNERS = [
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
];
const AXES = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export default function generate(input = {}) {
  const config = { ...sceneDefaults(), ...input };
  if (config.paperDesign)
    return frameFromDesign(decodeDesign(config.paperDesign), config);
  const rng = createRng(config.generationSeed);
  const layers = [];
  const placed = [];
  const motifs = [];

  function place(size, position, layer, relation) {
    const orbit = orbitOf(position.map(snap), config.symmetry).map((p) => ({
      size,
      position: p,
      layer,
      relation,
    }));
    const same = layers[layer] ?? [];
    const nearer = placed.filter((s) => s.layer < layer);
    const invalid = orbit.some(
      (s, i) =>
        s.position.some((v) => Math.abs(v) + size / 2 > config.reach) ||
        [...same, ...orbit.slice(0, i)].some((t) => overlaps(s, t)) ||
        coveredArea(s, nearer) > size * size * 0.85 ||
        (relation !== 'anchor' && !nearer.some((t) => overlaps(s, t)))
    );
    const hidesExisting = placed.some(
      (s) =>
        s.layer > layer &&
        orbit.some((t) => overlaps(s, t)) &&
        coveredArea(s, [...placed.filter((t) => t.layer < s.layer), ...orbit]) >
          s.size * s.size * 0.85
    );
    if (invalid || hidesExisting || placed.length + orbit.length > 160)
      return false;
    if (!layers[layer]) layers[layer] = [];
    layers[layer].push(...orbit);
    placed.push(...orbit);
    return true;
  }

  function motif(position, layer, relation) {
    if (!place(1, position, layer, relation)) return null;
    let size = 1;
    for (let level = 1; level < config.nesting; level += 1) {
      if (!place(2 ** level, position, layer + level, 'nest')) break;
      size = 2 ** level;
    }
    const node = { position, size };
    motifs.push(node);
    return node;
  }

  let anchor = [0, 0];
  if (config.generationFamily === 'constellation') anchor = [1.5, 1.5];
  let frontier = [motif(anchor, 0, 'anchor')].filter(Boolean);
  for (let round = 0; round < config.growthRounds; round += 1) {
    const next = [];
    const layer = (round + 1) * config.nesting;
    frontier.forEach((parent) => {
      const directions =
        config.generationFamily === 'radial' ? [...CORNERS, ...AXES] : CORNERS;
      const ordered = directions
        .map((d) => ({ d, order: rng() }))
        .sort((a, b) => a.order - b.order);
      ordered.forEach(({ d: [dx, dy] }) => {
        if (!rng.chance(config.branching)) return;
        if (
          config.generationFamily === 'diagonal' &&
          dx !== dy &&
          !rng.chance(0.35)
        )
          return;
        const offset = parent.size / 2 + 0.25;
        const position = [
          snap(parent.position[0] + dx * offset),
          snap(parent.position[1] + dy * offset),
        ];
        const child = motif(position, layer, 'branch');
        if (child) next.push(child);
      });
    });
    if (!next.length) break;
    frontier = next;
  }
  if (config.bridges) {
    const last = layers.length;
    motifs.forEach((a, i) => {
      const b = motifs
        .slice(i + 1)
        .find(
          (m) => Math.hypot(...m.position.map((v, k) => v - a.position[k])) <= 3
        );
      if (b)
        place(
          2,
          a.position.map((v, k) => snap((v + b.position[k]) / 2)),
          last,
          'bridge'
        );
    });
  }
  const compact = layers
    .filter((l) => l?.length)
    .map((l, layer) => l.map((s) => ({ ...s, layer })));
  const halfExtent = Math.max(
    ...compact
      .flat()
      .flatMap((s) => s.position.map((v) => Math.abs(v) + s.size / 2))
  );
  return {
    layers: compact,
    settings: {
      paperDepth: config.paperDepth,
      dataScaleMultiplier: Math.min(1, 3.5 / halfExtent),
    },
    stats: {
      pieces: compact.flat().length,
      layers: compact.length,
      motifs: motifs.length,
      halfExtent,
    },
  };
}
