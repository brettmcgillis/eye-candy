import { button, folder, useControls } from 'leva';

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
} from '../utils/odeIntegrator';
import { PALETTE_NAMES } from '../utils/palette';
import {
  DEFAULT_BUNDLE_COUNT,
  DEFAULT_COEFF_RANGE,
  DEFAULT_FRAMING_SHAPE,
  DEFAULT_FREQ,
  DEFAULT_START_SPREAD,
  DEFAULT_STEPS,
  DEFAULT_STRANDS_PER_BUNDLE,
} from '../utils/testGenerator';

const SCENE_LABEL = 'Rorschach';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;
const FRAMING_SHAPE_PATH = `${SCENE_LABEL}.Test.framingShape`;

// Only Lines mode exists so far (Points/Ink land in later phases) — no
// `mode` toggle control yet, no Lighting folder (unlit line material, so
// nothing to light).
export default function useSceneControls() {
  // Bundle Editor: a single-row editor for a dynamic-length list of bundles
  // (bundleCount can grow well past what a fixed per-bundle folder-per-index
  // UI would tolerate). `overrides` is real React state — not a ref — so
  // Test.jsx's useMemo correctly detects changes and regenerates. `editIndex`
  // selects which bundle's stored override (if any) the scratch fields below
  // show; switching it *loads* that bundle's values (via the ref-bootstrapped
  // onChange pattern usePresetsFolder's own preset dropdown already uses in
  // this file). Every field writes straight through on change — no Apply
  // step. Style changes (computeStyles in testGenerator.js) are cheap and
  // independent of structural generation, so there's no expensive regen to
  // protect against here the way there was before that split; live editing
  // is simply how the rest of this panel already works.
  //
  // Each field (colorOverride, visible, growthDelay) applies independently
  // when set — there is deliberately no separate "master enabled" gate on
  // top of them. An earlier version required both that master gate AND a
  // field's own toggle before anything took effect, which meant flipping
  // Color Override + picking a color visibly did nothing unless you also
  // remembered a second, easy-to-miss switch. Don't reintroduce it.
  //
  // `overrides` lives outside Leva's own controlled state, so it does NOT
  // automatically flow through Presets' copy/apply pipeline the way every
  // other control does. setOverridesRef + getPresetControlsWithOverrides
  // below wire it back in on preset *switch*, and the `useState(() => ...)`
  // lazy initializer wires it in on cold mount (page load with a non-default
  // preset active) — both are needed, same as the `p.xxx ?? default` seeding
  // every other Test-folder control already does for the same reason.
  const setOverridesRef = useRef(null);
  const controlsRef = useRef(null);
  const setControlsRef = useRef(null);

  const getPresetControlsWithOverrides = useCallback(
    ({ presetSnapshot, ...rest }) => {
      const { overrides: presetOverrides, ...controlsSnapshot } =
        presetSnapshot;
      if (setOverridesRef.current)
        setOverridesRef.current(presetOverrides || {});
      return getPresetControls({ presetSnapshot: controlsSnapshot, ...rest });
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

  // Seeds the Test folder's Leva schema `value:`s from the active preset on
  // first mount — same reasoning as CameraRig (docs/scene-conventions.md
  // §10): without this, the schema always shows DEFAULT_* / hardcoded values
  // until "reset" is clicked, even when a non-default preset is selected.
  const p = PRESETS[initialPreset] || PRESETS[DEFAULT_PRESET];

  const [overrides, setOverrides] = useState(() => p.overrides || {});
  const overridesRef = useRef(overrides);
  overridesRef.current = overrides;
  setOverridesRef.current = setOverrides;

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
    Test: folder(
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
          max: 50,
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
          options: { Cube: 'cube', Sphere: 'sphere' },
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
        growthDuration: {
          label: 'Growth Duration (s)',
          value: p.growthDuration ?? 4,
          min: 0,
          max: 15,
          step: 0.5,
        },
        evolutionEnabled: {
          label: 'Evolution Enabled',
          value: p.evolutionEnabled ?? false,
        },
        evolutionSpeed: {
          label: 'Evolution Speed',
          value: p.evolutionSpeed ?? 0.4,
          min: 0,
          max: 3,
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
      {
        editIndex: {
          label: 'Bundle #',
          value: 0,
          min: 0,
          max: 199,
          step: 1,
          onChange: (index) => {
            const stored = overridesRef.current[index] || {};
            if (!setControlsRef.current) return;
            setControlsRef.current({
              bundleVisible: stored.visible ?? true,
              bundleColorOverride: stored.colorOverride ?? false,
              bundleColor: stored.color ?? '#ff0000',
              bundleGrowthDelay: stored.growthDelay ?? 0,
            });
          },
        },
        // Every field below writes straight into overrides[editIndex] on
        // change — reads editIndex fresh off controlsRef (not a stale
        // closure) each time, same ref-bootstrap pattern as the presets
        // dropdown above.
        bundleVisible: {
          label: 'Visible',
          value: true,
          onChange: (visible) => {
            const index = controlsRef.current?.editIndex ?? 0;
            setOverridesRef.current((prev) => ({
              ...prev,
              [index]: { ...(prev[index] || {}), visible },
            }));
          },
        },
        bundleColorOverride: {
          label: 'Color Override',
          value: false,
          onChange: (colorOverride) => {
            const index = controlsRef.current?.editIndex ?? 0;
            setOverridesRef.current((prev) => ({
              ...prev,
              [index]: { ...(prev[index] || {}), colorOverride },
            }));
          },
        },
        bundleColor: {
          label: 'Bundle Color',
          value: '#ff0000',
          onChange: (color) => {
            const index = controlsRef.current?.editIndex ?? 0;
            setOverridesRef.current((prev) => ({
              ...prev,
              [index]: { ...(prev[index] || {}), color },
            }));
          },
        },
        bundleGrowthDelay: {
          label: 'Growth Delay (s)',
          value: 0,
          min: 0,
          max: 10,
          step: 0.1,
          onChange: (growthDelay) => {
            const index = controlsRef.current?.editIndex ?? 0;
            setOverridesRef.current((prev) => ({
              ...prev,
              [index]: { ...(prev[index] || {}), growthDelay },
            }));
          },
        },
        resetOverride: button(() => {
          const c = controlsRef.current;
          if (!c) return;
          setOverridesRef.current((prev) => {
            const next = { ...prev };
            delete next[c.editIndex];
            return next;
          });
          if (setControlsRef.current) {
            setControlsRef.current({
              bundleVisible: true,
              bundleColorOverride: false,
              bundleGrowthDelay: 0,
            });
          }
        }),
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
