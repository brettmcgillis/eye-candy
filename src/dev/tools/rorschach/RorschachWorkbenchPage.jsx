import React, { useCallback, useMemo, useState } from 'react';
import {
  FiFilm,
  FiGrid,
  FiImage,
  FiList,
  FiRefreshCw,
  FiSave,
  FiSquare,
} from 'react-icons/fi';

import { RENDER_OPTIONS, defaultsFor } from '@modules/rorschach';

import DevPageHeaderBar from '../../shell/DevPageHeaderBar';
import './RorschachWorkbenchPage.css';
import AssetGallery from './components/AssetGallery';
import ClassicPatternBackground from './components/ClassicPatternBackground';
import ClassicPatternSettings, {
  DEFAULT_CLASSIC_PATTERN_SETTINGS,
} from './components/ClassicPatternSettings';
import JobStatus from './components/JobStatus';
import useRorschachJobs from './hooks/useRorschachJobs';
import { countMediaItems } from './utils/assetGroups';

const PROFILES = {
  post: { height: 1350, label: 'Post', width: 1080 },
  reel: { height: 1920, label: 'Reel', width: 1080 },
  square: { height: 1080, label: 'Square', width: 1080 },
  story: { height: 1920, label: 'Story', width: 1080 },
};
const PROFILE_OPTIONS = Object.entries(PROFILES).map(([value, item]) => ({
  icon: <FiSquare />,
  label: item.label,
  value,
}));
const OUTPUT_OPTIONS = [
  { icon: <FiImage />, label: 'Stills', value: 'still' },
  { icon: <FiFilm />, label: 'Video', value: 'video' },
];
const GROWTH_PRESENTATION_OPTIONS = [
  { icon: <FiGrid />, label: 'Four-up', value: 'grid' },
  { icon: <FiList />, label: 'Sequential', value: 'sequential' },
];

// Both kinds' defaults merged, so toggling Stills/Video keeps whatever the
// other kind's fields were set to. Every value and every range below comes
// from the kernel's option schema — the workbench cannot offer a knob the CLI
// doesn't have, or a range the dev server would reject.
const INITIAL_OPTIONS = {
  ...defaultsFor('still', 'workbench'),
  ...defaultsFor('video', 'workbench'),
};

function Segmented({ label, onChange, options, value }) {
  return (
    <fieldset className="rw-fieldset">
      <legend>{label}</legend>
      <div className="rw-segmented">
        {options.map((option) => (
          <button
            aria-label={option.label}
            aria-pressed={value === option.value}
            className="rw-segmented__button"
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function NumberField({ id, label, onChange, option, value }) {
  const spec = RENDER_OPTIONS[option];
  return (
    <label className="rw-field" htmlFor={id}>
      {label}
      <input
        id={id}
        max={spec.max}
        min={spec.min}
        onChange={(event) => onChange(event.target.value)}
        step={spec.step}
        type="number"
        value={value ?? ''}
      />
    </label>
  );
}

export default function RorschachWorkbenchPage() {
  const {
    cancel,
    error,
    jobs,
    keepAsset,
    loading,
    refresh,
    remove,
    removeAssets,
    removeMany,
    removeSavedAssets,
    savedCollections,
    submit,
  } = useRorschachJobs();
  const [deletingId, setDeletingId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [kind, setKind] = useState('still');
  const [options, setOptions] = useState(INITIAL_OPTIONS);
  const [patternSettings, setPatternSettings] = useState(
    DEFAULT_CLASSIC_PATTERN_SETTINGS
  );
  const [patternSettingsOpen, setPatternSettingsOpen] = useState(false);
  const [profile, setProfile] = useState('post');
  const [resultsTab, setResultsTab] = useState('transient');
  const [submitting, setSubmitting] = useState(false);

  const activeCount = useMemo(
    () =>
      jobs.filter((job) =>
        ['queued', 'running', 'cancelling'].includes(job.status)
      ).length,
    [jobs]
  );
  const workbenchJobs = useMemo(
    () => jobs.filter((job) => job.source === 'workbench'),
    [jobs]
  );
  const savedAssetCount = countMediaItems(savedCollections);
  const transientAssetCount = countMediaItems(jobs);

  function setOption(key, value) {
    setOptions((current) => ({ ...current, [key]: value }));
  }

  const selectProfile = useCallback((nextProfile) => {
    const dimensions = PROFILES[nextProfile];
    setProfile(nextProfile);
    setOptions((current) => ({
      ...current,
      height: dimensions.height,
      ig: nextProfile === 'square' ? 'none' : nextProfile,
      width: dimensions.width,
    }));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await submit({ kind, options });
    } finally {
      setSubmitting(false);
    }
  }

  function handleQueueClick(event) {
    const button = event.target.closest('[data-cancel-job]');
    if (button) cancel(button.dataset.cancelJob);
  }

  const confirmDelete = useCallback(
    async (job) => {
      setDeletingId(job.id);
      try {
        await remove(job.id, job.outputDirectory);
        setPendingDeleteId(null);
      } finally {
        setDeletingId(null);
      }
    },
    [remove]
  );

  const cancelDelete = useCallback(() => {
    setPendingDeleteId(null);
  }, []);

  const openPatternSettings = useCallback(() => {
    setPatternSettingsOpen(true);
  }, []);

  const closePatternSettings = useCallback(() => {
    setPatternSettingsOpen(false);
  }, []);

  const resetPatternSettings = useCallback(() => {
    setPatternSettings({ ...DEFAULT_CLASSIC_PATTERN_SETTINGS });
  }, []);

  const changePatternSetting = useCallback((key, value) => {
    setPatternSettings((current) => ({ ...current, [key]: value }));
  }, []);

  return (
    <main className="dev-page rw-page">
      <ClassicPatternBackground settings={patternSettings} />
      <DevPageHeaderBar
        eyebrow=""
        icon="rorschach.webp"
        iconButtonLabel="Open Rorschach background settings"
        onIconClick={openPatternSettings}
        title="RorschachCLI"
      />

      {patternSettingsOpen ? (
        <ClassicPatternSettings
          onChange={changePatternSetting}
          onClose={closePatternSettings}
          onReset={resetPatternSettings}
          settings={patternSettings}
        />
      ) : null}

      <div className="rw-toolbar">
        <p />
        <div className="rw-toolbar__status">
          <span>{activeCount} active</span>
          <button className="dev-button" onClick={refresh} type="button">
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </div>

      <div className="rw-layout">
        <form className="dev-panel rw-controls" onSubmit={handleSubmit}>
          <Segmented
            label="Output"
            onChange={setKind}
            options={OUTPUT_OPTIONS}
            value={kind}
          />

          <Segmented
            label="Format"
            onChange={selectProfile}
            options={PROFILE_OPTIONS}
            value={profile}
          />

          <section className="rw-control-section">
            <h2>Frame</h2>
            <div className="rw-field-grid">
              <NumberField
                id="rw-width"
                option="width"
                label="Width"
                onChange={(value) => setOption('width', value)}
                value={options.width}
              />
              <NumberField
                id="rw-height"
                option="height"
                label="Height"
                onChange={(value) => setOption('height', value)}
                value={options.height}
              />
              <NumberField
                id="rw-seed"
                option="seed"
                label="Seed"
                onChange={(value) => setOption('seed', value)}
                value={options.seed}
              />
              <label className="rw-field" htmlFor="rw-renderer">
                Renderer
                <select
                  id="rw-renderer"
                  onChange={(event) =>
                    setOption('renderer', event.target.value)
                  }
                  value={options.renderer}
                >
                  <option value="gpu">WebGPU</option>
                  <option value="svg">SVG fallback</option>
                </select>
              </label>
            </div>
          </section>

          <section className="rw-control-section">
            <h2>{kind === 'still' ? 'Batch' : 'Motion'}</h2>
            <div className="rw-field-grid">
              {kind === 'still' ? (
                <>
                  <NumberField
                    id="rw-count"
                    option="count"
                    label="Count"
                    onChange={(value) => setOption('count', value)}
                    value={options.count}
                  />
                  <label className="rw-field rw-field--wide" htmlFor="rw-views">
                    Views
                    <select
                      id="rw-views"
                      onChange={(event) =>
                        setOption('views', event.target.value)
                      }
                      value={options.views}
                    >
                      <option value="front,back,top,bottom">All views</option>
                      <option value="front">Front</option>
                      <option value="back">Back</option>
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </label>
                </>
              ) : (
                <>
                  <label className="rw-field rw-field--wide" htmlFor="rw-mode">
                    Mode
                    <select
                      id="rw-mode"
                      onChange={(event) =>
                        setOption('mode', event.target.value)
                      }
                      value={options.mode}
                    >
                      <option value="stills">Stills montage</option>
                      <option value="growth">Growth</option>
                      <option value="turntable">Turntable</option>
                      <option value="cinematic">Cinematic</option>
                    </select>
                  </label>
                  <NumberField
                    id="rw-fps"
                    option="fps"
                    label="FPS"
                    onChange={(value) => setOption('fps', value)}
                    value={options.fps}
                  />
                  <NumberField
                    id="rw-hold"
                    option="hold"
                    label="Seconds"
                    onChange={(value) => setOption('hold', value)}
                    value={options.hold}
                  />
                  {options.mode === 'stills' ? (
                    <>
                      <NumberField
                        id="rw-shots"
                        option="count"
                        label="Shots"
                        onChange={(value) => setOption('count', value)}
                        value={options.count}
                      />
                      <NumberField
                        id="rw-crossfade"
                        option="crossfade"
                        label="Crossfade"
                        onChange={(value) => setOption('crossfade', value)}
                        value={options.crossfade}
                      />
                      <label
                        className="rw-field rw-field--wide"
                        htmlFor="rw-view"
                      >
                        View
                        <select
                          id="rw-view"
                          onChange={(event) =>
                            setOption('view', event.target.value)
                          }
                          value={options.view}
                        >
                          <option value="front">Front</option>
                          <option value="back">Back</option>
                          <option value="top">Top</option>
                          <option value="bottom">Bottom</option>
                        </select>
                      </label>
                      <label className="rw-field" htmlFor="rw-image-format">
                        Source format
                        <select
                          id="rw-image-format"
                          onChange={(event) =>
                            setOption('imageFormat', event.target.value)
                          }
                          value={options.imageFormat}
                        >
                          <option value="png">PNG</option>
                          <option value="webp">WebP</option>
                        </select>
                      </label>
                      <label
                        className="rw-field rw-field--checkbox"
                        htmlFor="rw-keep-images"
                      >
                        <input
                          checked={options.keepImages}
                          id="rw-keep-images"
                          onChange={(event) =>
                            setOption('keepImages', event.target.checked)
                          }
                          type="checkbox"
                        />
                        Keep source images
                      </label>
                    </>
                  ) : null}
                  {options.mode === 'growth' ? (
                    <>
                      <NumberField
                        id="rw-growth-count"
                        option="count"
                        label="Tests"
                        onChange={(value) => setOption('count', value)}
                        value={options.count}
                      />
                      <label
                        className="rw-field rw-field--wide"
                        htmlFor="rw-growth-view"
                      >
                        View
                        <select
                          id="rw-growth-view"
                          onChange={(event) =>
                            setOption('growthView', event.target.value)
                          }
                          value={options.growthView}
                        >
                          <option value="front">Front</option>
                          <option value="back">Back</option>
                          <option value="top">Top</option>
                          <option value="bottom">Bottom</option>
                          <option value="all">All</option>
                        </select>
                      </label>
                      {options.growthView === 'all' ? (
                        <Segmented
                          label="Presentation"
                          onChange={(value) =>
                            setOption('growthPresentation', value)
                          }
                          options={GROWTH_PRESENTATION_OPTIONS}
                          value={options.growthPresentation}
                        />
                      ) : null}
                      <label className="rw-field" htmlFor="rw-growth-format">
                        Source format
                        <select
                          id="rw-growth-format"
                          onChange={(event) =>
                            setOption('imageFormat', event.target.value)
                          }
                          value={options.imageFormat}
                        >
                          <option value="png">PNG</option>
                          <option value="webp">WebP</option>
                        </select>
                      </label>
                      <label
                        className="rw-field rw-field--checkbox"
                        htmlFor="rw-growth-keep-images"
                      >
                        <input
                          checked={options.keepImages}
                          id="rw-growth-keep-images"
                          onChange={(event) =>
                            setOption('keepImages', event.target.checked)
                          }
                          type="checkbox"
                        />
                        Keep final images
                      </label>
                    </>
                  ) : null}
                  {options.mode === 'turntable' ? (
                    <NumberField
                      id="rw-turns"
                      option="turns"
                      label="Turns"
                      onChange={(value) => setOption('turns', value)}
                      value={options.turns}
                    />
                  ) : null}
                  {options.mode === 'cinematic' ? (
                    <NumberField
                      id="rw-systems"
                      option="systems"
                      label="Systems"
                      onChange={(value) => setOption('systems', value)}
                      value={options.systems}
                    />
                  ) : null}
                </>
              )}
            </div>
          </section>

          <details className="rw-control-section rw-advanced">
            <summary>Composition</summary>
            <div className="rw-field-grid">
              <NumberField
                id="rw-distance"
                option="distance"
                label="Distance"
                onChange={(value) => setOption('distance', value)}
                value={options.distance}
              />
              <NumberField
                id="rw-fov"
                option="fov"
                label="FOV"
                onChange={(value) => setOption('fov', value)}
                value={options.fov}
              />
              {kind === 'still' || options.mode !== 'cinematic' ? (
                <NumberField
                  id="rw-flatten"
                  option="flatten"
                  label="Flatten"
                  onChange={(value) => setOption('flatten', value)}
                  value={options.flatten}
                />
              ) : null}
              <label className="rw-field" htmlFor="rw-flatten-axis">
                Flatten axis
                <select
                  id="rw-flatten-axis"
                  onChange={(event) =>
                    setOption('flattenAxis', event.target.value)
                  }
                  value={options.flattenAxis}
                >
                  <option value="z">Z</option>
                  <option value="y">Y</option>
                </select>
              </label>
              {options.bloom ? (
                <>
                  <NumberField
                    id="rw-bloom-strength"
                    option="bloomStrength"
                    label="Bloom strength"
                    onChange={(value) => setOption('bloomStrength', value)}
                    value={options.bloomStrength}
                  />
                  <NumberField
                    id="rw-bloom-radius"
                    option="bloomRadius"
                    label="Bloom radius"
                    onChange={(value) => setOption('bloomRadius', value)}
                    value={options.bloomRadius}
                  />
                  <NumberField
                    id="rw-bloom-threshold"
                    option="bloomThreshold"
                    label="Bloom threshold"
                    onChange={(value) => setOption('bloomThreshold', value)}
                    value={options.bloomThreshold}
                  />
                </>
              ) : null}
            </div>
          </details>

          <section className="rw-toggles">
            <label htmlFor="rw-lines">
              <input
                checked={options.lines}
                id="rw-lines"
                onChange={(event) => setOption('lines', event.target.checked)}
                type="checkbox"
              />
              Lines
            </label>
            <label htmlFor="rw-ink">
              <input
                checked={options.ink}
                id="rw-ink"
                onChange={(event) => setOption('ink', event.target.checked)}
                type="checkbox"
              />
              Ink
            </label>
          </section>

          {options.ink ? (
            <details className="rw-control-section rw-advanced" open>
              <summary>Watercolour</summary>
              <div className="rw-field-grid">
                <label className="rw-field" htmlFor="rw-ink-deposition">
                  Deposition
                  <select
                    id="rw-ink-deposition"
                    onChange={(event) =>
                      setOption('inkDeposition', event.target.value)
                    }
                    value={options.inkDeposition}
                  >
                    <option value="brush">Brush</option>
                    <option value="stamp">Stamp</option>
                    <option value="wash">Wash</option>
                  </select>
                </label>
                <label className="rw-field" htmlFor="rw-ink-orientation">
                  Paper plane
                  <select
                    id="rw-ink-orientation"
                    onChange={(event) =>
                      setOption('inkOrientation', event.target.value)
                    }
                    value={options.inkOrientation}
                  >
                    <option value="vertical">Vertical (z)</option>
                    <option value="horizontal">Horizontal (y)</option>
                  </select>
                </label>
                <NumberField
                  id="rw-ink-brush"
                  option="inkBrushSize"
                  label="Brush size"
                  onChange={(value) => setOption('inkBrushSize', value)}
                  value={options.inkBrushSize}
                />
                <NumberField
                  id="rw-ink-strength"
                  option="inkStrength"
                  label="Pigment"
                  onChange={(value) => setOption('inkStrength', value)}
                  value={options.inkStrength}
                />
                <NumberField
                  id="rw-ink-settle"
                  option="inkSettle"
                  label="Settle steps"
                  onChange={(value) => setOption('inkSettle', value)}
                  value={options.inkSettle}
                />
                <NumberField
                  id="rw-ink-resolution"
                  option="inkResolution"
                  label="Sim resolution"
                  onChange={(value) => setOption('inkResolution', value)}
                  value={options.inkResolution}
                />
                <NumberField
                  id="rw-ink-paper-size"
                  option="inkPaperSize"
                  label="Paper size"
                  onChange={(value) => setOption('inkPaperSize', value)}
                  value={options.inkPaperSize}
                />
                <NumberField
                  id="rw-ink-offset"
                  option="inkOffset"
                  label="Paper offset"
                  onChange={(value) => setOption('inkOffset', value)}
                  value={options.inkOffset}
                />
                <NumberField
                  id="rw-ink-grain"
                  option="inkPaperGrain"
                  label="Paper tooth"
                  onChange={(value) => setOption('inkPaperGrain', value)}
                  value={options.inkPaperGrain}
                />
                <label className="rw-field" htmlFor="rw-ink-paper-color">
                  Paper colour
                  <input
                    id="rw-ink-paper-color"
                    onChange={(event) =>
                      setOption('inkPaperColor', event.target.value)
                    }
                    type="color"
                    value={options.inkPaperColor}
                  />
                </label>
                <label htmlFor="rw-ink-show-paper">
                  <input
                    checked={options.inkShowPaper}
                    id="rw-ink-show-paper"
                    onChange={(event) =>
                      setOption('inkShowPaper', event.target.checked)
                    }
                    type="checkbox"
                  />
                  Show sheet
                </label>
              </div>
            </details>
          ) : null}

          <section className="rw-toggles">
            <label htmlFor="rw-bloom">
              <input
                checked={options.bloom}
                id="rw-bloom"
                onChange={(event) => setOption('bloom', event.target.checked)}
                type="checkbox"
              />
              Bloom
            </label>
            <label htmlFor="rw-overlay">
              <input
                checked={options.overlay}
                id="rw-overlay"
                onChange={(event) => setOption('overlay', event.target.checked)}
                type="checkbox"
              />
              Overlay
            </label>
          </section>

          {kind === 'still' ? (
            <fieldset className="rw-fieldset rw-formats">
              <legend>Image files</legend>
              <label htmlFor="rw-png">
                <input
                  checked={options.png}
                  disabled={options.png && !options.svg && !options.webp}
                  id="rw-png"
                  onChange={(event) => setOption('png', event.target.checked)}
                  type="checkbox"
                />
                PNG
              </label>
              <label htmlFor="rw-svg">
                <input
                  checked={options.svg}
                  disabled={options.svg && !options.png && !options.webp}
                  id="rw-svg"
                  onChange={(event) => setOption('svg', event.target.checked)}
                  type="checkbox"
                />
                SVG
              </label>
              <label htmlFor="rw-webp">
                <input
                  checked={options.webp}
                  disabled={options.webp && !options.png && !options.svg}
                  id="rw-webp"
                  onChange={(event) => setOption('webp', event.target.checked)}
                  type="checkbox"
                />
                WebP
              </label>
            </fieldset>
          ) : null}

          <button
            className="dev-button dev-button--primary rw-submit"
            disabled={submitting}
            type="submit"
          >
            {kind === 'still' ? <FiImage /> : <FiFilm />}
            {submitting
              ? 'Submitting...'
              : `Render ${kind === 'still' ? 'stills' : 'video'}`}
          </button>
          {error ? <p className="rw-error">{error}</p> : null}
        </form>

        <section className="rw-results">
          <div
            aria-label="Workbench results"
            className="rw-results__tabs"
            role="tablist"
          >
            <button
              aria-controls="rw-panel-saved"
              aria-selected={resultsTab === 'saved'}
              onClick={() => setResultsTab('saved')}
              role="tab"
              type="button"
            >
              <FiSave />
              <span>Saved</span>
              <strong>{savedAssetCount}</strong>
            </button>
            <button
              aria-controls="rw-panel-transient"
              aria-selected={resultsTab === 'transient'}
              onClick={() => setResultsTab('transient')}
              role="tab"
              type="button"
            >
              <FiImage />
              <span>Transient</span>
              <strong>{transientAssetCount}</strong>
            </button>
            <button
              aria-controls="rw-panel-jobs"
              aria-selected={resultsTab === 'jobs'}
              onClick={() => setResultsTab('jobs')}
              role="tab"
              type="button"
            >
              <FiList />
              <span>Jobs</span>
              <strong>{workbenchJobs.length}</strong>
            </button>
          </div>
          {resultsTab === 'saved' ? (
            <div id="rw-panel-saved" role="tabpanel">
              <AssetGallery
                emptyMessage="Kept images appear here."
                jobs={savedCollections}
                onRemoveAssets={removeSavedAssets}
                variant="saved"
              />
            </div>
          ) : null}
          {resultsTab === 'transient' ? (
            <div id="rw-panel-transient" role="tabpanel">
              <AssetGallery
                deletingId={deletingId}
                jobs={jobs}
                onCancelDelete={cancelDelete}
                onConfirmDelete={confirmDelete}
                onKeepAsset={keepAsset}
                onRemoveAssets={removeAssets}
                onRemoveMany={removeMany}
                onRequestDelete={setPendingDeleteId}
                pendingDeleteId={pendingDeleteId}
              />
            </div>
          ) : null}
          {resultsTab === 'jobs' ? (
            <div id="rw-panel-jobs" role="tabpanel">
              <div
                className="rw-queue"
                onClick={handleQueueClick}
                role="presentation"
              >
                {loading ? (
                  <div className="rw-empty">Loading queue...</div>
                ) : null}
                {!loading && workbenchJobs.length === 0 ? (
                  <div className="rw-empty">
                    No render jobs in this server session.
                  </div>
                ) : null}
                {workbenchJobs.map((job) => (
                  <JobStatus job={job} key={job.id} />
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
