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
  FiShuffle,
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
  CLIP_SECONDS,
  CONFIG_KEYS,
  PAINTING_VIEW,
  SCENE_KEYS,
  frameRabbit,
  needsCoverage,
  needsDepth,
  plotArgs,
  randomSeed,
  renderRabbitSvg,
} from '@modules/rabbit';
import {
  RabbitStudio,
  aimCamera,
  createDepthCapture,
  depthProbe,
  rabbitOnly,
  readSubject,
  subjectPoints,
  subjectReady,
  tightRows,
} from '@modules/rabbitRender';

const DEG = 180 / Math.PI;
const OCCLUSION_BIAS = 0.004;

const SLIDERS = [
  {
    key: 'poseTime',
    label: 'Moment',
    max: CLIP_SECONDS,
    min: 0,
    step: 0.05,
    unit: 's',
  },
  {
    key: 'ribbonWind',
    label: 'Ribbon wind',
    max: 6,
    min: 0,
    step: 0.1,
    unit: '',
  },
  {
    key: 'grassWind',
    label: 'Grass wind',
    max: 1.5,
    min: 0,
    step: 0.01,
    unit: '',
  },
];

const wrapClip = (seconds) =>
  ((seconds % CLIP_SECONDS) + CLIP_SECONDS) % CLIP_SECONDS;
const wrapDegrees = (degrees) => ((((degrees + 180) % 360) + 360) % 360) - 180;
const round = (value, step) =>
  Number((Math.round(value / step) * step).toFixed(4));

const typing = (event) =>
  ['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target?.tagName);

function boundsOf(handles) {
  return subjectReady(handles) ? { points: subjectPoints(handles) } : null;
}

// Near and far round the subject from wherever the orbit put the camera.
function fitDepthRange(camera, bounds) {
  if (!bounds) return;
  const sphere = new THREE.Sphere().setFromPoints(
    bounds.points.map((p) => new THREE.Vector3(...p))
  );
  const reach = camera.position.distanceTo(sphere.center);
  Object.assign(camera, {
    far: reach + sphere.radius * 2.5,
    near: Math.max(0.01, reach - sphere.radius * 1.5),
  });
  camera.updateProjectionMatrix();
}

// Lives inside the canvas: owns the camera framing and the capture, which
// both need the R3F state.
function Director({ bridgeRef, config, handles, options, paused }) {
  const get = useThree((state) => state.get);
  const captureDepth = useMemo(() => createDepthCapture(get().gl), [get]);
  const frozenRef = useRef(0);
  const liveRef = useLiveClock();

  const render = useCallback(() => {
    stepFrozen(get(), frozenRef.current);
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
    const bounds = boundsOf(handles);
    if (!bounds) return false;
    const { camera, controls, size } = get();
    const view = frameRabbit({
      bounds,
      config: { ...config, viewRoll: 0, viewShiftY: 0 },
      options,
      view: 'hero',
    });
    aimCamera(camera, view, size.width / size.height);
    camera.up.set(0, 1, 0);
    camera.lookAt(...view.target);
    fitDepthRange(camera, bounds);
    controls?.target.set(...view.target);
    controls?.update();
    if (paused) render();
    return true;
  }, [config, get, handles, options, paused, render]);

  // The camera as the generation's own view keys, measured against the
  // framing the CLI would fit, so a CLI re-render starts from this view.
  const cameraKeys = useCallback(() => {
    const bounds = boundsOf(handles);
    const { camera, controls } = get();
    const target = controls?.target ?? new THREE.Vector3();
    const offset = camera.position.clone().sub(target);
    const distance = offset.length();
    const azimuth = Math.round(
      wrapDegrees(Math.atan2(offset.x, offset.z) * DEG - PAINTING_VIEW.azimuth)
    );
    const elevation = Math.round(
      Math.asin(THREE.MathUtils.clamp(offset.y / distance, -1, 1)) * DEG
    );
    const keys = {
      viewAzimuth: azimuth,
      viewElevation: elevation,
      viewRoll: 0,
      viewShiftY: 0,
      viewZoom: 1,
    };
    if (!bounds) return keys;
    const fit = frameRabbit({
      bounds,
      config: { ...config, ...keys },
      options,
      view: 'hero',
    });
    const fitDistance = Math.hypot(
      fit.eye[0] - fit.target[0],
      fit.eye[1] - fit.target[1],
      fit.eye[2] - fit.target[2]
    );
    return {
      ...keys,
      viewZoom: Number(
        THREE.MathUtils.clamp(fitDistance / distance, 0.3, 4).toFixed(2)
      ),
    };
  }, [config, get, handles, options]);

  // The clip time the rabbit is held at, for the capture's sidecar.
  const moment = useCallback(
    () => round(wrapClip(handles.model?.mixer.time ?? config.poseTime), 0.05),
    [config.poseTime, handles]
  );

  const capture = useCallback(async () => {
    const state = get();
    const { camera, controls, gl, scene, size } = state;
    const width = Math.round(options.width * options.pixelRatio);
    const height = Math.round(options.height * options.pixelRatio);
    const wasRunning = state.frameloop !== 'never';
    if (wasRunning) frozenRef.current = freezeClock(state, liveRef);
    const restoreSize = captureSize(state, width, height);
    fitDepthRange(camera, boundsOf(handles));
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
      const depthOf = (only) =>
        captureDepth(scene, camera, width, height, only);
      if (needsDepth(options) || needsCoverage(options)) await nextFrame();
      const depth = needsDepth(options) ? await depthOf(handles.subject) : null;
      const coverage = needsCoverage(options)
        ? await depthOf(rabbitOnly(handles))
        : null;
      // eslint-disable-next-line no-underscore-dangle
      const time = gl._nodes?.nodeFrame?.time ?? frozenRef.current;
      svg = renderRabbitSvg({
        ...plotArgs(options, config),
        camera: view,
        coverage,
        image: { data: image, height, width },
        subject: readSubject(handles, time),
        visible: depth
          ? depthProbe(depth, options.pixelRatio, OCCLUSION_BIAS)
          : null,
      });
    }

    restoreSize();
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    if (wasRunning) resumeClock(state);
    else render();
    return { png: await pngBase64(image, width, height), svg };
  }, [captureDepth, config, get, handles, liveRef, options, render]);

  useEffect(() => {
    Object.assign(bridgeRef.current, { cameraKeys, capture, frame, moment });
  }, [bridgeRef, cameraKeys, capture, frame, moment]);

  return (
    <OrbitControls
      enableDamping={false}
      makeDefault
      onChange={() => {
        fitDepthRange(get().camera, boundsOf(handles));
        if (paused) render();
      }}
    />
  );
}

// The Live tab: the hunted rabbit in the workbench's current generation,
// his clip playing in from `settle` seconds before the form's moment. Pause
// on the frame you want, roll a volley, orbit, then capture what you see —
// the capture goes through the CLI's finishing step like any still.
export default function LiveRabbit({ jobsApi, options, setOptions }) {
  const config = useMemo(
    () => Object.fromEntries(CONFIG_KEYS.map((key) => [key, options[key]])),
    [options]
  );
  const sceneConfig = useMemo(
    () => Object.fromEntries(SCENE_KEYS.map((key) => [key, config[key]])),
    [config]
  );
  const startTime = wrapClip(config.poseTime - (config.settle ?? 0));
  const bridgeRef = useRef({});
  const [paused, setPaused] = useState(false);
  const [stageKey, setStageKey] = useState(0);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const handles = useMemo(() => ({}), [stageKey, startTime]);

  const capture = useCallback(async () => {
    if (busy || !bridgeRef.current.capture) return;
    setBusy(true);
    setStatus('Capturing…');
    try {
      const shot = await bridgeRef.current.capture();
      const poseTime = bridgeRef.current.moment();
      const name = `live-${config.volley}-${poseTime}s-${Date.now().toString(36)}`;
      await postJson('/dev-api/rabbit/captures', {
        config: { ...config, ...bridgeRef.current.cameraKeys(), poseTime },
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

  const rollVolley = useCallback(() => {
    setOptions((current) => ({
      ...current,
      volley: 'rolled',
      volleySeed: 1 + (parseInt(randomSeed(), 36) % 99999),
    }));
  }, [setOptions]);

  const useCamera = useCallback(() => {
    const keys = bridgeRef.current.cameraKeys?.();
    if (!keys) return;
    setOptions((current) => ({ ...current, ...keys }));
    setStatus('Camera copied to the form.');
  }, [setOptions]);

  const useMoment = useCallback(() => {
    const poseTime = bridgeRef.current.moment?.();
    if (poseTime == null) return;
    setOption('poseTime', poseTime);
    setStatus(`Moment ${poseTime}s copied to the form.`);
  }, [setOption]);

  useEffect(() => {
    let timer = null;
    const tryFrame = () => {
      if (!bridgeRef.current.frame?.()) timer = setTimeout(tryFrame, 300);
    };
    timer = setTimeout(tryFrame, 600);
    return () => clearTimeout(timer);
  }, [stageKey, startTime]);

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
      } else if (key === 'v') {
        rollVolley();
      } else if (key === 'p') {
        setOption('volley', 'painting');
      } else if (key === 'm') {
        useMoment();
      }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [capture, restart, rollVolley, setOption, useMoment]);

  // Memoised so capture status updates never re-render the canvas: R3F
  // re-syncs its frameloop to the prop on every canvas render.
  const stage = useMemo(
    () => (
      <WebGPUCanvas frameloop={paused ? 'never' : 'always'}>
        <RabbitStudio
          config={sceneConfig}
          handles={handles}
          key={`${stageKey}:${startTime}`}
          startTime={startTime}
          transparent={options.transparent}
        />
        <Director
          bridgeRef={bridgeRef}
          config={config}
          handles={handles}
          options={options}
          paused={paused}
        />
      </WebGPUCanvas>
    ),
    [config, handles, options, paused, sceneConfig, stageKey, startTime]
  );

  return (
    <div className="rabbit-live">
      <div className="rabbit-live__toolbar">
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
        <button className="dev-button" onClick={useMoment} type="button">
          <FiPause /> Use this moment
        </button>
        <button className="dev-button" onClick={rollVolley} type="button">
          <FiShuffle /> Roll volley
        </button>
        <button
          className="dev-button"
          onClick={() => setOption('volley', 'painting')}
          type="button"
        >
          Painting volley
        </button>
      </div>
      <div className="rw-field-grid rabbit-live__sliders">
        {SLIDERS.map(({ key, label, max, min, step, unit }) => (
          <label className="rw-field" htmlFor={`rabbit-live-${key}`} key={key}>
            {label} · {options[key]}
            {unit}
            <input
              id={`rabbit-live-${key}`}
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
      <p className="rw-hint">
        Space pause · C capture · R restart (plays into the moment again) · F
        frame · M use this moment · V roll volley · P painting volley · drag to
        orbit. Captures use the form&apos;s size, formats, SVG and overlay
        settings.
      </p>
      <div
        className="rabbit-live__stage"
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
