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
  CONFIG_KEYS,
  MOODS,
  SMOKE_SYSTEMS,
  flowLines,
  frameDumpster,
  layoutTrash,
  needsDepth,
  needsImage,
  needsSmokeContrast,
  plotArgs,
  renderDumpsterSvg,
  smokeContrast,
  subjectBounds,
} from '@modules/dumpsterFire';
import {
  DumpsterStage,
  aimCamera,
  applySmokeGeneration,
  authoredSmoke,
  createDepthCapture,
  depthProbe,
  fitFog,
  measureSmoke,
  readFlames,
  readSmokeDots,
  readSolids,
  showSmoke,
  smokePaths,
  solidMeshes,
  tightRows,
  trimPaths,
} from '@modules/dumpsterFireRender';

const DEG = 180 / Math.PI;

const SMOKE_LABELS = {
  layered: 'Layered',
  mixed: 'Mixed',
  particles: 'Particles',
  plume: 'Plume',
  volumetric: 'Volumetric',
};

const typing = (event) =>
  ['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target?.tagName);

const distanceOf = (camera, target) => camera.position.distanceTo(target);

// Lives inside the canvas: owns the camera framing and the capture, which
// both need the R3F state.
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
  const paths = useMemo(
    () => smokePaths(applySmokeGeneration(authoredSmoke(), config)),
    [config]
  );

  const render = useCallback(() => {
    stepFrozen(get(), frozenRef.current);
  }, [get]);

  const keepFog = useCallback(() => {
    const { camera, controls, scene } = get();
    if (controls) fitFog(scene, config, distanceOf(camera, controls.target));
  }, [config, get]);

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
    keepFog();
    if (paused) render();
  }, [config, keepFog, paused, render]);

  const boundsNow = useCallback(
    () =>
      subjectBounds({
        frame: config.viewFrame,
        smoke: effectsRef.current ? measureSmoke(effectsRef.current) : [],
        trash: layoutTrash(config),
      }),
    [config, effectsRef]
  );

  const frame = useCallback(() => {
    const { camera, controls, size } = get();
    const view = frameDumpster({
      bounds: boundsNow(),
      config: { ...config, viewRoll: 0, viewShiftY: 0 },
      options,
      view: 'hero',
    });
    aimCamera(camera, view, size.width / size.height);
    camera.up.set(0, 1, 0);
    camera.lookAt(...view.target);
    controls?.target.set(...view.target);
    controls?.update();
    keepFog();
    if (paused) render();
  }, [boundsNow, config, get, keepFog, options, paused, render]);

  // The camera as the generation's own view keys, measured against the
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
    const fit = frameDumpster({
      bounds: boundsNow(),
      config: {
        ...config,
        viewAzimuth: azimuth,
        viewElevation: elevation,
        viewRoll: 0,
        viewShiftY: 0,
        viewZoom: 1,
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
      viewAzimuth: azimuth,
      viewElevation: elevation,
      viewRoll: 0,
      viewShiftY: 0,
      viewZoom: Number(
        THREE.MathUtils.clamp(fitDistance / distance, 0.3, 4).toFixed(2)
      ),
    };
  }, [boundsNow, config, get, options]);

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

    const shoot = async () => {
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
      return { data: tightRows(pixels, width, height), height, width };
    };
    const image = await shoot();

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
      const sidewalk = options.svgSidewalk;
      if (needsDepth(options)) await nextFrame();
      const depth = needsDepth(options)
        ? await captureDepth(
            scene,
            camera,
            width,
            height,
            solidMeshes(solidsRef.current, { sidewalk })
          )
        : null;
      let contrast = null;
      if (needsSmokeContrast(options)) {
        showSmoke(effectsRef.current, false);
        const without = await shoot();
        showSmoke(effectsRef.current, true);
        contrast = smokeContrast(image, without);
      }
      const args = plotArgs(options);
      svg = renderDumpsterSvg({
        ...args,
        camera: view,
        coverage: depth,
        image: needsImage(options) ? image : null,
        scene: {
          flames: readFlames(effectsRef.current),
          solids: readSolids(solidsRef.current, { sidewalk }),
        },
        smoke: {
          density: options.svgSmokeDots,
          dots:
            options.svgSmokeDots > 0 ? readSmokeDots(effectsRef.current) : [],
          flow:
            options.svgSmokeFlow > 0
              ? flowLines(trimPaths(paths, measureSmoke(effectsRef.current)), {
                  count: options.svgSmokeFlow,
                  seed: 'live',
                  twist: options.svgSmokeTwist,
                })
              : [],
          pen: args.shade?.pen,
          seed: 'live',
        },
        smokeShade: args.smokeShade && { ...args.smokeShade, contrast },
        visible: options.svgOcclusion
          ? depthProbe(depth, options.pixelRatio, 0.02)
          : null,
      });
    }

    restoreSize();
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    if (wasRunning) resumeClock(state);
    else render();
    return { png: await pngBase64(image.data, width, height), svg };
  }, [
    captureDepth,
    effectsRef,
    get,
    liveRef,
    options,
    paths,
    render,
    solidsRef,
  ]);

  useEffect(() => {
    Object.assign(bridgeRef.current, { cameraKeys, capture, frame });
  }, [bridgeRef, cameraKeys, capture, frame]);

  return (
    <OrbitControls
      enableDamping={false}
      makeDefault
      onChange={() => {
        keepFog();
        if (paused) render();
      }}
    />
  );
}

// The Live tab: the workbench's current generation burning. Switch its
// smoke and mood, orbit it, then capture what you see — the capture goes
// through the CLI's finishing step like any still.
export default function LiveDumpster({ jobsApi, options, setOptions }) {
  const config = useMemo(
    () => Object.fromEntries(CONFIG_KEYS.map((key) => [key, options[key]])),
    [options]
  );
  const solidsRef = useRef(null);
  const effectsRef = useRef(null);
  const bridgeRef = useRef({});
  const [paused, setPaused] = useState(false);
  const [stageKey, setStageKey] = useState(0);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const capture = useCallback(async () => {
    if (busy || !bridgeRef.current.capture) return;
    setBusy(true);
    setStatus('Capturing…');
    try {
      const shot = await bridgeRef.current.capture();
      const name = `live-${config.smokeSystem}-${Date.now().toString(36)}`;
      await postJson('/dev-api/dumpsterFire/captures', {
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
    const timer = setTimeout(() => bridgeRef.current.frame?.(), 4000);
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
      } else if (key === 'm') {
        setOption('smokeMirror', !options.smokeMirror);
      } else if (key === 'n') {
        setOption('mood', options.mood === 'night' ? 'day' : 'night');
      }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [capture, options.mood, options.smokeMirror, restart, setOption]);

  // Memoised so capture status updates never re-render the canvas: R3F
  // re-syncs its frameloop to the prop on every canvas render.
  const stage = useMemo(
    () => (
      <WebGPUCanvas frameloop={paused ? 'never' : 'always'}>
        <DumpsterStage
          config={config}
          effectsRef={effectsRef}
          key={stageKey}
          solidsRef={solidsRef}
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
    [config, options, paused, stageKey]
  );

  return (
    <div className="dfl-live">
      <div className="dfl-live__toolbar">
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
        <label className="dfl-live__toggle" htmlFor="dfl-live-mirror">
          <input
            checked={Boolean(options.smokeMirror)}
            id="dfl-live-mirror"
            onChange={(event) => setOption('smokeMirror', event.target.checked)}
            type="checkbox"
          />
          Mirror smoke
        </label>
      </div>
      <div className="dfl-live__panel">
        <div className="rw-segmented">
          {SMOKE_SYSTEMS.map((system) => (
            <button
              aria-pressed={options.smokeSystem === system}
              className="rw-segmented__button"
              key={system}
              onClick={() => setOption('smokeSystem', system)}
              type="button"
            >
              {SMOKE_LABELS[system]}
            </button>
          ))}
        </div>
        <div className="rw-segmented">
          {MOODS.map((mood) => (
            <button
              aria-pressed={options.mood === mood}
              className="rw-segmented__button"
              key={mood}
              onClick={() => setOption('mood', mood)}
              type="button"
            >
              {mood === 'day' ? 'Day' : 'Night'}
            </button>
          ))}
        </div>
      </div>
      <p className="rw-hint">
        Space pause · C capture · R restart · F frame · M mirror smoke · N
        day/night · drag to orbit. Captures use the form&apos;s size, formats,
        SVG and overlay settings.
      </p>
      <div
        className="dfl-live__stage"
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
