import { button, folder, useControls } from 'leva';

import { useRef } from 'react';

import { localEnv } from '../../../../../../utils/appUtils';

const DEFAULTS = {
  // Scene
  cameraMode: 'Fixed',
  backgroundColor: '#ffffff',
  ambientIntensity: 0.85,
  ambientColor: '#f7fbff',
  mainLightIntensity: 1.15,
  mainLightColor: '#fff8ea',
  fillLightIntensity: 0.35,
  fillLightColor: '#d9f2ff',

  // Water
  topColor: '#9edff0',
  bottomColor: '#246f98',
  opacity: 0.34,
  transmission: 0.5,
  roughness: 0.3,
  ior: 1.12,
  thickness: 0.35,
  waveHeight: 0.15,
  waveChoppiness: 0.5,
  waveSpeed: 0.6,

  // HammerHead
  hammerheadVisible: true,
  hammerheadScale: 0.38,
  hammerheadSpeed: 0.1,
  hammerheadSplineVisible: false,

  // Tiger Shark 1
  tiger1Visible: true,
  tiger1Scale: 0.003,
  tiger1Speed: 0.075,
  tiger1SplineVisible: false,

  // Tiger Shark 2
  tiger2Visible: true,
  tiger2Scale: 0.003,
  tiger2Speed: 0.06,
  tiger2SplineVisible: false,

  // Post Processing
  painterlyEnabled: true,
  painterlyRadius: 6,
  painterlyAlpha: 25,
  painterlyQuantize: 16,
  painterlySaturation: 1.5,
  painterlyPaper: 1.0,
  bloomEnabled: true,
  bloomIntensity: 1.2,
};

export default function useStayingAfloatControls() {
  const controlsSnapshotRef = useRef({ ...DEFAULTS });

  const [controls, setControls] = useControls(
    'Staying Afloat',
    () => ({
      Presets: folder(
        {
          reset: button(() => setControls({ ...DEFAULTS })),
          ...(localEnv()
            ? {
                copy: button(() => {
                  const json = JSON.stringify(
                    controlsSnapshotRef.current,
                    null,
                    2
                  );
                  const literal = json.replace(
                    /"([A-Za-z_$][A-Za-z0-9_$]*)":/g,
                    '$1:'
                  );
                  navigator.clipboard.writeText(literal);
                }),
              }
            : {}),
        },
        { collapsed: true }
      ),

      Scene: folder(
        {
          cameraMode: {
            label: 'Camera',
            value: DEFAULTS.cameraMode,
            options: ['Fixed', 'Orbit'],
          },
          backgroundColor: {
            label: 'Background',
            value: DEFAULTS.backgroundColor,
          },
          Lighting: folder(
            {
              ambientIntensity: {
                label: 'Ambient',
                value: DEFAULTS.ambientIntensity,
                min: 0,
                max: 2,
                step: 0.05,
              },
              ambientColor: {
                label: 'Ambient Color',
                value: DEFAULTS.ambientColor,
              },
              mainLightIntensity: {
                label: 'Main Light',
                value: DEFAULTS.mainLightIntensity,
                min: 0,
                max: 3,
                step: 0.05,
              },
              mainLightColor: {
                label: 'Main Color',
                value: DEFAULTS.mainLightColor,
              },
              fillLightIntensity: {
                label: 'Fill Light',
                value: DEFAULTS.fillLightIntensity,
                min: 0,
                max: 2,
                step: 0.05,
              },
              fillLightColor: {
                label: 'Fill Color',
                value: DEFAULTS.fillLightColor,
              },
            },
            { collapsed: true }
          ),
        },
        { collapsed: true }
      ),

      Water: folder(
        {
          topColor: { label: 'Top Color', value: DEFAULTS.topColor },
          bottomColor: { label: 'Bottom Color', value: DEFAULTS.bottomColor },
          opacity: { value: DEFAULTS.opacity, min: 0, max: 1, step: 0.01 },
          transmission: {
            value: DEFAULTS.transmission,
            min: 0,
            max: 1,
            step: 0.01,
          },
          roughness: { value: DEFAULTS.roughness, min: 0, max: 1, step: 0.01 },
          ior: {
            label: 'IOR',
            value: DEFAULTS.ior,
            min: 1,
            max: 2.5,
            step: 0.01,
          },
          thickness: { value: DEFAULTS.thickness, min: 0, max: 2, step: 0.01 },
          waveHeight: {
            label: 'Wave Height',
            value: DEFAULTS.waveHeight,
            min: 0,
            max: 1,
            step: 0.01,
          },
          waveChoppiness: {
            label: 'Choppiness',
            value: DEFAULTS.waveChoppiness,
            min: 0,
            max: 2,
            step: 0.01,
          },
          waveSpeed: {
            label: 'Wave Speed',
            value: DEFAULTS.waveSpeed,
            min: 0,
            max: 2,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),

      Sharks: folder(
        {
          HammerHead: folder(
            {
              hammerheadVisible: {
                label: 'Visible',
                value: DEFAULTS.hammerheadVisible,
              },
              hammerheadScale: {
                label: 'Scale',
                value: DEFAULTS.hammerheadScale,
                min: 0.01,
                max: 2,
                step: 0.01,
              },
              hammerheadSpeed: {
                label: 'Speed',
                value: DEFAULTS.hammerheadSpeed,
                min: 0,
                max: 0.5,
                step: 0.005,
              },
              'HammerHead Path': folder(
                {
                  hammerheadSplineVisible: {
                    label: 'Show Spline',
                    value: DEFAULTS.hammerheadSplineVisible,
                  },
                },
                { collapsed: true }
              ),
            },
            { collapsed: true }
          ),

          'Tiger Shark 1': folder(
            {
              tiger1Visible: {
                label: 'Visible',
                value: DEFAULTS.tiger1Visible,
              },
              tiger1Scale: {
                label: 'Scale',
                value: DEFAULTS.tiger1Scale,
                min: 0.001,
                max: 0.01,
                step: 0.0005,
              },
              tiger1Speed: {
                label: 'Speed',
                value: DEFAULTS.tiger1Speed,
                min: 0,
                max: 0.5,
                step: 0.005,
              },
              'Tiger 1 Path': folder(
                {
                  tiger1SplineVisible: {
                    label: 'Show Spline',
                    value: DEFAULTS.tiger1SplineVisible,
                  },
                },
                { collapsed: true }
              ),
            },
            { collapsed: true }
          ),

          'Tiger Shark 2': folder(
            {
              tiger2Visible: {
                label: 'Visible',
                value: DEFAULTS.tiger2Visible,
              },
              tiger2Scale: {
                label: 'Scale',
                value: DEFAULTS.tiger2Scale,
                min: 0.001,
                max: 0.01,
                step: 0.0005,
              },
              tiger2Speed: {
                label: 'Speed',
                value: DEFAULTS.tiger2Speed,
                min: 0,
                max: 0.5,
                step: 0.005,
              },
              'Tiger 2 Path': folder(
                {
                  tiger2SplineVisible: {
                    label: 'Show Spline',
                    value: DEFAULTS.tiger2SplineVisible,
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

      'Post Processing': folder(
        {
          painterlyEnabled: {
            label: 'Painterly',
            value: DEFAULTS.painterlyEnabled,
          },
          painterlyRadius: {
            label: 'Painterly Radius',
            value: DEFAULTS.painterlyRadius,
            min: 1,
            max: 10,
            step: 1,
          },
          painterlyAlpha: {
            label: 'Stroke Direction',
            value: DEFAULTS.painterlyAlpha,
            min: 1,
            max: 100,
            step: 1,
          },
          painterlyQuantize: {
            label: 'Quantize Levels',
            value: DEFAULTS.painterlyQuantize,
            min: 2,
            max: 32,
            step: 1,
          },
          painterlySaturation: {
            label: 'Saturation',
            value: DEFAULTS.painterlySaturation,
            min: 0,
            max: 3,
            step: 0.05,
          },
          painterlyPaper: {
            label: 'Paper Strength',
            value: DEFAULTS.painterlyPaper,
            min: 0,
            max: 1,
            step: 0.05,
          },
          bloomEnabled: {
            label: 'Bloom',
            value: DEFAULTS.bloomEnabled,
          },
          bloomIntensity: {
            label: 'Bloom Intensity',
            value: DEFAULTS.bloomIntensity,
            min: 0,
            max: 6,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),
    }),
    { collapsed: true }
  );

  controlsSnapshotRef.current = { ...controls };

  return controls;
}
