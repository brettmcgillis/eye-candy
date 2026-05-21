import { button, folder, useControls } from 'leva';
import * as THREE from 'three';

import { useCallback, useEffect, useRef, useState } from 'react';

import FIRE_PRESETS from '../../../../../../presets/fire/firePresets';
import SMOKE_PRESETS from '../../../../../../presets/smoke/smokePresets';
import { localEnv } from '../../../../../../utils/appUtils';
import {
  cloneFireAndSmokeControlPoints,
  makeFireAndSmokeConfig,
  makeFireAndSmokeFireConfig,
} from '../../../../../elements/fireAndSmoke/fireAndSmokeDefaults';
import buildFireAndSmokeControls from '../../shared/hooks/buildFireAndSmokeControls';
import buildSplineGroupControls from '../../shared/hooks/useSplineGroupControls';
import {
  DEFAULT_SPLINE_CONFIG,
  parsePreset,
  serializeSplines,
} from '../../shared/splineDefaults';

const SCENE_LABEL = 'Hot Box';
const SMOKE_FOLDER_PATH = `${SCENE_LABEL}.Smoke`;
const FIRE_FOLDER_PATH = `${SCENE_LABEL}.Fire`;
export const HOTBOX_DEFAULT_PRESET_KEY = Object.keys(FIRE_PRESETS)[0];
const DEFAULT_PRESET_KEY = HOTBOX_DEFAULT_PRESET_KEY;
const DEFAULT_SMOKE_PRESET_KEY = Object.keys(SMOKE_PRESETS)[0];
const MAX_ATTRACTORS = 8;
const SMOKE_SPLINE_TYPE_ORDER = ['Particle', 'Volumetric'];
const SMOKE_SPLINE_TYPE_LABELS = {
  Particle: 'Particle Smoke',
  Volumetric: 'Volumetric Smoke',
};
const FIRE_SPLINE_TYPE_ORDER = ['Classic', 'RayMarch'];
const FIRE_SPLINE_TYPE_LABELS = {
  Classic: 'Classic Fire',
  RayMarch: 'RayMarch Fire',
};

const getFirePreset = (presetKey) =>
  FIRE_PRESETS[presetKey] ?? FIRE_PRESETS[DEFAULT_PRESET_KEY];

const getSmokePreset = (presetKey) =>
  SMOKE_PRESETS[presetKey] ?? SMOKE_PRESETS[DEFAULT_SMOKE_PRESET_KEY];

const isSmokeSpline = (spline) =>
  spline?.type === 'Smoke' ||
  spline?.type === 'Particle' ||
  spline?.type === 'Volumetric';

const isFireSpline = (spline) => spline?.type === 'Fire';

export const getHotBoxPreset = (presetKey) => {
  const firePreset = getFirePreset(presetKey);

  if (presetKey !== DEFAULT_PRESET_KEY) {
    return firePreset;
  }

  const smokePreset = getSmokePreset(DEFAULT_SMOKE_PRESET_KEY);

  return {
    splines: [
      ...(smokePreset.splines ?? []).filter(isSmokeSpline),
      ...(firePreset.splines ?? []).filter(isFireSpline),
    ],
    elements: {
      smokeBall: smokePreset.elements?.smokeBall ?? [],
      smokeBallSpline: smokePreset.elements?.smokeBallSpline ?? [],
      billboardSmoke: smokePreset.elements?.billboardSmoke ?? [],
      fireball: firePreset.elements?.fireball ?? [],
      fireSpline: firePreset.elements?.fireSpline ?? [],
      flame: firePreset.elements?.flame ?? [],
      volumetricFire: firePreset.elements?.volumetricFire ?? [],
      cs184Fire: firePreset.elements?.cs184Fire ?? [],
      fireAndSmoke: [
        ...(smokePreset.elements?.fireAndSmoke ?? []),
        ...(firePreset.elements?.fireAndSmoke ?? []),
      ],
    },
    attractors: smokePreset.attractors ?? [],
  };
};

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
const DEFAULT_SMOKE_BALL_SPLINE_POSITION = [0, 0, 0];
const DEFAULT_BILLBOARD_SMOKE_POSITION = [-3, 0, 0];
const DEFAULT_FIREBALL_POSITION = [3, 1, 0];
const DEFAULT_FIRE_SPLINE_POSITION = [0, 0, 0];
const DEFAULT_FLAME_POSITION = [5, 0, 0];
const DEFAULT_VOLUMETRIC_FIRE_POSITION = [3, 0, 0];
const DEFAULT_CS184_FIRE_POSITION = [-3, 0, 0];
const DEFAULT_FIRE_AND_SMOKE_POSITION = [7, 0, 3];

const DEFAULT_SMOKE_BALL_SPLINE_POINTS = [
  {
    position: new THREE.Vector3(-7, 0, 0),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1.0, 1.0, 1.0),
  },
  {
    position: new THREE.Vector3(-7, 0.9, 0),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(0.9, 0.9, 0.9),
  },
  {
    position: new THREE.Vector3(-6.85, 1.8, 0),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1.0, 1.0, 1.0),
  },
  {
    position: new THREE.Vector3(-6.75, 2.7, 0.1),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1.3, 1.3, 1.3),
  },
  {
    position: new THREE.Vector3(-6.65, 3.6, 0.15),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1.6, 1.6, 1.6),
  },
  {
    position: new THREE.Vector3(-6.55, 4.5, 0.2),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(2.0, 2.0, 2.0),
  },
];

const DEFAULT_FIRE_SPLINE_POINTS = [
  {
    position: new THREE.Vector3(-2, 0, 0),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1.0, 1.0, 1.0),
  },
  {
    position: new THREE.Vector3(-2, 0.9, 0),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(0.9, 0.9, 0.9),
  },
  {
    position: new THREE.Vector3(-1.85, 1.8, 0),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1.0, 1.0, 1.0),
  },
  {
    position: new THREE.Vector3(-1.75, 2.7, 0.1),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1.3, 1.3, 1.3),
  },
  {
    position: new THREE.Vector3(-1.65, 3.6, 0.15),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1.6, 1.6, 1.6),
  },
  {
    position: new THREE.Vector3(-1.55, 4.5, 0.2),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(2.0, 2.0, 2.0),
  },
];

const offsetPosition = (base, spread = [4, 3, 4]) => [
  base[0] + (Math.random() - 0.5) * spread[0],
  base[1] + Math.random() * spread[1],
  base[2] + (Math.random() - 0.5) * spread[2],
];

const cloneTuple = (value, fallback) =>
  Array.isArray(value) ? [...value] : [...fallback];

const cloneAttractors = (attractors = []) =>
  attractors.map((attractor) => ({
    position: cloneTuple(attractor.position, [0, 0, 0]),
    direction: cloneTuple(attractor.direction, [0, 1, 0]),
    rotation: cloneTuple(attractor.rotation, [0, 0, 0]),
  }));

const getPresetAttractors = (presetKey) =>
  cloneAttractors(getHotBoxPreset(presetKey)?.attractors ?? []);

const cloneControlPoints = (points) =>
  points.map((point) => ({
    position: point.position.clone(),
    rotation: (point.rotation ?? new THREE.Euler()).clone(),
    scale: (point.scale ?? new THREE.Vector3(1, 1, 1)).clone(),
  }));

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

const mkSmokeBallSplineCfg = () => ({
  baseRadius: 0.6,
  tubularSegments: 64,
  radialSegments: 32,
  capSegments: 8,
  speed: 1.0,
  weight: 0.3,
  noiseFreq: 2.0,
  noiseAmp: 0.15,
  animated: true,
  smokeLightColor: '#bcbcbc',
  smokeDarkColor: '#262626',
});

const mkBillboardSmokeCfg = () => ({
  inverted: false,
  width: 1.5,
  height: 6.0,
  color: '#b8b8b8',
  opacity: 1.0,
  timeFrequency: 0.45,
  uvFrequencyX: 1.0,
  uvFrequencyY: 1.5,
  riseSpeed: 0.35,
  spreadStrength: 0.18,
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

const mkFireSplineCfg = () => ({
  baseRadius: 0.6,
  tubularSegments: 64,
  radialSegments: 32,
  capSegments: 8,
  speed: 1.0,
  weight: 0.3,
  noiseFreq: 2.0,
  noiseAmp: 0.15,
  animated: true,
  smokeLightColor: '#4a4a58',
  smokeDarkColor: '#1a1a22',
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

const mkVolumetricFireCfg = () => ({
  width: 0.8,
  height: 2.0,
  depth: 0.8,
  sliceSpacing: 0.04,
  bendX: 0,
  bendZ: 0,
  animated: true,
  animSpeed: 0.5,
  showSpline: false,
  showVolume: false,
  magnitude: 1.3,
  lacunarity: 2.0,
  gain: 0.5,
  tintColor: '#ffffff',
  saturation: 1.0,
  brightness: 1.5,
});

const mkCs184FireCfg = () => ({
  width: 0.5,
  height: 1.5,
  depth: 0.5,
  bendX: 0,
  bendZ: 0,
  animated: true,
  animSpeed: 0.5,
  magnitude: 1.3,
  lacunarity: 2.0,
  gain: 0.5,
  speed: 0.8,
  density: 1.2,
  brightness: 1.8,
  saturation: 1.0,
  tintColor: '#ffffff',
  coreColor: '#ffffcc',
  borderColor: '#ff6600',
  smokeColor: '#330000',
  emberDensity: 0.15,
  emberSize: 0.25,
  emberColor: '#ff4400',
  steps: 64,
  stepSize: 1.0,
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

const hydrateSmokeBallInst = (seed = {}) => ({
  id: mkId(),
  pos: cloneTuple(seed.pos, DEFAULT_SMOKEBALL_POSITION),
  rot: cloneTuple(seed.rot, [0, 0, 0]),
  scale: cloneTuple(seed.scale, [1, 1, 1]),
  config: { ...mkSmokeBallCfg(), ...(seed.config ?? {}) },
});

const makeSmokeBallSplineInst = (pos = DEFAULT_SMOKE_BALL_SPLINE_POSITION) => ({
  id: mkId(),
  pos: [...pos],
  rot: [0, 0, 0],
  scale: [1, 1, 1],
  showHandles: true,
  pointMode: 'translate',
  controlPoints: cloneControlPoints(DEFAULT_SMOKE_BALL_SPLINE_POINTS),
  config: mkSmokeBallSplineCfg(),
});

const hydrateSmokeBallSplineInst = (seed = {}) => ({
  id: mkId(),
  pos: cloneTuple(seed.pos, DEFAULT_SMOKE_BALL_SPLINE_POSITION),
  rot: cloneTuple(seed.rot, [0, 0, 0]),
  scale: cloneTuple(seed.scale, [1, 1, 1]),
  showHandles: seed.showHandles ?? true,
  pointMode: seed.pointMode ?? 'translate',
  controlPoints: cloneControlPoints(
    seed.controlPoints ?? DEFAULT_SMOKE_BALL_SPLINE_POINTS
  ),
  config: { ...mkSmokeBallSplineCfg(), ...(seed.config ?? {}) },
});

const makeBillboardSmokeInst = (pos = DEFAULT_BILLBOARD_SMOKE_POSITION) => ({
  id: mkId(),
  pos: [...pos],
  config: mkBillboardSmokeCfg(),
});

const hydrateBillboardSmokeInst = (seed = {}) => ({
  id: mkId(),
  pos: cloneTuple(seed.pos, DEFAULT_BILLBOARD_SMOKE_POSITION),
  config: { ...mkBillboardSmokeCfg(), ...(seed.config ?? {}) },
});

const makeFireballInst = (pos = DEFAULT_FIREBALL_POSITION) => ({
  id: mkId(),
  pos: [...pos],
  rot: [0, 0, 0],
  scale: [1, 1, 1],
  config: mkFireballCfg(),
});

const hydrateFireballInst = (seed = {}) => ({
  id: mkId(),
  pos: cloneTuple(seed.pos, DEFAULT_FIREBALL_POSITION),
  rot: cloneTuple(seed.rot, [0, 0, 0]),
  scale: cloneTuple(seed.scale, [1, 1, 1]),
  config: { ...mkFireballCfg(), ...(seed.config ?? {}) },
});

const makeFireSplineInst = (pos = DEFAULT_FIRE_SPLINE_POSITION) => ({
  id: mkId(),
  pos: [...pos],
  rot: [0, 0, 0],
  scale: [1, 1, 1],
  showHandles: true,
  showSpline: true,
  pointMode: 'translate',
  controlPoints: cloneControlPoints(DEFAULT_FIRE_SPLINE_POINTS),
  config: mkFireSplineCfg(),
});

const hydrateFireSplineInst = (seed = {}) => ({
  id: mkId(),
  pos: cloneTuple(seed.pos, DEFAULT_FIRE_SPLINE_POSITION),
  rot: cloneTuple(seed.rot, [0, 0, 0]),
  scale: cloneTuple(seed.scale, [1, 1, 1]),
  showHandles: seed.showHandles ?? true,
  showSpline: seed.showSpline ?? true,
  pointMode: seed.pointMode ?? 'translate',
  controlPoints: cloneControlPoints(
    seed.controlPoints ?? DEFAULT_FIRE_SPLINE_POINTS
  ),
  config: { ...mkFireSplineCfg(), ...(seed.config ?? {}) },
});

const makeFlameInst = (pos = DEFAULT_FLAME_POSITION) => ({
  id: mkId(),
  pos: [...pos],
  rot: [0, 0, 0],
  scale: [1.2, 1.2, 1.2],
  config: mkFlameCfg(),
});

const hydrateFlameInst = (seed = {}) => ({
  id: mkId(),
  pos: cloneTuple(seed.pos, DEFAULT_FLAME_POSITION),
  rot: cloneTuple(seed.rot, [0, 0, 0]),
  scale: cloneTuple(seed.scale, [1.2, 1.2, 1.2]),
  config: {
    ...mkFlameCfg(),
    ...(seed.config ?? {}),
    motion: {
      ...mkFlameCfg().motion,
      ...(seed.config?.motion ?? {}),
    },
  },
});

const makeVolumetricFireInst = (pos = DEFAULT_VOLUMETRIC_FIRE_POSITION) => ({
  id: mkId(),
  pos: [...pos],
  rot: [0, 0, 0],
  scale: [1, 1, 1],
  config: mkVolumetricFireCfg(),
});

const hydrateVolumetricFireInst = (seed = {}) => ({
  id: mkId(),
  pos: cloneTuple(seed.pos, DEFAULT_VOLUMETRIC_FIRE_POSITION),
  rot: cloneTuple(seed.rot, [0, 0, 0]),
  scale: cloneTuple(seed.scale, [1, 1, 1]),
  config: { ...mkVolumetricFireCfg(), ...(seed.config ?? {}) },
});

const makeCs184FireInst = (pos = DEFAULT_CS184_FIRE_POSITION) => ({
  id: mkId(),
  pos: [...pos],
  rot: [0, 0, 0],
  scale: [1, 1, 1],
  config: mkCs184FireCfg(),
});

const hydrateCs184FireInst = (seed = {}) => ({
  id: mkId(),
  pos: cloneTuple(seed.pos, DEFAULT_CS184_FIRE_POSITION),
  rot: cloneTuple(seed.rot, [0, 0, 0]),
  scale: cloneTuple(seed.scale, [1, 1, 1]),
  config: { ...mkCs184FireCfg(), ...(seed.config ?? {}) },
});

const makeFireAndSmokeInst = (seed = {}) => ({
  id: mkId(),
  pos: cloneTuple(seed.pos, DEFAULT_FIRE_AND_SMOKE_POSITION),
  rot: cloneTuple(seed.rot, [0, 0, 0]),
  scale: cloneTuple(seed.scale, [1, 1, 1]),
  showHandles: seed.showHandles ?? true,
  showSpline: seed.showSpline ?? true,
  pointMode: seed.pointMode ?? 'translate',
  controlPoints: cloneFireAndSmokeControlPoints(seed.controlPoints),
  config: makeFireAndSmokeFireConfig(seed.config ?? {}),
});

const hydrateFireAndSmokeInst = (seed = {}) => ({
  id: mkId(),
  pos: cloneTuple(seed.pos, DEFAULT_FIRE_AND_SMOKE_POSITION),
  rot: cloneTuple(seed.rot, [0, 0, 0]),
  scale: cloneTuple(seed.scale, [1, 1, 1]),
  showHandles: seed.showHandles ?? true,
  showSpline: seed.showSpline ?? true,
  pointMode: seed.pointMode ?? 'translate',
  controlPoints: cloneFireAndSmokeControlPoints(seed.controlPoints),
  config: makeFireAndSmokeConfig(seed.config ?? {}),
});

function getStandaloneDefaults(presetKey) {
  const elements = getHotBoxPreset(presetKey)?.elements ?? {};

  return {
    smokeBall: (elements.smokeBall ?? []).map(hydrateSmokeBallInst),
    smokeBallSpline: (elements.smokeBallSpline ?? []).map(
      hydrateSmokeBallSplineInst
    ),
    billboardSmoke: (elements.billboardSmoke ?? []).map(
      hydrateBillboardSmokeInst
    ),
    fireball: (elements.fireball ?? []).map(hydrateFireballInst),
    fireSpline: (elements.fireSpline ?? []).map(hydrateFireSplineInst),
    flame: (elements.flame ?? []).map(hydrateFlameInst),
    volumetricFire: (elements.volumetricFire ?? []).map(
      hydrateVolumetricFireInst
    ),
    cs184Fire: (elements.cs184Fire ?? []).map(hydrateCs184FireInst),
    fireAndSmoke: (elements.fireAndSmoke ?? []).map(hydrateFireAndSmokeInst),
  };
}

export default function useHotBoxControls(splines, setSplines, attractorsRef) {
  const selectedPresetRef = useRef(DEFAULT_PRESET_KEY);
  const splinesRef = useRef(splines);
  splinesRef.current = splines;

  const initialStandaloneDefaultsRef = useRef(null);
  if (!initialStandaloneDefaultsRef.current) {
    initialStandaloneDefaultsRef.current =
      getStandaloneDefaults(DEFAULT_PRESET_KEY);
  }

  const [splineConfigs, setSplineConfigs] = useState(() => {
    const { splineConfigs: initial } = parsePreset(
      getHotBoxPreset(DEFAULT_PRESET_KEY)
    );
    return initial;
  });
  const splineConfigsRef = useRef(splineConfigs);
  splineConfigsRef.current = splineConfigs;

  const [smokeBallInstances, setSmokeBallInstances] = useState(
    () => initialStandaloneDefaultsRef.current.smokeBall
  );
  const [smokeBallSplineInstances, setSmokeBallSplineInstances] = useState(
    () => initialStandaloneDefaultsRef.current.smokeBallSpline
  );
  const [billboardSmokeInstances, setBillboardSmokeInstances] = useState(
    () => initialStandaloneDefaultsRef.current.billboardSmoke
  );
  const [fireballInstances, setFireballInstances] = useState(
    () => initialStandaloneDefaultsRef.current.fireball
  );
  const [fireSplineInstances, setFireSplineInstances] = useState(
    () => initialStandaloneDefaultsRef.current.fireSpline
  );
  const [flameInstances, setFlameInstances] = useState(
    () => initialStandaloneDefaultsRef.current.flame
  );
  const [volumetricFireInstances, setVolumetricFireInstances] = useState(
    () => initialStandaloneDefaultsRef.current.volumetricFire
  );
  const [cs184FireInstances, setCs184FireInstances] = useState(
    () => initialStandaloneDefaultsRef.current.cs184Fire
  );
  const [fireAndSmokeInstances, setFireAndSmokeInstances] = useState(
    () => initialStandaloneDefaultsRef.current.fireAndSmoke
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
      const { splines: nextSplines, splineConfigs: nextConfigs } = parsePreset(
        getHotBoxPreset(presetKey)
      );
      setSplines(nextSplines);
      setSplineConfigs(nextConfigs);

      const defaults = getStandaloneDefaults(presetKey);
      setSmokeBallInstances(defaults.smokeBall);
      setSmokeBallSplineInstances(defaults.smokeBallSpline);
      setBillboardSmokeInstances(defaults.billboardSmoke);
      setFireballInstances(defaults.fireball);
      setFireSplineInstances(defaults.fireSpline);
      setFlameInstances(defaults.flame);
      setVolumetricFireInstances(defaults.volumetricFire);
      setCs184FireInstances(defaults.cs184Fire);
      setFireAndSmokeInstances(defaults.fireAndSmoke);
      attractorsRef.current = getPresetAttractors(presetKey);
      setAttractorVersion((count) => count + 1);
      setHotBoxSchemaVersion((count) => count + 1);
    },
    [attractorsRef, setSplines]
  );

  const setSmokeBallSplinePoints = useCallback((id, updater) => {
    setSmokeBallSplineInstances((prev) =>
      prev.map((instance) => {
        if (instance.id !== id) return instance;
        return {
          ...instance,
          controlPoints:
            typeof updater === 'function'
              ? updater(instance.controlPoints)
              : updater,
        };
      })
    );
  }, []);

  const setFireSplinePoints = useCallback((id, updater) => {
    setFireSplineInstances((prev) =>
      prev.map((instance) => {
        if (instance.id !== id) return instance;
        return {
          ...instance,
          controlPoints:
            typeof updater === 'function'
              ? updater(instance.controlPoints)
              : updater,
        };
      })
    );
  }, []);

  const setFireAndSmokePoints = useCallback((id, updater) => {
    setFireAndSmokeInstances((prev) =>
      prev.map((instance) => {
        if (instance.id !== id) return instance;
        return {
          ...instance,
          controlPoints:
            typeof updater === 'function'
              ? updater(instance.controlPoints)
              : updater,
        };
      })
    );
  }, []);

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
            label: 'Default Strength',
            value: 3,
            min: 0,
            max: 50,
            step: 0.5,
          },
          attractorRadius: {
            label: 'Default Radius',
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

  useControls(SCENE_LABEL, () => {
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
              (config?.fireType ?? DEFAULT_SPLINE_CONFIG.fireType) === fireType
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
          { collapsed: true }
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
          { collapsed: true }
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

    const smokeBallSplineSection = {
      'Add Smoke Ball Spline': button(() =>
        setSmokeBallSplineInstances((prev) => [
          ...prev,
          makeSmokeBallSplineInst(
            offsetPosition(DEFAULT_SMOKE_BALL_SPLINE_POSITION)
          ),
        ])
      ),
      'Remove All Smoke Ball Splines': button(() =>
        setSmokeBallSplineInstances([])
      ),
      ...smokeBallSplineInstances.reduce((acc, instance, index) => {
        const { id } = instance;
        const onCfg = (key) => (value) =>
          setSmokeBallSplineInstances((prev) =>
            prev.map((item) =>
              item.id === id
                ? { ...item, config: { ...item.config, [key]: value } }
                : item
            )
          );
        const onInst = (key) => (value) =>
          setSmokeBallSplineInstances((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, [key]: value } : item
            )
          );

        acc[`Smoke Ball Spline ${index + 1}`] = folder(
          {
            [`ss_pos_${id}`]: {
              label: 'Position',
              value: instance.pos,
              step: 0.1,
              onChange: onInst('pos'),
            },
            [`ss_rot_${id}`]: {
              label: 'Rotation',
              value: instance.rot,
              step: 0.05,
              onChange: onInst('rot'),
            },
            [`ss_scale_${id}`]: {
              label: 'Scale',
              value: instance.scale,
              min: 0.01,
              max: 10,
              step: 0.1,
              onChange: onInst('scale'),
            },
            'SS Spline Editor': folder(
              {
                [`ss_handles_${id}`]: {
                  label: 'Show Handles',
                  value: instance.showHandles,
                  onChange: onInst('showHandles'),
                },
                [`ss_pointMode_${id}`]: {
                  label: 'Transform',
                  value: instance.pointMode,
                  options: ['translate', 'scale'],
                  onChange: onInst('pointMode'),
                },
              },
              { collapsed: true }
            ),
            'SS Appearance': folder(
              {
                [`ss_baseRadius_${id}`]: {
                  label: 'Base Radius',
                  value: instance.config.baseRadius,
                  min: 0.05,
                  max: 5,
                  step: 0.05,
                  onChange: onCfg('baseRadius'),
                },
                [`ss_tubular_${id}`]: {
                  label: 'Tubular Segs',
                  value: instance.config.tubularSegments,
                  min: 8,
                  max: 128,
                  step: 1,
                  onChange: onCfg('tubularSegments'),
                },
                [`ss_radial_${id}`]: {
                  label: 'Radial Segs',
                  value: instance.config.radialSegments,
                  min: 8,
                  max: 64,
                  step: 1,
                  onChange: onCfg('radialSegments'),
                },
                [`ss_cap_${id}`]: {
                  label: 'Cap Segs',
                  value: instance.config.capSegments,
                  min: 2,
                  max: 16,
                  step: 1,
                  onChange: onCfg('capSegments'),
                },
                [`ss_speed_${id}`]: {
                  label: 'Speed',
                  value: instance.config.speed,
                  min: 0,
                  max: 5,
                  step: 0.05,
                  onChange: onCfg('speed'),
                },
                [`ss_weight_${id}`]: {
                  label: 'Weight',
                  value: instance.config.weight,
                  min: 0,
                  max: 3,
                  step: 0.05,
                  onChange: onCfg('weight'),
                },
                [`ss_noiseFreq_${id}`]: {
                  label: 'Noise Freq',
                  value: instance.config.noiseFreq,
                  min: 0.1,
                  max: 10,
                  step: 0.1,
                  onChange: onCfg('noiseFreq'),
                },
                [`ss_noiseAmp_${id}`]: {
                  label: 'Noise Amp',
                  value: instance.config.noiseAmp,
                  min: 0,
                  max: 1,
                  step: 0.01,
                  onChange: onCfg('noiseAmp'),
                },
                [`ss_animated_${id}`]: {
                  label: 'Animated',
                  value: instance.config.animated,
                  onChange: onCfg('animated'),
                },
                [`ss_light_${id}`]: {
                  label: 'Light',
                  value: instance.config.smokeLightColor,
                  onChange: onCfg('smokeLightColor'),
                },
                [`ss_dark_${id}`]: {
                  label: 'Dark',
                  value: instance.config.smokeDarkColor,
                  onChange: onCfg('smokeDarkColor'),
                },
              },
              { collapsed: true }
            ),
            [`ss_delete_${id}`]: button(
              () =>
                setSmokeBallSplineInstances((prev) =>
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

    const billboardSmokeSection = {
      'Add Billboard Smoke': button(() =>
        setBillboardSmokeInstances((prev) => [
          ...prev,
          makeBillboardSmokeInst(
            offsetPosition(DEFAULT_BILLBOARD_SMOKE_POSITION)
          ),
        ])
      ),
      'Remove All Billboard Smoke': button(() =>
        setBillboardSmokeInstances([])
      ),
      ...billboardSmokeInstances.reduce((acc, instance, index) => {
        const { id } = instance;
        const onCfg = (key) => (value) =>
          setBillboardSmokeInstances((prev) =>
            prev.map((item) =>
              item.id === id
                ? { ...item, config: { ...item.config, [key]: value } }
                : item
            )
          );
        const onInst = (key) => (value) =>
          setBillboardSmokeInstances((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, [key]: value } : item
            )
          );

        acc[`Billboard ${index + 1}`] = folder(
          {
            [`s2d_pos_${id}`]: {
              label: 'Position',
              value: instance.pos,
              step: 0.1,
              onChange: onInst('pos'),
            },
            'S2D Appearance': folder(
              {
                [`s2d_inverted_${id}`]: {
                  label: 'Inverted',
                  value: instance.config.inverted,
                  onChange: onCfg('inverted'),
                },
                [`s2d_width_${id}`]: {
                  label: 'Width',
                  value: instance.config.width,
                  min: 0.05,
                  max: 5,
                  step: 0.05,
                  onChange: onCfg('width'),
                },
                [`s2d_height_${id}`]: {
                  label: 'Height',
                  value: instance.config.height,
                  min: 0.1,
                  max: 15,
                  step: 0.1,
                  onChange: onCfg('height'),
                },
                [`s2d_color_${id}`]: {
                  label: 'Color',
                  value: instance.config.color,
                  onChange: onCfg('color'),
                },
                [`s2d_opacity_${id}`]: {
                  label: 'Opacity',
                  value: instance.config.opacity,
                  min: 0,
                  max: 1,
                  step: 0.01,
                  onChange: onCfg('opacity'),
                },
                [`s2d_timeFreq_${id}`]: {
                  label: 'Time Freq',
                  value: instance.config.timeFrequency,
                  min: 0,
                  max: 3,
                  step: 0.01,
                  onChange: onCfg('timeFrequency'),
                },
                [`s2d_uvFreqX_${id}`]: {
                  label: 'UV Freq X',
                  value: instance.config.uvFrequencyX,
                  min: 0.1,
                  max: 5,
                  step: 0.05,
                  onChange: onCfg('uvFrequencyX'),
                },
                [`s2d_uvFreqY_${id}`]: {
                  label: 'UV Freq Y',
                  value: instance.config.uvFrequencyY,
                  min: 0.1,
                  max: 5,
                  step: 0.05,
                  onChange: onCfg('uvFrequencyY'),
                },
                [`s2d_riseSpeed_${id}`]: {
                  label: 'Rise Speed',
                  value: instance.config.riseSpeed,
                  min: 0,
                  max: 2,
                  step: 0.01,
                  onChange: onCfg('riseSpeed'),
                },
                [`s2d_spread_${id}`]: {
                  label: 'Spread',
                  value: instance.config.spreadStrength,
                  min: 0,
                  max: 1,
                  step: 0.01,
                  onChange: onCfg('spreadStrength'),
                },
              },
              { collapsed: true }
            ),
            [`s2d_delete_${id}`]: button(
              () =>
                setBillboardSmokeInstances((prev) =>
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

    const fireSplineSection = {
      'Add Fire Spline': button(() =>
        setFireSplineInstances((prev) => [
          ...prev,
          makeFireSplineInst(offsetPosition(DEFAULT_FIRE_SPLINE_POSITION)),
        ])
      ),
      'Remove All Fire Splines': button(() => setFireSplineInstances([])),
      ...fireSplineInstances.reduce((acc, instance, index) => {
        const { id } = instance;
        const onCfg = (key) => (value) =>
          setFireSplineInstances((prev) =>
            prev.map((item) =>
              item.id === id
                ? { ...item, config: { ...item.config, [key]: value } }
                : item
            )
          );
        const onInst = (key) => (value) =>
          setFireSplineInstances((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, [key]: value } : item
            )
          );

        acc[`Fire Spline ${index + 1}`] = folder(
          {
            [`fs_pos_${id}`]: {
              label: 'Position',
              value: instance.pos,
              step: 0.1,
              onChange: onInst('pos'),
            },
            [`fs_rot_${id}`]: {
              label: 'Rotation',
              value: instance.rot,
              step: 0.05,
              onChange: onInst('rot'),
            },
            [`fs_scale_${id}`]: {
              label: 'Scale',
              value: instance.scale,
              min: 0.01,
              max: 10,
              step: 0.1,
              onChange: onInst('scale'),
            },
            'FS Spline Editor': folder(
              {
                [`fs_handles_${id}`]: {
                  label: 'Show Handles',
                  value: instance.showHandles,
                  onChange: onInst('showHandles'),
                },
                [`fs_showSpline_${id}`]: {
                  label: 'Show Curve',
                  value: instance.showSpline,
                  onChange: onInst('showSpline'),
                },
                [`fs_pointMode_${id}`]: {
                  label: 'Transform',
                  value: instance.pointMode,
                  options: ['translate', 'scale'],
                  onChange: onInst('pointMode'),
                },
              },
              { collapsed: true }
            ),
            'FS Appearance': folder(
              {
                [`fs_baseRadius_${id}`]: {
                  label: 'Base Radius',
                  value: instance.config.baseRadius,
                  min: 0.05,
                  max: 5,
                  step: 0.05,
                  onChange: onCfg('baseRadius'),
                },
                [`fs_tubular_${id}`]: {
                  label: 'Tubular Segs',
                  value: instance.config.tubularSegments,
                  min: 8,
                  max: 128,
                  step: 1,
                  onChange: onCfg('tubularSegments'),
                },
                [`fs_radial_${id}`]: {
                  label: 'Radial Segs',
                  value: instance.config.radialSegments,
                  min: 8,
                  max: 64,
                  step: 1,
                  onChange: onCfg('radialSegments'),
                },
                [`fs_cap_${id}`]: {
                  label: 'Cap Segs',
                  value: instance.config.capSegments,
                  min: 2,
                  max: 16,
                  step: 1,
                  onChange: onCfg('capSegments'),
                },
                [`fs_speed_${id}`]: {
                  label: 'Speed',
                  value: instance.config.speed,
                  min: 0,
                  max: 5,
                  step: 0.05,
                  onChange: onCfg('speed'),
                },
                [`fs_weight_${id}`]: {
                  label: 'Weight',
                  value: instance.config.weight,
                  min: 0,
                  max: 3,
                  step: 0.05,
                  onChange: onCfg('weight'),
                },
                [`fs_noiseFreq_${id}`]: {
                  label: 'Noise Freq',
                  value: instance.config.noiseFreq,
                  min: 0.1,
                  max: 10,
                  step: 0.1,
                  onChange: onCfg('noiseFreq'),
                },
                [`fs_noiseAmp_${id}`]: {
                  label: 'Noise Amp',
                  value: instance.config.noiseAmp,
                  min: 0,
                  max: 1,
                  step: 0.01,
                  onChange: onCfg('noiseAmp'),
                },
                [`fs_animated_${id}`]: {
                  label: 'Animated',
                  value: instance.config.animated,
                  onChange: onCfg('animated'),
                },
                [`fs_light_${id}`]: {
                  label: 'Light',
                  value: instance.config.smokeLightColor,
                  onChange: onCfg('smokeLightColor'),
                },
                [`fs_dark_${id}`]: {
                  label: 'Dark',
                  value: instance.config.smokeDarkColor,
                  onChange: onCfg('smokeDarkColor'),
                },
              },
              { collapsed: true }
            ),
            [`fs_delete_${id}`]: button(
              () =>
                setFireSplineInstances((prev) =>
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

    const volumetricFireSection = {
      'Add Volumetric Fire': button(() =>
        setVolumetricFireInstances((prev) => [
          ...prev,
          makeVolumetricFireInst(
            offsetPosition(DEFAULT_VOLUMETRIC_FIRE_POSITION)
          ),
        ])
      ),
      'Remove All Volumetric Fire': button(() =>
        setVolumetricFireInstances([])
      ),
      ...volumetricFireInstances.reduce((acc, instance, index) => {
        const { id } = instance;
        const onCfg = (key) => (value) =>
          setVolumetricFireInstances((prev) =>
            prev.map((item) =>
              item.id === id
                ? { ...item, config: { ...item.config, [key]: value } }
                : item
            )
          );
        const onInst = (key) => (value) =>
          setVolumetricFireInstances((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, [key]: value } : item
            )
          );

        acc[`Volumetric Fire ${index + 1}`] = folder(
          {
            [`vf_pos_${id}`]: {
              label: 'Position',
              value: instance.pos,
              step: 0.1,
              onChange: onInst('pos'),
            },
            [`vf_rot_${id}`]: {
              label: 'Rotation',
              value: instance.rot,
              step: 0.05,
              onChange: onInst('rot'),
            },
            [`vf_scale_${id}`]: {
              label: 'Scale',
              value: instance.scale,
              min: 0.01,
              max: 10,
              step: 0.1,
              onChange: onInst('scale'),
            },
            'VF Volume': folder(
              {
                [`vf_width_${id}`]: {
                  label: 'Width',
                  value: instance.config.width,
                  min: 0.1,
                  max: 5,
                  step: 0.05,
                  onChange: onCfg('width'),
                },
                [`vf_height_${id}`]: {
                  label: 'Height',
                  value: instance.config.height,
                  min: 0.2,
                  max: 10,
                  step: 0.1,
                  onChange: onCfg('height'),
                },
                [`vf_depth_${id}`]: {
                  label: 'Depth',
                  value: instance.config.depth,
                  min: 0.1,
                  max: 5,
                  step: 0.05,
                  onChange: onCfg('depth'),
                },
                [`vf_sliceSpacing_${id}`]: {
                  label: 'Slice Spacing',
                  value: instance.config.sliceSpacing,
                  min: 0.01,
                  max: 0.2,
                  step: 0.005,
                  onChange: onCfg('sliceSpacing'),
                },
                [`vf_bendX_${id}`]: {
                  label: 'Bend X',
                  value: instance.config.bendX,
                  min: -2,
                  max: 2,
                  step: 0.01,
                  onChange: onCfg('bendX'),
                },
                [`vf_bendZ_${id}`]: {
                  label: 'Bend Z',
                  value: instance.config.bendZ,
                  min: -2,
                  max: 2,
                  step: 0.01,
                  onChange: onCfg('bendZ'),
                },
                [`vf_animated_${id}`]: {
                  label: 'Animated',
                  value: instance.config.animated,
                  onChange: onCfg('animated'),
                },
                [`vf_animSpeed_${id}`]: {
                  label: 'Anim Speed',
                  value: instance.config.animSpeed,
                  min: 0,
                  max: 3,
                  step: 0.05,
                  onChange: onCfg('animSpeed'),
                },
                [`vf_showSpline_${id}`]: {
                  label: 'Show Spline',
                  value: instance.config.showSpline,
                  onChange: onCfg('showSpline'),
                },
                [`vf_showVolume_${id}`]: {
                  label: 'Show Volume',
                  value: instance.config.showVolume,
                  onChange: onCfg('showVolume'),
                },
              },
              { collapsed: true }
            ),
            'VF Turbulence': folder(
              {
                [`vf_magnitude_${id}`]: {
                  label: 'Magnitude',
                  value: instance.config.magnitude,
                  min: 0.1,
                  max: 5,
                  step: 0.1,
                  onChange: onCfg('magnitude'),
                },
                [`vf_lacunarity_${id}`]: {
                  label: 'Lacunarity',
                  value: instance.config.lacunarity,
                  min: 1,
                  max: 5,
                  step: 0.1,
                  onChange: onCfg('lacunarity'),
                },
                [`vf_gain_${id}`]: {
                  label: 'Gain',
                  value: instance.config.gain,
                  min: 0.01,
                  max: 1,
                  step: 0.01,
                  onChange: onCfg('gain'),
                },
              },
              { collapsed: true }
            ),
            'VF Colors': folder(
              {
                [`vf_tint_${id}`]: {
                  label: 'Tint',
                  value: instance.config.tintColor,
                  onChange: onCfg('tintColor'),
                },
                [`vf_saturation_${id}`]: {
                  label: 'Saturation',
                  value: instance.config.saturation,
                  min: 0,
                  max: 3,
                  step: 0.1,
                  onChange: onCfg('saturation'),
                },
                [`vf_brightness_${id}`]: {
                  label: 'Brightness',
                  value: instance.config.brightness,
                  min: 0,
                  max: 5,
                  step: 0.1,
                  onChange: onCfg('brightness'),
                },
              },
              { collapsed: true }
            ),
            [`vf_delete_${id}`]: button(
              () =>
                setVolumetricFireInstances((prev) =>
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

    const cs184FireSection = {
      'Add CS184 Fire': button(() =>
        setCs184FireInstances((prev) => [
          ...prev,
          makeCs184FireInst(offsetPosition(DEFAULT_CS184_FIRE_POSITION)),
        ])
      ),
      'Remove All CS184 Fire': button(() => setCs184FireInstances([])),
      ...cs184FireInstances.reduce((acc, instance, index) => {
        const { id } = instance;
        const onCfg = (key) => (value) =>
          setCs184FireInstances((prev) =>
            prev.map((item) =>
              item.id === id
                ? { ...item, config: { ...item.config, [key]: value } }
                : item
            )
          );
        const onInst = (key) => (value) =>
          setCs184FireInstances((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, [key]: value } : item
            )
          );

        acc[`CS184 Fire ${index + 1}`] = folder(
          {
            [`cf_pos_${id}`]: {
              label: 'Position',
              value: instance.pos,
              step: 0.1,
              onChange: onInst('pos'),
            },
            [`cf_rot_${id}`]: {
              label: 'Rotation',
              value: instance.rot,
              step: 0.05,
              onChange: onInst('rot'),
            },
            [`cf_scale_${id}`]: {
              label: 'Scale',
              value: instance.scale,
              min: 0.01,
              max: 10,
              step: 0.1,
              onChange: onInst('scale'),
            },
            'CF Volume': folder(
              {
                [`cf_width_${id}`]: {
                  label: 'Width',
                  value: instance.config.width,
                  min: 0.1,
                  max: 5,
                  step: 0.05,
                  onChange: onCfg('width'),
                },
                [`cf_height_${id}`]: {
                  label: 'Height',
                  value: instance.config.height,
                  min: 0.2,
                  max: 10,
                  step: 0.1,
                  onChange: onCfg('height'),
                },
                [`cf_depth_${id}`]: {
                  label: 'Depth',
                  value: instance.config.depth,
                  min: 0.1,
                  max: 5,
                  step: 0.05,
                  onChange: onCfg('depth'),
                },
                [`cf_bendX_${id}`]: {
                  label: 'Bend X',
                  value: instance.config.bendX,
                  min: -2,
                  max: 2,
                  step: 0.01,
                  onChange: onCfg('bendX'),
                },
                [`cf_bendZ_${id}`]: {
                  label: 'Bend Z',
                  value: instance.config.bendZ,
                  min: -2,
                  max: 2,
                  step: 0.01,
                  onChange: onCfg('bendZ'),
                },
                [`cf_animated_${id}`]: {
                  label: 'Animated',
                  value: instance.config.animated,
                  onChange: onCfg('animated'),
                },
                [`cf_animSpeed_${id}`]: {
                  label: 'Anim Speed',
                  value: instance.config.animSpeed,
                  min: 0,
                  max: 3,
                  step: 0.05,
                  onChange: onCfg('animSpeed'),
                },
              },
              { collapsed: true }
            ),
            'CF Turbulence': folder(
              {
                [`cf_magnitude_${id}`]: {
                  label: 'Magnitude',
                  value: instance.config.magnitude,
                  min: 0.1,
                  max: 5,
                  step: 0.1,
                  onChange: onCfg('magnitude'),
                },
                [`cf_lacunarity_${id}`]: {
                  label: 'Lacunarity',
                  value: instance.config.lacunarity,
                  min: 1,
                  max: 5,
                  step: 0.1,
                  onChange: onCfg('lacunarity'),
                },
                [`cf_gain_${id}`]: {
                  label: 'Gain',
                  value: instance.config.gain,
                  min: 0.01,
                  max: 1,
                  step: 0.01,
                  onChange: onCfg('gain'),
                },
                [`cf_speed_${id}`]: {
                  label: 'Speed',
                  value: instance.config.speed,
                  min: 0,
                  max: 3,
                  step: 0.05,
                  onChange: onCfg('speed'),
                },
                [`cf_density_${id}`]: {
                  label: 'Density',
                  value: instance.config.density,
                  min: 0,
                  max: 5,
                  step: 0.1,
                  onChange: onCfg('density'),
                },
              },
              { collapsed: true }
            ),
            'CF Appearance': folder(
              {
                [`cf_brightness_${id}`]: {
                  label: 'Brightness',
                  value: instance.config.brightness,
                  min: 0,
                  max: 5,
                  step: 0.1,
                  onChange: onCfg('brightness'),
                },
                [`cf_saturation_${id}`]: {
                  label: 'Saturation',
                  value: instance.config.saturation,
                  min: 0,
                  max: 3,
                  step: 0.1,
                  onChange: onCfg('saturation'),
                },
                [`cf_tint_${id}`]: {
                  label: 'Tint',
                  value: instance.config.tintColor,
                  onChange: onCfg('tintColor'),
                },
                [`cf_core_${id}`]: {
                  label: 'Core',
                  value: instance.config.coreColor,
                  onChange: onCfg('coreColor'),
                },
                [`cf_border_${id}`]: {
                  label: 'Border',
                  value: instance.config.borderColor,
                  onChange: onCfg('borderColor'),
                },
                [`cf_smoke_${id}`]: {
                  label: 'Smoke',
                  value: instance.config.smokeColor,
                  onChange: onCfg('smokeColor'),
                },
              },
              { collapsed: true }
            ),
            'CF Embers': folder(
              {
                [`cf_emberDensity_${id}`]: {
                  label: 'Density',
                  value: instance.config.emberDensity,
                  min: 0,
                  max: 1,
                  step: 0.01,
                  onChange: onCfg('emberDensity'),
                },
                [`cf_emberSize_${id}`]: {
                  label: 'Size',
                  value: instance.config.emberSize,
                  min: 0.05,
                  max: 1,
                  step: 0.01,
                  onChange: onCfg('emberSize'),
                },
                [`cf_emberColor_${id}`]: {
                  label: 'Color',
                  value: instance.config.emberColor,
                  onChange: onCfg('emberColor'),
                },
              },
              { collapsed: true }
            ),
            'CF Quality': folder(
              {
                [`cf_steps_${id}`]: {
                  label: 'Steps',
                  value: instance.config.steps,
                  min: 8,
                  max: 128,
                  step: 8,
                  onChange: onCfg('steps'),
                },
                [`cf_stepSize_${id}`]: {
                  label: 'Step Size',
                  value: instance.config.stepSize,
                  min: 0.1,
                  max: 3,
                  step: 0.1,
                  onChange: onCfg('stepSize'),
                },
              },
              { collapsed: true }
            ),
            [`cf_delete_${id}`]: button(
              () =>
                setCs184FireInstances((prev) =>
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

    const fireAndSmokeSection = buildFireAndSmokeControls({
      instances: fireAndSmokeInstances,
      setInstances: setFireAndSmokeInstances,
      addInstance: () =>
        makeFireAndSmokeInst({
          pos: offsetPosition(DEFAULT_FIRE_AND_SMOKE_POSITION),
        }),
    });

    return {
      Smoke: folder(
        {
          ...smokeSplineSections,
          'Smoke Ball': folder(smokeBallSection, { collapsed: true }),
          'Smoke Ball Spline': folder(smokeBallSplineSection, {
            collapsed: true,
          }),
          'Billboard Smoke': folder(billboardSmokeSection, {
            collapsed: true,
          }),
        },
        { collapsed: true }
      ),
      Fire: folder(
        {
          ...fireSplineSections,
          Fireball: folder(fireballSection, { collapsed: true }),
          'Fire Spline': folder(fireSplineSection, { collapsed: true }),
          Flame: folder(flameSection, { collapsed: true }),
          'Volumetric Fire': folder(volumetricFireSection, {
            collapsed: true,
          }),
          'CS184 Fire': folder(cs184FireSection, { collapsed: true }),
        },
        { collapsed: true }
      ),
      'Fire And Smoke': folder(fireAndSmokeSection, { collapsed: true }),
    };
  }, [
    preset,
    hotBoxSchemaVersion,
    splines.length,
    splineTypeSignature,
    smokeBallInstances.length,
    smokeBallSplineInstances.length,
    billboardSmokeInstances.length,
    fireballInstances.length,
    fireSplineInstances.length,
    flameInstances.length,
    volumetricFireInstances.length,
    cs184FireInstances.length,
    fireAndSmokeInstances.length,
  ]);

  useEffect(() => {
    selectedPresetRef.current = preset;
  }, [preset]);

  useEffect(() => {
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
    smokeBallSplineInstances,
    billboardSmokeInstances,
    fireballInstances,
    fireSplineInstances,
    flameInstances,
    volumetricFireInstances,
    cs184FireInstances,
    fireAndSmokeInstances,
    setSmokeBallSplinePoints,
    setFireSplinePoints,
    setFireAndSmokePoints,
  };
}
