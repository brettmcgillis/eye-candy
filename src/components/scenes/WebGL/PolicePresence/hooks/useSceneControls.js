import { useEffect } from 'react';

import { folder, useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';

import {
  CINDERBLOCK_CONFIGS,
  DEFAULT_PRESET,
  FIRE_INSTANCE_CONFIGS,
  PRESETS,
} from '../presets';

const BLEND_MODE_OPTIONS = ['Normal', 'Additive', 'Subtractive', 'Multiply'];

function cloneSnapshot(snapshot) {
  return JSON.parse(JSON.stringify(snapshot));
}

function getPresetControls({ currentControls, presetName, presetSnapshot }) {
  return {
    ...currentControls,
    ...presetSnapshot,
    preset: presetName,
  };
}

function buildCinderblockControls(initialPresetSnapshot) {
  return CINDERBLOCK_CONFIGS.reduce((folders, config) => {
    const positionKey = `${config.id}Position`;
    const rotationKey = `${config.id}Rotation`;
    const scaleKey = `${config.id}Scale`;

    return {
      ...folders,
      [config.label]: folder(
        {
          [positionKey]: {
            label: 'Position',
            value: initialPresetSnapshot[positionKey],
          },
          [rotationKey]: {
            label: 'Rotation',
            value: initialPresetSnapshot[rotationKey],
          },
          [scaleKey]: {
            label: 'Scale',
            value: initialPresetSnapshot[scaleKey],
          },
        },
        { collapsed: true }
      ),
    };
  }, {});
}

function buildFireControls(initialPresetSnapshot) {
  return FIRE_INSTANCE_CONFIGS.reduce((folders, config) => {
    const visibilityKey = `${config.id}Visible`;
    const widthKey = `${config.id}Width`;
    const depthKey = `${config.id}Depth`;
    const heightKey = `${config.id}Height`;
    const bendXKey = `${config.id}BendX`;
    const bendZKey = `${config.id}BendZ`;
    const animatedKey = `${config.id}Animated`;
    const animSpeedKey = `${config.id}AnimSpeed`;
    const magnitudeKey = `${config.id}Magnitude`;
    const brightnessKey = `${config.id}Brightness`;

    return {
      ...folders,
      [config.label]: folder(
        {
          [visibilityKey]: {
            label: 'Visible',
            value: initialPresetSnapshot[visibilityKey],
          },
          [widthKey]: {
            label: 'Width',
            value: initialPresetSnapshot[widthKey],
            min: 0.1,
            max: 4,
            step: 0.01,
          },
          [depthKey]: {
            label: 'Depth',
            value: initialPresetSnapshot[depthKey],
            min: 0.1,
            max: 4,
            step: 0.01,
          },
          [heightKey]: {
            label: 'Height',
            value: initialPresetSnapshot[heightKey],
            min: 0.1,
            max: 5,
            step: 0.01,
          },
          [bendXKey]: {
            label: 'Bend X',
            value: initialPresetSnapshot[bendXKey],
            min: -2,
            max: 2,
            step: 0.01,
          },
          [bendZKey]: {
            label: 'Bend Z',
            value: initialPresetSnapshot[bendZKey],
            min: -2,
            max: 2,
            step: 0.01,
          },
          [animatedKey]: {
            label: 'Animated',
            value: initialPresetSnapshot[animatedKey],
          },
          [animSpeedKey]: {
            label: 'Anim Speed',
            value: initialPresetSnapshot[animSpeedKey],
            min: 0,
            max: 4,
            step: 0.01,
          },
          [magnitudeKey]: {
            label: 'Magnitude',
            value: initialPresetSnapshot[magnitudeKey],
            min: 0,
            max: 4,
            step: 0.01,
          },
          [brightnessKey]: {
            label: 'Brightness',
            value: initialPresetSnapshot[brightnessKey],
            min: 0,
            max: 4,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),
    };
  }, {});
}

export default function useSceneControls() {
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

  const initialPresetSnapshot =
    PRESETS[initialPreset] || PRESETS[DEFAULT_PRESET];

  const [controls, setControls] = useControls(
    'Police Presence',
    () => ({
      Presets: presetsFolder,
      Scene: folder(
        {
          backgroundColor: {
            label: 'Background',
            value: initialPresetSnapshot.backgroundColor,
          },
          floorVisible: {
            label: 'Show Floor',
            value: initialPresetSnapshot.floorVisible,
          },
          floorColor: {
            label: 'Floor Color',
            value: initialPresetSnapshot.floorColor,
          },
          floorPosition: {
            label: 'Floor Position',
            value: initialPresetSnapshot.floorPosition,
          },
          floorRotation: {
            label: 'Floor Rotation',
            value: initialPresetSnapshot.floorRotation,
          },
          floorScale: {
            label: 'Floor Scale',
            value: initialPresetSnapshot.floorScale,
          },
          floorRoughness: {
            label: 'Floor Roughness',
            value: initialPresetSnapshot.floorRoughness,
            min: 0,
            max: 1,
            step: 0.01,
          },
          floorMetalness: {
            label: 'Floor Metalness',
            value: initialPresetSnapshot.floorMetalness,
            min: 0,
            max: 1,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),
      Camera: folder(
        {
          cameraPosition: {
            label: 'Position',
            value: initialPresetSnapshot.cameraPosition,
          },
          cameraTarget: {
            label: 'Target',
            value: initialPresetSnapshot.cameraTarget,
          },
          cameraFov: {
            label: 'FOV',
            value: initialPresetSnapshot.cameraFov,
            min: 20,
            max: 90,
            step: 1,
          },
        },
        { collapsed: true }
      ),
      Lighting: folder(
        {
          ambientLightColor: {
            label: 'Ambient Color',
            value: initialPresetSnapshot.ambientLightColor,
          },
          ambientLightIntensity: {
            label: 'Ambient Intensity',
            value: initialPresetSnapshot.ambientLightIntensity,
            min: 0,
            max: 3,
            step: 0.01,
          },
          directionalLightColor: {
            label: 'Directional Color',
            value: initialPresetSnapshot.directionalLightColor,
          },
          directionalLightPosition: {
            label: 'Directional Position',
            value: initialPresetSnapshot.directionalLightPosition,
          },
          directionalLightIntensity: {
            label: 'Directional Intensity',
            value: initialPresetSnapshot.directionalLightIntensity,
            min: 0,
            max: 3,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),
      Vehicle: folder(
        {
          showTires: {
            label: 'Show Tires',
            value: initialPresetSnapshot.showTires,
          },
          showCinderblocks: {
            label: 'Show Cinderblocks',
            value: initialPresetSnapshot.showCinderblocks,
          },
        },
        { collapsed: true }
      ),
      Cinderblocks: folder(buildCinderblockControls(initialPresetSnapshot), {
        collapsed: true,
      }),
      Fire: folder(buildFireControls(initialPresetSnapshot), {
        collapsed: true,
      }),
      Smoke: folder(
        {
          smokeVisible: {
            label: 'Visible',
            value: initialPresetSnapshot.smokeVisible,
          },
          smokeClosed: {
            label: 'Closed',
            value: initialPresetSnapshot.smokeClosed,
          },
          smokeTension: {
            label: 'Tension',
            value: initialPresetSnapshot.smokeTension,
            min: 0,
            max: 1,
            step: 0.01,
          },
          smokePrefillOnStart: {
            label: 'Prefill',
            value: initialPresetSnapshot.smokePrefillOnStart,
          },
          smokeParticleCount: {
            label: 'Particle Count',
            value: initialPresetSnapshot.smokeParticleCount,
            min: 50,
            max: 5000,
            step: 10,
          },
          smokeParticleSize: {
            label: 'Particle Size',
            value: initialPresetSnapshot.smokeParticleSize,
            min: 1,
            max: 200,
            step: 1,
          },
          smokeParticleColor: {
            label: 'Particle Color',
            value: initialPresetSnapshot.smokeParticleColor,
          },
          smokeOpacity: {
            label: 'Opacity',
            value: initialPresetSnapshot.smokeOpacity,
            min: 0,
            max: 1,
            step: 0.01,
          },
          smokeGrowth: {
            label: 'Growth',
            value: initialPresetSnapshot.smokeGrowth,
            min: 0,
            max: 10,
            step: 0.05,
          },
          smokeFadeExponent: {
            label: 'Fade Exp',
            value: initialPresetSnapshot.smokeFadeExponent,
            min: 0,
            max: 5,
            step: 0.01,
          },
          smokeSpringK: {
            label: 'Spring K',
            value: initialPresetSnapshot.smokeSpringK,
            min: 0,
            max: 5,
            step: 0.01,
          },
          smokeFlowSpeed: {
            label: 'Flow Speed',
            value: initialPresetSnapshot.smokeFlowSpeed,
            min: 0,
            max: 1,
            step: 0.01,
          },
          smokeDamping: {
            label: 'Damping',
            value: initialPresetSnapshot.smokeDamping,
            min: 0,
            max: 1,
            step: 0.01,
          },
          smokeTurbulence: {
            label: 'Turbulence',
            value: initialPresetSnapshot.smokeTurbulence,
            min: 0,
            max: 5,
            step: 0.01,
          },
          smokeTurbulenceSpeed: {
            label: 'Turb Speed',
            value: initialPresetSnapshot.smokeTurbulenceSpeed,
            min: 0,
            max: 2,
            step: 0.01,
          },
          smokeBuoyancy: {
            label: 'Buoyancy',
            value: initialPresetSnapshot.smokeBuoyancy,
            min: 0,
            max: 3,
            step: 0.01,
          },
          smokeRotSpeed: {
            label: 'Rot Speed',
            value: initialPresetSnapshot.smokeRotSpeed,
            min: 0,
            max: 3,
            step: 0.01,
          },
          smokeFadeRate: {
            label: 'Fade Rate',
            value: initialPresetSnapshot.smokeFadeRate,
            min: 0,
            max: 10,
            step: 0.05,
          },
          smokeSpawnSpread: {
            label: 'Spawn Spread',
            value: initialPresetSnapshot.smokeSpawnSpread,
            min: 0,
            max: 3,
            step: 0.01,
          },
          smokeMaxDrift: {
            label: 'Max Drift',
            value: initialPresetSnapshot.smokeMaxDrift,
            min: 0,
            max: 10,
            step: 0.05,
          },
          smokeBlendMode: {
            label: 'Blend Mode',
            value: initialPresetSnapshot.smokeBlendMode,
            options: BLEND_MODE_OPTIONS,
          },
        },
        { collapsed: true }
      ),
    }),
    { collapsed: true }
  );

  useEffect(() => {
    attachSetControls(setControls);
  }, [attachSetControls, setControls]);

  useEffect(() => {
    controlsSnapshotRef.current = cloneSnapshot(controls);
  }, [controls, controlsSnapshotRef]);

  return controls;
}
