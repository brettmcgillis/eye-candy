import { folder, useControls } from 'leva';

import { useMemo } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import useSceneCameraControls from '../../../../../../hooks/useSceneCameraControls';
import PRESETS, {
  DEFAULT_PRESET as DEFAULT_PRESET_KEY,
} from '../presets/presets';
import CAMERA from '../utils/camera';
import RACOON_CLIPS from '../utils/raccoonClips';

const SCENE_LABEL = 'Urban Wildlife';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;

const C = { collapsed: true };
const HAND_OPTIONS = { Right: 'right', Left: 'left' };

function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}

// One folder per raccoon. `idx` namespaces every key (r1*, r2*, r3*) so the three
// raccoons stay independent while sharing the same control layout.
function raccoonFolder(p, idx) {
  const k = (suffix) => `r${idx}${suffix}`;
  return folder(
    {
      [k('Pose')]: {
        value: p[k('Pose')],
        options: RACOON_CLIPS,
        label: 'Pose',
      },
      [k('X')]: { value: p[k('X')], min: -5, max: 5, step: 0.05, label: 'X' },
      [k('Z')]: { value: p[k('Z')], min: -5, max: 5, step: 0.05, label: 'Z' },
      [k('RotY')]: {
        value: p[k('RotY')],
        min: -Math.PI,
        max: Math.PI,
        step: 0.05,
        label: 'Rotate Y',
      },
      [k('Scale')]: {
        value: p[k('Scale')],
        min: 0.3,
        max: 2.5,
        step: 0.05,
        label: 'Scale',
      },
      [k('HoldsGun')]: { value: p[k('HoldsGun')], label: 'Holds Gun' },
      [k('GunHand')]: {
        value: p[k('GunHand')],
        options: HAND_OPTIONS,
        label: 'Gun Hand',
      },
    },
    C
  );
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

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, C),
    Streetlight: folder(
      {
        streetlightX: {
          value: p.streetlightX,
          min: -5,
          max: 5,
          step: 0.1,
          label: 'X',
        },
        streetlightZ: {
          value: p.streetlightZ,
          min: -5,
          max: 5,
          step: 0.1,
          label: 'Z',
        },
        streetlightScale: {
          value: p.streetlightScale,
          min: 1,
          max: 6,
          step: 0.1,
          label: 'Scale',
        },
        showBase: { value: p.showBase, label: 'Show Base' },
        glassColor: { value: p.glassColor, label: 'Glass Color' },
        glassEmissive: {
          value: p.glassEmissive,
          min: 0,
          max: 20,
          step: 0.25,
          label: 'Glass Glow',
        },
      },
      C
    ),
    Lamp: folder(
      {
        lampColor: { value: p.lampColor, label: 'Color' },
        lampIntensity: {
          value: p.lampIntensity,
          min: 0,
          max: 40,
          step: 0.5,
          label: 'Intensity',
        },
        lampHeight: {
          value: p.lampHeight,
          min: 1,
          max: 8,
          step: 0.1,
          label: 'Height',
        },
        lampDistance: {
          value: p.lampDistance,
          min: 2,
          max: 40,
          step: 0.5,
          label: 'Distance',
        },
        lampDecay: {
          value: p.lampDecay,
          min: 0.5,
          max: 3,
          step: 0.05,
          label: 'Decay',
        },
        lampFlicker: {
          value: p.lampFlicker,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Flicker',
        },
      },
      C
    ),
    Raccoons: folder(
      {
        animatePoses: { value: p.animatePoses, label: 'Animate Poses' },
        'Raccoon 1': raccoonFolder(p, 1),
        'Raccoon 2': raccoonFolder(p, 2),
        'Raccoon 3': raccoonFolder(p, 3),
      },
      C
    ),
    Gun: folder(
      {
        gunScale: {
          value: p.gunScale,
          min: 0.1,
          max: 4,
          step: 0.05,
          label: 'Scale',
        },
        gunPosX: {
          value: p.gunPosX,
          min: -0.5,
          max: 0.5,
          step: 0.005,
          label: 'Pos X',
        },
        gunPosY: {
          value: p.gunPosY,
          min: -0.5,
          max: 0.5,
          step: 0.005,
          label: 'Pos Y',
        },
        gunPosZ: {
          value: p.gunPosZ,
          min: -0.5,
          max: 0.5,
          step: 0.005,
          label: 'Pos Z',
        },
        gunRotX: {
          value: p.gunRotX,
          min: -Math.PI,
          max: Math.PI,
          step: 0.05,
          label: 'Rot X',
        },
        gunRotY: {
          value: p.gunRotY,
          min: -Math.PI,
          max: Math.PI,
          step: 0.05,
          label: 'Rot Y',
        },
        gunRotZ: {
          value: p.gunRotZ,
          min: -Math.PI,
          max: Math.PI,
          step: 0.05,
          label: 'Rot Z',
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
        rippleScale: {
          value: p.rippleScale,
          min: 1,
          max: 20,
          step: 0.5,
          label: 'Ripple Scale',
        },
        rippleStrength: {
          value: p.rippleStrength,
          min: 0,
          max: 0.15,
          step: 0.001,
          label: 'Ripple Strength',
        },
        rippleSpeed: {
          value: p.rippleSpeed,
          min: 0,
          max: 4,
          step: 0.05,
          label: 'Ripple Speed',
        },
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
    Trash: folder(
      {
        showTrash: { value: p.showTrash, label: 'Show Trash' },
      },
      C
    ),
    Lighting: folder(
      {
        ambientIntensity: {
          value: p.ambientIntensity,
          min: 0,
          max: 2,
          step: 0.01,
          label: 'Ambient',
        },
        ambientColor: { value: p.ambientColor, label: 'Ambient Color' },
        moonIntensity: {
          value: p.moonIntensity,
          min: 0,
          max: 3,
          step: 0.01,
          label: 'Moon',
        },
        moonColor: { value: p.moonColor, label: 'Moon Color' },
        bgColor: { value: p.bgColor, label: 'Background' },
        fogColor: { value: p.fogColor, label: 'Fog Color' },
        fogNear: {
          value: p.fogNear,
          min: 1,
          max: 30,
          step: 0.5,
          label: 'Fog Near',
        },
        fogFar: {
          value: p.fogFar,
          min: 5,
          max: 50,
          step: 0.5,
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

  const camera = useMemo(() => buildCamera(controls), [buildCamera, controls]);

  return { ...controls, camera };
}
