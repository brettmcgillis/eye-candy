import createField, { createSourceColor } from './fields';
import shadeTree from './shade';
import buildTree from './tree';

// config + canvas ({ width, height } in px) + optional decoded source image
// ({ data, width, height, channels }) + palette stops → the shaded tree every
// renderer draws.
export default function buildPiece(
  config,
  { canvas, image = null, stops = null }
) {
  const field = createField(config, canvas, { image });
  const tree = buildTree(config, canvas, field);
  const sourceColor = createSourceColor(config, canvas, { image });
  return shadeTree(tree, config, field, stops, sourceColor);
}
