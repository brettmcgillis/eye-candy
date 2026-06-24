import { folder, useControls } from 'leva';

import { useEffect, useMemo } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import useSceneCameraControls from '../../../../../../hooks/useSceneCameraControls';
import PRESETS, {
  DEFAULT_PRESET,
  DEFAULT_PRESET_VALUES,
} from '../presets/presets';

const SCENE_LABEL = 'Prayer';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;

const CAMERA = {
  defaultMode: 'orbit',
  orbit: {
    desktop: {
      position: [0, 1.35, 4.8],
      target: [0, 1.2, 0],
      pivot: [0, 1.2, 0],
      fov: 38,
    },
    mobile: {
      position: [0, 1.45, 6.2],
      target: [0, 1.2, 0],
      pivot: [0, 1.2, 0],
      fov: 52,
    },
  },
  fixed: {
    behavior: 'single',
    activeShot: 'hero',
    shots: {
      hero: {
        desktop: {
          position: [1.7, 2.15, 4.1],
          target: [0, 1.05, 0],
          fov: 40,
        },
      },
    },
  },
};

function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}

function materialFolder(prefix, label, p) {
  return folder(
    {
      [`${prefix}BaseColor`]: { label: 'Base', value: p[`${prefix}BaseColor`] },
      [`${prefix}AccentColor`]: {
        label: 'Accent',
        value: p[`${prefix}AccentColor`],
      },
      [`${prefix}Amount`]: {
        label: 'Amount',
        value: p[`${prefix}Amount`],
        min: -1,
        max: 1,
        step: 0.01,
      },
      [`${prefix}Scale`]: {
        label: 'Scale',
        value: p[`${prefix}Scale`],
        min: 0.1,
        max: 12,
        step: 0.1,
      },
      [`${prefix}Iterations`]: {
        label: 'Iterations',
        value: p[`${prefix}Iterations`],
        min: 1,
        max: 12,
        step: 1,
      },
      [`${prefix}Noise`]: {
        label: 'Noise',
        value: p[`${prefix}Noise`],
        min: 0,
        max: 1,
        step: 0.01,
      },
      [`${prefix}NoiseScale`]: {
        label: 'Noise Scale',
        value: p[`${prefix}NoiseScale`],
        min: 0.1,
        max: 2,
        step: 0.01,
      },
      [`${prefix}Seed`]: {
        label: 'Seed',
        value: p[`${prefix}Seed`],
        min: 0,
        max: 100,
        step: 1,
      },
      [`${prefix}Metalness`]: {
        label: 'Metalness',
        value: p[`${prefix}Metalness`],
        min: 0,
        max: 1,
        step: 0.01,
      },
      [`${prefix}Roughness`]: {
        label: 'Roughness',
        value: p[`${prefix}Roughness`],
        min: 0,
        max: 1,
        step: 0.01,
      },
    },
    { collapsed: true, label }
  );
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

  const p = PRESETS[initialPreset] || DEFAULT_PRESET_VALUES;

  const { buildCamera, cameraControls } = useSceneCameraControls({
    camera: CAMERA,
    cameraFolderPath: CAMERA_FOLDER_PATH,
    controlsSnapshotRef,
  });

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),

    Scene: folder(
      {
        bgColor: { value: p.bgColor, label: 'Background' },
      },
      { collapsed: true }
    ),

    Form: folder(
      {
        baseScale: {
          value: p.baseScale,
          min: 0.2,
          max: 4,
          step: 0.01,
          label: 'Inner Scale',
        },
        middleScale: {
          value: p.middleScale,
          min: 0.2,
          max: 5,
          step: 0.01,
          label: 'Middle Scale',
        },
        outerScale: {
          value: p.outerScale,
          min: 0.2,
          max: 6,
          step: 0.01,
          label: 'Outer Scale',
        },
        basePosition: {
          value: p.basePosition,
          step: 0.01,
          label: 'Inner Position',
        },
        middlePosition: {
          value: p.middlePosition,
          step: 0.01,
          label: 'Middle Position',
        },
        outerPosition: {
          value: p.outerPosition,
          step: 0.01,
          label: 'Outer Position',
        },
        middleSpread: {
          value: p.middleSpread,
          min: 0,
          max: 50,
          step: 0.01,
          label: 'Middle Spread',
        },
        outerSpread: {
          value: p.outerSpread,
          min: 0,
          max: 60,
          step: 0.01,
          label: 'Outer Spread',
        },
        middleYaw: {
          value: p.middleYaw,
          min: -Math.PI,
          max: Math.PI,
          step: 0.01,
          label: 'Middle Yaw',
        },
        outerYaw: {
          value: p.outerYaw,
          min: -Math.PI,
          max: Math.PI,
          step: 0.01,
          label: 'Outer Yaw',
        },
      },
      { collapsed: true }
    ),

    Lighting: folder(
      {
        ambientColor: { value: p.ambientColor, label: 'Ambient Color' },
        ambientIntensity: {
          value: p.ambientIntensity,
          min: 0,
          max: 5,
          step: 0.01,
          label: 'Ambient Intensity',
        },
        keyColor: { value: p.keyColor, label: 'Key Color' },
        keyIntensity: {
          value: p.keyIntensity,
          min: 0,
          max: 20,
          step: 0.05,
          label: 'Key Intensity',
        },
        keyPosition: {
          value: p.keyPosition,
          step: 0.01,
          label: 'Key Position',
        },
        fillColor: { value: p.fillColor, label: 'Fill Color' },
        fillIntensity: {
          value: p.fillIntensity,
          min: 0,
          max: 12,
          step: 0.05,
          label: 'Fill Intensity',
        },
        fillPosition: {
          value: p.fillPosition,
          step: 0.01,
          label: 'Fill Position',
        },
        godraysColor: { value: p.godraysColor, label: 'Rays Light Color' },
        godraysIntensity: {
          value: p.godraysIntensity,
          min: 0,
          max: 30,
          step: 0.1,
          label: 'Rays Light Intensity',
        },
        godraysPosition: {
          value: p.godraysPosition,
          step: 0.01,
          label: 'Rays Light Position',
        },
      },
      { collapsed: true }
    ),

    Materials: folder(
      {
        Clean: materialFolder('clean', 'Clean', p),
        Oil: materialFolder('oil', 'Oil', p),
        Blood: materialFolder('blood', 'Blood', p),
      },
      { collapsed: true }
    ),

    Godrays: folder(
      {
        godraysEnabled: { value: p.godraysEnabled, label: 'Enabled' },
        godraysBlendColor: { value: p.godraysBlendColor, label: 'Blend Color' },
        godraysDensity: {
          value: p.godraysDensity,
          min: 0,
          max: 4,
          step: 0.01,
          label: 'Density',
        },
        godraysMaxDensity: {
          value: p.godraysMaxDensity,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Max Density',
        },
        godraysDistanceAttenuation: {
          value: p.godraysDistanceAttenuation,
          min: 0,
          max: 3,
          step: 0.01,
          label: 'Distance Attenuation',
        },
        godraysBlur: { value: p.godraysBlur, label: 'Blur' },
        godraysEdgeRadius: {
          value: p.godraysEdgeRadius,
          min: 1,
          max: 8,
          step: 1,
          label: 'Edge Radius',
        },
        godraysEdgeStrength: {
          value: p.godraysEdgeStrength,
          min: 0,
          max: 8,
          step: 0.1,
          label: 'Edge Strength',
        },
      },
      { collapsed: true }
    ),

    Bloom: folder(
      {
        bloomEnabled: { value: p.bloomEnabled, label: 'Enabled' },
        bloomStrength: {
          value: p.bloomStrength,
          min: 0,
          max: 2,
          step: 0.01,
          label: 'Strength',
        },
        bloomThreshold: {
          value: p.bloomThreshold,
          min: 0,
          max: 2,
          step: 0.01,
          label: 'Threshold',
        },
        bloomRadius: {
          value: p.bloomRadius,
          min: 0,
          max: 2,
          step: 0.01,
          label: 'Radius',
        },
      },
      { collapsed: true }
    ),
  }));

  useEffect(() => {
    attachSetControls(setControls);
  }, [attachSetControls, setControls]);

  useEffect(() => {
    controlsSnapshotRef.current = controls;
  }, [controls, controlsSnapshotRef]);

  const cameraControlsKey = useMemo(() => {
    return JSON.stringify(
      Object.fromEntries(
        Object.entries(controls).filter(([key]) => {
          return (
            key === 'preset' ||
            key.startsWith('camera') ||
            key.startsWith('orbit') ||
            key.startsWith('fixed') ||
            key.startsWith('spline') ||
            key.startsWith('operator')
          );
        })
      )
    );
  }, [controls]);

  const camera = useMemo(() => {
    return buildCamera(controls);
  }, [buildCamera, cameraControlsKey]);

  return useMemo(() => {
    return {
      ...controls,
      camera,
    };
  }, [camera, controls]);
}
