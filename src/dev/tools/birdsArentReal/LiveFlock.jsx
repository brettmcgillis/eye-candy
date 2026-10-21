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
  GAZES,
  SCENE_KEYS,
  flockBounds,
  frameFlock,
  layoutFlock,
  needsDepth,
  plotArgs,
  renderFlockSvg,
} from '@modules/birdsArentReal';
import {
  BirdStudio,
  aimCamera,
  createDepthCapture,
  depthProbe,
  readFlockMesh,
  tightRows,
} from '@modules/birdsArentRealRender';

const DEG = 180 / Math.PI;

const GAZE_LABELS = { ahead: 'Ahead', camera: 'At camera', sweep: 'Sweep' };

const SLIDERS = [
  {
    key: 'sweepRange',
    label: 'Sweep',
    max: 1.6,
    min: 0,
    step: 0.01,
    unit: '',
  },
  {
    key: 'sweepSpeed',
    label: 'Sweep speed',
    max: 3,
    min: 0,
    step: 0.01,
    unit: '',
  },
  {
    key: 'lightAzimuth',
    label: 'Key from',
    max: 180,
    min: -180,
    step: 1,
    unit: '°',
  },
];

// Near and far round the flock from wherever the orbit put the camera, so
// zooming in never clips it and the depth pass keeps its precision.
function fitDepthRange(camera, bounds) {
  const reach = camera.position.distanceTo(new THREE.Vector3(...bounds.center));
  Object.assign(camera, {
    far: reach + bounds.radius * 2.5,
    near: Math.max(0.01, reach - bounds.radius * 1.5),
  });
  camera.updateProjectionMatrix();
}

const typing = (event) =>
  ['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target?.tagName);

// Lives inside the canvas: owns the camera framing and the capture, which
// both need the R3F state.
function Director({ bridgeRef, config, flockRef, options, paused }) {
  const get = useThree((state) => state.get);
  const captureDepth = useMemo(() => createDepthCapture(get().gl), [get]);
  const frozenRef = useRef(0);
  const liveRef = useLiveClock();
  const bounds = useMemo(() => flockBounds(layoutFlock(config)), [config]);

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

  const frame = useCallback(() => {
    const { camera, controls, size } = get();
    const view = frameFlock({
      bounds,
      config: { ...config, cameraRoll: 0, cameraShiftY: 0 },
      options,
      view: 'hero',
    });
    aimCamera(camera, view, size.width / size.height);
    // aimCamera leaves up view-perpendicular; orbiting about it rolls the floor.
    camera.up.set(0, 1, 0);
    camera.lookAt(...view.target);
    fitDepthRange(camera, bounds);
    controls?.target.set(...view.target);
    controls?.update();
    if (paused) render();
  }, [bounds, config, get, options, paused, render]);

  // The camera as the generation's own camera keys, measured against the
  // framing the CLI would fit, so a CLI re-render starts from this view.
  const cameraKeys = useCallback(() => {
    const { camera, controls } = get();
    const target = controls?.target ?? new THREE.Vector3();
    const offset = camera.position.clone().sub(target);
    const distance = offset.length();
    const azimuth = Math.round(Math.atan2(offset.x, offset.z) * DEG);
    const elevation = Math.round(
      Math.asin(THREE.MathUtils.clamp(offset.y / distance, -1, 1)) * DEG
    );
    const fit = frameFlock({
      bounds,
      config: {
        ...config,
        cameraAzimuth: azimuth,
        cameraElevation: elevation,
        cameraRoll: 0,
        cameraShiftY: 0,
        cameraZoom: 1,
      },
      options,
      view: 'hero',
    });
    const fitDistance = Math.hypot(
      fit.eye[0] - fit.target[0],
      fit.eye[1] - fit.target[1],
      fit.eye[2] - fit.target[2]
    );
    return {
      cameraAzimuth: azimuth,
      cameraElevation: elevation,
      cameraRoll: 0,
      cameraShiftY: 0,
      cameraZoom: Number(
        THREE.MathUtils.clamp(fitDistance / distance, 0.3, 4).toFixed(2)
      ),
    };
  }, [bounds, config, get, options]);

  const capture = useCallback(async () => {
    const state = get();
    const { camera, controls, gl, scene, size } = state;
    const width = Math.round(options.width * options.pixelRatio);
    const height = Math.round(options.height * options.pixelRatio);
    const wasRunning = state.frameloop !== 'never';
    if (wasRunning) frozenRef.current = freezeClock(state, liveRef);
    const restoreSize = captureSize(state, width, height);
    fitDepthRange(camera, bounds);
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
      const view = {
        eye: camera.position.toArray(),
        far: camera.far,
        fov: camera.fov,
        near: camera.near,
        target: (controls?.target ?? new THREE.Vector3()).toArray(),
        up: camera.up.toArray(),
      };
      if (needsDepth(options)) await nextFrame();
      const depth = needsDepth(options)
        ? await captureDepth(scene, camera, width, height, flockRef.current)
        : null;
      svg = renderFlockSvg({
        ...plotArgs(options),
        camera: view,
        coverage: depth,
        flock: readFlockMesh(flockRef.current),
        image: { data: image, height, width },
        visible: options.svgOcclusion
          ? depthProbe(depth, options.pixelRatio, 0.01)
          : null,
      });
    }

    restoreSize();
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    if (wasRunning) resumeClock(state);
    else render();
    return { png: await pngBase64(image, width, height), svg };
  }, [bounds, captureDepth, flockRef, get, liveRef, options, render]);

  useEffect(() => {
    Object.assign(bridgeRef.current, { cameraKeys, capture, frame });
  }, [bridgeRef, cameraKeys, capture, frame]);

  return (
    <OrbitControls
      enableDamping={false}
      makeDefault
      onChange={() => {
        fitDepthRange(get().camera, bounds);
        if (paused) render();
      }}
    />
  );
}

// The Live tab: a running flock in the workbench's current generation.
// Pose it with the form, set the gaze, make every lens stare at the cursor,
// orbit it, then capture what you see — the capture goes through the CLI's
// finishing step like any still.
export default function LiveFlock({ jobsApi, options, setOptions }) {
  const config = useMemo(
    () => Object.fromEntries(SCENE_KEYS.map((key) => [key, options[key]])),
    [options]
  );
  const flockRef = useRef(null);
  const bridgeRef = useRef({});
  const [paused, setPaused] = useState(false);
  const [stare, setStare] = useState(false);
  const [stageKey, setStageKey] = useState(0);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const capture = useCallback(async () => {
    if (busy || !bridgeRef.current.capture) return;
    setBusy(true);
    setStatus('Capturing…');
    try {
      const shot = await bridgeRef.current.capture();
      const name = `live-${config.birdCount}-${config.arrangement}-${Date.now().toString(36)}`;
      await postJson('/dev-api/birdsArentReal/captures', {
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
    setStatus(null);
  }, []);

  const setOption = useCallback(
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
      } else if (key === 't') {
        setStare((value) => !value);
      } else if (['1', '2', '3'].includes(key)) {
        setOption('gaze', GAZES[Number(key) - 1]);
      }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [capture, restart, setOption]);

  // Memoised so capture status updates never re-render the canvas: R3F
  // re-syncs its frameloop to the prop on every canvas render.
  const stage = useMemo(
    () => (
      <WebGPUCanvas frameloop={paused ? 'never' : 'always'}>
        <BirdStudio
          config={config}
          flockRef={flockRef}
          key={stageKey}
          stareAtCursor={stare && !paused}
        />
        <Director
          bridgeRef={bridgeRef}
          config={config}
          flockRef={flockRef}
          options={options}
          paused={paused}
        />
      </WebGPUCanvas>
    ),
    [config, options, paused, stageKey, stare]
  );

  return (
    <div className="bar-live">
      <div className="bar-live__toolbar">
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
        <label className="bar-live__toggle" htmlFor="bar-live-stare">
          <input
            checked={stare}
            id="bar-live-stare"
            onChange={(event) => setStare(event.target.checked)}
            type="checkbox"
          />
          Stare at cursor
        </label>
      </div>
      <div className="bar-live__panel">
        <div className="rw-segmented">
          {GAZES.map((gaze, i) => (
            <button
              aria-pressed={options.gaze === gaze}
              className="rw-segmented__button"
              key={gaze}
              onClick={() => setOption('gaze', gaze)}
              title={`${GAZE_LABELS[gaze]} (${i + 1})`}
              type="button"
            >
              {GAZE_LABELS[gaze]}
            </button>
          ))}
        </div>
        <div className="rw-field-grid bar-live__sliders">
          {SLIDERS.map(({ key, label, max, min, step, unit }) => (
            <label className="rw-field" htmlFor={`bar-live-${key}`} key={key}>
              {label} · {options[key]}
              {unit}
              <input
                id={`bar-live-${key}`}
                max={max}
                min={min}
                onChange={(event) => setOption(key, Number(event.target.value))}
                step={step}
                type="range"
                value={options[key]}
              />
            </label>
          ))}
        </div>
      </div>
      <p className="rw-hint">
        Space pause · C capture · R restart · F frame · T stare at cursor · 1
        sweep · 2 at camera · 3 ahead · drag to orbit. Captures use the
        form&apos;s size, formats, SVG and overlay settings.
      </p>
      <div
        className="bar-live__stage"
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
