import { folder, useControls } from 'leva';

import { useEffect } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import PRESETS from '../presets/presets';

const DEFAULT_PRESET = 'Default';
const C = { collapsed: true };

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
    defaultPreset: DEFAULT_PRESET,
    getPresetControls,
    presets: PRESETS,
  });

  const preset = PRESETS[initialPreset] || PRESETS[DEFAULT_PRESET];

  const [controls, setControls] = useControls(
    "Beauty's In The Eye Of The Beheaded",
    () => ({
      Presets: presetsFolder,
      Scene: folder(
        {
          Camera: folder(
            {
              Desktop: folder(
                {
                  desktopCameraFov: {
                    label: 'FOV',
                    value: preset.desktopCameraFov,
                    min: 20,
                    max: 80,
                    step: 1,
                  },
                  desktopCameraPosition: {
                    label: 'Position',
                    value: preset.desktopCameraPosition,
                    step: 0.05,
                  },
                  desktopCameraTarget: {
                    label: 'Target',
                    value: preset.desktopCameraTarget,
                    step: 0.05,
                  },
                },
                C
              ),
              Mobile: folder(
                {
                  mobileCameraFov: {
                    label: 'FOV',
                    value: preset.mobileCameraFov,
                    min: 20,
                    max: 80,
                    step: 1,
                  },
                  mobileCameraPosition: {
                    label: 'Position',
                    value: preset.mobileCameraPosition,
                    step: 0.05,
                  },
                  mobileCameraTarget: {
                    label: 'Target',
                    value: preset.mobileCameraTarget,
                    step: 0.05,
                  },
                },
                C
              ),
            },
            C
          ),
          Lighting: folder(
            {
              Ambient: folder(
                {
                  ambientIntensity: {
                    label: 'Intensity',
                    value: preset.ambientIntensity,
                    min: 0,
                    max: 1,
                    step: 0.01,
                  },
                  ambientColor: {
                    label: 'Color',
                    value: preset.ambientColor,
                  },
                  ambientDebug: {
                    label: 'Debug',
                    value: preset.ambientDebug,
                  },
                },
                C
              ),
              Key: folder(
                {
                  keyIntensity: {
                    label: 'Intensity',
                    value: preset.keyIntensity,
                    min: 0,
                    max: 2,
                    step: 0.01,
                  },
                  keyColor: { label: 'Color', value: preset.keyColor },
                  keyPosition: {
                    label: 'Position',
                    value: preset.keyPosition,
                    step: 0.05,
                  },
                  keyTarget: {
                    label: 'Target',
                    value: preset.keyTarget,
                    step: 0.05,
                  },
                  keyDebug: {
                    label: 'Debug',
                    value: preset.keyDebug,
                  },
                },
                C
              ),
              'Floor Fill': folder(
                {
                  floorFillIntensity: {
                    label: 'Intensity',
                    value: preset.floorFillIntensity,
                    min: 0,
                    max: 2,
                    step: 0.01,
                  },
                  floorFillColor: {
                    label: 'Color',
                    value: preset.floorFillColor,
                  },
                  floorFillPosition: {
                    label: 'Position',
                    value: preset.floorFillPosition,
                    step: 0.05,
                  },
                  floorFillTarget: {
                    label: 'Target',
                    value: preset.floorFillTarget,
                    step: 0.05,
                  },
                  floorFillDebug: {
                    label: 'Debug',
                    value: preset.floorFillDebug,
                  },
                },
                C
              ),
              Spot: folder(
                {
                  spotIntensity: {
                    label: 'Intensity',
                    value: preset.spotIntensity,
                    min: 0,
                    max: 2,
                    step: 0.01,
                  },
                  spotColor: { label: 'Color', value: preset.spotColor },
                  spotPosition: {
                    label: 'Position',
                    value: preset.spotPosition,
                    step: 0.05,
                  },
                  spotTarget: {
                    label: 'Target',
                    value: preset.spotTarget,
                    step: 0.05,
                  },
                  spotAngle: {
                    label: 'Angle',
                    value: preset.spotAngle,
                    min: 5,
                    max: 60,
                    step: 1,
                  },
                  spotPenumbra: {
                    label: 'Penumbra',
                    value: preset.spotPenumbra,
                    min: 0,
                    max: 1,
                    step: 0.01,
                  },
                  spotDecay: {
                    label: 'Decay',
                    value: preset.spotDecay,
                    min: 1,
                    max: 2,
                    step: 0.01,
                  },
                  spotDistance: {
                    label: 'Distance',
                    value: preset.spotDistance,
                    min: 0,
                    max: 20,
                    step: 0.25,
                  },
                  spotDebug: {
                    label: 'Debug',
                    value: preset.spotDebug,
                  },
                },
                C
              ),
              Projector: folder(
                {
                  projectorColor: {
                    label: 'Color',
                    value: preset.projectorColor,
                  },
                  projectorIntensity: {
                    label: 'Intensity',
                    value: preset.projectorIntensity,
                    min: 0,
                    max: 300,
                    step: 1,
                  },
                  projectorPosition: {
                    label: 'Position',
                    value: preset.projectorPosition,
                    step: 0.05,
                  },
                  projectorTarget: {
                    label: 'Target',
                    value: preset.projectorTarget,
                    step: 0.05,
                  },
                  projectorAngle: {
                    label: 'Angle',
                    value: preset.projectorAngle,
                    min: 5,
                    max: 60,
                    step: 1,
                  },
                  projectorPenumbra: {
                    label: 'Penumbra',
                    value: preset.projectorPenumbra,
                    min: 0,
                    max: 1,
                    step: 0.01,
                  },
                  projectorDecay: {
                    label: 'Decay',
                    value: preset.projectorDecay,
                    min: 1,
                    max: 2,
                    step: 0.01,
                  },
                  projectorDistance: {
                    label: 'Distance',
                    value: preset.projectorDistance,
                    min: 0,
                    max: 20,
                    step: 0.25,
                  },
                  projectorFocus: {
                    label: 'Focus',
                    value: preset.projectorFocus,
                    min: 0,
                    max: 1,
                    step: 0.01,
                  },
                  projectorRepeat: {
                    label: 'Repeat',
                    value: preset.projectorRepeat,
                    step: 0.05,
                  },
                  projectorCastShadow: {
                    label: 'Shadows',
                    value: preset.projectorCastShadow,
                  },
                  projectorDebug: {
                    label: 'Debug',
                    value: preset.projectorDebug,
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
      Skull: folder(
        {
          Position: folder(
            {
              skullPosition: {
                label: 'Position',
                value: preset.skullPosition,
                step: 0.05,
              },
            },
            C
          ),
          Rotation: folder(
            {
              skullRotation: {
                label: 'Rotation',
                value: preset.skullRotation,
                step: 1,
              },
            },
            C
          ),
        },
        C
      ),
      'Left Femur': folder(
        {
          Position: folder(
            {
              leftFemurPosition: {
                label: 'Position',
                value: preset.leftFemurPosition,
                step: 0.05,
              },
            },
            C
          ),
          Rotation: folder(
            {
              leftFemurRotation: {
                label: 'Rotation',
                value: preset.leftFemurRotation,
                step: 1,
              },
            },
            C
          ),
        },
        C
      ),
      'Right Femur': folder(
        {
          Position: folder(
            {
              rightFemurPosition: {
                label: 'Position',
                value: preset.rightFemurPosition,
                step: 0.05,
              },
            },
            C
          ),
          Rotation: folder(
            {
              rightFemurRotation: {
                label: 'Rotation',
                value: preset.rightFemurRotation,
                step: 1,
              },
            },
            C
          ),
        },
        C
      ),
    })
  );

  useEffect(() => {
    attachSetControls(setControls);
  }, [attachSetControls, setControls]);

  controlsSnapshotRef.current = controls;

  return { controls, controlsSnapshotRef };
}
