import { folder, useControls } from 'leva';

import { useEffect, useRef } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import useSceneCameraControls from '../../../../../../hooks/useSceneCameraControls';
import PRESETS, {
  DEFAULT_PRESET as DEFAULT_PRESET_KEY,
} from '../presets/presets';
import { BIRD_OPTIONS } from '../utils/birds';
import CAMERA from '../utils/camera';
import BIRD_SLOTS, { posKey, rotKey, showKey } from '../utils/placements';

const SCENE_LABEL = 'Birds Arent Real';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;

const C = { collapsed: true };
const BEHAVIOR_OPTIONS = {
  'Idle (look around)': 'idle',
  'Wander/roam': 'wander',
};
const VIEW_MODE_OPTIONS = {
  'Orbit (free)': 'orbit',
  'Bird POV (CCTV feed)': 'pov',
  'Cursor Follow': 'cursor',
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

  // Populated by CameraRig (apiRef) with copyCurrentCameraConfig — this is what makes
  // the Camera folder's "Copy Current Camera" button appear and work.
  const cameraApiRef = useRef(null);

  const { buildCamera, cameraControls } = useSceneCameraControls({
    apiRef: cameraApiRef,
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
        [showKey(slot)]: { value: p[showKey(slot)], label: 'Visible' },
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
    View: folder(
      {
        viewMode: {
          value: p.viewMode,
          options: VIEW_MODE_OPTIONS,
          label: 'Mode',
        },
        povShotDuration: {
          value: p.povShotDuration,
          min: 1,
          max: 15,
          step: 0.5,
          label: 'POV Shot (s)',
        },
        povFov: {
          value: p.povFov,
          min: 30,
          max: 100,
          step: 1,
          label: 'POV FOV',
        },
        povDolly: {
          value: p.povDolly,
          min: -0.2,
          max: 0.4,
          step: 0.005,
          label: 'POV Dolly',
        },
      },
      C
    ),
    Camera: folder(cameraControls, C),
    World: folder(
      {
        Lighting: folder(
          {
            envIntensity: {
              value: p.envIntensity,
              min: 0,
              max: 3,
              step: 0.05,
              label: 'Env Light',
            },
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
          },
          C
        ),
        'Sky / Backdrop': folder(
          {
            envBackground: { value: p.envBackground, label: 'City Backdrop' },
            skyColor: { value: p.skyColor, label: 'Sky / BG' },
          },
          C
        ),
        Fog: folder(
          {
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
              max: 120,
              step: 1,
              label: 'Fog Far',
            },
          },
          C
        ),
        Ground: folder(
          {
            showGround: { value: p.showGround, label: 'Show Ground' },
            groundSize: {
              value: p.groundSize,
              min: 20,
              max: 160,
              step: 5,
              label: 'Floor Size',
            },
            asphaltColor: { value: p.asphaltColor, label: 'Asphalt Tint' },
            texScale: {
              value: p.texScale,
              min: 0.05,
              max: 1,
              step: 0.01,
              label: 'Asphalt Tile',
            },
            roughDry: {
              value: p.roughDry,
              min: 0,
              max: 1,
              step: 0.01,
              label: 'Roughness Dry',
            },
            Puddles: folder(
              {
                puddleColor: { value: p.puddleColor, label: 'Puddle' },
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
          },
          C
        ),
      },
      C
    ),
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
        Placements: folder(birdControls, C),
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
            'QR Sticker': folder(
              {
                eggQrShow: { value: p.eggQrShow, label: 'Show' },
                eggQrScale: {
                  value: p.eggQrScale,
                  min: 0.05,
                  max: 0.6,
                  step: 0.005,
                  label: 'Size',
                },
                eggQrU: {
                  value: p.eggQrU,
                  min: -0.3,
                  max: 0.3,
                  step: 0.005,
                  label: 'Slide Z',
                },
                eggQrV: {
                  value: p.eggQrV,
                  min: -0.3,
                  max: 0.3,
                  step: 0.005,
                  label: 'Slide Y',
                },
                eggQrSpin: {
                  value: p.eggQrSpin,
                  min: -Math.PI,
                  max: Math.PI,
                  step: 0.05,
                  label: 'Spin',
                },
              },
              C
            ),
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
    Ads: folder(
      {
        Art: folder(
          {
            adArtScaleX: {
              value: p.adArtScaleX,
              min: 0.1,
              max: 1.5,
              step: 0.01,
              label: 'Width',
            },
            adArtScaleY: {
              value: p.adArtScaleY,
              min: 0.1,
              max: 1.5,
              step: 0.01,
              label: 'Height',
            },
            adArtOffsetX: {
              value: p.adArtOffsetX,
              min: -0.5,
              max: 0.5,
              step: 0.005,
              label: 'Offset X',
            },
            adArtOffsetY: {
              value: p.adArtOffsetY,
              min: -0.5,
              max: 0.5,
              step: 0.005,
              label: 'Offset Y',
            },
            adArtBg: { value: p.adArtBg, label: 'Frame Color' },
          },
          C
        ),
        Glitch: folder(
          {
            adGlitchTile: {
              value: p.adGlitchTile,
              min: 1,
              max: 8,
              step: 1,
              label: 'Tile Rows',
            },
            adGlitchWidth: {
              value: p.adGlitchWidth,
              min: 0.1,
              max: 1,
              step: 0.01,
              label: 'Text Width',
            },
            adGlitchHeight: {
              value: p.adGlitchHeight,
              min: 0.1,
              max: 1,
              step: 0.01,
              label: 'Text Height',
            },
            adGlitchMinGap: {
              value: p.adGlitchMinGap,
              min: 0.5,
              max: 20,
              step: 0.5,
              label: 'Art Min (s)',
            },
            adGlitchMaxGap: {
              value: p.adGlitchMaxGap,
              min: 0.5,
              max: 30,
              step: 0.5,
              label: 'Art Max (s)',
            },
            adGlitchDuration: {
              value: p.adGlitchDuration,
              min: 0.05,
              max: 3,
              step: 0.05,
              label: 'Duration (s)',
            },
            adGlitchStutter: {
              value: p.adGlitchStutter,
              min: 0,
              max: 1,
              step: 0.01,
              label: 'Stutter',
            },
          },
          C
        ),
      },
      C
    ),
    'Post FX': folder(
      {
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
        Surveillance: folder(
          {
            hudOpacity: {
              value: p.hudOpacity,
              min: 0,
              max: 1,
              step: 0.01,
              label: 'HUD Opacity',
            },
            scanlineIntensity: {
              value: p.scanlineIntensity,
              min: 0,
              max: 1,
              step: 0.01,
              label: 'Scanlines',
            },
            vignetteIntensity: {
              value: p.vignetteIntensity,
              min: 0,
              max: 1,
              step: 0.01,
              label: 'Vignette',
            },
            chromaticStrength: {
              value: p.chromaticStrength,
              min: 0,
              max: 0.01,
              step: 0.0005,
              label: 'Chromatic',
            },
          },
          C
        ),
      },
      C
    ),
  }));

  attachSetControls(setControls);

  // One stable "BIRD {ip}" id per bird, minted once at scene load — a random IPv4 so
  // each POV shot reads like a distinct networked surveillance feed.
  const camIdsRef = useRef(null);
  if (!camIdsRef.current) {
    const octet = () => Math.floor(Math.random() * 254) + 1;
    camIdsRef.current = BIRD_SLOTS.reduce((acc, slot) => {
      acc[slot.key] = `BIRD ${octet()}.${octet()}.${octet()}.${octet()}`;
      return acc;
    }, {});
  }

  // Rebuild the flat per-bird controls back into the placement array the scene
  // renders. Each bird gets a stable key + a deterministic animation phase so the
  // idle/sweep cycles don't all march in lockstep. Per-slot statics (roll, frozen
  // animation, dead lens) ride along so the scene can apply them.
  const birds = BIRD_SLOTS.map((slot, i) => {
    const pos = controls[posKey(slot)];
    return {
      key: slot.key,
      camId: camIdsRef.current[slot.key],
      position: [pos.x, pos.y, pos.z],
      rotation: [0, controls[rotKey(slot)], slot.roll || 0],
      phase: (i * 1.7) % (Math.PI * 2),
      animate: slot.animate, // undefined => use the global Animate toggle
      still: slot.still || false, // true => no camera-head sweep
      show: controls[showKey(slot)] !== false, // per-bird visibility toggle
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

  return { ...controls, birds, camera: cameraRef.current, cameraApiRef };
}
