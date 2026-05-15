import { button, folder, useControls } from 'leva';
import * as THREE from 'three';

import { useCallback, useEffect, useRef, useState } from 'react';

import FIRE_PRESETS from '../../../../../../presets/fire/firePresets';
import { localEnv } from '../../../../../../utils/appUtils';
import buildSplineGroupControls from '../../shared/hooks/useSplineGroupControls';
import {
  DEFAULT_SPLINE_CONFIG,
  parsePreset,
  serializeSplines,
} from '../../shared/splineDefaults';

const SCENE_LABEL = 'Hot Box';
const SMOKE_FOLDER_PATH = `${SCENE_LABEL}.Smoke`;
const FIRE_FOLDER_PATH = `${SCENE_LABEL}.Fire`;
const DEFAULT_PRESET_KEY = Object.keys(FIRE_PRESETS)[0];
const MAX_ATTRACTORS = 8;
const SMOKE_SPLINE_TYPE_ORDER = ['Particle', 'Volumetric'];
const SMOKE_SPLINE_TYPE_LABELS = {
  Particle: 'Particle Smoke',
  Volumetric: 'Volumetric Smoke',
};
const FIRE_SPLINE_TYPE_ORDER = ['Classic', 'RayMarch', 'Fireball'];
const FIRE_SPLINE_TYPE_LABELS = {
  Classic: 'Classic Fire',
  RayMarch: 'RayMarch Fire',
  Fireball: 'Fireball Fire',
};

const shouldSeedDefaultStandaloneElements = (presetKey) =>
  presetKey === DEFAULT_PRESET_KEY;

let idCounter = 0;
const mkId = () => idCounter++;

const randPt = () => ({
  position: new THREE.Vector3(
    (Math.random() - 0.5) * 4,
    Math.random() * 4,
    (Math.random() - 0.5) * 4
  ),
  rotation: new THREE.Euler(),
  scale: new THREE.Vector3(1, 1, 1),
});

const DEFAULT_SMOKEBALL_POSITION = [-5, 1, 0];
const DEFAULT_FIREBALL_POSITION = [3, 1, 0];
const DEFAULT_FLAME_POSITION = [5, 0, 0];
const DEFAULT_FIREBALL_VOLUME_POSITION = [5, 1, 0];

const offsetPosition = (base, spread = [4, 3, 4]) => [
  base[0] + (Math.random() - 0.5) * spread[0],
  base[1] + Math.random() * spread[1],
  base[2] + (Math.random() - 0.5) * spread[2],
];

const mkSmokeBallCfg = () => ({
  radius: 0.6,
  detail: 5,
  speed: 1.0,
  weight: 0.3,
  noiseFreq: 2.0,
  noiseAmp: 0.15,
  animated: true,
  smokeLightColor: '#bcbcbc',
  smokeDarkColor: '#262626',
});

const mkFireballCfg = () => ({
  radius: 0.4,
  detail: 5,
  speed: 1.0,
  weight: 0.3,
  noiseFreq: 2.0,
  noiseAmp: 0.15,
  animated: true,
});

const mkFlameCfg = () => ({
  inverted: false,
  motion: {
    baseSpeed: 1.15,
    minSpeed: 0.28,
    slowFreq: 0.7,
    slowAmp: 0.55,
    fastFreq: 2.6,
    fastAmp: 0.25,
    microFreq: 5.7,
    microAmp: 0.08,
    swayX: 0.015,
    swayZ: 0.014,
    pulseFreq: 3.4,
    pulseAmp: 0.04,
    scaleX: 1,
    scaleY: 1,
  },
});

const mkFireballVolumeCfg = () => ({
  radius: 0.8,
  rotSpeed: 0.1,
  noiseScale: 0.5,
  coreColor: '#ccffff',
  coreIntensity: 7.0,
  edgeColor: '#7a877f',
  edgeIntensity: 1.5,
  density: 1.0,
  steps: 64,
});

const makeTypedSplineConfig = ({ type, smokeType, fireType, name }) => ({
  ...DEFAULT_SPLINE_CONFIG,
  type,
  smokeType: smokeType ?? DEFAULT_SPLINE_CONFIG.smokeType,
  fireType: fireType ?? DEFAULT_SPLINE_CONFIG.fireType,
  name,
});

const makeSmokeBallInst = (pos = DEFAULT_SMOKEBALL_POSITION) => ({
  id: mkId(),
  pos: [...pos],
  rot: [0, 0, 0],
  scale: [1, 1, 1],
  config: mkSmokeBallCfg(),
});

const makeFireballInst = (pos = DEFAULT_FIREBALL_POSITION) => ({
  id: mkId(),
  pos: [...pos],
  rot: [0, 0, 0],
  scale: [1, 1, 1],
  config: mkFireballCfg(),
});

const makeFlameInst = (pos = DEFAULT_FLAME_POSITION) => ({
  id: mkId(),
  pos: [...pos],
  rot: [0, 0, 0],
  scale: [1.2, 1.2, 1.2],
  config: mkFlameCfg(),
});

const makeFireballVolumeInst = (pos = DEFAULT_FIREBALL_VOLUME_POSITION) => ({
  id: mkId(),
  pos: [...pos],
  rot: [0, 0, 0],
  scale: [1, 1, 1],
  config: mkFireballVolumeCfg(),
});

function getStandaloneDefaults(presetKey) {
  if (!shouldSeedDefaultStandaloneElements(presetKey)) {
    return {
      smokeBall: [],
      fireball: [],
      flame: [],
      fireballVolume: [],
    };
  }

  return {
    smokeBall: [makeSmokeBallInst()],
    fireball: [makeFireballInst()],
    flame: [makeFlameInst()],
    fireballVolume: [makeFireballVolumeInst()],
  };
}

export default function useHotBoxControls(splines, setSplines, attractorsRef) {
  const selectedPresetRef = useRef(DEFAULT_PRESET_KEY);
  const splinesRef = useRef(splines);
  splinesRef.current = splines;

  const initialStandaloneDefaultsRef = useRef(null);
  if (!initialStandaloneDefaultsRef.current) {
    initialStandaloneDefaultsRef.current = getStandaloneDefaults(
      DEFAULT_PRESET_KEY
    );
  }

  const [splineConfigs, setSplineConfigs] = useState(() => {
    const { splineConfigs: initial } = parsePreset(
      FIRE_PRESETS[DEFAULT_PRESET_KEY]
    );
    return initial;
  });
  const splineConfigsRef = useRef(splineConfigs);
  splineConfigsRef.current = splineConfigs;

  const [smokeBallInstances, setSmokeBallInstances] = useState(
    () => initialStandaloneDefaultsRef.current.smokeBall
  );
  const [fireballInstances, setFireballInstances] = useState(
    () => initialStandaloneDefaultsRef.current.fireball
  );
  const [flameInstances, setFlameInstances] = useState(
    () => initialStandaloneDefaultsRef.current.flame
  );
  const [fireballVolumeInstances, setFireballVolumeInstances] = useState(
    () => initialStandaloneDefaultsRef.current.fireballVolume
  );
  const [attractorVersion, setAttractorVersion] = useState(0);
  const [hotBoxSchemaVersion, setHotBoxSchemaVersion] = useState(0);
  const splineTypeSignature = splineConfigs
    .map(
      (config) =>
        `${config?.type ?? DEFAULT_SPLINE_CONFIG.type}:${config?.smokeType ?? DEFAULT_SPLINE_CONFIG.smokeType}:${config?.fireType ?? DEFAULT_SPLINE_CONFIG.fireType}`
    )
    .join('|');

  const forceAttractorUpdate = useCallback(
    () => setAttractorVersion((count) => count + 1),
    []
  );

  const applyPresetState = useCallback(
    (presetKey) => {
      const presetValue = FIRE_PRESETS[presetKey];
      if (presetValue) {
        const { splines: nextSplines, splineConfigs: nextConfigs } =
          parsePreset(presetValue);
        setSplines(nextSplines);
        setSplineConfigs(nextConfigs);
      }

      const defaults = getStandaloneDefaults(presetKey);
      setSmokeBallInstances(defaults.smokeBall);
      setFireballInstances(defaults.fireball);
      setFlameInstances(defaults.flame);
      setFireballVolumeInstances(defaults.fireballVolume);
      attractorsRef.current = [];
      setAttractorVersion((count) => count + 1);
      setHotBoxSchemaVersion((count) => count + 1);
    },
    [attractorsRef, setSplines]
  );

  const [
    {
      preset,
      pointMode,
      bgColor,
      attractorStrength,
      attractorRadius,
      showAttractors,
      attractorMode,
    },
  ] = useControls(
    SCENE_LABEL,
    () => ({
      Presets: folder(
        {
          preset: {
            label: 'Preset',
            value: DEFAULT_PRESET_KEY,
            options: Object.keys(FIRE_PRESETS),
          },
          reset: button(() => applyPresetState(selectedPresetRef.current)),
          ...(localEnv()
            ? {
                copy: button(
                  () => {
                    const code = serializeSplines(
                      splinesRef.current,
                      splineConfigsRef.current
                    );
                    navigator.clipboard.writeText(`splines: [\n${code}\n]`);
                  },
                  { label: 'Copy Preset' }
                ),
              }
            : {}),
        },
        { collapsed: true }
      ),

      Scene: folder(
        {
          pointMode: {
            label: 'Point Mode',
            value: 'translate',
            options: ['translate', 'rotate', 'scale'],
          },
          bgColor: { label: 'Background', value: '#9b9b9b' },
        },
        { collapsed: true }
      ),

      Attractors: folder(
        {
          showAttractors: { label: 'Show Helpers', value: true },
          attractorMode: {
            label: 'Mode',
            value: 'translate',
            options: ['translate', 'rotate', 'scale', 'none'],
          },
          attractorStrength: {
            label: 'Strength',
            value: 3,
            min: 0,
            max: 50,
            step: 0.5,
          },
          attractorRadius: {
            label: 'Radius',
            value: 3,
            min: 0.1,
            max: 20,
            step: 0.1,
          },
          'Add Attractor': button(() => {
            if (attractorsRef.current.length >= MAX_ATTRACTORS) return;

            attractorsRef.current.push({
              position: [
                (Math.random() - 0.5) * 6,
                1 + Math.random() * 5,
                (Math.random() - 0.5) * 4,
              ],
              direction: [0, 1, 0],
              rotation: [0, 0, 0],
            });
            setAttractorVersion((count) => count + 1);
          }),
          'Remove Attractor': button(() => {
            if (attractorsRef.current.length <= 0) return;
            attractorsRef.current.pop();
            setAttractorVersion((count) => count + 1);
          }),
          'Remove All Attractors': button(() => {
            // eslint-disable-next-line no-param-reassign
            attractorsRef.current.length = 0;
            setAttractorVersion((count) => count + 1);
          }),
        },
        { collapsed: true }
      ),
    }),
    []
  );

  useControls(
    SCENE_LABEL,
    () => {
      const typedSplineEntries = splines.reduce(
        (acc, _points, index) => {
          const cfg = splineConfigs[index] ?? DEFAULT_SPLINE_CONFIG;

          if ((cfg.type ?? DEFAULT_SPLINE_CONFIG.type) === 'Fire') {
            const fireType = cfg.fireType ?? DEFAULT_SPLINE_CONFIG.fireType;
            acc.fire[fireType].push({ index, cfg });
          } else {
            const smokeType = cfg.smokeType ?? DEFAULT_SPLINE_CONFIG.smokeType;
            acc.smoke[smokeType].push({ index, cfg });
          }

          return acc;
        },
        {
          smoke: { Particle: [], Volumetric: [] },
          fire: { Classic: [], RayMarch: [], Fireball: [] },
        }
      );

      const addSmokeSpline = (smokeType) => {
        const typeLabel = SMOKE_SPLINE_TYPE_LABELS[smokeType];
        const nextCount = typedSplineEntries.smoke[smokeType].length + 1;

        setSplines((prev) => [...prev, [randPt(), randPt(), randPt()]]);
        setSplineConfigs((prev) => [
          ...prev,
          makeTypedSplineConfig({
            type: 'Smoke',
            smokeType,
            name: `${typeLabel} ${nextCount}`,
          }),
        ]);
        setHotBoxSchemaVersion((count) => count + 1);
      };

      const addFireSpline = (fireType) => {
        const typeLabel = FIRE_SPLINE_TYPE_LABELS[fireType];
        const nextCount = typedSplineEntries.fire[fireType].length + 1;

        setSplines((prev) => [...prev, [randPt(), randPt(), randPt()]]);
        setSplineConfigs((prev) => [
          ...prev,
          makeTypedSplineConfig({
            type: 'Fire',
            fireType,
            name: `${typeLabel} ${nextCount}`,
          }),
        ]);
        setHotBoxSchemaVersion((count) => count + 1);
      };

      const removeAllSmokeSplines = (smokeType) => {
        setSplines((prev) =>
          prev.filter(
            (_points, index) =>
              !(
                (splineConfigs[index]?.type ?? DEFAULT_SPLINE_CONFIG.type) ===
                  'Smoke' &&
                (splineConfigs[index]?.smokeType ??
                  DEFAULT_SPLINE_CONFIG.smokeType) === smokeType
              )
          )
        );
        setSplineConfigs((prev) =>
          prev.filter(
            (config) =>
              !(
                (config?.type ?? DEFAULT_SPLINE_CONFIG.type) === 'Smoke' &&
                (config?.smokeType ?? DEFAULT_SPLINE_CONFIG.smokeType) ===
                  smokeType
              )
          )
        );
        setHotBoxSchemaVersion((count) => count + 1);
      };

      const removeAllFireSplines = (fireType) => {
        setSplines((prev) =>
          prev.filter(
            (_points, index) =>
              !(
                (splineConfigs[index]?.type ?? DEFAULT_SPLINE_CONFIG.type) ===
                  'Fire' &&
                (splineConfigs[index]?.fireType ??
                  DEFAULT_SPLINE_CONFIG.fireType) === fireType
              )
          )
        );
        setSplineConfigs((prev) =>
          prev.filter(
            (config) =>
              !(
                (config?.type ?? DEFAULT_SPLINE_CONFIG.type) === 'Fire' &&
                (config?.fireType ?? DEFAULT_SPLINE_CONFIG.fireType) ===
                  fireType
              )
          )
        );
        setHotBoxSchemaVersion((count) => count + 1);
      };

      const smokeSplineSections = SMOKE_SPLINE_TYPE_ORDER.reduce(
        (acc, smokeType) => {
          const typeLabel = SMOKE_SPLINE_TYPE_LABELS[smokeType];
          const typeFolderPath = `${SMOKE_FOLDER_PATH}.${typeLabel}`;
          const entries = typedSplineEntries.smoke[smokeType];

          acc[typeLabel] = folder(
            {
              [`Add ${typeLabel}`]: button(() => addSmokeSpline(smokeType)),
              [`Remove All ${typeLabel}`]: button(() =>
                removeAllSmokeSplines(smokeType)
              ),
              ...entries.reduce((typeAcc, entry, typeIndex) => {
                const folderLabel = `${typeLabel} ${typeIndex + 1}`;
                typeAcc[folderLabel] = folder(
                  buildSplineGroupControls(entry.index, entry.cfg, {
                    sceneLabel: typeFolderPath,
                    folderLabel,
                    setSplineConfigs,
                    setSplines,
                    allowedTypes: 'smoke',
                  }),
                  { collapsed: true }
                );
                return typeAcc;
              }, {}),
            },
            { collapsed: smokeType !== 'Particle' }
          );

          return acc;
        },
        {}
      );

      const fireSplineSections = FIRE_SPLINE_TYPE_ORDER.reduce(
        (acc, fireType) => {
          const typeLabel = FIRE_SPLINE_TYPE_LABELS[fireType];
          const typeFolderPath = `${FIRE_FOLDER_PATH}.${typeLabel}`;
          const entries = typedSplineEntries.fire[fireType];

          acc[typeLabel] = folder(
            {
              [`Add ${typeLabel}`]: button(() => addFireSpline(fireType)),
              [`Remove All ${typeLabel}`]: button(() =>
                removeAllFireSplines(fireType)
              ),
              ...entries.reduce((typeAcc, entry, typeIndex) => {
                const folderLabel = `${typeLabel} ${typeIndex + 1}`;
                typeAcc[folderLabel] = folder(
                  buildSplineGroupControls(entry.index, entry.cfg, {
                    sceneLabel: typeFolderPath,
                    folderLabel,
                    setSplineConfigs,
                    setSplines,
                    allowedTypes: 'fire',
                  }),
                  { collapsed: true }
                );
                return typeAcc;
              }, {}),
            },
            { collapsed: fireType !== 'Classic' }
          );

          return acc;
        },
        {}
      );

      const smokeBallSection = {
        'Add Smoke Ball': button(() =>
          setSmokeBallInstances((prev) => [
            ...prev,
            makeSmokeBallInst(offsetPosition(DEFAULT_SMOKEBALL_POSITION)),
          ])
        ),
        'Remove All Smoke Balls': button(() => setSmokeBallInstances([])),
        ...smokeBallInstances.reduce((acc, instance, index) => {
          const { id } = instance;
          const onCfg = (key) => (value) =>
            setSmokeBallInstances((prev) =>
              prev.map((item) =>
                item.id === id
                  ? { ...item, config: { ...item.config, [key]: value } }
                  : item
              )
            );
          const onInst = (key) => (value) =>
            setSmokeBallInstances((prev) =>
              prev.map((item) =>
                item.id === id ? { ...item, [key]: value } : item
              )
            );

          acc[`Smoke Ball ${index + 1}`] = folder(
            {
              [`sb_pos_${id}`]: {
                label: 'Position',
                value: instance.pos,
                step: 0.1,
                onChange: onInst('pos'),
              },
              [`sb_rot_${id}`]: {
                label: 'Rotation',
                value: instance.rot,
                step: 0.05,
                onChange: onInst('rot'),
              },
              [`sb_scale_${id}`]: {
                label: 'Scale',
                value: instance.scale,
                min: 0.01,
                max: 10,
                step: 0.1,
                onChange: onInst('scale'),
              },
              'SB Appearance': folder(
                {
                  [`sb_radius_${id}`]: {
                    label: 'Radius',
                    value: instance.config.radius,
                    min: 0.05,
                    max: 5,
                    step: 0.05,
                    onChange: onCfg('radius'),
                  },
                  [`sb_detail_${id}`]: {
                    label: 'Detail',
                    value: instance.config.detail,
                    min: 1,
                    max: 7,
                    step: 1,
                    onChange: onCfg('detail'),
                  },
                  [`sb_speed_${id}`]: {
                    label: 'Speed',
                    value: instance.config.speed,
                    min: 0,
                    max: 5,
                    step: 0.05,
                    onChange: onCfg('speed'),
                  },
                  [`sb_weight_${id}`]: {
                    label: 'Weight',
                    value: instance.config.weight,
                    min: 0,
                    max: 3,
                    step: 0.05,
                    onChange: onCfg('weight'),
                  },
                  [`sb_noiseFreq_${id}`]: {
                    label: 'Noise Freq',
                    value: instance.config.noiseFreq,
                    min: 0.1,
                    max: 10,
                    step: 0.1,
                    onChange: onCfg('noiseFreq'),
                  },
                  [`sb_noiseAmp_${id}`]: {
                    label: 'Noise Amp',
                    value: instance.config.noiseAmp,
                    min: 0,
                    max: 1,
                    step: 0.01,
                    onChange: onCfg('noiseAmp'),
                  },
                  [`sb_animated_${id}`]: {
                    label: 'Animated',
                    value: instance.config.animated,
                    onChange: onCfg('animated'),
                  },
                  [`sb_light_${id}`]: {
                    label: 'Light',
                    value: instance.config.smokeLightColor,
                    onChange: onCfg('smokeLightColor'),
                  },
                  [`sb_dark_${id}`]: {
                    label: 'Dark',
                    value: instance.config.smokeDarkColor,
                    onChange: onCfg('smokeDarkColor'),
                  },
                },
                { collapsed: true }
              ),
              [`sb_delete_${id}`]: button(
                () =>
                  setSmokeBallInstances((prev) =>
                    prev.filter((item) => item.id !== id)
                  ),
                { label: 'Delete Instance' }
              ),
            },
            { collapsed: true }
          );
          return acc;
        }, {}),
      };

      const fireballSection = {
        'Add Fireball': button(() =>
          setFireballInstances((prev) => [
            ...prev,
            makeFireballInst(offsetPosition(DEFAULT_FIREBALL_POSITION)),
          ])
        ),
        'Remove All Fireballs': button(() => setFireballInstances([])),
        ...fireballInstances.reduce((acc, instance, index) => {
          const { id } = instance;
          const onCfg = (key) => (value) =>
            setFireballInstances((prev) =>
              prev.map((item) =>
                item.id === id
                  ? { ...item, config: { ...item.config, [key]: value } }
                  : item
              )
            );
          const onInst = (key) => (value) =>
            setFireballInstances((prev) =>
              prev.map((item) =>
                item.id === id ? { ...item, [key]: value } : item
              )
            );

          acc[`Fireball ${index + 1}`] = folder(
            {
              [`fb_pos_${id}`]: {
                label: 'Position',
                value: instance.pos,
                step: 0.1,
                onChange: onInst('pos'),
              },
              [`fb_rot_${id}`]: {
                label: 'Rotation',
                value: instance.rot,
                step: 0.05,
                onChange: onInst('rot'),
              },
              [`fb_scale_${id}`]: {
                label: 'Scale',
                value: instance.scale,
                min: 0.01,
                max: 10,
                step: 0.1,
                onChange: onInst('scale'),
              },
              'FB Appearance': folder(
                {
                  [`fb_radius_${id}`]: {
                    label: 'Radius',
                    value: instance.config.radius,
                    min: 0.05,
                    max: 5,
                    step: 0.05,
                    onChange: onCfg('radius'),
                  },
                  [`fb_detail_${id}`]: {
                    label: 'Detail',
                    value: instance.config.detail,
                    min: 1,
                    max: 7,
                    step: 1,
                    onChange: onCfg('detail'),
                  },
                  [`fb_speed_${id}`]: {
                    label: 'Speed',
                    value: instance.config.speed,
                    min: 0,
                    max: 5,
                    step: 0.05,
                    onChange: onCfg('speed'),
                  },
                  [`fb_weight_${id}`]: {
                    label: 'Weight',
                    value: instance.config.weight,
                    min: 0,
                    max: 3,
                    step: 0.05,
                    onChange: onCfg('weight'),
                  },
                  [`fb_noiseFreq_${id}`]: {
                    label: 'Noise Freq',
                    value: instance.config.noiseFreq,
                    min: 0.1,
                    max: 10,
                    step: 0.1,
                    onChange: onCfg('noiseFreq'),
                  },
                  [`fb_noiseAmp_${id}`]: {
                    label: 'Noise Amp',
                    value: instance.config.noiseAmp,
                    min: 0,
                    max: 1,
                    step: 0.01,
                    onChange: onCfg('noiseAmp'),
                  },
                  [`fb_animated_${id}`]: {
                    label: 'Animated',
                    value: instance.config.animated,
                    onChange: onCfg('animated'),
                  },
                },
                { collapsed: true }
              ),
              [`fb_delete_${id}`]: button(
                () =>
                  setFireballInstances((prev) =>
                    prev.filter((item) => item.id !== id)
                  ),
                { label: 'Delete Instance' }
              ),
            },
            { collapsed: true }
          );
          return acc;
        }, {}),
      };

      const flameSection = {
        'Add Flame': button(() =>
          setFlameInstances((prev) => [
            ...prev,
            makeFlameInst(offsetPosition(DEFAULT_FLAME_POSITION)),
          ])
        ),
        'Remove All Flames': button(() => setFlameInstances([])),
        ...flameInstances.reduce((acc, instance, index) => {
          const { id } = instance;
          const onCfg = (key) => (value) =>
            setFlameInstances((prev) =>
              prev.map((item) =>
                item.id === id
                  ? { ...item, config: { ...item.config, [key]: value } }
                  : item
              )
            );
          const onMotion = (key) => (value) =>
            setFlameInstances((prev) =>
              prev.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      config: {
                        ...item.config,
                        motion: { ...item.config.motion, [key]: value },
                      },
                    }
                  : item
              )
            );
          const onInst = (key) => (value) =>
            setFlameInstances((prev) =>
              prev.map((item) =>
                item.id === id ? { ...item, [key]: value } : item
              )
            );

          acc[`Flame ${index + 1}`] = folder(
            {
              [`fl_pos_${id}`]: {
                label: 'Position',
                value: instance.pos,
                step: 0.1,
                onChange: onInst('pos'),
              },
              [`fl_rot_${id}`]: {
                label: 'Rotation',
                value: instance.rot,
                step: 0.05,
                onChange: onInst('rot'),
              },
              [`fl_scale_${id}`]: {
                label: 'Scale',
                value: instance.scale,
                min: 0.01,
                max: 10,
                step: 0.1,
                onChange: onInst('scale'),
              },
              [`fl_inverted_${id}`]: {
                label: 'Inverted',
                value: instance.config.inverted,
                onChange: onCfg('inverted'),
              },
              'FL Motion': folder(
                {
                  [`fl_baseSpeed_${id}`]: {
                    label: 'Base Speed',
                    value: instance.config.motion.baseSpeed,
                    min: 0,
                    max: 5,
                    step: 0.05,
                    onChange: onMotion('baseSpeed'),
                  },
                  [`fl_minSpeed_${id}`]: {
                    label: 'Min Speed',
                    value: instance.config.motion.minSpeed,
                    min: 0,
                    max: 2,
                    step: 0.01,
                    onChange: onMotion('minSpeed'),
                  },
                  [`fl_slowFreq_${id}`]: {
                    label: 'Slow Freq',
                    value: instance.config.motion.slowFreq,
                    min: 0,
                    max: 5,
                    step: 0.1,
                    onChange: onMotion('slowFreq'),
                  },
                  [`fl_slowAmp_${id}`]: {
                    label: 'Slow Amp',
                    value: instance.config.motion.slowAmp,
                    min: 0,
                    max: 2,
                    step: 0.05,
                    onChange: onMotion('slowAmp'),
                  },
                  [`fl_fastFreq_${id}`]: {
                    label: 'Fast Freq',
                    value: instance.config.motion.fastFreq,
                    min: 0,
                    max: 10,
                    step: 0.1,
                    onChange: onMotion('fastFreq'),
                  },
                  [`fl_fastAmp_${id}`]: {
                    label: 'Fast Amp',
                    value: instance.config.motion.fastAmp,
                    min: 0,
                    max: 2,
                    step: 0.05,
                    onChange: onMotion('fastAmp'),
                  },
                  [`fl_microFreq_${id}`]: {
                    label: 'Micro Freq',
                    value: instance.config.motion.microFreq,
                    min: 0,
                    max: 20,
                    step: 0.1,
                    onChange: onMotion('microFreq'),
                  },
                  [`fl_microAmp_${id}`]: {
                    label: 'Micro Amp',
                    value: instance.config.motion.microAmp,
                    min: 0,
                    max: 1,
                    step: 0.01,
                    onChange: onMotion('microAmp'),
                  },
                  [`fl_swayX_${id}`]: {
                    label: 'Sway X',
                    value: instance.config.motion.swayX,
                    min: 0,
                    max: 0.2,
                    step: 0.001,
                    onChange: onMotion('swayX'),
                  },
                  [`fl_swayZ_${id}`]: {
                    label: 'Sway Z',
                    value: instance.config.motion.swayZ,
                    min: 0,
                    max: 0.2,
                    step: 0.001,
                    onChange: onMotion('swayZ'),
                  },
                  [`fl_pulseFreq_${id}`]: {
                    label: 'Pulse Freq',
                    value: instance.config.motion.pulseFreq,
                    min: 0,
                    max: 10,
                    step: 0.1,
                    onChange: onMotion('pulseFreq'),
                  },
                  [`fl_pulseAmp_${id}`]: {
                    label: 'Pulse Amp',
                    value: instance.config.motion.pulseAmp,
                    min: 0,
                    max: 0.5,
                    step: 0.01,
                    onChange: onMotion('pulseAmp'),
                  },
                  [`fl_scaleX_${id}`]: {
                    label: 'Scale X',
                    value: instance.config.motion.scaleX,
                    min: 0.1,
                    max: 5,
                    step: 0.1,
                    onChange: onMotion('scaleX'),
                  },
                  [`fl_scaleY_${id}`]: {
                    label: 'Scale Y',
                    value: instance.config.motion.scaleY,
                    min: 0.1,
                    max: 5,
                    step: 0.1,
                    onChange: onMotion('scaleY'),
                  },
                },
                { collapsed: true }
              ),
              [`fl_delete_${id}`]: button(
                () =>
                  setFlameInstances((prev) =>
                    prev.filter((item) => item.id !== id)
                  ),
                { label: 'Delete Instance' }
              ),
            },
            { collapsed: true }
          );
          return acc;
        }, {}),
      };

      const fireballVolumeSection = {
        'Add Fireball Volume': button(() =>
          setFireballVolumeInstances((prev) => [
            ...prev,
            makeFireballVolumeInst(
              offsetPosition(DEFAULT_FIREBALL_VOLUME_POSITION)
            ),
          ])
        ),
        'Remove All Fireball Volumes': button(() =>
          setFireballVolumeInstances([])
        ),
        ...fireballVolumeInstances.reduce((acc, instance, index) => {
          const { id } = instance;
          const onCfg = (key) => (value) =>
            setFireballVolumeInstances((prev) =>
              prev.map((item) =>
                item.id === id
                  ? { ...item, config: { ...item.config, [key]: value } }
                  : item
              )
            );
          const onInst = (key) => (value) =>
            setFireballVolumeInstances((prev) =>
              prev.map((item) =>
                item.id === id ? { ...item, [key]: value } : item
              )
            );

          acc[`Fireball Volume ${index + 1}`] = folder(
            {
              [`fv_pos_${id}`]: {
                label: 'Position',
                value: instance.pos,
                step: 0.1,
                onChange: onInst('pos'),
              },
              [`fv_rot_${id}`]: {
                label: 'Rotation',
                value: instance.rot,
                step: 0.05,
                onChange: onInst('rot'),
              },
              [`fv_scale_${id}`]: {
                label: 'Scale',
                value: instance.scale,
                min: 0.01,
                max: 10,
                step: 0.1,
                onChange: onInst('scale'),
              },
              'FV Appearance': folder(
                {
                  [`fv_radius_${id}`]: {
                    label: 'Radius',
                    value: instance.config.radius,
                    min: 0.05,
                    max: 5,
                    step: 0.05,
                    onChange: onCfg('radius'),
                  },
                  [`fv_rotSpeed_${id}`]: {
                    label: 'Rotation Speed',
                    value: instance.config.rotSpeed,
                    min: 0,
                    max: 2,
                    step: 0.01,
                    onChange: onCfg('rotSpeed'),
                  },
                  [`fv_noiseScale_${id}`]: {
                    label: 'Noise Scale',
                    value: instance.config.noiseScale,
                    min: 0.1,
                    max: 2,
                    step: 0.05,
                    onChange: onCfg('noiseScale'),
                  },
                  [`fv_density_${id}`]: {
                    label: 'Density',
                    value: instance.config.density,
                    min: 0,
                    max: 5,
                    step: 0.1,
                    onChange: onCfg('density'),
                  },
                  [`fv_steps_${id}`]: {
                    label: 'Steps',
                    value: instance.config.steps,
                    min: 8,
                    max: 128,
                    step: 8,
                    onChange: onCfg('steps'),
                  },
                },
                { collapsed: true }
              ),
              'FV Core': folder(
                {
                  [`fv_coreColor_${id}`]: {
                    label: 'Color',
                    value: instance.config.coreColor,
                    onChange: onCfg('coreColor'),
                  },
                  [`fv_coreIntensity_${id}`]: {
                    label: 'Intensity',
                    value: instance.config.coreIntensity,
                    min: 0,
                    max: 20,
                    step: 0.5,
                    onChange: onCfg('coreIntensity'),
                  },
                },
                { collapsed: true }
              ),
              'FV Edge': folder(
                {
                  [`fv_edgeColor_${id}`]: {
                    label: 'Color',
                    value: instance.config.edgeColor,
                    onChange: onCfg('edgeColor'),
                  },
                  [`fv_edgeIntensity_${id}`]: {
                    label: 'Intensity',
                    value: instance.config.edgeIntensity,
                    min: 0,
                    max: 10,
                    step: 0.1,
                    onChange: onCfg('edgeIntensity'),
                  },
                },
                { collapsed: true }
              ),
              [`fv_delete_${id}`]: button(
                () =>
                  setFireballVolumeInstances((prev) =>
                    prev.filter((item) => item.id !== id)
                  ),
                { label: 'Delete Instance' }
              ),
            },
            { collapsed: true }
          );
          return acc;
        }, {}),
      };

      return {
        Smoke: folder(
          {
            ...smokeSplineSections,
            'Smoke Ball': folder(smokeBallSection, { collapsed: true }),
          },
          { collapsed: false }
        ),
        Fire: folder(
          {
            ...fireSplineSections,
            Fireball: folder(fireballSection, { collapsed: true }),
            Flame: folder(flameSection, { collapsed: true }),
            'Fireball Volume': folder(fireballVolumeSection, {
              collapsed: true,
            }),
          },
          { collapsed: false }
        ),
      };
    },
    [
      preset,
      hotBoxSchemaVersion,
      splines.length,
      splineTypeSignature,
      smokeBallInstances.length,
      fireballInstances.length,
      flameInstances.length,
      fireballVolumeInstances.length,
    ]
  );

  useEffect(() => {
    selectedPresetRef.current = preset;
  }, [preset]);

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    applyPresetState(preset);
  }, [applyPresetState, preset]);

  useEffect(() => {
    setSplineConfigs((prev) => {
      if (prev.length === splines.length) return prev;
      return splines.map(
        (_, index) => prev[index] ?? { ...DEFAULT_SPLINE_CONFIG }
      );
    });
  }, [splines.length]);

  return {
    pointMode,
    bgColor,
    attractorStrength,
    attractorRadius,
    showAttractors,
    attractorMode,
    attractorVersion,
    forceAttractorUpdate,
    splineConfigs,
    smokeBallInstances,
    fireballInstances,
    flameInstances,
    fireballVolumeInstances,
  };
}