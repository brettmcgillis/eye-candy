import { button, folder, useControls } from 'leva';

import EXPLOSION_PRESETS from '../presets/presets';

const PRESET_OPTIONS = Object.keys(EXPLOSION_PRESETS);
const PRESET_CONTROL_KEYS = [
  'backgroundColor',
  'ambientIntensity',
  'directionalIntensity',
  'rowSpacing',
  'columnSpacing',
  'explodeStrength',
  'pointerRadius',
  'falloff',
  'shakeAmount',
  'shakeSpeed',
  'returnSpeed',
  'motionBoost',
  'damping',
  'materialType',
  'color',
  'roughness',
  'metalness',
  'shininess',
  'specular',
  'clearcoat',
  'clearcoatRoughness',
  'emissive',
  'emissiveIntensity',
  'sheen',
  'sheenRoughness',
  'sheenColor',
  'iridescence',
  'iridescenceIOR',
  'flatShading',
  'wireframe',
  'glassColor',
  'transmission',
  'thickness',
  'ior',
  'chromaticAberration',
];

const MATERIAL_TYPES = [
  'Standard',
  'Physical',
  'Phong',
  'Lambert',
  'Toon',
  'Basic',
  'Normal',
  'Matcap',
];

const MAT_PATH = 'Explosion Test.Material Settings.materialType';

function pickSupportedPresetValues(presetValues) {
  return PRESET_CONTROL_KEYS.reduce((next, key) => {
    if (presetValues[key] !== undefined) {
      return { ...next, [key]: presetValues[key] };
    }
    return next;
  }, {});
}

export default function useSceneControls(latestResolvedSettingsRef) {
  const isLocalDev = import.meta.env.DEV;

  const [controls, setControls] = useControls(
    'Explosion Test',
    () => ({
      Presets: folder(
        {
          preset: {
            value: 'Standard',
            options: PRESET_OPTIONS,
            onChange: (value) => {
              const presetValues = EXPLOSION_PRESETS[value];
              if (!presetValues) return;
              setControls(pickSupportedPresetValues(presetValues));
            },
          },
          reset: button(() => {
            const { preset: presetName } =
              latestResolvedSettingsRef.current || {};
            if (!presetName) return;
            const presetValues = EXPLOSION_PRESETS[presetName];
            if (!presetValues) return;
            setControls(pickSupportedPresetValues(presetValues));
          }),
          ...(isLocalDev
            ? {
                copy: button(() => {
                  const settings = latestResolvedSettingsRef.current;
                  if (!settings || !navigator?.clipboard?.writeText) return;
                  navigator.clipboard.writeText(
                    JSON.stringify(settings, null, 2)
                  );
                }),
              }
            : {}),
        },
        { collapsed: true }
      ),
      Scene: folder(
        {
          backgroundColor: EXPLOSION_PRESETS.Standard.backgroundColor,
          ambientIntensity: { value: 0.55, min: 0, max: 2, step: 0.01 },
          directionalIntensity: {
            value: 1.35,
            min: 0,
            max: 3,
            step: 0.01,
          },
          rowSpacing: { value: 2.8, min: 0, max: 8, step: 0.01 },
          columnSpacing: { value: 2.4, min: 0, max: 8, step: 0.01 },
        },
        { collapsed: true }
      ),
      'Shader Settings': folder(
        {
          explodeStrength: { value: 0.3, min: 0, max: 1.5, step: 0.01 },
          pointerRadius: { value: 0.45, min: 0.1, max: 1.5, step: 0.01 },
          falloff: { value: 0.65, min: 0.1, max: 1.5, step: 0.01 },
          shakeAmount: { value: 0.025, min: 0, max: 0.25, step: 0.001 },
          shakeSpeed: { value: 18, min: 1, max: 50, step: 0.1 },
          returnSpeed: { value: 10, min: 1, max: 30, step: 0.1 },
          motionBoost: { value: 14, min: 1, max: 40, step: 0.1 },
          damping: { value: 6, min: 0.5, max: 20, step: 0.1 },
          showPointerRadiusDebug: false,
        },
        { collapsed: true }
      ),
      'Material Settings': folder(
        {
          materialType: {
            value: 'Standard',
            options: MATERIAL_TYPES,
          },
          color: {
            value: EXPLOSION_PRESETS.Standard.color,
            render: (get) => get(MAT_PATH) !== 'Normal',
          },
          roughness: {
            value: 0.35,
            min: 0,
            max: 1,
            step: 0.01,
            render: (get) => ['Standard', 'Physical'].includes(get(MAT_PATH)),
          },
          metalness: {
            value: 0.15,
            min: 0,
            max: 1,
            step: 0.01,
            render: (get) => ['Standard', 'Physical'].includes(get(MAT_PATH)),
          },
          shininess: {
            value: 30,
            min: 0,
            max: 100,
            step: 1,
            render: (get) => get(MAT_PATH) === 'Phong',
          },
          specular: {
            value: '#111111',
            render: (get) => get(MAT_PATH) === 'Phong',
          },
          clearcoat: {
            value: 0,
            min: 0,
            max: 1,
            step: 0.01,
            render: (get) => get(MAT_PATH) === 'Physical',
          },
          clearcoatRoughness: {
            value: 0,
            min: 0,
            max: 1,
            step: 0.01,
            render: (get) => get(MAT_PATH) === 'Physical',
          },
          emissive: {
            value: '#000000',
            render: (get) =>
              ['Standard', 'Physical', 'Phong', 'Lambert', 'Toon'].includes(
                get(MAT_PATH)
              ),
          },
          emissiveIntensity: {
            value: 0,
            min: 0,
            max: 5,
            step: 0.01,
            render: (get) =>
              ['Standard', 'Physical', 'Phong', 'Lambert', 'Toon'].includes(
                get(MAT_PATH)
              ),
          },
          sheen: {
            value: 0,
            min: 0,
            max: 1,
            step: 0.01,
            render: (get) => get(MAT_PATH) === 'Physical',
          },
          sheenRoughness: {
            value: 1,
            min: 0,
            max: 1,
            step: 0.01,
            render: (get) => get(MAT_PATH) === 'Physical',
          },
          sheenColor: {
            value: '#ffffff',
            render: (get) => get(MAT_PATH) === 'Physical',
          },
          iridescence: {
            value: 0,
            min: 0,
            max: 1,
            step: 0.01,
            render: (get) => get(MAT_PATH) === 'Physical',
          },
          iridescenceIOR: {
            value: 1.3,
            min: 1,
            max: 2.333,
            step: 0.01,
            render: (get) => get(MAT_PATH) === 'Physical',
          },
          flatShading: {
            value: false,
            render: (get) =>
              [
                'Standard',
                'Physical',
                'Phong',
                'Lambert',
                'Normal',
                'Matcap',
              ].includes(get(MAT_PATH)),
          },
          wireframe: false,
        },
        { collapsed: true }
      ),
      'Glass Settings': folder(
        {
          glassColor: EXPLOSION_PRESETS.Standard.glassColor,
          transmission: { value: 0.98, min: 0, max: 1, step: 0.01 },
          thickness: { value: 0.42, min: 0, max: 2, step: 0.01 },
          ior: { value: 1.25, min: 1, max: 3, step: 0.01 },
          chromaticAberration: {
            value: 0.025,
            min: 0,
            max: 0.2,
            step: 0.001,
          },
        },
        { collapsed: true }
      ),
    }),
    { collapsed: true }
  );

  return controls;
}
