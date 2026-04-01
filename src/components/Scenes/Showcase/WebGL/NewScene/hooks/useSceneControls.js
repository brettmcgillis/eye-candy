import { button, folder, useControls } from 'leva';

import { useEffect, useRef } from 'react';

import { localEnv } from '../../../../../../utils/appUtils';
import { getRandomNumber } from '../../../../../../utils/math';
import { PRESETS } from '../presets';

// Key paths used in leva render() functions for conditional visibility.
// Format: '<panelName>.<folderPath>.<controlKey>'
const HALO_TYPE_PATH = 'All My Thoughts Are So Cumulus.Halo.haloType';
const RINGS_STYLE_PATH = 'All My Thoughts Are So Cumulus.Halo.Rings.ringsStyle';

export default function useSceneControls() {
  const controlsSnapshotRef = useRef(PRESETS['Default Rings']);
  const selectedPresetRef = useRef('Default Rings');

  const [controls, setControls] = useControls(
    'All My Thoughts Are So Cumulus',
    () => ({
      Presets: folder(
        {
          preset: {
            label: 'Preset',
            value: 'Default Rings',
            options: Object.keys(PRESETS),
          },
          reset: button(() => {
            const snap = PRESETS[selectedPresetRef.current];
            if (snap) setControls(snap);
          }),
          ...(localEnv()
            ? {
                copy: button(() => {
                  const asObjectLiteral = JSON.stringify(
                    controlsSnapshotRef.current,
                    null,
                    2
                  ).replace(/"([A-Za-z_$][A-Za-z0-9_$]*)":/g, '$1:');
                  navigator.clipboard.writeText(asObjectLiteral);
                }),
              }
            : {}),
        },
        { collapsed: true }
      ),

      Scene: folder(
        {
          Lighting: folder(
            {
              plPosition: {
                label: 'Position',
                value: { x: 3, y: 3, z: 5 },
              },
              plDecay: {
                label: 'Decay',
                value: 0,
                min: -10,
                max: 10,
                step: 0.1,
              },
              plDistance: {
                label: 'Distance',
                value: -1,
                min: -10,
                max: 10,
                step: 0.1,
              },
              plIntensity: {
                label: 'Intensity',
                value: 0.8,
                min: 0,
                max: 10,
                step: 0.1,
              },
              plCastShadow: { label: 'Cast Shadow', value: true },
            },
            { collapsed: true }
          ),

          'Grid Helpers': folder(
            {
              showGridHelper: { label: 'Show Grid', value: false },
              showPolarGridHelper: { label: 'Show Polar Grid', value: false },
            },
            { collapsed: true }
          ),

          Camera: folder(
            {
              autoRotateSpeed: {
                label: 'Auto Rotate',
                value: 0,
                min: -50,
                max: 50,
              },
              floatSpeed: {
                label: 'Float Speed',
                value: 0.5,
                min: 0,
                max: 1,
                step: 0.01,
              },
              environmentIntensity: {
                label: 'Env Intensity',
                value: 0,
                min: 0,
                max: 2,
                step: 0.01,
              },
            },
            { collapsed: true }
          ),

          Animations: folder(
            {
              'Halo Animation': folder(
                {
                  animate: { label: 'Rotate', value: true },
                  speed: {
                    label: 'RPM',
                    value: 33,
                    min: 0,
                    max: 78,
                    step: 1,
                  },
                  wobble: { label: 'Wobble', value: false },
                  wobbleSpeed: {
                    label: 'Wobble Speed',
                    value: 1,
                    min: 0,
                    max: 10,
                    step: 0.1,
                  },
                  wobbleAngle: {
                    label: 'Wobble Angle',
                    value: 5,
                    min: 0,
                    max: 15,
                    step: 1,
                  },
                },
                { collapsed: true }
              ),
              haloScrollEnabled: { label: 'Halo Scroll', value: false },
            },
            { collapsed: true }
          ),
        },
        { collapsed: true }
      ),

      Halo: folder(
        {
          haloType: {
            label: 'Type',
            value: 'rings',
            options: {
              Rings: 'rings',
              Record: 'record',
              Network: 'network',
              Plate: 'plate',
              Atomic: 'atomic',
            },
          },

          Appearance: folder(
            {
              haloPosition: {
                label: 'Position',
                value: { x: 0, y: 1.5, z: -1 },
              },
              haloRotation: {
                label: 'Rotation',
                value: { x: 45, y: 0, z: 0 },
              },
              haloScale: {
                label: 'Scale',
                value: 0.9,
                min: 0.01,
                max: 20,
                step: 0.01,
              },
              haloVisible: { label: 'Visible', value: true },
            },
            { collapsed: true }
          ),

          Rings: folder(
            {
              ringsStyle: {
                label: 'Style',
                value: 'default',
                options: { Default: 'default', Gradient: 'gradient' },
              },
              ringsInnerRadius: {
                label: 'Inner Radius',
                value: 0.5,
                min: 0.1,
                max: 2,
                step: 0.1,
              },
              ringsOuterRadius: {
                label: 'Outer Radius',
                value: 2,
                min: 0.5,
                max: 20,
                step: 0.1,
              },
              ringsStart: {
                label: 'Start Color',
                value: '#FFFFFF',
                render: (get) => get(RINGS_STYLE_PATH) === 'gradient',
              },
              ringsEnd: {
                label: 'End Color',
                value: '#000000',
                render: (get) => get(RINGS_STYLE_PATH) === 'gradient',
              },
              ringsSteps: {
                label: 'Steps',
                value: 8,
                min: 2,
                max: 20,
                step: 1,
                render: (get) => get(RINGS_STYLE_PATH) === 'gradient',
              },
              ringsSm: {
                label: 'SM Width',
                value: 0.1,
                min: 0.1,
                max: 3,
                step: 0.1,
                render: (get) => get(RINGS_STYLE_PATH) === 'default',
              },
              ringsMed: {
                label: 'MED Width',
                value: 1,
                min: 0.1,
                max: 3,
                step: 0.1,
                render: (get) => get(RINGS_STYLE_PATH) === 'default',
              },
              ringsLg: {
                label: 'LG Width',
                value: 2,
                min: 0.1,
                max: 3,
                step: 0.1,
                render: (get) => get(RINGS_STYLE_PATH) === 'default',
              },
              ringsXl: {
                label: 'XL Width',
                value: 3,
                min: 0.1,
                max: 3,
                step: 0.1,
                render: (get) => get(RINGS_STYLE_PATH) === 'default',
              },
              ringsSilver: {
                label: 'Silver',
                value: '#c1c1c1',
                render: (get) => get(RINGS_STYLE_PATH) === 'default',
              },
              ringsWhite: {
                label: 'White',
                value: '#ffffff',
                render: (get) => get(RINGS_STYLE_PATH) === 'default',
              },
              ringsBlack: {
                label: 'Black',
                value: '#000000',
                render: (get) => get(RINGS_STYLE_PATH) === 'default',
              },
              ringsBlue: {
                label: 'Blue',
                value: '#0023ff',
                render: (get) => get(RINGS_STYLE_PATH) === 'default',
              },
              ringsLightblue: {
                label: 'Light Blue',
                value: '#69d8ff',
                render: (get) => get(RINGS_STYLE_PATH) === 'default',
              },
            },
            {
              collapsed: true,
              render: (get) => get(HALO_TYPE_PATH) === 'rings',
            }
          ),

          Record: folder(
            {
              recordSideA: {
                label: 'Side',
                value: true,
                options: { 'Side A': true, 'Side B': false },
              },
            },
            {
              collapsed: true,
              render: (get) => get(HALO_TYPE_PATH) === 'record',
            }
          ),

          Network: folder(
            {
              networkPointColor: {
                label: 'Point Color',
                value: '#ff0000',
              },
              networkLineColor: {
                label: 'Line Color',
                value: '#000000',
              },
              networkPointSize: {
                label: 'Point Size',
                value: 2.5,
                min: 0.5,
                max: 10,
                step: 0.5,
              },
              networkParticleCount: {
                label: 'Particles',
                value: 500,
                min: 50,
                max: 1000,
                step: 50,
              },
              networkMaxDistance: {
                label: 'Max Distance',
                value: 0.8,
                min: 0.1,
                max: 2,
                step: 0.1,
              },
              networkAngularSpeed: {
                label: 'Angular Speed',
                value: 0.53,
                min: 0,
                max: 3,
                step: 0.01,
              },
              networkTimeScale: {
                label: 'Time Scale',
                value: 0.4,
                min: 0,
                max: 2,
                step: 0.05,
              },
            },
            {
              collapsed: true,
              render: (get) => get(HALO_TYPE_PATH) === 'network',
            }
          ),

          Atom: folder(
            {
              atomicNumber: {
                label: 'Atomic Number',
                value: 8,
                min: 1,
                max: 36,
                step: 1,
              },
              atomAnimateElectrons: {
                label: 'Animate Electrons',
                value: true,
              },
              atomShellSpacing: {
                label: 'Shell Spacing',
                value: 0.65,
                min: 0.1,
                max: 2,
                step: 0.05,
              },
            },
            {
              collapsed: true,
              render: (get) => get(HALO_TYPE_PATH) === 'atomic',
            }
          ),
        },
        { collapsed: true }
      ),

      Cloud: folder(
        {
          'Cloud Appearance': folder(
            {
              cloudPosition: {
                label: 'Position',
                value: { x: 0, y: 0.75, z: 0 },
              },
              cloudRotation: {
                label: 'Rotation',
                value: { x: 0, y: 0, z: 0 },
              },
              cloudScale: {
                label: 'Scale',
                value: 0.15,
                min: 0.01,
                max: 1,
                step: 0.01,
              },
              cloudVisible: { label: 'Visible', value: true },
            },
            { collapsed: true }
          ),
          cloudSeed: {
            label: 'Seed',
            value: getRandomNumber(1, 100),
            min: 1,
            max: 100,
            step: 1,
          },
          cloudSegments: {
            label: 'Segments',
            value: 50,
            min: 1,
            max: 80,
            step: 1,
          },
          cloudVolume: {
            label: 'Volume',
            value: 6,
            min: 0,
            max: 100,
            step: 0.1,
          },
          cloudOpacity: {
            label: 'Opacity',
            value: 0.8,
            min: 0,
            max: 1,
            step: 0.01,
          },
          cloudFade: { label: 'Fade', value: 0, min: 0, max: 400, step: 1 },
          cloudGrowth: { label: 'Growth', value: 4, min: 0, max: 20, step: 1 },
          cloudSpeed: {
            label: 'Speed',
            value: 0.5,
            min: 0,
            max: 1,
            step: 0.01,
          },
          cloudBoundsX: {
            label: 'Bounds X',
            value: 6,
            min: 0,
            max: 10,
            step: 1,
          },
          cloudBoundsY: {
            label: 'Bounds Y',
            value: 1,
            min: 0,
            max: 10,
            step: 1,
          },
          cloudBoundsZ: {
            label: 'Bounds Z',
            value: 1,
            min: 0,
            max: 10,
            step: 1,
          },
          cloudColor: { label: 'Color', value: '#bababa' },
        },
        { collapsed: true }
      ),

      Skull: folder(
        {
          'Skull Appearance': folder(
            {
              skullPosition: { label: 'Position', value: { x: 0, y: 0, z: 0 } },
              skullRotation: { label: 'Rotation', value: { x: 0, y: 0, z: 0 } },
              skullScale: {
                label: 'Scale',
                value: 0.1,
                min: 0.01,
                max: 1,
                step: 0.01,
              },
              skullVisible: { label: 'Visible', value: true },
            },
            { collapsed: true }
          ),
        },
        { collapsed: true }
      ),

      Femur: folder(
        {
          'Femur Appearance': folder(
            {
              femurPosition: {
                label: 'Position',
                value: { x: -3, y: -3, z: -0.05 },
              },
              femurRotation: {
                label: 'Rotation',
                value: { x: 0, y: 0, z: -66 },
              },
              femurScale: {
                label: 'Scale',
                value: 0.75,
                min: 0.1,
                max: 1,
                step: 0.01,
              },
              femurVisible: { label: 'Visible', value: true },
            },
            { collapsed: true }
          ),
        },
        { collapsed: true }
      ),
    }),
    { collapsed: true }
  );

  useEffect(() => {
    selectedPresetRef.current = controls.preset;
    // Auto-apply preset when dropdown selection changes
    const snap = PRESETS[controls.preset];
    if (snap) {
      setControls(snap);
    }
  }, [controls.preset, setControls]);

  return { controls, setControls, controlsSnapshotRef };
}
