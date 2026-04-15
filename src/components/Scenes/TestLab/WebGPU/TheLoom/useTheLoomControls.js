import { folder, useControls } from 'leva';

import { useMemo } from 'react';

import usePresetsFolder from '../../../../../hooks/usePresetsFolder';
import DEFAULT_CLOTH from '../../../../../presets/cloth/defaultCloth';
import GHOST_CLOTH from '../../../../../presets/cloth/ghostCloth';
import RIBBON_CLOTH from '../../../../../presets/cloth/ribbonCloth';
import {
  pinEdge,
  pinPoint,
} from '../../../../elements/webgpu/cloth/pinHelpers';

const CLOTH_PRESETS = {
  Default: DEFAULT_CLOTH,
  Ghost: GHOST_CLOTH,
  Ribbon: RIBBON_CLOTH,
};

const DEFAULT_PRESET = 'Default';

// Keys in presets that are NOT Leva controls (passed separately)
const NON_CONTROL_KEYS = new Set(['cutouts']);

function getPresetControls({ presetSnapshot }) {
  const filtered = {};
  const keys = Object.keys(presetSnapshot);
  for (let i = 0; i < keys.length; i += 1) {
    if (!NON_CONTROL_KEYS.has(keys[i]))
      filtered[keys[i]] = presetSnapshot[keys[i]];
  }
  return filtered;
}

export default function useTheLoomControls() {
  const {
    attachSetControls,
    controlsSnapshotRef,
    initialPreset,
    presetsFolder,
    selectedPreset,
  } = usePresetsFolder({
    defaultPreset: DEFAULT_PRESET,
    getPresetControls,
    presets: CLOTH_PRESETS,
  });

  const p = CLOTH_PRESETS[initialPreset] || DEFAULT_CLOTH;

  const [controls, setControls] = useControls(
    'Cloth',
    () => ({
      Presets: presetsFolder,

      Shape: folder(
        {
          width: { value: p.width, min: 0.1, max: 5, step: 0.1 },
          height: { value: p.height, min: 0.1, max: 5, step: 0.1 },
          segmentsX: { value: p.segmentsX, min: 4, max: 80, step: 1 },
          segmentsY: { value: p.segmentsY, min: 4, max: 80, step: 1 },
          pinMode: {
            value: p.pinMode,
            options: ['left', 'top', 'center'],
          },
          orientation: {
            value: p.orientation || 'vertical',
            options: ['vertical', 'horizontal'],
          },
          shapePreset: {
            value: p.shapePreset,
            options: ['rectangle', 'circle', 'ribbon-notched'],
            label: 'Shape',
          },
        },
        { collapsed: true }
      ),

      Simulation: folder(
        {
          wind: { value: p.wind, min: 0, max: 5, step: 0.01 },
          windDirX: { value: p.windDirX, min: -1, max: 1, step: 0.01 },
          windDirZ: { value: p.windDirZ, min: -1, max: 1, step: 0.01 },
          stiffness: { value: p.stiffness, min: 0, max: 1, step: 0.01 },
          dampening: { value: p.dampening, min: 0.9, max: 1, step: 0.001 },
          gravity: { value: p.gravity, min: 0, max: 0.001, step: 0.00001 },
          stepsPerSecond: {
            value: p.stepsPerSecond,
            min: 60,
            max: 720,
            step: 10,
          },
          maxVelocity: {
            value: p.maxVelocity,
            min: 0.001,
            max: 0.1,
            step: 0.001,
          },
          paused: false,
        },
        { collapsed: true }
      ),

      Cursor: folder(
        {
          cursorCollider: { value: true, label: 'Enabled' },
          cursorRadius: { value: 0.12, min: 0.01, max: 0.5, step: 0.01 },
          debugColliders: { value: true, label: 'Debug Wireframes' },
          debugColor: { value: '#ff0000', label: 'Debug Color' },
        },
        { collapsed: true }
      ),

      Sphere: folder(
        {
          sphereEnabled: { value: true, label: 'Enabled' },
          sphereRadius: {
            value: 0.15,
            min: 0.01,
            max: 0.5,
            step: 0.01,
            label: 'Radius',
          },
          sphereX: {
            value: p.sphereX ?? 0,
            min: -2,
            max: 2,
            step: 0.01,
            label: 'X',
          },
          sphereY: {
            value: p.sphereY ?? -0.15,
            min: -2,
            max: 2,
            step: 0.01,
            label: 'Y',
          },
          sphereZ: {
            value: p.sphereZ ?? 0,
            min: -2,
            max: 2,
            step: 0.01,
            label: 'Z',
          },
          sphereVisible: { value: p.sphereVisible ?? true, label: 'Visible' },
        },
        { collapsed: true }
      ),

      Alpha: folder(
        {
          alphaSeed: { value: p.alphaSeed, min: 0, max: 999, step: 1 },
          alphaScale: { value: p.alphaScale, min: 0.1, max: 20, step: 0.1 },
          edgeFade: { value: p.edgeFade, min: 0, max: 0.5, step: 0.01 },
          holeAmount: { value: p.holeAmount, min: 0, max: 1, step: 0.01 },
          tatterEdge: { value: p.tatterEdge, min: 0, max: 1, step: 0.01 },
        },
        { collapsed: true }
      ),

      Material: folder(
        {
          color: { value: p.color },
          roughness: { value: p.roughness, min: 0, max: 1, step: 0.01 },
          metalness: { value: p.metalness, min: 0, max: 1, step: 0.01 },
          opacity: { value: p.opacity, min: 0, max: 1, step: 0.01 },
        },
        { collapsed: true }
      ),

      Scene: folder(
        {
          bgColor: { value: '#1a1a2e', label: 'Background' },
          ambientIntensity: {
            value: 0.5,
            min: 0,
            max: 3,
            step: 0.05,
            label: 'Ambient Intensity',
          },
          ambientColor: { value: '#ffffff', label: 'Ambient Color' },
          dirIntensity: {
            value: 1,
            min: 0,
            max: 5,
            step: 0.05,
            label: 'Dir Intensity',
          },
          dirColor: { value: '#ffffff', label: 'Dir Color' },
          dirX: { value: 3, min: -10, max: 10, step: 0.1, label: 'Dir X' },
          dirY: { value: 5, min: -10, max: 10, step: 0.1, label: 'Dir Y' },
          dirZ: { value: 2, min: -10, max: 10, step: 0.1, label: 'Dir Z' },
        },
        { collapsed: true }
      ),
    }),
    { collapsed: true }
  );

  attachSetControls(setControls);
  controlsSnapshotRef.current = { ...controls };

  const pins = useMemo(() => {
    if (controls.pinMode === 'center') {
      const cx = Math.round(controls.segmentsX / 2);
      const cy = Math.round(controls.segmentsY / 2);
      return pinPoint(cx, cy, controls.segmentsY);
    }
    return pinEdge(controls.pinMode, controls.segmentsX, controls.segmentsY);
  }, [controls.pinMode, controls.segmentsX, controls.segmentsY]);
  const centered = controls.pinMode === 'top' || controls.pinMode === 'center';

  const activePreset = CLOTH_PRESETS[selectedPreset] || DEFAULT_CLOTH;

  return { controls, pins, centered, cutouts: activePreset.cutouts || [] };
}
