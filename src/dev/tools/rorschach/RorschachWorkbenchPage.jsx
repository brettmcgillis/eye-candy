import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  FiFilm,
  FiGrid,
  FiImage,
  FiList,
  FiRefreshCw,
  FiSave,
  FiSquare,
} from 'react-icons/fi';

import { PALETTE_NAMES, RENDER_OPTIONS, defaultsFor } from '@modules/rorschach';

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
const PALETTE_CHOICES = PALETTE_NAMES.map((name) => [name, name]);

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

// Which rollable fields the user has taken control of. Everything the dice can
// set starts disabled at its default: the page shows the whole parameter space,
// and enabling a field is what turns it into a pin. That is the same rule the
// CLI applies to a typed flag, so "I chose this" means one thing everywhere.
//
// Carried on context rather than threaded through forty call sites — every
// field already names its option, which is all the wrapper needs.
const PinContext = createContext({ pins: new Set(), toggle: () => {} });

function usePin(option) {
  const { pins, toggle } = useContext(PinContext);
  const rollable = Boolean(RENDER_OPTIONS[option]?.facet);
  return {
    // A field the dice never touch is always live — there is nothing to pin it
    // against.
    enabled: !rollable || pins.has(option),
    onToggle: () => toggle(option),
    rollable,
  };
}

// Wraps a control in its enable checkbox when the parameter is rollable, and
// renders it untouched when it is not.
function Pinnable({ children, label, option }) {
  const { enabled, onToggle, rollable } = usePin(option);
  if (!rollable) return children;

  return (
    <div className={`rw-pinnable${enabled ? ' rw-pinnable--on' : ''}`}>
      <label className="rw-pin" htmlFor={`rw-pin-${option}`}>
        <input
          aria-label={`Pin ${label}`}
          checked={enabled}
          id={`rw-pin-${option}`}
          onChange={onToggle}
          type="checkbox"
        />
      </label>
      {children}
    </div>
  );
}

// A spec with `choices` is a fixed set, not a range, so it gets a picker rather
// than a spinner — typing 700 into a box that only accepts powers of two is a
// 400 from the dev server for no reason. Driven off the schema, so any option
// that grows a choice list picks this up without touching the workbench.
function NumberField({ id, label, onChange, option, value }) {
  const spec = RENDER_OPTIONS[option];
  const { enabled } = usePin(option);

  const control = spec.choices ? (
    <label className="rw-field" htmlFor={id}>
      {label}
      <select
        disabled={!enabled}
        id={id}
        onChange={(event) => onChange(Number(event.target.value))}
        value={value ?? spec.default}
      >
        {spec.choices.map((choice) => (
          <option key={choice} value={choice}>
            {choice}
          </option>
        ))}
      </select>
    </label>
  ) : (
    <label className="rw-field" htmlFor={id}>
      {label}
      <input
        disabled={!enabled}
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

  return (
    <Pinnable label={label} option={option}>
      {control}
    </Pinnable>
  );
}

// The same treatment for the two shapes NumberField does not cover.
function ChoiceField({ choices, id, label, onChange, option, value }) {
  const { enabled } = usePin(option);
  return (
    <Pinnable label={label} option={option}>
      <label className="rw-field" htmlFor={id}>
        {label}
        <select
          disabled={!enabled}
          id={id}
          onChange={(event) => onChange(event.target.value)}
          value={value}
        >
          {choices.map(([choiceValue, choiceLabel]) => (
            <option key={choiceValue} value={choiceValue}>
              {choiceLabel}
            </option>
          ))}
        </select>
      </label>
    </Pinnable>
  );
}

function ToggleField({ id, label, onChange, option, value }) {
  const { enabled } = usePin(option);
  return (
    <Pinnable label={label} option={option}>
      <label className="rw-field rw-field--toggle" htmlFor={id}>
        {label}
        <input
          checked={Boolean(value)}
          disabled={!enabled}
          id={id}
          onChange={(event) => onChange(event.target.checked)}
          type="checkbox"
        />
      </label>
    </Pinnable>
  );
}

function ColorField({ id, label, onChange, option, value }) {
  const { enabled } = usePin(option);
  return (
    <Pinnable label={label} option={option}>
      <label className="rw-field" htmlFor={id}>
        {label}
        <input
          disabled={!enabled}
          id={id}
          onChange={(event) => onChange(event.target.value)}
          type="color"
          value={value}
        />
      </label>
    </Pinnable>
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
  const [pins, setPins] = useState(() => new Set());
  const pinContext = useMemo(
    () => ({
      pins,
      toggle: (option) =>
        setPins((current) => {
          const next = new Set(current);
          if (next.has(option)) next.delete(option);
          else next.add(option);
          return next;
        }),
    }),
    [pins]
  );

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
      // Send the render settings in full, but only the rollable parameters the
      // user actually enabled. The server forwards exactly what it is sent, and
      // the CLI reads a forwarded flag as a pin — so an unchecked field is left
      // to the dice rather than silently pinned at whatever the form happens to
      // be showing.
      const chosen = Object.fromEntries(
        Object.entries(options).filter(
          ([key]) => !RENDER_OPTIONS[key]?.facet || pins.has(key)
        )
      );
      await submit({ kind, options: chosen });
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
    <PinContext.Provider value={pinContext}>
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
                    <label
                      className="rw-field rw-field--wide"
                      htmlFor="rw-views"
                    >
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
                    <label
                      className="rw-field rw-field--wide"
                      htmlFor="rw-mode"
                    >
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
                        <option value="breathe">Breathe</option>
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
                    {options.mode === 'breathe' ? (
                      <label className="rw-field" htmlFor="rw-breathe-view">
                        View
                        <select
                          id="rw-breathe-view"
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
                  <>
                    <label htmlFor="rw-flatten-enabled">
                      <input
                        checked={options.flattenEnabled}
                        id="rw-flatten-enabled"
                        onChange={(event) =>
                          setOption('flattenEnabled', event.target.checked)
                        }
                        type="checkbox"
                      />
                      Flatten (2D)
                    </label>
                    <NumberField
                      id="rw-flatten"
                      option="flatten"
                      label="Flatten amount"
                      onChange={(value) => setOption('flatten', value)}
                      value={options.flatten}
                    />
                  </>
                ) : null}
                <NumberField
                  id="rw-stroke"
                  option="stroke"
                  label="Stroke"
                  onChange={(value) => setOption('stroke', value)}
                  value={options.stroke}
                />
                <NumberField
                  id="rw-simplify"
                  option="simplify"
                  label="Simplify"
                  onChange={(value) => setOption('simplify', value)}
                  value={options.simplify}
                />
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
                </div>

                <h3 className="rw-subheading">Bloom</h3>
                <div className="rw-field-grid">
                  <label htmlFor="rw-ink-bloom">
                    <input
                      checked={options.inkBloom}
                      id="rw-ink-bloom"
                      onChange={(event) =>
                        setOption('inkBloom', event.target.checked)
                      }
                      type="checkbox"
                    />
                    Ink bloom
                  </label>
                  <label htmlFor="rw-ink-bloom-emissive">
                    <input
                      checked={options.inkBloomEmissiveOnly}
                      id="rw-ink-bloom-emissive"
                      onChange={(event) =>
                        setOption('inkBloomEmissiveOnly', event.target.checked)
                      }
                      type="checkbox"
                    />
                    Emissive bundles only
                  </label>
                  <NumberField
                    id="rw-ink-bloom-strength"
                    option="inkBloomStrength"
                    label="Strength"
                    onChange={(value) => setOption('inkBloomStrength', value)}
                    value={options.inkBloomStrength}
                  />
                  <label className="rw-field" htmlFor="rw-ink-bloom-source">
                    Source
                    <select
                      id="rw-ink-bloom-source"
                      onChange={(event) =>
                        setOption('inkBloomSource', event.target.value)
                      }
                      value={options.inkBloomSource}
                    >
                      <option value="thickness">Thickness</option>
                      <option value="wetness">Wetness</option>
                    </select>
                  </label>
                </div>

                <h3 className="rw-subheading">Pattern</h3>
                <div className="rw-field-grid">
                  <NumberField
                    id="rw-ink-pattern-wash"
                    option="inkPatternWash"
                    label="Wash"
                    onChange={(value) => setOption('inkPatternWash', value)}
                    value={options.inkPatternWash}
                  />
                  <NumberField
                    id="rw-ink-pattern-flow"
                    option="inkPatternFlow"
                    label="Flow"
                    onChange={(value) => setOption('inkPatternFlow', value)}
                    value={options.inkPatternFlow}
                  />
                  <NumberField
                    id="rw-ink-pattern-fade"
                    option="inkPatternFade"
                    label="Fade"
                    onChange={(value) => setOption('inkPatternFade', value)}
                    value={options.inkPatternFade}
                  />
                  <NumberField
                    id="rw-ink-pattern-density"
                    option="inkPatternDensity"
                    label="Density"
                    onChange={(value) => setOption('inkPatternDensity', value)}
                    value={options.inkPatternDensity}
                  />
                  <NumberField
                    id="rw-ink-pattern-sharpness"
                    option="inkPatternSharpness"
                    label="Sharpness"
                    onChange={(value) =>
                      setOption('inkPatternSharpness', value)
                    }
                    value={options.inkPatternSharpness}
                  />
                  <NumberField
                    id="rw-ink-pattern-softness"
                    option="inkPatternSoftness"
                    label="Softness"
                    onChange={(value) => setOption('inkPatternSoftness', value)}
                    value={options.inkPatternSoftness}
                  />
                  <NumberField
                    id="rw-ink-pattern-scale"
                    option="inkPatternScale"
                    label="Scale"
                    onChange={(value) => setOption('inkPatternScale', value)}
                    value={options.inkPatternScale}
                  />
                  <NumberField
                    id="rw-ink-pattern-details"
                    option="inkPatternDetails"
                    label="Details"
                    onChange={(value) => setOption('inkPatternDetails', value)}
                    value={options.inkPatternDetails}
                  />
                  <NumberField
                    id="rw-ink-pattern-symmetry"
                    option="inkPatternSymmetry"
                    label="Symmetry"
                    onChange={(value) => setOption('inkPatternSymmetry', value)}
                    value={options.inkPatternSymmetry}
                  />
                  <NumberField
                    id="rw-ink-pattern-speed"
                    option="inkPatternSpeed"
                    label="Speed"
                    onChange={(value) => setOption('inkPatternSpeed', value)}
                    value={options.inkPatternSpeed}
                  />
                  <NumberField
                    id="rw-ink-pattern-time"
                    option="inkPatternTime"
                    label="Time"
                    onChange={(value) => setOption('inkPatternTime', value)}
                    value={options.inkPatternTime}
                  />
                </div>

                <h3 className="rw-subheading">Palette</h3>
                <div className="rw-field-grid">
                  <NumberField
                    id="rw-ink-palette-mix"
                    option="inkPaletteMix"
                    label="Spread"
                    onChange={(value) => setOption('inkPaletteMix', value)}
                    value={options.inkPaletteMix}
                  />
                  <NumberField
                    id="rw-ink-palette-scale"
                    option="inkPaletteScale"
                    label="Region size"
                    onChange={(value) => setOption('inkPaletteScale', value)}
                    value={options.inkPaletteScale}
                  />
                  <NumberField
                    id="rw-ink-palette-symmetry"
                    option="inkPaletteSymmetry"
                    label="Symmetry"
                    onChange={(value) => setOption('inkPaletteSymmetry', value)}
                    value={options.inkPaletteSymmetry}
                  />
                </div>

                <h3 className="rw-subheading">Cell pixelation</h3>
                <div className="rw-field-grid">
                  <NumberField
                    id="rw-ink-cell-amount"
                    option="inkCellAmount"
                    label="Pixelation"
                    onChange={(value) => setOption('inkCellAmount', value)}
                    value={options.inkCellAmount}
                  />
                  <NumberField
                    id="rw-ink-cell-reveal"
                    option="inkCellReveal"
                    label="Reveal"
                    onChange={(value) => setOption('inkCellReveal', value)}
                    value={options.inkCellReveal}
                  />
                  <NumberField
                    id="rw-ink-cell-flatten"
                    option="inkCellFlatten"
                    label="Flatten"
                    onChange={(value) => setOption('inkCellFlatten', value)}
                    value={options.inkCellFlatten}
                  />
                  <NumberField
                    id="rw-ink-cell-scale"
                    option="inkCellScale"
                    label="Cell size"
                    onChange={(value) => setOption('inkCellScale', value)}
                    value={options.inkCellScale}
                  />
                  <NumberField
                    id="rw-ink-cell-reveal-scale"
                    option="inkCellRevealScale"
                    label="Reveal scale"
                    onChange={(value) => setOption('inkCellRevealScale', value)}
                    value={options.inkCellRevealScale}
                  />
                  <NumberField
                    id="rw-ink-cell-symmetry"
                    option="inkCellSymmetry"
                    label="Cell symmetry"
                    onChange={(value) => setOption('inkCellSymmetry', value)}
                    value={options.inkCellSymmetry}
                  />
                </div>
              </details>
            ) : null}

            <details className="rw-control-section rw-advanced">
              <summary>Test</summary>
              <p className="rw-hint">
                Every field here is something the dice set. Enable one to take
                it over — it becomes a pin, and the rest keep rolling. Leave
                them all off for a batch of pure rolls.
              </p>

              <h3 className="rw-subheading">Structure</h3>
              <div className="rw-field-grid">
                <NumberField
                  id="rw-bundle-count"
                  option="bundleCount"
                  label="Bundles"
                  onChange={(value) => setOption('bundleCount', value)}
                  value={options.bundleCount}
                />
                <NumberField
                  id="rw-strands"
                  option="strandsPerBundle"
                  label="Strands / bundle"
                  onChange={(value) => setOption('strandsPerBundle', value)}
                  value={options.strandsPerBundle}
                />
                <NumberField
                  id="rw-steps"
                  option="steps"
                  label="Curl length"
                  onChange={(value) => setOption('steps', value)}
                  value={options.steps}
                />
                <NumberField
                  id="rw-start-spread"
                  option="startSpread"
                  label="Strand spread"
                  onChange={(value) => setOption('startSpread', value)}
                  value={options.startSpread}
                />
                <NumberField
                  id="rw-coeff-range"
                  option="coeffRange"
                  label="Chaos"
                  onChange={(value) => setOption('coeffRange', value)}
                  value={options.coeffRange}
                />
                <NumberField
                  id="rw-freq"
                  option="freq"
                  label="Curl frequency"
                  onChange={(value) => setOption('freq', value)}
                  value={options.freq}
                />
                <ChoiceField
                  choices={[
                    ['cube', 'Cube'],
                    ['sphere', 'Sphere'],
                    ['none', 'None'],
                  ]}
                  id="rw-framing-shape"
                  option="framingShape"
                  label="Framing"
                  onChange={(value) => setOption('framingShape', value)}
                  value={options.framingShape}
                />
                <NumberField
                  id="rw-bound-radius"
                  option="boundRadius"
                  label="Bound radius"
                  onChange={(value) => setOption('boundRadius', value)}
                  value={options.boundRadius}
                />
                <NumberField
                  id="rw-bound-width"
                  option="boundWidth"
                  label="Bound width"
                  onChange={(value) => setOption('boundWidth', value)}
                  value={options.boundWidth}
                />
                <NumberField
                  id="rw-bound-height"
                  option="boundHeight"
                  label="Bound height"
                  onChange={(value) => setOption('boundHeight', value)}
                  value={options.boundHeight}
                />
                <NumberField
                  id="rw-min-spread"
                  option="minSpread"
                  label="Min spread"
                  onChange={(value) => setOption('minSpread', value)}
                  value={options.minSpread}
                />
              </div>

              <h3 className="rw-subheading">Palette</h3>
              <div className="rw-field-grid">
                <ChoiceField
                  choices={PALETTE_CHOICES}
                  id="rw-palette"
                  option="palette"
                  label="Palette"
                  onChange={(value) => setOption('palette', value)}
                  value={options.palette}
                />
                <ToggleField
                  id="rw-palette-exact"
                  option="paletteExact"
                  label="Exact stops"
                  onChange={(value) => setOption('paletteExact', value)}
                  value={options.paletteExact}
                />
                <ToggleField
                  id="rw-monochrome"
                  option="monochrome"
                  label="Monochrome"
                  onChange={(value) => setOption('monochrome', value)}
                  value={options.monochrome}
                />
                <ColorField
                  id="rw-line-color"
                  option="inkColor"
                  label="Line colour"
                  onChange={(value) => setOption('inkColor', value)}
                  value={options.inkColor}
                />
                <ColorField
                  id="rw-background-color"
                  option="backgroundColor"
                  label="Background"
                  onChange={(value) => setOption('backgroundColor', value)}
                  value={options.backgroundColor}
                />
              </div>
            </details>

            <details className="rw-control-section rw-advanced">
              <summary>Rolling</summary>
              <p className="rw-hint">
                Blank follows the main seed. Set one to hold that facet still
                while the others keep moving — the same structure through a
                hundred palettes, or one palette across a hundred blots.
              </p>
              <div className="rw-field-grid">
                <NumberField
                  id="rw-structure-seed"
                  option="structureSeed"
                  label="Structure seed"
                  onChange={(value) => setOption('structureSeed', value)}
                  value={options.structureSeed}
                />
                <NumberField
                  id="rw-palette-seed"
                  option="paletteSeed"
                  label="Palette seed"
                  onChange={(value) => setOption('paletteSeed', value)}
                  value={options.paletteSeed}
                />
                <NumberField
                  id="rw-ink-seed"
                  option="inkSeed"
                  label="Ink seed"
                  onChange={(value) => setOption('inkSeed', value)}
                  value={options.inkSeed}
                />
              </div>
            </details>

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
                  onChange={(event) =>
                    setOption('overlay', event.target.checked)
                  }
                  type="checkbox"
                />
                Overlay
              </label>
            </section>

            {/* Its own grid, not inside rw-toggles: that is a no-wrap flex row of
              checkboxes, and a label-over-input field dropped into it gets
              crushed to a few characters wide. */}
            {options.overlay ? (
              <div className="rw-field-grid">
                <label className="rw-field" htmlFor="rw-ig">
                  Safe area
                  <select
                    id="rw-ig"
                    onChange={(event) => setOption('ig', event.target.value)}
                    value={options.ig}
                  >
                    <option value="post">Post</option>
                    <option value="story">Story</option>
                    <option value="reel">Reel</option>
                    <option value="none">None</option>
                  </select>
                </label>
                <NumberField
                  id="rw-viewport"
                  option="viewport"
                  label="Viewport"
                  onChange={(value) => setOption('viewport', value)}
                  value={options.viewport ?? ''}
                />
              </div>
            ) : null}

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
                    onChange={(event) =>
                      setOption('webp', event.target.checked)
                    }
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
    </PinContext.Provider>
  );
}
