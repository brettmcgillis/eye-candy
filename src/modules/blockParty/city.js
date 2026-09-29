import buildLayers from './layers';
import { cellTone } from './palette';
import { COMPOSITION_KEYS, FORM_KEYS } from './renderOptions.mjs';

const PEDESTAL_MARGIN = 4;

const pick = (config, keys) =>
  Object.fromEntries(keys.map((key) => [key, config[key]]));

export const compositionOf = (config) => pick(config, COMPOSITION_KEYS);
export const metricsOf = (config) => pick(config, FORM_KEYS);

// World units per reference pixel. The seed crop is the sketch's random
// 1-3x zoom, so it enlarges the city inside a fixed frame.
export function cityScale(config, model) {
  return (
    (config.citySize / model.rootSize) *
    (config.honorSeedZoom ? model.viewScale : 1)
  );
}

export function pedestalDepthFor(config, deepest) {
  return Math.max(config.pedestalDepth, deepest + PEDESTAL_MARGIN);
}

export function layCity({ cells, colorBy, metrics, model }) {
  return buildLayers({
    cells,
    metrics,
    radius: model.radius,
    tone: cellTone(colorBy, {
      districtCount: model.districts.length,
      radius: model.radius,
    }),
  });
}
