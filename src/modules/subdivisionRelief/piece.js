import { buildPiece, sceneDefaults } from '@modules/subdivision';

// The flat kernel reads its own defaults for the keys the relief drops (the
// outline band), so a relief config is always a valid Subdivision config.
export const pieceSettings = (config) => ({ ...sceneDefaults(), ...config });

// buildPiece's shaded tree plus its deepest level, which the grow clock and
// the depth-weighted heights both scale by.
export default function buildReliefPiece(config, inputs) {
  const piece = buildPiece(pieceSettings(config), inputs);
  const maxDepth = piece.nodes.reduce(
    (deepest, node) => Math.max(deepest, node.depth),
    0
  );
  return { ...piece, maxDepth };
}
