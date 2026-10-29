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
  FiWind,
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
  FLAME_STATES,
  SCENE_KEYS,
  candleBounds,
  candleForm,
  frameCandle,
  needsDepth,
  plotArgs,
  renderCandleSvg,
} from '@modules/candle';
import {
  CandleStage,
  aimCamera,
  candleMeshes,
  createDepthCapture,
  depthProbe,
  effectGlow,
  readFlameFields,
  readSmokeBalls,
  readSmokeDots,
  readWax,
  showEffects,
  tightRows,
} from '@modules/candleRender';

import './CandleWorkbenchPage.css';

const SLIDERS = [
  { key: 'flameFlicker', label: 'Flicker', max: 3, min: 0, step: 0.01 },
  { key: 'flameSize', label: 'Flame size', max: 2.5, min: 0.4, step: 0.01 },
  { key: 'smokeCurl', label: 'Smoke curl', max: 5, min: 0, step: 0.01 },
  { key: 'smokeLaminar', label: 'Laminar', max: 4, min: 0, step: 0.01 },
];

const typing = (event) =>
  ['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target?.tagName);

const DEG = 180 / Math.PI;

// The plot's smoke: stipple for the realistic look, circles for puffs and
// clay balls.
async function liveSmoke(options, config, effects) {
  if (!(options.svgSmokeDots > 0) || config.smoke !== 'curl') return null;
  if (config.look !== 'realistic') {
    return { balls: await readSmokeBalls(effects) };
  }
  return { density: options.svgSmokeDots, dots: await readSmokeDots(effects) };
}

// Lives inside the canvas: owns framing and the capture, which both need
// the R3F state.
function Director({
  bridgeRef,
  config,
  effectsRef,
  options,
  paused,
  solidsRef,
}) {
  const get = useThree((state) => state.get);
  const captureDepth = useMemo(() => createDepthCapture(get().gl), [get]);
  const frozenRef = useRef(0);
  const liveRef = useLiveClock();
  const bounds = useMemo(
    () => candleBounds(config, candleForm(config)),
    [config]
  );

  const render = useCallback(() => stepFrozen(get(), frozenRef.current), [get]);

  useEffect(() => {
    const state = get();
    if (paused) {
      frozenRef.current = freezeClock(state, liveRef);
      render();
    } else {
      resumeClock(state);
    }
  }, [get, liveRef, paused, render]);

  const frame = useCallback(
    (view = 'hero') => {
      const { camera, controls, size } = get();
      const fitted = frameCandle({ bounds, options, view });
      aimCamera(camera, fitted, size.width / size.height);
      camera.up.set(0, 1, 0);
      camera.lookAt(...fitted.target);
      controls?.target.set(...fitted.target);
      controls?.update();
      if (paused) render();
    },
    [bounds, get, options, paused, render]
  );

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

    const renderNow = async () => {
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
      return tightRows(pixels, width, height);
    };
    // A legacy flame or smoke has nothing to read back, so the plot takes
    // the brightness it adds over a render without it.
    const glowOf = async (kind, shown) => {
      showEffects(scene, kind, false);
      const hidden = await renderNow();
      showEffects(scene, kind, true);
      return effectGlow(
        { data: shown, height, width },
        { data: hidden, height, width }
      );
    };
    const image = await renderNow();

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
        ? await captureDepth(
            scene,
            camera,
            width,
            height,
            candleMeshes(solidsRef.current)
          )
        : null;
      const effects = effectsRef.current;
      const legacyFlame =
        config.flame === 'shader' || config.flame === 'slices';
      const legacySmoke =
        config.smoke === 'billboard' || config.smoke === 'ribbon';
      const flameGlow =
        legacyFlame && options.svgIsotherms > 0
          ? await glowOf('flame', image)
          : null;
      const smoke =
        legacySmoke && options.svgSmokeDots > 0
          ? {
              density: options.svgSmokeDots,
              glow: await glowOf('smoke', image),
            }
          : await liveSmoke(options, config, effects);
      svg = renderCandleSvg({
        ...plotArgs(options),
        camera: view,
        coverage: depth,
        flames:
          options.svgIsotherms > 0 && config.flame === 'sim'
            ? await readFlameFields(effects)
            : [],
        flameGlow,
        image: { data: image, height, width },
        smoke,
        visible: options.svgOcclusion
          ? depthProbe(depth, options.pixelRatio, 0.01)
          : null,
        wax: readWax(solidsRef.current),
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
    config,
    effectsRef,
    get,
    liveRef,
    options,
    render,
    solidsRef,
  ]);

  // The orbit as degrees round the candle, for the sidecar's notes.
  const cameraNote = useCallback(() => {
    const { camera, controls } = get();
    const offset = camera.position
      .clone()
      .sub(controls?.target ?? new THREE.Vector3());
    return {
      azimuth: Math.round(Math.atan2(offset.x, offset.z) * DEG),
      elevation: Math.round(
        Math.asin(THREE.MathUtils.clamp(offset.y / offset.length(), -1, 1)) *
          DEG
      ),
    };
  }, [get]);

  useEffect(() => {
    Object.assign(bridgeRef.current, { cameraNote, capture, frame });
  }, [bridgeRef, cameraNote, capture, frame]);

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

// The Live tab: the workbench's current generation burning in the page.
// Orbit it, pause on the flame you want, snuff it and catch the smoke, then
// capture — the capture finishes through the CLI like any still.
export default function LiveCandle({ jobsApi, options, setOptions }) {
  const config = useMemo(
    () => Object.fromEntries(SCENE_KEYS.map((key) => [key, options[key]])),
    [options]
  );
  const solidsRef = useRef(null);
  const effectsRef = useRef(null);
  const bridgeRef = useRef({});
  const [paused, setPaused] = useState(false);
  const [snuffed, setSnuffed] = useState(false);
  const [stageKey, setStageKey] = useState(0);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const capture = useCallback(async () => {
    if (busy || !bridgeRef.current.capture) return;
    setBusy(true);
    setStatus('Capturing…');
    try {
      const shot = await bridgeRef.current.capture();
      const name = `live-${config.flame}-${config.profile}-${Date.now().toString(36)}`;
      await postJson('/dev-api/candle/captures', {
        config,
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
    setSnuffed(false);
    setStatus(null);
  }, []);

  const setOption = useCallback(
    (key, value) => setOptions((current) => ({ ...current, [key]: value })),
    [setOptions]
  );

  useEffect(() => {
    const timer = setTimeout(() => bridgeRef.current.frame?.(), 600);
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
      } else if (key === 'e') {
        bridgeRef.current.frame?.('end');
      } else if (key === 's') {
        setSnuffed(true);
      } else if (['1', '2', '3', '4', '5'].includes(key)) {
        setOption('flameState', FLAME_STATES[Number(key) - 1]);
      }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [capture, restart, setOption]);

  // Memoised so capture status updates never re-render the canvas.
  const stage = useMemo(
    () => (
      <WebGPUCanvas frameloop={paused ? 'never' : 'always'}>
        <CandleStage
          config={config}
          effectsRef={effectsRef}
          key={stageKey}
          snuffed={snuffed}
          solidsRef={solidsRef}
          transparent={options.transparent}
        />
        <Director
          bridgeRef={bridgeRef}
          config={config}
          effectsRef={effectsRef}
          options={options}
          paused={paused}
          solidsRef={solidsRef}
        />
      </WebGPUCanvas>
    ),
    [config, options, paused, snuffed, stageKey]
  );

  return (
    <div className="candle-live">
      <div className="candle-live__toolbar">
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
          <FiRotateCcw /> Relight
        </button>
        <button
          className="dev-button"
          disabled={snuffed || config.flame === 'out'}
          onClick={() => setSnuffed(true)}
          type="button"
        >
          <FiWind /> Snuff
        </button>
        <button
          className="dev-button"
          onClick={() => bridgeRef.current.frame?.()}
          type="button"
        >
          <FiCrosshair /> Frame
        </button>
        <button
          className="dev-button"
          onClick={() => bridgeRef.current.frame?.('end')}
          type="button"
        >
          <FiVideo /> End close-up
        </button>
      </div>
      <div className="candle-live__panel">
        <div className="rw-segmented">
          {FLAME_STATES.map((state, i) => (
            <button
              aria-pressed={options.flameState === state}
              className="rw-segmented__button"
              key={state}
              onClick={() => setOption('flameState', state)}
              title={`${state} (${i + 1})`}
              type="button"
            >
              {state}
            </button>
          ))}
        </div>
        <div className="rw-field-grid candle-live__sliders">
          {SLIDERS.map(({ key, label, max, min, step }) => (
            <label
              className="rw-field"
              htmlFor={`candle-live-${key}`}
              key={key}
            >
              {label} · {options[key]}
              <input
                id={`candle-live-${key}`}
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
        Space pause · C capture · R relight · S snuff · F frame · E end close-up
        · 1–5 flame state · drag to orbit. Captures use the form&apos;s size,
        formats, SVG and overlay settings.
      </p>
      <div
        className="candle-live__stage"
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
