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
  FiLock,
  FiPause,
  FiPlay,
  FiShuffle,
  FiVideo,
} from 'react-icons/fi';

import pngBase64 from '@dev/renderWorkbench/liveCapture';
import { postJson } from '@dev/renderWorkbench/useRenderJobs';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import {
  HALO_PRESET_ORDER,
  frameThought,
  optionsFromConfig,
  presetPins,
  randomSeed,
  rollArgs,
  thoughtAt,
} from '@modules/cumulus';
import { createCumulusStage } from '@modules/cumulusRender';

import './LiveCumulus.css';

export default function LiveCumulus({ jobsApi, options, pins, setOptions }) {
  const hostRef = useRef(null);
  const live = useRef(null);
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const [seed, setSeed] = useState(() => options.batch ?? randomSeed());
  const [status, setStatus] = useState('Loading scene…');
  const [busy, setBusy] = useState(false);
  const pinKey = [...(pins?.pins ?? [])].sort().join(',');
  const drawn = useMemo(
    () =>
      thoughtAt({
        batch: seed,
        index: 0,
        roll: rollArgs({
          options,
          typed: new Set(pinKey.split(',').filter(Boolean)),
        }),
      }),
    [options, pinKey, seed]
  );
  pausedRef.current = paused;
  const drawnRef = useRef(drawn);
  drawnRef.current = drawn;
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const configKey = JSON.stringify(drawn.config);
  // Only what the stage itself is built from rebuilds it; every other edit
  // reaches the running stage below.
  const stageKey = JSON.stringify(
    [
      'width',
      'height',
      'fov',
      'margin',
      'samples',
      'shadows',
      'transparent',
    ].map((key) => options[key])
  );
  useEffect(() => {
    let disposed = false;
    let stage;
    let controls;
    let raf;
    const canvas = document.createElement('canvas');
    hostRef.current.appendChild(canvas);
    const width = Math.min(600, optionsRef.current.width);
    const previewOptions = {
      ...optionsRef.current,
      height: Math.round(
        (width * optionsRef.current.height) / optionsRef.current.width
      ),
      pixelRatio: 1,
      width,
    };
    const launch = setTimeout(async () => {
      try {
        stage = await createCumulusStage({ canvas, options: previewOptions });
        if (disposed) {
          stage.dispose();
          return;
        }
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        const first = drawnRef.current;
        const bounds = await stage.load(first);
        if (disposed) {
          stage.dispose();
          return;
        }
        const framed = frameThought({
          bounds,
          config: first.config,
          options: previewOptions,
        });
        controls = new OrbitControls(stage.camera, canvas);
        controls.target.set(...framed.target);
        controls.update();
        const view = {
          ...framed,
          eye: [...framed.eye],
          target: [...framed.target],
          up: [...framed.up],
        };
        const clock = { time: stage.clock };
        live.current = {
          bounds,
          clock,
          controls,
          drawn: first,
          framed,
          previewOptions,
          stage,
          view,
        };
        setStatus(`Live: ${first.config.haloType} · ${first.name}`);
        let last = performance.now();
        const render = (now) => {
          const delta = Math.max(0, Math.min((now - last) / 1000, 1 / 30));
          last = now;
          controls.update();
          stage.camera.position.toArray(view.eye);
          controls.target.toArray(view.target);
          stage.camera.up.toArray(view.up);
          if (!clock.loading) {
            if (!pausedRef.current) clock.time += delta;
            stage.draw(view, clock.time);
          }
          raf = requestAnimationFrame(render);
        };
        raf = requestAnimationFrame(render);
      } catch (error) {
        if (!disposed) setStatus(`Live failed: ${error.message}`);
      }
    }, 180);
    return () => {
      clearTimeout(launch);
      disposed = true;
      cancelAnimationFrame(raf);
      controls?.dispose();
      if (live.current?.stage === stage) live.current = null;
      stage?.dispose();
      canvas.remove();
    };
  }, [stageKey]);

  // A new roll is a new generation: load and frame it on the same stage.
  // Any other edit updates the mounted subject, keeping camera and clock.
  useEffect(() => {
    const { current } = live;
    const next = drawnRef.current;
    if (!current || current.drawn === next) return;
    const reroll = current.drawn.name !== next.name;
    current.drawn = next;
    if (!reroll) {
      current.stage.update(next);
      setStatus(`Live: ${next.config.haloType} · ${next.name}`);
      return;
    }
    current.clock.loading = true;
    current.stage.load(next).then(
      (bounds) => {
        if (live.current !== current || current.drawn !== next) return;
        current.clock.loading = false;
        const framed = frameThought({
          bounds,
          config: next.config,
          options: current.previewOptions,
        });
        Object.assign(current, { bounds, framed });
        current.clock.time = current.stage.clock;
        current.controls.target.set(...framed.target);
        current.controls.update();
        setStatus(`Live: ${next.config.haloType} · ${next.name}`);
      },
      (error) => {
        current.clock.loading = false;
        setStatus(`Live failed: ${error.message}`);
      }
    );
  }, [configKey, seed]);

  const currentView = useCallback(() => {
    const { current } = live;
    if (!current) return null;
    return {
      ...current.framed,
      eye: current.stage.camera.position.toArray(),
      target: current.controls.target.toArray(),
      up: current.stage.camera.up.toArray(),
    };
  }, []);
  const cameraKeys = useCallback(() => {
    const { current } = live;
    const view = currentView();
    if (!current || !view) return {};
    const offset = view.eye.map((v, i) => v - view.target[i]);
    const distance = Math.hypot(...offset);
    const cameraAzimuth = (Math.atan2(offset[0], offset[2]) * 180) / Math.PI;
    const cameraElevation = (Math.asin(offset[1] / distance) * 180) / Math.PI;
    const fitted = frameThought({
      bounds: current.bounds,
      config: {
        ...drawn.config,
        cameraAzimuth,
        cameraElevation,
        cameraZoom: 1,
        cameraPanX: 0,
        cameraPanY: 0,
        cameraPanZ: 0,
      },
      options,
    });
    const fitDistance = Math.hypot(
      ...fitted.eye.map((v, i) => v - fitted.target[i])
    );
    return {
      cameraAzimuth,
      cameraElevation,
      cameraZoom: fitDistance / distance,
      cameraPanX: view.target[0] - fitted.target[0],
      cameraPanY: view.target[1] - fitted.target[1],
      cameraPanZ: view.target[2] - fitted.target[2],
    };
  }, [currentView, drawn, options]);
  const pinAll = useCallback(
    (patch) => {
      setOptions((current) => ({ ...current, ...patch }));
      pins?.setPins((current) => new Set([...current, ...Object.keys(patch)]));
    },
    [pins, setOptions]
  );
  const startFrom = useCallback(
    (name) => {
      const patch = presetPins(name);
      setOptions((current) => ({ ...current, ...patch }));
      pins?.setPins(new Set(Object.keys(patch)));
      setStatus(`Started from ${name}; pinned values are yours to edit.`);
    },
    [pins, setOptions]
  );
  const frame = useCallback(() => {
    const { current } = live;
    if (!current) return;
    const view = current.framed;
    current.stage.aim(view);
    current.controls.target.set(...view.target);
    current.controls.update();
  }, []);
  const capture = useCallback(async () => {
    const { current } = live;
    if (!current || busy) return;
    const view = currentView();
    const seconds = current.stage.clock;
    setBusy(true);
    setStatus('Capturing frozen frame and plot…');
    let capturer;
    try {
      capturer = await createCumulusStage({
        canvas: document.createElement('canvas'),
        options,
      });
      await capturer.load(drawn);
      const image = capturer.capture(view, seconds);
      const svg = options.svg ? capturer.svg(view, options) : null;
      const name = `live-${drawn.name}-${Date.now().toString(36)}`;
      await postJson('/dev-api/cumulus/captures', {
        config: {
          ...drawn.config,
          ...cameraKeys(),
          frameTime: seconds,
          captureView: view,
        },
        name,
        options,
        png: await pngBase64(
          new Uint8ClampedArray(image.data),
          image.width,
          image.height
        ),
        svg,
      });
      await jobsApi.refresh();
      setStatus(`Captured ${name} — finishing in Transient.`);
    } catch (error) {
      setStatus(`Capture failed: ${error.message}`);
    } finally {
      capturer?.dispose();
      setBusy(false);
    }
  }, [busy, cameraKeys, currentView, drawn, jobsApi, options]);
  useEffect(() => {
    const down = (event) => {
      if (
        ['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target?.tagName) ||
        event.metaKey ||
        event.ctrlKey
      )
        return;
      if (event.key === ' ') {
        event.preventDefault();
        setPaused((value) => !value);
      }
      if (event.key.toLowerCase() === 'f') frame();
      if (event.key.toLowerCase() === 'c') capture();
      if (event.key.toLowerCase() === 'r') setSeed(randomSeed());
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [capture, frame]);
  return (
    <div className="cumulus-live">
      <div className="cumulus-live__toolbar">
        <select
          aria-label="Start from preset"
          className="dev-button"
          onChange={(event) =>
            event.target.value && startFrom(event.target.value)
          }
          value=""
        >
          <option value="">Start from preset…</option>
          {HALO_PRESET_ORDER.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
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
        <button
          className="dev-button"
          onClick={() => setSeed(randomSeed())}
          type="button"
        >
          <FiShuffle /> Roll
        </button>
        <button className="dev-button" onClick={frame} type="button">
          <FiCrosshair /> Frame
        </button>
        <button
          className="dev-button"
          onClick={() => pinAll(cameraKeys())}
          type="button"
        >
          <FiVideo /> Use this camera
        </button>
        <button
          className="dev-button"
          onClick={() => pinAll(optionsFromConfig(drawn.config))}
          type="button"
        >
          <FiLock /> Keep
        </button>
      </div>
      <div
        className="cumulus-live__canvas"
        ref={hostRef}
        style={{ aspectRatio: `${options.width} / ${options.height}` }}
      />
      <p className="rw-hint">
        Space pause · C capture · R roll · F frame · drag to orbit. Capture uses
        the form’s output size and the frozen scene clock.
      </p>
      <p className="rw-hint" role="status">
        {status}
      </p>
    </div>
  );
}
