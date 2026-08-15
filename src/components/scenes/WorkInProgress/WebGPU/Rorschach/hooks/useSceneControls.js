import { folder, useControls } from 'leva';

import { useCallback, useMemo, useRef, useState } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import {
  getCameraControlsKey,
  useSceneCameraControls,
} from '../../../../../../modules/cameraRig';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import CAMERA from '../utils/camera';
import {
  DEFAULT_BOUND_HEIGHT,
  DEFAULT_BOUND_RADIUS,
  DEFAULT_BOUND_WIDTH,
  DEFAULT_MIN_SPREAD,
} from '../utils/odeIntegrator';
import { PALETTE_NAMES, hslToHex } from '../utils/palette';
import {
  DEFAULT_BUNDLE_COUNT,
  DEFAULT_COEFF_RANGE,
  DEFAULT_FRAMING_SHAPE,
  DEFAULT_FREQ,
  DEFAULT_START_SPREAD,
  DEFAULT_STEPS,
  DEFAULT_STRANDS_PER_BUNDLE,
  MAX_BUNDLE_COUNT,
  computeStyles,
} from '../utils/testGenerator';
import buildBundleOverrideSchema, {
  overridesToLevaFields,
} from './buildBundleOverrideSchema';

const SCENE_LABEL = 'Rorschach';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;
const FRAMING_SHAPE_PATH = `${SCENE_LABEL}.Structure.framingShape`;
const CONTINUOUS_MODE_PATH = `${SCENE_LABEL}.Growth.continuousMode`;

// Only Lines mode exists so far (Points/Ink land in later phases) — no
// `mode` toggle control yet, no Lighting folder (unlit line material, so
// nothing to light).
export default function useSceneControls() {
  // Bundle Editor: one static schema of MAX_BUNDLE_COUNT `BundleN` folders
  // (see buildBundleOverrideSchema.js) — each has its own Override toggle
  // and fields, so multiple bundles can be seen and edited side by side
  // instead of selecting one at a time. `overrides` is real React state —
  // not a ref — so Test.jsx's memos correctly detect changes.
  //
  // `overrides` lives outside Leva's own controlled state, so it does NOT
  // automatically flow through Presets' copy/apply pipeline the way every
  // other control does. setOverridesRef + getPresetControlsWithOverrides
  // below wire it back in on preset *switch* (also re-syncing every
  // BundleN field via overridesToLevaFields, so the panel never shows a
  // stale toggle for an override that isn't actually active), and the
  // `useState(() => ...)` lazy initializer wires it in on cold mount —
  // both needed, same as the `p.xxx ?? default` seeding every other
  // control already does for the same reason.
  const setOverridesRef = useRef(null);
  const overridesRef = useRef({});
  const controlsRef = useRef(null);
  const setControlsRef = useRef(null);

  // Reads current seed/bundleCount/monochrome/inkColor/palette/overrides
  // off refs (not React state) so it's never stale by the time a Bundle
  // Override toggle's onChange fires — same reasoning as the ref-bootstrap
  // pattern the Presets dropdown already uses in this file. Reuses
  // computeStyles (the same function that decides what's actually
  // rendered) rather than reimplementing the color logic, so the pre-fill
  // can never diverge from what's really showing.
  const getCurrentColorHex = useCallback((i) => {
    const c = controlsRef.current;
    if (!c) return '#ff0000';
    const styles = computeStyles(c.seed, c.bundleCount, {
      monochrome: c.monochrome,
      inkColor: c.inkColor,
      palette: c.palette,
      overrides: overridesRef.current,
    });
    const { h, s, l } = styles[i]?.color ?? { h: 0, s: 0, l: 0.5 };
    return hslToHex(h, s, l);
  }, []);

  const getPresetControlsWithOverrides = useCallback(
    ({ presetSnapshot, ...rest }) => {
      const { overrides: presetOverrides, ...controlsSnapshot } =
        presetSnapshot;
      if (setOverridesRef.current)
        setOverridesRef.current(presetOverrides || {});
      const nextControls = getPresetControls({
        presetSnapshot: controlsSnapshot,
        ...rest,
      });
      if (!nextControls) return nextControls;
      return {
        ...nextControls,
        ...overridesToLevaFields(presetOverrides || {}),
      };
    },
    []
  );

  const {
    attachSetControls,
    controlsSnapshotRef,
    initialPreset,
    presetsFolder,
  } = usePresetsFolder({
    defaultPreset: DEFAULT_PRESET,
    getPresetControls: getPresetControlsWithOverrides,
    presets: PRESETS,
  });

  // Seeds every folder's Leva schema `value:`s from the active preset on
  // first mount — same reasoning as CameraRig (docs/scene-conventions.md
  // §10): without this, the schema always shows DEFAULT_* / hardcoded values
  // until "reset" is clicked, even when a non-default preset is selected.
  const p = PRESETS[initialPreset] || PRESETS[DEFAULT_PRESET];

  const [overrides, setOverrides] = useState(() => p.overrides || {});
  setOverridesRef.current = setOverrides;
  overridesRef.current = overrides;

  const cameraApiRef = useRef(null);
  const { buildCamera, cameraControls } = useSceneCameraControls({
    apiRef: cameraApiRef,
    camera: CAMERA,
    cameraFolderPath: CAMERA_FOLDER_PATH,
    controlsSnapshotRef,
  });

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),
    Structure: folder(
      {
        seed: {
          label: 'Seed',
          value: p.seed ?? 260708,
          min: 0,
          max: 999999,
          step: 1,
        },
        bundleCount: {
          label: 'Bundle Count',
          value: p.bundleCount ?? DEFAULT_BUNDLE_COUNT,
          min: 1,
          max: MAX_BUNDLE_COUNT,
          step: 1,
        },
        strandsPerBundle: {
          label: 'Strands Per Bundle',
          value: p.strandsPerBundle ?? DEFAULT_STRANDS_PER_BUNDLE,
          min: 2,
          max: 50,
          step: 1,
        },
        steps: {
          label: 'Curl Length (steps)',
          value: p.steps ?? DEFAULT_STEPS,
          min: 80,
          max: 2000,
          step: 20,
        },
        startSpread: {
          label: 'Strand Spread',
          value: p.startSpread ?? DEFAULT_START_SPREAD,
          min: 0.02,
          max: 1.2,
          step: 0.01,
        },
        coeffRange: {
          label: 'Chaos Amount',
          value: p.coeffRange ?? DEFAULT_COEFF_RANGE,
          min: 0.5,
          max: 2.5,
          step: 0.05,
        },
        freq: {
          label: 'Curl Frequency',
          value: p.freq ?? DEFAULT_FREQ,
          min: 0.1,
          max: 2,
          step: 0.05,
        },
        framingShape: {
          label: 'Framing Shape',
          value: p.framingShape ?? DEFAULT_FRAMING_SHAPE,
          options: { Cube: 'cube', Sphere: 'sphere', None: 'none' },
        },
        boundRadius: {
          label: 'Bound Radius',
          value: p.boundRadius ?? DEFAULT_BOUND_RADIUS,
          min: 5,
          max: 100,
          step: 1,
          render: (get) => get(FRAMING_SHAPE_PATH) === 'sphere',
        },
        boundWidth: {
          label: 'Bound Width',
          value: p.boundWidth ?? DEFAULT_BOUND_WIDTH,
          min: 5,
          max: 100,
          step: 1,
          render: (get) => get(FRAMING_SHAPE_PATH) === 'cube',
        },
        boundHeight: {
          label: 'Bound Height',
          value: p.boundHeight ?? DEFAULT_BOUND_HEIGHT,
          min: 5,
          max: 100,
          step: 1,
          render: (get) => get(FRAMING_SHAPE_PATH) === 'cube',
        },
        minSpread: {
          label: 'Min Bundle Spread',
          value: p.minSpread ?? DEFAULT_MIN_SPREAD,
          min: 0.5,
          max: 15,
          step: 0.1,
        },
      },
      { collapsed: true }
    ),
    Growth: folder(
      {
        growthDuration: {
          label: 'Growth Duration (s)',
          value: p.growthDuration ?? 4,
          min: 0,
          max: 15,
          step: 0.5,
        },
        continuousMode: {
          label: 'Continuous Mode',
          value: p.continuousMode ?? false,
        },
        continuousModeDelay: {
          label: 'Continuous Mode Delay (s)',
          value: p.continuousModeDelay ?? 2,
          min: 0,
          max: 30,
          step: 0.5,
          render: (get) => get(CONTINUOUS_MODE_PATH),
        },
      },
      { collapsed: true }
    ),
    Evolution: folder(
      {
        evolutionEnabled: {
          label: 'Evolution Enabled',
          value: p.evolutionEnabled ?? false,
        },
        evolutionSpeed: {
          label: 'Evolution Speed',
          value: p.evolutionSpeed ?? 0.4,
          min: 0,
          max: 10,
          step: 0.05,
        },
        smoothRespawns: {
          label: 'Smooth Respawn Snaps',
          value: p.smoothRespawns ?? true,
        },
        trailFade: {
          label: 'Trail Fade',
          value: p.trailFade ?? true,
        },
      },
      { collapsed: true }
    ),
    Style: folder(
      {
        monochrome: {
          label: 'Monochrome Ink',
          value: p.monochrome ?? true,
        },
        inkColor: {
          label: 'Ink Color',
          value: p.inkColor ?? '#1f1f1f',
        },
        palette: {
          label: 'Palette',
          value: p.palette ?? 'Random',
          options: PALETTE_NAMES,
        },
        flatten: {
          label: 'Flatten (2D)',
          value: p.flatten ?? 0,
          min: 0,
          max: 1,
          step: 0.01,
        },
        flattenAxis: {
          label: 'Flatten Axis',
          value: p.flattenAxis ?? 'z',
          options: { Z: 'z', Y: 'y' },
        },
      },
      { collapsed: true }
    ),
    Scene: folder(
      {
        backgroundColor: {
          label: 'Background Color',
          value: p.backgroundColor ?? '#f4efe4',
        },
        showOverlay: {
          label: 'Show Overlay',
          value: p.showOverlay ?? true,
        },
      },
      { collapsed: true }
    ),
    BundleEditor: folder(
      buildBundleOverrideSchema({
        presetOverrides: p.overrides,
        sceneLabel: SCENE_LABEL,
        setOverridesRef,
        setControlsRef,
        getCurrentColorHex,
      }),
      { collapsed: true }
    ),
    PostProcessing: folder(
      {
        bloomEnabled: {
          label: 'Bloom Enabled',
          value: p.bloomEnabled ?? true,
        },
        bloomThreshold: {
          label: 'Bloom Threshold',
          value: p.bloomThreshold ?? 1,
          min: 0,
          max: 3,
          step: 0.01,
        },
        bloomStrength: {
          label: 'Bloom Strength',
          value: p.bloomStrength ?? 0.5,
          min: 0,
          max: 3,
          step: 0.01,
        },
        bloomRadius: {
          label: 'Bloom Radius',
          value: p.bloomRadius ?? 0.3,
          min: 0,
          max: 1,
          step: 0.01,
        },
      },
      { collapsed: true }
    ),
  }));

  attachSetControls(setControls);
  controlsSnapshotRef.current = { ...controls, overrides };
  controlsRef.current = controls;
  setControlsRef.current = setControls;

  // Rule: control changes must never reset the camera (docs/scene-conventions.md §10).
  const cameraControlsKey = useMemo(
    () => getCameraControlsKey(controls),
    [controls]
  );
  const camera = useMemo(
    () => buildCamera(controls),
    [buildCamera, cameraControlsKey]
  );

  // ButtonOverlay's "Regenerate" re-seeds via setControls, triggering a new
  // test through Test.jsx's `seed` dependency.
  const regenerate = useCallback(() => {
    setControls({ seed: Math.floor(Math.random() * 1_000_000) });
  }, [setControls]);

  return useMemo(
    () => ({ ...controls, camera, cameraApiRef, regenerate, overrides }),
    [camera, controls, regenerate, overrides]
  );
}
