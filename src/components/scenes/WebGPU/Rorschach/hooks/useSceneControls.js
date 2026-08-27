import { useCallback, useMemo, useRef } from 'react';

import { button, folder, useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';
import {
  getCameraControlsKey,
  useSceneCameraControls,
} from '@modules/cameraRig';
import {
  CAMERA,
  COEFF_DRIFT_CLAMP,
  DEFAULT_BOUND_HEIGHT,
  DEFAULT_BOUND_RADIUS,
  DEFAULT_BOUND_WIDTH,
  DEFAULT_BUNDLE_COUNT,
  DEFAULT_COEFF_RANGE,
  DEFAULT_FRAMING_SHAPE,
  DEFAULT_FREQ,
  DEFAULT_MIN_SPREAD,
  DEFAULT_START_SPREAD,
  DEFAULT_STEPS,
  DEFAULT_STRANDS_PER_BUNDLE,
  GROWTH_BASE_RATE,
  MAX_BUNDLE_COUNT,
  PALETTE_NAMES,
  SECONDS_PER_SYSTEM,
  buildOverridesFromControls,
  growthSpeedFor,
  randomSeed,
  rollTestConfig,
  rollableKeys,
} from '@modules/rorschach';

import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import buildBundleOverrideSchema from './buildBundleOverrideSchema';

const SCENE_LABEL = 'Rorschach';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;
const FRAMING_SHAPE_PATH = `${SCENE_LABEL}.Structure.framingShape`;
const CONTINUOUS_MODE_PATH = `${SCENE_LABEL}.Growth.continuousMode`;
const PALETTE_PATH = `${SCENE_LABEL}.Style.palette`;
const MONOCHROME_PATH = `${SCENE_LABEL}.Style.monochrome`;
const CINEMATIC_PATH = `${SCENE_LABEL}.Cinematic.cinematicEnabled`;

// Only Lines mode exists so far (Points/Ink land in later phases) — no
// `mode` toggle control yet, no Lighting folder (unlit line material, so
// nothing to light).
export default function useSceneControls() {
  // Bundle Editor: one static schema of MAX_BUNDLE_COUNT `BundleN` folders
  // (see buildBundleOverrideSchema.js) — each has its own Override toggle
  // and fields, all real flat Leva controls (`bundle0Emissive`, ...) like
  // everything else in this scene. `overrides`, the nested per-bundle shape
  // Test.jsx/computeStyles actually consume, is derived from `controls`
  // below via buildOverridesFromControls — not tracked as separate state,
  // so there's only one source of truth and it can't drift from the panel
  // on mount, preset switch, or a live edit (a hand-rolled side-channel
  // used to sit here instead and repeatedly went stale against the panel).
  // Only for the Style folder's "Shuffle Palette Colors" button below — a
  // Leva button's onClick only receives `get`, not a setter, and it's
  // defined inside the schema factory passed to useControls (before that
  // call's own `setControls` return value exists yet), so it needs a ref
  // populated after the fact instead of closing over `setControls` directly.
  const setControlsRef = useRef(null);
  const rollFacetRef = useRef(null);

  const {
    attachSetControls,
    controlsSnapshotRef,
    initialPreset,
    presetsFolder,
  } = usePresetsFolder({
    defaultPreset: DEFAULT_PRESET,
    getPresetControls,
    presets: PRESETS,
  });

  // Seeds every folder's Leva schema `value:`s from the active preset on
  // first mount — same reasoning as CameraRig (docs/scene-conventions.md
  // §10): without this, the schema always shows DEFAULT_* / hardcoded values
  // until "reset" is clicked, even when a non-default preset is selected.
  const p = PRESETS[initialPreset] || PRESETS[DEFAULT_PRESET];

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
          step: 1,
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
        growthSpeed: {
          label: 'Growth Speed',
          value: p.growthSpeed ?? 1,
          min: 0,
          max: 12,
          step: 0.05,
        },
        growthStyle: {
          label: 'Growth Style',
          value: p.growthStyle ?? 'unison',
          options: { Unison: 'unison', Sequential: 'sequential' },
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
    Cinematic: folder(
      {
        cinematicEnabled: {
          label: 'Cinematic Mode',
          value: p.cinematicEnabled ?? false,
        },
        cinematicSecondsPerSystem: {
          label: 'Seconds Per System',
          value: p.cinematicSecondsPerSystem ?? SECONDS_PER_SYSTEM,
          min: 2,
          max: 30,
          step: 0.5,
          render: (get) => get(CINEMATIC_PATH),
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
        curlLimit: {
          label: 'Curl Limit',
          value: p.curlLimit ?? 1,
          min: 0,
          max: COEFF_DRIFT_CLAMP,
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
          render: (get) => get(MONOCHROME_PATH),
        },
        palette: {
          label: 'Palette',
          value: p.palette ?? 'Random',
          options: PALETTE_NAMES,
          render: (get) => !get(MONOCHROME_PATH),
        },
        paletteExact: {
          label: 'Palette Exact Colors',
          value: p.paletteExact ?? false,
          render: (get) =>
            !get(MONOCHROME_PATH) && get(PALETTE_PATH) !== 'Random',
        },
        paletteShuffleSeed: {
          label: 'Palette Shuffle Seed',
          value: p.paletteShuffleSeed ?? 0,
          min: 0,
          max: 999999,
          step: 1,
          render: (get) =>
            !get(MONOCHROME_PATH) && get(PALETTE_PATH) !== 'Random',
        },
        shufflePalette: button(
          () => {
            setControlsRef.current?.({
              paletteShuffleSeed: Math.floor(Math.random() * 999999) + 1,
            });
          },
          {
            label: 'Shuffle Palette Colors',
            render: (get) =>
              !get(MONOCHROME_PATH) && get(PALETTE_PATH) !== 'Random',
          }
        ),
        // Split from its own value so the amount survives being switched off.
        // As a bare number, "off" and "barely on" were the same control, and
        // returning to a squash you liked meant remembering what it was.
        flattenEnabled: {
          label: 'Flatten (2D)',
          value: p.flattenEnabled ?? false,
        },
        flatten: {
          label: 'Flatten Amount',
          value: p.flatten ?? 0.97,
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
    Layers: folder(
      {
        lines: {
          label: 'Lines',
          value: p.lines ?? true,
        },
        ink: {
          label: 'Ink (watercolour)',
          value: p.ink ?? false,
        },
      },
      { collapsed: false }
    ),
    // Re-roll one facet, leaving everything else exactly as it is. This is the
    // scene's whole answer to "hold that, vary this" — no pins and nothing
    // disabled, because unlike a batch of a hundred sight-unseen tests, every
    // value here is already on screen and holding is the default.
    Roll: folder(
      {
        rollStructure: button(() => rollFacetRef.current?.('structure'), {
          label: 'Roll Structure',
        }),
        rollPalette: button(() => rollFacetRef.current?.('palette'), {
          label: 'Roll Palette + Emissive',
        }),
        rollInk: button(() => rollFacetRef.current?.('ink'), {
          label: 'Roll Ink',
        }),
      },
      { collapsed: true }
    ),
    Ink: folder(
      {
        inkOrientation: {
          label: 'Paper Plane',
          value: p.inkOrientation ?? 'vertical',
          options: {
            'Vertical (z)': 'vertical',
            'Horizontal (y)': 'horizontal',
          },
        },
        inkOffset: {
          label: 'Paper Offset',
          value: p.inkOffset ?? 0,
          min: -50,
          max: 50,
          step: 0.1,
        },
        inkPaperSize: {
          label: 'Paper Size',
          value: p.inkPaperSize ?? 20,
          min: 1,
          max: 200,
          step: 0.5,
        },
        inkPaperGrain: {
          label: 'Paper Tooth',
          value: p.inkPaperGrain ?? 0.5,
          min: 0,
          max: 1,
          step: 0.01,
        },
        inkResolution: {
          label: 'Sim Resolution',
          value: p.inkResolution ?? 2048,
          options: { 256: 256, 512: 512, 1024: 1024, 2048: 2048 },
        },
        inkStepsPerFrame: {
          label: 'Sim Steps / Frame',
          value: p.inkStepsPerFrame ?? 1,
          min: 0,
          max: 8,
          step: 1,
        },
        // Not 0. The pattern is the ink's only pigment source, so a preset that
        // omits these gets a bare background rather than a blot.
        // The scene's bloom is one pass with one threshold, and non-emissive
        // strokes sit just under it. Rather than lowering it — which would
        // bloom every stroke too — the ink pushes its own output past it, the
        // same way an emissive bundle does.
        inkBloom: {
          label: 'Ink Bloom',
          value: p.inkBloom ?? false,
        },
        // An absolute distance past the threshold, not a multiplier, so it
        // means the same thing for every pigment in a palette.
        inkBloomStrength: {
          label: 'Ink Bloom Strength',
          value: p.inkBloomStrength ?? 0.4,
          min: 0,
          max: 3,
          step: 0.05,
        },
        // On, the ink glows for exactly the bundles the Lines layer glows for.
        // Off, the whole blot glows. Note that with this on and no bundle
        // marked emissive, Ink Bloom does nothing — which is the same thing the
        // strokes do, and is the point.
        inkBloomEmissiveOnly: {
          label: 'Ink Bloom: Emissive Only',
          value: p.inkBloomEmissiveOnly ?? true,
        },
        inkBloomSource: {
          label: 'Ink Bloom Source',
          value: p.inkBloomSource ?? 'thickness',
          options: { Thickness: 'thickness', Wetness: 'wetness' },
        },
        inkPatternFlow: {
          label: 'Pattern Flow',
          value: p.inkPatternFlow ?? 0.3,
          min: 0,
          max: 1,
          step: 0.01,
        },
        inkPatternWash: {
          label: 'Pattern Wash',
          value: p.inkPatternWash ?? 0.9,
          min: 0,
          max: 1,
          step: 0.01,
        },
        // How fast paint is reclaimed. The pattern is a moving source, so
        // without this the sheet fills to a solid mass; high values pin the
        // blot to the pattern's current shape, low values let it accumulate
        // and bleed. A still pins the clock and so tolerates far less.
        inkPatternFade: {
          label: 'Pattern Fade',
          value: p.inkPatternFade ?? 0.08,
          min: 0.005,
          max: 0.5,
          step: 0.005,
        },
        inkPatternScale: {
          label: 'Pattern Scale',
          value: p.inkPatternScale ?? 1,
          min: 0.5,
          max: 10,
          step: 0.5,
        },
        inkPatternDensity: {
          label: 'Pattern Density',
          value: p.inkPatternDensity ?? 0.5,
          min: 0,
          max: 1,
          step: 0.01,
        },
        inkPatternSharpness: {
          label: 'Pattern Sharpness',
          value: p.inkPatternSharpness ?? 0.95,
          min: 0,
          max: 1,
          step: 0.01,
        },
        // How wide a gradient the sim gets across the blot's edge, and so how
        // far paint travels. Its own knob rather than Pattern Sharpness, which
        // only decides how hard the blot is *drawn*: at any usable Sharpness
        // the field is a step function, which gives the fluid nothing to work
        // with.
        inkPatternSoftness: {
          label: 'Wash Softness',
          value: p.inkPatternSoftness ?? 0.04,
          min: 0.01,
          max: 0.25,
          step: 0.005,
        },
        inkPatternDetails: {
          label: 'Pattern Details',
          value: p.inkPatternDetails ?? 3.75,
          min: 1,
          max: 5,
          step: 0.01,
        },
        inkPatternSpeed: {
          label: 'Pattern Speed',
          value: p.inkPatternSpeed ?? 1,
          min: 0,
          max: 10,
          step: 0.1,
        },
        // How far the wash spreads across the palette. 0 paints the whole blot
        // in the first pigment (the old monochrome behaviour); 1 divides the
        // sheet into broad regions of each palette colour that mix
        // subtractively where they meet.
        inkPaletteMix: {
          label: 'Palette Spread',
          value: p.inkPaletteMix ?? 1,
          min: 0,
          max: 1,
          step: 0.01,
        },
        inkPaletteScale: {
          label: 'Palette Scale',
          value: p.inkPaletteScale ?? 1.5,
          min: 0.2,
          max: 8,
          step: 0.1,
        },
        // Full 0-1, like Cell Symmetry. At 1 both halves carry the same
        // colours; below that each half takes its own path through the palette
        // while the silhouette stays mirrored.
        inkPaletteSymmetry: {
          label: 'Palette Symmetry',
          value: p.inkPaletteSymmetry ?? 1,
          min: 0,
          max: 1,
          step: 0.01,
        },
        inkCellAmount: {
          label: 'Cell Pixelation',
          value: p.inkCellAmount ?? 0,
          min: 0,
          max: 1,
          step: 0.01,
        },
        inkCellReveal: {
          label: 'Cell Reveal',
          value: p.inkCellReveal ?? 0.5,
          min: 0,
          max: 1,
          step: 0.01,
        },
        inkCellScale: {
          label: 'Cell Size',
          value: p.inkCellScale ?? 24,
          min: 2,
          max: 200,
          step: 1,
        },
        // 1 makes each revealed cell a single flat colour; 0 lets the palette
        // keep varying inside it, which reads as painterly blocks rather than
        // pixels. Continuous in between.
        inkCellFlatten: {
          label: 'Cell Flatten',
          value: p.inkCellFlatten ?? 1,
          min: 0,
          max: 1,
          step: 0.01,
        },
        inkCellRevealScale: {
          label: 'Reveal Scale',
          value: p.inkCellRevealScale ?? 3,
          min: 0.5,
          max: 12,
          step: 0.1,
        },
        // Full 0-1, unlike Pattern Symmetry below: this crossfades the reveal
        // field with its folded copy, so 0 lets each half break into blocks on
        // its own and 1 mirrors the pixelation across the fold.
        inkCellSymmetry: {
          label: 'Cell Symmetry',
          value: p.inkCellSymmetry ?? 1,
          min: 0,
          max: 1,
          step: 0.01,
        },
        inkPatternSymmetry: {
          label: 'Pattern Symmetry',
          value: p.inkPatternSymmetry ?? 0.5,
          min: 0.5,
          max: 1,
          step: 0.01,
        },
      },
      // Collapsed, not render-gated on the Ink toggle: a folder hidden via
      // `render` is unmounted from Leva's tree, and a preset switch that sets
      // the toggle *and* the fields inside the folder in one setControls() call
      // evaluates `render` against the pre-update toggle — the folder stays
      // hidden for that pass and every field update inside it is dropped. Same
      // trap as the BundleEditor folder, same fix.
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
      buildBundleOverrideSchema({ presetSnapshot: p, sceneLabel: SCENE_LABEL }),
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
  controlsSnapshotRef.current = controls;
  setControlsRef.current = setControls;

  // Derived every render straight from `controls` (see the comment at the
  // top of this function) — mount, preset switch, and a live BundleN edit
  // all flow through the exact same computation, so there's nothing to fall
  // out of sync.
  const overrides = useMemo(
    () => buildOverridesFromControls(controls),
    [controls]
  );

  // Rule: control changes must never reset the camera (docs/scene-conventions.md §10).
  const cameraControlsKey = useMemo(
    () => getCameraControlsKey(controls),
    [controls]
  );
  const camera = useMemo(
    () => buildCamera(controls),
    [buildCamera, cameraControlsKey]
  );

  // ButtonOverlay's "Reseed" — a new shape from the same art direction.
  const reseed = useCallback(() => {
    setControls({ seed: randomSeed() });
  }, [setControls]);

  // ButtonOverlay's "Regenerate" rolls a whole new test (structure + style +
  // a cohesive background) rather than just a seed. Reads the *live* Growth
  // Speed rather than rolling one, so a rolled per-bundle override can pin
  // its Growth Duration to match — see @modules/rorschach/rollConfig.js.
  const growthSpeedRef = useRef(controls.growthSpeed);
  growthSpeedRef.current = controls.growthSpeed;
  const regenerate = useCallback(() => {
    setControls(
      rollTestConfig(randomSeed(), { growthSpeed: growthSpeedRef.current })
    );
  }, [setControls]);

  // Re-rolls one facet and applies only that facet's keys, so everything else
  // stays exactly as it was set.
  //
  // The scene needs no pins and nothing disabled, because it is not a batch
  // generator: there is one config, every value of it is already on screen, and
  // the only question a live editor has to answer is what Regenerate is allowed
  // to overwrite. The CLI and the workbench have to declare what to *hold*
  // because their values are never seen — a hundred tests are rolled sight
  // unseen. Here holding is the default and rolling is the verb, which is the
  // same capability inverted.
  const rollFacet = useCallback(
    (facet) => {
      const rolled = rollTestConfig(randomSeed(), {
        growthSpeed: growthSpeedRef.current,
      });
      const keys = rollableKeys(facet);
      // The per-bundle emissive overrides ride with the palette, since whether
      // a bundle can glow at all depends on that palette's contrast. Matched on
      // `bundle<N>` rather than the `bundle` prefix, or bundleCount — a
      // structure parameter — would be dragged along with them.
      const isOverride = (key) => /^bundle\d+/u.test(key);
      setControls(
        Object.fromEntries(
          Object.entries(rolled).filter(
            ([key]) => keys.has(key) || (facet === 'palette' && isOverride(key))
          )
        )
      );
    },
    [setControls]
  );
  rollFacetRef.current = rollFacet;

  // Cinematic Mode paces growth itself so a system finishes drawing in step
  // with the camera — see @modules/rorschach/cinematic.js. Derived here rather than written
  // back into the Growth Speed control, so switching the mode off restores
  // whatever the user had set.
  const growthSpeed = controls.cinematicEnabled
    ? growthSpeedFor(
        controls.steps,
        controls.cinematicSecondsPerSystem,
        GROWTH_BASE_RATE
      )
    : controls.growthSpeed;

  return useMemo(
    () => ({
      ...controls,
      growthSpeed,
      camera,
      cameraApiRef,
      regenerate,
      reseed,
      overrides,
    }),
    [camera, controls, growthSpeed, regenerate, reseed, overrides]
  );
}
