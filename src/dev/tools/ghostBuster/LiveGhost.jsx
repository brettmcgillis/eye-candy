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

import { postJson } from '@dev/renderWorkbench/useRenderJobs';
import { OrbitControls } from '@react-three/drei';
import { advance, useThree } from '@react-three/fiber';

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
} from '@modules/ghostBuster';
import {
  GhostStudio,
  aimCamera,
  createDepthCapture,
  depthProbe,
  readGhostLattice,
} from '@modules/ghostBusterRender';

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

const typing = (event) =>
  ['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target?.tagName);

// WebGPU pads each readback row to 256 bytes except the last.
function tightRows(pixels, width, height) {
  const stride =
    pixels.length === width * 4 * height
      ? width * 4
      : Math.ceil((width * 4) / 256) * 256;
  const tight = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    tight.set(
      pixels.subarray(y * stride, y * stride + width * 4),
      y * width * 4
    );
  }
  return tight;
}

async function pngBase64(tight, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas
    .getContext('2d')
    .putImageData(new ImageData(tight, width, height), 0, 0);
  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

// Lives inside the canvas: owns the camera framing and the capture, which
// both need the R3F state.
function Director({ bridgeRef, config, ghostRef, options, paused }) {
  const get = useThree((state) => state.get);
  const captureDepth = useMemo(() => createDepthCapture(get().gl), [get]);
  const boundsRef = useRef(GHOST_BOUNDS);
  const frozenRef = useRef(0);

  const render = useCallback(() => {
    const state = get();
    advance(frozenRef.current, true, state);
  }, [get]);

  useEffect(() => {
    const state = get();
    if (paused) {
      frozenRef.current = state.clock.elapsedTime;
      state.setFrameloop('never');
      render();
    } else {
      state.setFrameloop('always');
    }
  }, [get, paused, render]);

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
    boundsRef.current = latticeBounds(lattice) ?? GHOST_BOUNDS;
    return boundsRef.current;
  }, [config.skin, get, ghostRef]);

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
    if (wasRunning) {
      frozenRef.current = state.clock.elapsedTime;
      state.setFrameloop('never');
    }
    camera.aspect = options.width / options.height;
    camera.updateProjectionMatrix();

    const target = new THREE.RenderTarget(width, height, {
      colorSpace: THREE.NoColorSpace,
      samples: 4,
    });
    gl.setOutputRenderTarget(target);
    advance(frozenRef.current, true, state);
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
      const depth = needsDepth(options)
        ? await captureDepth(
            scene,
            camera,
            width,
            height,
            ghostRef.current.mesh
          )
        : null;
      svg = renderGhostSvg({
        ...plotArgs(options),
        camera: view,
        coverage: depth,
        image: { data: image, height, width },
        lattice,
        visible: options.svgOcclusion
          ? depthProbe(depth, options.pixelRatio)
          : null,
      });
    }

    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    if (wasRunning) state.setFrameloop('always');
    else render();
    return { png: await pngBase64(image, width, height), svg };
  }, [captureDepth, config.skin, get, ghostRef, options, render]);

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
  const gustRef = useRef({ strength: 0, x: 0, z: 0 });
  const bridgeRef = useRef({});
  const [paused, setPaused] = useState(false);
  const [poke, setPoke] = useState(true);
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
    setStatus(null);
  }, []);

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
  }, [capture, restart]);

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
      <p className="rw-hint">
        Space pause · C capture · R restart · F frame · WASD gust · drag to
        orbit. Captures use the form&apos;s size, formats, SVG and overlay
        settings.
      </p>
      <div
        className="gb-live__stage"
        style={{
          aspectRatio: `${options.width} / ${options.height}`,
          width: `min(100%, calc(72vh * ${options.width} / ${options.height}))`,
        }}
      >
        <WebGPUCanvas>
          <GhostStudio
            config={config}
            cursorCollider={poke && !paused}
            ghostRef={ghostRef}
            gustRef={gustRef}
            key={stageKey}
            paused={paused}
          />
          <Director
            bridgeRef={bridgeRef}
            config={config}
            ghostRef={ghostRef}
            options={options}
            paused={paused}
          />
        </WebGPUCanvas>
      </div>
      {status ? <p className="rw-status">{status}</p> : null}
    </div>
  );
}
