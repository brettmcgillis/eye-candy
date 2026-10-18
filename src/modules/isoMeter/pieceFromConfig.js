import createRecolor from './palette';
import createAmbifeuille, { PERSPECTIVE } from './pieces/ambifeuille';
import createDixfeuille from './pieces/dixfeuille';
import createWinterkammer from './pieces/winterkammer';
import { DIX_SCALES } from './renderOptions.mjs';
import { randomHash, sfc32, xmur3 } from './rng';

const HASH = /^0x[0-9a-f]{64}$/iu;

export function hashFromSeed(seed) {
  const text = String(seed ?? '').trim();
  if (HASH.test(text)) return text.toLowerCase();
  const h = xmur3(text);
  return randomHash(sfc32(h(), h(), h(), h()));
}

export function randomSeed() {
  return randomHash();
}

const DIX_SCALE_INDEX = { 0.5: 0, 0.75: 1, 1: 2, 1.25: 3, 1.5: 4 };

export default function pieceFromConfig(
  config,
  { aspect = 1, stops = null } = {}
) {
  const hash = hashFromSeed(config.seed);
  const colors = createRecolor(stops, config);
  if (config.piece === 'winterkammer') {
    return createWinterkammer({ aspect, colors, hash });
  }
  const tokenId = String(config.tokenId ?? 0);
  const offsets = {
    iOffset: config.iOffset ?? 0,
    jOffset: config.jOffset ?? 0,
    kOffset: config.kOffset ?? 0,
  };
  if (config.piece === 'dixfeuille') {
    const scale = DIX_SCALES.includes(config.dixScale) ? config.dixScale : '1';
    return createDixfeuille({
      colors,
      hash,
      tokenId,
      view: {
        ...offsets,
        scale: DIX_SCALE_INDEX[scale],
        warpLevel:
          config.warpLevel && config.warpLevel !== 'rolled'
            ? Number(config.warpLevel)
            : null,
      },
    });
  }
  return createAmbifeuille({
    colors,
    hash,
    tokenId,
    view: {
      ...offsets,
      cutI: Boolean(config.cutI),
      cutK: Boolean(config.cutK),
      drawHidden: Boolean(config.drawHidden),
      perspective: PERSPECTIVE[config.perspective] ?? PERSPECTIVE.split,
    },
  });
}
