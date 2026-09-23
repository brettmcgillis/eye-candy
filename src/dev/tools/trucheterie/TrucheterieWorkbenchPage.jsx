import React, { useCallback, useMemo, useState } from 'react';
import { FiFilm, FiImage, FiRefreshCw, FiX } from 'react-icons/fi';

import ResultsPanel, {
  activeJobCount,
} from '@dev/renderWorkbench/ResultsPanel';
import {
  SchemaField,
  SchemaProvider,
  Segmented,
} from '@dev/renderWorkbench/SchemaFields';
import WorkbenchLayout from '@dev/renderWorkbench/WorkbenchLayout';
import '@dev/renderWorkbench/renderWorkbench.css';
import usePins from '@dev/renderWorkbench/usePins';
import useRenderJobs from '@dev/renderWorkbench/useRenderJobs';

import {
  PALETTE_NONE,
  RENDER_OPTIONS,
  configFrom,
  defaultsFor,
  facets,
  keysInFacet,
  optionsFromConfig,
  sectionsFor,
} from '@modules/trucheterieBlob';
import { PALETTE_NAMES } from '@utils/gradientPalette';

import DevPageHeaderBar from '../../shell/DevPageHeaderBar';
import './TrucheterieWorkbenchPage.css';
import PreviewDetails from './components/PreviewDetails';

const FACETS = facets();
const INITIAL_OPTIONS = {
  ...defaultsFor('still', 'workbench'),
  ...defaultsFor('video', 'workbench'),
};
const PALETTE_CHOICES = [PALETTE_NONE, ...PALETTE_NAMES].map((name) => [
  name,
  name,
]);
const KIND_OPTIONS = [
  { icon: <FiImage />, label: 'Stills', value: 'still' },
  { icon: <FiFilm />, label: 'Video', value: 'video' },
];
const MODE_OPTIONS = RENDER_OPTIONS.mode.choices.map((mode) => ({
  label: mode,
  value: mode,
}));
const HANDLED = new Set([
  'count',
  'fps',
  'growSeconds',
  'height',
  'hold',
  'margin',
  'mode',
  'paletteDrift',
  'png',
  'svg',
  'transparentBackground',
  'webp',
  'width',
]);
const RENDER_KEYS = new Set(
  Object.keys(RENDER_OPTIONS).filter((key) => !RENDER_OPTIONS[key].scene)
);

function rollSummary({ base, count, held }) {
  const total = Number(count);
  const items = `${total} field${total === 1 ? '' : 's'}`;
  const rolled = FACETS.filter((facet) => !held.includes(facet));
  const from = base ? ` from ${base}` : '';
  if (held.length === 0) return `Rolling everything — ${items}.`;
  if (rolled.length === 0) {
    return `Holding every facet${from} — ${items} at new seeds.`;
  }
  return `Holding ${held.join(' and ')}${from} — ${items}, rolling ${rolled.join(' and ')}.`;
}

function jobTitle(job) {
  return job.kind === 'video'
    ? `Field ${job.options?.mode ?? ''} video`
    : 'Field stills';
}

export default function TrucheterieWorkbenchPage() {
  const jobsApi = useRenderJobs('trucheterie');
  const { error, jobs, refresh, submit } = jobsApi;
  const [kind, setKind] = useState('still');
  const [options, setOptions] = useState(INITIAL_OPTIONS);
  const [base, setBase] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const pins = usePins({ facets: FACETS, keysInFacet, specs: RENDER_OPTIONS });

  const setOption = useCallback(
    (key, value) => setOptions((current) => ({ ...current, [key]: value })),
    []
  );

  // A generation's config fills the form; what to hold is the next decision.
  const useAsBase = useCallback((config, render) => {
    const flat = optionsFromConfig(configFrom(config));
    const renderKeys = Object.fromEntries(
      Object.entries(render ?? {}).filter(
        ([key, value]) => RENDER_KEYS.has(key) && value != null
      )
    );
    setOptions((current) => ({ ...current, ...renderKeys, ...flat }));
    setBase(config.blobSeed);
  }, []);

  const summary = useMemo(
    () => rollSummary({ base, count: options.count, held: pins.heldFacets }),
    [base, options.count, pins.heldFacets]
  );

  const sections = useMemo(
    () =>
      sectionsFor(kind, 'workbench')
        .map((section) => ({
          ...section,
          keys: section.keys.filter((key) => !HANDLED.has(key)),
        }))
        .filter((section) => section.keys.length > 0),
    [kind]
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
    (detail) => <PreviewDetails onUseAsBase={useAsBase} {...detail} />,
    [useAsBase]
  );

  return (
    <SchemaProvider value={pins.context}>
      <main className="dev-page rw-page tw-page">
        <DevPageHeaderBar eyebrow="" title="TrucheterieCLI" />

        <div className="rw-toolbar">
          <p>Blob Field variation only, for now.</p>
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
              <Segmented
                label="Output"
                onChange={setKind}
                options={KIND_OPTIONS}
                value={kind}
              />
              {kind === 'video' ? (
                <Segmented
                  label="Mode"
                  onChange={(value) => setOption('mode', value)}
                  options={MODE_OPTIONS}
                  value={options.mode}
                />
              ) : null}

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
                    Nothing is held, so every field is random. Open one you like
                    and press <strong>Roll variations</strong>, then hold the
                    facets to keep.
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
                {['count', 'width', 'height'].map((key) => (
                  <SchemaField
                    key={key}
                    onChange={(value) => setOption(key, value)}
                    option={key}
                    value={options[key]}
                  />
                ))}
              </div>

              {kind === 'still' ? (
                <fieldset className="rw-fieldset rw-formats">
                  <legend>Image files</legend>
                  {['png', 'webp', 'svg'].map((format) => (
                    <label htmlFor={`tw-${format}`} key={format}>
                      <input
                        checked={Boolean(options[format])}
                        disabled={
                          options[format] &&
                          !['png', 'webp', 'svg'].some(
                            (other) => other !== format && options[other]
                          )
                        }
                        id={`tw-${format}`}
                        onChange={(event) =>
                          setOption(format, event.target.checked)
                        }
                        type="checkbox"
                      />
                      {format.toUpperCase()}
                    </label>
                  ))}
                  <label htmlFor="tw-transparent">
                    <input
                      checked={Boolean(options.transparentBackground)}
                      id="tw-transparent"
                      onChange={(event) =>
                        setOption('transparentBackground', event.target.checked)
                      }
                      type="checkbox"
                    />
                    Transparent
                  </label>
                </fieldset>
              ) : (
                <div className="rw-field-grid">
                  {[
                    'fps',
                    'hold',
                    ...(options.mode === 'growth'
                      ? ['growSeconds', 'paletteDrift']
                      : []),
                  ].map((key) => (
                    <SchemaField
                      key={key}
                      onChange={(value) => setOption(key, value)}
                      option={key}
                      value={options[key]}
                    />
                  ))}
                </div>
              )}

              {sections.map((section) => (
                <details
                  className="rw-control-section rw-advanced"
                  key={section.id}
                >
                  <summary>{section.label}</summary>
                  <div className="rw-field-grid">
                    {section.keys.map((key) => (
                      <SchemaField
                        choices={
                          key === 'blobPalette' ? PALETTE_CHOICES : undefined
                        }
                        key={key}
                        onChange={(value) => setOption(key, value)}
                        option={key}
                        value={options[key]}
                      />
                    ))}
                  </div>
                </details>
              ))}

              <button
                className="dev-button dev-button--primary rw-submit"
                disabled={submitting}
                type="submit"
              >
                {kind === 'still' ? <FiImage /> : <FiFilm />}
                {submitting
                  ? 'Submitting...'
                  : `Render field ${kind === 'still' ? 'stills' : 'video'}`}
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
              collectionTitle={jobTitle}
              jobTitle={jobTitle}
              jobsApi={jobsApi}
              renderDetails={renderDetails}
              selectionActions={() => null}
            />
          }
        />
      </main>
    </SchemaProvider>
  );
}
