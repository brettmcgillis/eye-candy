import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FiCamera,
  FiCrosshair,
  FiLock,
  FiPause,
  FiPlay,
  FiShuffle,
  FiVideo,
} from 'react-icons/fi';

import pngBase64 from '@dev/renderWorkbench/liveCapture';
import { postJson } from '@dev/renderWorkbench/useRenderJobs';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as THREE from 'three/webgpu';

import { tightRows } from '@modules/renderStage/capture';

const typing = (event) =>
  ['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target?.tagName);

const randomSeed = () => Math.floor(Math.random() * 1e6);

// The options that need a fresh stage rather than a reload: what the
// capturer was built with.
const defaultStageKey = (options) =>
  JSON.stringify([
    options.width / options.height,
    options.samples,
    options.shadows,
    options.transparent,
  ]);

// The Live tab for a bench whose stage is a three-only rig (the CLI's own
// capturer, run here on a canvas): the form's generation — its pinned keys,
// the rest rolled from a Live seed — drawn by the same stage the headless
// CLI renders, so what is seen is what a render makes. Orbit, pause, roll,
// then Capture: the frame at the form's size (and its plot) goes to
// `/dev-api/<tool>/captures`, and `<slug>-generate --capture` finishes it
// like any still. See docs/render-workbench.md §0.4.
//
// `bench`: {
//   createStage({ options, readFrame, renderer }) → stage
//     (load(drawn) → layout, capture(view) → readFrame(draw),
//      svg?(view, options), dispose())
//   generate({ options, pinned, seed }) → drawn      the generation shown
//   load?({ drawn, options, stage }) → { drawn, layout }
//                                                   a generation the build can re-roll
//   frame({ drawn, layout, options }) → view         its default framing
//   configOf(drawn) → config, name(drawn) → string   for the sidecar
//   cameraKeys?({ drawn, layout, options, view }) → option patch
//   keep?(drawn) → option patch                      the rolled look, pinnable
//   stageKey?(options) → string                      rebuild the stage when it changes
//   hint?: string                                    the bench's own keys
//   flat?: true | (options) → boolean               pan and zoom, no orbit
// }
export default function LiveStage({ bench, context, tool }) {
  const { jobsApi, options, pins, setOptions } = context;
  const canvasRef = useRef(null);
  const live = useRef({
    capturing: false,
    controls: null,
    drawn: null,
    framed: null,
    layout: null,
    proxy: null,
    reframe: false,
    renderer: null,
    stage: null,
    view: null,
  });
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [seed, setSeed] = useState(() =>
    options.batch != null ? options.batch : randomSeed()
  );
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(0);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const stageKey = (bench.stageKey ?? defaultStageKey)(options);
  const flat =
    typeof bench.flat === 'function' ? bench.flat(options) : bench.flat;
  const pinned = pins?.pins ?? new Set();
  const pinKey = [...pinned].sort().join();

  // The camera the orbit drives, as the stage's view: the framed view with
  // the orbit's eye, target and up (and zoom, for an orthographic one).
  const currentView = useCallback(() => {
    const { controls, framed, proxy } = live.current;
    if (!framed || !proxy) return null;
    const view = {
      ...framed,
      eye: proxy.position.toArray(),
      target: controls.target.toArray(),
      up: proxy.up.toArray(),
    };
    if (framed.projection === 'orthographic') {
      view.halfWidth = framed.halfWidth / proxy.zoom;
      view.halfHeight = framed.halfHeight / proxy.zoom;
    }
    return view;
  }, []);

  const draw = useCallback(() => {
    const { stage } = live.current;
    const view = currentView();
    if (stage && view && !live.current.capturing) stage.capture(view);
  }, [currentView]);

  const frame = useCallback(() => {
    const { controls, drawn, layout } = live.current;
    if (!drawn || !controls) return;
    const framed = bench.frame({
      drawn,
      layout: live.current.stage?.getBounds?.() ?? layout,
      options,
    });
    const ortho = framed.projection === 'orthographic';
    const proxy = ortho
      ? new THREE.OrthographicCamera(-1, 1, 1, -1)
      : new THREE.PerspectiveCamera(
          framed.fov,
          options.width / options.height,
          framed.near,
          framed.far
        );
    proxy.position.set(...framed.eye);
    proxy.up.set(...(framed.up ?? [0, 1, 0]));
    proxy.lookAt(...framed.target);
    controls.object = proxy;
    controls.target.set(...framed.target);
    controls.update();
    Object.assign(live.current, { framed, proxy });
    if (pausedRef.current) draw();
  }, [bench, draw, options]);

  // The renderer and the stage it draws, rebuilt when the stage's own
  // options change.
  useEffect(() => {
    const canvas = canvasRef.current;
    let disposed = false;
    let disconnectPointer = null;
    const renderer = new THREE.WebGPURenderer({ antialias: true, canvas });
    const controls = new OrbitControls(new THREE.PerspectiveCamera(), canvas);
    controls.enableDamping = false;
    if (flat) {
      controls.enableRotate = false;
      controls.screenSpacePanning = true;
      controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
      controls.touches.ONE = THREE.TOUCH.PAN;
    }
    controls.addEventListener('change', () => {
      if (pausedRef.current) draw();
    });
    const resize = () => {
      const { clientHeight, clientWidth } = canvas;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(clientWidth, clientHeight, false);
      if (pausedRef.current) draw();
    };
    const observer = new ResizeObserver(resize);
    (async () => {
      await renderer.init();
      if (disposed) return;
      const display = (fn) => {
        fn();
        return null;
      };
      const readFrame = (fn) =>
        live.current.capturing ? live.current.readback(fn) : display(fn);
      const stage = await bench.createStage({ options, readFrame, renderer });
      if (disposed) {
        stage.dispose();
        return;
      }
      Object.assign(live.current, { controls, renderer, stage });
      disconnectPointer = stage.connectPointer?.({
        canvas,
        controls,
        getCamera: () => live.current.proxy,
        redraw: () => {
          if (pausedRef.current) draw();
        },
      });
      observer.observe(canvas);
      resize();
      let last = performance.now();
      renderer.setAnimationLoop((now) => {
        const delta = Math.min((now - last) / 1000, 1 / 30);
        last = now;
        if (pausedRef.current || !live.current.drawn || live.current.capturing)
          return;
        stage.step?.(delta);
        draw();
      });
      setReady(true);
    })();
    return () => {
      disposed = true;
      observer.disconnect();
      renderer.setAnimationLoop(null);
      disconnectPointer?.();
      controls.dispose();
      live.current.stage?.dispose();
      Object.assign(live.current, {
        drawn: null,
        framed: null,
        proxy: null,
        stage: null,
      });
      renderer.dispose();
      setReady(false);
    };
    // Rebuilt for the stage's own options only; the rest reload it below.
  }, [bench, stageKey]);

  // The generation: rolled again whenever the form, its pins or the seed
  // change, framed on the first load and on every roll.
  const framedSeed = useRef(null);
  useEffect(() => {
    if (!ready) return undefined;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const generated = await bench.generate({ options, pinned, seed });
        if (cancelled) return;
        const { stage } = live.current;
        const { drawn, layout } = bench.load
          ? await bench.load({ drawn: generated, options, stage })
          : { drawn: generated, layout: await stage.load(generated) };
        if (cancelled) return;
        await stage.settle?.(options);
        if (cancelled) return;
        Object.assign(live.current, { drawn, layout });
        if (
          framedSeed.current !== seed ||
          !live.current.framed ||
          live.current.reframe
        ) {
          framedSeed.current = seed;
          live.current.reframe = false;
          frame();
        } else if (pausedRef.current) {
          draw();
        }
        setLoaded((count) => count + 1);
        setStatus(null);
      } catch (error) {
        setStatus(`Could not build: ${error.message}`);
      }
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // `pinned` is read through pinKey.
  }, [bench, draw, frame, options, pinKey, ready, seed]);

  // One frame at the form's size, read back, with its plot.
  const shoot = useCallback(async () => {
    const { renderer, stage } = live.current;
    const view = currentView();
    const width = Math.round(options.width * options.pixelRatio);
    const height = Math.round(options.height * options.pixelRatio);
    const ratio = renderer.getPixelRatio();
    const size = renderer.getSize(new THREE.Vector2());
    live.current.readback = async (fn) => {
      const target = new THREE.RenderTarget(width, height, {
        colorSpace: THREE.NoColorSpace,
        depthBuffer: true,
      });
      renderer.setRenderTarget(target);
      fn();
      renderer.setRenderTarget(null);
      const pixels = await renderer.readRenderTargetPixelsAsync(
        target,
        0,
        0,
        width,
        height
      );
      target.dispose();
      return { data: tightRows(pixels, width, height), height, width };
    };
    live.current.capturing = true;
    try {
      renderer.setPixelRatio(1);
      renderer.setSize(width, height, false);
      await new Promise((resolve) => {
        requestAnimationFrame(resolve);
      });
      const image = await stage.capture(view);
      const visible =
        options.svg && options.svgOcclusion && stage.captureDepth
          ? stage.depthProbe(await stage.captureDepth(view))
          : null;
      const svg =
        options.svg && stage.svg
          ? await stage.svg(view, options, visible)
          : null;
      return { image, svg, view };
    } finally {
      live.current.capturing = false;
      renderer.setPixelRatio(ratio);
      renderer.setSize(size.x, size.y, false);
      draw();
    }
  }, [currentView, draw, options]);

  const cameraKeys = useCallback(() => {
    const { drawn, layout } = live.current;
    const view = currentView();
    return bench.cameraKeys && view
      ? bench.cameraKeys({ drawn, layout, options, view })
      : {};
  }, [bench, currentView, options]);

  const pinAll = useCallback(
    (patch) => {
      setOptions((current) => ({ ...current, ...patch }));
      pins?.setPins((current) => new Set([...current, ...Object.keys(patch)]));
    },
    [pins, setOptions]
  );

  const capture = useCallback(async () => {
    if (busy || !live.current.drawn) return;
    setBusy(true);
    setStatus('Capturing…');
    try {
      const { drawn } = live.current;
      const shot = await shoot();
      const name = `live-${bench.name(drawn)}-${Date.now().toString(36)}`;
      await postJson(`/dev-api/${tool}/captures`, {
        config: {
          ...bench.configOf(drawn),
          ...live.current.stage.exportConfig?.(),
          ...cameraKeys(),
        },
        name,
        options,
        png: await pngBase64(
          new Uint8ClampedArray(shot.image.data.buffer ?? shot.image.data),
          shot.image.width,
          shot.image.height
        ),
        svg: shot.svg,
      });
      await jobsApi.refresh();
      setStatus(`Captured ${name} — finishing in Transient.`);
    } catch (error) {
      setStatus(`Capture failed: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }, [bench, busy, cameraKeys, jobsApi, options, shoot, tool]);

  const roll = useCallback(() => setSeed(randomSeed()), []);

  const useCamera = useCallback(() => {
    const keys = cameraKeys();
    if (Object.keys(keys).length === 0) return;
    live.current.reframe = true;
    pinAll(keys);
    setStatus('Camera copied to the form.');
  }, [cameraKeys, pinAll]);

  const keep = useCallback(() => {
    if (!bench.keep || !live.current.drawn) return;
    pinAll(bench.keep(live.current.drawn, live.current.stage));
    setStatus('Generation pinned in the form.');
  }, [bench, pinAll]);

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
        roll();
      } else if (key === 'f') {
        frame();
      }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [capture, frame, roll]);

  useEffect(() => {
    if (paused) draw();
  }, [draw, paused, loaded]);

  return (
    <div className="rw-live">
      <div className="rw-live__toolbar">
        <button
          className="dev-button"
          onClick={() => setPaused((value) => !value)}
          type="button"
        >
          {paused ? <FiPlay /> : <FiPause />} {paused ? 'Resume' : 'Pause'}
        </button>
        <button
          className="dev-button dev-button--primary"
          disabled={busy || !ready}
          onClick={capture}
          type="button"
        >
          <FiCamera /> Capture
        </button>
        <button className="dev-button" onClick={roll} type="button">
          <FiShuffle /> Roll
        </button>
        <button className="dev-button" onClick={frame} type="button">
          <FiCrosshair /> Frame
        </button>
        {bench.cameraKeys ? (
          <button className="dev-button" onClick={useCamera} type="button">
            <FiVideo /> Use this camera
          </button>
        ) : null}
        {bench.keep ? (
          <button className="dev-button" onClick={keep} type="button">
            <FiLock /> Keep this generation
          </button>
        ) : null}
        <span className="rw-live__seed">seed {seed}</span>
      </div>
      <p className="rw-hint">
        Space pause · C capture · R roll · F frame ·{' '}
        {flat ? 'drag to pan · scroll to zoom' : 'drag to orbit'}
        {bench.hint ? ` · ${bench.hint}` : ''}. Pinned fields hold; the rest
        roll from the seed. Captures use the form&apos;s size, formats, SVG and
        overlay settings.
      </p>
      <div
        className="rw-live__stage"
        style={{
          aspectRatio: `${options.width} / ${options.height}`,
          width: `min(100%, calc(72vh * ${options.width} / ${options.height}))`,
        }}
      >
        <canvas className="rw-live__canvas" ref={canvasRef} />
      </div>
      {status ? <p className="rw-status">{status}</p> : null}
    </div>
  );
}

// A RollWorkbench `leadingTabs` with this bench's Live tab first.
export const liveTabs = (bench, tool) => (context) => [
  {
    icon: <FiPlay />,
    id: 'live',
    label: 'Live',
    render: () => <LiveStage bench={bench} context={context} tool={tool} />,
  },
];
