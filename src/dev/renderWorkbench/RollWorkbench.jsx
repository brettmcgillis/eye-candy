import React, { useCallback, useMemo, useState } from 'react';
import { FiFilm, FiImage, FiRefreshCw, FiSquare, FiX } from 'react-icons/fi';

import DevPageHeaderBar from '../shell/DevPageHeaderBar';
import ResultsPanel, { activeJobCount } from './ResultsPanel';
import RollPreviewDetails from './RollPreviewDetails';
import { SchemaField, SchemaProvider, Segmented } from './SchemaFields';
import SchemaSections from './SchemaSections';
import WorkbenchLayout from './WorkbenchLayout';
import './renderWorkbench.css';
import usePins from './usePins';
import useRenderJobs from './useRenderJobs';

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
const KIND_OPTIONS = [
  { icon: <FiImage />, label: 'Stills', value: 'still' },
  { icon: <FiFilm />, label: 'Video', value: 'video' },
];
const HEADER_FIELDS = ['count', 'width', 'height'];

function rollSummary({ base, count, facets, held, noun }) {
  const total = Number(count);
  const items = `${total} ${total === 1 ? noun.one : noun.many}`;
  const rolled = facets.filter((facet) => !held.includes(facet));
  const from = base ? ` from ${base}` : '';
  if (held.length === 0) return `Rolling everything — ${items}.`;
  if (rolled.length === 0) {
    return `Holding every facet${from} — ${items} at new seeds.`;
  }
  return `Holding ${held.join(' and ')}${from} — ${items}, rolling ${rolled.join(' and ')}.`;
}

const groupLabel = (config, label) => label;

// The page every facet-rolling generator shares; see docs/render-workbench.md.
export default function RollWorkbench({
  afterFields: AfterFields,
  baseLabel = groupLabel,
  controls: Controls,
  hint,
  jobTitle,
  kinds = ['still', 'video'],
  name,
  noun,
  preview,
  schema,
  sections,
  selectionActions,
  submitLabel,
  submitNoun,
  title,
  tool,
}) {
  const {
    RENDER_OPTIONS,
    configFrom,
    defaultsFor,
    facets,
    keysInFacet,
    optionsFromConfig,
  } = schema;
  const FACETS = useMemo(() => facets(), [facets]);
  const renderKeys = useMemo(
    () =>
      new Set(
        Object.keys(RENDER_OPTIONS).filter((key) => !RENDER_OPTIONS[key].scene)
      ),
    [RENDER_OPTIONS]
  );
  const modeOptions = useMemo(
    () =>
      RENDER_OPTIONS.mode?.choices.map((mode) => ({
        label: mode,
        value: mode,
      })),
    [RENDER_OPTIONS]
  );

  const jobsApi = useRenderJobs(tool);
  const { error, jobs, refresh, submit } = jobsApi;
  const [kind, setKind] = useState(kinds[0]);
  const [profile, setProfile] = useState('post');
  const [options, setOptions] = useState(() =>
    Object.assign({}, ...kinds.map((each) => defaultsFor(each, 'workbench')))
  );
  const [base, setBase] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const pins = usePins({ facets: FACETS, keysInFacet, specs: RENDER_OPTIONS });

  const setOption = useCallback(
    (key, value) => setOptions((current) => ({ ...current, [key]: value })),
    []
  );

  const selectProfile = useCallback((next) => {
    setProfile(next);
    setOptions((current) => ({
      ...current,
      height: PROFILES[next].height,
      width: PROFILES[next].width,
    }));
  }, []);

  // A generation's config fills the form; what to hold is the next decision.
  const useAsBase = useCallback(
    (config, render, label) => {
      const flat = optionsFromConfig(configFrom(config));
      const renderOptions = Object.fromEntries(
        Object.entries(render ?? {}).filter(
          ([key, value]) => renderKeys.has(key) && value != null
        )
      );
      setOptions((current) => ({ ...current, ...renderOptions, ...flat }));
      setBase(baseLabel(config, label));
    },
    [baseLabel, configFrom, optionsFromConfig, renderKeys]
  );

  const summary = useMemo(
    () =>
      rollSummary({
        base,
        count: options.count,
        facets: FACETS,
        held: pins.heldFacets,
        noun,
      }),
    [FACETS, base, noun, options.count, pins.heldFacets]
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setOutcome(null);
    try {
      await submit({ kind, options: pins.chosen(options) });
      setOutcome({ ok: true });
    } catch (failure) {
      setOutcome({ message: failure.message, ok: false });
    } finally {
      setSubmitting(false);
    }
  }

  const renderDetails = useCallback(
    (detail) => (
      <RollPreviewDetails
        onUseAsBase={useAsBase}
        tool={tool}
        {...preview}
        {...detail}
      />
    ),
    [preview, tool, useAsBase]
  );

  const titleOf = useCallback(
    (job) =>
      jobTitle?.(job) ??
      (job.kind === 'video'
        ? `${name} ${job.options?.mode ?? ''} video`
        : `${name} stills`),
    [jobTitle, name]
  );

  const context = { kind, options, pins, setOption, setOptions };
  const what = kind === 'still' ? 'stills' : 'video';

  return (
    <SchemaProvider value={pins.context}>
      <main className="dev-page rw-page">
        <DevPageHeaderBar eyebrow="" title={title} />

        <div className="rw-toolbar">
          <p />
          <div className="rw-toolbar__status">
            <span>{activeJobCount(jobs)} active</span>
            <button className="dev-button" onClick={refresh} type="button">
              <FiRefreshCw /> Refresh
            </button>
          </div>
        </div>

        <WorkbenchLayout
          controls={
            <form
              className="dev-panel rw-controls"
              noValidate
              onSubmit={handleSubmit}
            >
              {kinds.length > 1 ? (
                <Segmented
                  label="Output"
                  onChange={setKind}
                  options={KIND_OPTIONS.filter((item) =>
                    kinds.includes(item.value)
                  )}
                  value={kind}
                />
              ) : null}
              <Segmented
                label="Format"
                onChange={selectProfile}
                options={PROFILE_OPTIONS}
                value={profile}
              />
              {kind === 'video' && modeOptions ? (
                <Segmented
                  label="Mode"
                  onChange={(value) => setOption('mode', value)}
                  options={modeOptions}
                  value={options.mode}
                />
              ) : null}
              {Controls ? <Controls {...context} /> : null}

              <section className="rw-control-section">
                <h2>Roll</h2>
                <p className="rw-status">{summary}</p>
                {base ? (
                  <p className="rw-base">
                    Based on <strong>{base}</strong>
                    <button
                      className="rw-base__clear"
                      onClick={() => setBase(null)}
                      type="button"
                    >
                      <FiX /> clear
                    </button>
                  </p>
                ) : (
                  <p className="rw-hint">
                    Nothing is held, so every {noun.one} is random. Open one you
                    like and press <strong>Roll variations</strong>, then hold
                    the facets to keep{hint ? `: ${hint}` : '.'}
                  </p>
                )}
                <div className="rw-pin-groups">
                  {FACETS.map((facet) => (
                    <button
                      aria-pressed={pins.heldFacets.includes(facet)}
                      className="rw-pin-group"
                      key={facet}
                      onClick={() => pins.toggleFacet(facet)}
                      type="button"
                    >
                      Hold {facet}
                    </button>
                  ))}
                  {pins.pins.size > 0 ? (
                    <button
                      className="rw-pin-group"
                      onClick={pins.clear}
                      type="button"
                    >
                      Roll everything
                    </button>
                  ) : null}
                </div>
              </section>

              <div className="rw-field-grid">
                {HEADER_FIELDS.map((key) => (
                  <SchemaField
                    key={key}
                    onChange={(value) => setOption(key, value)}
                    option={key}
                    value={options[key]}
                  />
                ))}
              </div>
              {AfterFields ? <AfterFields {...context} /> : null}

              <SchemaSections
                kind={kind}
                options={options}
                schema={schema}
                setOption={setOption}
                {...sections}
              />

              <button
                className="dev-button dev-button--primary rw-submit"
                disabled={submitting}
                type="submit"
              >
                {kind === 'still' ? <FiImage /> : <FiFilm />}
                {submitting
                  ? 'Submitting...'
                  : (submitLabel ??
                    `Render ${submitNoun ? `${submitNoun} ` : ''}${what}`)}
              </button>
              {outcome?.ok === false ? (
                <p className="rw-error">Could not start: {outcome.message}</p>
              ) : null}
              {outcome?.ok ? (
                <p className="rw-submitted">
                  Started — jobs run one at a time; watch Jobs or Transient.
                </p>
              ) : null}
              {error ? <p className="rw-error">{error}</p> : null}
            </form>
          }
          results={
            <ResultsPanel
              collectionTitle={titleOf}
              jobTitle={titleOf}
              jobsApi={jobsApi}
              renderDetails={renderDetails}
              selectionActions={selectionActions}
            />
          }
        />
      </main>
    </SchemaProvider>
  );
}
