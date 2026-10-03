import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { FiPause, FiPlay, FiSquare } from 'react-icons/fi';

import ResultsPanel, {
  activeJobCount,
} from '@dev/renderWorkbench/ResultsPanel';
import { Segmented } from '@dev/renderWorkbench/SchemaFields';
import '@dev/renderWorkbench/renderWorkbench.css';
import useRenderJobs from '@dev/renderWorkbench/useRenderJobs';

import DevPageHeaderBar from '../../shell/DevPageHeaderBar';
import './DarkroomPage.css';
import ExportPanel from './components/ExportPanel';
import PreviewDetails from './components/PreviewDetails';
import SourcePanel from './components/SourcePanel';
import TechniqueFields from './components/TechniqueFields';
import useDarkroomStage from './hooks/useDarkroomStage';
import useExporter from './hooks/useExporter';
import useSourceLibrary from './hooks/useSourceLibrary';
import {
  createCameraSource,
  createImageSource,
  createVideoSource,
  recordStream,
} from './sources/sources';
import {
  TECHNIQUES,
  coerce,
  deriveValues,
  initialValues,
  presetValues,
  techniqueById,
} from './techniques';

const PROFILES = {
  post: { height: 1350, label: 'Post', width: 1080 },
  reel: { height: 1920, label: 'Reel', width: 1080 },
  square: { height: 1080, label: 'Square', width: 1080 },
};
const PROFILE_OPTIONS = Object.entries(PROFILES).map(([value, item]) => ({
  icon: <FiSquare />,
  label: item.label,
  value,
}));
const SIZE_LIMIT = { max: 4096, min: 64 };
const clampSize = (value, fallback) => {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < SIZE_LIMIT.min) return fallback;
  return Math.min(SIZE_LIMIT.max, n - (n % 2));
};

function jobTitle(job) {
  const technique = job.options?.technique
    ? techniqueById(job.options.technique).label
    : 'Darkroom';
  return `${technique} ${job.kind === 'video' ? 'video' : 'still'}`;
}

function useClipClock(source) {
  const [clock, setClock] = useState({ paused: true, time: 0 });
  useEffect(() => {
    if (source?.kind !== 'video') return undefined;
    const timer = setInterval(() => {
      setClock({ paused: source.paused, time: source.currentTime });
    }, 250);
    return () => clearInterval(timer);
  }, [source]);
  return clock;
}

export default function DarkroomPage() {
  const jobsApi = useRenderJobs('darkroom');
  const library = useSourceLibrary();
  const [techniqueId, setTechniqueId] = useState(TECHNIQUES[0].id);
  const technique = techniqueById(techniqueId);
  const [valuesById, setValuesById] = useState({});
  const values = valuesById[technique.id] ?? initialValues(technique);
  const [preset, setPreset] = useState(technique.defaultPreset ?? '');
  const [profile, setProfile] = useState('post');
  const [sizeInput, setSizeInput] = useState(PROFILES.post);
  const [source, setSource] = useState(null);
  const [info, setInfo] = useState(null);
  const [sourceError, setSourceError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [facing, setFacing] = useState('front');
  const [recording, setRecording] = useState(null);
  const recorderRef = useRef(null);
  const [, refresh] = useReducer((count) => count + 1, 0);
  const sourceRef = useRef(null);
  const [exportSettings, setExportSettings] = useState({
    audio: true,
    end: 0,
    fps: 30,
    kind: 'still',
    start: 0,
  });

  const options = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(values).map(([key, value]) => [
          key,
          coerce(technique.options[key], value),
        ])
      ),
    [technique, values]
  );
  const size = useMemo(
    () => ({
      height: clampSize(sizeInput.height, PROFILES[profile].height),
      width: clampSize(sizeInput.width, PROFILES[profile].width),
    }),
    [profile, sizeInput.height, sizeInput.width]
  );

  const preview = useDarkroomStage({ options, size, source, technique });
  const exporter = useExporter({ preview, submit: jobsApi.submit });
  const exporting = ['rendering', 'uploading'].includes(
    exporter.progress?.phase
  );
  const clock = useClipClock(source);

  useEffect(() => () => sourceRef.current?.dispose(), []);

  const swapSource = useCallback(async (make, nextInfo) => {
    setLoading(true);
    setSourceError(null);
    try {
      const next = await make();
      sourceRef.current?.dispose();
      sourceRef.current = next;
      setSource(next);
      setInfo(nextInfo);
      setExportSettings((current) => ({
        ...current,
        end: Number((next.duration || 0).toFixed(2)),
        kind: next.kind === 'video' ? current.kind : 'still',
        start: 0,
      }));
      return next;
    } catch (failure) {
      setSourceError(failure.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRemote = useCallback(
    (item, extra = {}) =>
      swapSource(
        () =>
          item.kind === 'image'
            ? createImageSource({
                label: extra.label ?? item.name,
                url: item.url,
              })
            : createVideoSource({
                label: extra.label ?? item.name,
                mirrored: extra.mirrored,
                url: item.url,
              }),
        { ...item, label: extra.label ?? item.name }
      ),
    [swapSource]
  );

  const onFile = useCallback(
    async (file) => {
      const video = file.type.startsWith('video/');
      const url = URL.createObjectURL(file);
      const uploaded = library.upload(file);
      const local = await swapSource(
        () =>
          video
            ? createVideoSource({ label: file.name, url })
            : createImageSource({ label: file.name, url }),
        { label: file.name, uploading: true }
      );
      try {
        const remote = await uploaded;
        if (local) {
          setInfo((current) =>
            current?.label === file.name
              ? { ...remote, label: file.name }
              : current
          );
        } else {
          await loadRemote(remote, { label: file.name });
        }
      } catch (failure) {
        setSourceError(failure.message);
        setInfo((current) =>
          current?.label === file.name ? { label: file.name } : current
        );
      }
    },
    [library, loadRemote, swapSource]
  );

  const startCamera = useCallback(
    (nextFacing = facing) =>
      swapSource(() => createCameraSource({ facing: nextFacing }), null),
    [facing, swapSource]
  );

  const changeFacing = useCallback(
    (next) => {
      setFacing(next);
      if (sourceRef.current?.kind === 'live') startCamera(next);
    },
    [startCamera]
  );

  const record = useCallback(
    async (seconds) => {
      const camera = sourceRef.current;
      if (camera?.kind !== 'live') return;
      const take = recordStream(camera.stream, seconds, (progress) =>
        setRecording({ progress })
      );
      recorderRef.current = take;
      setRecording({ progress: 0 });
      try {
        const blob = await take.done;
        setRecording(null);
        setLoading(true);
        const remote = await library.upload(blob);
        await loadRemote(remote, {
          label: 'Camera take',
          mirrored: camera.mirrored,
        });
      } catch (failure) {
        setSourceError(failure.message);
      } finally {
        setRecording(null);
        setLoading(false);
      }
    },
    [library, loadRemote]
  );

  const setValue = useCallback(
    (key, value) =>
      setValuesById((current) => ({
        ...current,
        [technique.id]: deriveValues(
          technique,
          {
            ...(current[technique.id] ?? initialValues(technique)),
            [key]: value,
          },
          key
        ),
      })),
    [technique]
  );

  const choosePreset = useCallback(
    (name) => {
      setPreset(name);
      setValuesById((current) => ({
        ...current,
        [technique.id]: presetValues(technique, name),
      }));
    },
    [technique]
  );

  const chooseTechnique = useCallback((id) => {
    setTechniqueId(id);
    setPreset(techniqueById(id).defaultPreset ?? '');
  }, []);

  const loadSettings = useCallback((id, saved) => {
    const next = techniqueById(id);
    setTechniqueId(next.id);
    setPreset('');
    setValuesById((current) => ({
      ...current,
      [next.id]: {
        ...initialValues(next),
        ...Object.fromEntries(
          Object.entries(saved).filter(([key]) => key in next.options)
        ),
      },
    }));
  }, []);

  const selectProfile = useCallback((next) => {
    setProfile(next);
    setSizeInput(PROFILES[next]);
  }, []);

  const runExport = useCallback(
    (kind) =>
      exporter.run({
        ...exportSettings,
        kind,
        options,
        size,
        source: sourceRef.current,
        sourceInfo: info?.name ? info : null,
        technique,
      }),
    [exportSettings, exporter, info, options, size, technique]
  );

  const renderDetails = useCallback(
    (detail) => <PreviewDetails onLoad={loadSettings} {...detail} />,
    [loadSettings]
  );

  const unsupported = source && !technique.inputs.includes(source.kind);
  const presetNames = Object.keys(technique.presets ?? {});

  return (
    <main className="dev-page rw-page dk-page">
      <DevPageHeaderBar eyebrow="" title="Darkroom" />

      <div className="dk-layout">
        <form
          className="dev-panel rw-controls dk-controls"
          noValidate
          onSubmit={(event) => event.preventDefault()}
        >
          <SourcePanel
            busy={loading || exporting}
            error={sourceError ?? library.error}
            facing={facing}
            info={info}
            library={library}
            onFacing={changeFacing}
            onFile={onFile}
            onMirror={(mirrored) => {
              source?.setMirrored(mirrored);
              refresh();
            }}
            onPick={(item) => loadRemote(item)}
            onRecord={record}
            onStartCamera={() => startCamera()}
            onStopRecording={() => recorderRef.current?.stop()}
            recording={recording}
            source={source}
          />

          <section className="rw-control-section">
            <h2>Technique</h2>
            <label className="rw-field" htmlFor="dk-technique">
              Technique
              <select
                id="dk-technique"
                onChange={(event) => chooseTechnique(event.target.value)}
                value={technique.id}
              >
                {TECHNIQUES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="rw-hint">{technique.description}</p>
            {unsupported ? (
              <p className="rw-error">
                {technique.label} needs{' '}
                {technique.inputs
                  .filter((kind) => kind !== 'still')
                  .join(' or ')}{' '}
                input.
              </p>
            ) : null}
            {presetNames.length ? (
              <label className="rw-field" htmlFor="dk-preset">
                Preset
                <select
                  id="dk-preset"
                  onChange={(event) => choosePreset(event.target.value)}
                  value={preset}
                >
                  <option value="">Custom</option>
                  {presetNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </section>

          <TechniqueFields
            onChange={(key, value) => {
              setPreset('');
              setValue(key, value);
            }}
            technique={technique}
            values={values}
          />

          <section className="rw-control-section">
            <h2>Output</h2>
            <Segmented
              label="Format"
              onChange={selectProfile}
              options={PROFILE_OPTIONS}
              value={profile}
            />
            <div className="rw-field-grid">
              {['width', 'height'].map((key) => (
                <label className="rw-field" htmlFor={`dk-${key}`} key={key}>
                  {key === 'width' ? 'Width' : 'Height'}
                  <input
                    id={`dk-${key}`}
                    max={SIZE_LIMIT.max}
                    min={SIZE_LIMIT.min}
                    onChange={(event) =>
                      setSizeInput((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                    step={2}
                    type="number"
                    value={sizeInput[key]}
                  />
                </label>
              ))}
            </div>
          </section>

          <ExportPanel
            exporting={exporting}
            onCancel={exporter.cancel}
            onChange={(key, value) =>
              setExportSettings((current) => ({ ...current, [key]: value }))
            }
            onExport={runExport}
            progress={exporter.progress}
            settings={exportSettings}
            source={source}
          />
        </form>

        <section className="dev-panel dk-stage">
          <header className="dk-stage__bar">
            <strong>{technique.label}</strong>
            <span>
              {size.width}×{size.height} · {preview.engine}
              {preview.renderMs != null ? ` · ${preview.renderMs} ms` : ''}
            </span>
          </header>
          <div
            className="dk-stage__host"
            data-engine={preview.engine}
            ref={preview.hostRef}
            style={{
              '--dk-aspect': size.width / size.height,
              aspectRatio: `${size.width} / ${size.height}`,
            }}
          >
            {source ? null : (
              <p className="dk-stage__empty">Pick a source to start.</p>
            )}
          </div>
          {preview.error ? <p className="rw-error">{preview.error}</p> : null}
          {source?.kind === 'video' ? (
            <div className="dk-transport">
              <button
                aria-label={clock.paused ? 'Play' : 'Pause'}
                className="dev-button"
                disabled={exporting}
                onClick={() => (clock.paused ? source.play() : source.pause())}
                type="button"
              >
                {clock.paused ? <FiPlay /> : <FiPause />}
              </button>
              <input
                aria-label="Clip position"
                disabled={exporting}
                max={source.duration}
                min={0}
                onChange={(event) => source.seek(Number(event.target.value))}
                step={0.01}
                type="range"
                value={clock.time}
              />
              <span>
                {clock.time.toFixed(1)} / {source.duration.toFixed(1)}s
              </span>
            </div>
          ) : null}
        </section>

        <div className="dk-results">
          <div className="rw-toolbar">
            <p />
            <div className="rw-toolbar__status">
              <span>{activeJobCount(jobsApi.jobs)} active</span>
            </div>
          </div>
          <ResultsPanel
            collectionTitle={jobTitle}
            jobTitle={jobTitle}
            jobsApi={jobsApi}
            renderDetails={renderDetails}
            selectionActions={() => null}
          />
        </div>
      </div>
    </main>
  );
}
