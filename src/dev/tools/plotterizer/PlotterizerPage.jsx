import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FiArrowDown,
  FiArrowUp,
  FiFolder,
  FiGrid,
  FiImage,
  FiMaximize,
  FiPenTool,
  FiSave,
} from 'react-icons/fi';

import WorkbenchLayout from '@dev/renderWorkbench/WorkbenchLayout';
import '@dev/renderWorkbench/renderWorkbench.css';

import DevPageHeaderBar from '../../shell/DevPageHeaderBar';
import './PlotterizerPage.css';
import {
  deleteJob,
  fetchJob,
  fetchSource,
  listJobs,
  listSources,
  loadPens,
  saveJob,
  savePens,
  slugOf,
  sourceUrl,
} from './api';
import JobsList from './components/JobsList';
import PensEditor from './components/PensEditor';
import PlotPreview from './components/PlotPreview';
import PlotterPanel from './components/PlotterPanel';
import SourcePicker, {
  rememberRecent,
  thumbUrl,
  titleOf,
} from './components/SourcePicker';
import { duration, metres, percent } from './format';
import usePlotterWorker from './hooks/usePlotterWorker';
import { aciColor, passColors } from './kernel/dxf.mjs';
import { defaultKnockout, fitPens, nearestPen } from './kernel/job.mjs';
import { DEFAULT_PENS, PAPERS, PAPER_COLORS } from './kernel/presets.mjs';
import { rerender } from './rerender';

const CROWDED_WARNING = 0.05;
const BUILD_DEBOUNCE_MS = 250;
const PENS_SAVE_DEBOUNCE_MS = 600;

const RESIZE_TOLERANCE = 0.02;

const sourceTitle = (source) =>
  source ? (source.path ?? source.name ?? 'Untitled') : 'No source';

const defaultName = (source) => {
  if (source?.title) {
    return [source.slug, source.title, source.generation]
      .filter((part, i, all) => part && all.indexOf(part) === i)
      .join(' ');
  }
  return source?.name?.replace(/\.svg$/u, '').replace(/ \/ /gu, ' ') ?? 'plot';
};

const entrySource = (entry) => ({
  generation: entry.generation,
  layers: entry.layers,
  name: entry.name,
  path: entry.path,
  slug: entry.slug,
  style: entry.style,
  title: titleOf(entry),
  widthMm: entry.widthMm,
  props: entry.props ? sourceUrl(entry.props) : null,
  tool: entry.tool,
  url: sourceUrl(entry.path),
});

export default function PlotterizerPage() {
  const send = usePlotterWorker();
  const [sources, setSources] = useState([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [source, setSource] = useState(null);
  const [layers, setLayers] = useState([]);
  const [sourceSize, setSourceSize] = useState(null);
  const [rerendering, setRerendering] = useState(false);
  const [pens, setPens] = useState(DEFAULT_PENS);
  const [pensLoaded, setPensLoaded] = useState(false);
  const [paperId, setPaperId] = useState(PAPERS[0].id);
  const [portrait, setPortrait] = useState(false);
  const [paperColor, setPaperColor] = useState(PAPER_COLORS[0].color);
  const [marginMm, setMarginMm] = useState(10);
  const [plotWidthMm, setPlotWidthMm] = useState('');
  const [assign, setAssign] = useState({});
  const [order, setOrder] = useState([]);
  const [minLengthMm, setMinLengthMm] = useState(0);
  const [registration, setRegistration] = useState(false);
  const [knockout, setKnockout] = useState(null);
  const [penBudget, setPenBudget] = useState(3);
  const [jobName, setJobName] = useState('');
  const [jobs, setJobs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [readOnly, setReadOnly] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState('preview');
  const [view, setView] = useState({
    showCrowding: false,
    showTravel: false,
    solo: null,
  });
  const [version, setVersion] = useState(0);
  const dataRef = useRef(null);
  const latestBuild = useRef(0);

  const paper = useMemo(() => {
    const preset = PAPERS.find((entry) => entry.id === paperId) ?? PAPERS[0];
    const [long, short] = [
      Math.max(preset.widthMm, preset.heightMm),
      Math.min(preset.widthMm, preset.heightMm),
    ];
    return portrait
      ? { color: paperColor, heightMm: long, widthMm: short }
      : { color: paperColor, heightMm: short, widthMm: long };
  }, [paperColor, paperId, portrait]);

  const settings = useMemo(
    () => ({
      assign,
      knockout,
      marginMm: Number(marginMm) || 0,
      minLengthMm: Number(minLengthMm) || 0,
      order,
      paper,
      pens,
      plotWidthMm: Number(plotWidthMm) || null,
      registration,
    }),
    [
      assign,
      knockout,
      marginMm,
      minLengthMm,
      order,
      paper,
      pens,
      plotWidthMm,
      registration,
    ]
  );

  const refreshSources = useCallback(() => {
    setSourcesLoading(true);
    return listSources()
      .then(setSources)
      .catch((nextError) => setError(nextError.message))
      .finally(() => setSourcesLoading(false));
  }, []);
  const refreshJobs = useCallback(
    () =>
      listJobs()
        .then(setJobs)
        .catch((nextError) => setError(nextError.message)),
    []
  );

  const show = (result, nextReadOnly) => {
    dataRef.current = { paper: result.paper, passes: result.passes };
    setSummary({
      passes: result.passes.map(({ crowding, layers: ids, pen, stats }) => ({
        crowded: crowding?.fraction ?? 0,
        layers: ids,
        pen,
        stats,
      })),
      layerCrowding: Object.assign(
        {},
        ...result.passes.map((pass) => pass.layerCrowding ?? {})
      ),
      placement: result.placement,
    });
    setReadOnly(nextReadOnly);
    setVersion((value) => value + 1);
  };

  const applySettings = (saved) => {
    setAssign(saved.assign ?? {});
    setOrder(saved.order ?? []);
    setMarginMm(saved.marginMm ?? 10);
    setMinLengthMm(saved.minLengthMm ?? 0);
    setPlotWidthMm(saved.plotWidthMm ?? '');
    setRegistration(Boolean(saved.registration));
    setKnockout(Array.isArray(saved.knockout) ? saved.knockout : null);
    if (saved.paper) {
      const match = PAPERS.find(
        (entry) =>
          Math.abs(
            Math.max(entry.widthMm, entry.heightMm) -
              Math.max(saved.paper.widthMm, saved.paper.heightMm)
          ) < 0.5 &&
          Math.abs(
            Math.min(entry.widthMm, entry.heightMm) -
              Math.min(saved.paper.widthMm, saved.paper.heightMm)
          ) < 0.5
      );
      if (match) setPaperId(match.id);
      setPortrait(saved.paper.heightMm > saved.paper.widthMm);
      setPaperColor(saved.paper.color);
    }
    if (saved.pens) {
      setPens((current) => [
        ...current.filter(
          (pen) => !saved.pens.some((other) => other.id === pen.id)
        ),
        ...saved.pens,
      ]);
    }
  };

  const loadSvg = async (svg, nextSource, { keep = false, saved } = {}) => {
    setError('');
    setStatus('Parsing…');
    try {
      const result = await send({ svg, type: 'load' });
      setLayers(result.layers);
      setSourceSize({ heightMm: result.heightMm, widthMm: result.widthMm });
      setSource(nextSource);
      const penFor = (layer) => nearestPen(layer.stroke, pens, paperColor);
      if (saved) {
        setJobName(saved.name);
        applySettings(saved.settings);
      } else if (keep) {
        setAssign((current) =>
          Object.fromEntries(
            result.layers.map((l) => [l.id, current[l.id] ?? penFor(l)])
          )
        );
      } else {
        setJobName(defaultName(nextSource));
        setAssign(
          Object.fromEntries(result.layers.map((l) => [l.id, penFor(l)]))
        );
        setOrder([]);
      }
      setStatus('');
    } catch (nextError) {
      setError(nextError.message);
      setStatus('');
    }
  };

  const openSource = async (nextSource, options) => {
    rememberRecent(nextSource.path);
    setStatus('Loading…');
    try {
      await loadSvg(await fetchSource(nextSource.url), nextSource, options);
    } catch (nextError) {
      setError(nextError.message);
      setStatus('');
    }
  };

  const openFile = async (file) => {
    if (!file) return;
    await loadSvg(await file.text(), { name: file.name });
  };

  const openJob = async (job) => {
    setError('');
    try {
      const full = await fetchJob(job.slug);
      if (full.source?.url) {
        await openSource(full.source, { saved: full });
      } else {
        setSource(full.source);
        setLayers([]);
        setJobName(full.name);
        show(await send({ job: full, type: 'openJob' }), true);
      }
      setTab('preview');
    } catch (nextError) {
      setError(nextError.message);
    }
  };

  useEffect(() => {
    refreshSources();
    refreshJobs();
    loadPens()
      .then(setPens)
      .catch(() => {})
      .finally(() => setPensLoaded(true));
    const params = new URLSearchParams(window.location.search);
    if (params.get('svg')) {
      openSource({
        name: params.get('name') ?? params.get('svg').split('/').pop(),
        props: params.get('props'),
        tool: params.get('tool'),
        url: params.get('svg'),
      });
    } else if (params.get('job')) {
      openJob({ slug: params.get('job') });
    }
  }, []);

  useEffect(() => {
    if (!pensLoaded) return undefined;
    const timer = setTimeout(
      () => savePens(pens).catch((nextError) => setError(nextError.message)),
      PENS_SAVE_DEBOUNCE_MS
    );
    return () => clearTimeout(timer);
  }, [pens, pensLoaded]);

  useEffect(() => {
    if (!layers.length || readOnly) return undefined;
    const timer = setTimeout(async () => {
      latestBuild.current += 1;
      const build = latestBuild.current;
      setStatus('Optimising…');
      try {
        const result = await send({ settings, type: 'build' });
        if (build !== latestBuild.current) return;
        show(result, false);
        setStatus('');
      } catch (nextError) {
        if (build !== latestBuild.current) return;
        setError(nextError.message);
        setStatus('');
      }
    }, BUILD_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [layers, readOnly, send, settings]);

  const save = async () => {
    const name = jobName.trim() || defaultName(source);
    const slug = slugOf(name);
    if (!slug) return;
    setStatus('Saving…');
    setError('');
    try {
      const { json } = await send({
        meta: { name, settings, source },
        type: 'serialize',
      });
      await saveJob(slug, json);
      await refreshJobs();
      setStatus(`Saved ${name}`);
    } catch (nextError) {
      setError(nextError.message);
      setStatus('');
    }
  };

  const rerenderAtSize = async () => {
    const assigned = new Set(Object.values(assign));
    const used = pens.filter((pen) => assigned.has(pen.id));
    const nibMm = Math.min(...used.map((pen) => pen.nibMm), 1) || 0.3;
    setError('');
    setRerendering(true);
    setStatus(`Re-rendering on ${source.tool}…`);
    try {
      const next = await rerender({
        nibMm,
        onProgress: (job) =>
          setStatus(
            `Re-rendering on ${source.tool}… ${Math.round(job.progress ?? 0)}%`
          ),
        source,
        widthMm: summary.placement.widthMm,
      });
      await openSource(next, { keep: true });
      refreshSources();
    } catch (nextError) {
      setError(nextError.message);
      setStatus('');
    } finally {
      setRerendering(false);
    }
  };

  const cutters = new Set(knockout ?? defaultKnockout(pens));
  const toggleCutter = (id) =>
    setKnockout(
      cutters.has(id)
        ? [...cutters].filter((other) => other !== id)
        : [...cutters, id]
    );

  const removeJob = async (job) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Delete the saved job "${job.name}"?`)) return;
    await deleteJob(job.slug).catch((nextError) => setError(nextError.message));
    refreshJobs();
  };

  const movePass = (index, delta) => {
    const ids = summary.passes.map((pass) => pass.pen.id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    setOrder(ids);
  };

  const inUse = useMemo(() => new Set(Object.values(assign)), [assign]);
  const totals = summary?.passes.reduce(
    (sum, pass) => ({
      inkMm: sum.inkMm + pass.stats.inkMm,
      lifts: sum.lifts + pass.stats.lifts,
      seconds: sum.seconds + pass.stats.seconds,
      travelMm: sum.travelMm + pass.stats.travelMm,
    }),
    { inkMm: 0, lifts: 0, seconds: 0, travelMm: 0 }
  );
  const placed = summary?.placement;
  const studioColors = useMemo(
    () => passColors(summary?.passes.map((pass) => pass.pen.color) ?? []),
    [summary]
  );

  const controls = (
    <form
      className="dev-panel rw-controls"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <fieldset className="rw-fieldset">
        <legend>Source</legend>
        {source ? (
          <div className="pz-current">
            {source.path ? (
              <img alt="" src={thumbUrl(source.path, 160)} />
            ) : null}
            <div>
              <strong>{source.title ?? source.name}</strong>
              <span className="dev-muted">
                {[
                  source.slug,
                  ...(source.style ?? []),
                  source.widthMm && `${Math.round(source.widthMm)} mm`,
                  source.layers && `${source.layers} layers`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </div>
          </div>
        ) : (
          <p className="dev-muted">No plot open.</p>
        )}
        <div className="pz-row">
          <button
            className="dev-button dev-button--primary"
            onClick={() => {
              setPickerOpen(true);
              refreshSources();
            }}
            type="button"
          >
            <FiGrid /> Choose plot…
          </button>
          <label className="dev-button pz-file" htmlFor="pz-file">
            <FiImage /> Open SVG file…
            <input
              accept=".svg,image/svg+xml"
              id="pz-file"
              onChange={(event) => openFile(event.target.files?.[0])}
              type="file"
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="rw-fieldset rw-control-section">
        <legend>Paper</legend>
        <div className="rw-field-grid">
          <label className="rw-field" htmlFor="pz-paper">
            Size
            <select
              id="pz-paper"
              onChange={(event) => setPaperId(event.target.value)}
              value={paperId}
            >
              {PAPERS.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
          <label className="rw-field" htmlFor="pz-paper-color">
            Colour
            <select
              id="pz-paper-color"
              onChange={(event) => setPaperColor(event.target.value)}
              value={paperColor}
            >
              {PAPER_COLORS.map((entry) => (
                <option key={entry.color} value={entry.color}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
          <label className="rw-field" htmlFor="pz-margin">
            Margin (mm)
            <input
              id="pz-margin"
              min="0"
              onChange={(event) => setMarginMm(event.target.value)}
              type="number"
              value={marginMm}
            />
          </label>
          <label className="rw-field" htmlFor="pz-width">
            Plot width (mm)
            <input
              id="pz-width"
              min="1"
              onChange={(event) => setPlotWidthMm(event.target.value)}
              placeholder="fit"
              type="number"
              value={plotWidthMm}
            />
          </label>
          <label className="rw-field rw-field--checkbox" htmlFor="pz-portrait">
            <input
              checked={portrait}
              id="pz-portrait"
              onChange={(event) => setPortrait(event.target.checked)}
              type="checkbox"
            />
            Portrait
          </label>
        </div>
        {placed ? (
          <p className={placed.overflows ? 'pz-warning' : 'dev-muted'}>
            Plot {placed.widthMm.toFixed(0)} × {placed.heightMm.toFixed(0)} mm
            at {percent(placed.scale)} of the source
            {placed.overflows ? ' — larger than the paper' : ''}
          </p>
        ) : null}
        {placed &&
        sourceSize &&
        !readOnly &&
        Math.abs(placed.scale - 1) > RESIZE_TOLERANCE ? (
          <div className="pz-resize">
            <p className="dev-muted">
              Drawn for {sourceSize.widthMm.toFixed(0)} mm wide.{' '}
              {source?.props && source?.tool
                ? `Re-render it at ${placed.widthMm.toFixed(0)} mm so its spacing is laid out for this size instead of shrunk.`
                : 'It has no props.json beside it, so it can only be scaled.'}
            </p>
            {source?.props && source?.tool ? (
              <button
                className="dev-button"
                disabled={rerendering}
                onClick={rerenderAtSize}
                type="button"
              >
                <FiMaximize /> Re-render at {placed.widthMm.toFixed(0)} mm
              </button>
            ) : null}
          </div>
        ) : null}
      </fieldset>

      <fieldset className="rw-fieldset rw-control-section">
        <legend>Layers → pens</legend>
        {layers.length > 1 ? (
          <div className="pz-row pz-budget">
            <label htmlFor="pz-budget">
              Fit to
              <select
                id="pz-budget"
                onChange={(event) => setPenBudget(Number(event.target.value))}
                value={penBudget}
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              pens
            </label>
            <button
              className="dev-button"
              onClick={() =>
                setAssign(fitPens(layers, pens, penBudget, paperColor))
              }
              title="Choose the pens from your list that best match the layers' colours, weighted by ink, and map every layer to the nearest"
              type="button"
            >
              Assign
            </button>
          </div>
        ) : null}
        {layers.length ? (
          <ul className="pz-layers">
            {layers.map((layer) => (
              <li key={layer.id}>
                <span className="pz-layer__name" title={layer.id}>
                  {layer.id}
                </span>
                <span className="dev-muted">
                  {layer.runs.toLocaleString()} paths · {metres(layer.inkMm)}
                  {summary?.layerCrowding[layer.id] != null ? (
                    <span
                      className={
                        summary.layerCrowding[layer.id] > CROWDED_WARNING
                          ? 'pz-warning'
                          : ''
                      }
                    >
                      {' '}
                      · {percent(summary.layerCrowding[layer.id])} crowded
                    </span>
                  ) : null}
                </span>
                <select
                  aria-label={`Pen for ${layer.id}`}
                  onChange={(event) =>
                    setAssign((current) => ({
                      ...current,
                      [layer.id]: event.target.value,
                    }))
                  }
                  value={assign[layer.id] ?? ''}
                >
                  <option value="">— skip —</option>
                  {pens.map((pen) => (
                    <option key={pen.id} value={pen.id}>
                      {pen.name}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        ) : (
          <p className="dev-muted">
            {readOnly
              ? 'Saved job without its source: preview only.'
              : 'Pick a source.'}
          </p>
        )}
      </fieldset>

      <details className="rw-control-section rw-advanced">
        <summary>Pens ({pens.length})</summary>
        <PensEditor inUse={inUse} onChange={setPens} pens={pens} />
      </details>

      <fieldset className="rw-fieldset rw-control-section">
        <legend>Plot</legend>
        <div className="rw-field-grid">
          <label className="rw-field" htmlFor="pz-min-length">
            Drop strokes under (mm)
            <input
              id="pz-min-length"
              min="0"
              onChange={(event) => setMinLengthMm(event.target.value)}
              step="0.1"
              type="number"
              value={minLengthMm}
            />
          </label>
          <label
            className="rw-field rw-field--checkbox"
            htmlFor="pz-registration"
          >
            <input
              checked={registration}
              id="pz-registration"
              onChange={(event) => setRegistration(event.target.checked)}
              type="checkbox"
            />
            Registration tick
          </label>
        </div>
      </fieldset>

      <fieldset className="rw-fieldset rw-control-section">
        <legend>Save job</legend>
        <label className="rw-field rw-field--wide" htmlFor="pz-name">
          Name
          <input
            id="pz-name"
            onChange={(event) => setJobName(event.target.value)}
            value={jobName}
          />
        </label>
        <button
          className="dev-button dev-button--primary rw-submit"
          disabled={!summary || readOnly}
          type="submit"
        >
          <FiSave /> Save job + DXFs
        </button>
      </fieldset>
    </form>
  );

  const preview = (
    <>
      <div className="pz-view">
        <label htmlFor="pz-travel">
          <input
            checked={view.showTravel}
            id="pz-travel"
            onChange={(event) =>
              setView((current) => ({
                ...current,
                showTravel: event.target.checked,
              }))
            }
            type="checkbox"
          />
          Travel
        </label>
        <label htmlFor="pz-crowding">
          <input
            checked={view.showCrowding}
            id="pz-crowding"
            onChange={(event) =>
              setView((current) => ({
                ...current,
                showCrowding: event.target.checked,
              }))
            }
            type="checkbox"
          />
          Crowding
        </label>
        <select
          aria-label="Show pass"
          onChange={(event) =>
            setView((current) => ({
              ...current,
              solo:
                event.target.value === '' ? null : Number(event.target.value),
            }))
          }
          value={view.solo ?? ''}
        >
          <option value="">All passes</option>
          {summary?.passes.map((pass, i) => (
            <option key={pass.pen.id} value={i}>
              Pass {i + 1}: {pass.pen.name}
            </option>
          ))}
        </select>
        <span className="dev-muted">
          Scroll to zoom, drag to pan, double-click to fit
        </span>
      </div>
      <PlotPreview dataRef={dataRef} options={view} version={version} />
      {summary ? (
        <table className="pz-passes">
          <thead>
            <tr>
              <th>Pass</th>
              <th>Pen</th>
              <th title="The Line Color row this pass gets in Silhouette Studio">
                In Studio
              </th>
              <th>Lifts</th>
              <th>Ink</th>
              <th>Travel</th>
              <th>Time</th>
              <th title="Ink in strokes closer together than the nib">
                Crowded
              </th>
              {readOnly ? null : (
                <th title="Lighter passes stop a nib short of this pass's lines">
                  Cuts lighter
                </th>
              )}
              {readOnly ? null : <th>Order</th>}
            </tr>
          </thead>
          <tbody>
            {summary.passes.map((pass, i) => (
              <tr key={pass.pen.id}>
                <td>{i + 1}</td>
                <td>
                  <i
                    className="pz-dot"
                    style={{ background: pass.pen.color }}
                  />
                  {pass.pen.name}
                  <span className="dev-muted">
                    {' '}
                    · {pass.layers.length} layers
                  </span>
                </td>
                <td>
                  <i
                    className="pz-dot"
                    style={{ background: aciColor(studioColors[i]) }}
                    title={`ACI ${studioColors[i]}`}
                  />
                  <span className="dev-muted">ACI {studioColors[i]}</span>
                </td>
                <td>{pass.stats.lifts.toLocaleString()}</td>
                <td>{metres(pass.stats.inkMm)}</td>
                <td>{metres(pass.stats.travelMm)}</td>
                <td>{duration(pass.stats.seconds)}</td>
                <td
                  className={pass.crowded > CROWDED_WARNING ? 'pz-warning' : ''}
                >
                  {percent(pass.crowded)}
                </td>
                {readOnly ? null : (
                  <td>
                    <input
                      aria-label={`Lighter passes stop short of ${pass.pen.name}`}
                      checked={cutters.has(pass.pen.id)}
                      onChange={() => toggleCutter(pass.pen.id)}
                      type="checkbox"
                    />
                  </td>
                )}
                {readOnly ? null : (
                  <td className="pz-order">
                    <button
                      aria-label="Earlier"
                      className="dev-button"
                      disabled={i === 0}
                      onClick={() => movePass(i, -1)}
                      type="button"
                    >
                      <FiArrowUp />
                    </button>
                    <button
                      aria-label="Later"
                      className="dev-button"
                      disabled={i === summary.passes.length - 1}
                      onClick={() => movePass(i, 1)}
                      type="button"
                    >
                      <FiArrowDown />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}>Total</td>
              <td>{totals.lifts.toLocaleString()}</td>
              <td>{metres(totals.inkMm)}</td>
              <td>{metres(totals.travelMm)}</td>
              <td>{duration(totals.seconds)}</td>
              <td colSpan={readOnly ? 1 : 3}>
                {percent(
                  summary.passes.reduce(
                    (sum, pass) => sum + pass.crowded * pass.stats.inkMm,
                    0
                  ) / (totals.inkMm || 1)
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      ) : null}
      {summary?.passes.some((pass) => pass.crowded > CROWDED_WARNING) ? (
        <p className="pz-warning">
          Some passes have strokes closer together than their nib: at this size
          they will merge into solid ink. Plot larger, or re-render the source
          at this plot width.
        </p>
      ) : null}
    </>
  );

  return (
    <main className="dev-page rw-page pz-page">
      <DevPageHeaderBar eyebrow="" title="Plotterizer" />
      <div className="rw-toolbar">
        <p title={sourceTitle(source)}>{sourceTitle(source)}</p>
        <div className="rw-toolbar__status">
          {error ? <span className="pz-error">{error}</span> : null}
          <span>{status}</span>
        </div>
      </div>
      {pickerOpen ? (
        <SourcePicker
          loading={sourcesLoading}
          onClose={() => setPickerOpen(false)}
          onPick={(entry) => {
            setPickerOpen(false);
            openSource(entrySource(entry));
          }}
          sources={sources}
        />
      ) : null}
      <WorkbenchLayout
        controls={controls}
        results={
          <section className="rw-results">
            <div className="rw-results__tabs" role="tablist">
              <button
                aria-selected={tab === 'preview'}
                onClick={() => setTab('preview')}
                role="tab"
                type="button"
              >
                <FiImage /> <span>Preview</span>
              </button>
              <button
                aria-selected={tab === 'jobs'}
                onClick={() => setTab('jobs')}
                role="tab"
                type="button"
              >
                <FiFolder /> <span>Saved jobs</span>
                <strong>{jobs.length}</strong>
              </button>
              <button
                aria-selected={tab === 'plotter'}
                onClick={() => {
                  refreshJobs();
                  setTab('plotter');
                }}
                role="tab"
                type="button"
              >
                <FiPenTool /> <span>Plotter</span>
              </button>
            </div>
            {tab === 'preview' ? preview : null}
            {tab === 'jobs' ? (
              <JobsList jobs={jobs} onDelete={removeJob} onOpen={openJob} />
            ) : null}
            {tab === 'plotter' ? (
              <PlotterPanel jobs={jobs} paper={paper} />
            ) : null}
          </section>
        }
      />
    </main>
  );
}
