import { folder, useControls } from 'leva';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import { useMediaRecorder } from '../../../../../../modules/mediaRecorder';
import getCloudControls from '../components/getCloudControls';
import getFluidControls from '../components/getFluidControls';
import getGravityControls from '../components/getGravityControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import { requestMotionPermission, subscribeShake } from '../utils/deviceMotion';

const SCENE_LABEL = 'Cross Talk';
export const WINDOW_SYNC_CHANNEL = 'crossTalk';

// Full Leva path to the preset dropdown (see usePresetsFolder.js — the
// control's own key is `preset`, nested in the `Presets` folder), used by
// each preset-specific folder's `render` predicate below so only the
// active preset's controls show — every folder still exists in the Leva
// store at all times, just hidden, which matters because preset-switching
// (usePresetsFolder's applyPresetByName) writes a whole preset snapshot
// via setControls() immediately, before this hook's next render — if a
// folder didn't exist in the store yet, that write would have nothing to
// land on.
const PRESET_PATH = `${SCENE_LABEL}.Presets.preset`;

// Merged so every preset's keys have a sane fallback regardless of which
// preset happens to be initial (query-param deep link, or DEFAULT_PRESET) —
// each preset only lists the keys it actually cares about (§9), so e.g.
// FluidSim's snapshot has no `spread`/`hueShift` and Clouds' has no
// `gravity`/`maxParticles`.
const PRESET_DEFAULTS = Object.assign({}, ...Object.values(PRESETS));

// This scene has no Camera folder / CameraRig (docs/scene-conventions.md §10)
// — see components/DesktopStage.jsx for why: the camera is a fixed,
// pixel-accurate viewport rather than something a user frames.
export default function useSceneControls() {
  const {
    attachSetControls,
    controlsSnapshotRef,
    initialPreset,
    presetsFolder,
    selectedPreset,
  } = usePresetsFolder({
    defaultPreset: DEFAULT_PRESET,
    getPresetControls,
    presets: PRESETS,
  });

  // Generic "start over" counter — Fluid's Respawn button and Gravity's
  // Reset Ball button both just bump it; each preset's own host-side hook
  // watches it and only acts while that preset is actually mounted, so one
  // counter can serve every preset that wants a manual reset without them
  // stepping on each other.
  const [reseedTick, setReseedTick] = useState(0);
  const p = {
    ...PRESET_DEFAULTS,
    ...(PRESETS[initialPreset] || PRESETS[DEFAULT_PRESET]),
  };

  // iOS motion permission must be requested from inside the click handler's
  // call stack — Leva buttons invoke synchronously on click, so this is one.
  // On grant, flip the Tilt Gravity toggle on so one tap does the whole job
  // (Leva `set` works with the same flat keys presets use). setControls
  // doesn't exist until the useControls call below returns, so the click
  // handler reaches it through a ref instead of the binding directly.
  const setControlsRef = useRef(null);
  const onEnableTilt = () => {
    requestMotionPermission().then((granted) => {
      if (granted) setControlsRef.current?.({ tiltGravity: true });
    });
  };

  // Lets GravityArrow's drag handle write straight to the same Leva control
  // the angle slider owns, so dragging the arrow and dragging the slider
  // are just two inputs to one value — same ref-indirection reason as
  // onEnableTilt above. Stable across renders (empty deps) so including it
  // in the memoized return below doesn't defeat that memo.
  const setGravityAngle = useCallback((angleDeg) => {
    setControlsRef.current?.({ gravityAngle: angleDeg });
  }, []);

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Settings: folder({
      backgroundColor: { label: 'Background Color', value: p.backgroundColor },
      syncEasing: {
        label: 'Window Sync Easing',
        max: 0.5,
        min: 0.01,
        step: 0.01,
        value: p.syncEasing,
      },
    }),
    Cloud: getCloudControls(p, (get) => get(PRESET_PATH) === 'Cloud Connected'),
    Fluid: getFluidControls(
      p,
      () => setReseedTick((tick) => tick + 1),
      onEnableTilt,
      (get) => get(PRESET_PATH) === 'Waterworks'
    ),
    Gravity: getGravityControls(
      p,
      () => setReseedTick((tick) => tick + 1),
      (get) => get(PRESET_PATH) === 'Gravity Rooms'
    ),
  }));

  setControlsRef.current = setControls;
  attachSetControls(setControls);
  controlsSnapshotRef.current = { ...controls };

  // Spacebar = the Fluid folder's Respawn button. Reseeding is keyed on
  // reseedTick, and only the host window's solver rebuilds from it (see
  // useFluidSim) — pressing space in a non-host window is a no-op, so press
  // it in the window doing the simulating.
  useEffect(() => {
    if (selectedPreset !== 'Waterworks') return undefined;

    const onKeyDown = (event) => {
      if (event.code !== 'Space' || event.repeat) return;
      const el = event.target;
      if (
        el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA' ||
        el.isContentEditable
      ) {
        return;
      }
      event.preventDefault();
      setReseedTick((tick) => tick + 1);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedPreset]);

  // Shake-to-respawn, the mobile sibling of the spacebar handler above.
  // Shake events only ever fire while tilt gravity has the motion listeners
  // attached (see useFluidSim / utils/deviceMotion.js).
  useEffect(() => {
    if (selectedPreset !== 'Waterworks') return undefined;
    return subscribeShake(() => setReseedTick((tick) => tick + 1));
  }, [selectedPreset]);

  useMediaRecorder({ fileName: SCENE_LABEL });

  // `preset` is taken from `selectedPreset` (usePresetsFolder's own React
  // state, set synchronously in the dropdown's onChange), not from
  // `controls.preset` — the latter round-trips through Leva's store/paths
  // machinery, which is more moving parts than a component branching on
  // "which preset is active" should have to trust.
  return useMemo(
    () => ({
      ...controls,
      preset: selectedPreset,
      reseedTick,
      setGravityAngle,
    }),
    [controls, reseedTick, selectedPreset, setGravityAngle]
  );
}
