import {
  decodeDesign,
  designFromField,
  fieldFromDesign,
  symmetricDesign,
} from './design';
import buildBlobField, { MEATBALLS } from './field';

export default function fieldFromConfig(config) {
  const design = config.blobDesign ? decodeDesign(config.blobDesign) : null;
  if (design) return fieldFromDesign(design, config.blobCanvasSize);
  const field = buildBlobField({
    canvasSize: config.blobCanvasSize,
    connectivity: config.blobConnectivity,
    distributionCount: config.blobDistribution,
    gridSize: config.blobGridSize,
    holes: config.blobHoles,
    meatballs: config.blobMeatballs,
    oneFill: config.blobOneFill,
    seed: config.blobSeed,
    sizeFunction: config.blobSizeFunction,
  });
  const axis = config.blobSymmetry ?? 'none';
  if (axis === 'none' || field.count === 0) return field;
  const mirrored = symmetricDesign(
    designFromField(field),
    field.gridSize,
    axis,
    {
      hideLoose: config.blobMeatballs === MEATBALLS.HIDE_LOOSE,
    }
  );
  return fieldFromDesign(mirrored, config.blobCanvasSize, {
    column: 0,
    row: 0,
    size: field.gridSize,
  });
}

export function designFromSeed(config) {
  return designFromField(fieldFromConfig({ ...config, blobDesign: '' }));
}
