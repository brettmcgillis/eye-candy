import {
  decodeDesign,
  designFromField,
  fieldFromDesign,
  openIrregular,
  openStraights,
  symmetricDesign,
} from './design';
import buildBlobField, { MEATBALLS } from './field';
import {
  fieldFromTriDesign,
  symmetricTriDesign,
  triDesignBounds,
} from './triDesign';
import buildTriDesign, { triRegionFrame } from './triField';
import buildTriSubdivision from './triSubdivision';
import { TRIANGLE } from './triangle';

// A seeded triangle field is framed by its region, unless a mirror carried
// cells past it.
function seededTriField(config) {
  if (config.blobTriangleLayout !== 'packed') {
    return fieldFromTriDesign(
      buildTriSubdivision(config),
      config.blobCanvasSize,
      undefined,
      config.blobPathsPerUnit ?? 4
    );
  }
  let design = buildTriDesign({
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
  if (axis !== 'none' && design.cells.length > 0) {
    design = symmetricTriDesign(design, axis, {
      hideLoose: config.blobMeatballs === MEATBALLS.HIDE_LOOSE,
    });
  }
  const region = triRegionFrame(config.blobGridSize);
  const box = triDesignBounds(design);
  const fits =
    !box ||
    (box.x0 >= region.column &&
      box.y0 >= region.row &&
      box.x1 <= region.column + region.size &&
      box.y1 <= region.row + region.size);
  return fieldFromTriDesign(
    design,
    config.blobCanvasSize,
    fits ? region : undefined
  );
}

export default function fieldFromConfig(config) {
  const design = config.blobDesign ? decodeDesign(config.blobDesign) : null;
  if (design)
    return fieldFromDesign(
      design,
      config.blobCanvasSize,
      undefined,
      config.blobPathsPerUnit ?? 4
    );
  if (config.blobGridShape === TRIANGLE) return seededTriField(config);
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
  const irregular = Boolean(config.blobIrregular);
  const straights = config.blobStraights ?? 0;
  if (
    (axis === 'none' && !irregular && !(straights > 0)) ||
    field.count === 0
  ) {
    return field;
  }
  let seeded = designFromField(field);
  if (irregular) seeded = openIrregular(seeded, config.blobSeed);
  seeded = openStraights(seeded, straights, config.blobSeed);
  if (axis !== 'none') {
    seeded = symmetricDesign(seeded, field.gridSize, axis, {
      hideLoose: config.blobMeatballs === MEATBALLS.HIDE_LOOSE,
    });
  }
  return fieldFromDesign(seeded, config.blobCanvasSize, {
    column: 0,
    row: 0,
    size: field.gridSize,
  });
}

export function designFromSeed(config) {
  return designFromField(fieldFromConfig({ ...config, blobDesign: '' }));
}
