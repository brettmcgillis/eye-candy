import React, { useCallback, useMemo, useState } from 'react';
import {
  FiFilm,
  FiImage,
  FiPlusCircle,
  FiRefreshCw,
  FiSquare,
  FiX,
} from 'react-icons/fi';

import ResultsPanel, {
  activeJobCount,
} from '@dev/renderWorkbench/ResultsPanel';
import {
  SchemaField,
  SchemaProvider,
  Segmented,
} from '@dev/renderWorkbench/SchemaFields';
import '@dev/renderWorkbench/renderWorkbench.css';
import usePins from '@dev/renderWorkbench/usePins';
import useRenderJobs from '@dev/renderWorkbench/useRenderJobs';

import {
  RENDER_OPTIONS,
  configFrom,
  defaultsFor,
  facets,
  keysInFacet,
} from '@modules/flora';

import DevPageHeaderBar from '../../shell/DevPageHeaderBar';
import './FloraWorkbenchPage.css';
import BouquetTray from './components/BouquetTray';
import OptionSections from './components/OptionSections';
import PreviewDetails from './components/PreviewDetails';

const FACETS = facets();
const INITIAL_OPTIONS = {
  ...defaultsFor('still', 'workbench'),
  ...defaultsFor('video', 'workbench'),
};
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
const MODE_OPTIONS = RENDER_OPTIONS.mode.choices.map((mode) => ({
  label: mode,
  value: mode,
}));
const RENDER_KEYS = new Set(
  Object.keys(RENDER_OPTIONS).filter((key) => !RENDER_OPTIONS[key].scene)
);

function rollSummary({ base, bouquetCount, count, held, size }) {
  const total = Number(count);
  const noun = Number(size) > 0 || bouquetCount > 0 ? 'bouquet' : 'flower';
  const items = `${total} ${noun}${total === 1 ? '' : 's'}`;
  const rolled = FACETS.filter((facet) => !held.includes(facet));
  const from = base ? ` from ${base}` : '';
  if (held.length === 0) return `Rolling everything — ${items}.`;
  if (rolled.length === 0) {
    return `Holding every facet${from} — ${items} at new seeds.`;
  }
  return `Holding ${held.join(' and ')}${from} — ${items}, rolling ${rolled.join(' and ')}.`;
}

function jobTitle(job) {
  const bouquet = job.options?.bouquet?.length || job.options?.bouquetSize > 0;
  const what = bouquet ? 'Bouquet' : 'Flower';
  return job.kind === 'video'
    ? `${what} ${job.options?.mode ?? ''} video`
    : `${what} stills`;
}

export default function FloraWorkbenchPage() {
  const jobsApi = useRenderJobs('flora');
  const { error, jobs, refresh, submit } = jobsApi;
  const [kind, setKind] = useState('still');
  const [profile, setProfile] = useState('post');
  const [options, setOptions] = useState(INITIAL_OPTIONS);
  const [base, setBase] = useState(null);
  const [bouquet, setBouquet] = useState([]);
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
  const useAsBase = useCallback((config, render, label) => {
    const flat = configFrom(config);
    const renderKeys = Object.fromEntries(
      Object.entries(render ?? {}).filter(
        ([key, value]) => RENDER_KEYS.has(key) && value != null
      )
    );
    setOptions((current) => ({ ...current, ...renderKeys, ...flat }));
    setBase(label);
  }, []);

  const addToBouquet = useCallback((entries) => {
    setBouquet((current) => {
      const seen = new Set(current.map((entry) => entry.url));
      return [...current, ...entries.filter((entry) => !seen.has(entry.url))];
    });
  }, []);

  const summary = useMemo(
    () =>
      rollSummary({
        base,
        bouquetCount: bouquet.length,
        count: options.count,
        held: pins.heldFacets,
        size: options.bouquetSize,
      }),
    [base, bouquet.length, options.bouquetSize, options.count, pins.heldFacets]
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setOutcome(null);
    try {
      await submit({
        bouquet:
          bouquet.length > 0 ? bouquet.map((entry) => entry.url) : undefined,
        kind,
        options: pins.chosen(options),
      });
      setOutcome({ ok: true });
    } catch (failure) {
      setOutcome({ message: failure.message, ok: false });
    } finally {
      setSubmitting(false);
    }
  }

  const renderDetails = useCallback(
    (detail) => (
      <PreviewDetails
        onAddToBouquet={addToBouquet}
        onUseAsBase={useAsBase}
        {...detail}
      />
    ),
    [addToBouquet, useAsBase]
  );

  const selectionActions = useCallback(
    ({ clear, selected }) => {
      const entries = selected
        .filter(({ group }) => group.metadataAsset)
        .map(({ group }) => ({
          name: group.name,
          thumb: group.assets[0]?.url,
          url: group.metadataAsset.url,
        }));
      return (
        <button
          className="dev-button"
          disabled={entries.length === 0}
          onClick={() => {
            addToBouquet(entries);
            clear();
          }}
          type="button"
        >
          <FiPlusCircle /> Add {entries.length} to bouquet
        </button>
      );
    },
    [addToBouquet]
  );

  const bouquetMode = bouquet.length > 0 || Number(options.bouquetSize) > 0;

  return (
    <SchemaProvider value={pins.context}>
      <main className="dev-page rw-page fw-page">
        <DevPageHeaderBar eyebrow="" title="FloraCLI" />

        <div className="rw-toolbar">
          <p />
          <div className="rw-toolbar__status">
            <span>{activeJobCount(jobs)} active</span>
            <button className="dev-button" onClick={refresh} type="button">
              <FiRefreshCw /> Refresh
            </button>
          </div>
        </div>

        <div className="rw-layout">
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
            <Segmented
              label="Format"
              onChange={selectProfile}
              options={PROFILE_OPTIONS}
              value={profile}
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
                  Nothing is held, so every flower is random. Open one you like
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

            <BouquetTray
              entries={bouquet}
              onClear={() => setBouquet([])}
              onRemove={(url) =>
                setBouquet((current) =>
                  current.filter((entry) => entry.url !== url)
                )
              }
              options={options}
              setOption={setOption}
            />

            <OptionSections
              kind={kind}
              options={options}
              setOption={setOption}
            />

            <button
              className="dev-button dev-button--primary rw-submit"
              disabled={submitting}
              type="submit"
            >
              {kind === 'still' ? <FiImage /> : <FiFilm />}
              {submitting
                ? 'Submitting...'
                : `Render ${bouquetMode ? 'bouquet' : 'flower'} ${kind === 'still' ? 'stills' : 'video'}`}
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

          <ResultsPanel
            collectionTitle={jobTitle}
            jobTitle={jobTitle}
            jobsApi={jobsApi}
            renderDetails={renderDetails}
            selectionActions={selectionActions}
          />
        </div>
      </main>
    </SchemaProvider>
  );
}
