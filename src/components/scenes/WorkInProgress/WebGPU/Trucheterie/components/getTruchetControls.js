import { folder } from 'leva';

import getCompositionControls from './getCompositionControls';
import getMultiscaleControls from './getMultiscaleControls';

// Full Leva path to this folder — used by the render() gates below to show
// grid-mode-specific controls only. Must stay in sync with SCENE_LABEL and
// this folder's own key ('Trucheterie') in hooks/useSceneControls.js.
const TRUCHET_FOLDER_PATH = 'Trucheterie.Trucheterie';
const isSquareMode = (get) =>
  get(`${TRUCHET_FOLDER_PATH}.gridMode`) === 'square';
const isTriangularMode = (get) =>
  get(`${TRUCHET_FOLDER_PATH}.gridMode`) === 'triangular';
const isSolidFill = (get) => get(`${TRUCHET_FOLDER_PATH}.fillMode`) === 'solid';
const isWeaveOn = (get) => get(`${TRUCHET_FOLDER_PATH}.weaveEnabled`) === true;
const isRetileOn = (get) =>
  get(`${TRUCHET_FOLDER_PATH}.retileEnabled`) === true;

// getTruchetControls is a companion fn to TileGrid — the flat Leva schema
// for the scene's single `Truchet` folder. Keys must match presets/presets.js
// 1:1 (see docs/scene-conventions.md, "Controls & presets").
export default function getTruchetControls(snapshot = {}) {
  return folder(
    {
      gridMode: {
        label: 'Grid Mode',
        options: ['square', 'triangular'],
        value: snapshot.gridMode ?? 'square',
      },
      gridCols: {
        label: 'Grid Cols',
        max: 40,
        min: 2,
        render: isSquareMode,
        step: 1,
        value: snapshot.gridCols ?? 12,
      },
      gridRows: {
        label: 'Grid Rows',
        max: 40,
        min: 2,
        render: isSquareMode,
        step: 1,
        value: snapshot.gridRows ?? 12,
      },
      hexRadius: {
        label: 'Hex Radius',
        max: 20,
        min: 1,
        render: isTriangularMode,
        step: 1,
        value: snapshot.hexRadius ?? 6,
      },
      cellSize: {
        label: 'Cell Size',
        max: 2,
        min: 0.1,
        step: 0.01,
        value: snapshot.cellSize ?? 0.5,
      },
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
        render: isSquareMode,
        step: 0.01,
        value: snapshot.layerBiasAmount ?? 0.15,
      },
      weaveEnabled: {
        label: 'Weave Crossings',
        value: snapshot.weaveEnabled ?? false,
      },
      lanesEnabled: {
        label: 'Lanes Motif',
        value: snapshot.lanesEnabled ?? false,
      },
      ...getMultiscaleControls(snapshot),
      weaveGapWidth: {
        label: 'Weave Gap Width',
        max: 0.15,
        min: 0.0,
        render: isWeaveOn,
        step: 0.005,
        value: snapshot.weaveGapWidth ?? 0.06,
      },
      strokePitch: {
        label: 'Stroke Pitch',
        max: 0.2,
        min: 0.005,
        step: 0.001,
        value: snapshot.strokePitch ?? 0.035,
      },
      strokeWidth: {
        label: 'Stroke Width',
        max: 0.1,
        min: 0.001,
        step: 0.001,
        value: snapshot.strokeWidth ?? 0.012,
      },
      fillMode: {
        label: 'Fill Mode',
        options: ['line', 'solid'],
        value: snapshot.fillMode ?? 'line',
      },
      fillWidth: {
        label: 'Fill Width',
        max: 0.45,
        min: 0.02,
        render: isSolidFill,
        step: 0.01,
        value: snapshot.fillWidth ?? 0.16,
      },
      bgColor: {
        label: 'Tile Background',
        value: snapshot.bgColor ?? '#f5f2ea',
      },
      strokeColor: {
        label: 'Stroke Color',
        value: snapshot.strokeColor ?? '#141414',
      },
      sceneBgColor: {
        label: 'Scene Background',
        value: snapshot.sceneBgColor ?? '#f5f2ea',
      },
      ...getCompositionControls(snapshot),
      seed: {
        label: 'Seed',
        max: 9999,
        min: 0,
        step: 1,
        value: snapshot.seed ?? 1,
      },
      retileEnabled: {
        label: 'Retile Enabled',
        value: snapshot.retileEnabled ?? true,
      },
      animMode: {
        label: 'Retile Mode',
        options: ['ySpin', 'zSpin', 'scale'],
        render: isRetileOn,
        value: snapshot.animMode ?? 'ySpin',
      },
      animSpeed: {
        label: 'Flip Duration (s)',
        max: 4,
        min: 0.2,
        render: isRetileOn,
        step: 0.05,
        value: snapshot.animSpeed ?? 0.9,
      },
      retileRate: {
        label: 'Retile Rate (tiles/s)',
        max: 30,
        min: 0.1,
        render: isRetileOn,
        step: 0.1,
        value: snapshot.retileRate ?? 4,
      },
      animStagger: {
        label: 'Stagger',
        max: 1,
        min: 0,
        render: isRetileOn,
        step: 0.01,
        value: snapshot.animStagger ?? 0.6,
      },
    },
    { collapsed: true }
  );
}
