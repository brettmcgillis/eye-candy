import { button, folder, useControls } from 'leva';

import { useMemo } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import { useSceneCameraControls } from '../../../../../../modules/cameraRig';
import PRESETS from '../presets/presets';

function isMobileDevice() {
  return /iP(hone|ad|od)|Android/.test(navigator.userAgent);
}

const DEFAULT_PRESET = 'Default';
const SCENE_LABEL = 'HorsesForCourses';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;

// Horse geometry is normalized to 2 units height; center is around Y=1.
const HORSE_TARGET = [0, 2, 0];
const HORSE_SPLINE_POINTS = [
  { position: [0, 2.5, 6] },
  { position: [4.5, 2, 3.5] },
  { position: [5.5, 1.5, 0] },
  { position: [4, 3, -4] },
  { position: [0, 3.5, -5.5] },
  { position: [-4.5, 2.5, -3.5] },
  { position: [-5.5, 1.5, 0.5] },
  { position: [-3.5, 2, 4.5] },
];

const CAMERA = {
  defaultMode: 'spline',
  spline: {
    desktop: {
      target: HORSE_TARGET,
      fov: 42,
    },
    mobile: {
      target: HORSE_TARGET,
      fov: 74,
    },
    position: [0, 2, 0],
    scale: [1, 2, 1],
    closed: true,
    duration: 32,
    orientationMode: 'target',
    showPath: false,
    tension: 0.45,
    preset: 'Paddock Loop',
    paths: {
      'Paddock Loop': {
        points: HORSE_SPLINE_POINTS,
      },
    },
  },
  orbit: {
    desktop: {
      position: [0, 1, 5],
      target: HORSE_TARGET,
      pivot: HORSE_TARGET,
      fov: 38,
    },
  },
  fixed: {
    behavior: 'single',
    activeShot: 'hero',
    shots: {
      hero: {
        desktop: {
          position: [2.5, 1.8, 4],
          target: HORSE_TARGET,
          fov: 38,
        },
      },
      low: {
        desktop: {
          position: [0, 0.3, 3.5],
          target: HORSE_TARGET,
          fov: 50,
        },
      },
      top: {
        desktop: {
          position: [0, 4, 1.5],
          target: HORSE_TARGET,
          fov: 50,
        },
      },
    },
  },
};

function triggerFileUpload(onFile) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'audio/*';
  input.onchange = (e) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };
  input.click();
}

function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}

export default function useSceneControls({ onConnectFile } = {}) {
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

  const p = PRESETS[initialPreset] || PRESETS[DEFAULT_PRESET];

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

    Audio: folder(
      {
        audioSource: {
          value: 'mic',
          options: isMobileDevice()
            ? { Microphone: 'mic' }
            : { Microphone: 'mic', 'System Audio (Spotify / YT)': 'system' },
          label: 'Source',
        },
        uploadFile: button(() => triggerFileUpload(onConnectFile), {
          label: 'Upload File...',
        }),
        audioMode: {
          value: p.audioMode,
          options: {
            Slices: 'slices',
            Rust: 'rust',
            'Slices + Rust': 'both',
          },
          label: 'Audio Mode',
        },
      },
      { collapsed: true }
    ),

    Bands: folder(
      {
        bandCount: {
          value: p.bandCount,
          min: 4,
          max: 128,
          step: 1,
          label: 'Band Count',
        },
        sensitivity: {
          value: p.sensitivity,
          min: 0,
          max: 1.2,
          step: 0.01,
          label: 'Sensitivity',
        },
        rustAudioDepth: {
          value: p.rustAudioDepth,
          min: 0,
          max: 1.5,
          step: 0.01,
          label: 'Rust Depth',
        },
      },
      { collapsed: true }
    ),

    Material: folder(
      {
        metalness: {
          value: p.metalness,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Metalness',
        },
        roughness: {
          value: p.roughness,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Roughness',
        },
        rustAmount: {
          value: p.rustAmount,
          min: -0.8,
          max: 0.8,
          step: 0.01,
          label: 'Rust Amount',
        },
        rustScale: {
          value: p.rustScale,
          min: 0.5,
          max: 8,
          step: 0.1,
          label: 'Rust Scale',
        },
        baseColor: { value: p.baseColor, label: 'Base Color' },
        patinaColor: { value: p.patinaColor, label: 'Patina Color' },
        Noise: folder(
          {
            rustIterations: {
              value: p.rustIterations,
              min: 1,
              max: 12,
              step: 1,
              label: 'Iterations',
            },
            rustNoise: {
              value: p.rustNoise,
              min: 0,
              max: 1,
              step: 0.01,
              label: 'Noise',
            },
            rustNoiseScale: {
              value: p.rustNoiseScale,
              min: 0.1,
              max: 2,
              step: 0.01,
              label: 'Noise Scale',
            },
            rustSeed: {
              value: p.rustSeed,
              min: 0,
              max: 100,
              step: 1,
              label: 'Seed',
            },
          },
          { collapsed: true }
        ),
        'Cut Faces': folder(
          {
            innerMetalness: {
              value: p.innerMetalness,
              min: 0,
              max: 1,
              step: 0.01,
              label: 'Metalness',
            },
            innerRoughness: {
              value: p.innerRoughness,
              min: 0,
              max: 1,
              step: 0.01,
              label: 'Roughness',
            },
            innerRustAmount: {
              value: p.innerRustAmount,
              min: -0.8,
              max: 0.8,
              step: 0.01,
              label: 'Rust Amount',
            },
            innerRustScale: {
              value: p.innerRustScale,
              min: 0.5,
              max: 8,
              step: 0.1,
              label: 'Rust Scale',
            },
            innerColor: { value: p.innerColor, label: 'Color' },
            'Cut Noise': folder(
              {
                innerIterations: {
                  value: p.innerIterations,
                  min: 1,
                  max: 12,
                  step: 1,
                  label: 'Iterations',
                },
                innerNoise: {
                  value: p.innerNoise,
                  min: 0,
                  max: 1,
                  step: 0.01,
                  label: 'Noise',
                },
                innerNoiseScale: {
                  value: p.innerNoiseScale,
                  min: 0.1,
                  max: 2,
                  step: 0.01,
                  label: 'Noise Scale',
                },
                innerSeed: {
                  value: p.innerSeed,
                  min: 0,
                  max: 100,
                  step: 1,
                  label: 'Seed',
                },
              },
              { collapsed: true }
            ),
          },
          { collapsed: true }
        ),
      },
      { collapsed: true }
    ),

    Lighting: folder(
      {
        ambientIntensity: {
          value: p.ambientIntensity,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Ambient',
        },
        keyIntensity: {
          value: p.keyIntensity,
          min: 0,
          max: 20,
          step: 0.1,
          label: 'Key',
        },
        keyColor: { value: p.keyColor, label: 'Key Color' },
        rimIntensity: {
          value: p.rimIntensity,
          min: 0,
          max: 10,
          step: 0.1,
          label: 'Rim',
        },
        rimColor: { value: p.rimColor, label: 'Rim Color' },
        fillIntensity: {
          value: p.fillIntensity,
          min: 0,
          max: 5,
          step: 0.1,
          label: 'Fill',
        },
        fillColor: { value: p.fillColor, label: 'Fill Color' },
      },
      { collapsed: true }
    ),

    Bloom: folder(
      {
        bloomEnabled: { value: p.bloomEnabled, label: 'Enabled' },
        bloomStrength: {
          value: p.bloomStrength,
          min: 0,
          max: 3,
          step: 0.05,
          label: 'Strength',
        },
        bloomThreshold: {
          value: p.bloomThreshold,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Threshold',
        },
        bloomRadius: {
          value: p.bloomRadius,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Radius',
        },
      },
      { collapsed: true }
    ),

    Godrays: folder(
      {
        godraysEnabled: { value: p.godraysEnabled ?? true, label: 'Enabled' },
        godraysBlendColor: {
          value: p.godraysBlendColor ?? '#ffffff',
          label: 'Color',
        },
        godraysDensity: {
          value: p.godraysDensity ?? 1.2,
          min: 0,
          max: 2,
          step: 0.01,
          label: 'Density',
        },
        godraysMaxDensity: {
          value: p.godraysMaxDensity ?? 0.9,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Max Density',
        },
        godraysDistanceAttenuation: {
          value: p.godraysDistanceAttenuation ?? 1,
          min: 0,
          max: 5,
          step: 0.1,
          label: 'Distance Atten.',
        },
        godraysBlur: { value: p.godraysBlur ?? true, label: 'Blur' },
        godraysEdgeRadius: {
          value: p.godraysEdgeRadius ?? 2,
          min: 0,
          max: 5,
          step: 1,
          label: 'Edge Radius',
        },
        godraysEdgeStrength: {
          value: p.godraysEdgeStrength ?? 2,
          min: 0,
          max: 5,
          step: 0.1,
          label: 'Edge Strength',
        },
      },
      { collapsed: true }
    ),
  }));

  attachSetControls(setControls);

  const camera = useMemo(() => buildCamera(controls), [buildCamera, controls]);

  return { ...controls, camera };
}
