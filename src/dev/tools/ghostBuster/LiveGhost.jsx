import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FiCamera,
  FiCrosshair,
  FiPause,
  FiPlay,
  FiRotateCcw,
  FiVideo,
} from 'react-icons/fi';

import pngBase64, {
  captureSize,
  freezeClock,
  nextFrame,
  resumeClock,
  stepFrozen,
  useLiveClock,
} from '@dev/renderWorkbench/liveCapture';
import { postJson } from '@dev/renderWorkbench/useRenderJobs';
import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import WebGPUCanvas from '@app/scaffold/canvas/WebGPUCanvas';
import {
  GHOST_BOUNDS,
  SCENE_KEYS,
  frameGhost,
  latticeBounds,
  needsDepth,
  plotArgs,
  renderGhostSvg,
  unionOf,
  withStorm,
} from '@modules/ghostBuster';
import {
  GhostStudio,
  aimCamera,
  createDepthCapture,
  createNormalCapture,
  depthProbe,
  readGhostLattice,
  readStormPlot,
  resolveSkin,
} from '@modules/ghostBusterRender';
import { tightRows } from '@modules/renderStage';

const DEG = 180 / Math.PI;
const GUST_KEYS = {
  a: [1, 0],
  arrowdown: [0, -1],
  arrowleft: [1, 0],
  arrowright: [-1, 0],
  arrowup: [0, 1],
  d: [-1, 0],
  s: [0, -1],
  w: [0, 1],
};

const ACTIONS = [
  { id: 'wave', key: '1', label: 'Wave' },
  { id: 'clap', key: '2', label: 'Clap' },
];

const WIND_SLIDERS = [
  {
    key: 'windAngle',
    label: 'Wind from',
    max: 359,
    min: 0,
    step: 1,
    unit: '°',
  },
  { key: 'windStrength', label: 'Wind', max: 3, min: 0, step: 0.01, unit: '' },
  { key: 'windGust', label: 'Gust', max: 1, min: 0, step: 0.01, unit: '' },
];

const typing = (event) =>
  ['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target?.tagName);

// Lives inside the canvas: owns the camera framing and the capture, which
// both need the R3F state.
function Director({ bridgeRef, config, ghostRef, options, paused, stormRef }) {
  const get = useThree((state) => state.get);
  const captureDepth = useMemo(() => createDepthCapture(get().gl), [get]);
  const captureNormals = useMemo(() => createNormalCapture(get().gl), [get]);
  const boundsRef = useRef(GHOST_BOUNDS);
  const frozenRef = useRef(0);
  const liveRef = useLiveClock();

  const render = useCallback(() => {
    const state = get();
    stepFrozen(state, frozenRef.current);
  }, [get]);

  useEffect(() => {
    const state = get();
    if (paused) {
      frozenRef.current = freezeClock(state, liveRef);
      render();
    } else {
      resumeClock(state);
    }
  }, [get, liveRef, paused, render]);

  useEffect(() => {
    if (paused) render();
  }, [config, paused, render]);

  const frame = useCallback(
    (bounds = boundsRef.current) => {
      const { camera, controls, size } = get();
      const view = frameGhost({
        bounds,
        config: { ...config, cameraRoll: 0, cameraShiftY: 0 },
        options,
        view: 'hero',
      });
      aimCamera(camera, view, size.width / size.height);
      // aimCamera leaves up view-perpendicular; orbiting about it rolls the floor.
      camera.up.set(0, 1, 0);
      camera.lookAt(...view.target);
      controls?.target.set(...view.target);
      controls?.update();
      if (paused) render();
    },
    [config, get, options, paused, render]
  );

  const measure = useCallback(async () => {
    const ghost = ghostRef.current;
    if (!ghost?.sim) return boundsRef.current;
    const lattice = await readGhostLattice(get().gl, ghost, config.skin);
    boundsRef.current =
      withStorm(latticeBounds(lattice), stormRef.current?.extent()) ??
      GHOST_BOUNDS;
    return boundsRef.current;
  }, [config.skin, get, ghostRef, stormRef]);

  // The camera as the generation's own camera keys, measured against the
  // framing the CLI would fit, so a CLI re-render starts from this view.
  const cameraKeys = useCallback(() => {
    const { camera, controls } = get();
    const target = controls?.target ?? new THREE.Vector3();
    const offset = camera.position.clone().sub(target);
    const distance = offset.length();
    const fit = frameGhost({
      bounds: boundsRef.current,
      config: { ...config, cameraShiftY: 0, cameraZoom: 1 },
      options,
      view: 'hero',
    });
    const fitDistance = Math.hypot(
      fit.eye[0] - fit.target[0],
      fit.eye[1] - fit.target[1],
      fit.eye[2] - fit.target[2]
    );
    const round = (value, places = 2) => Number(value.toFixed(places));
    return {
      cameraAzimuth: Math.round(Math.atan2(offset.x, offset.z) * DEG),
      cameraElevation: Math.round(
        Math.asin(THREE.MathUtils.clamp(offset.y / distance, -1, 1)) * DEG
      ),
      cameraRoll: 0,
      cameraShiftY: 0,
      cameraZoom: round(THREE.MathUtils.clamp(fitDistance / distance, 0.3, 4)),
    };
  }, [config, get, options]);

  const capture = useCallback(async () => {
    const state = get();
    const { camera, controls, gl, scene, size } = state;
    const width = Math.round(options.width * options.pixelRatio);
    const height = Math.round(options.height * options.pixelRatio);
    const wasRunning = state.frameloop !== 'never';
    if (wasRunning) frozenRef.current = freezeClock(state, liveRef);
    const restoreSize = captureSize(state, width, height);
    camera.aspect = options.width / options.height;
    camera.updateProjectionMatrix();

    const target = new THREE.RenderTarget(width, height, {
      colorSpace: THREE.NoColorSpace,
      samples: 4,
    });
    await nextFrame();
    gl.setOutputRenderTarget(target);
    stepFrozen(state, frozenRef.current);
    gl.setOutputRenderTarget(null);
    const pixels = await gl.readRenderTargetPixelsAsync(
      target,
      0,
      0,
      width,
      height
    );
    target.dispose();
    const image = tightRows(pixels, width, height);

    let svg = null;
    if (options.svg) {
      const lattice = await readGhostLattice(gl, ghostRef.current, config.skin);
      const view = {
        eye: camera.position.toArray(),
        far: camera.far,
        fov: camera.fov,
        near: camera.near,
        target: (controls?.target ?? new THREE.Vector3()).toArray(),
        up: camera.up.toArray(),
      };
      if (needsDepth(options)) await nextFrame();
      const pass = (captureOf) => (only) =>
        captureOf(scene, camera, width, height, only);
      const depthOf = pass(captureDepth);
      const depth = needsDepth(options)
        ? await depthOf(ghostRef.current.mesh)
        : null;
      const storm =
        options.svgStorm && stormRef.current
          ? await readStormPlot(gl, stormRef.current, {
              depthOf,
              normalsOf: pass(captureNormals),
            })
          : null;
      svg = renderGhostSvg({
        ...plotArgs(options, resolveSkin(config.skin)),
        camera: view,
        coverage: depth,
        image: { data: image, height, width },
        lattice,
        storm,
        time: frozenRef.current,
        visible: options.svgOcclusion
          ? depthProbe(
              unionOf(depth, storm?.cloud?.coverage),
              options.pixelRatio
            )
          : null,
      });
    }

    restoreSize();
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    if (wasRunning) resumeClock(state);
    else render();
    return { png: await pngBase64(image, width, height), svg };
  }, [
    captureDepth,
    captureNormals,
    config.skin,
    get,
    ghostRef,
    liveRef,
    options,
    render,
    stormRef,
  ]);

  useEffect(() => {
    Object.assign(bridgeRef.current, {
      cameraKeys,
      capture,
      frame: async () => frame(await measure()),
    });
  }, [bridgeRef, cameraKeys, capture, frame, measure]);

  return (
    <OrbitControls
      enableDamping={false}
      makeDefault
      onChange={() => {
        if (paused) render();
      }}
    />
  );
}

// The Live tab: a running ghost in the workbench's current generation. Pose
// it with the form, gust it with WASD, orbit it, then capture what you see —
// the capture goes through the CLI's finishing step like any still.
export default function LiveGhost({ jobsApi, options, setOptions }) {
  const config = useMemo(
    () => Object.fromEntries(SCENE_KEYS.map((key) => [key, options[key]])),
    [options]
  );
  const ghostRef = useRef(null);
  const stormRef = useRef(null);
  const gustRef = useRef({ strength: 0, x: 0, z: 0 });
  const jumpRef = useRef(false);
  const bridgeRef = useRef({});
  const [paused, setPaused] = useState(false);
  const [poke, setPoke] = useState(true);
  const [action, setAction] = useState(null);
  const [stageKey, setStageKey] = useState(0);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const capture = useCallback(async () => {
    if (busy || !bridgeRef.current.capture) return;
    setBusy(true);
    setStatus('Capturing…');
    try {
      const shot = await bridgeRef.current.capture();
      const name = `live-${String(config.skin).replace(/\W/gu, '')}-${Date.now().toString(36)}`;
      await postJson('/dev-api/ghostBuster/captures', {
        config: { ...config, ...bridgeRef.current.cameraKeys() },
        name,
        options,
        png: shot.png,
        svg: shot.svg,
      });
      await jobsApi.refresh();
      setStatus(`Captured ${name} — finishing in Transient.`);
    } catch (error) {
      setStatus(`Capture failed: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }, [busy, config, jobsApi, options]);

  const restart = useCallback(() => {
    setStageKey((key) => key + 1);
    setAction(null);
    setStatus(null);
  }, []);

  const toggleAction = useCallback((id) => {
    const ghost = ghostRef.current;
    if (!ghost) return;
    if (id === null || ghost.activeAnimation === id) {
      ghost.stopAnimation();
      setAction(null);
    } else {
      ghost.playAnimation(id);
      setAction(id);
    }
  }, []);

  const jump = useCallback(() => {
    jumpRef.current = true;
  }, []);

  const setWind = useCallback(
    (key, value) => setOptions((current) => ({ ...current, [key]: value })),
    [setOptions]
  );

  const useCamera = useCallback(() => {
    const keys = bridgeRef.current.cameraKeys?.();
    if (!keys) return;
    setOptions((current) => ({ ...current, ...keys }));
    setStatus('Camera copied to the form.');
  }, [setOptions]);

  useEffect(() => {
    const timer = setTimeout(() => bridgeRef.current.frame?.(), 1500);
    return () => clearTimeout(timer);
  }, [stageKey]);

  useEffect(() => {
    const held = new Set();
    const updateGust = () => {
      let x = 0;
      let z = 0;
      held.forEach((key) => {
        x += GUST_KEYS[key][0];
        z += GUST_KEYS[key][1];
      });
      const length = Math.hypot(x, z);
      gustRef.current =
        length > 0
          ? { strength: 1, x: x / length, z: z / length }
          : { strength: 0, x: 0, z: 0 };
    };
    const down = (event) => {
      if (typing(event) || event.metaKey || event.ctrlKey) return;
      const key = event.key.toLowerCase();
      if (key === ' ') {
        event.preventDefault();
        setPaused((value) => !value);
      } else if (key === 'c' || key === 'enter') {
        event.preventDefault();
        capture();
      } else if (key === 'r') {
        restart();
      } else if (key === 'f') {
        bridgeRef.current.frame?.();
      } else if (key === 'j') {
        jump();
      } else if (key === '0') {
        toggleAction(null);
      } else if (ACTIONS.some((entry) => entry.key === key)) {
        toggleAction(ACTIONS.find((entry) => entry.key === key).id);
      } else if (GUST_KEYS[key]) {
        event.preventDefault();
        held.add(key);
        updateGust();
      }
    };
    const up = (event) => {
      const key = event.key.toLowerCase();
      if (held.delete(key)) updateGust();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [capture, jump, restart, toggleAction]);

  // Memoised so capture status updates never re-render the canvas: R3F
  // re-syncs its frameloop to the prop on every canvas render.
  const stage = useMemo(
    () => (
      <WebGPUCanvas frameloop={paused ? 'never' : 'always'}>
        <GhostStudio
          config={config}
          cursorCollider={poke && !paused}
          ghostRef={ghostRef}
          gustRef={gustRef}
          jumpRef={jumpRef}
          key={stageKey}
          paused={paused}
          stormRef={stormRef}
        />
        <Director
          bridgeRef={bridgeRef}
          config={config}
          ghostRef={ghostRef}
          options={options}
          paused={paused}
          stormRef={stormRef}
        />
      </WebGPUCanvas>
    ),
    [config, options, paused, poke, stageKey]
  );

  return (
    <div className="gb-live">
      <div className="gb-live__toolbar">
        <button
          className="dev-button"
          onClick={() => setPaused((value) => !value)}
          type="button"
        >
          {paused ? <FiPlay /> : <FiPause />} {paused ? 'Resume' : 'Pause'}
        </button>
        <button
          className="dev-button dev-button--primary"
          disabled={busy}
          onClick={capture}
          type="button"
        >
          <FiCamera /> Capture
        </button>
        <button className="dev-button" onClick={restart} type="button">
          <FiRotateCcw /> Restart
        </button>
        <button
          className="dev-button"
          onClick={() => bridgeRef.current.frame?.()}
          type="button"
        >
          <FiCrosshair /> Frame
        </button>
        <button className="dev-button" onClick={useCamera} type="button">
          <FiVideo /> Use this camera
        </button>
        <label className="gb-live__toggle" htmlFor="gb-live-poke">
          <input
            checked={poke}
            id="gb-live-poke"
            onChange={(event) => setPoke(event.target.checked)}
            type="checkbox"
          />
          Poke with cursor
        </label>
      </div>
      <div className="gb-live__panel">
        <div className="rw-segmented gb-live__actions">
          {ACTIONS.map(({ id, key, label }) => (
            <button
              aria-pressed={action === id}
              className="rw-segmented__button"
              disabled={paused}
              key={id}
              onClick={() => toggleAction(id)}
              title={`${label} (${key})`}
              type="button"
            >
              {label}
            </button>
          ))}
          <button
            className="rw-segmented__button"
            disabled={paused}
            onClick={jump}
            title="Jump (J)"
            type="button"
          >
            Jump
          </button>
          <button
            className="rw-segmented__button"
            disabled={paused || action === null}
            onClick={() => toggleAction(null)}
            title="Idle (0)"
            type="button"
          >
            Idle
          </button>
        </div>
        <div className="rw-field-grid gb-live__wind">
          {WIND_SLIDERS.map(({ key, label, max, min, step, unit }) => (
            <label className="rw-field" htmlFor={`gb-live-${key}`} key={key}>
              {label} · {options[key]}
              {unit}
              <input
                id={`gb-live-${key}`}
                max={max}
                min={min}
                onChange={(event) => setWind(key, Number(event.target.value))}
                step={step}
                type="range"
                value={options[key]}
              />
            </label>
          ))}
        </div>
      </div>
      <p className="rw-hint">
        Space pause · C capture · R restart · F frame · WASD gust · 1 wave · 2
        clap · J jump · 0 idle · drag to orbit. Captures use the form&apos;s
        size, formats, SVG and overlay settings.
      </p>
      <div
        className="gb-live__stage"
        style={{
          aspectRatio: `${options.width} / ${options.height}`,
          width: `min(100%, calc(72vh * ${options.width} / ${options.height}))`,
        }}
      >
        {stage}
      </div>
      {status ? <p className="rw-status">{status}</p> : null}
    </div>
  );
}
