import { MOTIF_PATH } from './controlPaths';

const isWeaveOn = (get) => get(`${MOTIF_PATH}.weaveEnabled`) === true;

// What pattern content shows up per tile — a motif picked independently per
// tile (straight/weave/lanes chance). Blob field has no motif pick at all:
// its shape falls out of the packing's connectivity graph, so this whole
// folder hides there. Keys must match presets/presets.js 1:1.
export default function getMotifControls(snapshot = {}) {
  return {
    straightTileChance: {
      label: 'Straight Chance',
      max: 1,
      min: 0,
      step: 0.01,
      value: snapshot.straightTileChance ?? 0.15,
    },
    layerBiasAmount: {
      label: 'Layer Bias',
      max: 0.4,
      min: 0,
      step: 0.01,
      value: snapshot.layerBiasAmount ?? 0.15,
    },
    weaveEnabled: {
      label: 'Weave Crossings',
      value: snapshot.weaveEnabled ?? false,
    },
    weaveGapWidth: {
      label: 'Weave Gap Width',
      max: 0.15,
      min: 0.0,
      render: isWeaveOn,
      step: 0.005,
      value: snapshot.weaveGapWidth ?? 0.06,
    },
    lanesEnabled: {
      label: 'Lanes Motif',
      value: snapshot.lanesEnabled ?? false,
    },
  };
}
