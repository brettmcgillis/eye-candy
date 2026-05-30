/* eslint-disable no-param-reassign */
import { button, folder, useControls } from 'leva';
import * as THREE from 'three';

import { useCallback, useEffect, useRef, useState } from 'react';

import SMOKE_PRESETS from '../../../../../presets/smoke/smokePresets';
import { localEnv } from '../../../../../utils/appUtils';
import {
  cloneFireAndSmokeControlPoints,
  makeFireAndSmokeConfig,
  makeFireAndSmokeSmokeConfig,
} from '../../../../elements/fireAndSmoke/fireAndSmokeDefaults';
import buildFireAndSmokeControls from '../../shared/hooks/buildFireAndSmokeControls';
import buildSplineInstanceActions from '../../shared/hooks/buildSplineInstanceActions';
import {
  DEFAULT_SPLINE_CONFIG,
  cloneSplinePoints,
  parsePreset,
  serializeSplines,
} from '../../shared/splineDefaults';

const SCENE_LABEL = 'Smoke Test';
const DEFAULT_PRESET_KEY = Object.keys(SMOKE_PRESETS)[0];
const MAX_ATTRACTORS = 8;

const getSmokePreset = (presetKey) =>
  SMOKE_PRESETS[presetKey] ?? SMOKE_PRESETS[DEFAULT_PRESET_KEY];

// ─── Auto-incrementing ID counter (module-scoped, stable across renders) ──────
let idCounter = 0;
// eslint-disable-next-line no-plusplus
const mkId = () => idCounter++;

// ─── Default control-point generator ─────────────────────────────────────────
const randPt = () => ({
  position: new THREE.Vector3(
    (Math.random() - 0.5) * 4,
    Math.random() * 4,
    (Math.random() - 0.5) * 4
  ),
  rotation: new THREE.Euler(),
  scale: new THREE.Vector3(1, 1, 1),
});
const defaultPoints = () => [randPt(), randPt(), randPt()];

// Default SmokeBallSpline control points (positioned left of centre at scene scale)
const DEFAULT_SS_CONTROL_POINTS = [
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

// ─── Default per-type configs ─────────────────────────────────────────────────

const mkPsCfg = () => ({
  ...DEFAULT_SPLINE_CONFIG,
  type: 'Smoke',
  smokeType: 'Particle',
  name: 'Particle Smoke',
});

const mkVsCfg = () => ({
  ...DEFAULT_SPLINE_CONFIG,
  type: 'Smoke',
  smokeType: 'Volumetric',
  name: 'Volumetric Smoke',
});

const mkSbCfg = () => ({
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

const mkSsCfg = () => ({
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

const mkS2dCfg = () => ({
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

const DEFAULT_FIRE_AND_SMOKE_POSITION = [-0.5, 0, -4.25];

const cloneTuple = (value, fallback) =>
  Array.isArray(value) ? [...value] : [...fallback];

const cloneControlPoints = (controlPoints = DEFAULT_SS_CONTROL_POINTS) =>
  controlPoints.map((point) => ({
    position: point.position.clone(),
    rotation: (point.rotation ?? new THREE.Euler()).clone(),
    scale: (point.scale ?? new THREE.Vector3(1, 1, 1)).clone(),
  }));

const cloneAttractors = (attractors = []) =>
  attractors.map((attractor) => ({
    position: cloneTuple(attractor.position, [0, 0, 0]),
    direction: cloneTuple(attractor.direction, [0, 1, 0]),
    rotation: cloneTuple(attractor.rotation, [0, 0, 0]),
  }));

// ─── Instance constructors ────────────────────────────────────────────────────

const makePsInst = (pointsOrSeed = null, cfg = null) => {
  const seed =
    Array.isArray(pointsOrSeed) || pointsOrSeed === null
      ? { points: pointsOrSeed, config: cfg }
      : pointsOrSeed;

  return {
    id: mkId(),
    pos: cloneTuple(seed.pos, [0, 0, 0]),
    rot: cloneTuple(seed.rot, [0, 0, 0]),
    scale: cloneTuple(seed.scale, [1, 1, 1]),
    showHandles: seed.showHandles ?? true,
    pointMode: seed.pointMode ?? 'translate',
    points: cloneSplinePoints(seed.points ?? defaultPoints()),
    config: { ...mkPsCfg(), ...(seed.config ?? {}) },
  };
};

const makeVsInst = (pointsOrSeed = null, cfg = null) => {
  const seed =
    Array.isArray(pointsOrSeed) || pointsOrSeed === null
      ? { points: pointsOrSeed, config: cfg }
      : pointsOrSeed;

  return {
    id: mkId(),
    pos: cloneTuple(seed.pos, [0, 0, 0]),
    rot: cloneTuple(seed.rot, [0, 0, 0]),
    scale: cloneTuple(seed.scale, [1, 1, 1]),
    showHandles: seed.showHandles ?? true,
    pointMode: seed.pointMode ?? 'translate',
    points: cloneSplinePoints(seed.points ?? defaultPoints()),
    config: { ...mkVsCfg(), ...(seed.config ?? {}) },
  };
};

const makeSbInst = (seed = {}) => ({
  id: mkId(),
  pos: cloneTuple(seed.pos, [-5, 1, 0]),
  rot: cloneTuple(seed.rot, [0, 0, 0]),
  scale: cloneTuple(seed.scale, [1, 1, 1]),
  config: { ...mkSbCfg(), ...(seed.config ?? {}) },
});

const makeSsInst = (seed = {}) => ({
  id: mkId(),
  pos: cloneTuple(seed.pos, [0, 0, 0]),
  rot: cloneTuple(seed.rot, [0, 0, 0]),
  scale: cloneTuple(seed.scale, [1, 1, 1]),
  showHandles: seed.showHandles ?? true,
  pointMode: seed.pointMode ?? 'translate',
  controlPoints: cloneControlPoints(seed.controlPoints),
  config: { ...mkSsCfg(), ...(seed.config ?? {}) },
});

const makeS2dInst = (seed = {}) => ({
  id: mkId(),
  pos: cloneTuple(seed.pos, [-3, 0, 0]),
  config: { ...mkS2dCfg(), ...(seed.config ?? {}) },
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
  config: makeFireAndSmokeSmokeConfig(seed.config ?? {}),
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
  const preset = getSmokePreset(presetKey);
  const elements = preset?.elements ?? {};

  return {
    sb: (elements.smokeBall ?? []).map((element) => makeSbInst(element)),
    ss: (elements.smokeBallSpline ?? []).map((element) => makeSsInst(element)),
    s2d: (elements.billboardSmoke ?? []).map((element) => makeS2dInst(element)),
    fireAndSmoke: (elements.fireAndSmoke ?? []).map(hydrateFireAndSmokeInst),
  };
}

function getPresetAttractors(presetKey) {
  return cloneAttractors(getSmokePreset(presetKey)?.attractors ?? []);
}

// ─── Preset parsing ───────────────────────────────────────────────────────────

function splitPresetByType(presetKey) {
  const preset = getSmokePreset(presetKey);

  const { splineInstances, splineConfigs } = parsePreset(preset);
  const ps = [];
  const vs = [];

  splineInstances.forEach((instance, i) => {
    const cfg = splineConfigs[i];
    const seed = {
      pos: instance.pos,
      rot: instance.rot,
      scale: instance.scale,
      points: instance.points,
      config: cfg,
    };

    if (cfg.smokeType === 'Volumetric') {
      vs.push(makeVsInst(seed));
    } else {
      ps.push(makePsInst(seed));
    }
  });

  return { ps, vs };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Controls for the SmokeTest scene.
 *
 * Manages per-type instance arrays (Particle, Volumetric, SmokeBall,
 * SmokeBallSpline, Billboard) entirely inside the hook. SmokeTest.jsx
 * just renders from the returned arrays.
 *
 * @param {React.MutableRefObject} attractorsRef
 */
export default function useSmokeTestControls(attractorsRef) {
  const selectedPresetRef = useRef(DEFAULT_PRESET_KEY);

  // ── Per-type instance state ─────────────────────────────────────────────────
  const [psInstances, setPsInstances] = useState(() => {
    const { ps } = splitPresetByType(DEFAULT_PRESET_KEY);
    return ps;
  });
  const [vsInstances, setVsInstances] = useState(() => {
    const { vs } = splitPresetByType(DEFAULT_PRESET_KEY);
    return vs;
  });
  const [sbInstances, setSbInstances] = useState(
    () => getStandaloneDefaults(DEFAULT_PRESET_KEY).sb
  );
  const [ssInstances, setSsInstances] = useState(
    () => getStandaloneDefaults(DEFAULT_PRESET_KEY).ss
  );
  const [s2dInstances, setS2dInstances] = useState(
    () => getStandaloneDefaults(DEFAULT_PRESET_KEY).s2d
  );
  const [fireAndSmokeInstances, setFireAndSmokeInstances] = useState(
    () => getStandaloneDefaults(DEFAULT_PRESET_KEY).fireAndSmoke
  );
  const [attractorVersion, setAttractorVersion] = useState(0);

  // Stable refs for static-schema closures (Copy button needs current arrays)
  const psRef = useRef(psInstances);
  psRef.current = psInstances;
  const vsRef = useRef(vsInstances);
  vsRef.current = vsInstances;

  // ── Call 1 — static schema: Presets, Scene, Attractors ─────────────────────
  // deps=[] so this never rebuilds; preset dropdown and scene settings are
  // preserved across instance-count changes.
  const [
    {
      preset,
      bgColor,
      lineColor,
      showAttractors,
      attractorMode,
      attractorStrength,
      attractorRadius,
    },
  ] = useControls(
    SCENE_LABEL,
    () => ({
      Presets: folder(
        {
          preset: {
            label: 'Preset',
            value: DEFAULT_PRESET_KEY,
            options: Object.keys(SMOKE_PRESETS),
          },
          reset: button(() => {
            const { ps, vs } = splitPresetByType(selectedPresetRef.current);
            const { sb, ss, s2d } = getStandaloneDefaults(
              selectedPresetRef.current
            );
            const { fireAndSmoke } = getStandaloneDefaults(
              selectedPresetRef.current
            );
            attractorsRef.current = getPresetAttractors(
              selectedPresetRef.current
            );
            setPsInstances(ps);
            setVsInstances(vs);
            setSbInstances(sb);
            setSsInstances(ss);
            setS2dInstances(s2d);
            setFireAndSmokeInstances(fireAndSmoke);
            setAttractorVersion((c) => c + 1);
          }),
          ...(localEnv()
            ? {
                copy: button(
                  () => {
                    const allSplines = [
                      ...psRef.current.map((x) => ({
                        pos: x.pos,
                        rot: x.rot,
                        scale: x.scale,
                        points: x.points,
                      })),
                      ...vsRef.current.map((x) => ({
                        pos: x.pos,
                        rot: x.rot,
                        scale: x.scale,
                        points: x.points,
                      })),
                    ];
                    const allConfigs = [
                      ...psRef.current.map((x) => x.config),
                      ...vsRef.current.map((x) => x.config),
                    ];
                    const code = serializeSplines(allSplines, allConfigs);
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
          bgColor: { label: 'Background', value: '#ffffff' },
          lineColor: { label: 'Grid Lines', value: '#d1d1d1' },
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
            setAttractorVersion((c) => c + 1);
          }),
          'Remove All Attractors': button(() => {
            // eslint-disable-next-line no-param-reassign
            attractorsRef.current.length = 0;
            setAttractorVersion((c) => c + 1);
          }),
        },
        { collapsed: true }
      ),
    }),
    [] // static schema — never rebuilds; setters are stable
  );

  // ── Call 2 — dynamic schema: Smoke instances ────────────────────────────────
  // Rebuilds when any instance count changes; all state flows through onChange.
  useControls(
    SCENE_LABEL,
    () => {
      // ── Particle Smoke ──────────────────────────────────────────────────────
      const psSection = {
        'Add Particle Smoke': button(() =>
          setPsInstances((prev) => [...prev, makePsInst()])
        ),
        'Remove All Particle Smoke': button(() => setPsInstances([])),
        ...psInstances.reduce((acc, inst, i) => {
          const { id } = inst;
          const onCfg = (key) => (v) =>
            setPsInstances((prev) =>
              prev.map((x) =>
                x.id === id ? { ...x, config: { ...x.config, [key]: v } } : x
              )
            );
          const onInst = (key) => (v) =>
            setPsInstances((prev) =>
              prev.map((x) => (x.id === id ? { ...x, [key]: v } : x))
            );

          acc[`Particle ${i + 1}`] = folder(
            {
              [`ps_pos_${id}`]: {
                label: 'Position',
                value: inst.pos,
                step: 0.1,
                onChange: onInst('pos'),
              },
              [`ps_rot_${id}`]: {
                label: 'Rotation',
                value: inst.rot,
                step: 0.05,
                onChange: onInst('rot'),
              },
              [`ps_scale_${id}`]: {
                label: 'Scale',
                value: inst.scale,
                min: 0.01,
                max: 10,
                step: 0.1,
                onChange: onInst('scale'),
              },
              'PS Spline Editor': folder(
                {
                  [`ps_handles_${id}`]: {
                    label: 'Show Handles',
                    value: inst.showHandles,
                    onChange: (v) =>
                      setPsInstances((prev) =>
                        prev.map((x) =>
                          x.id === id ? { ...x, showHandles: v } : x
                        )
                      ),
                  },
                  [`ps_pointMode_${id}`]: {
                    label: 'Transform',
                    value: inst.pointMode,
                    options: ['translate', 'rotate', 'scale'],
                    onChange: (v) =>
                      setPsInstances((prev) =>
                        prev.map((x) =>
                          x.id === id ? { ...x, pointMode: v } : x
                        )
                      ),
                  },
                  [`ps_tension_${id}`]: {
                    label: 'Tension',
                    value: inst.config.tension,
                    min: 0,
                    max: 1,
                    step: 0.05,
                    onChange: onCfg('tension'),
                  },
                  [`ps_closed_${id}`]: {
                    label: 'Closed',
                    value: inst.config.closed,
                    onChange: onCfg('closed'),
                  },
                },
                { collapsed: true }
              ),
              'PS Simulation': folder(
                {
                  [`ps_count_${id}`]: {
                    label: 'Count',
                    value: inst.config.particleCount,
                    min: 500,
                    max: 40000,
                    step: 500,
                    onChange: onCfg('particleCount'),
                  },
                  [`ps_size_${id}`]: {
                    label: 'Size',
                    value: inst.config.particleSize,
                    min: 0.05,
                    max: 2,
                    step: 0.01,
                    onChange: onCfg('particleSize'),
                  },
                  [`ps_color_${id}`]: {
                    label: 'Color',
                    value: inst.config.particleColor,
                    onChange: onCfg('particleColor'),
                  },
                  [`ps_opacity_${id}`]: {
                    label: 'Opacity',
                    value: inst.config.opacity,
                    min: 0.005,
                    max: 1,
                    step: 0.005,
                    onChange: onCfg('opacity'),
                  },
                  [`ps_growth_${id}`]: {
                    label: 'Growth',
                    value: inst.config.growth,
                    min: 0,
                    max: 10,
                    step: 0.1,
                    onChange: onCfg('growth'),
                  },
                  [`ps_fadeExp_${id}`]: {
                    label: 'Fade Exp',
                    value: inst.config.fadeExponent,
                    min: 0.1,
                    max: 5,
                    step: 0.1,
                    onChange: onCfg('fadeExponent'),
                  },
                  [`ps_buoyancy_${id}`]: {
                    label: 'Buoyancy',
                    value: inst.config.buoyancy,
                    min: -2,
                    max: 2,
                    step: 0.05,
                    onChange: onCfg('buoyancy'),
                  },
                  [`ps_rotSpeed_${id}`]: {
                    label: 'Rot Speed',
                    value: inst.config.rotSpeed,
                    min: 0,
                    max: 5,
                    step: 0.05,
                    onChange: onCfg('rotSpeed'),
                  },
                  [`ps_blend_${id}`]: {
                    label: 'Blend',
                    value: inst.config.blendMode,
                    options: ['Normal', 'Additive', 'Subtractive', 'Multiply'],
                    onChange: onCfg('blendMode'),
                  },
                  [`ps_springK_${id}`]: {
                    label: 'Spring',
                    value: inst.config.springK,
                    min: 0,
                    max: 40,
                    step: 0.5,
                    onChange: onCfg('springK'),
                  },
                  [`ps_flow_${id}`]: {
                    label: 'Flow Speed',
                    value: inst.config.flowSpeed,
                    min: 0,
                    max: 0.5,
                    step: 0.005,
                    onChange: onCfg('flowSpeed'),
                  },
                  [`ps_damping_${id}`]: {
                    label: 'Damping',
                    value: inst.config.damping,
                    min: 0.001,
                    max: 1,
                    step: 0.005,
                    onChange: onCfg('damping'),
                  },
                  [`ps_turb_${id}`]: {
                    label: 'Turbulence',
                    value: inst.config.turbulence,
                    min: 0,
                    max: 8,
                    step: 0.1,
                    onChange: onCfg('turbulence'),
                  },
                  [`ps_turbSpeed_${id}`]: {
                    label: 'Turb Speed',
                    value: inst.config.turbulenceSpeed,
                    min: 0,
                    max: 3,
                    step: 0.05,
                    onChange: onCfg('turbulenceSpeed'),
                  },
                  [`ps_spread_${id}`]: {
                    label: 'Spawn Spread',
                    value: inst.config.spawnSpread,
                    min: 0,
                    max: 5,
                    step: 0.05,
                    onChange: onCfg('spawnSpread'),
                  },
                  [`ps_prefillOnStart_${id}`]: {
                    label: 'Prefill On Start',
                    value: inst.config.prefillOnStart ?? true,
                    hint: 'Open splines only — when off, particles begin queued at the emitter',
                    onChange: onCfg('prefillOnStart'),
                  },
                  [`ps_drift_${id}`]: {
                    label: 'Max Drift',
                    value: inst.config.maxDrift,
                    min: 0.5,
                    max: 20,
                    step: 0.5,
                    onChange: onCfg('maxDrift'),
                  },
                  [`ps_fadeRate_${id}`]: {
                    label: 'Fade Rate',
                    value: inst.config.fadeRate,
                    min: 1,
                    max: 50,
                    step: 1,
                    onChange: onCfg('fadeRate'),
                  },
                },
                { collapsed: true }
              ),
              ...buildSplineInstanceActions({
                id,
                setInstances: setPsInstances,
                keyPrefix: 'ps',
                pointsKey: 'points',
                cloneInstance: (source) => makePsInst(source),
              }),
            },
            { collapsed: true }
          );
          return acc;
        }, {}),
      };

      // ── Volumetric Smoke ────────────────────────────────────────────────────
      const vsSection = {
        'Add Volumetric Smoke': button(() =>
          setVsInstances((prev) => [...prev, makeVsInst()])
        ),
        'Remove All Volumetric Smoke': button(() => setVsInstances([])),
        ...vsInstances.reduce((acc, inst, i) => {
          const { id } = inst;
          const onCfg = (key) => (v) =>
            setVsInstances((prev) =>
              prev.map((x) =>
                x.id === id ? { ...x, config: { ...x.config, [key]: v } } : x
              )
            );
          const onInst = (key) => (v) =>
            setVsInstances((prev) =>
              prev.map((x) => (x.id === id ? { ...x, [key]: v } : x))
            );

          acc[`Volumetric ${i + 1}`] = folder(
            {
              [`vs_pos_${id}`]: {
                label: 'Position',
                value: inst.pos,
                step: 0.1,
                onChange: onInst('pos'),
              },
              [`vs_rot_${id}`]: {
                label: 'Rotation',
                value: inst.rot,
                step: 0.05,
                onChange: onInst('rot'),
              },
              [`vs_scale_${id}`]: {
                label: 'Scale',
                value: inst.scale,
                min: 0.01,
                max: 10,
                step: 0.1,
                onChange: onInst('scale'),
              },
              'VS Spline Editor': folder(
                {
                  [`vs_handles_${id}`]: {
                    label: 'Show Handles',
                    value: inst.showHandles,
                    onChange: (v) =>
                      setVsInstances((prev) =>
                        prev.map((x) =>
                          x.id === id ? { ...x, showHandles: v } : x
                        )
                      ),
                  },
                  [`vs_pointMode_${id}`]: {
                    label: 'Transform',
                    value: inst.pointMode,
                    options: ['translate', 'rotate', 'scale'],
                    onChange: (v) =>
                      setVsInstances((prev) =>
                        prev.map((x) =>
                          x.id === id ? { ...x, pointMode: v } : x
                        )
                      ),
                  },
                  [`vs_tension_${id}`]: {
                    label: 'Tension',
                    value: inst.config.tension,
                    min: 0,
                    max: 1,
                    step: 0.05,
                    onChange: onCfg('tension'),
                  },
                  [`vs_closed_${id}`]: {
                    label: 'Closed',
                    value: inst.config.closed,
                    onChange: onCfg('closed'),
                  },
                },
                { collapsed: true }
              ),
              'VS Simulation': folder(
                {
                  [`vs_count_${id}`]: {
                    label: 'Count',
                    value: inst.config.volParticleCount,
                    min: 500,
                    max: 40000,
                    step: 500,
                    onChange: onCfg('volParticleCount'),
                  },
                  [`vs_size_${id}`]: {
                    label: 'Size',
                    value: inst.config.volSize,
                    min: 0.05,
                    max: 3,
                    step: 0.05,
                    onChange: onCfg('volSize'),
                  },
                  [`vs_color_${id}`]: {
                    label: 'Color',
                    value: inst.config.volColor,
                    onChange: onCfg('volColor'),
                  },
                  [`vs_opacity_${id}`]: {
                    label: 'Opacity',
                    value: inst.config.volOpacity,
                    min: 0.005,
                    max: 1,
                    step: 0.005,
                    onChange: onCfg('volOpacity'),
                  },
                  [`vs_blend_${id}`]: {
                    label: 'Blend',
                    value: inst.config.volBlendMode,
                    options: ['Normal', 'Additive', 'Subtractive', 'Multiply'],
                    onChange: onCfg('volBlendMode'),
                  },
                  [`vs_spread_${id}`]: {
                    label: 'Spawn Spread',
                    value: inst.config.volSpread,
                    min: 0,
                    max: 8,
                    step: 0.05,
                    onChange: onCfg('volSpread'),
                  },
                  [`vs_springK_${id}`]: {
                    label: 'Spring',
                    value: inst.config.volSpringK,
                    min: 0,
                    max: 40,
                    step: 0.5,
                    onChange: onCfg('volSpringK'),
                  },
                  [`vs_damping_${id}`]: {
                    label: 'Damping',
                    value: inst.config.volDamping,
                    min: 0.001,
                    max: 1,
                    step: 0.005,
                    onChange: onCfg('volDamping'),
                  },
                  [`vs_turb_${id}`]: {
                    label: 'Turbulence',
                    value: inst.config.volTurbulence,
                    min: 0,
                    max: 8,
                    step: 0.1,
                    onChange: onCfg('volTurbulence'),
                  },
                  [`vs_turbSpeed_${id}`]: {
                    label: 'Turb Speed',
                    value: inst.config.volTurbulenceSpeed,
                    min: 0,
                    max: 3,
                    step: 0.05,
                    onChange: onCfg('volTurbulenceSpeed'),
                  },
                  [`vs_drift_${id}`]: {
                    label: 'Max Drift',
                    value: inst.config.volMaxDrift,
                    min: 0.5,
                    max: 20,
                    step: 0.5,
                    onChange: onCfg('volMaxDrift'),
                  },
                  [`vs_growth_${id}`]: {
                    label: 'Growth',
                    value: inst.config.volGrowth,
                    min: 0,
                    max: 10,
                    step: 0.1,
                    onChange: onCfg('volGrowth'),
                  },
                  [`vs_fadeExp_${id}`]: {
                    label: 'Fade Exp',
                    value: inst.config.volFadeExp,
                    min: 0.1,
                    max: 5,
                    step: 0.1,
                    onChange: onCfg('volFadeExp'),
                  },
                  [`vs_buoyancy_${id}`]: {
                    label: 'Buoyancy',
                    value: inst.config.volBuoyancy,
                    min: -2,
                    max: 2,
                    step: 0.05,
                    onChange: onCfg('volBuoyancy'),
                  },
                },
                { collapsed: true }
              ),
              ...buildSplineInstanceActions({
                id,
                setInstances: setVsInstances,
                keyPrefix: 'vs',
                pointsKey: 'points',
                cloneInstance: (source) => makeVsInst(source),
              }),
            },
            { collapsed: true }
          );
          return acc;
        }, {}),
      };

      // ── Smoke Ball ──────────────────────────────────────────────────────────
      const sbSection = {
        'Add Smoke Ball': button(() =>
          setSbInstances((prev) => [
            ...prev,
            makeSbInst({
              pos: [
                (Math.random() - 0.5) * 10,
                Math.random() * 4,
                (Math.random() - 0.5) * 6,
              ],
            }),
          ])
        ),
        'Remove All Smoke Balls': button(() => setSbInstances([])),
        ...sbInstances.reduce((acc, inst, i) => {
          const { id } = inst;
          const onCfg = (key) => (v) =>
            setSbInstances((prev) =>
              prev.map((x) =>
                x.id === id ? { ...x, config: { ...x.config, [key]: v } } : x
              )
            );
          const onInst = (key) => (v) =>
            setSbInstances((prev) =>
              prev.map((x) => (x.id === id ? { ...x, [key]: v } : x))
            );

          acc[`Smoke Ball ${i + 1}`] = folder(
            {
              [`sb_pos_${id}`]: {
                label: 'Position',
                value: inst.pos,
                step: 0.1,
                onChange: onInst('pos'),
              },
              [`sb_rot_${id}`]: {
                label: 'Rotation',
                value: inst.rot,
                step: 0.05,
                onChange: onInst('rot'),
              },
              [`sb_scale_${id}`]: {
                label: 'Scale',
                value: inst.scale,
                min: 0.01,
                max: 10,
                step: 0.1,
                onChange: onInst('scale'),
              },
              'SB Appearance': folder(
                {
                  [`sb_radius_${id}`]: {
                    label: 'Radius',
                    value: inst.config.radius,
                    min: 0.05,
                    max: 5,
                    step: 0.05,
                    onChange: onCfg('radius'),
                  },
                  [`sb_detail_${id}`]: {
                    label: 'Detail',
                    value: inst.config.detail,
                    min: 1,
                    max: 7,
                    step: 1,
                    onChange: onCfg('detail'),
                  },
                  [`sb_speed_${id}`]: {
                    label: 'Speed',
                    value: inst.config.speed,
                    min: 0,
                    max: 5,
                    step: 0.05,
                    onChange: onCfg('speed'),
                  },
                  [`sb_weight_${id}`]: {
                    label: 'Weight',
                    value: inst.config.weight,
                    min: 0,
                    max: 3,
                    step: 0.05,
                    onChange: onCfg('weight'),
                  },
                  [`sb_noiseFreq_${id}`]: {
                    label: 'Noise Freq',
                    value: inst.config.noiseFreq,
                    min: 0.1,
                    max: 10,
                    step: 0.1,
                    onChange: onCfg('noiseFreq'),
                  },
                  [`sb_noiseAmp_${id}`]: {
                    label: 'Noise Amp',
                    value: inst.config.noiseAmp,
                    min: 0,
                    max: 1,
                    step: 0.01,
                    onChange: onCfg('noiseAmp'),
                  },
                  [`sb_animated_${id}`]: {
                    label: 'Animated',
                    value: inst.config.animated,
                    onChange: onCfg('animated'),
                  },
                  [`sb_light_${id}`]: {
                    label: 'Light',
                    value: inst.config.smokeLightColor,
                    onChange: onCfg('smokeLightColor'),
                  },
                  [`sb_dark_${id}`]: {
                    label: 'Dark',
                    value: inst.config.smokeDarkColor,
                    onChange: onCfg('smokeDarkColor'),
                  },
                },
                { collapsed: true }
              ),
              [`sb_delete_${id}`]: button(
                () => setSbInstances((prev) => prev.filter((x) => x.id !== id)),
                { label: 'Delete Instance' }
              ),
            },
            { collapsed: true }
          );
          return acc;
        }, {}),
      };

      // ── Smoke Ball Spline ───────────────────────────────────────────────────
      const ssSection = {
        'Add Smoke Ball Spline': button(() =>
          setSsInstances((prev) => [
            ...prev,
            makeSsInst({
              pos: [
                (Math.random() - 0.5) * 10,
                Math.random() * 4,
                (Math.random() - 0.5) * 6,
              ],
            }),
          ])
        ),
        'Remove All Smoke Ball Splines': button(() => setSsInstances([])),
        ...ssInstances.reduce((acc, inst, i) => {
          const { id } = inst;
          const onCfg = (key) => (v) =>
            setSsInstances((prev) =>
              prev.map((x) =>
                x.id === id ? { ...x, config: { ...x.config, [key]: v } } : x
              )
            );
          const onInst = (key) => (v) =>
            setSsInstances((prev) =>
              prev.map((x) => (x.id === id ? { ...x, [key]: v } : x))
            );

          acc[`Smoke Ball Spline ${i + 1}`] = folder(
            {
              [`ss_pos_${id}`]: {
                label: 'Position',
                value: inst.pos,
                step: 0.1,
                onChange: onInst('pos'),
              },
              [`ss_rot_${id}`]: {
                label: 'Rotation',
                value: inst.rot,
                step: 0.05,
                onChange: onInst('rot'),
              },
              [`ss_scale_${id}`]: {
                label: 'Scale',
                value: inst.scale,
                min: 0.01,
                max: 10,
                step: 0.1,
                onChange: onInst('scale'),
              },
              'SS Spline Editor': folder(
                {
                  [`ss_handles_${id}`]: {
                    label: 'Show Handles',
                    value: inst.showHandles,
                    onChange: (v) =>
                      setSsInstances((prev) =>
                        prev.map((x) =>
                          x.id === id ? { ...x, showHandles: v } : x
                        )
                      ),
                  },
                  [`ss_pointMode_${id}`]: {
                    label: 'Transform',
                    value: inst.pointMode,
                    options: ['translate', 'scale'],
                    onChange: (v) =>
                      setSsInstances((prev) =>
                        prev.map((x) =>
                          x.id === id ? { ...x, pointMode: v } : x
                        )
                      ),
                  },
                },
                { collapsed: true }
              ),
              'SS Appearance': folder(
                {
                  [`ss_baseRadius_${id}`]: {
                    label: 'Base Radius',
                    value: inst.config.baseRadius,
                    min: 0.05,
                    max: 5,
                    step: 0.05,
                    onChange: onCfg('baseRadius'),
                  },
                  [`ss_tubular_${id}`]: {
                    label: 'Tubular Segs',
                    value: inst.config.tubularSegments,
                    min: 8,
                    max: 128,
                    step: 1,
                    onChange: onCfg('tubularSegments'),
                  },
                  [`ss_radial_${id}`]: {
                    label: 'Radial Segs',
                    value: inst.config.radialSegments,
                    min: 8,
                    max: 64,
                    step: 1,
                    onChange: onCfg('radialSegments'),
                  },
                  [`ss_cap_${id}`]: {
                    label: 'Cap Segs',
                    value: inst.config.capSegments,
                    min: 2,
                    max: 16,
                    step: 1,
                    onChange: onCfg('capSegments'),
                  },
                  [`ss_speed_${id}`]: {
                    label: 'Speed',
                    value: inst.config.speed,
                    min: 0,
                    max: 5,
                    step: 0.05,
                    onChange: onCfg('speed'),
                  },
                  [`ss_weight_${id}`]: {
                    label: 'Weight',
                    value: inst.config.weight,
                    min: 0,
                    max: 3,
                    step: 0.05,
                    onChange: onCfg('weight'),
                  },
                  [`ss_noiseFreq_${id}`]: {
                    label: 'Noise Freq',
                    value: inst.config.noiseFreq,
                    min: 0.1,
                    max: 10,
                    step: 0.1,
                    onChange: onCfg('noiseFreq'),
                  },
                  [`ss_noiseAmp_${id}`]: {
                    label: 'Noise Amp',
                    value: inst.config.noiseAmp,
                    min: 0,
                    max: 1,
                    step: 0.01,
                    onChange: onCfg('noiseAmp'),
                  },
                  [`ss_animated_${id}`]: {
                    label: 'Animated',
                    value: inst.config.animated,
                    onChange: onCfg('animated'),
                  },
                  [`ss_light_${id}`]: {
                    label: 'Light',
                    value: inst.config.smokeLightColor,
                    onChange: onCfg('smokeLightColor'),
                  },
                  [`ss_dark_${id}`]: {
                    label: 'Dark',
                    value: inst.config.smokeDarkColor,
                    onChange: onCfg('smokeDarkColor'),
                  },
                },
                { collapsed: true }
              ),
              ...buildSplineInstanceActions({
                id,
                setInstances: setSsInstances,
                keyPrefix: 'ss',
                pointsKey: 'controlPoints',
                cloneInstance: (source) => makeSsInst(source),
              }),
            },
            { collapsed: true }
          );
          return acc;
        }, {}),
      };

      // ── Billboard Smoke ─────────────────────────────────────────────────────
      const s2dSection = {
        'Add Billboard Smoke': button(() =>
          setS2dInstances((prev) => [
            ...prev,
            makeS2dInst({
              pos: [(Math.random() - 0.5) * 10, 0, (Math.random() - 0.5) * 6],
            }),
          ])
        ),
        'Remove All Billboard Smoke': button(() => setS2dInstances([])),
        ...s2dInstances.reduce((acc, inst, i) => {
          const { id } = inst;
          const onCfg = (key) => (v) =>
            setS2dInstances((prev) =>
              prev.map((x) =>
                x.id === id ? { ...x, config: { ...x.config, [key]: v } } : x
              )
            );
          const onInst = (key) => (v) =>
            setS2dInstances((prev) =>
              prev.map((x) => (x.id === id ? { ...x, [key]: v } : x))
            );

          acc[`Billboard ${i + 1}`] = folder(
            {
              [`s2d_pos_${id}`]: {
                label: 'Position',
                value: inst.pos,
                step: 0.1,
                onChange: onInst('pos'),
              },
              'S2D Appearance': folder(
                {
                  [`s2d_inverted_${id}`]: {
                    label: 'Inverted',
                    value: inst.config.inverted,
                    onChange: onCfg('inverted'),
                  },
                  [`s2d_width_${id}`]: {
                    label: 'Width',
                    value: inst.config.width,
                    min: 0.05,
                    max: 5,
                    step: 0.05,
                    onChange: onCfg('width'),
                  },
                  [`s2d_height_${id}`]: {
                    label: 'Height',
                    value: inst.config.height,
                    min: 0.1,
                    max: 15,
                    step: 0.1,
                    onChange: onCfg('height'),
                  },
                  [`s2d_color_${id}`]: {
                    label: 'Color',
                    value: inst.config.color,
                    onChange: onCfg('color'),
                  },
                  [`s2d_opacity_${id}`]: {
                    label: 'Opacity',
                    value: inst.config.opacity,
                    min: 0,
                    max: 1,
                    step: 0.01,
                    onChange: onCfg('opacity'),
                  },
                  [`s2d_timeFreq_${id}`]: {
                    label: 'Time Freq',
                    value: inst.config.timeFrequency,
                    min: 0,
                    max: 3,
                    step: 0.01,
                    onChange: onCfg('timeFrequency'),
                  },
                  [`s2d_uvFreqX_${id}`]: {
                    label: 'UV Freq X',
                    value: inst.config.uvFrequencyX,
                    min: 0.1,
                    max: 5,
                    step: 0.05,
                    onChange: onCfg('uvFrequencyX'),
                  },
                  [`s2d_uvFreqY_${id}`]: {
                    label: 'UV Freq Y',
                    value: inst.config.uvFrequencyY,
                    min: 0.1,
                    max: 5,
                    step: 0.05,
                    onChange: onCfg('uvFrequencyY'),
                  },
                  [`s2d_riseSpeed_${id}`]: {
                    label: 'Rise Speed',
                    value: inst.config.riseSpeed,
                    min: 0,
                    max: 2,
                    step: 0.01,
                    onChange: onCfg('riseSpeed'),
                  },
                  [`s2d_spread_${id}`]: {
                    label: 'Spread',
                    value: inst.config.spreadStrength,
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
                  setS2dInstances((prev) => prev.filter((x) => x.id !== id)),
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
            pos: [
              (Math.random() - 0.5) * 10,
              Math.random() * 2,
              (Math.random() - 0.5) * 6,
            ],
          }),
        cloneInstance: (source) => makeFireAndSmokeInst(source),
        supportsAttractors: true,
      });

      return {
        Smoke: folder(
          {
            'Particle Smoke': folder(psSection, { collapsed: true }),
            'Volumetric Smoke': folder(vsSection, { collapsed: true }),
            'Smoke Ball': folder(sbSection, { collapsed: true }),
            'Smoke Ball Spline': folder(ssSection, { collapsed: true }),
            'Billboard Smoke': folder(s2dSection, { collapsed: true }),
            'Fire And Smoke': folder(fireAndSmokeSection, {
              collapsed: true,
            }),
          },
          { collapsed: true }
        ),
      };
    },
    // Rebuild schema when instance counts change (new/deleted instances).
    // Instance data flows through onChange; value fields seed from current state.
    [
      psInstances.length,
      vsInstances.length,
      sbInstances.length,
      ssInstances.length,
      s2dInstances.length,
      fireAndSmokeInstances.length,
    ]
  );

  // ── Effects ─────────────────────────────────────────────────────────────────

  // Track selected preset name for Reset button
  useEffect(() => {
    selectedPresetRef.current = preset;
  }, [preset]);

  // Reload instances when preset dropdown changes
  useEffect(() => {
    const { ps, vs } = splitPresetByType(preset);
    const { sb, ss, s2d, fireAndSmoke } = getStandaloneDefaults(preset);
    attractorsRef.current = getPresetAttractors(preset);
    setPsInstances(ps);
    setVsInstances(vs);
    setSbInstances(sb);
    setSsInstances(ss);
    setS2dInstances(s2d);
    setFireAndSmokeInstances(fireAndSmoke);
    setAttractorVersion((c) => c + 1);
  }, [preset]); // only preset is the intended dependency

  // ── Point update callbacks (for 3D handle interaction) ──────────────────────

  const updatePsPoints = useCallback((id, updater) => {
    setPsInstances((prev) =>
      prev.map((x) =>
        x.id === id
          ? {
              ...x,
              points:
                typeof updater === 'function' ? updater(x.points) : updater,
            }
          : x
      )
    );
  }, []);

  const updateVsPoints = useCallback((id, updater) => {
    setVsInstances((prev) =>
      prev.map((x) =>
        x.id === id
          ? {
              ...x,
              points:
                typeof updater === 'function' ? updater(x.points) : updater,
            }
          : x
      )
    );
  }, []);

  const updateSsPoints = useCallback((id, updater) => {
    setSsInstances((prev) =>
      prev.map((x) =>
        x.id === id
          ? {
              ...x,
              controlPoints:
                typeof updater === 'function'
                  ? updater(x.controlPoints)
                  : updater,
            }
          : x
      )
    );
  }, []);

  const updateFireAndSmokePoints = useCallback((id, updater) => {
    setFireAndSmokeInstances((prev) =>
      prev.map((x) =>
        x.id === id
          ? {
              ...x,
              controlPoints:
                typeof updater === 'function'
                  ? updater(x.controlPoints)
                  : updater,
            }
          : x
      )
    );
  }, []);

  // ── Return ───────────────────────────────────────────────────────────────────

  return {
    bgColor,
    lineColor,
    psInstances,
    vsInstances,
    sbInstances,
    ssInstances,
    s2dInstances,
    fireAndSmokeInstances,
    attractorMode,
    showAttractors,
    attractorStrength,
    attractorRadius,
    attractorVersion,
    updatePsPoints,
    updateVsPoints,
    updateSsPoints,
    updateFireAndSmokePoints,
  };
}
