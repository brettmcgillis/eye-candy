import { folder, useControls } from 'leva';

import { useEffect, useRef } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import useSceneCameraControls from '../../../../../../hooks/useSceneCameraControls';
import PRESETS, {
  DEFAULT_PRESET as DEFAULT_PRESET_KEY,
} from '../presets/presets';
import { BIRD_OPTIONS } from '../utils/birds';
import CAMERA from '../utils/camera';
import BIRD_SLOTS, { posKey, rotKey } from '../utils/placements';

const SCENE_LABEL = 'Birds Arent Real';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;

const C = { collapsed: true };
const BEHAVIOR_OPTIONS = {
  'Idle (look around)': 'idle',
  'Wander/roam': 'wander',
};

function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}

export default function useSceneControls() {
  const {
    attachSetControls,
    controlsSnapshotRef,
    initialPreset,
    presetsFolder,
  } = usePresetsFolder({
    defaultPreset: DEFAULT_PRESET_KEY,
    getPresetControls,
    presets: PRESETS,
  });

  const p = PRESETS[initialPreset] || PRESETS[DEFAULT_PRESET_KEY];

  const { buildCamera, cameraControls } = useSceneCameraControls({
    camera: CAMERA,
    cameraFolderPath: CAMERA_FOLDER_PATH,
    controlsSnapshotRef,
  });

  // One collapsible subfolder per hand-placed bird, each with a position vec3 and a
  // heading. Keys are flat (`<slot>Pos` / `<slot>RotY`) so they map 1:1 onto the
  // flattened preset; the array is rebuilt on return.
  const birdControls = BIRD_SLOTS.reduce((acc, slot) => {
    acc[slot.label] = folder(
      {
        [posKey(slot)]: {
          value: p[posKey(slot)],
          step: 0.05,
          label: 'Position',
        },
        [rotKey(slot)]: {
          value: p[rotKey(slot)],
          min: -Math.PI,
          max: Math.PI,
          step: 0.05,
          label: 'Rotate Y',
        },
      },
      C
    );
    return acc;
  }, {});

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, C),
    Birds: folder(birdControls, C),
    Flock: folder(
      {
        birdType: {
          value: p.birdType,
          options: BIRD_OPTIONS,
          label: 'Species',
        },
        behavior: {
          value: p.behavior,
          options: BEHAVIOR_OPTIONS,
          label: 'Behavior',
        },
        animate: { value: p.animate, label: 'Animate' },
        sweepRange: {
          value: p.sweepRange,
          min: 0,
          max: 1.4,
          step: 0.05,
          label: 'Sweep Range',
        },
        sweepSpeed: {
          value: p.sweepSpeed,
          min: 0,
          max: 2,
          step: 0.05,
          label: 'Sweep Speed',
        },
        ledBlink: { value: p.ledBlink, label: 'REC LED' },
      },
      C
    ),
    'Camera Head': folder(
      {
        camScale: {
          value: p.camScale,
          min: 0.02,
          max: 0.6,
          step: 0.01,
          label: 'Size',
        },
        camOffset: {
          value: p.camOffset,
          step: 0.005,
          label: 'Offset (R/U/F)',
        },
        camRot: {
          value: p.camRot,
          min: -Math.PI,
          max: Math.PI,
          step: 0.05,
          label: 'Rotation',
        },
        ledOffset: {
          value: p.ledOffset,
          step: 0.01,
          label: 'REC LED',
        },
      },
      C
    ),
    Ground: folder(
      {
        asphaltColor: { value: p.asphaltColor, label: 'Asphalt Tint' },
        puddleColor: { value: p.puddleColor, label: 'Puddle' },
        texScale: {
          value: p.texScale,
          min: 0.05,
          max: 1,
          step: 0.01,
          label: 'Asphalt Tile',
        },
        puddleScale: {
          value: p.puddleScale,
          min: 0.1,
          max: 2,
          step: 0.05,
          label: 'Puddle Scale',
        },
        puddleAmount: {
          value: p.puddleAmount,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Puddle Amount',
        },
        reflectStrength: {
          value: p.reflectStrength,
          min: 0,
          max: 2,
          step: 0.05,
          label: 'Reflection',
        },
        reflectTint: { value: p.reflectTint, label: 'Reflect Tint' },
        roughDry: {
          value: p.roughDry,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Roughness Dry',
        },
        roughWet: {
          value: p.roughWet,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Roughness Wet',
        },
      },
      C
    ),
    Street: folder(
      {
        showStreet: { value: p.showStreet, label: 'Show Street' },
        curbScale: {
          value: p.curbScale,
          min: 0.2,
          max: 3,
          step: 0.05,
          label: 'Curb Scale',
        },
        'Bus Stop': folder(
          {
            busStopPos: { value: p.busStopPos, step: 0.05, label: 'Position' },
            busStopRotY: {
              value: p.busStopRotY,
              min: -Math.PI,
              max: Math.PI,
              step: 0.05,
              label: 'Rotate Y',
            },
            busStopScale: {
              value: p.busStopScale,
              min: 0.1,
              max: 3,
              step: 0.05,
              label: 'Scale',
            },
          },
          C
        ),
        'Trash Can': folder(
          {
            trashPos: { value: p.trashPos, step: 0.05, label: 'Position' },
            trashRotY: {
              value: p.trashRotY,
              min: -Math.PI,
              max: Math.PI,
              step: 0.05,
              label: 'Rotate Y',
            },
            trashScale: {
              value: p.trashScale,
              min: 0.1,
              max: 3,
              step: 0.05,
              label: 'Scale',
            },
          },
          C
        ),
        Manhole: folder(
          {
            manholePos: { value: p.manholePos, step: 0.05, label: 'Position' },
            manholeRotY: {
              value: p.manholeRotY,
              min: -Math.PI,
              max: Math.PI,
              step: 0.05,
              label: 'Rotate Y',
            },
            manholeScale: {
              value: p.manholeScale,
              min: 0.1,
              max: 3,
              step: 0.05,
              label: 'Scale',
            },
          },
          C
        ),
        Nest: folder(
          {
            nestPos: { value: p.nestPos, step: 0.05, label: 'Nest Pos' },
            nestRotY: {
              value: p.nestRotY,
              min: -Math.PI,
              max: Math.PI,
              step: 0.05,
              label: 'Nest Rotate Y',
            },
            nestScale: {
              value: p.nestScale,
              min: 0.1,
              max: 5,
              step: 0.05,
              label: 'Nest Scale',
            },
            nestEggScale: {
              value: p.nestEggScale,
              min: 0.05,
              max: 2,
              step: 0.01,
              label: 'Egg Scale',
            },
            nestEgg1Pos: {
              value: p.nestEgg1Pos,
              step: 0.01,
              label: 'Egg 1 Pos',
            },
            nestEgg1Rot: {
              value: p.nestEgg1Rot,
              step: 0.05,
              label: 'Egg 1 Rot',
            },
            nestEgg2Pos: {
              value: p.nestEgg2Pos,
              step: 0.01,
              label: 'Egg 2 Pos',
            },
            nestEgg2Rot: {
              value: p.nestEgg2Rot,
              step: 0.05,
              label: 'Egg 2 Rot',
            },
          },
          C
        ),
        Litter: folder(
          {
            newspaper2Pos: {
              value: p.newspaper2Pos,
              step: 0.05,
              label: 'Newspaper Pos',
            },
            newspaper2RotY: {
              value: p.newspaper2RotY,
              min: -Math.PI,
              max: Math.PI,
              step: 0.05,
              label: 'Newspaper Rot Y',
            },
            newspaper2Scale: {
              value: p.newspaper2Scale,
              min: 0.1,
              max: 5,
              step: 0.05,
              label: 'Newspaper Scale',
            },
            cigButtsPos: {
              value: p.cigButtsPos,
              step: 0.05,
              label: 'Cig Butts Pos',
            },
            cigButtsRotY: {
              value: p.cigButtsRotY,
              min: -Math.PI,
              max: Math.PI,
              step: 0.05,
              label: 'Cig Butts Rot Y',
            },
            cigButtsScale: {
              value: p.cigButtsScale,
              min: 0.1,
              max: 5,
              step: 0.05,
              label: 'Cig Butts Scale',
            },
            litter1Pos: {
              value: p.litter1Pos,
              step: 0.05,
              label: 'Litter 1 Pos',
            },
            litter1RotY: {
              value: p.litter1RotY,
              min: -Math.PI,
              max: Math.PI,
              step: 0.05,
              label: 'Litter 1 Rot Y',
            },
            litter1Scale: {
              value: p.litter1Scale,
              min: 0.1,
              max: 5,
              step: 0.05,
              label: 'Litter 1 Scale',
            },
            litter2Pos: {
              value: p.litter2Pos,
              step: 0.05,
              label: 'Litter 2 Pos',
            },
            litter2RotY: {
              value: p.litter2RotY,
              min: -Math.PI,
              max: Math.PI,
              step: 0.05,
              label: 'Litter 2 Rot Y',
            },
            litter2Scale: {
              value: p.litter2Scale,
              min: 0.1,
              max: 5,
              step: 0.05,
              label: 'Litter 2 Scale',
            },
          },
          C
        ),
      },
      C
    ),
    Lighting: folder(
      {
        envBackground: { value: p.envBackground, label: 'City Backdrop' },
        envIntensity: {
          value: p.envIntensity,
          min: 0,
          max: 3,
          step: 0.05,
          label: 'Env Light',
        },
        skyColor: { value: p.skyColor, label: 'Sky / BG' },
        sunColor: { value: p.sunColor, label: 'Sun Color' },
        sunIntensity: {
          value: p.sunIntensity,
          min: 0,
          max: 6,
          step: 0.1,
          label: 'Sun',
        },
        ambientColor: { value: p.ambientColor, label: 'Ambient Color' },
        ambientIntensity: {
          value: p.ambientIntensity,
          min: 0,
          max: 2,
          step: 0.01,
          label: 'Ambient',
        },
        fogColor: { value: p.fogColor, label: 'Fog Color' },
        fogNear: {
          value: p.fogNear,
          min: 1,
          max: 40,
          step: 0.5,
          label: 'Fog Near',
        },
        fogFar: {
          value: p.fogFar,
          min: 10,
          max: 90,
          step: 1,
          label: 'Fog Far',
        },
      },
      C
    ),
    Bloom: folder(
      {
        bloomEnabled: { value: p.bloomEnabled, label: 'Enabled' },
        bloomThreshold: {
          value: p.bloomThreshold,
          min: 0,
          max: 3,
          step: 0.05,
          label: 'Threshold',
        },
        bloomStrength: {
          value: p.bloomStrength,
          min: 0,
          max: 3,
          step: 0.05,
          label: 'Strength',
        },
        bloomRadius: {
          value: p.bloomRadius,
          min: 0,
          max: 1.5,
          step: 0.05,
          label: 'Radius',
        },
      },
      C
    ),
  }));

  attachSetControls(setControls);

  // Rebuild the flat per-bird controls back into the placement array the scene
  // renders. Each bird gets a stable key + a deterministic animation phase so the
  // idle/sweep cycles don't all march in lockstep. Per-slot statics (roll, frozen
  // animation, dead lens) ride along so the scene can apply them.
  const birds = BIRD_SLOTS.map((slot, i) => {
    const pos = controls[posKey(slot)];
    return {
      key: slot.key,
      position: [pos.x, pos.y, pos.z],
      rotation: [0, controls[rotKey(slot)], slot.roll || 0],
      phase: (i * 1.7) % (Math.PI * 2),
      animate: slot.animate, // undefined => use the global Animate toggle
      still: slot.still || false, // true => no camera-head sweep
    };
  });

  // Snapshot (what the "copy" button emits) matches the preset 1:1 — flat keys,
  // no reshaping.
  useEffect(() => {
    controlsSnapshotRef.current = { ...controls };
  }, [controls, controlsSnapshotRef]);

  // buildCamera(controls) returns a NEW object on every control edit, and useSceneCamera
  // re-applies the orbit frame whenever that object's identity changes — which snaps the
  // user's orbited view back to default on ANY tweak (LED, lighting, etc.). Stabilize it
  // by value: only hand out a new camera object when the camera config actually changes.
  const builtCamera = buildCamera(controls);
  const cameraKey = JSON.stringify(builtCamera);
  const cameraRef = useRef(builtCamera);
  const cameraKeyRef = useRef(cameraKey);
  if (cameraKey !== cameraKeyRef.current) {
    cameraKeyRef.current = cameraKey;
    cameraRef.current = builtCamera;
  }

  return { ...controls, birds, camera: cameraRef.current };
}
