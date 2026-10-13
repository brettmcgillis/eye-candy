import { decodeDesign, designFromField, fieldFromDesign } from './design';
import buildBlobField from './field';

export default function fieldFromConfig(config) {
  const design = config.blobDesign ? decodeDesign(config.blobDesign) : null;
  if (design) return fieldFromDesign(design, config.blobCanvasSize);
  return buildBlobField({
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
}

export function designFromSeed(config) {
  return designFromField(fieldFromConfig({ ...config, blobDesign: '' }));
}
